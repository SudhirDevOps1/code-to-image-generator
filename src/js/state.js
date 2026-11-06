import { DEFAULT_STATE, LANGUAGES, FONTS, THEMES, EXPORT_FORMATS, LIMITS } from './config.js';

export const STORAGE_KEY = 'codesnap.state.v3';
export const HISTORY_LIMIT = 50;
export const HISTORY_COALESCE_MS = 600;

const clamp = (value, [min, max], fallback) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n * 100) / 100));
};

const pickEnum = (value, items, fallback) =>
  items.some((item) => item.id === value) ? value : fallback;

const asString = (value, fallback, maxLength) => {
  if (typeof value !== 'string') return fallback;
  return value.slice(0, maxLength);
};

const HEX = /^#[0-9a-f]{6}$/i;
const asColor = (value, fallback) => (HEX.test(value) ? value.toLowerCase() : fallback);

/**
 * Coerce arbitrary input (localStorage, URL hash, imported JSON) into a valid,
 * bounded application state. Unknown keys are dropped on purpose.
 */
export function normalizeState(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const d = DEFAULT_STATE;

  return {
    code: asString(source.code, d.code, LIMITS.code),
    language: pickEnum(source.language, LANGUAGES, d.language),
    font: pickEnum(source.font, FONTS, d.font),
    theme: pickEnum(source.theme, THEMES, d.theme),
    fontSize: clamp(source.fontSize, LIMITS.fontSize, d.fontSize),
    padding: clamp(source.padding, LIMITS.padding, d.padding),
    shadow: clamp(source.shadow, LIMITS.shadow, d.shadow),
    shadowColor: asColor(source.shadowColor, d.shadowColor),
    bgMode: source.bgMode === 'solid' ? 'solid' : 'gradient',
    bgFrom: asColor(source.bgFrom, d.bgFrom),
    bgTo: asColor(source.bgTo, d.bgTo),
    bgAngle: clamp(source.bgAngle, [0, 360], d.bgAngle),
    bgColor: asColor(source.bgColor, d.bgColor),
    showLineNumbers: Boolean(source.showLineNumbers),
    showWindowControls: source.showWindowControls !== false,
    windowTitle: asString(source.windowTitle, d.windowTitle, LIMITS.windowTitle),
    watermark: asString(source.watermark, d.watermark, LIMITS.watermark),
    exportScale: clamp(source.exportScale, LIMITS.scale, d.exportScale),
    exportFormat: pickEnum(source.exportFormat, EXPORT_FORMATS, d.exportFormat),
    exportQuality: clamp(source.exportQuality, LIMITS.quality, d.exportQuality),
    transparent: Boolean(source.transparent),
  };
}

export function createDefaultState() {
  return normalizeState(DEFAULT_STATE);
}

export function statesEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Minimal observable store with undo/redo. State is immutable: every update
 * produces a new object, which keeps rendering predictable and testable.
 */
export function createStore(initial, { now = () => Date.now() } = {}) {
  let state = normalizeState(initial);
  const listeners = new Set();
  const undoStack = [];
  const redoStack = [];
  let lastHistoryKey = null;
  let lastHistoryAt = 0;

  const emit = (next, prev) => {
    for (const listener of listeners) listener(next, prev);
  };

  return {
    get() {
      return state;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    set(patch, { history = true } = {}) {
      const prev = state;
      const next = normalizeState({ ...state, ...patch });
      if (statesEqual(prev, next)) return state;

      if (history) {
        const keys = Object.keys(patch);
        const key = keys.length === 1 ? keys[0] : null;
        const at = now();
        const isBurst = key && key === lastHistoryKey && at - lastHistoryAt < HISTORY_COALESCE_MS;

        if (!isBurst || undoStack.length === 0) {
          undoStack.push(prev);
          if (undoStack.length > HISTORY_LIMIT) undoStack.shift();
        }

        redoStack.length = 0;
        lastHistoryKey = key;
        lastHistoryAt = at;
      }

      state = next;
      emit(state, prev);
      return state;
    },

    replace(nextState, { history = false } = {}) {
      return this.set(nextState, { history });
    },

    undo() {
      const prev = undoStack.pop();
      if (!prev) return false;
      redoStack.push(state);
      state = prev;
      lastHistoryKey = null;
      emit(state, prev);
      return true;
    },

    redo() {
      const next = redoStack.pop();
      if (!next) return false;
      undoStack.push(state);
      state = next;
      lastHistoryKey = null;
      emit(state, next);
      return true;
    },

    canUndo: () => undoStack.length > 0,
    canRedo: () => redoStack.length > 0,
    clearHistory() {
      undoStack.length = 0;
      redoStack.length = 0;
      lastHistoryKey = null;
    },
  };
}
