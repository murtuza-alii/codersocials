import React, { useState } from 'react';
import {
  Gear,
  Sliders,
  Monitor,
  SpeakerSimpleHigh,
  User,
  ShieldCheck,
  SignOut,
  Sparkle,
  Check,
  ArrowClockwise,
  ArrowLeft,
  CircleNotch,
  FloppyDisk,
} from '@phosphor-icons/react';
import Button from './Button';

export default function AppSettings({
  user = { username: 'sarah_creator', role: 'ADMIN' },
  onNavigate = () => {},
  appSettings = {},
  onUpdateSettings = () => {},
}) {
  const [activeTab, setActiveTab] = useState('display'); // 'display' | 'feed' | 'account' | 'telemetry'
  const [saveToast, setSaveToast] = useState(false);

  // Settings local state with defaults
  const settings = {
    enable3dBg: appSettings.enable3dBg ?? true,
    enableSmoothCursor: appSettings.enableSmoothCursor ?? true,
    crtScanlines: appSettings.crtScanlines ?? false,
    autoplayVideo: appSettings.autoplayVideo ?? true,
    highContrast: appSettings.highContrast ?? false,
    ...appSettings,
  };

  const handleToggle = (key) => {
    const nextVal = !settings[key];
    onUpdateSettings({ ...settings, [key]: nextVal });
    triggerToast();
  };

  const triggerToast = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const handleClearCache = () => {
    localStorage.clear();
    triggerToast();
    setTimeout(() => window.location.reload(), 400);
  };

  return (
    <div
      style={{
        maxWidth: '960px',
        margin: '0 auto',
        padding: '12px 10px 48px 10px',
        fontFamily: 'var(--font-display)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Top Banner / Breadcrumb */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          borderBottom: '1px solid var(--neon-cyan-border)',
          paddingBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => onNavigate('feed')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              padding: '4px 6px',
            }}
            onPointerEnter={(e) => (e.currentTarget.style.color = 'var(--neon-cyan)')}
            onPointerLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
          >
            <ArrowLeft size={14} weight="bold" />
            <span>FEED</span>
          </button>
          <span style={{ color: 'var(--text-dim)' }}>/</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Gear size={20} color="var(--neon-cyan)" weight="bold" />
            <h1
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#fff',
                margin: 0,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Application Settings
            </h1>
          </div>
        </div>

        {saveToast && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--neon-cyan-dim)',
              border: '1px solid var(--neon-cyan)',
              color: 'var(--neon-cyan)',
              padding: '4px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.74rem',
              fontWeight: 700,
            }}
          >
            <Check size={14} weight="bold" />
            <span>PREFERENCE SAVED</span>
          </div>
        )}
      </div>

      {/* Main Container Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '220px 1fr',
          gap: '24px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--neon-cyan-border)',
          padding: '24px',
        }}
      >
        {/* Navigation Tabs */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            { id: 'display', label: 'Display & Graphics', icon: Monitor },
            { id: 'feed', label: 'Audio & Playback', icon: SpeakerSimpleHigh },
            { id: 'account', label: 'Account & Identity', icon: User },
            { id: 'telemetry', label: 'System Telemetry', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  background: isActive ? 'var(--neon-cyan-dim)' : 'transparent',
                  border: `1px solid ${isActive ? 'var(--neon-cyan)' : 'transparent'}`,
                  color: isActive ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? 700 : 500,
                  textAlign: 'left',
                  clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
                  transition: 'all 0.15s ease',
                  outline: 'none',
                }}
              >
                <Icon size={16} weight={isActive ? 'fill' : 'bold'} />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '14px 0' }} />

          <button
            type="button"
            onClick={() => onNavigate('logout')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              background: 'transparent',
              border: '1px solid rgba(223, 125, 120, 0.3)',
              color: 'var(--neon-magenta)',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 700,
              textAlign: 'left',
              clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
            }}
          >
            <SignOut size={16} weight="bold" />
            <span>DISCONNECT NODE</span>
          </button>
        </aside>

        {/* Tab Content Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* TAB 1: DISPLAY & GRAPHICS */}
          {activeTab === 'display' && (
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.74rem',
                  color: 'var(--neon-cyan)',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  marginBottom: '16px',
                }}
              >
                // GRAPHICS PIPELINE CONFIGURATION
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* 3D Engine Toggle */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    background: '#000000',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                      Interactive 3D Background Engine
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                      Procedural Three.js vertex waves, kinetic core, and neural constellation canvas.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('enable3dBg')}
                    style={{
                      width: '46px',
                      height: '24px',
                      background: settings.enable3dBg ? 'var(--neon-cyan)' : 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      borderRadius: '12px',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '3px',
                        left: settings.enable3dBg ? '25px' : '4px',
                        width: '18px',
                        height: '18px',
                        background: settings.enable3dBg ? '#000' : '#fff',
                        borderRadius: '50%',
                        transition: 'left 0.2s ease',
                      }}
                    />
                  </button>
                </div>

                {/* Laser Cursor Toggle */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    background: '#000000',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                      Smooth Holographic Cursor
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                      Real-time spring-physics tracking dot and precision reticle with state glow.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('enableSmoothCursor')}
                    style={{
                      width: '46px',
                      height: '24px',
                      background: settings.enableSmoothCursor ? 'var(--neon-cyan)' : 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      borderRadius: '12px',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '3px',
                        left: settings.enableSmoothCursor ? '25px' : '4px',
                        width: '18px',
                        height: '18px',
                        background: settings.enableSmoothCursor ? '#000' : '#fff',
                        borderRadius: '50%',
                        transition: 'left 0.2s ease',
                      }}
                    />
                  </button>
                </div>

                {/* CRT Scanline Toggle */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    background: '#000000',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                      Retro Cyber CRT Scanlines
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                      Subtle terminal raster scanline overlay across dark surfaces.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('crtScanlines')}
                    style={{
                      width: '46px',
                      height: '24px',
                      background: settings.crtScanlines ? 'var(--neon-cyan)' : 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      borderRadius: '12px',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '3px',
                        left: settings.crtScanlines ? '25px' : '4px',
                        width: '18px',
                        height: '18px',
                        background: settings.crtScanlines ? '#000' : '#fff',
                        borderRadius: '50%',
                        transition: 'left 0.2s ease',
                      }}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AUDIO & FEED */}
          {activeTab === 'feed' && (
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.74rem',
                  color: 'var(--neon-cyan)',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  marginBottom: '16px',
                }}
              >
                // MEDIA STREAM & TELEMETRY
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    background: '#000000',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                      Autoplay Video Clips (Muted)
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                      Play media preview loops automatically when scrolled into view. Tap audio pill to un-mute.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('autoplayVideo')}
                    style={{
                      width: '46px',
                      height: '24px',
                      background: settings.autoplayVideo ? 'var(--neon-cyan)' : 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      borderRadius: '12px',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '3px',
                        left: settings.autoplayVideo ? '25px' : '4px',
                        width: '18px',
                        height: '18px',
                        background: settings.autoplayVideo ? '#000' : '#fff',
                        borderRadius: '50%',
                        transition: 'left 0.2s ease',
                      }}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACCOUNT & IDENTITY */}
          {activeTab === 'account' && (
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.74rem',
                  color: 'var(--neon-cyan)',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  marginBottom: '16px',
                }}
              >
                // AUTHENTICATED SYSTEM OPERATOR
              </div>

              <div
                style={{
                  padding: '18px',
                  background: '#000000',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      background: 'rgba(0, 240, 255, 0.1)',
                      border: '2px solid var(--neon-cyan)',
                      clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--neon-cyan)',
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {(user.username || 'U').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
                      @{user.username}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                      {user.role || 'Member'} // Session Active
                    </div>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onNavigate('profile', { username: user.username })}
                >
                  VIEW PROFILE
                </Button>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate('profile', { username: user.username, edit: true })}
                >
                  EDIT PROFILE & AVATAR
                </Button>
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => onNavigate('logout')}
                >
                  LOGOUT OF NODE
                </Button>
              </div>
            </div>
          )}

          {/* TAB 4: SYSTEM TELEMETRY */}
          {activeTab === 'telemetry' && (
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.74rem',
                  color: 'var(--neon-cyan)',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  marginBottom: '16px',
                }}
              >
                // SYSTEM TELEMETRY & PERSISTENCE
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  background: '#000000',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '16px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.80rem',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Core Runtime:</span>
                  <span style={{ color: '#fff' }}>Django 6.1 (Python WSGI)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>API Gateway:</span>
                  <span style={{ color: 'var(--neon-cyan)', fontWeight: 700 }}>http://127.0.0.1:8000 // ONLINE</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Client UI:</span>
                  <span style={{ color: '#fff' }}>React 19 + Vite 8 (Port 5173)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Database Layer:</span>
                  <span style={{ color: 'var(--neon-cyan)' }}>SQLite 3 (Persistent Disk)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Session Auth:</span>
                  <span style={{ color: '#fff' }}>CSRF Exempt Dual Multipart/JSON</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClearCache}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'var(--text-primary)',
                  padding: '8px 14px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  borderRadius: '2px',
                }}
              >
                <ArrowClockwise size={14} weight="bold" />
                <span>CLEAR LOCAL STORAGE & RE-SYNC CLIENT</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
