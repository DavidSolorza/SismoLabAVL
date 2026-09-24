import React, { useState } from 'react';
import { Search, Edit3, MapPin, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function EventList({ events = [], onEditEvent, onReviewEvent, onInspectEvent, onDeleteEvent }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEvents = (events || []).filter(e => 
    (e.formatted_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.estacion_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(e.id).includes(searchTerm)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      
      {/* Campo de Búsqueda Compacto */}
      <div style={{ position: 'relative', width: '100%' }}>
        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Buscar por #ID, SIS-XXXXXX o estación..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 10px 6px 30px',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-hover)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontSize: '0.78rem',
            outline: 'none'
          }}
        />
      </div>

      {/* Lista de Eventos Compactos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {filteredEvents.length === 0 ? (
          <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            No hay sismos coincidentes con "{searchTerm}".
          </div>
        ) : (
          filteredEvents.map((ev) => {
            const p = ev.prioridad ?? 1;
            // Sección 4: P=3 es Alta, P=2 es Media, P=1 es Baja
            const badgeBg = p === 3 ? '#FEE2E2' : (p === 2 ? '#FEF3C7' : '#ECFDF5');
            const badgeColor = p === 3 ? '#991B1B' : (p === 2 ? '#92400E' : '#065F46');
            const borderColor = p === 3 ? '#FCA5A5' : (p === 2 ? '#FCD34D' : '#6EE7B7');
            const etiquetaP = p === 3 ? 'Alta' : (p === 2 ? 'Media' : 'Baja');
            const estaPendiente = (ev.estado_atencion || 'Pendiente') === 'Pendiente';

            const coordStr = (ev.x !== undefined && ev.y !== undefined) 
              ? `(${ev.x}, ${ev.y}) km`
              : (ev.coordenadas?.x !== undefined ? `(${ev.coordenadas.x}, ${ev.coordenadas.y}) km` : '');

            return (
              <div
                key={ev.id}
                className="glass-panel"
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: `1px solid ${borderColor}`,
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {/* Info Principal */}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--accent)' }}>
                      {ev.formatted_id || `SIS-${String(ev.id).padStart(6, '0')}`}
                    </span>
                    <span style={{
                      fontSize: '0.64rem', fontWeight: 800, padding: '1px 5px', borderRadius: '4px',
                      backgroundColor: badgeBg, color: badgeColor
                    }}>
                      P{p} ({etiquetaP})
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {ev.magnitud?.toFixed(1)} M
                    </span>
                    <span style={{
                      fontSize: '0.62rem', fontWeight: 700, padding: '1px 5px', borderRadius: '4px',
                      backgroundColor: estaPendiente ? '#FEF3C7' : '#E0E7FF',
                      color: estaPendiente ? '#B45309' : '#3730A3',
                      border: `1px solid ${estaPendiente ? '#FDE68A' : '#C7D2FE'}`
                    }}>
                      {ev.estado_atencion || 'Pendiente'} (Rev {ev.revision || 1})
                    </span>
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '0.68rem', color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                      <MapPin size={10} /> {(ev.estacion_id || 'CALDAS').replace('EST-', '')}
                    </span>
                    {coordStr && (
                      <>
                        <span>•</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{coordStr}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>H: {ev.profundidad} km</span>
                    <span>•</span>
                    <span>{ev.zona_poblada ? 'Zona Poblada' : 'No Poblada'}</span>
                    {ev.antiguedad_humana && (
                      <>
                        <span>•</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: 'var(--accent)', fontWeight: 600 }}>
                          <Clock size={10} /> {ev.antiguedad_humana}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  {onInspectEvent && (
                    <button
                      onClick={() => onInspectEvent(ev)}
                      className="btn-secondary"
                      style={{
                        padding: '4px 6px',
                        fontSize: '0.70rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                      title="Consultar detalles y métricas del nodo en el AVL (Sección 6)"
                    >
                      <span>Info</span>
                    </button>
                  )}

                  {estaPendiente && onReviewEvent && (
                    <button
                      onClick={() => onReviewEvent(ev.id)}
                      className="btn-secondary"
                      style={{
                        padding: '4px 7px',
                        fontSize: '0.70rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        color: '#065F46',
                        borderColor: '#A7F3D0',
                        backgroundColor: '#ECFDF5'
                      }}
                      title="Marcar evento como Revisado"
                    >
                      <CheckCircle2 size={11} />
                      <span>Revisar</span>
                    </button>
                  )}

                  <button
                    onClick={() => onEditEvent && onEditEvent(ev)}
                    className="btn-secondary"
                    style={{
                      padding: '4px 8px',
                      fontSize: '0.72rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Corregir parámetros de este sismo (vuelve a Pendiente e incrementa Revisión)"
                  >
                    <Edit3 size={12} />
                    <span>Editar</span>
                  </button>

                  {onDeleteEvent && (
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Confirmas eliminar individualmente el evento SIS-${String(ev.id).padStart(6, '0')}? Los descendientes permanecerán activos y podrás deshacer la acción en la Pila LIFO.`)) {
                          onDeleteEvent(ev.id);
                        }
                      }}
                      className="btn-secondary"
                      style={{
                        padding: '4px 6px',
                        fontSize: '0.70rem',
                        backgroundColor: '#FEF2F2',
                        borderColor: '#FECACA',
                        color: '#DC2626'
                      }}
                      title="Eliminación individual del evento activo (Sección 6)"
                    >
                      <span>Eliminar</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
