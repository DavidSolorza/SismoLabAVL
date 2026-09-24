import React, { useState, useEffect } from 'react';
import {
  PlusCircle, Edit3, Sparkles, Zap, Building2, Trees,
  MapPin, Radio, Clock, AlertCircle, CheckCircle2,
  Layers, Activity, ShieldAlert, ShieldCheck, Info
} from 'lucide-react';
import ModalDialog from './ModalDialog';
import { PREDEFINED_EVENTS, getAvailableId } from '../data/predefinedEvents';
import { fetchStations } from '../services/apiService';

export default function EventModal({
  isOpen,
  onClose,
  onSubmit,
  editEvent,
  events = [],
  simulationClock,
  onOpenStationsModal,
  position = 'top-right',
  maxHeight = 'calc(100vh - 140px)'
}) {
  const [id, setId] = useState(() => Math.floor(1004 + Math.random() * 8000));
  const [magnitud, setMagnitud] = useState(5.5);
  const [profundidad, setProfundidad] = useState(15.0);
  const [coordX, setCoordX] = useState(380.0);
  const [coordY, setCoordY] = useState(520.0);
  const [estacionId, setEstacionId] = useState('EST-MANIZALES-01');
  const [zonaPoblada, setZonaPoblada] = useState(true);
  const [razon, setRazon] = useState('Recalibración técnica de sensor');
  const [selectedPresetId, setSelectedPresetId] = useState('');

  const formatUtcToLocalInput = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 19);
    } catch {
      return '';
    }
  };

  const [timestamp, setTimestamp] = useState(() => formatUtcToLocalInput(simulationClock || new Date().toISOString()));

  // Inicialización de estado según creación o edición
  useEffect(() => {
    if (editEvent) {
      setId(editEvent.id);
      setMagnitud(editEvent.magnitud);
      setProfundidad(editEvent.profundidad);
      if (editEvent.x !== undefined && editEvent.y !== undefined) {
        setCoordX(editEvent.x);
        setCoordY(editEvent.y);
      } else if (editEvent.coordenadas) {
        setCoordX(editEvent.coordenadas.x ?? 380.0);
        setCoordY(editEvent.coordenadas.y ?? 520.0);
      }
      setEstacionId(editEvent.estacion_id || 'EST-MANIZALES-01');
      setZonaPoblada(editEvent.zona_poblada ?? true);
      setSelectedPresetId('');
    } else if (isOpen) {
      setId(Math.floor(1004 + Math.random() * 8000));
      setMagnitud(5.5);
      setProfundidad(15.0);
      setCoordX(380.0);
      setCoordY(520.0);
      setSelectedPresetId('');
      if (simulationClock) {
        setTimestamp(formatUtcToLocalInput(simulationClock));
      }
    }
  }, [editEvent, isOpen, simulationClock]);

  const [availableStations, setAvailableStations] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchStations()
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setAvailableStations(data);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const handlePresetSelect = (presetId) => {
    setSelectedPresetId(presetId);
    if (!presetId) return;
    const preset = PREDEFINED_EVENTS.find(p => String(p.id) === String(presetId));
    if (!preset) return;
    const targetId = getAvailableId(events, preset.id);
    setId(targetId);
    setMagnitud(preset.magnitud);
    setProfundidad(preset.profundidad);
    setCoordX(preset.x ?? 380.0);
    setCoordY(preset.y ?? 520.0);
    setEstacionId(preset.estacion_id);
    setZonaPoblada(preset.zona_poblada);
  };

  const selectedPresetObj = PREDEFINED_EVENTS.find(p => String(p.id) === String(selectedPresetId));

  // Validaciones reactivas en tiempo real
  const magNum = parseFloat(magnitud);
  const depthNum = parseFloat(profundidad);
  const xNum = parseFloat(coordX);
  const yNum = parseFloat(coordY);
  const idNum = parseInt(id, 10);

  const isMagValid = !isNaN(magNum) && magNum >= -2.0 && magNum <= 10.0;
  const isDepthValid = !isNaN(depthNum) && depthNum >= 0.0 && depthNum <= 700.0;
  const isXValid = !isNaN(xNum) && xNum >= 0.0 && xNum <= 1000.0;
  const isYValid = !isNaN(yNum) && yNum >= 0.0 && yNum <= 1000.0;
  const isIdValid = !isNaN(idNum) && idNum >= 1 && idNum <= 999999;
  const isTimestampValid = !timestamp || !simulationClock || (new Date(timestamp).getTime() <= new Date(simulationClock).getTime());

  // Estimación visual pura en tiempo real de la Prioridad obligatoria P (Sección 4) con desglose de regla
  const calcularEstimacion = () => {
    if (!isMagValid) return { p: 1, etiqueta: 'Baja', razon: 'Magnitud no válida', sensibleH: false };

    // Regla Oficial Sección 4:
    // 3 Alta: M >= 6.0; o bien M >= 4.5 y H <= 30.0 km y epicentro en zona poblada.
    if (magNum >= 6.0) {
      return {
        p: 3,
        etiqueta: 'Alta',
        razon: `M=${magNum.toFixed(1)} ≥ 6.0 → Alta automática (la profundidad no altera la prioridad en sismos ≥ 6.0 M)`,
        sensibleH: false
      };
    }

    if (magNum >= 4.5) {
      if (zonaPoblada) {
        if (isDepthValid && depthNum <= 30.0) {
          return {
            p: 3,
            etiqueta: 'Alta',
            razon: `M=${magNum.toFixed(1)} ≥ 4.5 y H=${depthNum.toFixed(1)} km ≤ 30.0 km en Zona Poblada → Alta`,
            sensibleH: true
          };
        } else {
          return {
            p: 2,
            etiqueta: 'Media',
            razon: isDepthValid
              ? `M=${magNum.toFixed(1)} ≥ 4.5 pero H=${depthNum.toFixed(1)} km > 30.0 km → Media (profundidad > 30 km)`
              : 'Profundidad no válida',
            sensibleH: true
          };
        }
      } else {
        return {
          p: 2,
          etiqueta: 'Media',
          razon: `M=${magNum.toFixed(1)} ≥ 4.5 en Zona No Poblada (H ≤ 30 km solo asciende a P=3 en zonas pobladas)`,
          sensibleH: false
        };
      }
    }

    // 1 Baja: Resto de casos (M < 4.5)
    return {
      p: 1,
      etiqueta: 'Baja',
      razon: `M=${magNum.toFixed(1)} < 4.5 → Baja automática (la profundidad H no altera la prioridad cuando M < 4.5)`,
      sensibleH: false
    };
  };

  const estimacionInfo = calcularEstimacion();
  const prioridadEstimada = estimacionInfo.p;
  const etiquetaPrioridad = estimacionInfo.etiqueta;

  // Paleta temática dinámica de la tarjeta de prioridad
  const priorityTheme = prioridadEstimada === 3
    ? { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', pillBg: '#F87171', pillText: '#FFFFFF', glow: 'rgba(239, 68, 68, 0.15)' }
    : (prioridadEstimada === 2
      ? { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', pillBg: '#F59E0B', pillText: '#FFFFFF', glow: 'rgba(245, 158, 11, 0.15)' }
      : { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534', pillBg: '#10B981', pillText: '#FFFFFF', glow: 'rgba(16, 185, 129, 0.15)' });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isMagValid || !isDepthValid || (!editEvent && (!isIdValid || !isXValid || !isYValid || !isTimestampValid))) {
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
      let isoTimestamp = undefined;
      if (timestamp) {
        try {
          isoTimestamp = new Date(timestamp).toISOString();
        } catch {
          isoTimestamp = undefined;
        }
      }

      onSubmit({
        isCorrection: false,
        id: idNum,
        magnitud: magNum,
        profundidad: depthNum,
        x: xNum,
        y: yNum,
        latitud: yNum,
        longitud: xNum,
        estacion_id: estacionId,
        zona_poblada: zonaPoblada,
        timestamp: isoTimestamp
      });
    }
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={editEvent ? `Corregir SIS-${String(id).padStart(6, '0')}` : 'Registrar Sismo'}
      subtitle={editEvent ? 'Reubicación en árbol AVL y cambio a estado Pendiente' : 'Plano [0, 1000] km • Balanceo AVL • K=(P, M, I)'}
      icon={editEvent ? Edit3 : PlusCircle}
      iconBg={editEvent ? '#FEF3C7' : 'var(--accent-light)'}
      iconColor={editEvent ? '#B45309' : 'var(--accent)'}
      position={position}
      maxWidth="430px"
      maxHeight={maxHeight}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {/* ============================================================== */}
        {/* 1. SELECTOR DE PLANTILLAS RÁPIDAS (Solo en Creación)           */}
        {/* ============================================================== */}
        {!editEvent && (
          <div style={{
            padding: '9px 12px',
            backgroundColor: '#F8FAFC',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ padding: '3px', borderRadius: '5px', backgroundColor: '#EEF2FF', color: 'var(--accent)' }}>
                  <Zap size={12} />
                </div>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Plantilla Rápida Predefinida
                </span>
              </div>

              {selectedPresetObj && (
                <span style={{
                  fontSize: '0.66rem', fontWeight: 800, padding: '2px 7px', borderRadius: '6px',
                  backgroundColor: selectedPresetObj.badgeBg, color: selectedPresetObj.badgeColor,
                  border: '1px solid rgba(0,0,0,0.06)'
                }}>
                  P{selectedPresetObj.prioridadEsperada} ({selectedPresetObj.prioridadEsperada === 3 ? 'Alta' : (selectedPresetObj.prioridadEsperada === 2 ? 'Media' : 'Baja')})
                </span>
              )}
            </div>
            
            <select
              value={selectedPresetId}
              onChange={(e) => handlePresetSelect(e.target.value)}
              style={{
                width: '100%', padding: '7px 9px', borderRadius: '7px',
                border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF',
                fontSize: '0.78rem', color: 'var(--text-primary)', cursor: 'pointer', outline: 'none',
                transition: 'border-color 0.15s ease'
              }}
            >
              <option value="">-- Seleccionar escenario predefinido --</option>
              {PREDEFINED_EVENTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} (M={p.magnitud}, H={p.profundidad} km)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ============================================================== */}
        {/* 2. CARD: IDENTIFICADOR & PARÁMETROS FÍSICOS                    */}
        {/* ============================================================== */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          padding: '11px 13px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
        }}>
          
          {/* Identificador SIS-XXXXXX */}
          {!editEvent && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  ID Numérico de Catálogo
                </label>
                <span style={{ fontSize: '0.64rem', color: isIdValid ? 'var(--text-muted)' : '#EF4444', fontWeight: 600 }}>
                  {isIdValid ? 'Rango [1, 999999]' : 'ID inválido'}
                </span>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{
                  position: 'absolute', left: '9px',
                  fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  SIS-
                </span>
                <input
                  type="number"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  required
                  placeholder="1001"
                  style={{
                    width: '100%', padding: '7px 10px 7px 42px', borderRadius: '7px',
                    border: `1px solid ${isIdValid ? '#CBD5E1' : '#FCA5A5'}`,
                    color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 700,
                    outline: 'none', backgroundColor: '#F8FAFC',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
              </div>
            </div>
          )}

          {/* Fila: Magnitud M y Profundidad H */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            
            {/* Magnitud M */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Activity size={12} style={{ color: 'var(--accent)' }} />
                  <span>Magnitud M</span>
                </label>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>[-2.0, 10.0]</span>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="number"
                  step="0.1"
                  value={magnitud}
                  onChange={(e) => setMagnitud(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '7px 28px 7px 10px', borderRadius: '7px',
                    border: `1px solid ${isMagValid ? '#CBD5E1' : '#FCA5A5'}`,
                    color: 'var(--text-primary)', fontSize: '0.86rem', fontWeight: 800,
                    outline: 'none', backgroundColor: '#F8FAFC'
                  }}
                />
                <span style={{
                  position: 'absolute', right: '9px',
                  fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent)'
                }}>
                  M
                </span>
              </div>
            </div>

            {/* Profundidad H */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Layers size={12} style={{ color: '#0891B2' }} />
                  <span>Profundidad H</span>
                </label>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>[0, 700] km</span>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="number"
                  step="0.1"
                  value={profundidad}
                  onChange={(e) => setProfundidad(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '7px 32px 7px 10px', borderRadius: '7px',
                    border: `1px solid ${isDepthValid ? '#CBD5E1' : '#FCA5A5'}`,
                    color: 'var(--text-primary)', fontSize: '0.86rem', fontWeight: 800,
                    outline: 'none', backgroundColor: '#F8FAFC'
                  }}
                />
                <span style={{
                  position: 'absolute', right: '9px',
                  fontSize: '0.70rem', fontWeight: 700, color: '#0891B2'
                }}>
                  km
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* ============================================================== */}
        {/* 3. HERO CHIP: PRIORIDAD CALCULADA P Y CLAVE K=(P, M, I)        */}
        {/* ============================================================== */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '7px',
          padding: '10px 12px', borderRadius: '10px',
          backgroundColor: priorityTheme.bg,
          border: `1px solid ${priorityTheme.border}`,
          boxShadow: `0 2px 8px ${priorityTheme.glow}`,
          transition: 'all 0.2s ease'
        }}>
          {/* Fila superior: Badge de Prioridad + Clave K */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '2px 8px', borderRadius: '6px',
                backgroundColor: priorityTheme.pillBg, color: priorityTheme.pillText,
                fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.02em',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <Sparkles size={11} />
                P{prioridadEstimada} • {etiquetaPrioridad.toUpperCase()}
              </span>
              <span style={{ fontSize: '0.70rem', color: priorityTheme.text, fontWeight: 700 }}>
                Prioridad Calculada
              </span>
            </div>

            {/* Clave K = (P, M, I) */}
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.70rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              padding: '2px 7px',
              borderRadius: '5px',
              border: '1px solid rgba(0,0,0,0.08)'
            }}>
              K=({prioridadEstimada}, {isMagValid ? magNum.toFixed(1) : '?'}M, #{id})
            </div>
          </div>

          {/* Desglose explicativo de la Regla de Negocio (Sección 4) */}
          <div style={{
            fontSize: '0.69rem', color: priorityTheme.text, lineHeight: '1.35',
            borderTop: `1px dashed ${priorityTheme.border}`, paddingTop: '5px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px' }}>
              <Info size={12} style={{ flexShrink: 0, marginTop: '2px', opacity: 0.85 }} />
              <span>
                <strong>Regla Sección 4:</strong> {estimacionInfo.razon}
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 4. CARD: COORDENADAS, ESTACIÓN Y ENTORNO POBLACIONAL           */}
        {/* ============================================================== */}
        {!editEvent && (
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
            padding: '11px 13px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
          }}>
            
            {/* Coordenadas Epicentrales X e Y */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} style={{ color: '#9333EA' }} />
                  <span>Coordenadas Cartesianas Epicentro</span>
                </label>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Plano [0, 1000] km</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '8px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)' }}>X:</span>
                  <input
                    type="number" step="0.1" value={coordX} onChange={(e) => setCoordX(e.target.value)} required
                    style={{
                      width: '100%', padding: '6px 26px 6px 24px', borderRadius: '6px',
                      border: `1px solid ${isXValid ? '#CBD5E1' : '#FCA5A5'}`, fontSize: '0.78rem',
                      backgroundColor: '#F8FAFC', fontWeight: 700
                    }}
                  />
                  <span style={{ position: 'absolute', right: '7px', fontSize: '0.64rem', color: 'var(--text-muted)' }}>km</span>
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '8px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)' }}>Y:</span>
                  <input
                    type="number" step="0.1" value={coordY} onChange={(e) => setCoordY(e.target.value)} required
                    style={{
                      width: '100%', padding: '6px 26px 6px 24px', borderRadius: '6px',
                      border: `1px solid ${isYValid ? '#CBD5E1' : '#FCA5A5'}`, fontSize: '0.78rem',
                      backgroundColor: '#F8FAFC', fontWeight: 700
                    }}
                  />
                  <span style={{ position: 'absolute', right: '7px', fontSize: '0.64rem', color: 'var(--text-muted)' }}>km</span>
                </div>
              </div>
            </div>

            {/* Estación Receptora */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Radio size={12} style={{ color: '#0284C7' }} />
                  <span>Estación Sismológica Receptora</span>
                </label>
                {onOpenStationsModal && (
                  <button
                    type="button"
                    onClick={onOpenStationsModal}
                    style={{
                      border: 'none', background: 'transparent',
                      color: 'var(--accent)', fontSize: '0.68rem',
                      fontWeight: 700, cursor: 'pointer', padding: '0 2px'
                    }}
                    title="Ver o registrar nuevas estaciones sísmicas"
                  >
                    + Gestionar Estaciones
                  </button>
                )}
              </div>
              <select
                value={estacionId} onChange={(e) => setEstacionId(e.target.value)}
                style={{
                  width: '100%', padding: '6px 8px', borderRadius: '6px',
                  border: '1px solid #CBD5E1', fontSize: '0.78rem', backgroundColor: '#F8FAFC',
                  color: 'var(--text-primary)', outline: 'none'
                }}
              >
                {availableStations.map(st => (
                  <option key={st.codigo} value={st.codigo}>
                    {st.codigo} - {st.nombre} ({st.x}, {st.y} km)
                  </option>
                ))}
                {availableStations.length === 0 && (
                  <>
                    <option value="EST-MANIZALES-01">EST-MANIZALES-01 - Red Sismológica Manizales</option>
                    <option value="EST-PEREIRA-01">EST-PEREIRA-01 - Estación Central Pereira</option>
                    <option value="EST-ARMENIA-01">EST-ARMENIA-01 - Estación Regional Armenia</option>
                    <option value="EST-BOGOTA-01">EST-BOGOTA-01 - Estación Sabana Bogotá</option>
                    <option value="EST-MEDELLIN-01">EST-MEDELLIN-01 - Estación Valle de Aburrá</option>
                    <option value="EST-BUCARAMANGA-01">EST-BUCARAMANGA-01 - Estación Los Santos</option>
                    <option value="EST-CALI-01">EST-CALI-01 - Estación Valle del Cauca</option>
                    <option value="EST-PACIFICO-01">EST-PACIFICO-01 - Estación Litoral Pacífico</option>
                    <option value="EST-POPAYAN-01">EST-POPAYAN-01 - Estación Falla Micay Popayán</option>
                    <option value="EST-CUCUTA-01">EST-CUCUTA-01 - Estación Frontera Cúcuta</option>
                    <option value="EST-SANTA-MARTA-01">EST-SANTA-MARTA-01 - Estación Sierra Nevada</option>
                    <option value="EST-IBAGUE-01">EST-IBAGUE-01 - Estación Volcánica Machín</option>
                  </>
                )}
                {estacionId && !availableStations.some(s => s.codigo === estacionId) && (
                  <option value={estacionId}>{estacionId} (Estación Seleccionada)</option>
                )}
              </select>
            </div>

            {/* Toggle Card Interactivo: ¿Zona Poblada? */}
            <div
              onClick={() => setZonaPoblada(!zonaPoblada)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: zonaPoblada ? '#F0FDF4' : '#F8FAFC',
                border: `1px solid ${zonaPoblada ? '#86EFAC' : '#E2E8F0'}`,
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  padding: '4px', borderRadius: '6px',
                  backgroundColor: zonaPoblada ? '#DCFCE7' : '#E2E8F0',
                  color: zonaPoblada ? '#15803D' : '#64748B'
                }}>
                  {zonaPoblada ? <Building2 size={14} /> : <Trees size={14} />}
                </div>
                <div>
                  <div style={{ fontSize: '0.76rem', fontWeight: 800, color: zonaPoblada ? '#166534' : 'var(--text-primary)' }}>
                    {zonaPoblada ? 'Epicentro en Zona Poblada' : 'Epicentro en Zona Rural / No Poblada'}
                  </div>
                  <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                    {zonaPoblada ? 'Si M ≥ 4.5 y H ≤ 30 km eleva la prioridad a P=3 (Alta)' : 'No aplica condición de vulnerabilidad poblacional'}
                  </div>
                </div>
              </div>

              {/* Interruptor tipo Switch */}
              <div style={{
                width: '34px', height: '18px', borderRadius: '10px',
                backgroundColor: zonaPoblada ? '#22C55E' : '#CBD5E1',
                position: 'relative', transition: 'background-color 0.2s ease', flexShrink: 0
              }}>
                <div style={{
                  width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#FFFFFF',
                  position: 'absolute', top: '2px', left: zonaPoblada ? '18px' : '2px',
                  transition: 'left 0.2s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }} />
              </div>
            </div>

            {/* Fecha y Hora UTC */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} style={{ color: 'var(--accent)' }} />
                  <span>Marca Temporal (UTC)</span>
                </label>
                <span style={{
                  fontSize: '0.64rem', fontWeight: 700,
                  color: isTimestampValid ? '#16A34A' : '#DC2626'
                }}>
                  {isTimestampValid ? '✓ ≤ Reloj Simulación' : '⚠ Posterior al reloj'}
                </span>
              </div>
              <input
                type="datetime-local"
                step="1"
                value={timestamp}
                max={formatUtcToLocalInput(simulationClock)}
                onChange={(e) => setTimestamp(e.target.value)}
                required
                style={{
                  width: '100%', padding: '6px 8px', borderRadius: '6px',
                  border: `1px solid ${isTimestampValid ? '#CBD5E1' : '#FCA5A5'}`,
                  fontSize: '0.78rem', backgroundColor: '#F8FAFC', color: 'var(--text-primary)', outline: 'none'
                }}
              />
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* 5. MODO CORRECCIÓN (SECCIÓN 8): REGLA DE REUBICACIÓN EN AVL   */}
        {/* ============================================================== */}
        {editEvent && (
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
            padding: '11px 13px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 8px', borderRadius: '6px',
              backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE'
            }}>
              <Info size={13} style={{ color: '#2563EB', flexShrink: 0 }} />
              <span style={{ fontSize: '0.68rem', color: '#1E40AF', lineHeight: '1.3' }}>
                La corrección actualiza la tupla K=(P, M, I), reubica el nodo en el árbol AVL y restablece su estado a <strong>Pendiente de Atención</strong>.
              </span>
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                Motivo / Justificación Técnica de la Corrección
              </label>
              <input
                type="text"
                value={razon}
                onChange={(e) => setRazon(e.target.value)}
                required
                placeholder="Ej. Recalibración de sensor, refinamiento de ondas P/S"
                style={{
                  width: '100%', padding: '7px 10px', borderRadius: '6px',
                  border: '1px solid #CBD5E1', fontSize: '0.80rem',
                  backgroundColor: '#F8FAFC', color: 'var(--text-primary)', outline: 'none'
                }}
              />
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 6. BOTONES DE ACCIÓN FOOTER                                    */}
        {/* ============================================================== */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '9px',
          marginTop: '4px',
          paddingTop: '8px',
          borderTop: '1px solid #E2E8F0'
        }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            style={{
              padding: '7px 14px',
              fontSize: '0.78rem',
              fontWeight: 600,
              borderRadius: '7px'
            }}
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            className="btn-primary"
            disabled={!isMagValid || !isDepthValid || (!editEvent && (!isIdValid || !isXValid || !isYValid || !isTimestampValid))}
            style={{
              padding: '7px 16px',
              fontSize: '0.80rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '7px',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)'
            }}
          >
            {editEvent ? <Edit3 size={13} /> : <PlusCircle size={13} />}
            <span>{editEvent ? 'Aplicar Corrección AVL' : 'Registrar Sismo'}</span>
          </button>
        </div>

      </form>
    </ModalDialog>
  );
}

