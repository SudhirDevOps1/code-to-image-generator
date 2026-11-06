import { describe, expect, it } from 'vitest';
import {
  detectLanguage,
  detectLanguageFromCode,
  detectLanguageFromFilename,
} from '../../src/js/detect.js';

describe('language detection', () => {
  it('detects by file extension', () => {
    expect(detectLanguageFromFilename('main.rs')).toBe('rust');
    expect(detectLanguageFromFilename('App.tsx')).toBe('typescript');
    expect(detectLanguageFromFilename('index.HTML')).toBe('markup');
    expect(detectLanguageFromFilename('no-extension')).toBeNull();
  });

  it('detects common language signatures', () => {
    expect(detectLanguageFromCode('def greet(name):\n    print(name)')).toBe('python');
    expect(detectLanguageFromCode('package main\n\nfunc main() {}')).toBe('go');
    expect(detectLanguageFromCode('#include <iostream>\nint main() {}')).toBe('cpp');
    expect(detectLanguageFromCode('SELECT id FROM users WHERE active = 1')).toBe('sql');
    expect(detectLanguageFromCode('<div class="card">hello</div>')).toBe('markup');
    expect(detectLanguageFromCode('const x = () => 1;')).toBe('javascript');
  });

  it('prefers the filename over content heuristics', () => {
    expect(detectLanguage({ code: 'def foo():\n  pass', filename: 'main.go' })).toBe('go');
  });

  it('returns null for empty or unknown input', () => {
    expect(detectLanguage({ code: '   ' })).toBeNull();
    expect(detectLanguage({ code: 'hello world' })).toBeNull();
  });
});
