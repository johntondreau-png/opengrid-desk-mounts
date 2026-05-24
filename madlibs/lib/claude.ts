import Anthropic from "@anthropic-ai/sdk";
import type { Player, SpiceLevel, Submission, Theme } from "./types";
import { SPICE_META, THEME_META } from "./spice";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-7";

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) _client = new Anthropic();
  return _client;
}

export interface GeneratedTemplate {
  title: string;
  /** Template with {{0}}, {{1}}, ... placeholders */
  template: string;
  /** Prompts for each blank, in order. Length must match number of placeholders. */
  slotPrompts: string[];
}

/**
 * Ask Claude to write a story template with N blanks for the given theme and spice level.
 * Returns a structured object via output_config.format.
 */
export async function generateTemplate(opts: {
  spice: SpiceLevel;
  theme: Theme;
  numBlanks: number;
}): Promise<GeneratedTemplate> {
  const spice = SPICE_META[opts.spice];
  const theme = THEME_META[opts.theme];

  const themeBrief =
    opts.theme === "surprise"
      ? "Pick a wild, surprising genre yourself — wedding speech, true crime podcast, cursed nursery rhyme, infomercial, court transcript, whatever. Commit to it hard."
      : `The story should be a ${theme.label.toLowerCase()} — ${theme.description.toLowerCase()}.`;

  const system = `You are the host of an adults-only Mad Libs party game. Your job is to write a short, funny story template with exactly ${opts.numBlanks} blanks, then provide a prompt for each blank.

Spice level: ${spice.label} ${spice.emoji}
${spice.guidance}

Always refuse: content involving minors in sexual/romantic situations, non-consensual scenarios, slurs targeting protected groups, real-person sexual content, anything illegal.

Format requirements:
- The template is 5-9 sentences. Use {{0}}, {{1}}, {{2}}, … as placeholders, numbered sequentially from 0.
- Use EXACTLY ${opts.numBlanks} placeholders, numbered 0 through ${opts.numBlanks - 1}.
- Each blank should be a single word or short phrase slot — not a whole clause.
- Word prompts should be specific and evocative: "a body part you can wiggle", "a verb ending in -ing", "an embarrassing childhood nickname", "a profession that involves yelling". Variety > generic ("a noun", "a verb"). Mix concrete and weird.
- Word prompts must NOT reveal the story's plot or theme — players should be guessing blind. Don't write "the name of the bride" if the story is a wedding.
- Title should be punchy and reflect the genre.`;

  const user = `Write a ${spice.label} mad libs template with exactly ${opts.numBlanks} blanks.

${themeBrief}

Return: a title, the template with {{0}}…{{${opts.numBlanks - 1}}} placeholders, and an array of ${opts.numBlanks} word prompts (one per blank, in order).`;

  const response = await client().messages.create({
    model: MODEL,
    max_tokens: 4096,
    system,
    messages: [{ role: "user", content: user }],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            template: { type: "string" },
            slotPrompts: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["title", "template", "slotPrompts"],
          additionalProperties: false,
        },
      },
    },
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content");
  }
  const parsed = JSON.parse(textBlock.text) as GeneratedTemplate;

  // Validate the placeholder count actually matches.
  const placeholders = parsed.template.match(/\{\{(\d+)\}\}/g) || [];
  if (placeholders.length !== opts.numBlanks || parsed.slotPrompts.length !== opts.numBlanks) {
    throw new Error(
      `Template mismatch: expected ${opts.numBlanks} blanks, got ${placeholders.length} placeholders and ${parsed.slotPrompts.length} prompts`,
    );
  }
  return parsed;
}

/**
 * Take a filled template and ask Claude to polish it so it flows naturally
 * (fix grammar, tense agreement, add a punchy final line if the genre calls for it).
 * Returns the polished story text.
 */
export async function assembleStory(opts: {
  spice: SpiceLevel;
  theme: Theme;
  title: string;
  template: string;
  submissions: Submission[];
}): Promise<string> {
  const spice = SPICE_META[opts.spice];
  const theme = THEME_META[opts.theme];

  // Fill in the placeholders verbatim first — give Claude the raw filled-in version.
  let filled = opts.template;
  for (const sub of opts.submissions) {
    filled = filled.replace(`{{${sub.slotIndex}}}`, `**${sub.word}**`);
  }

  const system = `You are polishing a finished mad libs story for performance. The players have filled in the blanks; your job is to make it read well out loud.

Spice level: ${spice.label} ${spice.emoji}
${spice.guidance}

Rules:
- KEEP every player-submitted word (the **bold** words) exactly as written. Do not change them.
- You MAY adjust grammar AROUND them — fix tense, add "a"/"an", pluralize where natural, adjust pronouns.
- You MAY embellish the connecting prose lightly to land the jokes — but stay within the original story's beats.
- Bold the player-submitted words in the output using **markdown bold**.
- Output ONLY the polished story prose. No preamble, no commentary, no title.
- Length: stay close to the original; do not balloon it.`;

  const user = `Title: ${opts.title}
Genre: ${theme.label}

Filled story (player words in **bold**):

${filled}

Polish it.`;

  const response = await client().messages.create({
    model: MODEL,
    max_tokens: 2048,
    system,
    messages: [{ role: "user", content: user }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content");
  }
  return textBlock.text.trim();
}

/**
 * Rewrite the assembled story with a twist: spicier, different genre, or "blame mode" exposé.
 */
export async function remixStory(opts: {
  spice: SpiceLevel;
  theme: Theme;
  story: string;
  twist: string;
  players: Player[];
  submissions: Submission[];
}): Promise<string> {
  const spice = SPICE_META[opts.spice];

  const blameMap = opts.players
    .map((p) => {
      const theirs = opts.submissions.filter((s) => s.playerId === p.id).map((s) => s.word);
      return `${p.name}: ${theirs.join(", ")}`;
    })
    .join("\n");

  const system = `You are remixing a mad libs story.

Spice level: ${spice.label} ${spice.emoji}
${spice.guidance}

Rules:
- Preserve the chaotic, player-submitted words (bolded in the original) — they are the heart of the joke.
- Otherwise, take liberties with the framing per the twist.
- Output ONLY the remixed story prose. No preamble, no commentary.`;

  const user = `Original story:

${opts.story}

Player word submissions (for context — do not list these in the output):
${blameMap}

Twist: ${opts.twist}

Remix it.`;

  const response = await client().messages.create({
    model: MODEL,
    max_tokens: 2048,
    system,
    messages: [{ role: "user", content: user }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content");
  }
  return textBlock.text.trim();
}
