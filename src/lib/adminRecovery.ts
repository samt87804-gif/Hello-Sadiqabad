const ADMIN_RECOVERY_PREFIX = 'hs:admin-recovery:v1:';

type SavedControl = {
  key: string;
  kind: 'value' | 'checked' | 'content';
  value: string | boolean;
};

type AdminRecoverySnapshot = {
  savedAt: number;
  scrollY: number;
  controls: SavedControl[];
};

function isRecoverableControl(element: Element): element is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLElement {
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) return true;
  if (element instanceof HTMLInputElement) {
    return !['password', 'file', 'hidden', 'submit', 'button', 'reset', 'image'].includes(element.type);
  }
  return element instanceof HTMLElement && element.isContentEditable;
}

function controlSignature(element: Element): string {
  const el = element as HTMLElement;
  const tag = element.tagName.toLowerCase();
  const inputType = element instanceof HTMLInputElement ? element.type : '';
  const stable = el.dataset.recoveryKey || el.getAttribute('name') || el.id ||
    el.getAttribute('aria-label') || el.getAttribute('placeholder') || '';
  const formIndex = Array.from(document.forms).indexOf(el.closest('form') as HTMLFormElement);
  const fallbackIndex = Array.from(document.querySelectorAll('[data-admin-scroll-ready="true"] input, [data-admin-scroll-ready="true"] textarea, [data-admin-scroll-ready="true"] select, [data-admin-scroll-ready="true"] [contenteditable="true"]')).indexOf(element);
  return stable ? `${tag}:${inputType}:${stable}` : `${tag}:${inputType}:form-${formIndex}:field-${fallbackIndex}`;
}

function getAdminRecoveryKey(pathname: string): string {
  return `${ADMIN_RECOVERY_PREFIX}${pathname}`;
}

/** Save unfinished admin form work before a tab is hidden, discarded, or reloaded. */
export function saveAdminRecoverySnapshot(pathname = window.location.pathname): void {
  if (!pathname.startsWith('/admin')) return;
  const root = document.querySelector('[data-admin-scroll-ready="true"]');
  if (!root) return;

  const occurrences = new Map<string, number>();
  const controls: SavedControl[] = [];
  const elements = root.querySelectorAll('input, textarea, select, [contenteditable="true"]');
  elements.forEach((element) => {
    if (!isRecoverableControl(element) || element.hasAttribute('data-recovery-ignore')) return;
    const signature = controlSignature(element);
    const occurrence = occurrences.get(signature) ?? 0;
    occurrences.set(signature, occurrence + 1);

    if (element instanceof HTMLInputElement && ['checkbox', 'radio'].includes(element.type)) {
      controls.push({ key: `${signature}#${occurrence}`, kind: 'checked', value: element.checked });
    } else if (element instanceof HTMLElement && element.isContentEditable) {
      controls.push({ key: `${signature}#${occurrence}`, kind: 'content', value: element.textContent ?? '' });
    } else {
      controls.push({ key: `${signature}#${occurrence}`, kind: 'value', value: (element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value });
    }
  });

  const snapshot: AdminRecoverySnapshot = {
    savedAt: Date.now(),
    scrollY: Math.max(0, window.scrollY || window.pageYOffset || 0),
    controls,
  };
  try {
    localStorage.setItem(getAdminRecoveryKey(pathname), JSON.stringify(snapshot));
  } catch {
    // Storage may be unavailable or full; the page remains usable.
  }
}

function setNativeControlValue(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
  const prototype = Object.getPrototypeOf(element);
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
  if (descriptor?.set) descriptor.set.call(element, value);
  else element.value = value;
}

function restoreControl(element: Element, saved: SavedControl) {
  if (!isRecoverableControl(element)) return;
  if (saved.kind === 'checked' && element instanceof HTMLInputElement) {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked');
    if (descriptor?.set) descriptor.set.call(element, Boolean(saved.value));
    else element.checked = Boolean(saved.value);
  } else if (saved.kind === 'content' && element instanceof HTMLElement && element.isContentEditable) {
    element.textContent = String(saved.value);
  } else if (saved.kind === 'value' && (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) {
    setNativeControlValue(element, String(saved.value));
  } else {
    return;
  }
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

/** Restore unfinished admin form work once the protected admin UI has rendered. */
export function restoreAdminRecoverySnapshot(pathname = window.location.pathname): number | null {
  if (!pathname.startsWith('/admin')) return null;
  try {
    const raw = localStorage.getItem(getAdminRecoveryKey(pathname));
    if (!raw) return null;
    const snapshot = JSON.parse(raw) as AdminRecoverySnapshot;
    if (!snapshot || Date.now() - snapshot.savedAt > 12 * 60 * 60 * 1000) {
      localStorage.removeItem(getAdminRecoveryKey(pathname));
      return null;
    }

    const root = document.querySelector('[data-admin-scroll-ready="true"]');
    if (!root) return null;
    const occurrences = new Map<string, number>();
    const lookup = new Map<string, Element>();
    root.querySelectorAll('input, textarea, select, [contenteditable="true"]').forEach((element) => {
      if (!isRecoverableControl(element) || element.hasAttribute('data-recovery-ignore')) return;
      const signature = controlSignature(element);
      const occurrence = occurrences.get(signature) ?? 0;
      occurrences.set(signature, occurrence + 1);
      lookup.set(`${signature}#${occurrence}`, element);
    });

    snapshot.controls.forEach((saved) => {
      const element = lookup.get(saved.key);
      if (element) restoreControl(element, saved);
    });
    return Math.max(0, Number(snapshot.scrollY) || 0);
  } catch {
    return null;
  }
}
