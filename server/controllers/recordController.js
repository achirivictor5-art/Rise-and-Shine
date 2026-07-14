const connectDb = require('../lib/db');
const { json, fail } = require('../lib/http');
const { getSessionUser } = require('../lib/session');
const { toRecordDTO } = require('../lib/dto');
const recordService = require('../services/recordService');

async function list(request) {
  try {
    await connectDb();
    const user = await getSessionUser(request);
    const records = await recordService.list(user);
    return json(records.map(toRecordDTO));
  } catch (err) {
    return fail(err);
  }
}

async function create(request) {
  try {
    await connectDb();
    const user = await getSessionUser(request);
    const body = await request.json();
    const rec = await recordService.create(user, body);
    return json(toRecordDTO(rec), 201);
  } catch (err) {
    return fail(err);
  }
}

async function update(request, id) {
  try {
    await connectDb();
    const user = await getSessionUser(request);
    const body = await request.json();
    const rec = await recordService.update(user, id, body);
    return json(toRecordDTO(rec));
  } catch (err) {
    return fail(err);
  }
}

async function remove(request, id) {
  try {
    await connectDb();
    const user = await getSessionUser(request);
    await recordService.remove(user, id);
    return json({ ok: true });
  } catch (err) {
    return fail(err);
  }
}

module.exports = { list, create, update, remove };
