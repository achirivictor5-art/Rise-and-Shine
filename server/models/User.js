const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['head_teacher', 'proprietor'], default: 'head_teacher' },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },
  mustChangePassword: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
