import { getLanguage, getFormat } from './config.js';

/** One line number per line of code, preserving empty trailing lines. */
export function renderLineNumbers(code = '') {
  const lineCount = Math.max(1, code.split('\n').length);
  return Array.from({ length: lineCount }, (_, index) => index + 1).join('\n');
}

export function countLines(code = '') {
  return Math.max(1, code.split('\n').length);
}

export function countChars(code = '') {
  return [...code].length;
}

export function formatBytes(chars) {
  if (chars < 1024) return `${chars} B`;
  if (chars < 1024 * 1024) return `${(chars / 1024).toFixed(1)} KB`;
  return `${(chars / (1024 * 1024)).toFixed(2)} MB`;
}

/** Resolve the canvas background from the flat state shape. */
export function backgroundCss(state) {
  if (state.bgMode === 'solid') return state.bgColor;
  return `linear-gradient(${state.bgAngle}deg, ${state.bgFrom}, ${state.bgTo})`;
}

const pad = (n) => String(n).padStart(2, '0');

/** `#6366f1` -> `{ r: 99, g: 102, b: 241 }` (safe fallback for invalid input). */
export function hexToRgb(hex) {
  const match = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex ?? '');
  if (!match) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16),
  };
}

/** `codesnap-js-20261106-143005.png` — stable, sortable, filesystem-safe. */
export function buildFilename(state, date = new Date()) {
  const language = getLanguage(state.language);
  const format = getFormat(state.exportFormat);
  const stamp = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '-',
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('');
  const ext = format.id === 'jpeg' ? 'jpg' : format.id;
  return `codesnap-${language.ext}-${stamp}.${ext}`;
}

/** Human-readable label for the window header. */
export function windowLabel(state) {
  const title = state.windowTitle.trim();
  if (title) return title;
  return getLanguage(state.language).label;
}
