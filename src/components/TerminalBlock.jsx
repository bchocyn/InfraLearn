import { useEffect, useRef, useState } from 'react';

// TerminalBlock — a focused in-browser shell sandbox for learning Unix
// fundamentals without leaving the lesson.
//
// This is NOT bash. It's a hand-rolled simulator of the ~15 commands a
// beginner-to-intermediate Unix user types daily, on a tiny in-memory
// filesystem. Per mobile-ux-principles (lessons = reading, labs = own-machine)
// this lives on the Sandbox screen — never inside a regular lesson body.
//
// Supported commands:
//   pwd, ls (-l/-a/-la), cd, cat, echo, mkdir (-p), touch, rm (-r/-f),
//   grep, head (-n), tail (-n), wc (-l/-w/-c), cp, mv, history, clear,
//   help, whoami, date, env, export, true, false
// Pipes (`|`) and redirects (`>`, `>>`) are NOT supported — they're a future
// extension if the user asks. Output goes straight to the history pane.
//
// History is keyboard-navigable with ArrowUp/ArrowDown. Tab completes the
// first filename match in the current directory.

const HOME = '/home/user';
const PROMPT = (cwd) => `user@infralearn:${cwd}$ `;

// Seed filesystem. Folders are nested objects; files are strings. The leading
// slash key is the root; everything under it composes paths.
function seedFs() {
  return {
    '/': {
      home: {
        user: {
          'notes.txt': "Welcome to InfraLearn's terminal sandbox.\nTry: ls, cat notes.txt, echo hi, mkdir docs\n",
          'todo.md':   "# TODO\n- learn the toolkit\n- write a small shell script\n- read about pipes\n",
          'projects': {
            'demo': {
              'README.md': "# demo\n\nA tiny placeholder project. Edit me.\n",
            },
          },
        },
      },
      etc: {
        'hosts': "127.0.0.1 localhost\n",
      },
    },
  };
}

// ─── Path helpers ─────────────────────────────────────────────────────────
function splitPath(p) {
  return p.split('/').filter(Boolean);
}
function joinPath(parts) {
  return '/' + parts.join('/');
}
function resolvePath(cwd, arg) {
  if (!arg) return cwd;
  if (arg === '~') return HOME;
  if (arg.startsWith('~/')) return HOME + arg.slice(1);
  const abs = arg.startsWith('/') ? arg : `${cwd}/${arg}`;
  const parts = splitPath(abs);
  const out = [];
  for (const seg of parts) {
    if (seg === '.') continue;
    if (seg === '..') out.pop();
    else out.push(seg);
  }
  return joinPath(out) || '/';
}
function getNode(fs, path) {
  if (path === '/') return fs['/'];
  const parts = splitPath(path);
  let cur = fs['/'];
  for (const seg of parts) {
    if (!cur || typeof cur !== 'object' || !(seg in cur)) return undefined;
    cur = cur[seg];
  }
  return cur;
}
function setNode(fs, path, value) {
  if (path === '/') return false; // can't replace root
  const parts = splitPath(path);
  const last = parts.pop();
  let cur = fs['/'];
  for (const seg of parts) {
    if (!cur[seg] || typeof cur[seg] !== 'object') return false;
    cur = cur[seg];
  }
  cur[last] = value;
  return true;
}
function deleteNode(fs, path) {
  if (path === '/') return false;
  const parts = splitPath(path);
  const last = parts.pop();
  let cur = fs['/'];
  for (const seg of parts) {
    if (!cur[seg] || typeof cur[seg] !== 'object') return false;
    cur = cur[seg];
  }
  if (!(last in cur)) return false;
  delete cur[last];
  return true;
}
function isDir(node) { return node && typeof node === 'object'; }
function isFile(node) { return typeof node === 'string'; }
function listDir(node) {
  if (!isDir(node)) return [];
  return Object.keys(node).sort();
}

// ─── Args parsing ─────────────────────────────────────────────────────────
// Split a raw command line into tokens, respecting single/double quotes so
// `echo "hello world"` reads as two tokens not three.
function tokenize(line) {
  const out = [];
  let buf = '';
  let inSingle = false, inDouble = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inSingle) {
      if (c === "'") { inSingle = false; }
      else { buf += c; }
      continue;
    }
    if (inDouble) {
      if (c === '"') { inDouble = false; }
      else if (c === '\\' && i + 1 < line.length) { buf += line[++i]; }
      else { buf += c; }
      continue;
    }
    if (c === "'") { inSingle = true; continue; }
    if (c === '"') { inDouble = true; continue; }
    if (/\s/.test(c)) {
      if (buf) { out.push(buf); buf = ''; }
      continue;
    }
    buf += c;
  }
  if (buf) out.push(buf);
  return out;
}
function splitFlags(args) {
  const flags = new Set();
  const positional = [];
  for (const a of args) {
    if (a.startsWith('--')) flags.add(a.slice(2));
    else if (a.startsWith('-') && a.length > 1) {
      // collapse "-la" into ['l','a']
      for (const ch of a.slice(1)) flags.add(ch);
    } else positional.push(a);
  }
  return { flags, positional };
}

// ─── Command implementations ─────────────────────────────────────────────
// Each returns { out?, err?, cwd?, fs?, clear?, env? } — partial state updates
// that the run loop merges back into the terminal state.
function cmd_pwd(_, state) {
  return { out: state.cwd };
}
function cmd_ls(args, state) {
  const { flags, positional } = splitFlags(args);
  const target = positional[0] ? resolvePath(state.cwd, positional[0]) : state.cwd;
  const node = getNode(state.fs, target);
  if (node === undefined) return { err: `ls: ${positional[0] || target}: No such file or directory` };
  if (isFile(node)) return { out: positional[0] || target };
  const names = listDir(node).filter((n) => flags.has('a') || !n.startsWith('.'));
  if (flags.has('l')) {
    const lines = names.map((n) => {
      const child = node[n];
      const kind = isDir(child) ? 'd' : '-';
      const size = isFile(child) ? child.length : Object.keys(child || {}).length;
      return `${kind}rw-r--r-- 1 user user ${String(size).padStart(5)} ${n}${isDir(child) ? '/' : ''}`;
    });
    return { out: lines.join('\n') };
  }
  return { out: names.join('  ') };
}
function cmd_cd(args, state) {
  const target = resolvePath(state.cwd, args[0] || '~');
  const node = getNode(state.fs, target);
  if (node === undefined) return { err: `cd: ${args[0]}: No such file or directory` };
  if (!isDir(node)) return { err: `cd: ${args[0]}: Not a directory` };
  return { cwd: target };
}
function cmd_cat(args, state) {
  if (!args.length) return { err: 'cat: missing operand' };
  const parts = [];
  for (const a of args) {
    const node = getNode(state.fs, resolvePath(state.cwd, a));
    if (node === undefined) return { err: `cat: ${a}: No such file or directory` };
    if (isDir(node)) return { err: `cat: ${a}: Is a directory` };
    parts.push(node);
  }
  return { out: parts.join('') };
}
function cmd_echo(args) {
  return { out: args.join(' ') };
}
function cmd_mkdir(args, state) {
  const { flags, positional } = splitFlags(args);
  if (!positional.length) return { err: 'mkdir: missing operand' };
  const fs = state.fs;
  for (const a of positional) {
    const path = resolvePath(state.cwd, a);
    const parts = splitPath(path);
    let cur = fs['/'];
    for (let i = 0; i < parts.length; i++) {
      const seg = parts[i];
      if (cur[seg] === undefined) {
        if (i < parts.length - 1 && !flags.has('p')) {
          return { err: `mkdir: cannot create directory '${a}': No such file or directory` };
        }
        cur[seg] = {};
      } else if (isFile(cur[seg])) {
        return { err: `mkdir: cannot create directory '${a}': File exists` };
      }
      cur = cur[seg];
    }
  }
  return { fs: { ...fs } };
}
function cmd_touch(args, state) {
  if (!args.length) return { err: 'touch: missing file operand' };
  for (const a of args) {
    const path = resolvePath(state.cwd, a);
    if (getNode(state.fs, path) !== undefined) continue;
    if (!setNode(state.fs, path, '')) {
      return { err: `touch: cannot touch '${a}': No such file or directory` };
    }
  }
  return { fs: { ...state.fs } };
}
function cmd_rm(args, state) {
  const { flags, positional } = splitFlags(args);
  if (!positional.length) return { err: 'rm: missing operand' };
  for (const a of positional) {
    const path = resolvePath(state.cwd, a);
    const node = getNode(state.fs, path);
    if (node === undefined) {
      if (flags.has('f')) continue;
      return { err: `rm: cannot remove '${a}': No such file or directory` };
    }
    if (isDir(node) && !flags.has('r')) {
      return { err: `rm: cannot remove '${a}': Is a directory (use -r)` };
    }
    if (path === '/') return { err: 'rm: refusing to remove root' };
    if (path === HOME && !flags.has('f')) return { err: "rm: I won't remove your home dir like that. Add -f if you mean it." };
    deleteNode(state.fs, path);
  }
  return { fs: { ...state.fs } };
}
function cmd_grep(args, state) {
  const { positional } = splitFlags(args);
  if (positional.length < 2) return { err: 'grep: usage: grep PATTERN FILE' };
  const [pattern, ...files] = positional;
  // Raw user input may not be a valid regex (`grep (`); surface a shell-style
  // error instead of letting the SyntaxError escape the keydown handler.
  let re;
  try {
    re = new RegExp(pattern);
  } catch {
    return { err: 'grep: invalid pattern' };
  }
  const lines = [];
  for (const f of files) {
    const node = getNode(state.fs, resolvePath(state.cwd, f));
    if (node === undefined) return { err: `grep: ${f}: No such file or directory` };
    if (isDir(node)) return { err: `grep: ${f}: Is a directory` };
    for (const line of node.split('\n')) {
      if (re.test(line)) lines.push(files.length > 1 ? `${f}:${line}` : line);
    }
  }
  return { out: lines.join('\n') };
}
function cmd_head(args, state) {
  // Same shift-only logic as cmd_tail: when -n is present, the count is the
  // first positional and gets shifted off, leaving the filename in place.
  // (The old findIndex/splice combo consumed the FILENAME as the count, so
  // `head -n 5 file.txt` always errored.)
  const { flags, positional } = splitFlags(args);
  let n = 10;
  if (flags.has('n')) {
    const tok = positional.shift();
    n = parseInt(tok, 10);
    if (tok === undefined || Number.isNaN(n)) {
      return { err: `head: invalid number of lines: '${tok === undefined ? '' : tok}'` };
    }
  }
  if (!positional.length) return { err: 'head: missing file operand' };
  const node = getNode(state.fs, resolvePath(state.cwd, positional[0]));
  if (node === undefined) return { err: `head: ${positional[0]}: No such file or directory` };
  if (isDir(node)) return { err: `head: ${positional[0]}: Is a directory` };
  return { out: node.split('\n').slice(0, n).join('\n') };
}
function cmd_tail(args, state) {
  const { flags, positional } = splitFlags(args);
  let n = 10;
  if (flags.has('n')) {
    const tok = positional.shift();
    n = parseInt(tok, 10);
    if (tok === undefined || Number.isNaN(n)) {
      return { err: `tail: invalid number of lines: '${tok === undefined ? '' : tok}'` };
    }
  }
  if (!positional.length) return { err: 'tail: missing file operand' };
  const node = getNode(state.fs, resolvePath(state.cwd, positional[0]));
  if (node === undefined) return { err: `tail: ${positional[0]}: No such file or directory` };
  if (isDir(node)) return { err: `tail: ${positional[0]}: Is a directory` };
  return { out: node.split('\n').slice(-n).join('\n') };
}
function cmd_wc(args, state) {
  const { flags, positional } = splitFlags(args);
  if (!positional.length) return { err: 'wc: missing file operand' };
  const node = getNode(state.fs, resolvePath(state.cwd, positional[0]));
  if (node === undefined) return { err: `wc: ${positional[0]}: No such file or directory` };
  if (isDir(node)) return { err: `wc: ${positional[0]}: Is a directory` };
  const lines = node.split('\n').length - (node.endsWith('\n') ? 1 : 0);
  const words = node.trim().split(/\s+/).filter(Boolean).length;
  const chars = node.length;
  const showLines = flags.has('l') || (!flags.has('w') && !flags.has('c'));
  const showWords = flags.has('w') || (!flags.has('l') && !flags.has('c'));
  const showChars = flags.has('c') || (!flags.has('l') && !flags.has('w'));
  const cols = [];
  if (showLines) cols.push(String(lines).padStart(4));
  if (showWords) cols.push(String(words).padStart(4));
  if (showChars) cols.push(String(chars).padStart(4));
  cols.push(positional[0]);
  return { out: cols.join(' ') };
}
// When the destination of cp/mv resolves to an existing DIRECTORY, the real
// commands target dir/basename(src) — they never replace the directory node
// itself. Returns the rewritten absolute destination path.
function resolveDestination(state, srcPath, dst) {
  let dstPath = resolvePath(state.cwd, dst);
  if (isDir(getNode(state.fs, dstPath))) {
    dstPath = resolvePath(dstPath, splitPath(srcPath).pop() || '');
  }
  return dstPath;
}
function cmd_cp(args, state) {
  if (args.length < 2) return { err: 'cp: usage: cp SRC DST' };
  const [src, dst] = args;
  const srcPath = resolvePath(state.cwd, src);
  const node = getNode(state.fs, srcPath);
  if (node === undefined) return { err: `cp: ${src}: No such file or directory` };
  if (isDir(node)) return { err: `cp: ${src}: Is a directory (cp -r not supported)` };
  const dstPath = resolveDestination(state, srcPath, dst);
  if (dstPath === srcPath) return { err: `cp: '${src}' and '${dst}' are the same file` };
  if (isDir(getNode(state.fs, dstPath))) {
    return { err: `cp: cannot overwrite directory '${dst}' with non-directory` };
  }
  if (!setNode(state.fs, dstPath, node)) {
    return { err: `cp: cannot create '${dst}'` };
  }
  return { fs: { ...state.fs } };
}
function cmd_mv(args, state) {
  if (args.length < 2) return { err: 'mv: usage: mv SRC DST' };
  const [src, dst] = args;
  const srcPath = resolvePath(state.cwd, src);
  const node = getNode(state.fs, srcPath);
  if (node === undefined) return { err: `mv: ${src}: No such file or directory` };
  const dstPath = resolveDestination(state, srcPath, dst);
  if (dstPath === srcPath) return { err: `mv: '${src}' and '${dst}' are the same file` };
  if (isDir(node) && (dstPath + '/').startsWith(srcPath + '/')) {
    return { err: `mv: cannot move '${src}' to a subdirectory of itself` };
  }
  if (isDir(getNode(state.fs, dstPath))) {
    return { err: `mv: cannot overwrite directory '${dst}'` };
  }
  if (!setNode(state.fs, dstPath, node)) {
    return { err: `mv: cannot move '${src}' to '${dst}'` };
  }
  deleteNode(state.fs, srcPath);
  return { fs: { ...state.fs } };
}
function cmd_whoami() { return { out: 'user' }; }
function cmd_date() {
  // Date.now() and new Date() are disallowed inside workflows but fine at
  // runtime — TerminalBlock only renders client-side.
  return { out: new Date().toString() };
}
function cmd_env(_, state) {
  return { out: Object.entries(state.env).map(([k, v]) => `${k}=${v}`).join('\n') };
}
function cmd_export(args, state) {
  const out = { ...state.env };
  for (const a of args) {
    const eq = a.indexOf('=');
    if (eq < 0) continue;
    out[a.slice(0, eq)] = a.slice(eq + 1);
  }
  return { env: out };
}
function cmd_history(_, state) {
  return { out: state.history.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`).join('\n') };
}
function cmd_help() {
  return {
    out:
      'Supported commands:\n' +
      '  pwd, ls (-la), cd, cat, echo, mkdir (-p), touch, rm (-r/-f),\n' +
      '  grep PATTERN FILE, head (-n N), tail (-n N), wc (-lwc),\n' +
      '  cp, mv, whoami, date, env, export VAR=val, history, clear, help\n' +
      "\nPipes (|) and redirects (>) aren't implemented. Try `cat notes.txt` to start.",
  };
}

const COMMANDS = {
  pwd: cmd_pwd, ls: cmd_ls, cd: cmd_cd, cat: cmd_cat, echo: cmd_echo,
  mkdir: cmd_mkdir, touch: cmd_touch, rm: cmd_rm, grep: cmd_grep,
  head: cmd_head, tail: cmd_tail, wc: cmd_wc, cp: cmd_cp, mv: cmd_mv,
  whoami: cmd_whoami, date: cmd_date, env: cmd_env, export: cmd_export,
  history: cmd_history, clear: () => ({ clear: true }), help: cmd_help,
  true: () => ({}), false: () => ({ err: '', status: 1 }),
};

// ─── React component ─────────────────────────────────────────────────────
export default function TerminalBlock() {
  const [fs] = useState(() => seedFs());
  const [cwd, setCwd] = useState(HOME);
  const [env, setEnv] = useState({ HOME, USER: 'user', SHELL: '/bin/sh', PATH: '/usr/local/bin:/usr/bin:/bin' });
  const [history, setHistory] = useState([]);
  const [lines, setLines] = useState([
    { kind: 'sys', text: 'InfraLearn shell sandbox — type `help` for the supported commands.' },
  ]);
  const [input, setInput] = useState('');
  const [histIdx, setHistIdx] = useState(-1);
  const taRef = useRef(null);
  const paneRef = useRef(null);

  // Auto-scroll the history pane to the latest line.
  useEffect(() => {
    if (paneRef.current) paneRef.current.scrollTop = paneRef.current.scrollHeight;
  }, [lines]);

  const run = (raw) => {
    const trimmed = raw.replace(/^\s+|\s+$/g, '');
    const stamped = [...lines, { kind: 'cmd', text: `${PROMPT(cwd)}${trimmed}` }];
    if (!trimmed) { setLines(stamped); return; }
    const tokens = tokenize(trimmed);
    const cmdName = tokens[0];
    const args = tokens.slice(1);
    const fn = COMMANDS[cmdName];
    if (!fn) {
      setLines([...stamped, { kind: 'err', text: `${cmdName}: command not found` }]);
    } else {
      const state = { fs, cwd, env, history };
      const result = fn(args, state) || {};
      if (result.clear) { setLines([]); }
      else {
        const next = [...stamped];
        if (result.out) next.push({ kind: 'out', text: result.out });
        if (result.err) next.push({ kind: 'err', text: result.err });
        setLines(next);
      }
      if (result.cwd) setCwd(result.cwd);
      if (result.env) setEnv(result.env);
    }
    setHistory((h) => [...h, trimmed]);
    setHistIdx(-1);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      run(input);
      setInput('');
      return;
    }
    if (e.key === 'ArrowUp') {
      if (history.length === 0) return;
      e.preventDefault();
      const i = histIdx < 0 ? history.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(i);
      setInput(history[i]);
      return;
    }
    if (e.key === 'ArrowDown') {
      if (history.length === 0 || histIdx < 0) return;
      e.preventDefault();
      const i = Math.min(history.length, histIdx + 1);
      if (i >= history.length) { setHistIdx(-1); setInput(''); }
      else { setHistIdx(i); setInput(history[i]); }
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const tokens = input.split(/\s+/);
      const last = tokens[tokens.length - 1] || '';
      const node = getNode(fs, cwd);
      if (!isDir(node)) return;
      const matches = Object.keys(node).filter((n) => n.startsWith(last));
      if (matches.length === 1) {
        tokens[tokens.length - 1] = matches[0];
        setInput(tokens.join(' ') + (isDir(node[matches[0]]) ? '/' : ''));
      }
    }
  };

  return (
    <div className="terminal-block">
      <div className="terminal-block-header mono">
        <span>▣ terminal</span>
        <span className="terminal-block-cwd">{cwd}</span>
      </div>
      <div className="terminal-block-pane" ref={paneRef} onClick={() => taRef.current && taRef.current.focus()}>
        {lines.map((l, i) => (
          <pre key={i} className={`terminal-block-line terminal-block-line-${l.kind}`}>{l.text}</pre>
        ))}
        <div className="terminal-block-input-row">
          <span className="terminal-block-prompt mono">{PROMPT(cwd)}</span>
          <input
            ref={taRef}
            className="terminal-block-input mono"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            aria-label="Terminal input"
          />
        </div>
      </div>
    </div>
  );
}
