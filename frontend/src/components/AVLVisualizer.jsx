import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  GitCommit, Crown, ZoomIn, ZoomOut, Maximize2, Minimize2,
  Move, Search, AlertTriangle, CheckCircle2, Split, Crosshair,
  PlusCircle, Sparkles, Undo2, BarChart3, Database, Clock,
  Scissors, Trash2, RefreshCw, Activity, Layers, GitBranch, X
} from 'lucide-react';

/**
 * Temas visuales por nivel de prioridad sísmica
 */
const PRIORITY_THEMES = {
  1: {
    bgBadge: 'var(--p1-bg)',
    textBadge: 'var(--p1-text)',
    borderBadge: 'var(--p1-border)',
    cardBorder: '#FCA5A5',
    cardShadow: 'rgba(239, 68, 68, 0.08)'
  },
  2: {
    bgBadge: 'var(--p2-bg)',
    textBadge: 'var(--p2-text)',
    borderBadge: 'var(--p2-border)',
    cardBorder: '#FCD34D',
    cardShadow: 'rgba(245, 158, 11, 0.08)'
  },
  3: {
    bgBadge: 'var(--p3-bg)',
    textBadge: 'var(--p3-text)',
    borderBadge: 'var(--p3-border)',
    cardBorder: '#6EE7B7',
    cardShadow: 'rgba(16, 185, 129, 0.08)'
  }
};

/**
 * Componente de Nodo Recursivo en Soft UI Ultra-Optimizado (Memoizado a 60 FPS)
 * Soporta renderizado adaptativo para Árbol AVL y Árbol BST estándar,
 * con resaltado en tiempo real según búsqueda en el mapa.
 */
const TreeNode = React.memo(function TreeNode({ node, isRoot = false, onSelectNode, level = 0, relacion = null, treeType = 'AVL', searchQuery = '' }) {
  if (!node || !node.valor) return null;

  const ev = node.valor;
  const p = ev.prioridad || 3;
  const fb = node.factor_balanceo ?? 0;
  const h = node.altura ?? 0;
  const mag = typeof ev.magnitud === 'number' ? ev.magnitud.toFixed(1) : ev.magnitud;
  const esDesbalanceado = Math.abs(fb) > 1;

  // Comprobar si el nodo coincide con el término de búsqueda
  const matchesSearch = searchQuery.trim() !== '' && (
    ev.id.toString().includes(searchQuery.trim()) ||
    mag.toString().includes(searchQuery.trim()) ||
    (ev.estacion_id && ev.estacion_id.toLowerCase().includes(searchQuery.trim().toLowerCase()))
  );

  const theme = PRIORITY_THEMES[p] || PRIORITY_THEMES[3];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      position: 'relative', margin: '0 8px'
    }}>
      
      {/* Indicador de relación con el padre (Menor < o Mayor >) */}
      {relacion && (
        <div style={{
          fontSize: '0.62rem',
          fontWeight: 800,
          padding: '2px 6px',
          borderRadius: '5px',
          marginBottom: '5px',
          letterSpacing: '0.03em',
          backgroundColor: relacion === 'MENOR' ? '#EFF6FF' : '#FEF2F2',
          color: relacion === 'MENOR' ? '#1D4ED8' : '#B91C1C',
          border: `1px solid ${relacion === 'MENOR' ? '#BFDBFE' : '#FECACA'}`,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '2px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {relacion === 'MENOR' ? '← MENOR (<)' : 'MAYOR (>) →'}
        </div>
      )}

      {/* Tarjeta del Nodo */}
      <div
        className="avl-node-card"
        onClick={(e) => {
          e.stopPropagation();
          onSelectNode(ev);
        }}
        style={{
          padding: '8px 11px',
          borderRadius: '11px',
          border: matchesSearch
            ? '3px solid #F59E0B'
            : (esDesbalanceado && treeType === 'BST' ? '2px dashed #EF4444' : `2px solid ${theme.cardBorder}`),
          backgroundColor: matchesSearch
            ? '#FEF3C7'
            : (esDesbalanceado && treeType === 'BST' ? '#FFF5F5' : '#FFFFFF'),
          boxShadow: matchesSearch
            ? '0 0 0 3px rgba(245, 158, 11, 0.35), 0 6px 16px rgba(245, 158, 11, 0.2)'
            : `0 3px 10px ${theme.cardShadow}`,
          cursor: 'pointer',
          minWidth: '124px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 10,
          transform: matchesSearch ? 'scale(1.06)' : 'none',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease'
        }}
        title={`Clic para inspeccionar sismo SIS-${ev.id} (M=${mag}, P=${p})`}
      >
        {/* Corona Sutil para el Nodo Raíz */}
        {isRoot && (
          <div style={{
            position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)',
            backgroundColor: treeType === 'AVL' ? '#FEF3C7' : '#ECFDF5',
            border: `1px solid ${treeType === 'AVL' ? '#FDE68A' : '#A7F3D0'}`,
            padding: '2px 8px', borderRadius: '10px', fontSize: '0.68rem',
            fontWeight: 800,
            color: treeType === 'AVL' ? '#92400E' : '#065F46',
            display: 'flex', alignItems: 'center', gap: '4px',
            boxShadow: 'var(--shadow-sm)', whiteSpace: 'nowrap'
          }}>
            <Crown size={12} color={treeType === 'AVL' ? '#D97706' : '#059669'} />
            RAÍZ {treeType}
          </div>
        )}

        {/* Encabezado del Nodo: Prioridad y Factor de Balance (FB) */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '5px', fontSize: '0.72rem'
        }}>
          <span style={{
            backgroundColor: theme.bgBadge,
            color: theme.textBadge,
            border: `1px solid ${theme.borderBadge}`,
            padding: '2px 6px',
            borderRadius: '7px',
            fontWeight: 800
          }}>
            P{p}
          </span>

          <span style={{
            backgroundColor: esDesbalanceado ? 'var(--p1-bg)' : 'var(--p3-bg)',
            color: esDesbalanceado ? 'var(--p1-text)' : 'var(--p3-text)',
            border: `1px solid ${esDesbalanceado ? 'var(--p1-border)' : 'var(--p3-border)'}`,
            padding: '1px 5px',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '0.68rem',
            display: 'inline-flex', alignItems: 'center', gap: '2px'
          }}>
            {esDesbalanceado && <AlertTriangle size={10} />}
            FB={fb}
          </span>
        </div>

        {/* Magnitud Sísmica Destacada */}
        <div style={{
          fontSize: '1.02rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          margin: '1px 0'
        }}>
          {mag} <span style={{ fontSize: '0.74rem', color: 'var(--accent)', fontWeight: 700 }}>M</span>
        </div>

        {/* Clave Compuesta K = (P, M, I) */}
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.68rem',
          fontWeight: 700,
          color: 'var(--text-secondary)',
          backgroundColor: '#F8FAFC',
          padding: '1px 4px',
          borderRadius: '4px',
          border: '1px solid var(--border-subtle)',
          margin: '2px 0'
        }}>
          K=(P{p}, {mag}M, #{ev.id})
        </div>

        {/* Identificador y Altura */}
        <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
          {ev.formatted_id || `SIS-${ev.id}`} • h={h}
        </div>
      </div>

      {/* Conexiones SVG y Subárboles Izquierdo / Derecho */}
      {(node.hijo_izquierdo || node.hijo_derecho) && (
        <div style={{ width: '100%', marginTop: '9px' }}>
          {/* Líneas de conexión */}
          <div style={{
            display: 'flex', justifyContent: 'space-around',
            width: '100%', height: '18px', position: 'relative'
          }}>
            <svg style={{ position: 'absolute', top: '-9px', left: 0, width: '100%', height: '28px', pointerEvents: 'none' }}>
              {node.hijo_izquierdo && (
                <line x1="50%" y1="0" x2="25%" y2="28" stroke="#94A3B8" strokeWidth="1.8" strokeDasharray="3 3" />
              )}
              {node.hijo_derecho && (
                <line x1="50%" y1="0" x2="75%" y2="28" stroke="#94A3B8" strokeWidth="1.8" strokeDasharray="3 3" />
              )}
            </svg>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            {/* Rama Izquierda (MENORES <) */}
            <div style={{ opacity: node.hijo_izquierdo ? 1 : 0.35 }}>
              {node.hijo_izquierdo ? (
                <TreeNode
                  node={node.hijo_izquierdo}
                  onSelectNode={onSelectNode}
                  level={level + 1}
                  relacion="MENOR"
                  treeType={treeType}
                  searchQuery={searchQuery}
                />
              ) : (
                <div style={{
                  fontSize: '0.66rem', color: 'var(--text-muted)',
                  textAlign: 'center', padding: '5px 7px',
                  backgroundColor: '#F8FAFC', borderRadius: '5px', border: '1px dashed #CBD5E1'
                }}>
                  Izq (&lt; Menor): ∅
                </div>
              )}
            </div>

            {/* Rama Derecha (MAYORES >) */}
            <div style={{ opacity: node.hijo_derecho ? 1 : 0.35 }}>
              {node.hijo_derecho ? (
                <TreeNode
                  node={node.hijo_derecho}
                  onSelectNode={onSelectNode}
                  level={level + 1}
                  relacion="MAYOR"
                  treeType={treeType}
                  searchQuery={searchQuery}
                />
              ) : (
                <div style={{
                  fontSize: '0.66rem', color: 'var(--text-muted)',
                  textAlign: 'center', padding: '5px 7px',
                  backgroundColor: '#F8FAFC', borderRadius: '5px', border: '1px dashed #CBD5E1'
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
});

/**
 * Visualizador Topológico en Pantalla Completa
 * Estructura Perimetral Elíptica: Centro 100% Despejado con Docks en Esquinas y Perímetro
 */
export default function AVLVisualizer({
  treeData,
  bstData,
  onSelectEvent,
  // Docks & Modals Triggers
  onOpenCreateModal,
  onOpenPresetsModal,
  onOpenMetricsModal,
  onOpenEventsModal,
  onOpenQueueModal,
  onUndo,
  onArchiveBranch,
  onClearTree,
  onToggleMode,
  onRefresh,
  currentMode = 'NORMAL',
  eventsCount = 0,
  queueCount = 0,
  loading = false,
  simulationClock = '2026-09-22T12:00:00Z',
  onOpenClockModal
}) {
  const [viewMode, setViewMode] = useState('dual'); // 'dual' | 'avl' | 'bst'
  const [zoom, setZoom] = useState(0.8); // Predeterminado a 80% (20% menos de saturación)
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const rAFRef = useRef(null);

  const mapContainerRef = useRef(null);

  // Debouncing de búsqueda para no sobrecargar el renderizado del árbol en cada tecla
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 120);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Manejo de Arrastre y Paneo (Pan & Drag) optimizado con rAF (60 FPS fluidos)
  const handleMouseDown = (e) => {
    // Si se hace clic en un botón, input o nodo, no activar arrastre del mapa
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.avl-node-card')) {
      return;
    }
    setIsDragging(true);
    setDragStart({
      x: e.clientX - pan.x,
      y: e.clientY - pan.y
    });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const nextX = e.clientX - dragStart.x;
    const nextY = e.clientY - dragStart.y;
    if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
    rAFRef.current = requestAnimationFrame(() => {
      setPan({ x: nextX, y: nextY });
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
    setIsDragging(false);
  }, []);

  useEffect(() => {
    return () => {
      if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
    };
  }, []);

  // Manejo directo de Zoom con la Rueda del Ratón (Scroll = Zoom directo tipo Figma/Maps)
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const handleWheelZoom = (e) => {
      e.preventDefault();
      // Scroll hacia arriba = Zoom In (+), hacia abajo = Zoom Out (-)
      const zoomFactor = e.deltaY < 0 ? 1.09 : 0.91;
      setZoom(prev => {
        const nextZoom = parseFloat((prev * zoomFactor).toFixed(2));
        return Math.min(Math.max(nextZoom, 0.25), 3.0);
      });
    };

    container.addEventListener('wheel', handleWheelZoom, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheelZoom);
    };
  }, []);

  // Controles de Zoom y Centrado
  const handleZoomIn = () => setZoom(prev => Math.min(parseFloat((prev + 0.15).toFixed(2)), 3.0));
  const handleZoomOut = () => setZoom(prev => Math.max(parseFloat((prev - 0.15).toFixed(2)), 0.25));
  const handleResetView = () => {
    setZoom(0.8);
    setPan({ x: 0, y: 0 });
  };

  // Métricas de los árboles
  const avlHeight = treeData ? treeData.altura : 0;
  const bstHeight = bstData ? bstData.altura : 0;
  const hasAnyTree = Boolean(treeData || bstData);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: '#F8FAFC',
      userSelect: 'none'
    }}>

      {/* ========================================================================= */}
      {/* 1. BLOQUE IZQUIERDO: IDENTIDAD Y ESTADO OPERATIVO                         */}
      {/* ========================================================================= */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        gap: '9px',
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(10px)',
        padding: '5px 12px',
        borderRadius: '11px',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-md)'
      }}>
        {/* Logotipo y Título */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div style={{
            padding: '4px',
            borderRadius: '7px',
            backgroundColor: 'var(--accent-light)',
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Activity size={15} />
          </div>
          <div>
            <h1 style={{ fontSize: '0.88rem', fontWeight: 800, lineHeight: 1.1 }} className="gradient-text">
              SismoLab AVL
            </h1>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Universidad de Caldas
            </span>
          </div>
        </div>

        <div style={{ height: '18px', width: '1px', backgroundColor: 'var(--border-subtle)' }} />

        {/* Indicador del Modo (Normal / Estrés) */}
        <button
          onClick={onToggleMode}
          className="btn-secondary"
          style={{
            padding: '3px 8px',
            fontSize: '0.7rem',
            fontWeight: 800,
            borderRadius: '7px',
            backgroundColor: currentMode === 'NORMAL' ? 'var(--p3-bg)' : 'var(--p1-bg)',
            color: currentMode === 'NORMAL' ? 'var(--p3-text)' : 'var(--p1-text)',
            border: `1px solid ${currentMode === 'NORMAL' ? 'var(--p3-border)' : 'var(--p1-border)'}`,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer'
          }}
          title="Alternar entre balance inmediato (NORMAL) y balance diferido (ESTRÉS)"
        >
          <Activity size={11} />
          <span>Estado: {currentMode}</span>
        </button>

        <div style={{ height: '18px', width: '1px', backgroundColor: 'var(--border-subtle)' }} />

        {/* Métricas Rápidas del Árbol */}
        <span style={{
          fontSize: '0.68rem',
          fontWeight: 800,
          padding: '3px 8px',
          borderRadius: '6px',
          backgroundColor: '#F1F5F9',
          color: 'var(--text-secondary)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          <Layers size={11} style={{ color: 'var(--accent)' }} />
          <span>AVL: <strong>h={avlHeight}</strong> · BST: <strong>h={bstHeight}</strong></span>
        </span>
      </div>

      {/* ========================================================================= */}
      {/* 2. BLOQUE CENTRAL: RELOJ DE SIMULACIÓN Y FILTROS DE VISUALIZACIÓN         */}
      {/* ========================================================================= */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        gap: '9px',
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(10px)',
        padding: '4px 10px',
        borderRadius: '11px',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-md)'
      }}>
        {/* Reloj de Simulación UTC + Sincronización */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          <button
            onClick={onOpenClockModal}
            className="btn-secondary"
            style={{
              padding: '4px 8px',
              fontSize: '0.7rem',
              fontWeight: 800,
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontFamily: 'var(--font-mono)',
              backgroundColor: '#EEF2FF',
              color: 'var(--accent)',
              borderColor: '#C7D2FE',
              cursor: 'pointer'
            }}
            title="Ajustar o avanzar el Reloj de Simulación (UTC)"
          >
            <Clock size={12} style={{ color: 'var(--accent)' }} />
            <span>{simulationClock ? simulationClock.replace('2026-', '').replace('Z', ' UTC') : '12:00:00 UTC'}</span>
          </button>

          <button
            onClick={onRefresh}
            className="btn-secondary"
            style={{ padding: '4px 6px', border: 'none', background: '#F1F5F9', borderRadius: '6px', cursor: 'pointer' }}
            title="Sincronizar y recargar estado del sistema"
          >
            <RefreshCw size={12} className={loading ? 'spin-animation' : ''} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        <div style={{ height: '18px', width: '1px', backgroundColor: 'var(--border-subtle)' }} />

        {/* Selector de Vista: Ambos (Dual) | Solo AVL | Solo BST */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: '#F1F5F9',
          padding: '2px',
          borderRadius: '7px',
          gap: '2px'
        }}>
          <button
            onClick={() => setViewMode('dual')}
            style={{
              padding: '4px 9px',
              fontSize: '0.74rem',
              fontWeight: 700,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: viewMode === 'dual' ? '#FFFFFF' : 'transparent',
              color: viewMode === 'dual' ? 'var(--accent)' : 'var(--text-secondary)',
              boxShadow: viewMode === 'dual' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            <Split size={13} />
            <span>Ambos (Dual)</span>
          </button>

          <button
            onClick={() => setViewMode('avl')}
            style={{
              padding: '4px 9px',
              fontSize: '0.74rem',
              fontWeight: 700,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: viewMode === 'avl' ? '#FFFFFF' : 'transparent',
              color: viewMode === 'avl' ? 'var(--accent)' : 'var(--text-secondary)',
              boxShadow: viewMode === 'avl' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            <Layers size={13} />
            <span>Solo AVL</span>
          </button>

          <button
            onClick={() => setViewMode('bst')}
            style={{
              padding: '4px 9px',
              fontSize: '0.74rem',
              fontWeight: 700,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: viewMode === 'bst' ? '#FFFFFF' : 'transparent',
              color: viewMode === 'bst' ? 'var(--accent)' : 'var(--text-secondary)',
              boxShadow: viewMode === 'bst' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            <GitBranch size={13} />
            <span>Solo BST</span>
          </button>
        </div>

        <div style={{ height: '18px', width: '1px', backgroundColor: 'var(--border-subtle)' }} />

        {/* Barra de Búsqueda Global por ID / Magnitud */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          backgroundColor: '#F1F5F9',
          padding: '3px 8px',
          borderRadius: '7px',
          border: '1px solid var(--border-subtle)'
        }}>
          <Search size={13} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar nodo (#ID, Mag)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '0.72rem',
              width: '130px',
              color: 'var(--text-primary)'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)' }}
              title="Limpiar búsqueda"
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BLOQUE DERECHO: ACCIONES CRÍTICAS (PRINCIPALES)                         */}
      {/* ========================================================================= */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(10px)',
        padding: '5px 8px',
        borderRadius: '11px',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-md)'
      }}>
        {/* Deshacer (Undo LIFO) */}
        <button
          onClick={onUndo}
          className="btn-secondary"
          style={{ padding: '6px 10px', fontSize: '0.74rem', fontWeight: 600 }}
          title="Revertir la última acción mediante la Pila LIFO"
        >
          <Undo2 size={13} />
          <span>Deshacer</span>
        </button>

        {/* Sismos Predefinidos */}
        <button
          onClick={onOpenPresetsModal}
          className="btn-secondary"
          style={{
            padding: '6px 10px',
            fontSize: '0.74rem',
            fontWeight: 700,
            backgroundColor: '#FEF3C7',
            color: '#92400E',
            borderColor: '#FDE68A'
          }}
          title="Abrir catálogo rápido de sismos colombianos predefinidos"
        >
          <Sparkles size={13} style={{ color: '#D97706' }} />
          <span>Sismos Predefinidos</span>
        </button>

        {/* + Nuevo Sismo */}
        <button
          onClick={onOpenCreateModal}
          className="btn-primary"
          style={{ padding: '6px 12px', fontSize: '0.76rem', fontWeight: 700 }}
        >
          <PlusCircle size={14} />
          <span>+ Nuevo Sismo</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 4. ESQUINA INFERIOR IZQUIERDA: DOCK DE HERRAMIENTAS Y MÓDULOS DEL SISTEMA */}
      {/* ========================================================================= */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(10px)',
        padding: '5px 9px',
        borderRadius: '11px',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-lg)',
        flexWrap: 'wrap'
      }}>
        {/* Botón Métricas */}
        <button
          onClick={onOpenMetricsModal}
          className="btn-secondary"
          style={{ padding: '5px 9px', fontSize: '0.74rem', fontWeight: 700 }}
          title="Ver auditoría de invariantes, eficiencia y métricas completas"
        >
          <BarChart3 size={13} style={{ color: 'var(--accent)' }} />
          <span>Métricas & Benchmark</span>
        </button>

        {/* Botón Catálogo de Eventos */}
        <button
          onClick={onOpenEventsModal}
          className="btn-secondary"
          style={{ padding: '5px 9px', fontSize: '0.74rem', fontWeight: 700 }}
          title="Ver tabla y catálogo completo de eventos activos en el árbol"
        >
          <Database size={13} style={{ color: '#059669' }} />
          <span>Eventos Sísmicos ({eventsCount})</span>
        </button>

        {/* Botón Cola FIFO de Telemetría */}
        <button
          onClick={onOpenQueueModal}
          className="btn-secondary"
          style={{ padding: '5px 9px', fontSize: '0.74rem', fontWeight: 700 }}
          title="Inspeccionar cola FIFO de telemetría y procesar ráfagas"
        >
          <Clock size={13} style={{ color: '#D97706' }} />
          <span>Cola FIFO {queueCount > 0 ? `(${queueCount})` : ''}</span>
        </button>

        <div style={{ height: '18px', width: '1px', backgroundColor: 'var(--border-subtle)' }} />

        {/* Botón Archivar Rama P3 */}
        <button
          onClick={onArchiveBranch}
          className="btn-secondary"
          style={{ padding: '5px 8px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}
          title="Podar y archivar rama elegible de baja prioridad (P3)"
        >
          <Scissors size={12} />
          <span>Archivar P3</span>
        </button>

        {/* Botón Vaciar Árbol */}
        <button
          onClick={onClearTree}
          className="btn-secondary"
          style={{
            padding: '5px 8px',
            fontSize: '0.72rem',
            backgroundColor: '#FEE2E2',
            color: '#991B1B',
            borderColor: '#FECACA'
          }}
          title="Vaciar totalmente el árbol AVL y BST para pruebas limpias (0 nodos)"
        >
          <Trash2 size={12} />
          <span>Limpiar Árbol</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 5. ESQUINA INFERIOR DERECHA: HUD DE NAVEGACIÓN, ZOOM Y LEYENDA            */}
      {/* ========================================================================= */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        right: '12px',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(10px)',
        padding: '5px 9px',
        borderRadius: '11px',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Leyenda Didáctica Compacta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem' }}>
          <span style={{ color: '#1D4ED8', fontWeight: 800 }}>← Menor</span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span style={{ color: '#B91C1C', fontWeight: 800 }}>Mayor →</span>
          <span style={{ color: 'var(--text-muted)' }}>•</span>
          <span style={{ color: '#065F46', fontWeight: 700 }}>|FB| ≤ 1</span>
        </div>

        <div style={{ height: '20px', width: '1px', backgroundColor: 'var(--border-subtle)' }} />

        {/* Telemetría de Paneo */}
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Pan: X={Math.round(pan.x)}, Y={Math.round(pan.y)}
        </span>

        {/* Controles de Zoom */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          backgroundColor: '#F1F5F9',
          padding: '2px 4px',
          borderRadius: '8px'
        }}>
          <button
            onClick={handleZoomOut}
            className="btn-secondary"
            style={{ padding: '3px 6px', border: 'none', background: '#FFFFFF', fontSize: '0.72rem' }}
            title="Alejar (-)"
          >
            <ZoomOut size={13} />
          </button>
          <button
            onClick={handleResetView}
            className="btn-secondary"
            style={{ padding: '3px 7px', border: 'none', background: '#FFFFFF', fontSize: '0.72rem', fontWeight: 800 }}
            title="Restablecer zoom predeterminado (80%)"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            className="btn-secondary"
            style={{ padding: '3px 6px', border: 'none', background: '#FFFFFF', fontSize: '0.72rem' }}
            title="Acercar (+)"
          >
            <ZoomIn size={13} />
          </button>
          <button
            onClick={handleResetView}
            className="btn-secondary"
            style={{ padding: '3px 6px', border: 'none', background: '#FFFFFF', fontSize: '0.72rem', color: 'var(--accent)' }}
            title="Centrar mapa en la raíz"
          >
            <Crosshair size={13} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. EL CENTRO DESPEJADO: LIENZO INFINITO DEL MAPA TOPOLÓGICO SÍSMICO       */}
      {/* ========================================================================= */}
      <div
        ref={mapContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          position: 'absolute',
          top: 0,
          left: 0,
          backgroundColor: '#F8FAFC',
          backgroundImage: 'radial-gradient(circle, #CBD5E1 1.2px, transparent 1.2px)',
          backgroundSize: '24px 24px',
          cursor: isDragging ? 'grabbing' : 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Superficie Transformable de los Árboles en el Centro */}
        <div style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.12s cubic-bezier(0.2, 0, 0, 1)',
          willChange: isDragging ? 'transform' : 'auto',
          display: 'inline-flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '60px 80px',
          minWidth: 'max-content'
        }}>
          
          {!hasAnyTree ? (
            <div style={{
              textAlign: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.65)',
              backdropFilter: 'blur(16px)',
              padding: '40px 48px',
              borderRadius: 'var(--radius-xl)',
              border: '2px dashed #CBD5E1',
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
              maxWidth: '440px'
            }}>
              <GitCommit size={48} style={{ color: 'var(--accent)', opacity: 0.4, marginBottom: '12px' }} />
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                Árboles Vacíos (0 Nodos)
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
                Usa el botón <strong>"+ Nuevo Sismo"</strong> o <strong>"Sismos Predefinidos"</strong> en la esquina superior derecha para comenzar.
              </p>
            </div>
          ) : (
            <>
              {/* MODO 1: DUAL (AMBOS ÁRBOLES EN PARALELO) */}
              {viewMode === 'dual' && (
                <div style={{
                  display: 'flex',
                  gap: '60px',
                  alignItems: 'flex-start',
                  justifyContent: 'center'
                }}>
                  {/* Tarjeta Contenedora: Árbol AVL */}
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.65)',
                    backdropFilter: 'blur(16px)',
                    borderRadius: 'var(--radius-xl)',
                    border: '2px dashed var(--accent-border)',
                    padding: '20px 24px',
                    boxShadow: '0 10px 30px rgba(79, 70, 229, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: '460px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px',
                      paddingBottom: '12px',
                      borderBottom: '1px dashed #CBD5E1'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ padding: '6px', borderRadius: '10px', backgroundColor: 'var(--accent-light)', color: 'var(--accent)', display: 'flex' }}>
                          <Layers size={18} />
                        </div>
                        <div>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            Árbol AVL (Auto-balanceado)
                          </h4>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                            Rotaciones activas automáticas en O(log n)
                          </span>
                        </div>
                      </div>
                      <span style={{
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--p3-bg)',
                        color: 'var(--p3-text)',
                        border: '1px solid var(--p3-border)'
                      }}>
                        Altura h={avlHeight}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', minHeight: '260px' }}>
                      {treeData ? (
                        <TreeNode
                          node={treeData}
                          isRoot={true}
                          onSelectNode={onSelectEvent}
                          treeType="AVL"
                          searchQuery={debouncedSearch}
                        />
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', alignSelf: 'center' }}>AVL Vacío</span>
                      )}
                    </div>
                  </div>

                  {/* Tarjeta Contenedora: Árbol BST */}
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.65)',
                    backdropFilter: 'blur(16px)',
                    borderRadius: 'var(--radius-xl)',
                    border: '2px dashed #94A3B8',
                    padding: '20px 24px',
                    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: '460px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px',
                      paddingBottom: '12px',
                      borderBottom: '1px dashed #CBD5E1'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ padding: '6px', borderRadius: '10px', backgroundColor: '#F1F5F9', color: 'var(--text-secondary)', display: 'flex' }}>
                          <GitBranch size={18} />
                        </div>
                        <div>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            Árbol BST Clásico
                          </h4>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                            Sin rotaciones (Inserción ingenua no rotada)
                          </span>
                        </div>
                      </div>
                      <span style={{
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: '8px',
                        backgroundColor: bstHeight > avlHeight ? 'var(--p2-bg)' : '#F1F5F9',
                        color: bstHeight > avlHeight ? 'var(--p2-text)' : 'var(--text-secondary)',
                        border: `1px solid ${bstHeight > avlHeight ? 'var(--p2-border)' : '#CBD5E1'}`
                      }}>
                        {bstHeight > avlHeight ? 'Mayor Profundidad' : 'Sin Rotaciones'} | h={bstHeight}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', minHeight: '260px' }}>
                      {bstData ? (
                        <TreeNode
                          node={bstData}
                          isRoot={true}
                          onSelectNode={onSelectEvent}
                          treeType="BST"
                          searchQuery={debouncedSearch}
                        />
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', alignSelf: 'center' }}>BST Vacío</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* MODO 2: SOLO AVL */}
              {viewMode === 'avl' && (
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.65)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: 'var(--radius-xl)',
                  border: '2px dashed var(--accent-border)',
                  padding: '24px 36px',
                  boxShadow: '0 10px 30px rgba(79, 70, 229, 0.08)',
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: 'max-content'
                }}>
                  <div style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    paddingBottom: '12px',
                    borderBottom: '1px dashed #CBD5E1'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ padding: '6px', borderRadius: '10px', backgroundColor: 'var(--accent-light)', color: 'var(--accent)', display: 'flex' }}>
                        <Layers size={20} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          Topología Completa: Árbol AVL Auto-balanceado
                        </h3>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          Garantía matemática logarítmica de factor de balance |FB| ≤ 1 y profundidad mínima.
                        </p>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      padding: '4px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--p3-bg)',
                      color: 'var(--p3-text)',
                      border: '1px solid var(--p3-border)'
                    }}>
                      Altura Total: h={avlHeight}
                    </span>
                  </div>

                  {treeData ? (
                    <TreeNode
                      node={treeData}
                      isRoot={true}
                      onSelectNode={onSelectEvent}
                      treeType="AVL"
                      searchQuery={debouncedSearch}
                    />
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '40px 0' }}>Árbol AVL Vacío</span>
                  )}
                </div>
              )}

              {/* MODO 3: SOLO BST */}
              {viewMode === 'bst' && (
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.65)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: 'var(--radius-xl)',
                  border: '2px dashed #94A3B8',
                  padding: '24px 36px',
                  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: 'max-content'
                }}>
                  <div style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    paddingBottom: '12px',
                    borderBottom: '1px dashed #CBD5E1'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ padding: '6px', borderRadius: '10px', backgroundColor: '#F1F5F9', color: 'var(--text-secondary)', display: 'flex' }}>
                        <GitBranch size={20} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          Topología Completa: Árbol Binario de Búsqueda (BST Clásico)
                        </h3>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          Sin rotaciones. Los nodos con desbalance (|FB| &gt; 1) se destacan con borde rojo punteado.
                        </p>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      padding: '4px 12px',
                      borderRadius: '8px',
                      backgroundColor: bstHeight > avlHeight ? 'var(--p2-bg)' : '#F1F5F9',
                      color: bstHeight > avlHeight ? 'var(--p2-text)' : 'var(--text-secondary)',
                      border: `1px solid ${bstHeight > avlHeight ? 'var(--p2-border)' : '#CBD5E1'}`
                    }}>
                      Altura Total: h={bstHeight}
                    </span>
                  </div>

                  {bstData ? (
                    <TreeNode
                      node={bstData}
                      isRoot={true}
                      onSelectNode={onSelectEvent}
                      treeType="BST"
                      searchQuery={debouncedSearch}
                    />
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '40px 0' }}>Árbol BST Vacío</span>
                  )}
                </div>
              )}
            </>
          )}

        </div>
      </div>

    </div>
  );
}
