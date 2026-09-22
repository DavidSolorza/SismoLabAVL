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

  const showToast = (message, type = 'success', options = {}) => {
    setToast({ message, type, ...options });
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
        showToast(fallbackErr.message || 'Error al conectar con el backend SismoLab', 'error', {
          title: 'Error de Comunicación'
        });
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
      if (newMode === 'STRESS') {
        showToast(
          'El modo STRESS suspende temporalmente las rotaciones en inserción para pruebas de estrés bajo alta carga.',
          'warning',
          { title: 'Modo STRESS Activado' }
        );
      } else {
        showToast(
          'El modo NORMAL asegura auto-balanceo logarítmico O(log n) continuo con rotaciones automáticas en cada inserción.',
          'success',
          { title: 'Modo NORMAL Reanudado' }
        );
      }
      loadData();
    } catch (err) {
      showToast(err.message, 'error', { title: 'Fallo al Cambiar Modo' });
    }
  };

  // Enviar formulario de Creación / Corrección
  const handleModalSubmit = async (formData) => {
    try {
      if (formData.isCorrection) {
        const res = await correctEvent(formData.eventId, formData.nuevaMagnitud, formData.nuevaProfundidad, formData.razon);
        showToast(res.message, 'success', { title: 'Corrección Aplicada' });
      } else {
        const res = await createEvent(formData);
        showToast(res.message, 'success', { title: 'Sismo Registrado' });
      }
      setIsModalOpen(false);
      setEditEvent(null);
      loadData();
    } catch (err) {
      showToast(err.message, 'error', { title: 'Error de Transacción' });
    }
  };

  // Inserción directa de sismo predefinido (1 Clic)
  const handleQuickInsertPredefined = async (preset) => {
    try {
      const targetId = getAvailableId(events, preset.id);
      const res = await createEvent({
        id: targetId,
        magnitud: preset.magnitud,
        profundidad: preset.profundidad,
        latitud: preset.latitud,
        longitud: preset.longitud,
        estacion_id: preset.estacion_id,
        zona_poblada: preset.zona_poblada
      });
      showToast(res.message, 'success', { title: `${preset.nombre} Insertado` });
      loadData();
    } catch (err) {
      showToast(err.message, 'error', { title: 'Error al Insertar Plantilla' });
    }
  };

  // Deshacer Operación (Undo LIFO Stack)
  const handleUndo = async () => {
    try {
      const res = await undoLastAction();
      showToast(res.message || 'Última mutación revertida', 'success', { title: 'Deshacer (Pila LIFO)' });
      loadData();
    } catch (err) {
      showToast(err.message || 'No hay operaciones previas en la Pila LIFO para deshacer.', 'warning', {
        title: 'Pila LIFO Vacía'
      });
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

      await enqueueReport(newReport);
      setQueueItems(prev => [...prev, newReport]);
    } catch (err) {
      showToast(err.message, 'error', { title: 'Error de Encolamiento' });
    }
  };

  // Procesar siguiente reporte paso a paso
  const handleProcessQueue = async () => {
    try {
      const res = await processNextReport();
      setQueueItems(prev => prev.slice(1));
      showToast(res.message, 'success', { title: 'Paso FIFO Procesado' });
      loadData();
    } catch (err) {
      showToast(err.message, 'warning', { title: 'Cola Vacía' });
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
      showToast(lastMessage, 'success', { title: 'Ráfaga FIFO Completada' });
      loadData();
    } catch (err) {
      showToast(err.message, 'error', { title: 'Fallo al Procesar Ráfaga' });
    }
  };

  // Archivar rama elegible de baja prioridad
  const handleArchiveBranch = () => {
    showToast(
      '¿Desea buscar y podar la sub-rama elegible de menor prioridad (P3) para compactar y balancear el árbol AVL?',
      'confirm',
      {
        title: '¿Archivar Rama de Baja Prioridad (P3)?',
        confirmText: 'Podar y Archivar P3',
        cancelText: 'Cancelar',
        onConfirm: async () => {
          try {
            const res = await archiveBranch(3);
            showToast(res.message, 'success', { title: 'Rama P3 Archivada' });
            loadData();
          } catch (err) {
            showToast(err.message, 'warning', { title: 'Poda no Realizada' });
          }
        }
      }
    );
  };

  // Limpiar y reiniciar totalmente el árbol AVL
  const handleClearTree = () => {
    showToast(
      '¿Está seguro de que desea vaciar totalmente los árboles AVL y BST? Esta acción eliminará todos los nodos registrados en memoria principal para comenzar pruebas limpias.',
      'confirm',
      {
        title: '¿Vaciar Totalmente el Árbol?',
        confirmText: 'Sí, Vaciar Todo',
        cancelText: 'Cancelar',
        onConfirm: async () => {
          try {
            const res = await clearAllTree(false);
            setQueueItems([]);
            showToast(res.message || 'Árbol vaciado exitosamente (0 nodos)', 'success', {
              title: 'Árboles Reiniciados'
            });
            loadData();
          } catch (err) {
            showToast(err.message, 'error', { title: 'Error al Vaciar' });
          }
        }
      }
    );
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
