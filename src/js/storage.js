/**
 * Defensive localStorage wrapper.
 *
 * Private browsing modes, disabled cookies and quota errors must never break
 * the editor, so every operation degrades to a no-op instead of throwing.
 */
export function createStorage(backend) {
  const resolve = () => {
    if (backend !== undefined) return backend;
    try {
      return globalThis.localStorage ?? null;
    } catch {
      return null;
    }
  };

  const store = resolve();

  return {
    available: Boolean(store),

    load(key) {
      if (!store) return null;
      try {
        return store.getItem(key);
      } catch {
        return null;
      }
    },

    save(key, value) {
      if (!store) return false;
      try {
        store.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    },

    remove(key) {
      if (!store) return false;
      try {
        store.removeItem(key);
        return true;
      } catch {
        return false;
      }
    },
  };
}
