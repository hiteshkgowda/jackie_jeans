"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import type { QuizAnswer, QuizQuestion, QuizState, ValidationResult } from "@/types";
import { BASE_QUESTIONS } from "@/lib/quizData";
import {
  buildActiveQuestions,
  validateAnswer,
  computeIsComplete,
  computeProgress,
} from "@/lib/quizEngine";

// ─── Persistence ──────────────────────────────────────────────────────────────

const STORAGE_KEY = "jj_quiz_state";
const STATE_VERSION = 1;

function loadState(): Pick<QuizState, "answers" | "currentIndex"> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as QuizState;
    // Discard state from old schema versions
    if (parsed.version !== STATE_VERSION) return null;
    return { answers: parsed.answers, currentIndex: parsed.currentIndex };
  } catch {
    return null;
  }
}

function saveState(state: QuizState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Swallow QuotaExceededError and similar — non-fatal
  }
}

function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ─── Public interface ─────────────────────────────────────────────────────────

export interface UseQuizReturn {
  /** The question currently displayed */
  currentQuestion: QuizQuestion;
  /** 0-based index into the active question list */
  currentIndex: number;
  /** Total active questions (base + any injected brand-size questions) */
  totalQuestions: number;
  /** Full ordered list of active questions (including injected brand-size questions) */
  activeQuestions: QuizQuestion[];
  /** All answers keyed by question id */
  answers: Record<string, QuizAnswer>;
  /** Advance to the next question (no-op if validation fails) */
  next: () => void;
  /** Go back one question (no-op on first question) */
  previous: () => void;
  /** Jump directly to any question by index (used by the review screen edit flow) */
  jumpToIndex: (index: number) => void;
  /** Record an answer for any question by id */
  setAnswer: (questionId: string, value: string | string[]) => void;
  /** Mark weight as skipped and advance */
  skipCurrentQuestion: () => void;
  /** Clear all answers and return to question 0 */
  resetQuiz: () => void;
  /** 0-100 progress based on answered questions */
  getProgress: () => number;
  /** True when all active questions have valid answers */
  isComplete: () => boolean;
  /** Validate the current question against its current answer */
  validateCurrentQuestion: () => ValidationResult;
  /** Derived convenience flags */
  canGoNext: boolean;
  canGoPrevious: boolean;
  /** True until the localStorage restore has completed (prevents hydration flash) */
  isHydrated: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useQuiz(): UseQuizReturn {
  const [answers, setAnswers] = useState<Record<string, QuizAnswer>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);

  // Rebuild active question list whenever brand selections change
  const activeQuestions = useMemo(
    () => buildActiveQuestions(BASE_QUESTIONS, answers),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [answers]
  );

  // ── Restore from localStorage on first client render ──────────────────────
  useEffect(() => {
    const persisted = loadState();
    if (persisted) {
      setAnswers(persisted.answers ?? {});
      setCurrentIndex(persisted.currentIndex ?? 0);
    }
    setIsHydrated(true);
  }, []);

  // ── Auto-save whenever state changes (post-hydration only) ────────────────
  useEffect(() => {
    if (!isHydrated) return;
    saveState({ answers, currentIndex, version: STATE_VERSION });
  }, [answers, currentIndex, isHydrated]);

  // ── Clamp index if brand deselections shorten the active list ─────────────
  useEffect(() => {
    if (activeQuestions.length > 0 && currentIndex >= activeQuestions.length) {
      setCurrentIndex(activeQuestions.length - 1);
    }
  }, [activeQuestions.length, currentIndex]);

  // ── Derive current question safely ────────────────────────────────────────
  const safeIndex = Math.min(currentIndex, Math.max(0, activeQuestions.length - 1));
  const currentQuestion = activeQuestions[safeIndex];

  // ── Actions ───────────────────────────────────────────────────────────────

  const setAnswer = useCallback(
    (questionId: string, value: string | string[]) => {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: { questionId, value, skipped: false },
      }));
    },
    []
  );

  const validateCurrentQuestion = useCallback((): ValidationResult => {
    if (!currentQuestion) return { valid: false, error: "No question loaded." };
    return validateAnswer(currentQuestion, answers[currentQuestion.id]);
  }, [currentQuestion, answers]);

  const next = useCallback(() => {
    if (!currentQuestion) return;
    const result = validateAnswer(currentQuestion, answers[currentQuestion.id]);
    if (!result.valid) return;
    setCurrentIndex((i) => Math.min(i + 1, activeQuestions.length - 1));
  }, [currentQuestion, answers, activeQuestions.length]);

  const previous = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const skipCurrentQuestion = useCallback(() => {
    if (!currentQuestion?.skippable) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        value: "",
        skipped: true,
      },
    }));
    setCurrentIndex((i) => Math.min(i + 1, activeQuestions.length - 1));
  }, [currentQuestion, activeQuestions.length]);

  const jumpToIndex = useCallback(
    (index: number) => {
      setCurrentIndex(Math.max(0, Math.min(index, activeQuestions.length - 1)));
    },
    [activeQuestions.length]
  );

  const resetQuiz = useCallback(() => {
    setAnswers({});
    setCurrentIndex(0);
    clearState();
  }, []);

  const getProgress = useCallback(
    () => computeProgress(activeQuestions, answers),
    [activeQuestions, answers]
  );

  const isComplete = useCallback(
    () => computeIsComplete(activeQuestions, answers),
    [activeQuestions, answers]
  );

  // ── Derived flags ─────────────────────────────────────────────────────────

  const canGoNext = useMemo(() => {
    if (!currentQuestion) return false;
    const result = validateAnswer(currentQuestion, answers[currentQuestion.id]);
    return result.valid && currentIndex < activeQuestions.length - 1;
  }, [currentQuestion, answers, currentIndex, activeQuestions.length]);

  const canGoPrevious = currentIndex > 0;

  return {
    currentQuestion,
    currentIndex,
    totalQuestions: activeQuestions.length,
    activeQuestions,
    answers,
    next,
    previous,
    jumpToIndex,
    setAnswer,
    skipCurrentQuestion,
    resetQuiz,
    getProgress,
    isComplete,
    validateCurrentQuestion,
    canGoNext,
    canGoPrevious,
    isHydrated,
  };
}
