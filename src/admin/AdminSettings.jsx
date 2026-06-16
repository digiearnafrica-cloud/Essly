import React from 'react';
import { CATEGORIES } from '../lib/constants.js';

const AdminSettings = ({ products, orders, onLogout }) => {
  const catBreakdown = CATEGORIES.map(c => ({ ...c, count: products.filter(p => p.category === c.id).length }));

  return (
    <div style={{ padding: 20 }}>
      <div style={{ background: 'var(--mid-bg)', border: '1px solid var(--gold-border)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <p style={{ fontFamily: 'var(--font-head)', fontWeight: 700, marginBottom: 12, color: 'var(--gold)' }}>Business Info</p>
        {[['WhatsApp', '+233 599 780 819'], ['Website', 'www.esslygh.com'], ['Instagram', '@essly'], ['Delivery', 'Nationwide (Ghana)']].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(212,165,32,0.1)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{k}</span>
            <span style={{ fontSize: 13 }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--mid-bg)', border: '1px solid var(--gold-border)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <p style={{ fontFamily: 'var(--font-head)', fontWeight: 700, marginBottom: 12, color: 'var(--gold)' }}>Quick Stats</p>
        {[['Total Products', products.length], ['Total Orders', orders.length]].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(212,165,32,0.1)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{k}</span>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{v}</span>
          </div>
        ))}
        <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 12, marginBottom: 8 }}>By Category:</p>
        {catBreakdown.map(c => (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.icon} {c.label}</span>
            <span style={{ fontSize: 12 }}>{c.count}</span>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--mid-bg)', border: '1px solid var(--gold-border)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <p style={{ fontFamily: 'var(--font-head)', fontWeight: 700, marginBottom: 8, color: 'var(--gold)' }}>Admin Password</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>To change your admin password, visit the Firebase Console → Authentication → Users and reset it there.</p>
      </div>

      <button onClick={onLogout} style={{ width: '100%', padding: '13px 0', borderRadius: 10, border: '1px solid rgba(192,64,64,0.4)', background: 'rgba(192,64,64,0.08)', color: '#c04040', fontWeight: 600, fontSize: 14 }}>
        Sign Out
      </button>
    </div>
  );
};

export default AdminSettings;
