import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore.js';
import { PATHS } from '../data/content.js';

// Each project's guidance level — an explicit `guidance` on the lesson entry,
// else a kind-based default (design challenges read as 'open', build labs as
// 'semi'). The Projects screen is ordered as a ramp from guided to open.
function guidanceOf(l) {
  if (l.guidance === 'guided' || l.guidance === 'semi' || l.guidance === 'open') return l.guidance;
  return l.kind === 'sd' ? 'open' : 'semi';
}

// The buildable "projects" are lessons tagged kind:'lab' or kind:'sd', pulled
// straight from PATHS and deduped by id.
function collectProjects() {
  const seen = new Map();
  for (const [pathKey, path] of Object.entries(PATHS)) {
    for (const l of path.lessons || []) {
      if (l.kind !== 'lab' && l.kind !== 'sd') continue;
      if (!seen.has(l.id)) {
        seen.set(l.id, { ...l, guidance: guidanceOf(l), pathName: path.name || pathKey, pathIcon: path.icon || '' });
      }
    }
  }
  return [...seen.values()];
}

const TIER_RANK = { junior: 0, senior: 1, staff: 2 };

function ProjectCard({ l, done, onOpen }) {
  return (
    <button type="button" className="project-card" onClick={onOpen}>
      <div className="project-card-top">
        <span className={`project-kind project-kind-${l.kind}`}>
          {l.kind === 'lab' ? '🛠 LAB' : '📐 DESIGN'}
        </span>
        <span className="spacer" />
        {done && <span className="project-done">✓ DONE</span>}
        {l.tierLevel && <span className="project-tier">{l.tierLevel}</span>}
      </div>
      <div className="project-title">{l.title}</div>
      {(l.tagline || l.section) && (
        <div className="project-tagline">{l.tagline || l.section}</div>
      )}
      <div className="project-meta mono">
        <span>{l.pathIcon} {l.pathName}</span>
        {l.duration ? <span>· {l.duration}</span> : (l.min ? <span>· {l.min} min</span> : null)}
      </div>
    </button>
  );
}

// The ramp: a guided on-ramp → build-it-yourself → architect solo. Scaffolding
// fades as you go — the whole point is to end up able to design without it.
const RAMP = [
  { key: 'guided', kicker: '🪜 Guided — start here', blurb: 'Step-by-step build-alongs. Follow along, then build it for real in VS Code.' },
  { key: 'semi', kicker: '🔨 Build it yourself', blurb: 'Requirements + success criteria — you decide how to build it.' },
  { key: 'open', kicker: '📐 Architect challenges', blurb: 'A spec and the trade-offs. Design it solo and defend your choices — no scaffolding.' },
];

export default function Projects() {
  const nav = useNavigate();
  const completed = useStore((s) => s.completed);

  const { groups, doneCount, total } = useMemo(() => {
    const all = collectProjects();
    const byTier = (a, b) => (TIER_RANK[a.tierLevel] ?? 1) - (TIER_RANK[b.tierLevel] ?? 1);
    return {
      groups: RAMP.map((r) => ({ ...r, items: all.filter((l) => l.guidance === r.key).sort(byTier) })),
      doneCount: all.filter((l) => completed && completed[l.id]).length,
      total: all.length,
    };
  }, [completed]);

  const isDone = (l) => !!(completed && completed[l.id]);
  const open = (l) => nav(`/lesson/${l.id}`);

  return (
    <div className="projects-screen">
      <header className="projects-header">
        <h1 className="projects-h1">Projects</h1>
        <p className="projects-sub">
          A ramp from guided build-alongs to architecting on your own — the skill that outlasts any single lesson.
        </p>
        <div className="projects-progress mono">{doneCount} / {total} shipped</div>
      </header>

      {groups.map((g) => (g.items.length > 0 ? (
        <section className="projects-section" key={g.key}>
          <div className="kicker projects-kicker">{g.kicker}</div>
          <p className="projects-section-blurb">{g.blurb}</p>
          <div className="projects-grid">
            {g.items.map((l) => <ProjectCard key={l.id} l={l} done={isDone(l)} onOpen={() => open(l)} />)}
          </div>
        </section>
      ) : null))}
    </div>
  );
}
