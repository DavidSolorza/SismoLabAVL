import React from 'react';
import { Activity, ShieldAlert, Cpu, RefreshCw } from 'lucide-react';

export default function Header({ currentMode, onToggleMode, onRefresh, loading }) {
  return (
    <header className="glass-panel" style={{ padding: '20px 28px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Branding & Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #E05638 0%, #F59E0B 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(224, 86, 56, 0.4)'
          }}>
            <Activity size={28} color="#FFFDF9" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }} className="gradient-text">SismoLab AVL</h1>
              <span style={{
                fontSize: '0.75rem', padding: '3px 10px', borderRadius: '20px',
                background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)',
                fontWeight: 600
              }}>
                ● ONLINE
              </span>
            </div>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.88rem', marginTop: '2px' }}>
              Universidad de Caldas • DDD, Vertical Slicing & Árbol AVL Recursivo $K=(P, M, I)$
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Refresh Button */}
          <button className="btn-secondary" onClick={onRefresh} disabled={loading} title="Actualizar datos">
            <RefreshCw size={18} className={loading ? 'spin-animation' : ''} />
            <span>Actualizar</span>
          </button>

          {/* Operational Mode Selector */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(20, 17, 15, 0.8)', padding: '6px 8px 6px 14px',
            borderRadius: '12px', border: '1px solid var(--border-warm)'
          }}>
            <Cpu size={18} color="var(--amber)" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-sub)', fontWeight: 500 }}>
              Modo: <strong style={{ color: currentMode === 'NORMAL' ? '#34D399' : '#F87171' }}>{currentMode}</strong>
            </span>
            <button
              onClick={onToggleMode}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', background: currentMode === 'NORMAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)' }}
            >
              {currentMode === 'NORMAL' ? 'Activar Estrés' : 'Activar Normal'}
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}
