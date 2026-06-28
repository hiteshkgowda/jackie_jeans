"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, SkipForward } from "lucide-react";
import { useQuiz } from "@/hooks/useQuiz";
import { Header, ProgressBar, PrimaryButton, SecondaryButton } from "@/components/ui";
import { QuestionRenderer, ReviewScreen } from "@/components/quiz";

type QuizMode = "quiz" | "review";

// ─── Slide transition variants ────────────────────────────────────────────────

const slideVariants = {
  enter: (d: number) => ({
    x: d === 0 ? 0 : d > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({
    x: d === 0 ? 0 : d > 0 ? -40 : 40,
    opacity: 0,
  }),
};

// ─── Loading skeleton ────────────────────────────────────────────────────────

function QuizSkeleton() {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <Header title="Fit Quiz" showBack backHref="/" />
      <main className="flex-1 flex flex-col max-w-md mx-auto w-full px-5 pt-5 pb-6 gap-5">
        <div className="h-1.5 w-full rounded-full bg-stone-100 animate-pulse" />
        <div className="h-8 w-3/4 rounded-xl bg-stone-100 animate-pulse mt-2" />
        <div className="h-4 w-full rounded-lg bg-stone-100/70 animate-pulse" />
        <div className="flex flex-col gap-2 mt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 rounded-2xl bg-stone-100 animate-pulse" />
          ))}
        </div>
      </main>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

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

  const [mode, setMode] = useState<QuizMode>("quiz");
  const [direction, setDirection] = useState(1);
  const [showError, setShowError] = useState(false);

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
      <div className="min-h-screen bg-stone-50 flex flex-col">
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
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <Header title="Fit Quiz" showBack backHref="/" />

      <main className="flex-1 flex flex-col max-w-md mx-auto w-full px-5 pt-5 pb-6">

        {/* Progress bar + counter */}
        <div className="flex items-center gap-3 mb-6">
          <ProgressBar value={progress} className="flex-1" />
          <span className="text-xs font-semibold text-stone-400 shrink-0 tabular-nums">
            {currentIndex + 1} / {totalQuestions}
          </span>
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
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
              className="h-full"
            >
              <QuestionRenderer
                question={currentQuestion}
                answer={answers[currentQuestion.id]}
                onAnswer={setAnswer}
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
            aria-label="Go back"
          >
            <ArrowLeft size={16} />
          </SecondaryButton>

          {/* Skip (weight only) */}
          {currentQuestion.skippable && (
            <SecondaryButton
              onClick={skipCurrentQuestion}
              size="md"
              className="shrink-0"
            >
              <SkipForward size={14} strokeWidth={2.5} />
              Skip
            </SecondaryButton>
          )}

          {/* Next / Review */}
          <PrimaryButton
            onClick={handleNext}
            size="md"
            fullWidth
          >
            {isLastQuestion ? "Review answers" : "Next"}
            {!isLastQuestion && <ArrowRight size={16} strokeWidth={2.5} />}
          </PrimaryButton>
        </div>
      </main>
    </div>
  );
}
