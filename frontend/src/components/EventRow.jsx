import React from 'react';
import { Edit3, AlertCircle, Info, Trash2, CheckCircle2 } from 'lucide-react';

/**
 * EventRow - Fila individual para la tabla del Catálogo de Eventos Sísmicos
 * Muestra la clave K, prioridad (3=Alta, 2=Media, 1=Baja), magnitud, profundidad, estación, zona y botones de acción (Sección 6).
 */
export default function EventRow({ event, onEditEvent, onInspectEvent, onReviewEvent, onDeleteEvent, index }) {
  const isEven = index % 2 === 0;
  const p = event.prioridad ?? 1;
  const badgeBg = p === 3 ? '#FEE2E2' : (p === 2 ? '#FEF3C7' : '#ECFDF5');
  const badgeColor = p === 3 ? '#991B1B' : (p === 2 ? '#92400E' : '#065F46');
  const etiquetaP = p === 3 ? 'Alta' : (p === 2 ? 'Media' : 'Baja');
  const estaPendiente = (event.estado_atencion || 'Pendiente') === 'Pendiente';

  const coordX = event.x ?? event.coordenadas?.x ?? '?';
  const coordY = event.y ?? event.coordenadas?.y ?? '?';

  return (
    <tr
      style={{
        borderBottom: '1px solid #F1F5F9',
        backgroundColor: isEven ? '#FFFFFF' : '#FAFAFA',
        transition: 'background-color 0.15s ease'
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isEven ? '#FFFFFF' : '#FAFAFA')}
    >
      <td style={{ padding: '12px 14px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{event.formatted_id}</span>
          {event.acceso_costoso && (
            <span
              style={{
                backgroundColor: '#FEF3C7',
                color: '#B45309',
                border: '1px solid #FCD34D',
                padding: '1px 5px',
                borderRadius: '4px',
                fontSize: '0.66rem',
                fontWeight: 800
              }}
              title="Acceso Costoso: nodo activo de prioridad alta cuya profundidad en el árbol AVL supera el presupuesto L (Sección 9)"
            >
              ⚡ Costoso
            </span>
          )}
        </div>
        {event.es_replica && event.evento_referencia_id && (
          <div style={{ marginTop: '3px' }}>
            <span
              style={{
                backgroundColor: '#EFF6FF',
                color: '#1D4ED8',
                border: '1px solid #BFDBFE',
                padding: '1px 6px',
                borderRadius: '4px',
                fontSize: '0.68rem',
                fontWeight: 600
              }}
              title={`Asociado como réplica de SIS-${String(event.evento_referencia_id).padStart(6, '0')} según criterio determinista (Sección 7)`}
            >
              Réplica de SIS-{String(event.evento_referencia_id).padStart(6, '0')}
            </span>
          </div>
        )}
      </td>
      <td style={{ padding: '12px 14px' }}>
        <span
          style={{
            padding: '3px 9px',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.74rem',
            backgroundColor: badgeBg,
            color: badgeColor
          }}
        >
          P{p} ({etiquetaP})
        </span>
      </td>
      <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-primary)' }}>
        {event.magnitud} M
      </td>
      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', textAlign: 'left' }}>
        {event.profundidad} km
      </td>
      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: '0.80rem', textAlign: 'left', fontFamily: 'var(--font-mono)' }}>
        ({coordX}, {coordY}) km
      </td>
      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: '0.82rem', textAlign: 'left' }}>
        {event.estacion_id}
      </td>
      <td style={{ padding: '12px 14px', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {event.zona_poblada ? (
            <span
              style={{
                backgroundColor: '#FEE2E2',
                color: '#991B1B',
                border: '1px solid #FECACA',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.74rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <AlertCircle size={12} /> Poblada
            </span>
          ) : (
            <span
              style={{
                backgroundColor: '#F1F5F9',
                color: 'var(--text-muted)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.74rem'
              }}
            >
              No poblada
            </span>
          )}
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: estaPendiente ? '#FEF3C7' : '#E0E7FF',
              color: estaPendiente ? '#B45309' : '#3730A3'
            }}
          >
            {event.estado_atencion || 'Pendiente'}
          </span>
        </div>
      </td>
      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          {onInspectEvent && (
            <button
              className="btn-secondary"
              onClick={() => onInspectEvent(event)}
              style={{ padding: '4px 6px', fontSize: '0.74rem' }}
              title="Consultar ficha técnica y métricas de nodo AVL (Sección 6)"
            >
              <Info size={13} style={{ color: 'var(--accent)' }} />
            </button>
          )}

          {estaPendiente && onReviewEvent && (
            <button
              className="btn-secondary"
              onClick={() => onReviewEvent(event.id)}
              style={{ padding: '4px 6px', fontSize: '0.74rem', backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }}
              title="Marcar como Revisado (Sección 6)"
            >
              <CheckCircle2 size={13} style={{ color: '#065F46' }} />
            </button>
          )}

          {onEditEvent && (
            <button
              className="btn-secondary"
              onClick={() => onEditEvent(event)}
              style={{ padding: '4px 6px', fontSize: '0.74rem' }}
              title="Corregir magnitud o profundidad (vuelve a Pendiente y avanza Revisión)"
            >
              <Edit3 size={13} style={{ color: 'var(--text-secondary)' }} />
            </button>
          )}

          {onDeleteEvent && (
            <button
              className="btn-secondary"
              onClick={() => {
                if (window.confirm(`¿Confirmas eliminar individualmente el evento SIS-${String(event.id).padStart(6, '0')}? Los descendientes permanecerán activos y podrás deshacer la acción en la Pila LIFO.`)) {
                  onDeleteEvent(event.id);
                }
              }}
              style={{ padding: '4px 6px', fontSize: '0.74rem', backgroundColor: '#FEF2F2', borderColor: '#FECACA' }}
              title="Eliminación individual del evento activo (Sección 6)"
            >
              <Trash2 size={13} style={{ color: '#DC2626' }} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
