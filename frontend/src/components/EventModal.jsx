import React, { useState, useEffect } from 'react';
import { X, PlusCircle, Edit3 } from 'lucide-react';

export default function EventModal({ isOpen, onClose, onSubmit, editEvent }) {
  const [id, setId] = useState(() => Math.floor(1004 + Math.random() * 8000));
  const [magnitud, setMagnitud] = useState(5.5);
  const [profundidad, setProfundidad] = useState(15.0);
  const [latitud, setLatitud] = useState(5.06889);
  const [longitud, setLongitud] = useState(-75.51738);
  const [estacionId, setEstacionId] = useState('EST-MANIZALES-01');
  const [zonaPoblada, setZonaPoblada] = useState(true);
  const [razon, setRazon] = useState('Recalibración técnica');

  useEffect(() => {
    if (editEvent) {
      setId(editEvent.id);
      setMagnitud(editEvent.magnitud);
      setProfundidad(editEvent.profundidad);
      if (editEvent.coordenadas) {
        setLatitud(editEvent.coordenadas.latitude);
        setLongitud(editEvent.coordenadas.longitude);
      }
      setEstacionId(editEvent.estacion_id || 'EST-MANIZALES-01');
      setZonaPoblada(editEvent.zona_poblada ?? true);
    } else if (isOpen) {
      // Suggest unused ID
      setId(Math.floor(1004 + Math.random() * 8000));
    }
  }, [editEvent, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editEvent) {
      onSubmit({
        isCorrection: true,
        eventId: id,
        nuevaMagnitud: parseFloat(magnitud),
        nuevaProfundidad: parseFloat(profundidad),
        razon: razon
      });
    } else {
      onSubmit({
        isCorrection: false,
        id: parseInt(id),
        magnitud: parseFloat(magnitud),
        profundidad: parseFloat(profundidad),
        latitud: parseFloat(latitud),
        longitud: parseFloat(longitud),
        estacion_id: estacionId,
        zona_poblada: zonaPoblada
      });
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(10, 8, 7, 0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '520px', padding: '28px',
        border: '1px solid var(--amber)', boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {editEvent ? <Edit3 color="var(--amber)" size={22} /> : <PlusCircle color="var(--terracotta)" size={22} />}
            {editEvent ? `Corregir Evento SIS-${id}` : 'Registrar Nuevo Evento Sísmico'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {!editEvent && (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-sub)', display: 'block', marginBottom: '4px' }}>Identificador Único (ID: 1..999999)</label>
              <input
                type="number" value={id} onChange={(e) => setId(e.target.value)} required
                style={{ width: '100%', padding: '10px', background: 'rgba(20,17,15,0.8)', border: '1px solid var(--border-warm)', borderRadius: '8px', color: '#fff' }}
              />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-sub)', display: 'block', marginBottom: '4px' }}>Magnitud (-2.0 a 10.0 M)</label>
              <input
                type="number" step="0.1" value={magnitud} onChange={(e) => setMagnitud(e.target.value)} required
                style={{ width: '100%', padding: '10px', background: 'rgba(20,17,15,0.8)', border: '1px solid var(--border-warm)', borderRadius: '8px', color: '#fff' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-sub)', display: 'block', marginBottom: '4px' }}>Profundidad (km)</label>
              <input
                type="number" step="0.1" value={profundidad} onChange={(e) => setProfundidad(e.target.value)} required
                style={{ width: '100%', padding: '10px', background: 'rgba(20,17,15,0.8)', border: '1px solid var(--border-warm)', borderRadius: '8px', color: '#fff' }}
              />
            </div>
          </div>

          {!editEvent && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-sub)', display: 'block', marginBottom: '4px' }}>Latitud (-90..90)</label>
                  <input
                    type="number" step="0.0001" value={latitud} onChange={(e) => setLatitud(e.target.value)} required
                    style={{ width: '100%', padding: '10px', background: 'rgba(20,17,15,0.8)', border: '1px solid var(--border-warm)', borderRadius: '8px', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-sub)', display: 'block', marginBottom: '4px' }}>Longitud (-180..180)</label>
                  <input
                    type="number" step="0.0001" value={longitud} onChange={(e) => setLongitud(e.target.value)} required
                    style={{ width: '100%', padding: '10px', background: 'rgba(20,17,15,0.8)', border: '1px solid var(--border-warm)', borderRadius: '8px', color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-sub)', display: 'block', marginBottom: '4px' }}>Estación Receptora</label>
                <select
                  value={estacionId} onChange={(e) => setEstacionId(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: 'rgba(20,17,15,0.8)', border: '1px solid var(--border-warm)', borderRadius: '8px', color: '#fff' }}
                >
                  <option value="EST-MANIZALES-01">EST-MANIZALES-01 (Estación Central Manizales)</option>
                  <option value="EST-PEREIRA-01">EST-PEREIRA-01 (Estación Matecaña Pereira)</option>
                  <option value="EST-ARMENIA-01">EST-ARMENIA-01 (Estación Quindío Armenia)</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox" id="poblada" checked={zonaPoblada} onChange={(e) => setZonaPoblada(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--terracotta)' }}
                />
                <label htmlFor="poblada" style={{ fontSize: '0.88rem', color: 'var(--text-bright)', cursor: 'pointer' }}>
                  Impacta Área Habitada / Poblada (Incrementa Prioridad $P$)
                </label>
              </div>
            </>
          )}

          {editEvent && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-sub)', display: 'block', marginBottom: '4px' }}>Razón de la Corrección</label>
              <input
                type="text" value={razon} onChange={(e) => setRazon(e.target.value)} required
                style={{ width: '100%', padding: '10px', background: 'rgba(20,17,15,0.8)', border: '1px solid var(--border-warm)', borderRadius: '8px', color: '#fff' }}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary">
              {editEvent ? 'Aplicar Corrección AVL' : 'Insertar en Árbol AVL'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
