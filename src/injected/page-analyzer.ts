/**
 * Analyzes the current page DOM to extract sections, focusable elements, and structure.
 * Sends the page model back to the main process via console.log bridge.
 */

import { SiteProfile, PageSection, FocusableElement } from '../shared/types';
import { getProfileForUrl } from './site-profiles/profile-registry';
import { getElementLabel, getElementRole, isElementVisible, isInputElement } from './element-reader';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  '[tabindex]:not([tabindex="-1"])',
  '[role="button"]',
  '[role="link"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[contenteditable="true"]',
].join(', ');

export interface AnalyzedPage {
  title: string;
  url: string;
  sections: PageSection[];
  focusableElements: FocusableElement[];
  focusableCount: number;
}

export function analyzePage(url: string): AnalyzedPage {
  const profile = getProfileForUrl(url);
  const title = document.title || 'Untitled page';

  const sections = extractSections(profile);
  const focusableElements = extractFocusableElements();

  return {
    title,
    url,
    sections,
    focusableElements,
    focusableCount: focusableElements.length,
  };
}

function extractSections(profile: SiteProfile): PageSection[] {
  const sections: PageSection[] = [];

  for (const profileSection of profile.sections) {
    try {
      const el = document.querySelector(profileSection.selector);
      if (el && isElementVisible(el)) {
        sections.push({
          id: profileSection.voiceNames[0],
          name: profileSection.description || profileSection.voiceNames[0],
          selector: profileSection.selector,
          voiceNames: profileSection.voiceNames,
        });
      }
    } catch {
      // Invalid selector — skip
    }
  }

  // If no site-profile sections found, try ARIA landmarks
  if (sections.length === 0) {
    const landmarks = [
      { selector: 'nav, [role="navigation"]', name: 'Navigation', id: 'nav' },
      { selector: 'main, [role="main"]', name: 'Main content', id: 'main' },
      { selector: '[role="search"]', name: 'Search', id: 'search' },
      { selector: 'aside, [role="complementary"]', name: 'Sidebar', id: 'sidebar' },
      { selector: 'header, [role="banner"]', name: 'Header', id: 'header' },
      { selector: 'footer, [role="contentinfo"]', name: 'Footer', id: 'footer' },
    ];

    for (const lm of landmarks) {
      const el = document.querySelector(lm.selector);
      if (el && isElementVisible(el)) {
        sections.push({
          id: lm.id,
          name: lm.name,
          selector: lm.selector,
          voiceNames: [lm.id, lm.name.toLowerCase()],
        });
      }
    }
  }

  // If still nothing, use headings
  if (sections.length === 0) {
    const headings = document.querySelectorAll('h1, h2, h3');
    headings.forEach((h, i) => {
      if (isElementVisible(h)) {
        const text = h.textContent?.trim() || `Section ${i + 1}`;
        sections.push({
          id: `heading-${i}`,
          name: text,
          selector: `:is(h1, h2, h3):nth-of-type(${i + 1})`,
          voiceNames: [text.toLowerCase()],
        });
      }
    });
  }

  return sections;
}

export function extractFocusableElements(): FocusableElement[] {
  const elements: FocusableElement[] = [];
  const allFocusable = document.querySelectorAll(FOCUSABLE_SELECTOR);

  let index = 0;
  allFocusable.forEach((el) => {
    if (!isElementVisible(el)) return;
    // Skip if disabled
    if ((el as HTMLButtonElement).disabled) return;

    const label = getElementLabel(el);
    const role = getElementRole(el);

    elements.push({
      index,
      tag: el.tagName.toLowerCase(),
      role,
      label: label || `Unlabeled ${role}`,
      selector: buildSelector(el),
      type: el instanceof HTMLInputElement ? el.type : undefined,
      isInput: isInputElement(el),
    });
    index++;
  });

  return elements;
}

function buildSelector(el: Element): string {
  // Build a unique CSS selector for this element
  if (el.id) return `#${CSS.escape(el.id)}`;

  const tag = el.tagName.toLowerCase();

  // Try aria-label
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) return `${tag}[aria-label="${CSS.escape(ariaLabel)}"]`;

  // Try href for links
  const href = el.getAttribute('href');
  if (href && tag === 'a') return `a[href="${CSS.escape(href)}"]`;

  // Try data-testid
  const testId = el.getAttribute('data-testid');
  if (testId) return `[data-testid="${CSS.escape(testId)}"]`;

  // Fallback: nth-of-type
  const parent = el.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children).filter((c) => c.tagName === el.tagName);
    const idx = siblings.indexOf(el) + 1;
    if (idx > 0) {
      const parentSelector = parent.id ? `#${CSS.escape(parent.id)}` : parent.tagName.toLowerCase();
      return `${parentSelector} > ${tag}:nth-of-type(${idx})`;
    }
  }

  return tag;
}

export function findSectionElement(sectionName: string, url: string): Element | null {
  const profile = getProfileForUrl(url);
  const lower = sectionName.toLowerCase();

  // Check site profile sections
  for (const section of profile.sections) {
    if (section.voiceNames.some((v) => v === lower || lower.includes(v) || v.includes(lower))) {
      try {
        const el = document.querySelector(section.selector);
        if (el && isElementVisible(el)) return el;
      } catch {
        // invalid selector
      }
    }
  }

  // Search by text content of links/buttons
  const clickables = document.querySelectorAll('a, button, [role="button"], [role="tab"], [role="link"]');
  for (const el of clickables) {
    if (!isElementVisible(el)) continue;
    const text = (el.textContent || '').trim().toLowerCase();
    const label = (el.getAttribute('aria-label') || '').toLowerCase();
    if (text === lower || label === lower || text.includes(lower) || label.includes(lower)) {
      return el;
    }
  }

  return null;
}

export function getPageText(): string {
  const mainContent = document.querySelector('main, [role="main"], article, #content, .content');
  const root = mainContent || document.body;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName.toLowerCase();
      if (['script', 'style', 'noscript', 'svg', 'path'].includes(tag)) {
        return NodeFilter.FILTER_REJECT;
      }
      if (parent.hidden || parent.getAttribute('aria-hidden') === 'true') {
        return NodeFilter.FILTER_REJECT;
      }
      const style = getComputedStyle(parent);
      if (style.display === 'none' || style.visibility === 'hidden') {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const parts: string[] = [];
  let totalLen = 0;
  const MAX_PAGE_TEXT = 5000;

  while (walker.nextNode()) {
    const text = walker.currentNode.textContent?.trim();
    if (text && text.length > 1) {
      parts.push(text);
      totalLen += text.length;
      if (totalLen > MAX_PAGE_TEXT) {
        parts.push('... Content truncated for readability.');
        break;
      }
    }
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}
