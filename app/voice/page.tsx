"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Mic, MicOff, RotateCcw, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useQuiz } from "@/hooks/useQuiz";
import { useVoiceController } from "@/voice/VoiceController";
import { Header, ProgressBar, PrimaryButton, SecondaryButton, Card } from "@/components/ui";
import { QuestionRenderer } from "@/components/quiz";
import type { VoicePhase } from "@/voice/VoiceState";
import type { TranscriptEntry } from "@/voice/VoiceState";
import { cn } from "@/lib/utils";

// ─── Voice Orb ────────────────────────────────────────────────────────────────
//
// Each phase gets a distinct micro-animation so users can glance and know
// exactly what the assistant is doing.
//
//   idle        — very slow gentle breathing
//   speaking /
//   greeting /
//   confirming  — slow outward breathing ring
//   listening   — 3 expanding ripple rings + faster core pulse
//   processing  — spinning arc around the orb
//   error       — amber pulsing ring
//   completed   — deep green core + checkmark icon

function orbAriaLabel(phase: VoicePhase): string {
  switch (phase) {
    case "idle":          return "Voice stylist ready";
    case "greeting":      return "Voice stylist speaking greeting";
    case "speaking":      return "Voice stylist asking a question";
    case "listening":     return "Voice stylist listening for your answer";
    case "processing":    return "Voice stylist processing your answer";
    case "confirming":    return "Voice stylist confirming your answer";
    case "error":         return "Voice stylist retrying";
    case "manualFallback":return "Switched to manual input";
    case "completed":     return "Fit quiz complete";
  }
}

function VoiceOrb({ phase }: { phase: VoicePhase }) {
  const prefersReduced = useReducedMotion() ?? false;

  const isActive    = phase !== "idle" && phase !== "completed";
  const isListening = phase === "listening";
  const isSpeaking  = phase === "speaking" || phase === "greeting" || phase === "confirming";
  const isProcessing= phase === "processing";
  const isError     = phase === "error";
  const isCompleted = phase === "completed";

  const coreColor = isListening ? "#355C7D"     // denim — the orb "opens its ear"
    : isSpeaking ? "#181614"                    // near-black — clear authoritative voice
    : isCompleted ? "#14532d"                   // deep green success
    : "#E8E3DC";                                // warm border grey when inactive

  return (
    <div
      className="relative flex items-center justify-center w-28 h-28 mx-auto"
      role="img"
      aria-label={orbAriaLabel(phase)}
    >
      {/* Idle: very gentle breathing background */}
      {phase === "idle" && !prefersReduced && (
        <motion.div
          className="absolute inset-0 rounded-full bg-brand-border"
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Speaking / confirming: slow outward breathing ring */}
      {isSpeaking && !prefersReduced && (
        <motion.div
          className="absolute inset-0 rounded-full bg-brand-text/6"
          animate={{ scale: [1, 1.14, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Listening: 3 expanding denim-blue ripple rings */}
      {isListening && !prefersReduced && [0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border-2 border-brand-denim/30"
          animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
          transition={{ duration: 1.6, delay: i * 0.5, repeat: Infinity, ease: "easeOut" }}
        />
      ))}

      {/* Processing: denim spinning arc */}
      {isProcessing && !prefersReduced && (
        <motion.div
          className="absolute w-24 h-24 rounded-full border-[3px] border-brand-border"
          style={{ borderTopColor: "#355C7D" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Error: amber pulsing ring */}
      {isError && !prefersReduced && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-amber-400/50"
          animate={{ opacity: [0.8, 0.2, 0.8], scale: [1, 1.06, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Core orb */}
      <motion.div
        animate={{
          scale:
            isListening && !prefersReduced ? [1, 1.06, 1]
            : isSpeaking && !prefersReduced ? [1, 1.03, 1]
            : 1,
          backgroundColor: coreColor,
        }}
        transition={{
          scale: {
            duration: isListening ? 0.85 : 2.2,
            repeat: isActive && !prefersReduced ? Infinity : 0,
            ease: "easeInOut",
          },
          backgroundColor: { duration: 0.35 },
        }}
        className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg shadow-stone-900/20"
      >
        {isListening ? (
          <Mic size={28} className="text-white" strokeWidth={1.5} />
        ) : isCompleted ? (
          <CheckCircle2 size={28} className="text-emerald-300" strokeWidth={1.5} />
        ) : (
          <MicOff
            size={28}
            className={isActive ? "text-white" : "text-stone-400"}
            strokeWidth={1.5}
          />
        )}
      </motion.div>
    </div>
  );
}

// ─── Phase label ──────────────────────────────────────────────────────────────

function phaseLabel(phase: VoicePhase): string {
  switch (phase) {
    case "idle":          return "Ready";
    case "greeting":      return "Speaking…";
    case "speaking":      return "Speaking…";
    case "listening":     return "Listening…";
    case "processing":    return "Processing…";
    case "confirming":    return "Got it…";
    case "error":         return "Retrying…";
    case "manualFallback":return "Manual input";
    case "completed":     return "Done!";
  }
}

// ─── Transcript bubble ────────────────────────────────────────────────────────

function TranscriptBubble({ entry }: { entry: TranscriptEntry }) {
  const isAI = entry.role === "ai";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      className={cn("flex", isAI ? "justify-start" : "justify-end")}
    >
      <div
        className={cn(
          "max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
          isAI
            ? "bg-white border border-stone-100 text-stone-700 rounded-tl-sm shadow-sm"
            : "bg-stone-900 text-white rounded-tr-sm"
        )}
      >
        {entry.text}
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VoicePage() {
  const quiz = useQuiz();
  const voice = useVoiceController(quiz);

  const {
    phase,
    transcript,
    liveText,
    currentMessage,
    showManualInput,
    isSupported,
    start,
    repeat,
    cancel,
    handleManualContinue,
  } = voice;

  const {
    currentQuestion,
    answers,
    setAnswer,
    getProgress,
    totalQuestions,
    currentIndex,
    isHydrated,
  } = quiz;

  // Auto-scroll transcript to bottom
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, liveText]);

  const progress = getProgress();
  const isActive = phase !== "idle" && phase !== "completed";

  // Escape key cancels an active conversation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isActive) cancel();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, cancel]);

  // Soft Chrome recommendation — shown when speech is supported but not Chrome-based
  const isChromeBased =
    typeof navigator !== "undefined" && /Chrome\//.test(navigator.userAgent);
  const showChromeSuggestion = isSupported && !isChromeBased;

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col">
        <Header title="AI Voice Stylist" showBack backHref="/" />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-stone-100 animate-pulse" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <Header title="AI Voice Stylist" showBack backHref="/" />

      {/* ARIA live region — announces phase changes to screen readers */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {phaseLabel(phase)}
        {liveText ? `: ${liveText}` : ""}
      </div>

      <main
        role="main"
        className="flex-1 flex flex-col max-w-md mx-auto w-full px-5 pt-5 pb-8 gap-4"
      >
        {/* Progress bar */}
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <ProgressBar
              value={progress}
              className="flex-1"
              ariaLabel={`Question ${currentIndex + 1} of ${totalQuestions}`}
            />
            <span
              className="text-xs font-semibold text-stone-400 shrink-0 tabular-nums"
              aria-hidden="true"
            >
              {currentIndex + 1} / {totalQuestions}
            </span>
          </motion.div>
        )}

        {/* Voice Orb */}
        <div className="py-4">
          <VoiceOrb phase={phase} />

          {/* Phase label */}
          <motion.p
            key={phase}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-xs font-semibold text-brand-faint tracking-widest uppercase mt-3"
            aria-hidden="true"
          >
            {phaseLabel(phase)}
          </motion.p>
        </div>

        {/* Browser not supported — hard warning */}
        {!isSupported && (
          <Card padding="sm" className="border-amber-200 bg-amber-50">
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" aria-hidden="true" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Speech recognition isn&apos;t supported in this browser. Please
                use <strong>Google Chrome</strong> on desktop or Android for the
                voice experience.
              </p>
            </div>
          </Card>
        )}

        {/* Idle: call to action */}
        {phase === "idle" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center flex flex-col gap-3"
          >
            <h2 className="text-xl font-bold tracking-tight text-stone-900">
              Talk to your stylist
            </h2>
            <p className="text-sm text-stone-500 leading-relaxed max-w-xs mx-auto">
              Answer every question by speaking naturally. Your AI stylist will
              guide you through the whole fit quiz.
            </p>

            {/* Soft Chrome recommendation — non-blocking */}
            {showChromeSuggestion && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex items-start gap-2 text-left bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 max-w-xs mx-auto w-full"
              >
                <AlertTriangle size={13} className="text-blue-400 mt-0.5 shrink-0" aria-hidden="true" />
                <p className="text-xs text-blue-600 leading-relaxed">
                  For the best voice experience, we recommend{" "}
                  <span className="font-semibold">Google Chrome</span> on
                  desktop.
                </p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Current AI message (non-transcript) */}
        {isActive && currentMessage && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMessage}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="text-center px-4"
            >
              <p className="text-base font-medium text-brand-text leading-snug">
                {currentMessage}
              </p>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Live listening transcript */}
        <AnimatePresence>
          {phase === "listening" && liveText && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex justify-end"
            >
              <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-stone-200 text-stone-600 text-sm italic">
                {liveText}…
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transcript history */}
        {transcript.length > 0 && (
          <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[35vh] pr-1">
            {transcript.map((entry) => (
              <TranscriptBubble key={entry.id} entry={entry} />
            ))}
            <div ref={transcriptEndRef} />
          </div>
        )}

        {/* Manual fallback: show QuestionRenderer for the stuck question */}
        <AnimatePresence>
          {showManualInput && currentQuestion && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4"
            >
              <Card padding="md" className="border-stone-200">
                <QuestionRenderer
                  question={currentQuestion}
                  answer={answers[currentQuestion.id]}
                  onAnswer={setAnswer}
                />
              </Card>
              <PrimaryButton
                onClick={handleManualContinue}
                fullWidth
                size="md"
                aria-label="Save this answer and continue with voice"
              >
                <Mic size={15} strokeWidth={2} aria-hidden="true" />
                Continue with voice
              </PrimaryButton>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls */}
        <div className="mt-auto flex gap-3">
          {phase === "idle" ? (
            <PrimaryButton
              onClick={start}
              fullWidth
              size="lg"
              className="py-4"
              disabled={!isSupported}
            >
              <Mic size={18} strokeWidth={2} />
              Start Conversation
            </PrimaryButton>
          ) : phase === "completed" ? (
            <div className="w-full text-center">
              <p className="text-sm font-medium text-stone-500">
                Redirecting to your fit summary…
              </p>
            </div>
          ) : (
            <>
              <SecondaryButton
                onClick={repeat}
                size="md"
                className="shrink-0"
                aria-label="Repeat question"
                disabled={showManualInput}
              >
                <RotateCcw size={15} strokeWidth={2.5} />
                Repeat
              </SecondaryButton>

              <SecondaryButton
                onClick={cancel}
                size="md"
                fullWidth
                aria-label="Cancel conversation (Escape)"
              >
                <X size={15} strokeWidth={2.5} aria-hidden="true" />
                Cancel
              </SecondaryButton>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
