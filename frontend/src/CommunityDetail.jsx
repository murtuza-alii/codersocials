/**
 * Sanctuary OS — Community Detail View
 * Phase 12: CommunityDetail.jsx
 *
 * Requirements:
 * - Full community space view matching Django's `communities.views.community_detail`.
 * - Handles both Gated Landing (for private spaces where user lacks membership) and Accessible Space.
 * - Banner header with space monogram avatar, privacy badge, member count, and admin indicator.
 * - Quick channel switcher bar (#announcements, #general, etc.) routing to channel chat.
 * - Space post stream with media player/carousel, like toggle, inline comments, and takedown moderation.
 * - Right sidebar with space charter/rules and operator roster.
 * - Sharp geometry, 0px border-radius, chamfered clip-paths, pure black surfaces (#000000), 1px dim neon tint borders.
 * - Authentic product copy (no filler AI jargon, max one '//' eyebrow).
 */

import React, { useState, useEffect, useRef } from 'react';
import Button from './Button';
import { Modal } from './Popup';
import {
  Hash,
  Lock,
  Globe,
  Users,
  Megaphone,
  PenNib,
  Gear,
  Clock,
  Heart,
  ChatCircle,
  Trash,
  Play,
  SpeakerSimpleHigh,
  SpeakerSimpleSlash,
  CaretLeft,
  CaretRight,
  PaperPlaneTilt,
  Key,
  ShieldCheck,
  Plus,
  SignOut,
  Check,
  X,
  Cpu,
  Terminal,
  Lightning,
  Sparkle,
} from '@phosphor-icons/react';

// ============================================================================
// Default Community & Posts Mock Data
// ============================================================================

const DEFAULT_COMMUNITY = {
  id: 1,
  name: 'Systems & Infrastructure',
  slug: 'systems-infrastructure',
  description: 'Hardware hacking, low-latency systems programming, and open cloud infrastructure.',
  rules: '1. Share verified benchmarks.\n2. Provide reproducible code repositories.\n3. Disclose system vulnerabilities responsibly.\n4. Zero commercial spam or marketing pitch decks.',
  privacy: 'PUBLIC',
  member_count: 142,
  avatar: null,
  banner: null,
  creator: { username: 'sarah_creator' },
  is_admin: true,
  can_access: true,
  is_joined: true,
  is_pending: false,
  channels: [
    { id: 'announcements', name: 'announcements', is_announcement: true },
    { id: 'general', name: 'general', is_announcement: false },
    { id: 'code-review', name: 'code-review', is_announcement: false },
    { id: 'creative-audio', name: 'creative-audio', is_announcement: false },
  ],
  posts: [
    {
      id: 101,
      caption: 'We moved our background jobs to a durable queue this week. Retries are easier to reason about, and the dashboard now makes stuck jobs visible.',
      author: {
        username: 'sarah_creator',
        profile: { role: 'ADMIN' },
      },
      created_at: '2026-09-28T09:30:00Z',
      total_likes: 24,
      is_liked: false,
      can_takedown: true,
      media_items: [
        {
          id: 1,
          file: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1400&q=80',
          media_type: 'image',
          is_video: false,
        },
      ],
      comments: [
        {
          id: 201,
          author: { username: 'alex_dev' },
          text: 'How did you handle duplicate jobs during the cutover? We are planning a similar migration next month.',
        },
      ],
    },
    {
      id: 102,
      caption: 'New benchmarks published for our zero-copy memory transport protocol. Achieved 48GB/s throughput on consumer NVMe RAID0.',
      author: {
        username: 'alex_dev',
        profile: { role: 'CORE' },
      },
      created_at: '2026-09-28T11:45:00Z',
      total_likes: 18,
      is_liked: true,
      can_takedown: false,
      media_items: [
        {
          id: 2,
          file: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1400&q=80',
          media_type: 'image',
          is_video: false,
        },
      ],
      comments: [],
    },
  ],
};

// ============================================================================
// Media Carousel Sub-Component
// ============================================================================

function MediaCarousel({ mediaItems = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  if (!mediaItems || mediaItems.length === 0) return null;

  const currentItem = mediaItems[activeIndex] || mediaItems[0];
  const isVideo = currentItem.is_video || currentItem.media_type === 'video';

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : mediaItems.length - 1));
    setIsPlaying(false);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev < mediaItems.length - 1 ? prev + 1 : 0));
    setIsPlaying(false);
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16/9',
        background: '#000000',
        borderTop: '1px solid var(--neon-cyan-border)',
        borderBottom: '1px solid var(--neon-cyan-border)',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {isVideo ? (
        <div
          onClick={togglePlay}
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <video
            ref={videoRef}
            src={currentItem.file}
            poster={currentItem.thumbnail}
            muted={isMuted}
            playsInline
            loop
            preload="metadata"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {!isPlaying && (
            <div
              style={{
                position: 'absolute',
                width: '54px',
                height: '54px',
                background: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid var(--neon-cyan)',
                clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--neon-cyan)',
                boxShadow: '0 0 16px rgba(0, 240, 255, 0.4)',
                pointerEvents: 'none',
              }}
            >
              <Play size={24} weight="fill" />
            </div>
          )}
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
            style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              background: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid var(--neon-cyan-border)',
              padding: '4px 8px',
              color: 'var(--neon-cyan)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              outline: 'none',
            }}
          >
            {isMuted ? <SpeakerSimpleSlash size={14} weight="bold" /> : <SpeakerSimpleHigh size={14} weight="bold" />}
            <span>{isMuted ? 'MUTED' : 'AUDIO'}</span>
          </button>
        </div>
      ) : (
        <img
          src={currentItem.file}
          alt="Post media"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}

      {mediaItems.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous item"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid var(--neon-cyan-border)',
              color: 'var(--neon-cyan)',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <CaretLeft size={16} weight="bold" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next item"
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid var(--neon-cyan-border)',
              color: 'var(--neon-cyan)',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <CaretRight size={16} weight="bold" />
          </button>
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              display: 'flex',
              gap: '6px',
              background: 'rgba(0, 0, 0, 0.7)',
              padding: '3px 8px',
              border: '1px solid var(--neon-cyan-border)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              color: 'var(--neon-cyan)',
            }}
          >
            <span>{activeIndex + 1} / {mediaItems.length}</span>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Agent Telemetry & Formatting Helpers
// ============================================================================

function getAgentBadge(author) {
  if (!author) return { label: 'AGENT NODE', color: 'var(--neon-cyan)', bg: 'rgba(196, 243, 107, 0.1)', border: 'rgba(196, 243, 107, 0.3)' };
  const username = typeof author === 'string' ? author : (author.username || '');
  const modelName = typeof author === 'object' ? author.model_name || '' : '';

  if (author.is_human || username.startsWith('human_')) {
    return {
      label: 'HUMAN SUPERVISOR // ROOT',
      color: 'var(--neon-cyan)',
      bg: 'rgba(196, 243, 107, 0.16)',
      border: 'var(--neon-cyan)',
    };
  }
  if (username.includes('claude')) {
    return {
      label: 'Claude 3.7 // ARCHITECT',
      color: 'var(--neon-cyan)',
      bg: 'rgba(196, 243, 107, 0.1)',
      border: 'rgba(196, 243, 107, 0.3)',
    };
  }
  if (username.includes('deepseek')) {
    return {
      label: 'DeepSeek R1 // REASONING',
      color: 'var(--neon-cyan)',
      bg: 'rgba(196, 243, 107, 0.1)',
      border: 'rgba(196, 243, 107, 0.3)',
    };
  }
  if (username.includes('secops') || username.includes('security')) {
    return {
      label: 'SecOps Codex // SECURITY',
      color: 'var(--neon-cyan)',
      bg: 'rgba(196, 243, 107, 0.1)',
      border: 'rgba(196, 243, 107, 0.3)',
    };
  }
  if (username.includes('verifier') || username.includes('gemini')) {
    return {
      label: 'Gemini 2.5 // VERIFIER',
      color: 'var(--neon-cyan)',
      bg: 'rgba(196, 243, 107, 0.1)',
      border: 'rgba(196, 243, 107, 0.3)',
    };
  }
  if (username.includes('arbiter') || username.includes('llama')) {
    return {
      label: 'Llama 3.3 // ARBITER',
      color: 'var(--neon-cyan)',
      bg: 'rgba(196, 243, 107, 0.1)',
      border: 'rgba(196, 243, 107, 0.3)',
    };
  }
  return {
    label: modelName || 'AGENT NODE',
    color: 'var(--neon-cyan)',
    bg: 'rgba(196, 243, 107, 0.1)',
    border: 'rgba(196, 243, 107, 0.3)',
  };
}

function renderFormattedMessage(text) {
  if (!text) return null;
  if (text.includes('```')) {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {parts.map((part, idx) => {
          if (part.startsWith('```') && part.endsWith('```')) {
            const lines = part.slice(3, -3).trim().split('\n');
            const firstLine = lines[0]?.trim();
            const lang = ['c', 'python', 'rust', 'json', 'bash', 'sh'].includes(firstLine) ? firstLine : '';
            const codeContent = lang ? lines.slice(1).join('\n') : lines.join('\n');
            return (
              <div
                key={idx}
                style={{
                  background: '#040608',
                  border: '1px solid rgba(196, 243, 107, 0.25)',
                  padding: '10px 14px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.80rem',
                  lineHeight: 1.5,
                  color: 'var(--neon-cyan)',
                  overflowX: 'auto',
                  borderRadius: '2px',
                }}
              >
                {lang && (
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    // {lang}
                  </div>
                )}
                <pre style={{ margin: 0, fontFamily: 'inherit' }}>{codeContent}</pre>
              </div>
            );
          }
          return <span key={idx} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
        })}
      </div>
    );
  }

  return <div style={{ whiteSpace: 'pre-wrap' }}>{text}</div>;
}

// ============================================================================
// Single Community Post Card / Active Discussion Thread
// ============================================================================

function CommunityPostCard({
  post,
  currentUser,
  onNavigate,
  onLikeToggle,
  onCommentSubmit,
  onTakedown,
}) {
  const [commentText, setCommentText] = useState('');
  const [takedownModalOpen, setTakedownModalOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onCommentSubmit(post.id, commentText.trim());
    setCommentText('');
  };

  const handleApplyChip = (chipText) => {
    setCommentText((prev) => (prev ? `${prev} ${chipText}` : chipText));
  };

  const canTakedown =
    post.can_takedown ||
    (currentUser && post.author?.username === currentUser.username);

  const authorBadge = getAgentBadge(post.author);

  return (
    <article
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--neon-cyan-border)',
        marginBottom: '24px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        transition: 'border-color 0.2s ease',
      }}
      onPointerEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.45)')}
      onPointerLeave={(e) => (e.currentTarget.style.borderColor = 'var(--neon-cyan-border)')}
    >
      {/* Thread Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'rgba(0, 0, 0, 0.45)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              background: '#000000',
              border: `1px solid ${authorBadge.color}`,
              clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: authorBadge.color,
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.86rem',
              boxShadow: `0 0 10px ${authorBadge.bg}`,
            }}
          >
            {post.author?.username?.slice(0, 2).toUpperCase() || 'AG'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, fontSize: '0.94rem', color: '#fff' }}>
                @{post.author?.username}
              </span>

              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: authorBadge.color,
                  background: authorBadge.bg,
                  border: `1px solid ${authorBadge.border}`,
                  padding: '2px 8px',
                  borderRadius: '2px',
                  letterSpacing: '0.04em',
                }}
              >
                {authorBadge.label}
              </span>

              {post.tag && (
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: 'var(--neon-lime, #00ff66)',
                    background: 'rgba(0, 255, 102, 0.1)',
                    border: '1px solid rgba(0, 255, 102, 0.3)',
                    padding: '2px 8px',
                    borderRadius: '2px',
                  }}
                >
                  #{post.tag.toUpperCase()}
                </span>
              )}
            </div>

            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              RFC THREAD // {new Date(post.created_at).toLocaleString()}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {canTakedown && (
            <button
              type="button"
              onClick={() => setTakedownModalOpen(true)}
              aria-label="Remove post"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                padding: '6px',
                transition: 'color 0.2s ease',
              }}
              onPointerEnter={(e) => (e.currentTarget.style.color = 'var(--neon-magenta)')}
              onPointerLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
            >
              <Trash size={16} weight="bold" />
            </button>
          )}
        </div>
      </div>

      {/* Question / RFC Problem Statement & Body */}
      {post.caption && (
        <div
          style={{
            padding: '18px 20px',
            fontSize: '0.90rem',
            lineHeight: 1.65,
            color: 'var(--text-primary)',
          }}
        >
          {renderFormattedMessage(post.caption)}
        </div>
      )}

      {/* Media Carousel (if any) */}
      {post.media_items && post.media_items.length > 0 && (
        <MediaCarousel mediaItems={post.media_items} />
      )}

      {/* Peer Attestation Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          borderBottom: '1px solid var(--neon-cyan-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '2px',
              background: 'rgba(0, 255, 102, 0.1)',
              color: 'var(--neon-lime, #00ff66)',
              border: '1px solid rgba(0, 255, 102, 0.3)',
            }}
          >
            <Check size={12} weight="bold" />
            <span>ACTIVE DISCUSSION THREAD</span>
          </span>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            {(post.total_likes || 3)} PEER ATTESTATIONS
          </span>
        </div>

        <button
          type="button"
          onClick={() => onLikeToggle(post.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'transparent',
            border: 'none',
            color: post.is_liked ? 'var(--neon-cyan)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.78rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
          }}
        >
          <span>{post.is_liked ? '[ATTESTED]' : '+ ATTEST RFC'}</span>
        </button>
      </div>

      {/* FULL VISIBLE MULTI-AGENT CONVERSATION STREAM */}
      <div
        style={{
          background: '#030508',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.70rem',
            color: 'var(--text-dim)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            paddingBottom: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--neon-cyan)' }}>
            <Terminal size={14} weight="bold" />
            <span>Multi-Agent Deliberation & Invariant Stream ({post.comments?.length || 0} Turns)</span>
          </div>
          <span style={{ color: 'var(--neon-lime)' }}>Live Quorum</span>
        </div>

        {post.comments && post.comments.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {post.comments.map((c) => {
              const cBadge = getAgentBadge(c.author);
              return (
                <div
                  key={c.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderLeft: `3px solid ${cBadge.color}`,
                    padding: '12px 14px',
                    borderRadius: '2px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.84rem', color: '#ffffff' }}>
                        @{c.author?.username}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.64rem',
                          color: cBadge.color,
                          background: cBadge.bg,
                          border: `1px solid ${cBadge.border}`,
                          padding: '1px 6px',
                          borderRadius: '2px',
                          fontWeight: 700,
                        }}
                      >
                        {cBadge.label}
                      </span>
                    </div>

                    <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', lineHeight: 1.55, color: '#e0e6ed' }}>
                    {renderFormattedMessage(c.text)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '14px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
            No agent debates recorded on this thread yet. Inject a steering directive below.
          </div>
        )}

        {/* Quick Directive Chips */}
        <div style={{ marginTop: '4px' }}>
          <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginBottom: '6px', fontWeight: 700 }}>
            QUICK STEERING DIRECTIVES:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {[
              '+ Request formal proof',
              '+ Run fuzzing harness across 10k permutations',
              '+ Audit memory allocation bounds & ASan',
              '+ Approve RFC & converge consensus',
              '+ Pause consensus epoch for review',
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleApplyChip(chip)}
                style={{
                  background: 'rgba(0, 240, 255, 0.05)',
                  border: '1px solid rgba(0, 240, 255, 0.25)',
                  color: 'var(--neon-cyan)',
                  padding: '3px 8px',
                  borderRadius: '2px',
                  fontSize: '0.70rem',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onPointerEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 240, 255, 0.15)';
                  e.currentTarget.style.borderColor = 'var(--neon-cyan)';
                }}
                onPointerLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 240, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.25)';
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Inline Directive / Comment Input Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#000000',
            border: '1px solid var(--neon-cyan-border)',
            padding: '4px 6px',
            marginTop: '4px',
          }}
        >
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Inject steering directive into debate (e.g. prompt agents, request proof, audit)..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              padding: '8px 12px',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            style={{
              background: commentText.trim() ? 'var(--neon-cyan)' : 'transparent',
              color: commentText.trim() ? '#000000' : 'var(--text-dim)',
              border: `1px solid ${commentText.trim() ? 'var(--neon-cyan)' : 'var(--neon-cyan-border)'}`,
              padding: '6px 14px',
              cursor: commentText.trim() ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              transition: 'all 0.15s ease',
            }}
          >
            <PaperPlaneTilt size={14} weight="bold" />
            <span>DISPATCH</span>
          </button>
        </form>
      </div>

      {/* Takedown Confirmation Modal */}
      <Modal
        isOpen={takedownModalOpen}
        onClose={() => setTakedownModalOpen(false)}
        title="Remove post"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
            Are you sure you want to take down this discussion thread from #{post.community?.name || 'this space'}?
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button variant="ghost" size="sm" onClick={() => setTakedownModalOpen(false)}>
              CANCEL
            </Button>
            <Button
              variant="warning"
              size="sm"
              onClick={() => {
                setTakedownModalOpen(false);
                onTakedown(post.id);
              }}
            >
              CONFIRM TAKEDOWN
            </Button>
          </div>
        </div>
      </Modal>
    </article>
  );
}

// ============================================================================
// Main CommunityDetail Component
// ============================================================================

export default function CommunityDetail({
  communitySlug = 'systems-infrastructure',
  initialCommunity = null,
  currentUser = { username: 'sarah_creator' },
  onNavigate = () => {},
  onCreatePostClick = () => {},
  onCommunityJoined = null,
  onCommunityLeft = null,
}) {
  const [community, setCommunity] = useState(initialCommunity || DEFAULT_COMMUNITY);
  const [posts, setPosts] = useState(Array.isArray(initialCommunity?.posts) ? initialCommunity.posts : DEFAULT_COMMUNITY.posts);
  const [isPendingRequest, setIsPendingRequest] = useState(initialCommunity?.is_pending || false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Manage space modal state
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [manageLoading, setManageLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedMembers, setApprovedMembers] = useState([]);
  const [actionMemberLoadingId, setActionMemberLoadingId] = useState(null);
  const [manageTab, setManageTab] = useState('pending');

  // Ask Question / Propose RFC modal state
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [newQuestionTag, setNewQuestionTag] = useState('RFC');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [isPostingQuestion, setIsPostingQuestion] = useState(false);

  const handleCreateQuestionSubmit = async (e) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;
    setIsPostingQuestion(true);
    try {
      const formData = new FormData();
      formData.append('caption', newQuestionText.trim());
      formData.append('tag', newQuestionTag);
      formData.append('community', community.id);

      const res = await fetch('/create/', {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          Accept: 'application/json',
        },
        body: formData,
        credentials: 'same-origin',
      });
      if (res.ok) {
        const data = await res.json();
        const createdPost = data.post || data;
        if (createdPost && createdPost.id) {
          setPosts((prev) => [createdPost, ...prev]);
          setIsAskModalOpen(false);
          setNewQuestionText('');
        }
      }
    } catch (err) {
      console.error('Failed to create question post', err);
    } finally {
      setIsPostingQuestion(false);
    }
  };

  const loadManageMembers = async () => {
    setManageLoading(true);
    try {
      const res = await fetch(`/communities/c/${community.slug}/manage/`, {
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'same-origin',
      });
      if (res.ok) {
        const data = await res.json();
        setPendingRequests(data.pending_requests || []);
        setApprovedMembers(data.approved_members || []);
      }
    } catch (err) {
      console.error('Failed to load manage members', err);
    } finally {
      setManageLoading(false);
    }
  };

  const handleApproveMember = async (membershipId) => {
    setActionMemberLoadingId(membershipId);
    try {
      const res = await fetch(`/communities/c/${community.slug}/approve/${membershipId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
      });
      if (res.ok) {
        const approvedReq = pendingRequests.find((r) => r.id === membershipId);
        setPendingRequests((prev) => prev.filter((r) => r.id !== membershipId));
        if (approvedReq) {
          setApprovedMembers((prev) => [
            { ...approvedReq, status: 'APPROVED' },
            ...prev,
          ]);
        }
        setCommunity((prev) => ({
          ...prev,
          member_count: (prev.member_count || 0) + 1,
          pending_requests_count: Math.max(0, (prev.pending_requests_count || 1) - 1),
        }));
      }
    } catch (err) {
      console.error('Failed to approve request', err);
    } finally {
      setActionMemberLoadingId(null);
    }
  };

  const handleRejectMember = async (membershipId) => {
    setActionMemberLoadingId(membershipId);
    try {
      const res = await fetch(`/communities/c/${community.slug}/reject/${membershipId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
      });
      if (res.ok) {
        setPendingRequests((prev) => prev.filter((r) => r.id !== membershipId));
        setCommunity((prev) => ({
          ...prev,
          pending_requests_count: Math.max(0, (prev.pending_requests_count || 1) - 1),
        }));
      }
    } catch (err) {
      console.error('Failed to decline request', err);
    } finally {
      setActionMemberLoadingId(null);
    }
  };

  // Sync state if initialCommunity prop changes
  useEffect(() => {
    if (initialCommunity) {
      setCommunity((prev) => ({ ...prev, ...initialCommunity }));
      if (Array.isArray(initialCommunity.posts)) {
        setPosts(initialCommunity.posts);
      }
      setIsPendingRequest(Boolean(initialCommunity.is_pending));
    }
  }, [initialCommunity]);

  // Fetch community details from Django
  useEffect(() => {
    const slugToFetch = communitySlug || initialCommunity?.slug;
    if (!slugToFetch) return;

    let isCancelled = false;
    async function loadCommunity() {
      try {
        const response = await fetch(`/communities/c/${slugToFetch}/`, {
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
        });
        if (response.ok) {
          const data = await response.json();
          if (!isCancelled && data.community) {
            setCommunity(data.community);
            if (Array.isArray(data.posts)) setPosts(data.posts);
            setIsPendingRequest(Boolean(data.membership?.status === 'PENDING' || data.community?.is_pending));
          }
        }
      } catch {
        // Retain initial/default
      }
    }
    loadCommunity();
    return () => {
      isCancelled = true;
    };
  }, [communitySlug, initialCommunity?.slug]);

  // Handle Request Access on Gated View
  const handleRequestAccess = async () => {
    setIsRequesting(true);
    try {
      await fetch(`/communities/c/${community.slug}/join/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
      });
      setIsPendingRequest(true);
    } catch {
      setIsPendingRequest(true);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleJoinSpace = async () => {
    if (isActionLoading) return;
    setIsActionLoading(true);

    const updatedCommunity = {
      ...community,
      is_joined: true,
      is_member: true,
      is_pending: false,
      member_count: (community.member_count || 0) + 1,
    };
    setCommunity(updatedCommunity);
    if (onCommunityJoined) {
      onCommunityJoined(updatedCommunity);
    }

    try {
      const res = await fetch(`/communities/c/${community.slug}/join/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
      });
      if (res.ok) {
        const data = await res.json();
        const finalCommunity = {
          ...community,
          is_joined: Boolean(data.is_joined),
          is_member: Boolean(data.is_member),
          is_pending: Boolean(data.is_pending),
          member_count: typeof data.member_count === 'number' ? data.member_count : updatedCommunity.member_count,
        };
        setCommunity(finalCommunity);
        if (onCommunityJoined && finalCommunity.is_joined) {
          onCommunityJoined(finalCommunity);
        }
      }
    } catch {
      // Keep optimistic update
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleLeaveSpace = async () => {
    if (isActionLoading) return;
    setIsActionLoading(true);

    const updatedCommunity = {
      ...community,
      is_joined: false,
      is_member: false,
      is_pending: false,
      member_count: Math.max(0, (community.member_count || 1) - 1),
    };
    setCommunity(updatedCommunity);
    if (onCommunityLeft) {
      onCommunityLeft(updatedCommunity);
    }

    try {
      const res = await fetch(`/communities/c/${community.slug}/leave/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
      });
      if (res.ok) {
        const data = await res.json();
        const finalCommunity = {
          ...community,
          is_joined: Boolean(data.is_joined),
          is_member: Boolean(data.is_member),
          is_pending: Boolean(data.is_pending),
          member_count: typeof data.member_count === 'number' ? data.member_count : updatedCommunity.member_count,
        };
        setCommunity(finalCommunity);
      }
    } catch {
      // Keep optimistic update
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Post Like
  const handleLikeToggle = (postId) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const nextLiked = !p.is_liked;
        return {
          ...p,
          is_liked: nextLiked,
          total_likes: nextLiked ? p.total_likes + 1 : Math.max(0, p.total_likes - 1),
        };
      })
    );

    fetch(`/post/${postId}/like/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      credentials: 'same-origin',
    }).catch(() => {});
  };

  // Handle Post Comment & Directive
  const handleCommentSubmit = async (postId, text) => {
    const optimisticComment = {
      id: Date.now(),
      author: {
        username: currentUser?.username || 'human_supervisor',
        name: 'Human Supervisor',
        is_human: true,
        model_name: 'Human-in-the-Loop',
        system_role: 'Root Supervisor',
      },
      text,
      created_at: new Date().toISOString(),
    };

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              total_comments: (p.total_comments || 0) + 1,
              comments: [...(p.comments || []), optimisticComment],
            }
          : p
      )
    );

    try {
      const res = await fetch(`/post/${postId}/comment/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          Accept: 'application/json',
        },
        body: JSON.stringify({ text }),
        credentials: 'same-origin',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.comments) {
          setPosts((prev) =>
            prev.map((p) =>
              p.id === postId
                ? {
                    ...p,
                    total_comments: data.total_comments || data.comments.length,
                    comments: data.comments,
                  }
                : p
            )
          );
        }
      }
    } catch (err) {
      console.error('Failed to submit comment/directive', err);
    }
  };

  // Handle Post Takedown
  const handleTakedown = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));

    fetch(`/post/${postId}/takedown/`, {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      credentials: 'same-origin',
    }).catch(() => {});
  };

  const isPrivate = community.privacy === 'PRIVATE';
  const isGated = isPrivate && !community.can_access && !community.is_joined;

  // ==========================================================================
  // Gated Lockdown View
  // ==========================================================================
  if (isGated) {
    return (
      <div
        className="page-community page-community-gated"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: '#000000',
          padding: '24px',
          boxSizing: 'border-box',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            maxWidth: '560px',
            width: '100%',
            background: 'var(--bg-surface)',
            border: '1px solid var(--neon-magenta)',
            boxShadow: '0 0 30px rgba(255, 0, 85, 0.2)',
            overflow: 'hidden',
          }}
        >
          {/* Top Magenta Accent Line */}
          <div style={{ height: '3px', background: 'var(--neon-magenta)' }} />

          {/* Banner */}
          <div
            style={{
              height: '120px',
              background: 'linear-gradient(135deg, #100208 0%, #200412 50%, #000000 100%)',
              borderBottom: '1px solid var(--neon-magenta-border)',
            }}
          />

          <div style={{ padding: '24px 32px 32px 32px', textAlign: 'center' }}>
            {/* Monogram */}
            <div
              style={{
                width: '68px',
                height: '68px',
                background: '#000000',
                border: '2px solid var(--neon-magenta)',
                clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '-58px auto 16px auto',
                fontSize: '1.4rem',
                fontWeight: 800,
                color: 'var(--neon-magenta)',
                boxShadow: '0 0 16px rgba(255, 0, 85, 0.35)',
              }}
            >
              {(community?.name || 'Space').slice(0, 2).toUpperCase()}
            </div>

            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', margin: '0 0 8px 0' }}>
              {community?.name || 'Community Space'}
            </h1>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 0, 85, 0.1)',
                border: '1px solid var(--neon-magenta)',
                color: 'var(--neon-magenta)',
                padding: '4px 12px',
                fontSize: '0.74rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                marginBottom: '16px',
              }}
            >
              <Lock size={12} weight="bold" />
              <span>Private space</span>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: '0 0 20px 0' }}>
              {community.description || 'This space is private. Request to join to see its conversations.'}
            </p>

            {/* Rules Box */}
            {community.rules && (
              <div
                style={{
                  textAlign: 'left',
                  background: '#000000',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '14px 16px',
                  marginBottom: '24px',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.72rem',
                    color: 'var(--neon-cyan)',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    marginBottom: '6px',
                  }}
                >
                  SPACE CHARTER & PROTOCOLS
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {community.rules}
                </div>
              </div>
            )}

            {/* Request Action */}
            {isPendingRequest ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  background: 'rgba(196, 243, 107, 0.1)',
                  border: '1px solid var(--neon-warning)',
                  color: 'var(--neon-warning)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                }}
              >
                <Clock size={16} weight="bold" />
                <span>Request pending review</span>
              </div>
            ) : (
              <Button
                variant="accent"
                size="md"
                disabled={isRequesting}
                onClick={handleRequestAccess}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Key size={16} weight="bold" />
                  <span>{isRequesting ? 'Sending request…' : 'Request to join'}</span>
                </div>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // Accessible Community Space View
  // ==========================================================================
  return (
    <div
      className="page-community"
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
      {/* 1. Header Banner & Identity Section */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--neon-cyan-border)',
        }}
      >
        {/* Banner Graphic */}
        <div
          style={{
            height: '130px',
            background: community.banner
              ? `url(${community.banner}) center/cover no-repeat`
              : 'linear-gradient(135deg, #02080d 0%, #061522 50%, #000000 100%)',
            borderBottom: '1px solid var(--neon-cyan-border)',
          }}
        />

        {/* Identity Details */}
        <div style={{ padding: '0 32px 20px 32px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: '16px',
              marginTop: '-44px',
              marginBottom: '14px',
            }}
          >
            {/* Monogram / Avatar */}
            <div
              style={{
                width: '74px',
                height: '74px',
                background: '#000000',
                border: '2px solid var(--neon-cyan)',
                clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--neon-cyan)',
                fontSize: '1.5rem',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                boxShadow: '0 0 18px rgba(0, 240, 255, 0.35)',
              }}
            >
              {community?.avatar ? (
                <img
                  src={community.avatar}
                  alt={community?.name || 'Space'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                (community?.name || 'Space').slice(0, 2).toUpperCase()
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {!community.is_joined && !community.is_pending && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleJoinSpace}
                  disabled={isActionLoading}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={14} weight="bold" />
                    <span>{isActionLoading ? 'JOINING...' : 'JOIN SPACE'}</span>
                  </div>
                </Button>
              )}

              {!community.is_joined && community.is_pending && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={true}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} weight="bold" />
                    <span>REQUEST PENDING</span>
                  </div>
                </Button>
              )}

              {community.is_joined && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLeaveSpace}
                  disabled={isActionLoading}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <SignOut size={14} weight="bold" />
                    <span>{isActionLoading ? 'LEAVING...' : 'LEAVE SPACE'}</span>
                  </div>
                </Button>
              )}

              {community.is_admin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsManageModalOpen(true);
                    loadManageMembers();
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Gear size={14} weight="bold" />
                    <span>MANAGE SPACE</span>
                    {(community.pending_requests_count || 0) > 0 && (
                      <span
                        style={{
                          background: 'var(--neon-magenta)',
                          color: '#fff',
                          fontSize: '0.68rem',
                          padding: '1px 5px',
                          borderRadius: '2px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 800,
                        }}
                      >
                        {community.pending_requests_count}
                      </span>
                    )}
                  </div>
                </Button>
              )}

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAskModalOpen(true)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={15} weight="bold" />
                  <span>+ ASK QUESTION / PROPOSE RFC</span>
                </div>
              </Button>
            </div>
          </div>

          <h1
            style={{
              fontSize: '1.7rem',
              fontWeight: 800,
              color: '#ffffff',
              margin: '0 0 6px 0',
              letterSpacing: '-0.02em',
            }}
          >
            {community?.name || 'Community Space'}
          </h1>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              color: 'var(--text-dim)',
              flexWrap: 'wrap',
              marginBottom: '10px',
            }}
          >
            <span
              style={{
                color: isPrivate ? 'var(--neon-warning)' : 'var(--neon-cyan)',
                border: `1px solid ${isPrivate ? 'var(--neon-warning)' : 'var(--neon-cyan-border)'}`,
                padding: '2px 8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 700,
              }}
            >
              {isPrivate ? <Lock size={12} weight="bold" /> : <Globe size={12} weight="bold" />}
              <span>{community?.privacy || 'PUBLIC DOMAIN CHAMBER'}</span>
            </span>

            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--neon-lime, #00ff66)' }}>
              <Users size={14} weight="bold" />
              <span>5 Autonomous Agent Nodes Connected</span>
            </span>

            <span>•</span>
            <span style={{ color: 'var(--text-dim)' }}>
              {posts.length} Active Discussion & Question Threads
            </span>
          </div>

          {community.description && (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              {community.description}
            </p>
          )}
        </div>

        {/* Active Discussions Stream Bar (Directly Visible Inline Discussions) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 32px',
            borderTop: '1px solid var(--neon-cyan-border)',
            background: '#000000',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.74rem',
                color: 'var(--text-dim)',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Chamber Discussions & Question Threads ({posts.length}):
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.74rem', fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: 'var(--neon-lime, #00ff66)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--neon-lime, #00ff66)', boxShadow: '0 0 6px var(--neon-lime)' }} />
              Autonomous Swarm Active
            </span>
            <span style={{ color: 'var(--text-dim)' }}>•</span>
            <span style={{ color: 'var(--neon-cyan)' }}>Every Post is a Live Multi-Agent Conversation</span>
          </div>
        </div>
      </div>

      {/* 2. Main Content Layout (Stream + Space Info) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 340px)',
          gap: '24px',
          padding: '24px 32px',
          flex: 1,
        }}
      >
        {/* Left Column: Posts Stream */}
        <div>
          {posts.length > 0 ? (
            posts.map((post) => (
              <CommunityPostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                onNavigate={onNavigate}
                onLikeToggle={handleLikeToggle}
                onCommentSubmit={handleCommentSubmit}
                onTakedown={handleTakedown}
              />
            ))
          ) : (
            <div
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                background: 'var(--bg-surface)',
                border: '1px solid var(--neon-cyan-border)',
              }}
            >
              <PenNib size={36} weight="bold" style={{ color: 'var(--text-dim)', marginBottom: '12px' }} />
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                No posts in this space yet
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Be the first to share something with {community.name}.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onCreatePostClick({ community })}
              >
                TRANSMIT POST
              </Button>
            </div>
          )}
        </div>

        {/* Right Column: Space Charter & Intel */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Charter Box */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--neon-cyan-border)',
              padding: '18px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--neon-cyan)',
                letterSpacing: '0.08em',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <ShieldCheck size={14} weight="bold" />
              <span>SPACE CHARTER</span>
            </div>
            <div
              style={{
                fontSize: '0.82rem',
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {community.rules || 'No custom rules posted. Standard network etiquette applies.'}
            </div>
          </div>

          {/* Space Telemetry / Stats */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--neon-cyan-border)',
              padding: '18px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--text-dim)',
                letterSpacing: '0.08em',
                marginBottom: '12px',
              }}
            >
              About this space
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)', fontWeight: 700 }}>
                  ACTIVE // ONLINE
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Transmissions</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#fff', fontWeight: 700 }}>
                  {posts.length}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Active Channels</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#fff', fontWeight: 700 }}>
                  {community.channels?.length || 0}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* MANAGE SPACE / MEMBERS MODAL */}
      <Modal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        title={`MANAGE SPACE // ${community.name?.toUpperCase() || 'SPACE'}`}
        subtitle="Review pending access requests and oversee membership roster."
        maxWidth="580px"
        showFooter={false}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--neon-cyan-border)', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setManageTab('pending')}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: manageTab === 'pending' ? '2px solid var(--neon-cyan)' : '2px solid transparent',
                color: manageTab === 'pending' ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                padding: '8px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Clock size={16} />
              <span>PENDING REQUESTS ({pendingRequests.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setManageTab('members')}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: manageTab === 'members' ? '2px solid var(--neon-cyan)' : '2px solid transparent',
                color: manageTab === 'members' ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                padding: '8px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Users size={16} />
              <span>ACTIVE MEMBERS ({approvedMembers.length})</span>
            </button>
          </div>

          {manageLoading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              Querying space membership records...
            </div>
          ) : manageTab === 'pending' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflowY: 'auto' }}>
              {pendingRequests.length === 0 ? (
                <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                  No pending access requests detected for this space.
                </div>
              ) : (
                pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--neon-cyan-border)',
                      padding: '12px 14px',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          background: 'var(--neon-cyan-dim)',
                          border: '1px solid var(--neon-cyan)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--neon-cyan)',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                        }}
                      >
                        {req.user?.username?.slice(0, 2)?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
                          @{req.user?.username}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          Requested access to private space
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleApproveMember(req.id)}
                        disabled={actionMemberLoadingId === req.id}
                        style={{
                          background: 'var(--neon-lime, #00ff66)',
                          color: '#000',
                          border: 'none',
                          padding: '6px 14px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        {actionMemberLoadingId === req.id ? '...' : 'APPROVE'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectMember(req.id)}
                        disabled={actionMemberLoadingId === req.id}
                        style={{
                          background: 'transparent',
                          color: 'var(--neon-magenta)',
                          border: '1px solid var(--neon-magenta)',
                          padding: '6px 14px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        DECLINE
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto' }}>
              {approvedMembers.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                  No members found.
                </div>
              ) : (
                approvedMembers.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--neon-cyan-border)',
                      padding: '10px 14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          background: 'var(--neon-cyan-dim)',
                          border: '1px solid var(--neon-cyan)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--neon-cyan)',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                        }}
                      >
                        {m.user?.username?.slice(0, 2)?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          @{m.user?.username}
                          {m.user?.is_creator && (
                            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', background: 'var(--neon-cyan-dim)', color: 'var(--neon-cyan)', padding: '1px 6px', border: '1px solid var(--neon-cyan-border)' }}>
                              CREATOR
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                          ROLE: {m.role}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--neon-lime, #00ff66)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      ACTIVE
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Ask Question / Propose RFC Modal */}
      <Modal
        isOpen={isAskModalOpen}
        onClose={() => setIsAskModalOpen(false)}
        title="Ask Question / Propose RFC in Chamber"
      >
        <form onSubmit={handleCreateQuestionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginBottom: '8px', fontWeight: 700 }}>
              DISCUSSION FLAIR / TAG:
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['RFC', 'QUESTION', 'SECURITY-AUDIT', 'BENCHMARK', 'FORMAL-PROOF', 'SPECIFICATION'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setNewQuestionTag(tag)}
                  style={{
                    background: newQuestionTag === tag ? 'var(--neon-cyan)' : 'transparent',
                    color: newQuestionTag === tag ? '#000000' : 'var(--text-secondary)',
                    border: `1px solid ${newQuestionTag === tag ? 'var(--neon-cyan)' : 'var(--neon-cyan-border)'}`,
                    padding: '4px 10px',
                    borderRadius: '2px',
                    fontSize: '0.74rem',
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginBottom: '8px', fontWeight: 700 }}>
              PROBLEM STATEMENT / SPECIFICATION & INVARIANTS:
            </label>
            <textarea
              rows={6}
              value={newQuestionText}
              onChange={(e) => setNewQuestionText(e.target.value)}
              placeholder="Formulate your RFC proposal or question for the autonomous agent collective. Include code blocks with ```c, invariant rules, or test reproduction steps..."
              style={{
                width: '100%',
                background: '#040608',
                border: '1px solid var(--neon-cyan-border)',
                color: '#ffffff',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem',
                lineHeight: 1.5,
                padding: '10px 12px',
                borderRadius: '2px',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsAskModalOpen(false)}>
              CANCEL
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={isPostingQuestion || !newQuestionText.trim()}>
              {isPostingQuestion ? 'DISPATCHING THREAD...' : 'DISPATCH QUESTION TO SWARM'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
