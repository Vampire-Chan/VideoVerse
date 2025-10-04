
import React, { useState, useEffect, useRef } from 'react';
import { Navbar, Container, Form, Button, Dropdown } from 'react-bootstrap';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import styles from './Header.module.css';
import { getAvatarPlaceholder } from '../utils/placeholderGenerator';
import NotificationDropdown from './NotificationDropdown'; // Import NotificationDropdown

interface VideoSuggestion {
  id: string;
  title: string;
}

interface HeaderProps {
  toggleSidebar: () => void;
  sidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, sidebarOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { currentUser, logout, showLogin, showRegister } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<VideoSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [mobileSearchActive, setMobileSearchActive] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [showNotifications, setShowNotifications] = useState(false); // State for notification dropdown

  useEffect(() => {
    if (mobileSearchActive && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [mobileSearchActive]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => {
        fetchSuggestions(searchQuery);
      }, 300);
    } else {
      setSuggestions([]);
    }
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const fetchSuggestions = async (query: string) => {
    setLoadingSuggestions(true);
    try {
      const response = await api.get<VideoSuggestion[]>(`/videos/suggestions?q=${query}`);
      setSuggestions(response.data);
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${searchQuery}`);
      setMobileSearchActive(false);
      setSuggestions([]);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const BackArrow = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"></line>
      <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
  );

  return (
    <Navbar bg={theme === 'dark' ? 'dark' : 'light'} variant={theme === 'dark' ? 'dark' : 'light'} className={`shadow-sm sticky-top ${styles.headerNavbar}`}>
      <Container fluid className={`d-flex align-items-center ${mobileSearchActive ? styles.searchActive : ''}`}>

        <div className={`${styles.leftSection} ${mobileSearchActive ? styles.searchActive : ''}`}>
          {mobileSearchActive ? (
            <Button variant="link" className={`p-0 me-2 ${styles.backArrow}`} onClick={() => setMobileSearchActive(false)}>
              <BackArrow />
            </Button>
          ) : (
            <>
              <Button variant="outline-secondary" onClick={toggleSidebar} className={`me-2 ${styles.hamburgerIcon}`}>
                <div className={styles.hamburgerLine}></div>
                <div className={styles.hamburgerLine}></div>
                <div className={styles.hamburgerLine}></div>
              </Button>
              <i className={`bi bi-play-btn me-2 ${styles.appIcon}`}></i>
              <Navbar.Brand as={Link} to="/" className={styles.appBrand}>VideoVerse</Navbar.Brand>
            </>
          )}
        </div>

        <div className={`${styles.middleSection} ${mobileSearchActive ? styles.searchActive : ''}`}>
          <Form className={`d-flex w-100 position-relative ${styles.searchForm}`} onSubmit={handleSearch}>
            <Form.Control
              ref={searchInputRef}
              type="search"
              placeholder="Search"
              className={styles.searchInput}
              aria-label="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button variant="outline-secondary" type="submit" className={styles.searchButton}>
              <i className="bi bi-search"></i>
            </Button>
            {searchQuery.length > 2 && suggestions.length > 0 && (
              <Dropdown.Menu show className="position-absolute w-100" style={{ top: '100%', left: 0, zIndex: 1000 }}>
                {suggestions.map((suggestion) => (
                  <Dropdown.Item key={suggestion.id} onClick={() => {
                    navigate(`/watch/${suggestion.id}`);
                    setMobileSearchActive(false);
                    setSuggestions([]);
                  }}>
                    {suggestion.title}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            )}
          </Form>
        </div>

        <div className={`${styles.rightSection} ${mobileSearchActive ? styles.searchActive : ''}`}>
          <Button variant="link" className={`p-0 me-2 d-md-none ${styles.searchIconMobile}`} onClick={() => setMobileSearchActive(true)}>
            <i className="bi bi-search"></i>
          </Button>
          
          <Button variant="link" className={`p-0 me-3 ${styles.headerIcon}`} onClick={() => navigate('/studio')} title="Upload Video">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20m-9-9h18"/></svg>
          </Button>
          <Button variant="link" className={`p-0 me-3 ${styles.headerIcon}`} onClick={() => setShowNotifications(!showNotifications)} title="Notifications">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          </Button>

          <Dropdown align="end" id="user-dropdown">
            <Dropdown.Toggle variant="link" className="p-0 bg-transparent border-0 d-flex align-items-center">
              {currentUser ? (
                <img
                  src={currentUser.avatar_url || getAvatarPlaceholder(currentUser.username)}
                  alt="User Avatar"
                  className="rounded-circle me-1"
                  style={{ width: '30px', height: '30px', cursor: 'pointer' }}
                />
              ) : (
                <i className="bi bi-person-circle me-1" style={{ fontSize: '1.8rem', color: 'var(--bs-body-color)', cursor: 'pointer' }}></i>
              )}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {currentUser ? (
                <>
                  <Dropdown.ItemText className="text-wrap text-muted">Signed in as</Dropdown.ItemText>
                  <Dropdown.ItemText className="text-wrap"><strong>{currentUser.username}</strong></Dropdown.ItemText>
                  <Dropdown.Divider />
                  <Dropdown.Item as={Link} to={`/profile/${currentUser.username}`}><i className="bi bi-person-circle me-2"></i>Your Profile</Dropdown.Item>
                  {currentUser.is_creator && (
                    <Dropdown.Item as={Link} to="/studio"><i className="bi bi-camera-reels me-2"></i>Studio</Dropdown.Item>
                  )}
                  <Dropdown.Item as={Link} to="/studio"><i className="bi bi-cloud-upload me-2"></i>Upload Video</Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item as={Link} to="/settings"><i className="bi bi-gear me-2"></i>Settings</Dropdown.Item>
                  <Dropdown.Item onClick={handleLogout}><i className="bi bi-box-arrow-right me-2"></i>Logout</Dropdown.Item>
                </>
              ) : (
                <>
                  <Dropdown.ItemText className="text-wrap text-muted">Not logged in</Dropdown.ItemText>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={() => showLogin()}><i className="bi bi-box-arrow-in-right me-2"></i>Login</Dropdown.Item>
                  <Dropdown.Item onClick={() => showRegister()}><i className="bi bi-person-plus me-2"></i>Register</Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item as={Link} to="/settings"><i className="bi bi-gear me-2"></i>Settings</Dropdown.Item>
                </>
              )}
            </Dropdown.Menu>
          </Dropdown>
          {showNotifications && <NotificationDropdown show={showNotifications} onHide={() => setShowNotifications(false)} />}
        </div>
      </Container>
    </Navbar>
  );
};

export default Header;
