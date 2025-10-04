import { Router, Request, Response } from 'express';
import auth from '../middleware/auth';
import pool from '../db';

const router = Router();

interface AuthRequest extends Request {
  user?: { id: number };
}

// @route   GET /api/notifications
// @desc    Get all notifications for the authenticated user
// @access  Private
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark a specific notification as read
// @access  Private
router.put('/:id/read', auth, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const notificationId = parseInt(req.params.id, 10);

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const result = await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING * ',
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found or not authorized' });
    }

    res.json({ message: 'Notification marked as read', notification: result.rows[0] });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications for the authenticated user as read
// @access  Private
router.put('/read-all', auth, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
      [userId]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;