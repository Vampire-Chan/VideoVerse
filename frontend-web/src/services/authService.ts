
import api from './api';

export interface UserInToken {
  id: number;
  username: string;
  email: string; // Added email
  is_creator: boolean; // Add is_creator property
  is_admin: boolean; // Add is_admin property
  avatar_url?: string; // Optional avatar URL
  badges?: string[]; // Array of user badges
}

export interface JwtPayload {
  user: UserInToken;
  iat: number;
  exp: number;
}

export const register = (userData: any) => {
  return api.post('/auth/register', userData);
};

export const login = async (credentials: any) => {
  const response = await api.post('/auth/login', credentials);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
};


