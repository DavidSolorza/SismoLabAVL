import React, { useState } from 'react';
import { Sparkles, MapPin, Zap, Filter, Search } from 'lucide-react';
import ModalDialog from './ModalDialog';
import { PREDEFINED_EVENTS } from '../data/predefinedEvents';

export default function PresetsModal({
  isOpen,
  onClose,
  onSelectPreset,
  position = 'bottom-right',
  maxHeight = 'calc(100vh - 156px)'
}) {
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPresets = PREDEFINED_EVENTS.filter((preset) => {
    const matchesPriority =
      filterPriority === 'ALL' || String(preset.prioridadEsperada) === String(filterPriority);
    const matchesSearch =
      preset.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      preset.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      preset.estacion_id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPriority && matchesSearch;
  });

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Catálogo de Sismos Predefinidos"
      subtitle="Inserción rápida de escenarios calibrados para probar balanceo y rotaciones del AVL"
      icon={Sparkles}
      iconBg="#FEF3C7"
      iconColor="#D97706"
      position={position}
      maxWidth="420px"
      maxHeight={maxHeight}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {/* Filtros de Pestañas por Prioridad */}
        <div style={{
          display: 'flex',
          gap: '4px',
          backgroundColor: '#F1F5F9',
          padding: '3px',
          borderRadius: '8px'
        }}>
          {[
            { key: 'ALL', label: 'Todos' },
            { key: '3', label: 'P3 Alta' },
            { key: '2', label: 'P2 Media' },
            { key: '1', label: 'P1 Baja' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterPriority(tab.key)}
              style={{
                flex: 1,
                border: 'none',
                padding: '4px 6px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: filterPriority === tab.key ? 700 : 500,
                backgroundColor: filterPriority === tab.key ? '#FFFFFF' : 'transparent',
                color: filterPriority === tab.key ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: filterPriority === tab.key ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Barra de Búsqueda */}
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por sismo, estación o región..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px 6px 26px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              fontSize: '0.75rem',
              backgroundColor: '#FFFFFF',
              outline: 'none'
            }}
          />
        </div>

        {/* Lista de Sismos */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxHeight: '420px',
          overflowY: 'auto',
          paddingRight: '2px'
        }}>
          {filteredPresets.map((preset) => {
            const p = preset.prioridadEsperada;
            const badgeBg = p === 3 ? '#FEE2E2' : (p === 2 ? '#FEF3C7' : '#ECFDF5');
            const badgeText = p === 3 ? '#991B1B' : (p === 2 ? '#92400E' : '#065F46');
            const borderColor = p === 3 ? '#FECACA' : (p === 2 ? '#FDE68A' : '#A7F3D0');
            const pLabel = p === 3 ? 'Alta' : (p === 2 ? 'Media' : 'Baja');

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
                      color: badgeText,
                      border: `1px solid ${borderColor}`
                    }}>
                      Prioridad P{p} ({pLabel})
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
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '6px',
                    fontSize: '0.68rem',
                    color: 'var(--text-muted)'
                  }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: '#0284C7', fontWeight: 600 }}>
                      <MapPin size={11} /> {preset.estacion_id}
                    </span>
                    <span>•</span>
                    <span>Plano: ({preset.x}, {preset.y}) km</span>
                    <span>•</span>
                    <span>Prof: {preset.profundidad} km</span>
                    <span>•</span>
                    <span style={{ fontWeight: 600, color: preset.zona_poblada ? '#15803D' : '#64748B' }}>
                      {preset.zona_poblada ? 'Urbana (Poblada)' : 'Rural'}
                    </span>
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
                  <span>Insertar en Árbol AVL</span>
                </button>
              </div>
            );
          })}

          {filteredPresets.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              No hay sismos predefinidos que coincidan con el filtro.
            </div>
          )}
        </div>
      </div>
    </ModalDialog>
  );
}
