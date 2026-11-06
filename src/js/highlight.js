import Prism from './prism.js';

/**
 * Prism's core bundle already contains markup, CSS, clike and JavaScript, which
 * covers the default snippet and the most common languages. Every other grammar
 * is fetched on demand so the initial module evaluation stays small.
 */
const GRAMMAR_LOADERS = {
  typescript: () => import('prismjs/components/prism-typescript.js'),
  python: () => import('prismjs/components/prism-python.js'),
  rust: () => import('prismjs/components/prism-rust.js'),
  go: () => import('prismjs/components/prism-go.js'),
  java: () => import('prismjs/components/prism-java.js'),
  swift: () => import('prismjs/components/prism-swift.js'),
  kotlin: () => import('prismjs/components/prism-kotlin.js'),
  sql: () => import('prismjs/components/prism-sql.js'),
  cpp: () =>
    import('prismjs/components/prism-c.js').then(() => import('prismjs/components/prism-cpp.js')),
  php: () =>
    import('prismjs/components/prism-markup-templating.js').then(
      () => import('prismjs/components/prism-php.js'),
    ),
};

const pending = new Map();

function ensureGrammar(language) {
  if (Prism.languages[language]) return Promise.resolve();

  const loader = GRAMMAR_LOADERS[language];
  if (!loader) return Promise.resolve();

  if (!pending.has(language)) {
    pending.set(
      language,
      loader().catch((error) => {
        pending.delete(language);
        throw error;
      }),
    );
  }

  return pending.get(language);
}

/**
 * Tokenize `code` into `element`. Prism escapes the source, so user input can
 * never be interpreted as HTML. `isCurrent` lets callers drop stale results when
 * the user switches language again before a grammar finishes loading.
 */
export async function highlightCode(element, code, prismLanguage, isCurrent = () => true) {
  element.textContent = code;
  element.className = `code language-${prismLanguage}`;

  try {
    await ensureGrammar(prismLanguage);
    if (!isCurrent()) return;
    Prism.highlightElement(element);
  } catch (error) {
    console.warn('[codesnap] highlight failed, falling back to plain text', error);
    if (isCurrent()) element.textContent = code;
  }
}
