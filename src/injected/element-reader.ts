/**
 * Extracts human-readable text descriptions from DOM elements.
 * Used by TTS to announce what each element is/does.
 */

export function getElementLabel(el: Element): string {
  // 1. Explicit ARIA label
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel && ariaLabel.trim()) return ariaLabel.trim();

  // 2. aria-labelledby
  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    const parts: string[] = [];
    for (const id of labelledBy.split(/\s+/)) {
      const ref = document.getElementById(id);
      if (ref) parts.push(ref.textContent?.trim() || '');
    }
    const joined = parts.filter(Boolean).join(' ');
    if (joined) return joined;
  }

  // 3. <label> for inputs
  if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
    if (el.id) {
      const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (label) return label.textContent?.trim() || '';
    }
    // Placeholder
    if ('placeholder' in el && (el as HTMLInputElement).placeholder) {
      return (el as HTMLInputElement).placeholder;
    }
  }

  // 4. alt text for images
  if (el instanceof HTMLImageElement && el.alt) {
    return el.alt.trim();
  }

  // 5. Image inside a link/button
  const img = el.querySelector('img[alt]');
  if (img && (img as HTMLImageElement).alt) {
    return (img as HTMLImageElement).alt.trim();
  }

  // 6. SVG title
  const svgTitle = el.querySelector('title');
  if (svgTitle && el.closest('svg')) {
    return svgTitle.textContent?.trim() || '';
  }

  // 7. title attribute
  const title = el.getAttribute('title');
  if (title && title.trim()) return title.trim();

  // 8. Direct text content (truncated)
  const text = getVisibleText(el);
  if (text) return text;

  // 9. Value for inputs
  if (el instanceof HTMLInputElement && el.value) {
    return `Current value: ${el.value}`;
  }

  return '';
}

export function getElementRole(el: Element): string {
  // Explicit ARIA role
  const role = el.getAttribute('role');
  if (role) return role;

  // Implicit roles
  const tag = el.tagName.toLowerCase();
  const roleMap: Record<string, string> = {
    a: 'link',
    button: 'button',
    input: getInputRole(el as HTMLInputElement),
    select: 'dropdown',
    textarea: 'text area',
    nav: 'navigation',
    main: 'main content',
    header: 'header',
    footer: 'footer',
    aside: 'sidebar',
    article: 'article',
    section: 'section',
    form: 'form',
    h1: 'heading level 1',
    h2: 'heading level 2',
    h3: 'heading level 3',
    h4: 'heading level 4',
    h5: 'heading level 5',
    h6: 'heading level 6',
    img: 'image',
    video: 'video',
    audio: 'audio',
    table: 'table',
    dialog: 'dialog',
  };

  return roleMap[tag] || 'element';
}

function getInputRole(el: HTMLInputElement): string {
  const type = (el.type || 'text').toLowerCase();
  const typeMap: Record<string, string> = {
    text: 'text field',
    password: 'password field',
    email: 'email field',
    search: 'search field',
    tel: 'phone field',
    url: 'URL field',
    number: 'number field',
    checkbox: el.checked ? 'checkbox, checked' : 'checkbox, unchecked',
    radio: el.checked ? 'radio button, selected' : 'radio button',
    submit: 'submit button',
    button: 'button',
    file: 'file upload',
    range: 'slider',
    date: 'date picker',
    time: 'time picker',
  };
  return typeMap[type] || 'input field';
}

export function getVisibleText(el: Element): string {
  // Get only directly visible text, not hidden children
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      // Skip hidden elements
      if (parent.hidden) return NodeFilter.FILTER_REJECT;
      const style = getComputedStyle(parent);
      if (style.display === 'none' || style.visibility === 'hidden') {
        return NodeFilter.FILTER_REJECT;
      }
      // Skip script/style
      const tag = parent.tagName.toLowerCase();
      if (tag === 'script' || tag === 'style' || tag === 'noscript') {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const parts: string[] = [];
  let totalLen = 0;
  const MAX_LEN = 200;

  while (walker.nextNode()) {
    const text = walker.currentNode.textContent?.trim();
    if (text) {
      parts.push(text);
      totalLen += text.length;
      if (totalLen > MAX_LEN) break;
    }
  }

  let result = parts.join(' ').replace(/\s+/g, ' ').trim();
  if (result.length > MAX_LEN) {
    result = result.substring(0, MAX_LEN) + '...';
  }
  return result;
}

export function describeElement(el: Element, index: number, total: number): string {
  const label = getElementLabel(el);
  const role = getElementRole(el);
  const position = `${index + 1} of ${total}`;

  const parts: string[] = [];
  if (label) parts.push(label);
  if (role && role !== 'element') parts.push(role);
  parts.push(position);

  return parts.join('. ');
}

export function isElementVisible(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.hidden) return false;
  if (el.getAttribute('aria-hidden') === 'true') return false;

  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return false;

  const style = getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }

  return true;
}

export function isInputElement(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  if (tag === 'input') {
    const type = (el as HTMLInputElement).type?.toLowerCase();
    return !['submit', 'button', 'reset', 'image', 'hidden'].includes(type);
  }
  return tag === 'textarea' || el.getAttribute('contenteditable') === 'true';
}
