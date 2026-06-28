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
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-50 flex flex-col">
      {/* Brand bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between px-5 py-4"
      >
        <span className="text-xs font-semibold tracking-[0.2em] uppercase text-stone-400">
          Jackie Jeans
        </span>
        <span className="text-xs text-stone-300">✦</span>
      </motion.div>

      {/* Hero section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 pb-10 pt-8 max-w-md mx-auto w-full">
        {/* Badge */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 border border-stone-200 mb-8"
        >
          <Sparkles size={11} className="text-stone-500" />
          <span className="text-xs font-medium text-stone-500 tracking-wide">
            Smart Fit Technology
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="text-[2.75rem] leading-[1.1] font-bold tracking-tight text-stone-900 text-center mb-5"
        >
          Find Jeans That{" "}
          <span className="italic font-light text-stone-500">Actually</span>{" "}
          Fit
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="text-[1.05rem] text-stone-500 text-center leading-relaxed mb-12 max-w-xs"
        >
          Answer a few simple questions or chat with our AI stylist.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="w-full flex flex-col gap-4"
        >
          <Link href="/manual" className="w-full">
            <PrimaryButton size="lg" fullWidth className="py-5 rounded-2xl text-base">
              <ClipboardList size={18} strokeWidth={2} />
              Manual Fit Quiz
            </PrimaryButton>
          </Link>

          <Link href="/voice" className="w-full">
            <SecondaryButton size="lg" fullWidth className="py-5 rounded-2xl text-base">
              <Mic2 size={18} strokeWidth={2} />
              AI Voice Stylist
            </SecondaryButton>
          </Link>
        </motion.div>

        {/* Feature hints */}
        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-10 flex gap-6 text-center"
        >
          {[
            { label: "2 min", sub: "quiz" },
            { label: "98%", sub: "fit rate" },
            { label: "Free", sub: "returns" },
          ].map(({ label, sub }) => (
            <div key={sub} className="flex flex-col items-center gap-0.5">
              <span className="text-lg font-bold text-stone-900">{label}</span>
              <span className="text-xs text-stone-400 font-medium capitalize">{sub}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Bottom strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.4 }}
        className="px-6 pb-8 text-center"
      >
        <p className="text-xs text-stone-300">
          Trusted by 50,000+ denim lovers worldwide
        </p>
      </motion.div>
    </main>
  );
}
