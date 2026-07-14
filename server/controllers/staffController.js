const connectDb = require('../lib/db');
const { json, fail } = require('../lib/http');
const { getSessionUser } = require('../lib/session');
const { toUserDTO } = require('../lib/dto');
const staffService = require('../services/staffService');

async function list(request) {
  try {
    await connectDb();
    const user = await getSessionUser(request);
    const staff = await staffService.list(user);
    return json(staff.map(toUserDTO));
  } catch (err) {
    return fail(err);
  }
}

async function create(request) {
  try {
    await connectDb();
    const user = await getSessionUser(request);
    const body = await request.json();
    const created = await staffService.create(user, body);
    return json(toUserDTO(created), 201);
  } catch (err) {
    return fail(err);
  }
}

module.exports = { list, create };
