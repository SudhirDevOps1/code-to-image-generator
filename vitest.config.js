import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.js'],
    reporters: process.env.CI ? ['default', 'junit'] : ['default'],
    outputFile: process.env.CI ? { junit: 'reports/unit-junit.xml' } : undefined,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/js/**/*.js'],
      thresholds: {
        statements: 85,
        branches: 80,
        functions: 85,
        lines: 90,
      },
      exclude: [
        'src/js/main.js',
        'src/js/ui.js',
        'src/js/pwa.js',
        'src/js/telemetry.js',
        'src/js/prism.js',
        'src/js/highlight.js',
        'src/js/export.js',
      ],
    },
  },
});
