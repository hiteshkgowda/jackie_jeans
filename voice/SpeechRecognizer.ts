// Browser SpeechRecognition wrapper — SSR-safe, webkit-prefix aware

type OnResult = (text: string, isFinal: boolean) => void;
type OnEnd = () => void;
type OnError = (error: string) => void;

export class SpeechRecognizer {
  private recognition: SpeechRecognition | null = null;

  get isSupported(): boolean {
    if (typeof window === "undefined") return false;
    return !!(window.SpeechRecognition ?? window.webkitSpeechRecognition);
  }

  start(onResult: OnResult, onEnd: OnEnd, onError: OnError): void {
    if (!this.isSupported) {
      onError("Speech recognition is not supported in this browser.");
      return;
    }

    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    this.recognition = new SR();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = "en-US";
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      if (final) onResult(final, true);
      else if (interim) onResult(interim, false);
    };

    this.recognition.onend = () => {
      this.recognition = null;
      onEnd();
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.recognition = null;
      // "no-speech" is not an error — treat as silent end
      if (event.error === "no-speech" || event.error === "aborted") {
        onEnd();
      } else {
        onError(event.error);
      }
    };

    try {
      this.recognition.start();
    } catch {
      this.recognition = null;
      onError("Could not start speech recognition.");
    }
  }

  stop(): void {
    try {
      this.recognition?.stop();
    } catch {
      // ignore
    }
    this.recognition = null;
  }

  cancel(): void {
    try {
      this.recognition?.abort();
    } catch {
      // ignore
    }
    this.recognition = null;
  }
}
