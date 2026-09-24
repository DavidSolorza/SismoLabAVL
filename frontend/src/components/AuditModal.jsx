import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, AlertTriangle, RefreshCw, Layers, CheckCircle2,
  ListOrdered, GitBranch, RotateCw, Trash2, Cpu, Info, ChevronRight,
  Sparkles, HelpCircle, Activity
} from 'lucide-react';
import ModalDialog from './ModalDialog';
import {
  auditTreeStructure,
  fetchAuditIndicators,
  resetRotationCounters,
  fetchTreeHierarchy
} from '../services/apiService';

export default function AuditModal({ isOpen, onClose, showToast }) {
  const [loading, setLoading] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [indicators, setIndicators] = useState(null);
  const [treeHierarchy, setTreeHierarchy] = useState(null);
  const [activeTab, setActiveTab] = useState('jerarquia'); // 'jerarquia' | 'recorridos' | 'invariantes' | 'rotaciones' | 'explicacion'
  const [selectedTraversal, setSelectedTraversal] = useState('inorden');

  const loadData = async () => {
    setLoading(true);
    try {
      const [auditRes, indRes, treeRes] = await Promise.all([
        auditTreeStructure(),
        fetchAuditIndicators(),
        fetchTreeHierarchy().catch(() => null)
      ]);
      setAuditResult(auditRes);
      setIndicators(indRes);
      setTreeHierarchy(treeRes);
    } catch (err) {
      console.error(err);
      if (showToast) showToast(err.message || 'Error al cargar auditoría del árbol', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleResetCounters = async () => {
    if (!window.confirm('¿Reiniciar a cero todos los contadores de rotaciones (LL, RR, LR, RL y giros elementales)?')) return;
    setLoading(true);
    try {
      const res = await resetRotationCounters();
      if (showToast) showToast(res.message || 'Contadores de rotación reiniciados', 'success');
      loadData();
    } catch (err) {
      if (showToast) showToast(err.message || 'Error al reiniciar contadores', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Normalización segura de datos de la API
  const auditData = auditResult?.data || auditResult || {};
  const isValido = auditData.valido ?? auditData.es_avl_valido ?? true;
  const cumpleBst = auditData.orden_bst_valido ?? true;
  const punterosOk = auditData.punteros_reciprocos_validos ?? true;
  const alturasOk = auditData.alturas_consistentes ?? true;
  const fbOk = auditData.factores_balance_validos ?? true;
  const anomalias = [
    ...(auditData.errores_orden || []),
    ...(auditData.errores_punteros || []),
    ...(auditData.errores_alturas_fb || []),
    ...(auditData.anomalias || [])
  ];

  const avlStats = indicators?.indicadores_avl || {};
  const rot = avlStats.desglose_rotaciones || indicators?.desglose_rotaciones || {
    casos_ll: 0, casos_rr: 0, casos_lr: 0, casos_rl: 0,
    giros_simples_izq: 0, giros_simples_der: 0, total_rotaciones: 0
  };

  const traversals = {
    inorden: { label: 'Inorden (Ascendente por Clave K)', data: indicators?.recorridos?.inorden || [] },
    preorden: { label: 'Preorden (Raíz - Izq - Der)', data: indicators?.recorridos?.preorden || [] },
    postorden: { label: 'Postorden (Izq - Der - Raíz)', data: indicators?.recorridos?.postorden || [] },
    por_niveles: { label: 'Por Niveles (BFS)', data: indicators?.recorridos?.por_niveles || [] }
  };

  // Renderizador recursivo del Árbol Jerárquico Auditado
  const renderAuditTreeNode = (node, depth = 0, relation = 'RAÍZ') => {
    if (!node || !node.valor) return null;
    const ev = node.valor;
    const fb = node.factor_balanceo ?? 0;
    const h = node.altura ?? 0;
    const isBalanced = Math.abs(fb) <= 1;
    const isLeaf = !node.hijo_izquierdo && !node.hijo_derecho;

    return (
      <div key={ev.id} style={{ marginLeft: depth > 0 ? '20px' : '0px', marginTop: '6px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 10px',
          borderRadius: '8px',
          backgroundColor: '#FFFFFF',
          border: `1px solid ${isBalanced ? '#E2E8F0' : '#FECACA'}`,
          boxShadow: 'var(--shadow-xs)'
        }}>
          {/* Relación con el padre */}
          <span style={{
            fontSize: '0.64rem',
            fontWeight: 800,
            padding: '2px 5px',
            borderRadius: '4px',
            backgroundColor: relation === 'RAÍZ' ? '#FEF3C7' : (relation.includes('MENOR') ? '#EFF6FF' : '#F5F3FF'),
            color: relation === 'RAÍZ' ? '#92400E' : (relation.includes('MENOR') ? '#1D4ED8' : '#6D28D9')
          }}>
            {relation}
          </span>

          {/* ID y Clave K */}
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.78rem', color: 'var(--accent)' }}>
            {ev.formatted_id || `SIS-${String(ev.id).padStart(6, '0')}`}
          </span>

          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            backgroundColor: '#F1F5F9',
            padding: '2px 6px',
            borderRadius: '4px',
            color: 'var(--text-secondary)'
          }}>
            K=(P:{ev.prioridad}, M:{ev.magnitud}, I:{ev.id})
          </span>

          {/* Altura y Factor de Balance */}
          <span style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            color: '#334155'
          }}>
            h={h}
          </span>

          <span style={{
            fontSize: '0.68rem',
            fontWeight: 800,
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: isBalanced ? '#ECFDF5' : '#FEE2E2',
            color: isBalanced ? '#065F46' : '#991B1B',
            border: `1px solid ${isBalanced ? '#A7F3D0' : '#FECACA'}`
          }}>
            FB={fb} {isBalanced ? '✓' : '⚠️ Desbalance'}
          </span>

          {isLeaf && (
            <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              (Nodo Hoja)
            </span>
          )}
        </div>

        {/* Subárbol Izquierdo y Derecho */}
        {(node.hijo_izquierdo || node.hijo_derecho) && (
          <div style={{
            borderLeft: '2px dashed #CBD5E1',
            marginLeft: '12px',
            paddingLeft: '6px',
            marginTop: '4px'
          }}>
            {node.hijo_izquierdo ? (
              renderAuditTreeNode(node.hijo_izquierdo, depth + 1, 'IZQ (<)')
            ) : (
              <div style={{ marginLeft: '20px', fontSize: '0.68rem', color: 'var(--text-muted)', padding: '2px 0' }}>
                ↳ Hijo Izq: <em>null</em>
              </div>
            )}
            {node.hijo_derecho ? (
              renderAuditTreeNode(node.hijo_derecho, depth + 1, 'DER (>)')
            ) : (
              <div style={{ marginLeft: '20px', fontSize: '0.68rem', color: 'var(--text-muted)', padding: '2px 0' }}>
                ↳ Hijo Der: <em>null</em>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Auditoría Estructural e Indicadores AVL"
      subtitle="Verificación matemática de invariantes en O(N), 4 recorridos formales y matriz de rotaciones (Sección 14)"
      icon={ShieldCheck}
      iconBg="#DCFCE7"
      iconColor="#15803D"
      maxWidth="860px"
      maxHeight="calc(100vh - 110px)"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Banner Superior de Estado de Integridad */}
        <div style={{
          padding: '12px 14px', borderRadius: '10px',
          backgroundColor: isValido ? '#F0FDF4' : '#FEF2F2',
          border: `1px solid ${isValido ? '#BBF7D0' : '#FECACA'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isValido ? (
              <CheckCircle2 size={24} style={{ color: '#16A34A', flexShrink: 0 }} />
            ) : (
              <AlertTriangle size={24} style={{ color: '#DC2626', flexShrink: 0 }} />
            )}
            <div>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: isValido ? '#166534' : '#991B1B' }}>
                {isValido ? 'Estructura AVL 100% Íntegra y Conforme al Pliego Oficial' : 'Anomalías Estructurales Detectadas'}
              </h4>
              <p style={{ fontSize: '0.74rem', color: isValido ? '#15803D' : '#B91C1C', marginTop: '1px' }}>
                {auditData.reporte || 'Verificación recursiva de cotas de ancestros, reciprocidad de punteros y cálculo exacto de alturas.'}
              </p>
            </div>
          </div>

          <button
            className="btn-secondary"
            onClick={loadData}
            disabled={loading}
            style={{ padding: '6px 12px', fontSize: '0.76rem' }}
            title="Ejecutar reauditoría completa del árbol"
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            <span>Reauditar Ahora</span>
          </button>
        </div>

        {/* Pestañas de Navegación del Panel de Auditoría */}
        <div style={{
          display: 'flex',
          gap: '4px',
          backgroundColor: '#F1F5F9',
          padding: '4px',
          borderRadius: '8px',
          flexWrap: 'wrap'
        }}>
          {[
            { id: 'jerarquia', label: 'Estructura Jerárquica del Árbol', icon: GitBranch },
            { id: 'recorridos', label: 'Los 4 Recorridos Formales', icon: ListOrdered },
            { id: 'invariantes', label: 'Checklist de Invariantes (5)', icon: ShieldCheck },
            { id: 'rotaciones', label: 'Matriz de Rotaciones', icon: RotateCw },
            { id: 'explicacion', label: '¿Qué hace la Auditoría?', icon: HelpCircle }
          ].map(tab => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 11px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.74rem',
                  fontWeight: isSel ? 800 : 600,
                  backgroundColor: isSel ? '#FFFFFF' : 'transparent',
                  color: isSel ? 'var(--accent)' : 'var(--text-secondary)',
                  boxShadow: isSel ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* PESTAÑA 1: ESTRUCTURA JERÁRQUICA COMPLETA DEL ÁRBOL                       */}
        {/* ========================================================================= */}
        {activeTab === 'jerarquia' && (
          <div style={{
            padding: '14px', borderRadius: '10px',
            backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <h5 style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Árbol AVL en Memoria (Nodos, Claves, Alturas y Factores de Balance)
                </h5>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Cada nodo muestra su Clave K=(P, M, I), Altura h, y Factor de Balance FB = h_izq - h_der.
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', fontSize: '0.72rem' }}>
                <span style={{ padding: '2px 8px', borderRadius: '5px', backgroundColor: '#EFF6FF', color: '#1D4ED8', fontWeight: 700 }}>
                  Total Nodos: {avlStats.total_nodos ?? (treeHierarchy ? 'Activo' : 0)}
                </span>
                <span style={{ padding: '2px 8px', borderRadius: '5px', backgroundColor: '#F0FDF4', color: '#15803D', fontWeight: 700 }}>
                  Altura Máx: h={avlStats.altura ?? 0}
                </span>
              </div>
            </div>

            <div style={{
              maxHeight: '340px', overflowY: 'auto',
              padding: '12px', borderRadius: '8px',
              backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0'
            }}>
              {treeHierarchy && treeHierarchy.valor ? (
                renderAuditTreeNode(treeHierarchy, 0, 'RAÍZ')
              ) : (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  El árbol AVL está actualmente vacío (0 nodos). Inserte sismos predefinidos o manuales para auditar.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 2: LOS 4 RECORRIDOS FORMALES                                      */}
        {/* ========================================================================= */}
        {activeTab === 'recorridos' && (
          <div style={{
            padding: '14px', borderRadius: '10px',
            backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)',
            display: 'flex', flexDirection: 'column', gap: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h5 style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {traversals[selectedTraversal].label}
                </h5>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Total elementos en el recorrido: <strong>{traversals[selectedTraversal].data.length}</strong>
                </span>
              </div>

              {/* Botones de Selección de Recorrido */}
              <div style={{ display: 'inline-flex', gap: '4px', backgroundColor: '#E2E8F0', padding: '3px', borderRadius: '8px' }}>
                {Object.keys(traversals).map(tKey => (
                  <button
                    key={tKey}
                    onClick={() => setSelectedTraversal(tKey)}
                    style={{
                      padding: '4px 9px', borderRadius: '6px', border: 'none',
                      backgroundColor: selectedTraversal === tKey ? '#FFFFFF' : 'transparent',
                      color: selectedTraversal === tKey ? 'var(--accent)' : 'var(--text-secondary)',
                      fontWeight: selectedTraversal === tKey ? 800 : 600,
                      fontSize: '0.72rem', cursor: 'pointer'
                    }}
                  >
                    {tKey.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              maxHeight: '320px', overflowY: 'auto',
              padding: '10px', backgroundColor: '#FFFFFF',
              borderRadius: '8px', border: '1px solid #CBD5E1',
              display: 'flex', flexDirection: 'column', gap: '6px'
            }}>
              {traversals[selectedTraversal].data.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  Árbol vacío. No hay nodos para recorrer.
                </div>
              ) : (
                traversals[selectedTraversal].data.map((item, idx) => {
                  const ev = typeof item === 'object' ? item : { id: item, formatted_id: `SIS-${item}`, prioridad: 1, magnitud: 0 };
                  const pBadge = ev.prioridad === 3 ? '#FEE2E2' : (ev.prioridad === 2 ? '#FEF3C7' : '#ECFDF5');
                  const pText = ev.prioridad === 3 ? '#991B1B' : (ev.prioridad === 2 ? '#92400E' : '#065F46');
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '6px 10px', borderRadius: '6px',
                        backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0',
                        fontSize: '0.74rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 900, color: '#2563EB', fontFamily: 'var(--font-mono)', minWidth: '24px' }}>
                          #{idx + 1}
                        </span>
                        <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                          {ev.formatted_id || `SIS-${String(ev.id).padStart(6, '0')}`}
                        </span>
                        <span style={{
                          fontSize: '0.68rem', fontWeight: 800, padding: '1px 6px',
                          borderRadius: '4px', backgroundColor: pBadge, color: pText
                        }}>
                          P{ev.prioridad}
                        </span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                          M={Number(ev.magnitud).toFixed(1)}
                        </span>
                        {ev.profundidad !== undefined && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                            Prof: {ev.profundidad} km
                          </span>
                        )}
                        {ev.estacion_id && (
                          <span style={{ color: '#0284C7', fontSize: '0.7rem', fontWeight: 600 }}>
                            {ev.estacion_id}
                          </span>
                        )}
                      </div>

                      <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                        K=({ev.prioridad}, {ev.magnitud}, #{ev.id})
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 3: CHECKLIST DE LAS 5 INVARIANTES AUDITADAS                       */}
        {/* ========================================================================= */}
        {activeTab === 'invariantes' && (
          <div style={{
            padding: '14px', borderRadius: '10px',
            backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)',
            display: 'flex', flexDirection: 'column', gap: '10px'
          }}>
            <h5 style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Evaluación Formal de Invariantes Matemáticas del Árbol AVL
            </h5>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
              <div style={{
                padding: '10px', borderRadius: '8px',
                backgroundColor: '#FFFFFF', border: `1px solid ${cumpleBst ? '#BBF7D0' : '#FECACA'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.78rem', color: cumpleBst ? '#166534' : '#991B1B' }}>
                  <span>{cumpleBst ? '✓' : '✗'}</span>
                  <span>1. Orden Global BST con Cotas de Ancestros</span>
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.3 }}>
                  Todo nodo satisface K_min &lt; K_nodo &lt; K_max heredando límites de la raíz a las hojas.
                </p>
              </div>

              <div style={{
                padding: '10px', borderRadius: '8px',
                backgroundColor: '#FFFFFF', border: `1px solid ${punterosOk ? '#BBF7D0' : '#FECACA'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.78rem', color: punterosOk ? '#166534' : '#991B1B' }}>
                  <span>{punterosOk ? '✓' : '✗'}</span>
                  <span>2. Reciprocidad de Punteros</span>
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.3 }}>
                  Si N es hijo de P, entonces N.padre == P; y para la raíz raíz.padre == None.
                </p>
              </div>

              <div style={{
                padding: '10px', borderRadius: '8px',
                backgroundColor: '#FFFFFF', border: `1px solid ${alturasOk ? '#BBF7D0' : '#FECACA'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.78rem', color: alturasOk ? '#166534' : '#991B1B' }}>
                  <span>{alturasOk ? '✓' : '✗'}</span>
                  <span>3. Alturas Recalculadas Exactas</span>
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.3 }}>
                  Convención oficial del pliego: vacío=-1, hoja=0, altura(nodo) = 1 + max(h_izq, h_der).
                </p>
              </div>

              <div style={{
                padding: '10px', borderRadius: '8px',
                backgroundColor: '#FFFFFF', border: `1px solid ${fbOk ? '#BBF7D0' : '#FECACA'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.78rem', color: fbOk ? '#166534' : '#991B1B' }}>
                  <span>{fbOk ? '✓' : '✗'}</span>
                  <span>4. Factores de Balance FB in [-1, 1]</span>
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.3 }}>
                  En Modo Normal: FB = h_izq - h_der in &#123;-1, 0, 1&#125;. Sin desviaciones críticas.
                </p>
              </div>
            </div>

            {anomalias.length > 0 && (
              <div style={{ padding: '10px', backgroundColor: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECACA' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#991B1B' }}>Detalle de Anomalías Detectadas:</span>
                <ul style={{ margin: '6px 0 0 16px', padding: 0, fontSize: '0.72rem', color: '#B91C1C' }}>
                  {anomalias.map((err, i) => (
                    <li key={i}>{typeof err === 'object' ? (err.error || JSON.stringify(err)) : err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 4: MATRIZ DE ROTACIONES (SECCIÓN 14)                              */}
        {/* ========================================================================= */}
        {activeTab === 'rotaciones' && (
          <div style={{
            padding: '14px', borderRadius: '10px',
            backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h5 style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Matriz Oficial de Rotaciones y Giros Elementales
                </h5>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Un caso doble (LR o RL) cuenta como una rotación doble y dos giros elementales simples.
                </span>
              </div>
              <button
                className="btn-secondary"
                onClick={handleResetCounters}
                disabled={loading}
                style={{ padding: '5px 10px', fontSize: '0.72rem', color: '#B91C1C', borderColor: '#FECACA' }}
                title="Reiniciar contadores a 0 para nuevas pruebas de inserción"
              >
                <Trash2 size={12} />
                <span>Resetear Contadores</span>
              </button>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
              gap: '10px'
            }}>
              <div style={{ padding: '12px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Casos LL (Simple Izq)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#2563EB', marginTop: '2px' }}>{rot.casos_ll ?? 0}</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Casos RR (Simple Der)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#2563EB', marginTop: '2px' }}>{rot.casos_rr ?? 0}</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Casos LR (Doble Izq-Der)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#7C3AED', marginTop: '2px' }}>{rot.casos_lr ?? 0}</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Casos RL (Doble Der-Izq)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#7C3AED', marginTop: '2px' }}>{rot.casos_rl ?? 0}</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Giros Simples Izq</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#059669', marginTop: '2px' }}>{rot.giros_simples_izq ?? 0}</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Giros Simples Der</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#059669', marginTop: '2px' }}>{rot.giros_simples_der ?? 0}</div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 5: EXPLICACIÓN COMPLETA DE LA AUDITORÍA                           */}
        {/* ========================================================================= */}
        {activeTab === 'explicacion' && (
          <div style={{
            padding: '14px', borderRadius: '10px',
            backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)',
            maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px'
          }}>
            <h5 style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={16} style={{ color: 'var(--accent)' }} />
              ¿Qué hace y qué evalúa exactamente la Auditoría Estructural (Sección 14)?
            </h5>

            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>1. Orden de Búsqueda Binaria Global (BST Invariant) en O(N):</strong><br />
                Verifica que cada nodo sea estrictamente mayor que la cota mínima y menor que la cota máxima que hereda de todos sus ancestros:
                <code style={{ display: 'block', padding: '4px 8px', backgroundColor: '#FFFFFF', borderRadius: '4px', marginTop: '2px', border: '1px solid #E2E8F0' }}>
                  K_min &lt; K_nodo &lt; K_max donde K = (P, M, I)
                </code>
                No se limita a comparar con el padre inmediato, garantizando que ningún nodo haya quedado desubicado en el árbol completo.
              </div>

              <div>
                <strong style={{ color: 'var(--text-primary)' }}>2. Consistencia y Reciprocidad de Punteros:</strong><br />
                Comprueba bidireccionalmente que si el nodo padre apunta a un hijo (izquierdo o derecho), el hijo apunte exactamente a dicho padre:
                <code style={{ display: 'block', padding: '4px 8px', backgroundColor: '#FFFFFF', borderRadius: '4px', marginTop: '2px', border: '1px solid #E2E8F0' }}>
                  hijo.padre == nodo actual  &&  raíz.padre == None
                </code>
              </div>

              <div>
                <strong style={{ color: 'var(--text-primary)' }}>3. Recálculo Matemático de Alturas:</strong><br />
                Aplica la convención oficial: árbol vacío = -1, nodo hoja = 0, y para cualquier nodo interno:
                <code style={{ display: 'block', padding: '4px 8px', backgroundColor: '#FFFFFF', borderRadius: '4px', marginTop: '2px', border: '1px solid #E2E8F0' }}>
                  altura(nodo) = 1 + max(altura_izq, altura_der)
                </code>
              </div>

              <div>
                <strong style={{ color: 'var(--text-primary)' }}>4. Factor de Balance (FB) y Rotaciones:</strong><br />
                Calcula FB = h_izq - h_der. En Modo Normal exige |FB| &le; 1. Si ocurre un desbalance temporal (Modo Estrés), lo registra sin romper la auditoría hasta que se ejecute la recuperación.
              </div>

              <div>
                <strong style={{ color: 'var(--text-primary)' }}>5. Generación de los 4 Recorridos Formales:</strong><br />
                Genera las 4 secuencias canónicas del árbol: <strong>Inorden</strong> (entrega el catálogo ordenado de menor a mayor K), <strong>Preorden</strong> (visita raíz antes que hijos, útil para clonar o serializar), <strong>Postorden</strong> (visita hijos antes que raíz, ideal para podas o borrados) y <strong>Por Niveles / BFS</strong> (visita capa por capa horizontalmente).
              </div>
            </div>
          </div>
        )}

      </div>
    </ModalDialog>
  );
}
