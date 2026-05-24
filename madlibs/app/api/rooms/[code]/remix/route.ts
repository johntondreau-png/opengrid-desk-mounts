import { NextResponse } from "next/server";
import { getRoom, updateRoom } from "@/lib/store";
import { remixStory } from "@/lib/claude";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request, { params }: { params: { code: string } }) {
  const { youId, twist } = (await req.json()) as { youId: string; twist: string };
  const room = getRoom(params.code);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.hostId !== youId) {
    return NextResponse.json({ error: "Only the host can remix" }, { status: 403 });
  }
  if (room.phase !== "story" || !room.story) {
    return NextResponse.json({ error: "No story to remix" }, { status: 409 });
  }
  if (!twist?.trim()) {
    return NextResponse.json({ error: "Twist required" }, { status: 400 });
  }

  updateRoom(params.code, (r) => {
    r.phase = "generating";
    r.error = null;
  });

  try {
    const remixed = await remixStory({
      spice: room.spice,
      theme: room.theme,
      story: room.story,
      twist: twist.trim().slice(0, 200),
      players: room.players,
      submissions: room.submissions,
    });
    const updated = updateRoom(params.code, (r) => {
      r.remixes.push(remixed);
      r.phase = "story";
    });
    return NextResponse.json({ room: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    updateRoom(params.code, (r) => {
      r.phase = "story";
      r.error = `Couldn't remix: ${msg}`;
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
