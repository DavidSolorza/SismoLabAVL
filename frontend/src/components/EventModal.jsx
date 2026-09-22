import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit3, Sparkles, Zap } from 'lucide-react';
import ModalDialog from './ModalDialog';
import { PREDEFINED_EVENTS, getAvailableId } from '../data/predefinedEvents';

export default function EventModal({
  isOpen,
  onClose,
  onSubmit,
  editEvent,
  events = [],
  position = 'top-right',
  maxHeight = 'calc(100vh - 156px)'
}) {
  const [id, setId] = useState(() => Math.floor(1004 + Math.random() * 8000));
  const [magnitud, setMagnitud] = useState(5.5);
  const [profundidad, setProfundidad] = useState(15.0);
  const [latitud, setLatitud] = useState(5.06889);
  const [longitud, setLongitud] = useState(-75.51738);
  const [estacionId, setEstacionId] = useState('EST-MANIZALES-01');
  const [zonaPoblada, setZonaPoblada] = useState(true);
  const [razon, setRazon] = useState('Recalibración técnica de sensor');
  const [selectedPresetId, setSelectedPresetId] = useState('');

  // Inicialización de estado según creación o edición
  useEffect(() => {
    if (editEvent) {
      setId(editEvent.id);
      setMagnitud(editEvent.magnitud);
      setProfundidad(editEvent.profundidad);
      if (editEvent.coordenadas) {
        setLatitud(editEvent.coordenadas.latitude ?? editEvent.coordenadas.latitud ?? 5.06889);
        setLongitud(editEvent.coordenadas.longitude ?? editEvent.coordenadas.longitud ?? -75.51738);
      }
      setEstacionId(editEvent.estacion_id || 'EST-MANIZALES-01');
      setZonaPoblada(editEvent.zona_poblada ?? true);
      setSelectedPresetId('');
    } else if (isOpen) {
      setId(Math.floor(1004 + Math.random() * 8000));
      setMagnitud(5.5);
      setProfundidad(15.0);
      setSelectedPresetId('');
    }
  }, [editEvent, isOpen]);

  const handlePresetSelect = (presetId) => {
    setSelectedPresetId(presetId);
    if (!presetId) return;
    const preset = PREDEFINED_EVENTS.find(p => String(p.id) === String(presetId));
    if (!preset) return;
    const targetId = getAvailableId(events, preset.id);
    setId(targetId);
    setMagnitud(preset.magnitud);
    setProfundidad(preset.profundidad);
    setLatitud(preset.latitud);
    setLongitud(preset.longitud);
    setEstacionId(preset.estacion_id);
    setZonaPoblada(preset.zona_poblada);
  };

  const selectedPresetObj = PREDEFINED_EVENTS.find(p => String(p.id) === String(selectedPresetId));

  if (!isOpen) return null;

  // Validaciones reactivas en tiempo real
  const magNum = parseFloat(magnitud);
  const depthNum = parseFloat(profundidad);
  const idNum = parseInt(id, 10);

  const isMagValid = !isNaN(magNum) && magNum >= -2.0 && magNum <= 10.0;
  const isDepthValid = !isNaN(depthNum) && depthNum >= 0.0 && depthNum <= 700.0;
  const isIdValid = !isNaN(idNum) && idNum >= 1 && idNum <= 999999;

  // Estimación visual en tiempo real de la Prioridad P resultante
  const calcularPrioridadEstimada = () => {
    if (!isMagValid) return 3;
    if (magNum >= 6.5 || (magNum >= 5.0 && zonaPoblada && depthNum <= 30.0)) {
      return 1;
    }
    if (magNum >= 4.0 || zonaPoblada) {
      return 2;
    }
    return 3;
  };

  const prioridadEstimada = calcularPrioridadEstimada();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isMagValid || !isDepthValid || (!editEvent && !isIdValid)) {
      return;
    }

    if (editEvent) {
      onSubmit({
        isCorrection: true,
        eventId: idNum,
        nuevaMagnitud: magNum,
        nuevaProfundidad: depthNum,
        razon: razon
      });
    } else {
      onSubmit({
        isCorrection: false,
        id: idNum,
        magnitud: magNum,
        profundidad: depthNum,
        latitud: parseFloat(latitud),
        longitud: parseFloat(longitud),
        estacion_id: estacionId,
        zona_poblada: zonaPoblada
      });
    }
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={editEvent ? `Corregir SIS-${id}` : 'Registrar Sismo'}
      subtitle={editEvent ? 'Reubicación en árbol AVL' : 'Inserción evaluada y balanceada'}
      icon={editEvent ? Edit3 : PlusCircle}
      iconBg={editEvent ? 'var(--p2-bg)' : 'var(--accent-light)'}
      iconColor={editEvent ? 'var(--p2-text)' : 'var(--accent)'}
      position={position}
      maxWidth="350px"
      maxHeight={maxHeight}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        {/* Selector de Sismos Predefinidos (Plantillas Rápidas) */}
        {!editEvent && (
          <div style={{
            padding: '8px 10px',
            backgroundColor: '#F8FAFC',
            borderRadius: '10px',
            border: '1px solid var(--accent-border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Zap size={13} />
                <span>Plantilla Rápida</span>
              </label>
              {selectedPresetObj && (
                <span style={{
                  fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px',
                  backgroundColor: selectedPresetObj.badgeBg, color: selectedPresetObj.badgeColor
                }}>
                  P{selectedPresetObj.prioridadEsperada}
                </span>
              )}
            </div>
            
            <select
              value={selectedPresetId}
              onChange={(e) => handlePresetSelect(e.target.value)}
              style={{
                width: '100%', padding: '6px 8px', borderRadius: '6px',
                border: '1px solid var(--border-hover)', backgroundColor: '#FFFFFF',
                fontSize: '0.78rem', color: 'var(--text-primary)', cursor: 'pointer', outline: 'none'
              }}
            >
              <option value="">-- Autocompletar plantilla --</option>
              {PREDEFINED_EVENTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} (M={p.magnitud})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Identificador (solo creación) */}
        {!editEvent && (
          <div>
            <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
              ID Único (1 a 999999)
            </label>
            <input
              type="number"
              value={id}
              onChange={(e) => setId(e.target.value)}
              required
              style={{
                width: '100%', padding: '7px 10px', borderRadius: '6px',
                border: `1px solid ${isIdValid ? 'var(--border-hover)' : 'var(--coral-soft)'}`,
                color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none',
                backgroundColor: '#F8FAFC'
              }}
            />
          </div>
        )}

        {/* Fila: Magnitud y Profundidad */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
              Magnitud (M)
            </label>
            <input
              type="number"
              step="0.1"
              value={magnitud}
              onChange={(e) => setMagnitud(e.target.value)}
              required
              style={{
                width: '100%', padding: '7px 10px', borderRadius: '6px',
                border: `1px solid ${isMagValid ? 'var(--border-hover)' : 'var(--coral-soft)'}`,
                color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none',
                backgroundColor: '#F8FAFC'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
              Profundidad (km)
            </label>
            <input
              type="number"
              step="0.1"
              value={profundidad}
              onChange={(e) => setProfundidad(e.target.value)}
              required
              style={{
                width: '100%', padding: '7px 10px', borderRadius: '6px',
                border: `1px solid ${isDepthValid ? 'var(--border-hover)' : 'var(--coral-soft)'}`,
                color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none',
                backgroundColor: '#F8FAFC'
              }}
            />
          </div>
        </div>

        {/* Chip de Previsualización de Prioridad P */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 10px', borderRadius: '6px',
          backgroundColor: prioridadEstimada === 1 ? 'var(--p1-bg)' : prioridadEstimada === 2 ? 'var(--p2-bg)' : 'var(--p3-bg)',
          border: `1px solid ${prioridadEstimada === 1 ? 'var(--p1-border)' : prioridadEstimada === 2 ? 'var(--p2-border)' : 'var(--p3-border)'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Sparkles size={13} style={{ color: prioridadEstimada === 1 ? 'var(--p1-text)' : prioridadEstimada === 2 ? 'var(--p2-text)' : 'var(--p3-text)' }} />
            <span style={{
              fontSize: '0.72rem', fontWeight: 700,
              color: prioridadEstimada === 1 ? 'var(--p1-text)' : prioridadEstimada === 2 ? 'var(--p2-text)' : 'var(--p3-text)'
            }}>
              Prioridad: P = {prioridadEstimada} ({prioridadEstimada === 1 ? 'Crítica' : prioridadEstimada === 2 ? 'Moderada' : 'Normal'})
            </span>
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>K=({prioridadEstimada}, {isMagValid ? magNum.toFixed(1) : '?'}, {id})</span>
        </div>

        {/* Campos adicionales para creación */}
        {!editEvent && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Latitud</label>
                <input
                  type="number" step="0.0001" value={latitud} onChange={(e) => setLatitud(e.target.value)} required
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-hover)', fontSize: '0.78rem', backgroundColor: '#F8FAFC' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Longitud</label>
                <input
                  type="number" step="0.0001" value={longitud} onChange={(e) => setLongitud(e.target.value)} required
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-hover)', fontSize: '0.78rem', backgroundColor: '#F8FAFC' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Estación Receptora</label>
              <select
                value={estacionId} onChange={(e) => setEstacionId(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-hover)', fontSize: '0.78rem', backgroundColor: '#F8FAFC', color: 'var(--text-primary)' }}
              >
                <option value="EST-MANIZALES-01">EST-MANIZALES-01 (Manizales)</option>
                <option value="EST-PEREIRA-01">EST-PEREIRA-01 (Pereira)</option>
                <option value="EST-ARMENIA-01">EST-ARMENIA-01 (Armenia)</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '2px 0' }}>
              <input
                type="checkbox" id="modal-poblada" checked={zonaPoblada} onChange={(e) => setZonaPoblada(e.target.checked)}
                style={{ width: '15px', height: '15px', accentColor: 'var(--accent)', cursor: 'pointer' }}
              />
              <label htmlFor="modal-poblada" style={{ fontSize: '0.76rem', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 500 }}>
                Epicentro Urbano (Eleva Prioridad P)
              </label>
            </div>
          </>
        )}

        {/* Razón de Corrección si es edición */}
        {editEvent && (
          <div>
            <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>Motivo de la Corrección</label>
            <input
              type="text" value={razon} onChange={(e) => setRazon(e.target.value)} required
              style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border-hover)', fontSize: '0.82rem', backgroundColor: '#F8FAFC', color: 'var(--text-primary)' }}
            />
          </div>
        )}

        {/* Botones de Acción */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
          <button type="button" className="btn-secondary" onClick={onClose} style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={!isMagValid || !isDepthValid || (!editEvent && !isIdValid)}
            style={{ padding: '6px 14px', fontSize: '0.78rem', fontWeight: 700 }}
          >
            {editEvent ? 'Corregir Nodo' : 'Insertar en Árbol'}
          </button>
        </div>

      </form>
    </ModalDialog>
  );
}

