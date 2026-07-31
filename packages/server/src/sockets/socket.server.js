import { Server } from 'socket.io';
import { setupSocketHandlers } from './socket.handlers.js';

let io;

export const initSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: true, 
      methods: ['GET', 'POST', 'PATCH'],
      credentials: true
    }
  });

  setupSocketHandlers(io);
  return io;
};

export const getIo = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized!');
  }
  return io;
};
