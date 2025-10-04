
import { Router } from 'express';
import pool from '../db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Router();

// Register a new user
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email, and password are required' });
  }

  try {
    // Check if user already exists
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Check if this will be one of the first 5 users
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    const count = parseInt(userCount.rows[0].count);
    const is_admin = count < 5; // First 5 users will be admins

    // Save the new user
    const newUser = await pool.query(
      'INSERT INTO users (username, email, password_hash, is_admin) VALUES ($1, $2, $3, $4) RETURNING id, username, email, is_creator, is_admin',
      [username, email, passwordHash, is_admin]
    );

    // Generate JWT for the new user to log them in automatically
    const newUserInfo = newUser.rows[0];
    const payload = { user: { id: newUserInfo.id, username: newUserInfo.username, avatar_url: newUserInfo.avatar_url || null, is_creator: newUserInfo.is_creator, is_admin: newUserInfo.is_admin } };
    const secret = process.env.JWT_SECRET || 'your_default_secret';
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });

    res.status(201).json({ token });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login a user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Find the user
    const userResult = await pool.query('SELECT id, username, email, password_hash, avatar_url, is_creator, is_admin FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const payload = { user: { id: user.id, username: user.username, email: user.email, avatar_url: user.avatar_url, is_creator: user.is_creator, is_admin: user.is_admin } };
    const secret = process.env.JWT_SECRET || 'your_default_secret'; // Use an environment variable for the secret!
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });

    res.json({ 
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        is_creator: user.is_creator,
        is_admin: user.is_admin
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Check authentication status
router.get('/status', async (req, res) => {
  // First, check if user is authenticated via session (GitHub login)
  if (req.isAuthenticated()) {
    // req.user is populated by Passport's deserializeUser
    const user = req.user as any; // Cast to any to access properties
    res.json({
      isAuthenticated: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        banner_url: user.banner_url,
        description: user.description,
        links: user.links, // Assuming links is already JSONB and handled
        is_creator: user.is_creator,
        is_admin: user.is_admin, // Added is_admin
        display_name: user.display_name,
        gender: user.gender,
        dob: user.dob,
        // Add other user properties you want to expose to the frontend
      }    
    });
  } else {
    // Check if user is authenticated via JWT token
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.json({ isAuthenticated: false, user: null });
    }

    const token = authHeader.split(' ')[1]; // Expects 'Bearer TOKEN'
    if (!token) {
      return res.json({ isAuthenticated: false, user: null });
    }

    try {
      const secret = process.env.JWT_SECRET || 'your_default_secret';
      const decoded = jwt.verify(token, secret) as { user: any };
      
      // Get full user data from the database
      const userResult = await pool.query(
        'SELECT id, username, email, avatar_url, banner_url, description, links, is_creator, is_admin, display_name, gender, dob FROM users WHERE id = $1', 
        [decoded.user.id]
      );
      
      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        res.json({
          isAuthenticated: true,
          user: user
        });
      } else {
        res.json({ isAuthenticated: false, user: null });
      }
    } catch (err) {
      res.json({ isAuthenticated: false, user: null });
    }
  }
});

// Logout a user
router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }
      res.clearCookie('connect.sid'); // Clear the session cookie
      res.status(200).json({ message: 'Logged out successfully' });
    });
  });
});

export default router;
