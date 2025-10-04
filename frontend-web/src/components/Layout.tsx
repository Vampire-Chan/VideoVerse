import React, { ReactNode, useState, useContext } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import Header from './Header'; // Import the new Header component
import Sidebar from './Sidebar';
import AuthModal from './AuthModal'; // Import the modal
import SearchModal from './SearchModal'; // Import the search modal
import { useTheme } from '../context/ThemeContext'; // Import useTheme
import { useLocation } from 'react-router-dom'; // Import useLocation

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme } = useTheme(); // Get the current theme
  const location = useLocation(); // Get the current location

  React.useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const hideAuthModal = location.pathname === '/login' || location.pathname === '/register';

  return (
    <>
      <style>
        {`
          :root {
            --card-bg-color: ${theme === 'light' ? '#f8f9fa' : '#212529'};
            --card-text-color: ${theme === 'light' ? '#212529' : '#f8f9fa'};
          }
        `}
      </style>
      <div className="d-flex flex-column min-vh-100">
        <Header toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} /> {/* Pass toggleSidebar and sidebarOpen to Header */}
        <div className="d-flex">
          <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
          <main className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
            {children}
          </main>
        </div>
        {!hideAuthModal && <AuthModal />} {/* Conditionally render AuthModal */}
        <SearchModal /> {/* Add search modal to the layout */}
      </div>
    </>
  );
};

export default Layout;