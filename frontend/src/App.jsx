import React, { useState, useEffect } from 'react';
import './tokens.css';
import AppShell from './AppShell';
import Feed from './Feed';
import PostDetail from './PostDetail';
import DiscoverSpaces from './DiscoverSpaces';
import CommunityDetail from './CommunityDetail';
import CreatePost from './CreatePost';
import ChannelChat from './ChannelChat';
import Profile from './Profile';
import Auth from './Auth';
import AppSettings from './AppSettings';
import Creative3DBackground from './Creative3DBackground';
import SmoothCursor from './SmoothCursor';
import Button from './Button';
import ErrorBoundary from './ErrorBoundary';
import { X, Globe, Lock } from '@phosphor-icons/react';

const DEFAULT_COMMUNITIES = [
  {
    id: 'systems-infrastructure',
    name: 'Systems & Infrastructure',
    slug: 'systems-infrastructure',
    channels: [
      { id: 'announcements', name: 'announcements', is_announcement: true, topic: 'Infrastructure announcements' },
      { id: 'general', name: 'general', is_announcement: false, topic: 'General systems discussion' },
      { id: 'devops-infra', name: 'devops-infra', is_announcement: false, topic: 'K8s, Docker, CI/CD pipelines' },
      { id: 'distributed-systems', name: 'distributed-systems', is_announcement: false, topic: 'Raft, Paxos, Kafka, database internals' },
    ],
  },
  {
    id: 'creative-technology',
    name: 'Creative Technology',
    slug: 'creative-technology',
    channels: [
      { id: 'announcements', name: 'announcements', is_announcement: true, topic: 'Creative Tech announcements' },
      { id: 'general', name: 'general', is_announcement: false, topic: 'General creative talk' },
      { id: 'shaders-3d', name: 'shaders-3d', is_announcement: false, topic: 'GLSL, ThreeJS & procedural animation' },
      { id: 'audio-visual', name: 'audio-visual', is_announcement: false, topic: 'Synths, WebAudio and visualizers' },
    ],
  },
  {
    id: 'applied-ai-research',
    name: 'Applied AI Research',
    slug: 'applied-ai-research',
    channels: [
      { id: 'announcements', name: 'announcements', is_announcement: true, topic: 'AI Research announcements' },
      { id: 'general', name: 'general', is_announcement: false, topic: 'General neural discussions' },
      { id: 'papers-review', name: 'papers-review', is_announcement: false, topic: 'Weekly arXiv papers' },
      { id: 'model-weights', name: 'model-weights', is_announcement: false, topic: 'Open source checkpoints and quantization' },
    ],
  },
  {
    id: 'campus-code-sanctuary',
    name: 'Campus Code Sanctuary',
    slug: 'campus-code-sanctuary',
    channels: [
      { id: 'announcements', name: 'announcements', is_announcement: true, topic: 'Official verified updates and hackathons' },
      { id: 'general', name: 'general', is_announcement: false, topic: 'General campus chats and peer Q&A' },
      { id: 'dev-chat', name: 'dev-chat', is_announcement: false, topic: 'Django, Python & system architecture discussions' },
    ],
  },
  {
    id: 'silicon-tech-vault',
    name: 'Silicon Tech Vault',
    slug: 'silicon-tech-vault',
    channels: [
      { id: 'announcements', name: 'announcements', is_announcement: true, topic: 'Official Silicon announcements' },
      { id: 'hardware-lab', name: 'hardware-lab', is_announcement: false, topic: 'Silicon & hardware architecture' },
      { id: 'firmware-dev', name: 'firmware-dev', is_announcement: false, topic: 'Embedded systems and kernel hacking' },
    ],
  },
];

const DEFAULT_CONVERSATIONS = [
  {
    id: '22d31b48-6ce6-466f-ba8e-b1852f722eb5',
    is_group: true,
    title: 'Weekend Hackers',
    recipient: null,
    participants: ['alex_dev', 'sarah_creator', 'code_ninja'],
    member_count: 3,
    last_message: 'heyaaa whatsuuppp',
  },
  {
    id: '70aabd53-2342-47ad-9853-bf1449fd3213',
    is_group: false,
    title: 'alex_dev',
    recipient: 'alex_dev',
    participants: ['alex_dev', 'sarah_creator'],
    member_count: 2,
    last_message: 'Yes! The custom video player with tap-to-mute works seamlessly without browser chrome.',
  },
  {
    id: 'dm-code_ninja',
    is_group: false,
    title: 'code_ninja',
    recipient: 'code_ninja',
    participants: ['code_ninja', 'sarah_creator'],
    member_count: 2,
    last_message: 'Reviewing the latest neural network weights.',
  },
];

const DEFAULT_USERS = [
  { id: 4, username: 'alex_dev', role: 'Developer', status: 'online' },
  { id: 6, username: 'code_ninja', role: 'Research', status: 'offline' },
  { id: 5, username: 'sarah_creator', role: 'Member', status: 'online' },
];

export default function App() {
  const [currentRoute, setCurrentRoute] = useState('feed');
  const [joinedCommunities, setJoinedCommunities] = useState(DEFAULT_COMMUNITIES);
  const [activeCommunity, setActiveCommunity] = useState(DEFAULT_COMMUNITIES[0]);
  const [activeChannel, setActiveChannel] = useState(DEFAULT_COMMUNITIES[0].channels[1]); // #general
  const [conversations, setConversations] = useState(DEFAULT_CONVERSATIONS);
  const [allUsers, setAllUsers] = useState(DEFAULT_USERS);
  const [activePost, setActivePost] = useState(null);
  const [activeProfileUsername, setActiveProfileUsername] = useState('sarah_creator');
  const [user, setUser] = useState({ username: 'sarah_creator', is_authenticated: true });
  const [feedPosts, setFeedPosts] = useState([]);

  // App-wide Display, Graphics & System Settings
  const [appSettings, setAppSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('sanctuary_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      enable3dBg: true,
      enableSmoothCursor: true,
      crtScanlines: false,
      autoplayVideo: true,
      highContrast: false,
    };
  });

  const handleUpdateSettings = (newSettings) => {
    setAppSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('sanctuary_settings', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Create Space Modal State
  const [isCreateSpaceOpen, setIsCreateSpaceOpen] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceDescription, setNewSpaceDescription] = useState('');
  const [newSpaceRules, setNewSpaceRules] = useState('');
  const [newSpacePrivacy, setNewSpacePrivacy] = useState('PUBLIC');
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [createSpaceError, setCreateSpaceError] = useState(null);

  const loadFeedPosts = async () => {
    try {
      const res = await fetch('/?format=json', {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.posts) {
          setFeedPosts(data.posts);
        }
      }
    } catch {
      // Retain existing posts
    }
  };

  // Fetch live communities, conversations, users, and me from backend
  useEffect(() => {
    let isCancelled = false;

    async function loadBackendData() {
      // 1. Current authenticated user
      try {
        const meRes = await fetch('/accounts/me/', {
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          if (!isCancelled && meData.user) {
            setUser(meData.user);
            if (meData.user.username) {
              setActiveProfileUsername(meData.user.username);
            }
          }
        }
      } catch {
        // Fallback already in state
      }

      // 2. Feed Posts
      try {
        const res = await fetch('/?format=json', {
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
        });
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.posts) {
            setFeedPosts(data.posts);
          }
        }
      } catch {
        // Fallback
      }

      // 3. Communities
      try {
        const commRes = await fetch('/communities/explore/', {
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
        });
        if (commRes.ok) {
          const commData = await commRes.json();
          if (!isCancelled && commData.communities?.length) {
            setJoinedCommunities(commData.communities);
            const matched = commData.communities.find((c) => c.slug === activeCommunity?.slug) || commData.communities[0];
            setActiveCommunity(matched);
          }
        }
      } catch {
        // Fallback already in state
      }

      // 4. Conversations
      try {
        const inboxRes = await fetch('/chat/inbox/', {
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
        });
        if (inboxRes.ok) {
          const inboxData = await inboxRes.json();
          if (!isCancelled && inboxData.conversations?.length) {
            setConversations(inboxData.conversations);
          }
        }
      } catch {
        // Fallback already in state
      }

      // 5. Users
      try {
        const usersRes = await fetch('/chat/api/users/', {
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
        });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          if (!isCancelled && usersData.users?.length) {
            setAllUsers(usersData.users);
          }
        }
      } catch {
        // Fallback already in state
      }
    }

    loadBackendData();
    return () => {
      isCancelled = true;
    };
  }, []);

  const handleFeedLike = async (postId) => {
    setFeedPosts((prev) =>
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
    try {
      const res = await fetch(`/post/${postId}/like/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data && typeof data.total_likes === 'number') {
          setFeedPosts((prev) =>
            prev.map((p) =>
              p.id === postId
                ? { ...p, total_likes: data.total_likes, is_liked: Boolean(data.is_liked) }
                : p
            )
          );
        }
      }
    } catch {}
  };

  const handleFeedComment = async (postId, text) => {
    const optimisticComment = {
      id: Date.now(),
      author: { username: user?.username || 'you' },
      text,
      created_at: new Date().toISOString(),
    };
    setFeedPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, comments: [...(p.comments || []), optimisticComment], total_comments: (p.total_comments || 0) + 1 }
          : p
      )
    );
    try {
      const res = await fetch(`/post/${postId}/comment/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: new URLSearchParams({ text }).toString(),
        credentials: 'same-origin',
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.comment) {
          setFeedPosts((prev) =>
            prev.map((p) =>
              p.id === postId
                ? {
                    ...p,
                    comments: p.comments.map((c) =>
                      c.id === optimisticComment.id ? data.comment : c
                    ),
                  }
                : p
            )
          );
        }
      }
    } catch {}
  };

  const handleFeedTakedown = async (postId) => {
    setFeedPosts((prev) => prev.filter((p) => p.id !== postId));
    try {
      await fetch(`/post/${postId}/takedown/`, {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'same-origin',
      });
    } catch {}
  };

  const handlePostCreated = (newPost) => {
    setFeedPosts((prev) => [newPost, ...prev]);
    loadFeedPosts();
    if (newPost.community) {
      setActiveCommunity(newPost.community);
      setCurrentRoute('community');
    } else {
      setCurrentRoute('feed');
    }
  };

  const handleCreateSpaceSubmit = async (e) => {
    e.preventDefault();
    if (!newSpaceName.trim()) {
      setCreateSpaceError('Space name is required.');
      return;
    }
    setIsCreatingSpace(true);
    setCreateSpaceError(null);
    try {
      const response = await fetch('/communities/create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
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
          setJoinedCommunities((prev) => [created, ...prev]);
          setActiveCommunity(created);
          if (created.channels?.length) {
            setActiveChannel(created.channels[0]);
          }
          setIsCreateSpaceOpen(false);
          setNewSpaceName('');
          setNewSpaceDescription('');
          setNewSpaceRules('');
          setCurrentRoute('community');
        }
      } else {
        const err = await response.json().catch(() => null);
        setCreateSpaceError(err?.error || 'Failed to create space.');
      }
    } catch {
      setCreateSpaceError('Network error connecting to backend.');
    } finally {
      setIsCreatingSpace(false);
    }
  };

  // Compute channels for active community
  const currentChannels = activeCommunity?.channels?.length
    ? activeCommunity.channels
    : [
        { id: 'announcements', name: 'announcements', is_announcement: true },
        { id: 'general', name: 'general', is_announcement: false },
      ];

  const handleNavigate = async (route, payload) => {
    if (route === 'logout') {
      try {
        await fetch('/accounts/logout/', {
          method: 'POST',
          headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          credentials: 'same-origin',
        });
      } catch {}
      setUser({ username: 'guest', is_authenticated: false });
      setCurrentRoute('login');
      return;
    }
    if (route === 'create_community') {
      setIsCreateSpaceOpen(true);
      return;
    }
    if (route === 'edit_profile') {
      setCurrentRoute('profile');
      return;
    }
    if (route === 'settings') {
      setCurrentRoute('settings');
      return;
    }

    setCurrentRoute(route);

    if (route === 'chat') {
      if (payload) {
        if (payload.is_group) {
          setActiveChannel({
            id: payload.id,
            conversation_id: payload.id,
            name: payload.title,
            title: payload.title,
            is_group: true,
            member_count: payload.member_count || payload.participants?.length || 3,
          });
        } else {
          const targetName = payload.recipient || payload.name || payload.username || 'alex_dev';
          const convId = payload.conversation_id || (payload.id && !payload.id.startsWith?.('dm-') ? payload.id : null);
          setActiveChannel({
            id: payload.id || `dm-${targetName}`,
            conversation_id: convId,
            name: targetName,
            is_dm: true,
            topic: `Direct encrypted channel with @${targetName}`,
          });
        }
      } else if (!activeChannel?.is_dm && !activeChannel?.is_group) {
        // Default to first conversation
        const first = conversations[0] || DEFAULT_CONVERSATIONS[0];
        if (first.is_group) {
          setActiveChannel({
            id: first.id,
            conversation_id: first.id,
            name: first.title,
            title: first.title,
            is_group: true,
            member_count: first.member_count || 3,
          });
        } else {
          setActiveChannel({
            id: first.id,
            conversation_id: first.id,
            name: first.recipient || first.title,
            is_dm: true,
            topic: `Direct encrypted channel with @${first.recipient || first.title}`,
          });
        }
      }
    } else if (route === 'community') {
      let comm = payload || joinedCommunities[0];
      if (typeof comm === 'string') {
        comm = joinedCommunities.find((c) => c.slug === comm || c.id === comm) || { slug: comm, name: comm };
      } else if (comm && joinedCommunities.length) {
        const matched = joinedCommunities.find((c) => c.slug === comm.slug || c.id === comm.id);
        if (matched) {
          comm = { ...matched, ...comm };
        }
      }
      setActiveCommunity(comm);
      const firstCh = comm?.channels?.[0] || { id: 'general', name: 'general' };
      setActiveChannel(firstCh);
    } else if (route === 'channel') {
      setActiveChannel(payload);
    } else if (route === 'post_detail') {
      setActivePost(payload);
    } else if (route === 'profile') {
      setActiveProfileUsername(payload?.username || user.username);
    }
  };

  const handleStartDm = async (username) => {
    // Check if conversation already exists
    const existing = conversations.find(
      (c) => !c.is_group && (c.recipient === username || c.title === username)
    );
    if (existing) {
      handleNavigate('chat', existing);
      return;
    }

    try {
      const res = await fetch(`/chat/dm/${username}/`, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
      if (res.ok) {
        const data = await res.json();
        const newConv = {
          id: data.conversation_id || `dm-${username}`,
          is_group: false,
          title: username,
          recipient: username,
          participants: [username, user.username],
          member_count: 2,
          last_message: '',
        };
        setConversations((prev) => [newConv, ...prev]);
        handleNavigate('chat', newConv);
        return;
      }
    } catch {
      // Local optimistic fallback
    }

    const fallbackConv = {
      id: `dm-${username}`,
      is_group: false,
      title: username,
      recipient: username,
      participants: [username, user.username],
      member_count: 2,
      last_message: '',
    };
    setConversations((prev) => [fallbackConv, ...prev]);
    handleNavigate('chat', fallbackConv);
  };

  const handleCreateGroup = async ({ title, members }) => {
    try {
      const res = await fetch('/chat/new-group/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ title, members }),
      });
      if (res.ok) {
        const data = await res.json();
        const newGroup = {
          id: data.conversation?.id || `group-${Date.now()}`,
          is_group: true,
          title,
          recipient: null,
          participants: [user.username, ...members],
          member_count: members.length + 1,
          last_message: 'Group created.',
        };
        setConversations((prev) => [newGroup, ...prev]);
        handleNavigate('chat', newGroup);
        return;
      }
    } catch {
      // Fallback
    }

    const fallbackGroup = {
      id: `group-${Date.now()}`,
      is_group: true,
      title,
      recipient: null,
      participants: [user.username, ...members],
      member_count: members.length + 1,
      last_message: 'Group created.',
    };
    setConversations((prev) => [fallbackGroup, ...prev]);
    handleNavigate('chat', fallbackGroup);
  };

  const handleCreateChannel = async ({ name, topic, is_announcement }) => {
    if (!activeCommunity) return;
    try {
      const res = await fetch(`/chat/c/${activeCommunity.slug}/new-channel/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ name, topic, is_announcement }),
      });
      if (res.ok) {
        const data = await res.json();
        const newCh = data.channel || {
          id: name.toLowerCase().replace(/\s+/g, '-'),
          name,
          topic,
          is_announcement,
        };
        const updatedChannels = [...(activeCommunity.channels || []), newCh];
        const updatedComm = { ...activeCommunity, channels: updatedChannels };
        setActiveCommunity(updatedComm);
        setJoinedCommunities((prev) =>
          prev.map((c) => (c.slug === activeCommunity.slug ? updatedComm : c))
        );
        handleNavigate('channel', newCh);
        return;
      }
    } catch {
      // Fallback
    }

    const fallbackCh = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      topic,
      is_announcement,
    };
    const updatedChannels = [...(activeCommunity.channels || []), fallbackCh];
    const updatedComm = { ...activeCommunity, channels: updatedChannels };
    setActiveCommunity(updatedComm);
    setJoinedCommunities((prev) =>
      prev.map((c) => (c.slug === activeCommunity.slug ? updatedComm : c))
    );
    handleNavigate('channel', fallbackCh);
  };

  const handleOpenCreatePost = (opts) => {
    if (opts?.community) {
      setActiveCommunity(opts.community);
    }
    setCurrentRoute('create_post');
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#000000',
      }}
    >
      {appSettings.enable3dBg && <Creative3DBackground currentRoute={currentRoute} />}
      {appSettings.enableSmoothCursor && <SmoothCursor />}
      {appSettings.crtScanlines && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 9998,
            background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.35) 50%)',
            backgroundSize: '100% 4px',
            opacity: 0.35,
          }}
        />
      )}

      {currentRoute === 'login' || currentRoute === 'register' ? (
        <Auth
          initialMode={currentRoute === 'register' ? 'register' : 'login'}
          onAuthSuccess={(userData) => {
            setUser(userData);
            setCurrentRoute('feed');
          }}
        />
      ) : (
        <AppShell
          currentRoute={currentRoute}
          activeCommunity={activeCommunity}
          activeChannel={activeChannel}
          joinedCommunities={joinedCommunities}
          channels={currentChannels}
          conversations={conversations}
          allUsers={allUsers}
          user={user}
          onNavigate={handleNavigate}
          onCreatePostClick={handleOpenCreatePost}
          onStartDm={handleStartDm}
          onCreateGroup={handleCreateGroup}
          onCreateChannel={handleCreateChannel}
        >
          <ErrorBoundary onNavigateHome={() => setCurrentRoute('feed')} onReset={() => setCurrentRoute('feed')}>
            {currentRoute === 'post_detail' ? (
              <PostDetail
                postId={activePost?.id}
                initialPost={activePost?.post || null}
                currentUser={user}
                onNavigate={handleNavigate}
                onBack={() => setCurrentRoute('feed')}
                onPostDeleted={(deletedId) => {
                  handleFeedTakedown(deletedId);
                  setCurrentRoute('feed');
                }}
              />
            ) : currentRoute === 'explore' || currentRoute === 'discover' ? (
              <DiscoverSpaces
                onNavigate={handleNavigate}
                onCreateSpaceClick={() => setIsCreateSpaceOpen(true)}
              />
            ) : currentRoute === 'community' ? (
              <CommunityDetail
                key={activeCommunity?.slug || activeCommunity?.id || 'community-view'}
                communitySlug={activeCommunity?.slug}
                initialCommunity={activeCommunity}
                currentUser={user}
                onNavigate={handleNavigate}
                onCreatePostClick={handleOpenCreatePost}
              />
            ) : currentRoute === 'create_post' ? (
              <CreatePost
                initialCommunity={activeCommunity}
                availableCommunities={joinedCommunities}
                currentUser={user}
                onNavigate={handleNavigate}
                onBack={() => setCurrentRoute(activeCommunity ? 'community' : 'feed')}
                onPostCreated={handlePostCreated}
              />
            ) : currentRoute === 'channel' ? (
              <ChannelChat
                community={activeCommunity || joinedCommunities[0]}
                channel={activeChannel}
                currentUser={user}
                onNavigate={handleNavigate}
                onBack={() => setCurrentRoute(activeCommunity ? 'community' : 'feed')}
              />
            ) : currentRoute === 'chat' ? (
              <ChannelChat
                community={{
                  name: activeChannel?.is_group
                    ? activeChannel.title
                    : (activeChannel?.name ? `@${activeChannel.name}` : 'Direct Messages'),
                  slug: 'direct-messages',
                }}
                channel={activeChannel}
                currentUser={user}
                onNavigate={handleNavigate}
                onBack={() => setCurrentRoute('feed')}
              />
            ) : currentRoute === 'profile' ? (
              <Profile
                username={activeProfileUsername}
                currentUser={user}
                onNavigate={handleNavigate}
                onBack={() => setCurrentRoute('feed')}
              />
            ) : currentRoute === 'settings' ? (
              <AppSettings
                user={user}
                onNavigate={handleNavigate}
                appSettings={appSettings}
                onUpdateSettings={handleUpdateSettings}
              />
            ) : (
              <Feed
                posts={feedPosts}
                currentUser={user}
                onLikeToggle={handleFeedLike}
                onAddComment={handleFeedComment}
                onTakedown={handleFeedTakedown}
                onShare={(postId) => {
                  const url = `${window.location.origin}/post/${postId}/`;
                  navigator.clipboard?.writeText(url);
                  alert('Post link copied to clipboard!');
                }}
                onNavigate={handleNavigate}
                onCreatePostClick={handleOpenCreatePost}
              />
            )}
          </ErrorBoundary>
        </AppShell>
      )}

      {/* GLOBAL CREATE SPACE MODAL */}
      {isCreateSpaceOpen && (
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
          onClick={() => setIsCreateSpaceOpen(false)}
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
                onClick={() => setIsCreateSpaceOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {createSpaceError && (
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
                {createSpaceError}
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
                      name="space_privacy"
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
                      name="space_privacy"
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
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreateSpaceOpen(false)}>
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
