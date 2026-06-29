"use client";

import { motion, HTMLMotionProps, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: React.ReactNode;
  hover?: boolean;
  padding?: "sm" | "md" | "lg";
}

export function Card({
  children,
  className,
  hover = false,
  padding = "md",
  ...props
}: CardProps) {
  const prefersReduced = useReducedMotion();
  const paddings = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <motion.div
      whileHover={
        hover && !prefersReduced
          ? {
              y: -3,
              boxShadow:
                "0 8px 24px rgba(24,22,20,0.1), 0 0 0 1px rgba(24,22,20,0.05)",
            }
          : {}
      }
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={cn(
        "rounded-3xl bg-brand-surface border border-brand-border",
        "shadow-[0_2px_8px_rgba(24,22,20,0.06),0_0_0_1px_rgba(24,22,20,0.03)]",
        paddings[padding],
        hover && "cursor-pointer transition-colors duration-200",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
