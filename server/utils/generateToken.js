const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    jwtConfig.accessSecret,
    { expiresIn: jwtConfig.accessTokenExpire }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    jwtConfig.refreshSecret,
    { expiresIn: jwtConfig.refreshTokenExpire }
  );
};

const sendTokens = (res, user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Set refresh token in HTTP-only cookie
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };

  res.cookie('refreshToken', refreshToken, cookieOptions);

  return {
    accessToken,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified
    }
  };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  sendTokens
};
