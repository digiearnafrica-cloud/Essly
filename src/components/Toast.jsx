import React, { useState, useCallback, createContext, useContext } from 'react';

export const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
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
      <div style={{
        position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
        zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8,
        alignItems: 'center', width: '90vw', maxWidth: 360,
      }}>
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

export const useToast = () => useContext(ToastContext);
