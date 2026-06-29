"use client";

import { useState, useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { QuizQuestion, QuizAnswer } from "@/types";
import { cn } from "@/lib/utils";

// ─── Props ────────────────────────────────────────────────────────────────────

interface QuestionRendererProps {
  question: QuizQuestion;
  answer: QuizAnswer | undefined;
  onAnswer: (questionId: string, value: string | string[]) => void;
  onAutoAdvance?: () => void;
  error?: string;
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function QuestionHeader({
  question,
  badge,
}: {
  question: QuizQuestion;
  badge?: string;
}) {
  return (
    <div className="mb-6">
      {badge && (
        <span className="inline-block text-[11px] font-semibold tracking-wider uppercase text-brand-denim mb-3">
          {badge}
        </span>
      )}
      <h2 className="text-2xl font-bold tracking-tight text-brand-text leading-tight mb-2">
        {question.question}
      </h2>
      {question.description && (
        <p className="text-sm text-brand-muted leading-relaxed">
          {question.description}
        </p>
      )}
    </div>
  );
}

function InlineError({ message }: { message?: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="mt-3 text-xs font-medium text-red-500"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

// ─── Dropdown (height, waist, hip) ───────────────────────────────────────────

function DropdownInput({
  question,
  value,
  onSelect,
  onAutoAdvance,
}: {
  question: QuizQuestion;
  value: string | undefined;
  onSelect: (v: string) => void;
  onAutoAdvance?: () => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    return () => clearTimeout(timerRef.current);
  }, []);

  function handleSelect(v: string) {
    onSelect(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onAutoAdvance?.(), 300);
  }

  const options = question.options ?? [];

  return (
    <div>
      <QuestionHeader question={question} />
      <div className="max-h-[52vh] overflow-y-auto -mx-1 px-1 pb-2">
        <div className="grid grid-cols-3 gap-2">
          {options.map((opt) => {
            const selected = value === opt.value;
            return (
              <motion.button
                key={opt.id}
                ref={selected ? selectedRef : undefined}
                onClick={() => handleSelect(opt.value)}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className={cn(
                  "py-3 px-2 rounded-2xl text-sm font-semibold border transition-all duration-150 text-center",
                  selected
                    ? "bg-brand-denim text-white border-brand-denim shadow-[0_2px_8px_rgba(53,92,125,0.35)]"
                    : "bg-brand-surface text-brand-text border-brand-border hover:border-brand-denim/50 hover:bg-brand-denim-light hover:text-brand-denim"
                )}
              >
                {opt.label}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Number input (weight) ────────────────────────────────────────────────────

function NumberInput({
  question,
  value,
  onChange,
  error,
}: {
  question: QuizQuestion;
  value: string | undefined;
  onChange: (v: string) => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, []);

  return (
    <div>
      <QuestionHeader question={question} badge="Optional" />
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          min={1}
          max={999}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder ?? ""}
          className={cn(
            "flex-1 rounded-2xl border px-5 py-4 text-2xl font-semibold text-brand-text",
            "bg-brand-bg placeholder:text-brand-faint outline-none",
            "transition-all duration-200 focus:bg-brand-surface focus:ring-2 focus:ring-brand-denim/20",
            error
              ? "border-red-300 focus:border-red-400"
              : "border-brand-border focus:border-brand-denim/60"
          )}
        />
        {question.inputUnit && (
          <span className="text-base font-semibold text-brand-faint shrink-0">
            {question.inputUnit}
          </span>
        )}
      </div>
      <InlineError message={error} />
    </div>
  );
}

// ─── Single select (waist fit, rise, thigh fit, frustration) ─────────────────

function SingleSelect({
  question,
  value,
  onSelect,
  onAutoAdvance,
  error,
}: {
  question: QuizQuestion;
  value: string | undefined;
  onSelect: (v: string) => void;
  onAutoAdvance?: () => void;
  error?: string;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hasOtherOption = question.options?.some((o) => o.value === "other") ?? false;
  const isOtherSelected =
    value === "other" ||
    (hasOtherOption && !!value && !question.options?.some((o) => o.value === value));
  const [otherText, setOtherText] = useState(() => {
    if (value && !question.options?.some((o) => o.value === value)) return value;
    return "";
  });
  const otherInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOtherSelected) setTimeout(() => otherInputRef.current?.focus(), 80);
  }, [isOtherSelected]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  function handleSelect(v: string) {
    onSelect(v);
    if (v !== "other") {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => onAutoAdvance?.(), 320);
    }
  }

  function handleOtherText(text: string) {
    setOtherText(text);
    onSelect(text || "other");
  }

  const options = question.options ?? [];

  return (
    <div>
      <QuestionHeader question={question} />
      <div className="flex flex-col gap-2">
        {options.map((opt) => {
          const selected = opt.value === "other" ? isOtherSelected : value === opt.value;
          return (
            <motion.button
              key={opt.id}
              onClick={() => handleSelect(opt.value)}
              whileTap={{ scale: 0.985 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className={cn(
                "w-full text-left px-4 py-3.5 rounded-2xl border transition-all duration-150",
                "flex items-start gap-3",
                selected
                  ? "bg-brand-denim border-brand-denim shadow-[0_2px_10px_rgba(53,92,125,0.25)]"
                  : "bg-brand-surface border-brand-border hover:border-brand-denim/40 hover:bg-brand-denim-light"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors",
                  selected ? "border-white bg-white" : "border-brand-border-strong"
                )}
              >
                {selected && (
                  <Check size={9} className="text-brand-denim" strokeWidth={3} />
                )}
              </span>
              <div className="flex flex-col gap-0.5">
                <span
                  className={cn(
                    "text-sm font-semibold leading-tight",
                    selected ? "text-white" : "text-brand-text"
                  )}
                >
                  {opt.label}
                </span>
                {opt.description && (
                  <span
                    className={cn(
                      "text-xs leading-relaxed",
                      selected ? "text-white/70" : "text-brand-muted"
                    )}
                  >
                    {opt.description}
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* "Other" free-text input */}
      <AnimatePresence>
        {isOtherSelected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mt-3"
          >
            <input
              ref={otherInputRef}
              type="text"
              value={otherText}
              onChange={(e) => handleOtherText(e.target.value)}
              placeholder="Describe your frustration…"
              className={cn(
                "w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-3",
                "text-sm text-brand-text placeholder:text-brand-faint outline-none",
                "focus:border-brand-denim/60 focus:bg-brand-surface focus:ring-2 focus:ring-brand-denim/15",
                "transition-all duration-200"
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <InlineError message={error} />
    </div>
  );
}

// ─── Multi select (brands) ────────────────────────────────────────────────────

function MultiSelect({
  question,
  value,
  onToggle,
  error,
}: {
  question: QuizQuestion;
  value: string[];
  onToggle: (v: string) => void;
  error?: string;
}) {
  const options = question.options ?? [];

  return (
    <div>
      <QuestionHeader question={question} />
      <div className="max-h-[52vh] overflow-y-auto -mx-1 px-1 pb-2">
        <div className="grid grid-cols-2 gap-2">
          {options.map((opt) => {
            const selected = value.includes(opt.value);
            return (
              <motion.button
                key={opt.id}
                onClick={() => onToggle(opt.value)}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className={cn(
                  "px-3 py-3 rounded-2xl border text-sm font-medium transition-all duration-150",
                  "flex items-center gap-2 text-left",
                  selected
                    ? "bg-brand-denim text-white border-brand-denim shadow-[0_2px_8px_rgba(53,92,125,0.3)]"
                    : "bg-brand-surface text-brand-text border-brand-border hover:border-brand-denim/40 hover:bg-brand-denim-light hover:text-brand-denim"
                )}
              >
                <span
                  className={cn(
                    "w-4 h-4 rounded shrink-0 border-2 flex items-center justify-center transition-colors",
                    selected ? "border-white bg-white" : "border-brand-border-strong"
                  )}
                >
                  {selected && (
                    <Check size={9} className="text-brand-denim" strokeWidth={3} />
                  )}
                </span>
                <span className="leading-tight">{opt.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
      {value.length > 0 && (
        <p className="mt-3 text-xs text-brand-denim font-semibold text-center">
          {value.length} brand{value.length !== 1 ? "s" : ""} selected
        </p>
      )}
      <InlineError message={error} />
    </div>
  );
}

// ─── Brand size (injected per selected brand) ─────────────────────────────────

function BrandSizeInput({
  question,
  value,
  onSelect,
  onAutoAdvance,
  error,
}: {
  question: QuizQuestion;
  value: string | undefined;
  onSelect: (v: string) => void;
  onAutoAdvance?: () => void;
  error?: string;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  function handleSelect(v: string) {
    onSelect(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onAutoAdvance?.(), 300);
  }

  const options = question.options ?? [];

  return (
    <div>
      <QuestionHeader question={question} badge="Brand size" />
      <div className="grid grid-cols-4 gap-2">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <motion.button
              key={opt.id}
              onClick={() => handleSelect(opt.value)}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className={cn(
                "py-3 rounded-2xl text-sm font-semibold border transition-all duration-150 text-center",
                selected
                  ? "bg-brand-denim text-white border-brand-denim shadow-[0_2px_8px_rgba(53,92,125,0.35)]"
                  : "bg-brand-surface text-brand-text border-brand-border hover:border-brand-denim/50 hover:bg-brand-denim-light hover:text-brand-denim"
              )}
            >
              {opt.label}
            </motion.button>
          );
        })}
      </div>
      <InlineError message={error} />
    </div>
  );
}

// ─── Main renderer ────────────────────────────────────────────────────────────

export function QuestionRenderer({
  question,
  answer,
  onAnswer,
  onAutoAdvance,
  error,
}: QuestionRendererProps) {
  const rawValue = answer?.value;
  const stringValue = typeof rawValue === "string" ? rawValue : undefined;
  const arrayValue = Array.isArray(rawValue) ? (rawValue as string[]) : [];

  function handleSingleAnswer(v: string) {
    onAnswer(question.id, v);
  }

  function handleToggle(v: string) {
    const next = arrayValue.includes(v)
      ? arrayValue.filter((x) => x !== v)
      : [...arrayValue, v];
    onAnswer(question.id, next);
  }

  switch (question.type) {
    case "dropdown":
      return (
        <DropdownInput
          question={question}
          value={stringValue}
          onSelect={handleSingleAnswer}
          onAutoAdvance={onAutoAdvance}
        />
      );

    case "number-input":
      return (
        <NumberInput
          question={question}
          value={stringValue}
          onChange={handleSingleAnswer}
          error={error}
        />
      );

    case "single-select":
      return (
        <SingleSelect
          question={question}
          value={stringValue}
          onSelect={handleSingleAnswer}
          onAutoAdvance={onAutoAdvance}
          error={error}
        />
      );

    case "multi-select":
      return (
        <MultiSelect
          question={question}
          value={arrayValue}
          onToggle={handleToggle}
          error={error}
        />
      );

    case "brand-size":
      return (
        <BrandSizeInput
          question={question}
          value={stringValue}
          onSelect={handleSingleAnswer}
          onAutoAdvance={onAutoAdvance}
          error={error}
        />
      );

    default:
      return null;
  }
}
