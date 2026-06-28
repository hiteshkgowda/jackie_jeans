"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Mic2 } from "lucide-react";
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

export default function VoicePage() {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <Header title="AI Voice Stylist" showBack backHref="/" />

      <main className="flex-1 flex flex-col max-w-md mx-auto w-full px-5 py-6 gap-5">
        {/* Progress */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
          <ProgressBar value={0} max={100} label="Conversation" showPercent />
        </motion.div>

        {/* Voice card placeholder */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show">
          <Card padding="lg">
            <div className="flex flex-col items-center justify-center py-14 gap-4">
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="w-16 h-16 rounded-full bg-stone-100 border-2 border-stone-200 flex items-center justify-center"
              >
                <Mic2 size={24} className="text-stone-400" strokeWidth={1.5} />
              </motion.div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-sm font-semibold text-stone-500">
                  Voice interface
                </p>
                <p className="text-xs text-stone-300 text-center max-w-[200px]">
                  Speech recognition & AI responses — coming in Milestone 2
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Transcript placeholder */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show">
          <Card padding="md">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-stone-400 tracking-wide uppercase">
                Transcript
              </p>
              <div className="h-24 flex items-center justify-center">
                <p className="text-xs text-stone-300">Conversation will appear here</p>
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
              Cancel
            </SecondaryButton>
          </Link>
          <Link href="/summary" className="flex-1">
            <PrimaryButton fullWidth disabled>
              Continue
            </PrimaryButton>
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
