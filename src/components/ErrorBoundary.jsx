import React from 'react';

// ErrorBoundary — catches any render-time error in its children and shows a
// readable fallback instead of the white/black screen of death. The fallback
// includes the error message + component stack so you can fix it without
// digging through DevTools — and a reset button + clear-storage escape hatch
// so you're never trapped by a corrupted persist payload.
//
// React error boundaries MUST be class components (hooks can't catch render
// errors). This is the only class component in the project.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Surface to the console too — easier to scroll than a 200px error pane.
    // eslint-disable-next-line no-console
    console.error('[InfraLearn] Render error:', error, info);
    this.setState({ error, info });
  }

  reset = () => {
    this.setState({ error: null, info: null });
  };

  nukeStorage = () => {
    try {
      // Persist key from useStore.js's persist config name.
      localStorage.removeItem('infralearn-store');
    } catch (_) { /* ignore */ }
    // Hard reload so the next mount starts from initial state.
    if (typeof window !== 'undefined') window.location.reload();
  };

  render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;
    const message = (error && (error.message || String(error))) || 'Unknown error';
    const stack = (error && error.stack) || '';
    const compStack = (info && info.componentStack) || '';
    return (
      <div
        role="alert"
        style={{
          padding: 20,
          maxWidth: 720,
          margin: '40px auto',
          background: '#13110E',
          border: '1px solid #E07856',
          borderRadius: 12,
          color: '#F4EFE3',
          fontFamily: 'Inter Tight, system-ui, sans-serif',
        }}
      >
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            letterSpacing: '0.18em',
            color: '#E07856',
            textTransform: 'uppercase',
          }}
        >
          Something broke while rendering
        </div>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 22, margin: '8px 0 4px' }}>
          InfraLearn hit an error.
        </h1>
        <p style={{ fontSize: 13, color: '#C7BFA9', margin: '0 0 14px' }}>
          The screen would normally render here. Below is the error so you can fix it (or share
          it). If the app looks broken on every reload, the persisted state may be at fault —
          clearing it forces a fresh start.
        </p>
        <pre
          style={{
            background: '#0B0A08',
            border: '1px solid #2A2620',
            borderRadius: 8,
            padding: 12,
            fontSize: 12,
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            color: '#F4EFE3',
            margin: '0 0 12px',
          }}
        >
          {message}
        </pre>
        {(stack || compStack) && (
          <details style={{ fontSize: 11, color: '#8E8773', marginBottom: 14 }}>
            <summary style={{ cursor: 'pointer' }}>Show stack</summary>
            <pre
              style={{
                marginTop: 8,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11,
              }}
            >
              {stack}
              {compStack ? `\n\n— component stack —${compStack}` : ''}
            </pre>
          </details>
        )}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={this.reset}
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #3A352D',
              background: '#17140F',
              color: '#F4EFE3',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
          <button
            type="button"
            onClick={this.nukeStorage}
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #F5B842',
              background: '#F5B842',
              color: '#0B0A08',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Clear stored state + reload
          </button>
        </div>
      </div>
    );
  }
}
