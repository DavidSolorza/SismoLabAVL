import React, { useState, useRef } from 'react';
import { GitCommit, Crown, ZoomIn, ZoomOut, ArrowLeftRight, ArrowLeft, ArrowRight } from 'lucide-react';

/**
 * Recursive Tree Node Component / Componente de Nodo Recursivo en Soft UI
 * Muestra explícitamente:
 * - A la izquierda los MENORES (<) (ej. 1.0 M < 5.0 M)
 * - A la derecha los MAYORES (>) (ej. 9.0 M > 5.0 M)
 */
function TreeNode({ node, isRoot = false, onSelectNode, level = 0, relacion = null }) {
  if (!node || !node.valor) return null;

  const ev = node.valor;
  const p = ev.prioridad || 3;
  const fb = node.factor_balanceo ?? 0;
  const h = node.altura ?? 0;
  const mag = typeof ev.magnitud === 'number' ? ev.magnitud.toFixed(1) : ev.magnitud;

  // Estilos pasteles para prioridades
  const priorityTheme = (p) => {
    if (p === 1) {
      return {
        bgBadge: 'var(--p1-bg)',
        textBadge: 'var(--p1-text)',
        borderBadge: 'var(--p1-border)',
        cardBorder: '#FCA5A5',
        cardShadow: 'rgba(239, 68, 68, 0.08)'
      };
    }
    if (p === 2) {
      return {
        bgBadge: 'var(--p2-bg)',
        textBadge: 'var(--p2-text)',
        borderBadge: 'var(--p2-border)',
        cardBorder: '#FCD34D',
        cardShadow: 'rgba(245, 158, 11, 0.08)'
      };
    }
    return {
      bgBadge: 'var(--p3-bg)',
      textBadge: 'var(--p3-text)',
      borderBadge: 'var(--p3-border)',
      cardBorder: '#6EE7B7',
      cardShadow: 'rgba(16, 185, 129, 0.08)'
    };
  };

  const theme = priorityTheme(p);
  const esDesbalanceado = Math.abs(fb) > 1;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      position: 'relative', margin: '0 12px'
    }}>
      
      {/* Indicador de relación con el padre (Menor < o Mayor >) */}
      {relacion && (
        <div style={{
          fontSize: '0.68rem',
          fontWeight: 800,
          padding: '2px 8px',
          borderRadius: '6px',
          marginBottom: '6px',
          letterSpacing: '0.03em',
          backgroundColor: relacion === 'MENOR' ? '#EFF6FF' : '#FEF2F2',
          color: relacion === 'MENOR' ? '#1D4ED8' : '#B91C1C',
          border: `1px solid ${relacion === 'MENOR' ? '#BFDBFE' : '#FECACA'}`,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px'
        }}>
          {relacion === 'MENOR' ? '← MENOR (<)' : 'MAYOR (>) →'}
        </div>
      )}

      {/* Tarjeta del Nodo AVL */}
      <div
        className="avl-node-card"
        onClick={() => onSelectNode(ev)}
        style={{
          padding: '12px 16px',
          borderRadius: '14px',
          border: `2px solid ${theme.cardBorder}`,
          backgroundColor: '#FFFFFF',
          boxShadow: `0 4px 16px ${theme.cardShadow}`,
          cursor: 'pointer',
          minWidth: '165px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 10
        }}
        title={`Clic para inspeccionar o corregir sismo SIS-${ev.id}`}
      >
        {/* Corona Sutil para el Nodo Raíz */}
        {isRoot && (
          <div style={{
            position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)',
            backgroundColor: '#FEF3C7', border: '1px solid #FDE68A',
            padding: '2px 8px', borderRadius: '10px', fontSize: '0.68rem',
            fontWeight: 800, color: '#92400E', display: 'flex', alignItems: 'center', gap: '4px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <Crown size={12} color="#D97706" /> RAÍZ AVL
          </div>
        )}

        {/* Encabezado del Nodo: Prioridad y Factor de Balance (FB) */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '6px', fontSize: '0.74rem'
        }}>
          <span style={{
            backgroundColor: theme.bgBadge,
            color: theme.textBadge,
            border: `1px solid ${theme.borderBadge}`,
            padding: '2px 7px',
            borderRadius: '8px',
            fontWeight: 800
          }}>
            P{p}
          </span>

          <span style={{
            backgroundColor: esDesbalanceado ? 'var(--p1-bg)' : 'var(--p3-bg)',
            color: esDesbalanceado ? 'var(--p1-text)' : 'var(--p3-text)',
            border: `1px solid ${esDesbalanceado ? 'var(--p1-border)' : 'var(--p3-border)'}`,
            padding: '1px 6px',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '0.7rem'
          }}>
            FB={fb}
          </span>
        </div>

        {/* Magnitud Sísmica Destacada (1.0 menor <-> 9.0 mayor) */}
        <div style={{
          fontSize: '1.25rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          margin: '2px 0'
        }}>
          {mag} <span style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 700 }}>M</span>
        </div>

        {/* Clave Compuesta K = [M, P, I] */}
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.78rem',
          fontWeight: 700,
          color: 'var(--text-secondary)',
          backgroundColor: '#F8FAFC',
          padding: '3px 6px',
          borderRadius: '6px',
          border: '1px solid var(--border-subtle)',
          margin: '4px 0'
        }}>
          K=({mag}M, P{p}, #{ev.id})
        </div>

        {/* Identificador y Altura */}
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {ev.formatted_id || `SIS-${ev.id}`} • h={h}
        </div>
      </div>

      {/* Conexiones SVG y Subárboles Izquierdo / Derecho */}
      {(node.hijo_izquierdo || node.hijo_derecho) && (
        <div style={{ width: '100%', marginTop: '14px' }}>
          {/* Líneas de conexión */}
          <div style={{
            display: 'flex', justifyContent: 'space-around',
            width: '100%', height: '22px', position: 'relative'
          }}>
            <svg style={{ position: 'absolute', top: '-14px', left: 0, width: '100%', height: '36px', pointerEvents: 'none' }}>
              {node.hijo_izquierdo && (
                <line x1="50%" y1="0" x2="25%" y2="36" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="3 3" />
              )}
              {node.hijo_derecho && (
                <line x1="50%" y1="0" x2="75%" y2="36" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="3 3" />
              )}
            </svg>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            {/* Rama Izquierda (MENORES <) */}
            <div style={{ opacity: node.hijo_izquierdo ? 1 : 0.3 }}>
              {node.hijo_izquierdo ? (
                <TreeNode
                  node={node.hijo_izquierdo}
                  onSelectNode={onSelectNode}
                  level={level + 1}
                  relacion="MENOR"
                />
              ) : (
                <div style={{
                  fontSize: '0.68rem', color: 'var(--text-muted)',
                  textAlign: 'center', padding: '6px 8px',
                  backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px dashed #CBD5E1'
                }}>
                  Izq (&lt; Menor): ∅
                </div>
              )}
            </div>

            {/* Rama Derecha (MAYORES >) */}
            <div style={{ opacity: node.hijo_derecho ? 1 : 0.3 }}>
              {node.hijo_derecho ? (
                <TreeNode
                  node={node.hijo_derecho}
                  onSelectNode={onSelectNode}
                  level={level + 1}
                  relacion="MAYOR"
                />
              ) : (
                <div style={{
                  fontSize: '0.68rem', color: 'var(--text-muted)',
                  textAlign: 'center', padding: '6px 8px',
                  backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px dashed #CBD5E1'
                }}>
                  Der (&gt; Mayor): ∅
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function AVLVisualizer({ treeData, onSelectEvent }) {
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef(null);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.15, 1.8));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.15, 0.5));
  const handleZoomReset = () => setZoom(1);

  if (!treeData) {
    return (
      <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center', marginBottom: '20px', backgroundColor: '#FFFFFF' }}>
        <GitCommit size={46} style={{ color: 'var(--accent)', opacity: 0.4, marginBottom: '12px' }} />
        <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 700 }}>Árbol AVL sin Nodos Activos</h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '500px', margin: '4px auto 0 auto' }}>
          El árbol se encuentra vacío. Registra un nuevo sismo mediante "<strong>Crear Evento</strong>" o procesa reportes desde la "<strong>Cola FIFO</strong>".
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: '22px 24px', marginBottom: '20px', backgroundColor: '#FFFFFF' }}>
      
      {/* Encabezado del Visualizador con Leyendas y Controles */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '14px', flexWrap: 'wrap', gap: '14px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }} className="gradient-text">
            <GitCommit size={22} style={{ color: 'var(--accent)' }} />
            <span>Topología Jerárquica del Árbol AVL</span>
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Orden numérico por Magnitud $M$ (Menor a la Izquierda $\leftarrow$, Mayor a la Derecha $\rightarrow$) con balanceo AVL $|FB| \le 1$.
          </p>
        </div>

        {/* Leyenda de Colores Pasteles y Controles de Zoom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Leyendas */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.78rem' }}>
            <span style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              backgroundColor: 'var(--p1-bg)', color: 'var(--p1-text)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700
            }}>
              P1 Crítico
            </span>
            <span style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              backgroundColor: 'var(--p2-bg)', color: 'var(--p2-text)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700
            }}>
              P2 Moderado
            </span>
            <span style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              backgroundColor: 'var(--p3-bg)', color: 'var(--p3-text)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700
            }}>
              P3 Normal
            </span>
          </div>

          {/* Controles de Zoom */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            backgroundColor: '#F1F5F9', padding: '3px 6px', borderRadius: '8px'
          }}>
            <button
              onClick={handleZoomOut}
              className="btn-secondary"
              style={{ padding: '4px 8px', border: 'none', background: '#FFFFFF', fontSize: '0.75rem' }}
              title="Alejar (-)"
            >
              <ZoomOut size={14} />
            </button>
            <button
              onClick={handleZoomReset}
              className="btn-secondary"
              style={{ padding: '4px 8px', border: 'none', background: '#FFFFFF', fontSize: '0.75rem', fontWeight: 700 }}
              title="Restablecer vista (100%)"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              className="btn-secondary"
              style={{ padding: '4px 8px', border: 'none', background: '#FFFFFF', fontSize: '0.75rem' }}
              title="Acercar (+)"
            >
              <ZoomIn size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Banner Didáctico de Bifurcación: Izquierda (Menor) vs Derecha (Mayor) */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px',
        padding: '8px 16px', borderRadius: '8px', marginBottom: '16px',
        backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)',
        fontSize: '0.8rem', color: 'var(--text-secondary)', flexWrap: 'wrap'
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#1D4ED8' }}>
          <ArrowLeft size={14} /> Rama Izquierda: Claves Menores (&lt; ej. 1.0 M)
        </span>
        <span style={{ color: 'var(--text-muted)' }}>•</span>
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          Centro: Nodo Raíz / Padre
        </span>
        <span style={{ color: 'var(--text-muted)' }}>•</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#B91C1C' }}>
          Rama Derecha: Claves Mayores (&gt; ej. 9.0 M) <ArrowRight size={14} />
        </span>
      </div>

      {/* Contenedor del Diagrama con Soporte de Zoom y Scroll Suave */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          overflowX: 'auto',
          overflowY: 'hidden',
          padding: '24px 12px 36px 12px',
          backgroundColor: '#F8FAFC',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'center',
          minHeight: '280px'
        }}
      >
        <div style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top center',
          transition: 'transform 0.2s ease',
          display: 'inline-flex',
          justifyContent: 'center'
        }}>
          <TreeNode node={treeData} isRoot={true} onSelectNode={onSelectEvent} />
        </div>
      </div>

    </div>
  );
}
