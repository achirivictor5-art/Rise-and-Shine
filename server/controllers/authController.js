const connectDb = require('../lib/db');
const { json, fail } = require('../lib/http');
const { getSessionUser } = require('../lib/session');
const { SESSION_COOKIE, cookieOptions } = require('../lib/auth');
const { toUserDTO } = require('../lib/dto');
const authService = require('../services/authService');

async function login(request) {
  try {
    await connectDb();
    const { email, password } = await request.json();
    const { token, user } = await authService.login({ email, password });
    const res = json(toUserDTO(user));
    res.cookies.set(SESSION_COOKIE, token, cookieOptions());
    return res;
  } catch (err) {
    return fail(err);
  }
}

async function logout() {
  const res = json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', { ...cookieOptions(), maxAge: 0 });
  return res;
}

async function me(request) {
  try {
    await connectDb();
    const user = await getSessionUser(request);
    return json(toUserDTO(user));
  } catch (err) {
    return fail(err);
  }
}

async function changePassword(request) {
  try {
    await connectDb();
    const user = await getSessionUser(request);
    const { newPassword } = await request.json();
    await authService.changePassword(user, newPassword);
    return json({ ok: true });
  } catch (err) {
    return fail(err);
  }
}

module.exports = { login, logout, me, changePassword };
