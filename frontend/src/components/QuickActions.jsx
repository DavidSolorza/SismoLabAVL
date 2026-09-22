import React, { useState } from 'react';
import { Undo2, ArrowDownToLine, Scissors, PlusCircle, Radio, Zap, Trash2 } from 'lucide-react';
import { PREDEFINED_EVENTS } from '../data/predefinedEvents';

export default function QuickActions({
  onOpenCreateModal,
  onUndo,
  onProcessQueue,
  onArchiveBranch,
  onEnqueueSample,
  onQuickInsertPredefined,
  onClearTree
}) {
  const [selectedPresetId, setSelectedPresetId] = useState('');

  const handleSelectPreset = (e) => {
    const val = e.target.value;
    if (!val) return;
    const preset = PREDEFINED_EVENTS.find(p => String(p.id) === String(val));
    if (preset && onQuickInsertPredefined) {
      onQuickInsertPredefined(preset);
      setSelectedPresetId('');
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '14px 20px', marginBottom: '20px', backgroundColor: '#FFFFFF' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        
        {/* Lado Izquierdo: Creación e Ingesta Telemétrica */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={onOpenCreateModal} title="Registrar un nuevo evento sísmico en el árbol AVL">
            <PlusCircle size={18} />
            <span>Crear Evento Sísmico</span>
          </button>

          {/* Menú Rápido de Sismos Predefinidos en 1 Clic */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            backgroundColor: '#F8FAFC', padding: '6px 10px',
            borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-border)'
          }}>
            <Zap size={16} style={{ color: 'var(--accent)' }} />
            <select
              value={selectedPresetId}
              onChange={handleSelectPreset}
              title="Seleccione un sismo del catálogo para insertarlo instantáneamente en el AVL"
              style={{
                border: 'none', background: 'transparent', fontSize: '0.82rem',
                color: 'var(--text-primary)', outline: 'none', cursor: 'pointer',
                fontWeight: 600, maxWidth: '240px'
              }}
            >
              <option value="">⚡ Insertar Predefinido (1 Clic)...</option>
              {PREDEFINED_EVENTS.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nombre} (M{p.magnitud}, P{p.prioridadEsperada})
                </option>
              ))}
            </select>
          </div>

          <button className="btn-secondary" onClick={onEnqueueSample} title="Simular recepción telemétrica de estación y agregar a la Cola FIFO">
            <Radio size={17} style={{ color: '#D97706' }} />
            <span>Encolar Telemetría (FIFO)</span>
          </button>

          <button className="btn-secondary" onClick={onProcessQueue} title="Desencolar el siguiente reporte e insertarlo en el árbol AVL">
            <ArrowDownToLine size={17} style={{ color: '#059669' }} />
            <span>Procesar Siguiente (Paso a Paso)</span>
          </button>
        </div>

        {/* Lado Derecho: Pila LIFO (Undo) y Poda de Ramas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn-secondary"
            onClick={onUndo}
            title="Deshacer la última operación transaccional (Pila LIFO de Undo)"
            style={{ borderColor: 'var(--p1-border)' }}
          >
            <Undo2 size={17} style={{ color: 'var(--p1-text)' }} />
            <span style={{ color: 'var(--p1-text)', fontWeight: 600 }}>Deshacer (Undo LIFO)</span>
          </button>

          <button
            className="btn-secondary"
            onClick={onArchiveBranch}
            title="Podar subárboles completos de baja prioridad (P=3) y trasladarlos al almacén histórico"
          >
            <Scissors size={17} style={{ color: 'var(--accent)' }} />
            <span>Archivar / Podar Rama</span>
          </button>

          <button
            className="btn-secondary"
            onClick={onClearTree}
            title="Vaciar totalmente el árbol AVL, BST y telemetría para reiniciar pruebas desde cero"
            style={{ borderColor: 'var(--p1-border)', backgroundColor: '#FFF5F5' }}
          >
            <Trash2 size={17} style={{ color: 'var(--coral-soft)' }} />
            <span style={{ color: 'var(--coral-soft)', fontWeight: 600 }}>Limpiar Árbol Total</span>
          </button>
        </div>

      </div>
    </div>
  );
}
