import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.js';
import { useCart } from './CartContext.jsx';
import { useToast } from './Toast.jsx';
import { generateOrderNumber, formatDateLong } from '../lib/utils.js';
import { DELIVERY_OPTIONS, WA_NUMBER } from '../lib/constants.js';

const FIRESTORE_TIMEOUT_MS = 3000;

// Race Firestore save against a timeout — customer is never left hanging
const saveOrderWithTimeout = (orderData) => {
  const save = addDoc(collection(db, 'orders'), orderData);
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), FIRESTORE_TIMEOUT_MS)
  );
  return Promise.race([save, timeout]);
};

const buildWhatsAppMsg = (num, form, items, total) => {
  const deliveryTime = form.deliveryTime === 'Custom date/time' ? form.customTime : form.deliveryTime;
  const dateStr = formatDateLong({ toDate: () => new Date() });
  let msg = `🛍️ *NEW ORDER — ESSLY*\n━━━━━━━━━━━━━━━━━━━━\n📋 *Order #:* ${num}\n📅 *Date:* ${dateStr}\n\n👤 *CUSTOMER DETAILS*\nName: ${form.name}\nPhone: ${form.phone}\nAddress: ${form.address}\nDelivery: ${deliveryTime}\n\n🛒 *ORDER ITEMS*\n`;
  items.forEach(item => {
    msg += `• [${item.productCode}] ${item.name} x${item.quantity}\n  Price: GHS ${item.price.toFixed(2)} × ${item.quantity} = GHS ${(item.price * item.quantity).toFixed(2)}\n`;
    if (item.imageUrl) msg += `  🖼️ ${item.imageUrl}\n`;
  });
  msg += `\n━━━━━━━━━━━━━━━━━━━━\n💰 *TOTAL: GHS ${total.toFixed(2)}*\n━━━━━━━━━━━━━━━━━━━━`;
  if (form.note) msg += `\n📝 Note: ${form.note}`;
  msg += `\n\n_Wholesale & Retail Available_\n_www.esslygh.com | @essly_`;
  return msg;
};

const CartSheet = ({ onClose }) => {
  const { cart, updateQty, removeFromCart, total, clearCart } = useCart();
  const toast = useToast();
  const [step, setStep] = useState('cart');
  const [form, setForm] = useState({
    name: '', phone: '', address: '',
    deliveryTime: 'As soon as possible', customTime: '', note: '',
  });
  const [loading, setLoading] = useState(false);
  const [orderNum, setOrderNum] = useState('');

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      toast('Please fill all required fields', 'error'); return;
    }
    if (form.deliveryTime === 'Custom date/time' && !form.customTime.trim()) {
      toast('Please enter your preferred delivery time', 'error'); return;
    }
    setLoading(true);
    const num = generateOrderNumber();
    const deliveryTime = form.deliveryTime === 'Custom date/time' ? form.customTime : form.deliveryTime;
    const items = cart.map(i => ({
      productId: i.id || '',
      productCode: i.productCode || '',
      name: i.name,
      price: i.price,
      quantity: i.qty,
      imageUrl: i.images?.[0] || null,
    }));

    // Try to save to Firestore — if it takes >3s, skip it and open WhatsApp anyway
    try {
      await saveOrderWithTimeout({
        orderNumber: num,
        status: 'pending',
        customerName: form.name,
        customerPhone: form.phone,
        deliveryAddress: form.address,
        deliveryTime,
        items,
        total,
        note: form.note || '',
        createdAt: serverTimestamp(),
        completedAt: null,
      });
    } catch (err) {
      // Timeout or Firestore error — log quietly, WhatsApp still opens
      console.warn('Firestore save skipped:', err.message);
      toast('Order saved to WhatsApp only (offline mode)', 'info');
    }

    // Always open WhatsApp regardless of Firestore outcome
    const msg = buildWhatsAppMsg(num, form, items, total);
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
    clearCart();
    setOrderNum(num);
    setStep('success');
    setLoading(false);
  };

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet" style={{ maxHeight: '95vh' }}>
        <div className="sheet-handle" />
        <div style={{ padding: '20px 20px 40px' }}>

          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
              <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 22, marginBottom: 8 }}>Order Placed!</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>Order <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{orderNum}</span> sent to WhatsApp.</p>
              <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 28 }}>Complete your order by sending the WhatsApp message.</p>
              <button className="gold-btn" style={{ width: '100%', padding: '14px 0', fontSize: 15 }} onClick={onClose}>Continue Shopping</button>
            </div>
          )}

          {step === 'cart' && (
            <>
              <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Your Cart</h2>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
                  <p>Your cart is empty</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                    {cart.map(item => (
                      <div key={item.id} style={{ display: 'flex', gap: 12, background: 'var(--mid-bg)', borderRadius: 10, padding: 12, border: '1px solid var(--gold-border)' }}>
                        <div style={{ width: 56, height: 56, flexShrink: 0, borderRadius: 8, overflow: 'hidden', background: 'var(--card-bg)' }}>
                          {item.images?.[0]
                            ? <img src={item.images[0]} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📦</div>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontFamily: 'var(--font-head)', fontSize: 13, fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>{item.productCode}</p>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div className="qty-control">
                              <button className="qty-btn" onClick={() => updateQty(item.id, item.qty - 1)}>−</button>
                              <span className="qty-num">{item.qty}</span>
                              <button className="qty-btn" onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                            </div>
                            <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 14 }}>GHS {(item.price * item.qty).toFixed(2)}</span>
                          </div>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} style={{ color: 'var(--text-dim)', fontSize: 18, alignSelf: 'flex-start', padding: 2 }}>✕</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderTop: '1px solid var(--gold-border)', borderBottom: '1px solid var(--gold-border)', marginBottom: 20 }}>
                    <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600 }}>Total</span>
                    <span style={{ fontFamily: 'var(--font-head)', color: 'var(--gold)', fontWeight: 700, fontSize: 18 }}>GHS {total.toFixed(2)}</span>
                  </div>
                  <button className="gold-btn" style={{ width: '100%', padding: '14px 0', fontSize: 15 }} onClick={() => setStep('checkout')}>
                    Proceed to Checkout
                  </button>
                </>
              )}
            </>
          )}

          {step === 'checkout' && (
            <>
              <button onClick={() => setStep('cart')} style={{ color: 'var(--gold)', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>← Back to Cart</button>
              <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Your Details</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Full Name *</label>
                  <input className="input-field" placeholder="e.g. Kofi Mensah" value={form.name} onChange={e => setField('name', e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Phone Number *</label>
                  <input className="input-field" placeholder="+233 XX XXX XXXX" type="tel" value={form.phone} onChange={e => setField('phone', e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Delivery Address *</label>
                  <input className="input-field" placeholder="e.g. 12 Main Street, Accra" value={form.address} onChange={e => setField('address', e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Preferred Delivery Time</label>
                  <select className="input-field" value={form.deliveryTime} onChange={e => setField('deliveryTime', e.target.value)}>
                    {DELIVERY_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                {form.deliveryTime === 'Custom date/time' && (
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Specify Date/Time</label>
                    <input className="input-field" placeholder="e.g. Saturday 14 June, 3pm" value={form.customTime} onChange={e => setField('customTime', e.target.value)} />
                  </div>
                )}
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Order Note (optional)</label>
                  <textarea className="input-field" placeholder="Any special instructions..." rows={3} value={form.note} onChange={e => setField('note', e.target.value)} style={{ resize: 'vertical' }} />
                </div>
                <div style={{ background: 'var(--mid-bg)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--gold-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{cart.reduce((s, i) => s + i.qty, 0)} item(s)</span>
                    <span style={{ fontFamily: 'var(--font-head)', color: 'var(--gold)', fontWeight: 700, fontSize: 16 }}>GHS {total.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  className="gold-btn"
                  style={{ width: '100%', padding: '15px 0', fontSize: 15, background: 'linear-gradient(135deg, #25D366 0%, #1da851 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading
                    ? <><span className="spinner" style={{ width: 16, height: 16, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Opening WhatsApp...</>
                    : <>📲 Send Order on WhatsApp</>}
                </button>
                {loading && (
                  <p style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginTop: -8 }}>
                    Saving your order… WhatsApp will open in a moment.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default CartSheet;
