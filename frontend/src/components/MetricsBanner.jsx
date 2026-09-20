import React from 'react';
import { Layers, ShieldCheck, Zap, BarChart2 } from 'lucide-react';

export default function MetricsBanner({ metrics }) {
  if (!metrics) return null;

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '16px', marginBottom: '24px'
    }}>
      {/* Metric 1: Total Events */}
      <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          padding: '12px', borderRadius: '12px', background: 'rgba(224, 86, 56, 0.15)',
          color: 'var(--terracotta)', border: '1px solid rgba(224, 86, 56, 0.3)'
        }}>
          <Layers size={24} />
        </div>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Eventos Activos</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{metrics.total_nodos ?? 0}</h3>
        </div>
      </div>

      {/* Metric 2: AVL Height vs BST Height */}
      <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          padding: '12px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)',
          color: 'var(--amber)', border: '1px solid rgba(245, 158, 11, 0.3)'
        }}>
          <BarChart2 size={24} />
        </div>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Altura AVL vs BST</span>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FBBF24' }}>
            {metrics.altura_avl ?? 0} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}> (BST: {metrics.altura_bst ?? 0})</span>
          </h3>
        </div>
      </div>

      {/* Metric 3: Balance Integrity */}
      <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)',
          color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)'
        }}>
          <ShieldCheck size={24} />
        </div>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invariantes AVL</span>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: metrics.es_avl_valido ? '#34D399' : '#F87171' }}>
            {metrics.es_avl_valido ? 'Balance Estricto OK' : 'Desbalance Diferido'}
          </h3>
        </div>
      </div>

      {/* Metric 4: Efficiency Improvement */}
      <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          padding: '12px', borderRadius: '12px', background: 'rgba(234, 179, 8, 0.15)',
          color: 'var(--yellow-warm)', border: '1px solid rgba(234, 179, 8, 0.3)'
        }}>
          <Zap size={24} />
        </div>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Optimización Búsqueda</span>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-sub)', marginTop: '2px' }}>
            {metrics.eficiencia_busqueda || 'AVL O(log N) Óptimo'}
          </p>
        </div>
      </div>
    </div>
  );
}
