/**
 * SismoLab AVL - API Integration Service Layer
 * Universidad de Caldas
 *
 * Consume de manera aislada los endpoints RESTful expuestos por el backend en Python (FastAPI).
 * Consumes in an isolated manner the RESTful endpoints exposed by the Python backend (FastAPI).
 */

import { busService, BUS_EVENTS } from './busService';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

function parseErrorMessage(data, fallbackMessage) {
  if (!data) return fallbackMessage;
  if (typeof data.detail === 'string') return data.detail;
  if (data.detail?.message) return data.detail.message;
  if (Array.isArray(data.detail)) {
    return data.detail.map(e => `${e.loc ? e.loc.join('.') : 'campo'}: ${e.msg}`).join('; ');
  }
  if (data.message) return data.message;
  return fallbackMessage;
}

export async function fetchFullDashboardState(forceRefresh = false) {
  return await busService.cache.fetchWithCoalescing(
    'system_full_dashboard',
    async () => {
      const res = await fetch(`${API_BASE}/sistema/estado-completo`);
      if (!res.ok) throw new Error('Error al sincronizar el estado completo del sistema');
      const data = await res.json();
      busService.emit(BUS_EVENTS.SYSTEM_DATA_UPDATED, data);
      return data;
    },
    10000,
    forceRefresh
  );
}

export async function fetchMetrics() {
  const res = await fetch(`${API_BASE}/avl/metricas`);
  if (!res.ok) throw new Error('Error al obtener métricas del AVL');
  const json = await res.json();
  return json.data;
}

export async function fetchEvents() {
  const res = await fetch(`${API_BASE}/eventos`);
  if (!res.ok) throw new Error('Error al cargar la lista de eventos');
  const json = await res.json();
  return json.eventos || [];
}

export async function fetchPredefinedEvents() {
  const res = await fetch(`${API_BASE}/eventos/predefinidos`);
  if (!res.ok) throw new Error('Error al cargar el catálogo de sismos predefinidos');
  const json = await res.json();
  return json.predefinidos || [];
}

export async function fetchTreeHierarchy() {
  const res = await fetch(`${API_BASE}/avl/arbol-jerarquico`);
  if (!res.ok) throw new Error('Error al cargar la jerarquía del árbol AVL');
  const json = await res.json();
  return json.arbol;
}

export async function fetchBstHierarchy() {
  const res = await fetch(`${API_BASE}/bst/arbol-jerarquico`);
  if (!res.ok) throw new Error('Error al cargar la jerarquía del árbol BST');
  const json = await res.json();
  return json.arbol;
}

export async function createEvent(eventDTO) {
  const { isCorrection, ...payload } = eventDTO;
  const res = await fetch(`${API_BASE}/eventos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(parseErrorMessage(data, 'Error al crear evento'));
  }
  busService.invalidateState();
  return data;
}

export async function correctEvent(eventId, nuevaMagnitud, nuevaProfundidad, razon) {
  const query = new URLSearchParams({
    nueva_magnitud: nuevaMagnitud,
    nueva_profundidad: nuevaProfundidad,
    razon: razon || 'Recalibración de sensor'
  }).toString();

  const res = await fetch(`${API_BASE}/eventos/${eventId}/corregir?${query}`, {
    method: 'PUT'
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(parseErrorMessage(data, 'Error al corregir evento'));
  }
  busService.invalidateState();
  return data;
}

export async function reviewEvent(eventId) {
  const res = await fetch(`${API_BASE}/eventos/${eventId}/revisar`, {
    method: 'PUT'
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(parseErrorMessage(data, 'Error al marcar evento como revisado'));
  }
  busService.invalidateState();
  return data;
}

export async function fetchEventById(eventId) {
  const res = await fetch(`${API_BASE}/eventos/${eventId}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(parseErrorMessage(data, `Error al consultar el evento ${eventId}`));
  }
  return data;
}

export async function deleteEvent(eventId) {
  const res = await fetch(`${API_BASE}/eventos/${eventId}`, {
    method: 'DELETE'
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(parseErrorMessage(data, `Error al eliminar el evento ${eventId}`));
  }
  busService.invalidateState();
  return data;
}

export async function fetchZones() {
  const res = await fetch(`${API_BASE}/escenario/zonas`);
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al consultar zonas del escenario'));
  return data.zonas || [];
}

export async function enqueueReport(reportDTO) {
  const res = await fetch(`${API_BASE}/reportes/encolar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reportDTO)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al encolar reporte'));
  busService.emit(BUS_EVENTS.QUEUE_MUTATED, data);
  return data;
}

export async function processNextReport() {
  const res = await fetch(`${API_BASE}/reportes/procesar`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al procesar cola FIFO'));
  busService.invalidateState();
  return data;
}

export async function undoLastAction() {
  const res = await fetch(`${API_BASE}/sistema/deshacer`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al desapilar Pila de Deshacer'));
  busService.invalidateState();
  return data;
}

export async function previewArchiveBranch(tHoras = null) {
  const query = tHoras ? `?t_horas=${tHoras}` : '';
  const res = await fetch(`${API_BASE}/avl/archivar-rama/previsualizar${query}`);
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al previsualizar rama a archivar'));
  return data;
}

export async function archiveBranch(tHoras = null) {
  const res = await fetch(`${API_BASE}/avl/archivar-rama`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ t_horas: tHoras, guardar_json: true })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al podar subárbol AVL'));
  busService.invalidateState();
  return data;
}

export async function recoverFromStress() {
  const res = await fetch(`${API_BASE}/avl/recuperar-estres`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al recuperar balance desde modo estrés'));
  busService.invalidateState();
  return data;
}

export async function fetchScenarioParameters() {
  const res = await fetch(`${API_BASE}/escenario/parametros`);
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al consultar parámetros del escenario'));
  return data.data;
}

export async function updateScenarioParameters(paramsDTO) {
  const res = await fetch(`${API_BASE}/escenario/parametros`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paramsDTO)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al actualizar parámetros del escenario'));
  busService.invalidateState();
  return data;
}

export async function enqueueTestBurst() {
  const res = await fetch(`${API_BASE}/reportes/rafaga-prueba`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al encolar ráfaga de prueba'));
  busService.emit(BUS_EVENTS.QUEUE_MUTATED, data);
  return data;
}

export async function setOperationalMode(mode) {
  const res = await fetch(`${API_BASE}/avl/modo?modo=${mode}`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al cambiar modo operacional'));
  busService.invalidateState();
  return data;
}

export async function clearAllTree(cargarMuestras = false) {
  const res = await fetch(`${API_BASE}/sistema/limpiar?cargar_muestras=${cargarMuestras}`, {
    method: 'POST'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al limpiar el árbol'));
  // Purga absoluta del caché en memoria y almacenamiento local
  busService.clearAllCache();
  return data;
}

// --------------------------------------------------
// RELOJ DE SIMULACIÓN / SIMULATION CLOCK
// --------------------------------------------------

export async function fetchSimulationClock() {
  const res = await fetch(`${API_BASE}/escenario/reloj`);
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al consultar reloj de simulación'));
  return data;
}

export async function setSimulationClock(relojIso) {
  const res = await fetch(`${API_BASE}/escenario/reloj`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reloj: relojIso })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al fijar reloj de simulación'));
  busService.invalidateState();
  return data;
}

export async function advanceSimulationClock({ minutes = 0, hours = 0, days = 0, seconds = 0 }) {
  const res = await fetch(`${API_BASE}/escenario/reloj/avanzar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ minutos: minutes, horas: hours, dias: days, segundos: seconds })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al avanzar reloj de simulación'));
  busService.invalidateState();
  return data;
}

// --------------------------------------------------
// SECCIÓN 11: CONSULTAS ESPECIALIZADAS Y BENCHMARK
// --------------------------------------------------

export async function fetchKPrioritariosPendientes(k = 5) {
  const res = await fetch(`${API_BASE}/consultas/pendientes?k=${k}`);
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al consultar eventos prioritarios'));
  return data;
}

export async function fetchEventosPorMagnitud(mMin = 0.0, mMax = 10.0) {
  const res = await fetch(`${API_BASE}/consultas/magnitud?m_min=${mMin}&m_max=${mMax}`);
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al consultar por rango de magnitud'));
  return data;
}

export async function fetchEventosPorProfundidadYFechas(hMax = 50.0, tInicio, tFin) {
  const query = new URLSearchParams({
    h_max: hMax,
    t_inicio: tInicio || '2026-09-20T00:00:00Z',
    t_fin: tFin || '2026-09-25T23:59:59Z'
  }).toString();
  const res = await fetch(`${API_BASE}/consultas/profundidad-fechas?${query}`);
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al consultar por profundidad y fechas'));
  return data;
}

export async function fetchAsociacionesEvento(eventId) {
  const res = await fetch(`${API_BASE}/consultas/asociaciones/${eventId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, `Error al consultar asociaciones del evento ${eventId}`));
  return data;
}

export async function fetchAccesoCostoso(limiteL = null) {
  const query = limiteL !== null && limiteL !== undefined ? `?limite_l=${limiteL}` : '';
  const res = await fetch(`${API_BASE}/consultas/acceso-costoso${query}`);
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al consultar eventos con acceso costoso'));
  return data;
}

export async function runComparativeBenchmark(tamanoN = 100, patronOrden = 'todos') {
  const res = await fetch(`${API_BASE}/consultas/benchmark-comparativo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tamano_n: tamanoN, patron_orden: patronOrden })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al ejecutar benchmark comparativo'));
  return data;
}

// --------------------------------------------------
// SECCIÓN 12: PERSISTENCIA Y ESCENARIO
// --------------------------------------------------

export async function exportScenario(incluirTopologia = true) {
  const res = await fetch(`${API_BASE}/escenario/exportar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ incluir_topologia: incluirTopologia })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al exportar escenario'));
  return data;
}

export async function importScenarioInsertions(scenarioJson) {
  const res = await fetch(`${API_BASE}/escenario/importar-inserciones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scenarioJson)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al importar escenario por inserciones'));
  busService.invalidateState();
  return data;
}

export async function importScenarioTopology(topologyJson, permitirDesbalance = true) {
  const payload = { ...topologyJson, permitir_desbalance: permitirDesbalance };
  const res = await fetch(`${API_BASE}/escenario/importar-topologia`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al importar topología AVL'));
  busService.invalidateState();
  return data;
}

export async function fetchScenarioGeometry() {
  const res = await fetch(`${API_BASE}/escenario/geometria`);
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al obtener geometría del escenario'));
  return data;
}

// --------------------------------------------------
// GESTIÓN DINÁMICA DE ESTACIONES SÍSMICAS
// --------------------------------------------------

export async function fetchStations() {
  const res = await fetch(`${API_BASE}/estaciones`);
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al cargar las estaciones telemétricas'));
  return data.estaciones || [];
}

export async function createStation(stationData) {
  const res = await fetch(`${API_BASE}/estaciones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(stationData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al registrar la nueva estación telemétrica'));
  busService.invalidateState();
  return data;
}

// --------------------------------------------------
// SECCIÓN 13: VERSIONES PERSISTENTES CON NOMBRE
// --------------------------------------------------

export async function listNamedVersions() {
  const res = await fetch(`${API_BASE}/versiones`);
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al listar versiones persistentes'));
  return data.versiones || [];
}

export async function saveNamedVersion(nombre, descripcion = '') {
  const res = await fetch(`${API_BASE}/versiones/guardar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, descripcion })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al guardar versión persistente'));
  return data;
}

export async function restoreNamedVersion(nombre) {
  const res = await fetch(`${API_BASE}/versiones/${encodeURIComponent(nombre)}/restaurar`, {
    method: 'POST'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, `Error al restaurar versión '${nombre}'`));
  busService.invalidateState();
  return data;
}

export async function deleteNamedVersion(nombre) {
  const res = await fetch(`${API_BASE}/versiones/${encodeURIComponent(nombre)}`, {
    method: 'DELETE'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, `Error al eliminar versión '${nombre}'`));
  return data;
}

// --------------------------------------------------
// SECCIÓN 14: AUDITORÍA E INDICADORES
// --------------------------------------------------

export async function auditTreeStructure() {
  const res = await fetch(`${API_BASE}/auditoria/verificar-estructura`);
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al verificar estructura del árbol'));
  return data;
}

export async function fetchAuditIndicators() {
  const res = await fetch(`${API_BASE}/auditoria/indicadores-completos`);
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al obtener indicadores completos'));
  return data;
}

export async function resetRotationCounters() {
  const res = await fetch(`${API_BASE}/auditoria/resetear-contadores-rotacion`, {
    method: 'POST'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al reiniciar contadores de rotaciones'));
  busService.invalidateState();
  return data;
}

