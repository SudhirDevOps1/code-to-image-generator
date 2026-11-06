import { LIMITS, getFormat } from './config.js';
import { buildFilename } from './render.js';

export class ExportError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ExportError';
    this.code = code;
  }
}

/** Expected pixel dimensions for the current preview and scale. */
export function measureExport(element, scale = 1) {
  const rect = element.getBoundingClientRect();
  const cssWidth = Math.round(rect.width);
  const cssHeight = Math.round(rect.height);
  return {
    cssWidth,
    cssHeight,
    width: Math.round(cssWidth * scale),
    height: Math.round(cssHeight * scale),
    pixels: Math.round(cssWidth * scale) * Math.round(cssHeight * scale),
  };
}

/**
 * Render the preview to a canvas. Guards against zero-sized previews and
 * browser canvas limits (which otherwise fail with a blank image).
 */
export async function captureCanvas(element, { scale = 3 } = {}) {
  const size = measureExport(element, scale);

  if (size.cssWidth < 2 || size.cssHeight < 2) {
    throw new ExportError('NOT_READY', 'Preview is not visible yet.');
  }

  if (size.pixels > LIMITS.maxCanvasPixels) {
    throw new ExportError(
      'TOO_LARGE',
      `Output is ${size.width}×${size.height}px, above the safe canvas limit.`,
    );
  }

  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* font loading failures must not block export */
    }
  }

  // html2canvas is the heaviest dependency and is only needed when the user
  // exports. Loading it on demand keeps the initial bundle and main-thread
  // blocking time small.
  const { default: html2canvas } = await import('html2canvas');

  return html2canvas(element, {
    scale,
    backgroundColor: null,
    useCORS: true,
    logging: false,
    width: size.cssWidth,
    height: size.cssHeight,
  });
}

function dataUrlToBlob(dataUrl) {
  const [header, payload] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png';
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export function canvasToBlob(canvas, formatId, quality = 0.92) {
  const format = getFormat(formatId);

  return new Promise((resolve, reject) => {
    const onBlob = (blob) => {
      if (blob) resolve(blob);
      else reject(new ExportError('ENCODE_FAILED', 'The browser could not encode the image.'));
    };

    if (typeof canvas.toBlob === 'function') {
      canvas.toBlob(onBlob, format.mime, format.supportsQuality ? quality : undefined);
      return;
    }

    try {
      onBlob(dataUrlToBlob(canvas.toDataURL(format.mime, quality)));
    } catch (error) {
      reject(error);
    }
  });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export async function copyImageToClipboard(canvas) {
  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
    throw new ExportError('COPY_UNSUPPORTED', 'This browser cannot copy images to the clipboard.');
  }

  // Clipboard support is most reliable with PNG, regardless of chosen format.
  const blob = await canvasToBlob(canvas, 'png');
  await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
}

export function filenameFor(state, date = new Date()) {
  return buildFilename(state, date);
}
