interface SpeakOptions {
  priority?: 'high' | 'normal' | 'low';
  rate?: number;
  volume?: number;
}

interface QueueItem {
  text: string;
  priority: 'high' | 'normal' | 'low';
  resolve: () => void;
}

export class TTSEngine {
  private queue: QueueItem[] = [];
  private isSpeakingFlag = false;
  private rate = 1.2;
  private volume = 1.0;
  private voice: SpeechSynthesisVoice | null = null;
  private voicesReady = false;
  private onWordCallback?: (word: string) => void;

  constructor() {
    // Voices load asynchronously on Windows/Electron.
    // The event may fire multiple times (first with 0 voices, then with actual voices).
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.selectDefaultVoice();
    }
    this.selectDefaultVoice();
  }

  /** Resolves once at least one voice is available (or after timeout). */
  waitForVoices(): Promise<void> {
    if (this.voicesReady) return Promise.resolve();
    return new Promise((resolve) => {
      let resolved = false;
      const done = () => { if (!resolved) { resolved = true; resolve(); } };

      // Poll every 200ms
      const interval = setInterval(() => {
        const voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
          clearInterval(interval);
          this.selectDefaultVoice();
          done();
        }
      }, 200);

      // Also listen for the event
      const origHandler = speechSynthesis.onvoiceschanged;
      speechSynthesis.onvoiceschanged = () => {
        this.selectDefaultVoice();
        if (this.voicesReady) {
          clearInterval(interval);
          done();
        }
        if (origHandler) (origHandler as any).call(speechSynthesis);
      };

      // Safety timeout — 5 seconds max
      setTimeout(() => { clearInterval(interval); done(); }, 5000);
    });
  }

  private selectDefaultVoice() {
    const voices = speechSynthesis.getVoices();
    if (voices.length === 0) {
      this.voicesReady = false;
      return;
    }
    this.voicesReady = true;
    // Prefer English voices, fall back to whatever is available
    this.voice =
      voices.find((v) => v.lang.startsWith('en') && v.default) ||
      voices.find((v) => v.name.includes('David')) ||
      voices.find((v) => v.name.includes('Zira')) ||
      voices.find((v) => v.lang.startsWith('en-US')) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      voices[0] ||
      null;
    console.log('[BrailChrome] Voice selected:', this.voice?.name, this.voice?.lang);
  }

  setRate(rate: number) {
    this.rate = Math.max(0.5, Math.min(3.0, rate));
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  setVoiceByName(name: string) {
    const v = speechSynthesis.getVoices().find((v) => v.name === name);
    if (v) this.voice = v;
  }

  onWord(callback: (word: string) => void) {
    this.onWordCallback = callback;
  }

  speak(text: string, options: SpeakOptions = {}): Promise<void> {
    const priority = options.priority || 'normal';
    text = this.cleanText(text);
    if (!text.trim()) return Promise.resolve();

    // If voices aren't loaded yet, wait then speak
    if (!this.voicesReady) {
      return this.waitForVoices().then(() => this.speak(text, options));
    }

    return new Promise((resolve) => {
      const item: QueueItem = { text, priority, resolve };

      if (priority === 'high') {
        // Interrupt everything
        speechSynthesis.cancel();
        this.queue = [];
        this.isSpeakingFlag = false;
        this.queue.unshift(item);
      } else if (priority === 'low' && this.queue.length > 3) {
        // Drop low-priority items when the queue is saturated
        resolve();
        return;
      } else {
        this.queue.push(item);
      }

      if (!this.isSpeakingFlag) {
        this.processQueue();
      }
    });
  }

  private cleanText(text: string): string {
    return text
      .replace(
        /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
        ' '
      )
      .replace(/https?:\/\/[^\s]+/g, 'link')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.isSpeakingFlag = false;
      return;
    }

    this.isSpeakingFlag = true;
    const item = this.queue.shift()!;

    const chunks = this.chunkText(item.text);

    for (const chunk of chunks) {
      if (this.queue.length > 0 && this.queue[0].priority === 'high') break;
      await this.speakChunk(chunk);
    }

    item.resolve();
    this.processQueue();
  }

  private chunkText(text: string): string[] {
    if (text.length <= 200) return [text];

    const chunks: string[] = [];
    const sentences = text.split(/(?<=[.!?])\s+/);
    let current = '';

    for (const sentence of sentences) {
      if (current.length + sentence.length > 200 && current) {
        chunks.push(current.trim());
        current = sentence;
      } else {
        current += (current ? ' ' : '') + sentence;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks.length > 0 ? chunks : [text];
  }

  private speakChunk(text: string): Promise<void> {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = this.rate;
      utterance.volume = this.volume;
      if (this.voice) utterance.voice = this.voice;

      const estimatedMs = (text.length / Math.max(this.rate, 0.5)) * 90 + 5000;
      const timeout = setTimeout(() => {
        speechSynthesis.cancel();
        resolve();
      }, estimatedMs);

      const done = () => {
        clearTimeout(timeout);
        resolve();
      };

      utterance.onend = done;
      utterance.onerror = (e) => {
        console.warn('[BrailChrome] Speech error:', e.error);
        done();
      };

      if (this.onWordCallback) {
        utterance.onboundary = (event) => {
          if (event.name === 'word') {
            const word = text.slice(
              event.charIndex,
              event.charIndex + (event.charLength || 0)
            );
            this.onWordCallback!(word);
          }
        };
      }

      speechSynthesis.speak(utterance);
    });
  }

  stop() {
    speechSynthesis.cancel();
    this.queue = [];
    this.isSpeakingFlag = false;
  }

  isSpeaking() {
    return speechSynthesis.speaking;
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    return speechSynthesis.getVoices();
  }
}
