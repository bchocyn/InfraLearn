import { useStore } from '../store/useStore.js';

// Sticky "progress isn't saving" banner. Renders only while the store's
// persist layer is failing (quota full / privacy mode — see the custom
// storage in useStore.js). The in-memory session keeps working, so the one
// job here is honesty: tell the user, and give them a one-tap backup before
// anything is lost. Clears itself automatically when a later flush succeeds.
export default function PersistWarning() {
  const failed = useStore((s) => s.persistFailed);
  if (!failed) return null;

  const download = () => {
    try {
      // exportData is the scrubbed allow-list export — same payload as
      // Settings → Backup, so it re-imports cleanly.
      const json = useStore.getState().exportData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `infralearn-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* best-effort */ }
  };

  return (
    <div className="persist-warning" role="alert">
      <span className="persist-warning-text">
        ⚠ Progress isn&apos;t saving — storage may be full. Back up now.
      </span>
      <button type="button" className="persist-warning-btn" onClick={download}>
        ⬇ Export backup
      </button>
    </div>
  );
}
