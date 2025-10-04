
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

interface AuthRequest extends Request {
  user?: { id: number };
}

const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
  // First, check for Passport.js session authentication (for GitHub logins)
  if (req.isAuthenticated && req.isAuthenticated()) {
    // If authenticated via session, req.user is already populated by Passport
    // Ensure req.user has an 'id' property
    if (req.user && (req.user as any).id) {
      console.log('Auth Middleware: Authenticated via session. User ID:', (req.user as any).id);
      req.user = { id: (req.user as any).id }; // Normalize user object
      return next();
    }
  }

  // If not authenticated via session, check for JWT token (for traditional logins)
  const authHeader = req.header('Authorization');
  console.log('Auth Middleware: Checking for JWT. Auth Header:', authHeader);

  if (!authHeader) {
    console.log('Auth Middleware: No Authorization header.');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  const token = authHeader.split(' ')[1]; // Expects 'Bearer TOKEN'
  console.log('Auth Middleware: Extracted Token:', token);

  // Check if token exists and is in correct format
  if (!token) {
    console.log('Auth Middleware: Token is empty after split.');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const secret = process.env.JWT_SECRET || 'your_default_secret';
    console.log('Auth Middleware: JWT Secret:', secret);
    const decoded = jwt.verify(token, secret) as { user: { id: number } };
    console.log('Auth Middleware: JWT Decoded:', decoded);
    req.user = decoded.user;
    console.log('Auth Middleware: Authenticated via JWT. User ID:', req.user.id);
    next();
  } catch (err) {
    console.error('Auth Middleware: JWT Verification Error:', err);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export default auth;
