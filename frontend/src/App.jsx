import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AVLVisualizer from './components/AVLVisualizer';
import EventModal from './components/EventModal';
import ModalDialog from './components/ModalDialog';
import MetricsBanner from './components/MetricsBanner';
import EventList from './components/EventList';
import QueueViewer from './components/QueueViewer';
import PresetsModal from './components/PresetsModal';
import ClockModal from './components/ClockModal';
import EventDetailModal from './components/EventDetailModal';
import ScenarioParamsModal from './components/ScenarioParamsModal';
import ArchiveSubtreeModal from './components/ArchiveSubtreeModal';
import QueriesModal from './components/QueriesModal';
import PersistenceModal from './components/PersistenceModal';
import AuditModal from './components/AuditModal';
import GeographicMapModal from './components/GeographicMapModal';
import StationsModal from './components/StationsModal';
import Toast from './components/Toast';

import {
  BarChart3, Database, Clock, Zap
} from 'lucide-react';

import {
  fetchFullDashboardState, fetchMetrics, fetchEvents, fetchEventById, fetchTreeHierarchy, fetchBstHierarchy,
  createEvent, correctEvent, reviewEvent, deleteEvent, enqueueReport, processNextReport, undoLastAction, archiveBranch,
  setOperationalMode, clearAllTree, setSimulationClock, advanceSimulationClock,
  recoverFromStress, enqueueTestBurst
} from './services/apiService';
import { busService, BUS_EVENTS } from './services/busService';
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
  const [isClockOpen, setIsClockOpen] = useState(false);     // Reloj de Simulación
  const [isParamsOpen, setIsParamsOpen] = useState(false);   // Parámetros del Escenario (W, R, L, T)
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false); // Modal de Archivo de Subárbol
  const [isQueriesOpen, setIsQueriesOpen] = useState(false); // Consultas Especializadas (Sección 11)
  const [isPersistenceOpen, setIsPersistenceOpen] = useState(false); // Persistencia y Versiones (Sección 12-13)
  const [isAuditOpen, setIsAuditOpen] = useState(false); // Auditoría de Estructura e Indicadores (Sección 14)
  const [isGeoMapOpen, setIsGeoMapOpen] = useState(false); // Presentación Geográfica 2D (Sección 15)
  const [isStationsOpen, setIsStationsOpen] = useState(false); // Red Nacional de Estaciones Sísmicas
  const [lastStepReport, setLastStepReport] = useState(null); // Reporte paso a paso con rotaciones
  const [simulationClock, setSimulationClockState] = useState('2026-09-22T12:00:00Z');

  // Estado de Consulta de Ficha Técnica / Node Metrics (Sección 6)
  const [inspectEvent, setInspectEvent] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const showToast = (message, type = 'success', options = {}) => {
    // Si es una operación exitosa de rutina ('success'), no mostrar toast invasivo
    // ya que la UI se actualiza inmediatamente en tiempo real.
    if (type === 'success') {
      return;
    }
    setToast({ message, type, ...options });
  };

  // Carga atómica y optimizada del estado completo mediante el Bus Service y Caché
  const loadData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    try {
      const data = await fetchFullDashboardState(forceRefresh);
      setMetrics(data.metricas);
      setEvents(data.eventos || []);
      setTreeData(data.avl_tree);
      setBstData(data.bst_tree);
      if (data.reloj_simulacion) {
        setSimulationClockState(data.reloj_simulacion);
      }
    } catch (err) {
      showToast(err.message || 'Error al conectar con el backend SismoLab', 'error', {
        title: 'Error de Comunicación'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Suscripción a eventos del Bus de Datos para reactividad instantánea
    const unsubTreeCleared = busService.on(BUS_EVENTS.TREE_CLEARED, () => {
      setTreeData(null);
      setBstData(null);
      setEvents([]);
      setQueueItems([]);
      setMetrics(null);
    });

    const unsubDataUpdated = busService.on(BUS_EVENTS.SYSTEM_DATA_UPDATED, (data) => {
      if (data) {
        if (data.metricas) setMetrics(data.metricas);
        if (data.eventos) setEvents(data.eventos);
        if (data.avl_tree !== undefined) setTreeData(data.avl_tree);
        if (data.bst_tree !== undefined) setBstData(data.bst_tree);
        if (data.reloj_simulacion) setSimulationClockState(data.reloj_simulacion);
      }
    });

    return () => {
      unsubTreeCleared();
      unsubDataUpdated();
    };
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
        x: preset.x,
        y: preset.y,
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

  // Consultar ficha técnica y métricas de nodo en el AVL (Sección 6)
  const handleInspectEvent = async (eventOrId) => {
    try {
      const eventId = typeof eventOrId === 'object' ? eventOrId.id : eventOrId;
      const res = await fetchEventById(eventId);
      setInspectEvent(res);
      setIsDetailOpen(true);
    } catch (err) {
      showToast(err.message, 'error', { title: 'Consulta de Evento' });
    }
  };

  // Eliminación individual de un evento activo (Sección 6)
  const handleDeleteEvent = async (eventId) => {
    try {
      const res = await deleteEvent(eventId);
      showToast(res.message, 'success', { title: 'Evento Eliminado' });
      loadData();
    } catch (err) {
      showToast(err.message, 'error', { title: 'Fallo al Eliminar Evento' });
    }
  };

  // Marcar evento como Revisado (Sección 6)
  const handleReviewEvent = async (eventId) => {
    try {
      const res = await reviewEvent(eventId);
      showToast(res.message, 'success', { title: 'Evento Marcado como Revisado' });
      loadData();
    } catch (err) {
      showToast(err.message, 'error', { title: 'Fallo al Revisar Evento' });
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
      if (res.data) {
        setLastStepReport(res.data);
      }
      showToast(res.message, 'success', { title: 'Paso FIFO Procesado' });
      loadData();
    } catch (err) {
      showToast(err.message, 'warning', { title: 'Cola Vacía' });
    }
  };

  // Encolar ráfaga de prueba mixta (5 reportes)
  const handleEnqueueTestBurst = async () => {
    try {
      const res = await enqueueTestBurst();
      setQueueItems(prev => [...prev, ...(res.reportes || [])]);
      showToast(
        'Ráfaga de 5 reportes mixtos (altas y correcciones) encolada exitosamente.',
        'warning',
        { title: 'Telemetría Mixta Encolada' }
      );
    } catch (err) {
      showToast(err.message || 'Error al encolar ráfaga de prueba', 'error');
    }
  };

  // Recuperar balance total tras modo estrés
  const handleRecoverStress = async () => {
    try {
      const res = await recoverFromStress();
      showToast(
        res.message || 'Árbol AVL balanceado con éxito tras modo estrés.',
        'warning',
        { title: 'Balance AVL Restaurado (Sección 8)' }
      );
      loadData();
    } catch (err) {
      showToast(err.message || 'Error al recuperar balance', 'error');
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
          if (res.data) setLastStepReport(res.data);
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

  // Archivar subárbol elegible (Sección 10)
  const handleArchiveBranch = () => {
    setIsArchiveModalOpen(true);
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
            // Purga absoluta e inmediata de todo el caché en memoria y web storage
            busService.clearAllCache();
            setQueueItems([]);
            setTreeData(null);
            setBstData(null);
            setEvents([]);
            setMetrics(null);
            showToast(
              'Árboles vaciados exitosamente. El caché en memoria ha sido purgado al 100% para máxima fluidez.',
              'success',
              { title: 'Árboles y Caché Reiniciados' }
            );
            loadData(true);
          } catch (err) {
            showToast(err.message, 'error', { title: 'Error al Vaciar' });
          }
        }
      }
    );
  };

  // Control del Reloj de Simulación (Ajuste manual y avance)
  const handleSetClock = async (newIso) => {
    try {
      const res = await setSimulationClock(newIso);
      setSimulationClockState(res.reloj_simulacion);
      showToast(res.message || 'Reloj fijado exitosamente', 'success', { title: 'Reloj de Simulación' });
      loadData();
    } catch (err) {
      showToast(err.message, 'error', { title: 'Fallo al Fijar Reloj' });
    }
  };

  const handleAdvanceClock = async (delta) => {
    try {
      const res = await advanceSimulationClock(delta);
      setSimulationClockState(res.reloj_simulacion);
      showToast(res.message || 'Reloj avanzado exitosamente', 'success', { title: 'Reloj Avanzado' });
      loadData();
    } catch (err) {
      showToast(err.message, 'error', { title: 'Fallo al Avanzar Reloj' });
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
      clock: ['top-left', 'bottom-left', 'top-right', 'bottom-right'],
      eventModal: ['top-right', 'bottom-right', 'top-left', 'bottom-left'],
      presets: ['bottom-right', 'top-right', 'bottom-left', 'top-left'],
      metrics: ['top-left', 'bottom-left', 'top-right', 'bottom-right'],
      events: ['bottom-left', 'top-left', 'bottom-right', 'top-right'],
      queue: ['bottom-left', 'top-left', 'bottom-right', 'top-right']
    };

    const status = {
      clock: isClockOpen,
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
  }, [isModalOpen, isPresetsOpen, isMetricsOpen, isEventsOpen, isQueueOpen, isClockOpen]);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      
      {/* 1. VISUALIZADOR PRINCIPAL: MAPA COMPLETO CON DOCKS PERIMETRALES EN ELIPSE */}
      <AVLVisualizer
        treeData={treeData}
        bstData={bstData}
        onSelectEvent={handleInspectEvent}
        // Triggers de Acciones y Modales
        onOpenCreateModal={() => { setEditEvent(null); setIsModalOpen(true); }}
        onOpenPresetsModal={() => setIsPresetsOpen(true)}
        onOpenMetricsModal={() => setIsMetricsOpen(true)}
        onOpenEventsModal={() => setIsEventsOpen(true)}
        onOpenQueueModal={() => setIsQueueOpen(true)}
        onOpenClockModal={() => setIsClockOpen(true)}
        simulationClock={simulationClock}
        onUndo={handleUndo}
        onArchiveBranch={handleArchiveBranch}
        onClearTree={handleClearTree}
        onToggleMode={handleToggleMode}
        onRecoverStress={handleRecoverStress}
        onOpenParamsModal={() => setIsParamsOpen(true)}
        onOpenQueriesModal={() => setIsQueriesOpen(true)}
        onOpenPersistenceModal={() => setIsPersistenceOpen(true)}
        onOpenAuditModal={() => setIsAuditOpen(true)}
        onOpenGeoMapModal={() => setIsGeoMapOpen(true)}
        onOpenStationsModal={() => setIsStationsOpen(true)}
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
        simulationClock={simulationClock}
        onOpenStationsModal={() => setIsStationsOpen(true)}
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
          onReviewEvent={handleReviewEvent}
          onInspectEvent={handleInspectEvent}
          onDeleteEvent={handleDeleteEvent}
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
          onEnqueueTestBurst={handleEnqueueTestBurst}
          onProcessNext={handleProcessQueue}
          onProcessBatch={handleProcessBatch}
          loading={loading}
          lastStepReport={lastStepReport}
        />
      </ModalDialog>

      {/* 6. Panel Lateral de Reloj de Simulación (UTC) */}
      <ClockModal
        isOpen={isClockOpen}
        onClose={() => setIsClockOpen(false)}
        simulationClock={simulationClock}
        onAdvanceClock={handleAdvanceClock}
        onSetClock={handleSetClock}
        position={modalSlots.positions.clock || 'top-left'}
        maxHeight={modalSlots.getHeight(modalSlots.positions.clock)}
      />

      {/* 7. Modal de Consulta Exhaustiva / Ficha Técnica (Sección 6) */}
      <EventDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        eventDetail={inspectEvent}
        onReviewEvent={handleReviewEvent}
        onDeleteEvent={handleDeleteEvent}
      />

      {/* 8. Modal de Parámetros del Escenario (Secciones 7, 9 & 10) */}
      <ScenarioParamsModal
        isOpen={isParamsOpen}
        onClose={() => setIsParamsOpen(false)}
        onParamsUpdated={loadData}
        showToast={showToast}
      />

      {/* 9. Modal de Archivo de Subárboles Completos (Sección 10) */}
      <ArchiveSubtreeModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        onBranchArchived={loadData}
        showToast={showToast}
      />

      {/* 10. Modal de Consultas Especializadas y Benchmark (Sección 11) */}
      <QueriesModal
        isOpen={isQueriesOpen}
        onClose={() => setIsQueriesOpen(false)}
        onSelectEvent={handleInspectEvent}
        simulationClock={simulationClock}
      />

      {/* 11. Modal de Persistencia, Topología y Versiones (Secciones 12 y 13) */}
      <PersistenceModal
        isOpen={isPersistenceOpen}
        onClose={() => setIsPersistenceOpen(false)}
        onStateRestored={() => loadData(true)}
        showToast={showToast}
      />

      {/* 12. Modal de Auditoría Estructural e Indicadores (Sección 14) */}
      <AuditModal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        showToast={showToast}
      />

      {/* 13. Modal de Presentación Geográfica 2D (Sección 15) */}
      <GeographicMapModal
        isOpen={isGeoMapOpen}
        onClose={() => setIsGeoMapOpen(false)}
        onSelectEvent={handleInspectEvent}
        showToast={showToast}
      />

      {/* 14. Modal de Red Nacional de Estaciones Sísmicas */}
      <StationsModal
        isOpen={isStationsOpen}
        onClose={() => setIsStationsOpen(false)}
        showToast={showToast}
        onStationCreated={() => loadData(true)}
      />

      {/* Notificaciones Flotantes Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />

    </div>
  );
}
