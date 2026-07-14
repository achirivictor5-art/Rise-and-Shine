const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SESSION_COOKIE = 'rs_session';

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is not set');
  return s;
}

function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

function signToken(payload) {
  return jwt.sign(payload, secret(), { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, secret());
  } catch {
    return null;
  }
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  };
}

module.exports = {
  SESSION_COOKIE,
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  cookieOptions,
};
