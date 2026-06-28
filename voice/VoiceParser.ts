// Converts spoken language into valid quiz answer values.
// All functions are pure — no React, no side effects.

import type { QuizQuestion } from "@/types";
import { WAIST_SIZES, HIP_SIZES, JEAN_SIZES, HEIGHTS } from "@/lib/constants";

// ─── Number word map ──────────────────────────────────────────────────────────

const NUM_WORDS: Record<string, number> = {
  zero: 0, oh: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100,
};

function wordsToNumber(text: string): number | null {
  // Direct digit parse (handles "28", "145", etc.)
  const digits = text.replace(/[^0-9]/g, "");
  if (digits.length > 0) {
    const n = parseInt(digits, 10);
    if (!isNaN(n)) return n;
  }

  // Word accumulation
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  let total = 0;
  let current = 0;

  for (const word of words) {
    if (word === "and" || word === "about" || word === "approximately" || word === "around") continue;
    const n = NUM_WORDS[word];
    if (n === undefined) continue;
    if (n === 100) {
      current = current === 0 ? 100 : current * 100;
    } else if (n >= 10) {
      current += n;
    } else {
      current += n;
    }
  }

  total += current;
  return total > 0 ? total : null;
}

// ─── Skip detection ────────────────────────────────────────────────────────────

const SKIP_TRIGGERS = [
  "skip", "pass", "rather not say", "no thanks", "no thank you",
  "i'd rather not", "prefer not", "next", "skip it", "skip this",
];

export function isSkipCommand(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return SKIP_TRIGGERS.some((t) => lower.includes(t));
}

// ─── Height parser ────────────────────────────────────────────────────────────

function parseHeight(text: string): string | null {
  const lower = text.toLowerCase();

  // Numeric shorthand: "5'6", "5 6", "56" (ambiguous — skip), "5foot6"
  const numericMatch = lower.match(/(\d)\s*[''`]?\s*(\d{1,2})/);
  if (numericMatch) {
    const ft = parseInt(numericMatch[1]);
    const ins = parseInt(numericMatch[2]);
    const label = `${ft}'${ins}"`;
    if (HEIGHTS.some((h) => h.value === label)) return label;
  }

  // Word form: "five foot six", "five six", "five feet six inches"
  const words = lower.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  const SKIP_HEIGHT_WORDS = new Set(["foot", "feet", "ft", "inch", "inches", "in", "and"]);

  const nums: number[] = [];
  for (const w of words) {
    if (SKIP_HEIGHT_WORDS.has(w)) continue;
    const n = NUM_WORDS[w] ?? (isNaN(parseInt(w)) ? undefined : parseInt(w));
    if (n !== undefined) nums.push(n);
  }

  if (nums.length >= 2) {
    const [ft, ins] = nums;
    const label = `${ft}'${ins}"`;
    if (HEIGHTS.some((h) => h.value === label)) return label;
  }
  if (nums.length === 1) {
    // "five foot" with implied zero inches
    const label = `${nums[0]}'0"`;
    if (HEIGHTS.some((h) => h.value === label)) return label;
  }

  return null;
}

// ─── Generic numeric measurement ─────────────────────────────────────────────

function parseMeasurement(text: string, validValues: string[]): string | null {
  const n = wordsToNumber(text);
  if (n === null) return null;
  const s = String(n);
  return validValues.includes(s) ? s : null;
}

// ─── Single-select option matcher ─────────────────────────────────────────────

const RISE_ALIASES: Record<string, string> = {
  "low rise": "low", "low-rise": "low", low: "low",
  "mid rise": "mid", "mid-rise": "mid", mid: "mid", middle: "mid",
  "middle rise": "mid",
  "high rise": "high", "high-rise": "high", high: "high",
  "ultra high rise": "ultrahigh", "ultra high": "ultrahigh", ultra: "ultrahigh",
  "super high": "ultrahigh", "very high": "ultrahigh",
};

const FRUSTRATION_ALIASES: Record<string, string> = {
  "waist gap": "waistgap", "gap at waist": "waistgap", "back gap": "waistgap",
  "gap in the back": "waistgap", "waistband gap": "waistgap",
  "thighs tight": "thightight", "tight thighs": "thightight",
  "too tight in thighs": "thightight", "thigh too tight": "thightight",
  "too short": "length", "too long": "length", "wrong length": "length",
  length: "length", inseam: "length",
  gapes: "gape", "gap at back": "gape", "gapes at back": "gape",
  "pulls away": "gape",
  inconsistent: "inconsistent", "sizing inconsistent": "inconsistent",
  "different sizes": "inconsistent",
  stiff: "stiff", "too stiff": "stiff", "not soft": "stiff",
  other: "other", "something else": "other",
};

function parseOptionValue(question: QuizQuestion, text: string): string | null {
  if (!question.options) return null;
  const lower = text.toLowerCase().trim();

  // Exact value / label match
  for (const opt of question.options) {
    if (lower === opt.value.toLowerCase() || lower === opt.label.toLowerCase()) {
      return opt.value;
    }
  }

  // Contains match (label or value contained in speech)
  for (const opt of question.options) {
    const v = opt.value.toLowerCase();
    const l = opt.label.toLowerCase();
    if (lower.includes(v) || lower.includes(l) || v.includes(lower) || l.includes(lower)) {
      return opt.value;
    }
  }

  // Domain-specific alias maps
  if (question.id === "rise") {
    const mapped = RISE_ALIASES[lower];
    if (mapped && question.options.some((o) => o.value === mapped)) return mapped;
  }
  if (question.id === "frustration") {
    for (const [alias, val] of Object.entries(FRUSTRATION_ALIASES)) {
      if (lower.includes(alias)) {
        if (question.options.some((o) => o.value === val)) return val;
      }
    }
  }

  return null;
}

// ─── Brand parser ─────────────────────────────────────────────────────────────

const BRAND_ALIASES: Record<string, string> = {
  "levi's": "levis", levis: "levis", levi: "levis", "levy's": "levis", levies: "levis",
  wrangler: "wrangler", wranglers: "wrangler",
  lee: "lee",
  "calvin klein": "calvinklein", calvin: "calvinklein", ck: "calvinklein",
  "tommy hilfiger": "tommyhilfiger", tommy: "tommyhilfiger", hilfiger: "tommyhilfiger",
  gap: "gap",
  "banana republic": "bananarepublic", banana: "bananarepublic",
  "h&m": "hm", hm: "hm", "h and m": "hm", "h n m": "hm",
  zara: "zara",
  agolde: "agolde", "a golde": "agolde",
  madewell: "madewell", "made well": "madewell",
  frame: "frame",
  "7 for all mankind": "7forallmankind",
  "seven for all mankind": "7forallmankind",
  "7fam": "7forallmankind",
  "true religion": "truereligion",
  everlane: "everlane", "ever lane": "everlane",
  paige: "paige",
  "citizens of humanity": "citizensofhumanity",
  citizens: "citizensofhumanity",
  coh: "citizensofhumanity",
  "good american": "goodamerican",
  "mother denim": "motherdenim",
  mother: "motherdenim",
  "rag and bone": "raganbone",
  "rag & bone": "raganbone",
  "rag bone": "raganbone",
  "rag n bone": "raganbone",
};

function parseBrands(text: string): string[] | null {
  const lower = text
    .toLowerCase()
    .replace(/\band\b/g, " ")
    .replace(/[,&]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const found = new Set<string>();

  // Sort aliases by length (longest first) for greedy matching
  const sorted = Object.entries(BRAND_ALIASES).sort((a, b) => b[0].length - a[0].length);

  let remaining = lower;
  for (const [alias, brandId] of sorted) {
    if (remaining.includes(alias)) {
      found.add(brandId);
      remaining = remaining.split(alias).join(" ");
    }
  }

  return found.size > 0 ? Array.from(found) : null;
}

// ─── Jean size parser ─────────────────────────────────────────────────────────

const LETTER_SIZE_ALIASES: Record<string, string> = {
  "extra small": "XS", "x small": "XS", xs: "XS",
  small: "S", s: "S",
  medium: "M", m: "M",
  large: "L", l: "L",
  "extra large": "XL", "x large": "XL", xl: "XL",
  "double extra large": "XXL", "double xl": "XXL", xxl: "XXL", "2xl": "XXL",
  "double zero": "00", "size double zero": "00",
  zero: "0", "size zero": "0",
};

function parseJeanSize(text: string): string | null {
  const lower = text.toLowerCase().trim();

  // Letter aliases (check longest first)
  const sorted = Object.entries(LETTER_SIZE_ALIASES).sort((a, b) => b[0].length - a[0].length);
  for (const [alias, size] of sorted) {
    if (lower === alias || lower.includes(alias)) return size;
  }

  // Numeric
  const n = wordsToNumber(text);
  if (n !== null) {
    const s = String(n);
    if (JEAN_SIZES.includes(s)) return s;
  }

  return null;
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export function parseVoiceAnswer(
  question: QuizQuestion,
  spokenText: string
): string | string[] | null {
  const text = spokenText.trim();
  if (!text) return null;

  switch (question.type) {
    case "dropdown":
      if (question.id === "height") return parseHeight(text);
      if (question.id === "waist") return parseMeasurement(text, WAIST_SIZES);
      if (question.id === "hip") return parseMeasurement(text, HIP_SIZES);
      return null;

    case "number-input":
      return wordsToNumber(text) !== null ? String(wordsToNumber(text)!) : null;

    case "single-select":
      return parseOptionValue(question, text);

    case "multi-select":
      return parseBrands(text);

    case "brand-size":
      return parseJeanSize(text);

    default:
      return null;
  }
}
