export interface QuizQuestion {
  id: string;
  step: number;
  question: string;
  description?: string;
  options: QuizOption[];
  type: "single" | "multi" | "input";
}

export interface QuizOption {
  id: string;
  label: string;
  value: string;
  icon?: string;
}

export interface QuizAnswer {
  questionId: string;
  value: string | string[];
}

export interface FitProfile {
  answers: QuizAnswer[];
  completedAt?: Date;
}
