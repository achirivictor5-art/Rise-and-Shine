const test = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const db = require('../helpers/db-helper');
const Branch = require('../../server/models/Branch');
const User = require('../../server/models/User');
const { verifyPassword } = require('../../server/lib/auth');
const staffService = require('../../server/services/staffService');

test.before(async () => { await db.connect(); });
test.after(async () => { await db.close(); });
test.beforeEach(async () => { await db.clear(); });

async function proprietor() {
  return User.create({ fullName: 'P', email: 'p@x.com', passwordHash: 'x', role: 'proprietor' });
}

test('proprietor creates a head teacher with mustChangePassword and a hashed password', async () => {
  const prop = await proprietor();
  const branch = await Branch.create({ name: 'Branch One' });
  const created = await staffService.create(prop, {
    fullName: 'Jane', email: 'Jane@X.com', branchId: String(branch._id), tempPassword: 'temp123',
  });
  assert.equal(created.role, 'head_teacher');
  assert.equal(created.mustChangePassword, true);
  assert.equal(created.email, 'jane@x.com');
  assert.notEqual(created.passwordHash, 'temp123');
  assert.equal(await verifyPassword('temp123', created.passwordHash), true);
});

test('duplicate email is rejected', async () => {
  const prop = await proprietor();
  const branch = await Branch.create({ name: 'Branch One' });
  const args = { fullName: 'Jane', email: 'jane@x.com', branchId: String(branch._id), tempPassword: 'temp123' };
  await staffService.create(prop, args);
  await assert.rejects(() => staffService.create(prop, args), /already exists/i);
});

test('short temporary password is rejected', async () => {
  const prop = await proprietor();
  const branch = await Branch.create({ name: 'Branch One' });
  await assert.rejects(
    () => staffService.create(prop, { fullName: 'J', email: 'j@x.com', branchId: String(branch._id), tempPassword: 'x' }),
    /6 characters/i
  );
});

test('a head teacher cannot create staff or list them', async () => {
  const branch = await Branch.create({ name: 'Branch One' });
  const ht = await User.create({ fullName: 'H', email: 'h@x.com', passwordHash: 'x', role: 'head_teacher', branchId: branch._id });
  await assert.rejects(
    () => staffService.create(ht, { fullName: 'J', email: 'j@x.com', branchId: String(branch._id), tempPassword: 'temp123' }),
    /proprietor/i
  );
  await assert.rejects(() => staffService.list(ht), /proprietor/i);
});

test('proprietor can list staff', async () => {
  const prop = await proprietor();
  const branch = await Branch.create({ name: 'Branch One' });
  await staffService.create(prop, { fullName: 'Jane', email: 'jane@x.com', branchId: String(branch._id), tempPassword: 'temp123' });
  const list = await staffService.list(prop);
  assert.equal(list.length, 2); // proprietor + created head teacher
});

test('create rejects a non-existent branch', async () => {
  const prop = await proprietor();
  const ghostBranchId = String(new mongoose.Types.ObjectId());
  await assert.rejects(
    () => staffService.create(prop, { fullName: 'Jane', email: 'jane@x.com', branchId: ghostBranchId, tempPassword: 'temp123' }),
    /unknown branch/i
  );
});

test('create rejects when a required field is missing', async () => {
  const prop = await proprietor();
  const branch = await Branch.create({ name: 'Branch One' });
  await assert.rejects(
    () => staffService.create(prop, { email: 'jane@x.com', branchId: String(branch._id), tempPassword: 'temp123' }),
    /required/i
  );
});
