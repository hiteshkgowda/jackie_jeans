"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export function PrimaryButton({
  children,
  className,
  size = "md",
  fullWidth = false,
  disabled,
  ...props
}: ButtonProps) {
  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold tracking-wide",
        "bg-stone-900 text-white shadow-lg shadow-stone-900/20",
        "hover:bg-stone-800 active:bg-stone-950",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
        "transition-colors duration-200",
        sizes[size],
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
  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold tracking-wide",
        "bg-white text-stone-900 border border-stone-200",
        "shadow-sm shadow-stone-100",
        "hover:bg-stone-50 hover:border-stone-300 active:bg-stone-100",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
        "transition-colors duration-200",
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
