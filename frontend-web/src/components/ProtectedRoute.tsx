
import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactElement;
  creatorOnly?: boolean; // New prop to indicate if route requires creator status
  adminOnly?: boolean; // New prop to indicate if route requires admin status
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, creatorOnly, adminOnly }) => {
  const { currentUser, showLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const adminOnlyRef = useRef(adminOnly);
  const creatorOnlyRef = useRef(creatorOnly);
  
  // Update ref when props change
  useEffect(() => {
    adminOnlyRef.current = adminOnly;
    creatorOnlyRef.current = creatorOnly;
  }, [adminOnly, creatorOnly]);

  useEffect(() => {
    if (!currentUser) {
      showLogin(location.pathname);
    } else if (creatorOnlyRef.current && !currentUser.is_creator) {
      // If route requires creator status and user is not a creator
      navigate(`/profile/${currentUser.username || ''}`, { state: { message: 'You must be a creator to access this page.', variant: 'danger' } });
    } else if (adminOnlyRef.current && currentUser && !currentUser.is_admin) {
      // If route requires admin status and user is not an admin
      navigate(`/profile/${currentUser.username || ''}`, { state: { message: 'You must be an admin to access this page.', variant: 'danger' } });
    }
  }, [showLogin, location.pathname, currentUser, navigate]);

  if (!currentUser) {
    return null;
  }

  if (creatorOnlyRef.current && !currentUser.is_creator) {
    return null; // Or a loading spinner while redirecting
  }

  // Check admin access after ensuring currentUser exists
  if (adminOnlyRef.current && currentUser && !currentUser.is_admin) {
    return null; // Or a loading spinner while redirecting
  }

  return children;
};

export default ProtectedRoute;
