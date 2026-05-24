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

  const room = getRoom(params.code);
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

  updateRoom(params.code, (r) => {
    const existing = r.submissions.findIndex((s) => s.slotIndex === slotIndex);
    const entry = { slotIndex, playerId: youId, word: trimmed, submittedAt: Date.now() };
    if (existing >= 0) r.submissions[existing] = entry;
    else r.submissions.push(entry);
  });

  // If all slots are filled, kick off story assembly.
  const after = getRoom(params.code);
  if (after && after.submissions.length === after.slots.length && after.phase === "writing") {
    updateRoom(params.code, (r) => {
      r.phase = "generating";
      r.error = null;
    });

    // Don't await — assemble in the background so the submit response returns fast.
    // The client will poll and see phase flip to "story" when ready.
    (async () => {
      try {
        const story = await assembleStory({
          spice: after.spice,
          theme: after.theme,
          title: after.title!,
          template: after.template!,
          submissions: after.submissions
            .slice()
            .sort((a, b) => a.slotIndex - b.slotIndex),
        });
        updateRoom(params.code, (r) => {
          r.story = story;
          r.phase = "story";
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        updateRoom(params.code, (r) => {
          r.phase = "writing";
          r.error = `Couldn't assemble the story: ${msg}`;
        });
      }
    })();
  }

  return NextResponse.json({ room: getRoom(params.code) });
}
