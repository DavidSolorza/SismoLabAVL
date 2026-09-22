import React, { useState, useEffect } from 'react';
import { Clock, FastForward, Calendar, Check, AlertCircle, ArrowRight } from 'lucide-react';
import ModalDialog from './ModalDialog';

/**
 * Panel Lateral Compacto: Reloj de Simulación Explícito del Escenario
 * Permite visualizar el instante UTC actual, avanzar el reloj (+15m, +1h, +6h, +24h)
 * y fijar manualmente la fecha y hora de la simulación.
 */
export default function ClockModal({
  isOpen,
  onClose,
  simulationClock,
  onAdvanceClock,
  onSetClock
}) {
  const [manualDatetime, setManualDatetime] = useState('');
  const [customMinutes, setCustomMinutes] = useState(30);

  // Inicializar el input datetime-local cuando cambia el reloj de simulación
  useEffect(() => {
    if (simulationClock) {
      try {
        // simulationClock viene en formato ISO UTC (ej: "2026-09-22T12:00:00Z")
        // Convertimos a string compatible con input datetime-local: "YYYY-MM-DDTHH:mm:ss"
        const clean = simulationClock.replace('Z', '').slice(0, 19);
        setManualDatetime(clean);
      } catch (e) {
        setManualDatetime('');
      }
    }
  }, [simulationClock]);

  if (!isOpen) return null;

  // Formato visual legible UTC
  const formattedDate = simulationClock
    ? new Date(simulationClock).toUTCString().replace('GMT', 'UTC')
    : '2026-09-22 12:00:00 UTC';

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualDatetime) return;
    // Construir string ISO 8601 con sufijo Z
    const isoString = manualDatetime.length === 16 ? `${manualDatetime}:00Z` : `${manualDatetime}Z`;
    onSetClock(isoString);
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Reloj de Simulación"
      subtitle="Escenario Sísmico • UTC Explícito"
      icon={Clock}
      iconBg="#EEF2FF"
      iconColor="#4F46E5"
      position="top-left"
      maxWidth="295px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {/* 1. Visor Digital del Reloj */}
        <div style={{
          backgroundColor: '#0F172A',
          color: '#F8FAFC',
          borderRadius: '9px',
          padding: '9px 11px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          border: '1px solid #1E293B',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)'
        }}>
          <span style={{ fontSize: '0.62rem', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.04em' }}>
            TIEMPO DEL ESCENARIO (UTC)
          </span>
          <div style={{
            fontSize: '1.05rem',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            color: '#38BDF8',
            marginTop: '2px',
            letterSpacing: '0.02em'
          }}>
            {simulationClock ? simulationClock.replace('T', ' ').replace('Z', ' UTC') : 'Cargando...'}
          </div>
          <span style={{ fontSize: '0.64rem', color: '#CBD5E1', marginTop: '2px' }}>
            {formattedDate}
          </span>
        </div>

        {/* 2. Botones de Avance Rápido */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          padding: '8px',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            fontSize: '0.68rem',
            fontWeight: 800,
            color: 'var(--text-secondary)',
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <FastForward size={12} style={{ color: 'var(--accent)' }} />
            <span>Avance Rápido del Reloj</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
            <button
              onClick={() => onAdvanceClock({ minutes: 15 })}
              className="btn-secondary"
              style={{ padding: '5px 6px', fontSize: '0.72rem', justifyContent: 'center', fontWeight: 700 }}
              title="Avanzar 15 minutos en el escenario"
            >
              +15 min
            </button>
            <button
              onClick={() => onAdvanceClock({ hours: 1 })}
              className="btn-secondary"
              style={{ padding: '5px 6px', fontSize: '0.72rem', justifyContent: 'center', fontWeight: 700 }}
              title="Avanzar 1 hora en el escenario"
            >
              +1 hora
            </button>
            <button
              onClick={() => onAdvanceClock({ hours: 6 })}
              className="btn-secondary"
              style={{ padding: '5px 6px', fontSize: '0.72rem', justifyContent: 'center', fontWeight: 700 }}
              title="Avanzar 6 horas en el escenario"
            >
              +6 horas
            </button>
            <button
              onClick={() => onAdvanceClock({ days: 1 })}
              className="btn-secondary"
              style={{ padding: '5px 6px', fontSize: '0.72rem', justifyContent: 'center', fontWeight: 700 }}
              title="Avanzar 24 horas (1 día completo)"
            >
              +24 horas
            </button>
          </div>
        </div>

        {/* 3. Ajuste Manual Directo */}
        <form onSubmit={handleManualSubmit} style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          padding: '8px',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{
            fontSize: '0.68rem',
            fontWeight: 800,
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Calendar size={12} style={{ color: '#059669' }} />
            <span>Fijar Fecha y Hora Manual (UTC)</span>
          </div>

          <input
            type="datetime-local"
            step="1"
            value={manualDatetime}
            onChange={(e) => setManualDatetime(e.target.value)}
            style={{
              width: '100%',
              padding: '5px 7px',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.74rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-primary)',
              backgroundColor: '#F8FAFC'
            }}
            required
          />

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '6px 8px', fontSize: '0.74rem', justifyContent: 'center', fontWeight: 700 }}
          >
            <Check size={12} />
            <span>Fijar Reloj de Simulación</span>
          </button>
        </form>

        {/* 4. Nota de Regla de Negocio */}
        <div style={{
          padding: '6px 8px',
          borderRadius: '6px',
          backgroundColor: '#FEF3C7',
          border: '1px solid #FDE68A',
          fontSize: '0.64rem',
          color: '#92400E',
          lineHeight: 1.3
        }}>
          <strong>Regla Obligatoria:</strong> Los eventos sísmicos no pueden tener ocurrencia posterior al reloj. Al avanzar el tiempo, se incrementa la antigüedad de los sismos en el árbol.
        </div>

      </div>
    </ModalDialog>
  );
}
