import { NextResponse } from "next/server";
import { getRoom, updateRoom } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { code: string } }) {
  const { name } = (await req.json()) as { name: string };
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const trimmed = name.trim().slice(0, 40);

  const room = await getRoom(params.code);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  // If a player with this name is already in the room, treat the join as a
  // RESUME: hand back the existing identity instead of erroring. This makes
  // lost-session recovery trivial — same name → same identity. The 4-letter
  // room code is the access control; identity collisions inside a trusted
  // group are fine.
  const existing = room.players.find(
    (p) => p.name.toLowerCase() === trimmed.toLowerCase(),
  );
  if (existing) {
    return NextResponse.json({ room, you: { id: existing.id, name: existing.name } });
  }

  if (room.phase !== "lobby") return NextResponse.json({ error: "Game already started" }, { status: 409 });
  if (room.players.length >= 12) return NextResponse.json({ error: "Room is full (12 max)" }, { status: 409 });

  const id = crypto.randomUUID();
  const updated = await updateRoom(params.code, (r) => {
    r.players.push({ id, name: trimmed, joinedAt: Date.now() });
  });
  return NextResponse.json({ room: updated, you: { id, name: trimmed } });
}
