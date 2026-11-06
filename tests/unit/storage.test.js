import { describe, expect, it } from 'vitest';
import { createStorage } from '../../src/js/storage.js';

function memoryBackend() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    dump: () => new Map(map),
  };
}

describe('storage', () => {
  it('round-trips values', () => {
    const storage = createStorage(memoryBackend());
    expect(storage.available).toBe(true);
    expect(storage.save('k', 'v')).toBe(true);
    expect(storage.load('k')).toBe('v');
    expect(storage.remove('k')).toBe(true);
    expect(storage.load('k')).toBeNull();
  });

  it('degrades gracefully when storage throws', () => {
    const hostile = {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {
        throw new Error('quota');
      },
      removeItem() {
        throw new Error('blocked');
      },
    };
    const storage = createStorage(hostile);
    expect(storage.load('k')).toBeNull();
    expect(storage.save('k', 'v')).toBe(false);
    expect(storage.remove('k')).toBe(false);
  });

  it('handles missing storage entirely', () => {
    const storage = createStorage(null);
    expect(storage.available).toBe(false);
    expect(storage.load('k')).toBeNull();
    expect(storage.save('k', 'v')).toBe(false);
  });
});
