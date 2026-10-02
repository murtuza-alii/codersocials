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
// Single Community Post Card
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

  const canTakedown =
    post.can_takedown ||
    (currentUser && post.author?.username === currentUser.username);

  return (
    <article
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--neon-cyan-border)',
        marginBottom: '20px',
        overflow: 'hidden',
        transition: 'border-color 0.2s ease',
      }}
      onPointerEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.4)')}
      onPointerLeave={(e) => (e.currentTarget.style.borderColor = 'var(--neon-cyan-border)')}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              background: '#000000',
              border: '1px solid var(--neon-cyan)',
              clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--neon-cyan)',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
            }}
          >
            {post.author?.username?.slice(0, 2).toUpperCase() || 'AN'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
                @{post.author?.username}
              </span>
              {post.author?.profile?.role && (
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.64rem',
                    color: 'var(--neon-cyan)',
                    border: '1px solid var(--neon-cyan-border)',
                    padding: '0 4px',
                  }}
                >
                  {post.author.profile.role}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              {new Date(post.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

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

      {/* Caption */}
      {post.caption && (
        <div
          style={{
            padding: '0 18px 14px 18px',
            fontSize: '0.9rem',
            lineHeight: 1.55,
            color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {post.caption}
        </div>
      )}

      {/* Media Carousel */}
      <MediaCarousel mediaItems={post.media_items} />

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '10px 18px',
          borderBottom: post.comments?.length > 0 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
        }}
      >
        <button
          type="button"
          onClick={() => onLikeToggle(post.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'transparent',
            border: 'none',
            color: post.is_liked ? 'var(--neon-magenta)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.84rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            transition: 'color 0.2s ease',
          }}
          onPointerEnter={(e) => (e.currentTarget.style.color = 'var(--neon-magenta)')}
          onPointerLeave={(e) => {
            if (!post.is_liked) e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <Heart size={18} weight={post.is_liked ? 'fill' : 'bold'} />
          <span>{post.total_likes}</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('post_detail', { id: post.id, post })}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.84rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            transition: 'color 0.2s ease',
          }}
          onPointerEnter={(e) => (e.currentTarget.style.color = 'var(--neon-cyan)')}
          onPointerLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >
          <ChatCircle size={18} weight="bold" />
          <span>{post.comments?.length || 0}</span>
        </button>
      </div>

      {/* Comments List */}
      {post.comments && post.comments.length > 0 && (
        <div style={{ padding: '8px 18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {post.comments.slice(-2).map((c) => (
            <div key={c.id} style={{ fontSize: '0.82rem', lineHeight: 1.4 }}>
              <span style={{ fontWeight: 700, color: 'var(--neon-cyan)', marginRight: '6px' }}>
                @{c.author?.username}:
              </span>
              <span style={{ color: 'var(--text-primary)' }}>{c.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Quick Comment Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          background: '#000000',
        }}
      >
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Add a comment..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-display)',
            fontSize: '0.84rem',
            padding: '10px 18px',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={!commentText.trim()}
          style={{
            background: 'transparent',
            border: 'none',
            color: commentText.trim() ? 'var(--neon-cyan)' : 'var(--text-dim)',
            padding: '0 16px',
            cursor: commentText.trim() ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s ease',
          }}
        >
          <PaperPlaneTilt size={16} weight="bold" />
        </button>
      </form>

      {/* Takedown Confirmation Modal */}
      <Modal
        isOpen={takedownModalOpen}
        onClose={() => setTakedownModalOpen(false)}
        title="Remove post"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
            Are you sure you want to take down this post from #{post.community?.name || 'this space'}?
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
}) {
  const [community, setCommunity] = useState(initialCommunity || DEFAULT_COMMUNITY);
  const [posts, setPosts] = useState(initialCommunity?.posts || DEFAULT_COMMUNITY.posts);
  const [isPendingRequest, setIsPendingRequest] = useState(initialCommunity?.is_pending || false);
  const [isRequesting, setIsRequesting] = useState(false);

  // Fetch community details from Django
  useEffect(() => {
    let isCancelled = false;
    async function loadCommunity() {
      try {
        const response = await fetch(`/communities/c/${communitySlug}/`, {
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
        });
        if (response.ok) {
          const data = await response.json();
          if (!isCancelled && data.community) {
            setCommunity(data.community);
            if (data.posts) setPosts(data.posts);
            setIsPendingRequest(!!data.membership?.status && data.membership.status === 'PENDING');
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
  }, [communitySlug]);

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

  // Handle Post Comment
  const handleCommentSubmit = (postId, text) => {
    const optimisticComment = {
      id: Date.now(),
      author: { username: currentUser?.username || 'sarah_creator' },
      text,
    };

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments: [...(p.comments || []), optimisticComment] } : p))
    );

    fetch(`/post/${postId}/comment/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: new URLSearchParams({ text }).toString(),
      credentials: 'same-origin',
    }).catch(() => {});
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
              {community.name.slice(0, 2).toUpperCase()}
            </div>

            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', margin: '0 0 8px 0' }}>
              {community.name}
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
                  background: 'rgba(255, 184, 0, 0.1)',
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
              {community.avatar ? (
                <img
                  src={community.avatar}
                  alt={community.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                community.name.slice(0, 2).toUpperCase()
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {community.is_admin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate('manage_members', community)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Gear size={14} weight="bold" />
                    <span>MANAGE SPACE</span>
                  </div>
                </Button>
              )}

              <Button
                variant="primary"
                size="sm"
                onClick={() => onCreatePostClick({ community })}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <PenNib size={14} weight="bold" />
                  <span>POST IN SPACE</span>
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
            {community.name}
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
              <span>{community.privacy}</span>
            </span>

            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Users size={14} weight="bold" />
              <span>{community.member_count} members</span>
            </span>

            <span>•</span>
              <span>Created by @{community.creator?.username || 'admin'}</span>
          </div>

          {community.description && (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              {community.description}
            </p>
          )}
        </div>

        {/* Channels Selector Ribbon */}
        {community.channels && community.channels.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 32px',
              borderTop: '1px solid var(--neon-cyan-border)',
              background: '#000000',
              overflowX: 'auto',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                color: 'var(--text-dim)',
                fontWeight: 700,
                letterSpacing: '0.08em',
                marginRight: '6px',
              }}
            >
              Channels
            </span>

            {community.channels.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => onNavigate('channel', ch)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--neon-cyan-border)',
                  clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
                  padding: '5px 12px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
                onPointerEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--neon-cyan)';
                  e.currentTarget.style.background = 'rgba(0, 240, 255, 0.08)';
                }}
                onPointerLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--neon-cyan-border)';
                  e.currentTarget.style.background = 'var(--bg-surface)';
                }}
              >
                {ch.is_announcement ? (
                  <Megaphone size={14} weight="bold" style={{ color: 'var(--neon-warning)' }} />
                ) : (
                  <Hash size={14} weight="bold" style={{ color: 'var(--neon-cyan)' }} />
                )}
                <span>{ch.name}</span>
              </button>
            ))}
          </div>
        )}
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
    </div>
  );
}
