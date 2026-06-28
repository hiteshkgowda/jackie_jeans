import type { QuizQuestion, QuizAnswer, ValidationResult } from "@/types";
import { DENIM_BRANDS, JEAN_SIZES } from "@/lib/constants";

// ─── Dynamic question list ────────────────────────────────────────────────────

/**
 * Build the ordered list of active questions.
 * Brand-size questions are spliced in immediately after the "brands" question
 * based on which brands the user has selected.
 */
export function buildActiveQuestions(
  baseQuestions: QuizQuestion[],
  answers: Record<string, QuizAnswer>
): QuizQuestion[] {
  const active: QuizQuestion[] = [];

  for (const q of baseQuestions) {
    active.push(q);

    if (q.id === "brands") {
      const brandsAnswer = answers["brands"];
      const selectedIds: string[] =
        brandsAnswer && !brandsAnswer.skipped && Array.isArray(brandsAnswer.value)
          ? (brandsAnswer.value as string[])
          : [];

      for (const brandId of selectedIds) {
        const brand = DENIM_BRANDS.find((b) => b.id === brandId);
        if (!brand) continue;
        active.push({
          id: `brandSize_${brandId}`,
          step: 0, // display step computed from array index in the hook
          type: "brand-size",
          question: `What size do you wear in ${brand.label}?`,
          description: "This helps us calibrate your fit across different sizing systems.",
          conditional: true,
          brandId,
          options: JEAN_SIZES.map((s) => ({ id: s, label: s, value: s })),
        });
      }
    }
  }

  return active;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function validateAnswer(
  question: QuizQuestion,
  answer: QuizAnswer | undefined
): ValidationResult {
  // Skippable questions are always valid (weight)
  if (question.skippable) {
    return { valid: true };
  }

  if (!answer || answer.skipped) {
    return { valid: false, error: "Please answer this question to continue." };
  }

  // Multi-select: at least one option required
  if (Array.isArray(answer.value)) {
    if (answer.value.length === 0) {
      return { valid: false, error: "Please select at least one option." };
    }
    return { valid: true };
  }

  const raw = answer.value as string;

  if (!raw || raw.trim() === "") {
    return { valid: false, error: "Please answer this question to continue." };
  }

  // Numeric input: must be a positive number
  if (question.type === "number-input") {
    const num = Number(raw.trim());
    if (isNaN(num) || num <= 0) {
      return { valid: false, error: "Please enter a valid positive number." };
    }
  }

  return { valid: true };
}

// ─── Completion check ─────────────────────────────────────────────────────────

/**
 * Returns true only when every active question has a valid answer.
 */
export function computeIsComplete(
  activeQuestions: QuizQuestion[],
  answers: Record<string, QuizAnswer>
): boolean {
  if (activeQuestions.length === 0) return false;
  return activeQuestions.every((q) => validateAnswer(q, answers[q.id]).valid);
}

// ─── Progress ─────────────────────────────────────────────────────────────────

/**
 * Returns a 0-100 integer representing how far through the quiz the user is.
 * Based on the number of validly answered questions (not current position)
 * so the bar fills as answers are given, not just as pages are visited.
 */
export function computeProgress(
  activeQuestions: QuizQuestion[],
  answers: Record<string, QuizAnswer>
): number {
  if (activeQuestions.length === 0) return 0;
  const answered = activeQuestions.filter(
    (q) => validateAnswer(q, answers[q.id]).valid
  ).length;
  return Math.round((answered / activeQuestions.length) * 100);
}
