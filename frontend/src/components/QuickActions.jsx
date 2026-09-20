import React from 'react';
import { Undo2, ArrowDownToLine, Scissors, PlusCircle, Radio } from 'lucide-react';

export default function QuickActions({ onOpenCreateModal, onUndo, onProcessQueue, onArchiveBranch, onEnqueueSample }) {
  return (
    <div className="glass-panel" style={{ padding: '18px 24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        
        {/* Left Side: Create Event & Ingest Telemetry */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={onOpenCreateModal}>
            <PlusCircle size={18} />
            <span>Crear Evento Sísmico</span>
          </button>

          <button className="btn-secondary" onClick={onEnqueueSample} title="Simular recepción telemétrica">
            <Radio size={18} color="var(--amber)" />
            <span>Encolar Telemetría</span>
          </button>

          <button className="btn-secondary" onClick={onProcessQueue} title="Desencolar y procesar reporte FIFO">
            <ArrowDownToLine size={18} color="#34D399" />
            <span>Procesar Cola FIFO</span>
          </button>
        </div>

        {/* Right Side: Undo LIFO Stack & Archive Subtree */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={onUndo} title="Desapilar última acción (Undo Stack LIFO)">
            <Undo2 size={18} color="var(--coral)" />
            <span>Deshacer Acción (LIFO)</span>
          </button>

          <button className="btn-secondary" onClick={onArchiveBranch} title="Podar subárboles AVL de baja prioridad (P=3)">
            <Scissors size={18} color="var(--yellow-warm)" />
            <span>Archivar / Podar Rama</span>
          </button>
        </div>

      </div>
    </div>
  );
}
