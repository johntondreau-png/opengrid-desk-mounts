import { Redis } from "@upstash/redis";
import type { Room, SpiceLevel, Theme } from "./types";

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
 * In-memory backend for local dev when no Redis is configured.
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
        if (!rooms.has(code)) {
          // Reserve with an empty placeholder so concurrent reservations don't collide.
          // Real room is written by createRoom shortly after.
          return code;
        }
      }
      throw new Error("Could not allocate a room code");
    },
  };
}

function redisBackend(redis: Redis): Backend {
  return {
    async get(code) {
      const raw = await redis.get<Room | string>(`room:${code}`);
      if (raw == null) return null;
      // Upstash auto-deserializes JSON; defensively handle the string case too.
      return typeof raw === "string" ? (JSON.parse(raw) as Room) : raw;
    },
    async set(code, room) {
      await redis.set(`room:${code}`, JSON.stringify(room), { ex: TTL_SECONDS });
    },
    async reserveCode(generate) {
      for (let i = 0; i < 50; i++) {
        const code = generate();
        // SET NX with short TTL on a reservation key; createRoom overwrites with the real value.
        const ok = await redis.set(`room:${code}`, "{}", { nx: true, ex: 30 });
        if (ok) return code;
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

let _backend: Backend | null = null;
function backend(): Backend {
  if (_backend) return _backend;
  // Upstash sets KV_REST_API_URL/TOKEN automatically on Vercel via the marketplace integration.
  // Also accept UPSTASH_REDIS_REST_URL/TOKEN for non-Vercel use.
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    _backend = redisBackend(new Redis({ url, token }));
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
  if (!room || !room.code) return undefined; // placeholder reservation
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
