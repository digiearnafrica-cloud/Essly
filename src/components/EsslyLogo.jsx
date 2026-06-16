import React from 'react';

const EsslyLogo = ({ size = 32 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="4" y="16" width="17" height="17" rx="2"
        transform="rotate(-45 4 16)" stroke="#D4A520" strokeWidth="2" fill="none"/>
      <text x="16" y="20" textAnchor="middle" dominantBaseline="middle"
        fontSize="12" fontWeight="700" fontFamily="Sora, sans-serif" fill="#D4A520">E</text>
    </svg>
    <span style={{
      fontFamily: 'Sora, sans-serif', fontWeight: 700,
      fontSize: size * 0.65, color: '#fff', letterSpacing: '-0.02em',
    }}>essly</span>
  </div>
);

export default EsslyLogo;
