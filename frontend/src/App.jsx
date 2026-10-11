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
import Creative3DBackground from './Creative3DBackground';
import SmoothCursor from './SmoothCursor';

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

  // Fetch live communities, conversations, and users from backend
  useEffect(() => {
    let isCancelled = false;

    async function loadBackendData() {
      try {
        const commRes = await fetch('/communities/explore/', {
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
        });
        if (commRes.ok) {
          const commData = await commRes.json();
          if (!isCancelled && commData.communities?.length) {
            setJoinedCommunities(commData.communities);
            // Keep active community in sync
            const matched = commData.communities.find((c) => c.slug === activeCommunity?.slug) || commData.communities[0];
            setActiveCommunity(matched);
          }
        }
      } catch {
        // Fallback already in state
      }

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

  // Compute channels for active community
  const currentChannels = activeCommunity?.channels?.length
    ? activeCommunity.channels
    : [
        { id: 'announcements', name: 'announcements', is_announcement: true },
        { id: 'general', name: 'general', is_announcement: false },
      ];

  const handleNavigate = (route, payload) => {
    if (route === 'logout') {
      window.location.assign('/accounts/logout/');
      return;
    }
    if (route === 'create_community') {
      setCurrentRoute('discover');
      return;
    }
    if (route === 'edit_profile') {
      setCurrentRoute('profile');
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
      const comm = payload || joinedCommunities[0];
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
      <Creative3DBackground currentRoute={currentRoute} />
      <SmoothCursor />

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
          {currentRoute === 'post_detail' ? (
            <PostDetail
              postId={activePost?.id}
              initialPost={activePost?.post || null}
              currentUser={user}
              onNavigate={handleNavigate}
              onBack={() => setCurrentRoute('feed')}
              onPostDeleted={() => setCurrentRoute('feed')}
            />
          ) : currentRoute === 'explore' || currentRoute === 'discover' ? (
            <DiscoverSpaces
              onNavigate={handleNavigate}
              onCreateSpaceClick={() => handleNavigate('create_community')}
            />
          ) : currentRoute === 'community' ? (
            <CommunityDetail
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
              onPostCreated={(_newPost) => setCurrentRoute('feed')}
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
          ) : (
            <Feed
              currentUser={user}
              onNavigate={handleNavigate}
              onCreatePostClick={handleOpenCreatePost}
            />
          )}
        </AppShell>
      )}
    </div>
  );
}
