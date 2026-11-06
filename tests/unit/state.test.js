import { describe, expect, it } from 'vitest';
import { createDefaultState, createStore, normalizeState } from '../../src/js/state.js';
import { DEFAULT_STATE, LIMITS } from '../../src/js/config.js';

describe('normalizeState', () => {
  it('returns defaults for empty or invalid input', () => {
    expect(normalizeState()).toEqual(createDefaultState());
    expect(normalizeState(null)).toEqual(createDefaultState());
    expect(normalizeState('nope')).toEqual(createDefaultState());
  });

  it('clamps numeric ranges', () => {
    const state = normalizeState({ fontSize: -10, padding: 999, shadow: 500, exportScale: 12 });
    expect(state.fontSize).toBe(LIMITS.fontSize[0]);
    expect(state.padding).toBe(LIMITS.padding[1]);
    expect(state.shadow).toBe(LIMITS.shadow[1]);
    expect(state.exportScale).toBe(LIMITS.scale[1]);
  });

  it('rejects unknown enums and colours', () => {
    const state = normalizeState({
      language: 'brainfuck',
      theme: 'not-a-theme',
      font: 'comic-sans',
      bgFrom: 'red',
      shadowColor: 'javascript:alert(1)',
    });
    expect(state.language).toBe(DEFAULT_STATE.language);
    expect(state.theme).toBe(DEFAULT_STATE.theme);
    expect(state.font).toBe(DEFAULT_STATE.font);
    expect(state.bgFrom).toBe(DEFAULT_STATE.bgFrom);
    expect(state.shadowColor).toBe(DEFAULT_STATE.shadowColor);
  });

  it('caps code length and drops unknown keys', () => {
    const state = normalizeState({ code: 'a'.repeat(LIMITS.code + 5000), apiKey: 'secret' });
    expect(state.code).toHaveLength(LIMITS.code);
    expect(state).not.toHaveProperty('apiKey');
  });

  it('treats code as data, never markup', () => {
    const payload = '<img src=x onerror="alert(1)">';
    expect(normalizeState({ code: payload }).code).toBe(payload);
  });
});

describe('createStore', () => {
  it('updates state immutably and notifies subscribers', () => {
    const store = createStore({ fontSize: 15 });
    const before = store.get();
    let notified = 0;
    store.subscribe(() => {
      notified += 1;
    });

    store.set({ fontSize: 18 });

    expect(notified).toBe(1);
    expect(store.get()).not.toBe(before);
    expect(before.fontSize).toBe(15);
    expect(store.get().fontSize).toBe(18);
  });

  it('ignores no-op updates', () => {
    const store = createStore({ fontSize: 15 });
    let notified = 0;
    store.subscribe(() => {
      notified += 1;
    });
    store.set({ fontSize: 15 });
    expect(notified).toBe(0);
  });

  it('supports undo and redo', () => {
    let time = 0;
    const store = createStore({}, { now: () => time });

    store.set({ theme: 'dracula' });
    // Separate edits to the same field outside the coalescing window become
    // distinct undo steps.
    time = 1000;
    store.set({ theme: 'nord' }, { history: true });

    expect(store.get().theme).toBe('nord');
    expect(store.undo()).toBe(true);
    expect(store.get().theme).toBe('dracula');
    expect(store.undo()).toBe(true);
    expect(store.get().theme).toBe(DEFAULT_STATE.theme);
    expect(store.canUndo()).toBe(false);

    expect(store.redo()).toBe(true);
    expect(store.get().theme).toBe('dracula');
  });

  it('coalesces rapid updates to the same field into one undo step', () => {
    let time = 0;
    const store = createStore({}, { now: () => time });

    store.set({ fontSize: 16 });
    time = 100;
    store.set({ fontSize: 17 });
    time = 200;
    store.set({ fontSize: 18 });

    expect(store.get().fontSize).toBe(18);
    store.undo();
    expect(store.get().fontSize).toBe(DEFAULT_STATE.fontSize);
  });

  it('creates a new undo step after the coalescing window', () => {
    let time = 0;
    const store = createStore({}, { now: () => time });

    store.set({ fontSize: 16 });
    time = 1000;
    store.set({ fontSize: 17 });

    store.undo();
    expect(store.get().fontSize).toBe(16);
  });

  it('clears redo history on new edits', () => {
    const store = createStore({}, { now: () => 0 });
    store.set({ theme: 'dracula' });
    store.undo();
    expect(store.canRedo()).toBe(true);

    store.set({ theme: 'nord' });
    expect(store.canRedo()).toBe(false);
  });
});
