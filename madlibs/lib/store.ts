import { neon, neonConfig } from "@neondatabase/serverless";
import type { Room, SpiceLevel, Theme } from "./types";

// Use fetch-based HTTP transport (works in any runtime, no connection pool).
neonConfig.fetchConnectionCache = true;

const TTL_SECONDS = 60 * 60 * 6; // 6 hours

// ---------------------------------------------------------------------------
// Storage backends
// ---------------------------------------------------------------------------

interface Backend {
  get(code: string): Promise<Room | null>;
  set(code: string, room: Room): Promise<void>;
  reserveCode(generate: () => string): Promise<string>;
}

/**
 * In-memory backend for local dev when no DATABASE_URL is configured.
 * Pinned to globalThis so it survives Next.js dev-mode module reloads.
 */
function memoryBackend(): Backend {
  const g = globalThis as unknown as { _madlibsRooms?: Map<string, Room> };
  const rooms = g._madlibsRooms ?? new Map<string, Room>();
  g._madlibsRooms = rooms;

  return {
    async get(code) {
      gc(rooms);
      return rooms.get(code) ?? null;
    },
    async set(code, room) {
      rooms.set(code, room);
    },
    async reserveCode(generate) {
      for (let i = 0; i < 50; i++) {
        const code = generate();
        if (!rooms.has(code)) return code;
      }
      throw new Error("Could not allocate a room code");
    },
  };
}

function gc(rooms: Map<string, Room>) {
  const cutoff = Date.now() - TTL_SECONDS * 1000;
  for (const [code, room] of rooms) {
    if (room.createdAt < cutoff) rooms.delete(code);
  }
}

/**
 * Neon Postgres backend. Schema is created on first use (idempotent).
 */
function neonBackend(connectionString: string): Backend {
  const sql = neon(connectionString);

  let initialized: Promise<void> | null = null;
  function init(): Promise<void> {
    if (!initialized) {
      initialized = (async () => {
        await sql`
          CREATE TABLE IF NOT EXISTS madlibs_rooms (
            code TEXT PRIMARY KEY,
            data JSONB NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL
          )
        `;
        await sql`
          CREATE INDEX IF NOT EXISTS madlibs_rooms_expires_at_idx
          ON madlibs_rooms (expires_at)
        `;
      })().catch((err) => {
        // Allow retry on next call if init failed
        initialized = null;
        throw err;
      });
    }
    return initialized;
  }

  return {
    async get(code) {
      await init();
      const rows = (await sql`
        SELECT data FROM madlibs_rooms
        WHERE code = ${code} AND expires_at > now()
      `) as Array<{ data: Room }>;
      return rows[0]?.data ?? null;
    },
    async set(code, room) {
      await init();
      const expiresAt = new Date(Date.now() + TTL_SECONDS * 1000).toISOString();
      await sql`
        INSERT INTO madlibs_rooms (code, data, expires_at)
        VALUES (${code}, ${JSON.stringify(room)}::jsonb, ${expiresAt})
        ON CONFLICT (code) DO UPDATE
          SET data = EXCLUDED.data, expires_at = EXCLUDED.expires_at
      `;
    },
    async reserveCode(generate) {
      await init();
      for (let i = 0; i < 50; i++) {
        const code = generate();
        // Insert a placeholder row; if the code is already taken (PK conflict
        // OR an unexpired row exists), try again.
        const placeholder = { _reserved: true };
        const expiresAt = new Date(Date.now() + 30 * 1000).toISOString();
        const result = (await sql`
          INSERT INTO madlibs_rooms (code, data, expires_at)
          VALUES (${code}, ${JSON.stringify(placeholder)}::jsonb, ${expiresAt})
          ON CONFLICT (code) DO UPDATE
            SET data = EXCLUDED.data, expires_at = EXCLUDED.expires_at
            WHERE madlibs_rooms.expires_at <= now()
          RETURNING code
        `) as Array<{ code: string }>;
        if (result.length > 0) return code;
      }
      throw new Error("Could not allocate a room code");
    },
  };
}

let _backend: Backend | null = null;
function backend(): Backend {
  if (_backend) return _backend;
  // Vercel-Neon integration sets DATABASE_URL automatically; also accept
  // POSTGRES_URL (Vercel's generic alias) and NEON_DATABASE_URL.
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL;
  if (url) {
    _backend = neonBackend(url);
  } else {
    _backend = memoryBackend();
  }
  return _backend;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function newCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export async function createRoom(opts: {
  hostId: string;
  hostName: string;
  spice: SpiceLevel;
  theme: Theme;
}): Promise<Room> {
  const code = await backend().reserveCode(newCode);
  const room: Room = {
    code,
    hostId: opts.hostId,
    spice: opts.spice,
    theme: opts.theme,
    phase: "lobby",
    players: [
      { id: opts.hostId, name: opts.hostName, joinedAt: Date.now() },
    ],
    template: null,
    title: null,
    slots: [],
    submissions: [],
    story: null,
    remixes: [],
    createdAt: Date.now(),
    version: 1,
    error: null,
  };
  await backend().set(code, room);
  return room;
}

export async function getRoom(code: string): Promise<Room | undefined> {
  const normalized = code.toUpperCase();
  const room = await backend().get(normalized);
  if (!room || !room.code) return undefined; // skip reservation placeholders
  return room;
}

/**
 * Read–modify–write a room. NOT atomic across concurrent callers — the last
 * writer wins. For this app the collision window is small enough that the
 * worst-case symptom is one player needing to resubmit a word.
 */
export async function updateRoom(
  code: string,
  fn: (room: Room) => void,
): Promise<Room | undefined> {
  const normalized = code.toUpperCase();
  const room = await backend().get(normalized);
  if (!room || !room.code) return undefined;
  fn(room);
  room.version += 1;
  await backend().set(normalized, room);
  return room;
}
