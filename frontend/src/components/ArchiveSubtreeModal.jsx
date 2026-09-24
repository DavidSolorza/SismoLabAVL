import React, { useState, useEffect } from 'react';
import { Scissors, AlertCircle, CheckCircle2, Layers, ArrowRight, ShieldCheck } from 'lucide-react';
import ModalDialog from './ModalDialog';
import { previewArchiveBranch, archiveBranch } from '../services/apiService';

/**
 * ArchiveSubtreeModal - Archivo de Subárboles Completos Elegibles (Sección 10)
 * Evalúa post-orden la elegibilidad estricta de subárboles completos:
 * - Para todo nodo u en S: u.prioridad == 1 y (reloj_simulacion - u.timestamp) > T
 * - Criterio determinista de selección: (-|S|, -profundidad, -id_raiz)
 * Permite previsualizar la decisión algorítmica y ejecutar la poda atómica con soporte Undo en la Pila LIFO.
 */
export default function ArchiveSubtreeModal({
  isOpen,
  onClose,
  onBranchArchived,
  showToast
}) {
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      handlePreview();
    } else {
      setPreviewData(null);
    }
  }, [isOpen]);

  const handlePreview = async () => {
    setLoading(true);
    try {
      const res = await previewArchiveBranch();
      setPreviewData(res.data);
    } catch (err) {
      if (showToast) {
        showToast(err.message || 'Error al previsualizar archivo de subárbol', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteArchive = async () => {
    if (!previewData || !previewData.elegible) return;
    setExecuting(true);
    try {
      const res = await archiveBranch();
      if (showToast) {
        showToast(
          res.message || 'Subárbol podado y trasladado al almacén histórico.',
          'success',
          { title: 'Subárbol Archivado (Sección 10)' }
        );
      }
      if (onBranchArchived) onBranchArchived();
      onClose();
    } catch (err) {
      if (showToast) {
        showToast(err.message || 'Error al archivar subárbol', 'error');
      }
    } finally {
      setExecuting(false);
    }
  };

  if (!isOpen) return null;

  const elegible = previewData?.elegible === true;
  const nodoRaiz = previewData?.nodo_raiz;
  const eventos = previewData?.eventos_a_archivar || [];

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Archivo de Subárboles (Sección 10)"
      subtitle="Poda de Subárboles Completos Elegibles"
      icon={Scissors}
      iconBg="#FEE2E2"
      iconColor="#991B1B"
      position="top-right"
      maxWidth="330px"
    >
      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--text-muted)', fontSize: '0.80rem' }}>
            Evaluando subárboles post-orden en el árbol AVL...
          </div>
        ) : !elegible ? (
          <div style={{
            backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '10px',
            border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#D97706' }}>
              <AlertCircle size={18} />
              <strong style={{ fontSize: '0.82rem' }}>Sin Subárboles Elegibles</strong>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
              {previewData?.mensaje || 'No se encontró ningún subárbol donde TODOS sus nodos tengan Prioridad 1 (Baja) y antigüedad > T horas respecto al reloj de simulación.'}
            </p>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', backgroundColor: '#FFFFFF', padding: '8px', borderRadius: '6px', border: '1px dashed #CBD5E1' }}>
              <strong>Regla Oficial (Sección 10):</strong> Un subárbol S es candidato solo si cada nodo u ∈ S cumple u.prioridad == 1 y (reloj - u.timestamp) &gt; T.
            </div>
          </div>
        ) : (
          <>
            {/* Previsualización del Subárbol Seleccionado */}
            <div style={{ backgroundColor: '#ECFDF5', padding: '12px', borderRadius: '10px', border: '1px solid #A7F3D0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#065F46', marginBottom: '6px' }}>
                <CheckCircle2 size={16} />
                <strong style={{ fontSize: '0.80rem' }}>Subárbol Elegible Encontrado</strong>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#065F46', lineHeight: '1.4' }}>
                {previewData.justificacion}
              </div>
            </div>

            {/* Ficha de Métricas del Subárbol */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px',
              backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0'
            }}>
              <div>
                <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>RAÍZ SUBÁRBOL</span>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                  SIS-{nodoRaiz?.id}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>NODOS (|S|)</span>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {previewData.tamano_subarbol}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>PROFUNDIDAD</span>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Nivel {previewData.profundidad_raiz}
                </div>
              </div>
            </div>

            {/* Lista de Nodos Afectados */}
            <div>
              <span style={{ fontSize: '0.70rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Nodos a Desconectar y Archivar ({eventos.length}):
              </span>
              <div style={{
                maxHeight: '130px', overflowY: 'auto', marginTop: '4px',
                display: 'flex', flexDirection: 'column', gap: '4px'
              }}>
                {eventos.map(ev => (
                  <div key={ev.id} style={{
                    padding: '4px 8px', borderRadius: '5px', backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between',
                    fontSize: '0.70rem'
                  }}>
                    <strong style={{ color: 'var(--accent)' }}>SIS-{String(ev.id).padStart(6, '0')}</strong>
                    <span style={{ color: 'var(--text-secondary)' }}>M{Number(ev.magnitud).toFixed(1)} • P{ev.prioridad}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Aviso de Reversibilidad */}
            <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={13} color="#059669" />
              <span>Operación reversible mediante Deshacer (Pila LIFO).</span>
            </div>

            {/* Botón de Ejecución */}
            <button
              onClick={handleExecuteArchive}
              disabled={executing}
              className="btn-primary"
              style={{
                width: '100%', padding: '8px', fontSize: '0.78rem', justifyContent: 'center',
                backgroundColor: '#DC2626', borderColor: '#B91C1C', color: '#FFFFFF', fontWeight: 800
              }}
            >
              <Scissors size={14} />
              <span>{executing ? 'Podando subárbol...' : 'Confirmar Poda y Archivo'}</span>
            </button>
          </>
        )}

        <button
          onClick={onClose}
          className="btn-secondary"
          style={{ width: '100%', padding: '6px', fontSize: '0.74rem', justifyContent: 'center' }}
        >
          Cerrar
        </button>

      </div>
    </ModalDialog>
  );
}
