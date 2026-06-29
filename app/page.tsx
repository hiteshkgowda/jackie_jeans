"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ClipboardList, Mic2, Sparkles } from "lucide-react";
import { PrimaryButton, SecondaryButton } from "@/components/ui";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.12,
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

export default function Home() {
  return (
    <main className="min-h-screen bg-brand-bg flex flex-col">

      {/* Brand bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between px-6 py-5"
      >
        <span className="text-xs font-semibold tracking-[0.25em] uppercase text-brand-denim">
          Jackie Jeans
        </span>
        <span className="text-xs text-brand-faint select-none">✦</span>
      </motion.div>

      {/* Hero section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 pb-12 pt-6 max-w-md mx-auto w-full">

        {/* Badge */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-denim-light border border-brand-denim/20 mb-10"
        >
          <Sparkles size={11} className="text-brand-denim" />
          <span className="text-xs font-semibold text-brand-denim tracking-wide">
            Smart Fit Technology
          </span>
        </motion.div>

        {/* Headline — editorial weight */}
        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="text-[3.25rem] leading-[1.04] font-extrabold tracking-[-0.025em] text-brand-text text-center mb-5"
        >
          Find Jeans That{" "}
          <span className="italic font-light text-brand-denim">
            Actually
          </span>{" "}
          Fit
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="text-base text-brand-muted text-center leading-relaxed mb-12 max-w-[260px]"
        >
          Answer a few simple questions or chat with our AI stylist — done in
          under 2&nbsp;minutes.
        </motion.p>

        {/* CTA buttons — primary is the visual anchor */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="w-full flex flex-col gap-3"
        >
          <Link href="/manual" className="w-full" tabIndex={-1}>
            <PrimaryButton
              size="lg"
              fullWidth
              className="py-5 text-[1.05rem] font-bold"
              aria-label="Start the manual fit quiz"
            >
              <ClipboardList size={18} strokeWidth={2} aria-hidden="true" />
              Manual Fit Quiz
            </PrimaryButton>
          </Link>

          <Link href="/voice" className="w-full" tabIndex={-1}>
            <SecondaryButton
              size="lg"
              fullWidth
              className="py-5 text-[1.05rem]"
              aria-label="Start the AI voice stylist"
            >
              <Mic2 size={18} strokeWidth={2} aria-hidden="true" />
              AI Voice Stylist
            </SecondaryButton>
          </Link>
        </motion.div>

        {/* Feature stats */}
        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-12 flex gap-8 text-center"
        >
          {[
            { label: "2 min", sub: "quiz" },
            { label: "98%", sub: "fit rate" },
            { label: "Free", sub: "returns" },
          ].map(({ label, sub }) => (
            <div key={sub} className="flex flex-col items-center gap-1">
              <span className="text-xl font-extrabold text-brand-denim tracking-tight">
                {label}
              </span>
              <span className="text-xs text-brand-faint font-medium capitalize tracking-wide">
                {sub}
              </span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Bottom strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.75, duration: 0.4 }}
        className="px-6 pb-8 text-center"
      >
        <p className="text-xs text-brand-faint tracking-wide">
          Trusted by 50,000+ denim lovers worldwide
        </p>
      </motion.div>
    </main>
  );
}
