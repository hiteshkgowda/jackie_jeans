"use client";

import { motion, HTMLMotionProps, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

// Minimum 44 × 44 pt tap target on every size (WCAG 2.5.5)
const sizeClasses = {
  sm: "px-4 py-2 text-sm min-h-[36px]",
  md: "px-6 py-3 text-base min-h-[44px]",
  lg: "px-8 py-4 text-lg min-h-[52px]",
};

export function PrimaryButton({
  children,
  className,
  size = "md",
  fullWidth = false,
  disabled,
  ...props
}: ButtonProps) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.button
      type="button"
      whileTap={prefersReduced ? {} : { scale: 0.97, y: 1 }}
      whileHover={prefersReduced ? {} : { scale: 1.015, y: -1 }}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold tracking-wide",
        // Denim blue gradient — brand primary
        "bg-gradient-to-b from-brand-denim-hover via-brand-denim to-brand-denim-dark",
        "text-white",
        "shadow-[0_4px_16px_rgba(53,92,125,0.35),0_1px_3px_rgba(53,92,125,0.2)]",
        "hover:shadow-[0_6px_20px_rgba(53,92,125,0.45),0_2px_4px_rgba(53,92,125,0.3)]",
        "active:shadow-[0_1px_4px_rgba(53,92,125,0.25)]",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
        "transition-shadow duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-denim focus-visible:ring-offset-2",
        sizeClasses[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function SecondaryButton({
  children,
  className,
  size = "md",
  fullWidth = false,
  disabled,
  ...props
}: ButtonProps) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.button
      type="button"
      whileTap={prefersReduced ? {} : { scale: 0.97, y: 1 }}
      whileHover={prefersReduced ? {} : { scale: 1.015, y: -1 }}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold tracking-wide",
        "bg-brand-surface text-brand-text border border-brand-border",
        "shadow-[0_1px_4px_rgba(24,22,20,0.07),0_0_0_1px_rgba(24,22,20,0.03)]",
        "hover:border-brand-border-strong hover:bg-brand-denim-light hover:text-brand-denim",
        "hover:shadow-[0_2px_8px_rgba(24,22,20,0.1)]",
        "active:bg-brand-bg active:shadow-none",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
        "transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-denim focus-visible:ring-offset-2",
        sizeClasses[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
