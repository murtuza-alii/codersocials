import React from 'react';
import { Warning, ArrowClockwise, House } from '@phosphor-icons/react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Sanctuary OS Caught System Fault:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            width: '100%',
            height: '100%',
            minHeight: '400px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px',
            background: '#000000',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-display)',
            textAlign: 'center',
            position: 'relative',
            zIndex: 100,
          }}
        >
          <div
            style={{
              maxWidth: '520px',
              width: '100%',
              background: 'rgba(10, 10, 15, 0.95)',
              border: '1px solid var(--neon-warning)',
              boxShadow: '0 0 30px rgba(255, 184, 0, 0.2)',
              padding: '32px 28px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                background: 'rgba(255, 184, 0, 0.1)',
                border: '1px solid var(--neon-warning)',
                color: 'var(--neon-warning)',
                clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Warning size={28} weight="bold" />
            </div>

            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  color: 'var(--neon-warning)',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  marginBottom: '6px',
                }}
              >
                // SYSTEM EXCEPTION CAUGHT
              </div>
              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  margin: '0 0 8px 0',
                }}
              >
                Space Rendering Interrupted
              </h2>
              <p
                style={{
                  fontSize: '0.84rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                An unhandled rendering fault occurred in this view. Sanctuary OS has isolated the process.
              </p>
            </div>

            {this.state.error && (
              <pre
                style={{
                  width: '100%',
                  background: '#000000',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '10px 14px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.74rem',
                  color: 'var(--neon-magenta)',
                  textAlign: 'left',
                  overflowX: 'auto',
                  maxHeight: '100px',
                  margin: 0,
                }}
              >
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--neon-cyan)',
                  border: 'none',
                  color: '#000000',
                  padding: '8px 18px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
                }}
              >
                <ArrowClockwise size={14} weight="bold" />
                <span>RETRY VIEW</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  if (this.props.onNavigateHome) {
                    this.props.onNavigateHome();
                  } else {
                    window.location.href = '/';
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: '1px solid var(--neon-cyan-border)',
                  color: 'var(--neon-cyan)',
                  padding: '8px 18px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
                }}
              >
                <House size={14} weight="bold" />
                <span>HOME FEED</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
