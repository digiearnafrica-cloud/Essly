import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase.js';
import EsslyLogo from '../components/EsslyLogo.jsx';

const AdminLogin = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) { setError('Please enter email and password.'); return; }
    setLoading(true); setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged in App.jsx handles routing to admin
    } catch {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <EsslyLogo size={36} />
          <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 14 }}>Admin Panel</p>
        </div>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--gold-border)', borderRadius: 16, padding: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 20, marginBottom: 20 }}>Sign In</h2>
          {error && (
            <div style={{ background: 'rgba(192,64,64,0.1)', border: '1px solid rgba(192,64,64,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#e07070', marginBottom: 16 }}>{error}</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input className="input-field" type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            <input className="input-field" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            <button className="gold-btn" style={{ padding: '13px 0', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={handleLogin} disabled={loading}>
              {loading ? <><span className="spinner" style={{ width: 15, height: 15 }} /> Signing in...</> : 'Sign In'}
            </button>
          </div>
        </div>
        <button onClick={onBack} style={{ marginTop: 20, color: 'var(--text-dim)', fontSize: 13, display: 'block', textAlign: 'center', width: '100%' }}>← Back to Shop</button>
      </div>
    </div>
  );
};

export default AdminLogin;
