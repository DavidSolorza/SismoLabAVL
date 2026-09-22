import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, X, HelpCircle, ArrowRight } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  const isConfirm = toast?.type === 'confirm';
  const isCenterModal = isConfirm || toast?.type === 'warning' || toast?.isModal;
  const duration = toast?.duration ?? (isConfirm ? null : (isCenterModal ? 5000 : 4000));

  // Auto-cierre solo para notificaciones que no requieren confirmación activa
  useEffect(() => {
    if (toast && duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [toast, duration, onClose]);

  // Manejo de teclado (Escape para cerrar/cancelar, Enter para confirmar)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!toast) return;
      if (e.key === 'Escape') {
        if (isConfirm && toast.onCancel) {
          toast.onCancel();
        }
        onClose();
      } else if (e.key === 'Enter' && isConfirm && toast.onConfirm) {
        toast.onConfirm();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toast, isConfirm, onClose]);

  if (!toast) return null;

  const type = toast.type || 'success';

  // Configuración de paleta visual y estilo por tipo de mensaje
  const config = {
    success: {
      badge: 'OPERACIÓN EXITOSA',
      badgeBg: '#DCFCE7',
      badgeColor: '#166534',
      badgeBorder: '#BBF7D0',
      icon: CheckCircle2,
      iconColor: '#10B981',
      iconBg: '#ECFDF5',
      defaultTitle: 'Acción Completada',
      accentBorder: '#10B981',
      softBg: '#F0FDF4',
      progressColor: '#10B981'
    },
    warning: {
      badge: 'AVISO IMPORTANTE',
      badgeBg: '#FEF3C7',
      badgeColor: '#92400E',
      badgeBorder: '#FDE68A',
      icon: AlertTriangle,
      iconColor: '#F59E0B',
      iconBg: '#FFFBEB',
      defaultTitle: 'Advertencia del Sistema',
      accentBorder: '#F59E0B',
      softBg: '#FFFBEB',
      progressColor: '#F59E0B'
    },
    confirm: {
      badge: 'CONFIRMACIÓN REQUERIDA',
      badgeBg: '#FEE2E2',
      badgeColor: '#991B1B',
      badgeBorder: '#FECACA',
      icon: HelpCircle,
      iconColor: '#EF4444',
      iconBg: '#FEF2F2',
      defaultTitle: '¿Confirmar Acción Crítica?',
      accentBorder: '#EF4444',
      softBg: '#FEF2F2',
      progressColor: '#EF4444'
    },
    error: {
      badge: 'ERROR DEL SISTEMA',
      badgeBg: '#FEE2E2',
      badgeColor: '#991B1B',
      badgeBorder: '#FECACA',
      icon: XCircle,
      iconColor: '#EF4444',
      iconBg: '#FEF2F2',
      defaultTitle: 'Fallo en la Operación',
      accentBorder: '#EF4444',
      softBg: '#FEF2F2',
      progressColor: '#EF4444'
    }
  }[type] || {
    badge: 'NOTIFICACIÓN',
    badgeBg: '#E0E7FF',
    badgeColor: '#3730A3',
    badgeBorder: '#C7D2FE',
    icon: CheckCircle2,
    iconColor: 'var(--accent)',
    iconBg: '#EEF2FF',
    defaultTitle: 'Información',
    accentBorder: 'var(--accent)',
    softBg: '#F8FAFC',
    progressColor: 'var(--accent)'
  };

  const IconComponent = config.icon;
  const title = toast.title || config.defaultTitle;

  const handleConfirmClick = () => {
    if (toast.onConfirm) {
      toast.onConfirm();
    }
    onClose();
  };

  const handleCancelClick = () => {
    if (toast.onCancel) {
      toast.onCancel();
    }
    onClose();
  };

  // ---------------------------------------------------------------------------
  // CASO 1: AVISOS CRÍTICOS Y CONFIRMACIONES -> EN LA MITAD DE LA PANTALLA
  // ---------------------------------------------------------------------------
  if (isCenterModal) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10000,
          backgroundColor: isConfirm ? 'rgba(15, 23, 42, 0.55)' : 'rgba(15, 23, 42, 0.35)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget && !isConfirm) {
            onClose();
          }
        }}
      >
        <div
          className="glass-panel pop-in-center"
          style={{
            width: '440px',
            maxWidth: 'calc(100vw - 36px)',
            backgroundColor: '#FFFFFF',
            borderRadius: '18px',
            boxShadow: '0 25px 60px -10px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(226, 232, 240, 0.95)',
            border: `1px solid ${config.accentBorder}`,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Barra de Acento Superior */}
          <div style={{ height: '4px', width: '100%', backgroundColor: config.iconColor }} />

          {/* Cuerpo Principal del Mensaje */}
          <div style={{ padding: '20px 22px' }}>
            
            {/* Fila Superior: Badge de Estado + Botón Cerrar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                letterSpacing: '0.06em',
                padding: '3px 9px',
                borderRadius: '6px',
                backgroundColor: config.badgeBg,
                color: config.badgeColor,
                border: `1px solid ${config.badgeBorder}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {config.badge}
              </span>

              <button
                onClick={onClose}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Cerrar (ESC)"
              >
                <X size={15} />
              </button>
            </div>

            {/* Fila de Contenido: Icono Focal + Título + Mensaje */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{
                padding: '10px',
                borderRadius: '12px',
                backgroundColor: config.iconBg,
                color: config.iconColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: 'var(--shadow-sm)'
              }}>
                <IconComponent size={24} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  lineHeight: 1.25,
                  marginBottom: '6px'
                }}>
                  {title}
                </h3>
                <p style={{
                  fontSize: '0.84rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  margin: 0
                }}>
                  {toast.message}
                </p>
              </div>
            </div>

            {/* Fila de Botones de Acción */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '10px',
              marginTop: '18px',
              paddingTop: '14px',
              borderTop: '1px solid #F1F5F9'
            }}>
              {isConfirm ? (
                <>
                  <button
                    onClick={handleCancelClick}
                    className="btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '0.82rem', fontWeight: 600 }}
                  >
                    {toast.cancelText || 'Cancelar'}
                  </button>
                  <button
                    onClick={handleConfirmClick}
                    className="btn-primary"
                    style={{
                      padding: '8px 18px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      backgroundColor: config.iconColor,
                      boxShadow: `0 4px 12px ${config.iconColor}40`
                    }}
                  >
                    <span>{toast.confirmText || 'Sí, Confirmar'}</span>
                    <ArrowRight size={14} />
                  </button>
                </>
              ) : (
                <button
                  onClick={onClose}
                  className="btn-secondary"
                  style={{
                    padding: '7px 16px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    backgroundColor: '#F8FAFC'
                  }}
                >
                  Entendido
                </button>
              )}
            </div>

          </div>

          {/* Barra de Progreso de Auto-cierre Animada */}
          {duration && (
            <div style={{ height: '3px', width: '100%', backgroundColor: '#F1F5F9', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                backgroundColor: config.progressColor,
                animation: `progressShrink ${duration}ms linear forwards`
              }} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // CASO 2: MENSAJES DE ÉXITO / INFORMACIÓN NORMALES -> EN LA PARTE INFERIOR
  // (Con su recuadro del color respectivo, sin tapar el centro ni bloquear la vista)
  // ---------------------------------------------------------------------------
  return (
    <div
      className="slide-in"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10001,
        width: '430px',
        maxWidth: 'calc(100vw - 32px)',
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        border: `1.5px solid ${config.accentBorder}`,
        borderLeft: `5px solid ${config.iconColor}`,
        boxShadow: '0 12px 36px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(226, 232, 240, 0.9)',
        overflow: 'hidden',
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        {/* Icono Redondeado con fondo suave */}
        <div style={{
          padding: '7px',
          borderRadius: '10px',
          backgroundColor: config.iconBg,
          color: config.iconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <IconComponent size={20} />
        </div>

        {/* Textos: Badge + Título + Mensaje */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <span style={{
              fontSize: '0.62rem',
              fontWeight: 800,
              padding: '1px 6px',
              borderRadius: '4px',
              backgroundColor: config.badgeBg,
              color: config.badgeColor,
              border: `1px solid ${config.badgeBorder}`
            }}>
              {config.badge}
            </span>
            <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {title}
            </strong>
          </div>
          <div style={{
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.35,
            whiteSpace: 'normal',
            overflowWrap: 'break-word'
          }}>
            {toast.message}
          </div>
        </div>

        {/* Botón de Cierre Rápido */}
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
          title="Cerrar notificación"
        >
          <X size={15} />
        </button>
      </div>

      {/* Línea de Progreso Temporizada en la Base del Recuadro */}
      {duration && (
        <div style={{ height: '3px', width: '100%', backgroundColor: '#F1F5F9', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            backgroundColor: config.progressColor,
            animation: `progressShrink ${duration}ms linear forwards`
          }} />
        </div>
      )}
    </div>
  );
}


