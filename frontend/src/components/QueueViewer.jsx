import React, { useState } from 'react';
import { ArrowRight, Play, ArrowDownToLine, Radio, Clock, CheckCircle2 } from 'lucide-react';

export default function QueueViewer({
  onEnqueueSample,
  onEnqueueTestBurst,
  onProcessNext,
  onProcessBatch,
  queueItems = [],
  loading = false,
  lastStepReport = null
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      
      {/* Botones de Control de la Cola FIFO */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        <button
          className="btn-secondary"
          onClick={onEnqueueSample}
          disabled={loading || isProcessing}
          style={{ padding: '6px 8px', fontSize: '0.74rem', justifyContent: 'center' }}
          title="Encolar reporte telemétrico sintético individual"
        >
          <Radio size={13} style={{ color: '#D97706' }} />
          <span>+ Encolar 1</span>
        </button>

        {onEnqueueTestBurst && (
          <button
            className="btn-secondary"
            onClick={onEnqueueTestBurst}
            disabled={loading || isProcessing}
            style={{ padding: '6px 8px', fontSize: '0.74rem', justifyContent: 'center', borderColor: '#C7D2FE', backgroundColor: '#EEF2FF' }}
            title="Encolar ráfaga de prueba mixta (5 reportes: altas y correcciones de varias estaciones)"
          >
            <Radio size={13} style={{ color: '#4F46E5' }} />
            <span style={{ color: '#4338CA', fontWeight: 700 }}>+ Ráfaga (5)</span>
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        <button
          className="btn-secondary"
          onClick={onProcessNext}
          disabled={loading || isProcessing || queueItems.length === 0}
          style={{ padding: '6px 8px', fontSize: '0.74rem', justifyContent: 'center', borderColor: 'var(--accent-border)' }}
          title="Desencolar 1 reporte e insertarlo en el árbol (reporte paso a paso)"
        >
          <ArrowDownToLine size={13} style={{ color: 'var(--accent)' }} />
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Paso a Paso</span>
        </button>

        <button
          className="btn-primary"
          onClick={handleBatchClick}
          disabled={loading || isProcessing || queueItems.length === 0}
          style={{ padding: '6px 8px', fontSize: '0.74rem', justifyContent: 'center', fontWeight: 700 }}
          title="Procesar ráfaga telemétrica completa"
        >
          <Play size={13} />
          <span>{isProcessing ? 'Procesando...' : `Todo (${queueItems.length})`}</span>
        </button>
      </div>

      {/* Informe Paso a Paso: Estación, Event ID, Revisión, Decisión y Rotaciones (Sección 8) */}
      {lastStepReport && (
        <div style={{
          backgroundColor: '#F8FAFC', padding: '8px 10px', borderRadius: '8px',
          border: '1px solid #E2E8F0', fontSize: '0.70rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontWeight: 800, color: 'var(--text-secondary)' }}>Último Paso Procesado:</span>
            <span style={{
              fontSize: '0.62rem', fontWeight: 800, padding: '1px 5px', borderRadius: '4px',
              backgroundColor: lastStepReport.rotaciones_producidas > 0 ? '#FEF3C7' : '#DCFCE7',
              color: lastStepReport.rotaciones_producidas > 0 ? '#92400E' : '#166534'
            }}>
              {lastStepReport.rotaciones_producidas ?? 0} Rotaciones
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px', color: 'var(--text-secondary)' }}>
            <div><strong>Estación:</strong> {lastStepReport.estacion || 'N/A'}</div>
            <div><strong>Evento:</strong> SIS-{lastStepReport.event_id || 'N/A'}</div>
            <div><strong>Revisión:</strong> Rev {lastStepReport.revision || 1}</div>
            <div><strong>Decisión:</strong> <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{lastStepReport.decision || 'PROCESADO'}</span></div>
          </div>
        </div>
      )}

      {/* Lista de Elementos en Cola (Vertical u Horizontal Compacta) */}
      <div style={{
        marginTop: '4px',
        maxHeight: '260px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px'
      }}>
        {queueItems.length === 0 ? (
          <div style={{
            padding: '20px 10px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.76rem',
            backgroundColor: '#F8FAFC',
            borderRadius: '8px',
            border: '1px dashed var(--border-subtle)'
          }}>
            Cola vacía. Haz clic en "<strong>+ Encolar</strong>" para agregar reportes.
          </div>
        ) : (
          queueItems.map((item, idx) => (
            <div
              key={item.event_id || idx}
              className="glass-panel"
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.76rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontSize: '0.64rem', fontWeight: 800, padding: '1px 5px',
                  borderRadius: '4px', backgroundColor: '#F1F5F9', color: 'var(--text-secondary)'
                }}>
                  #{idx + 1}
                </span>
                <strong style={{ color: 'var(--accent)', fontSize: '0.8rem' }}>SIS-{item.event_id}</strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {(item.station_code || 'CALDAS').replace('EST-', '')}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontSize: '0.66rem', padding: '1px 6px', borderRadius: '4px',
                  backgroundColor: 'var(--p2-bg)', color: 'var(--p2-text)', fontWeight: 800
                }}>
                  {item.magnitud?.toFixed(1)} M
                </span>
                <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                  {item.profundidad} km
                </span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}

