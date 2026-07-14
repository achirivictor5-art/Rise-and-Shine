const { SESSION_COOKIE } = require('./auth');
const authService = require('../services/authService');
const { unauthorized } = require('./errors');

async function getOptionalUser(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  return token ? authService.resolveUser(token) : null;
}

async function getSessionUser(request) {
  const user = await getOptionalUser(request);
  if (!user) throw unauthorized();
  return user;
}

module.exports = { getSessionUser, getOptionalUser };
