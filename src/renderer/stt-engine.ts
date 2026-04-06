export class STTEngine {
  private recognition: any = null;
  private isListeningFlag = false;
  private onResultCallback?: (text: string, isFinal: boolean) => void;
  private onErrorCallback?: (error: string) => void;
  private onStartCallback?: () => void;
  private onEndCallback?: () => void;

  constructor() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('[BrailChrome] SpeechRecognition API not available');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const text = result[0].transcript.trim().toLowerCase();
      const isFinal = result.isFinal;
      this.onResultCallback?.(text, isFinal);
    };

    this.recognition.onerror = (event: any) => {
      this.isListeningFlag = false;
      this.onErrorCallback?.(event.error);
    };

    this.recognition.onstart = () => {
      this.isListeningFlag = true;
      this.onStartCallback?.();
    };

    this.recognition.onend = () => {
      this.isListeningFlag = false;
      this.onEndCallback?.();
    };
  }

  isAvailable(): boolean {
    return this.recognition !== null;
  }

  isListening(): boolean {
    return this.isListeningFlag;
  }

  onResult(callback: (text: string, isFinal: boolean) => void) {
    this.onResultCallback = callback;
  }

  onError(callback: (error: string) => void) {
    this.onErrorCallback = callback;
  }

  onStart(callback: () => void) {
    this.onStartCallback = callback;
  }

  onEnd(callback: () => void) {
    this.onEndCallback = callback;
  }

  startListening(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not available'));
        return;
      }

      if (this.isListeningFlag) {
        // Stop first, then restart
        this.recognition.stop();
        setTimeout(() => {
          try {
            this.recognition.start();
            resolve();
          } catch (e) {
            reject(e);
          }
        }, 150);
      } else {
        try {
          this.recognition.start();
          resolve();
        } catch (e) {
          reject(e);
        }
      }
    });
  }

  stopListening() {
    if (this.recognition && this.isListeningFlag) {
      this.recognition.stop();
    }
  }
}
