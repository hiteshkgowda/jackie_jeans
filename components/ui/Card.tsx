"use client";

import { motion, HTMLMotionProps } from "framer-motion";
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
  const paddings = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <motion.div
      whileHover={hover ? { y: -2 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "rounded-3xl bg-white border border-stone-100",
        "shadow-sm shadow-stone-100/80",
        paddings[padding],
        hover && "cursor-pointer hover:border-stone-200 transition-colors duration-200",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
