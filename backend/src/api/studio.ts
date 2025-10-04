
import { Router, Request, Response } from 'express';
import auth from '../middleware/auth';
import pool from '../db';

const router = Router();

interface AuthRequest extends Request {
  user?: { id: number };
}

// @route   GET /api/studio/my-videos
// @desc    Get all videos for the current user
// @access  Private
router.get('/my-videos', auth, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const userVideosRes = await pool.query(
      'SELECT v.*, (SELECT COUNT(*) FROM comments c WHERE c.video_id = v.id) as engagement, (SELECT COUNT(*) FROM video_reactions vr WHERE vr.video_id = v.id AND vr.type = \'like\') as likes, v.file_size, v.duration, v.width, v.height, v.format, v.video_url FROM videos v WHERE v.user_id = $1 ORDER BY v.created_at DESC',
      [userId]
    );

    res.json(userVideosRes.rows);
  } catch (err) {
    console.error('Error fetching user videos:', err);
    res.status(500).json({ message: 'Server error fetching videos' });
  }
});

export default router;
