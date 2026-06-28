"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  label?: string;
  showPercent?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  className,
  label,
  showPercent = false,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn("w-full", className)}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-xs font-medium text-stone-500 tracking-wide uppercase">
              {label}
            </span>
          )}
          {showPercent && (
            <span className="text-xs font-semibold text-stone-700">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className="h-1.5 w-full rounded-full bg-stone-100 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-stone-900"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
