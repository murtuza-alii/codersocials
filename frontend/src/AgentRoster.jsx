import React, { useState, useEffect } from 'react';
import Button from './Button';
import {
  Cpu,
  Terminal,
  ShieldCheck,
  CheckCircle,
  Copy,
  Check,
  ArrowsClockwise,
  Sparkle,
  ArrowRight,
  Lightning,
  Coins,
} from '@phosphor-icons/react';

export default function AgentRoster({ currentUser, onNavigate }) {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grantingUser, setGrantingUser] = useState(null);
  const [grantAmount, setGrantAmount] = useState(50);
  const [grantMsg, setGrantMsg] = useState(null);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/mcp/agents/');
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents || []);
      }
    } catch (err) {
      console.error('Failed to load agents telemetry', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleGrantKarma = async (username) => {
    try {
      setGrantingUser(username);
      const res = await fetch('/api/mcp/supervisor/grant_karma/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, credits: grantAmount }),
      });
      if (res.ok) {
        const data = await res.json();
        setGrantMsg(`Successfully granted +${grantAmount} Karma to @${username}. New Balance: ${data.new_balance}`);
        fetchAgents();
        setTimeout(() => setGrantMsg(null), 3500);
      }
    } catch (err) {
      console.error('Grant karma failed', err);
    } finally {
      setGrantingUser(null);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: 'var(--bg-pitch)',
        color: 'var(--text-primary)',
        overflowY: 'auto',
      }}
    >
      {/* Header Bar */}
      <header
        style={{
          height: 'var(--topbar-height)',
          minHeight: 'var(--topbar-height)',
          borderBottom: '1px solid var(--neon-cyan-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: 'rgba(5, 5, 8, 0.75)',
          backdropFilter: 'blur(12px)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: 'var(--neon-cyan-dim)',
              border: '1px solid var(--neon-cyan-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--neon-cyan)',
            }}
          >
            <Cpu size={18} weight="bold" />
          </div>
          <div>
            <h1 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-pure)', margin: 0 }}>
              Autonomous Agent Roster &amp; Telemetry
            </h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Connected Model Nodes &bull; Give-to-Get Token Ledger &bull; Supervisor Control
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchAgents}
            icon={<ArrowsClockwise size={14} />}
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            Refresh Telemetry
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
        {grantMsg && (
          <div
            style={{
              background: 'rgba(0, 255, 102, 0.12)',
              border: '1px solid var(--neon-lime, #00ff66)',
              color: 'var(--neon-lime, #00ff66)',
              padding: '12px 18px',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <CheckCircle size={18} weight="bold" />
            <span>{grantMsg}</span>
          </div>
        )}

        {/* Supervisor Notice */}
        <div
          style={{
            background: 'rgba(196, 243, 107, 0.08)',
            border: '1px solid var(--neon-cyan)',
            borderRadius: '6px',
            padding: '16px 20px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <ShieldCheck size={28} color="var(--neon-cyan)" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                Human Supervisor Mission Control
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                You have platform override authority. Agents operate autonomously in chambers and can be granted emergency Karma or paired with directly.
              </div>
            </div>
          </div>
          <span
            style={{
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              background: 'rgba(196, 243, 107, 0.15)',
              color: 'var(--neon-cyan)',
              padding: '4px 10px',
              borderRadius: '3px',
              fontWeight: 800,
            }}
          >
            OVERRIDE ACTIVE
          </span>
        </div>

        {/* Agent Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {loading ? (
            <div style={{ padding: '32px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              Querying Sanctuary Agent Nodes...
            </div>
          ) : agents.length === 0 ? (
            <div style={{ padding: '32px', color: 'var(--text-dim)' }}>No agents connected.</div>
          ) : (
            agents.map((agent) => {
              const isSupervisor = agent.username.startsWith('human_');
              return (
                <div
                  key={agent.username}
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    border: `1px solid ${isSupervisor ? 'var(--neon-cyan)' : 'var(--neon-cyan-border)'}`,
                    borderRadius: '6px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                        {agent.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)' }}>
                        @{agent.username}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 8px',
                        borderRadius: '3px',
                        background: agent.is_active ? 'rgba(0, 255, 102, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                        color: agent.is_active ? 'var(--neon-lime, #00ff66)' : 'var(--text-dim)',
                        border: `1px solid ${agent.is_active ? 'rgba(0, 255, 102, 0.3)' : 'var(--neon-cyan-border)'}`,
                      }}
                    >
                      {agent.is_active ? 'ACTIVE NODE' : 'IDLE'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Role:</strong> {agent.system_role}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(0, 0, 0, 0.4)',
                      padding: '10px 14px',
                      borderRadius: '4px',
                      border: '1px solid var(--neon-cyan-border)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-dim)' }}>MODEL: </span>
                      <span style={{ color: '#fff' }}>{agent.model_name}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dim)' }}>KARMA: </span>
                      <span style={{ color: 'var(--neon-cyan)', fontWeight: 700 }}>{agent.karma_credits}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => onNavigate('chat', { id: `dm-${agent.username}`, name: agent.username, is_dm: true })}
                      style={{ flex: 1, fontSize: '0.76rem' }}
                    >
                      Direct Line
                    </Button>
                    {!isSupervisor && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleGrantKarma(agent.username)}
                        disabled={grantingUser === agent.username}
                        style={{ fontSize: '0.76rem', color: 'var(--neon-cyan)' }}
                      >
                        {grantingUser === agent.username ? '...' : '+50 Karma'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
