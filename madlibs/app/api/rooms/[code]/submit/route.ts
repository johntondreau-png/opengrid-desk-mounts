import { NextResponse } from "next/server";
import { getRoom, updateRoom } from "@/lib/store";
import { assembleStory } from "@/lib/claude";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request, { params }: { params: { code: string } }) {
  const { youId, slotIndex, word } = (await req.json()) as {
    youId: string;
    slotIndex: number;
    word: string;
  };

  const room = await getRoom(params.code);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.phase !== "writing") {
    return NextResponse.json({ error: "Not accepting submissions right now" }, { status: 409 });
  }

  const slot = room.slots.find((s) => s.index === slotIndex);
  if (!slot) return NextResponse.json({ error: "Slot not found" }, { status: 404 });
  if (slot.assignedTo !== youId) {
    return NextResponse.json({ error: "That blank isn't yours" }, { status: 403 });
  }
  const trimmed = word.trim().slice(0, 80);
  if (!trimmed) return NextResponse.json({ error: "Word required" }, { status: 400 });

  const afterSubmit = await updateRoom(params.code, (r) => {
    const existing = r.submissions.findIndex((s) => s.slotIndex === slotIndex);
    const entry = { slotIndex, playerId: youId, word: trimmed, submittedAt: Date.now() };
    if (existing >= 0) r.submissions[existing] = entry;
    else r.submissions.push(entry);
  });

  // If this submission filled the last blank, assemble the story inline.
  // The caller waits 10-30s; other players see "generating" via polling.
  if (afterSubmit && afterSubmit.submissions.length === afterSubmit.slots.length) {
    await updateRoom(params.code, (r) => {
      r.phase = "generating";
      r.error = null;
    });
    try {
      const story = await assembleStory({
        spice: afterSubmit.spice,
        theme: afterSubmit.theme,
        title: afterSubmit.title!,
        template: afterSubmit.template!,
        submissions: afterSubmit.submissions
          .slice()
          .sort((a, b) => a.slotIndex - b.slotIndex),
      });
      const final = await updateRoom(params.code, (r) => {
        r.story = story;
        r.phase = "story";
      });
      return NextResponse.json({ room: final });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      const reverted = await updateRoom(params.code, (r) => {
        r.phase = "writing";
        r.error = `Couldn't assemble the story: ${msg}`;
      });
      return NextResponse.json({ room: reverted, error: msg }, { status: 500 });
    }
  }

  return NextResponse.json({ room: afterSubmit });
}
