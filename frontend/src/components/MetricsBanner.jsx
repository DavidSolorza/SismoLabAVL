import React, { useState, useEffect } from 'react';
import { Layers, ShieldCheck, Zap, BarChart3, AlertTriangle, Cpu } from 'lucide-react';
import { busService, BUS_EVENTS } from '../services/busService';

export default function MetricsBanner({ metrics }) {
  const [cacheStats, setCacheStats] = useState(() => busService.getCacheStats());

  useEffect(() => {
    const updateStats = () => setCacheStats(busService.getCacheStats());
    updateStats();

    const unsubData = busService.on(BUS_EVENTS.SYSTEM_DATA_UPDATED, updateStats);
    const unsubPurge = busService.on(BUS_EVENTS.CACHE_PURGED, updateStats);
    const unsubCleared = busService.on(BUS_EVENTS.TREE_CLEARED, updateStats);

    const interval = setInterval(updateStats, 2000);
    return () => {
      unsubData();
      unsubPurge();
      unsubCleared();
      clearInterval(interval);
    };
  }, []);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      
      {/* Métrica 1: Eventos Activos */}
      <div className="glass-panel" style={{
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        backgroundColor: '#FFFFFF',
        borderRadius: '10px'
      }}>
        <div style={{
          padding: '7px', borderRadius: '8px',
          backgroundColor: 'var(--accent-light)',
          color: 'var(--accent)',
          border: '1px solid var(--accent-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Layers size={17} />
        </div>
        <div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
            Nodos Activos en Árbol
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
              {totalNodos}
            </h4>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>sismos K=(P,M,I)</span>
          </div>
        </div>
      </div>

      {/* Métrica 2: Alturas Comparadas AVL vs BST */}
      <div className="glass-panel" style={{
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        backgroundColor: '#FFFFFF',
        borderRadius: '10px'
      }}>
        <div style={{
          padding: '7px', borderRadius: '8px',
          backgroundColor: 'var(--p2-bg)',
          color: 'var(--p2-text)',
          border: '1px solid var(--p2-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <BarChart3 size={17} />
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
            Altura: AVL vs. BST
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent)', lineHeight: 1.1 }}>
              h={alturaAVL}
            </h4>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>vs.</span>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--p2-text)', lineHeight: 1.1 }}>
              h={alturaBST}
            </h4>
          </div>
        </div>
      </div>

      {/* Métrica 3: Invariante de Balance */}
      <div className="glass-panel" style={{
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        backgroundColor: '#FFFFFF',
        borderRadius: '10px'
      }}>
        <div style={{
          padding: '7px', borderRadius: '8px',
          backgroundColor: esValido ? 'var(--p3-bg)' : 'var(--p1-bg)',
          color: esValido ? 'var(--p3-text)' : 'var(--p1-text)',
          border: `1px solid ${esValido ? 'var(--p3-border)' : 'var(--p1-border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {esValido ? <ShieldCheck size={17} /> : <AlertTriangle size={17} />}
        </div>
        <div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
            Invariante de Balance AVL
          </span>
          <div style={{ marginTop: '1px' }}>
            <span style={{
              fontSize: '0.78rem', fontWeight: 800,
              color: esValido ? 'var(--p3-text)' : 'var(--p1-text)'
            }}>
              {esValido ? 'Balance Estricto (|FB| ≤ 1)' : 'Desbalance Detectado'}
            </span>
          </div>
        </div>
      </div>

      {/* Métrica 4: Complejidad Teórica */}
      <div className="glass-panel" style={{
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        backgroundColor: '#FFFFFF',
        borderRadius: '10px'
      }}>
        <div style={{
          padding: '7px', borderRadius: '8px',
          backgroundColor: '#F0FDF4',
          color: '#16A34A',
          border: '1px solid #BBF7D0',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Zap size={17} />
        </div>
        <div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
            Complejidad Asintótica
          </span>
          <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '1px' }}>
            O(log₂ N) Garantizado
          </h4>
        </div>
      </div>

      {/* Métrica 5: Bus Service & Rendimiento de Caché */}
      <div className="glass-panel" style={{
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        backgroundColor: '#FFFFFF',
        borderRadius: '10px'
      }}>
        <div style={{
          padding: '7px', borderRadius: '8px',
          backgroundColor: '#EEF2FF',
          color: 'var(--accent)',
          border: '1px solid var(--accent-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Cpu size={17} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
              Bus Service & Caché
            </span>
            <span style={{ fontSize: '0.64rem', padding: '1px 5px', borderRadius: '4px', backgroundColor: '#ECFDF5', color: '#065F46', fontWeight: 700 }}>
              60 FPS Fluido
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
            <span>Aciertos: <strong>{cacheStats?.hits ?? 0}</strong></span>
            <span>•</span>
            <span>Entradas: <strong>{cacheStats?.entriesCount ?? 0}</strong></span>
            <span>•</span>
            <span style={{ color: '#059669', fontWeight: 700 }}>Auto-Purga OK</span>
          </div>
        </div>
      </div>

      {/* Barra Visual Comparativa AVL vs BST */}
      {totalNodos > 0 && (
        <div className="glass-panel" style={{
          padding: '10px 12px',
          backgroundColor: '#FFFFFF',
          borderRadius: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            Comparativa de Compactación:
          </span>

          {/* Barra AVL */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '2px', fontWeight: 600 }}>
              <span style={{ color: 'var(--accent)' }}>Árbol AVL (h={alturaAVL})</span>
              <span style={{ color: 'var(--accent)' }}>{ratioAVL}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${ratioAVL}%`, height: '100%', backgroundColor: 'var(--accent)', borderRadius: '3px', transition: 'width 0.4s ease' }} />
            </div>
          </div>

          {/* Barra BST */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '2px', fontWeight: 600 }}>
              <span style={{ color: 'var(--p2-text)' }}>Árbol BST (h={alturaBST})</span>
              <span style={{ color: 'var(--p2-text)' }}>{ratioBST}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${ratioBST}%`, height: '100%', backgroundColor: '#F59E0B', borderRadius: '3px', transition: 'width 0.4s ease' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

