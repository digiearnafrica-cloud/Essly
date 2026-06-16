import React, { useState } from 'react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase.js';
import { useToast } from '../components/Toast.jsx';
import { CATEGORIES } from '../lib/constants.js';
import ProductForm from './ProductForm.jsx';

const AdminProducts = ({ products, onRefresh }) => {
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'products', product.id));
      toast('Product deleted', 'success');
      onRefresh?.();
    } catch {
      toast('Delete failed', 'error');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    onRefresh?.();
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700 }}>Products ({products.length})</h3>
        <button className="gold-btn" style={{ padding: '8px 14px', fontSize: 13 }} onClick={() => { setEditProduct(null); setShowForm(true); }}>+ Add Product</button>
      </div>

      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📦</div>
          <p>No products yet. Add your first product!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {products.map(p => {
            const cat = CATEGORIES.find(c => c.id === p.category);
            return (
              <div key={p.id} style={{ background: 'var(--mid-bg)', border: '1px solid var(--gold-border)', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', background: 'var(--card-bg)', flexShrink: 0 }}>
                  {p.images?.[0]
                    ? <img src={p.images[0]} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{cat?.icon || '📦'}</div>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'var(--font-head)', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{p.productCode} · GHS {p.price?.toFixed(2)}</p>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <span className="badge badge-gold" style={{ fontSize: 9 }}>{cat?.label}</span>
                    {!p.inStock && <span style={{ fontSize: 10, color: '#c04040' }}>Out of Stock</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="ghost-btn" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => { setEditProduct(p); setShowForm(true); }}>Edit</button>
                  <button onClick={() => handleDelete(p)} style={{ padding: '6px 12px', fontSize: 12, border: '1px solid rgba(192,64,64,0.4)', borderRadius: 8, color: '#c04040', background: 'rgba(192,64,64,0.08)' }}>Del</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && <ProductForm product={editProduct} products={products} onClose={handleFormClose} />}
    </div>
  );
};

export default AdminProducts;
