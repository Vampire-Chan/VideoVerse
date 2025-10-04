import { Router, Request, Response } from 'express';
import auth from '../middleware/auth';
import pool from '../db';
import cloudinary from '../config/cloudinary'; // Import Cloudinary
import multer from 'multer'; // Import Multer
import jwt from 'jsonwebtoken'; // Import jsonwebtoken

const router = Router();

interface AuthRequest extends Request {
  user?: { id: number };
}

// @route   GET /api/users/:username
// @desc    Get user profile data (videos, watcher count)
// @access  Public
router.get('/:username', async (req: Request, res: Response) => {
  const { username } = req.params;
  try {
    // Get user info
    const userRes = await pool.query('SELECT id, username, email, avatar_url, banner_url, description, links, is_creator FROM users WHERE username = $1', [username]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const user = userRes.rows[0];

    // Ensure links are parsed if they come as a string (e.g., from JSONB column)
    if (user.links && typeof user.links === 'string') {
      user.links = JSON.parse(user.links);
    }

    // Get user's videos
    const videosRes = await pool.query('SELECT * FROM videos WHERE user_id = $1 ORDER BY created_at DESC', [user.id]);
    const videos = videosRes.rows;

    // Get watcher count
    const watcherCountRes = await pool.query('SELECT COUNT(*) FROM watchers WHERE watched_id = $1', [user.id]);
    const watcherCount = parseInt(watcherCountRes.rows[0].count, 10);

    res.json({ user, videos, watcherCount });

  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id/is-watching
// @desc    Check if current user is watching another user
// @access  Private
router.get('/:id/is-watching', auth, async (req: AuthRequest, res: Response) => {
  const watcherId = req.user?.id;
  const watchedId = parseInt(req.params.id, 10);

  if (!watcherId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const result = await pool.query('SELECT 1 FROM watchers WHERE watcher_id = $1 AND watched_id = $2', [watcherId, watchedId]);
    res.json({ isWatching: result.rows.length > 0 });
  } catch (err) {
    console.error('Error checking watch status:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/:id/watch
// @desc    Watch a user
// @access  Private
router.post('/:id/watch', auth, async (req: AuthRequest, res: Response) => {
  const watcherId = req.user?.id;
  const watchedId = parseInt(req.params.id, 10);

  if (!watcherId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (watcherId === watchedId) {
    return res.status(400).json({ message: 'You cannot watch yourself' });
  }

  try {
    await pool.query('INSERT INTO watchers (watcher_id, watched_id) VALUES ($1, $2)', [watcherId, watchedId]);
    res.status(200).json({ message: 'User watched successfully' });
  } catch (err: any) {
    if (err.code === '23505') { // Unique violation
      return res.status(400).json({ message: 'You are already watching this user' });
    }
    console.error('Error watching user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/:id/unwatch
// @desc    Unwatch a user
// @access  Private
router.delete('/:id/unwatch', auth, async (req: AuthRequest, res: Response) => {
  const watcherId = req.user?.id;
  const watchedId = parseInt(req.params.id, 10);

  if (!watcherId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const result = await pool.query('DELETE FROM watchers WHERE watcher_id = $1 AND watched_id = $2', [watcherId, watchedId]);
    if (result.rowCount === 0) {
      return res.status(400).json({ message: 'You are not watching this user' });
    }
    res.status(200).json({ message: 'User unwatched successfully' });
  } catch (err) {
    console.error('Error unwatching user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Multer configuration for file uploads
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage: storage });

// @route   PUT /api/users/profile
// @desc    Update user profile (avatar, banner, description, links)
// @access  Private
router.put('/profile', auth, upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userRes = await pool.query('SELECT username FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const currentUsername = userRes.rows[0].username;

    const { username: newUsername, displayName, description, links, gender, dob } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    let avatarUrl: string | undefined;
    let bannerUrl: string | undefined;

    if (files && files['avatar'] && files['avatar'][0]) {
      const avatarFile = files['avatar'][0];
      const b64 = Buffer.from(avatarFile.buffer).toString('base64');
      const dataURI = 'data:' + avatarFile.mimetype + ';base64,' + b64;
      const uploadResponse = await cloudinary.uploader.upload(dataURI, {
        folder: `avatars/${currentUsername}`,
        public_id: `${currentUsername}_av`,
        overwrite: true,
        format: 'png',
      });
      avatarUrl = uploadResponse.secure_url;
    }

    if (files && files['banner'] && files['banner'][0]) {
      const bannerFile = files['banner'][0];
      const b64 = Buffer.from(bannerFile.buffer).toString('base64');
      const dataURI = 'data:' + bannerFile.mimetype + ';base64,' + b64;
      const uploadResponse = await cloudinary.uploader.upload(dataURI, {
        folder: `banners/${currentUsername}`,
        public_id: `${currentUsername}_bn`,
        overwrite: true,
        format: 'png',
      });
      bannerUrl = uploadResponse.secure_url;
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (newUsername && newUsername !== currentUsername) {
        const existingUser = await pool.query('SELECT id FROM users WHERE username = $1', [newUsername]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'Username is already taken' });
        }
        updateFields.push(`username = $${paramIndex++}`);
        updateValues.push(newUsername);
    }

    if (displayName !== undefined) {
        updateFields.push(`display_name = $${paramIndex++}`);
        updateValues.push(displayName);
    }

    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(description);
    }

    if (links !== undefined) {
      updateFields.push(`links = $${paramIndex++}`);
      updateValues.push(links);
    }

    if (gender !== undefined) {
        updateFields.push(`gender = $${paramIndex++}`);
        updateValues.push(gender);
    }

    if (dob !== undefined) {
        updateFields.push(`dob = $${paramIndex++}`);
        updateValues.push(dob);
    }

    if (avatarUrl) {
      updateFields.push(`avatar_url = $${paramIndex++}`);
      updateValues.push(avatarUrl);
    }

    if (bannerUrl) {
      updateFields.push(`banner_url = $${paramIndex++}`);
      updateValues.push(bannerUrl);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await pool.query(query, [...updateValues, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updatedUser = result.rows[0];

    const payload = { user: { id: updatedUser.id, username: updatedUser.username, avatar_url: updatedUser.avatar_url, banner_url: updatedUser.banner_url, description: updatedUser.description, links: updatedUser.links, is_creator: updatedUser.is_creator, displayName: updatedUser.display_name, gender: updatedUser.gender, dob: updatedUser.dob } };
    const secret = process.env.JWT_SECRET || 'your_default_secret';
    const newToken = jwt.sign(payload, secret, { expiresIn: '1h' });

    res.json({ token: newToken, user: updatedUser });

  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/activate-channel
// @desc    Activate user's channel (set is_creator to true)
// @access  Private
router.post('/activate-channel', auth, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET is_creator = TRUE WHERE id = $1 RETURNING id, username, email, avatar_url, banner_url, description, links, is_creator',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updatedUser = result.rows[0];

    // For session-based authentication, we don't need to generate a new JWT here.
    // The session is already active. The frontend will re-check auth status.
    res.json({ user: updatedUser }); // Return updated user data directly

  } catch (err) {
    console.error('Error activating channel:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;