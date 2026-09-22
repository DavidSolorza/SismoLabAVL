import React, { useState } from 'react';
import { ArrowRight, Play, ArrowDownToLine, Radio, ListPlus, CheckCircle2, Clock } from 'lucide-react';

export default function QueueViewer({
  onEnqueueSample,
  onProcessNext,
  onProcessBatch,
  queueItems = [],
  loading = false
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBatchClick = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      if (onProcessBatch) {
        await onProcessBatch();
      } else {
        await onProcessNext();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '20px', backgroundColor: '#FFFFFF' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            padding: '7px', borderRadius: '10px',
            backgroundColor: 'var(--accent-light)',
            color: 'var(--accent)',
            border: '1px solid var(--accent-border)'
          }}>
            <Clock size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Cola FIFO de Ráfagas Telemétricas
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Ingesta secuencial paso a paso (First-In, First-Out) desde estaciones sismológicas hacia el Árbol AVL.
            </p>
          </div>
        </div>

        {/* Controles de Simulación */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn-secondary"
            onClick={onEnqueueSample}
            disabled={loading || isProcessing}
            style={{ padding: '7px 12px', fontSize: '0.82rem' }}
            title="Encolar reporte telemétrico sintético"
          >
            <Radio size={15} style={{ color: '#D97706' }} />
            <span>+ Encolar Reporte</span>
          </button>

          <button
            className="btn-secondary"
            onClick={onProcessNext}
            disabled={loading || isProcessing}
            style={{ padding: '7px 12px', fontSize: '0.82rem', borderColor: 'var(--accent-border)' }}
            title="Desencolar 1 reporte e insertarlo en el árbol"
          >
            <ArrowDownToLine size={15} style={{ color: 'var(--accent)' }} />
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Paso a Paso (Step)</span>
          </button>

          <button
            className="btn-primary"
            onClick={handleBatchClick}
            disabled={loading || isProcessing}
            style={{ padding: '7px 14px', fontSize: '0.82rem' }}
            title="Procesar ráfaga telemétrica"
          >
            <Play size={14} />
            <span>{isProcessing ? 'Procesando...' : 'Procesar Ráfaga'}</span>
          </button>
        </div>
      </div>

      {/* Lista visual de tarjetas en fila FIFO */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        overflowX: 'auto', padding: '8px 4px', minHeight: '68px',
        backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)',
        border: '1px dashed var(--border-subtle)'
      }}>
        {queueItems.length === 0 ? (
          <div style={{ width: '100%', textAlign: 'center', padding: '12px', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
            Bandeja telemétrica limpia. No hay reportes encolados pendientes. Pulsa "<strong>+ Encolar Reporte</strong>" para simular una ráfaga.
          </div>
        ) : (
          queueItems.map((item, idx) => (
            <React.Fragment key={item.event_id || idx}>
              <div style={{
                display: 'flex', flexDirection: 'column',
                padding: '8px 12px', minWidth: '140px',
                backgroundColor: '#FFFFFF', borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-sm)',
                fontSize: '0.8rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <strong style={{ color: 'var(--accent)' }}>SIS-{item.event_id}</strong>
                  <span style={{
                    fontSize: '0.68rem', padding: '1px 6px', borderRadius: '6px',
                    backgroundColor: 'var(--p2-bg)', color: 'var(--p2-text)', fontWeight: 700
                  }}>
                    {item.magnitud} M
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  {item.station_code || 'EST-CALDAS'}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Prof: {item.profundidad} km
                </span>
              </div>

              {idx < queueItems.length - 1 && (
                <ArrowRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              )}
            </React.Fragment>
          ))
        )}
      </div>
    </div>
  );
}
