'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

const statusLabel = { paid: 'Fully paid', partial: 'Partial', due: 'Outstanding' };

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [branches, setBranches] = useState([]);
  const [records, setRecords] = useState([]);
  const [branchFilter, setBranchFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ pupil_name: '', class: '', item: '', amount: '', status: 'due', branch_id: '' });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const loadEverything = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      router.replace('/portal/login');
      return;
    }
    const userId = sessionData.session.user.id;

    const { data: profileRow } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(profileRow);

    const { data: branchRows } = await supabase.from('branches').select('*').order('name');
    setBranches(branchRows || []);

    if (profileRow?.role === 'head_teacher' && profileRow.branch_id) {
      setForm((f) => ({ ...f, branch_id: profileRow.branch_id }));
    }

    await refreshRecords(profileRow);
    setLoading(false);
  }, [router]);

  async function refreshRecords(profileRow) {
    let query = supabase
      .from('payment_records')
      .select('*, branches(name)')
      .order('created_at', { ascending: false });

    const { data } = await query;
    setRecords(data || []);
  }

  useEffect(() => {
    loadEverything();
  }, [loadEverything]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/portal/login');
  }

  async function handleAddRecord(e) {
    e.preventDefault();
    setSaving(true);
    setNotice('');
    const branch_id = profile.role === 'head_teacher' ? profile.branch_id : form.branch_id;

    if (!branch_id) {
      setNotice('Please choose a branch.');
      setSaving(false);
      return;
    }

    const { error } = await supabase.from('payment_records').insert({
      branch_id,
      pupil_name: form.pupil_name,
      class: form.class,
      item: form.item,
      amount: Number(form.amount) || 0,
      status: form.status,
      added_by: profile.id,
    });

    setSaving(false);
    if (error) {
      setNotice(error.message);
      return;
    }
    setForm({ pupil_name: '', class: '', item: '', amount: '', status: 'due', branch_id: profile.role === 'head_teacher' ? profile.branch_id : '' });
    setFormOpen(false);
    refreshRecords(profile);
  }

  async function handleEdit(record) {
    if (profile.role !== 'proprietor') return;
    const newAmount = window.prompt(`New amount for ${record.pupil_name} (${record.item})`, record.amount);
    if (newAmount === null) return;
    const newStatus = window.prompt('Status: paid / partial / due', record.status);
    if (newStatus === null) return;
    const { error } = await supabase
      .from('payment_records')
      .update({ amount: Number(newAmount) || 0, status: newStatus })
      .eq('id', record.id);
    if (error) {
      alert(error.message);
      return;
    }
    refreshRecords(profile);
  }

  if (loading) {
    return <div style={{ padding: 40, fontFamily: 'sans-serif' }}>Loading…</div>;
  }

  if (!profile) {
    return (
      <div style={{ padding: 40 }}>
        <p>Your account has no profile yet. Ask the proprietor to check Table Editor → profiles.</p>
      </div>
    );
  }

  const isProprietor = profile.role === 'proprietor';
  const branchName = branches.find((b) => b.id === profile.branch_id)?.name || '—';

  const filtered = records.filter((r) => {
    const matchesBranch = branchFilter === 'all' || r.branch_id === branchFilter;
    const matchesSearch = r.pupil_name.toLowerCase().includes(search.toLowerCase());
    return matchesBranch && matchesSearch;
  });

  const kpis = {
    total: filtered.length,
    paid: filtered.filter((r) => r.status === 'paid').length,
    partial: filtered.filter((r) => r.status === 'partial').length,
    due: filtered.filter((r) => r.status === 'due').length,
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <svg width="22" height="22" viewBox="0 0 100 100">
            <circle cx="50" cy="40" r="18" fill="#F5B400" />
            <polygon points="10,58 90,58 50,92" fill="#fff" />
          </svg>
          <b>Rise and Shine</b>
        </div>
        <div className="who">
          <b>{profile.full_name || 'Staff member'}</b>
          <span>{isProprietor ? 'Proprietor — All Branches' : `Head Teacher — ${branchName}`}</span>
          <div>
            <button className="logout" onClick={handleLogout}>Sign out</button>
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <h1>Pupil Payment Records</h1>
            <p>{isProprietor ? 'View and edit pupil payment records across all three branches.' : 'Add and track what each pupil has paid for at your branch.'}</p>
          </div>
          <span className="role-pill">{isProprietor ? 'PROPRIETOR VIEW — FULL ACCESS' : 'HEAD TEACHER VIEW'}</span>
        </div>

        <div className="kpis">
          <div className="kpi"><span>Records shown</span><b>{kpis.total}</b></div>
          <div className="kpi"><span>Fully paid</span><b>{kpis.paid}</b></div>
          <div className="kpi"><span>Partial payment</span><b>{kpis.partial}</b></div>
          <div className="kpi"><span>Outstanding</span><b>{kpis.due}</b></div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>{isProprietor ? 'All Branches — Pupil Records' : `${branchName} — Pupil Records`}</h3>
            <button className="add-btn" onClick={() => setFormOpen((v) => !v)}>
              {formOpen ? 'Close form' : '+ Add Payment Record'}
            </button>
          </div>

          {formOpen && (
            <form className="add-form" onSubmit={handleAddRecord}>
              <div className="field">
                <label>Pupil name</label>
                <input required value={form.pupil_name} onChange={(e) => setForm({ ...form, pupil_name: e.target.value })} />
              </div>
              <div className="field">
                <label>Class</label>
                <input value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} placeholder="e.g. Primary 3" />
              </div>
              <div className="field">
                <label>Item paid for</label>
                <input required value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} placeholder="e.g. Tuition Term 2" />
              </div>
              <div className="field">
                <label>Amount</label>
                <input required type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="field">
                <label>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="paid">Fully paid</option>
                  <option value="partial">Partial</option>
                  <option value="due">Outstanding</option>
                </select>
              </div>
              {isProprietor && (
                <div className="field">
                  <label>Branch</label>
                  <select required value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })}>
                    <option value="">Choose branch</option>
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              )}
              <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Record'}</button>
            </form>
          )}
          {notice && <div className="error-msg" style={{ margin: '0 22px 16px' }}>{notice}</div>}

          <div className="filters">
            {isProprietor && (
              <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
                <option value="all">All branches</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}
            <input placeholder="Search pupil name…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <table>
            <thead>
              <tr>
                <th>Pupil</th>
                <th>Branch</th>
                <th>Class</th>
                <th>Item paid for</th>
                <th>Amount</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="pupil-name">{r.pupil_name}</td>
                  <td><span className="branch-tag">{r.branches?.name || '—'}</span></td>
                  <td>{r.class || '—'}</td>
                  <td>{r.item}</td>
                  <td>{Number(r.amount).toLocaleString()} XAF</td>
                  <td><span className={`status ${r.status}`}>{statusLabel[r.status]}</span></td>
                  <td className="row-actions">
                    {isProprietor
                      ? <button className="edit" onClick={() => handleEdit(r)}>Edit</button>
                      : <button className="locked" disabled title="Only the proprietor can edit a saved record">Edit 🔒</button>}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', color: '#888', padding: '28px' }}>No records yet — add the first one above.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {!isProprietor && (
          <div className="lock-note">
            🔒 <div><b>You can add records but cannot edit them once saved.</b> Only the proprietor can correct or update a pupil&apos;s entry after it has been submitted.</div>
          </div>
        )}
      </main>
    </div>
  );
}
