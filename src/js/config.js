/**
 * Static configuration for CodeSnap.
 *
 * Everything here is pure data so it can be unit-tested and reused by the UI,
 * the renderer and the share-link encoder.
 */

export const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', prism: 'javascript', ext: 'js', color: '#F7DF1E' },
  { id: 'typescript', label: 'TypeScript', prism: 'typescript', ext: 'ts', color: '#3178C6' },
  { id: 'python', label: 'Python', prism: 'python', ext: 'py', color: '#3776AB' },
  { id: 'rust', label: 'Rust', prism: 'rust', ext: 'rs', color: '#DEA584' },
  { id: 'go', label: 'Go', prism: 'go', ext: 'go', color: '#00ADD8' },
  { id: 'cpp', label: 'C++', prism: 'cpp', ext: 'cpp', color: '#00599C' },
  { id: 'java', label: 'Java', prism: 'java', ext: 'java', color: '#ED8B00' },
  { id: 'swift', label: 'Swift', prism: 'swift', ext: 'swift', color: '#F05138' },
  { id: 'kotlin', label: 'Kotlin', prism: 'kotlin', ext: 'kt', color: '#7F52FF' },
  { id: 'php', label: 'PHP', prism: 'php', ext: 'php', color: '#777BB4' },
  { id: 'sql', label: 'SQL', prism: 'sql', ext: 'sql', color: '#E38C00' },
  { id: 'css', label: 'CSS', prism: 'css', ext: 'css', color: '#1572B6' },
  { id: 'markup', label: 'HTML', prism: 'markup', ext: 'html', color: '#E34F26' },
];

export const FONTS = [
  { id: 'jetbrains', label: 'JetBrains Mono', stack: "'JetBrains Mono', monospace" },
  { id: 'fira', label: 'Fira Code', stack: "'Fira Code', monospace" },
  { id: 'source-code-pro', label: 'Source Code Pro', stack: "'Source Code Pro', monospace" },
  { id: 'space-mono', label: 'Space Mono', stack: "'Space Mono', monospace" },
  { id: 'roboto-mono', label: 'Roboto Mono', stack: "'Roboto Mono', monospace" },
  { id: 'ubuntu-mono', label: 'Ubuntu Mono', stack: "'Ubuntu Mono', monospace" },
  { id: 'inconsolata', label: 'Inconsolata', stack: "'Inconsolata', monospace" },
  { id: 'ibm-plex-mono', label: 'IBM Plex Mono', stack: "'IBM Plex Mono', monospace" },
  { id: 'cascadia', label: 'Cascadia Code', stack: "'Cascadia Code', monospace" },
  { id: 'system', label: 'System Mono', stack: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
];

/**
 * Curated syntax themes. Palettes are defined as CSS custom properties in
 * `src/styles/themes.css`; this map only carries metadata.
 */
export const THEMES = [
  { id: 'tomorrow', label: 'Tomorrow Night', bg: '#1e1e2e' },
  { id: 'dracula', label: 'Dracula', bg: '#282a36' },
  { id: 'okaidia', label: 'Okaidia', bg: '#272822' },
  { id: 'nord', label: 'Nord', bg: '#2e3440' },
  { id: 'night-owl', label: 'Night Owl', bg: '#011627' },
  { id: 'twilight', label: 'Twilight', bg: '#1f1f1f' },
  { id: 'vsc-dark-plus', label: 'VS Code Dark+', bg: '#1e1e1e' },
  { id: 'shades-of-purple', label: 'Shades of Purple', bg: '#2d2b55' },
  { id: 'synthwave84', label: "Synthwave '84", bg: '#2b213a' },
  { id: 'atom-dark', label: 'Atom Dark', bg: '#1d1f21' },
];

export const GRADIENTS = [
  { id: 'indigo', label: 'Indigo Dream', from: '#6366f1', to: '#a855f7', angle: 135 },
  { id: 'sunset', label: 'Sunset', from: '#f97316', to: '#ef4444', angle: 135 },
  { id: 'ocean', label: 'Ocean', from: '#00f2fe', to: '#4facfe', angle: 135 },
  { id: 'candy', label: 'Candy', from: '#ee9ca7', to: '#ffdde1', angle: 135 },
  { id: 'mint', label: 'Mint', from: '#2af598', to: '#009efd', angle: 135 },
  { id: 'graphite', label: 'Graphite', from: '#131313', to: '#333333', angle: 135 },
  { id: 'violet', label: 'Violet', from: '#8e2de2', to: '#4a00e0', angle: 135 },
  { id: 'lava', label: 'Lava', from: '#f12711', to: '#f5af19', angle: 135 },
  { id: 'midnight', label: 'Midnight', from: '#000000', to: '#000000', angle: 135 },
  { id: 'paper', label: 'Paper', from: '#ffffff', to: '#ffffff', angle: 135 },
];

export const EXAMPLES = {
  javascript: 'function greet(name) {\n  console.log(`Hello, ${name}!`);\n}\n\ngreet("CodeSnap");',
  typescript:
    'interface User {\n  id: number;\n  name: string;\n}\n\nconst user: User = { id: 1, name: "Snap" };',
  python: 'def greet(name):\n    print(f"Hello, {name}!")\n\ngreet("Pythonista")',
  rust: 'fn main() {\n    println!("Hello, Rust!");\n}',
  go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, Go")\n}',
  cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello C++" << std::endl;\n    return 0;\n}',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello Java");\n    }\n}',
  swift: 'import Foundation\n\nlet message = "Hello Swift!"\nprint(message)',
  kotlin: 'fun main() {\n    println("Hello Kotlin")\n}',
  php: '<?php\n$message = "Hello PHP";\necho $message;',
  sql: 'SELECT * FROM users\nWHERE status = "active"\nORDER BY created_at DESC;',
  css: '.container {\n  display: flex;\n  justify-content: center;\n  background: #f0f0f0;\n}',
  markup: '<div class="card">\n  <h1>Hello HTML</h1>\n  <p>Standard markup example.</p>\n</div>',
};

export const EXPORT_FORMATS = [
  { id: 'png', label: 'PNG', mime: 'image/png', supportsQuality: false },
  { id: 'jpeg', label: 'JPEG', mime: 'image/jpeg', supportsQuality: true },
  { id: 'webp', label: 'WebP', mime: 'image/webp', supportsQuality: true },
];

export const LIMITS = {
  code: 200_000,
  padding: [0, 150],
  fontSize: [10, 30],
  shadow: [0, 200],
  quality: [0.5, 1],
  scale: [1, 4],
  watermark: 60,
  windowTitle: 80,
  shareEncoded: 8_000,
  maxCanvasPixels: 40_000_000,
};

export const DEFAULT_STATE = {
  code: EXAMPLES.javascript,
  language: 'javascript',
  font: 'jetbrains',
  theme: 'tomorrow',
  fontSize: 15,
  padding: 60,
  shadow: 80,
  shadowColor: '#000000',
  bgMode: 'gradient',
  bgFrom: '#6366f1',
  bgTo: '#a855f7',
  bgAngle: 135,
  bgColor: '#6366f1',
  showLineNumbers: false,
  showWindowControls: true,
  windowTitle: '',
  watermark: '',
  exportScale: 3,
  exportFormat: 'png',
  exportQuality: 0.92,
  transparent: false,
};

export const getLanguage = (id) => LANGUAGES.find((l) => l.id === id) ?? LANGUAGES[0];
export const getFont = (id) => FONTS.find((f) => f.id === id) ?? FONTS[0];
export const getTheme = (id) => THEMES.find((t) => t.id === id) ?? THEMES[0];
export const getFormat = (id) => EXPORT_FORMATS.find((f) => f.id === id) ?? EXPORT_FORMATS[0];
