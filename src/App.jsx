import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc,
  serverTimestamp, query, orderBy,
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged,
} from 'firebase/auth';
import { db, auth } from './firebase.js';

/* ─────────────────────────────────────────────
   GLOBAL STYLES
───────────────────────────────────────────── */
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0a0a0a;
    --card-bg: #141414;
    --mid-bg: #1c1c1c;
    --gold: #D4A520;
    --gold-light: #E8C97A;
    --gold-dark: #9A7010;
    --gold-dim: rgba(212,165,32,0.12);
    --gold-border: rgba(212,165,32,0.22);
    --text: #FFFFFF;
    --text-muted: rgba(255,255,255,0.50);
    --text-dim: rgba(255,255,255,0.28);
    --danger: #c04040;
    --success: #2d8a4e;
    --font-head: 'Sora', sans-serif;
    --font-body: 'Inter', sans-serif;
  }
  html { font-size: 16px; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-body);
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }
  input, textarea, select, button { font-family: inherit; }
  button { cursor: pointer; border: none; background: none; }
  img { display: block; max-width: 100%; }
  a { color: inherit; text-decoration: none; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: var(--card-bg); }
  ::-webkit-scrollbar-thumb { background: var(--gold-border); border-radius: 2px; }

  @keyframes slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes toastIn {
    from { transform: translateY(120%); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .sheet-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.75);
    z-index: 200; animation: fadeIn 0.2s ease;
    backdrop-filter: blur(4px);
  }
  .sheet {
    position: fixed; bottom: 0; left: 0; right: 0;
    background: var(--card-bg);
    border-top: 1px solid var(--gold-border);
    border-radius: 20px 20px 0 0;
    z-index: 201;
    animation: slideUp 0.3s cubic-bezier(0.16,1,0.3,1);
    max-height: 92vh;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
  .sheet-handle {
    width: 40px; height: 4px;
    background: var(--gold-border);
    border-radius: 2px;
    margin: 12px auto 0;
  }

  .gold-btn {
    background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%);
    color: #000;
    font-family: var(--font-head);
    font-weight: 600;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;
  }
  .gold-btn:hover { opacity: 0.88; transform: translateY(-1px); }
  .gold-btn:active { transform: translateY(0); }
  .gold-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .ghost-btn {
    background: transparent;
    color: var(--gold);
    border: 1px solid var(--gold-border);
    font-family: var(--font-head);
    font-weight: 600;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.2s, transform 0.15s;
  }
  .ghost-btn:hover { background: var(--gold-dim); transform: translateY(-1px); }

  .spinner {
    display: inline-block;
    width: 18px; height: 18px;
    border: 2px solid var(--gold-border);
    border-top-color: var(--gold);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  .badge {
    display: inline-flex; align-items: center;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .badge-gold { background: var(--gold-dim); color: var(--gold); border: 1px solid var(--gold-border); }
  .badge-pending { background: rgba(220,120,20,0.15); color: #E07820; border: 1px solid rgba(220,120,20,0.3); }
  .badge-completed { background: rgba(45,138,78,0.15); color: #4CAF50; border: 1px solid rgba(45,138,78,0.3); }

  .input-field {
    width: 100%;
    background: var(--mid-bg);
    border: 1px solid var(--gold-border);
    border-radius: 10px;
    color: var(--text);
    font-size: 14px;
    padding: 12px 14px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .input-field:focus {
    border-color: var(--gold);
    box-shadow: 0 0 0 3px var(--gold-dim);
  }
  .input-field::placeholder { color: var(--text-dim); }
  select.input-field option { background: var(--card-bg); }

  .tab-bar {
    display: flex;
    border-bottom: 1px solid var(--gold-border);
    padding: 0 20px;
    gap: 4px;
    background: var(--card-bg);
  }
  .tab-btn {
    padding: 14px 16px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-muted);
    border-bottom: 2px solid transparent;
    transition: color 0.2s, border-color 0.2s;
    white-space: nowrap;
  }
  .tab-btn.active { color: var(--gold); border-bottom-color: var(--gold); }

  .qty-control {
    display: flex; align-items: center; gap: 0;
    background: var(--mid-bg);
    border: 1px solid var(--gold-border);
    border-radius: 8px;
    overflow: hidden;
  }
  .qty-btn {
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    color: var(--gold); font-size: 18px; font-weight: 600;
    transition: background 0.15s;
    flex-shrink: 0;
  }
  .qty-btn:hover { background: var(--gold-dim); }
  .qty-num {
    min-width: 28px; text-align: center;
    font-size: 14px; font-weight: 600;
    color: var(--text);
  }

  @media (max-width: 600px) {
    .sheet { border-radius: 16px 16px 0 0; }
  }
`;

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const CATEGORIES = [
  { id: 'baby-care',     label: 'Baby Care',      icon: '🍼', prefix: 'BC' },
  { id: 'personal-care', label: 'Personal Care',  icon: '🧴', prefix: 'PC' },
  { id: 'household',     label: 'Household',       icon: '🧻', prefix: 'HH' },
  { id: 'food-grocery',  label: 'Food & Grocery',  icon: '🛒', prefix: 'FG' },
  { id: 'cleaning',      label: 'Cleaning',         icon: '🧽', prefix: 'CL' },
];

const DELIVERY_OPTIONS = [
  'As soon as possible',
  'Today morning',
  'Today afternoon',
  'Today evening',
  'Tomorrow morning',
  'Tomorrow afternoon',
  'Custom date/time',
];

const SEED_PRODUCTS = [
  { name: 'Pampers Baby Dry Size 3 (44 pcs)', category: 'baby-care', price: 120, productCode: 'ESS-BC-001', description: 'Trusted Pampers protection for your baby. Superior absorbency with a snug fit for active movement. Keeps your little one dry and comfortable all day and night.', images: [], videoUrl: null, inStock: true, featured: false },
  { name: 'Pampers Sensitive Wipes (56 pcs)', category: 'baby-care', price: 45, productCode: 'ESS-BC-002', description: 'Gentle wipes for delicate baby skin. Hypoallergenic and fragrance-free, perfect for newborns and sensitive skin types.', images: [], videoUrl: null, inStock: true, featured: false },
  { name: 'NIVEA Black & White Deodorant', category: 'personal-care', price: 38, productCode: 'ESS-PC-001', description: 'Long-lasting 48h protection against sweat and body odour. Dermatologically tested formula that is gentle on skin.', images: [], videoUrl: null, inStock: true, featured: false },
  { name: 'Dove Body Lotion 400ml', category: 'personal-care', price: 55, productCode: 'ESS-PC-002', description: 'Deeply nourishing body lotion that leaves skin feeling soft and moisturised for up to 24 hours.', images: [], videoUrl: null, inStock: true, featured: false },
  { name: 'Softcare Tissue (10 rolls)', category: 'household', price: 30, productCode: 'ESS-HH-001', description: 'Soft, strong household tissue trusted by families across Ghana. Great value, great quality for everyday use.', images: [], videoUrl: null, inStock: true, featured: false },
  { name: 'Colgate Total Toothpaste', category: 'personal-care', price: 22, productCode: 'ESS-PC-003', description: 'Complete oral care protection for the whole family. Fights cavities, whitens teeth, and freshens breath all day.', images: [], videoUrl: null, inStock: true, featured: false },
];

const WA_NUMBER = '233599780819';

/* ─────────────────────────────────────────────
   UTILITY FUNCTIONS
───────────────────────────────────────────── */
const generateProductCode = (category, existingProducts) => {
  const cat = CATEGORIES.find(c => c.id === category);
  const prefix = cat ? cat.prefix : 'GN';
  const catProducts = existingProducts.filter(p => p.category === category);
  const num = String(catProducts.length + 1).padStart(3, '0');
  return `ESS-${prefix}-${num}`;
};

const generateOrderNumber = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'ESS-';
  for (let i = 0; i < 6; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
};

const generateDescription = (name, category) => {
  const templates = {
    'baby-care': [
      `Keep your little one comfortable and protected with ${name}. Designed with gentle, skin-safe materials that provide reliable protection throughout the day and night. Perfect for newborns and growing babies, offering superior absorbency and a snug fit for active movement.`,
      `${name} is specially formulated for your baby's delicate skin. Provides long-lasting protection and comfort, keeping your baby dry, happy, and healthy. Made with trusted ingredients that are gentle, hypoallergenic, and dermatologically tested.`,
    ],
    'personal-care': [
      `Elevate your daily routine with ${name}. A premium personal care essential crafted to keep you feeling fresh, confident, and at your best all day long. Dermatologically tested and suitable for everyday use.`,
      `${name} delivers effective, long-lasting results you can count on. Whether for daily freshness or targeted care, this product is formulated to meet the needs of modern lifestyles — reliable, gentle, and effective.`,
    ],
    'household': [
      `${name} is a household essential built for everyday reliability. Strong, durable, and effective — designed to make your home cleaner and your daily routines easier. Great value for families of all sizes.`,
      `Stock up on ${name} and never run short of a daily essential. Trusted by households across Ghana for its quality, value, and consistent performance in everyday use.`,
    ],
    'food-grocery': [
      `${name} brings quality and great taste to your everyday meals. Sourced and selected for freshness and value, this product is a staple for Ghanaian households who demand the best for their families.`,
      `Add ${name} to your cart and enjoy the quality your family deserves. Fresh, reliable, and excellent value — a must-have for every Ghanaian home.`,
    ],
    'cleaning': [
      `${name} makes cleaning easier and more effective. Formulated with powerful ingredients that cut through dirt, grease, and grime — leaving your home spotless and smelling fresh. Safe for family use.`,
      `Keep your home sparkling clean with ${name}. A trusted cleaning solution that delivers professional results without the hassle. Perfect for daily use throughout the home.`,
    ],
  };
  const opts = templates[category] || [
    `${name} is a quality essential brought to you by Essly — your trusted source for everyday products in Ghana. Reliable, affordable, and available for nationwide delivery.`,
  ];
  return opts[Math.floor(Math.random() * opts.length)];
};

const formatDate = (ts) => {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatDateSimple = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-GH', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
};

const compressToBlob = (file, maxW = 700, q = 0.80) =>
  new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const r = Math.min(maxW / img.width, maxW / img.height, 1);
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * r);
        c.height = Math.round(img.height * r);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(blob => res(blob), 'image/jpeg', q);
      };
      img.onerror = rej;
      img.src = e.target.result;
    };
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });

const uploadToCloudinary = async (file, resourceType = 'image', onProgress) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const uploadFile = resourceType === 'image' ? await compressToBlob(file) : file;
  const formData = new FormData();
  formData.append('file', uploadFile, resourceType === 'image' ? 'product.jpg' : file.name);
  formData.append('upload_preset', uploadPreset);
  formData.append('resource_type', resourceType);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`);
    if (onProgress) {
      xhr.upload.onprogress = e => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }
    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText).secure_url);
      } else {
        reject(new Error('Upload failed'));
      }
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(formData);
  });
};

/* ─────────────────────────────────────────────
   LOGO COMPONENT
───────────────────────────────────────────── */
const EsslyLogo = ({ size = 32 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="4" y="16" width="17" height="17" rx="2" transform="rotate(-45 4 16)" stroke="#D4A520" strokeWidth="2" fill="none"/>
      <text x="16" y="20" textAnchor="middle" dominantBaseline="middle"
        fontSize="12" fontWeight="700" fontFamily="Sora, sans-serif" fill="#D4A520">E</text>
    </svg>
    <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: size * 0.65, color: '#fff', letterSpacing: '-0.02em' }}>
      essly
    </span>
  </div>
);

/* ─────────────────────────────────────────────
   TOAST SYSTEM
───────────────────────────────────────────── */
const ToastContext = React.createContext(null);

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2800);
  }, []);

  const borderColor = { success: '#2d8a4e', error: '#c04040', info: '#D4A520' };

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', width: '90vw', maxWidth: 360 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: 'rgba(20,20,20,0.96)',
            border: `1px solid ${borderColor[t.type] || borderColor.info}`,
            borderRadius: 12, padding: '12px 18px',
            color: '#fff', fontSize: 13, fontWeight: 500,
            animation: 'toastIn 0.35s cubic-bezier(0.16,1,0.3,1)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            width: '100%', textAlign: 'center',
          }}>{t.msg}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const useToast = () => React.useContext(ToastContext);

/* ─────────────────────────────────────────────
   CART CONTEXT
───────────────────────────────────────────── */
const CartContext = React.createContext(null);

const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCart = useCallback((product) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id);
      if (ex) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((id) => {
    setCart(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateQty = useCallback((id, qty) => {
    if (qty < 1) { setCart(prev => prev.filter(i => i.id !== id)); return; }
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  );
};

const useCart = () => React.useContext(CartContext);

/* ─────────────────────────────────────────────
   PRODUCT CARD
───────────────────────────────────────────── */
const ProductCard = ({ product, onOpen }) => {
  const { cart, addToCart, updateQty } = useCart();
  const toast = useToast();
  const cartItem = cart.find(i => i.id === product.id);
  const mainImg = product.images?.[0] || null;
  const catObj = CATEGORIES.find(c => c.id === product.category);

  const handleAdd = (e) => {
    e.stopPropagation();
    addToCart(product);
    toast('Added to cart!', 'success');
  };

  return (
    <div onClick={() => onOpen(product)} style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--gold-border)',
      borderRadius: 14,
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(212,165,32,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      {/* Image */}
      <div style={{ position: 'relative', paddingBottom: '100%', background: 'var(--mid-bg)' }}>
        {mainImg ? (
          <img src={mainImg} alt={product.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
            {catObj?.icon || '📦'}
          </div>
        )}
        <div style={{ position: 'absolute', top: 8, left: 8 }}>
          <span className="badge badge-gold" style={{ fontSize: 9 }}>{product.productCode}</span>
        </div>
        {!product.inStock && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>Out of Stock</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '12px 12px 14px' }}>
        <p style={{ fontFamily: 'var(--font-head)', fontSize: 13, fontWeight: 600, lineHeight: 1.4, marginBottom: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{product.name}</p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginBottom: 8 }}>{product.description}</p>
        <p style={{ fontFamily: 'var(--font-head)', color: 'var(--gold)', fontWeight: 700, fontSize: 15, marginBottom: 10 }}>GHS {product.price?.toFixed(2)}</p>

        {product.inStock && (
          cartItem ? (
            <div onClick={e => e.stopPropagation()} className="qty-control" style={{ width: '100%', justifyContent: 'space-between' }}>
              <button className="qty-btn" onClick={() => updateQty(product.id, cartItem.qty - 1)}>−</button>
              <span className="qty-num">{cartItem.qty}</span>
              <button className="qty-btn" onClick={() => updateQty(product.id, cartItem.qty + 1)}>+</button>
            </div>
          ) : (
            <button className="gold-btn" style={{ width: '100%', padding: '8px 0', fontSize: 13 }} onClick={handleAdd}>
              Add to Cart
            </button>
          )
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   IMAGE GALLERY (PRODUCT DETAIL)
───────────────────────────────────────────── */
const ImageGallery = ({ images, videoUrl }) => {
  const media = [
    ...(images || []).map(url => ({ type: 'image', url })),
    ...(videoUrl ? [{ type: 'video', url: videoUrl }] : []),
  ];
  const [activeIdx, setActiveIdx] = useState(0);
  const touchStartX = useRef(null);

  if (!media.length) return (
    <div style={{ width: '100%', paddingBottom: '70%', background: 'var(--mid-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', borderRadius: '12px 12px 0 0' }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>📦</div>
    </div>
  );

  const active = media[activeIdx];

  const go = (dir) => {
    setActiveIdx(i => (i + dir + media.length) % media.length);
  };

  const onTouchStart = e => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = e => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  return (
    <div>
      {/* Main */}
      <div style={{ position: 'relative', width: '100%', paddingBottom: '70%', background: '#000', borderRadius: '12px 12px 0 0', overflow: 'hidden' }}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {active.type === 'image' ? (
          <img src={active.url} alt="Product" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <video src={active.url} controls playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', background: '#000' }} />
        )}
        {media.length > 1 && (
          <>
            <button onClick={() => go(-1)} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, backdropFilter: 'blur(4px)', zIndex: 2 }}>‹</button>
            <button onClick={() => go(1)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, backdropFilter: 'blur(4px)', zIndex: 2 }}>›</button>
            <div style={{ position: 'absolute', top: 10, right: 12, background: 'rgba(0,0,0,0.55)', borderRadius: 20, padding: '3px 8px', fontSize: 11, color: '#fff', backdropFilter: 'blur(4px)' }}>{activeIdx + 1} / {media.length}</div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {media.length > 1 && (
        <div style={{ display: 'flex', gap: 8, padding: '10px 16px', overflowX: 'auto' }}>
          {media.map((m, i) => (
            <div key={i} onClick={() => setActiveIdx(i)} style={{
              width: 52, height: 52, flexShrink: 0,
              borderRadius: 8, overflow: 'hidden',
              border: `2px solid ${i === activeIdx ? 'var(--gold)' : 'transparent'}`,
              background: 'var(--mid-bg)', cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}>
              {m.type === 'image' ? (
                <img src={m.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>▶</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   PRODUCT DETAIL SHEET
───────────────────────────────────────────── */
const ProductDetailSheet = ({ product, onClose }) => {
  const { cart, addToCart, updateQty } = useCart();
  const toast = useToast();
  const cartItem = cart.find(i => i.id === product.id);

  const handleAdd = () => {
    addToCart(product);
    toast('Added to cart!', 'success');
  };

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet" style={{ maxHeight: '95vh' }}>
        <div className="sheet-handle" />
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, color: 'var(--text-muted)', fontSize: 20, zIndex: 5 }}>✕</button>

        <ImageGallery images={product.images} videoUrl={product.videoUrl} />

        <div style={{ padding: '16px 20px 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
            <span className="badge badge-gold">{product.productCode}</span>
            <span style={{ fontSize: 12, color: product.inStock ? '#4CAF50' : '#c04040', fontWeight: 600 }}>
              {product.inStock ? '● In Stock' : '● Out of Stock'}
            </span>
          </div>

          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, lineHeight: 1.3, marginBottom: 10 }}>{product.name}</h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 16 }}>{product.description}</p>

          <div style={{ marginBottom: 20 }}>
            <span style={{ fontFamily: 'var(--font-head)', color: 'var(--gold)', fontSize: 26, fontWeight: 700 }}>GHS {product.price?.toFixed(2)}</span>
            <span style={{ fontSize: 12, color: 'var(--text-dim)', marginLeft: 8 }}>Wholesale &amp; Retail Available</span>
          </div>

          {product.inStock && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {cartItem ? (
                <>
                  <div className="qty-control" style={{ flexShrink: 0 }}>
                    <button className="qty-btn" onClick={() => updateQty(product.id, cartItem.qty - 1)}>−</button>
                    <span className="qty-num" style={{ padding: '0 12px' }}>{cartItem.qty}</span>
                    <button className="qty-btn" onClick={() => updateQty(product.id, cartItem.qty + 1)}>+</button>
                  </div>
                  <button className="gold-btn" style={{ flex: 1, padding: '12px 0', fontSize: 14 }} onClick={onClose}>
                    View Cart
                  </button>
                </>
              ) : (
                <button className="gold-btn" style={{ flex: 1, padding: '12px 0', fontSize: 14 }} onClick={handleAdd}>
                  Add to Cart
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

/* ─────────────────────────────────────────────
   CART SHEET / CHECKOUT
───────────────────────────────────────────── */
const CartSheet = ({ onClose }) => {
  const { cart, updateQty, removeFromCart, total, clearCart } = useCart();
  const toast = useToast();
  const [step, setStep] = useState('cart'); // cart | checkout | success
  const [form, setForm] = useState({ name: '', phone: '', address: '', deliveryTime: 'As soon as possible', customTime: '', note: '' });
  const [loading, setLoading] = useState(false);
  const [orderNum, setOrderNum] = useState('');

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const buildWhatsAppMsg = (num, customerData, items, orderTotal) => {
    const deliveryTime = customerData.deliveryTime === 'Custom date/time' ? customerData.customTime : customerData.deliveryTime;
    const dateStr = formatDateSimple({ toDate: () => new Date() });
    let msg = `🛍️ *NEW ORDER — ESSLY*\n━━━━━━━━━━━━━━━━━━━━\n📋 *Order #:* ${num}\n📅 *Date:* ${dateStr}\n\n👤 *CUSTOMER DETAILS*\nName: ${customerData.name}\nPhone: ${customerData.phone}\nAddress: ${customerData.address}\nDelivery: ${deliveryTime}\n\n🛒 *ORDER ITEMS*\n`;
    items.forEach(item => {
      msg += `• [${item.productCode}] ${item.name} x${item.quantity}\n  Price: GHS ${item.price.toFixed(2)} × ${item.quantity} = GHS ${(item.price * item.quantity).toFixed(2)}\n`;
      if (item.imageUrl) msg += `  🖼️ ${item.imageUrl}\n`;
    });
    msg += `\n━━━━━━━━━━━━━━━━━━━━\n💰 *TOTAL: GHS ${orderTotal.toFixed(2)}*\n━━━━━━━━━━━━━━━━━━━━`;
    if (customerData.note) msg += `\n📝 Note: ${customerData.note}`;
    msg += `\n\n_Wholesale & Retail Available_\n_www.esslygh.com | @essly_`;
    return msg;
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      toast('Please fill all required fields', 'error'); return;
    }
    if (form.deliveryTime === 'Custom date/time' && !form.customTime.trim()) {
      toast('Please enter your preferred delivery time', 'error'); return;
    }
    setLoading(true);
    try {
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
      const orderData = {
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
      };
      await addDoc(collection(db, 'orders'), orderData);
      setOrderNum(num);
      const msg = buildWhatsAppMsg(num, { name: form.name, phone: form.phone, address: form.address, deliveryTime, customTime: form.customTime, note: form.note }, items, total);
      const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
      clearCart();
      setStep('success');
    } catch (err) {
      console.error(err);
      toast('Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet" style={{ maxHeight: '95vh' }}>
        <div className="sheet-handle" />
        <div style={{ padding: '20px 20px 40px' }}>

          {step === 'success' ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
              <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 22, marginBottom: 8 }}>Order Placed!</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>Order <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{orderNum}</span> has been sent to WhatsApp.</p>
              <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 28 }}>Complete your order by sending the WhatsApp message.</p>
              <button className="gold-btn" style={{ width: '100%', padding: '14px 0', fontSize: 15 }} onClick={onClose}>Continue Shopping</button>
            </div>
          ) : step === 'cart' ? (
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
                          {item.images?.[0] ? <img src={item.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📦</div>}
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
          ) : (
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

                <div style={{ background: 'var(--mid-bg)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--gold-border)', marginBottom: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{cart.reduce((s, i) => s + i.qty, 0)} item(s)</span>
                    <span style={{ fontFamily: 'var(--font-head)', color: 'var(--gold)', fontWeight: 700, fontSize: 16 }}>GHS {total.toFixed(2)}</span>
                  </div>
                </div>

                <button className="gold-btn" style={{ width: '100%', padding: '15px 0', fontSize: 15, background: 'linear-gradient(135deg, #25D366 0%, #1da851 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={handleSubmit} disabled={loading}>
                  {loading ? <><span className="spinner" style={{ width: 16, height: 16, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Processing...</> : <>📲 Send Order on WhatsApp</>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

/* ─────────────────────────────────────────────
   ADMIN LOGIN
───────────────────────────────────────────── */
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
    } catch (e) {
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
          {error && <div style={{ background: 'rgba(192,64,64,0.1)', border: '1px solid rgba(192,64,64,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#e07070', marginBottom: 16 }}>{error}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input className="input-field" type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            <input className="input-field" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            <button className="gold-btn" style={{ padding: '13px 0', fontSize: 15 }} onClick={handleLogin} disabled={loading}>
              {loading ? <><span className="spinner" style={{ width: 15, height: 15 }} /> Signing in...</> : 'Sign In'}
            </button>
          </div>
        </div>
        <button onClick={onBack} style={{ marginTop: 20, color: 'var(--text-dim)', fontSize: 13, display: 'block', textAlign: 'center', width: '100%' }}>← Back to Shop</button>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   ADMIN — PRODUCT FORM
───────────────────────────────────────────── */
const ProductForm = ({ product, products, onClose, onSaved }) => {
  const toast = useToast();
  const [form, setForm] = useState({
    name: product?.name || '',
    category: product?.category || 'baby-care',
    price: product?.price || '',
    description: product?.description || '',
    inStock: product?.inStock ?? true,
    featured: product?.featured ?? false,
  });
  const [images, setImages] = useState(product?.images || []);
  const [videoUrl, setVideoUrl] = useState(product?.videoUrl || null);
  const [uploadingImgs, setUploadingImgs] = useState([]);
  const [videoProgress, setVideoProgress] = useState(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [saving, setSaving] = useState(false);
  const imgInputRef = useRef();
  const vidInputRef = useRef();

  const productCode = product?.productCode || (form.category ? generateProductCode(form.category, products) : '');
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleImagesSelect = async (files) => {
    const fileArr = Array.from(files).slice(0, 6 - images.length);
    if (!fileArr.length) return;
    const newUploads = fileArr.map((f, i) => ({ id: Date.now() + i, name: f.name, progress: 0, url: null }));
    setUploadingImgs(prev => [...prev, ...newUploads]);

    for (let i = 0; i < fileArr.length; i++) {
      const uid = newUploads[i].id;
      try {
        const url = await uploadToCloudinary(fileArr[i], 'image', (p) => {
          setUploadingImgs(prev => prev.map(u => u.id === uid ? { ...u, progress: p } : u));
        });
        setImages(prev => [...prev, url]);
        setUploadingImgs(prev => prev.filter(u => u.id !== uid));
      } catch {
        toast('Image upload failed', 'error');
        setUploadingImgs(prev => prev.filter(u => u.id !== uid));
      }
    }
  };

  const handleVideoSelect = async (file) => {
    if (file.size > 50 * 1024 * 1024) { toast('Video must be under 50MB', 'error'); return; }
    setVideoUploading(true); setVideoProgress(0);
    try {
      const url = await uploadToCloudinary(file, 'video', p => setVideoProgress(p));
      setVideoUrl(url);
    } catch {
      toast('Video upload failed', 'error');
    } finally {
      setVideoUploading(false); setVideoProgress(null);
    }
  };

  const handleGenerateDesc = () => {
    if (!form.name.trim()) return;
    setGeneratingDesc(true);
    setTimeout(() => {
      setField('description', generateDescription(form.name, form.category));
      setGeneratingDesc(false);
    }, 800);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.category || !form.price) {
      toast('Please fill all required fields', 'error'); return;
    }
    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        category: form.category,
        price: parseFloat(form.price),
        description: form.description.trim(),
        images,
        videoUrl: videoUrl || null,
        inStock: form.inStock,
        featured: form.featured,
        updatedAt: serverTimestamp(),
      };
      if (product?.id) {
        await updateDoc(doc(db, 'products', product.id), data);
        toast('Product updated!', 'success');
      } else {
        data.productCode = productCode;
        data.createdAt = serverTimestamp();
        await addDoc(collection(db, 'products'), data);
        toast('Product added!', 'success');
      }
      onSaved?.();
      onClose();
    } catch (e) {
      console.error(e);
      toast('Save failed. Check your connection.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet" style={{ maxHeight: '95vh' }}>
        <div className="sheet-handle" />
        <div style={{ padding: '20px 20px 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700 }}>{product ? 'Edit Product' : 'Add New Product'}</h2>
            <button onClick={onClose} style={{ color: 'var(--text-muted)', fontSize: 20 }}>✕</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Product Name */}
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Product Name *</label>
              <input className="input-field" placeholder="e.g. Pampers Baby Dry Size 3" value={form.name} onChange={e => setField('name', e.target.value)} />
            </div>

            {/* Category */}
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Category *</label>
              <select className="input-field" value={form.category} onChange={e => setField('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>
              <p style={{ marginTop: 6, fontSize: 12, color: 'var(--gold)' }}>Product Code: <strong>{productCode}</strong></p>
            </div>

            {/* Price */}
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Price (GHS) *</label>
              <input className="input-field" type="number" min="0" step="0.01" placeholder="0.00" value={form.price} onChange={e => setField('price', e.target.value)} />
            </div>

            {/* Images */}
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Product Images (max 6)</label>
              <input ref={imgInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleImagesSelect(e.target.files)} />
              <button className="ghost-btn" style={{ padding: '10px 16px', fontSize: 13, width: '100%' }} onClick={() => imgInputRef.current?.click()} disabled={images.length >= 6}>
                📷 Upload Images {images.length > 0 ? `(${images.length}/6)` : ''}
              </button>

              {/* Thumbnails */}
              {(images.length > 0 || uploadingImgs.length > 0) && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  {images.map((url, i) => (
                    <div key={i} style={{ position: 'relative', width: 64, height: 64 }}>
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, border: i === 0 ? '2px solid var(--gold)' : '1px solid var(--gold-border)' }} />
                      <button onClick={() => setImages(prev => prev.filter((_, j) => j !== i))} style={{ position: 'absolute', top: -6, right: -6, background: 'var(--danger)', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                      {i === 0 && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(212,165,32,0.8)', borderRadius: '0 0 6px 6px', fontSize: 8, textAlign: 'center', color: '#000', fontWeight: 700, padding: '1px 0' }}>MAIN</div>}
                    </div>
                  ))}
                  {uploadingImgs.map(u => (
                    <div key={u.id} style={{ width: 64, height: 64, background: 'var(--mid-bg)', borderRadius: 8, border: '1px solid var(--gold-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <span className="spinner" style={{ width: 20, height: 20 }} />
                      <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>{u.progress}%</span>
                    </div>
                  ))}
                </div>
              )}
              {images.length > 0 && <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>First image is shown as main. Click ✕ to remove.</p>}
            </div>

            {/* Video */}
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Product Video (optional)</label>
              <input ref={vidInputRef} type="file" accept="video/mp4,video/mov,video/webm" style={{ display: 'none' }} onChange={e => e.target.files[0] && handleVideoSelect(e.target.files[0])} />
              {videoUrl ? (
                <div style={{ position: 'relative' }}>
                  <video src={videoUrl} controls style={{ width: '100%', borderRadius: 10, maxHeight: 180 }} />
                  <button onClick={() => setVideoUrl(null)} style={{ position: 'absolute', top: 8, right: 8, background: 'var(--danger)', color: '#fff', borderRadius: '50%', width: 24, height: 24, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
              ) : videoUploading ? (
                <div style={{ background: 'var(--mid-bg)', borderRadius: 10, padding: '16px', border: '1px solid var(--gold-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                    <span>Uploading video...</span><span>{videoProgress}%</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--mid-bg)', borderRadius: 2, overflow: 'hidden', border: '1px solid var(--gold-border)' }}>
                    <div style={{ height: '100%', width: `${videoProgress}%`, background: 'var(--gold)', borderRadius: 2, transition: 'width 0.3s' }} />
                  </div>
                </div>
              ) : (
                <button className="ghost-btn" style={{ padding: '10px 16px', fontSize: 13, width: '100%' }} onClick={() => vidInputRef.current?.click()}>
                  🎥 Upload Video
                </button>
              )}
              <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Max 50MB. MP4, MOV, or WebM.</p>
            </div>

            {/* Description */}
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Description</label>
              <textarea className="input-field" rows={4} placeholder="Describe the product..." value={form.description} onChange={e => setField('description', e.target.value)} style={{ resize: 'vertical' }} />
              <button className="ghost-btn" style={{ marginTop: 8, padding: '8px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }} onClick={handleGenerateDesc} disabled={!form.name.trim() || generatingDesc}>
                {generatingDesc ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Generating...</> : <>✨ Generate Description</>}
              </button>
            </div>

            {/* Toggles */}
            <div style={{ display: 'flex', gap: 16 }}>
              {[{ key: 'inStock', label: 'In Stock' }, { key: 'featured', label: 'Featured' }].map(({ key, label }) => (
                <button key={key} onClick={() => setField(key, !form[key])} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `1px solid ${form[key] ? 'var(--gold)' : 'var(--gold-border)'}`, background: form[key] ? 'var(--gold-dim)' : 'transparent', color: form[key] ? 'var(--gold)' : 'var(--text-muted)', fontSize: 13, fontWeight: 600, transition: 'all 0.2s' }}>
                  {form[key] ? '✓' : '○'} {label}
                </button>
              ))}
            </div>

            {/* Save */}
            <button className="gold-btn" style={{ width: '100%', padding: '14px 0', fontSize: 15, marginTop: 4 }} onClick={handleSave} disabled={saving}>
              {saving ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Saving...</> : (product ? 'Save Changes' : 'Add Product')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

/* ─────────────────────────────────────────────
   ADMIN — PRODUCTS TAB
───────────────────────────────────────────── */
const AdminProducts = ({ products }) => {
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'products', product.id));
      toast('Product deleted', 'success');
    } catch {
      toast('Delete failed', 'error');
    }
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
                  {p.images?.[0] ? <img src={p.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{cat?.icon || '📦'}</div>}
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

      {showForm && (
        <ProductForm product={editProduct} products={products} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   ADMIN — ORDER DETAIL
───────────────────────────────────────────── */
const OrderDetailSheet = ({ order, onClose }) => {
  const toast = useToast();
  const [completing, setCompleting] = useState(false);

  const handleComplete = async () => {
    if (!window.confirm('Mark this order as completed?')) return;
    setCompleting(true);
    try {
      await updateDoc(doc(db, 'orders', order.id), { status: 'completed', completedAt: serverTimestamp() });
      toast('Order marked as completed!', 'success');
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
              <div style={{ marginTop: 4 }}>
                <span className={`badge badge-${order.status}`}>{order.status}</span>
              </div>
            </div>
            <button onClick={onClose} style={{ color: 'var(--text-muted)', fontSize: 20 }}>✕</button>
          </div>

          <div style={{ background: 'var(--mid-bg)', borderRadius: 10, padding: '14px', border: '1px solid var(--gold-border)', marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--gold)' }}>Customer Details</p>
            <p style={{ fontSize: 13, marginBottom: 4 }}><span style={{ color: 'var(--text-muted)' }}>Name:</span> {order.customerName}</p>
            <p style={{ fontSize: 13, marginBottom: 4 }}><span style={{ color: 'var(--text-muted)' }}>Phone:</span> {order.customerPhone}</p>
            <p style={{ fontSize: 13, marginBottom: 4 }}><span style={{ color: 'var(--text-muted)' }}>Address:</span> {order.deliveryAddress}</p>
            <p style={{ fontSize: 13, marginBottom: order.note ? 4 : 0 }}><span style={{ color: 'var(--text-muted)' }}>Delivery:</span> {order.deliveryTime}</p>
            {order.note && <p style={{ fontSize: 13 }}><span style={{ color: 'var(--text-muted)' }}>Note:</span> {order.note}</p>}
          </div>

          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold)', marginBottom: 10 }}>Order Items</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {order.items?.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, background: 'var(--mid-bg)', borderRadius: 10, padding: '10px 12px', border: '1px solid var(--gold-border)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 6, overflow: 'hidden', background: 'var(--card-bg)', flexShrink: 0 }}>
                  {item.imageUrl ? <img src={item.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📦</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>{item.productCode} · x{item.quantity}</p>
                </div>
                <p style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 700 }}>GHS {(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid var(--gold-border)', marginBottom: 20 }}>
            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600 }}>Total</span>
            <span style={{ fontFamily: 'var(--font-head)', color: 'var(--gold)', fontWeight: 700, fontSize: 18 }}>GHS {order.total?.toFixed(2)}</span>
          </div>

          <p style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 16 }}>Placed: {formatDate(order.createdAt)}</p>

          {order.status === 'pending' && (
            <button className="gold-btn" style={{ width: '100%', padding: '13px 0', fontSize: 14 }} onClick={handleComplete} disabled={completing}>
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

/* ─────────────────────────────────────────────
   ADMIN — ORDERS TAB
───────────────────────────────────────────── */
const AdminOrders = ({ orders }) => {
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
    } catch {
      toast('Update failed', 'error');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
        {[
          { label: 'Total', value: orders.length },
          { label: 'Pending', value: orders.filter(o => o.status === 'pending').length },
          { label: 'Done', value: orders.filter(o => o.status === 'completed').length },
          { label: "Today", value: todayCount },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--mid-bg)', border: '1px solid var(--gold-border)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, color: 'var(--gold)' }}>{s.value}</p>
            <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['all', 'pending', 'completed'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: `1px solid ${filter === f ? 'var(--gold)' : 'var(--gold-border)'}`, background: filter === f ? 'var(--gold-dim)' : 'transparent', color: filter === f ? 'var(--gold)' : 'var(--text-muted)', transition: 'all 0.2s', textTransform: 'capitalize' }}>{f}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
          <p>No orders yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(order => (
            <div key={order.id} style={{ background: 'var(--mid-bg)', border: '1px solid var(--gold-border)', borderRadius: 12, padding: '14px' }}>
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

      {selectedOrder && <OrderDetailSheet order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
};

/* ─────────────────────────────────────────────
   ADMIN — SETTINGS TAB
───────────────────────────────────────────── */
const AdminSettings = ({ products, orders, onLogout }) => {
  const catBreakdown = CATEGORIES.map(c => ({
    ...c, count: products.filter(p => p.category === c.id).length
  }));

  return (
    <div style={{ padding: 20 }}>
      <div style={{ background: 'var(--mid-bg)', border: '1px solid var(--gold-border)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <p style={{ fontFamily: 'var(--font-head)', fontWeight: 700, marginBottom: 12, color: 'var(--gold)' }}>Business Info</p>
        {[
          ['WhatsApp', '+233 599 780 819'],
          ['Website', 'www.esslygh.com'],
          ['Instagram', '@essly'],
          ['Delivery', 'Nationwide (Ghana)'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(212,165,32,0.1)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{k}</span>
            <span style={{ fontSize: 13 }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--mid-bg)', border: '1px solid var(--gold-border)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <p style={{ fontFamily: 'var(--font-head)', fontWeight: 700, marginBottom: 12, color: 'var(--gold)' }}>Quick Stats</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, padding: '7px 0', borderBottom: '1px solid rgba(212,165,32,0.1)' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total Products</span>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{products.length}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(212,165,32,0.1)' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total Orders</span>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{orders.length}</span>
        </div>
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

/* ─────────────────────────────────────────────
   ADMIN PANEL
───────────────────────────────────────────── */
const AdminPanel = ({ products, orders, onBack }) => {
  const [tab, setTab] = useState('products');

  const handleLogout = async () => {
    await signOut(auth);
    onBack();
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Admin Header */}
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

      {tab === 'products' && <AdminProducts products={products} />}
      {tab === 'orders' && <AdminOrders orders={orders} />}
      {tab === 'settings' && <AdminSettings products={products} orders={orders} onLogout={handleLogout} />}
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN SHOP
───────────────────────────────────────────── */
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
        <button onClick={() => setActiveCategory('all')} style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, border: `1px solid ${activeCategory === 'all' ? 'var(--gold)' : 'var(--gold-border)'}`, background: activeCategory === 'all' ? 'var(--gold)' : 'transparent', color: activeCategory === 'all' ? '#000' : 'var(--text-muted)', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>All</button>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setActiveCategory(c.id)} style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, border: `1px solid ${activeCategory === c.id ? 'var(--gold)' : 'var(--gold-border)'}`, background: activeCategory === c.id ? 'var(--gold)' : 'transparent', color: activeCategory === c.id ? '#000' : 'var(--text-muted)', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
            {c.icon} {c.label}
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

      {/* Sheets */}
      {selectedProduct && <ProductDetailSheet product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
      {showCart && <CartSheet onClose={() => setShowCart(false)} />}
    </div>
  );
};

/* ─────────────────────────────────────────────
   ROOT APP
───────────────────────────────────────────── */
export default function App() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [view, setView] = useState('shop'); // shop | admin-login | admin
  const [user, setUser] = useState(null);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      if (u && view === 'admin-login') setView('admin');
    });
    return unsub;
  }, [view]);

  // Products listener
  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => {
        const aT = a.createdAt?.toMillis?.() || 0;
        const bT = b.createdAt?.toMillis?.() || 0;
        return bT - aT;
      });
      setProducts(data.length > 0 ? data : SEED_PRODUCTS.map((p, i) => ({ ...p, id: `seed-${i}` })));
      setLoadingProducts(false);
    }, () => {
      setProducts(SEED_PRODUCTS.map((p, i) => ({ ...p, id: `seed-${i}` })));
      setLoadingProducts(false);
    });
    return unsub;
  }, []);

  // Orders listener (only when logged in)
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
    return unsub;
  }, [user]);

  const handleAdminClick = () => {
    if (user) setView('admin');
    else setView('admin-login');
  };

  const handleLoginSuccess = () => setView('admin');
  const handleBackToShop = () => setView('shop');

  if (loadingProducts && view === 'shop') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <EsslyLogo size={36} />
        <span className="spinner" style={{ width: 28, height: 28, marginTop: 8 }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading products...</p>
      </div>
    );
  }

  return (
    <ToastProvider>
      <CartProvider>
        <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />

        {view === 'shop' && <Shop products={products} onAdminClick={handleAdminClick} />}
        {view === 'admin-login' && <AdminLogin onBack={handleBackToShop} onSuccess={handleLoginSuccess} />}
        {view === 'admin' && user && <AdminPanel products={products} orders={orders} onBack={handleBackToShop} />}
        {view === 'admin' && !user && <AdminLogin onBack={handleBackToShop} />}
      </CartProvider>
    </ToastProvider>
  );
}
