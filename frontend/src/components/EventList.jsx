import React, { useState } from 'react';
import { Search, Database } from 'lucide-react';
import EventRow from './EventRow';

export default function EventList({ events, onEditEvent }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEvents = (events || []).filter(e => 
    (e.formatted_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.estacion_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(e.id).includes(searchTerm)
  );

  return (
    <div className="glass-panel" style={{ padding: '22px 24px', marginBottom: '20px', backgroundColor: '#FFFFFF' }}>
      
      {/* Encabezado y Barra de Búsqueda */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={20} style={{ color: 'var(--accent)' }} />
            <span>Catálogo Activo de Eventos Sísmicos</span>
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Recorrido In-Order extraído en tiempo real desde el Árbol AVL en memoria principal.
          </p>
        </div>

        {/* Campo de Búsqueda Filtrada */}
        <div style={{ position: 'relative', width: '270px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por ID o estación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-hover)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              outline: 'none',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--accent)';
              e.target.style.boxShadow = '0 0 0 3px var(--accent-light)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-hover)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      {/* Tabla Estilizada con Diseño Claro y Pasteles */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{
              backgroundColor: '#F8FAFC',
              borderBottom: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              fontSize: '0.76rem',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              <th style={{ padding: '12px 14px', fontWeight: 700 }}>Clave $K$ (M, P, I)</th>
              <th style={{ padding: '12px 14px', fontWeight: 700 }}>Prioridad P</th>
              <th style={{ padding: '12px 14px', fontWeight: 700 }}>Magnitud M</th>
              <th style={{ padding: '12px 14px', fontWeight: 700 }}>Profundidad</th>
              <th style={{ padding: '12px 14px', fontWeight: 700 }}>Estación</th>
              <th style={{ padding: '12px 14px', fontWeight: 700 }}>Zona Poblada</th>
              <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No se encontraron eventos sísmicos registrados con el criterio de búsqueda.
                </td>
              </tr>
            ) : (
              filteredEvents.map((ev, idx) => (
                <EventRow
                  key={ev.id}
                  event={ev}
                  index={idx}
                  onEditEvent={onEditEvent}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
