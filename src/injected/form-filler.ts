/**
 * Handles form interaction: setting input values in a way that works
 * with React/Vue/Angular controlled components, dispatching proper events.
 */

export function typeText(text: string): boolean {
  const activeEl = document.activeElement;
  if (!activeEl) return false;

  // Handle special commands
  if (text === '__SCROLL_DOWN__') {
    window.scrollBy({ top: 400, behavior: 'smooth' });
    return true;
  }
  if (text === '__SCROLL_UP__') {
    window.scrollBy({ top: -400, behavior: 'smooth' });
    return true;
  }
  if (text === '\n') {
    // Submit / press Enter
    activeEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
    activeEl.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', bubbles: true }));
    activeEl.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true }));

    // Also try submitting the closest form
    const form = activeEl.closest('form');
    if (form) {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
    return true;
  }

  // Set value on input/textarea
  if (activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement) {
    setNativeValue(activeEl, text);
    return true;
  }

  // contenteditable
  if (activeEl.getAttribute('contenteditable') === 'true') {
    if (text === '') {
      activeEl.textContent = '';
    } else {
      activeEl.textContent = text;
    }
    activeEl.dispatchEvent(new Event('input', { bubbles: true }));
    activeEl.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  // If the focused element isn't an input, try to find the nearest one
  const nearestInput = findNearestInput(activeEl);
  if (nearestInput) {
    nearestInput.focus();
    setNativeValue(nearestInput, text);
    return true;
  }

  return false;
}

function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  // Use the native setter to bypass React's synthetic event system
  const proto = el instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;

  const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
  if (descriptor && descriptor.set) {
    descriptor.set.call(el, value);
  } else {
    el.value = value;
  }

  // Dispatch all the events that frameworks listen for
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));

  // Also dispatch keyboard-like events for frameworks that listen to those
  for (const char of value.slice(-1)) {
    el.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keypress', { key: char, bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }));
  }
}

function findNearestInput(el: Element): HTMLInputElement | HTMLTextAreaElement | null {
  // Look for an input within the same parent container
  const parent = el.closest('div, form, section, [role="search"]');
  if (parent) {
    const input = parent.querySelector('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea');
    if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
      return input;
    }
  }
  return null;
}

export function clearCurrentField(): boolean {
  const activeEl = document.activeElement;
  if (activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement) {
    setNativeValue(activeEl, '');
    return true;
  }
  if (activeEl && activeEl.getAttribute('contenteditable') === 'true') {
    activeEl.textContent = '';
    activeEl.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }
  return false;
}
