/**
 * Searchable directory for public and private communities.
 */

import React, { useState, useEffect, useMemo } from 'react';
import Button from './Button';
import SurfaceCard from './SurfaceCard';
import {
  MagnifyingGlass,
  Plus,
  Users,
  Lock,
  Globe,
  Check,
  Clock,
  ArrowRight,
  X,
  Compass,
} from '@phosphor-icons/react';

// ============================================================================
// Default Communities Data
// ============================================================================

const DEFAULT_COMMUNITIES = [
  {
    id: 'cmrit-engineering-hub',
    name: 'CMRIT Engineering & Tech Hub',
    slug: 'cmrit-engineering-hub',
    description: 'Official developer and engineering collective of CMR Institute of Technology, Bengaluru (AECS Layout, ITPL Main Rd). High-octane student innovation, hackathons, IEEE/Cultura builds, and robotics projects.',
    rules: 'Foster campus innovation, share reproducible GitHub repos and schematics, prepare for Cultura & NextGen Convergence.',
    privacy: 'PUBLIC',
    member_count: 348,
    avatar: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=80',
    is_joined: true,
    is_pending: false,
  },
  {
    id: 1,
    name: 'Systems & Infrastructure',
    slug: 'systems-infrastructure',
    description: 'Hardware hacking, low-latency systems programming, and open cloud infrastructure.',
    rules: 'Share verified benchmarks, provide reproducible code, no commercial spam.',
    privacy: 'PUBLIC',
    member_count: 142,
    avatar: null,
    banner: null,
    is_joined: true,
    is_pending: false,
  },
  {
    id: 2,
    name: 'Creative Technology',
    slug: 'creative-technology',
    description: 'Modular synthesis, algorithmic audio generation, and dark ambient sound design.',
    rules: 'Provide stems when sharing tracks. Credit sample sources.',
    privacy: 'PUBLIC',
    member_count: 89,
    avatar: null,
    banner: null,
    is_joined: true,
    is_pending: false,
  },
  {
    id: 3,
    name: 'Applied AI Research',
    slug: 'applied-ai-research',
    description: 'Multi-agent orchestration, tool-use protocols, and local LLM fine-tuning pipelines.',
    rules: 'Open-weights only. Post reproducible evaluations and benchmarks.',
    privacy: 'PUBLIC',
    member_count: 215,
    avatar: null,
    banner: null,
    is_joined: true,
    is_pending: false,
  },
  {
    id: 4,
    name: 'Computer Vision Study Group',
    slug: 'computer-vision-study-group',
    description: 'Computer vision, NeRF 3D reconstructions, and real-time WebGL/WebGPU shader pipelines.',
    rules: 'Include code repositories and dataset attributions.',
    privacy: 'PRIVATE',
    member_count: 48,
    avatar: null,
    banner: null,
    is_joined: false,
    is_pending: false,
  },
  {
    id: 5,
    name: 'Hardware Research Network',
    slug: 'hardware-research-network',
    description: 'Quantum error correction, tensor network simulations, and microwave pulse control.',
    rules: 'Vetted peer review only. Mathematical rigor expected.',
    privacy: 'PRIVATE',
    member_count: 31,
    avatar: null,
    banner: null,
    is_joined: false,
    is_pending: true,
  },
  {
    id: 6,
    name: 'Applied Cryptography',
    slug: 'applied-cryptography',
    description: 'zk-SNARKs, polynomial commitments, and cryptographic privacy primitives.',
    rules: 'Disclose vulnerabilities responsibly. Formal proofs required.',
    privacy: 'PUBLIC',
    member_count: 67,
    avatar: null,
    banner: null,
    is_joined: false,
    is_pending: false,
  },
];

// ============================================================================
// Main DiscoverSpaces Component
// ============================================================================

export default function DiscoverSpaces({
  initialCommunities = null,
  onNavigate = () => {},
  onCreateSpaceClick = null,
}) {
  const [communities, setCommunities] = useState(initialCommunities || DEFAULT_COMMUNITIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'PUBLIC' | 'PRIVATE' | 'JOINED'
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Create Space Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceDescription, setNewSpaceDescription] = useState('');
  const [newSpaceRules, setNewSpaceRules] = useState('');
  const [newSpacePrivacy, setNewSpacePrivacy] = useState('PUBLIC');
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [createError, setCreateError] = useState(null);

  const handleOpenCreateModal = () => {
    if (onCreateSpaceClick) {
      onCreateSpaceClick();
    }
    setIsCreateModalOpen(true);
  };

  const handleCreateSpaceSubmit = async (e) => {
    e.preventDefault();
    if (!newSpaceName.trim()) {
      setCreateError('Space name is required.');
      return;
    }

    setIsCreatingSpace(true);
    setCreateError(null);

    try {
      const response = await fetch('/communities/create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          name: newSpaceName.trim(),
          description: newSpaceDescription.trim(),
          rules: newSpaceRules.trim(),
          privacy: newSpacePrivacy,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const created = data?.community;
        if (created) {
          setCommunities((prev) => [created, ...prev]);
          setIsCreateModalOpen(false);
          setNewSpaceName('');
          setNewSpaceDescription('');
          setNewSpaceRules('');
          onNavigate('community', created);
        }
      } else {
        const err = await response.json().catch(() => null);
        setCreateError(err?.error || 'Failed to create space.');
      }
    } catch {
      setCreateError('Network error connecting to backend.');
    } finally {
      setIsCreatingSpace(false);
    }
  };

  // Fetch live communities from Django if available
  useEffect(() => {
    let isCancelled = false;
    async function loadCommunities() {
      try {
        const response = await fetch('/communities/explore/', {
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
        });
        if (response.ok) {
          const data = await response.json();
          if (!isCancelled && data.communities) {
            const seen = new Set();
            const clean = data.communities.filter((c) => {
              const key = (c.slug || c.id || c.name || '').toLowerCase();
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
            setCommunities(clean);
          }
        }
      } catch {
        // Fallback to initial/default communities
      }
    }
    loadCommunities();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Filter logic
  const filteredCommunities = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return communities.filter((comm) => {
      const matchesQuery =
        !q ||
        comm.name.toLowerCase().includes(q) ||
        comm.description?.toLowerCase().includes(q) ||
        comm.rules?.toLowerCase().includes(q);

      if (!matchesQuery) return false;

      if (activeTab === 'PUBLIC') return comm.privacy === 'PUBLIC';
      if (activeTab === 'PRIVATE') return comm.privacy === 'PRIVATE';
      if (activeTab === 'JOINED') return comm.is_joined;
      return true;
    });
  }, [communities, searchQuery, activeTab]);

  // Handle Joining or Requesting Access
  const handleJoinClick = async (comm) => {
    setActionLoadingId(comm.id);

    try {
      const response = await fetch(`/communities/c/${comm.slug}/join/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
      });

      if (response.ok) {
        setCommunities((prev) =>
          prev.map((c) => {
            if (c.id !== comm.id) return c;
            if (comm.privacy === 'PRIVATE') {
              return { ...c, is_pending: true };
            }
            return { ...c, is_joined: true, member_count: c.member_count + 1 };
          })
        );
      } else {
        // Optimistic local fallback for standalone Vite mode
        setCommunities((prev) =>
          prev.map((c) => {
            if (c.id !== comm.id) return c;
            if (comm.privacy === 'PRIVATE') {
              return { ...c, is_pending: true };
            }
            return { ...c, is_joined: true, member_count: c.member_count + 1 };
          })
        );
      }
    } catch {
      // Local fallback
      setCommunities((prev) =>
        prev.map((c) => {
          if (c.id !== comm.id) return c;
          if (comm.privacy === 'PRIVATE') {
            return { ...c, is_pending: true };
          }
          return { ...c, is_joined: true, member_count: c.member_count + 1 };
        })
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div
      className="page-discover"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: '#000000',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {/* Top Banner & Title Section */}
      <div
        style={{
          padding: '32px 32px 24px 32px',
          borderBottom: '1px solid var(--neon-cyan-border)',
          background: 'var(--bg-surface)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--neon-cyan)',
                fontWeight: 700,
                letterSpacing: '0.08em',
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Compass size={14} weight="bold" />
              <span>COMMUNITY DIRECTORY</span>
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: '1.8rem',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.02em',
              }}
            >
              Discover Spaces
            </h1>

            <p
              style={{
                margin: '6px 0 0 0',
                fontSize: '0.88rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              Find a focused space for the work you want to do.
            </p>
          </div>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleOpenCreateModal}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} weight="bold" />
                  <span>Create a space</span>
            </div>
          </Button>
        </div>

        {/* Search Input Bar & Category Tabs */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '14px',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Cyber Search Input */}
          <div
            style={{
              position: 'relative',
              flex: '1 1 340px',
              maxWidth: '540px',
            }}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search spaces"
              style={{
                width: '100%',
                background: '#000000',
                border: '1px solid var(--neon-cyan-border)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-display)',
                fontSize: '0.88rem',
                padding: '10px 38px 10px 38px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--neon-cyan)';
                e.target.style.boxShadow = '0 0 10px rgba(0, 240, 255, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--neon-cyan-border)';
                e.target.style.boxShadow = 'none';
              }}
            />

            <MagnifyingGlass
              size={18}
              weight="bold"
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-dim)',
                pointerEvents: 'none',
              }}
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} weight="bold" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              background: '#000000',
              border: '1px solid var(--neon-cyan-border)',
              padding: '3px',
            }}
          >
            {['ALL', 'PUBLIC', 'PRIVATE', 'JOINED'].map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    background: isActive ? 'var(--neon-cyan)' : 'transparent',
                    color: isActive ? '#000000' : 'var(--text-secondary)',
                    border: 'none',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '6px 12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onPointerEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = '#ffffff';
                  }}
                  onPointerLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  {tab === 'ALL' ? 'All spaces' : `${tab[0]}${tab.slice(1).toLowerCase()}`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grid Viewport */}
      <div
        style={{
          padding: '32px',
          flex: 1,
        }}
      >
        {filteredCommunities.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
            {filteredCommunities.map((comm) => {
              const isPrivate = comm.privacy === 'PRIVATE';
              const isLoading = actionLoadingId === comm.id;

              return (
                <SurfaceCard
                  key={comm.id}
                  accent={isPrivate ? 'magenta' : 'cyan'}
                  minHeight="320px"
                  frontContent={
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        position: 'relative',
                      }}
                    >
                      {/* Space Banner Header */}
                      <div
                        style={{
                          height: '92px',
                          background: comm.banner
                            ? `url(${comm.banner}) center/cover no-repeat`
                            : isPrivate
                            ? 'linear-gradient(135deg, #090308 0%, #150610 50%, #000000 100%)'
                            : 'linear-gradient(135deg, #03080d 0%, #06121c 50%, #000000 100%)',
                          borderBottom: '1px solid var(--neon-cyan-border)',
                          position: 'relative',
                        }}
                      >
                        {/* Privacy Badge */}
                        <div
                          style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: 'rgba(0, 0, 0, 0.85)',
                            border: `1px solid ${isPrivate ? 'var(--neon-warning)' : 'var(--neon-cyan)'}`,
                            padding: '3px 8px',
                            fontSize: '0.68rem',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            color: isPrivate ? 'var(--neon-warning)' : 'var(--neon-cyan)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: `0 0 8px ${isPrivate ? 'rgba(255, 184, 0, 0.25)' : 'rgba(0, 240, 255, 0.25)'}`,
                          }}
                        >
                          {isPrivate ? <Lock size={12} weight="bold" /> : <Globe size={12} weight="bold" />}
                          <span>{comm.privacy}</span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div
                        style={{
                          padding: '16px 20px 20px 20px',
                          display: 'flex',
                          flexDirection: 'column',
                          flex: 1,
                        }}
                      >
                        {/* Space Monogram / Avatar */}
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            background: '#000000',
                            border: `2px solid ${isPrivate ? 'var(--neon-magenta)' : 'var(--neon-cyan)'}`,
                            clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: '-36px',
                            marginBottom: '12px',
                            color: isPrivate ? 'var(--neon-magenta)' : 'var(--neon-cyan)',
                            fontWeight: 800,
                            fontSize: '1rem',
                            fontFamily: 'var(--font-mono)',
                            boxShadow: '0 0 12px rgba(0, 0, 0, 0.9)',
                            zIndex: 2,
                          }}
                        >
                          {comm.avatar ? (
                            <img
                              src={comm.avatar}
                              alt={comm.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            comm.name.slice(0, 2).toUpperCase()
                          )}
                        </div>

                        {/* Title */}
                        <button
                          type="button"
                          onClick={() => onNavigate('community', comm)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            padding: 0,
                            textAlign: 'left',
                            fontSize: '1.1rem',
                            fontWeight: 800,
                            color: '#ffffff',
                            cursor: 'pointer',
                            marginBottom: '8px',
                            letterSpacing: '-0.01em',
                            transition: 'color 0.2s ease',
                          }}
                          onPointerEnter={(e) => (e.currentTarget.style.color = 'var(--neon-cyan)')}
                          onPointerLeave={(e) => (e.currentTarget.style.color = '#ffffff')}
                        >
                          {comm.name}
                        </button>

                        {/* Description */}
                        <p
                          style={{
                            fontSize: '0.84rem',
                            lineHeight: 1.5,
                            color: 'var(--text-secondary)',
                            margin: '0 0 16px 0',
                            flex: 1,
                          }}
                        >
                          {comm.description || 'No charter description provided yet.'}
                        </p>

                        {/* Card Bottom Meta & Actions */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                            paddingTop: '14px',
                            marginTop: 'auto',
                            gap: '10px',
                          }}
                        >
                          {/* Member Count */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.74rem',
                              color: 'var(--text-dim)',
                            }}
                          >
                            <Users size={14} weight="bold" style={{ color: 'var(--neon-cyan)' }} />
                            <span>{comm.member_count} members</span>
                          </div>

                          {/* Action Button */}
                          {comm.is_joined ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => onNavigate('community', comm)}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Check size={14} weight="bold" />
                                <span>Open space</span>
                              </div>
                            </Button>
                          ) : comm.is_pending ? (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 10px',
                                background: 'rgba(255, 184, 0, 0.1)',
                                border: '1px solid var(--neon-warning)',
                                color: 'var(--neon-warning)',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                              }}
                            >
                              <Clock size={12} weight="bold" />
                              <span>Request pending</span>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              disabled={isLoading}
                              onClick={() => handleJoinClick(comm)}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>{isLoading ? 'Joining…' : isPrivate ? 'Request to join' : 'Join space'}</span>
                                <ArrowRight size={12} weight="bold" />
                              </div>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  }
                />
              );
            })}
          </div>
        ) : (
          /* Empty Search State */
          <div
            style={{
              padding: '64px 24px',
              textAlign: 'center',
              border: '1px solid var(--neon-cyan-border)',
              background: 'var(--bg-surface)',
              maxWidth: '540px',
              margin: '40px auto',
            }}
          >
            <Compass
              size={48}
              weight="bold"
              style={{ color: 'var(--text-dim)', margin: '0 auto 16px auto', display: 'block' }}
            />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: '0 0 8px 0' }}>
              No spaces found
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>
              No communities matched your search criteria "{searchQuery}".
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <Button type="button" variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
                CLEAR SEARCH
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={handleOpenCreateModal}>
                CREATE SPACE
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE SPACE MODAL */}
      {isCreateModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--neon-cyan)',
              boxShadow: '0 0 30px rgba(0, 240, 255, 0.25)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                  Create a new space
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Launch a dedicated community hub saved directly to the database.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {createError && (
              <div
                style={{
                  background: 'rgba(255, 0, 85, 0.1)',
                  border: '1px solid var(--neon-magenta)',
                  color: 'var(--neon-magenta)',
                  padding: '8px 12px',
                  fontSize: '0.82rem',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSpaceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)', marginBottom: '6px' }}>
                  SPACE NAME *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Distributed Systems Lab"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: '#000000',
                    border: '1px solid var(--neon-cyan-border)',
                    color: 'var(--text-primary)',
                    padding: '9px 12px',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)', marginBottom: '6px' }}>
                  DESCRIPTION
                </label>
                <textarea
                  placeholder="What is this community about?"
                  value={newSpaceDescription}
                  onChange={(e) => setNewSpaceDescription(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    background: '#000000',
                    border: '1px solid var(--neon-cyan-border)',
                    color: 'var(--text-primary)',
                    padding: '9px 12px',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)', marginBottom: '6px' }}>
                  COMMUNITY CHARTER / RULES
                </label>
                <textarea
                  placeholder="e.g. 1. Respect peers. 2. Post verified benchmarks."
                  value={newSpaceRules}
                  onChange={(e) => setNewSpaceRules(e.target.value)}
                  rows={2}
                  style={{
                    width: '100%',
                    background: '#000000',
                    border: '1px solid var(--neon-cyan-border)',
                    color: 'var(--text-primary)',
                    padding: '9px 12px',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)', marginBottom: '6px' }}>
                  PRIVACY SETTING
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      background: newSpacePrivacy === 'PUBLIC' ? 'var(--neon-cyan-dim)' : '#000000',
                      border: `1px solid ${newSpacePrivacy === 'PUBLIC' ? 'var(--neon-cyan)' : 'var(--neon-cyan-border)'}`,
                      cursor: 'pointer',
                      fontSize: '0.84rem',
                    }}
                  >
                    <input
                      type="radio"
                      name="privacy"
                      value="PUBLIC"
                      checked={newSpacePrivacy === 'PUBLIC'}
                      onChange={() => setNewSpacePrivacy('PUBLIC')}
                      style={{ accentColor: 'var(--neon-cyan)' }}
                    />
                    <Globe size={16} />
                    <span>Public Space</span>
                  </label>

                  <label
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      background: newSpacePrivacy === 'PRIVATE' ? 'var(--neon-magenta-dim)' : '#000000',
                      border: `1px solid ${newSpacePrivacy === 'PRIVATE' ? 'var(--neon-magenta)' : 'var(--neon-cyan-border)'}`,
                      cursor: 'pointer',
                      fontSize: '0.84rem',
                    }}
                  >
                    <input
                      type="radio"
                      name="privacy"
                      value="PRIVATE"
                      checked={newSpacePrivacy === 'PRIVATE'}
                      onChange={() => setNewSpacePrivacy('PRIVATE')}
                      style={{ accentColor: 'var(--neon-magenta)' }}
                    />
                    <Lock size={16} />
                    <span>Private (Gated)</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                  CANCEL
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={isCreatingSpace || !newSpaceName.trim()}>
                  {isCreatingSpace ? 'CREATING...' : 'CREATE SPACE'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
