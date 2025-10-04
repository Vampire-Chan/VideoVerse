import 'dotenv/config'; // Ensure dotenv is loaded first
import express from 'express';
import cors from 'cors'; // Import cors
import http from 'http'; // Import http module
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import session from 'express-session';
import pool from './db/index';

import authRouter from './api/auth'; // Import the auth router
import videosRouter from './api/videos'; // Import the videos router
import usersRouter from './api/users'; // Import the new users router
import studioRouter from './api/studio'; // Import the new studio router
import notificationsRouter from './api/notifications'; // Import the notifications router

import streamingRouter from './api/streaming';
import adminRouter from './api/admin';
import { initSocket, getIo } from './socket'; // Import socket.io initialization

const app = express();
const server = http.createServer(app); // Create HTTP server
const io = initSocket(server); // Initialize Socket.IO

const port = process.env.PORT || 3000;
const host = '0.0.0.0'; // Bind to all network interfaces

// CORS Configuration for production and development
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.FRONTEND_URL].filter(Boolean) 
  : ['http://localhost:3001', 'http://127.0.0.1:3001'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (process.env.NODE_ENV === 'production') {
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // Allow all in development
      callback(null, true);
    }
  },
  credentials: true, // Allow cookies to be sent
}));

// Configure session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production' ? true : false, // HTTPS only in production
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-site cookies in production
    domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined,
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Passport serialization and deserialization
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await pool.query('SELECT id, username, email, avatar_url, banner_url, description, links, is_creator, is_admin, display_name, gender, dob FROM users WHERE id = $1', [id]);
    done(null, user.rows[0]);
  } catch (err) {
    done(err, null);
  }
});

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    callbackURL: process.env.GITHUB_CALLBACK_URL || "http://localhost:3000/api/auth/github/callback",
    scope: ['user:email'] // Request email scope
  },
  async (accessToken: string, refreshToken: string, profile: any, done: Function) => {
    console.log('--- GitHub Strategy Callback ---');
    console.log('Profile:', profile);
    try {
      // Check if user already exists with github_id
      let user = await pool.query('SELECT * FROM users WHERE github_id = $1', [profile.id]);
      console.log('User lookup by github_id result:', user.rows);

      if (user.rows.length > 0) {
        // User found, return existing user
        console.log('User found by github_id:', user.rows[0]);
        return done(null, user.rows[0]);
      } else {
        console.log('No user found by github_id. Checking by email...');
        // No user with github_id, check if user exists with email
        const primaryEmail = profile.emails ? profile.emails[0].value : null;
        console.log('Primary Email from GitHub:', primaryEmail);

        if (primaryEmail) {
          user = await pool.query('SELECT * FROM users WHERE email = $1', [primaryEmail]);
          console.log('User lookup by email result:', user.rows);

          if (user.rows.length > 0) {
            // User found by email, link github_id
            console.log('User found by email. Linking github_id...');
            const updatedUser = await pool.query(
              'UPDATE users SET github_id = $1 WHERE id = $2 RETURNING *'
              , [profile.id, user.rows[0].id]
            );
            console.log('User updated with github_id:', updatedUser.rows[0]);
            return done(null, updatedUser.rows[0]);
          }
        }

        // No existing user, create a new one
        console.log('No existing user found. Creating new user...');
        const newUser = await pool.query(
          'INSERT INTO users (username, email, github_id, display_name) VALUES ($1, $2, $3, $4) RETURNING *'
          , [profile.username, primaryEmail, profile.id, profile.displayName || profile.username]
        );
        console.log('New user created:', newUser.rows[0]);
        return done(null, newUser.rows[0]);
      }
    } catch (err) {
      console.error('Error in GitHub Strategy:', err);
      return done(err, null);
    }
  }
));

// Middleware to parse JSON bodies, which is required for our auth routes
app.use(express.json());

// Define a basic root route
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// GitHub OAuth routes
app.get('/api/auth/github',
  passport.authenticate('github'));

app.get('/api/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }), // Redirect to login on failure
  (req, res) => {
    // Successful authentication, redirect home or to a dashboard
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    res.redirect(`${frontendUrl}/`); // Redirect to your frontend homepage
  });

// Pass io to routers that need it
app.use('/api/auth', authRouter);
app.use('/api/videos', videosRouter(io)); // Pass io to videos router
app.use('/api/users', usersRouter);
app.use('/api/studio', studioRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/streaming', streamingRouter);
app.use('/api/admin', adminRouter);

// Start the server
server.listen(Number(port), host, () => {
  console.log(`Server is running on ${host}:${port}`);
  console.log(`Access locally at http://localhost:${port}`);
  console.log(`Access on network at http://<your-ip>:${port}`);
});