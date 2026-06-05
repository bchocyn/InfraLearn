import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages project site is served from a subpath.
// This base must match the repo name so assets (incl. /beasts/*.png) resolve.
export default defineConfig({
  plugins: [react()],
  base: '/InfraLearn/',
  build: {
    rollupOptions: {
      output: {
        // Give @codemirror/lang-* chunks meaningful names. By default vite
        // emits them as `dist-<hash>.js` because their source files live at
        // `node_modules/@codemirror/lang-*/dist/index.js` and rollup names the
        // chunk after the source filename. Routing them through a named
        // manualChunks group preserves the lazy-load behaviour (each lang is
        // still its own chunk, loaded on demand by LintEditor) while making
        // the asset names readable in DevTools / SW precache diagnostics.
        manualChunks(id) {
          // Per-language CodeMirror plugins: name them explicitly so the
          // hashed `dist-<hash>.js` mystery names go away. ORDER MATTERS:
          // match the language-specific paths BEFORE the generic core path,
          // otherwise the language modules get folded into the core chunk.
          if (id.includes('node_modules/@codemirror/lang-python')) return 'cm-lang-python';
          if (id.includes('node_modules/@codemirror/lang-yaml')) return 'cm-lang-yaml';
          if (id.includes('node_modules/@codemirror/lang-sql')) return 'cm-lang-sql';
          if (id.includes('node_modules/@codemirror/lang-json')) return 'cm-lang-json';
          // Shared CodeMirror runtime (state, view, language, autocomplete,
          // commands, search) + lezer parser core. Splitting this out avoids
          // any one lang chunk swelling because rollup happened to attach the
          // shared core to it.
          if (
            id.includes('node_modules/@codemirror/') ||
            id.includes('node_modules/@lezer/')
          ) {
            return 'cm-core';
          }
          return undefined;
        },
      },
    },
  },
});
