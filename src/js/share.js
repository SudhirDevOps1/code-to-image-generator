import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { normalizeState } from './state.js';
import { LIMITS } from './config.js';

export const SHARE_PREFIX = '#s=';

/**
 * Encode the editor state into a URL-safe fragment.
 * Returns `null` when the payload would be unreasonably long, so the UI can
 * explain the limitation instead of producing a broken link.
 */
export function encodeShareState(state) {
  try {
    const encoded = compressToEncodedURIComponent(JSON.stringify(state));
    if (!encoded || encoded.length > LIMITS.shareEncoded) return null;
    return encoded;
  } catch {
    return null;
  }
}

export function decodeShareState(encoded) {
  if (typeof encoded !== 'string' || !encoded) return null;
  try {
    const raw = decompressFromEncodedURIComponent(encoded);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return normalizeState(parsed);
  } catch {
    return null;
  }
}

export function readShareState(hash) {
  if (typeof hash !== 'string' || !hash.startsWith(SHARE_PREFIX)) return null;
  return decodeShareState(hash.slice(SHARE_PREFIX.length));
}

/** Build a full share URL for the current document. */
export function buildShareUrl(state, location) {
  const encoded = encodeShareState(state);
  if (!encoded) return null;
  const base = `${location.origin}${location.pathname}${location.search}`;
  return `${base}${SHARE_PREFIX}${encoded}`;
}
