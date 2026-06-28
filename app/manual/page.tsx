"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Header, Card, ProgressBar, PrimaryButton, SecondaryButton } from "@/components/ui";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

export default function ManualPage() {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <Header title="Fit Quiz" showBack backHref="/" />

      <main className="flex-1 flex flex-col max-w-md mx-auto w-full px-5 py-6 gap-5">
        {/* Progress */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
          <ProgressBar value={0} max={100} label="Your progress" showPercent />
        </motion.div>

        {/* Question card placeholder */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show">
          <Card padding="lg">
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-10 h-10 rounded-2xl bg-stone-100 flex items-center justify-center">
                <span className="text-lg">👖</span>
              </div>
              <p className="text-sm font-medium text-stone-400 text-center">
                Quiz questions will appear here
              </p>
              <p className="text-xs text-stone-300 text-center max-w-[180px]">
                Step-by-step fit questions — coming in Milestone 1
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Options placeholder */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 rounded-2xl bg-stone-100 border border-stone-200 animate-pulse"
            />
          ))}
        </motion.div>

        {/* Navigation placeholder */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-auto pt-4 flex gap-3"
        >
          <SecondaryButton fullWidth disabled>
            Back
          </SecondaryButton>
          <Link href="/summary" className="flex-1">
            <PrimaryButton fullWidth>
              Next
            </PrimaryButton>
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
