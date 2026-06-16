import React, { useState } from 'react';
import EsslyLogo from '../components/EsslyLogo.jsx';
import ProductCard from '../components/ProductCard.jsx';
import ProductDetailSheet from '../components/ProductDetailSheet.jsx';
import CartSheet from '../components/CartSheet.jsx';
import { useCart } from '../components/CartContext.jsx';
import { CATEGORIES } from '../lib/constants.js';

const Shop = ({ products, onAdminClick }) => {
  const { count } = useCart();
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCart, setShowCart] = useState(false);

  const filtered = products.filter(p => {
    const matchCat = activeCategory === 'all' || p.category === activeCategory;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}>
      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,10,10,0.92)', borderBottom: '1px solid var(--gold-border)', backdropFilter: 'blur(12px)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <EsslyLogo size={30} />
        <button onClick={() => setShowCart(true)} style={{ position: 'relative', width: 42, height: 42, borderRadius: '50%', background: 'var(--gold-dim)', border: '1px solid var(--gold-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
          🛒
          {count > 0 && (
            <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--gold)', color: '#000', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-head)' }}>{count}</span>
          )}
        </button>
      </header>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #111 0%, #1a1500 50%, #0a0a0a 100%)', padding: '28px 20px 24px', borderBottom: '1px solid var(--gold-border)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -20, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,165,32,0.08) 0%, transparent 70%)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700, lineHeight: 1.25, marginBottom: 8 }}>
              Your Everyday Essentials, <span style={{ color: 'var(--gold)' }}>Elevated.</span>
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>Quality products. Everyday value.<br />For you. For your family.</p>
          </div>
          <div style={{ flexShrink: 0, background: 'var(--gold-dim)', border: '1px solid var(--gold-border)', borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-head)', whiteSpace: 'nowrap' }}>🚚 Nationwide</p>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Delivery</p>
          </div>
        </div>
        <p style={{ marginTop: 10, fontSize: 11, color: 'var(--text-dim)' }}>Wholesale &amp; Retail Available</p>
      </div>

      {/* Search */}
      <div style={{ padding: '16px 20px 8px' }}>
        <input className="input-field" placeholder="🔍 Search products..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Category Filter */}
      <div style={{ padding: '8px 20px 12px', overflowX: 'auto', display: 'flex', gap: 8, scrollbarWidth: 'none' }}>
        {[{ id: 'all', label: 'All', icon: '' }, ...CATEGORIES].map(c => (
          <button key={c.id} onClick={() => setActiveCategory(c.id)} style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, border: `1px solid ${activeCategory === c.id ? 'var(--gold)' : 'var(--gold-border)'}`, background: activeCategory === c.id ? 'var(--gold)' : 'transparent', color: activeCategory === c.id ? '#000' : 'var(--text-muted)', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
            {c.icon && `${c.icon} `}{c.label}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div style={{ padding: '0 20px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>✦</div>
            <p style={{ fontFamily: 'var(--font-head)', fontWeight: 600, marginBottom: 6 }}>No products found</p>
            <p style={{ fontSize: 13 }}>Try a different search or category</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {filtered.map(p => <ProductCard key={p.id} product={p} onOpen={setSelectedProduct} />)}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 40, padding: '20px 20px 10px', borderTop: '1px solid var(--gold-border)', textAlign: 'center' }}>
        <EsslyLogo size={22} />
        <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>Quality products. Everyday value.</p>
        <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>www.esslygh.com · @essly</p>
        <button onClick={onAdminClick} style={{ marginTop: 16, fontSize: 11, color: 'rgba(255,255,255,0.15)', display: 'block', margin: '16px auto 0' }}>Admin</button>
      </div>

      {selectedProduct && <ProductDetailSheet product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
      {showCart && <CartSheet onClose={() => setShowCart(false)} />}
    </div>
  );
};

export default Shop;
