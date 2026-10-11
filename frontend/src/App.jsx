import React, { useState } from 'react';
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

export default function App() {
  const [currentRoute, setCurrentRoute] = useState('feed');
  const [activeCommunity, setActiveCommunity] = useState(null);
  const [activeChannel, setActiveChannel] = useState({ id: 'general', name: 'general' });
  const [activePost, setActivePost] = useState(null);
  const [activeProfileUsername, setActiveProfileUsername] = useState('sarah_creator');
  const [user, setUser] = useState({ username: 'sarah_creator', is_authenticated: true });

  const joinedCommunities = [
    { id: 1, name: 'Systems & Infrastructure', slug: 'systems-infrastructure', avatar: null },
    { id: 2, name: 'Creative Technology', slug: 'creative-technology', avatar: null },
    { id: 3, name: 'Applied AI Research', slug: 'applied-ai-research', avatar: null },
  ];

  const channels = [
    { id: 'announcements', name: 'announcements', is_announcement: true },
    { id: 'general', name: 'general', is_announcement: false },
    { id: 'code-review', name: 'code-review', is_announcement: false },
    { id: 'creative-audio', name: 'creative-audio', is_announcement: false },
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
      const dmChannel = payload?.is_dm
        ? payload
        : { id: 'dm-alex_dev', name: 'alex_dev', is_dm: true, topic: 'Direct encrypted channel with @alex_dev' };
      setActiveChannel(dmChannel);
    } else if (route === 'community') {
      setActiveCommunity(payload);
      setActiveChannel({ id: 'general', name: 'general' });
    } else if (route === 'channel') {
      setActiveChannel(payload);
    } else if (route === 'post_detail') {
      setActivePost(payload);
    } else if (route === 'profile') {
      setActiveProfileUsername(payload?.username || user.username);
    }
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
          channels={channels}
          user={user}
          onNavigate={handleNavigate}
          onCreatePostClick={handleOpenCreatePost}
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
              community={{ name: 'Direct Messages', slug: 'direct-messages' }}
              channel={activeChannel?.is_dm ? activeChannel : { id: 'dm-alex_dev', name: 'alex_dev', is_dm: true, topic: 'Direct encrypted channel with @alex_dev' }}
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
