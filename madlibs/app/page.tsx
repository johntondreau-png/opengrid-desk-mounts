"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SpiceLevel, Theme } from "@/lib/types";
import { SPICE_META, SPICE_ORDER, THEME_META, THEME_ORDER } from "@/lib/spice";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<"create" | "join">("create");

  // Create form state
  const [name, setName] = useState("");
  const [spice, setSpice] = useState<SpiceLevel>("happyhour");
  const [theme, setTheme] = useState<Theme>("surprise");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Join form state
  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState("");

  async function createRoom(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostName: name, spice, theme }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create room");
      sessionStorage.setItem(`madlibs:you:${data.room.code}`, JSON.stringify(data.you));
      router.push(`/r/${data.room.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setBusy(false);
    }
  }

  async function joinRoom(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const code = joinCode.trim().toUpperCase();
    try {
      const res = await fetch(`/api/rooms/${code}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: joinName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join");
      sessionStorage.setItem(`madlibs:you:${code}`, JSON.stringify(data.you));
      router.push(`/r/${code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12 sm:py-20">
      <header className="mb-10 text-center">
        <h1 className="display text-5xl sm:text-6xl font-semibold tracking-tight">
          Mad Libs <span className="italic text-terracotta">for adults</span>
        </h1>
        <p className="mt-3 text-ink/70">
          Claude writes the story. You fill in the blanks. Things get weird.
        </p>
      </header>

      <div className="mb-6 flex justify-center gap-2">
        <button
          className={`btn ${mode === "create" ? "bg-ink text-cream" : "btn-secondary"}`}
          onClick={() => setMode("create")}
        >
          Host a game
        </button>
        <button
          className={`btn ${mode === "join" ? "bg-ink text-cream" : "btn-secondary"}`}
          onClick={() => setMode("join")}
        >
          Join with code
        </button>
      </div>

      {mode === "create" && (
        <form onSubmit={createRoom} className="rounded-2xl border border-ink/10 bg-white/60 p-6 sm:p-8 backdrop-blur space-y-6">
          <div>
            <label className="mb-1 block text-sm font-medium">Your name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What should we call you?"
              required
              maxLength={40}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Spice level</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SPICE_ORDER.map((s) => {
                const meta = SPICE_META[s];
                const selected = spice === s;
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setSpice(s)}
                    className={`rounded-xl border p-3 text-left transition ${
                      selected
                        ? "border-terracotta bg-terracotta/10"
                        : "border-ink/15 hover:border-ink/40"
                    }`}
                  >
                    <div className="text-2xl">{meta.emoji}</div>
                    <div className="mt-1 text-sm font-semibold">{meta.label}</div>
                    <div className="text-xs text-ink/60">{meta.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Theme</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {THEME_ORDER.map((t) => {
                const meta = THEME_META[t];
                const selected = theme === t;
                return (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`rounded-xl border p-3 text-left transition ${
                      selected
                        ? "border-terracotta bg-terracotta/10"
                        : "border-ink/15 hover:border-ink/40"
                    }`}
                  >
                    <div className="text-xl">{meta.emoji}</div>
                    <div className="mt-1 text-sm font-semibold leading-tight">{meta.label}</div>
                    <div className="text-xs text-ink/60">{meta.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? "Creating room…" : "Create room"}
          </button>
        </form>
      )}

      {mode === "join" && (
        <form onSubmit={joinRoom} className="rounded-2xl border border-ink/10 bg-white/60 p-6 sm:p-8 backdrop-blur space-y-6">
          <div>
            <label className="mb-1 block text-sm font-medium">Room code</label>
            <input
              className="input text-center text-2xl tracking-[0.5em] font-display uppercase"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ABCD"
              maxLength={4}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Your name</label>
            <input
              className="input"
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              placeholder="What should we call you?"
              required
              maxLength={40}
            />
          </div>
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? "Joining…" : "Join room"}
          </button>
        </form>
      )}

      <footer className="mt-12 text-center text-xs text-ink/40">
        Built with Claude. Be kind to your friends.
      </footer>
    </main>
  );
}
