import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

// @route   GET /api/streaming/:videoId
// @desc    Stream a video
// @access  Public
router.get('/:videoId', (req: Request, res: Response) => {
  const videoId = req.params.videoId;
  // This is a placeholder for getting the video path from the database
  const videoPath = path.join(__dirname, `../../videos/${videoId}.mp4`);

  fs.stat(videoPath, (err, stat) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).send('Video not found');
      }
      return res.status(500).send('Internal Server Error');
    }

    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  });
});

export default router;
