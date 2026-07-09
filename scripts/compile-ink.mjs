// Compile the saga's ink source → JSON bytecode at BUILD time.
//
// ink (inkle's narrative language) is the authoring layer for the unlockable
// beast-tab saga. Writers edit src/story/*.ink; this script compiles each to
// src/story/compiled/<name>.json using inkjs's COMPILER (which lives in
// inkjs/full and never ships to the browser). The runtime ships only the
// small inkjs Story engine (~128 KB, lazy-loaded) plus these JSON files.
//
//   node scripts/compile-ink.mjs        # compile all src/story/*.ink
//   node scripts/compile-ink.mjs --check # compile to memory, fail on error,
//                                          write nothing (CI guard)
//
// Wired into `npm run build` via prebuild so a broken .ink fails the build
// instead of shipping stale JSON. Idempotent; commit the JSON so dev servers
// and tests don't need the compiler.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// The compiler build. Runtime code must import 'inkjs' (Story only) — never
// this — so the compiler stays out of the client bundle.
const { Compiler } = require('inkjs/full');

const CHECK = process.argv.includes('--check');
const SRC_DIR = path.resolve('src/story');
const OUT_DIR = path.resolve('src/story/compiled');

if (!fs.existsSync(SRC_DIR)) {
  console.log('[compile-ink] no src/story dir — nothing to compile');
  process.exit(0);
}
fs.mkdirSync(OUT_DIR, { recursive: true });

const inkFiles = fs.readdirSync(SRC_DIR).filter((f) => f.endsWith('.ink'));
if (inkFiles.length === 0) {
  console.log('[compile-ink] no .ink files found');
  process.exit(0);
}

let failed = 0;
for (const file of inkFiles) {
  const src = fs.readFileSync(path.join(SRC_DIR, file), 'utf8');
  const name = file.replace(/\.ink$/, '');
  try {
    const story = new Compiler(src).Compile();
    const json = story.ToJson();
    // Sanity: the compiled story must actually be playable from the start.
    if (!json || json.length < 2) throw new Error('empty compile output');
    if (!CHECK) {
      fs.writeFileSync(path.join(OUT_DIR, `${name}.json`), json);
    }
    console.log(`[compile-ink] ${file} → ${name}.json (${json.length} bytes)`);
  } catch (e) {
    failed += 1;
    console.error(`[compile-ink] FAILED ${file}: ${e.message || e}`);
  }
}

if (failed > 0) {
  console.error(`[compile-ink] ${failed} file(s) failed to compile`);
  process.exit(1);
}
console.log(`[compile-ink] ${inkFiles.length} file(s) compiled${CHECK ? ' (check only, nothing written)' : ''}`);
