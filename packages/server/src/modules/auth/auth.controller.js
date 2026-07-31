import { User } from '../../models/User.js';
import { Driver } from '../../models/Driver.js';
import { Guest } from '../../models/Guest.js';
import { generateTokens, verifyToken } from './jwt.util.js';
import bcrypt from 'bcrypt';

export const register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      phone: phone || '0000000000', 
      passwordHash,
      role: role || 'guest' 
    });
    
    await user.save();

    if (user.role === 'driver') {
      const driver = new Driver({
        userId: user._id,
        vehicle: {
          plateNumber: 'TEST-' + Math.floor(Math.random() * 10000),
          seatCapacity: 4,
          luggageCapacity: 2,
          type: 'Sedan'
        },
        currentLocation: { lat: 12.9716, lng: 77.5946, updatedAt: new Date() } 
      });
      await driver.save();
    } else if (user.role === 'guest') {
       
       const guest = new Guest({
         userId: user._id,
         partySize: 1,
         luggageCount: 1
       });
       await guest.save();
    }

    const { accessToken, refreshToken } = generateTokens(user);
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    user.refreshTokenHash = hashedRefresh;
    await user.save();

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    };

    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 }); 
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 }); 

    res.status(201).json({
      user: { id: user._id, name: user.name, role: user.role, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const { accessToken, refreshToken } = generateTokens(user);

    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    user.refreshTokenHash = hashedRefresh;
    await user.save();
    
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    };

    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({
      user: { id: user._id, name: user.name, role: user.role, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' });
    
    const decoded = verifyToken(refreshToken);
    const user = await User.findById(decoded.id);
    if (!user || !user.refreshTokenHash) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    
    const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    
    const tokens = generateTokens(user);
    const hashedRefresh = await bcrypt.hash(tokens.refreshToken, 10);
    user.refreshTokenHash = hashedRefresh;
    await user.save();
    
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    };

    res.cookie('accessToken', tokens.accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', tokens.refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
    
    res.json({ message: 'Tokens refreshed' });
  } catch (error) {
    res.status(401).json({ message: 'Token expired or invalid' });
  }
};

export const logout = async (req, res) => {
  try {
    const { id } = req.user; 
    await User.findByIdAndUpdate(id, { refreshTokenHash: null });
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
