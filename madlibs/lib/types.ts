export type SpiceLevel = "office" | "happyhour" | "bachelorette" | "noSurvivors";

export type Theme =
  | "surprise"
  | "weddingSpeech"
  | "trueCrime"
  | "datingDisaster"
  | "officeMemo"
  | "newsBroadcast"
  | "bedtimeStory"
  | "roastBirthday";

export type Phase = "lobby" | "writing" | "generating" | "story";

export interface Player {
  id: string;
  name: string;
  joinedAt: number;
}

export interface Slot {
  /** Order in the template (0-indexed) */
  index: number;
  /** What kind of word is being requested, e.g. "a body part", "a verb ending in -ing" */
  prompt: string;
  /** Player ID assigned to fill this slot */
  assignedTo: string;
}

export interface Submission {
  slotIndex: number;
  playerId: string;
  word: string;
  submittedAt: number;
}

export interface Room {
  code: string;
  hostId: string;
  spice: SpiceLevel;
  theme: Theme;
  phase: Phase;
  players: Player[];
  /** Template string with {{0}}, {{1}}, ... placeholders */
  template: string | null;
  title: string | null;
  slots: Slot[];
  submissions: Submission[];
  /** Final assembled and polished story */
  story: string | null;
  /** Each remix appends an item; latest is shown */
  remixes: string[];
  createdAt: number;
  /** Bumps every state change so clients can detect changes cheaply */
  version: number;
  /** Error message surfaced from the last Claude call */
  error: string | null;
}

/** Shape returned to clients (excludes hostId etc. that the server keeps private) */
export type PublicRoom = Room;
