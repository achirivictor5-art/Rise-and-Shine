const test = require('node:test');
const assert = require('node:assert');
const db = require('../helpers/db-helper');
const User = require('../../server/models/User');
const { hashPassword, verifyPassword } = require('../../server/lib/auth');
const authService = require('../../server/services/authService');

test.before(async () => { await db.connect(); });
test.after(async () => { await db.close(); });
test.beforeEach(async () => { await db.clear(); });

async function makeUser(overrides = {}) {
  return User.create({
    fullName: 'Test',
    email: 'test@x.com',
    passwordHash: await hashPassword('secret123'),
    role: 'proprietor',
    ...overrides,
  });
}

test('login succeeds with correct credentials and returns a token', async () => {
  await makeUser();
  const { token, user } = await authService.login({ email: 'test@x.com', password: 'secret123' });
  assert.ok(token);
  assert.equal(user.email, 'test@x.com');
});

test('login is case-insensitive on email', async () => {
  await makeUser();
  const { token } = await authService.login({ email: 'TEST@X.COM', password: 'secret123' });
  assert.ok(token);
});

test('login rejects a wrong password', async () => {
  await makeUser();
  await assert.rejects(
    () => authService.login({ email: 'test@x.com', password: 'nope' }),
    /invalid/i
  );
});

test('resolveUser returns the user for a valid token and null for garbage', async () => {
  await makeUser();
  const { token } = await authService.login({ email: 'test@x.com', password: 'secret123' });
  const resolved = await authService.resolveUser(token);
  assert.equal(resolved.email, 'test@x.com');
  assert.equal(await authService.resolveUser('garbage'), null);
});

test('changePassword updates the hash and clears mustChangePassword', async () => {
  const user = await makeUser({ mustChangePassword: true });
  await authService.changePassword(user, 'brandnew1');
  const reloaded = await User.findById(user._id);
  assert.equal(reloaded.mustChangePassword, false);
  assert.equal(await verifyPassword('brandnew1', reloaded.passwordHash), true);
});

test('changePassword rejects a short password', async () => {
  const user = await makeUser();
  await assert.rejects(() => authService.changePassword(user, 'x'), /6 characters/i);
});
