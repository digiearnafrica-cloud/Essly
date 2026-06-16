import React from 'react';
import { useCart } from './CartContext.jsx';
import { useToast } from './Toast.jsx';
import { CATEGORIES } from '../lib/constants.js';

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
    <div
      onClick={() => onOpen(product)}
      style={{ background: 'var(--card-bg)', border: '1px solid var(--gold-border)', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(212,165,32,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      <div style={{ position: 'relative', paddingBottom: '100%', background: 'var(--mid-bg)' }}>
        {mainImg ? (
          <img src={mainImg} alt={product.name} loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
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

export default ProductCard;
