import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import MetricsBanner from './components/MetricsBanner';
import QuickActions from './components/QuickActions';
import QueueViewer from './components/QueueViewer';
import AVLVisualizer from './components/AVLVisualizer';
import EventList from './components/EventList';
import EventModal from './components/EventModal';
import Toast from './components/Toast';

import {
  fetchMetrics, fetchEvents, fetchTreeHierarchy, createEvent, correctEvent,
  enqueueReport, processNextReport, undoLastAction, archiveBranch, setOperationalMode,
  clearAllTree
} from './services/apiService';
import { PREDEFINED_EVENTS, getAvailableId } from './data/predefinedEvents';

export default function App() {
  const [metrics, setMetrics] = useState(null);
  const [events, setEvents] = useState([]);
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Estado de la Cola FIFO en UI
  const [queueItems, setQueueItems] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editEvent, setEditEvent] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [m, evs, tree] = await Promise.all([
        fetchMetrics(),
        fetchEvents(),
        fetchTreeHierarchy()
      ]);
      setMetrics(m);
      setEvents(evs);
      setTreeData(tree);
    } catch (err) {
      showToast(err.message || 'Error al conectar con el backend SismoLab', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Conmutador de Modo Operacional (NORMAL <-> STRESS)
  const handleToggleMode = async () => {
    try {
      const newMode = metrics?.modo_operacional === 'NORMAL' ? 'STRESS' : 'NORMAL';
      const res = await setOperationalMode(newMode);
      showToast(res.message || `Modo operacional cambiado a ${newMode}`);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Enviar formulario de Creación / Corrección
  const handleModalSubmit = async (formData) => {
    try {
      if (formData.isCorrection) {
        const res = await correctEvent(formData.eventId, formData.nuevaMagnitud, formData.nuevaProfundidad, formData.razon);
        showToast(res.message);
      } else {
        const res = await createEvent(formData);
        showToast(res.message);
      }
      setIsModalOpen(false);
      setEditEvent(null);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Inserción directa de sismo predefinido (1 Clic)
  const handleQuickInsertPredefined = async (preset) => {
    try {
      const targetId = getAvailableId(events, preset.id);
      const payload = {
        id: targetId,
        magnitud: preset.magnitud,
        profundidad: preset.profundidad,
        latitud: preset.latitud,
        longitud: preset.longitud,
        estacion_id: preset.estacion_id,
        zona_poblada: preset.zona_poblada
      };
      const res = await createEvent(payload);
      showToast(res.message || `Sismo SIS-${targetId} (${preset.nombre}) insertado en el AVL`);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Deshacer Operación (Undo LIFO Stack)
  const handleUndo = async () => {
    try {
      const res = await undoLastAction();
      showToast(res.message);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Encolar reporte telemétrico sintético
  const handleEnqueueSample = async () => {
    try {
      const sampleId = Math.floor(2000 + Math.random() * 7999);
      const sampleMag = parseFloat((3.0 + Math.random() * 4.2).toFixed(1));
      const sampleDepth = parseFloat((5.0 + Math.random() * 45.0).toFixed(1));
      const station = ['EST-MANIZALES-01', 'EST-PEREIRA-01', 'EST-ARMENIA-01'][Math.floor(Math.random() * 3)];
      
      const newReport = {
        station_code: station,
        event_id: sampleId,
        magnitud: sampleMag,
        profundidad: sampleDepth,
        latitud: 5.06889,
        longitud: -75.51738,
        zona_poblada: Math.random() > 0.5
      };

      const res = await enqueueReport(newReport);
      setQueueItems(prev => [...prev, newReport]);
      showToast(res.message || `Reporte SIS-${sampleId} encolado en FIFO`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Procesar siguiente reporte paso a paso
  const handleProcessQueue = async () => {
    try {
      const res = await processNextReport();
      setQueueItems(prev => prev.slice(1));
      showToast(res.message);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Procesar ráfaga completa
  const handleProcessBatch = async () => {
    try {
      // Procesar secuencialmente los reportes encolados
      const itemsToProcess = queueItems.length > 0 ? queueItems.length : 1;
      let lastMessage = 'Cola FIFO procesada';
      for (let i = 0; i < itemsToProcess; i++) {
        try {
          const res = await processNextReport();
          lastMessage = res.message;
        } catch (e) {
          // Si la cola en el servidor ya está vacía, detenerse
          break;
        }
      }
      setQueueItems([]);
      showToast(lastMessage);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Archivar rama elegible de baja prioridad
  const handleArchiveBranch = async () => {
    try {
      const res = await archiveBranch(3);
      showToast(res.message);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Limpiar y reiniciar totalmente el árbol AVL
  const handleClearTree = async () => {
    if (window.confirm('¿Está seguro de que desea vaciar totalmente el árbol AVL y reiniciar las pruebas con 0 nodos?')) {
      try {
        const res = await clearAllTree(false);
        setQueueItems([]);
        showToast(res.message || 'Árbol AVL vaciado exitosamente (0 nodos)');
        loadData();
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  };

  return (
    <div style={{ maxWidth: '1380px', margin: '0 auto', padding: '20px 16px 40px 16px' }}>
      
      {/* Header Superior con Switch de Modo */}
      <Header
        currentMode={metrics?.modo_operacional || 'NORMAL'}
        onToggleMode={handleToggleMode}
        onRefresh={loadData}
        loading={loading}
      />

      {/* Tarjetas de Métricas y Comparativa AVL vs BST */}
      <MetricsBanner metrics={metrics} />

      {/* Barra de Acciones Rápidas */}
      <QuickActions
        onOpenCreateModal={() => { setEditEvent(null); setIsModalOpen(true); }}
        onUndo={handleUndo}
        onProcessQueue={handleProcessQueue}
        onArchiveBranch={handleArchiveBranch}
        onEnqueueSample={handleEnqueueSample}
        onQuickInsertPredefined={handleQuickInsertPredefined}
        onClearTree={handleClearTree}
      />

      {/* Visualizador de la Cola FIFO de Telemetría */}
      <QueueViewer
        queueItems={queueItems}
        onEnqueueSample={handleEnqueueSample}
        onProcessNext={handleProcessQueue}
        onProcessBatch={handleProcessBatch}
        loading={loading}
      />

      {/* Visualizador Jerárquico del Árbol AVL */}
      <AVLVisualizer
        treeData={treeData}
        onSelectEvent={(ev) => {
          setEditEvent(ev);
          setIsModalOpen(true);
        }}
      />

      {/* Tabla del Catálogo de Eventos Sísmicos */}
      <EventList
        events={events}
        onEditEvent={(ev) => {
          setEditEvent(ev);
          setIsModalOpen(true);
        }}
      />

      {/* Modal Dialog de Creación y Corrección */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditEvent(null); }}
        onSubmit={handleModalSubmit}
        editEvent={editEvent}
        events={events}
      />

      {/* Notificaciones Flotantes Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />

    </div>
  );
}
