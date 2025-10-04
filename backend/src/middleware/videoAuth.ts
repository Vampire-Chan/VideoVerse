import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db';

interface VideoAuthRequest extends Request {
  user?: { id: number };
  videoId?: string;
}

// Generate a time-limited token for video access
export const generateVideoToken = (userId: number, videoId: string): string => {
  return jwt.sign(
    { userId, videoId, type: 'video_access' },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '30m' } // Token expires in 30 minutes
  );
};

// Alternative middleware: Allow regular auth tokens for video access with additional checks
export const videoAuth = async (req: VideoAuthRequest, res: Response, next: NextFunction) => {
  // First try standard auth token
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token as string;
  
  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    // Verify the standard JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as {
      id: number;
      iat: number;
      exp: number;
    };

    // Check if video exists and is accessible by this user
    const videoId = req.params.id;
    const video = await pool.query(
      'SELECT id, user_id FROM videos WHERE id = $1',
      [videoId]
    );

    if (video.rows.length === 0) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Add user and video info to request for downstream handlers
    req.user = { id: decoded.id };
    req.videoId = videoId;

    next();
  } catch (err) {
    console.error('Video auth error:', err);
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware to verify video access token
export const verifyVideoToken = async (req: VideoAuthRequest, res: Response, next: NextFunction) => {
  // Extract token from query parameter or header
  const token = req.query.token as string || req.headers['x-video-token'] as string || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as {
      userId: number;
      videoId: string;
      type: string;
    };

    // Verify it's a video access token
    if (decoded.type !== 'video_access') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    // Check if video exists and is accessible by this user
    const video = await pool.query(
      'SELECT id, user_id FROM videos WHERE id = $1',
      [decoded.videoId]
    );

    if (video.rows.length === 0) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Add video and user info to request for downstream handlers
    req.user = { id: decoded.userId };
    req.videoId = decoded.videoId;

    next();
  } catch (err) {
    console.error('Video token verification error:', err);
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};