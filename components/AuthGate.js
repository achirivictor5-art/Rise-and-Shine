'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AuthGate({ children }) {
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const hash = window.location.hash || '';
    if (hash.includes('type=invite') || hash.includes('type=recovery')) {
      setNeedsPassword(true);
    }
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setNeedsPassword(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSetPassword(e) {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => {
      window.location.href = '/portal/dashboard';
    }, 1200);
  }

  if (needsPassword) {
    return (
      <div className="login-wrap">
        <div className="login-card">
          <div className="login-logo">
            <div className="mark">
              <svg width="24" height="24" viewBox="0 0 100 100">
                <circle cx="50" cy="40" r="18" fill="#F5B400" />
                <polygon points="10,58 90,58 50,92" fill="#fff" />
              </svg>
            </div>
            <div>
              <b>RISE AND SHINE</b>
              <span>Staff Portal</span>
            </div>
          </div>
          <h2>{done ? 'Password set!' : 'Create your password'}</h2>
          <p className="sub">
            {done ? 'Taking you to your dashboard…' : 'Welcome — choose a password for your staff account.'}
          </p>
          {!done && (
            <>
              {error && <div className="error-msg">{error}</div>}
              <form onSubmit={handleSetPassword}>
                <div className="field">
                  <label>New password</label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className="field">
                  <label>Confirm password</label>
                  <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                </div>
                <button className="login-btn" type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Set Password & Continue'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    );
  }

  return children;
}
