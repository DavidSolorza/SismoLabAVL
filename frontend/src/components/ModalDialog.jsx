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
  maxWidth = '290px',
  maxHeight = 'calc(100vh - 130px)'
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

  const isCenter = position === 'center';
  const isLeft = !isCenter && position.includes('left');
  const isBottom = !isCenter && position.includes('bottom');

  // Coordenadas calculadas según el tipo de presentación (centrado o mini-panel perimetral)
  const panelPlacementStyle = isCenter ? {
    position: 'relative',
    width: maxWidth,
    maxWidth: 'calc(100vw - 32px)',
    maxHeight: maxHeight,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: '14px',
    boxShadow: '0 20px 50px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.9)',
    border: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    pointerEvents: 'auto',
    zIndex: 1500
  } : {
    position: 'absolute',
    top: isBottom ? 'auto' : '62px',
    bottom: isBottom ? '62px' : 'auto',
    left: isLeft ? '14px' : 'auto',
    right: !isLeft ? '14px' : 'auto',
    width: maxWidth,
    maxWidth: 'calc(100vw - 28px)',
    maxHeight: maxHeight,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: '13px',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(226, 232, 240, 0.85)',
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
        pointerEvents: isCenter ? 'auto' : 'none',
        display: isCenter ? 'flex' : 'block',
        alignItems: isCenter ? 'center' : undefined,
        justifyContent: isCenter ? 'center' : undefined,
        backgroundColor: isCenter ? 'rgba(15, 23, 42, 0.45)' : 'transparent',
        backdropFilter: isCenter ? 'blur(3px)' : undefined
      }}
      onClick={isCenter ? (e) => { if (e.target === e.currentTarget) onClose(); } : undefined}
    >
      <div
        className={`glass-panel ${isCenter ? 'scale-in' : (isLeft ? 'slide-in-left' : 'slide-in-right')}`}
        style={panelPlacementStyle}
      >
        {/* Encabezado Compacto */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(248, 250, 252, 0.88)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0, flex: 1 }}>
            {Icon && (
              <div style={{
                padding: '4px',
                borderRadius: '7px',
                backgroundColor: iconBg,
                color: iconColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icon size={14} />
              </div>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3 style={{
                fontSize: '0.84rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
                lineHeight: 1.2
              }}>
                {title}
              </h3>
              {subtitle && (
                <p style={{
                  fontSize: '0.68rem',
                  color: 'var(--text-muted)',
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
              padding: '3px 6px',
              borderRadius: '5px',
              border: 'none',
              background: '#FFFFFF',
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer',
              marginLeft: '5px',
              flexShrink: 0
            }}
            title="Cerrar panel (ESC)"
          >
            <X size={13} />
          </button>
        </div>

        {/* Contenido Compacto con Scroll Suave */}
        <div style={{
          padding: '10px',
          overflowY: 'auto',
          flex: 1
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}

