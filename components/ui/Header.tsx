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
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "flex items-center justify-between px-5 py-4 bg-white/80 backdrop-blur-md",
        "border-b border-stone-100 sticky top-0 z-40",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {showBack && (
          <Link
            href={backHref}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 transition-colors duration-150"
          >
            <ArrowLeft size={16} className="text-stone-700" strokeWidth={2.5} />
          </Link>
        )}
        {title && (
          <span className="text-sm font-semibold text-stone-800 tracking-tight">
            {title}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-bold tracking-tight text-stone-900">
          JJ
        </span>
      </div>

      {children && <div className="flex items-center gap-2">{children}</div>}
    </motion.header>
  );
}
