import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AVLVisualizer from './components/AVLVisualizer';
import EventModal from './components/EventModal';
import ModalDialog from './components/ModalDialog';
import MetricsBanner from './components/MetricsBanner';
import EventList from './components/EventList';
import QueueViewer from './components/QueueViewer';
import PresetsModal from './components/PresetsModal';
import Toast from './components/Toast';

import {
  BarChart3, Database, Clock, Zap
} from 'lucide-react';

import {
  fetchFullDashboardState, fetchMetrics, fetchEvents, fetchTreeHierarchy, fetchBstHierarchy,
  createEvent, correctEvent, enqueueReport, processNextReport, undoLastAction, archiveBranch,
  setOperationalMode, clearAllTree
} from './services/apiService';
import { getAvailableId } from './data/predefinedEvents';

export default function App() {
  const [metrics, setMetrics] = useState(null);
  const [events, setEvents] = useState([]);
  const [treeData, setTreeData] = useState(null);
  const [bstData, setBstData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Estado de la Cola FIFO en UI
  const [queueItems, setQueueItems] = useState([]);

  // Estados de Modales del Sistema
  const [isModalOpen, setIsModalOpen] = useState(false); // Crear / Corregir Sismo
  const [editEvent, setEditEvent] = useState(null);
  const [isMetricsOpen, setIsMetricsOpen] = useState(false); // Métricas & Benchmark
  const [isEventsOpen, setIsEventsOpen] = useState(false);   // Catálogo de Eventos
  const [isQueueOpen, setIsQueueOpen] = useState(false);     // Cola FIFO de Telemetría
  const [isPresetsOpen, setIsPresetsOpen] = useState(false); // Catálogo Rápido de Sismos

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Carga atómica y optimizada del estado completo en una sola llamada HTTP
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFullDashboardState();
      setMetrics(data.metricas);
      setEvents(data.eventos || []);
      setTreeData(data.avl_tree);
      setBstData(data.bst_tree);
    } catch (err) {
      // Fallback de contingencia a consultas paralelas separadas si el endpoint unificado fallase
      try {
        const [m, evs, tree, bst] = await Promise.all([
          fetchMetrics(),
          fetchEvents(),
          fetchTreeHierarchy(),
          fetchBstHierarchy()
        ]);
        setMetrics(m);
        setEvents(evs);
        setTreeData(tree);
        setBstData(bst);
      } catch (fallbackErr) {
        showToast(fallbackErr.message || 'Error al conectar con el backend SismoLab', 'error');
      }
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
      const itemsToProcess = queueItems.length > 0 ? queueItems.length : 1;
      let lastMessage = 'Cola FIFO procesada';
      for (let i = 0; i < itemsToProcess; i++) {
        try {
          const res = await processNextReport();
          lastMessage = res.message;
        } catch (e) {
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

  // -------------------------------------------------------------------------
  // GESTIÓN DINÁMICA DE LATERALES PARA MODALES MULTI-VENTANA COMPACTOS
  // -------------------------------------------------------------------------
  // Asigna cada modal a un lateral/esquina diferente (top-left, bottom-left,
  // top-right, bottom-right) para que NUNCA se sobrepongan y mantengan el centro
  // siempre 100% visible para interactuar con los árboles AVL y BST.
  const modalSlots = useMemo(() => {
    const preferences = {
      eventModal: ['top-right', 'bottom-right', 'top-left', 'bottom-left'],
      presets: ['bottom-right', 'top-right', 'bottom-left', 'top-left'],
      metrics: ['top-left', 'bottom-left', 'top-right', 'bottom-right'],
      events: ['bottom-left', 'top-left', 'bottom-right', 'top-right'],
      queue: ['bottom-left', 'top-left', 'bottom-right', 'top-right']
    };

    const status = {
      eventModal: isModalOpen,
      presets: isPresetsOpen,
      metrics: isMetricsOpen,
      events: isEventsOpen,
      queue: isQueueOpen
    };

    const assigned = {};
    const occupied = new Set();

    // Asignar slot a cada modal activo según sus preferencias
    const activeKeys = Object.keys(status).filter(k => status[k]);

    for (const key of activeKeys) {
      const prefs = preferences[key] || ['top-right', 'bottom-right', 'top-left', 'bottom-left'];
      const chosen = prefs.find(slot => !occupied.has(slot)) || prefs[0];
      assigned[key] = chosen;
      occupied.add(chosen);
    }

    // Determinar si en un lateral hay 2 modales para dividir altura o dar altura completa
    const slotsInUse = Object.values(assigned);
    const leftCount = slotsInUse.filter(s => s && s.includes('left')).length;
    const rightCount = slotsInUse.filter(s => s && s.includes('right')).length;

    const getHeight = (slot) => {
      if (!slot) return 'calc(100vh - 156px)';
      const isL = slot.includes('left');
      const count = isL ? leftCount : rightCount;
      return count > 1 ? 'calc(50vh - 86px)' : 'calc(100vh - 156px)';
    };

    return {
      positions: assigned,
      getHeight
    };
  }, [isModalOpen, isPresetsOpen, isMetricsOpen, isEventsOpen, isQueueOpen]);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      
      {/* 1. VISUALIZADOR PRINCIPAL: MAPA COMPLETO CON DOCKS PERIMETRALES EN ELIPSE */}
      <AVLVisualizer
        treeData={treeData}
        bstData={bstData}
        onSelectEvent={(ev) => {
          setEditEvent(ev);
          setIsModalOpen(true);
        }}
        // Triggers de Acciones y Modales
        onOpenCreateModal={() => { setEditEvent(null); setIsModalOpen(true); }}
        onOpenPresetsModal={() => setIsPresetsOpen(true)}
        onOpenMetricsModal={() => setIsMetricsOpen(true)}
        onOpenEventsModal={() => setIsEventsOpen(true)}
        onOpenQueueModal={() => setIsQueueOpen(true)}
        onUndo={handleUndo}
        onArchiveBranch={handleArchiveBranch}
        onClearTree={handleClearTree}
        onToggleMode={handleToggleMode}
        onRefresh={loadData}
        currentMode={metrics?.modo_operacional || 'NORMAL'}
        eventsCount={events.length}
        queueCount={queueItems.length}
        loading={loading}
      />

      {/* ========================================================================= */}
      {/* MODALES LATERALES COMPACTOS (LIBERAN EL CENTRO Y SE MULTIPLEXAN EN ESQUINAS) */}
      {/* ========================================================================= */}

      {/* 1. Modal de Creación y Corrección de Sismos */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditEvent(null); }}
        onSubmit={handleModalSubmit}
        editEvent={editEvent}
        events={events}
        position={modalSlots.positions.eventModal || 'top-right'}
        maxHeight={modalSlots.getHeight(modalSlots.positions.eventModal)}
      />

      {/* 2. Modal de Sismos Colombianos Predefinidos (1 Clic) */}
      <PresetsModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        onSelectPreset={handleQuickInsertPredefined}
        position={modalSlots.positions.presets || 'bottom-right'}
        maxHeight={modalSlots.getHeight(modalSlots.positions.presets)}
      />

      {/* 3. Panel Lateral de Métricas y Benchmark AVL vs BST */}
      <ModalDialog
        isOpen={isMetricsOpen}
        onClose={() => setIsMetricsOpen(false)}
        title="Métricas AVL vs BST"
        subtitle="Auditoría de eficiencia y alturas"
        icon={BarChart3}
        position={modalSlots.positions.metrics || 'top-left'}
        maxWidth="350px"
        maxHeight={modalSlots.getHeight(modalSlots.positions.metrics)}
      >
        <MetricsBanner metrics={metrics} />
      </ModalDialog>

      {/* 4. Panel Lateral de Catálogo de Eventos Sísmicos */}
      <ModalDialog
        isOpen={isEventsOpen}
        onClose={() => setIsEventsOpen(false)}
        title="Catálogo de Sismos"
        subtitle="Recorrido In-Order en memoria"
        icon={Database}
        position={modalSlots.positions.events || 'bottom-left'}
        maxWidth="350px"
        maxHeight={modalSlots.getHeight(modalSlots.positions.events)}
      >
        <EventList
          events={events}
          onEditEvent={(ev) => {
            setEditEvent(ev);
            setIsModalOpen(true);
          }}
        />
      </ModalDialog>

      {/* 5. Panel Lateral de Cola FIFO de Telemetría */}
      <ModalDialog
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        title="Cola FIFO Telemétrica"
        subtitle="Buffer de ingesta secuencial"
        icon={Clock}
        position={modalSlots.positions.queue || 'bottom-left'}
        maxWidth="350px"
        maxHeight={modalSlots.getHeight(modalSlots.positions.queue)}
      >
        <QueueViewer
          queueItems={queueItems}
          onEnqueueSample={handleEnqueueSample}
          onProcessNext={handleProcessQueue}
          onProcessBatch={handleProcessBatch}
          loading={loading}
        />
      </ModalDialog>

      {/* Notificaciones Flotantes Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />

    </div>
  );
}
