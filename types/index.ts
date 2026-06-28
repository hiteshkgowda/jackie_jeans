// ─── Question taxonomy ────────────────────────────────────────────────────────

export type QuestionType =
  | "dropdown"       // height, waist, hip — scrollable list
  | "number-input"   // weight — free numeric entry
  | "single-select"  // waist fit, rise, thigh fit, frustration
  | "multi-select"   // denim brands
  | "brand-size";    // injected dynamically per selected brand

// ─── Structural types ─────────────────────────────────────────────────────────

export interface QuizOption {
  id: string;
  label: string;
  value: string;
  icon?: string;
}

export interface QuizQuestion {
  id: string;
  /** Base ordering number; display step is derived from active-question index */
  step: number;
  type: QuestionType;
  question: string;
  description?: string;
  options?: QuizOption[];
  /** Only weight may be skipped */
  skippable?: boolean;
  /** True for brand-size questions generated at runtime */
  conditional?: boolean;
  /** Brand id this size question belongs to (brand-size only) */
  brandId?: string;
  placeholder?: string;
  inputUnit?: string;
}

// ─── Answer & state ───────────────────────────────────────────────────────────

export interface QuizAnswer {
  questionId: string;
  value: string | string[];
  /** True when user explicitly skipped a skippable question */
  skipped?: boolean;
}

export interface BrandSelection {
  brandId: string;
  brandLabel: string;
  size: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface QuizState {
  answers: Record<string, QuizAnswer>;
  currentIndex: number;
  /** Bump when schema changes so stale persisted state is discarded */
  version: number;
}

// ─── Output profile ───────────────────────────────────────────────────────────

export interface FitProfile {
  answers: Record<string, QuizAnswer>;
  completedAt?: string;
}
