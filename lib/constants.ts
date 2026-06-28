// ─── Heights: 4'10" → 6'2" ───────────────────────────────────────────────────

function buildHeightEntries(): Array<{ value: string; label: string }> {
  const entries: Array<[number, number]> = [];
  for (let in4 = 10; in4 <= 11; in4++) entries.push([4, in4]);
  for (let in5 = 0; in5 <= 11; in5++) entries.push([5, in5]);
  for (let in6 = 0; in6 <= 2; in6++) entries.push([6, in6]);
  return entries.map(([ft, ins]) => ({
    value: `${ft}'${ins}"`,
    label: `${ft}'${ins}"`,
  }));
}

export const HEIGHTS = buildHeightEntries();
// 17 entries: 4'10", 4'11", 5'0" … 6'2"

// ─── Waist: 24–52 inches ─────────────────────────────────────────────────────

export const WAIST_SIZES: string[] = Array.from(
  { length: 29 },
  (_, i) => String(24 + i)
);

// ─── Hip: 32–60 inches ───────────────────────────────────────────────────────

export const HIP_SIZES: string[] = Array.from(
  { length: 29 },
  (_, i) => String(32 + i)
);

// ─── Denim brands ────────────────────────────────────────────────────────────

export const DENIM_BRANDS: Array<{ id: string; label: string }> = [
  { id: "levis", label: "Levi's" },
  { id: "wrangler", label: "Wrangler" },
  { id: "lee", label: "Lee" },
  { id: "calvinklein", label: "Calvin Klein" },
  { id: "tommyhilfiger", label: "Tommy Hilfiger" },
  { id: "gap", label: "Gap" },
  { id: "bananarepublic", label: "Banana Republic" },
  { id: "hm", label: "H&M" },
  { id: "zara", label: "Zara" },
  { id: "agolde", label: "AGOLDE" },
  { id: "madewell", label: "Madewell" },
  { id: "frame", label: "Frame" },
  { id: "7forallmankind", label: "7 For All Mankind" },
  { id: "truereligion", label: "True Religion" },
  { id: "everlane", label: "Everlane" },
  { id: "paige", label: "Paige" },
  { id: "citizensofhumanity", label: "Citizens of Humanity" },
  { id: "goodamerican", label: "Good American" },
  { id: "motherdenim", label: "Mother Denim" },
  { id: "raganbone", label: "Rag & Bone" },
];

// ─── Jean sizes (combined sizing systems) ────────────────────────────────────

export const JEAN_SIZES: string[] = [
  // Letter sizes
  "XS", "S", "M", "L", "XL", "XXL",
  // Women's dress sizes
  "00", "0", "2", "4", "6", "8", "10", "12", "14", "16",
  // Numeric waist sizes
  "24", "25", "26", "27", "28", "29", "30",
  "31", "32", "33", "34", "36", "38", "40",
];

// ─── Fit preference options ───────────────────────────────────────────────────

export interface FitOption {
  id: string;
  label: string;
  value: string;
  description: string;
}

export const WAIST_FIT_OPTIONS: FitOption[] = [
  {
    id: "snug",
    label: "Snug",
    value: "snug",
    description: "Sits close with no gap — needs a belt only occasionally",
  },
  {
    id: "fitted",
    label: "Fitted",
    value: "fitted",
    description: "Comfortable hold with slight give at the waistband",
  },
  {
    id: "relaxed",
    label: "Relaxed",
    value: "relaxed",
    description: "Loose around the waist — extra room to move",
  },
  {
    id: "loose",
    label: "Loose",
    value: "loose",
    description: "Very roomy — intentionally baggy fit",
  },
];

export const RISE_OPTIONS: FitOption[] = [
  {
    id: "low",
    label: "Low Rise",
    value: "low",
    description: "Sits below the hip bone — shows midriff",
  },
  {
    id: "mid",
    label: "Mid Rise",
    value: "mid",
    description: "Sits at the hip — the classic everyday rise",
  },
  {
    id: "high",
    label: "High Rise",
    value: "high",
    description: "Sits at the natural waist — elongates legs",
  },
  {
    id: "ultrahigh",
    label: "Ultra High Rise",
    value: "ultrahigh",
    description: "Sits above the natural waist — maximum coverage",
  },
];

export const THIGH_FIT_OPTIONS: FitOption[] = [
  {
    id: "slim",
    label: "Slim",
    value: "slim",
    description: "Close to the leg with minimal extra fabric",
  },
  {
    id: "regular",
    label: "Regular",
    value: "regular",
    description: "Balanced fit — not too tight, not too loose",
  },
  {
    id: "relaxed",
    label: "Relaxed",
    value: "relaxed",
    description: "Generous room through the thigh",
  },
  {
    id: "wide",
    label: "Wide",
    value: "wide",
    description: "Extra roomy — wide-leg silhouette from the hip",
  },
];

export const FRUSTRATION_OPTIONS: FitOption[] = [
  {
    id: "waistgap",
    label: "Waist Gap",
    value: "waistgap",
    description: "Gap at the back waistband when sitting or bending",
  },
  {
    id: "thightight",
    label: "Thighs Too Tight",
    value: "thightight",
    description: "Fits the waist but strains across the thighs",
  },
  {
    id: "length",
    label: "Wrong Length",
    value: "length",
    description: "Always too short or too long in the leg",
  },
  {
    id: "gape",
    label: "Gapes at Back",
    value: "gape",
    description: "Waistband pulls away from the body at the rear",
  },
  {
    id: "inconsistent",
    label: "Inconsistent Sizing",
    value: "inconsistent",
    description: "Same size fits differently across brands",
  },
  {
    id: "stiff",
    label: "Fabric Too Stiff",
    value: "stiff",
    description: "Denim doesn't soften or move with the body",
  },
  {
    id: "other",
    label: "Other",
    value: "other",
    description: "Something else not listed above",
  },
];
