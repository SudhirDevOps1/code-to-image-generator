import { describe, expect, it } from 'vitest';
import {
  buildShareUrl,
  decodeShareState,
  encodeShareState,
  readShareState,
  SHARE_PREFIX,
} from '../../src/js/share.js';
import { createDefaultState } from '../../src/js/state.js';
import { LIMITS } from '../../src/js/config.js';

const pseudoRandom = (length) => {
  let seed = 42;
  let out = '';
  while (out.length < length) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    out += seed.toString(36);
  }
  return out.slice(0, length);
};

describe('share links', () => {
  it('round-trips the full editor state', () => {
    const state = createDefaultState();
    state.code = 'const answer = 42;\nconsole.log(answer);';
    state.language = 'javascript';
    state.theme = 'dracula';
    state.fontSize = 22;
    state.bgMode = 'solid';
    state.bgColor = '#101010';
    state.watermark = '@codesnap';

    const encoded = encodeShareState(state);
    expect(encoded).toBeTruthy();

    const decoded = decodeShareState(encoded);
    expect(decoded).toEqual(state);
  });

  it('returns null for malformed payloads', () => {
    expect(decodeShareState('')).toBeNull();
    expect(decodeShareState('not-a-real-payload')).toBeNull();
    expect(decodeShareState(undefined)).toBeNull();
    expect(readShareState('#other=1')).toBeNull();
  });

  it('normalizes hostile values from a shared link', () => {
    const encoded = encodeShareState({
      code: '<script>alert(1)</script>',
      language: 'evil',
      fontSize: 9999,
    });
    const decoded = decodeShareState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded.language).toBe('javascript');
    expect(decoded.fontSize).toBe(30);
    expect(decoded.code).toBe('<script>alert(1)</script>');
  });

  it('refuses to build a link for very large snippets', () => {
    const state = createDefaultState();
    state.code = pseudoRandom(LIMITS.code);
    expect(encodeShareState(state)).toBeNull();
    expect(
      buildShareUrl(state, { origin: 'https://example.com', pathname: '/app/', search: '' }),
    ).toBeNull();
  });

  it('builds a share URL that keeps the current path', () => {
    const state = createDefaultState();
    state.code = 'print("hi")';
    const url = buildShareUrl(state, {
      origin: 'https://example.com',
      pathname: '/app/',
      search: '?ref=test',
    });
    expect(url.startsWith('https://example.com/app/?ref=test')).toBe(true);
    expect(url).toContain(SHARE_PREFIX);
    expect(readShareState(url.slice(url.indexOf('#')))).toEqual(state);
  });
});
