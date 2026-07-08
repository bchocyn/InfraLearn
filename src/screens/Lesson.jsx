import { Suspense, lazy, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore.js';
import { PATHS, labProgress as labProgressFromContent } from '../data/content.js';
import { loadLessonsForPath } from '../data/lessons/loader.js';
import MathQuiz from '../components/MathQuiz.jsx';
import CelebrationMoment from '../components/CelebrationMoment.jsx';
import TerminalBlock from '../components/TerminalBlock.jsx';
import AnimatedDiagram from '../components/AnimatedDiagram.jsx';
import BuildAlongBlock from '../components/BuildAlongBlock.jsx';
import { VIZ_REGISTRY } from '../components/viz/index.jsx';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts.js';

// --- Lazy CodeMirror-bearing editors ---------------------------------------
//
// PracticeBlock and LintEditor both statically import CodeEditor, which pulls
// the whole @codemirror core (the ~360 KB raw cm-core chunk). Importing them
// statically here made EVERY lesson — including prose-only ones — fetch that
// chunk at route load. React.lazy splits both behind their own async chunks,
// fetched only when a lesson actually renders a practice/lint block.
//
// CodeRunBlock's run handler also needs this module's NAMED exports
// (loadPyodide / runUserCode); React.lazy only carries the default export, so
// the handler dynamically imports them at the call site (runs are async
// anyway). A static named import would re-create the eager edge to the
// CodeMirror graph and defeat the split.
const PracticeBlock = lazy(() => import('../components/PracticeBlock.jsx'));

// LintEditor's validators (validateYaml/Sql/Dockerfile/Json) are named
// exports of the same module — importing them statically for the `validate`
// prop would defeat the chunk split too. The lazy wrapper resolves the
// validator for `kind` from the freshly loaded module and forwards it, so
// LintEditor itself receives the exact same props as before.
const LazyLintEditor = lazy(() =>
  import('../components/LintEditor.jsx').then((mod) => {
    const LintEditor = mod.default;
    const validators = {
      yaml: mod.validateYaml,
      sql: mod.validateSql,
      dockerfile: mod.validateDockerfile,
      json: mod.validateJson,
    };
    return {
      default: function LintEditorWithValidator({ kind, ...rest }) {
        return <LintEditor kind={kind} validate={validators[kind]} {...rest} />;
      },
    };
  }),
);

// Languages LintEditor can validate. Mirrors the validator map above — used
// only as the render gate in PracticeInline (the old LINT_VALIDATORS object
// needed the statically imported functions for the same truthiness check).
const LINT_KINDS = ['yaml', 'sql', 'dockerfile', 'json'];

// --- Math-quiz bank (on demand) --------------------------------------------
//
// The bank is a ~92 KB data chunk but only ~10% of lessons carry
// `hasMathQuiz`; the static import made every lesson fetch it at route load.
// It's now imported the first time a quiz pane actually opens. The promise is
// cached at module level so repeat opens never re-import.
let mathQuizzesPromise = null;
function loadMathQuizzes() {
  if (!mathQuizzesPromise) {
    mathQuizzesPromise = import('../data/mathQuizzes.js').then((m) => m.default || {});
  }
  return mathQuizzesPromise;
}

function locate(id) {
  const pathKeys = Object.keys(PATHS);
  for (let p = 0; p < pathKeys.length; p++) {
    const key = pathKeys[p];
    const lessons = PATHS[key].lessons;
    const idx = lessons.findIndex((l) => l.id === id);
    if (idx >= 0) {
      // In-path neighbours first; fall back to neighbouring path on the edges
      // so Continue at the LAST lesson advances to the next path's first
      // lesson, and Back at the FIRST lesson goes to the prior path's last.
      let next = lessons[idx + 1] || null;
      if (!next) {
        for (let q = p + 1; q < pathKeys.length; q++) {
          const nextLessons = PATHS[pathKeys[q]].lessons;
          if (nextLessons && nextLessons.length > 0) {
            next = nextLessons[0];
            break;
          }
        }
      }
      let prev = idx > 0 ? lessons[idx - 1] : null;
      if (!prev) {
        for (let q = p - 1; q >= 0; q--) {
          const prevLessons = PATHS[pathKeys[q]].lessons;
          if (prevLessons && prevLessons.length > 0) {
            prev = prevLessons[prevLessons.length - 1];
            break;
          }
        }
      }
      return {
        pathKey: key,
        path: PATHS[key],
        lesson: lessons[idx],
        next,
        prev,
        idx,
        total: lessons.length,
      };
    }
  }
  return null;
}

// --- "Analogies before equations" ----------------------------------------
// Short, vivid mental models that get planted BEFORE the dense lesson body.
// Keyed by lesson ID. If a lesson on the MLOps / ML Eng paths has an entry
// here (or the lesson explicitly opts in via `analogyTemplate: true`), the
// Lesson screen prepends a tinted analogy card above the extracted content.
//
// Voice: physical, sensory, second-person ("imagine you're..."). The goal is
// a single image the reader can keep in their head while the formal text
// names the parts.
const ANALOGIES = {
  'ml-lifecycle': {
    tagline: 'From sketch to running production model',
    body:
      'Picture building a house. You sketch on paper (data + problem framing), pour the foundation (training), walk through with inspectors (evaluation), open the doors (deploy), then patch leaks for years (monitoring). The same model never just "ships once" — you go back to the sketch every time the weather changes.',
  },
  'training-eval': {
    tagline: 'How models learn from data',
    body:
      'Imagine teaching a kid darts blindfolded. Each throw is a prediction; the coach yells "left two, down one" — that nudge is the gradient. After thousands of throws the kid hits the bullseye consistently on practice boards. The test board (validation) tells you if they actually learned aim, or just memorized that one wall.',
  },
  'ab-testing': {
    tagline: 'Did the new model actually help — or did we get lucky?',
    body:
      'Two identical lemonade stands on the same street. You give recipe A to one and recipe B to the other for a week, then count cups sold. The wider the gap and the longer the test, the more confident you are it’s the recipe and not the weather. Sample size and duration are not bureaucracy — they’re your defense against fooling yourself.',
  },
  'ml-inference-api': {
    tagline: 'Wrapping the model so anyone can ask it questions',
    body:
      'Your model is a chef who only speaks tensors. The inference API is the waiter: takes a polite JSON order, walks it back to the kitchen, brings out a dish (prediction) on a clean plate (response schema). The diner never sees the knife work — and if the chef faints, the waiter still tells them dinner will be a few minutes.',
  },
  'drift-detector': {
    tagline: 'Noticing when the world has quietly changed under your model',
    body:
      'You trained a smoke detector in a kitchen. Years pass. Someone moves it to a wood-shop. The detector still works perfectly — by its old definition of "smoke" — and screams nonstop. Drift detection is the small clipboard on the wall that says "the room around me looks different from training" before the false alarms start.',
  },
  'llm-fundamentals': {
    tagline: 'Tokens, attention, and the prediction loop',
    body:
      'An LLM is a librarian who has read everything and remembers nothing — only patterns. You hand them a half-sentence; they glance at every word at once, weigh which past ones matter (attention), and whisper the most likely next word. Then they read what they just said and whisper the next. The "intelligence" is the loop.',
  },
  'llm-rag': {
    tagline: 'Open-book LLMs that cite the page they read',
    body:
      'A brilliant amnesiac. Brilliant at reasoning, terrible at recall. RAG hands them a stack of relevant index cards (retrieved chunks) right before the question. They still do the thinking — but the facts come from the cards, not from foggy memory. That’s why bad cards = bad answers, no matter how smart the model.',
  },
  'math-linalg': {
    tagline: 'The geometry behind every neural network',
    body:
      'Vectors are arrows on a map. A matrix is a machine that grabs every arrow on the map and stretches, rotates, or shears it the same way. Neural networks are stacks of these machines — input goes in as an arrow, each layer twists the space, until in the final space "cat" and "dog" sit far apart and "kitten" sits next to "cat."',
  },
  'math-calculus': {
    tagline: 'Slope, gradient, and the dark hillside of loss',
    body:
      'You’re on a mountain at night with a phone flashlight. You can’t see the valley, only the slope under your feet. Calculus tells you which way is downhill (the gradient). Gradient descent is taking step after careful step in that direction. The whole training loop is that one move, repeated a million times in a billion-dimensional dark.',
  },
  'math-probability': {
    tagline: 'Reasoning under uncertainty',
    body:
      'Probability is a weather forecast for any question. Not "will it rain" yes/no, but "70% chance, given what I’ve seen." Models output probabilities for the same reason: the world is fuzzy, the data is partial, and confident wrong answers are far more dangerous than honest uncertainty.',
  },
  'ai-transformers': {
    tagline: 'Attention is all you really need',
    body:
      'Imagine a room of one hundred translators reading a sentence simultaneously. Each one is asked: "for word #7, which of the other 99 words matters most?" They vote (attention weights), pool what they heard, and write down a new richer version of word #7. Stack that room a few dozen times and you have a transformer.',
  },
  'ai-embeddings': {
    tagline: 'Turning words and images into coordinates',
    body:
      'Think of a huge dark room where every concept gets a glow-in-the-dark dot. "King" and "queen" land near each other; "king" minus "man" plus "woman" walks you almost exactly to "queen." Embeddings are those coordinates — once meaning is geometry, you can do search and similarity with math instead of words.',
  },
  'ai-finetuning': {
    tagline: 'Three ways to bend a general model to your task',
    body:
      'You have a brilliant new hire. Prompting is leaving sticky-notes on their desk. RAG is filling their backpack with relevant files before each meeting. Fine-tuning is sending them to a one-week internal training so the company way becomes muscle memory. Same person, three very different ways to specialize them.',
  },
  'ai-evaluation': {
    tagline: 'Measuring the thing that actually matters',
    body:
      'Accuracy is the bathroom scale — one number, easy to read, occasionally lies to you. A spam filter that calls everything "not spam" hits 99% accuracy on a quiet day. Real evaluation is more like a full physical: precision, recall, calibration, fairness. Each number catches a different way a model can quietly betray you.',
  },
  'ai-distributed-training': {
    tagline: 'Splitting one giant model across many machines',
    body:
      'Eight chefs cooking one enormous lasagna. You can give each chef a different layer (model parallel), or eight identical sub-lasagnas to assemble in parallel (data parallel), then merge. The art is keeping their kitchens in sync without anyone burning their layer waiting on another chef’s sauce.',
  },
  'lab-numpy-mlp': {
    tagline: 'Build the smallest possible brain by hand',
    body:
      'You won’t call PyTorch. You’ll write the forward pass, the loss, and the backprop yourself — with nothing but arrays and a pencil-and-paper chain rule. By the end you’ll feel where the magic lives: it’s not magic, it’s just careful bookkeeping of slopes.',
  },
  'lab-rag-pipeline': {
    tagline: 'Wire a real retrieval pipeline end-to-end',
    body:
      'Like building a small library from scratch: shelf the books (chunk + embed), put cards in a catalog (vector store), staff the front desk (retriever), and brief the resident expert (LLM) every time a visitor asks a question. By the last step you’ll know exactly where answers come from — and where they break.',
  },
  'lab-lora-finetune': {
    tagline: 'Specialize a frozen giant with tiny trainable lenses',
    body:
      'The base model is a chandelier — gorgeous, expensive, you do not touch it. LoRA bolts on tiny tinted lenses you actually can twist. The light passing through is now your light, but the chandelier is untouched and shareable. That’s how a $200 GPU can usefully fine-tune a billion-parameter model.',
  },
};

// --- CodeChip — click-to-copy wrapper for inline `code` chips --------------
//
// Cueing/signaling affordance (Cromley & Chen 2025, g=0.24). Every inline
// backtick chip rendered by renderInline() becomes a tappable button: tap to
// copy the text to the clipboard, see a brief green flash on the chip, and a
// global toast at the bottom of the viewport confirms what was copied.
//
// The toast is a singleton mounted once at the top of <Lesson>; CodeChip
// fires a window-level CustomEvent('codechip-copy') so any chip anywhere in
// the render tree can publish to the same toast without prop-drilling.
function CodeChip({ text }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  const onClick = async (e) => {
    // Stop the copy click from bubbling up to enclosing interactive
    // elements (e.g. a renderInline'd chip inside <PredictBlock>'s option
    // button) — the user tapped the chip to copy, not to commit the parent
    // affordance. Browsers will still flag button-in-button as invalid
    // markup; the practical effect is one chip per chip, no parent fire.
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    const value = String(text == null ? '' : text);
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value);
      } else if (typeof document !== 'undefined') {
        // Fallback for non-secure contexts / older browsers.
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch { /* ignore */ }
        document.body.removeChild(ta);
      }
    } catch { /* clipboard denied — still flash + toast for feedback */ }
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 900);
    if (typeof window !== 'undefined' && typeof CustomEvent === 'function') {
      window.dispatchEvent(new CustomEvent('codechip-copy', { detail: { text: value } }));
    }
  };
  return (
    <button
      type="button"
      className={`code-chip${copied ? ' is-copied' : ''}`}
      onClick={onClick}
      aria-label={`Copy code: ${text}`}
      title="Tap to copy"
    >
      {text}
    </button>
  );
}

// CodeCopyToast — singleton bottom-of-viewport confirmation. Listens for the
// window 'codechip-copy' event so it can sit anywhere in the tree and pick up
// from any chip. Auto-dismisses 1200ms after each event.
function CodeCopyToast() {
  const [state, setState] = useState({ visible: false, text: '' });
  const timerRef = useRef(null);
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onCopy = (e) => {
      const text = (e && e.detail && e.detail.text) || '';
      setState({ visible: true, text });
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setState((s) => ({ ...s, visible: false }));
      }, 1200);
    };
    window.addEventListener('codechip-copy', onCopy);
    return () => {
      window.removeEventListener('codechip-copy', onCopy);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
  if (!state.visible) return null;
  return (
    <div className="code-copy-toast mono" role="status" aria-live="polite">
      ✓ Copied: {state.text}
    </div>
  );
}

// --- Inline markup: `code`, **bold**, *italic*  ----------------------------
function renderInline(text, keyPrefix = 'i') {
  if (text == null) return null;
  const nodes = [];
  let buf = '';
  let i = 0;
  let k = 0;
  const flush = () => {
    if (buf) {
      nodes.push(buf);
      buf = '';
    }
  };
  while (i < text.length) {
    const c = text[i];
    // Inline code: `...`
    if (c === '`') {
      const end = text.indexOf('`', i + 1);
      if (end > i) {
        flush();
        nodes.push(<CodeChip key={`${keyPrefix}-c-${k++}`} text={text.slice(i + 1, end)} />);
        i = end + 1;
        continue;
      }
    }
    // Bold: **...**
    if (c === '*' && text[i + 1] === '*') {
      const end = text.indexOf('**', i + 2);
      if (end > i) {
        flush();
        nodes.push(
          <strong key={`${keyPrefix}-b-${k++}`}>
            {renderInline(text.slice(i + 2, end), `${keyPrefix}-b${k}`)}
          </strong>,
        );
        i = end + 2;
        continue;
      }
    }
    // Italic: *...*  (single-star)
    if (c === '*' && text[i + 1] !== '*' && (i === 0 || text[i - 1] !== '*')) {
      const end = text.indexOf('*', i + 1);
      if (end > i && text[end + 1] !== '*') {
        flush();
        nodes.push(<em key={`${keyPrefix}-e-${k++}`}>{text.slice(i + 1, end)}</em>);
        i = end + 1;
        continue;
      }
    }
    buf += c;
    i += 1;
  }
  flush();
  return nodes;
}

// --- Practice / sandbox detection  ----------------------------------------
//
// The v14 deploy bundle had inline Python sandboxes (textarea + Check button
// + hint accordions) that the extractor couldn't preserve. The sections that
// USED to host those widgets ended up in lessonContent.js as headings with
// an empty `body: []`. A section is a "sandbox marker" if its body is empty
// AND its heading looks like a prompt/check/hint label; buildGroups() drops
// those markers entirely (labs host the practice now, not lessons).

// Headings that, when paired with an empty body, mean "the widget was here".
const SANDBOX_HEADING_RE =
  /^(your turn|try it|practice\b|tinker|explore|quick check|check|run|compute it|fix the bug|debug it|trace it|predict|what'?s allowed|make a typo work|show hint|show solution|hint|build a sentence|build a shopping list|build it|clean user input|format it|get the middle( three| one)?|safe read|find the max|read the dict|age check|grade calculator|login check|print each color|sum of 1 to 10|find a number|write greet\(\)|write square\(\)|final check)/i;

function isEmptyBody(body) {
  return !Array.isArray(body) || body.length === 0;
}

function isSandboxMarker(sec) {
  if (!sec || !sec.heading) return false;
  return isEmptyBody(sec.body) && SANDBOX_HEADING_RE.test(sec.heading.trim());
}

// Build the render groups. Lessons are READING-FIRST: prose + code examples
// + concept diagrams. Empty-body marker sections from the v14 → v15 extraction
// ("Practice — safe divide", "Check") used to inflate into in-browser Python
// sandboxes; that paradigm is gone — labs now host the practice, not lessons.
// Markers are filtered out so they don't render as orphan headings either.
function buildGroups(sections) {
  const groups = [];
  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];
    if (isSandboxMarker(sec)) continue; // drop empty practice markers entirely
    groups.push({ kind: 'section', section: sec, idx: i });
  }
  return groups;
}

// RevealBlock — tap-to-reveal answer pattern.
//
// Schema:
//   { type: 'reveal',
//     question: string,    // stays visible at the top
//     answer: string }     // hidden behind a "Tap to reveal answer" button
//
// Cueing/signaling affordance (Cromley & Chen 2025, g=0.24) — NOT primary
// learning, just an ergonomic affordance for self-testing patterns the prose
// already covered. The button is full-width (44px touch target) with a dashed
// border + mono uppercase label; on tap it hides itself and slides the answer
// in below with an amber left rule.
function RevealBlock({ block, idx }) {
  const [revealed, setRevealed] = useState(false);
  const question = block.question || '';
  const answer = block.answer || '';
  if (!question || !answer) return null;
  return (
    <div className="reveal" data-revealed={revealed ? 'yes' : undefined}>
      <div className="reveal-q">{renderInline(question, `rq-${idx}`)}</div>
      {!revealed ? (
        <button
          type="button"
          className="reveal-btn mono"
          onClick={() => setRevealed(true)}
          aria-label="Tap to reveal answer"
        >
          TAP TO REVEAL ANSWER
        </button>
      ) : (
        <div className="reveal-answer">{renderInline(answer, `ra-${idx}`)}</div>
      )}
    </div>
  );
}

// --- Block renderer  ------------------------------------------------------
function Block({ block, idx, lessonId }) {
  if (!block || !block.type) return null;
  switch (block.type) {
    case 'p':
      return <p>{renderInline(block.text, `p${idx}`)}</p>;
    case 'h3':
      return <h3>{renderInline(block.text, `h${idx}`)}</h3>;
    case 'h4':
      return <h4>{renderInline(block.text, `h4${idx}`)}</h4>;
    case 'code':
      // Extension: optional `runnable` field turns the static code block into
      // a tap-to-execute REPL. CodeRunBlock handles both rendering modes so we
      // don't fork two paths through the parent switch.
      return <CodeRunBlock block={block} idx={idx} />;
    case 'ul':
      return (
        <ul>
          {(block.items || []).map((it, j) => (
            <li key={j}>{renderInline(it, `u${idx}-${j}`)}</li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol>
          {(block.items || []).map((it, j) => (
            <li key={j}>{renderInline(it, `o${idx}-${j}`)}</li>
          ))}
        </ol>
      );
    case 'diagram':
      return (
        <AnimatedDiagram
          nodes={block.nodes}
          edges={block.edges}
          rows={block.rows}
          title={block.title}
          caption={block.caption}
          height={block.height}
        />
      );
    case 'pros-cons': {
      // GOOD FOR / WATCH OUT FOR (or any two-column callout pair). Pattern:
      // { type: 'pros-cons', good: ['...'], watch: ['...'],
      //   goodLabel?: 'GOOD FOR', watchLabel?: 'WATCH OUT FOR' }
      const goodLabel = block.goodLabel || 'GOOD FOR';
      const watchLabel = block.watchLabel || 'WATCH OUT FOR';
      return (
        <div className="pros-cons">
          <div className="pros-cons-col pros-cons-good">
            <div className="pros-cons-kicker">{goodLabel}</div>
            <ul>
              {(block.good || []).map((it, j) => (
                <li key={`g-${j}`}>{renderInline(it, `pcg${idx}-${j}`)}</li>
              ))}
            </ul>
          </div>
          <div className="pros-cons-col pros-cons-watch">
            <div className="pros-cons-kicker">{watchLabel}</div>
            <ul>
              {(block.watch || []).map((it, j) => (
                <li key={`w-${j}`}>{renderInline(it, `pcw${idx}-${j}`)}</li>
              ))}
            </ul>
          </div>
        </div>
      );
    }
    case 'quote':
      return (
        <blockquote className="callout-quote">
          {renderInline(block.text, `q${idx}`)}
          {block.cite && <cite>— {block.cite}</cite>}
        </blockquote>
      );
    case 'terms':
      // Term-definition list. Pattern:
      // { type: 'terms', items: [{ term: '...', def: '...' }, ...] }
      return (
        <dl className="term-list">
          {(block.items || []).map((it, j) => (
            <div key={j} className="term-row">
              <dt>{renderInline(it.term, `tt${idx}-${j}`)}</dt>
              <dd>{renderInline(it.def, `td${idx}-${j}`)}</dd>
            </div>
          ))}
        </dl>
      );
    case 'table': {
      // Pattern:
      //   { type: 'table',
      //     headers: ['Example', 'Valid?', 'Note'],
      //     rows:    [['name', '✓', 'starts with letter'], ...],
      //     align?:  ['left', 'center', 'left'] }
      // Cells go through renderInline so `code` and **bold** still work.
      // ✓ / ✗ tokens auto-color (earth / fire) without per-cell config.
      const headers = block.headers || [];
      const rows = block.rows || [];
      const align = block.align || [];
      const cellClass = (cell) => {
        const s = String(cell).trim();
        if (s === '✓' || s === '✔' || s === 'yes') return 'cell-good';
        if (s === '✗' || s === '✘' || s === '×' || s === 'no') return 'cell-bad';
        return null;
      };
      return (
        <div className="data-table-wrap">
          <table className="data-table">
            {headers.length > 0 && (
              <thead>
                <tr>
                  {headers.map((h, j) => (
                    <th key={j} style={align[j] ? { textAlign: align[j] } : undefined}>
                      {renderInline(h, `th${idx}-${j}`)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri}>
                  {/* Guard malformed data: a non-array row must not crash the
                      whole app to the root ErrorBoundary. */}
                  {(Array.isArray(row) ? row : [row]).map((cell, ci) => {
                    const cc = cellClass(cell);
                    return (
                      <td
                        key={ci}
                        className={cc || undefined}
                        style={align[ci] ? { textAlign: align[ci] } : undefined}
                      >
                        {renderInline(String(cell), `td${idx}-${ri}-${ci}`)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case 'kanban':
      return <KanbanBlock block={block} idx={idx} />;
    case 'walkthrough':
      return <WalkthroughBlock block={block} />;
    case 'build-along':
      return <BuildAlongBlock block={block} />;
    case 'sequence':
      return <SequenceBlock block={block} />;
    case 'compare':
      return <CompareBlock block={block} idx={idx} />;
    case 'layers':
      return <LayersBlock block={block} />;
    case 'practice':
      return <PracticeInline block={block} lessonId={lessonId} />;
    case 'predict':
      return <PredictBlock block={block} idx={idx} />;
    case 'explain-back':
      return <ExplainBackBlock block={block} idx={idx} />;
    case 'fix-it':
      return <FixItBlock block={block} idx={idx} />;
    case 'fill-blank':
      return <FillBlankBlock block={block} idx={idx} />;
    case 'reveal':
      return <RevealBlock block={block} idx={idx} />;
    case 'system-design-lab':
      return <SystemDesignLab block={block} idx={idx} lessonId={lessonId} />;
    case 'interactive-viz':
      return <InteractiveVizBlock block={block} idx={idx} />;
    default:
      return null;
  }
}

// InteractiveVizBlock — MLU-Explain-style learner-manipulable visualization.
//
// Schema:
//   { type: 'interactive-viz',
//     viz:     'big-o-race' | 'cache-eviction' | 'fsrs-curve',
//     title?:  'Big-O at scale',
//     caption?:'Drag N. Watch the curves separate.' }
//
// Looks up the actual viz component in VIZ_REGISTRY (src/components/viz/
// index.jsx) so lesson content stays declarative — no per-viz import in
// this file. Renders an optional headline, the viz, an optional caption,
// and a small "tap to try" hint that vanishes once the learner interacts
// (we listen for pointerdown / keydown anywhere inside the viz wrapper).
function InteractiveVizBlock({ block }) {
  const VizComponent = VIZ_REGISTRY[block.viz];
  const [interacted, setInteracted] = useState(false);
  // One callback wired to both pointer + keyboard so touch, mouse, and
  // keyboard-only users all dismiss the hint identically.
  const onFirstInteract = () => {
    if (!interacted) setInteracted(true);
  };
  if (!VizComponent) {
    // Unknown viz name — fail loud but contained so the rest of the lesson
    // still renders. This is the same pattern other block types use for
    // missing data.
    return (
      <div className="viz-block viz-block-missing">
        <div className="viz-missing-kicker">UNKNOWN VIZ</div>
        <div className="viz-missing-name">{String(block.viz)}</div>
      </div>
    );
  }
  return (
    <div
      className="viz-block"
      onPointerDown={onFirstInteract}
      onKeyDown={onFirstInteract}
    >
      {block.title && <div className="viz-block-title">{block.title}</div>}
      <div className="viz-block-body">
        <VizComponent />
      </div>
      {block.caption && (
        <div className="viz-block-caption">{block.caption}</div>
      )}
      {!interacted && (
        <div className="viz-block-hint" aria-hidden="true">
          <span className="viz-block-hint-emoji">💡</span> Tap to try
        </div>
      )}
    </div>
  );
}

// SystemDesignLab — multi-phase orchestration block.
//
// Schema:
//   { type: 'system-design-lab',
//     id?: string,                       // stable lab id — falls back to lessonId
//     title: string,                     // e.g. "Design a URL shortener"
//     scenario: string,                  // 2-4 sentence problem framing
//     estimatedMin?: number,             // pill in the header
//     phases: [{
//       kind: 'requirements' | 'estimation' | 'api' | 'data-model'
//           | 'scaling' | 'pitfalls' | 'observability' | 'build',
//           // 'build' = the "Ship it for real" capstone phase (project-based learning)
//       title: string,                   // e.g. "Phase 1: Requirements"
//       prompt: string,                  // shown above the phase blocks
//       blocks: Block[],                 // predict / explain-back / fill-blank / fix-it
//       reference: string,               // canonical answer revealed on demand
//     }],
//     reflection?: string,               // textarea label; defaults to a generic prompt
//   }
//
// The block deliberately doesn't author its OWN interactions — every per-phase
// recall lives in standard block instances we hand off to <Block> recursively.
// That keeps the XP / combo wiring identical to a plain lesson and means new
// block types light up here automatically.
function SystemDesignLab({ block, idx, lessonId }) {
  const labId = (typeof block.id === 'string' && block.id.length > 0)
    ? block.id
    : (lessonId || `sd-${idx}`);

  const phases = Array.isArray(block.phases) ? block.phases : [];
  const phaseCount = phases.length;

  const labProgress = useStore((s) => s.labProgress);
  const markPhaseComplete = useStore((s) => s.markPhaseComplete);
  const setLabReflection = useStore((s) => s.setLabReflection);
  const completeLab = useStore((s) => s.completeLab);

  const entry = labProgress?.[labId] || {
    phasesCompleted: [],
    reflection: '',
    completedAt: null,
  };

  // Normalise the stored boolean array to the authored phase count so a lab
  // whose phase count changed across edits still renders coherent dots.
  const completedArr = (() => {
    const a = Array.isArray(entry.phasesCompleted) ? entry.phasesCompleted.slice(0, phaseCount) : [];
    while (a.length < phaseCount) a.push(false);
    return a;
  })();

  // First incomplete phase index — drives the auto-open behavior. -1 means
  // every phase is done; the reflection card is the focal element instead.
  const firstIncomplete = completedArr.findIndex((v) => !v);

  // Which phase is OPEN. Defaults to firstIncomplete on first render; user can
  // freely re-open any phase via the chevron. Tracked locally — not persisted
  // (a learner's "which card is open" doesn't survive a refresh — and that's
  // fine; cognitive context resets at session boundaries anyway).
  const [openIdx, setOpenIdx] = useState(firstIncomplete >= 0 ? firstIncomplete : 0);
  // Per-phase reference-reveal state. Local because the reveal is a one-way
  // act inside the current session; it should re-prompt on revisit so the
  // learner can re-test themselves later.
  const [revealed, setRevealed] = useState({}); // { [phaseIndex]: true }
  // Local reflection draft — synced to the store on blur/complete so we
  // don't thrash persisted state on every keystroke.
  const [reflectionDraft, setReflectionDraft] = useState(entry.reflection || '');

  const isLabDone = !!entry.completedAt;
  const allPhasesDone = phaseCount > 0 && completedArr.every(Boolean);

  if (!block.title || phaseCount === 0) return null;

  const togglePhase = (i) => {
    setOpenIdx((cur) => (cur === i ? -1 : i));
  };

  const reveal = (i) => {
    setRevealed((r) => (r[i] ? r : { ...r, [i]: true }));
  };

  const onMarkPhase = (i) => {
    if (completedArr[i]) return;
    markPhaseComplete(labId, i);
    // Auto-advance: collapse the just-finished card and open the next
    // incomplete one. If this was the last one, close everything so the
    // reflection card becomes the visual focal point.
    const nextIncomplete = (() => {
      for (let j = i + 1; j < phaseCount; j++) if (!completedArr[j]) return j;
      // wrap to earlier missed phases
      for (let j = 0; j < i; j++) if (!completedArr[j]) return j;
      return -1;
    })();
    setOpenIdx(nextIncomplete);
  };

  const onCompleteLab = () => {
    if (isLabDone) return;
    if (!allPhasesDone) return;
    // Flush any in-flight reflection draft before stamping completion so the
    // final stored entry carries the learner's text.
    if (reflectionDraft !== entry.reflection) {
      setLabReflection(labId, reflectionDraft);
    }
    completeLab(labId);
  };

  const onReflectionBlur = () => {
    if (reflectionDraft !== entry.reflection) {
      setLabReflection(labId, reflectionDraft);
    }
  };

  const completedCount = completedArr.filter(Boolean).length;

  return (
    <section
      className="sd-lab"
      data-done={isLabDone ? 'yes' : undefined}
      aria-label={`System design lab: ${block.title}`}
    >
      <header className="sd-lab-header">
        <h2 className="sd-lab-title">{block.title}</h2>
        <p className="sd-lab-scenario">{renderInline(block.scenario || '', `sds-${idx}`)}</p>
        <div className="sd-lab-meta">
          {Number.isFinite(block.estimatedMin) && (
            <span className="sd-lab-pill mono">~{block.estimatedMin} MIN</span>
          )}
          <span className="sd-lab-pill mono sd-lab-pill-phases">
            {completedCount}/{phaseCount} PHASES
          </span>
          {isLabDone && <span className="sd-lab-pill mono sd-lab-pill-done">✓ COMPLETE</span>}
        </div>
        <ol className="sd-phase-dots" aria-label="Phase progress">
          {phases.map((p, i) => {
            const cls = ['sd-phase-dot'];
            if (completedArr[i]) cls.push('is-done');
            if (openIdx === i) cls.push('is-open');
            return (
              <li
                key={`dot-${i}`}
                className={cls.join(' ')}
                aria-label={`Phase ${i + 1}${completedArr[i] ? ' (done)' : ''}`}
                aria-current={openIdx === i ? 'step' : undefined}
              >
                <button
                  type="button"
                  className="sd-phase-dot-btn"
                  onClick={() => togglePhase(i)}
                  aria-label={`Open phase ${i + 1}: ${p.title || ''}`}
                >
                  <span className="sd-phase-dot-num mono">{i + 1}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </header>

      <div className="sd-phase-list">
        {phases.map((phase, i) => {
          const isOpen = openIdx === i;
          const isDone = !!completedArr[i];
          const phaseBlocks = Array.isArray(phase.blocks) ? phase.blocks : [];
          const kindLabel = (phase.kind || 'phase').toUpperCase().replace(/-/g, ' ');
          return (
            <article
              key={`ph-${i}`}
              className={`sd-phase-card${isOpen ? ' is-open' : ''}${isDone ? ' is-done' : ''}`}
              data-kind={phase.kind || 'phase'}
            >
              <button
                type="button"
                className="sd-phase-head"
                onClick={() => togglePhase(i)}
                aria-expanded={isOpen}
                aria-controls={`sd-phase-body-${idx}-${i}`}
              >
                <span className="sd-phase-kicker mono">
                  {isDone ? '✓ DONE' : kindLabel}
                </span>
                <span className="sd-phase-title">{phase.title || `Phase ${i + 1}`}</span>
                <span className="sd-phase-chev" aria-hidden="true">
                  {isOpen ? '▾' : '▸'}
                </span>
              </button>

              {isOpen && (
                <div
                  id={`sd-phase-body-${idx}-${i}`}
                  className="sd-phase-body"
                >
                  {phase.prompt && (
                    <p className="sd-phase-prompt">
                      {renderInline(phase.prompt, `sdpr-${idx}-${i}`)}
                    </p>
                  )}

                  <div className="sd-phase-blocks">
                    {phaseBlocks.map((sub, j) => (
                      <Block
                        key={`sdb-${idx}-${i}-${j}`}
                        block={sub}
                        idx={j}
                        lessonId={lessonId}
                      />
                    ))}
                  </div>

                  <div className="sd-phase-reference">
                    {!revealed[i] ? (
                      <button
                        type="button"
                        className="sd-phase-reveal-btn mono"
                        onClick={() => reveal(i)}
                      >
                        SHOW REFERENCE SOLUTION
                      </button>
                    ) : (
                      <div className="sd-phase-reference-box">
                        <div className="sd-phase-reference-kicker mono">REFERENCE</div>
                        <div className="sd-phase-reference-text mono">
                          {phase.reference || '(No reference solution provided.)'}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="sd-phase-actions">
                    {isDone ? (
                      <span className="sd-phase-done-chip mono">✓ PHASE COMPLETE</span>
                    ) : (
                      <button
                        type="button"
                        className="sd-phase-complete-btn"
                        onClick={() => onMarkPhase(i)}
                      >
                        Mark phase complete →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className="sd-lab-reflection">
        <label className="sd-lab-reflection-label mono" htmlFor={`sd-reflect-${idx}`}>
          REFLECTION
        </label>
        <p className="sd-lab-reflection-prompt">
          {block.reflection || 'Type 1-2 sentences: what surprised you about this design?'}
        </p>
        <textarea
          id={`sd-reflect-${idx}`}
          className="sd-lab-reflection-textarea"
          value={reflectionDraft}
          onChange={(e) => setReflectionDraft(e.target.value.slice(0, 2000))}
          onBlur={onReflectionBlur}
          rows={3}
          placeholder="One thing that surprised me…"
          disabled={isLabDone}
        />
      </div>

      <div className="sd-lab-footer">
        {isLabDone ? (
          <span className="sd-lab-done-chip mono">✓ LAB COMPLETE · +100 XP AWARDED</span>
        ) : (
          <button
            type="button"
            className="sd-lab-complete-btn"
            onClick={onCompleteLab}
            disabled={!allPhasesDone}
            aria-disabled={!allPhasesDone}
          >
            {allPhasesDone
              ? 'Complete lab · +100 XP'
              : `Finish all ${phaseCount} phases to complete the lab`}
          </button>
        )}
      </div>
    </section>
  );
}

// CodeRunBlock — the existing `code` block + optional inline runtime.
//
// Schema:
//   { type: 'code', text: string, lang?: 'python' | 'bash' | 'js' | 'sql' | 'yaml',
//     runnable?: boolean | 'python' | 'bash' }
//
// When `runnable` is truthy, an absolute-positioned "▶ RUN" pill renders in the
// top-right of the pre. Tap → 350ms "⏳ RUNNING" state → result panel slides in
// underneath. Python runs through the real Pyodide runtime (shared with
// PracticeBlock); other langs fall back to a stub output line until proper
// runtimes are wired (will hand off to TerminalBlock / LintEditor later).
function CodeRunBlock({ block }) {
  const text = block.text || '';
  const runMode = block.runnable === true ? (block.lang || 'python') : block.runnable;
  const isRunnable = !!runMode;

  const [phase, setPhase] = useState('idle'); // 'idle' | 'running' | 'done' | 'error'
  const [output, setOutput] = useState('');
  const [errMsg, setErrMsg] = useState('');

  if (!isRunnable) {
    return (
      <pre>
        <code>{text}</code>
      </pre>
    );
  }

  const onRun = async () => {
    if (phase === 'running') return;
    setPhase('running');
    setOutput('');
    setErrMsg('');
    // Brief visible "running" state — same 350ms delay the mockup uses so the
    // pill flash always reads, even on instant runs.
    const delay = new Promise((r) => setTimeout(r, 350));
    try {
      if (runMode === 'python' || runMode === true) {
        // Named exports of the (lazy) PracticeBlock module — imported here at
        // the call site instead of statically so the CodeMirror-bearing chunk
        // only loads when someone actually taps RUN. Same chunk as the lazy
        // component above, so a lesson that already mounted a PracticeBlock
        // resolves this instantly from the module cache.
        const { loadPyodide, runUserCode } = await import('../components/PracticeBlock.jsx');
        const pyodide = await loadPyodide();
        const { stdout, value } = await runUserCode(pyodide, text, '__none__');
        await delay;
        const out = (stdout || '').replace(/\s+$/, '');
        setOutput(out || (value !== undefined ? String(value) : '(no output)'));
        setPhase('done');
      } else {
        // Stub: until bash/js/sql runtimes are wired, surface a clear placeholder
        // so authors know the block rendered and can swap in a real runtime.
        await delay;
        setOutput(`(${runMode} runtime not wired yet — output stub)`);
        setPhase('done');
      }
    } catch (e) {
      await delay.catch(() => {});
      setErrMsg(e && e.message ? e.message : String(e));
      setPhase('error');
    }
  };

  const pillLabel = phase === 'running' ? '⏳ RUNNING' : '▶ RUN';

  return (
    <div className="code-run-wrap">
      <pre className="code-run-pre">
        <code>{text}</code>
        <button
          type="button"
          className="run-pill mono"
          onClick={onRun}
          disabled={phase === 'running'}
          aria-label="Run this snippet"
          aria-busy={phase === 'running'}
        >
          {pillLabel}
        </button>
      </pre>
      {(phase === 'done' || phase === 'error') && (
        <div className={`run-output${phase === 'error' ? ' run-output-error' : ''}`}>
          <div className="run-output-kicker mono">
            {phase === 'error' ? '✗ ERROR' : '▼ OUTPUT'}
          </div>
          <pre className="run-output-body">{phase === 'error' ? errMsg : output}</pre>
        </div>
      )}
    </div>
  );
}

// FixItBlock — debug-intuition tap target.
//
// Schema:
//   { type: 'fix-it',
//     prompt: string,
//     code: string,           // multi-line, with `bug` appearing literally inside
//     bug: string,            // exact substring to highlight + tap
//     fix: string,            // replacement string
//     lang?: string,          // styling hint only (mono either way)
//     explain: string }       // REQUIRED — 1-2 sentences on WHY it was a bug
//
// One-shot: first tap locks the block. The bug span gets a red dashed underline
// + faint red wash; on tap it pulse-animates into the fix in green, the +10 XP
// chip flies in, and the explain text reveals below. Status flips from
// "1 bug remaining" → "✓ fixed · +10 XP".
function FixItBlock({ block, idx }) {
  const addXp = useStore((s) => s.addXp);
  const practicePass = useStore((s) => s.practicePass);
  const [fixed, setFixed] = useState(false);
  const prompt = block.prompt || '';
  const code = block.code || '';
  const bug = block.bug || '';
  const fix = block.fix || '';
  const explain = block.explain || '';
  if (!code || !bug || !fix || !explain) return null;

  // Split the code on the first occurrence of `bug`. We don't try to handle
  // multiple occurrences — authors with multi-bug needs should ship two
  // separate fix-it blocks (Cognitive load: one tap target, one outcome).
  const cut = code.indexOf(bug);
  if (cut < 0) return null;
  const before = code.slice(0, cut);
  const after = code.slice(cut + bug.length);

  const onTap = () => {
    if (fixed) return;
    setFixed(true);
    addXp?.(10, 'fix-it:fix');
    // Combo bookkeeping — landing the fix is the "tested item" anchor.
    practicePass?.();
  };

  return (
    <div className="fixit-block" data-fixed={fixed ? 'yes' : undefined}>
      <div className="fixit-kicker mono">TAP THE BUG</div>
      <div className="fixit-prompt">{renderInline(prompt, `fp-${idx}`)}</div>
      <pre className="fixit-code">
        <code>
          {before}
          <span
            className={`bug${fixed ? ' is-fixed' : ''}`}
            role="button"
            tabIndex={fixed ? -1 : 0}
            onClick={onTap}
            onKeyDown={(e) => {
              if (!fixed && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onTap();
              }
            }}
            aria-label={fixed ? 'fixed' : `bug — tap to fix: ${bug}`}
          >
            {fixed ? fix : bug}
          </span>
          {after}
        </code>
      </pre>
      <div className="fixit-status mono">
        {fixed ? (
          <>
            <span className="fixit-status-ok">✓ FIXED</span>
            <span className="fixit-xp-chip mono">+10 XP</span>
          </>
        ) : (
          '1 BUG REMAINING · TAP THE HIGHLIGHTED REGION'
        )}
      </div>
      {fixed && (
        <div className="fixit-explain">{renderInline(explain, `fe-${idx}`)}</div>
      )}
    </div>
  );
}

// FillBlankBlock — mobile-friendly active recall via tap-not-type.
//
// Schema:
//   { type: 'fill-blank',
//     prompt: string,
//     code: string,                              // contains ___1___, ___2___…
//     blanks: [{ id: number, correct: string }], // matches the placeholders
//     options: string[],                         // shuffled pool incl. distractors
//     explain: string }                          // REQUIRED
//
// Flow: tap an option → tap a slot. Correct = green + locked + chip dimmed.
// Wrong = red flash, slot reverts, option stays available. The interaction
// uses a single shared "active chip" state so there's never ambiguity about
// what the next slot tap will do. When all blanks are filled the explain text
// reveals and +15 XP is awarded once.
function FillBlankBlock({ block, idx }) {
  const addXp = useStore((s) => s.addXp);
  const practicePass = useStore((s) => s.practicePass);
  const code = block.code || '';
  const blanks = Array.isArray(block.blanks) ? block.blanks : [];
  const options = Array.isArray(block.options) ? block.options : [];
  const prompt = block.prompt || '';
  const explain = block.explain || '';

  // Stable option pool with per-render index keys (we don't reshuffle every
  // render — would feel jittery; authors ship them pre-shuffled).
  const [filled, setFilled] = useState({}); // { [blankId]: { value, optionIdx } }
  const [usedOptions, setUsedOptions] = useState({}); // { [optionIdx]: true }
  const [activeOpt, setActiveOpt] = useState(null); // optionIdx | null
  const [flashSlot, setFlashSlot] = useState(null); // blankId temporarily flashed red
  const [xpAwarded, setXpAwarded] = useState(false);

  const hasContent = !!code && blanks.length > 0 && options.length > 0 && !!explain;
  const allFilled = hasContent && blanks.every((b) => filled[b.id]);

  // Award XP exactly once when all blanks land — in an effect so we don't
  // setState during render (the previous setTimeout-in-render variant tripped
  // React's purity rule and could re-fire across renders).
  useEffect(() => {
    if (allFilled && !xpAwarded) {
      setXpAwarded(true);
      addXp?.(15, 'fill-blank:complete');
      practicePass?.();
    }
  }, [allFilled, xpAwarded, addXp, practicePass]);

  if (!hasContent) return null;

  const onOptionTap = (optionIdx) => {
    if (usedOptions[optionIdx]) return;
    setActiveOpt(optionIdx === activeOpt ? null : optionIdx);
  };

  const onSlotTap = (blankId) => {
    if (filled[blankId]) return;
    if (activeOpt == null) {
      // No option selected → flash slot to nudge the user toward the strip.
      setFlashSlot(blankId);
      setTimeout(() => setFlashSlot((s) => (s === blankId ? null : s)), 220);
      return;
    }
    const blank = blanks.find((b) => b.id === blankId);
    const val = options[activeOpt];
    if (!blank) return;
    if (val === blank.correct) {
      setFilled((f) => ({ ...f, [blankId]: { value: val, optionIdx: activeOpt } }));
      setUsedOptions((u) => ({ ...u, [activeOpt]: true }));
      setActiveOpt(null);
    } else {
      // Wrong → red flash on slot, option stays available, no penalty.
      setFlashSlot(blankId);
      setTimeout(() => setFlashSlot((s) => (s === blankId ? null : s)), 420);
    }
  };

  // Tokenize the code on ___N___ placeholders so each blank lands inline
  // wherever the author put it. Anything outside placeholders renders verbatim.
  const tokenRe = /___(\d+)___/g;
  const tokens = [];
  let last = 0;
  let m;
  while ((m = tokenRe.exec(code)) != null) {
    if (m.index > last) tokens.push({ kind: 'text', text: code.slice(last, m.index) });
    tokens.push({ kind: 'slot', id: Number(m[1]) });
    last = m.index + m[0].length;
  }
  if (last < code.length) tokens.push({ kind: 'text', text: code.slice(last) });

  const remaining = blanks.length - Object.keys(filled).length;

  return (
    <div className="fill-blank-block" data-done={allFilled ? 'yes' : undefined}>
      <div className="fill-blank-kicker mono">TAP TO FILL · {blanks.length} BLANK{blanks.length > 1 ? 'S' : ''}</div>
      {prompt && (
        <div className="fill-blank-prompt">{renderInline(prompt, `fbp-${idx}`)}</div>
      )}
      <pre className="fill-blank-code">
        <code>
          {tokens.map((tok, i) => {
            if (tok.kind === 'text') return <span key={`t-${i}`}>{tok.text}</span>;
            const slot = filled[tok.id];
            const isFlashing = flashSlot === tok.id;
            const cls = ['blank-slot'];
            if (slot) cls.push('is-filled');
            if (isFlashing) cls.push(slot ? 'is-selected' : 'is-wrong');
            return (
              <span
                key={`s-${i}-${tok.id}`}
                className={cls.join(' ')}
                role="button"
                tabIndex={slot ? -1 : 0}
                onClick={() => onSlotTap(tok.id)}
                onKeyDown={(e) => {
                  if (!slot && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onSlotTap(tok.id);
                  }
                }}
                aria-label={slot ? `filled with ${slot.value}` : `blank ${tok.id}`}
              >
                {slot ? slot.value : '___'}
              </span>
            );
          })}
        </code>
      </pre>
      <div className="fill-blank-options">
        {options.map((opt, i) => {
          const cls = ['blank-chip', 'mono'];
          if (usedOptions[i]) cls.push('is-used');
          if (activeOpt === i) cls.push('is-active');
          return (
            <button
              key={`opt-${i}`}
              type="button"
              className={cls.join(' ')}
              onClick={() => onOptionTap(i)}
              disabled={!!usedOptions[i]}
              aria-pressed={activeOpt === i}
            >
              {opt}
            </button>
          );
        })}
      </div>
      <div className="fill-blank-status mono">
        {allFilled ? (
          <>
            <span className="fill-blank-status-ok">✓ ALL BLANKS FILLED</span>
            <span className="fill-blank-xp-chip mono">+15 XP</span>
          </>
        ) : (
          `${remaining} BLANK${remaining > 1 ? 'S' : ''} REMAINING · TAP A TOKEN, THEN A SLOT`
        )}
      </div>
      {allFilled && (
        <div className="fill-blank-explain">{renderInline(explain, `fbe-${idx}`)}</div>
      )}
    </div>
  );
}

// PredictBlock — testing-effect MCQ with mandatory feedback.
//
// Schema:
//   { type: 'predict',
//     prompt: string,                  // supports inline backticks via renderInline
//     options: string[],               // 3-4 stacked option buttons
//     answer: number,                  // 0-based index of the correct option
//     explain: string }                // REQUIRED — drives g 0.39 → 0.73 (Adesope 2017)
//
// One-shot: first tap locks the block. Right answer flashes green, wrong
// highlights the user's pick red AND the correct in green. The `explain`
// panel fades in (250ms) below the options either way. +5 XP only on a
// CORRECT first tap ('predict:correct' is combo-eligible in the store);
// wrong picks award nothing — they just break the combo via practiceMiss().
function PredictBlock({ block, idx }) {
  const addXp = useStore((s) => s.addXp);
  const practicePass = useStore((s) => s.practicePass);
  const practiceMiss = useStore((s) => s.practiceMiss);
  const [picked, setPicked] = useState(null);
  const prompt = block.prompt || '';
  const options = Array.isArray(block.options) ? block.options.slice(0, 4) : [];
  const answer = Number.isInteger(block.answer) ? block.answer : -1;
  if (options.length < 2 || answer < 0 || answer >= options.length) return null;

  const submitted = picked != null;
  const correct = submitted && picked === answer;

  const onPick = (i) => {
    if (submitted) return;
    setPicked(i);
    const right = i === answer;
    // XP only on a CORRECT pick. The store's combo matcher treats any
    // `predict:`-prefixed reason as a tested-item pass, so awarding +5 on a
    // wrong pick would combo-multiply misses. Wrong picks earn nothing —
    // they just break the chain via practiceMiss().
    if (right) {
      addXp?.(5, 'predict:correct');
      // Combo bookkeeping — without this the multiplier inside addXp never
      // engages (the counter stays at 0 and `predict:correct` scales 1x).
      practicePass?.();
    } else {
      practiceMiss?.();
    }
  };

  return (
    <div className="predict-block" data-correct={submitted ? (correct ? 'yes' : 'no') : undefined}>
      <div className="predict-kicker mono">TRY IT · PREDICT</div>
      <div className="predict-prompt">{renderInline(prompt, `pred-${idx}`)}</div>
      <div className="predict-options">
        {options.map((opt, i) => {
          let cls = 'predict-option';
          if (submitted) {
            if (i === answer) cls += ' is-correct';
            else if (i === picked) cls += ' is-wrong';
            else cls += ' is-dim';
          }
          return (
            <button
              key={`po-${idx}-${i}`}
              type="button"
              className={cls}
              onClick={() => onPick(i)}
              disabled={submitted}
              aria-pressed={picked === i}
            >
              <span className="predict-option-marker" aria-hidden="true">
                {submitted && i === answer ? '✓' : submitted && i === picked ? '✗' : String.fromCharCode(65 + i)}
              </span>
              <span className="predict-option-text">{renderInline(opt, `po-${idx}-${i}`)}</span>
            </button>
          );
        })}
      </div>
      {submitted && (
        <div className="predict-feedback">
          <div className="predict-feedback-row">
            <span className={`predict-feedback-badge ${correct ? 'is-correct' : 'is-wrong'}`}>
              {correct ? '✓ NAILED IT' : '✗ NOT QUITE'}
            </span>
            {correct && <span className="predict-xp-chip mono">+5 XP</span>}
          </div>
          <div className="predict-explain">{renderInline(block.explain || '', `pe-${idx}`)}</div>
        </div>
      )}
    </div>
  );
}

// ExplainBackBlock — self-explanation depth check.
//
// Schema:
//   { type: 'explain-back',
//     prompt: string,                  // e.g. "In your own words: why is list.pop(0) O(n)?"
//     modelAnswer: string,             // REQUIRED — shown after the user reveals
//     hint?: string }                  // OPTIONAL — 1-line nudge
//
// Flow:
//   1. Prompt + textarea + [Show model answer] (+ [Hint] if provided).
//   2. After reveal: user's answer on the left, model on the right (stacked
//      on mobile). Two self-grade buttons.
//   3. Self-grade locks the block, reveals the feedback note, and awards XP:
//      ✓ Close enough → +12 XP, ✗ Need to revisit → +3 XP for honesty.
//      Honesty XP is the load-bearing detail — without it ADHD readers
//      silently rubber-stamp every answer ("yeah close enough"). The
//      revisit option is incentivized just enough to be picked.
// DeepSection — collapsible wrapper for a section tagged `deep: true`.
// The newcomer ramp measured 700-1,000 words per lesson with every block
// carrying equal visual weight; deep sections put the nice-to-know material
// behind one tap so a first pass reads only the core. Collapsed by default,
// state is per-mount (a revisit starts collapsed again — that's the point).
function DeepSection({ count, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lesson-deep" data-open={open || undefined}>
      <button
        type="button"
        className="lesson-deep-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? '▾ Collapse' : `▸ Go deeper`}
        <span className="lesson-deep-hint">
          {open ? '' : ` — optional detail (${count} block${count === 1 ? '' : 's'}); the core continues below`}
        </span>
      </button>
      {open && <div className="lesson-deep-body">{children}</div>}
    </div>
  );
}

// Synthesis Challenge — a commit-then-reveal integration prompt. The learner
// thinks through how the lesson's concepts fit together, COMMITS to a
// concrete forced-choice about it (block.commit — 2-4 authored options),
// then reveals the strong model answer to check against. XP pays only on a
// correct commitment ('synthesis:commit', PredictBlock's contract); the
// reveal tap itself pays nothing — it used to pay +5 for zero commitment,
// which made the app's main synthesis surface a free-XP button. Blocks
// without an authored commit fall back to plain reveal (no XP).
// (Typed self-grade stays removed per product direction; block type stays
// "explain-back".)
function ExplainBackBlock({ block, idx }) {
  const addXp = useStore((s) => s.addXp);
  const [hintOpen, setHintOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [committed, setCommitted] = useState(null); // picked commit-option index
  const prompt = block.prompt || '';
  const modelAnswer = block.modelAnswer || '';
  const hint = block.hint || null;
  const c = block.commit;
  const commit = c && typeof c.q === 'string'
    && Array.isArray(c.opts) && c.opts.length >= 2
    && Number.isInteger(c.answer) && c.answer >= 0 && c.answer < c.opts.length
    ? c : null;
  if (!prompt || !modelAnswer) return null;

  const mustCommit = commit !== null && committed === null;

  const pickCommit = (i) => {
    if (committed !== null || revealed) return;
    setCommitted(i);
    if (i === commit.answer) addXp?.(5, 'synthesis:commit');
  };

  const onReveal = () => {
    if (revealed || mustCommit) return;
    setRevealed(true);
  };

  return (
    <div className="synthesis-block" data-revealed={revealed || undefined}>
      <div className="synthesis-kicker mono">◆ SYNTHESIS CHALLENGE</div>
      <div className="synthesis-prompt">{renderInline(prompt, `syn-${idx}`)}</div>
      <p className="synthesis-nudge">
        Think it through end-to-end before you reveal — that&apos;s where the learning is.
      </p>

      {/* Commit step — generation before the answer is visible. */}
      {commit && !revealed && (
        <div style={{ margin: '10px 0' }}>
          <p style={{ fontSize: 13.5, fontWeight: 600, margin: '0 0 8px' }}>
            {renderInline(commit.q, `syn-c-${idx}`)}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {commit.opts.map((o, i) => {
              let cls = 'btn dp-option';
              if (committed !== null && i === commit.answer) cls += ' dp-correct';
              else if (committed !== null && i === committed) cls += ' dp-wrong';
              return (
                <button key={i} type="button" className={cls} disabled={committed !== null} onClick={() => pickCommit(i)}>
                  <span className="dp-letter">{String.fromCharCode(65 + i)}</span>
                  <span className="dp-text">{o}</span>
                </button>
              );
            })}
          </div>
          {committed !== null && (
            <p className="caption" style={{ margin: '8px 0 0', fontSize: 12.5 }}>
              {committed === commit.answer ? '✓ ' : '✗ '}
              {commit.why ? renderInline(commit.why, `syn-w-${idx}`) : (committed === commit.answer ? 'Committed and right.' : 'Worth a second look — the reveal below shows the full picture.')}
              {committed === commit.answer && <span className="mono" style={{ color: 'var(--accent-amber)' }}> +5 XP</span>}
            </p>
          )}
        </div>
      )}

      {!revealed && (
        <div className="synthesis-actions">
          <button
            type="button"
            className="synthesis-btn synthesis-btn-primary"
            onClick={onReveal}
            disabled={mustCommit}
            title={mustCommit ? 'Commit to an answer first' : undefined}
            style={mustCommit ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
          >
            {mustCommit ? 'Commit above to unlock the answer' : 'Reveal a strong answer →'}
          </button>
          {hint && (
            <button
              type="button"
              className="synthesis-btn synthesis-btn-secondary"
              onClick={() => setHintOpen((h) => !h)}
              aria-expanded={hintOpen}
            >
              {hintOpen ? 'Hide hint' : 'Hint'}
            </button>
          )}
        </div>
      )}
      {!revealed && hintOpen && hint && (
        <div className="synthesis-hint">{renderInline(hint, `syn-h-${idx}`)}</div>
      )}
      {revealed && (
        <div className="synthesis-answer">
          <div className="synthesis-answer-kicker mono">A STRONG ANSWER</div>
          <div className="synthesis-answer-body">{renderInline(modelAnswer, `syn-a-${idx}`)}</div>
        </div>
      )}
    </div>
  );
}

// WalkthroughBlock — step-by-step concept visualizer (OAuth, TLS, CI/CD, RAG…).
//
// Renders a small inline SVG of all nodes always; each `steps[i]` declares
// `activeNodes` (glowing amber, others dimmed) and `activeEdges` (animated
// dashed strokes). Below the diagram: the current step's title + description
// and the Prev/Next nav. We use an inline SVG instead of MermaidFlow because
// MermaidFlow doesn't natively expose per-step opacity / per-edge animation
// toggles, and bending it would couple two unrelated concerns. The SVG here
// shares the same nodeWidth/height/positioning conventions as AnimatedDiagram
// (proportional 0..1 x/y, accent stripe + serif label + uppercase subtitle)
// so the visual rhythm matches the static diagram immediately above it.
//
// Schema extensions (optional, additive — absence preserves prior render):
//   why? — string. When set, the FINAL step renders a "WHY IT WORKS THIS WAY"
//          coda panel under the description with the rationale text. Hidden
//          on every other step; absence on the block hides it entirely.
const WT_VIEWBOX_W = 360;
const WT_NODE_W = 96;
const WT_NODE_H = 46;
const WT_ACCENT_VAR = {
  amber: 'var(--accent-amber)',
  fire: 'var(--el-fire)',
  water: 'var(--el-water)',
  earth: 'var(--el-earth)',
  sky: 'var(--el-sky)',
};
function wtAccent(a) {
  return WT_ACCENT_VAR[a] || WT_ACCENT_VAR.amber;
}

function WalkthroughBlock({ block }) {
  const nodes = Array.isArray(block.nodes) ? block.nodes : [];
  const steps = Array.isArray(block.steps) ? block.steps : [];
  const reducedSetting = useStore((s) => s.settings.reducedMotion);
  const reduced = reducedSetting
    || (typeof window !== 'undefined' && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [stepIndex, setStepIndex] = useState(0);
  const containerRef = useRef(null);
  const [measuredWidth, setMeasuredWidth] = useState(null);
  // Per-instance SVG marker id. useId() is stable across renders (and
  // StrictMode double-renders) — the old per-render Math.random() minted new
  // marker ids + a full attribute rewrite on every render. Colons stripped so
  // the id stays a valid url(#…) fragment.
  const uid = useId().replace(/:/g, '');

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const measure = () => setMeasuredWidth(el.clientWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (steps.length === 0 || nodes.length === 0) return null;

  const safeIdx = Math.min(Math.max(stepIndex, 0), steps.length - 1);
  const step = steps[safeIdx];
  const activeNodeSet = new Set(step.activeNodes || []);
  const activeEdges = Array.isArray(step.activeEdges) ? step.activeEdges : [];
  const activeEdgeKey = (e) => `${e.from}→${e.to}`;
  const activeEdgeKeys = new Set(activeEdges.map(activeEdgeKey));

  // Stack vertically on very narrow viewports — same threshold the static
  // diagram uses — so the diagram never horizontally scrolls at 375px.
  const stacked = measuredWidth != null && measuredWidth < 360;

  // Group nodes into rows by y (±0.12) and space each row EVENLY across the
  // viewBox (source x is used only for left→right ordering). This stops the
  // cramped / overlapping boxes that raw x positions produced.
  const rows = [];
  if (!stacked) {
    const sorted = nodes
      .map((n, idx) => ({ n, idx, y: typeof n.y === 'number' ? n.y : 0.5 }))
      .sort((a, b) => a.y - b.y || a.idx - b.idx);
    for (const e of sorted) {
      const last = rows[rows.length - 1];
      if (last && Math.abs(e.y - last.y) <= 0.12) {
        last.items.push(e);
        last.y = (last.y * (last.items.length - 1) + e.y) / last.items.length;
      } else {
        rows.push({ y: e.y, items: [e] });
      }
    }
    rows.forEach((row) => row.items.sort((a, b) => ((a.n.x ?? 0.5) - (b.n.x ?? 0.5)) || a.idx - b.idx));
  }

  // Size the cards for the WIDEST ROW, not the total node count — a 2-per-row
  // flow gets wide, readable cards instead of being shrunk as if all 8 nodes
  // shared one row (which forced the "…" truncation the user saw).
  const maxPerRow = stacked ? 1 : Math.max(1, ...rows.map((r) => r.items.length));
  const nodeW = stacked
    ? WT_NODE_W
    // Width from the per-slot spacing so nodes keep an ~8px gap even at 6+ per
    // row — the old Math.max(56, …) floor could exceed the slot and overlap.
    : Math.max(40, Math.min(132, Math.floor(WT_VIEWBOX_W / (maxPerRow + 1)) - 8));

  const H = stacked
    ? Math.max(220, nodes.length * (WT_NODE_H + 24) + 32)
    : Math.max(180, rows.length * (WT_NODE_H + 36) + 16);

  const positions = new Map();
  if (stacked) {
    const cx = WT_VIEWBOX_W / 2;
    const slotH = (H - 16) / Math.max(nodes.length, 1);
    nodes.forEach((n, i) => {
      const cy = 8 + slotH * (i + 0.5);
      positions.set(n.id, { cx, cy, x: cx - nodeW / 2, y: cy - WT_NODE_H / 2 });
    });
  } else {
    const rowCount = rows.length;
    rows.forEach((row, ri) => {
      const cy = rowCount <= 1
        ? H / 2
        : (WT_NODE_H / 2 + 10) + (H - WT_NODE_H - 20) * (ri / (rowCount - 1));
      const m = row.items.length;
      row.items.forEach((e, ci) => {
        const cxRaw = (WT_VIEWBOX_W * (ci + 1)) / (m + 1);
        const cx = Math.max(nodeW / 2 + 4, Math.min(WT_VIEWBOX_W - nodeW / 2 - 4, cxRaw));
        positions.set(e.n.id, { cx, cy, x: cx - nodeW / 2, y: cy - WT_NODE_H / 2 });
      });
    });
  }

  // Distinct row centre-lines, sorted. The midpoints between consecutive
  // entries are horizontal corridors that no node band touches — cross-row
  // edge labels are placed there (see label placement below). Works for the
  // stacked layout too, where every node is its own "row".
  const rowCys = [...new Set([...positions.values()].map((p) => p.cy))]
    .sort((p, q) => p - q);

  // Edges: declared once at the block level (all the unique active edges
  // across every step), so we don't have to recompute on each step change.
  // We collect them up-front from steps[].activeEdges so the renderer can
  // dim the inactive ones and animate the active ones.
  const allEdges = [];
  const seen = new Set();
  for (const s of steps) {
    for (const e of s.activeEdges || []) {
      const key = `${e.from}→${e.to}`;
      if (seen.has(key)) continue;
      seen.add(key);
      allEdges.push(e);
    }
  }

  const isLast = safeIdx === steps.length - 1;
  const isFirst = safeIdx === 0;
  const onNext = () => {
    if (isLast) setStepIndex(0);
    else setStepIndex(safeIdx + 1);
  };
  const onPrev = () => {
    if (!isFirst) setStepIndex(safeIdx - 1);
  };

  // Edge-label rects placed so far THIS render (= this step). Labels check
  // against it so two labels in one step can't sit on top of each other
  // (e.g. the bidirectional "encrypted" pair in the TLS walkthroughs).
  const placedLabels = [];

  return (
    <figure className="walkthrough-block" ref={containerRef}>
      <div className="walkthrough-kicker mono">STEP-BY-STEP</div>
      {block.title && <div className="walkthrough-title">{block.title}</div>}
      {block.caption && <div className="walkthrough-caption">{block.caption}</div>}

      <div className="walkthrough-diagram-wrap">
        <svg
          className="walkthrough-svg"
          viewBox={`0 0 ${WT_VIEWBOX_W} ${H}`}
          role="img"
          aria-label={block.title ? `${block.title} — step ${safeIdx + 1}` : `Walkthrough step ${safeIdx + 1}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <marker
              id={`wt-arrow-${uid}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="var(--accent-amber)" />
            </marker>
            <marker
              id={`wt-arrow-dim-${uid}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="var(--text-tertiary)" />
            </marker>
          </defs>

          {allEdges.map((e, i) => {
            const a = positions.get(e.from);
            const b = positions.get(e.to);
            if (!a || !b) return null;
            const active = activeEdgeKeys.has(`${e.from}→${e.to}`);
            // Straight line between centers, pulled in to the box edges.
            const dx = b.cx - a.cx;
            const dy = b.cy - a.cy;
            const len = Math.hypot(dx, dy) || 1;
            const ux = dx / len;
            const uy = dy / len;
            const hw = nodeW / 2 + 2;
            const hh = WT_NODE_H / 2 + 2;
            const t1 = Math.min(
              ux !== 0 ? hw / Math.abs(ux) : Infinity,
              uy !== 0 ? hh / Math.abs(uy) : Infinity,
            );
            const x1 = a.cx + ux * t1;
            const y1 = a.cy + uy * t1;
            const x2 = b.cx - ux * t1;
            const y2 = b.cy - uy * t1;
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            // Pull the label from the active edge (if any) so per-step
            // captions like "click" / "code+pkce" can float on the line.
            let labelText = null;
            if (active) {
              const match = activeEdges.find(
                (ae) => ae.from === e.from && ae.to === e.to,
              );
              labelText = match && match.label ? String(match.label) : null;
            }
            // Label placement. A label centred ON the line only works when the
            // midpoint corridor is empty — true for cross-row edges (the space
            // between row bands holds nothing). For SAME-ROW edges the gap
            // between adjacent boxes (~8-20px) can never hold a 30-110px label,
            // so it used to sit across both endpoint boxes; those labels float
            // just above/below the row band instead. Candidates are tried in
            // order; the first spot inside the viewBox, clear of EVERY node and
            // every already-placed label, wins.
            const labelW = labelText ? labelText.length * 5.5 + 10 : 0;
            let lx = midX;
            let ly = midY;
            if (labelText) {
              const LABEL_H = 13;
              const sameRow = Math.abs(a.cy - b.cy) < 1;
              const clampX = (cx) =>
                Math.max(labelW / 2 + 2, Math.min(WT_VIEWBOX_W - labelW / 2 - 2, cx));
              const inBounds = (cy) => cy - LABEL_H / 2 >= 2 && cy + LABEL_H / 2 <= H - 2;
              const hitsNode = (cx, cy) => nodes.some((n) => {
                const p = positions.get(n.id);
                if (!p) return false;
                return Math.abs(cx - p.cx) < labelW / 2 + nodeW / 2 + 3
                  && Math.abs(cy - p.cy) < LABEL_H / 2 + WT_NODE_H / 2 + 2;
              });
              const hitsLabel = (cx, cy) => placedLabels.some((r) =>
                Math.abs(cx - r.cx) < (labelW + r.w) / 2 + 4
                && Math.abs(cy - r.cy) < LABEL_H + 1);
              const lift = WT_NODE_H / 2 + LABEL_H / 2 + 4; // clears the row band
              const candidates = sameRow
                ? [
                  [midX, midY - lift], [midX, midY + lift],
                  [midX, midY - lift - 15], [midX, midY + lift + 15],
                ]
                : (() => {
                  // Cross-row edges: the raw midpoint of a pass-through edge
                  // (top row → bottom row) can land exactly ON the middle
                  // row's band, where no dodge inside the band can help. The
                  // corridors between consecutive rows are clear of every
                  // node by construction, so walk the corridors this edge
                  // crosses — nearest the midpoint first — and put the label
                  // where the line crosses that corridor.
                  const lo = Math.min(a.cy, b.cy);
                  const hi = Math.max(a.cy, b.cy);
                  const corridorYs = [];
                  for (let ci = 0; ci + 1 < rowCys.length; ci++) {
                    if (rowCys[ci] >= lo - 0.5 && rowCys[ci + 1] <= hi + 0.5) {
                      corridorYs.push((rowCys[ci] + rowCys[ci + 1]) / 2);
                    }
                  }
                  corridorYs.sort((p, q) => Math.abs(p - midY) - Math.abs(q - midY));
                  const cands = [];
                  for (const yy of corridorYs) {
                    const xx = a.cx + ((b.cx - a.cx) * (yy - a.cy)) / (b.cy - a.cy);
                    cands.push([xx, yy], [xx + 26, yy], [xx - 26, yy]);
                  }
                  cands.push([midX, midY]); // safety net if no corridor matched
                  return cands;
                })();
              let spot = null;
              for (const [cx, cy] of candidates) {
                const ccx = clampX(cx);
                if (!inBounds(cy)) continue;
                if (hitsNode(ccx, cy) || hitsLabel(ccx, cy)) continue;
                spot = [ccx, cy];
                break;
              }
              if (!spot) {
                // Best effort: first candidate, clamped into the viewBox —
                // never worse than the old on-the-line behaviour.
                const [cx, cy] = candidates[0];
                spot = [clampX(cx), Math.max(9, Math.min(H - 9, cy))];
              }
              [lx, ly] = spot;
              placedLabels.push({ cx: lx, cy: ly, w: labelW });
            }
            return (
              <g
                key={`wt-e-${i}`}
                className={`walkthrough-edge${active ? ' walkthrough-edge-active' : ''}`}
              >
                <path
                  d={`M ${x1} ${y1} L ${x2} ${y2}`}
                  fill="none"
                  stroke={active ? 'var(--accent-amber)' : 'var(--text-tertiary)'}
                  strokeWidth={active ? 1.8 : 1}
                  strokeLinecap="round"
                  strokeDasharray={active ? '5 4' : undefined}
                  opacity={active ? 1 : 0.35}
                  markerEnd={`url(#${active ? `wt-arrow-${uid}` : `wt-arrow-dim-${uid}`})`}
                />
                {active && !reduced && (
                  <circle r={3.6} className="wt-packet" fill="var(--accent-amber)">
                    <animateMotion
                      dur="1.05s"
                      repeatCount="indefinite"
                      path={`M ${x1} ${y1} L ${x2} ${y2}`}
                    />
                  </circle>
                )}
                {labelText && (
                  <g className="walkthrough-edge-label">
                    <rect
                      x={lx - labelW / 2}
                      y={ly - 7}
                      width={labelW}
                      height={13}
                      rx={3}
                      ry={3}
                      fill="var(--bg-card)"
                      stroke="var(--accent-amber)"
                      strokeWidth={0.8}
                    />
                    <text
                      x={lx}
                      y={ly}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={9}
                      fontFamily="var(--font-mono), monospace"
                      fill="var(--text-secondary)"
                    >
                      {labelText}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {nodes.map((n) => {
            const p = positions.get(n.id);
            if (!p) return null;
            const acc = wtAccent(n.accent);
            const active = activeNodeSet.has(n.id);
            // Clip text to the node so subtitles never spill into neighbours.
            // Keep the FULL label/subtitle so the words stay readable. When the
            // text is wider than its node, SVG textLength + lengthAdjust (below)
            // condenses the glyphs to fit the box instead of spilling into the
            // neighbouring node. A hard cap only trims genuinely absurd lengths
            // (which would otherwise over-squeeze to illegibility).
            const textAvail = nodeW - 8;
            // Truncation point: textLength may condense glyphs to ~80% of
            // natural width before we cut with an ellipsis — squeezing further
            // (the old floor allowed ~50%) renders as smashed, overlapping
            // letters. Full text stays readable via the <title> tooltip.
            const LABEL_MAX = Math.max(6, Math.floor(textAvail / 6));
            const SUB_MAX = Math.max(6, Math.floor(textAvail / 5.4));
            const shownLabel = n.label && n.label.length > LABEL_MAX
              ? `${n.label.slice(0, LABEL_MAX - 1).trimEnd()}…` : (n.label || '');
            const subRaw = n.subtitle ? String(n.subtitle).toUpperCase() : null;
            const shownSub = subRaw && subRaw.length > SUB_MAX
              ? `${subRaw.slice(0, SUB_MAX - 1).trimEnd()}…` : subRaw;
            // Squeeze only when the text would overrun the box (conservative
            // per-glyph widths: serif title ~7.5px, mono subtitle ~6.8px).
            const labelLen = shownLabel.length * 7.5 > textAvail ? textAvail : undefined;
            const subLen = shownSub && shownSub.length * 6.8 > textAvail ? textAvail : undefined;
            return (
              <g
                key={n.id}
                className={`walkthrough-node${active ? ' walkthrough-node-active' : ''}`}
                style={{ opacity: active ? 1 : 0.4 }}
              >
                <title>{n.label}{n.subtitle ? ` — ${n.subtitle}` : ''}</title>
                <rect
                  x={p.x}
                  y={p.y}
                  width={nodeW}
                  height={WT_NODE_H}
                  rx={8}
                  ry={8}
                  fill="var(--bg-elevated)"
                  stroke={acc}
                  strokeWidth={active ? 1.6 : 1.2}
                />
                <rect
                  x={p.x}
                  y={p.y}
                  width={3}
                  height={WT_NODE_H}
                  rx={1.5}
                  ry={1.5}
                  fill={acc}
                />
                <text
                  x={p.cx + 1.5}
                  y={n.subtitle ? p.cy - 5 : p.cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={12}
                  fontWeight={600}
                  fill="var(--text-primary)"
                  fontFamily="var(--font-serif), serif"
                  textLength={labelLen}
                  lengthAdjust="spacingAndGlyphs"
                >
                  {shownLabel}
                </text>
                {shownSub && (
                  <text
                    x={p.cx + 1.5}
                    y={p.cy + 9}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={8.5}
                    fill="var(--text-tertiary)"
                    fontFamily="var(--font-mono), monospace"
                    letterSpacing="0.06em"
                    textLength={subLen}
                    lengthAdjust="spacingAndGlyphs"
                  >
                    {shownSub}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="walkthrough-step-body">
        <div className="walkthrough-step-title">{step.title}</div>
        {step.description && (
          <p className="walkthrough-step-desc">{step.description}</p>
        )}
        {isLast && typeof block.why === 'string' && block.why.length > 0 && (
          // Why-coda: only shown on the FINAL step. Lighter touch than the
          // bordered card pattern (no fill) — just an amber left rule + kicker
          // so the eye reads it as a footnote to the whole walkthrough.
          <div className="walkthrough-why">
            <div className="walkthrough-why-kicker mono">WHY IT WORKS THIS WAY</div>
            <p className="walkthrough-why-body">{block.why}</p>
          </div>
        )}
      </div>

      <div className="walkthrough-nav">
        <button
          className="walkthrough-btn"
          onClick={onPrev}
          disabled={isFirst}
          aria-label="Previous step"
        >
          ◀ PREV
        </button>
        <div className="walkthrough-counter mono">
          STEP {safeIdx + 1} / {steps.length}
        </div>
        <button
          className="walkthrough-btn walkthrough-btn-next"
          onClick={onNext}
          aria-label={isLast ? 'Restart walkthrough' : 'Next step'}
        >
          {isLast ? 'RESTART ↺' : 'NEXT ▶'}
        </button>
      </div>
    </figure>
  );
}

// SequenceBlock — vertical actor-lane sequence diagram (TLS, OAuth, RPC, etc.)
//
// Schema:
//   { type: 'sequence', title?, caption?,
//     actors: [{ id, label, accent? }, ...],   // 2-4 actors, accent reuses element vars
//     events: [
//       { from, to, label, note?, dashed? },   // arrow from one lane to another
//       { self, label, note?, dashed? },       // self-loop on a single lane
//       ...                                     // ≤ 6 events keeps it readable
//     ] }
//
// Lanes drop straight down from the header. Each event is a row ~60px tall:
// arrow body in the source actor's accent color, label above, optional small
// mono note below. self-loops draw a small curved arc on the actor's lane.
// Dashed arrows (`dashed: true`) mark logical / non-network steps. No hover
// state, no animation — sequence diagrams reward stillness so the eye can
// follow the time axis without the chart twitching at it.
//
// Mobile-first: viewBox is 360 wide so the SVG always fits 375px viewports
// without horizontal scroll. Actor count is capped at 4 at the schema level
// (anything more would crowd lanes < 80px apart and force tiny labels);
// authors should fall back to `walkthrough` instead.
const SEQ_VIEWBOX_W = 360;
const SEQ_HEADER_H = 32;
const SEQ_ROW_H = 60;
const SEQ_BOTTOM_PAD = 16;
const SEQ_ACCENT_VAR = {
  amber: 'var(--accent-amber)',
  fire: 'var(--el-fire)',
  water: 'var(--el-water)',
  earth: 'var(--el-earth)',
  sky: 'var(--el-sky)',
};
function seqAccent(a) {
  return SEQ_ACCENT_VAR[a] || SEQ_ACCENT_VAR.amber;
}

function SequenceBlock({ block }) {
  // Per-instance SVG marker id — useId() (stable across renders, StrictMode-
  // safe) replaces the old per-render Math.random() mint. The hook call must
  // precede the early return below.
  const uid = useId().replace(/:/g, '');
  const actors = Array.isArray(block.actors) ? block.actors.slice(0, 4) : [];
  const events = Array.isArray(block.events) ? block.events.slice(0, 12) : [];
  if (actors.length < 2 || events.length === 0) return null;

  // Lane x-positions: evenly distributed across the viewBox with a small
  // inner margin so labels at the leftmost / rightmost lane don't clip.
  const innerPad = 28;
  const usable = SEQ_VIEWBOX_W - innerPad * 2;
  const slot = actors.length > 1 ? usable / (actors.length - 1) : 0;
  const laneX = new Map();
  actors.forEach((a, i) => {
    laneX.set(a.id, innerPad + slot * i);
  });
  const accentById = new Map();
  actors.forEach((a) => accentById.set(a.id, seqAccent(a.accent)));

  const H = SEQ_HEADER_H + SEQ_ROW_H * events.length + SEQ_BOTTOM_PAD;

  return (
    <figure className="sequence-block">
      {block.title && <figcaption className="sequence-title">{block.title}</figcaption>}
      <div className="sequence-diagram-wrap">
        <svg
          className="sequence-svg"
          viewBox={`0 0 ${SEQ_VIEWBOX_W} ${H}`}
          role="img"
          aria-label={block.title ? `${block.title} sequence diagram` : 'Sequence diagram'}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {actors.map((a) => (
              <marker
                key={`m-${a.id}`}
                id={`seq-arrow-${uid}-${a.id}`}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M0,0 L10,5 L0,10 z" fill={accentById.get(a.id)} />
              </marker>
            ))}
          </defs>

          {/* Actor headers + dashed lifelines */}
          {actors.map((a) => {
            const x = laneX.get(a.id);
            const acc = accentById.get(a.id);
            // Estimated header width (10px mono caps + 0.12em tracking ≈
            // 7.2px/char). Squeeze via textLength when it exceeds the lane
            // slot, and clamp x so edge-lane headers can't run out of the
            // viewBox (a long label on the rightmost lane used to clip).
            const estW = String(a.label).length * 7.2;
            const maxW = actors.length > 1 ? slot - 10 : SEQ_VIEWBOX_W - 16;
            const shownW = Math.min(estW, maxW);
            const hx = Math.max(shownW / 2 + 2,
              Math.min(SEQ_VIEWBOX_W - shownW / 2 - 2, x));
            return (
              <g key={`actor-${a.id}`}>
                <text
                  className="sequence-actor-header"
                  x={hx}
                  y={14}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={acc}
                  fontFamily="var(--font-mono), monospace"
                  fontSize={10}
                  letterSpacing="0.12em"
                  textLength={estW > maxW ? maxW : undefined}
                  lengthAdjust="spacingAndGlyphs"
                >
                  {String(a.label).toUpperCase()}
                </text>
                <line
                  className="sequence-actor-lane"
                  x1={x}
                  x2={x}
                  y1={SEQ_HEADER_H - 4}
                  y2={H - 4}
                />
              </g>
            );
          })}

          {/* Events — arrows or self-loops, top to bottom */}
          {events.map((ev, i) => {
            const rowY = SEQ_HEADER_H + SEQ_ROW_H * (i + 0.5);
            const dashed = ev.dashed === true;
            const dashAttr = dashed ? '5 4' : undefined;

            // Self-loop: small curve returning to the same lane. Events
            // written as { from: X, to: X } render the same way — the old
            // zero-length-arrow fallback centred a wide label ON the lane and
            // pushed it out of the viewBox at the edge lanes.
            const selfId = ev.self
              || (ev.from != null && ev.from === ev.to ? ev.from : null);
            if (selfId) {
              const x = laneX.get(selfId);
              if (x == null) return null;
              const acc = accentById.get(selfId) || 'var(--accent-amber)';
              const r = 11;
              const cx = x + 4; // anchor curve to right of lifeline
              const top = rowY - r;
              const bot = rowY + r;
              // Cubic curve out to the right and back — 22px wide loop.
              const d = `M ${x} ${top} C ${cx + 22} ${top}, ${cx + 22} ${bot}, ${x} ${bot}`;
              const labelX = Math.min(cx + 26, SEQ_VIEWBOX_W - 4);
              // Flip to end-anchor when the wider of label/note would run off
              // the right edge (note used to be start-anchored regardless).
              const selfTextW = Math.max(
                ev.label ? String(ev.label).length * 5.8 : 0,
                ev.note ? String(ev.note).length * 5.4 : 0,
              );
              const anchorEnd = labelX + selfTextW > SEQ_VIEWBOX_W - 4;
              return (
                <g key={`ev-${i}`} className="sequence-self-loop">
                  <path
                    d={d}
                    fill="none"
                    stroke={acc}
                    strokeWidth={1.4}
                    strokeDasharray={dashAttr}
                    markerEnd={`url(#seq-arrow-${uid}-${selfId})`}
                  />
                  {ev.label && (
                    <text
                      className={dashed ? 'sequence-arrow-label sequence-arrow-label-dashed' : 'sequence-arrow-label'}
                      x={labelX}
                      textAnchor={anchorEnd ? 'end' : 'start'}
                      y={rowY - 2}
                      dominantBaseline="central"
                      fontFamily="'Inter Tight', var(--font-sans), sans-serif"
                      fontWeight={500}
                      fontSize={11}
                      fill="var(--text-primary)"
                    >
                      {ev.label}
                    </text>
                  )}
                  {ev.note && (
                    <text
                      className="sequence-arrow-note"
                      x={labelX}
                      textAnchor={anchorEnd ? 'end' : 'start'}
                      y={rowY + 10}
                      dominantBaseline="central"
                      fontFamily="var(--font-mono), monospace"
                      fontSize={9}
                      fill="var(--text-tertiary)"
                    >
                      {ev.note}
                    </text>
                  )}
                </g>
              );
            }

            const xa = laneX.get(ev.from);
            const xb = laneX.get(ev.to);
            if (xa == null || xb == null) return null;
            const acc = accentById.get(ev.from) || 'var(--accent-amber)';
            const dir = xb > xa ? 1 : -1;
            // Shrink to ~70% of lane gap, centered between the lanes, so the
            // arrow head clearly lands inside the destination lane gutter.
            const full = Math.abs(xb - xa);
            const arrowLen = full * 0.72;
            const mid = (xa + xb) / 2;
            const x1 = mid - (arrowLen / 2) * dir;
            const x2 = mid + (arrowLen / 2) * dir;
            // Clamp label/note centres so the estimated text box stays inside
            // the viewBox — a long label between the two leftmost lanes used
            // to run off the left edge and get clipped.
            const estLabelW = ev.label ? String(ev.label).length * 5.8 : 0;
            const estNoteW = ev.note ? String(ev.note).length * 5.4 : 0;
            const labelX = Math.max(estLabelW / 2 + 2,
              Math.min(SEQ_VIEWBOX_W - estLabelW / 2 - 2, mid));
            const noteX = Math.max(estNoteW / 2 + 2,
              Math.min(SEQ_VIEWBOX_W - estNoteW / 2 - 2, mid));
            return (
              <g key={`ev-${i}`} className={dashed ? 'sequence-arrow sequence-arrow-dashed' : 'sequence-arrow'}>
                {ev.label && (
                  <text
                    className="sequence-arrow-label"
                    x={labelX}
                    y={rowY - 10}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontFamily="'Inter Tight', var(--font-sans), sans-serif"
                    fontWeight={500}
                    fontSize={11}
                    fill="var(--text-primary)"
                  >
                    {ev.label}
                  </text>
                )}
                <line
                  x1={x1}
                  x2={x2}
                  y1={rowY}
                  y2={rowY}
                  stroke={acc}
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeDasharray={dashAttr}
                  markerEnd={`url(#seq-arrow-${uid}-${ev.from})`}
                />
                {ev.note && (
                  <text
                    className="sequence-arrow-note"
                    x={noteX}
                    y={rowY + 12}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontFamily="var(--font-mono), monospace"
                    fontSize={9}
                    fill="var(--text-tertiary)"
                  >
                    {ev.note}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      {block.caption && <figcaption className="sequence-caption">{block.caption}</figcaption>}
    </figure>
  );
}

// CompareBlock — side-by-side option comparison (REST vs gRPC, Monolith vs
// Microservices, SQL vs NoSQL, …). Two accent-colored cards sit on a 2-col
// grid at desktop and stack vertically at 375px; in stacked mode each value
// row sprouts its own axis kicker (small mono uppercase) above the value so
// the reader never has to scroll back to a header row. On wide screens the
// axis kickers still render — they double as visual rhythm and keep each row
// scan-anchored. Mobile-first; no animation, ADHD scan-friendly.
const COMPARE_ACCENT_VAR = {
  amber: 'var(--accent-amber)',
  fire: 'var(--el-fire)',
  water: 'var(--el-water)',
  earth: 'var(--el-earth)',
  sky: 'var(--el-sky)',
};
function compareAccent(a) {
  return COMPARE_ACCENT_VAR[a] || COMPARE_ACCENT_VAR.amber;
}

function CompareBlock({ block, idx }) {
  const axes = Array.isArray(block.axes) ? block.axes : [];
  const left = block.left || {};
  const right = block.right || {};
  if (axes.length === 0 || !left.label || !right.label) return null;

  const leftAccent = compareAccent(left.accent);
  const rightAccent = compareAccent(right.accent);
  const leftValues = Array.isArray(left.values) ? left.values : [];
  const rightValues = Array.isArray(right.values) ? right.values : [];

  const renderCard = (side, label, accent, values) => (
    <div
      className={`compare-card compare-card-${side}`}
      style={{ '--compare-accent': accent }}
    >
      <div className="compare-card-head">
        <span className="compare-card-label">{label}</span>
      </div>
      <ul className="compare-card-rows">
        {axes.map((axis, ai) => (
          <li key={`c${idx}-${side}-${ai}`} className="compare-row">
            <div className="compare-row-kicker">{axis}</div>
            <div className="compare-row-value">
              {renderInline(String(values[ai] ?? '—'), `cv${idx}-${side}-${ai}`)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <figure className="compare-block">
      {block.title && <figcaption className="compare-title">{block.title}</figcaption>}
      <div className="compare-grid">
        {renderCard('left', left.label, leftAccent, leftValues)}
        {renderCard('right', right.label, rightAccent, rightValues)}
      </div>
      {block.caption && <figcaption className="compare-caption">{block.caption}</figcaption>}
    </figure>
  );
}

// LayersBlock — stacked-band visualization for layered models (OSI, defense-
// in-depth, deploy pipeline stages, ML pipeline stages). Each layer is a
// horizontal band ~64px tall: a small accent-colored numeric chip on the
// left, the layer label (Inter Tight 600 14px), and an optional mono
// example string on the right. Bands carry a 1.5px accent-colored bottom
// border + an 8% accent tint over --bg-elevated so the eye reads the stack
// as a graded layered cake rather than a generic list. Mobile-first: bands
// are full width and stack naturally at 375px without any horizontal scroll.
// No transitions — prefers-reduced-motion is respected via the CSS rule.
const LAYERS_ACCENT_VAR = {
  amber: 'var(--accent-amber)',
  fire: 'var(--el-fire)',
  water: 'var(--el-water)',
  earth: 'var(--el-earth)',
  sky: 'var(--el-sky)',
};
const LAYERS_ACCENT_RGB = {
  // 8% tint backgrounds — match the design vars but pre-mixed so we don't
  // need color-mix() at runtime (Safari < 16.4 still ships without it).
  amber: 'rgba(245, 184, 66, 0.08)',
  fire: 'rgba(224, 120, 86, 0.08)',
  water: 'rgba(123, 159, 181, 0.08)',
  earth: 'rgba(143, 168, 118, 0.08)',
  sky: 'rgba(184, 136, 192, 0.08)',
};
function layersAccentVar(a) {
  return LAYERS_ACCENT_VAR[a] || LAYERS_ACCENT_VAR.amber;
}
function layersAccentTint(a) {
  return LAYERS_ACCENT_RGB[a] || LAYERS_ACCENT_RGB.amber;
}

function LayersBlock({ block }) {
  const layers = Array.isArray(block.layers) ? block.layers : [];
  if (layers.length === 0) return null;
  const orientation = block.orientation === 'horizontal' ? 'horizontal' : 'vertical';
  return (
    <figure className={`layers-block layers-${orientation}`}>
      {block.title && <figcaption className="layers-title">{block.title}</figcaption>}
      <div className="layers-stack">
        {layers.map((layer, i) => {
          const accent = layersAccentVar(layer.accent);
          const tint = layersAccentTint(layer.accent);
          return (
            <div
              key={`layer-${i}-${layer.n ?? layer.label}`}
              className="layers-band"
              style={{
                '--layers-accent': accent,
                '--layers-tint': tint,
              }}
            >
              {layer.n != null && (
                <div className="layers-chip" aria-hidden="true">
                  {layer.n}
                </div>
              )}
              <div className="layers-text">
                <div className="layers-label">{layer.label}</div>
                {layer.example && (
                  <div className="layers-example mono">{layer.example}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {block.caption && <figcaption className="layers-caption">{block.caption}</figcaption>}
    </figure>
  );
}

// Visual kanban board — replaces ASCII `|`-separated column art in lessons.
// Columns scroll horizontally on narrow screens (no wrap), each cycles
// through an accent color, and WIP chips flip red when items > wip.
const KANBAN_ACCENTS = [
  'var(--text-tertiary)',
  'var(--accent-amber)',
  'var(--el-water)',
  'var(--el-earth)',
  'var(--el-fire)',
  'var(--el-sky)',
];
function KanbanBlock({ block, idx }) {
  const columns = block.columns || [];
  return (
    <div className="kanban-wrap">
      {block.title && <div className="kanban-caption">{block.title}</div>}
      <div className="kanban-board">
        {columns.map((col, ci) => {
          const accent = KANBAN_ACCENTS[ci % KANBAN_ACCENTS.length];
          const items = col.items || [];
          const over = col.wip != null && items.length > col.wip;
          return (
            <div
              key={`kc${idx}-${ci}`}
              className="kanban-col"
              style={{ '--kanban-accent': accent }}
            >
              <div className="kanban-col-head">
                <span className="kanban-col-name">{col.name}</span>
                {col.wip != null && (
                  <span className={`kanban-wip${over ? ' kanban-wip-over' : ''}`}>
                    WIP ≤ {col.wip}
                  </span>
                )}
              </div>
              <div className="kanban-items">
                {items.map((it, ii) => (
                  <div key={`ki${idx}-${ci}-${ii}`} className="kanban-item">
                    {it}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {block.caption && <div className="kanban-caption">{block.caption}</div>}
    </div>
  );
}

// Storage-key derivation lives in src/utils/practiceKey.js so the inline
// editor, PracticeBlock, and LintEditor all hit the same bucket.

// EditorFallback — Suspense placeholder for the lazy CodeMirror editors.
// Layout-stable: a plain non-interactive <pre> showing the same starter code
// the editor will hydrate with, at the editor's minHeight, so the page
// doesn't jump when the chunk lands. Inherits the `.lesson-body pre` code-
// block styling (every practice block renders inside .lesson-body).
function EditorFallback({ code, minHeight }) {
  return (
    <pre style={{ minHeight, margin: 0 }} aria-hidden="true">
      <code>{code}</code>
    </pre>
  );
}

function PracticeInline({ block, lessonId }) {
  const lang = (block.lang || 'python').toLowerCase();
  const label = `TRY IT · ${lang.toUpperCase()}`;
  const starter = block.starter || '';

  let body = null;
  let fallback = null;
  if (lang === 'python') {
    body = (
      <PracticeBlock
        prompt={block.prompt}
        starter={starter}
        varName={block.varName || 'x'}
        lessonId={lessonId}
        lang="python"
      />
    );
    // minHeight mirrors PracticeBlock's CodeEditor minHeight (140).
    fallback = <EditorFallback code={starter} minHeight={140} />;
  } else if (lang === 'bash') {
    body = <TerminalBlock />;
  } else if (LINT_KINDS.includes(lang)) {
    body = (
      <LazyLintEditor
        kind={lang}
        placeholder={starter}
        lessonId={lessonId}
      />
    );
    // minHeight mirrors LintEditor's CodeEditor minHeight (160).
    fallback = <EditorFallback code={starter} minHeight={160} />;
  } else {
    return null;
  }
  return (
    <div className="practice-inline">
      <div className="practice-inline-kicker mono">{label}</div>
      {block.prompt && lang !== 'python' && (
        <div className="practice-inline-prompt">{block.prompt}</div>
      )}
      <div className="practice-inline-body">
        {fallback ? <Suspense fallback={fallback}>{body}</Suspense> : body}
      </div>
      {block.hint && (
        <details className="practice-inline-hint">
          <summary>Hint</summary>
          <div className="practice-inline-hint-body">{block.hint}</div>
        </details>
      )}
    </div>
  );
}

export default function Lesson() {
  const { id } = useParams();
  const nav = useNavigate();
  const found = useMemo(() => locate(id), [id]);
  const complete = useStore((s) => s.completeLesson);
  // Cliffhanger setter — invoked alongside complete() when the lesson body
  // carries a top-level `cliffhanger` string. The store action itself stamps
  // savedAt with today's date, so all the call site has to do is hand it the
  // lessonId and question text. Open-loop surfaces as the FIRST card on the
  // user's next session-open (see CliffhangerCard on Home).
  const setCliffhanger = useStore((s) => s.setCliffhanger);
  const completedMap = useStore((s) => s.completed);
  const [quizOpen, setQuizOpen] = useState(false);
  // Loaded math-quiz bank entry for THIS lesson: { forId, bank } | null.
  // `forId` mirrors the body loader's entryForId guard — the module-level
  // import cache resolves in a microtask on repeat opens, so without it a
  // stale bank could briefly render under a freshly navigated-to lesson id.
  // null means "not loaded yet"; the quiz pane shows a small loading state.
  const [quizBankEntry, setQuizBankEntry] = useState(null);
  // Paging — each section is its own page (Mockup 1 Proposal 1's PAGE k/m
  // indicator). Single-section lessons skip paging entirely.
  const [currentPage, setCurrentPage] = useState(0);

  // Sentinel for auto-complete-on-last-page (Mockup 1, Proposal 2). The
  // ref+effect MUST live before any early returns so hook order is stable.
  const endRef = useRef(null);
  const isComplete = !!completedMap[id];

  // Per-block micro-progress: the blockRefs array is rebuilt each render
  // from the visible page. The IntersectionObserver that consumes it — and
  // the activeIdx state it drives — live inside <LessonProgressRail> (keyed
  // by lesson id + page at its render site below), so scroll ticks re-render
  // only that small track instead of this whole component tree.
  const blockRefs = useRef([]);

  // Per-path lesson body loader. We pull just the file that owns this lesson
  // (see src/data/lessons/loader.js) instead of importing the full merged
  // lessonContent object — keeps the Lesson route chunk small. While the body
  // is loading we render a placeholder; this also means `entry` reads below
  // need to tolerate `null` on the very first paint of a fresh path.
  const [entry, setEntry] = useState(null);
  // Which lesson id the loaded `entry` belongs to. On same-path navigation
  // the cached loader resolves in a microtask, so for at least one commit
  // `entry` still holds the PREVIOUS lesson's body while `id` is already the
  // new one. The body render and the auto-complete effect both gate on
  // entryForId === id — that kills the one-frame wrong-body flash and stops
  // a stale sentinel from completing a never-viewed lesson.
  const [entryForId, setEntryForId] = useState(null);
  const [bodyLoading, setBodyLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setBodyLoading(true);
    const pathKey = found ? found.pathKey : null;
    if (!pathKey) {
      setEntry(null);
      setEntryForId(id);
      setBodyLoading(false);
      return () => {};
    }
    loadLessonsForPath(pathKey).then((bodies) => {
      if (cancelled) return;
      setEntry(bodies[id] || null);
      setEntryForId(id);
      setBodyLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id, found]);

  // Math-quiz bank loader — fires the first time the quiz pane opens on a
  // hasMathQuiz lesson (PATHS meta), never for the ~90% of lessons without a
  // quiz. Same cancelled-flag pattern as the body loader above so navigating
  // away mid-import can't land a stale bank; the module-level promise cache
  // in loadMathQuizzes() makes repeat opens resolve instantly.
  useEffect(() => {
    if (!quizOpen) return undefined;
    if (!found || !found.lesson.hasMathQuiz) return undefined;
    let cancelled = false;
    loadMathQuizzes().then((banks) => {
      if (cancelled) return;
      setQuizBankEntry({ forId: id, bank: banks[id] || null });
    });
    return () => {
      cancelled = true;
    };
  }, [id, quizOpen, found]);

  // Reset scroll to the top + page to 0 + close any open quiz whenever the
  // lesson id changes. Without this, navigating Continue from the bottom of
  // one lesson lands you at the bottom of the next one because React Router
  // reuses the component, the page index would persist across lessons, and a
  // quiz left open across browser back/forward would strand the new lesson
  // (every keyboard handler and the auto-complete effect bail on quizOpen).
  useEffect(() => {
    setCurrentPage(0);
    setQuizOpen(false);
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [id]);

  // Also scroll to top when the user pages forward / backward inside the
  // lesson — same idea, just at a finer grain than lesson navigation.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [currentPage]);

  // NOTE: the per-block IntersectionObserver that used to live here (driving
  // setActiveIdx on THIS component, i.e. re-rendering the entire lesson tree
  // on every scroll tick) moved into <LessonProgressRail> below — the only
  // consumer of activeIdx. Blocks never read it; they only carry the
  // data-block-idx attributes the rail observes.

  // Auto-complete when the sentinel scrolls into view. Fires only when the
  // user has actually reached the bottom of the LAST page (the sentinel
  // itself only renders on the last page; we still guard here so a remount
  // during the user's last-page session doesn't double-fire).
  // ── Cliffhanger hook: if the loaded lesson body carries a top-level
  // `cliffhanger` string, also stash it via the store so it surfaces on the
  // user's next session-open. Open-loop = Zeigarnik retention + return
  // motivation. We read `entry?.cliffhanger` inside the effect so each
  // completion path (sentinel-IO, fallback, manual) uses the freshest body.
  useEffect(() => {
    // Stale-entry guard: until the loader effect swaps `entry` for THIS id,
    // anything on screen (sentinel included) still belongs to the PREVIOUS
    // lesson — a short prior page could otherwise mark a never-viewed lesson
    // complete under the new id.
    if (entryForId !== id) return;
    if (isComplete) return;
    if (quizOpen) return;
    const el = endRef.current;
    if (!el) return;
    const cliff = (entry && typeof entry.cliffhanger === 'string' && entry.cliffhanger.trim().length > 0)
      ? entry.cliffhanger.trim()
      : null;
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback for older runtimes: just complete on mount.
      complete(id);
      if (cliff) setCliffhanger(id, cliff);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            complete(id);
            if (cliff) setCliffhanger(id, cliff);
            obs.disconnect();
            break;
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.01 },
    );
    obs.observe(el);
    return () => obs.disconnect();
    // bodyLoading included so the observer re-attaches AFTER the placeholder
    // is replaced with the real lesson body (the sentinel ref only exists
    // once the body has mounted). entry included so cliff text is fresh.
  }, [id, entryForId, isComplete, quizOpen, complete, setCliffhanger, currentPage, bodyLoading, entry]);

  // ── Derived render structures, memoized on the loaded body ───────────────
  // buildGroups + the page chunking + the per-page block count used to be
  // recomputed inline on EVERY render. They only actually change when the
  // lesson body (or the visible page) changes, so they're memoized here.
  // They live BEFORE the early returns to keep hook order stable; all of
  // them degrade gracefully while `entry` is still null.
  const sections = useMemo(
    () => (entry && Array.isArray(entry.sections) ? entry.sections : []),
    [entry],
  );
  // Group resolution. Practice-marker sections are dropped by buildGroups;
  // what's left is the visible-section list.
  const groups = useMemo(
    () => (sections.length > 0 ? buildGroups(sections) : []),
    [sections],
  );
  // Page chunking. Per mobile-ux-principles (cap progress indicators at ~5
  // segments), we chunk sections so most lessons land at 1-3 pages. Rule:
  //   ≤3 sections    → 1 page
  //   4-6 sections   → 2 pages (split as evenly as possible)
  //   7-9 sections   → 3 pages
  //   10+ sections   → 4 pages (still capped — long lessons get denser pages)
  const { pages, pageCount } = useMemo(() => {
    const count = Math.max(1, Math.min(4, Math.ceil(groups.length / 3)));
    const sectionsPerPage = Math.ceil(groups.length / count);
    const chunked = [];
    for (let i = 0; i < groups.length; i += sectionsPerPage) {
      chunked.push(groups.slice(i, i + sectionsPerPage));
    }
    if (chunked.length === 0) chunked.push([]);
    return { pages: chunked, pageCount: count };
  }, [groups]);
  // Clamp currentPage so we don't fall off the end if the lesson body changes.
  const safePage = Math.min(currentPage, pages.length - 1);
  const visiblePage = pages[safePage] || [];
  // Count the trackable block units on the visible page so the ProgressTrack
  // can render the right number of dots. One unit per section heading (if any)
  // plus one unit per body block. (buildGroups only emits { kind: 'section' }
  // groups, so there's no practice-group case here.) The matching
  // `data-block-idx` indices are assigned inside the render below so counter
  // math here MUST stay in sync with that render order.
  const pageBlockCount = useMemo(() => {
    let n = 0;
    for (const g of visiblePage) {
      if (g.section) {
        if (g.section.heading) n += 1;
        // deep sections render collapsed as ONE tracked unit (the expander);
        // their inner blocks aren't individually observed by the rail.
        if (g.section.deep) n += 1;
        else n += Array.isArray(g.section.body) ? g.section.body.length : 0;
      }
    }
    return n;
  }, [visiblePage]);

  // Keyboard shortcuts (Lesson). Lives BEFORE the early returns so the hook
  // call order stays stable across the loading / not-found branches. The
  // handlers read the memoized page count derived from `entry` — pre-load it
  // degrades to lesson-level prev/next (still useful), and after load they
  // page within the lesson before crossing to the next/prev lesson.
  useKeyboardShortcuts(
    {
      ArrowRight: () => {
        if (quizOpen) return;
        const isLastPage = currentPage >= pageCount - 1;
        if (!isLastPage) setCurrentPage(currentPage + 1);
        else if (found && found.next) nav(`/lesson/${found.next.id}`);
      },
      l: () => {
        if (quizOpen) return;
        const isLastPage = currentPage >= pageCount - 1;
        if (!isLastPage) setCurrentPage(currentPage + 1);
        else if (found && found.next) nav(`/lesson/${found.next.id}`);
      },
      ArrowLeft: () => {
        if (quizOpen) return;
        if (currentPage > 0) setCurrentPage(currentPage - 1);
        else if (found && found.prev) nav(`/lesson/${found.prev.id}`);
      },
      h: () => {
        if (quizOpen) return;
        if (currentPage > 0) setCurrentPage(currentPage - 1);
        else if (found && found.prev) nav(`/lesson/${found.prev.id}`);
      },
      m: () => {
        if (quizOpen) return;
        if (isComplete) return;
        complete(id);
        // Cliffhanger hook — mirror of the auto-complete IO path.
        const cliff = (entry && typeof entry.cliffhanger === 'string' && entry.cliffhanger.trim().length > 0)
          ? entry.cliffhanger.trim()
          : null;
        if (cliff) setCliffhanger(id, cliff);
      },
    },
    [id, currentPage, entry, found, isComplete, quizOpen, complete, setCliffhanger, nav],
  );

  if (!found) return <div className="screen"><p className="caption">Lesson not found.</p></div>;
  const { path, pathKey, lesson, next, prev, idx: lessonIdx, total: lessonTotal } = found;
  // `entry` is populated by the async loader above; on the first paint after a
  // navigation it can still be null (fresh path file in flight) or STALE —
  // the cached loader resolves in a microtask, so `entry` belongs to the
  // previous lesson until entryForId catches up. Show the placeholder in both
  // cases so lesson B never paints (or reconciles onto) lesson A's body.
  if (bodyLoading || entryForId !== id) {
    return <div className="screen"><p className="caption">Loading lesson…</p></div>;
  }
  const hasRich = sections.length > 0;

  // Math-quiz gating: keyed off the PATHS meta flag alone — the bank itself
  // loads on demand when the pane opens, so question counts aren't knowable
  // up front anymore. Every hasMathQuiz lesson is supposed to ship a bank;
  // if the loaded bank turns out empty the pane shows a quiet "unavailable"
  // state instead of crashing (or retroactively hiding the CTA).
  const quizAvailable = !!lesson.hasMathQuiz;
  const quizBankReady = !!(quizBankEntry && quizBankEntry.forId === id);
  const quizBank = quizBankReady ? quizBankEntry.bank : null;

  // Lesson-kind decorations.
  const isSdLesson = lesson.kind === 'sd' || lesson.sd === true;
  const isLab = lesson.kind === 'lab';

  // Analogy gating: opt-in via flag, OR membership in the MLOps / ML Eng
  // paths (the user-stated default for those tracks).
  const analogyEligible =
    lesson.analogyTemplate === true || pathKey === 'mlops' || pathKey === 'mleng';
  const analogy = analogyEligible ? ANALOGIES[id] : null;

  const markComplete = () => {
    if (isComplete) return;
    complete(id);
    // Same cliffhanger hook as the auto-complete IO path — if the lesson body
    // carries an unresolved question, stash it for tomorrow's first card.
    const cliff = (entry && typeof entry.cliffhanger === 'string' && entry.cliffhanger.trim().length > 0)
      ? entry.cliffhanger.trim()
      : null;
    if (cliff) setCliffhanger(id, cliff);
  };

  const handleQuizSkip = () => {
    setQuizOpen(false);
    markComplete();
  };
  const handleQuizComplete = () => {
    setQuizOpen(false);
    markComplete();
  };

  // Option B Inline header card (Mockup 1, Proposal 1).
  //
  // Top kicker (mono uppercase): "PATH · SECTION › LESSON N OF M". If the
  // lesson doesn't carry a `section` attribute we drop the "· SECTION" segment
  // and render just "PATH › LESSON N OF M". The SD-callout and Lab-banner
  // kicker variants from Agent I are CONSUMED into this top line — we don't
  // render a separate "◇ SD INSIGHT" / "⚒ LAB" stripe above the title anymore.
  //
  // Big serif title comes next, then optional tagline (used by SD lessons),
  // then a small mono bottom row with duration + DEEP / ∑ MATH / ◇ SD chips.
  // PAGE k/m intentionally omitted: the lesson body is a single scroll.
  // Group resolution, page chunking, and the per-page block count are
  // memoized ABOVE the early returns (see the "Derived render structures"
  // block) — `groups`, `pages`, `pageCount`, `safePage`, `visiblePage`, and
  // `pageBlockCount` are already in scope here.
  const isFirstPage = safePage === 0;
  const isLastPage = safePage === pages.length - 1;

  const pathSegment = `${path.icon} ${path.name.toUpperCase()}`;
  const sectionSegment = lesson.section ? ` · ${lesson.section}` : '';
  const kickerString = `${pathSegment}${sectionSegment} › LESSON ${lessonIdx + 1} OF ${lessonTotal}`;
  const kickerColor = isSdLesson
    ? 'var(--el-water)'
    : isLab
    ? 'var(--accent-amber)'
    : 'var(--text-tertiary)';
  const chips = [];
  if (isLab) chips.push('⚒ LAB');
  if (isSdLesson) chips.push('◇ SD INSIGHT');
  if (lesson.deep) chips.push('◆ DEEP');
  if (lesson.hasMathQuiz) chips.push('∑ MATH');
  if (!isSdLesson && lesson.sd) chips.push('◇ SD INSIGHT');
  const durationText = lesson.duration || `${lesson.min} min read`;
  const bottomRow = chips.length ? `${durationText} · ${chips.join(' · ')}` : durationText;

  const headerCard = (
    <div className={`card ${isSdLesson ? 'sd-callout' : ''} ${isLab ? 'lab-banner' : ''}`}>
      <div
        className="mono"
        style={{
          fontSize: 10,
          color: kickerColor,
          letterSpacing: '.12em',
          marginBottom: 8,
          textTransform: 'uppercase',
        }}
      >
        {kickerString}
      </div>
      <h1
        className="h2"
        style={{ fontFamily: 'var(--font-serif)', fontSize: 22, lineHeight: 1.25 }}
      >
        {lesson.title}
      </h1>
      {lesson.tagline && (
        <div className="caption" style={{ marginTop: 6 }}>
          {lesson.tagline}
        </div>
      )}
      <div
        className="mono"
        style={{
          fontSize: 10,
          color: 'var(--text-tertiary)',
          marginTop: 10,
          letterSpacing: '.08em',
        }}
      >
        {bottomRow}
      </div>
      {pageCount > 1 && (
        <PageDots
          current={safePage}
          total={pageCount}
        />
      )}
    </div>
  );

  // While the quiz is open it BECOMES the primary content of the screen.
  // We keep the header card for context but hide the lesson body, math CTA,
  // and the bottom "Mark complete" button. Skipping or finishing the quiz
  // marks the lesson complete and re-shows the body.
  //
  // The bank arrives async (dynamic import, see the loader effect above), so
  // the pane has three states: loading (import in flight), playable (bank
  // entry with questions), and a quiet "unavailable" fallback for the
  // shouldn't-happen case of a hasMathQuiz lesson with no/empty bank.
  if (quizOpen && quizAvailable) {
    const quizPlayable =
      quizBankReady && Array.isArray(quizBank?.questions) && quizBank.questions.length > 0;
    return (
      <div className="screen fade-in">
        {headerCard}
        {!quizBankReady ? (
          <div className="card">
            <p className="caption">Loading quiz…</p>
          </div>
        ) : quizPlayable ? (
          <MathQuiz
            key={id}
            lessonId={id}
            title={quizBank.title || lesson.title}
            questions={quizBank.questions}
            onSkip={handleQuizSkip}
            onComplete={handleQuizComplete}
          />
        ) : (
          <div className="card">
            <p className="caption" style={{ marginBottom: 12 }}>
              This quiz isn&apos;t available right now — head back to the lesson and
              keep moving.
            </p>
            <button
              className="btn btn-block"
              onClick={() => setQuizOpen(false)}
            >
              ← Back to the lesson
            </button>
          </div>
        )}
        <CelebrationMoment />
        <CodeCopyToast />
      </div>
    );
  }

  return (
    <div className="screen fade-in">
      {headerCard}
      {/* XP / level / badge celebration overlay. Fires on lesson auto-
          complete (+5 XP), MathQuiz correct (+8 / +10 recovered), etc. */}
      <CelebrationMoment />
      {/* Click-to-copy toast — singleton mount, listens for window
          'codechip-copy' events fired by any <CodeChip> in the tree. */}
      <CodeCopyToast />

      {isLab && Array.isArray(lesson.milestones) && lesson.milestones.length > 0 && (
        <LabMilestoneTracker lessonId={id} milestones={lesson.milestones} />
      )}

      {analogy && (
        <div className="card analogy-card">
          <div
            className="mono"
            style={{ fontSize: 9, color: 'var(--accent-amber)', letterSpacing: '.18em' }}
          >
            [ ANALOGY ]
          </div>
          {analogy.tagline && (
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 14,
                color: 'var(--text-primary)',
                marginTop: 6,
                marginBottom: 8,
              }}
            >
              {analogy.tagline}
            </div>
          )}
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 15,
              lineHeight: 1.65,
              color: 'var(--text-secondary)',
              margin: 0,
            }}
          >
            {analogy.body}
          </p>
        </div>
      )}

      {hasRich && visiblePage.length > 0 ? (
        <div className={`card ${isSdLesson ? 'sd-callout' : ''}`}>
          {pages.length > 1 && (
            <div
              className="mono"
              style={{
                fontSize: 9,
                letterSpacing: '.18em',
                color: 'var(--text-tertiary)',
                marginBottom: 8,
              }}
            >
              PAGE {safePage + 1} / {pages.length}
            </div>
          )}
          {/* Per-block micro-progress. Hidden on tiny pages (<3 blocks) where
              the track would be more noise than signal. Lives INSIDE the body
              card so it scrolls away with the content (not sticky-to-viewport).
              The rail owns the IntersectionObserver + activeIdx state, so
              scroll ticks re-render only it — not this whole tree. The key
              remounts it per lesson/page, which both resets activeIdx to 0
              and re-attaches the observer to the fresh DOM nodes. */}
          {pageBlockCount >= 3 && (
            <LessonProgressRail
              key={`rail-${id}-${safePage}`}
              blockRefs={blockRefs}
              count={pageBlockCount}
            />
          )}
          {/* key={id}: hard-remount the whole body subtree per lesson.
              Sections/blocks below are keyed by POSITION only, so on
              same-path navigation (cached loader → the loading placeholder
              may never commit) React would otherwise reconcile lesson B onto
              lesson A's mounted block instances — leaking locked PredictBlock
              picks and PracticeBlock editor text across lessons. */}
          <div className="lesson-body" key={id}>
            {/* Learning objectives — the goal-frame that turns reading into
                pursuit. Authored as body.objectives: [strings]; first page
                only (it's an expectation-setter, not a recurring banner). */}
            {safePage === 0 && Array.isArray(entry.objectives) && entry.objectives.length > 0 && (
              <div className="lesson-objectives" style={{
                border: '1px solid var(--border-default)',
                borderLeft: '3px solid var(--accent-amber)',
                borderRadius: 10, padding: '10px 14px', marginBottom: 16,
              }}>
                <div className="mono" style={{ fontSize: 9, letterSpacing: '.16em', color: 'var(--accent-amber)', marginBottom: 4 }}>
                  AFTER THIS YOU CAN
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, lineHeight: 1.6 }}>
                  {entry.objectives.slice(0, 4).map((o, i) => (
                    <li key={i}>{renderInline(o, `obj-${i}`)}</li>
                  ))}
                </ul>
              </div>
            )}
            {(() => {
              // Reset the ref array each render — the visible page's block
              // count + ordering changes when the user pages forward/back, so
              // stale refs from a longer prior page would mis-target the
              // observer. We re-allocate to exactly pageBlockCount slots and
              // hand out indices in render order; the IntersectionObserver
              // effect picks them up on the next paint.
              blockRefs.current = new Array(pageBlockCount).fill(null);
              let cursor = 0;
              const trackedRef = (i) => (el) => { blockRefs.current[i] = el; };
              return visiblePage.map((g, gidx) => {
                const isLastOnPage = gidx === visiblePage.length - 1;
                const { section: sec, idx: sidx } = g;
                const bodyArr = sec.body || [];
                return (
                  <section key={sidx} style={{ marginBottom: isLastOnPage ? 0 : 18 }}>
                    {sec.heading && (() => {
                      const bi = cursor++;
                      return (
                        <h3
                          ref={trackedRef(bi)}
                          data-block-idx={bi}
                          style={{ marginTop: gidx === 0 ? 0 : 16 }}
                        >
                          {renderInline(sec.heading, `sh-${sidx}`)}
                        </h3>
                      );
                    })()}
                    {/* "The one thing" — a single-sentence takeaway chip under
                        the heading, so a skimmer keeps the section's spine
                        even when they skip the detail (density fix for the
                        newcomer ramp). */}
                    {sec.takeaway && (
                      <div className="lesson-takeaway">
                        <span className="lesson-takeaway-kicker mono">☝ THE ONE THING</span>
                        <span className="lesson-takeaway-text">{renderInline(sec.takeaway, `tk-${sidx}`)}</span>
                      </div>
                    )}
                    {sec.deep ? (() => {
                      // Deep section: nice-to-know material collapses behind
                      // an expander so a first pass reads only the core.
                      // ONE tracked unit for the progress rail.
                      const bi = cursor++;
                      return (
                        <div ref={trackedRef(bi)} data-block-idx={bi} className="lesson-block-wrap">
                          <DeepSection count={bodyArr.length}>
                            {bodyArr.map((b, bidx) => (
                              <div key={`${sidx}-${bidx}`} className="lesson-block-wrap">
                                <Block block={b} idx={`${sidx}-${bidx}`} lessonId={id} />
                              </div>
                            ))}
                          </DeepSection>
                        </div>
                      );
                    })() : bodyArr.map((b, bidx) => {
                      const bi = cursor++;
                      return (
                        <div
                          key={`${sidx}-${bidx}`}
                          ref={trackedRef(bi)}
                          data-block-idx={bi}
                          className="lesson-block-wrap"
                        >
                          <Block block={b} idx={`${sidx}-${bidx}`} lessonId={id} />
                        </div>
                      );
                    })}
                  </section>
                );
              });
            })()}
          </div>
        </div>
      ) : !hasRich ? (
        <div className="card">
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
            The full body for this lesson hasn't been authored yet. Mark it complete to keep
            moving along your path — content will appear here when it's ready.
          </p>
        </div>
      ) : null}

      {/* Math quiz CTA + completion card only appear on the LAST page — they're
          the "you reached the end" payoff, not a per-section thing. */}
      {isLastPage && quizAvailable && (
        <div className="card" style={{ borderLeft: '3px solid var(--accent-amber)' }}>
          <div
            className="mono"
            style={{ fontSize: 9, color: 'var(--accent-amber)', letterSpacing: '.18em' }}
          >
            ∑ MATH FOR ML · 5Q · SKIPPABLE
          </div>
          <p
            style={{
              fontSize: 13,
              margin: '6px 0 12px',
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
            }}
          >
            Five no-penalty multiple-choice questions on the formulas from this lesson.
            Skip is always there in the top-right.
          </p>
          <button
            className="btn btn-primary btn-block"
            onClick={() => setQuizOpen(true)}
          >
            Take the quiz →
          </button>
        </div>
      )}

      {/* On-demand drill — reps whenever the learner wants them, decoupled
          from the review schedule (no XP, no due-date changes; see
          PracticeLesson.jsx). Last page only, quiet ghost style so the
          primary complete/continue flow stays the one CTA. */}
      {isLastPage && (
        <button
          type="button"
          className="btn btn-ghost btn-block"
          style={{ fontSize: 12, opacity: 0.85 }}
          onClick={() => nav(`/practice/${id}`)}
        >
          🎯 Drill this lesson — quick practice, no XP
        </button>
      )}

      {isLastPage && isComplete && (() => {
        // Path-completion hand-off: when this is the LAST lesson of the current
        // path AND every lesson in the path is now complete, show a celebratory
        // variant before the standard Back/Continue footer (Continue will then
        // cross into the first lesson of the next path via locate()).
        const allDone = path.lessons.every((l) => completedMap[l.id]);
        const isPathComplete = lessonIdx === lessonTotal - 1 && allDone;
        const nextPathName = next && next.id
          ? (() => {
              for (const k of Object.keys(PATHS)) {
                if (PATHS[k].lessons.some((l) => l.id === next.id) && k !== pathKey) {
                  return PATHS[k].name;
                }
              }
              return null;
            })()
          : null;
        return isPathComplete ? (
          <div
            className="card fade-in lesson-complete-card lesson-path-complete-card"
            style={{ borderColor: 'var(--accent-amber)', background: 'rgba(245,184,66,.10)' }}
          >
            <div
              className="mono"
              style={{ fontSize: 9, color: 'var(--accent-amber)', letterSpacing: '.16em' }}
            >
              ✦ {path.name.toUpperCase()} PATH COMPLETE
            </div>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 18,
                lineHeight: 1.3,
                color: 'var(--text-primary)',
                marginTop: 8,
              }}
            >
              You finished {path.name}. {nextPathName ? `Up next: ${nextPathName}.` : 'Every path is complete — that\'s the whole curriculum.'}
            </div>
            <div className="caption" style={{ marginTop: 6 }}>
              Your Byte Beast just earned its next tier for this path. Tap Continue below to keep moving.
            </div>
          </div>
        ) : (
          <div
            className="card fade-in lesson-complete-card"
            style={{ borderColor: 'var(--status-success)', background: 'rgba(143,168,118,.08)' }}
          >
            <div
              className="mono"
              style={{ fontSize: 9, color: 'var(--status-success)', letterSpacing: '.12em' }}
            >
              ✓ LESSON COMPLETE
            </div>
          </div>
        );
      })()}

      {/* Smart nav footer — one bar that adapts. On inner pages it's Prev/Next
          PAGE (paging inside this lesson). On the first page Prev rolls back to
          the previous LESSON; on the last page Next rolls forward to the next
          LESSON (crossing path boundaries via locate()). Middle slot shows the
          page indicator. The "Continue → next" button label adapts so the user
          always sees what tapping forward will do. */}
      <div className="lesson-nav">
        {(() => {
          // Prev side — collapse to previous lesson when at page 0.
          const prevDisabled = isFirstPage && !prev;
          const onPrev = () => {
            if (!isFirstPage) setCurrentPage(safePage - 1);
            else if (prev) nav(`/lesson/${prev.id}`);
          };
          return (
            <button
              className="btn lesson-nav-back"
              disabled={prevDisabled}
              onClick={onPrev}
              aria-label={!isFirstPage ? 'Previous page' : (prev ? `Back to ${prev.title}` : 'No previous lesson')}
            >
              <span className="lesson-nav-icon">←</span>
              <span className="lesson-nav-label">Back</span>
            </button>
          );
        })()}

        {pageCount > 1 && (
          <div className="lesson-nav-pageindicator mono">
            {safePage + 1} / {pageCount}
          </div>
        )}

        {(() => {
          // Next side — collapse to next lesson when at the last page.
          const isEdge = isLastPage;
          const nextText = (isEdge && !next) ? 'Done' : 'Continue';
          const onNext = () => {
            if (!isEdge) setCurrentPage(safePage + 1);
            else if (next) nav(`/lesson/${next.id}`);
            else nav('/roadmap');
          };
          return (
            <button
              className="btn btn-primary lesson-nav-continue"
              onClick={onNext}
              aria-label={!isEdge ? 'Next page' : (next ? `Continue to ${next.title}` : 'Back to the map')}
            >
              <span className="lesson-nav-label">{nextText}</span>
              <span className="lesson-nav-icon">→</span>
            </button>
          );
        })()}
      </div>

      {/*
       * Auto-complete sentinel (Mockup 1, Proposal 2). When this div scrolls
       * into view the IntersectionObserver effect above calls complete(id).
       * No standalone "Mark complete" button — scrolling to the bottom is
       * the completion gesture. Math-quiz lessons still route through
       * Skip/Finish (the observer self-disables while the quiz pane is open).
       */}
      {isLastPage && (
        <div ref={endRef} aria-hidden="true" style={{ height: 1 }} />
      )}
    </div>
  );
}

// LessonProgressRail — owns the per-block IntersectionObserver and the
// activeIdx state it drives, so scroll ticks re-render ONLY this small track.
// (The observer used to call setState on the root Lesson component, which
// re-rendered the header, every block, and every SVG on each scroll step.
// Blocks never consume activeIdx — they only carry the data-block-idx
// attributes this rail observes — so the state can live entirely down here.)
//
// The render site keys this component by lesson id + page: remounting on
// either change is what resets activeIdx to 0 (the old root effect's job)
// and re-attaches the observer to the fresh DOM nodes. The parent assigns
// blockRefs.current during the same commit; refs populate before child
// effects fire, so the mount effect always sees the final node list.
function LessonProgressRail({ blockRefs, count }) {
  const [activeIdx, setActiveIdx] = useState(0);

  // IntersectionObserver for the per-block ProgressTrack. We observe every
  // top-level block container that the renderer tagged with data-block-idx.
  // rootMargin '-30% 0px -30% 0px' creates a thin horizontal band in the
  // middle 40% of the viewport — a block is considered "current" once it
  // enters that band, which feels right when slowly scrolling. threshold 0
  // means any intersection within that band counts (we don't need a fixed %).
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const els = blockRefs.current.filter(Boolean);
    if (els.length === 0) return undefined;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const raw = e.target.dataset.blockIdx;
            const idx = raw == null ? NaN : parseInt(raw, 10);
            if (!Number.isNaN(idx)) setActiveIdx(idx);
          }
        });
      },
      { rootMargin: '-30% 0px -30% 0px', threshold: 0 },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [blockRefs, count]);

  return <ProgressTrack count={count} activeIdx={activeIdx} />;
}

// ProgressTrack — per-block micro-progress row. One small bar per top-level
// content block on the current page. Past blocks (above viewport) fill solid
// amber, the current block (in the middle scroll band) shows a dimmed amber,
// upcoming blocks are subtle border-grey. Converts a long lesson page from
// a "wall of text" into a sequence of small visible wins for ADHD-prone
// readers (deep-research finding: visible micro-progress combats scroll
// fatigue). The track lives INSIDE the lesson body card so it scrolls away
// with the page — intentionally not sticky-to-viewport.
function ProgressTrack({ count, activeIdx }) {
  if (!count || count < 1) return null;
  return (
    <div
      className="lesson-progress-track"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={count}
      aria-valuenow={Math.min(activeIdx + 1, count)}
      aria-label={`Reading progress: block ${Math.min(activeIdx + 1, count)} of ${count}`}
    >
      {Array.from({ length: count }).map((_, i) => {
        let cls = 'lesson-progress-dot';
        if (i < activeIdx) cls += ' is-past';
        else if (i === activeIdx) cls += ' is-current';
        return <span key={i} className={cls} aria-hidden="true" />;
      })}
    </div>
  );
}

// PageDots — small segmented indicator in the header card showing which page
// of the lesson is currently visible. Mockup 1 Proposal 1 calls for "PAGE k/m"
// + a row of N pills. Past pills are filled (already-read), the current pill
// uses the accent color, future pills are dimmed. Tapping a pill jumps to
// that page; useful for re-reading a section without paging through.
function PageDots({ current, total }) {
  // Cap rendered pills at 12 so an unusually long lesson doesn't make the
  // header card grow forever — for >12 pages we just show the numeric counter
  // (the PAGE k/m text in the body still appears).
  if (total > 12) return null;
  return (
    <div
      role="tablist"
      aria-label={`Lesson page ${current + 1} of ${total}`}
      style={{
        display: 'flex',
        gap: 4,
        marginTop: 10,
      }}
    >
      {Array.from({ length: total }).map((_, i) => {
        const isCurrent = i === current;
        const isPast = i < current;
        return (
          <span
            key={i}
            aria-current={isCurrent ? 'page' : undefined}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: isCurrent
                ? 'var(--accent-amber)'
                : isPast
                  ? 'var(--accent-amber-dim)'
                  : 'var(--border-subtle)',
              transition: 'background 0.15s ease',
            }}
          />
        );
      })}
    </div>
  );
}

// LabMilestoneTracker — prominent progress card shown at the top of any lab
// page. Each milestone is a checkbox row: tap to toggle done. Differs from
// Library's LabCard accordion in that it stays expanded by default (a lab
// page is FOR working through the milestones), shows a real progress bar,
// and includes a "build it locally" reminder consistent with the new
// lessons-are-reading / labs-are-doing split.
function LabMilestoneTracker({ lessonId, milestones }) {
  const labMilestonesMap = useStore((s) => s.labMilestones) || {};
  const setLabMilestone = useStore((s) => s.setLabMilestone);
  const prog = labProgressFromContent(lessonId, labMilestonesMap);
  const flags = labMilestonesMap[lessonId] || {};
  const toggle = (mid, done) => setLabMilestone && setLabMilestone(lessonId, mid, !done);
  return (
    <div className="card lab-milestone-tracker">
      <div className="row" style={{ marginBottom: 8, alignItems: 'center' }}>
        <span
          className="mono"
          style={{
            fontSize: 10,
            letterSpacing: '.16em',
            color: 'var(--accent-amber)',
            textTransform: 'uppercase',
          }}
        >
          ⚒ LAB MILESTONES
        </span>
        <span className="spacer" />
        <span
          className="mono"
          style={{ fontSize: 10, color: 'var(--text-tertiary)' }}
        >
          {prog.done} / {prog.total} · {Math.round(prog.pct * 100)}%
        </span>
      </div>
      <div className="progress" style={{ marginBottom: 12 }}>
        <i style={{ width: `${prog.pct * 100}%` }} />
      </div>
      <p
        className="caption"
        style={{ marginTop: 0, marginBottom: 12, fontSize: 12 }}
      >
        Build this on your own machine — VS Code, your terminal, your tools. Check off each
        milestone as you finish it; progress saves locally.
      </p>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {milestones.map((m, idx) => {
          const done = !!flags[m.id];
          const isNext = !done && idx === prog.nextIdx;
          return (
            <li
              key={m.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                margin: '4px 0',
                background: done
                  ? 'rgba(143,168,118,.08)'
                  : isNext
                    ? 'var(--accent-amber-bg)'
                    : 'var(--bg-card)',
                border: `1px solid ${done ? 'var(--status-success)' : isNext ? 'var(--accent-amber)' : 'var(--border-subtle)'}`,
                borderRadius: 8,
                cursor: 'pointer',
              }}
              onClick={() => toggle(m.id, done)}
            >
              <input
                type="checkbox"
                checked={done}
                onChange={() => toggle(m.id, done)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Milestone ${idx + 1}: ${m.title}`}
                style={{ accentColor: 'var(--accent-amber)', cursor: 'pointer' }}
              />
              <span
                className="mono"
                style={{
                  fontSize: 10,
                  color: done ? 'var(--status-success)' : isNext ? 'var(--accent-amber)' : 'var(--text-tertiary)',
                  letterSpacing: '.08em',
                  flex: '0 0 32px',
                }}
              >
                M{idx + 1}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: done ? 400 : 500,
                  color: done ? 'var(--text-tertiary)' : 'var(--text-primary)',
                  textDecoration: done ? 'line-through' : 'none',
                  flex: '1 1 auto',
                  lineHeight: 1.35,
                }}
              >
                {m.title}
              </span>
              {done && (
                <span style={{ color: 'var(--status-success)', fontWeight: 600 }}>✓</span>
              )}
              {isNext && !done && (
                <span
                  className="mono"
                  style={{
                    fontSize: 9,
                    color: 'var(--accent-amber)',
                    letterSpacing: '.1em',
                  }}
                >
                  NEXT
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {prog.done === prog.total && prog.total > 0 && (
        <div
          className="caption"
          style={{
            marginTop: 12,
            color: 'var(--status-success)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '.12em',
          }}
        >
          ✓ ALL MILESTONES COMPLETE — scroll to the bottom to finish the lab.
        </div>
      )}
    </div>
  );
}
