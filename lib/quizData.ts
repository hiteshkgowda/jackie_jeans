import type { QuizQuestion, QuizOption } from "@/types";
import {
  HEIGHTS,
  WAIST_SIZES,
  HIP_SIZES,
  DENIM_BRANDS,
  WAIST_FIT_OPTIONS,
  RISE_OPTIONS,
  THIGH_FIT_OPTIONS,
  FRUSTRATION_OPTIONS,
  type FitOption,
} from "@/lib/constants";

function fitOptionToQuizOption(o: FitOption): QuizOption {
  return { id: o.id, label: o.label, value: o.value };
}

/**
 * The 9 base questions in display order.
 * Brand-size questions (Q9+) are injected dynamically by quizEngine
 * based on which brands the user selects in question "brands".
 */
export const BASE_QUESTIONS: QuizQuestion[] = [
  {
    id: "height",
    step: 1,
    type: "dropdown",
    question: "How tall are you?",
    description: "We use this to calculate your ideal inseam length.",
    options: HEIGHTS.map((h) => ({ id: h.value, label: h.label, value: h.value })),
  },
  {
    id: "weight",
    step: 2,
    type: "number-input",
    question: "How much do you weigh?",
    description: "Optional — helps us recommend the right fabric weight and stretch.",
    skippable: true,
    placeholder: "e.g. 145",
    inputUnit: "lbs",
  },
  {
    id: "waist",
    step: 3,
    type: "dropdown",
    question: "What is your waist measurement?",
    description: "Measure around your natural waistline in inches.",
    options: WAIST_SIZES.map((w) => ({ id: w, label: `${w}"`, value: w })),
  },
  {
    id: "hip",
    step: 4,
    type: "dropdown",
    question: "What are your hip measurements?",
    description: "Measure around the fullest part of your hips in inches.",
    options: HIP_SIZES.map((h) => ({ id: h, label: `${h}"`, value: h })),
  },
  {
    id: "waistFit",
    step: 5,
    type: "single-select",
    question: "How do you like your waist to fit?",
    description: "This shapes how the jeans sit at your waistline.",
    options: WAIST_FIT_OPTIONS.map(fitOptionToQuizOption),
  },
  {
    id: "rise",
    step: 6,
    type: "single-select",
    question: "What rise do you prefer?",
    description: "Rise is the distance from the crotch seam to the waistband.",
    options: RISE_OPTIONS.map(fitOptionToQuizOption),
  },
  {
    id: "thighFit",
    step: 7,
    type: "single-select",
    question: "How do you like your thighs to fit?",
    description: "This determines the cut through the upper leg.",
    options: THIGH_FIT_OPTIONS.map(fitOptionToQuizOption),
  },
  {
    id: "brands",
    step: 8,
    type: "multi-select",
    question: "Which denim brands have you worn before?",
    description:
      "Select all that apply. We'll cross-reference sizing data from brands you already know.",
    options: DENIM_BRANDS.map((b) => ({ id: b.id, label: b.label, value: b.id })),
  },
  // ↑ Brand-size questions are injected here at runtime by buildActiveQuestions()
  {
    id: "frustration",
    step: 9,
    type: "single-select",
    question: "What is your biggest fit frustration?",
    description: "We'll prioritize solving this in your final recommendation.",
    options: FRUSTRATION_OPTIONS.map(fitOptionToQuizOption),
  },
];
