import React from 'react';
import { Layers, ShieldCheck, Zap, BarChart3, AlertTriangle } from 'lucide-react';

export default function MetricsBanner({ metrics }) {
  if (!metrics) return null;

  const alturaAVL = metrics.altura_avl ?? 0;
  const alturaBST = metrics.altura_bst ?? 0;
  const totalNodos = metrics.total_nodos ?? 0;
  const esValido = metrics.es_avl_valido;

  // Cálculo de ratio visual para la barra comparativa AVL vs BST
  const maxAltura = Math.max(alturaAVL, alturaBST, 1);
  const ratioAVL = Math.round((alturaAVL / maxAltura) * 100);
  const ratioBST = Math.round((alturaBST / maxAltura) * 100);

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '14px',
        marginBottom: '14px'
      }}>
        {/* Métrica 1: Eventos Activos */}
        <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px', backgroundColor: '#FFFFFF' }}>
          <div style={{
            padding: '10px', borderRadius: '12px',
            backgroundColor: 'var(--accent-light)',
            color: 'var(--accent)',
            border: '1px solid var(--accent-border)'
          }}>
            <Layers size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
              Eventos Activos en Árbol
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
              <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {totalNodos}
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>nodos K=(P,M,I)</span>
            </div>
          </div>
        </div>

        {/* Métrica 2: Alturas Comparadas AVL vs BST */}
        <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px', backgroundColor: '#FFFFFF' }}>
          <div style={{
            padding: '10px', borderRadius: '12px',
            backgroundColor: 'var(--p2-bg)',
            color: 'var(--p2-text)',
            border: '1px solid var(--p2-border)'
          }}>
            <BarChart3 size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
              Altura: AVL vs. BST
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
              <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--accent)' }}>
                h={alturaAVL}
              </h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}> vs.</span>
              <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--p2-text)' }}>
                h={alturaBST}
              </h3>
            </div>
          </div>
        </div>

        {/* Métrica 3: Estado de Balance e Invariantes */}
        <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px', backgroundColor: '#FFFFFF' }}>
          <div style={{
            padding: '10px', borderRadius: '12px',
            backgroundColor: esValido ? 'var(--p3-bg)' : 'var(--p1-bg)',
            color: esValido ? 'var(--p3-text)' : 'var(--p1-text)',
            border: `1px solid ${esValido ? 'var(--p3-border)' : 'var(--p1-border)'}`
          }}>
            {esValido ? <ShieldCheck size={22} /> : <AlertTriangle size={22} />}
          </div>
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
              Invariante de Balance AVL
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span style={{
                fontSize: '0.86rem', fontWeight: 800,
                color: esValido ? 'var(--p3-text)' : 'var(--p1-text)'
              }}>
                {esValido ? 'Balance Estricto (FB ∈ [-1, 1])' : 'Desbalance Temporal (Estrés)'}
              </span>
            </div>
          </div>
        </div>

        {/* Métrica 4: Complejidad Teórica */}
        <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px', backgroundColor: '#FFFFFF' }}>
          <div style={{
            padding: '10px', borderRadius: '12px',
            backgroundColor: '#F0FDF4',
            color: '#16A34A',
            border: '1px solid #BBF7D0'
          }}>
            <Zap size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
              Complejidad Asintótica
            </span>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
              O(log₂ N) Garantizado
            </h3>
          </div>
        </div>
      </div>

      {/* Barra Visual Comparativa de Eficiencia AVL vs BST */}
      {totalNodos > 0 && (
        <div className="glass-panel" style={{ padding: '12px 18px', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Comparativa Visual de Compactación de Altura:
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, minWidth: '280px', maxWidth: '600px' }}>
            {/* Barra AVL */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '3px', fontWeight: 600 }}>
                <span style={{ color: 'var(--accent)' }}>Árbol AVL (h={alturaAVL})</span>
                <span style={{ color: 'var(--accent)' }}>{ratioAVL}%</span>
              </div>
              <div style={{ width: '100%', height: '7px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${ratioAVL}%`, height: '100%', backgroundColor: 'var(--accent)', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
              </div>
            </div>

            {/* Barra BST */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '3px', fontWeight: 600 }}>
                <span style={{ color: 'var(--p2-text)' }}>Árbol BST (h={alturaBST})</span>
                <span style={{ color: 'var(--p2-text)' }}>{ratioBST}%</span>
              </div>
              <div style={{ width: '100%', height: '7px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${ratioBST}%`, height: '100%', backgroundColor: '#F59E0B', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
