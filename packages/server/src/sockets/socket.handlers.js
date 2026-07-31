import { ROOMS } from './rooms.js';
import { Driver } from '../models/Driver.js';
import { Trip } from '../models/Trip.js';
import { verifyToken } from '../modules/auth/jwt.util.js';
import cookie from 'cookie';

export const setupSocketHandlers = (io) => {
  io.use((socket, next) => {
    try {
      let token = socket.handshake.auth.token;

      if (!token && socket.request.headers.cookie) {
        const cookies = cookie.parse(socket.request.headers.cookie);
        token = cookies.accessToken;
      }
      
      if (!token) return next(new Error('Authentication error'));
      
      const decoded = verifyToken(token);
      socket.user = decoded;

      socket.join(ROOMS.getRoleRoom(decoded.role));

      if (decoded.role === 'driver') {
        socket.join(ROOMS.getDriverRoom(decoded.id));
      }
      
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id} (${socket.user.role})`);

    socket.on('subscribe:trip', (tripId) => {
      socket.join(ROOMS.getTripRoom(tripId));
    });

    socket.on('unsubscribe:trip', (tripId) => {
      socket.leave(ROOMS.getTripRoom(tripId));
    });

    socket.on('driver:location:update', async (data) => {
      if (socket.user.role !== 'driver' && socket.user.role !== 'admin') return;
      
      const { lat, lng } = data;
      const driverId = socket.user.id;
      
      try {
        const driver = await Driver.findOne({ userId: driverId });
        if (driver) {
          driver.currentLocation = { lat, lng, updatedAt: new Date() };
          await driver.save();

          const broadcastData = { driverId: driver._id, lat, lng };
          io.to(ROOMS.getRoleRoom('admin')).emit('driver:location:broadcast', broadcastData);
          
          if (driver.currentTripId) {
            io.to(ROOMS.getTripRoom(driver.currentTripId)).emit('driver:location:broadcast', broadcastData);
          }
        }
      } catch (err) {
        console.error('Error updating driver location:', err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.id}`);
    });
  });
};
