import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/smart-cab?authSource=admin',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret',
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379'
};
