import React, { useState, useEffect, lazy, Suspense } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from './firebase.js';

import { ToastProvider } from './components/Toast.jsx';
import { CartProvider } from './components/CartContext.jsx';
import EsslyLogo from './components/EsslyLogo.jsx';
import Shop from './components/Shop.jsx';
import GLOBAL_CSS from './lib/styles.js';
import { SEED_PRODUCTS } from './lib/constants.js';

// Lazy-load admin chunk — only downloaded when admin clicks "Admin"
const AdminPanel = lazy(() => import('./admin/AdminPanel.jsx'));
const AdminLogin = lazy(() => import('./admin/AdminLogin.jsx'));

const AdminFallback = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14 }}>
    <EsslyLogo size={32} />
    <span className="spinner" style={{ width: 24, height: 24, marginTop: 6 }} />
    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading admin…</p>
  </div>
);

export default function App() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [view, setView] = useState('shop'); // shop | admin-login | admin
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Auth state — check once on mount
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setAuthChecked(true);
      if (u && view === 'admin-login') setView('admin');
    });
    return unsub;
  }, []); // eslint-disable-line

  // Shop products — real-time so customers see new stock immediately
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'products')),
      snap => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setProducts(data.length > 0 ? data : SEED_PRODUCTS.map((p, i) => ({ ...p, id: `seed-${i}` })));
        setLoadingProducts(false);
      },
      () => {
        setProducts(SEED_PRODUCTS.map((p, i) => ({ ...p, id: `seed-${i}` })));
        setLoadingProducts(false);
      }
    );
    return unsub;
  }, []);

  const handleAdminClick = () => {
    if (user) setView('admin');
    else setView('admin-login');
  };

  // Initial app shell — show logo + spinner while products load
  if (!authChecked || (loadingProducts && view === 'shop')) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <EsslyLogo size={36} />
          <span className="spinner" style={{ width: 28, height: 28, marginTop: 8 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading products…</p>
        </div>
      </>
    );
  }

  return (
    <ToastProvider>
      <CartProvider>
        <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />

        {view === 'shop' && (
          <Shop products={products} onAdminClick={handleAdminClick} />
        )}

        {(view === 'admin-login' || (view === 'admin' && !user)) && (
          <Suspense fallback={<AdminFallback />}>
            <AdminLogin onBack={() => setView('shop')} />
          </Suspense>
        )}

        {view === 'admin' && user && (
          <Suspense fallback={<AdminFallback />}>
            <AdminPanel onBack={() => setView('shop')} />
          </Suspense>
        )}
      </CartProvider>
    </ToastProvider>
  );
}
