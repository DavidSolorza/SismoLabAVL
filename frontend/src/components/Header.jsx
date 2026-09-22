import React from 'react';
import { Activity, Cpu, RefreshCw, Layers, ShieldCheck, AlertCircle } from 'lucide-react';

export default function Header({ currentMode, onToggleMode, onRefresh, loading }) {
  const isNormal = currentMode === 'NORMAL';

  return (
    <header className="glass-panel" style={{ padding: '18px 24px', marginBottom: '20px', backgroundColor: '#FFFFFF' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Branding & Subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
            color: '#FFFFFF'
          }}>
            <Activity size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }} className="gradient-text">
                SismoLab AVL
              </h1>
              <span style={{
                fontSize: '0.72rem', padding: '3px 9px', borderRadius: '20px',
                backgroundColor: 'var(--p3-bg)', color: 'var(--p3-text)', border: '1px solid var(--p3-border)',
                fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }}></span>
                ONLINE
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginTop: '2px' }}>
              Universidad de Caldas • Árbol AVL Recursivo $K=(P, M, I)$ & Arquitectura Limpia
            </p>
          </div>
        </div>

        {/* Controles de Acción y Switch de Modo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Botón de Actualizar Datos */}
          <button className="btn-secondary" onClick={onRefresh} disabled={loading} title="Actualizar datos desde el backend">
            <RefreshCw size={16} className={loading ? 'spin-animation' : ''} style={{ color: 'var(--accent)' }} />
            <span>Actualizar</span>
          </button>

          {/* Conmutador de Modo Operacional (Normal vs. Estrés) */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            backgroundColor: isNormal ? 'var(--accent-light)' : 'var(--p2-bg)',
            border: `1px solid ${isNormal ? 'var(--accent-border)' : 'var(--p2-border)'}`,
            padding: '6px 10px 6px 12px', borderRadius: 'var(--radius-md)',
            transition: 'all 0.3s ease'
          }}>
            <Cpu size={18} style={{ color: isNormal ? 'var(--accent)' : 'var(--p2-text)' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>
                Modo
              </span>
              <span style={{
                fontSize: '0.82rem', fontWeight: 800,
                color: isNormal ? 'var(--accent-text)' : 'var(--p2-text)'
              }}>
                {isNormal ? 'NORMAL (AVL)' : 'ESTRÉS (DIFERIDO)'}
              </span>
            </div>

            <button
              onClick={onToggleMode}
              style={{
                marginLeft: '4px',
                padding: '5px 10px',
                fontSize: '0.76rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: isNormal ? '#FFFFFF' : '#FFFFFF',
                color: isNormal ? 'var(--p1-text)' : 'var(--accent-text)',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.2s ease'
              }}
              title={isNormal ? 'Activar Modo Estrés (aplaza rotaciones)' : 'Activar Modo Normal (rebalancea todo)'}
            >
              {isNormal ? 'Activar Estrés' : 'Rebalancear Normal'}
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}
