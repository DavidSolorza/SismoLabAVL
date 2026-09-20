import React, { useState } from 'react';
import { Search, Edit3, MapPin, AlertCircle } from 'lucide-react';

export default function EventList({ events, onEditEvent }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEvents = (events || []).filter(e => 
    (e.formatted_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.estacion_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(e.id).includes(searchTerm)
  );

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      {/* Search Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Registro de Eventos Sísmicos</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Recorrido Inorden extraído directamente del Árbol AVL en memoria.
          </p>
        </div>

        {/* Search Bar */}
        <div style={{
          position: 'relative', width: '280px'
        }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por ID o estación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px 9px 38px',
              background: 'rgba(20, 17, 15, 0.8)', border: '1px solid var(--border-warm)',
              borderRadius: '10px', color: 'var(--text-bright)', fontSize: '0.88rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-warm)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px' }}>Clave $K$ (P, M, I)</th>
              <th style={{ padding: '12px' }}>Prioridad P</th>
              <th style={{ padding: '12px' }}>Magnitud M</th>
              <th style={{ padding: '12px' }}>Profundidad D</th>
              <th style={{ padding: '12px' }}>Estación</th>
              <th style={{ padding: '12px' }}>Área Poblada</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No se encontraron eventos sísmicos que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              filteredEvents.map((ev) => (
                <tr key={ev.id} style={{ borderBottom: '1px solid rgba(224, 86, 56, 0.08)', transition: 'background 0.2s ease' }}>
                  <td style={{ padding: '14px 12px', fontWeight: 700, color: 'var(--terracotta)' }}>
                    {ev.formatted_id}
                  </td>
                  <td style={{ padding: '14px 12px' }}>
                    <span className={`badge-p${ev.prioridad}`} style={{ padding: '4px 10px', borderRadius: '12px', fontWeight: 700, fontSize: '0.78rem' }}>
                      Prioridad {ev.prioridad}
                    </span>
                  </td>
                  <td style={{ padding: '14px 12px', fontWeight: 700 }}>
                    {ev.magnitud} M
                  </td>
                  <td style={{ padding: '14px 12px', color: 'var(--text-sub)' }}>
                    {ev.profundidad} km
                  </td>
                  <td style={{ padding: '14px 12px', color: 'var(--text-sub)' }}>
                    {ev.estacion_id}
                  </td>
                  <td style={{ padding: '14px 12px' }}>
                    {ev.zona_poblada ? (
                      <span style={{ color: '#F87171', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <AlertCircle size={14} /> Habitada
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>No habitada</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                    <button
                      className="btn-secondary"
                      onClick={() => onEditEvent(ev)}
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      <Edit3 size={14} /> Corregir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
