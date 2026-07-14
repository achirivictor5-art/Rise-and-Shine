const connectDb = require('../lib/db');
const { json, fail } = require('../lib/http');
const { getSessionUser } = require('../lib/session');
const { toBranchDTO } = require('../lib/dto');
const branchService = require('../services/branchService');

async function list(request) {
  try {
    await connectDb();
    await getSessionUser(request);
    const branches = await branchService.list();
    return json(branches.map(toBranchDTO));
  } catch (err) {
    return fail(err);
  }
}

module.exports = { list };
