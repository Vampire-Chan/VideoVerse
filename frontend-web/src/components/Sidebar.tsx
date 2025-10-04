import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';

interface SidebarProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, toggleSidebar }) => {
  return (
    <>
      <Nav className={`flex-column app-sidebar ${sidebarOpen ? 'open' : 'closed'}`} style={{
        left: sidebarOpen ? '0' : '-200px', // Control position
        width: '200px', // Fixed width when open
        minWidth: '200px',
        paddingTop: '56px', // Adjust for Navbar height
      }}>
        <div className="sidebar-scroll-area">
          {/* Main Section */}
          <div className="sidebar-section-title mt-3 mb-2">{sidebarOpen && 'MAIN'}</div>
          <Nav.Item>
            <Nav.Link as={Link} to="/">
              <i className="bi bi-house-door me-2"></i> {sidebarOpen && 'Home'}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link as={Link} to="/studio">
              <i className="bi bi-camera-video me-2"></i> {sidebarOpen && 'Studio'}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link as={Link} to="/watching"> {/* Placeholder route */}
              <i className="bi bi-collection-play me-2"></i> {sidebarOpen && 'Watching'}
            </Nav.Link>
          </Nav.Item>

          <hr className="sidebar-divider" />

          {/* Library Section */}
          <div className="sidebar-section-title mt-3 mb-2">{sidebarOpen && 'LIBRARY'}</div>
          <Nav.Item>
            <Nav.Link as={Link} to="/history"> {/* Placeholder route */}
              <i className="bi bi-clock-history me-2"></i> {sidebarOpen && 'History'}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link as={Link} to="/playlist"> {/* Placeholder route */}
              <i className="bi bi-list-ul me-2"></i> {sidebarOpen && 'Playlist'}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link as={Link} to="/liked-videos"> {/* Placeholder route */}
              <i className="bi bi-hand-thumbs-up me-2"></i> {sidebarOpen && 'Liked Videos'}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link as={Link} to="/watch-later"> {/* Placeholder route */}
              <i className="bi bi-clock me-2"></i> {sidebarOpen && 'Watch Later'}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link as={Link} to="/downloads"> {/* Placeholder route */}
              <i className="bi bi-download me-2"></i> {sidebarOpen && 'Downloaded'}
            </Nav.Link>
          </Nav.Item>

          <hr className="sidebar-divider" />

          {/* Explore Section */}
          <div className="sidebar-section-title mt-3 mb-2">{sidebarOpen && 'EXPLORE'}</div>
          <Nav.Item>
            <Nav.Link as={Link} to="/trending"> {/* Placeholder route */}
              <i className="bi bi-fire me-2"></i> {sidebarOpen && 'Trending'}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link as={Link} to="/music"> {/* Placeholder route */}
              <i className="bi bi-music-note-beamed me-2"></i> {sidebarOpen && 'Music'}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link as={Link} to="/gaming"> {/* Placeholder route */}
              <i className="bi bi-controller me-2"></i> {sidebarOpen && 'Gaming'}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link as={Link} to="/movies"> {/* Placeholder route */}
              <i className="bi bi-film me-2"></i> {sidebarOpen && 'Movies'}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link as={Link} to="/podcasts"> {/* Placeholder route */}
              <i className="bi bi-mic me-2"></i> {sidebarOpen && 'Podcasts'}
            </Nav.Link>
          </Nav.Item>

          <hr className="sidebar-divider" />

          {/* Legal Footer */}
          <div className="sidebar-footer mt-auto p-3">
            <Nav.Link as={Link} to="/terms" className="small text-muted">{sidebarOpen && 'Terms and Conditions'}</Nav.Link>
            <Nav.Link as={Link} to="/community-guidelines" className="small text-muted">{sidebarOpen && 'Community Guidelines'}</Nav.Link>
          </div>
        </div>
      </Nav>
      {sidebarOpen && <div className="sidebar-backdrop" onClick={toggleSidebar}></div>} {/* Add backdrop */}
    </>
  );
};

export default Sidebar;