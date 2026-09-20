import React, { useState } from 'react';
import { GitCommit, Crown, ShieldCheck, ShieldAlert, ArrowDownLeft, ArrowDownRight } from 'lucide-react';

/**
 * Recursive Tree Node Component / Componente de Nodo del Árbol Recursivo
 */
function TreeNode({ node, isRoot = false, onSelectNode, level = 0 }) {
  if (!node || !node.valor) return null;

  const ev = node.valor;
  const p = ev.prioridad || 3;
  const fb = node.factor_balanceo ?? 0;
  const h = node.altura ?? 0;

  const priorityStyle = (p) => {
    if (p === 1) return { bg: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)', border: '#F87171', glow: 'rgba(239, 68, 68, 0.4)' };
    if (p === 2) return { bg: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', border: '#FBBF24', glow: 'rgba(245, 158, 11, 0.4)' };
    return { bg: 'linear-gradient(135deg, #EAB308 0%, #CA8A04 100%)', border: '#FDE047', glow: 'rgba(234, 179, 8, 0.4)' };
  };

  const style = priorityStyle(p);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      position: 'relative', margin: '0 12px'
    }}>
      
      {/* Node Card */}
      <div
        className="avl-node-card glass-panel"
        onClick={() => onSelectNode(ev)}
        style={{
          padding: '12px 16px', borderRadius: '16px',
          border: `2px solid ${style.border}`,
          background: 'rgba(30, 25, 22, 0.9)',
          boxShadow: `0 8px 24px ${style.glow}`,
          cursor: 'pointer', minWidth: '160px', textAlign: 'center',
          position: 'relative', zIndex: 10,
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {/* Crown Badge if Root Node */}
        {isRoot && (
          <div style={{
            position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #F59E0B 0%, #E05638 100%)',
            padding: '2px 10px', borderRadius: '12px', fontSize: '0.7rem',
            fontWeight: 800, color: '#FFFDF9', display: 'flex', alignItems: 'center', gap: '4px',
            boxShadow: '0 4px 10px rgba(245, 158, 11, 0.5)'
          }}>
            <Crown size={12} /> RAÍZ AVL
          </div>
        )}

        {/* Priority Badge */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '6px', fontSize: '0.75rem'
        }}>
          <span style={{
            background: style.bg, padding: '2px 8px', borderRadius: '10px',
            color: '#FFFDF9', fontWeight: 800
          }}>
            P{p}
          </span>
          <span style={{
            background: Math.abs(fb) > 1 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            color: Math.abs(fb) > 1 ? '#F87171' : '#34D399',
            padding: '2px 6px', borderRadius: '8px', fontWeight: 700, fontSize: '0.72rem'
          }}>
            FB={fb}
          </span>
        </div>

        {/* Formatted Key K */}
        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-bright)' }}>
          {ev.formatted_id || `SIS-${ev.id}`}
        </h4>

        {/* Magnitude & Height */}
        <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginTop: '2px' }}>
          <strong>{ev.magnitud} M</strong> • <span style={{ color: 'var(--text-muted)' }}>H={h}</span>
        </div>
      </div>

      {/* Children Container (Left and Right Subtrees) */}
      {(node.hijo_izquierdo || node.hijo_derecho) && (
        <div style={{ width: '100%', marginTop: '16px' }}>
          {/* Connector SVGs Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-around',
            width: '100%', height: '24px', position: 'relative'
          }}>
            <svg style={{ position: 'absolute', top: '-16px', left: 0, width: '100%', height: '40px', pointerEvents: 'none' }}>
              {node.hijo_izquierdo && (
                <line x1="50%" y1="0" x2="25%" y2="40" stroke="var(--border-warm)" strokeWidth="2" strokeDasharray="4 2" />
              )}
              {node.hijo_derecho && (
                <line x1="50%" y1="0" x2="75%" y2="40" stroke="var(--border-warm)" strokeWidth="2" strokeDasharray="4 2" />
              )}
            </svg>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
            {/* Left Subtree */}
            <div style={{ opacity: node.hijo_izquierdo ? 1 : 0.2 }}>
              {node.hijo_izquierdo ? (
                <TreeNode node={node.hijo_izquierdo} onSelectNode={onSelectNode} level={level + 1} />
              ) : (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', padding: '6px' }}>Izq: Null</div>
              )}
            </div>

            {/* Right Subtree */}
            <div style={{ opacity: node.hijo_derecho ? 1 : 0.2 }}>
              {node.hijo_derecho ? (
                <TreeNode node={node.hijo_derecho} onSelectNode={onSelectNode} level={level + 1} />
              ) : (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', padding: '6px' }}>Der: Null</div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function AVLVisualizer({ treeData, onSelectEvent }) {
  if (!treeData) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', marginBottom: '24px' }}>
        <GitCommit size={48} color="var(--terracotta)" style={{ opacity: 0.5, marginBottom: '12px' }} />
        <h3 style={{ fontSize: '1.2rem', color: 'var(--text-sub)' }}>Árbol AVL Vacío</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          No hay nodos registrados en el árbol. Utiliza "Crear Evento" o "Procesar Cola FIFO" para comenzar.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: '28px', marginBottom: '24px', overflowX: 'auto' }}>
      {/* Visualizer Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }} className="gradient-text">
            <GitCommit size={24} color="var(--terracotta)" />
            <span>Diagrama Jerárquico del Árbol AVL Recursivo</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Nodos organizados por la Clave Compuesta K = (P, M, I) con conexiones padre-hijos e indicadores de balance FB = h_izq - h_der.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '14px', fontSize: '0.8rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444' }}></span> P1 (Crítico)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B' }}></span> P2 (Media)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EAB308' }}></span> P3 (Baja)
          </span>
        </div>
      </div>

      {/* Tree Diagram Container */}
      <div style={{
        display: 'flex', justifyContent: 'center', padding: '20px 10px 40px 10px',
        minWidth: '600px', overflowX: 'auto'
      }}>
        <TreeNode node={treeData} isRoot={true} onSelectNode={onSelectEvent} />
      </div>
    </div>
  );
}
