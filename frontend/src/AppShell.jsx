/** Application navigation rail, space navigation, and page header. */

import React, { useState } from 'react';
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
  CaretDoubleLeft,
  CaretDoubleRight,
  PushPin,
  Check,
  Users,
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarPinned, setIsSidebarPinned] = useState(true);
  const [isHoverPeek, setIsHoverPeek] = useState(false);
  const effectiveSidebarOpen = isSidebarOpen || (!isSidebarPinned && isHoverPeek);

  const [isSpacesOpen, setIsSpacesOpen] = useState(false);
  const [isChannelsOpen, setIsChannelsOpen] = useState(true);
  const [isDmsOpen, setIsDmsOpen] = useState(true);
  const [isJoinedSpacesOpen, setIsJoinedSpacesOpen] = useState(false);

  const directMessages = [
    { id: 'dm-alex_dev', name: 'alex_dev', is_dm: true, status: 'online', role: 'Developer' },
    { id: 'dm-code_ninja', name: 'code_ninja', is_dm: true, status: 'offline', role: 'Research' },
  ];

  const routeTitle = currentRoute === 'channel'
    ? activeChannel?.name || 'Channel'
    : currentRoute === 'chat'
      ? activeChannel?.name ? `@${activeChannel.name}` : 'Direct Messages'
      : currentRoute === 'community'
        ? activeCommunity?.name || 'Community'
        : ({ feed: 'Your feed', discover: 'Discover spaces', explore: 'Discover spaces', chat: 'Direct Messages', profile: 'Profile', post_detail: 'Post', create_post: 'New post', login: 'Sign in', register: 'Create account' }[currentRoute] || currentRoute.replaceAll('_', ' '));
  const routeIcon = currentRoute === 'channel'
    ? <Hash size={17} color="var(--text-secondary)" />
    : currentRoute === 'chat'
      ? <ChatTeardropDots size={17} color="var(--neon-cyan)" />
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
        background: 'transparent',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-display)',
        position: 'relative',
        zIndex: 10,
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
          background: 'rgba(5, 5, 8, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
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

      {/* Pop-up Accordion Sidebar Pull Handle (when collapsed) */}
      {!effectiveSidebarOpen && (
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          onPointerEnter={() => {
            if (!isSidebarPinned) setIsHoverPeek(true);
          }}
          aria-label="Expand channels sidebar"
          title="Expand Channels (>>)"
          style={{
            position: 'absolute',
            left: 'var(--rail-width)',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 65,
            width: '20px',
            height: '72px',
            background: 'rgba(6, 7, 10, 0.94)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid var(--neon-cyan)',
            borderLeft: 'none',
            borderTopRightRadius: '6px',
            borderBottomRightRadius: '6px',
            color: 'var(--neon-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            outline: 'none',
            boxShadow: '0 0 16px rgba(0, 240, 255, 0.35)',
            transition: 'background 0.2s ease, width 0.15s ease',
          }}
        >
          <CaretDoubleRight size={13} weight="bold" />
        </button>
      )}

      {/* Pop-up Overlay Backdrop (when in unpinned pop-up mode and open) */}
      {!isSidebarPinned && effectiveSidebarOpen && (
        <div
          onClick={() => {
            setIsSidebarOpen(false);
            setIsHoverPeek(false);
          }}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 'calc(var(--rail-width) + var(--channel-col-width))',
            top: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            zIndex: 65,
            cursor: 'pointer',
          }}
        />
      )}

      {/* ====================================================================
          2. CHANNEL / SUBNAV COLUMN (Accordion Pop-up / Docked Drawer)
          ==================================================================== */}
      <nav
        aria-label="Channels and Categories"
        onPointerLeave={() => {
          if (!isSidebarPinned && !isSidebarOpen) {
            setIsHoverPeek(false);
          }
        }}
        style={
          isSidebarPinned
            ? {
                width: effectiveSidebarOpen ? 'var(--channel-col-width)' : '0px',
                minWidth: effectiveSidebarOpen ? 'var(--channel-col-width)' : '0px',
                height: '100vh',
                background: 'rgba(6, 7, 10, 0.84)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRight: effectiveSidebarOpen ? '1px solid var(--neon-cyan-border)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 30,
                userSelect: 'none',
                overflow: 'hidden',
                transition: 'width 0.24s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
              }
            : {
                position: 'absolute',
                left: 'var(--rail-width)',
                top: 0,
                bottom: 0,
                width: 'var(--channel-col-width)',
                minWidth: 'var(--channel-col-width)',
                height: '100vh',
                background: 'rgba(6, 7, 10, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRight: '1px solid var(--neon-cyan)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 70,
                userSelect: 'none',
                transform: effectiveSidebarOpen ? 'translateX(0)' : 'translateX(-105%)',
                opacity: effectiveSidebarOpen ? 1 : 0,
                pointerEvents: effectiveSidebarOpen ? 'auto' : 'none',
                boxShadow: effectiveSidebarOpen
                  ? '16px 0 32px rgba(0, 0, 0, 0.85), 0 0 20px rgba(0, 240, 255, 0.2)'
                  : 'none',
                transition: 'transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease',
              }
        }
      >
        {/* 1. Interactive Space Title Header with Dropdown Accordion + Pin & Collapse */}
        <div
          style={{
            position: 'relative',
            height: 'var(--topbar-height)',
            background: 'var(--bg-surface-elevated)',
            borderBottom: '1px solid var(--neon-cyan-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 8px 0 14px',
            gap: '6px',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={() => setIsSpacesOpen((prev) => !prev)}
            aria-expanded={isSpacesOpen}
            style={{
              flex: 1,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '6px',
              background: 'transparent',
              fontWeight: 700,
              fontSize: '0.90rem',
              color: 'var(--text-pure)',
              letterSpacing: '0.02em',
              cursor: 'pointer',
              border: 'none',
              padding: 0,
              outline: 'none',
              minWidth: 0,
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>
              {activeCommunity ? activeCommunity.name : (currentRoute === 'chat' ? 'Direct Messages' : 'Your spaces')}
            </span>
            <CaretDown
              size={13}
              color="var(--neon-cyan)"
              weight="bold"
              style={{
                transform: isSpacesOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                flexShrink: 0,
              }}
            />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
            {/* Dock/Pin Toggle */}
            <Tooltip text={isSidebarPinned ? 'Pop-up Mode' : 'Dock Sidebar'} position="bottom">
              <button
                type="button"
                onClick={() => setIsSidebarPinned((p) => !p)}
                aria-label={isSidebarPinned ? 'Switch to pop-up mode' : 'Dock sidebar'}
                style={{
                  background: isSidebarPinned ? 'var(--neon-cyan-dim)' : 'transparent',
                  border: `1px solid ${isSidebarPinned ? 'var(--neon-cyan)' : 'transparent'}`,
                  color: isSidebarPinned ? 'var(--neon-cyan)' : 'var(--text-dim)',
                  padding: '5px',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  outline: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <PushPin size={13} weight={isSidebarPinned ? 'fill' : 'regular'} />
              </button>
            </Tooltip>

            {/* Collapse (<<) Button */}
            <Tooltip text="Collapse (<<)" position="bottom">
              <button
                type="button"
                onClick={() => {
                  setIsSidebarOpen(false);
                  setIsHoverPeek(false);
                }}
                aria-label="Collapse sidebar"
                style={{
                  background: 'transparent',
                  border: '1px solid transparent',
                  color: 'var(--text-dim)',
                  padding: '5px',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  outline: 'none',
                  transition: 'all 0.15s ease',
                }}
                onPointerEnter={(e) => {
                  e.currentTarget.style.color = 'var(--neon-cyan)';
                  e.currentTarget.style.borderColor = 'var(--neon-cyan-border)';
                }}
                onPointerLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-dim)';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                <CaretDoubleLeft size={13} weight="bold" />
              </button>
            </Tooltip>
          </div>

          {/* Expandable Spaces Selector Dropdown */}
          {isSpacesOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'var(--topbar-height)',
                left: 0,
                width: '100%',
                background: 'rgba(5, 8, 12, 0.96)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderBottom: '1px solid var(--neon-cyan)',
                boxShadow: '0 12px 28px rgba(0, 0, 0, 0.85)',
                zIndex: 80,
                padding: '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.64rem',
                  fontWeight: 700,
                  color: 'var(--text-dim)',
                  padding: '4px 6px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Switch Space
              </div>

              {joinedCommunities.map((comm) => {
                const isActive = activeCommunity?.id === comm.id;
                return (
                  <button
                    key={comm.id}
                    type="button"
                    onClick={() => {
                      onNavigate('community', comm);
                      setIsSpacesOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 8px',
                      background: isActive ? 'var(--neon-cyan-dim)' : 'transparent',
                      color: isActive ? 'var(--neon-cyan)' : 'var(--text-primary)',
                      border: `1px solid ${isActive ? 'var(--neon-cyan-border)' : 'transparent'}`,
                      borderRadius: '2px',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: isActive ? 700 : 500,
                      textAlign: 'left',
                      outline: 'none',
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {comm.name}
                    </span>
                    {isActive && <Check size={13} color="var(--neon-cyan)" weight="bold" />}
                  </button>
                );
              })}

              <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />

              <button
                type="button"
                onClick={() => {
                  onNavigate('discover');
                  setIsSpacesOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 8px',
                  background: 'transparent',
                  color: 'var(--neon-cyan)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-mono)',
                  textAlign: 'left',
                }}
              >
                <Compass size={14} weight="bold" />
                <span>Discover all spaces</span>
              </button>
            </div>
          )}
        </div>

        {/* 2. Channels & Categories Stream with Accordions */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '12px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {/* Section 1: Standard Channels (Collapsible Accordion) */}
          <div>
            <button
              type="button"
              onClick={() => setIsChannelsOpen((prev) => !prev)}
              aria-expanded={isChannelsOpen}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                fontWeight: 700,
                color: 'var(--text-dim)',
                letterSpacing: '0.08em',
                padding: '4px 6px',
                textTransform: 'uppercase',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CaretDown
                  size={11}
                  weight="bold"
                  style={{
                    transform: isChannelsOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                    transition: 'transform 0.18s ease',
                  }}
                />
                <span>Text Channels</span>
              </div>
              <span style={{ fontSize: '0.64rem', color: 'var(--text-dim)' }}>
                {channels.length}
              </span>
            </button>

            {isChannelsOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                {(channels.length > 0
                  ? channels
                  : [
                      { id: 'general', name: 'general', is_announcement: false },
                      { id: 'announcements', name: 'announcements', is_announcement: true },
                      { id: 'code-review', name: 'code-review', is_announcement: false },
                    ]
                ).map((ch) => {
                  const isChActive = currentRoute === 'channel' && activeChannel?.id === ch.id;
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
            )}
          </div>

          {/* Section 2: Direct Messages (Collapsible Accordion) */}
          <div>
            <button
              type="button"
              onClick={() => setIsDmsOpen((prev) => !prev)}
              aria-expanded={isDmsOpen}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                fontWeight: 700,
                color: 'var(--text-dim)',
                letterSpacing: '0.08em',
                padding: '4px 6px',
                textTransform: 'uppercase',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CaretDown
                  size={11}
                  weight="bold"
                  style={{
                    transform: isDmsOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                    transition: 'transform 0.18s ease',
                  }}
                />
                <span>Direct Messages</span>
              </div>
              <span style={{ fontSize: '0.64rem', color: 'var(--neon-cyan)', fontWeight: 600 }}>
                1 ONLINE
              </span>
            </button>

            {isDmsOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                {directMessages.map((dm) => {
                  const isDmActive = currentRoute === 'chat' && activeChannel?.name === dm.name;
                  return (
                    <button
                      key={dm.id}
                      type="button"
                      onClick={() => onNavigate('chat', dm)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '7px 10px',
                        background: isDmActive ? 'var(--neon-cyan-dim)' : 'transparent',
                        color: isDmActive ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                        border: isDmActive ? '1px solid var(--neon-cyan-border)' : '1px solid transparent',
                        clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
                        cursor: 'pointer',
                        fontSize: '0.84rem',
                        fontWeight: isDmActive ? 600 : 500,
                        textAlign: 'left',
                        outline: 'none',
                        transition: 'background 0.2s ease, color 0.2s ease, border-color 0.2s ease',
                      }}
                      onPointerEnter={(e) => {
                        if (!isDmActive) {
                          e.currentTarget.style.color = 'var(--text-pure)';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                        }
                      }}
                      onPointerLeave={(e) => {
                        if (!isDmActive) {
                          e.currentTarget.style.color = 'var(--text-secondary)';
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <span
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: dm.status === 'online' ? 'var(--neon-cyan)' : 'var(--text-dim)',
                            boxShadow: dm.status === 'online' ? '0 0 6px var(--neon-cyan)' : 'none',
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          @{dm.name}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                        {dm.role}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: Joined Spaces Directory (Collapsible Accordion) */}
          <div>
            <button
              type="button"
              onClick={() => setIsJoinedSpacesOpen((prev) => !prev)}
              aria-expanded={isJoinedSpacesOpen}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                fontWeight: 700,
                color: 'var(--text-dim)',
                letterSpacing: '0.08em',
                padding: '4px 6px',
                textTransform: 'uppercase',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CaretDown
                  size={11}
                  weight="bold"
                  style={{
                    transform: isJoinedSpacesOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                    transition: 'transform 0.18s ease',
                  }}
                />
                <span>Joined Spaces</span>
              </div>
              <span style={{ fontSize: '0.64rem', color: 'var(--text-dim)' }}>
                {joinedCommunities.length}
              </span>
            </button>

            {isJoinedSpacesOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                {joinedCommunities.map((comm) => {
                  const isActive = activeCommunity?.id === comm.id;
                  return (
                    <button
                      key={comm.id}
                      type="button"
                      onClick={() => onNavigate('community', comm)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 8px',
                        background: isActive ? 'var(--neon-cyan-dim)' : 'transparent',
                        color: isActive ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                        border: isActive ? '1px solid var(--neon-cyan-border)' : '1px solid transparent',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        fontSize: '0.80rem',
                        fontWeight: isActive ? 600 : 400,
                        textAlign: 'left',
                        outline: 'none',
                      }}
                    >
                      <Users size={14} color={isActive ? 'var(--neon-cyan)' : 'var(--text-dim)'} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {comm.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
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
          background: 'transparent',
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
            background: 'rgba(4, 5, 8, 0.82)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 'var(--z-topbar)',
            userSelect: 'none',
          }}
        >
          {/* Header Left: Current Location & Description */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            {!effectiveSidebarOpen && (
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                title="Expand channels sidebar (>>)"
                style={{
                  background: 'var(--neon-cyan-dim)',
                  border: '1px solid var(--neon-cyan)',
                  color: 'var(--neon-cyan)',
                  padding: '4px 8px',
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <CaretDoubleRight size={13} weight="bold" />
                <span>CHANNELS</span>
              </button>
            )}
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
            background: 'rgba(0, 0, 0, 0.22)',
          }}
        >
          {children}
        </section>
      </main>
    </div>
  );
}
