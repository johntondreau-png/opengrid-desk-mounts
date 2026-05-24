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

## How it works

- **Host** picks a spice level + theme → gets a 4-letter room code + share link.
- **Players** join via code, pick a name.
- **Host** clicks Start → Claude generates a templated story with ~3 blanks per player and assigns them round-robin.
- **Players** privately fill in their blanks. They can't see the template — that's the joke.
- When all blanks are in, Claude assembles + polishes the story. Player words stay verbatim; Claude fixes grammar/tense around them and bolds them in the output.
- **Host** can hit Remix with a preset (spicier, film noir, Shakespeare…) or a custom twist.
- "Blame mode" reveals who submitted which word.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- `@anthropic-ai/sdk` for the Claude calls (default: `claude-opus-4-7`, configurable via `ANTHROPIC_MODEL`)
- In-memory room store (`lib/store.ts`) — single Node process only

## Deploying to Vercel

The in-memory store **will not work across serverless invocations** on Vercel — every cold start gets its own empty `Map`. Before deploying, swap `lib/store.ts` for Vercel KV / Upstash Redis. The interface (`createRoom` / `getRoom` / `updateRoom`) is small enough that the swap is mechanical.
