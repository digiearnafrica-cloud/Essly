import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../firebase.js';
import EsslyLogo from '../components/EsslyLogo.jsx';
import { useToast } from '../components/Toast.jsx';
import AdminProducts from './AdminProducts.jsx';
import AdminOrders from './AdminOrders.jsx';
import AdminSettings from './AdminSettings.jsx';
import { SEED_PRODUCTS } from '../lib/constants.js';

// getDocs instead of onSnapshot — admin data doesn't need real-time push
const fetchProducts = async () => {
  const snap = await getDocs(collection(db, 'products'));
  const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  data.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  return data.length > 0 ? data : SEED_PRODUCTS.map((p, i) => ({ ...p, id: `seed-${i}` }));
};

const fetchOrders = async () => {
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

const AdminPanel = ({ onBack }) => {
  const toast = useToast();
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const refreshProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      setProducts(await fetchProducts());
    } catch {
      toast('Failed to load products', 'error');
    } finally {
      setLoadingProducts(false);
    }
  }, [toast]);

  const refreshOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      setOrders(await fetchOrders());
    } catch {
      toast('Failed to load orders', 'error');
    } finally {
      setLoadingOrders(false);
    }
  }, [toast]);

  // Load data once on mount — no persistent listeners
  useEffect(() => { refreshProducts(); }, [refreshProducts]);
  useEffect(() => { refreshOrders(); }, [refreshOrders]);

  const handleLogout = async () => {
    await signOut(auth);
    onBack();
  };

  const LoadingPlaceholder = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 12, color: 'var(--text-muted)' }}>
      <span className="spinner" />
      <span style={{ fontSize: 13 }}>Loading…</span>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ background: 'var(--card-bg)', borderBottom: '1px solid var(--gold-border)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} style={{ color: 'var(--text-muted)', fontSize: 20, marginRight: 4 }}>←</button>
          <EsslyLogo size={26} />
          <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 4 }}>Admin</span>
        </div>
        <button onClick={handleLogout} style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sign Out</button>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {[{ id: 'products', label: '📦 Products' }, { id: 'orders', label: '📋 Orders' }, { id: 'settings', label: '⚙️ Settings' }].map(t => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {tab === 'products' && (loadingProducts ? <LoadingPlaceholder /> : <AdminProducts products={products} onRefresh={refreshProducts} />)}
      {tab === 'orders' && (loadingOrders ? <LoadingPlaceholder /> : <AdminOrders orders={orders} onRefresh={refreshOrders} />)}
      {tab === 'settings' && <AdminSettings products={products} orders={orders} onLogout={handleLogout} />}
    </div>
  );
};

export default AdminPanel;
