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

// ─── Constants ────────────────────────────────────────────────────────────────

const GREETING =
  "Hi! I'm your Jackie stylist. I'll help you find jeans that actually fit. This only takes a couple of minutes. Let's begin.";

const COMPLETION =
  "Perfect. I have everything I need. Let's find your best fit.";

const CONFIRMATIONS = ["Perfect.", "Great.", "Got it.", "Excellent.", "Thanks."];

const RETRY_MAX = 3;

let _idCounter = 0;
function nextId(): string {
  return String(++_idCounter);
}

function randomConfirmation(): string {
  return CONFIRMATIONS[Math.floor(Math.random() * CONFIRMATIONS.length)];
}

// ─── Question → spoken prompt ─────────────────────────────────────────────────

function questionToSpeech(q: QuizQuestion): string {
  switch (q.type) {
    case "dropdown":
      if (q.id === "height") return `${q.question} You can say something like, five foot six.`;
      return `${q.question} Say a number.`;
    case "number-input":
      return `${q.question} Or say skip to move on.`;
    case "multi-select":
      return `${q.question} Say all the brands that apply. For example, Levi's and Gap.`;
    case "single-select": {
      if (q.options && q.options.length <= 5) {
        const opts = q.options.map((o) => o.label).join(", ");
        return `${q.question} Your options are: ${opts}.`;
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

  const [phase, setPhase] = useState<VoicePhase>("idle");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [liveText, setLiveText] = useState("");
  const [currentMessage, setCurrentMessage] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  // repeatKey forces the speaking effect to re-fire even if phase/question didn't change
  const [repeatKey, setRepeatKey] = useState(0);

  // ── Stable imperative instances ────────────────────────────────────────────
  const synthRef = useRef<SpeechSynthesizer | null>(null);
  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  const liveTextRef = useRef("");
  const retryCountRef = useRef(0);

  // ── Latest-value refs (avoid stale closures in async callbacks) ────────────
  const currentQuestionRef = useRef(currentQuestion);
  currentQuestionRef.current = currentQuestion;
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;
  const totalQuestionsRef = useRef(totalQuestions);
  totalQuestionsRef.current = totalQuestions;
  const setAnswerRef = useRef(setAnswer);
  setAnswerRef.current = setAnswer;
  const skipRef = useRef(skipCurrentQuestion);
  skipRef.current = skipCurrentQuestion;
  const jumpRef = useRef(jumpToIndex);
  jumpRef.current = jumpToIndex;
  const routerRef = useRef(router);
  routerRef.current = router;
  const setPhaseRef = useRef(setPhase);
  setPhaseRef.current = setPhase;
  const answersRef = useRef(answers);
  answersRef.current = answers;

  // ── Init on client ────────────────────────────────────────────────────────
  useEffect(() => {
    synthRef.current = new SpeechSynthesizer();
    recognizerRef.current = new SpeechRecognizer();
    return () => {
      synthRef.current?.stop();
      recognizerRef.current?.cancel();
    };
  }, []);

  // ── Core speak helper (stable ref) ────────────────────────────────────────
  const speakFn = useRef((text: string, onEnd?: () => void) => {
    setCurrentMessage(text);
    setTranscript((prev) => [
      ...prev,
      { id: nextId(), role: "ai", text, timestamp: Date.now() },
    ]);
    synthRef.current?.speak(text, onEnd);
  });

  // ── processAnswer (reads only refs — never goes stale) ────────────────────
  const processAnswerFn = useRef((rawText: string) => {
    const question = currentQuestionRef.current;
    if (!question) return;

    const text = rawText.trim();

    if (text) {
      setTranscript((prev) => [
        ...prev,
        { id: nextId(), role: "user", text, timestamp: Date.now() },
      ]);
    }

    // Skip command (only for skippable questions)
    if (question.skippable && isSkipCommand(text)) {
      skipRef.current();
      speakFn.current("No problem. Let's continue.", () => {
        setPhaseRef.current("speaking");
      });
      return;
    }

    // Attempt to parse spoken text into a valid answer
    const parsed = text ? parseVoiceAnswer(question, text) : null;

    if (parsed !== null) {
      const validation = validateAnswer(question, {
        questionId: question.id,
        value: parsed,
      });

      if (validation.valid) {
        setAnswerRef.current(question.id, parsed);
        retryCountRef.current = 0;

        const isLast =
          currentIndexRef.current === totalQuestionsRef.current - 1;

        if (isLast) {
          setPhaseRef.current("completed");
          speakFn.current(`${randomConfirmation()} ${COMPLETION}`, () => {
            routerRef.current.push("/summary");
          });
        } else {
          jumpRef.current(currentIndexRef.current + 1);
          speakFn.current(randomConfirmation(), () => {
            setPhaseRef.current("speaking");
          });
        }
        return;
      }
    }

    // Parse / validation failed — retry or fall back to manual
    retryCountRef.current += 1;

    if (retryCountRef.current >= RETRY_MAX) {
      retryCountRef.current = 0;
      speakFn.current(
        "I'm having trouble understanding. Let me show you the options so you can answer manually.",
        () => {
          setShowManualInput(true);
          setPhaseRef.current("manualFallback");
        }
      );
    } else {
      speakFn.current(
        "I'm sorry, I didn't quite catch that. Could you repeat it?",
        () => {
          setPhaseRef.current("listening");
        }
      );
    }
  });

  // ── FSM: greeting ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "greeting") return;
    speakFn.current(GREETING, () => setPhase("speaking"));
  }, [phase]);

  // ── FSM: speaking ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "speaking") return;
    const q = currentQuestionRef.current;
    if (!q) return;

    const text = questionToSpeech(q);
    speakFn.current(text, () => setPhase("listening"));

    return () => {
      synthRef.current?.stop();
    };
    // repeatKey forces this to re-run on "Repeat" without changing phase/question
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentQuestion?.id, repeatKey]);

  // ── FSM: listening ────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "listening") return;
    const rec = recognizerRef.current;
    if (!rec) return;

    liveTextRef.current = "";
    setLiveText("");

    rec.start(
      (text) => {
        liveTextRef.current = text;
        setLiveText(text);
      },
      () => {
        // Recognition ended — process whatever was captured
        processAnswerFn.current(liveTextRef.current);
      },
      (err) => {
        console.warn("[VoiceController] recognition error:", err);
        processAnswerFn.current(liveTextRef.current);
      }
    );

    return () => {
      rec.cancel();
    };
  }, [phase]);

  // ── Public controls ───────────────────────────────────────────────────────

  function start() {
    retryCountRef.current = 0;
    setShowManualInput(false);
    setTranscript([]);
    setLiveText("");
    setCurrentMessage("");
    setPhase("greeting");
  }

  function repeat() {
    synthRef.current?.stop();
    recognizerRef.current?.cancel();
    setLiveText("");
    setRepeatKey((k) => k + 1);
    setPhase("speaking");
  }

  function cancel() {
    synthRef.current?.stop();
    recognizerRef.current?.cancel();
    setPhase("idle");
    setShowManualInput(false);
    setLiveText("");
    retryCountRef.current = 0;
  }

  function handleManualContinue() {
    const question = currentQuestionRef.current;
    if (!question) return;

    const answer = answersRef.current[question.id];
    const { valid } = validateAnswer(question, answer);
    if (!valid) return;

    setShowManualInput(false);
    retryCountRef.current = 0;

    const isLast = currentIndexRef.current === totalQuestionsRef.current - 1;
    if (isLast) {
      setPhase("completed");
      speakFn.current(`${randomConfirmation()} ${COMPLETION}`, () => {
        routerRef.current.push("/summary");
      });
    } else {
      jumpRef.current(currentIndexRef.current + 1);
      speakFn.current("Got it. Let's continue.", () => setPhase("speaking"));
    }
  }

  // ── isSupported (SSR-safe) ────────────────────────────────────────────────
  const isSupported =
    typeof window !== "undefined" &&
    !!(window.SpeechRecognition ?? window.webkitSpeechRecognition);

  return {
    phase,
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
