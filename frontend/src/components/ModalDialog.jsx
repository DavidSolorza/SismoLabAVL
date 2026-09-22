import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Componente Modal Lateral Compacto (Side Drawer / Mini-Panel Lateral)
 * Se ubica en los laterales de la pantalla según la posición indicada:
 * - 'top-left' | 'bottom-left'
 * - 'top-right' | 'bottom-right'
 * 
 * Deja el centro 100% despejado y libre para interactuar con los árboles.
 * Su z-index (1500) es inferior al de los controles y botones HUD (3000),
 * por lo que los botones perimetrales SIEMPRE permanecen por encima y clickeables.
 */
export default function ModalDialog({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  iconBg = 'var(--accent-light)',
  iconColor = 'var(--accent)',
  children,
  position = 'top-right',
  maxWidth = '350px',
  maxHeight = 'calc(100vh - 156px)'
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isLeft = position.includes('left');
  const isBottom = position.includes('bottom');

  // Coordenadas calculadas para no invadir la barra superior (top: 16px + h: 48px = ~64px -> modal top: 74px)
  // ni los docks inferiores (bottom: 16px + h: 48px = ~64px -> modal bottom: 74px)
  const panelPlacementStyle = {
    position: 'absolute',
    top: isBottom ? 'auto' : '74px',
    bottom: isBottom ? '74px' : 'auto',
    left: isLeft ? '16px' : 'auto',
    right: !isLeft ? '16px' : 'auto',
    width: maxWidth,
    maxWidth: 'calc(100vw - 32px)',
    maxHeight: maxHeight,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: '16px',
    boxShadow: '0 12px 36px rgba(15, 23, 42, 0.14), 0 0 0 1px rgba(226, 232, 240, 0.85)',
    border: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    pointerEvents: 'auto',
    zIndex: 1500
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1500,
        pointerEvents: 'none' // Permite interacción libre con el centro del mapa y HUD
      }}
    >
      <div
        className={`glass-panel ${isLeft ? 'slide-in-left' : 'slide-in-right'}`}
        style={panelPlacementStyle}
      >
        {/* Encabezado Compacto */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(248, 250, 252, 0.88)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
            {Icon && (
              <div style={{
                padding: '5px',
                borderRadius: '8px',
                backgroundColor: iconBg,
                color: iconColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icon size={15} />
              </div>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3 style={{
                fontSize: '0.88rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {title}
              </h3>
              {subtitle && (
                <p style={{
                  fontSize: '0.68rem',
                  color: 'var(--text-secondary)',
                  marginTop: '1px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-secondary"
            style={{
              padding: '4px 7px',
              borderRadius: '6px',
              border: 'none',
              background: '#FFFFFF',
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer',
              marginLeft: '6px',
              flexShrink: 0
            }}
            title="Cerrar panel (ESC)"
          >
            <X size={14} />
          </button>
        </div>

        {/* Contenido Compacto con Scroll Suave */}
        <div style={{
          padding: '12px',
          overflowY: 'auto',
          flex: 1
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}

