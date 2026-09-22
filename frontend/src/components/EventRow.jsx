import React from 'react';
import { Edit3, AlertCircle } from 'lucide-react';

/**
 * EventRow - Fila individual para la tabla del Catálogo de Eventos Sísmicos
 * Muestra la clave K, prioridad, magnitud, profundidad, estación, zona y botón de acción.
 */
export default function EventRow({ event, onEditEvent, index }) {
  const isEven = index % 2 === 0;

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
      <td style={{ padding: '12px 14px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent)',  }}>
        {event.formatted_id}
      </td>
      <td style={{ padding: '12px 14px'  }}>
        <span
          className={`badge-p${event.prioridad}`}
          style={{
            padding: '3px 9px',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.74rem'
          }}
        >
          Prioridad {event.prioridad}
        </span>
      </td>
      <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-primary)' }}>
        {event.magnitud} M
      </td>
      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', textAlign: 'left' }}>
        {event.profundidad} km
      </td>
      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: '0.82rem', textAlign: 'left' }}>
        {event.estacion_id}
      </td>
      <td style={{ padding: '12px 14px', textAlign: 'left' }}>
        {event.zona_poblada ? (
          <span
            style={{
              backgroundColor: 'var(--p1-bg)',
              color: 'var(--p1-text)',
              border: '1px solid var(--p1-border)',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '0.74rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <AlertCircle size={12} /> Habitada
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
            Rural / No habitada
          </span>
        )}
      </td>
      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
        <button
          className="btn-secondary"
          onClick={() => onEditEvent(event)}
          style={{ padding: '5px 10px', fontSize: '0.78rem'  }}
          title="Corregir magnitud o profundidad (reubica atómicamente la clave K en el AVL)"
        >
          <Edit3 size={13} style={{ color: 'var(--accent)'}} />
        </button>
      </td>
    </tr>
  );
}
