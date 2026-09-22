import React from 'react';
import { Sparkles, MapPin, Zap } from 'lucide-react';
import ModalDialog from './ModalDialog';
import { PREDEFINED_EVENTS } from '../data/predefinedEvents';

export default function PresetsModal({
  isOpen,
  onClose,
  onSelectPreset,
  position = 'bottom-right',
  maxHeight = 'calc(100vh - 156px)'
}) {
  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Sismos Predefinidos"
      subtitle="Inserción rápida para probar balanceo y rotaciones"
      icon={Sparkles}
      iconBg="#FEF3C7"
      iconColor="#D97706"
      position={position}
      maxWidth="350px"
      maxHeight={maxHeight}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {PREDEFINED_EVENTS.map((preset) => {
          const isP1 = preset.prioridadEsperada === 1;
          const isP2 = preset.prioridadEsperada === 2;
          const badgeBg = isP1 ? 'var(--p1-bg)' : (isP2 ? 'var(--p2-bg)' : 'var(--p3-bg)');
          const badgeText = isP1 ? 'var(--p1-text)' : (isP2 ? 'var(--p2-text)' : 'var(--p3-text)');
          const borderColor = isP1 ? '#FCA5A5' : (isP2 ? '#FCD34D' : '#6EE7B7');

          return (
            <div
              key={preset.id}
              className="glass-panel"
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                border: `1px solid ${borderColor}`,
                backgroundColor: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div>
                {/* Encabezado: Prioridad y Magnitud */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '5px',
                    backgroundColor: badgeBg,
                    color: badgeText
                  }}>
                    Prioridad P{preset.prioridadEsperada}
                  </span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {preset.magnitud.toFixed(1)} <span style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>M</span>
                  </span>
                </div>

                {/* Nombre y descripción */}
                <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                  {preset.nombre}
                </h4>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                  {preset.descripcion}
                </p>

                {/* Parámetros geográficos */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '6px',
                  fontSize: '0.68rem',
                  color: 'var(--text-muted)'
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                    <MapPin size={11} /> {preset.estacion_id.replace('EST-', '')}
                  </span>
                  <span>•</span>
                  <span>Prof: {preset.profundidad} km</span>
                  <span>•</span>
                  <span>{preset.zona_poblada ? 'Urbana' : 'Rural'}</span>
                </div>
              </div>

              {/* Botón de Inserción Rápida */}
              <button
                onClick={() => {
                  onSelectPreset(preset);
                  onClose();
                }}
                className="btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '6px 10px',
                  fontSize: '0.76rem',
                  fontWeight: 700
                }}
              >
                <Zap size={13} />
                <span>Insertar en Árbol (1 Clic)</span>
              </button>
            </div>
          );
        })}
      </div>
    </ModalDialog>
  );
}

