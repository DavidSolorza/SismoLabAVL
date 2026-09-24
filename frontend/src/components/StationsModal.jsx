import React, { useState, useEffect } from 'react';
import { Radio, Plus, Search, MapPin, CheckCircle2, AlertCircle, RefreshCw, Activity, ShieldCheck } from 'lucide-react';
import ModalDialog from './ModalDialog';
import { fetchStations, createStation } from '../services/apiService';

export default function StationsModal({
  isOpen,
  onClose,
  showToast,
  onStationCreated
}) {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [coordX, setCoordX] = useState(500.0);
  const [coordY, setCoordY] = useState(500.0);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadStationsList = async () => {
    setLoading(true);
    try {
      const data = await fetchStations();
      setStations(data);
    } catch (err) {
      if (showToast) showToast(err.message || 'Error al cargar las estaciones', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStationsList();
      setShowAddForm(false);
      setFormError('');
    }
  }, [isOpen]);

  const handleCreateStation = async (e) => {
    e.preventDefault();
    setFormError('');

    const cleanCode = codigo.trim().toUpperCase();
    const cleanName = nombre.trim();
    const xNum = parseFloat(coordX);
    const yNum = parseFloat(coordY);

    if (!cleanCode) {
      setFormError('El código de la estación es obligatorio (ej. EST-CARTAGENA-01).');
      return;
    }
    if (cleanName.length < 3) {
      setFormError('El nombre debe tener al menos 3 caracteres.');
      return;
    }
    if (isNaN(xNum) || xNum < 0 || xNum > 1000) {
      setFormError('La coordenada X debe ser un valor entre 0 y 1000 km.');
      return;
    }
    if (isNaN(yNum) || yNum < 0 || yNum > 1000) {
      setFormError('La coordenada Y debe ser un valor entre 0 y 1000 km.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await createStation({
        codigo: cleanCode,
        nombre: cleanName,
        x: xNum,
        y: yNum,
        activa: true
      });

      if (showToast) {
        showToast(res.message || `Estación ${cleanCode} registrada`, 'success', {
          title: 'Estación de Monitoreo Creada'
        });
      }

      setCodigo('');
      setNombre('');
      setCoordX(500.0);
      setCoordY(500.0);
      setShowAddForm(false);

      await loadStationsList();
      if (onStationCreated) {
        onStationCreated(res.estacion || { codigo: cleanCode, nombre: cleanName, x: xNum, y: yNum });
      }
    } catch (err) {
      setFormError(err.message || 'No fue posible registrar la estación.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStations = stations.filter(st => {
    const term = searchTerm.toLowerCase();
    return (
      (st.codigo || '').toLowerCase().includes(term) ||
      (st.nombre || '').toLowerCase().includes(term)
    );
  });

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Red Nacional de Estaciones Sísmicas"
      subtitle="Supervisión telemétrica y registro de nuevas estaciones en el plano cartesiano [0, 1000] km"
      icon={Radio}
      iconBg="#E0F2FE"
      iconColor="#0284C7"
      maxWidth="720px"
      maxHeight="calc(100vh - 120px)"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Barra superior de acciones y estadísticas */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          padding: '10px 14px',
          backgroundColor: '#F8FAFC',
          borderRadius: '10px',
          border: '1px solid #E2E8F0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: '#E0F2FE',
              color: '#0369A1',
              fontSize: '0.78rem',
              fontWeight: 700
            }}>
              <Activity size={13} />
              {stations.length} Estaciones Activas
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Cobertura continua 24/7
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={loadStationsList}
              disabled={loading}
              className="btn-secondary"
              style={{ padding: '5px 9px', fontSize: '0.76rem' }}
              title="Recargar estaciones desde el servidor"
            >
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
              <span>Sincronizar</span>
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-primary"
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            >
              <Plus size={14} />
              <span>{showAddForm ? 'Cerrar Formulario' : 'Nueva Estación'}</span>
            </button>
          </div>
        </div>

        {/* Formulario Desplegable para Agregar Nueva Estación */}
        {showAddForm && (
          <form
            onSubmit={handleCreateStation}
            className="glass-panel"
            style={{
              padding: '14px 16px',
              backgroundColor: '#F0F9FF',
              border: '1px solid #BAE6FD',
              borderRadius: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0369A1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Radio size={15} />
                Registrar Nueva Estación de Monitoreo
              </h4>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Plano Cartesiano [0, 1000] km
              </span>
            </div>

            {formError && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 10px',
                borderRadius: '6px',
                backgroundColor: '#FEE2E2',
                color: '#991B1B',
                fontSize: '0.76rem',
                border: '1px solid #FECACA'
              }}>
                <AlertCircle size={14} />
                <span>{formError}</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              {/* Código */}
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                  Código de Estación *
                </label>
                <input
                  type="text"
                  placeholder="ej: EST-CARTAGENA-01"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  style={{
                    width: '100%',
                    padding: '6px 9px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.78rem',
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: '#FFFFFF',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              {/* Nombre */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                  Nombre Descriptivo de la Estación *
                </label>
                <input
                  type="text"
                  placeholder="ej: Estación Sismológica Costera Cartagena (Bolívar)"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 9px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.78rem',
                    backgroundColor: '#FFFFFF',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              {/* Coordenada X */}
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                  Coordenada X (km) [0, 1000] *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1000"
                  value={coordX}
                  onChange={(e) => setCoordX(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 9px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.78rem',
                    backgroundColor: '#FFFFFF',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              {/* Coordenada Y */}
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                  Coordenada Y (km) [0, 1000] *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1000"
                  value={coordY}
                  onChange={(e) => setCoordY(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 9px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.78rem',
                    backgroundColor: '#FFFFFF',
                    outline: 'none'
                  }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.76rem' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
                style={{ padding: '6px 14px', fontSize: '0.78rem', backgroundColor: '#0284C7' }}
              >
                {submitting ? 'Registrando...' : 'Registrar Estación'}
              </button>
            </div>
          </form>
        )}

        {/* Buscador de estaciones */}
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Filtrar por código o nombre de estación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 10px 7px 32px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '0.8rem',
              backgroundColor: '#FFFFFF',
              outline: 'none'
            }}
          />
        </div>

        {/* Lista en cuadrícula de estaciones */}
        <div style={{
          maxHeight: '380px',
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '10px',
          paddingRight: '4px'
        }}>
          {filteredStations.map((st) => (
            <div
              key={st.codigo}
              className="glass-panel"
              style={{
                padding: '12px 14px',
                borderRadius: '9px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    padding: '4px',
                    borderRadius: '5px',
                    backgroundColor: '#E0F2FE',
                    color: '#0284C7'
                  }}>
                    <Radio size={14} />
                  </div>
                  <span style={{
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-primary)'
                  }}>
                    {st.codigo}
                  </span>
                </div>

                <span style={{
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: st.activo ? '#DCFCE7' : '#FEE2E2',
                  color: st.activo ? '#15803D' : '#991B1B',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}>
                  <ShieldCheck size={10} />
                  {st.activo ? 'Operativa' : 'Inactiva'}
                </span>
              </div>

              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: 1.3 }}>
                {st.nombre}
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '4px',
                fontSize: '0.7rem',
                color: 'var(--text-muted)'
              }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <MapPin size={11} style={{ color: '#0284C7' }} />
                  X: <strong>{Number(st.x).toFixed(1)} km</strong>
                </span>
                <span>•</span>
                <span>
                  Y: <strong>{Number(st.y).toFixed(1)} km</strong>
                </span>
              </div>
            </div>
          ))}

          {filteredStations.length === 0 && !loading && (
            <div style={{
              gridColumn: '1 / -1',
              padding: '30px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.8rem'
            }}>
              No se encontraron estaciones que coincidan con la búsqueda.
            </div>
          )}
        </div>

      </div>
    </ModalDialog>
  );
}
