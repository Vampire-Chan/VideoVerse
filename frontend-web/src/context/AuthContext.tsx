import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react'; // Added useCallback
import { JwtPayload } from '../services/authService';
import api from '../services/api'; // Import api

type ModalType = 'login' | 'register' | null;

export interface UserInfo { // Define a more detailed UserInfo interface
  id: number; // Changed from string to number
  username: string;
  email: string;
  avatar_url?: string;
  banner_url?: string;
  description?: string;
  links?: any;
  is_creator?: boolean;
  is_admin?: boolean; // Added is_admin
  display_name?: string;
  gender?: string;
  dob?: string;
}

interface AuthContextType {
  currentUser: UserInfo | null; // Changed to UserInfo
  login: (token?: string) => void; // Token is now optional
  logout: () => void;
  modalType: ModalType;
  redirectPath: string | null;
  showLogin: (path?: string) => void;
  showRegister: (path?: string) => void;
  hideModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  const checkAuthStatus = useCallback(async () => { // New function to check auth status
    try {
      const response = await api.get('/auth/status');
      console.log('Auth Status Response:', response.data); // Added console.log
      if (response.data.isAuthenticated) {
        setCurrentUser(response.data.user);
      } else {
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    // For traditional JWT login, still check localStorage
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload: JwtPayload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser(payload.user); // Extract the user object from payload
      } catch (error) {
        console.error('Error decoding token from localStorage:', error);
        localStorage.removeItem('token');
        setCurrentUser(null);
      }
    }

    // Always check session status with the backend
    checkAuthStatus();
  }, [checkAuthStatus]); // Added checkAuthStatus to dependency array

  const login = (token?: string) => { // Token is now optional
    if (token) { // If a token is provided (traditional login)
      localStorage.setItem('token', token);
      try {
        const payload: JwtPayload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser(payload.user); // Extract the user object from payload
        
        // For JWT login, we already have the user info, so no need to re-check
        return;
      } catch (error) {
        console.error('Error decoding token during login:', error);
        localStorage.removeItem('token');
        setCurrentUser(null);
      }
    }
    // For session-based login (like GitHub) or when token is not provided, re-check auth status
    checkAuthStatus();
  };

  const logout = async () => { // Made async to hit backend logout
    localStorage.removeItem('token'); // Clear JWT token if it exists
    try {
      await api.post('/auth/logout'); // Hit backend logout endpoint
    } catch (error) {
      console.error('Error logging out on backend:', error);
    } finally {
      setCurrentUser(null);
    }
  };

  const showLogin = (path?: string) => {
    setModalType('login');
    setRedirectPath(path || null);
  };
  const showRegister = (path?: string) => {
    setModalType('register');
    setRedirectPath(path || null);
  };
  const hideModal = () => {
    setModalType(null);
    setRedirectPath(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, modalType, redirectPath, showLogin, showRegister, hideModal }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
