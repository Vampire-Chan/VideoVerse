import { Router, Request, Response } from 'express';
import pool from '../db';
import auth from '../middleware/auth';

interface AuthRequest extends Request {
  user?: { id: number; is_admin: boolean };
}

const router = Router();

// Middleware to check if user is admin
const adminAuth = async (req: AuthRequest, res: Response, next: any) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const userResult = await pool.query('SELECT is_admin FROM users WHERE id = $1', [req.user.id]);
    
    if (userResult.rows.length === 0 || !userResult.rows[0].is_admin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    next();
  } catch (err) {
    console.error('Admin auth error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', auth, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT id, username, email, avatar_url, is_admin, is_creator, created_at 
      FROM users 
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/videos
// @desc    Get all videos
// @access  Admin
router.get('/videos', auth, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT v.id, v.title, v.description, v.video_url, v.thumbnail_url, v.created_at, v.views, u.username as uploader, u.avatar_url as uploader_avatar_url
      FROM videos v
      JOIN users u ON v.user_id = u.id
      ORDER BY v.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching videos:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/comments
// @desc    Get all comments
// @access  Admin
router.get('/comments', auth, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT c.id, c.text, c.user_id, c.video_id, c.created_at, c.parent_id, u.username
      FROM comments c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
// @access  Admin
router.delete('/users/:id', auth, adminAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    // Delete user and all their content
    await pool.query('BEGIN');
    
    // Delete user's comments
    await pool.query('DELETE FROM comments WHERE user_id = $1', [id]);
    
    // Delete user's videos
    await pool.query('DELETE FROM videos WHERE user_id = $1', [id]);
    
    // Delete user's reactions
    await pool.query('DELETE FROM video_reactions WHERE user_id = $1', [id]);
    
    // Delete user's subscriptions
    await pool.query('DELETE FROM watchers WHERE watcher_id = $1 OR watched_id = $1', [id]);
    
    // Delete user
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    
    await pool.query('COMMIT');
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/videos/:id
// @desc    Delete a video
// @access  Admin
router.delete('/videos/:id', auth, adminAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    // Delete video, its comments, and reactions
    await pool.query('BEGIN');
    
    // Delete video comments
    await pool.query('DELETE FROM comments WHERE video_id = $1', [id]);
    
    // Delete video reactions
    await pool.query('DELETE FROM video_reactions WHERE video_id = $1', [id]);
    
    // Delete video
    const result = await pool.query('DELETE FROM videos WHERE id = $1 RETURNING id', [id]);
    
    await pool.query('COMMIT');
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    res.json({ message: 'Video deleted successfully' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error deleting video:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/comments/:id
// @desc    Delete a comment
// @access  Admin
router.delete('/comments/:id', auth, adminAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    // Delete comment
    const result = await pool.query('DELETE FROM comments WHERE id = $1 RETURNING id', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;