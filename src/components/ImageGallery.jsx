import React, { useState, useRef } from 'react';

const ImageGallery = ({ images, videoUrl }) => {
  const media = [
    ...(images || []).map(url => ({ type: 'image', url })),
    ...(videoUrl ? [{ type: 'video', url: videoUrl }] : []),
  ];
  const [activeIdx, setActiveIdx] = useState(0);
  const touchStartX = useRef(null);

  if (!media.length) return (
    <div style={{ width: '100%', paddingBottom: '70%', background: 'var(--mid-bg)', position: 'relative', borderRadius: '12px 12px 0 0' }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>📦</div>
    </div>
  );

  const active = media[activeIdx];
  const go = (dir) => setActiveIdx(i => (i + dir + media.length) % media.length);

  return (
    <div>
      <div style={{ position: 'relative', width: '100%', paddingBottom: '70%', background: '#000', borderRadius: '12px 12px 0 0', overflow: 'hidden' }}
        onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          if (touchStartX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touchStartX.current = null;
        }}>
        {active.type === 'image' ? (
          <img src={active.url} alt="Product" loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
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
      {media.length > 1 && (
        <div style={{ display: 'flex', gap: 8, padding: '10px 16px', overflowX: 'auto' }}>
          {media.map((m, i) => (
            <div key={i} onClick={() => setActiveIdx(i)} style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 8, overflow: 'hidden', border: `2px solid ${i === activeIdx ? 'var(--gold)' : 'transparent'}`, background: 'var(--mid-bg)', cursor: 'pointer', transition: 'border-color 0.2s' }}>
              {m.type === 'image'
                ? <img src={m.url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>▶</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
