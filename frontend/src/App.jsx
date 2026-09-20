import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import MetricsBanner from './components/MetricsBanner';
import AVLVisualizer from './components/AVLVisualizer';
import QuickActions from './components/QuickActions';
import EventList from './components/EventList';
import EventModal from './components/EventModal';
import Toast from './components/Toast';

import {
  fetchMetrics, fetchEvents, fetchTreeHierarchy, createEvent, correctEvent,
  enqueueReport, processNextReport, undoLastAction, archiveBranch, setOperationalMode
} from './services/apiService';

export default function App() {
  const [metrics, setMetrics] = useState(null);
  const [events, setEvents] = useState([]);
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

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

  // Mode Toggle (NORMAL <-> STRESS)
  const handleToggleMode = async () => {
    try {
      const newMode = metrics?.modo_operacional === 'NORMAL' ? 'STRESS' : 'NORMAL';
      await setOperationalMode(newMode);
      showToast(`Modo operacional cambiado a ${newMode}`);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Submit Handler for Create & Correct
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

  // Quick Action Handlers
  const handleUndo = async () => {
    try {
      const res = await undoLastAction();
      showToast(res.message);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleProcessQueue = async () => {
    try {
      const res = await processNextReport();
      showToast(res.message);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleArchiveBranch = async () => {
    try {
      const res = await archiveBranch(3);
      showToast(res.message);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleEnqueueSample = async () => {
    try {
      const sampleId = Math.floor(2000 + Math.random() * 8000);
      const sampleMag = (3.5 + Math.random() * 4.0).toFixed(1);
      const sampleDepth = (5.0 + Math.random() * 40.0).toFixed(1);
      const res = await enqueueReport({
        station_code: 'EST-MANIZALES-01',
        event_id: sampleId,
        magnitud: parseFloat(sampleMag),
        profundidad: parseFloat(sampleDepth),
        latitud: 5.06889,
        longitud: -75.51738,
        zona_poblada: true
      });
      showToast(res.message);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div style={{ maxWidth: '1380px', margin: '0 auto', padding: '24px 16px 40px 16px' }}>
      
      {/* Header Bar */}
      <Header
        currentMode={metrics?.modo_operacional || 'NORMAL'}
        onToggleMode={handleToggleMode}
        onRefresh={loadData}
        loading={loading}
      />

      {/* Metrics Banner */}
      <MetricsBanner metrics={metrics} />

      {/* Quick Action Toolbar */}
      <QuickActions
        onOpenCreateModal={() => { setEditEvent(null); setIsModalOpen(true); }}
        onUndo={handleUndo}
        onProcessQueue={handleProcessQueue}
        onArchiveBranch={handleArchiveBranch}
        onEnqueueSample={handleEnqueueSample}
      />

      {/* Interactive Hierarchical AVL Tree Visualizer */}
      <AVLVisualizer
        treeData={treeData}
        onSelectEvent={(ev) => {
          setEditEvent(ev);
          setIsModalOpen(true);
        }}
      />

      {/* Seismic Events Table */}
      <EventList
        events={events}
        onEditEvent={(ev) => {
          setEditEvent(ev);
          setIsModalOpen(true);
        }}
      />

      {/* Modal Dialog */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditEvent(null); }}
        onSubmit={handleModalSubmit}
        editEvent={editEvent}
      />

      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

    </div>
  );
}
