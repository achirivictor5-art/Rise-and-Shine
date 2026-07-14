const Branch = require('../models/Branch');

async function list() {
  return Branch.find().sort({ name: 1 });
}

module.exports = { list };
