/**
 * Feed and post interactions.
 */

import React, { useState, useRef } from 'react';
import Button from './Button';
import { Modal } from './Popup';
import {
  Heart,
  ChatCircle,
  ShareNetwork,
  Trash,
  Play,
  SpeakerSimpleHigh,
  SpeakerSimpleSlash,
  CaretLeft,
  CaretRight,
  Compass,
  Lock,
  Hash,
  ArrowRight,
  PaperPlaneTilt,
} from '@phosphor-icons/react';

// ============================================================================
// 1. Production Media Player & Carousel (Zero Test Pattern)
// ============================================================================

function MediaCarousel({ mediaItems = [], mediaFile = null, thumbnail = null, isVideo = false }) {
  const items = mediaItems.length > 0
    ? mediaItems
    : mediaFile
    ? [{ id: 'single', file: mediaFile, thumbnail, is_video: isVideo }]
    : [];

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  if (items.length === 0) return null;

  const currentItem = items[activeIndex] || items[0];
  const itemIsVideo = currentItem.is_video || currentItem.media_type === 'video';

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
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    setIsPlaying(false);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
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
      {itemIsVideo ? (
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
            background: '#000000',
          }}
        >
          {/* Authentic Video Player with Poster (Eliminating Test Pattern) */}
          <video
            ref={videoRef}
            src={currentItem.file}
            poster={currentItem.thumbnail || '/media/thumbnails/2026/09/demo_thumb.jpg'}
            muted={isMuted}
            playsInline
            loop
            preload="metadata"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />

          {/* Central Play/Pause Watermark */}
          {!isPlaying && (
            <div
              style={{
                position: 'absolute',
                width: '54px',
                height: '54px',
                background: 'rgba(0, 0, 0, 0.75)',
                border: '1px solid var(--neon-cyan)',
                clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--neon-cyan)',
                boxShadow: '0 0 14px rgba(0, 240, 255, 0.4)',
                pointerEvents: 'none',
                transition: 'transform 0.2s ease, opacity 0.2s ease',
              }}
            >
              <Play size={24} weight="fill" />
            </div>
          )}

          {/* Audio Mute/Unmute Pill */}
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
              clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
              padding: '6px 10px',
              color: 'var(--neon-cyan)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              outline: 'none',
              transition: 'background 0.2s ease, color 0.2s ease, border-color 0.2s ease',
            }}
            onPointerEnter={(e) => {
              e.currentTarget.style.background = 'var(--neon-cyan)';
              e.currentTarget.style.color = '#000000';
            }}
            onPointerLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
              e.currentTarget.style.color = 'var(--neon-cyan)';
            }}
          >
            {isMuted ? <SpeakerSimpleSlash size={14} weight="bold" /> : <SpeakerSimpleHigh size={14} weight="bold" />}
            <span>{isMuted ? 'MUTED' : 'AUDIO'}</span>
          </button>
        </div>
      ) : (
        <img
          src={currentItem.file}
          alt="Post attachment"
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      )}

      {/* Multi-Slide Navigation Controls */}
      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous slide"
            style={{
              position: 'absolute',
              top: '50%',
              left: '10px',
              transform: 'translateY(-50%)',
              width: '32px',
              height: '32px',
              background: 'rgba(0, 0, 0, 0.85)',
              border: '1px solid var(--neon-cyan)',
              color: 'var(--neon-cyan)',
              clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              outline: 'none',
              transition: 'background 0.2s ease, color 0.2s ease',
            }}
            onPointerEnter={(e) => {
              e.currentTarget.style.background = 'var(--neon-cyan)';
              e.currentTarget.style.color = '#000';
            }}
            onPointerLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.85)';
              e.currentTarget.style.color = 'var(--neon-cyan)';
            }}
          >
            <CaretLeft size={18} weight="bold" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Next slide"
            style={{
              position: 'absolute',
              top: '50%',
              right: '10px',
              transform: 'translateY(-50%)',
              width: '32px',
              height: '32px',
              background: 'rgba(0, 0, 0, 0.85)',
              border: '1px solid var(--neon-cyan)',
              color: 'var(--neon-cyan)',
              clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              outline: 'none',
              transition: 'background 0.2s ease, color 0.2s ease',
            }}
            onPointerEnter={(e) => {
              e.currentTarget.style.background = 'var(--neon-cyan)';
              e.currentTarget.style.color = '#000';
            }}
            onPointerLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.85)';
              e.currentTarget.style.color = 'var(--neon-cyan)';
            }}
          >
            <CaretRight size={18} weight="bold" />
          </button>

          {/* Indicator Dashes */}
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '6px',
            }}
          >
            {items.map((_, i) => (
              <span
                key={i}
                style={{
                  width: i === activeIndex ? '20px' : '8px',
                  height: '3px',
                  background: i === activeIndex ? 'var(--neon-cyan)' : 'rgba(255, 255, 255, 0.3)',
                  transition: 'width 0.25s ease, background 0.25s ease',
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// 2. Individual Mechanical Post Card
// ============================================================================

function PostCard({
  post,
  currentUser,
  onLikeToggle,
  onAddComment,
  onTakedown,
  onShare,
  onNavigate,
}) {
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likeCount, setLikeCount] = useState(post.total_likes || 0);
  const [comments, setComments] = useState(post.comments || []);
  const [takedownModalOpen, setTakedownModalOpen] = useState(false);

  const canTakedown =
    currentUser && (currentUser.username === post.author?.username || post.can_takedown);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
    if (onLikeToggle) onLikeToggle(post.id);
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const newComment = {
      id: Date.now(),
      author: { username: currentUser?.username || 'you' },
      text: commentText.trim(),
      created_at: 'Just now',
    };
    setComments((prev) => [...prev, newComment]);
    if (onAddComment) onAddComment(post.id, commentText.trim());
    setCommentText('');
  };

  const handleShareClick = () => {
    if (onShare) {
      onShare(post.id);
    } else {
      const url = window.location.origin + `/post/${post.id}/`;
      navigator.clipboard?.writeText(url);
      alert('Post URL copied to clipboard.');
    }
  };

  return (
    <article
      style={{
        background: 'var(--bg-pitch)',
        border: '1px solid var(--neon-cyan-border)',
        marginBottom: '20px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
      }}
      onPointerEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.45)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.8)';
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--neon-cyan-border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Post Header */}
      <div
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Sharp 45-deg Chamfer Avatar */}
          <div
            onClick={() => onNavigate('profile', { username: post.author?.username })}
            style={{
              width: '38px',
              height: '38px',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--neon-cyan)',
              clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              overflow: 'hidden',
              transition: 'border-color 0.2s ease, transform 0.15s ease',
            }}
            onPointerEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--neon-cyan-bright)';
              e.currentTarget.style.transform = 'scale(1.04)';
            }}
            onPointerLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--neon-cyan)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {post.author?.avatar ? (
              <img
                src={post.author.avatar}
                alt={post.author.username}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'var(--neon-cyan)',
                }}
              >
                {(post.author?.username || 'U').slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                onClick={() => onNavigate('profile', { username: post.author?.username })}
                style={{
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  color: 'var(--text-pure)',
                  cursor: 'pointer',
                  letterSpacing: '0.02em',
                  transition: 'color 0.2s ease',
                }}
                onPointerEnter={(e) => (e.currentTarget.style.color = 'var(--neon-cyan)')}
                onPointerLeave={(e) => (e.currentTarget.style.color = 'var(--text-pure)')}
              >
                @{post.author?.username}
              </span>

              {post.community && (
                <span
                  onClick={() => onNavigate('community', post.community)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--neon-cyan-border)',
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--neon-cyan)',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s ease, background 0.2s ease',
                  }}
                  onPointerEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--neon-cyan)';
                    e.currentTarget.style.background = 'var(--neon-cyan-dim)';
                  }}
                  onPointerLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--neon-cyan-border)';
                    e.currentTarget.style.background = 'var(--bg-surface)';
                  }}
                >
                  {post.community.privacy === 'PRIVATE' ? (
                    <Lock size={12} weight="bold" />
                  ) : (
                    <Hash size={12} weight="bold" />
                  )}
                  {post.community.name}
                </span>
              )}
            </div>

            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--text-dim)',
                marginTop: '2px',
              }}
            >
              {post.created_at || 'Recently'}
            </div>
          </div>
        </div>

        {/* Post Moderation / Actions */}
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
            <Trash size={18} weight="bold" />
          </button>
        )}
      </div>

      {/* Post Text Caption */}
      {post.caption && (
        <div
          style={{
            padding: '0 18px 14px 18px',
            fontSize: '0.92rem',
            lineHeight: 1.55,
            color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {post.caption}
        </div>
      )}

      {/* Quoted / Shared Post Reference */}
      {post.shared_from && (
        <div
          style={{
            margin: '0 18px 14px 18px',
            padding: '12px 16px',
            border: '1px solid var(--neon-cyan-border)',
            background: 'var(--bg-surface)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
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

      {/* Multi-Media Presentation (Video / Images) */}
      <MediaCarousel
        mediaItems={post.media_items}
        mediaFile={post.media_file}
        thumbnail={post.thumbnail}
        isVideo={post.media_type === 'video' || post.is_video}
      />

      {/* Action Buttons Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '10px 18px',
          borderBottom: comments.length > 0 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
        }}
      >
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
            fontSize: '0.85rem',
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
          <Heart size={18} weight={isLiked ? 'fill' : 'bold'} />
          <span>{likeCount}</span>
        </button>

        {/* Comment Button */}
        <button
          type="button"
          onClick={() => onNavigate('post_detail', { id: post.id })}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            transition: 'color 0.2s ease',
          }}
          onPointerEnter={(e) => (e.currentTarget.style.color = 'var(--neon-cyan)')}
          onPointerLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >
          <ChatCircle size={18} weight="bold" />
          <span>{comments.length}</span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShareClick}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px',
            transition: 'color 0.2s ease',
          }}
          onPointerEnter={(e) => (e.currentTarget.style.color = 'var(--neon-cyan)')}
          onPointerLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          title="Share post"
        >
          <ShareNetwork size={18} weight="bold" />
        </button>
      </div>

      {/* Discussion Comments Preview */}
      {comments.length > 0 && (
        <div style={{ padding: '8px 18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {comments.slice(-2).map((c) => (
            <div key={c.id} style={{ fontSize: '0.82rem', lineHeight: 1.4 }}>
              <span style={{ fontWeight: 700, color: 'var(--neon-cyan)', marginRight: '6px' }}>
                @{c.author?.username}:
              </span>
              <span style={{ color: 'var(--text-primary)' }}>{c.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Inline Quick Comment Input */}
      <form
        onSubmit={handleCommentSubmit}
        style={{
          display: 'flex',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'var(--bg-surface)',
        }}
      >
        <input
          type="text"
          placeholder="Add a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            padding: '10px 18px',
            fontSize: '0.84rem',
            fontFamily: 'var(--font-display)',
          }}
        />
        <button
          type="submit"
          disabled={!commentText.trim()}
          style={{
            background: 'transparent',
            border: 'none',
            color: commentText.trim() ? 'var(--neon-cyan)' : 'var(--text-dim)',
            padding: '0 18px',
            cursor: commentText.trim() ? 'pointer' : 'default',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'color 0.2s ease',
          }}
        >
          SEND
          <PaperPlaneTilt size={14} weight="bold" />
        </button>
      </form>

      {/* Takedown Confirmation Modal */}
      <Modal
        isOpen={takedownModalOpen}
        onClose={() => setTakedownModalOpen(false)}
        variant="warning"
        title="Remove Post"
        subtitle="MODERATION ACTION"
        confirmLabel="Remove"
        onConfirm={() => {
          if (onTakedown) onTakedown(post.id);
        }}
      >
        <p style={{ margin: 0 }}>
          Are you sure you want to remove this post from the feed? This action is permanent and cannot be undone.
        </p>
      </Modal>
    </article>
  );
}

// ============================================================================
// 3. Main Feed Stream Component (Full-Width Responsive Edge-to-Edge)
// ============================================================================

export default function Feed({
  posts = [],
  currentUser = { username: 'cybernaut' },
  onLikeToggle,
  onAddComment,
  onTakedown,
  onShare,
  onNavigate = () => {},
  onCreatePostClick = () => {},
}) {
  const displayPosts = posts;

  return (
    <div
      className="page-feed"
      style={{
        display: 'flex',
        gap: '24px',
        maxWidth: '1240px',
        margin: '0 auto',
        width: '100%',
        minWidth: 0,
        alignItems: 'flex-start',
      }}
    >
      {/* Central Feed Stream Column */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Feed Stream Header Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                color: 'var(--text-pure)',
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              Your feed
            </h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.82rem',
                margin: '2px 0 0 0',
              }}
            >
              Recent posts from the spaces you follow.
            </p>
          </div>

        </div>

        <div className="feed-discover-link">
          <span>Looking for a focused community?</span>
          <button type="button" onClick={() => onNavigate('discover')}>Browse spaces <ArrowRight size={14} /></button>
        </div>

        {/* Chronological Posts Stream */}
        {displayPosts.length ? displayPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUser={currentUser}
            onLikeToggle={onLikeToggle}
            onAddComment={onAddComment}
            onTakedown={onTakedown}
            onShare={onShare}
            onNavigate={onNavigate}
          />
        )) : (
          <div className="feed-empty-state">
            <div className="feed-empty-mark"><Compass size={20} weight="regular" /></div>
            <h3>Your feed starts here</h3>
            <p>Join a space or share an update to get useful conversations moving.</p>
            <div>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('discover')}>Find a space</Button>
              <Button variant="primary" size="sm" onClick={onCreatePostClick}>Write a post</Button>
            </div>
          </div>
        )}
      </div>


    </div>
  );
}
