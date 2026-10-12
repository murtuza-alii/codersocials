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
  UsersThree,
  UserPlus,
  MagnifyingGlass,
  X,
} from '@phosphor-icons/react';

export default function AppShell({
  children,
  currentRoute = 'feed', // 'feed' | 'discover' | 'community' | 'chat' | 'profile'
  activeCommunity = null,
  activeChannel = null,
  joinedCommunities = [],
  channels = [],
  conversations = [],
  allUsers = [],
  user = { username: 'cybernaut', is_authenticated: true },
  onNavigate = () => {},
  onCreatePostClick = () => {},
  onStartDm = () => {},
  onCreateGroup = () => {},
  onCreateChannel = () => {},
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarPinned, setIsSidebarPinned] = useState(true);
  const [isHoverPeek, setIsHoverPeek] = useState(false);
  const effectiveSidebarOpen = isSidebarOpen || (!isSidebarPinned && isHoverPeek);

  const [isSpacesOpen, setIsSpacesOpen] = useState(false);
  const [isChannelsOpen, setIsChannelsOpen] = useState(true);
  const [isDmsOpen, setIsDmsOpen] = useState(true);
  const [isGroupsOpen, setIsGroupsOpen] = useState(true);
  const [isAllUsersOpen, setIsAllUsersOpen] = useState(false);

  // Search & Modal states
  const [dmSearchQuery, setDmSearchQuery] = useState('');
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [groupParticipantQuery, setGroupParticipantQuery] = useState('');

  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelTopic, setNewChannelTopic] = useState('');
  const [newChannelIsAnnouncement, setNewChannelIsAnnouncement] = useState(false);

  // Derived 1-on-1 and Group conversations
  const dmConversations = conversations.filter((c) => !c.is_group);
  const groupConversations = conversations.filter((c) => c.is_group);

  // Guarantee deduplicated communities in rail and space switcher
  const uniqueJoinedCommunities = (joinedCommunities || []).filter(
    (comm, idx, arr) =>
      arr.findIndex(
        (c) =>
          (c.id && c.id === comm.id) ||
          (c.slug && c.slug === comm.slug) ||
          (c.name && c.name.trim().toLowerCase() === comm.name?.trim().toLowerCase())
      ) === idx
  );

  const routeTitle = currentRoute === 'channel'
    ? activeChannel?.name || 'Channel'
    : currentRoute === 'chat'
      ? activeChannel?.name ? `@${activeChannel.name}` : 'Direct Messages'
      : currentRoute === 'community'
        ? activeCommunity?.name || 'Community'
        : ({ feed: 'Your feed', discover: 'Discover spaces', explore: 'Discover spaces', chat: 'Direct Messages', profile: 'Profile', post_detail: 'Post', create_post: 'New post', settings: 'App Settings', login: 'Sign in', register: 'Create account' }[currentRoute] || currentRoute.replaceAll('_', ' '));
  const routeIcon = currentRoute === 'channel'
    ? <Hash size={17} color="var(--text-secondary)" />
    : currentRoute === 'chat'
      ? <ChatTeardropDots size={17} color="var(--neon-cyan)" />
      : currentRoute === 'discover' || currentRoute === 'explore'
        ? <Compass size={17} color="var(--text-secondary)" />
        : currentRoute === 'settings'
          ? <Gear size={17} color="var(--neon-cyan)" weight="bold" />
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
          {uniqueJoinedCommunities.map((comm) => {
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
          {currentRoute === 'chat' ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <ChatTeardropDots size={18} color="var(--neon-cyan)" weight="fill" />
              <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-pure)', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Direct Messages
              </span>
            </div>
          ) : (
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
                {activeCommunity ? activeCommunity.name : 'Your spaces'}
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
          )}

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

              {uniqueJoinedCommunities.map((comm) => {
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

        {/* DM Mode Search Bar & Action Buttons */}
        {currentRoute === 'chat' && (
          <div
            style={{
              padding: '10px 10px 6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              borderBottom: '1px solid var(--neon-cyan-border)',
              background: 'rgba(0, 0, 0, 0.45)',
              flexShrink: 0,
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <MagnifyingGlass
                size={14}
                color="var(--text-dim)"
                style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }}
              />
              <input
                type="text"
                placeholder="Search people by name, handle..."
                value={dmSearchQuery}
                onChange={(e) => setDmSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: '32px',
                  padding: '0 26px 0 30px',
                  background: 'rgba(0, 0, 0, 0.65)',
                  border: '1px solid var(--neon-cyan-border)',
                  borderRadius: '2px',
                  color: 'var(--text-pure)',
                  fontSize: '0.80rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--neon-cyan)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--neon-cyan-border)')}
              />
              {dmSearchQuery && (
                <button
                  type="button"
                  onClick={() => setDmSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    padding: '2px',
                  }}
                >
                  <X size={12} weight="bold" />
                </button>
              )}
            </div>

            {/* Action Buttons: New Group & Directory */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setIsCreateGroupOpen(true)}
                style={{
                  flex: 1,
                  height: '28px',
                  background: 'var(--neon-cyan-dim)',
                  border: '1px solid var(--neon-cyan)',
                  borderRadius: '2px',
                  color: 'var(--neon-cyan)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                }}
              >
                <UsersThree size={13} weight="bold" />
                <span>NEW GROUP</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAllUsersOpen((prev) => !prev)}
                style={{
                  flex: 1,
                  height: '28px',
                  background: isAllUsersOpen ? 'rgba(0, 240, 255, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${isAllUsersOpen ? 'var(--neon-cyan)' : 'var(--neon-cyan-border)'}`,
                  borderRadius: '2px',
                  color: isAllUsersOpen ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                }}
              >
                <UserPlus size={13} weight="bold" />
                <span>DIRECTORY</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. Channels, DMs & Groups Stream with Accordions */}
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
          {currentRoute === 'chat' ? (
            /* ====================================================================
               DIRECT MESSAGING MODE (Group Chats, 1-on-1 DMs, Network Directory)
               ==================================================================== */
            <>
              {/* DM Section 1: GROUP CHATS Accordion */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 6px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setIsGroupsOpen((prev) => !prev)}
                    aria-expanded={isGroupsOpen}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: 'var(--text-dim)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      outline: 'none',
                      padding: 0,
                    }}
                  >
                    <CaretDown
                      size={11}
                      weight="bold"
                      style={{
                        transform: isGroupsOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                        transition: 'transform 0.18s ease',
                      }}
                    />
                    <span>Group Chats</span>
                    <span style={{ fontSize: '0.64rem', color: 'var(--neon-cyan)', marginLeft: '4px' }}>
                      {groupConversations.filter((g) => !dmSearchQuery.trim() || g.title?.toLowerCase().includes(dmSearchQuery.trim().toLowerCase())).length}
                    </span>
                  </button>

                  <Tooltip text="Create Group Chat" position="left">
                    <button
                      type="button"
                      onClick={() => setIsCreateGroupOpen(true)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-dim)',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      onPointerEnter={(e) => (e.currentTarget.style.color = 'var(--neon-cyan)')}
                      onPointerLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
                    >
                      <Plus size={13} weight="bold" />
                    </button>
                  </Tooltip>
                </div>

                {isGroupsOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                    {groupConversations
                      .filter((g) => !dmSearchQuery.trim() || g.title?.toLowerCase().includes(dmSearchQuery.trim().toLowerCase()))
                      .map((grp) => {
                        const isGrpActive = activeChannel?.is_group && (activeChannel?.id === grp.id || activeChannel?.conversation_id === grp.id);
                        return (
                          <button
                            key={grp.id}
                            type="button"
                            onClick={() => onNavigate('chat', grp)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '7px 9px',
                              background: isGrpActive ? 'var(--neon-cyan-dim)' : 'transparent',
                              color: isGrpActive ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                              border: isGrpActive ? '1px solid var(--neon-cyan-border)' : '1px solid transparent',
                              clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
                              cursor: 'pointer',
                              fontSize: '0.84rem',
                              fontWeight: isGrpActive ? 600 : 500,
                              textAlign: 'left',
                              outline: 'none',
                              transition: 'all 0.15s ease',
                              gap: '8px',
                            }}
                            onPointerEnter={(e) => {
                              if (!isGrpActive) {
                                e.currentTarget.style.color = 'var(--text-pure)';
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                              }
                            }}
                            onPointerLeave={(e) => {
                              if (!isGrpActive) {
                                e.currentTarget.style.color = 'var(--text-secondary)';
                                e.currentTarget.style.background = 'transparent';
                              }
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                              <div
                                style={{
                                  width: '20px',
                                  height: '20px',
                                  background: 'rgba(0, 240, 255, 0.15)',
                                  border: '1px solid var(--neon-cyan)',
                                  borderRadius: '2px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                <UsersThree size={12} color="var(--neon-cyan)" weight="bold" />
                              </div>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {grp.title}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', flexShrink: 0 }}>
                              {grp.member_count || grp.participants?.length || 3}m
                            </span>
                          </button>
                        );
                      })}
                    {groupConversations.length === 0 && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', padding: '6px 8px', fontStyle: 'italic' }}>
                        No groups yet. Click + to create one!
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* DM Section 2: DIRECT MESSAGES (1-on-1) Accordion */}
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
                    {dmConversations.filter((d) => {
                      if (!dmSearchQuery.trim()) return true;
                      const q = dmSearchQuery.trim().toLowerCase();
                      const targetUser = d.recipient || d.title || '';
                      if (targetUser.toLowerCase().includes(q)) return true;
                      const u = allUsers.find((usr) => usr.username === targetUser);
                      if (u) {
                        if (u.name && u.name.toLowerCase().includes(q)) return true;
                        if (u.first_name && u.first_name.toLowerCase().includes(q)) return true;
                        if (u.last_name && u.last_name.toLowerCase().includes(q)) return true;
                      }
                      return false;
                    }).length}
                  </span>
                </button>

                {isDmsOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                    {dmConversations
                      .filter((d) => {
                        if (!dmSearchQuery.trim()) return true;
                        const q = dmSearchQuery.trim().toLowerCase();
                        const targetUser = d.recipient || d.title || '';
                        if (targetUser.toLowerCase().includes(q)) return true;
                        const u = allUsers.find((usr) => usr.username === targetUser);
                        if (u) {
                          if (u.name && u.name.toLowerCase().includes(q)) return true;
                          if (u.first_name && u.first_name.toLowerCase().includes(q)) return true;
                          if (u.last_name && u.last_name.toLowerCase().includes(q)) return true;
                        }
                        return false;
                      })
                      .map((dm) => {
                        const targetUser = dm.recipient || dm.title;
                        const isDmActive = !activeChannel?.is_group && (activeChannel?.name === targetUser || activeChannel?.name === `@${targetUser}`);
                        const matchingUserInfo = allUsers.find((u) => u.username === targetUser);
                        const isOnline = matchingUserInfo?.status === 'online' || targetUser === 'alex_dev';

                        return (
                          <button
                            key={dm.id}
                            type="button"
                            onClick={() => onNavigate('chat', dm)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '7px 9px',
                              background: isDmActive ? 'var(--neon-cyan-dim)' : 'transparent',
                              color: isDmActive ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                              border: isDmActive ? '1px solid var(--neon-cyan-border)' : '1px solid transparent',
                              clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
                              cursor: 'pointer',
                              fontSize: '0.84rem',
                              fontWeight: isDmActive ? 600 : 500,
                              textAlign: 'left',
                              outline: 'none',
                              transition: 'all 0.15s ease',
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
                                  background: isOnline ? 'var(--neon-cyan)' : 'var(--text-dim)',
                                  boxShadow: isOnline ? '0 0 6px var(--neon-cyan)' : 'none',
                                  flexShrink: 0,
                                }}
                              />
                              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, color: isDmActive ? 'var(--neon-cyan)' : 'var(--text-pure)' }}>
                                  {matchingUserInfo?.name && matchingUserInfo.name !== targetUser ? matchingUserInfo.name : `@${targetUser}`}
                                </div>
                                {matchingUserInfo?.name && matchingUserInfo.name !== targetUser && (
                                  <div style={{ fontSize: '0.64rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                                    @{targetUser}
                                  </div>
                                )}
                              </div>
                            </div>
                            <span style={{ fontSize: '0.64rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', flexShrink: 0, marginLeft: '4px' }}>
                              {matchingUserInfo?.role || 'Member'}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* DM Section 3: NETWORK DIRECTORY / FIND USER Accordion */}
              {(isAllUsersOpen || dmSearchQuery.trim().length > 0) && (
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: 'var(--neon-cyan)',
                      letterSpacing: '0.08em',
                      padding: '4px 6px',
                      textTransform: 'uppercase',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>Network Users</span>
                    <span>
                      {allUsers
                        .filter((u) => u.username !== user.username)
                        .filter((u) => {
                          if (!dmSearchQuery.trim()) return true;
                          const q = dmSearchQuery.trim().toLowerCase();
                          return (
                            u.username?.toLowerCase().includes(q) ||
                            (u.name && u.name.toLowerCase().includes(q)) ||
                            (u.first_name && u.first_name.toLowerCase().includes(q)) ||
                            (u.last_name && u.last_name.toLowerCase().includes(q)) ||
                            (u.role && u.role.toLowerCase().includes(q))
                          );
                        }).length}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                    {allUsers
                      .filter((u) => u.username !== user.username)
                      .filter((u) => {
                        if (!dmSearchQuery.trim()) return true;
                        const q = dmSearchQuery.trim().toLowerCase();
                        return (
                          u.username?.toLowerCase().includes(q) ||
                          (u.name && u.name.toLowerCase().includes(q)) ||
                          (u.first_name && u.first_name.toLowerCase().includes(q)) ||
                          (u.last_name && u.last_name.toLowerCase().includes(q)) ||
                          (u.role && u.role.toLowerCase().includes(q))
                        );
                      })
                      .map((u) => (
                        <div
                          key={u.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: '2px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: u.status === 'online' ? 'var(--neon-cyan)' : 'var(--text-dim)',
                                flexShrink: 0,
                              }}
                            />
                            <div style={{ minWidth: 0, overflow: 'hidden' }}>
                              <div style={{ fontSize: '0.80rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {u.name || u.username}
                              </div>
                              {u.name && u.name !== u.username && (
                                <div style={{ fontSize: '0.66rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                                  @{u.username}
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              onStartDm(u.username);
                              setDmSearchQuery('');
                            }}
                            style={{
                              background: 'var(--neon-cyan-dim)',
                              border: '1px solid var(--neon-cyan)',
                              color: 'var(--neon-cyan)',
                              fontSize: '0.68rem',
                              fontFamily: 'var(--font-mono)',
                              padding: '2px 7px',
                              borderRadius: '2px',
                              cursor: 'pointer',
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            + CHAT
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ====================================================================
               SPACE / COMMUNITY MODE (Text Channels, DMs, Joined Spaces)
               ==================================================================== */
            <>
              {/* Section 1: Standard Channels (Collapsible Accordion with Create Button) */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 6px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setIsChannelsOpen((prev) => !prev)}
                    aria-expanded={isChannelsOpen}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: 'var(--text-dim)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      outline: 'none',
                      padding: 0,
                    }}
                  >
                    <CaretDown
                      size={11}
                      weight="bold"
                      style={{
                        transform: isChannelsOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                        transition: 'transform 0.18s ease',
                      }}
                    />
                    <span>Text Channels</span>
                    <span style={{ fontSize: '0.64rem', color: 'var(--text-dim)', marginLeft: '4px' }}>
                      {channels.length}
                    </span>
                  </button>

                  <Tooltip text={`Create Channel in ${activeCommunity?.name || 'Space'}`} position="left">
                    <button
                      type="button"
                      onClick={() => setIsCreateChannelOpen(true)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-dim)',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      onPointerEnter={(e) => (e.currentTarget.style.color = 'var(--neon-cyan)')}
                      onPointerLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
                    >
                      <Plus size={13} weight="bold" />
                    </button>
                  </Tooltip>
                </div>

                {isChannelsOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                    {channels.map((ch) => {
                      const isChActive = currentRoute === 'channel' && activeChannel?.name === ch.name;
                      return (
                        <button
                          key={ch.id || ch.name}
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
            </>
          )}
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
          <div
            onClick={() => onNavigate('profile', { username: user.username })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: '2px',
              transition: 'background 0.15s ease',
              minWidth: 0,
            }}
            onPointerEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
            onPointerLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            title="View Your Profile"
          >
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
                flexShrink: 0,
              }}
            >
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-pure)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                @{user.username}
              </div>
              <div style={{ fontSize: '0.66rem', fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)' }}>
                View Profile
              </div>
            </div>
          </div>
          <Tooltip text="App Settings" position="top">
            <button
              type="button"
              onClick={() => onNavigate('settings')}
              aria-label="App Settings"
              style={{
                background: currentRoute === 'settings' ? 'var(--neon-cyan-dim)' : 'transparent',
                border: currentRoute === 'settings' ? '1px solid var(--neon-cyan)' : '1px solid transparent',
                borderRadius: '2px',
                color: currentRoute === 'settings' ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onPointerEnter={(e) => {
                if (currentRoute !== 'settings') e.currentTarget.style.color = 'var(--text-pure)';
              }}
              onPointerLeave={(e) => {
                if (currentRoute !== 'settings') e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <Gear size={18} weight={currentRoute === 'settings' ? 'fill' : 'regular'} />
            </button>
          </Tooltip>
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

      {/* ====================================================================
          4. CREATE GROUP CHAT MODAL
          ==================================================================== */}
      {isCreateGroupOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setIsCreateGroupOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '440px',
              background: 'rgba(8, 10, 15, 0.96)',
              border: '1px solid var(--neon-cyan)',
              boxShadow: '0 0 30px rgba(0, 240, 255, 0.25)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--neon-cyan-border)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UsersThree size={18} color="var(--neon-cyan)" weight="bold" />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#fff', letterSpacing: '0.04em' }}>
                  CREATE GROUP CHAT
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateGroupOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)', marginBottom: '6px', letterSpacing: '0.06em' }}>
                GROUP TITLE
              </label>
              <input
                type="text"
                placeholder="e.g. Weekend Hackers, Frontend Crew"
                value={newGroupTitle}
                onChange={(e) => setNewGroupTitle(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  background: 'rgba(0,0,0,0.6)',
                  border: '1px solid var(--neon-cyan-border)',
                  color: '#fff',
                  padding: '0 12px',
                  fontSize: '0.86rem',
                  outline: 'none',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--neon-cyan)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--neon-cyan-border)')}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)', letterSpacing: '0.06em' }}>
                  SELECT PARTICIPANTS ({selectedGroupMembers.length} selected)
                </label>
              </div>

              {/* Search participants by name or username */}
              <div style={{ position: 'relative', marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                <MagnifyingGlass
                  size={13}
                  color="var(--text-dim)"
                  style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }}
                />
                <input
                  type="text"
                  placeholder="Search people by name or handle..."
                  value={groupParticipantQuery}
                  onChange={(e) => setGroupParticipantQuery(e.target.value)}
                  style={{
                    width: '100%',
                    height: '32px',
                    padding: '0 26px 0 28px',
                    background: 'rgba(0,0,0,0.6)',
                    border: '1px solid var(--neon-cyan-border)',
                    borderRadius: '2px',
                    color: '#fff',
                    fontSize: '0.78rem',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--neon-cyan)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--neon-cyan-border)')}
                />
                {groupParticipantQuery && (
                  <button
                    type="button"
                    onClick={() => setGroupParticipantQuery('')}
                    style={{
                      position: 'absolute',
                      right: '6px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      padding: '2px',
                    }}
                  >
                    <X size={12} weight="bold" />
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {allUsers
                  .filter((u) => u.username !== user.username)
                  .filter((u) => {
                    if (!groupParticipantQuery.trim()) return true;
                    const q = groupParticipantQuery.trim().toLowerCase();
                    return (
                      u.username?.toLowerCase().includes(q) ||
                      (u.name && u.name.toLowerCase().includes(q)) ||
                      (u.first_name && u.first_name.toLowerCase().includes(q)) ||
                      (u.last_name && u.last_name.toLowerCase().includes(q)) ||
                      (u.role && u.role.toLowerCase().includes(q))
                    );
                  })
                  .map((u) => {
                    const isSelected = selectedGroupMembers.includes(u.username);
                    return (
                      <label
                        key={u.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 10px',
                          background: isSelected ? 'var(--neon-cyan-dim)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isSelected ? 'var(--neon-cyan)' : 'transparent'}`,
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedGroupMembers((prev) =>
                                isSelected ? prev.filter((m) => m !== u.username) : [...prev, u.username]
                              );
                            }}
                            style={{ accentColor: 'var(--neon-cyan)' }}
                          />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {u.name || u.username}
                            </div>
                            {u.name && u.name !== u.username && (
                              <div style={{ fontSize: '0.66rem', color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)' }}>
                                @{u.username}
                              </div>
                            )}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', flexShrink: 0 }}>
                          {u.role || 'Member'}
                        </span>
                      </label>
                    );
                  })}
                {allUsers
                  .filter((u) => u.username !== user.username)
                  .filter((u) => {
                    if (!groupParticipantQuery.trim()) return true;
                    const q = groupParticipantQuery.trim().toLowerCase();
                    return (
                      u.username?.toLowerCase().includes(q) ||
                      (u.name && u.name.toLowerCase().includes(q)) ||
                      (u.first_name && u.first_name.toLowerCase().includes(q)) ||
                      (u.last_name && u.last_name.toLowerCase().includes(q)) ||
                      (u.role && u.role.toLowerCase().includes(q))
                    );
                  }).length === 0 && (
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', padding: '12px', textAlign: 'center', fontStyle: 'italic' }}>
                    No users found matching "{groupParticipantQuery}"
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setIsCreateGroupOpen(false)}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  border: '1px solid var(--text-dim)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => {
                  if (newGroupTitle.trim()) {
                    onCreateGroup({ title: newGroupTitle.trim(), members: selectedGroupMembers });
                    setNewGroupTitle('');
                    setSelectedGroupMembers([]);
                    setIsCreateGroupOpen(false);
                  }
                }}
                disabled={!newGroupTitle.trim()}
                style={{
                  padding: '8px 18px',
                  background: newGroupTitle.trim() ? 'var(--neon-cyan)' : 'var(--text-dim)',
                  border: 'none',
                  color: '#000',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  cursor: newGroupTitle.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: 'var(--font-mono)',
                  boxShadow: newGroupTitle.trim() ? '0 0 12px var(--neon-cyan)' : 'none',
                }}
              >
                CREATE GROUP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          5. CREATE CHANNEL MODAL
          ==================================================================== */}
      {isCreateChannelOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setIsCreateChannelOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '440px',
              background: 'rgba(8, 10, 15, 0.96)',
              border: '1px solid var(--neon-cyan)',
              boxShadow: '0 0 30px rgba(0, 240, 255, 0.25)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--neon-cyan-border)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Hash size={18} color="var(--neon-cyan)" weight="bold" />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#fff', letterSpacing: '0.04em' }}>
                  NEW CHANNEL
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateChannelOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Target Space:{' '}
              <span style={{ color: 'var(--neon-cyan)', fontWeight: 700 }}>
                {activeCommunity?.name || 'General Space'}
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)', marginBottom: '6px', letterSpacing: '0.06em' }}>
                CHANNEL NAME
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: '10px', color: 'var(--text-dim)', fontWeight: 700 }}>#</span>
                <input
                  type="text"
                  placeholder="e.g. dev-discussions, resources"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  style={{
                    width: '100%',
                    height: '38px',
                    background: 'rgba(0,0,0,0.6)',
                    border: '1px solid var(--neon-cyan-border)',
                    color: '#fff',
                    padding: '0 12px 0 24px',
                    fontSize: '0.86rem',
                    outline: 'none',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--neon-cyan)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--neon-cyan-border)')}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)', marginBottom: '6px', letterSpacing: '0.06em' }}>
                TOPIC / DESCRIPTION
              </label>
              <input
                type="text"
                placeholder="What is this channel about?"
                value={newChannelTopic}
                onChange={(e) => setNewChannelTopic(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  background: 'rgba(0,0,0,0.6)',
                  border: '1px solid var(--neon-cyan-border)',
                  color: '#fff',
                  padding: '0 12px',
                  fontSize: '0.86rem',
                  outline: 'none',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--neon-cyan)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--neon-cyan-border)')}
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.80rem', color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={newChannelIsAnnouncement}
                onChange={(e) => setNewChannelIsAnnouncement(e.target.checked)}
                style={{ accentColor: 'var(--neon-cyan)' }}
              />
              <span>Announcement Channel (Only admins can post)</span>
            </label>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setIsCreateChannelOpen(false)}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  border: '1px solid var(--text-dim)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => {
                  if (newChannelName.trim()) {
                    onCreateChannel({
                      name: newChannelName.trim(),
                      topic: newChannelTopic.trim(),
                      is_announcement: newChannelIsAnnouncement,
                    });
                    setNewChannelName('');
                    setNewChannelTopic('');
                    setNewChannelIsAnnouncement(false);
                    setIsCreateChannelOpen(false);
                  }
                }}
                disabled={!newChannelName.trim()}
                style={{
                  padding: '8px 18px',
                  background: newChannelName.trim() ? 'var(--neon-cyan)' : 'var(--text-dim)',
                  border: 'none',
                  color: '#000',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  cursor: newChannelName.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: 'var(--font-mono)',
                  boxShadow: newChannelName.trim() ? '0 0 12px var(--neon-cyan)' : 'none',
                }}
              >
                CREATE CHANNEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
