import { NextResponse } from "next/server";
import { createRoom } from "@/lib/store";
import type { SpiceLevel, Theme } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json();
  const { hostName, spice, theme } = body as {
    hostName: string;
    spice: SpiceLevel;
    theme: Theme;
  };

  if (!hostName?.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }
  const hostId = crypto.randomUUID();
  const room = createRoom({
    hostId,
    hostName: hostName.trim().slice(0, 40),
    spice,
    theme,
  });
  return NextResponse.json({ room, you: { id: hostId, name: hostName.trim() } });
}
