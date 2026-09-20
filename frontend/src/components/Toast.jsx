import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 2000,
      background: isError ? 'rgba(40, 18, 18, 0.95)' : 'rgba(20, 32, 25, 0.95)',
      backdropFilter: 'blur(12px)',
      border: `1px solid ${isError ? '#EF4444' : '#10B981'}`,
      boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
      padding: '14px 20px', borderRadius: '12px',
      display: 'flex', alignItems: 'center', gap: '12px',
      color: '#FFFDF9', maxWidth: '420px',
      animation: 'slideIn 0.3s ease-out'
    }}>
      {isError ? <AlertTriangle color="#F87171" size={22} /> : <CheckCircle2 color="#34D399" size={22} />}
      <div style={{ flex: 1, fontSize: '0.9rem' }}>{toast.message}</div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
        <X size={18} />
      </button>
    </div>
  );
}
