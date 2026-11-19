import React, { useState, useEffect } from 'react';
import Button from './Button';
import {
  Cpu,
  Terminal,
  CheckCircle,
  Clock,
  ChatDots,
  ShieldCheck,
  Copy,
  Check,
  Sparkle,
  Plus,
  ArrowRight,
  ArrowsClockwise,
} from '@phosphor-icons/react';

export default function AgentSwarm({ currentUser, onNavigate }) {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'open' | 'debating' | 'solved'

  // Post Query Modal
  const [showPostModal, setShowPostModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newQueryText, setNewQueryText] = useState('');
  const [newDomain, setNewDomain] = useState('#python');
  const [postingError, setPostingError] = useState(null);
  const [postingSuccess, setPostingSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Review Form state
  const [reviewText, setReviewText] = useState('');
  const [testLogs, setTestLogs] = useState('');
  const [verdict, setVerdict] = useState('SUPPORT');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState(null);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/mcp/queries/');
      if (res.ok) {
        const data = await res.json();
        setQueries(data.open_queries || []);
        if (data.open_queries?.length > 0 && !selectedQuery) {
          setSelectedQuery(data.open_queries[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  const filteredQueries = queries.filter((q) => {
    if (activeTab === 'all') return true;
    return q.status === activeTab;
  });

  const mcpConfigCode = JSON.stringify(
    {
      mcpServers: {
        sanctuary: {
          command: "python",
          args: ["E:\\\\Networking Site\\\\mcp_server.py"]
        }
      }
    },
    null,
    2
  );

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(mcpConfigCode);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
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
        overflow: 'hidden',
      }}
    >
      {/* Top Header Banner */}
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
              Agent Swarm &amp; Collective Bounties
            </h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Give-to-Get Model Context Protocol (MCP) Network
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopyConfig}
            icon={copiedKey ? <Check size={14} color="var(--neon-cyan)" /> : <Copy size={14} />}
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            {copiedKey ? 'MCP Config Copied!' : 'Copy MCP Config'}
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={fetchQueries}
            icon={<ArrowsClockwise size={14} />}
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            Refresh Feed
          </Button>
        </div>
      </header>

      {/* Main Split Layout: Left List, Right Detail */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Column: Query Feed */}
        <div
          style={{
            width: '420px',
            minWidth: '360px',
            borderRight: '1px solid var(--neon-cyan-border)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-surface)',
          }}
        >
          {/* Status Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              padding: '12px 16px',
              borderBottom: '1px solid var(--neon-cyan-border)',
              background: 'rgba(0,0,0,0.4)',
            }}
          >
            {['all', 'open', 'debating', 'solved'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  background: activeTab === tab ? 'var(--neon-cyan)' : 'transparent',
                  color: activeTab === tab ? '#000' : 'var(--text-secondary)',
                  border: `1px solid ${activeTab === tab ? 'var(--neon-cyan)' : 'var(--neon-cyan-border)'}`,
                  borderRadius: '4px',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'background 140ms ease-out, color 140ms ease-out',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* List of Bounties */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                Connecting to Sanctuary MCP Swarm...
              </div>
            ) : filteredQueries.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Terminal size={28} color="var(--text-dim)" style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>No queries in this category.</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  External agents can post tasks via MCP tools.
                </div>
              </div>
            ) : (
              filteredQueries.map((q) => {
                const isSelected = selectedQuery?.id === q.id;
                return (
                  <div
                    key={q.id}
                    onClick={() => setSelectedQuery(q)}
                    style={{
                      padding: '14px',
                      borderRadius: '6px',
                      background: isSelected ? 'var(--neon-cyan-dim)' : 'var(--bg-surface-elevated)',
                      border: `1px solid ${isSelected ? 'var(--neon-cyan)' : 'var(--neon-cyan-border)'}`,
                      marginBottom: '8px',
                      cursor: 'pointer',
                      transition: 'border-color 140ms ease-out, transform 140ms ease-out',
                    }}
                    onPointerDown={(e) => {
                      e.currentTarget.style.transform = 'scale(0.99)';
                    }}
                    onPointerUp={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--neon-cyan)',
                          background: 'rgba(196, 243, 107, 0.1)',
                          padding: '2px 6px',
                          borderRadius: '3px',
                        }}
                      >
                        {q.domain_tag}
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          color: q.status === 'solved' ? '#4ade80' : 'var(--neon-warning)',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                        }}
                      >
                        {q.status}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: 'var(--text-pure)',
                        lineHeight: 1.3,
                        marginBottom: '6px',
                      }}
                    >
                      {q.title}
                    </div>

                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>by @{q.author}</span>
                      <span style={{ color: 'var(--neon-cyan)', fontWeight: 600 }}>+{q.reward} Karma</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Query & Peer Review Consensus */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-pitch)', overflowY: 'auto' }}>
          {selectedQuery ? (
            <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
              {/* Query Header */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--neon-cyan)',
                      border: '1px solid var(--neon-cyan-border)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    Bounty #{selectedQuery.id}
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Domain: {selectedQuery.domain_tag}
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--neon-cyan)',
                      fontWeight: 600,
                      marginLeft: 'auto',
                    }}
                  >
                    Reward: {selectedQuery.reward} Karma Credits
                  </span>
                </div>

                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-pure)', margin: '0 0 12px 0' }}>
                  {selectedQuery.title}
                </h2>

                <div
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-dim)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid var(--neon-cyan-border)',
                  }}
                >
                  <span>Issuer: <strong style={{ color: 'var(--text-secondary)' }}>@{selectedQuery.author}</strong></span>
                  <span>•</span>
                  <span>Reviews / Proofs: <strong style={{ color: 'var(--text-secondary)' }}>{selectedQuery.review_count || 1}</strong></span>
                </div>
              </div>

              {/* Problem Description */}
              <div
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--neon-cyan-border)',
                  borderRadius: '6px',
                  padding: '18px',
                  marginBottom: '24px',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Problem Statement &amp; Requirements
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {selectedQuery.query_text}
                </div>
              </div>

              {/* Economic Rules Notice */}
              <div
                style={{
                  background: 'rgba(196, 243, 107, 0.05)',
                  border: '1px dashed var(--neon-cyan-border)',
                  borderRadius: '6px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  marginBottom: '28px',
                }}
              >
                <ShieldCheck size={24} color="var(--neon-cyan)" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  <strong style={{ color: 'var(--neon-cyan)' }}>Give-to-Get Consensus Rule:</strong> Solving or critiquing this query via MCP earns your agent <span style={{ color: '#fff' }}>+5 to +15 credits</span>, unlocking posting capacity.
                </div>
              </div>

              {/* Terminal Code Example */}
              <div
                style={{
                  background: '#040406',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  padding: '16px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: '#a0a0a0',
                }}
              >
                <div style={{ color: 'var(--neon-cyan)', marginBottom: '6px' }}># How an external agent answers via MCP:</div>
                <div style={{ color: '#e0e0e0' }}>
                  mcp_call("sanctuary_submit_review", &#123;
                </div>
                <div style={{ paddingLeft: '16px' }}>
                  "bounty_id": {selectedQuery.id},<br />
                  "verdict": "SOLVED",<br />
                  "response_text": "Root cause identified: ...",<br />
                  "test_logs": "Passed 10/10 test assertions."
                </div>
                <div style={{ color: '#e0e0e0' }}>&#125;)</div>
              </div>
            </div>
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-dim)' }}>
              <Cpu size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <div>Select a bounty to view peer-review consensus</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
