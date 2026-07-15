'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

const CLASSES = ['Pre-Nursery', 'Nursery 1', 'Nursery 2', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'];

const ITEMS = [
  { key: 'paid_uniforms', label: 'Uniforms' },
  { key: 'paid_school_fee', label: 'School Fee' },
  { key: 'paid_registration', label: 'Registration' },
  { key: 'paid_badges', label: 'Badges' },
  { key: 'paid_books', label: 'Books' },
  { key: 'paid_pullovers', label: 'Pullovers' },
  { key: 'paid_sports_wear', label: 'Sports Wear' },
  { key: 'paid_bus_fees', label: 'Bus Fees' },
];

const emptyForm = {
  full_name: '', class: 'Pre-Nursery', date_of_birth: '', gender: '',
  health_info: '', emergency_contact_name: '', emergency_contact_phone: '',
  emergency_contact_relation: '', branch_id: '',
};

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState('');
  const [branches, setBranches] = useState([]);
  const [pupils, setPupils] = useState([]);
  const [classFilter, setClassFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      router.replace('/portal/login');
      return;
    }
    const userId = sessionData.session.user.id;

    const { data: profileRow, error: profileFetchError } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (profileFetchError) setProfileError(profileFetchError.message || JSON.stringify(profileFetchError));
    setProfile(profileRow);

    const { data: branchRows } = await supabase.from('branches').select('*').order('name');
    setBranches(branchRows || []);
    if (profileRow?.role === 'head_teacher' && profileRow.branch_id) {
      setForm((f) => ({ ...f, branch_id: profileRow.branch_id }));
    }

    await refreshPupils();
    setLoading(false);
  }, [router]);

  async function refreshPupils() {
    const { data } = await supabase.from('pupils').select('*').order('class').order('full_name');
    setPupils(data || []);
  }

  useEffect(() => { load(); }, [load]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/portal/login');
  }

  function toggleLocal(pupilId, key) {
    setPupils((prev) => prev.map((p) => (p.id === pupilId ? { ...p, [key]: !p[key] } : p)));
  }

  async function saveItemNow(pupil, key, value) {
    const { error } = await supabase.from('pupils').update({ [key]: value }).eq('id', pupil.id);
    if (error) alert(error.message);
  }

  async function confirmAndLock(pupil) {
    const updates = {};
    ITEMS.forEach((it) => { updates[it.key] = !!pupil[it.key]; });
    updates.locked = true;
    updates.checked_by = profile.id;
    updates.checked_at = new Date().toISOString();
    const { error } = await supabase.from('pupils').update(updates).eq('id', pupil.id);
    if (error) {
      alert(error.message);
      return;
    }
    refreshPupils();
  }

  async function handleUnlock(pupil) {
    const { error } = await supabase.from('pupils').update({ locked: false }).eq('id', pupil.id);
    if (error) alert(error.message);
    refreshPupils();
  }

  async function handleAddPupil(e) {
    e.preventDefault();
    setSaving(true);
    setNotice('');
    const branch_id = profile.role === 'head_teacher' ? profile.branch_id : form.branch_id;
    if (!branch_id) {
      setNotice('Please choose a branch.');
      setSaving(false);
      return;
    }
    const { error } = await supabase.from('pupils').insert({
      branch_id,
      full_name: form.full_name,
      class: form.class,
      date_of_birth: form.date_of_birth || null,
      gender: form.gender || null,
      health_info: form.health_info || null,
      emergency_contact_name: form.emergency_contact_name || null,
      emergency_contact_phone: form.emergency_contact_phone || null,
      emergency_contact_relation: form.emergency_contact_relation || null,
    });
    setSaving(false);
    if (error) {
      setNotice(error.message);
      return;
    }
    setForm({ ...emptyForm, branch_id: profile.role === 'head_teacher' ? profile.branch_id : '' });
    setAddOpen(false);
    refreshPupils();
  }

  if (loading) return <div style={{ padding: 40, fontFamily: 'sans-serif' }}>Loading…</div>;

  if (!profile) {
    return (
      <div style={{ padding: 40 }}>
        <p>Your account has no profile yet. Ask the proprietor to check Table Editor → profiles.</p>
        {profileError && <p style={{ color: '#b23434', fontFamily: 'monospace', marginTop: 12 }}>Technical detail: {profileError}</p>}
      </div>
    );
  }

  const isProprietor = profile.role === 'proprietor';
  const branchName = branches.find((b) => b.id === profile.branch_id)?.name || '—';

  const filtered = pupils.filter((p) => {
    const matchesClass = classFilter === 'all' || p.class === classFilter;
    const matchesSearch = p.full_name.toLowerCase().includes(search.toLowerCase());
    return matchesClass && matchesSearch;
  });

  const kpis = {
    total: filtered.length,
    locked: filtered.filter((p) => p.locked).length,
    pending: filtered.filter((p) => !p.locked).length,
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <svg width="22" height="22" viewBox="0 0 100 100"><circle cx="50" cy="40" r="18" fill="#F5B400" /><polygon points="10,58 90,58 50,92" fill="#fff" /></svg>
          <b>Rise and Shine</b>
        </div>
        <div className="who">
          <b>{profile.full_name || 'Staff member'}</b>
          <span>{isProprietor ? 'Proprietor — All Branches' : `Head Teacher — ${branchName}`}</span>
          <div><button className="logout" onClick={handleLogout}>Sign out</button></div>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <h1>Pupil Roster & Payment Checklist</h1>
            <p>{isProprietor ? 'View, edit, and manage pupils across all three branches.' : 'Tick the items each pupil has paid for, then confirm to lock.'}</p>
          </div>
          <span className="role-pill">{isProprietor ? 'PROPRIETOR VIEW — FULL ACCESS' : 'HEAD TEACHER VIEW'}</span>
        </div>

        <div className="kpis">
          <div className="kpi"><span>Pupils shown</span><b>{kpis.total}</b></div>
          <div className="kpi"><span>Confirmed & locked</span><b>{kpis.locked}</b></div>
          <div className="kpi"><span>Pending confirmation</span><b>{kpis.pending}</b></div>
          <div className="kpi"><span>Branch</span><b style={{ fontSize: '1.1rem' }}>{isProprietor ? 'All' : branchName}</b></div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>{isProprietor ? 'All Branches — Pupils' : `${branchName} — Pupils`}</h3>
            {isProprietor && (
              <button className="add-btn" onClick={() => setAddOpen((v) => !v)}>{addOpen ? 'Close form' : '+ Add Pupil'}</button>
            )}
          </div>

          {addOpen && isProprietor && (
            <form onSubmit={handleAddPupil} style={{ padding: '20px 22px', borderBottom: '1px solid var(--line)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div className="field"><label>Full name</label><input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
              <div className="field"><label>Class</label>
                <select value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })}>
                  {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="field"><label>Branch</label>
                <select required value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })}>
                  <option value="">Choose branch</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="field"><label>Date of birth</label><input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} /></div>
              <div className="field"><label>Gender</label><input value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} placeholder="e.g. Male / Female" /></div>
              <div className="field"><label>Emergency contact name</label><input value={form.emergency_contact_name} onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })} /></div>
              <div className="field"><label>Emergency contact phone</label><input value={form.emergency_contact_phone} onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })} /></div>
              <div className="field"><label>Relation to pupil</label><input value={form.emergency_contact_relation} onChange={(e) => setForm({ ...form, emergency_contact_relation: e.target.value })} placeholder="e.g. Mother, Father, Guardian" /></div>
              <div className="field" style={{ gridColumn: 'span 3' }}><label>Health information</label>
                <textarea style={{ width: '100%', minHeight: 70, padding: 12, borderRadius: 10, border: '1.5px solid var(--line)' }} value={form.health_info} onChange={(e) => setForm({ ...form, health_info: e.target.value })} placeholder="Allergies, conditions, medication, or 'None'" />
              </div>
              <button type="submit" disabled={saving} style={{ gridColumn: 'span 1', background: 'var(--forest)', color: '#fff', border: 'none', borderRadius: 9, padding: 12, fontWeight: 700 }}>
                {saving ? 'Saving…' : 'Add Pupil'}
              </button>
            </form>
          )}
          {notice && <div className="error-msg" style={{ margin: '0 22px 16px' }}>{notice}</div>}

          <div className="filters">
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
              <option value="all">All classes</option>
              {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input placeholder="Search pupil name…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div>
            {filtered.map((p) => {
              const canEditThis = isProprietor || !p.locked;
              return (
                <div key={p.id} style={{ borderBottom: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <button onClick={() => setOpenId(openId === p.id ? null : p.id)} style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}>
                        <span className="pupil-name">{p.full_name}</span>{' '}
                        <span className="branch-tag" style={{ marginLeft: 8 }}>{p.class}</span>
                        {isProprietor && <span className="branch-tag" style={{ marginLeft: 6 }}>{branches.find((b) => b.id === p.branch_id)?.name}</span>}
                      </button>
                      {p.locked ? (
                        <div style={{ fontSize: '0.78rem', color: '#1a7a3d', marginTop: 4 }}>🔒 Confirmed{p.checked_at ? ` on ${new Date(p.checked_at).toLocaleDateString()}` : ''}</div>
                      ) : (
                        <div style={{ fontSize: '0.78rem', color: '#a6710a', marginTop: 4 }}>Pending confirmation</div>
                      )}
                    </div>
                    {!isProprietor && !p.locked && (
                      <button className="add-btn" onClick={() => confirmAndLock(p)}>Confirm & Lock</button>
                    )}
                    {isProprietor && p.locked && (
                      <button className="edit" onClick={() => handleUnlock(p)} style={{ fontWeight: 700, fontSize: '0.8rem' }}>Unlock for editing</button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, padding: '0 22px 16px' }}>
                    {ITEMS.map((it) => (
                      <label key={it.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.86rem', opacity: canEditThis ? 1 : 0.55 }}>
                        <input
                          type="checkbox"
                          checked={!!p[it.key]}
                          disabled={!canEditThis}
                          onChange={(e) => {
                            if (isProprietor) {
                              toggleLocal(p.id, it.key);
                              saveItemNow(p, it.key, e.target.checked);
                            } else {
                              toggleLocal(p.id, it.key);
                            }
                          }}
                        />
                        {it.label}
                      </label>
                    ))}
                  </div>

                  {openId === p.id && (
                    <div style={{ background: 'var(--sage)', margin: '0 22px 18px', borderRadius: 12, padding: '16px 18px', fontSize: '0.88rem', color: '#3d4136' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                        <div><b>Date of birth:</b> {p.date_of_birth || '—'}</div>
                        <div><b>Gender:</b> {p.gender || '—'}</div>
                        <div><b>Emergency contact:</b> {p.emergency_contact_name || '—'}</div>
                        <div><b>Contact phone:</b> {p.emergency_contact_phone || '—'}</div>
                        <div><b>Relation:</b> {p.emergency_contact_relation || '—'}</div>
                      </div>
                      <div style={{ marginTop: 10 }}><b>Health information:</b> {p.health_info || 'None recorded'}</div>
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', color: '#888', padding: 28 }}>No pupils found. {isProprietor ? 'Add one above.' : 'Ask the proprietor to add pupils to your branch.'}</div>
            )}
          </div>
        </div>

        {!isProprietor && (
          <div className="lock-note">
            🔒 <div><b>Once you confirm a pupil's checklist, you can no longer edit it.</b> Only the proprietor can unlock and correct it afterward.</div>
          </div>
        )}
      </main>
    </div>
  );
}
