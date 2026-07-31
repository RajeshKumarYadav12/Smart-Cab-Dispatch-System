import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

export const generateTokens = (user) => {
  const payload = { id: user._id, role: user.role };
  
  const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
  
  return { accessToken, refreshToken };
};

export const verifyToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};
