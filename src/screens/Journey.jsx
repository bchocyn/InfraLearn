// Journey — the province chapter road (journey design §5, forcing economy
// §10). Five chapters per province; each needs its HARD learning gate met
// (journeyGate — no ember balance can buy past one) plus an ember entry fee
// (3–8 ⟡, the pacing lock). A paid chapter presents a micro-encounter: one
// quiz-bank question in story costume. First-try clears earn 3★; a miss
// holds the road until a 1 ⟡ retry — which draws a FRESH question, so the
// encounter can't be brute-forced.
//
// Lazy route (/journey). The question bank is dynamically imported with the
// same module-cache pattern as Home's DailyPractice, keeping the bank out of
// every eager path.

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, journeyGate } from '../store/useStore.js';
import { PROVINCES, FIVE_LAPSES, JOURNEY_CHAPTERS } from '../data/lore.js';
import { PATHS, PATH_KEYS } from '../data/content.js';
import FeedbackPanel from '../components/FeedbackPanel.jsx';
import CelebrationMoment from '../components/CelebrationMoment.jsx';

// Module-level cache for the lazily-loaded question bank (same pattern as
// DailyPractice in Home.jsx — see the code-split warning in dailyQuestions.js).
let bankMod = null;

export default function Journey() {
  const nav = useNavigate();
  const activePath = useStore((s) => s.activePath);
  const embers = useStore((s) => s.embers) || 0;
  const [province, setProvince] = useState(activePath);
  const prov = PROVINCES[province] || PROVINCES.devops;
  const lapse = FIVE_LAPSES[prov.lapse];
  const path = PATHS[province] || PATHS.devops;

  return (
    <div className="screen fade-in">
      <CelebrationMoment />
      <button type="button" className="btn" onClick={() => nav('/')} style={{ marginBottom: 12 }}>
        ← Home
      </button>
      <div className="row" style={{ alignItems: 'flex-start', gap: 10 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="kicker">🗺 THE JOURNEY · {path.icon} {path.name?.toUpperCase()}</div>
          <h1 className="h1" style={{ marginBottom: 2 }}>{prov.name}<span className="dot">.</span></h1>
          <p className="caption" style={{ marginBottom: 4 }}>{prov.epithet}</p>
        </div>
        <span className="ember-header-chip" role="status" aria-label={`Embers: ${embers}`}>⟡ {embers}</span>
      </div>

      {/* Province switcher — icon pills, current one amber. */}
      <div className="journey-prov-row" role="tablist" aria-label="Province">
        {PATH_KEYS.map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={k === province}
            className={`journey-prov-pill${k === province ? ' is-active' : ''}`}
            onClick={() => setProvince(k)}
            title={PROVINCES[k]?.name}
          >
            {PATHS[k]?.icon}
          </button>
        ))}
      </div>

      <ChapterRoad province={province} lapse={lapse} prov={prov} embers={embers} />
    </div>
  );
}

function ChapterRoad({ province, prov, lapse, embers }) {
  const journey = useStore((s) => s.journey) || {};
  // journeyGate reads completed/beastTiers/streakHighWater — subscribe so
  // gates re-check live when progress lands while the screen is open.
  const completed = useStore((s) => s.completed);
  const beastTiers = useStore((s) => s.beastTiers);
  const streakHighWater = useStore((s) => s.streakHighWater);
  const enterChapter = useStore((s) => s.enterChapter);
  const cur = journey[province] || { chapter: 0, paid: 0, stars: 0 };
  const gateState = { completed, beastTiers, streakHighWater };

  return (
    <div className="journey-road">
      {cur.stars > 0 && (
        <div className="kicker" style={{ marginBottom: 8 }}>
          <span className="journey-stars">★ {cur.stars}</span> · {cur.chapter}/{JOURNEY_CHAPTERS.length} CHAPTERS
        </div>
      )}
      {JOURNEY_CHAPTERS.map((ch) => {
        const done = cur.chapter >= ch.n;
        const paidOpen = !done && cur.paid >= ch.n;
        const isNext = !done && !paidOpen && ch.n === cur.chapter + 1;
        const gate = journeyGate(province, ch.n, gateState);
        return (
          <div key={ch.n} className={`card journey-ch${done ? ' journey-ch-done' : ''}${isNext && !gate.met ? ' journey-ch-locked' : ''}`}>
            <div className="kicker journey-ch-kicker">
              {done ? '✓' : paidOpen ? '◈' : gate.met && isNext ? '▸' : '🔒'} CHAPTER {ch.n} · {ch.title.toUpperCase()}
            </div>
            {done && <p className="codex-body">{ch.beat(prov, lapse)}</p>}
            {paidOpen && <Encounter province={province} chapter={ch} prov={prov} lapse={lapse} embers={embers} />}
            {isNext && (
              gate.met ? (
                <EnterButton province={province} ch={ch} embers={embers} enterChapter={enterChapter} />
              ) : (
                <p className="codex-hint">🔒 {gate.label} — the road only opens to real progress.</p>
              )
            )}
            {!done && !paidOpen && !isNext && (
              <p className="codex-hint journey-far">The road continues beyond Chapter {cur.chapter + 1}…</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function EnterButton({ province, ch, embers, enterChapter }) {
  const short = embers < ch.cost;
  return (
    <div>
      <p className="codex-hint" style={{ marginBottom: 8 }}>Gate met ✓ — the threshold asks its toll.</p>
      <button
        type="button"
        className="btn btn-primary"
        disabled={short}
        onClick={() => enterChapter(province, ch.n)}
      >
        Enter — {ch.cost} ⟡
      </button>
      {short && (
        <p className="codex-hint" style={{ marginTop: 6 }}>
          Not enough embers ({embers}/{ch.cost}). Lessons +3 ⟡ · reviews +1 ⟡ · daily practice +2 ⟡.
        </p>
      )}
    </div>
  );
}

// The micro-encounter: a null-wraith bars the way with one question from the
// province's own bank. Right → chapter complete (3★ first try, 2★ second,
// 1★ after). Wrong → the wraith holds; a retry costs 1 ⟡ and draws a fresh
// question. FeedbackPanel renders the honest whyCorrect/whyWrong either way
// — the encounter teaches even when it blocks.
function Encounter({ province, chapter, prov, lapse }) {
  const completeChapter = useStore((s) => s.completeChapter);
  const spendEmbers = useStore((s) => s.spendEmbers);
  const embers = useStore((s) => s.embers) || 0;
  const [attempt, setAttempt] = useState(0);
  const [picked, setPicked] = useState(null);
  const [bank, setBank] = useState(() => bankMod);

  useEffect(() => {
    let cancelled = false;
    if (bankMod) { setBank(bankMod); return undefined; }
    import('../data/dailyQuestions.js').then((m) => {
      bankMod = m;
      if (!cancelled) setBank(m);
    });
    return () => { cancelled = true; };
  }, []);

  if (!bank) {
    return <p className="codex-hint" aria-busy="true">The wraith coalesces…</p>;
  }
  const Q = bank.pickEncounterQuestion(province, chapter.n, attempt);
  if (!Q) return <p className="codex-hint">The road is strangely clear. Walk on.</p>;

  const answered = picked != null;
  const correct = answered && picked === Q.answer;
  const stars = attempt === 0 ? 3 : attempt === 1 ? 2 : 1;

  const choose = (i) => {
    if (answered) return;
    setPicked(i);
  };
  // Completion waits for the Continue click so the FeedbackPanel's
  // whyCorrect gets read before the story beat replaces the encounter.
  const advance = () => completeChapter(province, chapter.n, stars);
  const retry = () => {
    if (!spendEmbers(1)) return;
    setAttempt((a) => a + 1);
    setPicked(null);
  };

  return (
    <div>
      <p className="journey-wraith">
        A null-wraith bars the way through {prov.name}
        {lapse ? ` — ${lapse.name}'s work, no doubt` : ''}. It hisses a question:
      </p>
      <p style={{ fontSize: 14, fontWeight: 500, margin: '0 0 10px' }}>{Q.q}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {Q.opts.map((o, i) => {
          let cls = 'btn dp-option';
          if (answered && i === Q.answer) cls += ' dp-correct';
          else if (answered && i === picked) cls += ' dp-wrong';
          return (
            <button key={i} className={cls} disabled={answered} onClick={() => choose(i)}>
              <span className="dp-letter">{String.fromCharCode(65 + i)}</span>
              <span className="dp-text">{o}</span>
            </button>
          );
        })}
      </div>
      {answered && <FeedbackPanel question={Q} picked={picked} />}
      {answered && correct && (
        <div style={{ marginTop: 10 }}>
          <p className="codex-hint" style={{ marginBottom: 6 }}>
            The wraith thins to nothing. The way opens — {'★'.repeat(stars)} earned.
          </p>
          <button type="button" className="btn btn-primary" onClick={advance}>
            Walk on →
          </button>
        </div>
      )}
      {answered && !correct && (
        <div style={{ marginTop: 10 }}>
          <p className="codex-hint" style={{ marginBottom: 6 }}>
            The wraith holds the road. {lapse ? `“${lapse.voice}”` : ''}
          </p>
          <button type="button" className="btn" disabled={embers < 1} onClick={retry}>
            Press again — 1 ⟡ {embers < 1 ? '(no embers)' : ''}
          </button>
        </div>
      )}
    </div>
  );
}
