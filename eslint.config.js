// Minimal ESLint v9 flat config. Deliberately conservative — uses only core
// rules so we don't pull in heavy plugin trees as new devDependencies. The
// goal here is to get `npm run lint` functional (it was a no-op before, which
// meant the project was flying blind on unused imports / undeclared globals).
// React-specific rules (hooks-deps, jsx-key) can be layered on later once we
// decide to commit to eslint-plugin-react-hooks as a devDependency.

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'public/**',
      // Test files import vitest globals via the test environment, not via
      // explicit `import` — easier to skip than to allow-list everything.
      'tests/**',
    ],
  },
  {
    files: ['src/**/*.{js,jsx}'],
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
    // Stub the `react-hooks` plugin namespace so the existing inline
    // `eslint-disable react-hooks/exhaustive-deps` directives don't error
    // out with "Definition for rule was not found". The rule is registered
    // as a no-op (severity stays at default off); when the project decides
    // to wire up eslint-plugin-react-hooks for real, this stub gets replaced.
    plugins: {
      'react-hooks': {
        rules: {
          'exhaustive-deps': { meta: { schema: [] }, create: () => ({}) },
          'rules-of-hooks': { meta: { schema: [] }, create: () => ({}) },
        },
      },
    },
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        // Browser globals used across the app.
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        performance: 'readonly',
        IntersectionObserver: 'readonly',
        ResizeObserver: 'readonly',
        MutationObserver: 'readonly',
        console: 'readonly',
        crypto: 'readonly',
        Image: 'readonly',
        Audio: 'readonly',
        FileReader: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        FormData: 'readonly',
        HTMLElement: 'readonly',
        Element: 'readonly',
        Node: 'readonly',
        Event: 'readonly',
        CustomEvent: 'readonly',
        KeyboardEvent: 'readonly',
        MouseEvent: 'readonly',
        TouchEvent: 'readonly',
        AbortController: 'readonly',
        Promise: 'readonly',
        indexedDB: 'readonly',
        Notification: 'readonly',
      },
    },
    rules: {
      // Catch the obvious wins. Everything else stays at default ("off") so
      // the first `npm run lint` produces an actionable output rather than
      // thousands of stylistic nits.
      'no-undef': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-unreachable': 'error',
      'no-dupe-keys': 'error',
      'no-dupe-args': 'error',
      'no-redeclare': 'error',
      'no-const-assign': 'error',
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
];
