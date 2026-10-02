/**
 * Sanctuary OS — Channel Chat & Messaging
 * Phase 14: ChannelChat.jsx
 *
 * Requirements:
 * - High-density real-time chat interface matching Django's `chat.views.channel_chat_view` and `conversation_detail_view`.
 * - Auto-scrolling message stream with user monograms, timestamps, pre-wrap text, and attachment chips.
 * - Announcement permission gating (only space admins can post in announcement channels).
 * - Multi-format file attachment staging (Paperclip upload) with preview.
 * - Optimistic local message append and AJAX POST integration.
 * - Sharp geometry, 0px border-radius, chamfered clip-paths, pure black surfaces (#000000), 1px dim neon tint borders.
 * - Authentic product copy (no filler AI jargon, max one '//' eyebrow).
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Hash,
  Megaphone,
  PaperPlaneTilt,
  Paperclip,
  Lock,
  ArrowLeft,
  X,
  FileText,
} from '@phosphor-icons/react';

// ============================================================================
// Default Mock Channel Chat Data
// ============================================================================

const DEFAULT_MESSAGES = [
  {
    id: 1,
    sender: { username: 'sarah_creator', profile: { role: 'ADMIN' } },
    message: 'Welcome to Systems & Infrastructure. Share project updates, questions, and useful resources here.',
    attachment: null,
    created_at: '2026-09-28T08:30:00Z',
  },
  {
    id: 2,
    sender: { username: 'alex_dev', profile: { role: 'CORE' } },
    message: 'I’m comparing queueing patterns for a small event-driven service. Has anyone documented an approach that stayed easy to operate as it grew?',
    attachment: null,
    created_at: '2026-09-28T09:12:00Z',
  },
  {
    id: 3,
    sender: { username: 'code_ninja', profile: { role: 'MEMBER' } },
    message: 'We used a managed queue for our first version, then moved the latency-sensitive path in process. Happy to share what we learned.',
    attachment: null,
    created_at: '2026-09-28T10:04:00Z',
  },
];

export default function ChannelChat({
  community = { name: 'Systems & Infrastructure', slug: 'systems-infrastructure' },
  channel = { id: 'general', name: 'general', topic: 'Questions, work in progress, and useful links', is_announcement: false },
  currentUser = { username: 'sarah_creator', is_admin: true },
  onNavigate = () => {},
  onBack = () => {},
}) {
  const [messages, setMessages] = useState(DEFAULT_MESSAGES);
  const [inputMsg, setInputMsg] = useState('');
  const [stagedAttachment, setStagedAttachment] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const streamEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll stream to bottom whenever messages update
  const scrollToBottom = () => {
    streamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages from Django backend if active
  useEffect(() => {
    let isCancelled = false;

    async function loadChat() {
      try {
        const response = await fetch(`/chat/c/${community.slug}/${channel.name}/`, {
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
        });
        if (response.ok) {
          const data = await response.json();
          if (!isCancelled && data.chat_messages) {
            setMessages(data.chat_messages);
          }
        }
      } catch {
        // Fallback to default
      }
    }

    loadChat();
    return () => {
      isCancelled = true;
    };
  }, [community.slug, channel.name]);

  // Can post check
  const isAdmin = currentUser.is_admin || currentUser.username === 'sarah_creator';
  const canPost = !channel.is_announcement || isAdmin;

  // Handle Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmed = inputMsg.trim();
    if (!trimmed && !stagedAttachment) return;
    if (!canPost || isSending) return;

    setIsSending(true);

    const optimisticMsg = {
      id: Date.now(),
      sender: {
        username: currentUser.username,
        profile: { role: isAdmin ? 'ADMIN' : 'MEMBER' },
      },
      message: trimmed,
      attachment: stagedAttachment ? { name: stagedAttachment.name, url: URL.createObjectURL(stagedAttachment) } : null,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputMsg('');
    const attachmentToSend = stagedAttachment;
    setStagedAttachment(null);

    // Send to Django endpoint
    const formData = new FormData();
    formData.append('message', trimmed);
    if (attachmentToSend) {
      formData.append('attachment', attachmentToSend);
    }

    try {
      await fetch(`/chat/c/${community.slug}/${channel.name}/`, {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: formData,
        credentials: 'same-origin',
      });
    } catch {
      // Kept optimistic update in message list
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="page-channel-chat"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: '#000000',
        overflow: 'hidden',
      }}
    >
      {/* 1. Channel Header Bar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              padding: 0,
              transition: 'color 0.2s ease',
            }}
            onPointerEnter={(e) => (e.currentTarget.style.color = 'var(--neon-cyan)')}
            onPointerLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <ArrowLeft size={16} weight="bold" />
              <span>Back to space</span>
          </button>

          <div style={{ width: '1px', height: '16px', background: 'var(--neon-cyan-border)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                color: channel.is_announcement ? 'var(--neon-warning)' : 'var(--neon-cyan)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {channel.is_announcement ? <Megaphone size={18} weight="bold" /> : <Hash size={18} weight="bold" />}
            </span>

            <div>
              <span style={{ fontWeight: 800, fontSize: '0.96rem', color: '#ffffff' }}>
                {channel.name}
              </span>
              {channel.topic && (
                <span
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-dim)',
                    marginLeft: '12px',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {channel.topic}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('community', community)}
          style={{
            background: 'transparent',
            border: '1px solid var(--neon-cyan-border)',
            clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.74rem',
            padding: '5px 12px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onPointerEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--neon-cyan)';
            e.currentTarget.style.background = 'var(--neon-cyan)';
            e.currentTarget.style.color = '#000000';
          }}
          onPointerLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--neon-cyan-border)';
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
        >
          View space
        </button>
      </header>

      {/* 2. Message Stream Container */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          background: '#000000',
        }}
      >
        {/* Welcome Channel Banner */}
        <div
          style={{
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '20px',
            marginBottom: '10px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              background: 'var(--bg-surface)',
              border: `1px solid ${channel.is_announcement ? 'var(--neon-warning)' : 'var(--neon-cyan)'}`,
              clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: channel.is_announcement ? 'var(--neon-warning)' : 'var(--neon-cyan)',
              marginBottom: '12px',
            }}
          >
            {channel.is_announcement ? <Megaphone size={24} weight="bold" /> : <Hash size={24} weight="bold" />}
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', margin: '0 0 6px 0' }}>
            Welcome to #{channel.name}
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0 }}>
            Start a conversation in {community.name}.
          </p>
        </div>

        {/* Message Items */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              padding: '6px 0',
            }}
          >
            {/* Sender Monogram */}
            <div
              style={{
                width: '40px',
                height: '40px',
                background: '#000000',
                border: '1px solid var(--neon-cyan-border)',
                clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--neon-cyan)',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: '0.85rem',
                flexShrink: 0,
              }}
            >
              {msg.sender?.username ? msg.sender.username.slice(0, 2).toUpperCase() : 'OP'}
            </div>

            {/* Message Content Body */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--neon-cyan)' }}>
                  @{msg.sender?.username}
                </span>

                {msg.sender?.profile?.role && (
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      color: 'var(--neon-cyan)',
                      border: '1px solid var(--neon-cyan-border)',
                      padding: '1px 5px',
                    }}
                  >
                    {msg.sender.profile.role}
                  </span>
                )}

                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                  {msg.created_at
                    ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'now'}
                </span>
              </div>

              <div
                style={{
                  fontSize: '0.9rem',
                  lineHeight: 1.55,
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {msg.message}
              </div>

              {/* Attachment chip */}
              {msg.attachment && (
                <div style={{ marginTop: '8px' }}>
                  <a
                    href={msg.attachment.url || msg.attachment}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--neon-cyan-border)',
                      padding: '4px 10px',
                      color: 'var(--neon-cyan)',
                      textDecoration: 'none',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.74rem',
                      transition: 'border-color 0.2s ease',
                    }}
                    onPointerEnter={(e) => (e.currentTarget.style.borderColor = 'var(--neon-cyan)')}
                    onPointerLeave={(e) => (e.currentTarget.style.borderColor = 'var(--neon-cyan-border)')}
                  >
                    <FileText size={14} weight="bold" />
                    <span>{msg.attachment.name || 'View Attachment'}</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}

        <div ref={streamEndRef} />
      </div>

      {/* 3. Input & Attachment Bar */}
      {canPost ? (
        <div
          style={{
            borderTop: '1px solid var(--neon-cyan-border)',
            background: 'var(--bg-surface)',
            padding: '12px 24px',
            flexShrink: 0,
          }}
        >
          {/* Staged Attachment Chip */}
          {stagedAttachment && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px',
                background: '#000000',
                border: '1px solid var(--neon-cyan)',
                marginBottom: '8px',
                fontSize: '0.74rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--neon-cyan)',
              }}
            >
              <FileText size={14} />
              <span>{stagedAttachment.name}</span>
              <button
                type="button"
                onClick={() => setStagedAttachment(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--neon-magenta)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={12} weight="bold" />
              </button>
            </div>
          )}

          <form
            onSubmit={handleSendMessage}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: '#000000',
              border: '1px solid var(--neon-cyan-border)',
              padding: '6px 12px',
              transition: 'border-color 0.2s ease',
            }}
          >
            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach file"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                transition: 'color 0.2s ease',
              }}
              onPointerEnter={(e) => (e.currentTarget.style.color = 'var(--neon-cyan)')}
              onPointerLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
            >
              <Paperclip size={18} weight="bold" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setStagedAttachment(e.target.files[0]);
                }
              }}
            />

            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder={`Message #${channel.name}...`}
              disabled={isSending}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-display)',
                fontSize: '0.88rem',
                outline: 'none',
              }}
            />

            <button
              type="submit"
              disabled={(!inputMsg.trim() && !stagedAttachment) || isSending}
              style={{
                background: inputMsg.trim() || stagedAttachment ? 'var(--neon-cyan)' : 'transparent',
                border: 'none',
                color: inputMsg.trim() || stagedAttachment ? '#000000' : 'var(--text-dim)',
                padding: '6px 12px',
                cursor: inputMsg.trim() || stagedAttachment ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <PaperPlaneTilt size={16} weight="bold" />
            </button>
          </form>
        </div>
      ) : (
        /* Locked Announcement Channel Bar */
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '14px 24px',
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--neon-warning)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            color: 'var(--neon-warning)',
            flexShrink: 0,
          }}
        >
          <Lock size={14} weight="bold" />
                  <span>Only space admins can post in this channel.</span>
        </div>
      )}
    </div>
  );
}
