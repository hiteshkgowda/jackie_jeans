"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useQuiz } from "@/hooks/useQuiz";
import {
  buildFitProfile,
  saveFitProfile,
  loadFitProfile,
  clearFitProfile,
} from "@/lib/fitProfile";
import {
  WAIST_FIT_OPTIONS,
  RISE_OPTIONS,
  THIGH_FIT_OPTIONS,
  FRUSTRATION_OPTIONS,
} from "@/lib/constants";
import { Header, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { FitProfile, FitProfileBrand } from "@/types";

// ─── Animation variant ────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.13,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

// ─── Label resolvers ──────────────────────────────────────────────────────────

function label<T extends { value: string; label: string }>(
  options: T[],
  value: string | null
): string | null {
  if (!value) return null;
  return options.find((o) => o.value === value)?.label ?? value;
}

function measurementDisplay(value: string | null, unit: string): string {
  if (!value) return "—";
  return `${value}${unit}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold tracking-widest uppercase text-brand-denim/70 mb-4">
      {children}
    </p>
  );
}

function ProfileRow({
  label: rowLabel,
  value,
  skipped,
}: {
  label: string;
  value: string | null;
  skipped?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-brand-border/60 last:border-0">
      <span className="text-sm font-medium text-brand-muted">{rowLabel}</span>
      <span
        className={cn(
          "text-sm font-semibold",
          skipped || !value ? "text-brand-faint italic" : "text-brand-text"
        )}
      >
        {skipped ? "Skipped" : (value ?? "—")}
      </span>
    </div>
  );
}

// ─── Confidence ring ──────────────────────────────────────────────────────────

function ConfidenceRing({ score }: { score: number }) {
  const r = 44;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="relative flex items-center justify-center w-[110px] h-[110px] shrink-0">
      <svg
        width="110"
        height="110"
        viewBox="0 0 110 110"
        className="absolute inset-0"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx="55"
          cy="55"
          r={r}
          fill="none"
          stroke="#E8E3DC"
          strokeWidth="8"
        />
        {/* Filled arc — rotated so 0% starts at 12 o'clock */}
        <g transform="rotate(-90 55 55)">
          <motion.circle
            cx="55"
            cy="55"
            r={r}
            fill="none"
            stroke="#355C7D"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{
              duration: 1.4,
              delay: 0.25,
              ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
            }}
          />
        </g>
      </svg>
      {/* Centred score label */}
      <div className="flex flex-col items-center leading-none select-none">
        <span className="text-2xl font-black text-brand-denim tabular-nums">
          {score}
        </span>
        <span className="text-xs font-bold text-brand-faint mt-0.5">%</span>
      </div>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <Header title="Your Fit Profile" />
      <main className="flex-1 max-w-md mx-auto w-full px-5 py-6 flex flex-col gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-3xl bg-brand-surface border border-brand-border p-6 animate-pulse"
          >
            <div className="h-3 w-24 bg-brand-border rounded-full mb-4" />
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex justify-between">
                  <div className="h-3 w-20 bg-brand-border rounded-full" />
                  <div className="h-3 w-12 bg-brand-border rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SummaryPage() {
  const quiz = useQuiz();
  const router = useRouter();
  const [profile, setProfile] = useState<FitProfile | null>(null);

  // Load or build the fit profile once the quiz is hydrated
  useEffect(() => {
    if (!quiz.isHydrated) return;

    // Returning user: profile already exists — show it immediately
    const cached = loadFitProfile();
    if (cached) {
      setProfile(cached);
      return;
    }

    // Fresh completion: build from quiz answers
    const hasAnswers = Object.keys(quiz.answers).length > 0;
    if (!hasAnswers) {
      router.push("/");
      return;
    }

    const fp = buildFitProfile(quiz.answers);
    saveFitProfile(fp);
    setProfile(fp);
  }, [quiz.isHydrated, quiz.answers, router]);

  function handleStartOver() {
    quiz.resetQuiz();
    clearFitProfile();
    router.push("/");
  }

  if (!profile) return <Skeleton />;

  // ── Resolved display values ──────────────────────────────────────────────
  const { measurements, preferences, brands, fitChallenge, confidenceScore } =
    profile;

  const waistFitLabel = label(WAIST_FIT_OPTIONS, preferences.waistFit);
  const riseLabel = label(RISE_OPTIONS, preferences.rise);
  const thighFitLabel = label(THIGH_FIT_OPTIONS, preferences.thighFit);
  const frustrationLabel = label(FRUSTRATION_OPTIONS, fitChallenge);

  const weightSkipped =
    !quiz.answers["weight"]?.value ||
    quiz.answers["weight"]?.skipped === true ||
    measurements.weight === null;

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <Header title="Your Fit Profile" />

      <main className="flex-1 max-w-md mx-auto w-full px-5 py-6 flex flex-col gap-5">

        {/* ── Success header ──────────────────────────────────────────── */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center text-center pt-4 pb-2"
        >
          <div className="w-16 h-16 rounded-full bg-brand-denim flex items-center justify-center mb-4 shadow-[0_4px_16px_rgba(53,92,125,0.35)]">
            <CheckCircle2 size={30} className="text-white" strokeWidth={1.75} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-brand-text mb-2">
            You&apos;re all set!
          </h1>
          <p className="text-sm text-brand-muted leading-relaxed max-w-xs">
            We&apos;ve created your personal fit profile. You&apos;re ready for
            personalized denim recommendations.
          </p>
        </motion.div>

        {/* ── Confidence score ────────────────────────────────────────── */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show">
          <Card padding="md">
            <SectionLabel>Fit Profile Confidence</SectionLabel>
            <div className="flex items-center gap-5">
              <ConfidenceRing score={confidenceScore} />
              <div className="flex-1 flex flex-col gap-2">
                <p className="text-3xl font-black text-brand-denim leading-none tabular-nums">
                  {confidenceScore}
                  <span className="text-lg font-bold text-brand-faint ml-0.5">
                    %
                  </span>
                </p>
                {/* Thin bar for secondary visual */}
                <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden w-full">
                  <motion.div
                    className="h-full rounded-full bg-brand-denim"
                    initial={{ width: 0 }}
                    animate={{ width: `${confidenceScore}%` }}
                    transition={{
                      duration: 1.2,
                      delay: 0.3,
                      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
                    }}
                  />
                </div>
                <p className="text-xs text-brand-faint leading-relaxed">
                  This score reflects how complete your fit profile is.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ── Measurements ───────────────────────────────────────────── */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show">
          <Card padding="md">
            <SectionLabel>Measurements</SectionLabel>
            <div className="flex flex-col">
              <ProfileRow
                label="Height"
                value={measurements.height ?? "—"}
              />
              <ProfileRow
                label="Weight"
                value={
                  weightSkipped
                    ? null
                    : measurements.weight
                    ? `${measurements.weight} lbs`
                    : null
                }
                skipped={weightSkipped}
              />
              <ProfileRow
                label="Waist"
                value={measurementDisplay(measurements.waist, `"`)}
              />
              <ProfileRow
                label="Hip"
                value={measurementDisplay(measurements.hip, `"`)}
              />
            </div>
          </Card>
        </motion.div>

        {/* ── Preferences ────────────────────────────────────────────── */}
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show">
          <Card padding="md">
            <SectionLabel>Preferences</SectionLabel>
            <div className="flex flex-col">
              <ProfileRow label="Waist Fit" value={waistFitLabel} />
              <ProfileRow label="Rise" value={riseLabel} />
              <ProfileRow label="Thigh Fit" value={thighFitLabel} />
            </div>
          </Card>
        </motion.div>

        {/* ── Previous brands ─────────────────────────────────────────── */}
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show">
          <Card padding="md">
            <SectionLabel>Previous Brands</SectionLabel>
            {brands.length === 0 ? (
              <p className="text-sm text-brand-faint italic">
                No previous denim brands provided.
              </p>
            ) : (
              <div className="flex flex-col">
                {brands.map((b: FitProfileBrand) => (
                  <div
                    key={b.brandId}
                    className="flex items-center justify-between py-2.5 border-b border-stone-50 last:border-0"
                  >
                    <span className="text-sm font-medium text-brand-muted">
                      {b.brandLabel}
                    </span>
                    <span className="text-sm font-semibold text-brand-text">
                      {b.size}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Fit challenge inline */}
            <div className="mt-5 pt-5 border-t border-stone-100">
              <SectionLabel>Fit Challenge</SectionLabel>
              <p className="text-sm font-semibold text-brand-text">
                {frustrationLabel ?? fitChallenge ?? "—"}
              </p>
            </div>
          </Card>
        </motion.div>

        {/* ── Profile summary + CTA ───────────────────────────────────── */}
        <motion.div
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-4"
        >
          <Card padding="md">
            <p className="text-sm text-brand-muted leading-relaxed">
              We now understand your body measurements, fit preferences and
              previous denim sizing. We&apos;ll use this information to
              personalize your shopping experience.
            </p>
          </Card>

          {/* CTA */}
          <a
            href="https://jackie-jeans.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Continue to Jackie Jeans website (opens in new tab)"
            className={cn(
              "w-full flex items-center justify-center gap-2 min-h-[52px]",
              "rounded-2xl px-6 py-4",
              "bg-gradient-to-b from-brand-denim-hover via-brand-denim to-brand-denim-dark",
              "text-base font-bold text-white tracking-tight",
              "shadow-[0_4px_16px_rgba(53,92,125,0.35),0_1px_3px_rgba(53,92,125,0.2)]",
              "hover:shadow-[0_6px_20px_rgba(53,92,125,0.45)]",
              "active:scale-[0.98]",
              "transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-denim focus-visible:ring-offset-2"
            )}
          >
            Continue to Jackie Jeans →
          </a>

          {/* Start over */}
          <button
            type="button"
            onClick={handleStartOver}
            className={cn(
              "w-full py-3 text-sm font-medium text-stone-400",
              "hover:text-stone-600 transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 rounded-xl"
            )}
          >
            Start Over
          </button>
        </motion.div>

      </main>
    </div>
  );
}
