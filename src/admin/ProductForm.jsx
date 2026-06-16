import React, { useState, useRef } from 'react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.js';
import { useToast } from '../components/Toast.jsx';
import { generateProductCode, generateDescription, uploadToCloudinary } from '../lib/utils.js';
import { CATEGORIES } from '../lib/constants.js';

const ProductForm = ({ product, products, onClose }) => {
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
    const newUploads = fileArr.map((f, i) => ({ id: Date.now() + i, progress: 0 }));
    setUploadingImgs(prev => [...prev, ...newUploads]);

    for (let i = 0; i < fileArr.length; i++) {
      const uid = newUploads[i].id;
      try {
        const url = await uploadToCloudinary(fileArr[i], 'image', p => {
          setUploadingImgs(prev => prev.map(u => u.id === uid ? { ...u, progress: p } : u));
        });
        setImages(prev => [...prev, url]);
      } catch {
        toast('Image upload failed', 'error');
      } finally {
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
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Product Name *</label>
              <input className="input-field" placeholder="e.g. Pampers Baby Dry Size 3" value={form.name} onChange={e => setField('name', e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Category *</label>
              <select className="input-field" value={form.category} onChange={e => setField('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>
              <p style={{ marginTop: 6, fontSize: 12, color: 'var(--gold)' }}>Product Code: <strong>{productCode}</strong></p>
            </div>
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
              {(images.length > 0 || uploadingImgs.length > 0) && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  {images.map((url, i) => (
                    <div key={i} style={{ position: 'relative', width: 64, height: 64 }}>
                      <img src={url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, border: i === 0 ? '2px solid var(--gold)' : '1px solid var(--gold-border)' }} />
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
              {images.length > 0 && <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>First image is the main image. Click ✕ to remove.</p>}
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
                <div style={{ background: 'var(--mid-bg)', borderRadius: 10, padding: 16, border: '1px solid var(--gold-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                    <span>Uploading video...</span><span>{videoProgress}%</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--card-bg)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${videoProgress}%`, background: 'var(--gold)', borderRadius: 2, transition: 'width 0.3s' }} />
                  </div>
                </div>
              ) : (
                <button className="ghost-btn" style={{ padding: '10px 16px', fontSize: 13, width: '100%' }} onClick={() => vidInputRef.current?.click()}>🎥 Upload Video</button>
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

            <button className="gold-btn" style={{ width: '100%', padding: '14px 0', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={handleSave} disabled={saving}>
              {saving ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Saving...</> : (product ? 'Save Changes' : 'Add Product')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductForm;
