import express from 'express';
import http from 'http';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { initSocketServer } from './sockets/socket.server.js';
import { startDispatchScheduler } from './modules/dispatch/dispatch.scheduler.js';

connectDB();

const app = express();
const server = http.createServer(app);

import cookieParser from 'cookie-parser';
import authRoutes from './modules/auth/auth.routes.js';
import tripRoutes from './modules/trip/trip.routes.js';
import driverRoutes from './modules/driver/driver.routes.js';
import statsRoutes from './modules/stats/stats.routes.js';
import guestRoutes from './modules/guest/guest.routes.js';

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/trip', tripRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/guest', guestRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/api/config/maps', (req, res) => {
  res.json({ apiKey: env.GOOGLE_MAPS_API_KEY });
});

initSocketServer(server);

startDispatchScheduler();

server.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});
