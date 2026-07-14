const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true },
});

module.exports = mongoose.models.Branch || mongoose.model('Branch', branchSchema);
