import React from 'react';
import {
  X, AlertTriangle, CheckCircle2, MapPin, Clock, Radio,
  Activity, Layers, Hash, GitBranch, ArrowDown, ShieldAlert
} from 'lucide-react';

/**
 * EventDetailModal - Modal de Consulta Exhaustiva de Evento Sísmico (Sección 6)
 * Muestra el estado en catálogo (Activo, Archivado, Eliminado) y, si está activo,
 * las métricas físicas y estructurales completas del nodo en el Árbol AVL.
 */
export default function EventDetailModal({ isOpen, onClose, eventDetail, onReviewEvent, onDeleteEvent }) {
  if (!isOpen || !eventDetail) return null;

  const ev = eventDetail.data || eventDetail;
  const estadoCatalogo = eventDetail.estado_catalogo || (ev.status ?? 'ACTIVO');
  const nodo = ev.nodo_avl || {};
  const p = ev.prioridad ?? 1;

  const badgeBg = p === 3 ? '#FEE2E2' : (p === 2 ? '#FEF3C7' : '#ECFDF5');
  const badgeColor = p === 3 ? '#991B1B' : (p === 2 ? '#92400E' : '#065F46');
  const etiquetaP = p === 3 ? 'Alta (3)' : (p === 2 ? 'Media (2)' : 'Baja (1)');
  const estaPendiente = (ev.estado_atencion || 'Pendiente') === 'Pendiente';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '14px', width: '100%',
        maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 45px rgba(0, 0, 0, 0.18)',
        border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column'
      }}>
        
        {/* Cabecera */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #F1F5F9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: '#F8FAFC'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="var(--accent)" />
            <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Ficha Técnica: {ev.formatted_id || `SIS-${String(ev.id || 0).padStart(6, '0')}`}
            </h3>
            <span style={{
              fontSize: '0.68rem', fontWeight: 800, padding: '2px 7px', borderRadius: '6px',
              backgroundColor: estadoCatalogo === 'ACTIVO' ? '#DCFCE7' : (estadoCatalogo === 'ARCHIVADO' ? '#FEF3C7' : '#FEE2E2'),
              color: estadoCatalogo === 'ACTIVO' ? '#166534' : (estadoCatalogo === 'ARCHIVADO' ? '#92400E' : '#991B1B')
            }}>
              {estadoCatalogo}
            </span>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Contenido */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Bloque 1: Clave K y Prioridad */}
          <div style={{
            backgroundColor: '#F8FAFC', padding: '12px 14px', borderRadius: '10px',
            border: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px'
          }}>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>CLAVE K=(P, M, I)</div>
              <div style={{ fontSize: '0.90rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                ({ev.composite_key?.P ?? p}, {Number(ev.composite_key?.M ?? ev.magnitud).toFixed(1)}, {ev.id})
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>PRIORIDAD (SECCIÓN 4)</div>
              <div style={{
                display: 'inline-block', fontSize: '0.74rem', fontWeight: 800, padding: '2px 6px',
                borderRadius: '5px', backgroundColor: badgeBg, color: badgeColor, marginTop: '2px'
              }}>
                {etiquetaP}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>ESTADO DE ATENCIÓN</div>
              <div style={{
                display: 'inline-block', fontSize: '0.74rem', fontWeight: 800, padding: '2px 6px',
                borderRadius: '5px', marginTop: '2px',
                backgroundColor: estaPendiente ? '#FEF3C7' : '#E0E7FF',
                color: estaPendiente ? '#B45309' : '#3730A3'
              }}>
                {ev.estado_atencion || 'Pendiente'} (Rev {ev.revision || 1})
              </div>
            </div>
          </div>

          {/* Bloque 2: Parámetros Físicos y Cartografía */}
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.80rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              Parámetros Sísmicos y Geometría Cartesiana
            </h4>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px',
              backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0'
            }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Magnitud:</span>
                <span style={{ marginLeft: '6px', fontWeight: 800, color: 'var(--text-primary)' }}>{Number(ev.magnitud).toFixed(1)} M</span>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Profundidad (H):</span>
                <span style={{ marginLeft: '6px', fontWeight: 800, color: 'var(--text-primary)' }}>{ev.profundidad} km</span>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Plano Cartesiano [0, 1000]:</span>
                <span style={{ marginLeft: '6px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  ({ev.x ?? ev.coordenadas?.x ?? 0}, {ev.y ?? ev.coordenadas?.y ?? 0}) km
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Zona Habitada:</span>
                <span style={{ marginLeft: '6px', fontWeight: 700, color: ev.zona_poblada ? '#991B1B' : 'var(--text-muted)' }}>
                  {ev.zona_poblada ? 'Poblada' : 'No Poblada'}
                </span>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Ocurrencia UTC:</span>
                <span style={{ marginLeft: '6px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {ev.timestamp || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Bloque 3: Procedencia y Múltiples Estaciones */}
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.80rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              Procedencia y Estaciones Reportantes (Sección 3 & 6)
            </h4>
            <div style={{
              backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '10px',
              border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '6px'
            }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                <strong>Estación emisora original:</strong> {ev.estacion_id}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                <strong>Estaciones con reportes aceptados:</strong>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {(ev.estaciones_reportantes || [ev.estacion_id]).map(st => (
                  <span key={st} style={{
                    fontSize: '0.70rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                    backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE'
                  }}>
                    {st}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Bloque 4: Asociaciones y Réplicas (Sección 7) */}
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.80rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              Asociación de Réplica y Candidatos (Sección 7)
            </h4>
            <div style={{
              backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '10px',
              border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px'
            }}>
              {ev.es_replica ? (
                <div style={{
                  padding: '8px 10px', borderRadius: '6px', backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <GitBranch size={16} color="#1D4ED8" />
                  <div style={{ fontSize: '0.74rem', color: '#1E40AF' }}>
                    <strong>Asociado como réplica de:</strong> SIS-{String(ev.evento_referencia_id).padStart(6, '0')}
                    <div style={{ fontSize: '0.66rem', color: '#3B82F6', marginTop: '2px' }}>
                      Criterio determinista aplicado: (-magnitud, menor distancia, menor Δt, menor ID).
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                  <strong>Estado:</strong> Evento principal o independiente (sin asociación de réplica).
                </div>
              )}

              {/* Lista de Candidatos a Referencia */}
              {ev.candidatos_referencia && ev.candidatos_referencia.length > 0 ? (
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
                    CANDIDATOS A REFERENCIA EVALUADOS ({ev.candidatos_referencia.length}):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '100px', overflowY: 'auto' }}>
                    {ev.candidatos_referencia.map(c => {
                      const esGanador = c.id === ev.evento_referencia_id;
                      return (
                        <div key={c.id} style={{
                          padding: '4px 8px', borderRadius: '5px',
                          backgroundColor: esGanador ? '#F0FDF4' : '#F8FAFC',
                          border: `1px solid ${esGanador ? '#BBF7D0' : '#E2E8F0'}`,
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          fontSize: '0.68rem'
                        }}>
                          <div>
                            <strong style={{ color: esGanador ? '#166534' : 'var(--text-primary)' }}>
                              SIS-{String(c.id).padStart(6, '0')}
                            </strong>
                            <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
                              M{Number(c.magnitud).toFixed(1)} • {Number(c.distancia_km).toFixed(1)} km • Δt {Number(c.dt_horas).toFixed(1)} h
                            </span>
                          </div>
                          {esGanador && (
                            <span style={{
                              fontSize: '0.62rem', fontWeight: 800, padding: '1px 5px', borderRadius: '4px',
                              backgroundColor: '#DCFCE7', color: '#166534'
                            }}>
                              SELECCIONADO
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Ningún evento previo cumplió simultáneamente: M_A &gt; M_B, t_A &lt; t_B, Δt ≤ W y d ≤ R.
                </div>
              )}
            </div>
          </div>

          {/* Bloque 5: Presupuesto de Acceso y Costo Simulado (Sección 9) */}
          {estadoCatalogo === 'ACTIVO' && (
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.80rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                Presupuesto de Acceso y Costo (Sección 9)
              </h4>
              <div style={{
                backgroundColor: ev.acceso_costoso ? '#FFFBEB' : '#F8FAFC',
                padding: '12px', borderRadius: '10px',
                border: `1px solid ${ev.acceso_costoso ? '#FDE68A' : '#CBD5E1'}`,
                display: 'flex', flexDirection: 'column', gap: '8px'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600 }}>PROFUNDIDAD (d)</div>
                    <div style={{ fontSize: '0.90rem', fontWeight: 800, color: 'var(--accent)' }}>
                      Nivel {nodo?.profundidad_nodo ?? 0}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600 }}>COSTO SIMULADO (d+1)</div>
                    <div style={{ fontSize: '0.90rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {ev.costo_simulado ?? ((nodo?.profundidad_nodo ?? 0) + 1)} lecturas
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600 }}>ESTADO PRESUPUESTO</div>
                    <div style={{
                      fontSize: '0.74rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', display: 'inline-block',
                      backgroundColor: ev.acceso_costoso ? '#FEE2E2' : '#DCFCE7',
                      color: ev.acceso_costoso ? '#991B1B' : '#166534'
                    }}>
                      {ev.acceso_costoso ? '⚡ COSTOSO' : 'ÓPTIMO'}
                    </div>
                  </div>
                </div>

                {ev.acceso_costoso && (
                  <div style={{
                    fontSize: '0.68rem', color: '#92400E', backgroundColor: '#FEF3C7',
                    padding: '6px 8px', borderRadius: '5px', display: 'flex', alignItems: 'center', gap: '6px'
                  }}>
                    <AlertTriangle size={14} color="#D97706" />
                    <span><strong>Atención:</strong> Evento de alta prioridad (P=3) con profundidad &gt; L. Su consulta directa en el árbol requiere más lecturas que el límite presupuestado.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bloque 6: Métricas del Nodo en el Árbol AVL */}
          {estadoCatalogo === 'ACTIVO' && nodo && (
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.80rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                Topología Estructural en el Árbol AVL (Sección 6)
              </h4>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px',
                backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1'
              }}>
                <div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600 }}>PROFUNDIDAD EN ÁRBOL</div>
                  <div style={{ fontSize: '0.90rem', fontWeight: 800, color: 'var(--accent)' }}>
                    Nivel {nodo.profundidad_nodo ?? 0} {nodo.es_raiz ? '(Raíz)' : ''}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600 }}>ALTURA SUBÁRBOL (h)</div>
                  <div style={{ fontSize: '0.90rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {nodo.altura_nodo ?? 0}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600 }}>FACTOR BALANCE (FB)</div>
                  <div style={{
                    fontSize: '0.90rem', fontWeight: 800,
                    color: Math.abs(nodo.factor_balance ?? 0) <= 1 ? '#166534' : '#991B1B'
                  }}>
                    {nodo.factor_balance ?? 0}
                  </div>
                </div>
                <div style={{ gridColumn: 'span 3', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Acceso directo garantizado en tiempo constante <strong>O(1)</strong> mediante la tabla hash <code>self.indice_por_id</code>.
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer con Acciones */}
        <div style={{
          padding: '14px 20px', borderTop: '1px solid #F1F5F9',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px',
          backgroundColor: '#F8FAFC'
        }}>
          {estadoCatalogo === 'ACTIVO' && estaPendiente && onReviewEvent && (
            <button
              onClick={() => {
                onReviewEvent(ev.id);
                onClose();
              }}
              className="btn-secondary"
              style={{
                padding: '6px 12px', fontSize: '0.78rem',
                backgroundColor: '#ECFDF5', color: '#065F46', borderColor: '#A7F3D0',
                display: 'inline-flex', alignItems: 'center', gap: '4px'
              }}
            >
              <CheckCircle2 size={13} />
              <span>Marcar como Revisado</span>
            </button>
          )}

          {estadoCatalogo === 'ACTIVO' && onDeleteEvent && (
            <button
              onClick={() => {
                if (window.confirm(`¿Confirmas la eliminación individual del evento SIS-${String(ev.id).padStart(6, '0')}? Los descendientes permanecerán activos y la acción podrá deshacerse en la Pila LIFO.`)) {
                  onDeleteEvent(ev.id);
                  onClose();
                }
              }}
              className="btn-secondary"
              style={{
                padding: '6px 12px', fontSize: '0.78rem',
                backgroundColor: '#FEF2F2', color: '#991B1B', borderColor: '#FECACA',
                display: 'inline-flex', alignItems: 'center', gap: '4px'
              }}
            >
              <ShieldAlert size={13} />
              <span>Eliminar Individual</span>
            </button>
          )}

          <button onClick={onClose} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.78rem' }}>
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
