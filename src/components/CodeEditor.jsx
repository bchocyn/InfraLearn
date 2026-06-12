import { useEffect, useRef } from 'react';
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import {
  defaultKeymap,
  indentWithTab,
  history,
  historyKeymap,
} from '@codemirror/commands';
import {
  bracketMatching,
  HighlightStyle,
  syntaxHighlighting,
  indentUnit,
} from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

// Per-language plugins are dynamically imported so each parser ships in its
// own JS chunk. Opening the editor on a Python tab fetches ONLY python; the
// user switching to YAML triggers yaml's chunk on demand. Before this split
// all four parsers (~30-50 kB each) shipped in the initial bundle even on
// screens that never instantiated an editor.
const LANG_LOADERS = {
  python:     () => import('@codemirror/lang-python').then((m) => m.python()),
  yaml:       () => import('@codemirror/lang-yaml').then((m) => m.yaml()),
  sql:        () => import('@codemirror/lang-sql').then((m) => m.sql()),
  json:       () => import('@codemirror/lang-json').then((m) => m.json()),
};

// Once a lang module has loaded we cache its Promise so re-mounting the
// editor on the same language doesn't re-await the network/disk. Maps lang
// key → Promise<Extension>.
const langCache = new Map();
function loadLang(lang) {
  const key = (lang || '').toLowerCase();
  const loader = LANG_LOADERS[key];
  if (!loader) return null; // Dockerfile/bash/unknown — no plugin, no-op below.
  if (!langCache.has(key)) {
    langCache.set(
      key,
      loader().catch((e) => {
        // Never cache a rejected promise: evict so a later mount retries the
        // chunk import (e.g. it failed while offline) instead of being stuck
        // with plain text for the rest of the session.
        langCache.delete(key);
        throw e;
      }),
    );
  }
  return langCache.get(key);
}

// ─── CodeEditor — a small CodeMirror 6 wrapper ───────────────────────────
//
// Drop-in replacement for the textareas inside PracticeBlock / LintEditor.
// Owns nothing in state — the parent passes `value` + `onChange` exactly like
// a controlled <textarea>. We keep state in the parent so the existing
// run / validate / persist logic doesn't need to be torn up.
//
// Why a Compartment for the language? We want to swap the parser when a
// caller flips its `lang` prop without rebuilding the whole editor.
//
// Theme tuning: bg = --bg-base, border = --border-default, gutter color =
// --text-tertiary. Syntax colors picked from existing accent palette so the
// editor blends with the rest of the app:
//
//   keyword     → --accent-amber
//   string      → --el-water
//   number      → --el-fire
//   function    → --el-earth
//   comment     → --text-tertiary
//
// `EditorView.lineWrapping` is forced ON so long lines wrap rather than
// scroll horizontally (the user has flagged horizontal scroll repeatedly).

const langCompartment = new Compartment();
// readOnly lives in its own compartment so prop flips (PracticeBlock locks
// the editor while a run is in flight) reconfigure the live view instead of
// being baked in at mount and silently ignored afterwards.
const readOnlyCompartment = new Compartment();

// The editable/readOnly extension pair for a given readOnly prop value.
function readOnlyExtensions(readOnly) {
  return [
    EditorView.editable.of(!readOnly),
    EditorState.readOnly.of(!!readOnly),
  ];
}

// Highlight style mapped to the existing CSS variables so the editor never
// looks like a different app.
const infraHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.modifier, t.definitionKeyword, t.moduleKeyword, t.operatorKeyword], color: 'var(--accent-amber)' },
  { tag: [t.string, t.special(t.string)], color: 'var(--el-water)' },
  { tag: [t.number, t.bool, t.null, t.atom], color: 'var(--el-fire)' },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.macroName], color: 'var(--el-earth)' },
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: 'var(--text-tertiary)', fontStyle: 'italic' },
  { tag: [t.propertyName, t.attributeName], color: 'var(--text-primary)' },
  { tag: [t.typeName, t.className], color: 'var(--el-earth)' },
  { tag: [t.tagName], color: 'var(--accent-amber)' },
  { tag: [t.operator, t.punctuation, t.bracket], color: 'var(--text-secondary)' },
  { tag: [t.variableName], color: 'var(--text-primary)' },
]);

// Editor chrome theme. Kept terse — the heavy lifting is in theme.css under
// the `/* ───── CodeMirror ───── */` section so designers can iterate
// without re-bundling.
const infraTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: 'var(--bg-base)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-mono)',
      fontSize: '13px',
      border: '1px solid var(--border-default)',
      borderRadius: '8px',
    },
    '&.cm-focused': { outline: 'none', borderColor: 'var(--accent-amber-dim)' },
    '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: '1.55' },
    '.cm-content': { padding: '10px 0', caretColor: 'var(--accent-amber)' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--accent-amber)' },
    '.cm-gutters': {
      backgroundColor: 'var(--bg-elevated)',
      color: 'var(--text-tertiary)',
      border: 'none',
      borderRight: '1px solid var(--border-subtle)',
    },
    '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--text-secondary)' },
    '.cm-activeLine': { backgroundColor: 'rgba(245, 184, 66, 0.04)' },
    '.cm-selectionBackground, ::selection': { backgroundColor: 'rgba(245, 184, 66, 0.20) !important' },
    '.cm-matchingBracket, .cm-nonmatchingBracket': {
      backgroundColor: 'rgba(245, 184, 66, 0.18)',
      outline: 'none',
    },
  },
  { dark: true },
);

export default function CodeEditor({
  value,
  onChange,
  lang,
  ariaLabel,
  readOnly,
  minHeight,
}) {
  const hostRef = useRef(null);
  const viewRef = useRef(null);
  // Keep the latest onChange in a ref so the update listener never goes
  // stale; we don't want to tear down the EditorView on every keystroke.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Boot the editor once on mount.
  useEffect(() => {
    if (!hostRef.current) return;
    const startState = EditorState.create({
      doc: value ?? '',
      extensions: [
        lineNumbers(),
        history(),
        bracketMatching(),
        highlightActiveLine(),
        indentUnit.of('  '),
        EditorState.tabSize.of(2),
        EditorView.lineWrapping,
        keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap]),
        syntaxHighlighting(infraHighlight),
        infraTheme,
        // Mount the compartment EMPTY. The lang plugin is loaded
        // asynchronously below and reconfigured in once it lands. This
        // matters because we deliberately ship parsers as separate chunks
        // — the editor must boot without waiting on the network.
        langCompartment.of([]),
        readOnlyCompartment.of(readOnlyExtensions(readOnly)),
        EditorView.updateListener.of((u) => {
          if (u.docChanged && onChangeRef.current) {
            onChangeRef.current(u.state.doc.toString());
          }
        }),
      ],
    });
    const view = new EditorView({ state: startState, parent: hostRef.current });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // We deliberately mount once. `lang` / `value` / `readOnly` changes are
    // handled by the dedicated effects below so the editor is never torn
    // down mid-typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap parser when the lang prop flips. The plugin is loaded on demand
  // (each language is its own JS chunk) so we await the import and then
  // reconfigure the compartment. We guard against races: if the user flips
  // the lang again before the previous load resolves, we ignore the stale
  // resolution by tagging each await with the lang it was for and bailing
  // if the prop has moved on. Dockerfile/bash (and any unknown value) hit
  // the `null` branch and clear back to a no-op extension.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return undefined;
    let cancelled = false;
    const pending = loadLang(lang);
    if (!pending) {
      // Unknown / no-parser lang — clear any previous parser to a no-op.
      view.dispatch({ effects: langCompartment.reconfigure([]) });
      return undefined;
    }
    pending.then((ext) => {
      if (cancelled) return;
      const v = viewRef.current;
      if (!v) return;
      v.dispatch({ effects: langCompartment.reconfigure(ext) });
    }).catch(() => { /* network/chunk failure → editor still works as plain text */ });
    return () => { cancelled = true; };
  }, [lang]);

  // Reflect readOnly prop changes on the live view. Without this, the value
  // captured by the mount-once effect stuck forever — e.g. users could keep
  // editing while a run was in flight.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: readOnlyCompartment.reconfigure(readOnlyExtensions(readOnly)),
    });
  }, [readOnly]);

  // Reflect external value resets (Reset button, sandbox hand-off load,
  // localStorage hydrate). We only patch the doc when it actually differs
  // from the editor's current contents to avoid clobbering the cursor.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if ((value ?? '') !== current) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value ?? '' },
      });
    }
  }, [value]);

  return (
    <div
      ref={hostRef}
      className="cm-host"
      aria-label={ariaLabel}
      style={minHeight ? { minHeight } : undefined}
    />
  );
}
