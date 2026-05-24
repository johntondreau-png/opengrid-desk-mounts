import type { Room, SpiceLevel, Theme } from "./types";

// In-memory store. Works for local dev and a single Node process.
// For multi-instance production (e.g. Vercel serverless), swap this for
// Vercel KV / Upstash Redis. The interface below is intentionally small
// so the swap is mechanical.
//
// Pinned to globalThis so the Map survives Next.js dev-mode module reloads
// (each route otherwise gets its own evaluation of this module).
const globalForStore = globalThis as unknown as { _madlibsRooms?: Map<string, Room> };
const rooms: Map<string, Room> = globalForStore._madlibsRooms ?? new Map<string, Room>();
globalForStore._madlibsRooms = rooms;

const TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

function gc() {
  const cutoff = Date.now() - TTL_MS;
  for (const [code, room] of rooms) {
    if (room.createdAt < cutoff) rooms.delete(code);
  }
}

function newCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
  for (let attempt = 0; attempt < 50; attempt++) {
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    if (!rooms.has(code)) return code;
  }
  throw new Error("Could not allocate a room code");
}

export function createRoom(opts: {
  hostId: string;
  hostName: string;
  spice: SpiceLevel;
  theme: Theme;
}): Room {
  gc();
  const code = newCode();
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
  rooms.set(code, room);
  return room;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code.toUpperCase());
}

export function updateRoom(code: string, fn: (room: Room) => void): Room | undefined {
  const room = rooms.get(code.toUpperCase());
  if (!room) return undefined;
  fn(room);
  room.version += 1;
  return room;
}
