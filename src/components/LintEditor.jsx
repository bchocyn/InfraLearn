import { useState, useEffect, useRef } from 'react';
import CodeEditor from './CodeEditor.jsx';
import { practiceStorageKey } from '../utils/practiceKey.js';

// ─── LintEditor — shared component for non-executable languages ──────────
//
// CodeMirror editor + below-editor status row. The `validate` prop is a pure
// function called on each change; returns `{ ok, errors: [{line, col, msg}] }`.
// Status reads green when ok, fire/red with first error otherwise.
//
// Persistence is opt-in via `persistKey`. When set we round-trip the source
// through localStorage (400ms debounce). A "Reset to example" button below
// the editor wipes the saved source and re-loads the placeholder. When
// unset (e.g. used internally without persistence) the component still
// works the same way it always has.
// Storage-key derivation lives in src/utils/practiceKey.js so the inline
// editor, PracticeBlock, and Lesson's sandbox hand-off all hit the same bucket.

export default function LintEditor({ kind, placeholder, validate, persistKey, lessonId }) {
  // Preserve the pre-refactor behavior: when no persistKey AND no lessonId,
  // disable persistence entirely (LintEditor never used the 'anon' bucket).
  const storageKey =
    persistKey ||
    (lessonId ? practiceStorageKey(lessonId, placeholder || '') : null);

  const [source, setSource] = useState(() => {
    if (typeof window === 'undefined' || !storageKey) return placeholder;
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved != null) return saved;
    } catch { /* ignore */ }
    return placeholder;
  });

  // Debounced persistence, exactly mirrors PracticeBlock's behavior.
  // `pendingWriteRef` keeps the not-yet-flushed write so the unmount cleanup
  // can flush it synchronously — otherwise the last <400ms of typing was
  // dropped when the user navigated away.
  const pendingWriteRef = useRef(null);
  useEffect(() => {
    if (typeof window === 'undefined' || !storageKey) return undefined;
    const write = () => {
      pendingWriteRef.current = null;
      try {
        if (source === placeholder) {
          window.localStorage.removeItem(storageKey);
        } else {
          window.localStorage.setItem(storageKey, source);
        }
      } catch { /* ignore */ }
    };
    pendingWriteRef.current = write;
    const t = setTimeout(write, 400);
    return () => clearTimeout(t);
  }, [source, storageKey, placeholder]);
  // Unmount-only: flush a still-pending debounced write.
  useEffect(() => () => {
    if (pendingWriteRef.current) pendingWriteRef.current();
  }, []);

  const result = validate(source);

  const onReset = () => {
    setSource(placeholder);
    if (typeof window !== 'undefined' && storageKey) {
      try { window.localStorage.removeItem(storageKey); } catch { /* ignore */ }
    }
  };

  // Dockerfile + bash don't have a first-party parser; CodeEditor falls
  // back to plain text but keeps line numbers / bracket matching / tab
  // indent. Pass the kind straight through.
  return (
    <div className="lint-editor">
      <div className="lint-editor-host">
        <CodeEditor
          value={source}
          onChange={setSource}
          lang={kind}
          ariaLabel={`${kind} editor`}
          minHeight={160}
        />
      </div>
      {/* Status row. Tier B: warnings (ok=true with a non-empty errors[]) are
          rendered in a third state — amber, not red — so the user sees the
          advisory without losing the ✓ for "parses cleanly". */}
      {(() => {
        const hasWarning = result.ok && result.errors && result.errors.length > 0;
        // For warning state we stay on the "ok" class so the row keeps its
        // green-ish frame, but tint the foreground amber inline so the
        // advisory is visually distinct from the silent-pass case.
        const stateCls = !result.ok ? ' err' : hasWarning ? ' ok' : ' ok';
        const warnStyle = hasWarning ? { color: 'var(--accent-amber)' } : undefined;
        return (
          <div className={`lint-editor-status${stateCls}`} style={warnStyle}>
            {!result.ok ? (
              <span>
                <span className="lint-editor-x">✗</span> {result.errors[0].msg}
                {result.errors[0].rule && (
                  <span className="mono" style={{ marginLeft: 6, opacity: 0.7 }}>[{result.errors[0].rule}]</span>
                )}
                {typeof result.errors[0].line === 'number' && (
                  <span className="mono" style={{ marginLeft: 6, opacity: 0.8 }}>
                    @ line {result.errors[0].line}
                    {typeof result.errors[0].col === 'number' && `, col ${result.errors[0].col}`}
                  </span>
                )}
              </span>
            ) : hasWarning ? (
              <span>
                <span className="lint-editor-tick">⚠</span> {result.errors[0].msg}
                {result.errors[0].rule && (
                  <span className="mono" style={{ marginLeft: 6, opacity: 0.7 }}>[{result.errors[0].rule}]</span>
                )}
              </span>
            ) : (
              <span>
                <span className="lint-editor-tick">✓</span> {kind.toUpperCase()} parses cleanly.
              </span>
            )}
          </div>
        );
      })()}
      {storageKey && (
        <div className="lint-editor-reset-row">
          <button type="button" className="btn btn-ghost lint-editor-reset" onClick={onReset}>
            ↶ Reset to example
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Validators ──────────────────────────────────────────────────────────
// All synchronous. Return shape: { ok: bool, errors: [{line, col?, msg}] }.

export function validateJson(src) {
  if (!src.trim()) return { ok: false, errors: [{ msg: 'empty' }] };
  try {
    JSON.parse(src);
    // Size-warning surfaced as a non-fatal "error" so the status row can
    // flag enormous payloads (browsers parse fine but git/diff tools choke).
    // Tier B upgrade — keep the parse-success path returning ok: true but
    // tuck the warning into errors so the status renderer can pick it up.
    const bytes = new Blob([src]).size;
    if (bytes > 100 * 1024) {
      return {
        ok: true,
        errors: [{
          msg: `Large payload (${Math.round(bytes / 1024)} KB) — diff/review tools may struggle above 100 KB.`,
          rule: 'JS001',
          warning: true,
        }],
      };
    }
    return { ok: true, errors: [] };
  } catch (e) {
    const m = String(e.message).match(/position (\d+)/);
    if (m) {
      const pos = parseInt(m[1], 10);
      const before = src.slice(0, pos);
      const line = before.split('\n').length;
      const col = pos - before.lastIndexOf('\n');
      return { ok: false, errors: [{ line, col, msg: e.message }] };
    }
    return { ok: false, errors: [{ msg: e.message }] };
  }
}

// ── YAML ──────────────────────────────────────────────────────────────────
// Tier B: schema-aware lint. Generic rules first (tabs / formatting / dup
// top-level keys), then sniff the structure to decide if this is a
// docker-compose or a k8s manifest and apply targeted rules.
export function validateYaml(src) {
  if (!src.trim()) return { ok: false, errors: [{ msg: 'empty' }] };
  const lines = src.split('\n');

  // YML000 — tabs forbidden.
  for (let i = 0; i < lines.length; i++) {
    if (/^\t/.test(lines[i])) {
      return { ok: false, errors: [{ line: i + 1, msg: 'YAML cannot use tabs for indentation — use spaces.', rule: 'YML000' }] };
    }
  }

  // YML001 — `key:value` (missing space after the KEY's colon). The match is
  // anchored at line start (optionally behind a `- ` sequence dash), so a
  // colon inside a VALUE never fires: `image: python:3.12-slim`, URLs, and
  // quoted `"8000:8000"` port mappings all have the line's first `key: ` with
  // a proper space, or start the token with a quote — neither can match.
  // Colons followed by `/` (e.g. an `http://…` key/scheme) are skipped too.
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*#/.test(line)) continue;
    const m = line.match(/^(\s*(?:-\s+)?)([A-Za-z_][\w.-]*):(?=\S)/);
    if (!m) continue;
    const afterColon = line.slice(m[0].length);
    if (afterColon.startsWith('/')) continue;
    return { ok: false, errors: [{ line: i + 1, col: m[0].length, msg: 'YAML keys need a space after `:` — `key: value`, not `key:value`.', rule: 'YML001' }] };
  }

  // YML002 — duplicate top-level keys (zero-indent `key:`). The seen-set
  // resets at `---` document separators so multi-document files (k8s
  // manifests) don't false-flag the second document against the first.
  const topLevel = new Map();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^---/.test(line)) {
      topLevel.clear();
      continue;
    }
    if (/^\s*#/.test(line)) continue;
    const m = line.match(/^([A-Za-z_][\w-]*)\s*:/);
    if (m) {
      if (topLevel.has(m[1])) {
        return { ok: false, errors: [{ line: i + 1, msg: `Duplicate top-level key: \`${m[1]}\` (also at line ${topLevel.get(m[1])})`, rule: 'YML002' }] };
      }
      topLevel.set(m[1], i + 1);
    }
  }

  // Sniff document kind.
  const isCompose = /^\s*services\s*:/m.test(src) || /^\s*version\s*:\s*["']?[23]/m.test(src);
  const isK8s     = /^\s*apiVersion\s*:/m.test(src) && /^\s*kind\s*:/m.test(src);

  if (isCompose) {
    // YML010 — every service must have an image OR a build.
    const serviceBlocks = extractYamlBlock(src, /^services\s*:\s*$/m);
    for (const svc of serviceBlocks) {
      const hasImage = /^\s+image\s*:/m.test(svc.body);
      const hasBuild = /^\s+build\s*:/m.test(svc.body);
      if (!hasImage && !hasBuild) {
        return { ok: false, errors: [{ line: svc.line, msg: `Service \`${svc.name}\` needs an \`image:\` or \`build:\` directive.`, rule: 'YML010' }] };
      }
    }
    // YML011 — ports under services should be quoted strings.
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^\s+-\s+(\d+):(\d+)\s*$/);
      if (m) {
        return { ok: false, errors: [{ line: i + 1, msg: 'Quote port mappings — `"8000:8000"` — YAML may parse `60:00` as base-60 time.', rule: 'YML011' }] };
      }
    }
  }

  if (isK8s) {
    // YML020 — required top-level fields.
    if (!/^\s*apiVersion\s*:\s*\S+/m.test(src)) {
      return { ok: false, errors: [{ msg: 'k8s manifest missing `apiVersion`.', rule: 'YML020' }] };
    }
    if (!/^\s*kind\s*:\s*\S+/m.test(src)) {
      return { ok: false, errors: [{ msg: 'k8s manifest missing `kind`.', rule: 'YML020' }] };
    }
    if (!/^\s+name\s*:\s*\S+/m.test(src)) {
      return { ok: false, errors: [{ msg: 'k8s manifest missing `metadata.name`.', rule: 'YML020' }] };
    }
    // YML021 — selector/labels mismatch (best-effort scan).
    const selMatch  = src.match(/matchLabels\s*:\s*\{?\s*app\s*:\s*([\w-]+)/);
    const tmplMatch = src.match(/template\s*:[\s\S]*?labels\s*:\s*\{?\s*app\s*:\s*([\w-]+)/);
    if (selMatch && tmplMatch && selMatch[1] !== tmplMatch[1]) {
      return { ok: false, errors: [{ msg: `selector.matchLabels.app (\`${selMatch[1]}\`) doesn't match template.metadata.labels.app (\`${tmplMatch[1]}\`).`, rule: 'YML021' }] };
    }
  }

  return { ok: true, errors: [] };
}

// Pull out top-level service blocks for compose validation. Returns an array
// of { name, line, body } where `body` is the indented region after the
// service key. Best-effort — robust enough for the compose lint above.
function extractYamlBlock(src, headerRe) {
  const lines = src.split('\n');
  let inServices = false;
  let baseIndent = -1;
  const services = [];
  let current = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!inServices) {
      if (headerRe.test(line)) {
        inServices = true;
      }
      continue;
    }
    if (!line.trim()) continue;
    const indent = line.match(/^(\s*)/)[1].length;
    if (indent === 0 && !line.startsWith(' ')) {
      // Out of services block.
      if (current) services.push(current);
      break;
    }
    if (baseIndent < 0) baseIndent = indent;
    if (indent === baseIndent) {
      // New service.
      if (current) services.push(current);
      const m = line.match(/^\s+([A-Za-z_][\w-]*)\s*:\s*$/);
      current = m ? { name: m[1], line: i + 1, body: '' } : null;
    } else if (current && indent > baseIndent) {
      current.body += line + '\n';
    }
  }
  if (current) services.push(current);
  return services;
}

// ── SQL ───────────────────────────────────────────────────────────────────
// Tier B: structural lint on top of the previous balanced-quotes/parens check.
// Detects classic footguns: SELECT *, unguarded UPDATE/DELETE, NULL with =,
// LIMIT without ORDER BY.
export function validateSql(src) {
  if (!src.trim()) return { ok: false, errors: [{ msg: 'empty' }] };

  // 1. Balanced quotes + parens (the previous behavior — hard errors).
  const cleaned = src
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let line = 1;
  let col = 0;
  for (let i = 0; i < cleaned.length; i++) {
    const c = cleaned[i];
    if (c === '\n') { line++; col = 0; continue; }
    col++;
    if (inSingle) {
      if (c === "'" && cleaned[i + 1] !== "'") inSingle = false;
      continue;
    }
    if (inDouble) {
      if (c === '"') inDouble = false;
      continue;
    }
    if (c === "'") inSingle = true;
    else if (c === '"') inDouble = true;
    else if (c === '(') depth++;
    else if (c === ')') {
      depth--;
      if (depth < 0) return { ok: false, errors: [{ line, col, msg: 'unmatched `)`', rule: 'SQL000' }] };
    }
  }
  if (inSingle) return { ok: false, errors: [{ msg: 'unterminated single-quote string', rule: 'SQL000' }] };
  if (inDouble) return { ok: false, errors: [{ msg: 'unterminated double-quote string', rule: 'SQL000' }] };
  if (depth !== 0) return { ok: false, errors: [{ msg: `unbalanced parens (${depth} unclosed)`, rule: 'SQL000' }] };

  // 2. Structural rules — surface as the first matching issue.
  const lines = src.split('\n');
  const upper = cleaned.toUpperCase();

  // SQL003 — UPDATE / DELETE without WHERE. Hard danger.
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i].trim();
    if (!L || L.startsWith('--')) continue;
    const u = L.toUpperCase();
    if (/^UPDATE\s+/.test(u)) {
      // Look at this statement (until semicolon) for a WHERE.
      const stmt = collectStatement(lines, i).toUpperCase();
      if (!/\bWHERE\b/.test(stmt)) {
        return { ok: false, errors: [{ line: i + 1, msg: 'UPDATE without WHERE — will rewrite every row. Add a WHERE clause.', rule: 'SQL003' }] };
      }
    }
    if (/^DELETE\s+FROM\s+/.test(u)) {
      const stmt = collectStatement(lines, i).toUpperCase();
      if (!/\bWHERE\b/.test(stmt)) {
        return { ok: false, errors: [{ line: i + 1, msg: 'DELETE without WHERE — will empty the table. Add a WHERE clause.', rule: 'SQL003' }] };
      }
    }
  }

  // SQL002 — NULL compared with `=` / `!=` / `<>` (should be IS NULL /
  // IS NOT NULL). Only meaningful in COMPARISON contexts — WHERE / ON /
  // HAVING. `UPDATE … SET col = NULL` is a perfectly valid assignment, so we
  // track the statement context token-by-token and skip SET (and any other
  // non-comparison) context. `;` ends the statement and resets the context.
  {
    let nullCtx = null; // 'cmp' after WHERE/ON/HAVING, 'set' after SET
    for (let i = 0; i < lines.length; i++) {
      const code = lines[i].replace(/--.*$/, '');
      const re = /;|\b(WHERE|HAVING|ON|SET)\b|(?:!=|<>|=)\s*NULL\b/gi;
      let m;
      while ((m = re.exec(code)) !== null) {
        if (m[0] === ';') {
          nullCtx = null;
          continue;
        }
        if (m[1]) {
          nullCtx = m[1].toUpperCase() === 'SET' ? 'set' : 'cmp';
          continue;
        }
        if (nullCtx === 'cmp') {
          return { ok: false, errors: [{ line: i + 1, msg: 'Compare NULL with `IS NULL` / `IS NOT NULL`, not `=` / `!=` (NULL = NULL is UNKNOWN, not TRUE).', rule: 'SQL002' }] };
        }
      }
    }
  }

  // SQL004 — LIMIT without ORDER BY (non-deterministic).
  if (/\bLIMIT\b/.test(upper) && !/\bORDER\s+BY\b/.test(upper)) {
    const lineIdx = lines.findIndex((l) => /\bLIMIT\b/i.test(l));
    return { ok: false, errors: [{ line: lineIdx + 1, msg: 'LIMIT without ORDER BY — results are non-deterministic. Add an ORDER BY.', rule: 'SQL004' }] };
  }

  // SQL001 — SELECT * (warning, not error). Skip if the query is clearly
  // exploration-style (single SELECT, no JOIN/GROUP).
  if (/\bSELECT\s+\*/i.test(src)) {
    const looksProd = /\bJOIN\b/i.test(upper) || /\bGROUP\s+BY\b/i.test(upper) || /\bFROM\b[\s\S]+\bJOIN\b/i.test(upper);
    if (looksProd) {
      const lineIdx = lines.findIndex((l) => /\bSELECT\s+\*/i.test(l));
      return {
        ok: true,
        errors: [{
          line: lineIdx + 1,
          msg: 'SELECT * in a query with JOINs — list columns explicitly to avoid surprise schema changes. (Fine for ad-hoc exploration.)',
          rule: 'SQL001',
          warning: true,
        }],
      };
    }
  }

  return { ok: true, errors: [] };
}

// Walk forward from `startIdx` until we hit a semicolon (statement end) or
// EOF. Used by the UPDATE/DELETE-without-WHERE check.
function collectStatement(lines, startIdx) {
  const out = [];
  for (let i = startIdx; i < lines.length; i++) {
    out.push(lines[i]);
    if (lines[i].includes(';')) break;
  }
  return out.join('\n');
}

// ── Dockerfile ────────────────────────────────────────────────────────────
// Tier B: hand-rolled Hadolint-style rules (no external binary). Rule codes
// mirror the upstream Hadolint codes (DL3000 etc.) so anyone Googling the
// rule lands on the right reference.
//
// Rules implemented:
//   DL3000  Use absolute WORKDIR
//   DL3001  Avoid 'sudo' in RUN
//   DL3002  Don't run as root (warn if no USER instruction)
//   DL3003  Don't use 'cd' in RUN (use WORKDIR)
//   DL3006  Always tag FROM image
//   DL3007  Don't use 'latest' tag
//   DL3008  Pin versions in apt-get install
//   DL3018  Pin versions in apk add
//   DL3020  Use COPY over ADD for files/folders
//   DL3025  Use JSON form CMD / ENTRYPOINT
//   DL3027  Don't use 'apt' (use apt-get)
//   DL3042  Avoid use of 'pip install' without --no-cache-dir
//   DL3059  Multiple consecutive RUN — merge into one
//   DL4000  MAINTAINER is deprecated
//   DL4006  Set SHELL with -o pipefail
//   DL3013  Pin versions in pip install
//   DF000   Dockerfile must start with FROM (legacy syntax check)
export function validateDockerfile(src) {
  if (!src.trim()) return { ok: false, errors: [{ msg: 'empty' }] };
  const lines = src.split('\n');
  let seenFrom = false;
  let seenUser = false;
  let lastInstr = null;
  let consecRun = 0;

  // Multi-stage builds: `FROM base AS builder` … `FROM builder`. The second
  // FROM references a local stage alias, which has no tag BY DESIGN — collect
  // the aliases up front so DL3006 can exempt them. Stage-name matching is
  // case-insensitive, like Docker's.
  const stageAliases = new Set();
  for (const raw of lines) {
    const m = raw.trim().match(/^FROM\s+.+\s+AS\s+([\w][\w.-]*)\s*$/i);
    if (m) stageAliases.add(m[1].toLowerCase());
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const first = line.split(/\s+/)[0].toUpperCase();
    const rest = line.slice(first.length).trim();

    // DF000 — must start with FROM (or ARG).
    if (!seenFrom && first !== 'FROM' && first !== 'ARG') {
      return { ok: false, errors: [{ line: i + 1, msg: 'Dockerfile must start with FROM (or ARG before FROM).', rule: 'DF000' }] };
    }

    // Track consecutive RUN instructions for DL3059.
    if (first === 'RUN') {
      consecRun = lastInstr === 'RUN' ? consecRun + 1 : 1;
    } else if (first !== 'RUN') {
      consecRun = 0;
    }
    lastInstr = first;

    if (first === 'FROM') {
      seenFrom = true;
      // DL3006 — must include a tag. `FROM <stage-alias>` is exempt: a stage
      // reference never carries a tag.
      const img = rest.split(/\s+(?:AS\s+\w+)?$/i)[0].trim();
      if (
        img &&
        !img.includes(':') &&
        !img.includes('@sha256:') &&
        !stageAliases.has(img.toLowerCase())
      ) {
        return { ok: false, errors: [{ line: i + 1, msg: `Tag FROM image — \`${img}\` has no tag; defaults to :latest which is reproducibility-poison.`, rule: 'DL3006' }] };
      }
      // DL3007 — explicit :latest.
      if (/:latest(\s|$)/i.test(rest)) {
        return { ok: false, errors: [{ line: i + 1, msg: 'Do not use the `:latest` tag — pin to a specific version (e.g. python:3.12-slim).', rule: 'DL3007' }] };
      }
    }

    // DL4000 — MAINTAINER deprecated.
    if (first === 'MAINTAINER') {
      return { ok: false, errors: [{ line: i + 1, msg: 'MAINTAINER is deprecated — use `LABEL maintainer="..."` instead.', rule: 'DL4000' }] };
    }

    if (first === 'WORKDIR') {
      // DL3000 — must be absolute.
      if (rest && !rest.startsWith('/') && !rest.startsWith('$')) {
        return { ok: false, errors: [{ line: i + 1, msg: 'WORKDIR must be an absolute path (start with `/`).', rule: 'DL3000' }] };
      }
    }

    if (first === 'USER') seenUser = true;

    if (first === 'ADD') {
      // DL3020 — use COPY unless it's a URL or .tar.gz auto-extract.
      const src0 = rest.split(/\s+/)[0] || '';
      if (!src0.startsWith('http') && !/\.(tar|gz|tgz|tar\.gz|zip|bz2)$/.test(src0)) {
        return { ok: false, errors: [{ line: i + 1, msg: 'Use COPY instead of ADD for plain files/folders (ADD has surprise side effects).', rule: 'DL3020' }] };
      }
    }

    if (first === 'RUN') {
      // DL3001 — sudo inside RUN.
      if (/\bsudo\b/.test(rest)) {
        return { ok: false, errors: [{ line: i + 1, msg: 'Avoid `sudo` in RUN — set USER instead.', rule: 'DL3001' }] };
      }
      // DL3003 — `cd` in RUN.
      if (/\bcd\s+\S/.test(rest)) {
        return { ok: false, errors: [{ line: i + 1, msg: 'Use WORKDIR instead of `cd` in RUN (cd is per-process; WORKDIR persists).', rule: 'DL3003' }] };
      }
      // DL3027 — apt instead of apt-get.
      if (/\bapt\s+(install|update|upgrade)/.test(rest)) {
        return { ok: false, errors: [{ line: i + 1, msg: 'Use `apt-get`, not `apt` — `apt` is interactive and unstable for scripts.', rule: 'DL3027' }] };
      }
      // DL3008 — apt-get install without pinned versions.
      if (/apt-get\s+(?:[-\w]+\s+)*install/.test(rest)) {
        // Allow if every package has =version. Skim past flags first.
        const installIdx = rest.indexOf('install');
        const tail = rest.slice(installIdx + 'install'.length);
        const pkgs = tail.split(/[;&|\\]/)[0]
          .split(/\s+/)
          .filter((tok) => tok && !tok.startsWith('-'));
        const anyUnpinned = pkgs.some((p) => !p.includes('='));
        if (anyUnpinned && pkgs.length > 0) {
          return { ok: false, errors: [{ line: i + 1, msg: 'Pin apt-get package versions — `pkg=1.2.3` — so rebuilds are deterministic.', rule: 'DL3008' }] };
        }
      }
      // DL3018 — apk add without pinned versions.
      if (/apk\s+(?:[-\w]+\s+)*add/.test(rest)) {
        const addIdx = rest.indexOf('add');
        const tail = rest.slice(addIdx + 'add'.length);
        const pkgs = tail.split(/[;&|\\]/)[0]
          .split(/\s+/)
          .filter((tok) => tok && !tok.startsWith('-'));
        const anyUnpinned = pkgs.some((p) => !p.includes('='));
        if (anyUnpinned && pkgs.length > 0) {
          return { ok: false, errors: [{ line: i + 1, msg: 'Pin apk package versions — `pkg=1.2.3-r0` — for reproducible builds.', rule: 'DL3018' }] };
        }
      }
      // DL3013 — pip install without pinned versions (e.g. `pip install requests`).
      if (/\bpip(3)?\s+install\b/.test(rest)) {
        const isFromFile = /-r\s+\S+/.test(rest) || /\brequirements\.txt\b/.test(rest);
        const hasWheel   = /\.whl\b/.test(rest);
        if (!isFromFile && !hasWheel) {
          const tokens = rest.split(/\s+/);
          const pkgStart = tokens.findIndex((t) => t === 'install') + 1;
          const pkgs = tokens.slice(pkgStart).filter((t) => t && !t.startsWith('-'));
          const anyUnpinned = pkgs.some((p) => !p.includes('==') && !p.includes('>=') && !p.includes('~='));
          if (anyUnpinned && pkgs.length > 0) {
            return { ok: false, errors: [{ line: i + 1, msg: 'Pin pip versions — `pkg==1.2.3` — or install from a locked requirements.txt.', rule: 'DL3013' }] };
          }
        }
      }
      // DL3042 — pip install without --no-cache-dir wastes layer space.
      if (/\bpip(3)?\s+install\b/.test(rest) && !/--no-cache-dir/.test(rest)) {
        return { ok: false, errors: [{ line: i + 1, msg: 'Use `pip install --no-cache-dir ...` — the cache only inflates the layer.', rule: 'DL3042' }] };
      }
      // DL3059 — multiple consecutive RUN.
      if (consecRun >= 3) {
        return { ok: false, errors: [{ line: i + 1, msg: 'Merge multiple consecutive RUN statements — each one adds a layer.', rule: 'DL3059' }] };
      }
    }

    if (first === 'SHELL') {
      // DL4006 — SHELL set without pipefail is the whole point of using SHELL.
      if (!/pipefail/.test(rest)) {
        return { ok: false, errors: [{ line: i + 1, msg: 'Set SHELL with `-o pipefail` — without it, errors in piped commands are silently dropped.', rule: 'DL4006' }] };
      }
    }

    if (first === 'EXPOSE') {
      const port = line.split(/\s+/)[1];
      if (!port || !/^\d+(\/(tcp|udp))?$/.test(port)) {
        return { ok: false, errors: [{ line: i + 1, msg: `EXPOSE expects a port number, got "${port || ''}"`, rule: 'DF001' }] };
      }
    }

    if (first === 'CMD' || first === 'ENTRYPOINT') {
      // DL3025 — JSON-array form recommended.
      if (rest && !rest.startsWith('[')) {
        return {
          ok: false,
          errors: [{
            line: i + 1,
            msg: `${first} should use JSON-array form: ${first} ["python", "main.py"]`,
            rule: 'DL3025',
          }],
        };
      }
    }
  }

  if (!seenFrom) return { ok: false, errors: [{ msg: 'no FROM instruction', rule: 'DF000' }] };

  // DL3002 — running as root. Warning only.
  if (!seenUser) {
    return {
      ok: true,
      errors: [{
        msg: 'No USER instruction — image runs as root. Consider adding `USER nonroot` near the end.',
        rule: 'DL3002',
        warning: true,
      }],
    };
  }

  return { ok: true, errors: [] };
}
