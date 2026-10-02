/** Application navigation rail, space navigation, and page header. */

import React from 'react';
import Button from './Button';
import { Tooltip } from './Popup';
import {
  House,
  Compass,
  Plus,
  ChatTeardropDots,
  Hash,
  Megaphone,
  User,
  SignOut,
  Gear,
  CaretDown,
} from '@phosphor-icons/react';

export default function AppShell({
  children,
  currentRoute = 'feed', // 'feed' | 'discover' | 'community' | 'chat' | 'profile'
  activeCommunity = null,
  activeChannel = null,
  joinedCommunities = [],
  channels = [],
  user = { username: 'cybernaut', is_authenticated: true },
  onNavigate = () => {},
  onCreatePostClick = () => {},
}) {
  const routeTitle = currentRoute === 'channel'
    ? activeChannel?.name || 'Channel'
    : currentRoute === 'community'
      ? activeCommunity?.name || 'Community'
      : ({ feed: 'Your feed', discover: 'Discover spaces', explore: 'Discover spaces', chat: 'Messages', profile: 'Profile', post_detail: 'Post', create_post: 'New post', login: 'Sign in', register: 'Create account' }[currentRoute] || currentRoute.replaceAll('_', ' '));
  const routeIcon = currentRoute === 'channel'
    ? <Hash size={17} color="var(--text-secondary)" />
    : currentRoute === 'discover' || currentRoute === 'explore'
      ? <Compass size={17} color="var(--text-secondary)" />
      : null;

  return (
    <div
      className="sanctuary-shell-root"
      data-route={currentRoute}
      style={{
        width: '100vw',
        maxWidth: '100%',
        height: '100vh',
        overflow: 'hidden', // Strict global fix for horizontal overflow
        display: 'flex',
        background: 'var(--bg-pitch)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-display)',
        position: 'relative',
      }}
    >
      {/* ====================================================================
          1. PRIMARY SLIM ICON RAIL (64px, Discord Style)
          ==================================================================== */}
      <aside
        aria-label="Server and Navigation Rail"
        style={{
          width: 'var(--rail-width)',
          minWidth: 'var(--rail-width)',
          height: '100vh',
          background: 'var(--bg-pitch)',
          borderRight: '1px solid var(--neon-cyan-border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '12px 0',
          gap: '10px',
          zIndex: 'var(--z-rail)',
          userSelect: 'none',
        }}
      >
        {/* Sanctuary Home Feed Icon */}
        <Tooltip text="Home Feed" position="right">
          <button
            type="button"
            onClick={() => onNavigate('feed')}
            aria-label="Sanctuary Home Feed"
            style={{
              width: '44px',
              height: '44px',
              background: currentRoute === 'feed' ? 'var(--neon-cyan)' : 'var(--bg-surface)',
              color: currentRoute === 'feed' ? '#000000' : 'var(--neon-cyan)',
              border: `1px solid ${currentRoute === 'feed' ? 'var(--neon-cyan)' : 'var(--neon-cyan-border)'}`,
              clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              outline: 'none',
              transition: 'background 0.2s cubic-bezier(0.16, 1, 0.3, 1), color 0.2s ease, border-color 0.2s ease',
            }}
          >
            {/* Active Pill Indicator */}
            {currentRoute === 'feed' && (
              <span
                style={{
                  position: 'absolute',
                  left: '-10px',
                  width: '4px',
                  height: '24px',
                  background: 'var(--neon-cyan)',
                  boxShadow: '0 0 8px var(--neon-cyan)',
                }}
              />
            )}
            <House size={22} weight={currentRoute === 'feed' ? 'fill' : 'bold'} />
          </button>
        </Tooltip>

        {/* Divider */}
        <div
          style={{
            width: '32px',
            height: '1px',
            background: 'var(--neon-cyan-border)',
            margin: '2px 0',
          }}
        />

        {/* Joined Communities List */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            overflowY: 'auto',
            overflowX: 'hidden',
            width: '100%',
            alignItems: 'center',
          }}
        >
          {joinedCommunities.map((comm) => {
            const isActive = activeCommunity?.id === comm.id;
            return (
              <Tooltip key={comm.id || comm.slug} text={comm.name} position="right">
                <button
                  type="button"
                  onClick={() => onNavigate('community', comm)}
                  style={{
                    width: '44px',
                    height: '44px',
                    background: isActive ? 'var(--neon-cyan-dim)' : 'var(--bg-surface)',
                    color: isActive ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                    border: `1px solid ${isActive ? 'var(--neon-cyan)' : 'var(--neon-cyan-border)'}`,
                    clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    outline: 'none',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  onPointerEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = 'var(--neon-cyan)';
                      e.currentTarget.style.color = '#fff';
                    }
                  }}
                  onPointerLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = 'var(--neon-cyan-border)';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  {isActive && (
                    <span
                      style={{
                        position: 'absolute',
                        left: '-10px',
                        width: '4px',
                        height: '20px',
                        background: 'var(--neon-cyan)',
                      }}
                    />
                  )}
                  {comm.avatar ? (
                    <img
                      src={comm.avatar}
                      alt={comm.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    comm.name.slice(0, 2).toUpperCase()
                  )}
                </button>
              </Tooltip>
            );
          })}

          {/* Create Community Button */}
          <Tooltip text="Create Community Space" position="right">
            <button
              type="button"
              onClick={() => onNavigate('create_community')}
              style={{
                width: '44px',
                height: '44px',
                background: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                border: '1px dashed var(--neon-cyan-border)',
                clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onPointerEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--neon-cyan)';
                e.currentTarget.style.color = 'var(--neon-cyan)';
              }}
              onPointerLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--neon-cyan-border)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <Plus size={20} weight="bold" />
            </button>
          </Tooltip>

          {/* Discover / Explore Button */}
          <Tooltip text="Discover Spaces" position="right">
            <button
              type="button"
              onClick={() => onNavigate('discover')}
              style={{
                width: '44px',
                height: '44px',
                background: currentRoute === 'discover' ? 'var(--neon-cyan-dim)' : 'var(--bg-surface)',
                color: currentRoute === 'discover' ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                border: `1px solid ${currentRoute === 'discover' ? 'var(--neon-cyan)' : 'var(--neon-cyan-border)'}`,
                clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onPointerEnter={(e) => {
                if (currentRoute !== 'discover') {
                  e.currentTarget.style.borderColor = 'var(--neon-cyan)';
                  e.currentTarget.style.color = 'var(--neon-cyan)';
                }
              }}
              onPointerLeave={(e) => {
                if (currentRoute !== 'discover') {
                  e.currentTarget.style.borderColor = 'var(--neon-cyan-border)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <Compass size={20} weight={currentRoute === 'discover' ? 'fill' : 'bold'} />
            </button>
          </Tooltip>

          {/* Direct Messages / Chat Button */}
          <Tooltip text="Direct Messages" position="right">
            <button
              type="button"
              onClick={() => onNavigate('chat')}
              style={{
                width: '44px',
                height: '44px',
                background: currentRoute === 'chat' ? 'var(--neon-cyan-dim)' : 'var(--bg-surface)',
                color: currentRoute === 'chat' ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                border: `1px solid ${currentRoute === 'chat' ? 'var(--neon-cyan)' : 'var(--neon-cyan-border)'}`,
                clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onPointerEnter={(e) => {
                if (currentRoute !== 'chat') {
                  e.currentTarget.style.borderColor = 'var(--neon-cyan)';
                  e.currentTarget.style.color = 'var(--neon-cyan)';
                }
              }}
              onPointerLeave={(e) => {
                if (currentRoute !== 'chat') {
                  e.currentTarget.style.borderColor = 'var(--neon-cyan-border)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <ChatTeardropDots size={20} weight={currentRoute === 'chat' ? 'fill' : 'bold'} />
            </button>
          </Tooltip>
        </div>

        {/* Rail Footer (Profile & Logout) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Tooltip text="User Profile" position="right">
            <button
              type="button"
              onClick={() => onNavigate('profile', { username: user.username })}
              style={{
                width: '44px',
                height: '44px',
                background: 'var(--bg-surface)',
                color: 'var(--neon-cyan)',
                border: '1px solid var(--neon-cyan-border)',
                clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onPointerEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--neon-cyan)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 240, 255, 0.3)';
              }}
              onPointerLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--neon-cyan-border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <User size={20} weight="bold" />
            </button>
          </Tooltip>

          <Tooltip text="Sign Out" position="right">
            <button
              type="button"
              onClick={() => onNavigate('logout')}
              style={{
                width: '44px',
                height: '44px',
                background: 'var(--bg-surface)',
                color: 'var(--neon-magenta)',
                border: '1px solid var(--neon-magenta-border)',
                clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onPointerEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--neon-magenta)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(255, 0, 85, 0.3)';
              }}
              onPointerLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--neon-cyan-border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <SignOut size={20} weight="bold" />
            </button>
          </Tooltip>
        </div>
      </aside>

      {/* ====================================================================
          2. CHANNEL / SUBNAV COLUMN (240px, Discord Density)
          ==================================================================== */}
      <nav
        aria-label="Channels and Categories"
        style={{
          width: 'var(--channel-col-width)',
          minWidth: 'var(--channel-col-width)',
          height: '100vh',
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--neon-cyan-border)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 30,
          userSelect: 'none',
        }}
      >
        {/* Space Title Header */}
        <div
          style={{
            height: 'var(--topbar-height)',
            borderBottom: '1px solid var(--neon-cyan-border)',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface-elevated)',
            fontWeight: 700,
            fontSize: '0.95rem',
            color: 'var(--text-pure)',
            letterSpacing: '0.02em',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeCommunity ? activeCommunity.name : 'Your spaces'}
          </span>
          <CaretDown size={14} color="var(--neon-cyan)" weight="bold" />
        </div>

        {/* Channels & Categories Stream */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '14px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Section 1: Standard Channels */}
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                fontWeight: 700,
                color: 'var(--text-dim)',
                letterSpacing: '0.08em',
                padding: '0 6px 6px',
                textTransform: 'uppercase',
              }}
            >
              Text Channels
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {(channels.length > 0
                ? channels
                : [
                    { id: 'general', name: 'general', is_announcement: false },
                    { id: 'announcements', name: 'announcements', is_announcement: true },
                    { id: 'code-review', name: 'code-review', is_announcement: false },
                  ]
              ).map((ch) => {
                const isChActive = activeChannel?.id === ch.id;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => onNavigate('channel', ch)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '7px 10px',
                      background: isChActive ? 'var(--neon-cyan-dim)' : 'transparent',
                      color: isChActive ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                      border: isChActive ? '1px solid var(--neon-cyan-border)' : '1px solid transparent',
                      clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
                      cursor: 'pointer',
                      fontSize: '0.84rem',
                      fontWeight: isChActive ? 600 : 500,
                      textAlign: 'left',
                      outline: 'none',
                      transition: 'background 0.2s ease, color 0.2s ease, border-color 0.2s ease',
                    }}
                    onPointerEnter={(e) => {
                      if (!isChActive) {
                        e.currentTarget.style.color = 'var(--text-pure)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                      }
                    }}
                    onPointerLeave={(e) => {
                      if (!isChActive) {
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {ch.is_announcement ? (
                      <Megaphone size={16} color="var(--neon-warning)" weight="bold" />
                    ) : (
                      <Hash size={16} weight="bold" />
                    )}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ch.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* User Identity Bottom Bar */}
        <div
          style={{
            height: '52px',
            borderTop: '1px solid var(--neon-cyan-border)',
            padding: '0 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-pitch)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--neon-cyan)',
                clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: 'var(--neon-cyan)',
              }}
            >
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-pure)' }}>
                @{user.username}
              </div>
              <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)' }}>
                Member
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('edit_profile')}
            aria-label="User settings"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <Gear size={18} />
          </button>
        </div>
      </nav>

      {/* ====================================================================
          3. MAIN STAGE (Top Bar + Scrollable Content)
          ==================================================================== */}
      <main
        style={{
          flex: 1,
          minWidth: 0, // Critical for preventing horizontal scroll
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-pitch)',
          overflow: 'hidden',
        }}
      >
        {/* Pinned Top Bar (52px) */}
        <header
          style={{
            height: 'var(--topbar-height)',
            minHeight: 'var(--topbar-height)',
            borderBottom: '1px solid var(--neon-cyan-border)',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-pitch)',
            zIndex: 'var(--z-topbar)',
            userSelect: 'none',
          }}
        >
          {/* Header Left: Current Location & Description */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {routeIcon}
              <h1
                style={{
                  fontSize: '0.98rem',
                  fontWeight: 700,
                  color: 'var(--text-pure)',
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                  margin: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                {routeTitle}
              </h1>
            </div>
          </div>

          {/* Header Right: Search & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={14} weight="bold" />}
              onClick={onCreatePostClick}
            >
              New post
            </Button>
          </div>
        </header>

        {/* Scrollable Stage Content Area (Zero Horizontal Overflow) */}
        <section
          className="sanctuary-stage-scroll"
          style={{
            flex: 1,
            minWidth: 0,
            overflowY: 'auto',
            overflowX: 'hidden', // Strict horizontal overflow elimination
            padding: '24px 20px',
            position: 'relative',
          }}
        >
          {children}
        </section>
      </main>
    </div>
  );
}
