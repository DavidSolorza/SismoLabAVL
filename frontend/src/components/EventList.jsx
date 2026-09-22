import React, { useState } from 'react';
import { Search, Edit3, MapPin } from 'lucide-react';

export default function EventList({ events = [], onEditEvent }) {
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
          placeholder="Buscar por #ID o estación..."
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
            const p = ev.prioridad ?? 3;
            const badgeBg = p === 1 ? 'var(--p1-bg)' : (p === 2 ? 'var(--p2-bg)' : 'var(--p3-bg)');
            const badgeColor = p === 1 ? 'var(--p1-text)' : (p === 2 ? 'var(--p2-text)' : 'var(--p3-text)');
            const borderColor = p === 1 ? '#FCA5A5' : (p === 2 ? '#FCD34D' : '#6EE7B7');

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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--accent)' }}>
                      SIS-{ev.id}
                    </span>
                    <span style={{
                      fontSize: '0.64rem', fontWeight: 800, padding: '1px 5px', borderRadius: '4px',
                      backgroundColor: badgeBg, color: badgeColor
                    }}>
                      P{p}
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {ev.magnitud?.toFixed(1)} M
                    </span>
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '0.68rem', color: 'var(--text-muted)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                      <MapPin size={10} /> {(ev.estacion_id || 'CALDAS').replace('EST-', '')}
                    </span>
                    <span>•</span>
                    <span>{ev.profundidad} km</span>
                    <span>•</span>
                    <span>{ev.zona_poblada ? 'Urbana' : 'Rural'}</span>
                  </div>
                </div>

                {/* Botón de Corrección */}
                <button
                  onClick={() => onEditEvent && onEditEvent(ev)}
                  className="btn-secondary"
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.72rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0
                  }}
                  title="Corregir parámetros de este sismo"
                >
                  <Edit3 size={12} />
                  <span>Editar</span>
                </button>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}

