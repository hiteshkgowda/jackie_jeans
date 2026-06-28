"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, RotateCcw, X, AlertTriangle } from "lucide-react";
import { useQuiz } from "@/hooks/useQuiz";
import { useVoiceController } from "@/voice/VoiceController";
import { Header, ProgressBar, PrimaryButton, SecondaryButton, Card } from "@/components/ui";
import { QuestionRenderer } from "@/components/quiz";
import type { VoicePhase } from "@/voice/VoiceState";
import type { TranscriptEntry } from "@/voice/VoiceState";
import { cn } from "@/lib/utils";

// ─── Voice Orb ────────────────────────────────────────────────────────────────

function VoiceOrb({ phase }: { phase: VoicePhase }) {
  const isActive = phase !== "idle" && phase !== "completed";
  const isListening = phase === "listening";
  const isSpeaking = phase === "speaking" || phase === "greeting";

  return (
    <div className="relative flex items-center justify-center w-28 h-28 mx-auto">
      {/* Ripple rings */}
      {isListening && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full border-2 border-stone-900/30"
              animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
              transition={{
                duration: 1.6,
                delay: i * 0.5,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          ))}
        </>
      )}

      {/* Slow pulse ring when speaking */}
      {isSpeaking && (
        <motion.div
          className="absolute inset-0 rounded-full bg-stone-900/10"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Core orb */}
      <motion.div
        animate={{
          scale: isListening ? [1, 1.06, 1] : isSpeaking ? [1, 1.04, 1] : 1,
          backgroundColor: isListening
            ? "#1c1917"
            : isSpeaking
            ? "#292524"
            : "#e7e5e4",
        }}
        transition={{
          scale: { duration: 0.8, repeat: isActive ? Infinity : 0, ease: "easeInOut" },
          backgroundColor: { duration: 0.3 },
        }}
        className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg shadow-stone-900/20"
      >
        <motion.div
          animate={{ opacity: isActive ? 1 : 0.5 }}
          transition={{ duration: 0.3 }}
        >
          {isListening ? (
            <Mic size={28} className="text-white" strokeWidth={1.5} />
          ) : (
            <MicOff
              size={28}
              className={isActive ? "text-white" : "text-stone-400"}
              strokeWidth={1.5}
            />
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Phase label ──────────────────────────────────────────────────────────────

function phaseLabel(phase: VoicePhase): string {
  switch (phase) {
    case "idle": return "Ready";
    case "greeting": return "Speaking…";
    case "speaking": return "Speaking…";
    case "listening": return "Listening…";
    case "processing": return "Processing…";
    case "confirming": return "Got it…";
    case "error": return "Retrying…";
    case "manualFallback": return "Manual input";
    case "completed": return "Done!";
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

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col">
        <Header title="AI Voice Stylist" showBack backHref="/" />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-stone-100 animate-pulse" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <Header title="AI Voice Stylist" showBack backHref="/" />

      <main className="flex-1 flex flex-col max-w-md mx-auto w-full px-5 pt-5 pb-8 gap-4">

        {/* Progress bar */}
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <ProgressBar value={progress} className="flex-1" />
            <span className="text-xs font-semibold text-stone-400 shrink-0 tabular-nums">
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
            className="text-center text-xs font-semibold text-stone-400 tracking-widest uppercase mt-3"
          >
            {phaseLabel(phase)}
          </motion.p>
        </div>

        {/* Browser not supported warning */}
        {!isSupported && (
          <Card padding="sm" className="border-amber-200 bg-amber-50">
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Speech recognition is not supported in this browser. Please use
                Chrome on desktop or Android for the best experience.
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
            className="text-center flex flex-col gap-2"
          >
            <h2 className="text-xl font-bold tracking-tight text-stone-900">
              Talk to your stylist
            </h2>
            <p className="text-sm text-stone-500 leading-relaxed max-w-xs mx-auto">
              Answer every question by speaking naturally. Your AI stylist will
              guide you through the whole fit quiz.
            </p>
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
              <p className="text-base font-medium text-stone-700 leading-snug">
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
              >
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
                aria-label="Cancel conversation"
              >
                <X size={15} strokeWidth={2.5} />
                Cancel
              </SecondaryButton>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
