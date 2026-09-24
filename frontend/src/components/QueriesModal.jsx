import React, { useState } from 'react';
import {
  Search, BarChart2, Filter, GitCommit, AlertCircle, Clock,
  ArrowRight, ShieldCheck, Zap, Layers, ChevronRight, CheckCircle2
} from 'lucide-react';
import ModalDialog from './ModalDialog';
import {
  fetchKPrioritariosPendientes,
  fetchEventosPorMagnitud,
  fetchEventosPorProfundidadYFechas,
  fetchAsociacionesEvento,
  fetchAccesoCostoso,
  runComparativeBenchmark
} from '../services/apiService';

export default function QueriesModal({ isOpen, onClose, onSelectEvent, simulationClock }) {
  const [activeTab, setActiveTab] = useState('pendientes');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultData, setResultData] = useState(null);

  // Parámetros de consulta
  const [kParam, setKParam] = useState(5);
  const [mMin, setMMin] = useState(3.0);
  const [mMax, setMMax] = useState(7.5);
  const [hMax, setHMax] = useState(40.0);
  const [tInicio, setTInicio] = useState('2026-09-20T00:00');
  const [tFin, setTFin] = useState('2026-09-25T23:59');
  const [eventIdParam, setEventIdParam] = useState('');
  const [limiteLParam, setLimiteLParam] = useState('');

  // Benchmark
  const [benchmarkN, setBenchmarkN] = useState(100);
  const [benchmarkPatron, setBenchmarkPatron] = useState('todos');

  const executeQuery = async (queryFn, ...args) => {
    setLoading(true);
    setError(null);
    setResultData(null);
    try {
      const res = await queryFn(...args);
      setResultData(res);
    } catch (err) {
      setError(err.message || 'Error al ejecutar la consulta');
    } finally {
      setLoading(false);
    }
  };

  const handleRunPendientes = () => executeQuery(fetchKPrioritariosPendientes, parseInt(kParam, 10) || 5);
  const handleRunMagnitud = () => executeQuery(fetchEventosPorMagnitud, parseFloat(mMin) || 0.0, parseFloat(mMax) || 10.0);
  const handleRunProfundidadFechas = () => {
    const isoIni = new Date(tInicio).toISOString();
    const isoFin = new Date(tFin).toISOString();
    executeQuery(fetchEventosPorProfundidadYFechas, parseFloat(hMax) || 50.0, isoIni, isoFin);
  };
  const handleRunAsociaciones = () => {
    const id = parseInt(eventIdParam, 10);
    if (!id) {
      setError('Ingrese un ID numérico de evento válido.');
      return;
    }
    executeQuery(fetchAsociacionesEvento, id);
  };
  const handleRunAccesoCostoso = () => {
    const l = limiteLParam !== '' ? parseInt(limiteLParam, 10) : null;
    executeQuery(fetchAccesoCostoso, l);
  };
  const handleRunBenchmark = () => {
    executeQuery(runComparativeBenchmark, parseInt(benchmarkN, 10) || 100, benchmarkPatron);
  };

  const tabs = [
    { id: 'pendientes', label: '1. K Pendientes', icon: Clock },
    { id: 'magnitud', label: '2. Rango Magnitud', icon: Filter },
    { id: 'profundidad', label: '3. Profundidad & Fechas', icon: Search },
    { id: 'asociaciones', label: '4. Asociaciones / Réplicas', icon: GitCommit },
    { id: 'acceso_costoso', label: '5. Acceso Costoso (> L)', icon: Zap },
    { id: 'benchmark', label: '6. Benchmark AVL vs BST', icon: BarChart2 }
  ];

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Consultas y Análisis del Desempeño"
      subtitle="Inspección algorítmica, reporte de nodos examinados y benchmark experimental (Sección 11)"
      icon={Search}
      maxWidth="840px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Navegación de Pestañas */}
        <div style={{
          display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setResultData(null); setError(null); }}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: isSel ? '1px solid var(--accent)' : '1px solid transparent',
                  backgroundColor: isSel ? 'var(--accent-light)' : 'transparent',
                  color: isSel ? 'var(--accent-text)' : 'var(--text-secondary)',
                  fontWeight: isSel ? 700 : 500,
                  fontSize: '0.78rem',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Formulario según pestaña */}
        <div style={{
          padding: '14px', borderRadius: '10px',
          backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)'
        }}>
          {activeTab === 'pendientes' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '180px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Cantidad K de eventos pendientes (Descendente por K):
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={kParam}
                  onChange={(e) => setKParam(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                />
              </div>
              <button
                className="btn-primary"
                onClick={handleRunPendientes}
                disabled={loading}
                style={{ alignSelf: 'flex-end', padding: '8px 16px', fontSize: '0.8rem' }}
              >
                {loading ? 'Consultando...' : 'Consultar K Pendientes'}
              </button>
            </div>
          )}

          {activeTab === 'magnitud' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '130px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Magnitud Mínima (M_min):
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="-2.0"
                  max="10.0"
                  value={mMin}
                  onChange={(e) => setMMin(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: '130px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Magnitud Máxima (M_max):
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="-2.0"
                  max="10.0"
                  value={mMax}
                  onChange={(e) => setMMax(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                />
              </div>
              <button
                className="btn-primary"
                onClick={handleRunMagnitud}
                disabled={loading}
                style={{ alignSelf: 'flex-end', padding: '8px 16px', fontSize: '0.8rem' }}
              >
                {loading ? 'Consultando...' : 'Filtrar por Magnitud'}
              </button>
            </div>
          )}

          {activeTab === 'profundidad' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '130px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Profundidad Máx Hipocentro (km):
                  </label>
                  <input
                    type="number"
                    step="1.0"
                    min="0"
                    max="1000"
                    value={hMax}
                    onChange={(e) => setHMax(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Fecha Inicio:
                  </label>
                  <input
                    type="datetime-local"
                    value={tInicio}
                    onChange={(e) => setTInicio(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Fecha Fin:
                  </label>
                  <input
                    type="datetime-local"
                    value={tFin}
                    onChange={(e) => setTFin(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
              <button
                className="btn-primary"
                onClick={handleRunProfundidadFechas}
                disabled={loading}
                style={{ alignSelf: 'flex-end', padding: '8px 16px', fontSize: '0.8rem' }}
              >
                {loading ? 'Consultando...' : 'Consultar Profundidad & Fechas'}
              </button>
            </div>
          )}

          {activeTab === 'asociaciones' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '180px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Identificador Numérico del Evento:
                </label>
                <input
                  type="number"
                  placeholder="Ej: 101, 102..."
                  value={eventIdParam}
                  onChange={(e) => setEventIdParam(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                />
              </div>
              <button
                className="btn-primary"
                onClick={handleRunAsociaciones}
                disabled={loading}
                style={{ alignSelf: 'flex-end', padding: '8px 16px', fontSize: '0.8rem' }}
              >
                {loading ? 'Consultando...' : 'Consultar Candidatos y Referencia'}
              </button>
            </div>
          )}

          {activeTab === 'acceso_costoso' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '180px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Límite de Profundidad L (opcional, por defecto parámetro de escenario):
                </label>
                <input
                  type="number"
                  placeholder="Dejar en blanco para usar L del escenario"
                  value={limiteLParam}
                  onChange={(e) => setLimiteLParam(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                />
              </div>
              <button
                className="btn-primary"
                onClick={handleRunAccesoCostoso}
                disabled={loading}
                style={{ alignSelf: 'flex-end', padding: '8px 16px', fontSize: '0.8rem' }}
              >
                {loading ? 'Consultando...' : 'Consultar Nodos con Acceso Costoso'}
              </button>
            </div>
          )}

          {activeTab === 'benchmark' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '120px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Tamaño de muestra N:
                </label>
                <input
                  type="number"
                  min="10"
                  max="500"
                  value={benchmarkN}
                  onChange={(e) => setBenchmarkN(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: '160px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Patrón de llegada:
                </label>
                <select
                  value={benchmarkPatron}
                  onChange={(e) => setBenchmarkPatron(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', background: '#FFFFFF' }}
                >
                  <option value="todos">Todos los escenarios (4 comparativas)</option>
                  <option value="ascendente">Ascendente (Peor caso BST O(n))</option>
                  <option value="descendente">Descendente (Peor caso BST O(n))</option>
                  <option value="aleatorio">Aleatorio (Caso promedio)</option>
                  <option value="alternado">Alternado (Zig-Zag)</option>
                </select>
              </div>
              <button
                className="btn-primary"
                onClick={handleRunBenchmark}
                disabled={loading}
                style={{ alignSelf: 'flex-end', padding: '8px 16px', fontSize: '0.8rem' }}
              >
                {loading ? 'Ejecutando...' : 'Ejecutar Benchmark'}
              </button>
            </div>
          )}
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: '8px',
            backgroundColor: '#FEE2E2', border: '1px solid #FECACA',
            color: '#991B1B', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Justificación de Poda y Nodos Examinados (Mandatorio Sección 11) */}
        {resultData && resultData.nodos_examinados !== undefined && (
          <div style={{
            padding: '10px 14px', borderRadius: '8px',
            backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} style={{ color: '#2563EB' }} />
              <div>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1E40AF' }}>
                  Nodos Examinados: {resultData.nodos_examinados} de {resultData.total_nodos_arbol ?? '-'}
                </span>
                <p style={{ fontSize: '0.74rem', color: '#3B82F6', marginTop: '2px' }}>
                  {resultData.justificacion_poda || 'Recorrido optimizado con poda de ramas que no satisfacen la consulta.'}
                </p>
              </div>
            </div>
            {resultData.total_encontrados !== undefined && (
              <span style={{
                fontSize: '0.74rem', fontWeight: 700, padding: '3px 9px',
                borderRadius: '6px', backgroundColor: '#DBEAFE', color: '#1E40AF'
              }}>
                Encontrados: {resultData.total_encontrados}
              </span>
            )}
          </div>
        )}

        {/* Tabla de Resultados para Consultas 1 a 3 y 5 */}
        {resultData && Array.isArray(resultData.eventos) && (
          <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
              <thead style={{ backgroundColor: '#F8FAFC', position: 'sticky', top: 0, zIndex: 5 }}>
                <tr>
                  <th style={{ padding: '8px 10px', borderBottom: '1px solid #E2E8F0' }}>ID</th>
                  <th style={{ padding: '8px 10px', borderBottom: '1px solid #E2E8F0' }}>Clave K=(P,M,I)</th>
                  <th style={{ padding: '8px 10px', borderBottom: '1px solid #E2E8F0' }}>Magnitud</th>
                  <th style={{ padding: '8px 10px', borderBottom: '1px solid #E2E8F0' }}>Profundidad</th>
                  <th style={{ padding: '8px 10px', borderBottom: '1px solid #E2E8F0' }}>Estado / Revisión</th>
                  {activeTab === 'acceso_costoso' && (
                    <>
                      <th style={{ padding: '8px 10px', borderBottom: '1px solid #E2E8F0' }}>Prof. Nodo</th>
                      <th style={{ padding: '8px 10px', borderBottom: '1px solid #E2E8F0' }}>Límite L</th>
                      <th style={{ padding: '8px 10px', borderBottom: '1px solid #E2E8F0' }}>Visitas Búsqueda</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {resultData.eventos.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === 'acceso_costoso' ? 8 : 5} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No se encontraron eventos para los criterios especificados.
                    </td>
                  </tr>
                ) : (
                  resultData.eventos.map((ev, idx) => (
                    <tr
                      key={ev.id || idx}
                      onClick={() => onSelectEvent && onSelectEvent(ev)}
                      style={{ cursor: 'pointer', borderBottom: '1px solid #F1F5F9', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}
                    >
                      <td style={{ padding: '8px 10px', fontWeight: 700 }}>SIS-{String(ev.id).padStart(6, '0')}</td>
                      <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)' }}>
                        K=({ev.prioridad}, {ev.magnitud?.toFixed ? ev.magnitud.toFixed(1) : ev.magnitud}, #{ev.id})
                      </td>
                      <td style={{ padding: '8px 10px' }}>{ev.magnitud?.toFixed ? ev.magnitud.toFixed(1) : ev.magnitud} M</td>
                      <td style={{ padding: '8px 10px' }}>{ev.profundidad} km</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{
                          fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px',
                          backgroundColor: ev.revisado ? '#ECFDF5' : '#FEF3C7',
                          color: ev.revisado ? '#065F46' : '#92400E',
                          fontWeight: 700
                        }}>
                          {ev.revisado ? 'Revisado' : 'Pendiente'}
                        </span>
                      </td>
                      {activeTab === 'acceso_costoso' && (
                        <>
                          <td style={{ padding: '8px 10px', fontWeight: 700, color: '#C2410C' }}>{ev.profundidad_nodo}</td>
                          <td style={{ padding: '8px 10px' }}>{ev.limite_l}</td>
                          <td style={{ padding: '8px 10px', fontWeight: 800, color: '#EA580C' }}>{ev.visitas_busqueda}</td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Vista Detallada de Consulta 4 (Asociaciones y Réplicas) */}
        {activeTab === 'asociaciones' && resultData && resultData.evento && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Evento Evaluado */}
            <div style={{
              padding: '12px', borderRadius: '8px', backgroundColor: '#F8FAFC',
              border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                  Evento SIS-{String(resultData.evento.id).padStart(6, '0')} (M={resultData.evento.magnitud})
                </span>
                <span style={{
                  marginLeft: '8px', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px',
                  backgroundColor: resultData.evento.es_activo ? '#ECFDF5' : '#F1F5F9',
                  color: resultData.evento.es_activo ? '#065F46' : '#64748B', fontWeight: 700
                }}>
                  {resultData.evento.es_activo ? 'ACTIVO EN ÁRBOL' : 'ARCHIVADO EN HISTÓRICO'}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Referencia Elegida: {resultData.referencia_elegida ? (
                  <strong style={{ color: '#2563EB' }}>SIS-{String(resultData.referencia_elegida.id).padStart(6, '0')}</strong>
                ) : (
                  <em>Sin Asociación</em>
                )}
              </div>
            </div>

            {/* Candidatos a Referencia */}
            <div>
              <h5 style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Candidatos a Referencia (Δt ≤ W={resultData.parametros?.w_horas}h, d ≤ R={resultData.parametros?.r_km}km, M_ref &gt; M):
              </h5>
              <div style={{ maxHeight: '140px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
                {resultData.candidatos?.length === 0 ? (
                  <p style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    No posee eventos candidatos dentro de la ventana espacio-temporal.
                  </p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem' }}>
                    <thead style={{ backgroundColor: '#F8FAFC' }}>
                      <tr>
                        <th style={{ padding: '6px 8px', textAlign: 'left' }}>Candidato</th>
                        <th style={{ padding: '6px 8px', textAlign: 'left' }}>Estado</th>
                        <th style={{ padding: '6px 8px', textAlign: 'left' }}>Magnitud</th>
                        <th style={{ padding: '6px 8px', textAlign: 'left' }}>Distancia (km)</th>
                        <th style={{ padding: '6px 8px', textAlign: 'left' }}>Δt (horas)</th>
                        <th style={{ padding: '6px 8px', textAlign: 'left' }}>Elección</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultData.candidatos.map(c => {
                        const esElegido = resultData.referencia_elegida && resultData.referencia_elegida.id === c.id;
                        return (
                          <tr key={c.id} style={{ backgroundColor: esElegido ? '#EFF6FF' : '#FFFFFF', borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '6px 8px', fontWeight: 700 }}>SIS-{String(c.id).padStart(6, '0')}</td>
                            <td style={{ padding: '6px 8px' }}>
                              <span style={{
                                fontSize: '0.66rem', padding: '1px 5px', borderRadius: '4px',
                                backgroundColor: c.es_activo ? '#ECFDF5' : '#F1F5F9',
                                color: c.es_activo ? '#065F46' : '#64748B', fontWeight: 700
                              }}>
                                {c.es_activo ? 'Activo' : 'Archivado'}
                              </span>
                            </td>
                            <td style={{ padding: '6px 8px' }}>{c.magnitud} M</td>
                            <td style={{ padding: '6px 8px' }}>{c.distancia_km} km</td>
                            <td style={{ padding: '6px 8px' }}>{c.delta_t_horas} h</td>
                            <td style={{ padding: '6px 8px' }}>
                              {esElegido ? (
                                <span style={{ color: '#2563EB', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                  <CheckCircle2 size={12} /> Referencia Principal
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>Candidato</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Réplicas que lo referencian */}
            <div>
              <h5 style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Eventos que utilizan a este sismo como su Referencia Principal ({resultData.eventos_que_lo_referencian?.length || 0}):
              </h5>
              <div style={{ maxHeight: '110px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
                {resultData.eventos_que_lo_referencian?.length === 0 ? (
                  <p style={{ padding: '10px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    Ningún evento posterior se ha asociado a este sismo como réplica.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px' }}>
                    {resultData.eventos_que_lo_referencian.map(r => (
                      <span
                        key={r.id}
                        style={{
                          padding: '3px 8px', borderRadius: '6px', backgroundColor: '#EEF2FF',
                          color: '#4338CA', border: '1px solid #C7D2FE', fontSize: '0.74rem', fontWeight: 700
                        }}
                      >
                        SIS-{String(r.id).padStart(6, '0')} (M={r.magnitud}) [{r.es_activo ? 'Activo' : 'Archivado'}]
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Vista Detallada de Benchmark Comparativo (Sección 11) */}
        {activeTab === 'benchmark' && resultData && resultData.comparativas && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{
              padding: '12px', borderRadius: '8px', backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0', color: '#065F46', fontSize: '0.8rem', lineHeight: '1.4'
            }}>
              <strong>Conclusión Experimental:</strong> {resultData.conclusion || 'El árbol AVL mantiene rigurosamente una altura logarítmica O(log n) garantizando búsquedas en tiempo O(log n) independientemente del orden de inserción de los eventos.'}
            </div>

            <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead style={{ backgroundColor: '#F8FAFC', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Patrón de Inserción</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Nodos N</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Altura AVL</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Altura BST</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Visitas AVL</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Visitas BST</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Ahorro de Acceso</th>
                  </tr>
                </thead>
                <tbody>
                  {resultData.comparativas.map((c, i) => {
                    const ahorro = c.visitas_promedio_bst > 0
                      ? Math.round(((c.visitas_promedio_bst - c.visitas_promedio_avl) / c.visitas_promedio_bst) * 100)
                      : 0;
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 700, textTransform: 'capitalize' }}>
                          {c.patron}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>{c.n_nodos}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 800, color: '#166534' }}>
                          h={c.altura_avl}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 800, color: c.altura_bst > c.altura_avl ? '#991B1B' : '#64748B' }}>
                          h={c.altura_bst}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700 }}>
                          {c.visitas_promedio_avl}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: c.visitas_promedio_bst > c.visitas_promedio_avl ? '#DC2626' : 'inherit' }}>
                          {c.visitas_promedio_bst}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: '6px',
                            backgroundColor: ahorro > 0 ? '#DCFCE7' : '#F1F5F9',
                            color: ahorro > 0 ? '#15803D' : '#64748B',
                            fontWeight: 800
                          }}>
                            {ahorro > 0 ? `+${ahorro}% más rápido` : 'Paritario'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </ModalDialog>
  );
}
