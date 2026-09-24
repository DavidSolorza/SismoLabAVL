import React, { useState, useEffect } from 'react';
import {
  Download, Upload, Save, FolderOpen, Trash2, RotateCcw,
  FileJson, Layers, Cpu, AlertCircle, CheckCircle2, ShieldAlert
} from 'lucide-react';
import ModalDialog from './ModalDialog';
import {
  exportScenario,
  importScenarioInsertions,
  importScenarioTopology,
  listNamedVersions,
  saveNamedVersion,
  restoreNamedVersion,
  deleteNamedVersion
} from '../services/apiService';

export default function PersistenceModal({ isOpen, onClose, onStateRestored, showToast }) {
  const [activeTab, setActiveTab] = useState('versiones');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Versiones persistentes
  const [versions, setVersions] = useState([]);
  const [newVersionName, setNewVersionName] = useState('');
  const [newVersionDesc, setNewVersionDesc] = useState('');

  // Importar / Exportar JSON
  const [jsonContent, setJsonContent] = useState('');
  const [permitirDesbalance, setPermitirDesbalance] = useState(true);
  const [incluirTopologia, setIncluirTopologia] = useState(true);

  const loadVersions = async () => {
    try {
      const list = await listNamedVersions();
      setVersions(list);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadVersions();
      setError(null);
    }
  }, [isOpen]);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await exportScenario(incluirTopologia);
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sismolab_escenario_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (showToast) showToast('Escenario exportado exitosamente a archivo JSON', 'success');
    } catch (err) {
      setError(err.message || 'Error al exportar escenario');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonContent(event.target.result);
    };
    reader.readAsText(file);
  };

  const handleImportInsertions = async () => {
    if (!jsonContent.trim()) {
      setError('Pegue o cargue un archivo JSON válido.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const parsed = JSON.parse(jsonContent);
      const res = await importScenarioInsertions(parsed);
      if (showToast) showToast(res.message || 'Escenario reconstruido por inserciones', 'success');
      if (onStateRestored) onStateRestored();
      onClose();
    } catch (err) {
      setError(err.message || 'Error en formato JSON o validación de inserciones');
    } finally {
      setLoading(false);
    }
  };

  const handleImportTopology = async () => {
    if (!jsonContent.trim()) {
      setError('Pegue o cargue un archivo JSON con la topología explícita.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const parsed = JSON.parse(jsonContent);
      const res = await importScenarioTopology(parsed, permitirDesbalance);
      if (showToast) showToast(res.message || 'Topología de árbol AVL reconstruida', 'success');
      if (onStateRestored) onStateRestored();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al validar o reconstruir topología explícita');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVersion = async (e) => {
    e.preventDefault();
    if (!newVersionName.trim()) {
      setError('Ingrese un nombre para la versión persistente.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await saveNamedVersion(newVersionName.trim(), newVersionDesc.trim());
      if (showToast) showToast(res.message || 'Versión guardada exitosamente en disco', 'success');
      setNewVersionName('');
      setNewVersionDesc('');
      loadVersions();
    } catch (err) {
      setError(err.message || 'Error al guardar versión');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreVersion = async (nombre) => {
    setLoading(true);
    setError(null);
    try {
      const res = await restoreNamedVersion(nombre);
      if (showToast) showToast(res.message || `Versión '${nombre}' restaurada`, 'success');
      if (onStateRestored) onStateRestored();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al restaurar versión');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVersion = async (nombre) => {
    if (!window.confirm(`¿Eliminar definitivamente la versión '${nombre}' de disco?`)) return;
    try {
      await deleteNamedVersion(nombre);
      if (showToast) showToast(`Versión '${nombre}' eliminada`, 'success');
      loadVersions();
    } catch (err) {
      setError(err.message || 'Error al eliminar versión');
    }
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Persistencia, Topología y Versiones"
      subtitle="Exportación completa, importación por inserción/topología y snapshots persistentes (Secciones 12 y 13)"
      icon={FolderOpen}
      maxWidth="780px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Pestañas */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '4px' }}>
          <button
            onClick={() => { setActiveTab('versiones'); setError(null); }}
            style={{
              padding: '7px 14px', borderRadius: '8px',
              border: activeTab === 'versiones' ? '1px solid var(--accent)' : '1px solid transparent',
              backgroundColor: activeTab === 'versiones' ? 'var(--accent-light)' : 'transparent',
              color: activeTab === 'versiones' ? 'var(--accent-text)' : 'var(--text-secondary)',
              fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <Save size={15} />
            <span>Versiones Persistentes (Sección 13)</span>
          </button>

          <button
            onClick={() => { setActiveTab('importar'); setError(null); }}
            style={{
              padding: '7px 14px', borderRadius: '8px',
              border: activeTab === 'importar' ? '1px solid var(--accent)' : '1px solid transparent',
              backgroundColor: activeTab === 'importar' ? 'var(--accent-light)' : 'transparent',
              color: activeTab === 'importar' ? 'var(--accent-text)' : 'var(--text-secondary)',
              fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <Upload size={15} />
            <span>Importar Escenario / Topología</span>
          </button>

          <button
            onClick={() => { setActiveTab('exportar'); setError(null); }}
            style={{
              padding: '7px 14px', borderRadius: '8px',
              border: activeTab === 'exportar' ? '1px solid var(--accent)' : '1px solid transparent',
              backgroundColor: activeTab === 'exportar' ? 'var(--accent-light)' : 'transparent',
              color: activeTab === 'exportar' ? 'var(--accent-text)' : 'var(--text-secondary)',
              fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <Download size={15} />
            <span>Exportar Escenario</span>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: '8px',
            backgroundColor: '#FEE2E2', border: '1px solid #FECACA',
            color: '#991B1B', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: Versiones Persistentes (Sección 13) */}
        {activeTab === 'versiones' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Form Guardar Nueva Versión */}
            <form onSubmit={handleSaveVersion} style={{
              padding: '12px', borderRadius: '8px', backgroundColor: '#F8FAFC',
              border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px'
            }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                Guardar Nuevo Snapshot con Nombre (Inmutable en Disco):
              </span>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Nombre de la versión (ej. 'Pre-crisis-2026', 'Caso-A')..."
                  value={newVersionName}
                  onChange={(e) => setNewVersionName(e.target.value)}
                  style={{ flex: 1, minWidth: '200px', padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                />
                <input
                  type="text"
                  placeholder="Descripción opcional..."
                  value={newVersionDesc}
                  onChange={(e) => setNewVersionDesc(e.target.value)}
                  style={{ flex: 1.5, minWidth: '220px', padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{ padding: '7px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Save size={14} />
                  <span>{loading ? 'Guardando...' : 'Guardar Versión'}</span>
                </button>
              </div>
            </form>

            {/* Listado de Versiones Guardadas */}
            <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
              {versions.length === 0 ? (
                <p style={{ padding: '24px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  No hay versiones persistentes guardadas en disco aún. Guarde una para crear un punto de restauración.
                </p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead style={{ backgroundColor: '#F8FAFC', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Nombre</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Fecha / Hora</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Eventos</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Altura AVL</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Descripción</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {versions.map(v => (
                      <tr key={v.nombre} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {v.nombre}
                        </td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                          {new Date(v.timestamp).toLocaleString()}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#ECFDF5', color: '#065F46', fontWeight: 700 }}>
                            {v.eventos_activos ?? '-'}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 800 }}>
                          h={v.altura_avl ?? '-'}
                        </td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>
                          {v.descripcion || '-'}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              className="btn-secondary"
                              onClick={() => handleRestoreVersion(v.nombre)}
                              disabled={loading}
                              title="Restaurar este estado (apilando el estado previo en la Pila LIFO de Deshacer)"
                              style={{ padding: '4px 8px', fontSize: '0.72rem', color: '#1D4ED8', borderColor: '#BFDBFE' }}
                            >
                              <RotateCcw size={12} />
                              <span>Restaurar</span>
                            </button>
                            <button
                              className="btn-secondary"
                              onClick={() => handleDeleteVersion(v.nombre)}
                              title="Eliminar versión"
                              style={{ padding: '4px 6px', fontSize: '0.72rem', color: '#DC2626' }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Importar Escenario / Topología */}
        {activeTab === 'importar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.76rem', cursor: 'pointer' }}>
                  <FileJson size={14} />
                  <span>Cargar Archivo .json</span>
                  <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>O pegue el contenido JSON en el cuadro de texto</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="checkbox"
                  id="chkDesbalance"
                  checked={permitirDesbalance}
                  onChange={(e) => setPermitirDesbalance(e.target.checked)}
                />
                <label htmlFor="chkDesbalance" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  Permitir desbalance en topología (conmuta a Modo Estrés si |FB| &gt; 1)
                </label>
              </div>
            </div>

            <textarea
              rows={8}
              placeholder="Pegue aquí el JSON con datos del escenario o con la clave 'topologia_arbol'..."
              value={jsonContent}
              onChange={(e) => setJsonContent(e.target.value)}
              style={{
                width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1',
                fontFamily: 'var(--font-mono)', fontSize: '0.75rem', backgroundColor: '#F8FAFC'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="btn-secondary"
                onClick={handleImportInsertions}
                disabled={loading}
                title="Inserta uno a uno los eventos en AVL y BST garantizando unicidad de IDs (Sección 12)"
                style={{ padding: '8px 16px', fontSize: '0.78rem', fontWeight: 700 }}
              >
                <Layers size={14} />
                <span>Reconstruir por Inserciones (Secuencial)</span>
              </button>

              <button
                className="btn-primary"
                onClick={handleImportTopology}
                disabled={loading}
                title="Construye la estructura exacta del árbol validando orden BST y punteros (Sección 12)"
                style={{ padding: '8px 16px', fontSize: '0.78rem', fontWeight: 700 }}
              >
                <Cpu size={14} />
                <span>Reconstruir por Topología Explícita</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Exportar Escenario */}
        {activeTab === 'exportar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '10px 0' }}>
            <div style={{
              padding: '14px', borderRadius: '10px', backgroundColor: '#F8FAFC',
              border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px'
            }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Configuración de Exportación Completa del Escenario (Sección 12):
              </span>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Genera un archivo JSON inmaculado que contiene todos los eventos activos, archivados y eliminados, los parámetros de escenario (W, R, L, T), métricas de rotación acumuladas, reloj de simulación y la topología recursiva serializada.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="chkIncTop"
                  checked={incluirTopologia}
                  onChange={(e) => setIncluirTopologia(e.target.checked)}
                />
                <label htmlFor="chkIncTop" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  Incluir estructura jerárquica explícita del árbol AVL (campo 'topologia_arbol')
                </label>
              </div>

              <div style={{ marginTop: '10px', alignSelf: 'flex-start' }}>
                <button
                  className="btn-primary"
                  onClick={handleExport}
                  disabled={loading}
                  style={{ padding: '9px 18px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Download size={16} />
                  <span>{loading ? 'Generando archivo...' : 'Descargar Escenario en JSON'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </ModalDialog>
  );
}
