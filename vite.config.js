import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
// NOTE: needs @vitejs/plugin-react v5+ — older (Babel-era) versions inject
// esbuild-style options (incl. a `jsx` key) that rolldown-vite's option
// validator rejects ("Invalid input options … received 'jsx'" dev warnings).
// v5+ detects rolldown-vite and uses the oxc transform natively.
import react from '@vitejs/plugin-react';

// After the build emits dist/, substitute the service worker's
// __PRECACHE_MANIFEST__ sentinel with the REAL emitted asset list (hashed
// JS/CSS/font chunks + beast sprites), as base-relative paths the SW warms at
// install. Without this the sentinel stays `[]` and offline-first silently
// fails for not-yet-visited routes (their lazy chunks 503 offline).
function precacheManifest() {
  return {
    name: 'precache-manifest',
    apply: 'build',
    closeBundle() {
      const dist = path.resolve('dist');
      const swPath = path.join(dist, 'sw.js');
      if (!fs.existsSync(swPath)) return;
      const list = [];
      const collect = (sub, test, skip) => {
        const dir = path.join(dist, sub);
        if (!fs.existsSync(dir)) return;
        for (const f of fs.readdirSync(dir)) {
          if (test.test(f) && !(skip && skip.test(f))) list.push(`${sub}/${f}`);
        }
      };
      // Non-latin font subsets are ~69% of the font payload for a lang="en"
      // app — leave them OUT of the install-time precache. The @font-face
      // unicode-range rules mean browsers never request them for English
      // text; if one ever is, the SW's runtime caching picks it up.
      // firebaseAdapter is the lazy cloud-sync chunk (~105 KB gzip) — dormant
      // until the owner fills src/cloud/cloudConfig.js, and even then only
      // needed after a sign-in click. Keep it OUT of the install-time
      // precache; the SW's runtime caching picks it up on first real use.
      const PRECACHE_SKIP = /-(cyrillic(?:-ext)?|greek(?:-ext)?|vietnamese)-|^firebaseAdapter-/;
      collect('assets', /\.(js|css|woff2?)$/, PRECACHE_SKIP); // chunks + latin fonts
      collect('beasts', /\.(png|json)$/);      // sprite art + manifest.json (BeastSprite fetches it at runtime)
      collect('worldmap', /\.png$/);           // continent/boss/minion art (world map + battles)
      collect('worldmap/anim', /\.png$/);      // minion idle-loop frames (Battle screen)
      const json = JSON.stringify(list.sort());
      const sw = fs.readFileSync(swPath, 'utf8').replace(
        /\/\*__PRECACHE_MANIFEST_START__\*\/[\s\S]*?\/\*__PRECACHE_MANIFEST_END__\*\//,
        `/*__PRECACHE_MANIFEST_START__*/${json}/*__PRECACHE_MANIFEST_END__*/`,
      );
      fs.writeFileSync(swPath, sw);
      // eslint-disable-next-line no-console
      console.log(`[precache-manifest] injected ${list.length} assets into dist/sw.js`);
    },
  };
}

// GitHub Pages project site is served from a subpath.
// This base must match the repo name so assets (incl. /beasts/*.png) resolve.
export default defineConfig({
  plugins: [react(), precacheManifest()],
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
