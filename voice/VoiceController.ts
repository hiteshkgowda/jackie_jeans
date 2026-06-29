"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { UseQuizReturn } from "@/hooks/useQuiz";
import type { QuizQuestion } from "@/types";
import type { VoicePhase, TranscriptEntry } from "./VoiceState";
import { SpeechRecognizer } from "./SpeechRecognizer";
import { SpeechSynthesizer } from "./SpeechSynthesizer";
import { parseVoiceAnswer, isSkipCommand } from "./VoiceParser";
import { validateAnswer } from "@/lib/quizEngine";

// ─── Script helpers ───────────────────────────────────────────────────────────

const GREETING =
  "Hi! I'm your Jackie stylist. I'll help you find jeans that actually fit. " +
  "This only takes a couple of minutes. Let's begin.";

const COMPLETION = "I have everything I need. Let's find your best fit.";

const CONFIRMATIONS = ["Perfect.", "Great.", "Got it.", "Excellent.", "Thanks."];

const RETRY_PROMPT =
  "I'm sorry, I didn't quite catch that. Could you repeat it?";

const FALLBACK_PROMPT =
  "I'm having trouble understanding. Let me show you the options so you can tap your answer.";

const RETRY_MAX = 3;

let _seq = 0;
const uid = (): string => String(++_seq);
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function log(label: string, ...rest: unknown[]): void {
  console.log("[VoiceFSM]", label, ...rest);
}

function questionScript(q: QuizQuestion): string {
  switch (q.type) {
    case "dropdown":
      return q.id === "height"
        ? `${q.question} You can say something like, five foot six.`
        : `${q.question} Say a number.`;
    case "number-input":
      return `${q.question} Or say skip to move on.`;
    case "multi-select":
      return `${q.question} Say all the brands that apply. For example, Levi's and Gap.`;
    case "single-select": {
      if (q.options && q.options.length <= 5) {
        const labels = q.options.map((o) => o.label).join(", ");
        return `${q.question} Your options are: ${labels}.`;
      }
      return q.question;
    }
    case "brand-size":
      return `${q.question} Say a size like medium, large, or twenty eight.`;
    default:
      return q.question;
  }
}

// ─── Public interface ─────────────────────────────────────────────────────────

export interface VoiceControllerReturn {
  phase: VoicePhase;
  transcript: TranscriptEntry[];
  liveText: string;
  currentMessage: string;
  showManualInput: boolean;
  isSupported: boolean;
  start: () => void;
  repeat: () => void;
  cancel: () => void;
  handleManualContinue: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
//
// Architecture: one deterministic FSM driven by a single useEffect.
//
//   transition(to)  — the ONLY way to change phase.
//                     Updates phaseRef synchronously, then increments stepKey.
//
//   stepKey         — the ONLY dependency of the driving useEffect.
//                     Incrementing it means "run the next FSM step".
//
//   Driving effect  — reads phaseRef.current, starts exactly one async
//                     operation (speech or recognition), returns a cleanup
//                     that stops it. Never starts a new operation on its own;
//                     only callbacks call transition() to move forward.
//
//   processRef      — synchronous answer logic called by the recognition
//                     callback. Reads refs, calls quiz mutations, then calls
//                     transition() with the next phase.
//
// Result: there is exactly ONE active synthesis and ONE active recognition
// session at any moment. No two useEffects compete. No stale closures.

export function useVoiceController(quiz: UseQuizReturn): VoiceControllerReturn {
  const {
    currentQuestion,
    currentIndex,
    totalQuestions,
    answers,
    setAnswer,
    skipCurrentQuestion,
    jumpToIndex,
  } = quiz;

  const router = useRouter();

  // ── UI state (drives re-renders) ──────────────────────────────────────────
  const [displayPhase, setDisplayPhase] = useState<VoicePhase>("idle");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [liveText, setLiveText] = useState("");
  const [currentMessage, setCurrentMessage] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  // The ONLY trigger for the driving useEffect.
  // Every call to transition() increments this by one.
  const [stepKey, setStepKey] = useState(0);

  // ── Singletons ────────────────────────────────────────────────────────────
  const synthRef = useRef<SpeechSynthesizer | null>(null);
  const recRef = useRef<SpeechRecognizer | null>(null);

  // ── FSM state (mutable, not React state) ─────────────────────────────────
  const phaseRef = useRef<VoicePhase>("idle"); // source of truth; updated synchronously
  const retryCountRef = useRef(0);
  const capturedRef = useRef(""); // interim recognition text

  // ── Session guard ─────────────────────────────────────────────────────────
  // Monotonically increasing. Incremented by cancel() and start().
  // Every async callback (synthesis onEnd, recognition onResult/onEnd/onError)
  // captures this value when it is created and checks it before acting.
  // A mismatch means the conversation was cancelled — the callback must bail.
  const sessionRef = useRef(0);

  // ── Always-fresh mirrors of quiz props (prevent stale closures) ───────────
  const questionRef = useRef(currentQuestion);
  questionRef.current = currentQuestion;
  const indexRef = useRef(currentIndex);
  indexRef.current = currentIndex;
  const totalRef = useRef(totalQuestions);
  totalRef.current = totalQuestions;
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const setAnswerRef = useRef(setAnswer);
  setAnswerRef.current = setAnswer;
  const skipRef = useRef(skipCurrentQuestion);
  skipRef.current = skipCurrentQuestion;
  const jumpRef = useRef(jumpToIndex);
  jumpRef.current = jumpToIndex;
  const routerRef = useRef(router);
  routerRef.current = router;

  // ── Init singletons once ──────────────────────────────────────────────────
  useEffect(() => {
    synthRef.current = new SpeechSynthesizer();
    recRef.current = new SpeechRecognizer();
    return () => {
      synthRef.current?.stop();
      recRef.current?.cancel();
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // transition(to)
  //
  // THE ONLY entry point for phase changes. Call this from anywhere —
  // speech callbacks, recognition callbacks, public controls, manual continue.
  // Never mutate phaseRef directly outside this function.
  // ─────────────────────────────────────────────────────────────────────────
  const transitionRef = useRef((to: VoicePhase): void => {
    log("transition", phaseRef.current, "→", to);
    phaseRef.current = to;
    setDisplayPhase(to);
    setStepKey((k) => k + 1);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // speak(text, onEnd)
  //
  // Writes to transcript and currentMessage, starts synthesis.
  // onEnd is called ONLY when synthesis ends — never before.
  // Stable: only references refs and stable React setters.
  // ─────────────────────────────────────────────────────────────────────────
  const speakRef = useRef((text: string, onEnd: () => void): void => {
    // Capture the session that is active at the moment speak() is called.
    // If the session changes before synthesis ends (e.g. user pressed Cancel),
    // window.speechSynthesis.cancel() fires utterance.onend in some browsers —
    // the guard below ensures that stale callback does nothing.
    const session = sessionRef.current;

    log("speak", `"${text}"`);
    setCurrentMessage(text);
    setTranscript((prev) => [
      ...prev,
      { id: uid(), role: "ai", text, timestamp: Date.now() },
    ]);
    synthRef.current?.speak(text, () => {
      if (sessionRef.current !== session) return; // stale — conversation cancelled
      log("speak.done");
      onEnd();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // process(rawText)
  //
  // Called by the recognition callback once speech ends.
  // Fully synchronous: parses text, mutates quiz state, then calls transition().
  // Reads ONLY refs — never stale.
  // ─────────────────────────────────────────────────────────────────────────
  const processRef = useRef((rawText: string): void => {
    // Belt-and-suspenders: if cancel() already moved us to idle, ignore this call.
    // The recognition callbacks also carry their own session check, but process()
    // can be called from other paths, so this guard is a safety net.
    if (phaseRef.current === "idle") return;

    const q = questionRef.current;
    if (!q) return;

    const transition = transitionRef.current;
    const text = rawText.trim();

    log("process", { qid: q.id, text: `"${text}"`, retry: retryCountRef.current });

    // Add user utterance to transcript
    if (text) {
      setTranscript((prev) => [
        ...prev,
        { id: uid(), role: "user", text, timestamp: Date.now() },
      ]);
    }

    // ── Skip command (weight only) ─────────────────────────────────────────
    if (q.skippable && isSkipCommand(text)) {
      log("skip");
      skipRef.current();
      transition("speaking");
      return;
    }

    // ── Parse and validate ─────────────────────────────────────────────────
    const parsed = text ? parseVoiceAnswer(q, text) : null;
    log("parsed", parsed);

    if (parsed !== null) {
      const result = validateAnswer(q, { questionId: q.id, value: parsed });
      if (result.valid) {
        setAnswerRef.current(q.id, parsed as string | string[]);
        retryCountRef.current = 0;

        const isLast = indexRef.current === totalRef.current - 1;
        if (isLast) {
          log("last question answered");
          transition("completed");
        } else {
          // Advance quiz index before transitioning so the speaking effect
          // reads the correct next question from questionRef.
          jumpRef.current(indexRef.current + 1);
          transition("confirming");
        }
        return;
      }
    }

    // ── Parse / validation failed ──────────────────────────────────────────
    retryCountRef.current += 1;
    log("invalid", retryCountRef.current, "/", RETRY_MAX);

    if (retryCountRef.current >= RETRY_MAX) {
      retryCountRef.current = 0;
      transition("manualFallback");
    } else {
      transition("error");
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Driving useEffect
  //
  // THE ONLY effect that drives FSM side-effects.
  //
  // Fires once per transition() call (stepKey is the sole dependency).
  // Reads phaseRef.current — always fresh, never stale.
  // Starts exactly ONE async operation per invocation.
  // Returns a cleanup that cancels whatever was started.
  // Never calls transition() directly — only via callbacks it passes to
  // speech/recognition instances.
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const phase = phaseRef.current;
    const synth = synthRef.current;
    const rec = recRef.current;
    const speak = speakRef.current;
    const process = processRef.current;
    const transition = transitionRef.current;

    log("step", phase);

    switch (phase) {

      // ── Idle ────────────────────────────────────────────────────────────
      case "idle":
        return;

      // ── Greeting ─────────────────────────────────────────────────────────
      case "greeting":
        speak(GREETING, () => transition("speaking"));
        return () => synth?.stop();

      // ── Speaking question ─────────────────────────────────────────────────
      case "speaking": {
        const q = questionRef.current;
        if (!q) return;
        speak(questionScript(q), () => transition("listening"));
        return () => synth?.stop();
      }

      // ── Listening ─────────────────────────────────────────────────────────
      // Starts a fresh SpeechRecognizer session.
      // SpeechRecognizer always creates a new browser SpeechRecognition
      // instance in start(), so no stale-session issues.
      case "listening": {
        capturedRef.current = "";
        setLiveText("");

        // Capture the session that is active when listening begins.
        // recognition.abort() (called by cancel()) fires onerror("aborted")
        // which SpeechRecognizer routes to onEnd — the guard prevents that
        // stale onEnd from calling process() and triggering a retry prompt.
        const listeningSession = sessionRef.current;

        log("rec.start");
        rec?.start(
          (text) => {
            if (sessionRef.current !== listeningSession) return; // stale
            capturedRef.current = text;
            setLiveText(text);
          },
          () => {
            // Recognition ended (natural end or no-speech)
            if (sessionRef.current !== listeningSession) return; // stale
            log("rec.end", `"${capturedRef.current}"`);
            process(capturedRef.current);
          },
          (err) => {
            // Recognition error — treat as silent end
            if (sessionRef.current !== listeningSession) return; // stale
            log("rec.error", err);
            process(capturedRef.current);
          }
        );
        return () => {
          log("rec.cancel");
          rec?.cancel();
        };
      }

      // ── Brief confirmation before asking next question ────────────────────
      case "confirming":
        speak(pick(CONFIRMATIONS), () => transition("speaking"));
        return () => synth?.stop();

      // ── Retry prompt ──────────────────────────────────────────────────────
      case "error":
        speak(RETRY_PROMPT, () => transition("listening"));
        return () => synth?.stop();

      // ── Manual input fallback ─────────────────────────────────────────────
      // Speaks the fallback message, then reveals the manual UI.
      // FSM waits here until handleManualContinue() is called.
      case "manualFallback":
        speak(FALLBACK_PROMPT, () => setShowManualInput(true));
        return () => synth?.stop();

      // ── Completed ─────────────────────────────────────────────────────────
      case "completed":
        speak(`${pick(CONFIRMATIONS)} ${COMPLETION}`, () => {
          routerRef.current.push("/summary");
        });
        return () => synth?.stop();

      default:
        return;
    }
    // All values read inside the effect come from refs (always-fresh).
    // stepKey is the intentional sole dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepKey]);

  // ─────────────────────────────────────────────────────────────────────────
  // Public controls
  // ─────────────────────────────────────────────────────────────────────────

  function start(): void {
    log("start");
    // New session: any callbacks from a previous conversation become stale.
    sessionRef.current += 1;
    retryCountRef.current = 0;
    setShowManualInput(false);
    setTranscript([]);
    setLiveText("");
    setCurrentMessage("");
    transitionRef.current("greeting");
  }

  function repeat(): void {
    log("repeat");
    // Stop whatever is running and re-ask the current question.
    synthRef.current?.stop();
    recRef.current?.cancel();
    setLiveText("");
    transitionRef.current("speaking");
  }

  function cancel(): void {
    log("cancel");
    // Bump the session BEFORE calling stop/cancel on the underlying APIs.
    // synthRef.stop() → window.speechSynthesis.cancel() → utterance.onend fires
    //   in some browsers immediately — the session bump ensures that callback
    //   sees a stale session and returns without calling transition().
    // recRef.cancel() → recognition.abort() → onerror("aborted") → onEnd fires
    //   — same guard prevents it from calling process() and starting a retry.
    sessionRef.current += 1;
    synthRef.current?.stop();
    recRef.current?.cancel();
    retryCountRef.current = 0;
    setShowManualInput(false);
    setLiveText("");
    transitionRef.current("idle");
  }

  function handleManualContinue(): void {
    const q = questionRef.current;
    if (!q) return;

    const answer = answersRef.current[q.id];
    const { valid } = validateAnswer(q, answer);

    if (!valid) {
      log("handleManualContinue: answer not valid yet", q.id);
      return;
    }

    log("handleManualContinue: valid answer, resuming", q.id);

    // Stop any residual synthesis and hide the manual UI.
    synthRef.current?.stop();
    setShowManualInput(false);
    retryCountRef.current = 0;

    const isLast = indexRef.current === totalRef.current - 1;

    if (isLast) {
      transitionRef.current("completed");
    } else {
      // Advance the quiz index and force an immediate speaking transition.
      // Both state updates are batched by React 18 into one render, so the
      // driving effect fires once with phase="speaking" and the next question
      // already in questionRef. No synthesis callback dependency here.
      jumpRef.current(indexRef.current + 1);
      transitionRef.current("speaking");
    }
  }

  // ── Browser support check ─────────────────────────────────────────────────
  const isSupported =
    typeof window !== "undefined" &&
    !!(window.SpeechRecognition ?? window.webkitSpeechRecognition);

  return {
    phase: displayPhase,
    transcript,
    liveText,
    currentMessage,
    showManualInput,
    isSupported,
    start,
    repeat,
    cancel,
    handleManualContinue,
  };
}
