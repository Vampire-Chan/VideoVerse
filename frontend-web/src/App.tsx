import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, useParams } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UploadPage from './pages/UploadPage';
import WatchPage from './pages/WatchPage';
import VideoNotFoundPage from './pages/VideoNotFoundPage'; // Import VideoNotFoundPage
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage'; // Import EditProfilePage
import TermsPage from './pages/TermsPage';
import CommunityGuidelinesPage from './pages/CommunityGuidelinesPage';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SearchModalProvider } from './context/SearchModalContext'; // Import SearchModalProvider
import StudioPage from './pages/StudioPage'; // Add missing import
import AdminPanel from './pages/AdminPanel'; // Import AdminPanel
import LoadingBar from './components/LoadingBar'; // Import LoadingBar
import NotFoundPage from './pages/NotFoundPage'; // Import NotFoundPage
import NotificationContainer from './components/NotificationContainer'; // Import NotificationContainer
import LiveNotifications from './components/LiveNotifications'; // Import LiveNotifications
import SettingsPage from './pages/SettingsPage'; // Import SettingsPage

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SearchModalProvider> {/* Wrap with SearchModalProvider */}
          <Router>
            <AppContent />
          </Router>
        </SearchModalProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const { username } = useParams<{ username: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  // Show loading bar when route changes
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500); // Hide after 500ms

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      <LoadingBar isLoading={isLoading} />
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/upload" element={<ProtectedRoute creatorOnly><UploadPage /></ProtectedRoute>} />
          <Route path="/studio" element={<ProtectedRoute><StudioPage /></ProtectedRoute>} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/watch/:id" element={<WatchPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/profile/:username/edit" element={<ProtectedRoute key={username}><EditProfilePage /></ProtectedRoute>} />
          <Route path="/video-not-found" element={<VideoNotFoundPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/community-guidelines" element={<CommunityGuidelinesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
          <Route path="*" element={<NotFoundPage />} /> {/* This is the new 404 route */}
        </Routes>
      </Layout>
      <NotificationContainer /> {/* Add NotificationContainer here */}
      <LiveNotifications />
    </>
  );
}

export default App;