import { Server } from 'socket.io';
import http from 'http';

let io: Server;

export const initSocket = (server: http.Server) => {
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL || ''].filter(url => url !== '')
    : ['http://localhost:3001', 'http://127.0.0.1:3001'];

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('a user connected', socket.id);

    socket.on('joinRoom', (videoId: string) => {
      socket.join(videoId);
      console.log(`User ${socket.id} joined room ${videoId}`);
    });

    socket.on('leaveRoom', (videoId: string) => {
      socket.leave(videoId);
      console.log(`User ${socket.id} left room ${videoId}`);
    });

    socket.on('disconnect', () => {
      console.log('user disconnected', socket.id);
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized!');
  }
  return io;
};
