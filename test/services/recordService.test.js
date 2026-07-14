const test = require('node:test');
const assert = require('node:assert');
const db = require('../helpers/db-helper');
const Branch = require('../../server/models/Branch');
const User = require('../../server/models/User');
const recordService = require('../../server/services/recordService');

test.before(async () => { await db.connect(); });
test.after(async () => { await db.close(); });
test.beforeEach(async () => { await db.clear(); });

async function fixtures() {
  const b1 = await Branch.create({ name: 'Branch One' });
  const b2 = await Branch.create({ name: 'Branch Two' });
  const ht = await User.create({
    fullName: 'Head', email: 'ht@x.com', passwordHash: 'x',
    role: 'head_teacher', branchId: b1._id,
  });
  const prop = await User.create({
    fullName: 'Prop', email: 'prop@x.com', passwordHash: 'x', role: 'proprietor',
  });
  return { b1, b2, ht, prop };
}

test('head teacher sees only their own branch; proprietor sees all', async () => {
  const { b2, ht, prop } = await fixtures();
  await recordService.create(ht, { pupilName: 'A', item: 'Tuition', amount: 100 });
  await recordService.create(prop, { pupilName: 'B', item: 'Tuition', amount: 200, branchId: String(b2._id) });
  const htList = await recordService.list(ht);
  assert.equal(htList.length, 1);
  assert.equal(htList[0].pupilName, 'A');
  const propList = await recordService.list(prop);
  assert.equal(propList.length, 2);
});

test('create populates the branch name for the DTO layer', async () => {
  const { ht } = await fixtures();
  const rec = await recordService.create(ht, { pupilName: 'A', item: 'Tuition', amount: 100 });
  assert.equal(rec.branchId.name, 'Branch One');
});

test('head teacher branch is forced server-side even if a foreign branch is sent', async () => {
  const { b1, b2, ht } = await fixtures();
  const rec = await recordService.create(ht, { pupilName: 'A', item: 'Tuition', branchId: String(b2._id) });
  assert.equal(String(rec.branchId._id), String(b1._id));
});

test('create rejects when required fields are missing', async () => {
  const { ht } = await fixtures();
  await assert.rejects(() => recordService.create(ht, { item: 'Tuition' }), /required/i);
});

test('proprietor create requires a branch', async () => {
  const { prop } = await fixtures();
  await assert.rejects(() => recordService.create(prop, { pupilName: 'A', item: 'Tuition' }), /branch/i);
});

test('head teacher cannot update or delete', async () => {
  const { ht } = await fixtures();
  const rec = await recordService.create(ht, { pupilName: 'A', item: 'Tuition', amount: 100 });
  await assert.rejects(() => recordService.update(ht, rec._id, { amount: 500 }), /proprietor/i);
  await assert.rejects(() => recordService.remove(ht, rec._id), /proprietor/i);
});

test('proprietor can update amount/status and delete', async () => {
  const { b1, prop } = await fixtures();
  const rec = await recordService.create(prop, { pupilName: 'A', item: 'Tuition', amount: 100, branchId: String(b1._id) });
  const updated = await recordService.update(prop, rec._id, { amount: 500, status: 'paid' });
  assert.equal(updated.amount, 500);
  assert.equal(updated.status, 'paid');
  await recordService.remove(prop, rec._id);
  assert.equal((await recordService.list(prop)).length, 0);
});

test('update rejects an invalid status', async () => {
  const { b1, prop } = await fixtures();
  const rec = await recordService.create(prop, { pupilName: 'A', item: 'Tuition', branchId: String(b1._id) });
  await assert.rejects(() => recordService.update(prop, rec._id, { status: 'nonsense' }), /status/i);
});
