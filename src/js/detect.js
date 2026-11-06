import { LANGUAGES } from './config.js';

/**
 * Aliases for extensions that share a language id but differ from the
 * canonical extension advertised in the language picker.
 */
const EXTENSION_ALIASES = {
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  tsx: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  htm: 'markup',
  vue: 'markup',
  scss: 'css',
  sass: 'css',
  less: 'css',
  cc: 'cpp',
  cxx: 'cpp',
  hpp: 'cpp',
};

const EXTENSION_MAP = {
  ...Object.fromEntries(LANGUAGES.map((l) => [l.ext, l.id])),
  ...EXTENSION_ALIASES,
};

const SIGNATURES = [
  [/^\s*<\?php/m, 'php'],
  [/^\s*<!doctype html|<\/[a-z][\w-]*>/im, 'markup'],
  [/^\s*package\s+main\b|^\s*func\s+\w+\s*\(/m, 'go'],
  [/^\s*(?:pub\s+)?fn\s+\w+/m, 'rust'],
  [/^\s*(?:public\s+)?(?:final\s+)?class\s+\w+|System\.out\.println/m, 'java'],
  [/^\s*fun\s+\w+\s*\(/m, 'kotlin'],
  [/^\s*(?:import\s+SwiftUI|import\s+Foundation|let\s+\w+\s*:\s*\w+)/m, 'swift'],
  [/^\s*def\s+\w+\s*\(|^\s*from\s+\w+\s+import\s+/m, 'python'],
  [/^\s*#include\s*<|std::/m, 'cpp'],
  [/^\s*interface\s+\w+\s*\{|:\s*(?:string|number|boolean)\b/m, 'typescript'],
  [/^\s*SELECT\s+.+\s+FROM\s+/im, 'sql'],
  [/^\s*(?:const|let|var|function|=>|import\s+.*from)/m, 'javascript'],
  [/^\s*[.#][\w-]+\s*\{[^}]*:[^}]*;/m, 'css'],
];

/** Best-effort language detection from a filename extension. */
export function detectLanguageFromFilename(filename = '') {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return EXTENSION_MAP[ext] ?? null;
}

/** Best-effort language detection from code content. */
export function detectLanguageFromCode(code = '') {
  const source = code.trim();
  if (!source) return null;
  for (const [pattern, language] of SIGNATURES) {
    if (pattern.test(source)) return language;
  }
  return null;
}

export function detectLanguage({ code = '', filename = '' } = {}) {
  return detectLanguageFromFilename(filename) ?? detectLanguageFromCode(code);
}
