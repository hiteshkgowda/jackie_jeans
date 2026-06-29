"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, SkipForward } from "lucide-react";
import { useQuiz } from "@/hooks/useQuiz";
import { Header, ProgressBar, PrimaryButton, SecondaryButton } from "@/components/ui";
import { QuestionRenderer, ReviewScreen } from "@/components/quiz";

type QuizMode = "quiz" | "review";

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function QuizSkeleton() {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <Header title="Fit Quiz" showBack backHref="/" />
      <main className="flex-1 flex flex-col max-w-md mx-auto w-full px-5 pt-5 pb-6 gap-5">
        <div className="h-1.5 w-full rounded-full bg-brand-border animate-pulse" />
        <div className="h-8 w-3/4 rounded-xl bg-brand-border animate-pulse mt-2" />
        <div className="h-4 w-full rounded-lg bg-brand-border/70 animate-pulse" />
        <div className="flex flex-col gap-2 mt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 rounded-2xl bg-brand-border animate-pulse" />
          ))}
        </div>
      </main>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ManualPage() {
  const router = useRouter();
  const {
    currentQuestion,
    currentIndex,
    totalQuestions,
    activeQuestions,
    answers,
    next,
    previous,
    jumpToIndex,
    setAnswer,
    skipCurrentQuestion,
    getProgress,
    isComplete,
    validateCurrentQuestion,
    canGoPrevious,
    isHydrated,
  } = useQuiz();

  const prefersReduced = useReducedMotion() ?? false;

  // Slide variants respect reduced-motion preference.
  // forward (d>0): slide left; back (d<0): slide right; jump (d=0): fade only.
  const slideVariants = useMemo(
    () => ({
      enter: (d: number) => ({
        x: prefersReduced ? 0 : d === 0 ? 0 : d > 0 ? 40 : -40,
        opacity: 0,
      }),
      center: { x: 0, opacity: 1 },
      exit: (d: number) => ({
        x: prefersReduced ? 0 : d === 0 ? 0 : d > 0 ? -40 : 40,
        opacity: 0,
      }),
    }),
    [prefersReduced]
  );

  const [mode, setMode] = useState<QuizMode>("quiz");
  const [direction, setDirection] = useState(1);
  const [showError, setShowError] = useState(false);

  // "✓ Saved" badge — appears briefly after the user records an answer
  const [showSaved, setShowSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Wrap setAnswer to show the "✓ Saved" badge on every successful store
  const setAnswerAndNotify = useCallback(
    (questionId: string, value: string | string[]) => {
      setAnswer(questionId, value);
      clearTimeout(savedTimerRef.current);
      setShowSaved(true);
      savedTimerRef.current = setTimeout(() => setShowSaved(false), 1500);
    },
    [setAnswer]
  );

  // Estimated time: ~30 s per remaining question (2 questions per minute)
  const remainingQ = totalQuestions - currentIndex - 1;
  const minsLeft = Math.ceil(remainingQ * 0.5);
  const timeLabel =
    remainingQ <= 0
      ? "Almost done!"
      : minsLeft <= 1
      ? "< 1 min left"
      : `≈ ${minsLeft} min left`;

  // Reset inline error whenever the current question's answer changes
  const currentAnswer = answers[currentQuestion?.id];
  useEffect(() => {
    setShowError(false);
  }, [currentAnswer]);

  // ── Navigation handlers ────────────────────────────────────────────────────

  const handleNext = useCallback(() => {
    const validation = validateCurrentQuestion();
    if (!validation.valid) {
      setShowError(true);
      return;
    }
    setShowError(false);
    if (currentIndex === totalQuestions - 1) {
      setMode("review");
      return;
    }
    setDirection(1);
    next();
  }, [validateCurrentQuestion, currentIndex, totalQuestions, next]);

  const handlePrevious = useCallback(() => {
    if (mode === "review") {
      setMode("quiz");
      return;
    }
    setDirection(-1);
    previous();
  }, [mode, previous]);

  // Keep refs so the keyboard listener always calls the latest version
  const handleNextRef = useRef(handleNext);
  const handlePreviousRef = useRef(handlePrevious);
  handleNextRef.current = handleNext;
  handlePreviousRef.current = handlePrevious;

  // ── Keyboard support ───────────────────────────────────────────────────────

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Enter" || e.shiftKey) return;
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      // Let Enter work normally inside text fields
      if (tag === "input" && (e.target as HTMLInputElement).type === "text") return;
      if (tag === "textarea") return;
      if (mode === "quiz") handleNextRef.current();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode]);

  // ── Review screen callbacks ────────────────────────────────────────────────

  const handleEditQuestion = useCallback(
    (index: number) => {
      jumpToIndex(index);
      setDirection(0);
      setMode("quiz");
    },
    [jumpToIndex]
  );

  const handleConfirm = useCallback(() => {
    router.push("/summary");
  }, [router]);

  // ── Auto-advance (fires after single-choice selection delay) ──────────────

  const handleAutoAdvance = useCallback(() => {
    handleNextRef.current();
  }, []);

  // ── Guard: wait for localStorage restore ──────────────────────────────────

  if (!isHydrated) return <QuizSkeleton />;
  if (!currentQuestion) return <QuizSkeleton />;

  // ── Review mode ───────────────────────────────────────────────────────────

  if (mode === "review") {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col">
        <Header title="Review" showBack />
        <ReviewScreen
          activeQuestions={activeQuestions}
          answers={answers}
          onEdit={handleEditQuestion}
          onConfirm={handleConfirm}
          isComplete={isComplete()}
        />
      </div>
    );
  }

  // ── Quiz mode ─────────────────────────────────────────────────────────────

  const progress = getProgress();
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const validationError = showError ? validateCurrentQuestion().error : undefined;

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <Header title="Fit Quiz" showBack backHref="/" />

      {/* ARIA live region — announces saved state to screen readers */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {showSaved ? "Answer saved" : ""}
      </div>

      <main
        role="main"
        className="flex-1 flex flex-col max-w-md mx-auto w-full px-5 pt-5 pb-6"
      >

        {/* Progress section: "Question X of Y" + time-remaining / ✓ Saved */}
        <div className="flex flex-col gap-1.5 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-muted tabular-nums">
              Question {currentIndex + 1} of {totalQuestions}
            </span>

            <AnimatePresence mode="wait">
              {showSaved ? (
                <motion.span
                  key="saved"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center gap-1 text-xs font-semibold text-brand-success"
                  aria-hidden="true"
                >
                  <Check size={11} strokeWidth={3} />
                  Saved
                </motion.span>
              ) : (
                <motion.span
                  key="time"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="text-xs text-brand-faint"
                >
                  {timeLabel}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <ProgressBar
            value={progress}
            ariaLabel={`Question ${currentIndex + 1} of ${totalQuestions}`}
          />
        </div>

        {/* Animated question area */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                duration: prefersReduced ? 0.1 : 0.22,
                ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
              }}
              className="h-full"
            >
              <QuestionRenderer
                question={currentQuestion}
                answer={answers[currentQuestion.id]}
                onAnswer={setAnswerAndNotify}
                onAutoAdvance={handleAutoAdvance}
                error={validationError}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation bar */}
        <div className="mt-5 flex items-center gap-3">
          {/* Back */}
          <SecondaryButton
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            size="md"
            className="w-12 px-0 shrink-0"
            aria-label="Previous question"
          >
            <ArrowLeft size={16} aria-hidden="true" />
          </SecondaryButton>

          {/* Skip (weight only) */}
          {currentQuestion.skippable && (
            <SecondaryButton
              onClick={skipCurrentQuestion}
              size="md"
              className="shrink-0"
              aria-label="Skip this question"
            >
              <SkipForward size={14} strokeWidth={2.5} aria-hidden="true" />
              Skip
            </SecondaryButton>
          )}

          {/* Next / Review */}
          <PrimaryButton
            onClick={handleNext}
            size="md"
            fullWidth
            aria-label={isLastQuestion ? "Review all answers" : "Next question"}
          >
            {isLastQuestion ? "Review & submit" : "Next"}
            {!isLastQuestion && <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />}
          </PrimaryButton>
        </div>
      </main>
    </div>
  );
}
