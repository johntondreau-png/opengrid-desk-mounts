import { NextResponse } from "next/server";
import { getRoom, updateRoom } from "@/lib/store";
import { generateTemplate } from "@/lib/claude";
import type { Slot } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request, { params }: { params: { code: string } }) {
  const { youId } = (await req.json()) as { youId: string };
  const room = getRoom(params.code);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.hostId !== youId) {
    return NextResponse.json({ error: "Only the host can start" }, { status: 403 });
  }
  if (room.phase !== "lobby") {
    return NextResponse.json({ error: "Game already started" }, { status: 409 });
  }
  if (room.players.length < 1) {
    return NextResponse.json({ error: "Need at least 1 player" }, { status: 400 });
  }

  // Aim for ~2-3 blanks per player, bounded.
  const numBlanks = Math.min(16, Math.max(6, room.players.length * 3));

  // Mark generating so other clients can show a spinner.
  updateRoom(params.code, (r) => {
    r.phase = "generating";
    r.error = null;
  });

  let template;
  try {
    template = await generateTemplate({
      spice: room.spice,
      theme: room.theme,
      numBlanks,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    updateRoom(params.code, (r) => {
      r.phase = "lobby";
      r.error = `Couldn't generate the story template: ${msg}`;
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // Distribute slots round-robin across players so everyone has roughly equal
  // submissions and adjacent blanks go to different people.
  const slots: Slot[] = template.slotPrompts.map((prompt, index) => ({
    index,
    prompt,
    assignedTo: room.players[index % room.players.length].id,
  }));

  const updated = updateRoom(params.code, (r) => {
    r.template = template.template;
    r.title = template.title;
    r.slots = slots;
    r.submissions = [];
    r.story = null;
    r.remixes = [];
    r.phase = "writing";
  });

  return NextResponse.json({ room: updated });
}
