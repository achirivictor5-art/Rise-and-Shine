function toUserDTO(u) {
  return {
    id: String(u._id),
    full_name: u.fullName,
    email: u.email,
    role: u.role,
    branch_id: u.branchId ? String(u.branchId._id || u.branchId) : null,
    must_change_password: !!u.mustChangePassword,
  };
}

function toBranchDTO(b) {
  return { id: String(b._id), name: b.name };
}

function toRecordDTO(r) {
  const populated = r.branchId && typeof r.branchId === 'object' && r.branchId.name;
  return {
    id: String(r._id),
    branch_id: r.branchId ? String(r.branchId._id || r.branchId) : null,
    pupil_name: r.pupilName,
    class: r.class || '',
    item: r.item,
    amount: r.amount,
    status: r.status,
    added_by: r.addedBy ? String(r.addedBy._id || r.addedBy) : null,
    created_at: r.createdAt,
    branches: { name: populated ? r.branchId.name : null },
  };
}

module.exports = { toUserDTO, toBranchDTO, toRecordDTO };
