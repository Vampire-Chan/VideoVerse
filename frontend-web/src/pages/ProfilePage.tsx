
import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Button, Alert, Card, Tabs, Tab } from 'react-bootstrap';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';
import Spinner from '../components/Spinner';
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown
import remarkGfm from 'remark-gfm'; // Import remarkGfm


import HomeTab from '../components/ProfileTabs/HomeTab';
import VideosTab from '../components/ProfileTabs/VideosTab';
import MiniVideoTab from '../components/ProfileTabs/MiniVideoTab';
import PlaylistsTab from '../components/ProfileTabs/PlaylistsTab';

import './ProfilePage.css';

import { useTheme } from '../context/ThemeContext'; // Import useTheme
import { getAvatarPlaceholder, getBannerPlaceholder } from '../utils/placeholderGenerator';


interface User {
  id: number;
  username: string;
  is_creator: boolean; // Add is_creator property
  avatar_url?: string; // Optional avatar URL
  banner_url?: string; // Optional banner URL
}

interface Video {
  id: string;
  title: string;
  thumbnail_url: string;
  uploader: string;
  views: number;
  created_at: string;
  uploader_avatar_url?: string;
}

interface ProfileData {
  user: User;
  videos: Video[];
  watcherCount: number;
  description?: string;
  links?: { title: string; url: string }[];
  banner_url?: string;
}

const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true); // Add loading state
  const { theme } = useTheme(); // Get theme from context
  const navigate = useNavigate();
  const location = useLocation(); // Initialize useLocation
  const { currentUser, login } = useAuth();

  const handleActivateChannel = async () => {
    try {
      const response = await api.post('/users/activate-channel');
      login(); // Trigger re-check of auth status
      navigate(0); // Reload to update auth state
    } catch (err: any) {
      console.error('Error activating channel:', err);
      alert(err.response?.data?.message || 'Failed to activate channel.');
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true); // Set loading to true when fetching starts
      try {
        const response = await api.get<ProfileData>(`/users/${username}`);
        setProfile(response.data);
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError(err.response?.data?.message || 'Failed to load profile.');
      } finally {
        setLoading(false); // Set loading to false after fetch attempt
      }
    };

    if (username) {
      fetchProfile();
    }
  }, [username, location.state]);

  const handleWatch = async () => {
    if (!profile) return;
    try {
      await api.post(`/users/${profile.user.id}/watch`, {});
      // Optionally update watcher count locally
    } catch (err: any) {
      console.error('Error watching user:', err);
      alert(err.response?.data?.message || 'Failed to watch user.');
    }
  };

  const handleUnwatch = async () => {
    if (!profile) return;
    try {
      await api.delete(`/users/${profile.user.id}/unwatch`);
      // Optionally update watcher count locally
    } catch (err: any) {
      console.error('Error unwatching user:', err);
      alert(err.response?.data?.message || 'Failed to unwatch user.');
    }
  };

  if (error) {

    return <Container className="mt-4"><Alert variant="danger">{error}</Alert></Container>;
  }

  if (loading || !profile) {
    return <Container className="mt-4"><Spinner message="Loading profile..." /></Container>;
  }

  const isOwnProfile = currentUser?.id === profile.user.id;

  return (
    <Container className="mt-4">
      {/* Banner Placeholder */}
      <div style={{ height: '250px', background: `url(${profile.user.banner_url || getBannerPlaceholder(profile.user.username)})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '8px' }} className="mb-4 position-relative">
      </div>

      <Row className="align-items-center" style={{ marginTop: '-100px', paddingLeft: '30px', position: 'relative', zIndex: 2 }}>
        <Col xs="auto">
          <img
            src={profile.user.avatar_url || getAvatarPlaceholder(profile.user.username)}
            alt={`${profile.user.username}'s Avatar`}
            className="rounded-circle border border-5 border-white"
            style={{ width: '150px', height: '150px' }}
          />
        </Col>
        <Col>
          <h1 style={{ fontFamily: '"Roboto", sans-serif', fontSize: '2.5rem', fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)' }}>{profile.user.username}</h1>
          <p className="text-muted">{profile.watcherCount} Watchers</p>
        </Col>
        {isOwnProfile && !profile.user.is_creator && (
            <Col xs="auto" className="ms-auto">
                <Button variant="success" onClick={handleActivateChannel}>Activate Channel</Button>
            </Col>
        )}
        {isOwnProfile && (
            <Col xs="auto" className="ms-auto profile-edit-button-col">
                <Button className="edit-profile-btn" onClick={() => navigate(`/profile/${username}/edit`)}>Edit</Button>
            </Col>
        )}
        {!isOwnProfile && (
            <Col xs="auto">
                <div>
                    <Button variant="primary" onClick={handleWatch} className="me-2">Watch</Button>
                    <Button variant="outline-secondary" onClick={handleUnwatch}>Unwatch</Button>
                </div>
            </Col>
        )}
      </Row>

      <Tabs defaultActiveKey="home" id="profile-tabs" className="my-4 profile-tabs">
        <Tab eventKey="home" title="Home">
          <HomeTab profile={profile} />
        </Tab>
        <Tab eventKey="videos" title="Videos">
          <VideosTab videos={profile.videos} uploader={profile.user.username} />
        </Tab>
        <Tab eventKey="mini-video" title="Mini Video">
          <MiniVideoTab />
        </Tab>
        <Tab eventKey="playlists" title="Playlists">
          <PlaylistsTab />
        </Tab>
      </Tabs>

    </Container>
  );
};

export default ProfilePage;
