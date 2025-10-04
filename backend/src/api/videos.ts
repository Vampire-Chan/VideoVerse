import { Router, Request, Response } from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary';
import auth from '../middleware/auth';
import { videoAuth } from '../middleware/videoAuth';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { Server } from 'socket.io'; // Import Server from socket.io

export default (io: Server) => {
  const router = Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

interface AuthRequest extends Request {
  user?: { id: number };
}

// @route   POST /api/videos/upload
// @desc    Upload a video
// @access  Private
router.post('/upload', auth, upload.single('video'), async (req: AuthRequest, res: Response) => {
  const { title, description } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: 'No video file uploaded' });
  }

  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description are required' });
  }

  try {
    // Upload video to Cloudinary
    const videoUploadResult = await cloudinary.uploader.upload_stream(
      { resource_type: 'video', eager: [{ width: 1920, height: 1080, crop: 'limit' }] },
      async (error, result) => {
        if (error) {
          console.error('Cloudinary video upload error:', error);
          return res.status(500).json({ message: 'Video upload failed' });
        }
        if (!result) {
          return res.status(500).json({ message: 'Video upload failed, no result from Cloudinary' });
        }

        const videoUrl = result.secure_url;
        const thumbnailUrl = result.thumbnail_url || result.secure_url.replace(/\.mp4$/, '.jpg');
        const fileSize = result.bytes;
        const duration = result.duration;
        const width = result.width;
        const height = result.height;
        const format = result.format;

        // Save video metadata to database
        const newVideo = await pool.query(
          'INSERT INTO videos (user_id, title, description, video_url, thumbnail_url, file_size, duration, width, height, format) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
          [req.user?.id, title, description, videoUrl, thumbnailUrl, fileSize, duration, width, height, format]
        );

        const uploadedVideo = newVideo.rows[0];

        // Get all users who are watching the uploader
        const watchers = await pool.query(
          'SELECT watcher_id FROM watchers WHERE watched_id = $1',
          [req.user?.id]
        );

        // Create a notification for each watcher
        for (const watcher of watchers.rows) {
          await pool.query(
            'INSERT INTO notifications (user_id, sender_id, type, message, related_entity_id, related_entity_type) VALUES ($1, $2, $3, $4, $5, $6)',
            [watcher.watcher_id, req.user?.id, 'NEW_VIDEO', `New video from ${req.user?.username}: ${uploadedVideo.title}`, uploadedVideo.id, 'video']
          );
        }

        res.status(201).json(uploadedVideo);
      }
    ).end(req.file.buffer);

  } catch (err) {
    console.error('Server error during video upload:', err);
    res.status(500).json({ message: 'Server error during video upload' });
  }
});

// @route   GET /api/videos
// @desc    Get all videos
// @access  Public
router.get('/', async (req: Request, res: Response) => {
  try {
    const allVideos = await pool.query(
      'SELECT v.id, v.title, v.description, v.video_url, v.thumbnail_url, v.created_at, v.views, u.username as uploader, u.avatar_url as uploader_avatar_url FROM videos v JOIN users u ON v.user_id = u.id ORDER BY v.created_at DESC'
    );
    res.json(allVideos.rows);
  } catch (err) {
    console.error('Error fetching videos:', err);
    res.status(500).json({ message: 'Server error fetching videos' });
  }
});

// @route   GET /api/videos/search?q=:query
// @desc    Search videos by title or description
// @access  Public
router.get('/search', async (req: Request, res: Response) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ message: 'Search query is required' });
  }
  try {
    const searchResults = await pool.query(
      'SELECT v.id, v.title, v.description, v.video_url, v.thumbnail_url, v.created_at, v.views, u.username as uploader, u.avatar_url as uploader_avatar_url FROM videos v JOIN users u ON v.user_id = u.id WHERE v.title ILIKE $1 OR v.description ILIKE $1 ORDER BY v.created_at DESC',
      [`%${q}%`]
    );
    res.json(searchResults.rows);
  } catch (err) {
    console.error('Error searching videos:', err);
    res.status(500).json({ message: 'Server error searching videos' });
  }
});

// @route   GET /api/videos/suggestions?q=:query
// @desc    Get video search suggestions by title
// @access  Public
router.get('/suggestions', async (req: Request, res: Response) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ message: 'Search query is required' });
  }
  try {
    const suggestions = await pool.query(
      'SELECT id, title FROM videos WHERE title ILIKE $1 ORDER BY created_at DESC LIMIT 5',
      [`%${q}%`]
    );
    res.json(suggestions.rows);
  } catch (err) {
    console.error('Error fetching search suggestions:', err);
    res.status(500).json({ message: 'Server error fetching suggestions' });
  }
});

// @route   GET /api/videos/:id
// @desc    Get single video details
// @access  Public
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const video = await pool.query(
      `SELECT
        v.id, v.title, v.description, v.video_url, v.thumbnail_url, v.created_at, v.user_id,
        u.username as uploader, u.avatar_url as uploader_avatar_url, u.is_creator,
        COUNT(CASE WHEN vr.type = 'like' THEN 1 END) AS likes,
        COUNT(CASE WHEN vr.type = 'dislike' THEN 1 END) AS dislikes
      FROM videos v
      JOIN users u ON v.user_id = u.id
      LEFT JOIN video_reactions vr ON v.id = vr.video_id
      WHERE v.id = $1
      GROUP BY v.id, v.title, v.description, v.video_url, v.thumbnail_url, v.created_at, v.user_id, u.username, u.avatar_url, u.is_creator`,
      [id]
    );
    if (video.rows.length === 0) {
      return res.status(404).json({ message: 'Video not found' });
    }
    res.json(video.rows[0]);
  } catch (err) {
    console.error('Error fetching video by ID:', err);
    res.status(500).json({ message: 'Server error fetching video' });
  }
});

// @route   POST /api/videos/:id/view
// @desc    Increment video view count and emit real-time update
// @access  Public (or Private if tracking logged-in user views)
router.post('/:id/view', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // Increment view count in DB
    const updatedVideo = await pool.query(
      'UPDATE videos SET views = views + 1 WHERE id = $1 RETURNING id, views',
      [id]
    );

    if (updatedVideo.rows.length === 0) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const newViewCount = updatedVideo.rows[0].views;

    // Emit real-time update to all clients in the video's room
    io.to(id).emit('video:viewCountUpdate', { videoId: id, views: newViewCount });

    res.status(200).json({ videoId: id, views: newViewCount });
  } catch (err) {
    console.error('Error incrementing video view count:', err);
    res.status(500).json({ message: 'Server error incrementing view count' });
  }
});

// Helper function to get current likes and dislikes for a video
const getVideoReactionCounts = async (videoId: string) => {
  const result = await pool.query(
    `SELECT
      COUNT(CASE WHEN type = 'like' THEN 1 END) AS likes,
      COUNT(CASE WHEN type = 'dislike' THEN 1 END) AS dislikes
    FROM video_reactions
    WHERE video_id = $1`,
    [videoId]
  );
  return result.rows[0];
};

// @route   POST /api/videos/:id/like
// @desc    Like a video
// @access  Private
router.post('/:id/like', auth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params; // video_id
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Check if user has already reacted to this video
    const existingReaction = await pool.query(
      'SELECT type FROM video_reactions WHERE video_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existingReaction.rows.length > 0) {
      const reactionType = existingReaction.rows[0].type;
      if (reactionType === 'like') {
        // Already liked, so unlike (delete reaction)
        await pool.query(
          'DELETE FROM video_reactions WHERE video_id = $1 AND user_id = $2',
          [id, userId]
        );
      } else {
        // Was disliked, now like (update reaction)
        await pool.query(
          `UPDATE video_reactions SET type = 'like' WHERE video_id = $1 AND user_id = $2`,
          [id, userId]
        );
      }
    } else {
      // No existing reaction, so add like
      await pool.query(
        `INSERT INTO video_reactions (video_id, user_id, type) VALUES ($1, $2, 'like')`,
        [id, userId]
      );
    }

    const { likes, dislikes } = await getVideoReactionCounts(id);
    io.to(id).emit('video:reactionUpdate', { videoId: id, likes: parseInt(likes), dislikes: parseInt(dislikes) });

    res.status(200).json({ message: 'Reaction updated', likes: parseInt(likes), dislikes: parseInt(dislikes) });
  } catch (err) {
    console.error('Error liking video:', err);
    res.status(500).json({ message: 'Server error liking video' });
  }
});

// @route   POST /api/videos/:id/dislike
// @desc    Dislike a video
// @access  Private
router.post('/:id/dislike', auth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params; // video_id
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Check if user has already reacted to this video
    const existingReaction = await pool.query(
      'SELECT type FROM video_reactions WHERE video_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existingReaction.rows.length > 0) {
      const reactionType = existingReaction.rows[0].type;
      if (reactionType === 'dislike') {
        // Already disliked, so undislike (delete reaction)
        await pool.query(
          'DELETE FROM video_reactions WHERE video_id = $1 AND user_id = $2',
          [id, userId]
        );
      } else {
        // Was liked, now dislike (update reaction)
        await pool.query(
          `UPDATE video_reactions SET type = 'dislike' WHERE video_id = $1 AND user_id = $2`,
          [id, userId]
        );
      }
    } else {
      // No existing reaction, so add dislike
      await pool.query(
        `INSERT INTO video_reactions (video_id, user_id, type) VALUES ($1, $2, 'dislike')`,
        [id, userId]
      );
    }

    const { likes, dislikes } = await getVideoReactionCounts(id);
    io.to(id).emit('video:reactionUpdate', { videoId: id, likes: parseInt(likes), dislikes: parseInt(dislikes) });

    res.status(200).json({ message: 'Reaction updated', likes: parseInt(likes), dislikes: parseInt(dislikes) });
  } catch (err) {
    console.error('Error disliking video:', err);
    res.status(500).json({ message: 'Server error disliking video' });
  }
});

// @route   PUT /api/videos/:id
// @desc    Update video metadata
// @access  Private (Owner only)
router.put('/:id', auth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, visibility, category } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Check if video exists and belongs to the user
    const videoCheck = await pool.query('SELECT user_id FROM videos WHERE id = $1', [id]);
    if (videoCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Video not found' });
    }
    if (videoCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ message: 'Forbidden: You do not own this video' });
    }

    const updateVideo = await pool.query(
      'UPDATE videos SET title = $1, description = $2, visibility = $3, category = $4 WHERE id = $5 RETURNING * ',
      [title, description, visibility, category, id]
    );

    res.json(updateVideo.rows[0]);
  } catch (err) {
    console.error('Error updating video:', err);
    res.status(500).json({ message: 'Server error updating video' });
  }
});

// @route   DELETE /api/videos/:id
// @desc    Delete a video
// @access  Private (Owner only)
router.delete('/:id', auth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Check if video exists and belongs to the user
    const videoCheck = await pool.query('SELECT user_id, video_url FROM videos WHERE id = $1', [id]);
    if (videoCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Video not found' });
    }
    if (videoCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ message: 'Forbidden: You do not own this video' });
    }

    // Optionally delete from Cloudinary as well (requires Cloudinary public_id)
    // For now, just delete from DB
    await pool.query('DELETE FROM videos WHERE id = $1', [id]);

    res.json({ message: 'Video deleted successfully' });
  } catch (err) {
    console.error('Error deleting video:', err);
    res.status(500).json({ message: 'Server error deleting video' });
  }
});

// @route   GET /api/videos/:id/comments
// @desc    Get all comments for a video
// @access  Public
router.get('/:id/comments', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const videoComments = await pool.query(
      'SELECT c.id, c.text, c.created_at, c.parent_id, u.username as author, u.avatar_url as author_avatar_url FROM comments c JOIN users u ON c.user_id = u.id WHERE c.video_id = $1 ORDER BY c.created_at DESC',
      [id]
    );
    res.json(videoComments.rows);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ message: 'Server error fetching comments' });
  }
});

// @route   POST /api/videos/:id/comments
// @desc    Add a comment to a video
// @access  Private
router.post('/:id/comments', auth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params; // video_id
  const { text, parent_id } = req.body; // Get parent_id from body
  const userId = req.user?.id;

  if (!text) {
    return res.status(400).json({ message: 'Comment text is required' });
  }
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const newCommentRes = await pool.query(
      'INSERT INTO comments (user_id, video_id, text, parent_id) VALUES ($1, $2, $3, $4) RETURNING id, user_id, video_id, text, created_at, parent_id',
      [userId, id, text, parent_id]
    );

    const newComment = newCommentRes.rows[0];

    // Fetch author details for the new comment
    const authorRes = await pool.query(
      'SELECT username as author, avatar_url as author_avatar_url FROM users WHERE id = $1',
      [newComment.user_id]
    );

    const fullComment = {
      ...newComment,
      author: authorRes.rows[0].author,
      author_avatar_url: authorRes.rows[0].author_avatar_url,
    };

    // Handle @mentions
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    let match;
    const mentionedUsernames: string[] = [];

    while ((match = mentionRegex.exec(text)) !== null) {
      mentionedUsernames.push(match[1]);
    }

    if (mentionedUsernames.length > 0) {
      const mentionedUsers = await pool.query(
        'SELECT id, username FROM users WHERE username = ANY($1::text[])',
        [mentionedUsernames]
      );

      for (const mentionedUser of mentionedUsers.rows) {
        await pool.query(
          'INSERT INTO notifications (user_id, sender_id, type, message, related_entity_id, related_entity_type) VALUES ($1, $2, $3, $4, $5, $6)',
          [mentionedUser.id, userId, 'MENTION', `@${authorRes.rows[0].author} mentioned you in a comment on ${fullComment.video_id}`, fullComment.id, 'comment']
        );
        // Optionally, emit a real-time notification to the mentioned user if they are online
        // io.to(mentionedUser.id).emit('notification', { message: `@${authorRes.rows[0].author} mentioned you...` });
      }
    }

    io.to(id).emit('newComment', fullComment); // Emit to clients in the video room

    res.status(201).json(fullComment);
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ message: 'Server error adding comment' });
  }
});

  // @route   PUT /api/videos/comments/:id
  // @desc    Edit a comment
  // @access  Private (Owner only)
  router.put('/comments/:id', auth, async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const commentCheck = await pool.query('SELECT user_id FROM comments WHERE id = $1', [id]);
      if (commentCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Comment not found' });
      }
      if (commentCheck.rows[0].user_id !== userId) {
        return res.status(403).json({ message: 'Forbidden: You do not own this comment' });
      }

      const updatedComment = await pool.query(
        'UPDATE comments SET text = $1 WHERE id = $2 RETURNING *',
        [text, id]
      );

      res.json(updatedComment.rows[0]);
    } catch (err) {
      console.error('Error editing comment:', err);
      res.status(500).json({ message: 'Server error editing comment' });
    }
  });

  // @route   DELETE /api/videos/comments/:id
  // @desc    Delete a comment
  // @access  Private (Owner only)
  router.delete('/comments/:id', auth, async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const commentCheck = await pool.query('SELECT user_id FROM comments WHERE id = $1', [id]);
      if (commentCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Comment not found' });
      }
      if (commentCheck.rows[0].user_id !== userId) {
        return res.status(403).json({ message: 'Forbidden: You do not own this comment' });
      }

      await pool.query('DELETE FROM comments WHERE id = $1', [id]);
      res.json({ message: 'Comment deleted successfully' });
    } catch (err) {
      console.error('Error deleting comment:', err);
      res.status(500).json({ message: 'Server error deleting comment' });
    }
  });

  

  // @route   GET /api/videos/:id/signed-url
  // @desc    Generate a time-limited signed URL for video access
  // @access  Private
  router.get('/:id/signed-url', auth, async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      // Verify the video exists
      const video = await pool.query(
        `SELECT v.id, v.video_url, v.user_id
         FROM videos v 
         WHERE v.id = $1`,
        [id]
      );

      if (video.rows.length === 0) {
        return res.status(404).json({ message: 'Video not found' });
      }

      const videoInfo = video.rows[0];
      
      // Increment view count in DB for analytics
      await pool.query(
        'UPDATE videos SET views = views + 1 WHERE id = $1',
        [id]
      );

      // In a real implementation with Cloudinary, you could generate a signed URL
      // For this demo, we'll return the video URL directly but in practice you'd
      // generate a short-lived signed URL
      const signedUrl = videoInfo.video_url;
      
      res.json({ signedUrl });
    } catch (err) {
      console.error('Error generating signed URL:', err);
      res.status(500).json({ message: 'Server error generating signed URL' });
    }
  });

  return router;
};
