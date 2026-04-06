import { ParsedCommand } from '../shared/types';
import { COMMANDS } from '../shared/constants';

export class CommandParser {
  private currentSections: string[] = [];

  updateSections(sections: string[]) {
    this.currentSections = sections.map((s) => s.toLowerCase());
  }

  parse(rawText: string): ParsedCommand {
    let text = rawText.toLowerCase().trim();

    // Strip common filler phrases
    const fillers = [
      'please',
      'can you',
      'could you',
      'i want to',
      'i need to',
      'would you',
      'hey',
    ];
    for (const filler of fillers) {
      text = text.replace(filler, '').trim();
    }

    // ── Stop ──────────────────────────────────────────────────────────────
    if (this.matchesAny(text, COMMANDS.STOP_WORDS)) {
      return { type: 'stop', confidence: 0.95 };
    }

    // ── History navigation ─────────────────────────────────────────────────
    if (this.matchesAny(text, COMMANDS.BACK_WORDS)) {
      return { type: 'go_back', confidence: 0.9 };
    }
    if (this.matchesAny(text, COMMANDS.FORWARD_WORDS)) {
      return { type: 'go_forward', confidence: 0.9 };
    }

    // ── Reload ─────────────────────────────────────────────────────────────
    if (this.matchesAny(text, COMMANDS.RELOAD_WORDS)) {
      return { type: 'reload', confidence: 0.9 };
    }

    // ── Where am I ────────────────────────────────────────────────────────
    if (this.matchesAny(text, COMMANDS.WHERE_WORDS)) {
      return { type: 'where_am_i', confidence: 0.9 };
    }

    // ── Read page ─────────────────────────────────────────────────────────
    if (this.matchesAny(text, COMMANDS.READ_WORDS)) {
      return { type: 'read_page', confidence: 0.9 };
    }

    // ── Help ──────────────────────────────────────────────────────────────
    if (this.matchesAny(text, COMMANDS.HELP_WORDS)) {
      return { type: 'help', confidence: 0.95 };
    }

    // ── Scroll ────────────────────────────────────────────────────────────
    if (this.matchesAny(text, COMMANDS.SCROLL_DOWN_WORDS)) {
      return { type: 'scroll', target: 'down', confidence: 0.85 };
    }
    if (this.matchesAny(text, COMMANDS.SCROLL_UP_WORDS)) {
      return { type: 'scroll', target: 'up', confidence: 0.85 };
    }

    // ── Search ────────────────────────────────────────────────────────────
    for (const word of COMMANDS.SEARCH_WORDS) {
      if (text.startsWith(word + ' ') || text === word) {
        const value = text.slice(word.length).trim();
        if (value) {
          return { type: 'search', value, confidence: 0.9 };
        }
      }
    }

    // ── Type / dictate ────────────────────────────────────────────────────
    for (const word of COMMANDS.TYPE_WORDS) {
      if (text.startsWith(word + ' ')) {
        const value = text.slice(word.length).trim();
        if (value) return { type: 'type', value, confidence: 0.85 };
      }
    }

    // ── Navigate ("go to X", "open X", …) ────────────────────────────────
    for (const word of COMMANDS.NAVIGATE_WORDS) {
      const prefix = word + ' ';
      if (text.startsWith(prefix) || text === word) {
        const target = text.startsWith(prefix)
          ? text.slice(prefix.length).trim()
          : '';
        if (!target) continue;

        // Section on the current page?
        const sectionMatch = this.findSection(target);
        if (sectionMatch) {
          return { type: 'navigate', target: sectionMatch, confidence: 0.9 };
        }

        // Looks like a URL or known site name?
        if (target.includes('.') || this.isKnownSite(target)) {
          return {
            type: 'go_to_url',
            value: this.normalizeUrl(target),
            confidence: 0.85,
          };
        }

        // Assume it's a section name
        return { type: 'navigate', target, confidence: 0.7 };
      }
    }

    // ── Direct section name (user just says the section) ──────────────────
    const sectionMatch = this.findSection(text);
    if (sectionMatch) {
      return { type: 'navigate', target: sectionMatch, confidence: 0.85 };
    }

    // ── Bare URL / site name ──────────────────────────────────────────────
    if (text.includes('.') && !text.includes(' ')) {
      return {
        type: 'go_to_url',
        value: this.normalizeUrl(text),
        confidence: 0.8,
      };
    }

    if (this.isKnownSite(text)) {
      return {
        type: 'go_to_url',
        value: this.normalizeUrl(text),
        confidence: 0.85,
      };
    }

    // ── Fallback: treat as a search ───────────────────────────────────────
    if (text.length > 2) {
      return { type: 'search', value: text, confidence: 0.5 };
    }

    return { type: 'unknown', confidence: 0 };
  }

  private matchesAny(text: string, words: string[]): boolean {
    return words.some(
      (w) =>
        text === w ||
        text.startsWith(w + ' ') ||
        text.endsWith(' ' + w) ||
        text.includes(' ' + w + ' ')
    );
  }

  private findSection(target: string): string | undefined {
    // Exact match
    if (this.currentSections.includes(target)) return target;
    // Substring match
    return this.currentSections.find(
      (s) => s.includes(target) || target.includes(s)
    );
  }

  private isKnownSite(name: string): boolean {
    const sites = [
      'google',
      'instagram',
      'youtube',
      'twitter',
      'facebook',
      'amazon',
      'reddit',
      'netflix',
      'github',
      'wikipedia',
      'bing',
      'yahoo',
      'x',
      'tiktok',
      'linkedin',
    ];
    return sites.some((s) => name.toLowerCase() === s);
  }

  private normalizeUrl(text: string): string {
    const siteMap: Record<string, string> = {
      google: 'google.com',
      instagram: 'instagram.com',
      youtube: 'youtube.com',
      twitter: 'twitter.com',
      x: 'x.com',
      facebook: 'facebook.com',
      amazon: 'amazon.com',
      reddit: 'reddit.com',
      netflix: 'netflix.com',
      github: 'github.com',
      wikipedia: 'wikipedia.org',
      tiktok: 'tiktok.com',
      linkedin: 'linkedin.com',
      bing: 'bing.com',
      yahoo: 'yahoo.com',
    };
    return siteMap[text.toLowerCase()] || text;
  }
}
