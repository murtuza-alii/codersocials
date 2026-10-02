/**
 * Sanctuary OS — Post Detail View
 * Phase 10: PostDetail.jsx
 *
 * Requirements:
 * - High-density 2-column cyberpunk workbench layout.
 * - Left column: Full-resolution multi-media gallery / video player (zero test patterns) with slide controls.
 * - Right column: Post author credentials, community anchor, timestamp, threaded comments scroll,
 *   optimistic like toggle, share action, and live comment composer.
 * - Takedown confirmation modal with danger styling (Popup/Modal integration).
 * - Smooth cubic-bezier transitions, zero jarring 180° card flips.
 * - Sharp 0px border-radius, chamfered clip-paths, pure black surfaces (#000000), 1px dim neon tint borders.
 * - Authentic product copy (no filler AI jargon, max one '//' eyebrow).
 */

import React, { useState, useEffect, useRef } from 'react';
import Button from './Button';
import { Modal } from './Popup';
import {
  CaretLeft,
  CaretRight,
  Heart,
  ChatCircle,
  ShareNetwork,
  Trash,
  Play,
  SpeakerSimpleHigh,
  SpeakerSimpleSlash,
  PaperPlaneTilt,
  ArrowLeft,
  Check,
  Hash,
  Clock,
} from '@phosphor-icons/react';

// ============================================================================
// Fallback Mock Post (matching Django Post ORM structure)
// ============================================================================

const DEFAULT_POST = {
  id: 1,
  caption: 'We moved our background jobs to a durable queue this week. Retries are easier to reason about, and the dashboard now makes stuck jobs visible.',
  author: {
    username: 'sarah_creator',
    avatar: null,
    profile: {
      bio: 'Systems architect & audio engineer',
      role: 'ADMIN',
    },
  },
  community: {
    id: 1,
    name: 'Systems & Infrastructure',
    slug: 'systems-infrastructure',
    is_private: false,
  },
  created_at: '2026-09-28T09:30:00Z',
  total_likes: 24,
  is_liked: false,
  can_takedown: true,
  media_items: [
    {
      id: 1,
      file: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=80',
      media_type: 'image',
      is_video: false,
    },
    {
      id: 2,
      file: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=80',
      media_type: 'image',
      is_video: false,
    },
  ],
  comments: [
    {
      id: 101,
      author: { username: 'alex_dev', avatar: null },
      text: 'How did you handle duplicate jobs during the cutover? We are planning a similar migration next month.',
      created_at: '2026-09-28T10:15:00Z',
    },
    {
      id: 102,
      author: { username: 'code_ninja', avatar: null },
      text: 'Verified on desktop and mobile clients. Zero frame drops across 24 test streams.',
      created_at: '2026-09-28T11:00:00Z',
    },
    {
      id: 103,
      author: { username: 'elena_sound', avatar: null },
      text: 'Spatial audio channel separation is crisp. No phase distortion detected on multi-track testing.',
      created_at: '2026-09-28T12:30:00Z',
    },
  ],
};

// ============================================================================
// Media Viewer Component
// ============================================================================

function MediaViewer({ items = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  if (!items || items.length === 0) return null;

  const currentItem = items[activeIndex] || items[0];
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

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    setIsPlaying(false);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    setIsPlaying(false);
  };

  return (
    <div
      className="page-post-detail"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#000000',
      }}
    >
      {/* Main Viewport Stage */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          minHeight: '380px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000000',
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
              style={{
                width: '100%',
                height: '100%',
                maxHeight: '75vh',
                objectFit: 'contain',
              }}
            />

            {!isPlaying && (
              <div
                style={{
                  position: 'absolute',
                  width: '64px',
                  height: '64px',
                  background: 'rgba(0, 0, 0, 0.85)',
                  border: '1px solid var(--neon-cyan)',
                  clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--neon-cyan)',
                  boxShadow: '0 0 20px rgba(0, 240, 255, 0.45)',
                  pointerEvents: 'none',
                  transition: 'transform 0.2s ease',
                }}
              >
                <Play size={28} weight="fill" />
              </div>
            )}

            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              style={{
                position: 'absolute',
                bottom: '16px',
                right: '16px',
                background: 'rgba(0, 0, 0, 0.85)',
                border: '1px solid var(--neon-cyan-border)',
                clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
                padding: '6px 12px',
                color: 'var(--neon-cyan)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                outline: 'none',
                transition: 'background 0.2s ease, color 0.2s ease',
              }}
              onPointerEnter={(e) => {
                e.currentTarget.style.background = 'var(--neon-cyan)';
                e.currentTarget.style.color = '#000000';
              }}
              onPointerLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.85)';
                e.currentTarget.style.color = 'var(--neon-cyan)';
              }}
            >
              {isMuted ? <SpeakerSimpleSlash size={16} weight="bold" /> : <SpeakerSimpleHigh size={16} weight="bold" />}
              <span>{isMuted ? 'MUTED' : 'AUDIO'}</span>
            </button>
          </div>
        ) : (
          <img
            src={currentItem.file}
            alt="Post content"
            style={{
              width: '100%',
              height: '100%',
              maxHeight: '75vh',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        )}

        {/* Carousel Prev/Next Arrows */}
        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous item"
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0, 0, 0, 0.85)',
                border: '1px solid var(--neon-cyan-border)',
                clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
                color: 'var(--neon-cyan)',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s ease, color 0.2s ease, border-color 0.2s ease',
              }}
              onPointerEnter={(e) => {
                e.currentTarget.style.background = 'var(--neon-cyan)';
                e.currentTarget.style.color = '#000000';
                e.currentTarget.style.borderColor = 'var(--neon-cyan)';
              }}
              onPointerLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.85)';
                e.currentTarget.style.color = 'var(--neon-cyan)';
                e.currentTarget.style.borderColor = 'var(--neon-cyan-border)';
              }}
            >
              <CaretLeft size={20} weight="bold" />
            </button>

            <button
              type="button"
              onClick={handleNext}
              aria-label="Next item"
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0, 0, 0, 0.85)',
                border: '1px solid var(--neon-cyan-border)',
                clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
                color: 'var(--neon-cyan)',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s ease, color 0.2s ease, border-color 0.2s ease',
              }}
              onPointerEnter={(e) => {
                e.currentTarget.style.background = 'var(--neon-cyan)';
                e.currentTarget.style.color = '#000000';
                e.currentTarget.style.borderColor = 'var(--neon-cyan)';
              }}
              onPointerLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.85)';
                e.currentTarget.style.color = 'var(--neon-cyan)';
                e.currentTarget.style.borderColor = 'var(--neon-cyan-border)';
              }}
            >
              <CaretRight size={20} weight="bold" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Filmstrip (if multi-item) */}
      {items.length > 1 && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '12px 16px',
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--neon-cyan-border)',
            overflowX: 'auto',
          }}
        >
          {items.map((item, idx) => (
            <button
              key={item.id || idx}
              type="button"
              onClick={() => {
                setActiveIndex(idx);
                setIsPlaying(false);
              }}
              style={{
                width: '64px',
                height: '48px',
                padding: 0,
                border: idx === activeIndex ? '2px solid var(--neon-cyan)' : '1px solid rgba(255, 255, 255, 0.12)',
                background: '#000000',
                cursor: 'pointer',
                overflow: 'hidden',
                flexShrink: 0,
                transition: 'border-color 0.15s ease',
                position: 'relative',
              }}
            >
              <img
                src={item.thumbnail || item.file}
                alt={`Thumbnail ${idx + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: idx === activeIndex ? 1 : 0.6,
                }}
              />
              {item.is_video && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0, 0, 0, 0.4)',
                    color: '#fff',
                  }}
                >
                  <Play size={14} weight="fill" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PostDetail Component
// ============================================================================

export default function PostDetail({
  postId = null,
  initialPost = null,
  currentUser = { username: 'sarah_creator' },
  onNavigate = () => {},
  onBack = () => {},
  onPostDeleted = () => {},
}) {
  const [post, setPost] = useState(initialPost || DEFAULT_POST);
  const [isLiked, setIsLiked] = useState(initialPost ? !!initialPost.is_liked : false);
  const [likeCount, setLikeCount] = useState(initialPost ? initialPost.total_likes || 0 : DEFAULT_POST.total_likes);
  const [comments, setComments] = useState(initialPost ? initialPost.comments || [] : DEFAULT_POST.comments);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [takedownModalOpen, setTakedownModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // If a specific postId was provided and differs from current post, fetch it from Django
  useEffect(() => {
    if (!postId) return;
    let isCancelled = false;

    async function loadPost() {
      try {
        const response = await fetch(`/post/${postId}/`, {
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
        });
        if (response.ok) {
          const data = await response.json();
          if (!isCancelled && data.post) {
            setPost(data.post);
            setIsLiked(!!data.is_liked);
            setLikeCount(data.post.total_likes || 0);
            setComments(data.comments || []);
          }
        }
      } catch {
        // Fallback to initialPost or default
      }
    }

    loadPost();
    return () => {
      isCancelled = true;
    };
  }, [postId]);

  // Handle Like Toggle
  const handleLike = async () => {
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikeCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      await fetch(`/post/${post.id}/like/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
      });
    } catch {
      // Retain optimistic update in UI
    }
  };

  // Handle Comment Submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    const optimisticComment = {
      id: Date.now(),
      author: {
        username: currentUser?.username || 'sarah_creator',
      },
      text: trimmed,
      created_at: new Date().toISOString(),
    };

    setComments((prev) => [...prev, optimisticComment]);
    setCommentText('');

    try {
      const response = await fetch(`/post/${post.id}/comment/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: new URLSearchParams({ text: trimmed }).toString(),
        credentials: 'same-origin',
      });

      if (response.ok) {
        const result = await response.json().catch(() => null);
        if (result && result.comment) {
          setComments((prev) =>
            prev.map((c) => (c.id === optimisticComment.id ? result.comment : c))
          );
        }
      }
    } catch {
      // Kept optimistic comment in list
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Share / Copy Link
  const handleShare = () => {
    const shareUrl = `${window.location.origin}/post/${post.id}/`;
    navigator.clipboard?.writeText(shareUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  // Handle Takedown Confirmation
  const confirmTakedown = async () => {
    setIsDeleting(true);
    try {
      await fetch(`/post/${post.id}/takedown/`, {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
      });
    } catch {
      // Continue locally
    } finally {
      setIsDeleting(false);
      setTakedownModalOpen(false);
      onPostDeleted(post.id);
      onBack();
    }
  };

  const canTakedown =
    post.can_takedown ||
    (currentUser && post.author?.username === currentUser.username);

  const mediaItems =
    post.media_items && post.media_items.length > 0
      ? post.media_items
      : post.media_file
      ? [{ id: 'single', file: post.media_file, thumbnail: post.thumbnail, is_video: post.is_video }]
      : [];

  const formattedDate = post.created_at
    ? new Date(post.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Sep 28, 2026';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: '#000000',
        overflow: 'hidden',
      }}
    >
      {/* ==================================================================== */}
      {/* 1. Sub-Header Bar (Back Navigation & Breadcrumb) */}
      {/* ==================================================================== */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          height: '52px',
          borderBottom: '1px solid var(--neon-cyan-border)',
          background: 'var(--bg-surface)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'transparent',
              border: '1px solid var(--neon-cyan-border)',
              clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
              padding: '6px 14px',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onPointerEnter={(e) => {
              e.currentTarget.style.background = 'var(--neon-cyan)';
              e.currentTarget.style.color = '#000000';
              e.currentTarget.style.borderColor = 'var(--neon-cyan)';
            }}
            onPointerLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.borderColor = 'var(--neon-cyan-border)';
            }}
          >
            <ArrowLeft size={16} weight="bold" />
            <span>BACK TO FEED</span>
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              color: 'var(--text-dim)',
            }}
          >
            <span>FEED</span>
            <span>/</span>
            <span style={{ color: 'var(--neon-cyan)' }}>POST #{post.id}</span>
          </div>
        </div>

        {post.community && (
          <button
            type="button"
            onClick={() => onNavigate('community', post.community)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'transparent',
              border: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--neon-cyan)',
              cursor: 'pointer',
              padding: '4px 8px',
              transition: 'opacity 0.2s ease',
            }}
            onPointerEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
            onPointerLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <Hash size={14} weight="bold" />
            <span>{post.community.name}</span>
          </button>
        )}
      </header>

      {/* ==================================================================== */}
      {/* 2. Main 2-Column Cyberpunk Workbench */}
      {/* ==================================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: mediaItems.length > 0 ? 'minmax(0, 1.4fr) minmax(360px, 420px)' : '1fr',
          flex: 1,
          minHeight: 0,
          background: '#000000',
        }}
      >
        {/* Left Column: Multi-Media Theater (if media present) */}
        {mediaItems.length > 0 && (
          <div
            style={{
              borderRight: '1px solid var(--neon-cyan-border)',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              background: '#000000',
            }}
          >
            <MediaViewer items={mediaItems} />
          </div>
        )}

        {/* Right Column: Author, Post Metadata, Discussion, and Comment Form */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: 0,
            background: 'var(--bg-surface)',
          }}
        >
          {/* Post Author Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid var(--neon-cyan-border)',
              background: 'var(--bg-surface)',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Author Monogram / Avatar */}
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  background: '#000000',
                  border: '1px solid var(--neon-cyan)',
                  clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--neon-cyan)',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  fontFamily: 'var(--font-mono)',
                  boxShadow: '0 0 10px rgba(0, 240, 255, 0.25)',
                }}
              >
                {post.author?.avatar ? (
                  <img
                    src={post.author.avatar}
                    alt={post.author.username}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  (post.author?.username || 'ANON').slice(0, 2).toUpperCase()
                )}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.96rem', color: '#ffffff' }}>
                    @{post.author?.username}
                  </span>
                  {post.author?.profile?.role && (
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: 'var(--neon-cyan)',
                        border: '1px solid var(--neon-cyan-border)',
                        padding: '1px 6px',
                      }}
                    >
                      {post.author.profile.role}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.74rem',
                    color: 'var(--text-dim)',
                    fontFamily: 'var(--font-mono)',
                    marginTop: '2px',
                  }}
                >
                  <Clock size={12} />
                  <span>{formattedDate}</span>
                </div>
              </div>
            </div>

            {/* Moderation Actions (Takedown) */}
            {canTakedown && (
              <button
                type="button"
                onClick={() => setTakedownModalOpen(true)}
                title="Take down post"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: '8px',
                  transition: 'color 0.2s ease, transform 0.15s ease',
                }}
                onPointerEnter={(e) => (e.currentTarget.style.color = 'var(--neon-magenta)')}
                onPointerLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
              >
                <Trash size={18} weight="bold" />
              </button>
            )}
          </div>

          {/* Post Caption / Transmission Body */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              background: '#000000',
              flexShrink: 0,
            }}
          >
            {post.caption && (
              <p
                style={{
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  color: 'var(--text-primary)',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {post.caption}
              </p>
            )}

            {/* Shared From Banner if re-transmitted */}
            {post.shared_from && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '12px 14px',
                  border: '1px solid var(--neon-cyan-border)',
                  background: 'var(--bg-surface)',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.74rem',
                    color: 'var(--neon-cyan)',
                    marginBottom: '4px',
                  }}
                >
                  RE-TRANSMITTED FROM @{post.shared_from.author?.username}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {post.shared_from.caption}
                </p>
              </div>
            )}
          </div>

          {/* Interactive Metric / Action Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 20px',
              borderBottom: '1px solid var(--neon-cyan-border)',
              background: 'var(--bg-surface)',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {/* Like Button */}
              <button
                type="button"
                onClick={handleLike}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: isLiked ? 'var(--neon-magenta)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  transition: 'color 0.2s ease, transform 0.15s ease',
                }}
                onPointerEnter={(e) => {
                  e.currentTarget.style.color = 'var(--neon-magenta)';
                }}
                onPointerLeave={(e) => {
                  if (!isLiked) e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <Heart size={20} weight={isLiked ? 'fill' : 'bold'} />
                <span>{likeCount}</span>
              </button>

              {/* Comments Count Indicator */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--text-secondary)',
                  fontSize: '0.88rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                }}
              >
                <ChatCircle size={20} weight="bold" />
                <span>{comments.length}</span>
              </div>
            </div>

            {/* Share / Copy Link Button */}
            <button
              type="button"
              onClick={handleShare}
              title="Copy share link"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'transparent',
                border: 'none',
                color: copiedLink ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-mono)',
                transition: 'color 0.2s ease',
              }}
              onPointerEnter={(e) => {
                if (!copiedLink) e.currentTarget.style.color = 'var(--neon-cyan)';
              }}
              onPointerLeave={(e) => {
                if (!copiedLink) e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              {copiedLink ? <Check size={16} weight="bold" /> : <ShareNetwork size={18} weight="bold" />}
              <span>{copiedLink ? 'COPIED' : 'SHARE'}</span>
            </button>
          </div>

          {/* Comments Discussion Scroll Area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: '#000000',
            }}
          >
            {comments.length > 0 ? (
              comments.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: '12px 14px',
                    background: 'var(--bg-surface)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    transition: 'border-color 0.2s ease',
                  }}
                  onPointerEnter={(e) => (e.currentTarget.style.borderColor = 'var(--neon-cyan-border)')}
                  onPointerLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.84rem',
                          color: 'var(--neon-cyan)',
                        }}
                      >
                        @{c.author?.username}
                      </span>
                    </div>

                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.68rem',
                        color: 'var(--text-dim)',
                      }}
                    >
                      {c.created_at
                        ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'now'}
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: '0.86rem',
                      lineHeight: 1.5,
                      color: 'var(--text-primary)',
                      margin: 0,
                      wordBreak: 'break-word',
                    }}
                  >
                    {c.text}
                  </p>
                </div>
              ))
            ) : (
              <div
                style={{
                  margin: 'auto',
                  textAlign: 'center',
                  padding: '32px 16px',
                  color: 'var(--text-dim)',
                }}
              >
                <ChatCircle size={32} weight="bold" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  No comments yet
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', marginTop: '4px' }}>
                  Start the discussion below
                </div>
              </div>
            )}
          </div>

          {/* Comment Submission Composer Form */}
          <form
            onSubmit={handleCommentSubmit}
            style={{
              display: 'flex',
              alignItems: 'center',
              borderTop: '1px solid var(--neon-cyan-border)',
              background: 'var(--bg-surface)',
              padding: '10px 16px',
              gap: '10px',
              flexShrink: 0,
            }}
          >
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              disabled={isSubmitting}
              style={{
                flex: 1,
                background: '#000000',
                border: '1px solid var(--neon-cyan-border)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-display)',
                fontSize: '0.86rem',
                padding: '8px 12px',
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--neon-cyan)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--neon-cyan-border)')}
            />

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!commentText.trim() || isSubmitting}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PaperPlaneTilt size={14} weight="bold" />
                <span>POST</span>
              </div>
            </Button>
          </form>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. Takedown Confirmation Modal */}
      {/* ==================================================================== */}
      <Modal
        isOpen={takedownModalOpen}
        onClose={() => setTakedownModalOpen(false)}
        title="Remove post"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--text-secondary)', margin: 0 }}>
            Remove this post? It will no longer appear in community feeds.
          </p>

          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(255, 0, 85, 0.08)',
              border: '1px solid var(--neon-magenta)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              color: 'var(--neon-magenta)',
            }}
          >
            CONFIRMATION REQUIRED: Author or Space Administrator privilege verified.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setTakedownModalOpen(false)}
              disabled={isDeleting}
            >
              CANCEL
            </Button>

            <Button
              type="button"
              variant="warning"
              size="sm"
              onClick={confirmTakedown}
              disabled={isDeleting}
            >
              {isDeleting ? 'REMOVING...' : 'CONFIRM TAKEDOWN'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
