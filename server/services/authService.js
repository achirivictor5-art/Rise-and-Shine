const mongoose = require('mongoose');
const User = require('../models/User');
const { hashPassword, verifyPassword, signToken, verifyToken } = require('../lib/auth');
const { unauthorized, badRequest } = require('../lib/errors');

async function login({ email, password }) {
  if (!email || !password) throw badRequest('Email and password are required.');
  const user = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (!user) throw unauthorized('Invalid email or password.');
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw unauthorized('Invalid email or password.');
  const token = signToken({ sub: String(user._id), role: user.role });
  return { token, user };
}

async function resolveUser(token) {
  const payload = verifyToken(token);
  if (!payload || !payload.sub || !mongoose.isValidObjectId(payload.sub)) return null;
  return User.findById(payload.sub);
}

async function changePassword(user, newPassword) {
  if (!newPassword || newPassword.length < 6) {
    throw badRequest('Password must be at least 6 characters.');
  }
  user.passwordHash = await hashPassword(newPassword);
  user.mustChangePassword = false;
  await user.save();
}

module.exports = { login, resolveUser, changePassword };
