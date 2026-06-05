import { NavLink } from 'react-router-dom';
import { useStore } from '../store/useStore.js';
import { useT } from '../i18n/index.js';

// Labels are pulled via the i18n hook so flipping language in Settings
// updates the bottom-nav text instantly. The icon glyphs stay locale-agnostic.
const TABS = [
  { to: '/',         ico: '◎',  key: 'tab.learn',    end: true },
  { to: '/roadmap',  ico: '◇',  key: 'tab.roadmap' },
  { to: '/library',  ico: '▤',  key: 'tab.library' },
  { to: '/beast',    ico: '🐲', key: 'tab.beast', beast: true },
  { to: '/settings', ico: '⚙',  key: 'tab.settings' },
];

export default function TabBar() {
  const pending = useStore((s) => s.pendingEvolution);
  const t = useT();
  return (
    <nav className="tabbar">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          <span className="ico">{tab.ico}</span>
          {t(tab.key).toUpperCase()}
          {tab.beast && pending ? <span className="dot" /> : null}
        </NavLink>
      ))}
    </nav>
  );
}
