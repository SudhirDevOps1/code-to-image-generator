import {
  LANGUAGES,
  FONTS,
  THEMES,
  GRADIENTS,
  EXPORT_FORMATS,
  LIMITS,
  getLanguage,
  getFont,
  getFormat,
} from './config.js';
import { createStore, createDefaultState, normalizeState, STORAGE_KEY } from './state.js';
import { createStorage } from './storage.js';
import { readShareState, buildShareUrl } from './share.js';
import { detectLanguage } from './detect.js';
import {
  backgroundCss,
  renderLineNumbers,
  countLines,
  countChars,
  formatBytes,
  windowLabel,
  hexToRgb,
} from './render.js';
import { highlightCode } from './highlight.js';
import {
  captureCanvas,
  canvasToBlob,
  downloadBlob,
  copyImageToClipboard,
  filenameFor,
  measureExport,
  ExportError,
} from './export.js';

const $ = (id) => document.getElementById(id);

/** Resolve boot state: shared link > saved session > defaults. */
export function resolveInitialState({ storage, hash = '' } = {}) {
  const shared = readShareState(hash);
  if (shared) return shared;

  const raw = storage?.load(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return normalizeState(parsed);
    } catch {
      /* corrupt payload: fall through to defaults */
    }
  }

  return createDefaultState();
}

function fillSelect(select, items, selectedId) {
  select.replaceChildren(
    ...items.map((item) => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.label;
      if (item.id === selectedId) option.selected = true;
      return option;
    }),
  );
}

const isEditable = (target) =>
  Boolean(
    target &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)),
  );

function exportErrorMessage(error) {
  if (error instanceof ExportError) {
    if (error.code === 'TOO_LARGE') {
      return 'Output too large — reduce scale, padding or code length.';
    }
    if (error.code === 'NOT_READY') return 'Preview is not ready yet.';
    if (error.code === 'COPY_UNSUPPORTED') return 'Copy image is not supported in this browser.';
  }
  return 'Export failed — try a lower scale.';
}

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }

  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

export function initApp() {
  const storage = createStorage();
  const store = createStore(resolveInitialState({ storage, hash: window.location.hash }));

  const el = {
    sidebar: $('sidebar'),
    backdrop: $('sidebar-backdrop'),
    menuToggle: $('menu-toggle'),
    sidebarClose: $('sidebar-close'),
    codeInput: $('code-input'),
    codeStats: $('code-stats'),
    langSelect: $('lang-select'),
    fontSelect: $('font-select'),
    themeSelect: $('theme-select'),
    fontSize: $('font-size'),
    fontSizeValue: $('font-size-value'),
    padding: $('padding'),
    paddingValue: $('padding-value'),
    shadow: $('shadow'),
    shadowValue: $('shadow-value'),
    shadowColor: $('shadow-color'),
    lineNumbersSwitch: $('line-numbers-switch'),
    windowControlsSwitch: $('window-controls-switch'),
    windowTitle: $('window-title'),
    watermark: $('watermark'),
    bgGradientBtn: $('bg-mode-gradient'),
    bgSolidBtn: $('bg-mode-solid'),
    bgFrom: $('bg-from'),
    bgTo: $('bg-to'),
    bgAngle: $('bg-angle'),
    bgAngleValue: $('bg-angle-value'),
    bgColor: $('bg-color'),
    presets: $('gradient-presets'),
    gradientControls: $('gradient-controls'),
    solidControls: $('solid-controls'),
    refresh: $('refresh-preview'),
    copyCode: $('copy-code'),
    openExport: $('open-export'),
    openExportTop: $('open-export-top'),
    openHelp: $('open-help'),
    copyLink: $('copy-link'),
    reset: $('reset'),
    detect: $('detect-language'),
    importFile: $('import-file'),
    fileInput: $('file-input'),
    stageMain: $('stage-main'),
    stageHint: $('stage-hint'),
    exportContainer: $('export-container'),
    windowElement: $('window-element'),
    windowHeader: $('window-header'),
    windowDots: $('window-dots'),
    windowLabelEl: $('window-label'),
    codeBody: $('code-body'),
    codeDisplay: $('code-display'),
    preTag: $('pre-tag'),
    lineNumbersEl: $('line-numbers'),
    watermarkDisplay: $('watermark-display'),
    exportDialog: $('export-dialog'),
    exportScale: $('export-scale'),
    exportScaleValue: $('export-scale-value'),
    exportFormat: $('export-format'),
    exportQualityWrap: $('export-quality-wrap'),
    exportQuality: $('export-quality'),
    exportQualityValue: $('export-quality-value'),
    exportTransparent: $('export-transparent'),
    exportDimensions: $('export-dimensions'),
    exportWarning: $('export-warning'),
    exportDownload: $('export-download'),
    exportCopy: $('export-copy'),
    exportClose: $('export-close'),
    helpDialog: $('help-dialog'),
    helpClose: $('help-close'),
    toast: $('toast'),
    offlineBanner: $('offline-banner'),
    form: $('editor-form'),
  };

  fillSelect(el.langSelect, LANGUAGES, store.get().language);
  fillSelect(el.fontSelect, FONTS, store.get().font);
  fillSelect(el.themeSelect, THEMES, store.get().theme);
  fillSelect(el.exportFormat, EXPORT_FORMATS, store.get().exportFormat);

  // ---------- Background presets ----------

  for (const gradient of GRADIENTS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'swatch';
    button.style.background = `linear-gradient(${gradient.angle}deg, ${gradient.from}, ${gradient.to})`;
    button.setAttribute('aria-label', `Background preset: ${gradient.label}`);
    button.setAttribute('aria-pressed', 'false');
    button.dataset.from = gradient.from;
    button.dataset.to = gradient.to;
    button.dataset.angle = String(gradient.angle);
    button.addEventListener('click', () => {
      store.set({
        bgMode: 'gradient',
        bgFrom: gradient.from,
        bgTo: gradient.to,
        bgAngle: gradient.angle,
      });
    });
    el.presets.append(button);
  }

  // ---------- Toast ----------

  let toastTimer;
  const showToast = (message, tone = 'info') => {
    clearTimeout(toastTimer);
    el.toast.textContent = message;
    el.toast.dataset.tone = tone;
    el.toast.classList.add('visible');
    toastTimer = setTimeout(() => el.toast.classList.remove('visible'), 2600);
  };

  // ---------- Rendering ----------

  let lastCode = null;
  let lastLanguage = null;
  let highlightToken = 0;

  const renderCode = (state) => {
    if (state.code === lastCode && state.language === lastLanguage) return;
    lastCode = state.code;
    lastLanguage = state.language;

    const token = ++highlightToken;
    const language = getLanguage(state.language);
    void highlightCode(el.codeDisplay, state.code, language.prism, () => token === highlightToken);
    el.lineNumbersEl.textContent = renderLineNumbers(state.code);
  };

  const renderStyles = (state) => {
    const language = getLanguage(state.language);
    const font = getFont(state.font);
    const shadow = hexToRgb(state.shadowColor);

    el.exportContainer.dataset.theme = state.theme;
    el.exportContainer.style.padding = `${state.padding}px`;
    el.exportContainer.style.background = state.transparent ? 'transparent' : backgroundCss(state);
    el.exportContainer.classList.toggle('is-transparent', state.transparent);

    el.codeBody.style.fontFamily = font.stack;
    el.codeBody.style.fontSize = `${state.fontSize}px`;

    el.windowElement.style.boxShadow = `0 ${Math.round(state.shadow / 3)}px ${state.shadow}px rgba(${shadow.r}, ${shadow.g}, ${shadow.b}, 0.6)`;
    el.windowDots.hidden = !state.showWindowControls;
    el.windowHeader.classList.toggle('no-controls', !state.showWindowControls);

    el.windowLabelEl.textContent = windowLabel(state);
    el.windowLabelEl.style.color = language.color;

    el.lineNumbersEl.hidden = !state.showLineNumbers;

    el.watermarkDisplay.hidden = state.watermark.length === 0;
    el.watermarkDisplay.textContent = state.watermark;

    el.codeStats.textContent = `${language.label} · ${countLines(state.code)} lines · ${formatBytes(
      countChars(state.code),
    )}`;
  };

  const syncControls = (state) => {
    el.langSelect.value = state.language;
    el.fontSelect.value = state.font;
    el.themeSelect.value = state.theme;

    el.fontSize.value = String(state.fontSize);
    el.fontSizeValue.textContent = `${state.fontSize}px`;
    el.padding.value = String(state.padding);
    el.paddingValue.textContent = `${state.padding}px`;
    el.shadow.value = String(state.shadow);
    el.shadowValue.textContent = `${state.shadow}px`;
    el.shadowColor.value = state.shadowColor;

    el.lineNumbersSwitch.checked = state.showLineNumbers;
    el.windowControlsSwitch.checked = state.showWindowControls;

    if (document.activeElement !== el.windowTitle) el.windowTitle.value = state.windowTitle;
    if (document.activeElement !== el.watermark) el.watermark.value = state.watermark;

    el.bgGradientBtn.setAttribute('aria-pressed', String(state.bgMode === 'gradient'));
    el.bgSolidBtn.setAttribute('aria-pressed', String(state.bgMode === 'solid'));
    el.gradientControls.hidden = state.bgMode !== 'gradient';
    el.solidControls.hidden = state.bgMode !== 'solid';

    el.bgFrom.value = state.bgFrom;
    el.bgTo.value = state.bgTo;
    el.bgColor.value = state.bgColor;
    el.bgAngle.value = String(state.bgAngle);
    el.bgAngleValue.textContent = `${state.bgAngle}°`;

    for (const button of el.presets.children) {
      const active =
        state.bgMode === 'gradient' &&
        button.dataset.from === state.bgFrom &&
        button.dataset.to === state.bgTo;
      button.setAttribute('aria-pressed', String(active));
    }

    el.exportScale.value = String(state.exportScale);
    el.exportScaleValue.textContent = `${state.exportScale}×`;
    el.exportFormat.value = state.exportFormat;
    el.exportTransparent.checked = state.transparent;
    el.exportQuality.value = String(state.exportQuality);
    el.exportQualityValue.textContent = `${Math.round(state.exportQuality * 100)}%`;

    const format = getFormat(state.exportFormat);
    el.exportQualityWrap.hidden = !format.supportsQuality;
    el.exportTransparent.disabled = format.id === 'jpeg';

    if (document.activeElement !== el.codeInput) el.codeInput.value = state.code;
  };

  const updateExportInfo = (state) => {
    const size = measureExport(el.exportContainer, state.exportScale);
    const tooLarge = size.pixels > LIMITS.maxCanvasPixels;
    const format = getFormat(state.exportFormat);

    el.exportDimensions.textContent = `${size.width} × ${size.height} px · ${format.label}`;
    el.exportDimensions.classList.toggle('hint-warn', tooLarge);
    el.exportWarning.hidden = !tooLarge;
    el.stageHint.textContent = `Live preview · ${state.exportScale}× export · ${size.width}×${size.height}px`;
  };

  const renderAll = (state) => {
    renderCode(state);
    renderStyles(state);
    syncControls(state);
    updateExportInfo(state);
  };

  // ---------- Persistence ----------

  let saveTimer;
  const saveNow = () => {
    clearTimeout(saveTimer);
    storage.save(STORAGE_KEY, JSON.stringify(store.get()));
  };
  const scheduleSave = (state) => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => storage.save(STORAGE_KEY, JSON.stringify(state)), 400);
  };

  store.subscribe((state) => {
    renderAll(state);
    scheduleSave(state);
  });

  window.addEventListener('pagehide', saveNow);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveNow();
  });

  // ---------- Control bindings ----------

  el.form.addEventListener('submit', (event) => event.preventDefault());

  el.langSelect.addEventListener('change', () => store.set({ language: el.langSelect.value }));
  el.fontSelect.addEventListener('change', () => store.set({ font: el.fontSelect.value }));
  el.themeSelect.addEventListener('change', () => store.set({ theme: el.themeSelect.value }));

  el.fontSize.addEventListener('input', () => store.set({ fontSize: Number(el.fontSize.value) }));
  el.padding.addEventListener('input', () => store.set({ padding: Number(el.padding.value) }));
  el.shadow.addEventListener('input', () => store.set({ shadow: Number(el.shadow.value) }));
  el.shadowColor.addEventListener('input', () => store.set({ shadowColor: el.shadowColor.value }));

  el.lineNumbersSwitch.addEventListener('change', () =>
    store.set({ showLineNumbers: el.lineNumbersSwitch.checked }),
  );
  el.windowControlsSwitch.addEventListener('change', () =>
    store.set({ showWindowControls: el.windowControlsSwitch.checked }),
  );
  el.windowTitle.addEventListener('input', () => store.set({ windowTitle: el.windowTitle.value }));
  el.watermark.addEventListener('input', () => store.set({ watermark: el.watermark.value }));

  el.bgGradientBtn.addEventListener('click', () => store.set({ bgMode: 'gradient' }));
  el.bgSolidBtn.addEventListener('click', () => store.set({ bgMode: 'solid' }));
  el.bgFrom.addEventListener('input', () => store.set({ bgFrom: el.bgFrom.value }));
  el.bgTo.addEventListener('input', () => store.set({ bgTo: el.bgTo.value }));
  el.bgColor.addEventListener('input', () => store.set({ bgColor: el.bgColor.value }));
  el.bgAngle.addEventListener('input', () => store.set({ bgAngle: Number(el.bgAngle.value) }));

  let codeTimer;
  el.codeInput.addEventListener('input', () => {
    clearTimeout(codeTimer);
    codeTimer = setTimeout(() => store.set({ code: el.codeInput.value }), 160);
  });
  el.codeInput.addEventListener('blur', () => {
    clearTimeout(codeTimer);
    store.set({ code: el.codeInput.value });
  });

  el.refresh.addEventListener('click', () => {
    renderAll(store.get());
    showToast('Preview updated');
  });

  el.detect.addEventListener('click', () => {
    const detected = detectLanguage({ code: store.get().code });
    if (!detected) {
      showToast('Could not detect the language', 'error');
      return;
    }
    store.set({ language: detected });
    showToast(`Detected ${getLanguage(detected).label}`);
  });

  // ---------- Import ----------

  const importFile = async (file) => {
    if (!file) return;
    if (file.size > 1_000_000) {
      showToast('File is too large (max 1 MB)', 'error');
      return;
    }
    try {
      const text = await file.text();
      if (!text.trim()) {
        showToast('File is empty', 'error');
        return;
      }
      const detected = detectLanguage({ code: text, filename: file.name });
      store.set({
        code: text.slice(0, LIMITS.code),
        ...(detected ? { language: detected } : {}),
      });
      showToast(`Imported ${file.name}`);
    } catch {
      showToast('Could not read that file', 'error');
    }
  };

  el.importFile.addEventListener('click', () => el.fileInput.click());
  el.fileInput.addEventListener('change', () => {
    importFile(el.fileInput.files?.[0]);
    el.fileInput.value = '';
  });

  const setDragging = (active) => el.stageMain.classList.toggle('is-dragging', active);
  el.stageMain.addEventListener('dragenter', (event) => {
    event.preventDefault();
    setDragging(true);
  });
  el.stageMain.addEventListener('dragover', (event) => event.preventDefault());
  el.stageMain.addEventListener('dragleave', (event) => {
    if (event.target === el.stageMain) setDragging(false);
  });
  el.stageMain.addEventListener('drop', (event) => {
    event.preventDefault();
    setDragging(false);
    importFile(event.dataTransfer?.files?.[0]);
  });

  // ---------- Copy / share / reset ----------

  el.copyCode.addEventListener('click', async () => {
    const ok = await copyText(store.get().code);
    showToast(ok ? 'Code copied' : 'Copy failed', ok ? 'info' : 'error');
  });

  el.copyLink.addEventListener('click', async () => {
    const url = buildShareUrl(store.get(), window.location);
    if (!url) {
      showToast('Snippet too large for a share link', 'error');
      return;
    }
    const ok = await copyText(url);
    if (ok) {
      window.history.replaceState(null, '', url);
      showToast('Share link copied');
    } else {
      showToast('Could not copy the link', 'error');
    }
  });

  el.reset.addEventListener('click', () => {
    if (!window.confirm('Reset the editor and discard your saved snippet?')) return;
    store.replace(createDefaultState());
    store.clearHistory();
    storage.remove(STORAGE_KEY);
    window.history.replaceState(null, '', window.location.pathname);
    showToast('Editor reset');
  });

  // ---------- Export ----------

  let exporting = false;
  const setExportBusy = (busy) => {
    el.exportDownload.disabled = busy;
    el.exportCopy.disabled = busy;
    el.exportDownload.textContent = busy ? 'Rendering…' : 'Download';
  };

  const openExport = () => {
    if (el.exportDialog.open) return;
    updateExportInfo(store.get());
    el.exportDialog.showModal();
  };

  const closeExport = () => {
    if (el.exportDialog.open) el.exportDialog.close();
  };

  const runExport = async (mode) => {
    if (exporting) return;
    exporting = true;
    setExportBusy(true);

    try {
      const state = store.get();
      const canvas = await captureCanvas(el.exportContainer, { scale: state.exportScale });

      if (mode === 'copy') {
        await copyImageToClipboard(canvas);
        showToast('Image copied to clipboard');
      } else {
        const blob = await canvasToBlob(canvas, state.exportFormat, state.exportQuality);
        downloadBlob(blob, filenameFor(state));
        showToast('Image downloaded');
      }

      closeExport();
    } catch (error) {
      console.error(error);
      showToast(exportErrorMessage(error), 'error');
    } finally {
      exporting = false;
      setExportBusy(false);
    }
  };

  el.openExport.addEventListener('click', openExport);
  el.openExportTop.addEventListener('click', openExport);
  el.exportDownload.addEventListener('click', () => runExport('download'));
  el.exportCopy.addEventListener('click', () => runExport('copy'));
  el.exportClose.addEventListener('click', closeExport);

  el.exportScale.addEventListener('input', () =>
    store.set({ exportScale: Number(el.exportScale.value) }),
  );
  el.exportFormat.addEventListener('change', () => {
    const format = el.exportFormat.value;
    store.set({
      exportFormat: format,
      ...(format === 'jpeg' ? { transparent: false } : {}),
    });
  });
  el.exportQuality.addEventListener('input', () =>
    store.set({ exportQuality: Number(el.exportQuality.value) }),
  );
  el.exportTransparent.addEventListener('change', () =>
    store.set({ transparent: el.exportTransparent.checked }),
  );

  // ---------- Dialogs ----------

  el.openHelp.addEventListener('click', () => el.helpDialog.showModal());
  el.helpClose.addEventListener('click', () => el.helpDialog.close());

  for (const dialog of [el.exportDialog, el.helpDialog]) {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  }

  // ---------- Sidebar (mobile) ----------

  const setSidebar = (open) => {
    el.sidebar.classList.toggle('open', open);
    el.backdrop.hidden = !open;
    el.menuToggle.setAttribute('aria-expanded', String(open));
    if (open) el.sidebar.querySelector('button, input, select, textarea')?.focus();
  };

  el.menuToggle.addEventListener('click', () => setSidebar(true));
  el.sidebarClose.addEventListener('click', () => setSidebar(false));
  el.backdrop.addEventListener('click', () => setSidebar(false));
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) setSidebar(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setSidebar(false);
  });

  // ---------- Offline state ----------

  const updateOnline = () => {
    el.offlineBanner.hidden = navigator.onLine;
  };
  window.addEventListener('online', updateOnline);
  window.addEventListener('offline', updateOnline);
  updateOnline();

  // ---------- Keyboard shortcuts ----------

  document.addEventListener('keydown', (event) => {
    const mod = event.metaKey || event.ctrlKey;
    const key = event.key.toLowerCase();
    const editable = isEditable(event.target);

    if (event.key === '?' && !editable) {
      event.preventDefault();
      if (!el.helpDialog.open) el.helpDialog.showModal();
      return;
    }

    if (!mod) return;

    if (event.key === 'Enter') {
      event.preventDefault();
      renderAll(store.get());
      showToast('Preview updated');
      return;
    }

    if (key === 's') {
      event.preventDefault();
      runExport('download');
      return;
    }

    if (key === 'k') {
      event.preventDefault();
      openExport();
      return;
    }

    if (event.shiftKey && key === 'c' && !editable) {
      event.preventDefault();
      copyText(store.get().code).then((ok) =>
        showToast(ok ? 'Code copied' : 'Copy failed', ok ? 'info' : 'error'),
      );
      return;
    }

    if (!editable && key === 'z') {
      event.preventDefault();
      if (event.shiftKey) store.redo();
      else store.undo();
      return;
    }

    if (!editable && key === 'y') {
      event.preventDefault();
      store.redo();
    }
  });

  // ---------- Boot ----------

  renderAll(store.get());

  if (document.fonts?.ready) {
    // Web fonts can change the preview's measured width, so refresh the export
    // dimensions once they settle — but off the critical path.
    document.fonts.ready
      .then(() => {
        const refresh = () => updateExportInfo(store.get());
        if ('requestIdleCallback' in window) requestIdleCallback(refresh, { timeout: 1000 });
        else setTimeout(refresh, 200);
      })
      .catch(() => {});
  }

  return { store, showToast };
}
