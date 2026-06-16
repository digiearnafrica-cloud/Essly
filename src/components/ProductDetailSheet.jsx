import React from 'react';
import { useCart } from './CartContext.jsx';
import { useToast } from './Toast.jsx';
import ImageGallery from './ImageGallery.jsx';

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
                  <button className="gold-btn" style={{ flex: 1, padding: '12px 0', fontSize: 14 }} onClick={onClose}>View Cart</button>
                </>
              ) : (
                <button className="gold-btn" style={{ flex: 1, padding: '12px 0', fontSize: 14 }} onClick={handleAdd}>Add to Cart</button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductDetailSheet;
