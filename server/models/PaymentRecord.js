const mongoose = require('mongoose');

const paymentRecordSchema = new mongoose.Schema({
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  pupilName: { type: String, required: true },
  class: { type: String, default: '' },
  item: { type: String, required: true },
  amount: { type: Number, default: 0 },
  status: { type: String, enum: ['paid', 'partial', 'due'], default: 'due' },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

module.exports =
  mongoose.models.PaymentRecord || mongoose.model('PaymentRecord', paymentRecordSchema);
