// ─── Finite state machine phases ─────────────────────────────────────────────

export type VoicePhase =
  | "idle"           // not started
  | "greeting"       // speaking the opening greeting
  | "speaking"       // AI speaking a question
  | "listening"      // recording user answer
  | "processing"     // parsing transcript
  | "confirming"     // speaking short confirmation
  | "error"          // speaking "I didn't catch that"
  | "manualFallback" // showing manual QuestionRenderer after 3 failures
  | "completed";     // all questions done, speaking outro

// ─── Transcript ───────────────────────────────────────────────────────────────

export interface TranscriptEntry {
  id: string;
  role: "ai" | "user";
  text: string;
  timestamp: number;
}
