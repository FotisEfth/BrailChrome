/**
 * Manages keyboard focus navigation within web pages.
 * Maintains an ordered list of focusable elements, tracks current index,
 * and provides visual focus ring highlighting.
 */

import { FocusableElement } from '../shared/types';
import { extractFocusableElements, findSectionElement } from './page-analyzer';
import { getElementLabel, getElementRole, isInputElement, describeElement } from './element-reader';

let focusableList: FocusableElement[] = [];
let currentIndex = -1;
let focusRingStyle: HTMLStyleElement | null = null;

const FOCUS_RING_ID = '__brailchrome-focus-ring';

export function initFocusManager() {
  injectFocusStyles();
  refreshFocusableList();
}

export function refreshFocusableList() {
  focusableList = extractFocusableElements();
  // Keep current index valid
  if (currentIndex >= focusableList.length) {
    currentIndex = focusableList.length - 1;
  }
}

function injectFocusStyles() {
  if (document.getElementById(FOCUS_RING_ID)) return;

  focusRingStyle = document.createElement('style');
  focusRingStyle.id = FOCUS_RING_ID;
  focusRingStyle.textContent = `
    .__brailchrome-focused {
      outline: 3px solid #e94560 !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 0 4px rgba(233, 69, 96, 0.3) !important;
      position: relative;
      z-index: 999999 !important;
    }
    .__brailchrome-focused::after {
      content: '';
      position: absolute;
      inset: -4px;
      border: 2px dashed #ffffff;
      border-radius: 4px;
      pointer-events: none;
      z-index: 999999;
    }
  `;
  (document.head || document.documentElement).appendChild(focusRingStyle);
}

function clearFocusRing() {
  const prev = document.querySelector('.__brailchrome-focused');
  if (prev) prev.classList.remove('__brailchrome-focused');
}

function applyFocusRing(el: Element) {
  clearFocusRing();
  el.classList.add('__brailchrome-focused');
  // Scroll into view
  el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
}

function getElementAtIndex(index: number): Element | null {
  if (index < 0 || index >= focusableList.length) return null;
  const info = focusableList[index];
  try {
    const el = document.querySelector(info.selector);
    return el;
  } catch {
    return null;
  }
}

export function focusMove(direction: 'next' | 'prev'): object | null {
  refreshFocusableList();
  if (focusableList.length === 0) {
    return { label: 'No focusable elements on this page', role: 'info', position: '', isInput: false };
  }

  if (direction === 'next') {
    currentIndex = (currentIndex + 1) % focusableList.length;
  } else {
    currentIndex = currentIndex <= 0 ? focusableList.length - 1 : currentIndex - 1;
  }

  const el = getElementAtIndex(currentIndex);
  if (!el) {
    return { label: 'Element not found', role: 'error', position: '', isInput: false };
  }

  applyFocusRing(el);
  if (el instanceof HTMLElement) el.focus({ preventScroll: true });

  const info = focusableList[currentIndex];
  return {
    label: info.label,
    role: info.role,
    position: `${currentIndex + 1} of ${focusableList.length}`,
    isInput: info.isInput,
  };
}

export function navigateToSection(sectionName: string): object | null {
  const url = window.location.href;
  const el = findSectionElement(sectionName, url);

  if (!el) {
    return null; // Will be handled by the caller to announce "section not found"
  }

  // If the section element is clickable (link/button), click it
  const tag = el.tagName.toLowerCase();
  const role = el.getAttribute('role');
  const isClickable = tag === 'a' || tag === 'button' || role === 'button' || role === 'link' || role === 'tab';

  if (isClickable) {
    applyFocusRing(el);
    if (el instanceof HTMLElement) {
      el.focus({ preventScroll: true });
      el.click();
    }

    // Update index to match this element
    const idx = focusableList.findIndex((f) => {
      try { return document.querySelector(f.selector) === el; } catch { return false; }
    });
    if (idx >= 0) currentIndex = idx;

    return {
      label: getElementLabel(el) || sectionName,
      role: 'activated',
      position: '',
      isInput: false,
    };
  }

  // If it's a container, find the first focusable child
  const firstFocusable = el.querySelector(
    'a[href], button, input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"]), [role="button"]'
  );

  if (firstFocusable) {
    applyFocusRing(firstFocusable);
    if (firstFocusable instanceof HTMLElement) firstFocusable.focus({ preventScroll: true });

    const idx = focusableList.findIndex((f) => {
      try { return document.querySelector(f.selector) === firstFocusable; } catch { return false; }
    });
    if (idx >= 0) currentIndex = idx;

    return {
      label: getElementLabel(firstFocusable) || sectionName,
      role: getElementRole(firstFocusable),
      position: idx >= 0 ? `${idx + 1} of ${focusableList.length}` : '',
      isInput: isInputElement(firstFocusable),
    };
  }

  // Just scroll to the section
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  applyFocusRing(el);

  return {
    label: sectionName,
    role: 'section',
    position: '',
    isInput: false,
  };
}

export function clickCurrent(): boolean {
  const el = getElementAtIndex(currentIndex);
  if (!el || !(el instanceof HTMLElement)) return false;

  el.click();
  return true;
}

export function whereAmI(): string {
  if (currentIndex < 0 || focusableList.length === 0) {
    return `You are on ${document.title || 'an untitled page'}. No element is focused. Press Tab to start navigating.`;
  }

  const info = focusableList[currentIndex];
  const el = getElementAtIndex(currentIndex);

  // Find which section we're in
  let sectionName = '';
  if (el) {
    const section = el.closest('nav, main, aside, header, footer, [role="navigation"], [role="main"], [role="complementary"]');
    if (section) {
      const sectionLabel = section.getAttribute('aria-label') || section.tagName.toLowerCase();
      sectionName = ` in ${sectionLabel}`;
    }
  }

  return `${document.title}. ` +
    `You are on ${info.label}. ${info.role}. ` +
    `Element ${currentIndex + 1} of ${focusableList.length}${sectionName}.`;
}

export function getCurrentIndex(): number {
  return currentIndex;
}

export function getFocusableCount(): number {
  return focusableList.length;
}
