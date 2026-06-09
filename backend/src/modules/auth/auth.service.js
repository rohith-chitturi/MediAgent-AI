const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/db');
const env = require('../../config/env');

/**
 * Generates access and refresh JWT tokens.
 */
const generateTokens = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role.name,
    permissions: user.role.permissions?.map(p => p.action) || [],
    hospitalId: user.hospitalId,
  };

  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(
    { userId: user.id },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
};

/**
 * Authenticates a user with email + password.
 */
const login = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      role: { include: { permissions: true } },
      hospital: { select: { id: true, name: true, logoUrl: true } },
      doctor: { select: { id: true, specialization: true } },
    },
  });

  if (!user || !user.isActive) {
    throw Object.assign(new Error('Invalid credentials.'), { statusCode: 401 });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw Object.assign(new Error('Invalid credentials.'), { statusCode: 401 });
  }

  const { accessToken, refreshToken } = generateTokens(user);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      permissions: user.role.permissions?.map(p => p.action) || [],
      hospital: user.hospital,
      doctor: user.doctor,
    },
  };
};

/**
 * Rotates the refresh token and issues a new access token.
 */
const refreshTokens = async (refreshToken) => {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch {
    throw Object.assign(new Error('Invalid or expired refresh token.'), { statusCode: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { role: { include: { permissions: true } } },
  });

  if (!user || !user.isActive) {
    throw Object.assign(new Error('User not found.'), { statusCode: 401 });
  }

  return generateTokens(user);
};

/**
 * Returns the current authenticated user's profile.
 */
const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
      createdAt: true,
      role: { select: { id: true, name: true, permissions: { select: { action: true } } } },
      hospital: { select: { id: true, name: true, logoUrl: true } },
      doctor: {
        select: {
          id: true,
          specialization: true,
          isAvailable: true,
          currentLoad: true,
          maxWorkload: true,
          department: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!user) throw Object.assign(new Error('User not found.'), { statusCode: 404 });
  return user;
};

module.exports = { login, refreshTokens, getMe };
