import type { SpiceLevel, Theme } from "./types";

export const SPICE_META: Record<SpiceLevel, { label: string; emoji: string; description: string; guidance: string }> = {
  office: {
    label: "Office Party",
    emoji: "🍦",
    description: "Mild — innuendo only, safe for the company Slack",
    guidance:
      "Keep things workplace-appropriate. Innuendo is fine, but no explicit sexual content, no slurs, no graphic violence. Think network sitcom — clever, occasionally cheeky, never crude.",
  },
  happyhour: {
    label: "Happy Hour",
    emoji: "🌶️",
    description: "Spicy — crude humor, sexual references ok",
    guidance:
      "Crude humor is welcome. Sexual references and mild profanity are fine. Avoid graphic descriptions of sex acts; keep it suggestive rather than explicit. Think a tipsy stand-up set.",
  },
  bachelorette: {
    label: "Bachelorette",
    emoji: "🔥",
    description: "Raunchy — explicit, sexual humor encouraged",
    guidance:
      "Lean in to the raunch. Explicit sexual humor, profanity, and crude jokes are all fair game. Still no content involving minors, no non-consensual scenarios, no slurs.",
  },
  noSurvivors: {
    label: "No Survivors",
    emoji: "☠️",
    description: "Dark — roast-mode, gallows humor",
    guidance:
      "Embrace dark humor. Mortality, divorce, embarrassing failures, roast-level burns are all welcome. Still no slurs, no content involving minors, no non-consensual scenarios. Punch up where possible.",
  },
};

export const THEME_META: Record<Theme, { label: string; emoji: string; description: string }> = {
  surprise: { label: "Surprise me", emoji: "🎲", description: "Claude picks a wild genre" },
  weddingSpeech: { label: "Wedding speech gone wrong", emoji: "🥂", description: "The best man takes a hard left turn" },
  trueCrime: { label: "True crime podcast", emoji: "🎙️", description: "Whispered intro music optional" },
  datingDisaster: { label: "Dating app disaster", emoji: "💔", description: "First date, last mistake" },
  officeMemo: { label: "Office HR memo", emoji: "📎", description: "Effective immediately…" },
  newsBroadcast: { label: "Breaking news report", emoji: "📺", description: "We interrupt your regular programming" },
  bedtimeStory: { label: "Cursed bedtime story", emoji: "🌙", description: "Goodnight, moon. Goodnight, regret." },
  roastBirthday: { label: "Birthday roast", emoji: "🎂", description: "A toast to a beloved disaster" },
};

export const SPICE_ORDER: SpiceLevel[] = ["office", "happyhour", "bachelorette", "noSurvivors"];
export const THEME_ORDER: Theme[] = [
  "surprise",
  "weddingSpeech",
  "trueCrime",
  "datingDisaster",
  "officeMemo",
  "newsBroadcast",
  "bedtimeStory",
  "roastBirthday",
];
