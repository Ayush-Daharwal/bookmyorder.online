import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bookmyorder_super_secret_jwt_key_2026_skip_the_queue');
    req.user = await User.findById(decoded.id).select('-activeOtp');
    if (!req.user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed', error: error.message });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    const roleList = Array.isArray(roles) ? roles : [roles];
    if (!req.user || !roleList.includes(req.user.role)) {
      return res.status(403).json({ message: `Access forbidden: Required role [${roleList.join(', ')}]` });
    }
    next();
  };
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    const roleList = Array.isArray(roles[0]) ? roles[0] : roles;
    if (!req.user || !roleList.includes(req.user.role)) {
      return res.status(403).json({ message: `Access forbidden: Required role [${roleList.join(', ')}]` });
    }
    next();
  };
};
