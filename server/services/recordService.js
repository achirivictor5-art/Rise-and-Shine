const PaymentRecord = require('../models/PaymentRecord');
const Branch = require('../models/Branch');
const { badRequest, forbidden, notFound } = require('../lib/errors');

const VALID_STATUS = ['paid', 'partial', 'due'];

async function list(user) {
  const filter = user.role === 'proprietor' ? {} : { branchId: user.branchId };
  return PaymentRecord.find(filter).sort({ createdAt: -1 }).populate('branchId', 'name');
}

async function create(user, input) {
  if (!input.pupilName || !input.item) {
    throw badRequest('Pupil name and item are required.');
  }
  const status = VALID_STATUS.includes(input.status) ? input.status : 'due';

  let branchId;
  if (user.role === 'head_teacher') {
    if (!user.branchId) throw badRequest('Your account has no branch assigned.');
    branchId = user.branchId;
  } else {
    if (!input.branchId) throw badRequest('Please choose a branch.');
    const exists = await Branch.exists({ _id: input.branchId });
    if (!exists) throw badRequest('Unknown branch.');
    branchId = input.branchId;
  }

  const created = await PaymentRecord.create({
    branchId,
    pupilName: input.pupilName,
    class: input.class || '',
    item: input.item,
    amount: Number(input.amount) || 0,
    status,
    addedBy: user._id,
  });
  return PaymentRecord.findById(created._id).populate('branchId', 'name');
}

async function update(user, id, patch) {
  if (user.role !== 'proprietor') throw forbidden('Only the proprietor can edit records.');
  const rec = await PaymentRecord.findById(id);
  if (!rec) throw notFound('Record not found.');
  if (patch.amount !== undefined) rec.amount = Number(patch.amount) || 0;
  if (patch.status !== undefined) {
    if (!VALID_STATUS.includes(patch.status)) throw badRequest('Invalid status.');
    rec.status = patch.status;
  }
  await rec.save();
  return PaymentRecord.findById(rec._id).populate('branchId', 'name');
}

async function remove(user, id) {
  if (user.role !== 'proprietor') throw forbidden('Only the proprietor can delete records.');
  const rec = await PaymentRecord.findByIdAndDelete(id);
  if (!rec) throw notFound('Record not found.');
}

module.exports = { list, create, update, remove };
