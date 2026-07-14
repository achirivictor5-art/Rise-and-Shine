const User = require('../models/User');
const Branch = require('../models/Branch');
const { hashPassword } = require('../lib/auth');
const { badRequest, forbidden, conflict } = require('../lib/errors');

function assertProprietor(user) {
  if (user.role !== 'proprietor') throw forbidden('Only the proprietor can manage staff.');
}

async function list(user) {
  assertProprietor(user);
  return User.find().sort({ createdAt: 1 });
}

async function create(user, input) {
  assertProprietor(user);
  const { fullName, email, branchId, tempPassword } = input;
  if (!fullName || !email || !branchId || !tempPassword) {
    throw badRequest('Name, email, branch and temporary password are all required.');
  }
  if (tempPassword.length < 6) {
    throw badRequest('Temporary password must be at least 6 characters.');
  }
  const branchExists = await Branch.exists({ _id: branchId });
  if (!branchExists) throw badRequest('Unknown branch.');

  const normEmail = String(email).toLowerCase().trim();
  const dup = await User.exists({ email: normEmail });
  if (dup) throw conflict('A staff member with that email already exists.');

  const passwordHash = await hashPassword(tempPassword);
  return User.create({
    fullName,
    email: normEmail,
    passwordHash,
    role: 'head_teacher',
    branchId,
    mustChangePassword: true,
  });
}

module.exports = { list, create };
