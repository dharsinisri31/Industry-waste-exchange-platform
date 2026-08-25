const User = require('../models/User');
const Industry = require('../models/Industry');
const Admin = require('../models/Admin');
const { sendTokens, generateAccessToken } = require('../utils/generateToken');
const { geocodeAddress } = require('../services/geocodingService');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

// @desc    Register a new Industry
// @route   POST /api/auth/register-industry
// @access  Public
const registerIndustry = async (req, res) => {
  const {
    email,
    password,
    companyName,
    registrationNumber,
    businessRole,
    neededWasteTypes,
    address,
    city,
    state,
    country,
    pinCode,
    contactPhone,
    industryType,
    coordinates,
    description
  } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Check if registration number already exists
    const regExists = await Industry.findOne({ registrationNumber });
    if (regExists) {
      return res.status(400).json({ message: 'Industry with this registration number already exists' });
    }

    // Auto-geocode address if coordinates not explicitly supplied
    let resolvedCoords = coordinates;
    if (!resolvedCoords || !Array.isArray(resolvedCoords) || resolvedCoords.length < 2) {
      resolvedCoords = await geocodeAddress({ address, city, state, country, pinCode });
    }

    // Create User
    const user = await User.create({
      email,
      password,
      role: 'industry_user'
    });

    try {
      // Create Industry with GeoJSON Point coordinates
      const industry = await Industry.create({
        user: user._id,
        companyName,
        registrationNumber,
        businessRole: businessRole || 'sender',
        neededWasteTypes: neededWasteTypes || '',
        address,
        city,
        location: {
          type: 'Point',
          coordinates: [parseFloat(resolvedCoords[0]), parseFloat(resolvedCoords[1])] // [longitude, latitude]
        },
        contactPhone,
        industryType,
        description
      });

      const responseData = sendTokens(res, user);
      return res.status(201).json({
        ...responseData,
        profile: industry
      });
    } catch (dbError) {
      await User.findByIdAndDelete(user._id);
      throw dbError;
    }
  } catch (error) {
    console.error('Error in registerIndustry:', error);
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Register a new Admin
// @route   POST /api/auth/register-admin
// @access  Public (Secret Protected)
const registerAdmin = async (req, res) => {
  const { email, password, fullName, phone, adminSecret } = req.body;

  try {
    const systemSecret = process.env.ADMIN_REGISTRATION_SECRET || 'admin_secret_key_ideathon_2026';
    if (adminSecret !== systemSecret) {
      return res.status(403).json({ message: 'Invalid admin registration secret key' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const user = await User.create({
      email,
      password,
      role: 'admin',
      isVerified: true
    });

    try {
      const adminProfile = await Admin.create({
        user: user._id,
        fullName,
        phone
      });

      const responseData = sendTokens(res, user);
      return res.status(201).json({
        ...responseData,
        profile: adminProfile
      });
    } catch (dbError) {
      await User.findByIdAndDelete(user._id);
      throw dbError;
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate User & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    let profile = null;
    let canonicalRole = 'SELLER';

    if (user.role === 'admin') {
      profile = await Admin.findOne({ user: user._id });
      canonicalRole = 'ADMIN';
    } else if (user.role === 'industry_user') {
      profile = await Industry.findOne({ user: user._id });
      if (profile?.businessRole === 'receiver') {
        canonicalRole = 'BUYER';
      } else {
        canonicalRole = 'SELLER';
      }
    }

    const responseData = sendTokens(res, user);
    return res.status(200).json({
      ...responseData,
      user: {
        id: user._id,
        _id: user._id,
        email: user.email,
        role: user.role,
        canonicalRole,
        name: profile?.companyName || profile?.fullName || user.email.split('@')[0],
        industryId: profile?._id,
        isVerified: user.isVerified
      },
      profile
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Logout user
const logout = async (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  return res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get new Access Token
const refreshToken = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies || !cookies.refreshToken) {
    return res.status(401).json({ message: 'No refresh token provided' });
  }

  const refToken = cookies.refreshToken;

  try {
    const decoded = jwt.verify(refToken, jwtConfig.refreshSecret);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const newAccessToken = generateAccessToken(user);
    return res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

// @desc    Get current user profile
const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;
    let profile = null;
    let canonicalRole = 'SELLER';

    if (user.role === 'admin') {
      profile = await Admin.findOne({ user: user._id });
      canonicalRole = 'ADMIN';
    } else if (user.role === 'industry_user') {
      profile = await Industry.findOne({ user: user._id });
      if (profile?.businessRole === 'receiver') {
        canonicalRole = 'BUYER';
      } else {
        canonicalRole = 'SELLER';
      }
    }

    return res.status(200).json({
      user: {
        id: user._id,
        _id: user._id,
        email: user.email,
        role: user.role,
        canonicalRole,
        name: profile?.companyName || profile?.fullName || user.email.split('@')[0],
        industryId: profile?._id,
        isVerified: user.isVerified
      },
      profile
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerIndustry,
  registerAdmin,
  login,
  logout,
  refreshToken,
  getCurrentUser
};
