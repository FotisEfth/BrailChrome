/**
 * Entry point for the injected bundle.
 * Gets bundled by esbuild into a single IIFE that is injected into every page.
 * Exposes window.__brailchrome for the main process to call via executeJavaScript.
 */

import { analyzePage, getPageText } from './page-analyzer';
import { initFocusManager, focusMove, navigateToSection, clickCurrent, whereAmI, refreshFocusableList } from './focus-manager';
import { typeText, clearCurrentField } from './form-filler';

declare global {
  interface Window {
    __brailchrome: BrailChromeAPI;
  }
}

interface BrailChromeAPI {
  init(url: string): void;
  focusMove(direction: 'next' | 'prev'): object | null;
  navigateToSection(name: string): void;
  clickCurrent(): void;
  typeText(text: string): void;
  whereAmI(): string;
  readPage(): string;
  getPageModel(): object;
}

// Debounce helper
function debounce(fn: () => void, ms: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(fn, ms);
  };
}

// Send message to main process via console.log bridge
function sendToMain(type: string, payload: any) {
  console.log('BRAILCHROME:' + JSON.stringify({ type, payload }));
}

// MutationObserver for dynamic content (SPAs)
let observer: MutationObserver | null = null;
let lastFocusableCount = 0;

function setupMutationObserver() {
  if (observer) observer.disconnect();

  const debouncedReanalyze = debounce(() => {
    refreshFocusableList();
    const model = analyzePage(window.location.href);
    // Only notify if focusable count changed significantly (>10% or >5 elements)
    const diff = Math.abs(model.focusableCount - lastFocusableCount);
    if (diff > 5 || (lastFocusableCount > 0 && diff / lastFocusableCount > 0.1)) {
      lastFocusableCount = model.focusableCount;
      sendToMain('page-analyzed', {
        title: model.title,
        url: model.url,
        sections: model.sections,
        focusableCount: model.focusableCount,
        currentFocusIndex: -1,
      });
    }
  }, 800);

  observer = new MutationObserver((_mutations) => {
    debouncedReanalyze();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false,
  });
}

// Main API exposed to window
window.__brailchrome = {
  init(url: string) {
    initFocusManager();

    const model = analyzePage(url);
    lastFocusableCount = model.focusableCount;

    sendToMain('page-analyzed', {
      title: model.title,
      url: model.url,
      sections: model.sections,
      focusableCount: model.focusableCount,
      currentFocusIndex: -1,
    });

    setupMutationObserver();
  },

  focusMove(direction: 'next' | 'prev') {
    const info = focusMove(direction);
    if (info) {
      sendToMain('focus-changed', info);
    }
    return info;
  },

  navigateToSection(name: string) {
    const result = navigateToSection(name);
    if (result) {
      sendToMain('focus-changed', result);
    } else {
      sendToMain('focus-changed', {
        label: `Could not find section "${name}" on this page`,
        role: 'error',
        position: '',
        isInput: false,
      });
    }
  },

  clickCurrent() {
    const success = clickCurrent();
    if (!success) {
      sendToMain('focus-changed', {
        label: 'No element to click. Press Tab to focus an element first.',
        role: 'error',
        position: '',
        isInput: false,
      });
    }
  },

  typeText(text: string) {
    const success = typeText(text);
    if (!success) {
      sendToMain('focus-changed', {
        label: 'No text field is focused. Navigate to a text field first.',
        role: 'error',
        position: '',
        isInput: false,
      });
    }
  },

  whereAmI(): string {
    return whereAmI();
  },

  readPage(): string {
    return getPageText();
  },

  getPageModel() {
    const model = analyzePage(window.location.href);
    return {
      title: model.title,
      url: model.url,
      sections: model.sections,
      focusableCount: model.focusableCount,
      currentFocusIndex: -1,
    };
  },
};
