/**
 * SismoLab AVL - API Integration Service Layer
 * Universidad de Caldas
 *
 * Consume de manera aislada los endpoints RESTful expuestos por el backend en Python (FastAPI).
 * Consumes in an isolated manner the RESTful endpoints exposed by the Python backend (FastAPI).
 */

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

export async function fetchFullDashboardState() {
  const res = await fetch(`${API_BASE}/sistema/estado-completo`);
  if (!res.ok) throw new Error('Error al sincronizar el estado completo del sistema');
  return await res.json();
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
  return data;
}

export async function enqueueReport(reportDTO) {
  const res = await fetch(`${API_BASE}/reportes/encolar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reportDTO)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al encolar reporte'));
  return data;
}

export async function processNextReport() {
  const res = await fetch(`${API_BASE}/reportes/procesar`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al procesar cola FIFO'));
  return data;
}

export async function undoLastAction() {
  const res = await fetch(`${API_BASE}/sistema/deshacer`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al desapilar Pila de Deshacer'));
  return data;
}

export async function archiveBranch(prioridadMinima = 3) {
  const res = await fetch(`${API_BASE}/avl/archivar-rama`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prioridad_minima: prioridadMinima, guardar_json: true })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al podar subárbol AVL'));
  return data;
}

export async function setOperationalMode(mode) {
  const res = await fetch(`${API_BASE}/avl/modo?modo=${mode}`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al cambiar modo operacional'));
  return data;
}

export async function clearAllTree(cargarMuestras = false) {
  const res = await fetch(`${API_BASE}/sistema/limpiar?cargar_muestras=${cargarMuestras}`, {
    method: 'POST'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(parseErrorMessage(data, 'Error al limpiar el árbol'));
  return data;
}
