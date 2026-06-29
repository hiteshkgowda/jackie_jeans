"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  backHref?: string;
  className?: string;
  children?: React.ReactNode;
}

export function Header({
  title,
  showBack = false,
  backHref = "/",
  className,
  children,
}: HeaderProps) {
  return (
    <motion.header
      role="banner"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "flex items-center justify-between px-5 py-4 bg-brand-bg/90 backdrop-blur-md",
        "border-b border-brand-border sticky top-0 z-40",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {showBack && (
          <Link
            href={backHref}
            aria-label="Go back"
            className={cn(
              "flex items-center justify-center w-9 h-9 rounded-xl",
              "bg-brand-border/60 hover:bg-brand-border transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-denim focus-visible:ring-offset-1"
            )}
          >
            <ArrowLeft size={16} className="text-brand-muted" strokeWidth={2.5} />
          </Link>
        )}
        {title && (
          <span className="text-sm font-semibold text-brand-text tracking-tight">
            {title}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span
          className="text-sm font-bold tracking-[0.12em] text-brand-denim uppercase"
          aria-label="Jackie Jeans"
        >
          JJ
        </span>
      </div>

      {children && <div className="flex items-center gap-2">{children}</div>}
    </motion.header>
  );
}
