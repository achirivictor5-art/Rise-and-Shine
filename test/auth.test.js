process.env.JWT_SECRET = 'test-secret';
const test = require('node:test');
const assert = require('node:assert');
const { hashPassword, verifyPassword, signToken, verifyToken } = require('../server/lib/auth');

test('hashPassword produces a verifiable hash', async () => {
  const hash = await hashPassword('abc123');
  assert.notEqual(hash, 'abc123');
  assert.equal(await verifyPassword('abc123', hash), true);
  assert.equal(await verifyPassword('wrong', hash), false);
});

test('signToken / verifyToken round-trips the payload', () => {
  const token = signToken({ sub: 'user1', role: 'proprietor' });
  const payload = verifyToken(token);
  assert.equal(payload.sub, 'user1');
  assert.equal(payload.role, 'proprietor');
});

test('verifyToken returns null for a bad token', () => {
  assert.equal(verifyToken('not-a-token'), null);
});
