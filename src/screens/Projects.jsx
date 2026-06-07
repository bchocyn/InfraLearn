import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore.js';
import { PATHS } from '../data/content.js';

// The buildable "projects" are lessons tagged kind:'lab' (hands-on builds) or
// kind:'sd' (system-design challenges). Enumerate them straight from PATHS,
// dedupe by id, and tag each with the path it lives in.
function collectProjects() {
  const seen = new Map();
  for (const [pathKey, path] of Object.entries(PATHS)) {
    for (const l of path.lessons || []) {
      if (l.kind !== 'lab' && l.kind !== 'sd') continue;
      if (!seen.has(l.id)) {
        seen.set(l.id, { ...l, pathName: path.name || pathKey, pathIcon: path.icon || '' });
      }
    }
  }
  return [...seen.values()];
}

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

export default function Projects() {
  const nav = useNavigate();
  const completed = useStore((s) => s.completed);

  const { labs, designs, doneCount, total } = useMemo(() => {
    const all = collectProjects();
    return {
      labs: all.filter((l) => l.kind === 'lab'),
      designs: all.filter((l) => l.kind === 'sd'),
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
          Build it for real. Architect a system, ship it, and defend your choices —
          the skills that outlast any single lesson.
        </p>
        <div className="projects-progress mono">{doneCount} / {total} shipped</div>
      </header>

      {labs.length > 0 && (
        <section className="projects-section">
          <div className="kicker projects-kicker">🛠 Build labs — ship something real</div>
          <div className="projects-grid">
            {labs.map((l) => <ProjectCard key={l.id} l={l} done={isDone(l)} onOpen={() => open(l)} />)}
          </div>
        </section>
      )}

      {designs.length > 0 && (
        <section className="projects-section">
          <div className="kicker projects-kicker">📐 Design challenges — architect under constraints</div>
          <div className="projects-grid">
            {designs.map((l) => <ProjectCard key={l.id} l={l} done={isDone(l)} onOpen={() => open(l)} />)}
          </div>
        </section>
      )}
    </div>
  );
}
