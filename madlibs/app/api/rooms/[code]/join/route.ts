import { NextResponse } from "next/server";
import { getRoom, updateRoom } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { code: string } }) {
  const { name } = (await req.json()) as { name: string };
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const room = await getRoom(params.code);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.phase !== "lobby") return NextResponse.json({ error: "Game already started" }, { status: 409 });
  if (room.players.length >= 12) return NextResponse.json({ error: "Room is full (12 max)" }, { status: 409 });
  if (room.players.some((p) => p.name.toLowerCase() === name.trim().toLowerCase())) {
    return NextResponse.json({ error: "Someone in the room already has that name" }, { status: 409 });
  }

  const id = crypto.randomUUID();
  const updated = await updateRoom(params.code, (r) => {
    r.players.push({ id, name: name.trim().slice(0, 40), joinedAt: Date.now() });
  });
  return NextResponse.json({ room: updated, you: { id, name: name.trim() } });
}
