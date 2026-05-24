"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Room, Submission } from "@/lib/types";
import { SPICE_META, THEME_META } from "@/lib/spice";

interface You {
  id: string;
  name: string;
}

const REMIX_PRESETS = [
  { label: "🔥 Spicier", twist: "Crank the spice level up. Make it more raunchy / dark / unhinged than the original." },
  { label: "🎬 Film noir", twist: "Rewrite as a hard-boiled film noir voiceover. Cynical narrator, rain, regret." },
  { label: "📰 Local news", twist: "Rewrite as a breathless local TV news segment. Add a co-anchor's reaction at the end." },
  { label: "👶 Bedtime story", twist: "Rewrite as a children's bedtime story. The contrast is the joke. Stay PG in voice, keep the player words." },
  { label: "📜 Shakespeare", twist: "Rewrite in iambic-ish Shakespearean English. Thee, thou, forsooth. Keep the player words exactly." },
];

export default function RoomPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = (params.code || "").toUpperCase();

  const [you, setYou] = useState<You | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const lastVersion = useRef<number>(-1);

  // Load "you" from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem(`madlibs:you:${code}`);
    if (raw) setYou(JSON.parse(raw));
  }, [code]);

  // If our stored identity isn't in the room's player list (e.g. room expired
  // and a new one took the code, or local data is stale), clear and re-prompt.
  useEffect(() => {
    if (!room || !you) return;
    if (!room.players.some((p) => p.id === you.id)) {
      localStorage.removeItem(`madlibs:you:${code}`);
      setYou(null);
    }
  }, [room, you, code]);

  // Polling loop
  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${code}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setLoadError(data.error || `Error ${res.status}`);
        return;
      }
      const data = await res.json();
      if (data.room.version !== lastVersion.current) {
        lastVersion.current = data.room.version;
        setRoom(data.room);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Network error");
    }
  }, [code]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 2000);
    return () => clearInterval(t);
  }, [refresh]);

  if (loadError && !room) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <div className="rounded-2xl bg-white/60 p-8 text-center">
          <p className="text-red-700">{loadError}</p>
          <button onClick={() => router.push("/")} className="btn-secondary mt-4">
            Back home
          </button>
        </div>
      </main>
    );
  }

  if (!room) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16 text-center text-ink/60">Loading room…</main>
    );
  }

  // If we don't have a "you" identity, prompt to join.
  if (!you) {
    return <JoinPrompt code={code} onJoined={(y) => setYou(y)} />;
  }

  const isHost = you.id === room.hostId;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <header className="mb-8 flex items-baseline justify-between gap-4">
        <div>
          <h1 className="display text-3xl font-semibold">
            Room <span className="text-terracotta">{room.code}</span>
          </h1>
          <p className="text-sm text-ink/60">
            {SPICE_META[room.spice].emoji} {SPICE_META[room.spice].label} ·{" "}
            {THEME_META[room.theme].emoji} {THEME_META[room.theme].label}
          </p>
        </div>
        <button onClick={() => router.push("/")} className="text-xs text-ink/50 hover:text-ink">
          Leave
        </button>
      </header>

      {room.error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{room.error}</div>
      )}

      {room.phase === "lobby" && <Lobby room={room} you={you} isHost={isHost} onChange={refresh} />}
      {room.phase === "writing" && <Writing room={room} you={you} onChange={refresh} />}
      {room.phase === "generating" && <Generating />}
      {room.phase === "story" && (
        <StoryReveal room={room} you={you} isHost={isHost} onChange={refresh} />
      )}
    </main>
  );
}

// ---------------------------------------------------------------------------

function JoinPrompt({ code, onJoined }: { code: string; onJoined: (you: You) => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${code}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join");
      localStorage.setItem(`madlibs:you:${code}`, JSON.stringify(data.you));
      onJoined(data.you);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <form onSubmit={submit} className="rounded-2xl bg-white/60 p-8 space-y-4">
        <h2 className="display text-2xl">
          Join room <span className="text-terracotta">{code}</span>
        </h2>
        <p className="text-sm text-ink/70">Pick a name your friends will recognize.</p>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
          autoFocus
          maxLength={40}
        />
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? "Joining…" : "Join"}
        </button>
      </form>
    </main>
  );
}

// ---------------------------------------------------------------------------

function Lobby({
  room,
  you,
  isHost,
  onChange,
}: {
  room: Room;
  you: You;
  isHost: boolean;
  onChange: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const host = room.players.find((p) => p.id === room.hostId);
  const joinUrl = typeof window !== "undefined" ? `${window.location.origin}/r/${room.code}` : "";

  async function copy() {
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function start() {
    setBusy(true);
    setStartError(null);
    try {
      const res = await fetch(`/api/rooms/${room.code}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youId: you.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error (${res.status})`);
      }
      onChange();
    } catch (err) {
      setStartError(err instanceof Error ? err.message : "Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white/60 p-6">
        <h2 className="display text-xl font-semibold">Invite</h2>
        <p className="mt-1 text-sm text-ink/70">Share this link or have folks type the code on the home page.</p>
        <div className="mt-3 flex items-center gap-2">
          <input className="input font-mono text-sm" readOnly value={joinUrl} onFocus={(e) => e.target.select()} />
          <button onClick={copy} className="btn-secondary whitespace-nowrap">
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
        <p className="mt-3 text-center text-4xl font-display tracking-[0.4em]">{room.code}</p>
      </section>

      <section className="rounded-2xl bg-white/60 p-6">
        <h2 className="display text-xl font-semibold">Players ({room.players.length})</h2>
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {room.players.map((p) => (
            <li
              key={p.id}
              className={`rounded-lg border px-3 py-2 text-sm ${
                p.id === room.hostId ? "border-terracotta bg-terracotta/10" : "border-ink/15"
              }`}
            >
              {p.name}
              {p.id === room.hostId && <span className="ml-1 text-xs text-terracotta">host</span>}
              {p.id === you.id && <span className="ml-1 text-xs text-ink/40">(you)</span>}
            </li>
          ))}
        </ul>
      </section>

      {isHost ? (
        <div className="space-y-2">
          {room.players.length === 1 && (
            <p className="text-center text-sm text-ink/50">
              Solo so far — share the link above. You can start anyway (6 blanks, all yours), or wait for friends.
            </p>
          )}
          <button onClick={start} className="btn-primary w-full" disabled={busy}>
            {busy ? "Generating story…" : `Start the game (${room.players.length} player${room.players.length === 1 ? "" : "s"})`}
          </button>
          {startError && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{startError}</div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-white/40 p-6 text-center text-ink/60">
          Waiting for <span className="font-medium text-ink">{host?.name || "the host"}</span> to start…
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function Writing({ room, you, onChange }: { room: Room; you: You; onChange: () => void }) {
  const mySlots = useMemo(() => room.slots.filter((s) => s.assignedTo === you.id), [room.slots, you.id]);
  const otherSlots = room.slots.filter((s) => s.assignedTo !== you.id);

  const mySubsBySlot = useMemo(() => {
    const m = new Map<number, Submission>();
    for (const s of room.submissions) if (s.playerId === you.id) m.set(s.slotIndex, s);
    return m;
  }, [room.submissions, you.id]);

  const submittedCount = room.submissions.length;
  const totalCount = room.slots.length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white/60 p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="display text-xl font-semibold">Your words</h2>
          <span className="text-sm text-ink/60">
            {submittedCount}/{totalCount} submitted across the room
          </span>
        </div>
        <p className="mt-1 text-sm text-ink/70">
          Don&apos;t peek at the story — that&apos;s the whole joke. Just give us the words.
        </p>

        <div className="mt-4 space-y-3">
          {mySlots.map((slot) => (
            <SlotInput
              key={slot.index}
              roomCode={room.code}
              youId={you.id}
              slotIndex={slot.index}
              prompt={slot.prompt}
              current={mySubsBySlot.get(slot.index)?.word || ""}
              onSaved={onChange}
            />
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white/30 p-6">
        <h3 className="display text-lg font-semibold">Other players ({otherSlots.length} blanks)</h3>
        <ul className="mt-3 space-y-1 text-sm text-ink/70">
          {room.players
            .filter((p) => p.id !== you.id)
            .map((p) => {
              const theirSlots = room.slots.filter((s) => s.assignedTo === p.id);
              const theirSubs = room.submissions.filter((s) => s.playerId === p.id).length;
              return (
                <li key={p.id} className="flex justify-between">
                  <span>{p.name}</span>
                  <span>
                    {theirSubs}/{theirSlots.length}
                  </span>
                </li>
              );
            })}
        </ul>
      </div>
    </div>
  );
}

function SlotInput({
  roomCode,
  youId,
  slotIndex,
  prompt,
  current,
  onSaved,
}: {
  roomCode: string;
  youId: string;
  slotIndex: number;
  prompt: string;
  current: string;
  onSaved: () => void;
}) {
  const [value, setValue] = useState(current);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(!!current);

  useEffect(() => {
    setValue(current);
    setSaved(!!current);
  }, [current]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setBusy(true);
    try {
      await fetch(`/api/rooms/${roomCode}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youId, slotIndex, word: value }),
      });
      setSaved(true);
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <label className="flex-1 text-sm">
        <span className="block text-ink/60">{prompt}</span>
      </label>
      <div className="flex gap-2 sm:w-2/3">
        <input
          className="input"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSaved(false);
          }}
          maxLength={80}
        />
        <button type="submit" className="btn-secondary whitespace-nowrap" disabled={busy || !value.trim()}>
          {busy ? "…" : saved ? "✓ Saved" : "Save"}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------

function Generating() {
  return (
    <div className="rounded-2xl bg-white/60 p-12 text-center">
      <div className="display text-2xl italic text-ink/60">Claude is writing…</div>
      <div className="mt-2 text-sm text-ink/40">This usually takes 10-30 seconds.</div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function StoryReveal({
  room,
  you,
  isHost,
  onChange,
}: {
  room: Room;
  you: You;
  isHost: boolean;
  onChange: () => void;
}) {
  const [showBlame, setShowBlame] = useState(false);
  const [twist, setTwist] = useState("");
  const [busy, setBusy] = useState(false);
  const latest = room.remixes.length > 0 ? room.remixes[room.remixes.length - 1] : room.story!;

  async function remix(twistText: string) {
    if (!twistText.trim()) return;
    setBusy(true);
    try {
      await fetch(`/api/rooms/${room.code}/remix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youId: you.id, twist: twistText }),
      });
      setTwist("");
      onChange();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <article className="rounded-2xl bg-white/70 p-8 sm:p-10">
        <h2 className="display text-3xl font-semibold">{room.title}</h2>
        {room.remixes.length > 0 && (
          <div className="mt-1 text-xs uppercase tracking-wider text-terracotta">
            Remix #{room.remixes.length}
          </div>
        )}
        <div className="mt-5 whitespace-pre-wrap text-lg leading-relaxed">
          <FormattedStory text={latest} />
        </div>
      </article>

      <section className="rounded-2xl bg-white/40 p-6">
        <button onClick={() => setShowBlame((b) => !b)} className="btn-secondary">
          {showBlame ? "Hide who-said-what" : "Who said what? (blame mode)"}
        </button>
        {showBlame && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {room.players.map((p) => {
              const theirs = room.submissions
                .filter((s) => s.playerId === p.id)
                .sort((a, b) => a.slotIndex - b.slotIndex);
              return (
                <div key={p.id} className="rounded-lg border border-ink/10 bg-white/60 p-3">
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="mt-1 text-sm text-ink/70">
                    {theirs.map((s) => (
                      <span key={s.slotIndex} className="mr-2 inline-block">
                        <span className="text-ink/40 text-xs">{room.slots.find((sl) => sl.index === s.slotIndex)?.prompt}:</span>{" "}
                        <span className="font-medium">{s.word}</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {isHost && (
        <section className="rounded-2xl bg-white/60 p-6">
          <h3 className="display text-xl font-semibold">Remix it</h3>
          <p className="mt-1 text-sm text-ink/70">Quick ideas, or type your own twist:</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {REMIX_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => remix(p.twist)}
                className="btn-secondary text-sm"
                disabled={busy}
              >
                {p.label}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              remix(twist);
            }}
            className="mt-4 flex gap-2"
          >
            <input
              className="input"
              value={twist}
              onChange={(e) => setTwist(e.target.value)}
              placeholder="Make it a courtroom drama. Or whatever."
              maxLength={200}
            />
            <button type="submit" className="btn-primary whitespace-nowrap" disabled={busy || !twist.trim()}>
              {busy ? "Remixing…" : "Remix"}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

function FormattedStory({ text }: { text: string }) {
  // Render **bold** segments. Player-submitted words come back bolded from Claude.
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="text-terracotta">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
