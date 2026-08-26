const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const User = require('../models/User');
const Industry = require('../models/Industry');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, jwtConfig.accessSecret);

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      // Populate roles if not already populated
      if (!req.user.roles || req.user.roles.length === 0) {
        if (req.user.role === 'admin') {
          req.user.roles = ['admin'];
        } else {
          const industry = await Industry.findOne({ user: req.user._id });
          if (industry) {
            req.user.roles = industry.roles || (industry.businessRole === 'receiver' ? ['buyer'] : industry.businessRole === 'both' ? ['buyer', 'seller'] : ['seller']);
            req.industry = industry;
          } else {
            req.user.roles = ['seller'];
          }
        }
      }

      return next();
    } catch (error) {
      console.error('JWT verification error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || (req.user.roles && req.user.roles.includes('admin')))) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin role required' });
  }
};

const isIndustry = (req, res, next) => {
  if (req.user && req.user.role === 'industry_user') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Industry role required' });
  }
};

// Middleware to enforce specific role access (e.g. ['buyer'], ['seller'], ['buyer', 'seller'])
const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Admins bypass role restrictions
    if (req.user.role === 'admin' || (req.user.roles && req.user.roles.includes('admin'))) {
      return next();
    }

    const userRoles = req.user.roles || ['seller'];
    const hasPermission = allowedRoles.some(role => userRoles.includes(role));

    if (!hasPermission) {
      return res.status(403).json({
        message: `Access denied: Action requires one of [${allowedRoles.join(', ')}] role(s)`
      });
    }

    next();
  };
};

const requireBuyer = requireRole(['buyer']);
const requireSeller = requireRole(['seller']);

module.exports = {
  protect,
  isAdmin,
  isIndustry,
  requireRole,
  requireBuyer,
  requireSeller
};
