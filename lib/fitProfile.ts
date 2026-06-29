import type {
  QuizAnswer,
  FitProfile,
  FitProfileBrand,
  FitProfileMeasurements,
  FitProfilePreferences,
} from "@/types";
import { DENIM_BRANDS } from "@/lib/constants";

const STORAGE_KEY = "jj_fit_profile";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getString(
  answers: Record<string, QuizAnswer>,
  id: string
): string | null {
  const a = answers[id];
  if (!a || a.skipped) return null;
  if (typeof a.value === "string" && a.value.trim()) return a.value.trim();
  return null;
}

// ─── Build ────────────────────────────────────────────────────────────────────

export function buildFitProfile(
  answers: Record<string, QuizAnswer>
): FitProfile {
  const measurements: FitProfileMeasurements = {
    height: getString(answers, "height"),
    weight: getString(answers, "weight"),
    waist: getString(answers, "waist"),
    hip: getString(answers, "hip"),
  };

  const preferences: FitProfilePreferences = {
    waistFit: getString(answers, "waistFit"),
    rise: getString(answers, "rise"),
    thighFit: getString(answers, "thighFit"),
  };

  const brandsAnswer = answers["brands"];
  const selectedIds: string[] =
    brandsAnswer &&
    !brandsAnswer.skipped &&
    Array.isArray(brandsAnswer.value)
      ? (brandsAnswer.value as string[])
      : [];

  const brands: FitProfileBrand[] = selectedIds
    .map((brandId) => {
      const meta = DENIM_BRANDS.find((b) => b.id === brandId);
      if (!meta) return null;
      const sizeAnswer = answers[`brandSize_${brandId}`];
      const size =
        sizeAnswer &&
        !sizeAnswer.skipped &&
        typeof sizeAnswer.value === "string" &&
        sizeAnswer.value
          ? sizeAnswer.value
          : "—";
      return { brandId, brandLabel: meta.label, size } satisfies FitProfileBrand;
    })
    .filter((b): b is FitProfileBrand => b !== null);

  return {
    measurements,
    preferences,
    brands,
    fitChallenge: getString(answers, "frustration"),
    confidenceScore: computeConfidenceScore(answers),
    completedAt: new Date().toISOString(),
  };
}

// ─── Confidence score ─────────────────────────────────────────────────────────
//
// Required questions contribute a base of 0–79.
// +10 if weight was voluntarily provided.
// +10 if previous brands were selected.
// Result clamped to [85, 99] so the score is always encouraging.

const REQUIRED_IDS = [
  "height",
  "waist",
  "hip",
  "waistFit",
  "rise",
  "thighFit",
  "frustration",
] as const;

export function computeConfidenceScore(
  answers: Record<string, QuizAnswer>
): number {
  const answered = REQUIRED_IDS.filter((id) => {
    const a = answers[id];
    if (!a || a.skipped) return false;
    if (Array.isArray(a.value)) return a.value.length > 0;
    return typeof a.value === "string" && a.value.trim() !== "";
  }).length;

  const base = Math.round((answered / REQUIRED_IDS.length) * 79);

  const weightBonus = (() => {
    const a = answers["weight"];
    return a && !a.skipped && typeof a.value === "string" && a.value.trim()
      ? 10
      : 0;
  })();

  const brandsBonus = (() => {
    const a = answers["brands"];
    return a && !a.skipped && Array.isArray(a.value) && a.value.length > 0
      ? 10
      : 0;
  })();

  return Math.max(85, Math.min(99, base + weightBonus + brandsBonus));
}

// ─── Persistence ──────────────────────────────────────────────────────────────

export function saveFitProfile(profile: FitProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // QuotaExceededError — non-fatal
  }
}

export function loadFitProfile(): FitProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FitProfile;
  } catch {
    return null;
  }
}

export function clearFitProfile(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
