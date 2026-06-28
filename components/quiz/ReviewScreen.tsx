"use client";

import { motion } from "framer-motion";
import { Pencil, CheckCircle2 } from "lucide-react";
import type { QuizQuestion, QuizAnswer } from "@/types";
import { PrimaryButton, SecondaryButton, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ReviewScreenProps {
  activeQuestions: QuizQuestion[];
  answers: Record<string, QuizAnswer>;
  onEdit: (index: number) => void;
  onConfirm: () => void;
  isComplete: boolean;
}

// ─── Answer formatting ────────────────────────────────────────────────────────

function formatAnswerValue(question: QuizQuestion, answer: QuizAnswer | undefined): string {
  if (!answer) return "—";
  if (answer.skipped) return "Skipped";

  if (Array.isArray(answer.value)) {
    if (answer.value.length === 0) return "None selected";
    return answer.value
      .map((v) => question.options?.find((o) => o.value === v)?.label ?? v)
      .join(", ");
  }

  const v = answer.value as string;
  if (!v || v.trim() === "") return "—";

  // Look up the option label if available
  const opt = question.options?.find((o) => o.value === v);
  if (opt) return opt.label;

  // Number input with unit (weight)
  if (question.inputUnit) return `${v} ${question.inputUnit}`;

  // Custom "other" text
  return v;
}

function isAnswered(question: QuizQuestion, answer: QuizAnswer | undefined): boolean {
  if (!answer) return false;
  if (answer.skipped) return true;
  if (Array.isArray(answer.value)) return answer.value.length > 0;
  return !!(answer.value as string)?.trim();
}

// ─── Short titles for review list ────────────────────────────────────────────

function shortTitle(question: QuizQuestion): string {
  const map: Record<string, string> = {
    height: "Height",
    weight: "Weight",
    waist: "Waist",
    hip: "Hip",
    waistFit: "Waist fit",
    rise: "Rise",
    thighFit: "Thigh fit",
    brands: "Brands worn",
    frustration: "Fit frustration",
  };
  if (question.id in map) return map[question.id];
  // Brand-size questions: "brandSize_levis" → handled via question.question
  if (question.type === "brand-size") {
    // Extract brand name from question text: "What size do you wear in Levi's?"
    const match = question.question.match(/in (.+)\?$/);
    return match ? `${match[1]} size` : "Brand size";
  }
  return question.question;
}

// ─── Component ────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.04,
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

export function ReviewScreen({
  activeQuestions,
  answers,
  onEdit,
  onConfirm,
  isComplete,
}: ReviewScreenProps) {
  return (
    <main className="flex-1 flex flex-col max-w-md mx-auto w-full px-5 py-6 gap-5 pb-10">
      {/* Header block */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-1"
      >
        <h2 className="text-xl font-bold tracking-tight text-stone-900">
          Review your answers
        </h2>
        <p className="text-sm text-stone-500">
          Make sure everything looks right before we find your perfect fit.
        </p>
      </motion.div>

      {/* Answers list */}
      <Card padding="sm" className="overflow-hidden p-0">
        {activeQuestions.map((question, index) => {
          const answer = answers[question.id];
          const answered = isAnswered(question, answer);
          const displayValue = formatAnswerValue(question, answer);
          const isBrandGroup = question.type === "brand-size";

          return (
            <motion.div
              key={question.id}
              custom={index}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className={cn(
                "flex items-start justify-between px-4 py-3.5",
                "border-b border-stone-50 last:border-0",
                isBrandGroup && "bg-stone-50/60 pl-6"
              )}
            >
              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                {/* Answered indicator */}
                <div className="mt-0.5 shrink-0">
                  {answered ? (
                    <CheckCircle2
                      size={14}
                      className="text-stone-400"
                      strokeWidth={2}
                    />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-stone-200" />
                  )}
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide leading-none">
                    {shortTitle(question)}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-medium leading-snug break-words",
                      answered ? "text-stone-900" : "text-stone-300 italic"
                    )}
                  >
                    {answered ? displayValue : "Not answered"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onEdit(index)}
                aria-label={`Edit ${shortTitle(question)}`}
                className="ml-3 shrink-0 flex items-center gap-1 text-xs font-medium text-stone-400 hover:text-stone-700 transition-colors duration-150 py-0.5"
              >
                <Pencil size={11} strokeWidth={2.5} />
                Edit
              </button>
            </motion.div>
          );
        })}
      </Card>

      {/* Completion status */}
      {!isComplete && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-amber-600 font-medium text-center"
        >
          Some questions are still unanswered. You can edit them above or continue anyway.
        </motion.p>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="mt-auto flex flex-col gap-3"
      >
        <PrimaryButton
          onClick={onConfirm}
          fullWidth
          size="lg"
          className="py-4"
        >
          Confirm & Continue
        </PrimaryButton>
        <SecondaryButton
          onClick={() => onEdit(0)}
          fullWidth
          size="md"
        >
          Keep editing
        </SecondaryButton>
      </motion.div>
    </main>
  );
}
