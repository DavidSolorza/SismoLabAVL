import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onClose();
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 10001,
      backgroundColor: '#FFFFFF',
      border: `1px solid ${isError ? 'var(--p1-border)' : 'var(--p3-border)'}`,
      borderLeft: `4px solid ${isError ? 'var(--coral-soft)' : 'var(--emerald-soft)'}`,
      boxShadow: 'var(--shadow-xl)',
      padding: '14px 18px', borderRadius: 'var(--radius-md)',
      display: 'flex', alignItems: 'center', gap: '12px',
      color: 'var(--text-primary)', maxWidth: '420px',
      animation: 'slideInUp 0.25s ease-out'
    }}>
      {isError ? (
        <AlertTriangle style={{ color: 'var(--coral-soft)', flexShrink: 0 }} size={20} />
      ) : (
        <CheckCircle2 style={{ color: 'var(--emerald-soft)', flexShrink: 0 }} size={20} />
      )}
      
      <div style={{ flex: 1, fontSize: '0.86rem', fontWeight: 500, color: 'var(--text-primary)' }}>
        {toast.message}
      </div>

      <button
        onClick={onClose}
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex' }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
