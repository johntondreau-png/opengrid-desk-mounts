# Mad Libs for Adults

Group-chat mad libs, but spicier. Claude writes the story; players fill in the blanks; the host can remix.

## Run locally

```sh
cd madlibs
npm install
cp .env.example .env.local   # paste your ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000.

Locally the room store falls back to an in-memory `Map` (single Node process) so you don't need Redis. To exercise the real Vercel + Redis path locally, set `KV_REST_API_URL` and `KV_REST_API_TOKEN` in `.env.local`.

## How it works

- **Host** picks a spice level + theme → gets a 4-letter room code + share link.
- **Players** join via code, pick a name.
- **Host** clicks Start → Claude generates a templated story with ~3 blanks per player and assigns them round-robin.
- **Players** privately fill in their blanks. They can't see the template — that's the joke.
- When all blanks are in, Claude assembles + polishes the story. Player words stay verbatim; Claude fixes grammar/tense around them and bolds them in the output.
- **Host** can hit Remix with a preset (spicier, film noir, Shakespeare…) or a custom twist.
- "Blame mode" reveals who submitted which word.

## Deploy to Vercel

1. Push the branch to GitHub if you haven't already.
2. In Vercel, **Add New → Project**, import the repo.
3. **Root directory:** `madlibs`. Vercel autodetects Next.js.
4. **Storage → Upstash Redis (Marketplace) → Connect.** This provisions a free Upstash database and injects `KV_REST_API_URL` and `KV_REST_API_TOKEN` as env vars on every deploy automatically.
5. **Environment Variables:** add `ANTHROPIC_API_KEY` (your Claude API key).
6. Deploy.

The store auto-detects the Upstash env vars and switches from in-memory to Redis. No code change needed.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- `@anthropic-ai/sdk` for the Claude calls (default: `claude-opus-4-7`, configurable via `ANTHROPIC_MODEL`)
- `@upstash/redis` for cross-instance room state on Vercel; in-memory fallback for local dev
- Polling every 2s from the client for state sync

## Known v1 trade-offs

- **Polling, not websockets.** Each player polls every 2s. Fine for the player counts this is designed for; would be wasteful at large scale.
- **Last-write-wins on concurrent submissions.** If two players save the same instant, one save can be lost. The player sees the field still empty and resubmits. Acceptable for a party game; would need a Lua script for true CAS.
- **The "last submitter triggers assembly" pattern adds 10–30s to that one player's submit response.** Everyone else sees the spinner via polling.
