import { describe, expect, it } from 'vitest';
import {
  backgroundCss,
  buildFilename,
  countChars,
  countLines,
  formatBytes,
  hexToRgb,
  renderLineNumbers,
  windowLabel,
} from '../../src/js/render.js';
import { createDefaultState } from '../../src/js/state.js';

describe('render helpers', () => {
  it('renders one line number per line, including trailing blanks', () => {
    expect(renderLineNumbers('a\nb')).toBe('1\n2');
    expect(renderLineNumbers('a\nb\n')).toBe('1\n2\n3');
    expect(renderLineNumbers('')).toBe('1');
  });

  it('counts lines and unicode characters', () => {
    expect(countLines('a\nb\nc')).toBe(3);
    expect(countChars('😀a')).toBe(2);
  });

  it('builds gradient and solid backgrounds', () => {
    expect(
      backgroundCss({ bgMode: 'gradient', bgFrom: '#111111', bgTo: '#222222', bgAngle: 90 }),
    ).toBe('linear-gradient(90deg, #111111, #222222)');
    expect(backgroundCss({ bgMode: 'solid', bgColor: '#abcdef' })).toBe('#abcdef');
  });

  it('creates deterministic, safe filenames', () => {
    const state = { ...createDefaultState(), language: 'python', exportFormat: 'png' };
    const date = new Date(2026, 0, 2, 3, 4, 5);
    expect(buildFilename(state, date)).toBe('codesnap-py-20260102-030405.png');

    const jpeg = { ...state, exportFormat: 'jpeg' };
    expect(buildFilename(jpeg, date)).toBe('codesnap-py-20260102-030405.jpg');
  });

  it('converts hex colours for shadows', () => {
    expect(hexToRgb('#6366f1')).toEqual({ r: 99, g: 102, b: 241 });
    expect(hexToRgb('000000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('oops')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('labels the window with a custom title or the language', () => {
    const state = createDefaultState();
    expect(windowLabel(state)).toBe('JavaScript');
    expect(windowLabel({ ...state, windowTitle: '  auth.ts  ' })).toBe('auth.ts');
  });

  it('formats byte counts', () => {
    expect(formatBytes(12)).toBe('12 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
  });
});
