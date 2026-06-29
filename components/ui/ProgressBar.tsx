"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  label?: string;
  showPercent?: boolean;
  ariaLabel?: string;
}

export function ProgressBar({
  value,
  max = 100,
  className,
  label,
  showPercent = false,
  ariaLabel,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const prefersReduced = useReducedMotion() ?? false;

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(percentage)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel ?? label ?? "Quiz progress"}
      className={cn("w-full", className)}
    >
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-xs font-medium text-stone-500 tracking-wide uppercase">
              {label}
            </span>
          )}
          {showPercent && (
            <span className="text-xs font-semibold text-stone-700" aria-hidden="true">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className="h-1.5 w-full rounded-full bg-brand-border overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-brand-denim"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={
            prefersReduced ? { duration: 0 } : { duration: 0.5, ease: "easeOut" }
          }
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
