/**
 * Sanctuary OS — Create Post / Broadcast
 * Phase 13: CreatePost.jsx
 *
 * Requirements:
 * - Rich post creation view and modal support matching Django's `posts.views.create_post_view`.
 * - Caption input with monospace telemetry counter.
 * - Target Community Hub selector (defaults to active space if provided).
 * - Topic flair / tag selector.
 * - Multi-file drop zone for images and videos with live thumbnail previews and remove triggers.
 * - Direct multipart/form-data upload to `/create/` with optimistic local fallback.
 * - Sharp geometry, 0px border-radius, chamfered clip-paths, pure black surfaces (#000000), 1px dim neon tint borders.
 * - Authentic product copy (no filler AI jargon, max one '//' eyebrow).
 */

import React, { useState, useRef } from 'react';
import Button from './Button';
import {
  UploadSimple,
  X,
  VideoCamera,
  Hash,
  Tag,
  PaperPlaneTilt,
  ArrowLeft,
  WarningCircle,
} from '@phosphor-icons/react';

// Preset tags matching real developer / creator use cases
const PRESET_TAGS = ['DEVLOG', 'SHOWCASE', 'AUDIO', 'RESEARCH', 'RELEASE', 'BENCHMARK'];

export default function CreatePost({
  initialCommunity = null,
  availableCommunities = [
    { id: 1, name: 'Systems & Infrastructure', slug: 'systems-infrastructure' },
    { id: 2, name: 'Creative Technology', slug: 'creative-technology' },
    { id: 3, name: 'Applied AI Research', slug: 'applied-ai-research' },
  ],
  currentUser = { username: 'sarah_creator' },
  onNavigate = () => {},
  onBack = () => {},
  onPostCreated = () => {},
}) {
  const [caption, setCaption] = useState('');
  const [selectedCommunityId, setSelectedCommunityId] = useState(initialCommunity?.id || '');
  const [selectedTag, setSelectedTag] = useState('');
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  // Handle file selection and preview generation
  const handleFiles = (newFileList) => {
    const validFiles = Array.from(newFileList).filter(
      (f) => f.type.startsWith('image/') || f.type.startsWith('video/')
    );

    if (validFiles.length === 0) return;

    const previews = validFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      isVideo: file.type.startsWith('video/'),
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2),
    }));

    setFiles((prev) => [...prev, ...validFiles]);
    setFilePreviews((prev) => [...prev, ...previews]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Submit Post to Django backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!caption.trim() && files.length === 0) {
      setErrorMsg('Please write a caption or attach media before publishing.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('caption', caption.trim());
    if (selectedCommunityId) {
      formData.append('community', selectedCommunityId);
    }
    if (selectedTag) {
      formData.append('tag', selectedTag);
    }

    // Attach all files
    files.forEach((file) => {
      formData.append('media_files', file);
    });

    try {
      const response = await fetch('/create/', {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: formData,
        credentials: 'same-origin',
      });

      if (response.ok) {
        const result = await response.json().catch(() => null);
        const newPost = result?.post || {
          id: Date.now(),
          caption: caption.trim(),
          author: { username: currentUser.username },
          community: availableCommunities.find((c) => String(c.id) === String(selectedCommunityId)) || null,
          created_at: new Date().toISOString(),
          total_likes: 0,
          is_liked: false,
          can_takedown: true,
          media_items: filePreviews.map((p, idx) => ({
            id: idx + 1,
            file: p.url,
            media_type: p.isVideo ? 'video' : 'image',
            is_video: p.isVideo,
          })),
          comments: [],
        };

        onPostCreated(newPost);
        if (newPost.community) {
          onNavigate('community', newPost.community);
        } else {
          onNavigate('feed');
        }
      } else {
        // Fallback for standalone Vite development
        const targetCommunity = availableCommunities.find((c) => String(c.id) === String(selectedCommunityId)) || null;
        const mockNewPost = {
          id: Date.now(),
          caption: caption.trim(),
          author: { username: currentUser.username, profile: { role: 'AUTHOR' } },
          community: targetCommunity,
          tag: selectedTag || null,
          created_at: new Date().toISOString(),
          total_likes: 0,
          is_liked: false,
          can_takedown: true,
          media_items: filePreviews.map((p, idx) => ({
            id: idx + 1,
            file: p.url,
            media_type: p.isVideo ? 'video' : 'image',
            is_video: p.isVideo,
          })),
          comments: [],
        };

        onPostCreated(mockNewPost);
        if (targetCommunity) {
          onNavigate('community', targetCommunity);
        } else {
          onNavigate('feed');
        }
      }
    } catch {
      // Offline fallback
      const targetCommunity = availableCommunities.find((c) => String(c.id) === String(selectedCommunityId)) || null;
      const mockNewPost = {
        id: Date.now(),
        caption: caption.trim(),
        author: { username: currentUser.username, profile: { role: 'AUTHOR' } },
        community: targetCommunity,
        tag: selectedTag || null,
        created_at: new Date().toISOString(),
        total_likes: 0,
        is_liked: false,
        can_takedown: true,
        media_items: filePreviews.map((p, idx) => ({
          id: idx + 1,
          file: p.url,
          media_type: p.isVideo ? 'video' : 'image',
          is_video: p.isVideo,
        })),
        comments: [],
      };

      onPostCreated(mockNewPost);
      if (targetCommunity) {
        onNavigate('community', targetCommunity);
      } else {
        onNavigate('feed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="page-create-post"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: '#000000',
        overflowY: 'auto',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          height: '52px',
          borderBottom: '1px solid var(--neon-cyan-border)',
          background: 'var(--bg-surface)',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0,
            transition: 'color 0.2s ease',
          }}
          onPointerEnter={(e) => (e.currentTarget.style.color = 'var(--neon-cyan)')}
          onPointerLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >
          <ArrowLeft size={16} weight="bold" />
          <span>Back</span>
        </button>

        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            color: 'var(--text-dim)',
          }}
        >
          New post
        </div>
      </div>

      {/* Main Composer Box */}
      <div
        style={{
          maxWidth: '720px',
          width: '100%',
          margin: '32px auto',
          padding: '0 24px',
          boxSizing: 'border-box',
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--neon-cyan-border)',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#ffffff',
                margin: '0 0 6px 0',
                letterSpacing: '-0.02em',
              }}
            >
              Share an update
            </h1>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0 }}>
              Write a post for your network. Add photos or video if they help explain it.
            </p>
          </div>

          {errorMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                background: 'rgba(255, 0, 85, 0.1)',
                border: '1px solid var(--neon-magenta)',
                color: 'var(--neon-magenta)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
              }}
            >
              <WarningCircle size={16} weight="bold" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Target Community Hub Selector */}
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.74rem',
                fontWeight: 700,
                color: 'var(--neon-cyan)',
                letterSpacing: '0.06em',
                marginBottom: '8px',
              }}
            >
              <Hash size={14} weight="bold" />
              <span>Post to</span>
            </label>

            <select
              value={selectedCommunityId}
              onChange={(e) => setSelectedCommunityId(e.target.value)}
              style={{
                width: '100%',
                background: '#000000',
                border: '1px solid var(--neon-cyan-border)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-display)',
                fontSize: '0.88rem',
                padding: '10px 14px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">Your network</option>
              {availableCommunities.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Telemetry Tag / Flair */}
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.74rem',
                fontWeight: 700,
                color: 'var(--neon-cyan)',
                letterSpacing: '0.06em',
                marginBottom: '8px',
              }}
            >
              <Tag size={14} weight="bold" />
              <span>Topic (optional)</span>
            </label>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {PRESET_TAGS.map((tag) => {
                const isSelected = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(isSelected ? '' : tag)}
                    style={{
                      background: isSelected ? 'var(--neon-cyan)' : '#000000',
                      border: `1px solid ${isSelected ? 'var(--neon-cyan)' : 'var(--neon-cyan-border)'}`,
                      color: isSelected ? '#000000' : 'var(--text-secondary)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '4px 10px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value.toUpperCase())}
              placeholder="Or enter a custom flair..."
              style={{
                width: '100%',
                background: '#000000',
                border: '1px solid var(--neon-cyan-border)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem',
                padding: '8px 12px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Caption Content */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: 'var(--neon-cyan)',
                  letterSpacing: '0.06em',
                }}
              >
                Post text
              </label>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                {caption.length} CHARS
              </span>
            </div>

            <textarea
              rows={5}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What are you working on?"
              style={{
                width: '100%',
                background: '#000000',
                border: '1px solid var(--neon-cyan-border)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-display)',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                padding: '12px 14px',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--neon-cyan)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--neon-cyan-border)')}
            />
          </div>

          {/* Multi-Media Drop Zone */}
          <div>
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.74rem',
                fontWeight: 700,
                color: 'var(--neon-cyan)',
                letterSpacing: '0.06em',
                marginBottom: '8px',
              }}
            >
              ATTACH MEDIA (IMAGES & VIDEOS)
            </label>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? 'var(--neon-cyan)' : 'var(--neon-cyan-border)'}`,
                background: isDragging ? 'rgba(0, 240, 255, 0.05)' : '#000000',
                padding: '24px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files) handleFiles(e.target.files);
                }}
              />

              <UploadSimple
                size={36}
                weight="bold"
                style={{
                  color: isDragging ? 'var(--neon-cyan)' : 'var(--text-dim)',
                  margin: '0 auto 8px auto',
                  display: 'block',
                }}
              />

              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                Drag and drop files here, or click to browse
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                Supports PNG, JPG, GIF, WebP, MP4, MOV (Multi-file carousel enabled)
              </div>
            </div>

            {/* Staged Files Thumbnails */}
            {filePreviews.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: '12px',
                  marginTop: '16px',
                }}
              >
                {filePreviews.map((p, idx) => (
                  <div
                    key={p.url}
                    style={{
                      position: 'relative',
                      aspectRatio: '16/9',
                      background: '#000000',
                      border: '1px solid var(--neon-cyan-border)',
                      overflow: 'hidden',
                    }}
                  >
                    {p.isVideo ? (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(0, 0, 0, 0.8)',
                          color: 'var(--neon-cyan)',
                        }}
                      >
                        <VideoCamera size={24} weight="bold" />
                      </div>
                    ) : (
                      <img
                        src={p.url}
                        alt="Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}

                    {/* Remove File Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: 'rgba(0, 0, 0, 0.85)',
                        border: '1px solid var(--neon-magenta)',
                        color: 'var(--neon-magenta)',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <X size={12} weight="bold" />
                    </button>

                    <div
                      style={{
                        position: 'absolute',
                        bottom: '2px',
                        left: '4px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.62rem',
                        color: '#fff',
                        background: 'rgba(0, 0, 0, 0.8)',
                        padding: '1px 4px',
                      }}
                    >
                      {p.size}MB
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: '16px',
            }}
          >
            <Button type="button" variant="ghost" size="md" onClick={onBack} disabled={isSubmitting}>
              CANCEL
            </Button>

            <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PaperPlaneTilt size={16} weight="bold" />
                <span>{isSubmitting ? 'Uploading…' : 'Publish post'}</span>
              </div>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
