"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Header, Card, PrimaryButton, SecondaryButton } from "@/components/ui";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

export default function SummaryPage() {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <Header title="Your Fit Profile" showBack backHref="/manual" />

      <main className="flex-1 flex flex-col max-w-md mx-auto w-full px-5 py-6 gap-5">
        {/* Completion indicator placeholder */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
          <Card padding="lg">
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="w-14 h-14 rounded-full bg-stone-100 border-2 border-stone-200 flex items-center justify-center">
                <CheckCircle2 size={24} className="text-stone-400" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <p className="text-base font-semibold text-stone-700">
                  Fit Profile Summary
                </p>
                <p className="text-xs text-stone-400 max-w-[200px]">
                  Your personalized fit recommendations will appear here
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Fit data placeholders */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="flex flex-col gap-3">
          {["Waist size", "Inseam length", "Fit style", "Rise preference"].map((label) => (
            <div
              key={label}
              className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white border border-stone-100"
            >
              <span className="text-sm font-medium text-stone-500">{label}</span>
              <div className="w-16 h-4 rounded-full bg-stone-100 animate-pulse" />
            </div>
          ))}
        </motion.div>

        {/* Recommendation card placeholder */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show">
          <Card padding="md">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-stone-400 tracking-wide uppercase">
                Recommended for you
              </p>
              <div className="h-20 flex items-center justify-center">
                <p className="text-xs text-stone-300">
                  Product recommendations — coming in Milestone 3
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Navigation placeholder */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-auto pt-4 flex gap-3"
        >
          <Link href="/" className="flex-1">
            <SecondaryButton fullWidth>
              Start Over
            </SecondaryButton>
          </Link>
          <PrimaryButton fullWidth disabled>
            Shop My Fit
          </PrimaryButton>
        </motion.div>
      </main>
    </div>
  );
}
