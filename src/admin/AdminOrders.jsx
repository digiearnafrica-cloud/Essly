import React, { useState } from 'react';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.js';
import { useToast } from '../components/Toast.jsx';
import { formatDate } from '../lib/utils.js';

const OrderDetailSheet = ({ order, onClose, onUpdated }) => {
  const toast = useToast();
  const [completing, setCompleting] = useState(false);

  const handleComplete = async () => {
    if (!window.confirm('Mark this order as completed?')) return;
    setCompleting(true);
    try {
      await updateDoc(doc(db, 'orders', order.id), { status: 'completed', completedAt: serverTimestamp() });
      toast('Order marked as completed!', 'success');
      onUpdated?.();
      onClose();
    } catch {
      toast('Update failed', 'error');
    } finally {
      setCompleting(false);
    }
  };

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet" style={{ maxHeight: '95vh' }}>
        <div className="sheet-handle" />
        <div style={{ padding: '20px 20px 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--gold)', fontSize: 16 }}>{order.orderNumber}</span>
              <div style={{ marginTop: 4 }}><span className={`badge badge-${order.status}`}>{order.status}</span></div>
            </div>
            <button onClick={onClose} style={{ color: 'var(--text-muted)', fontSize: 20 }}>✕</button>
          </div>

          <div style={{ background: 'var(--mid-bg)', borderRadius: 10, padding: 14, border: '1px solid var(--gold-border)', marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--gold)' }}>Customer Details</p>
            {[['Name', order.customerName], ['Phone', order.customerPhone], ['Address', order.deliveryAddress], ['Delivery', order.deliveryTime]].map(([k, v]) => (
              <p key={k} style={{ fontSize: 13, marginBottom: 4 }}><span style={{ color: 'var(--text-muted)' }}>{k}:</span> {v}</p>
            ))}
            {order.note && <p style={{ fontSize: 13 }}><span style={{ color: 'var(--text-muted)' }}>Note:</span> {order.note}</p>}
          </div>

          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold)', marginBottom: 10 }}>Order Items</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {order.items?.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, background: 'var(--mid-bg)', borderRadius: 10, padding: '10px 12px', border: '1px solid var(--gold-border)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 6, overflow: 'hidden', background: 'var(--card-bg)', flexShrink: 0 }}>
                  {item.imageUrl
                    ? <img src={item.imageUrl} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📦</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>{item.productCode} · x{item.quantity}</p>
                </div>
                <p style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 700 }}>GHS {(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid var(--gold-border)', marginBottom: 16 }}>
            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600 }}>Total</span>
            <span style={{ fontFamily: 'var(--font-head)', color: 'var(--gold)', fontWeight: 700, fontSize: 18 }}>GHS {order.total?.toFixed(2)}</span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 16 }}>Placed: {formatDate(order.createdAt)}</p>

          {order.status === 'pending' && (
            <button className="gold-btn" style={{ width: '100%', padding: '13px 0', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={handleComplete} disabled={completing}>
              {completing ? <><span className="spinner" style={{ width: 15, height: 15 }} /> Updating...</> : '✓ Mark as Completed'}
            </button>
          )}
          {order.status === 'completed' && order.completedAt && (
            <p style={{ fontSize: 12, color: '#4CAF50', textAlign: 'center' }}>✓ Completed on {formatDate(order.completedAt)}</p>
          )}
        </div>
      </div>
    </>
  );
};

const AdminOrders = ({ orders, onRefresh }) => {
  const toast = useToast();
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const filtered = orders.filter(o => filter === 'all' || o.status === filter);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayCount = orders.filter(o => {
    if (!o.createdAt) return false;
    const d = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
    return d >= today;
  }).length;

  const handleComplete = async (order) => {
    if (!window.confirm('Mark as completed?')) return;
    try {
      await updateDoc(doc(db, 'orders', order.id), { status: 'completed', completedAt: serverTimestamp() });
      toast('Order completed!', 'success');
      onRefresh?.();
    } catch {
      toast('Update failed', 'error');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
        {[['Total', orders.length], ['Pending', orders.filter(o => o.status === 'pending').length], ['Done', orders.filter(o => o.status === 'completed').length], ['Today', todayCount]].map(([label, value]) => (
          <div key={label} style={{ background: 'var(--mid-bg)', border: '1px solid var(--gold-border)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, color: 'var(--gold)' }}>{value}</p>
            <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filter + Refresh */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        {['all', 'pending', 'completed'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: `1px solid ${filter === f ? 'var(--gold)' : 'var(--gold-border)'}`, background: filter === f ? 'var(--gold-dim)' : 'transparent', color: filter === f ? 'var(--gold)' : 'var(--text-muted)', transition: 'all 0.2s', textTransform: 'capitalize' }}>{f}</button>
        ))}
        <button onClick={onRefresh} style={{ marginLeft: 'auto', padding: '7px 12px', fontSize: 12, color: 'var(--text-dim)', border: '1px solid var(--gold-border)', borderRadius: 20 }}>↻ Refresh</button>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
          <p>No orders yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(order => (
            <div key={order.id} style={{ background: 'var(--mid-bg)', border: '1px solid var(--gold-border)', borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--font-head)', color: 'var(--gold)', fontWeight: 700, fontSize: 14 }}>{order.orderNumber}</span>
                <span className={`badge badge-${order.status}`}>{order.status}</span>
              </div>
              <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{order.customerName}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{order.customerPhone} · {order.items?.length || 0} item(s)</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: 'var(--gold)', fontWeight: 700 }}>GHS {order.total?.toFixed(2)}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>{formatDate(order.createdAt)}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="ghost-btn" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setSelectedOrder(order)}>View</button>
                  {order.status === 'pending' && (
                    <button onClick={() => handleComplete(order)} style={{ padding: '6px 12px', fontSize: 12, borderRadius: 8, border: '1px solid rgba(45,138,78,0.4)', background: 'rgba(45,138,78,0.1)', color: '#4CAF50' }}>✓ Done</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedOrder && (
        <OrderDetailSheet order={selectedOrder} onClose={() => setSelectedOrder(null)} onUpdated={onRefresh} />
      )}
    </div>
  );
};

export default AdminOrders;
