import { describe, expect, it } from 'vitest';
import {
  DEFAULT_STATE,
  EXPORT_FORMATS,
  FONTS,
  GRADIENTS,
  LANGUAGES,
  THEMES,
  getFormat,
  getLanguage,
} from '../../src/js/config.js';

const HEX = /^#[0-9a-f]{6}$/i;

describe('configuration integrity', () => {
  it('has unique identifiers', () => {
    for (const list of [LANGUAGES, FONTS, THEMES, GRADIENTS, EXPORT_FORMATS]) {
      const ids = list.map((item) => item.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('maps every language to a Prism grammar and a colour', () => {
    for (const language of LANGUAGES) {
      expect(language.prism.length).toBeGreaterThan(0);
      expect(language.color).toMatch(HEX);
      expect(language.ext.length).toBeGreaterThan(0);
    }
  });

  it('uses html2canvas-safe hex colours for themes and gradients', () => {
    for (const theme of THEMES) expect(theme.bg).toMatch(HEX);
    for (const gradient of GRADIENTS) {
      expect(gradient.from).toMatch(HEX);
      expect(gradient.to).toMatch(HEX);
      expect(gradient.angle).toBeGreaterThanOrEqual(0);
      expect(gradient.angle).toBeLessThanOrEqual(360);
    }
    for (const color of [DEFAULT_STATE.bgFrom, DEFAULT_STATE.bgTo, DEFAULT_STATE.shadowColor]) {
      expect(color).toMatch(HEX);
    }
  });

  it('resolves known ids and falls back safely', () => {
    expect(getLanguage('python').label).toBe('Python');
    expect(getLanguage('nope')).toBe(LANGUAGES[0]);
    expect(getFormat('webp').mime).toBe('image/webp');
    expect(getFormat('nope')).toBe(EXPORT_FORMATS[0]);
  });

  it('keeps the default state valid for its own enums', () => {
    expect(LANGUAGES.some((l) => l.id === DEFAULT_STATE.language)).toBe(true);
    expect(FONTS.some((f) => f.id === DEFAULT_STATE.font)).toBe(true);
    expect(THEMES.some((t) => t.id === DEFAULT_STATE.theme)).toBe(true);
    expect(EXPORT_FORMATS.some((f) => f.id === DEFAULT_STATE.exportFormat)).toBe(true);
  });
});
