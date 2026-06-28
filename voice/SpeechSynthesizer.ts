// Browser SpeechSynthesis wrapper — SSR-safe

export class SpeechSynthesizer {
  get isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  speak(text: string, onEnd?: () => void): void {
    if (!this.isSupported) {
      onEnd?.();
      return;
    }

    // Cancel any in-progress speech first
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;
    utterance.lang = "en-US";

    // Prefer a natural English voice when available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        (v.name.includes("Samantha") ||
          v.name.includes("Karen") ||
          v.name.includes("Google US") ||
          v.name.includes("Natural"))
    );
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();

    window.speechSynthesis.speak(utterance);

    // Chrome bug: synthesis silently stops after ~15s without resume ticks
    if (typeof window !== "undefined") {
      const resumeTimer = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          clearInterval(resumeTimer);
          return;
        }
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }, 10000);

      utterance.onend = () => {
        clearInterval(resumeTimer);
        onEnd?.();
      };
      utterance.onerror = () => {
        clearInterval(resumeTimer);
        onEnd?.();
      };
    }
  }

  stop(): void {
    if (this.isSupported) {
      window.speechSynthesis.cancel();
    }
  }
}
