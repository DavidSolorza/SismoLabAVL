# 📡 Especificación de API REST / REST API Specification
## Sistema Backend SismoLab AVL - Universidad de Caldas

---

### 1. Resumen Ejecutivo / Executive Summary

**Español:**
Este documento especifica formalmente los contratos HTTP RESTful para la interacción con los cortes verticales (Vertical Slices) del backend de **SismoLab AVL**. La API expone operaciones para registrar eventos, actualizar correcciones en caliente, procesar colas de telemetría, deshacer acciones y archivar subárboles del AVL.

**English:**
This document formally specifies the HTTP RESTful contracts for interacting with the Vertical Slices of the **SismoLab AVL** backend. The API exposes operations to register events, apply hot corrections, process telemetry queues, undo actions, and archive AVL subtrees.

---

### 2. Endpoints y Cortes Verticales / Endpoints & Vertical Slices

---

#### 2.1. Slice: Crear Evento Sísmico (`POST /api/v1/eventos`)
**Comando:** `CrearEventoCommand`  
**Descripción:** Registra un nuevo evento sísmico en el sistema. Evalúa la pertenencia a zonas pobladas con base en las coordenadas cartesianas $(x, y)$, calcula la prioridad obligatoria de la Sección 4 ($P \in \{1, 2, 3\}$), calcula la clave $K = (P, M, I)$ e inserta el nodo en el árbol AVL (y en el BST de benchmarking).

##### Request Payload (JSON):
```json
{
  "id": 1001,
  "magnitud": 6.5,
  "profundidad": 15.0,
  "x": 450.0,
  "y": 520.0,
  "estacion_id": "EST-CENTRO-01",
  "timestamp": "2026-09-22T17:30:00Z"
}
```

##### Respuestas / Responses:
- **`201 Created`**: Evento creado con éxito.
```json
{
  "success": true,
  "message": "Evento sísmico creado e insertado en AVL con éxito.",
  "data": {
    "id": 1001,
    "composite_key": {
      "P": 3,
      "M": 6.5,
      "I": 1001
    },
    "prioridad": 3,
    "magnitud": 6.5,
    "profundidad": 15.0,
    "x": 450.0,
    "y": 520.0,
    "estaciones_reportantes": ["EST-CENTRO-01"],
    "revision": 1,
    "estado_atencion": "Pendiente",
    "zona_poblada": true,
    "estado": "ACTIVO",
    "avl_height": 1
  }
}
```

- **`400 Bad Request`**: Clave duplicada o valores fuera de rango.
```json
{
  "success": false,
  "error_code": "EVENT_ALREADY_EXISTS",
  "message": "Ya existe un evento sísmico registrado con el identificador 1001."
}
```

- **`422 Unprocessable Entity`**: Error de validación de esquema Pydantic.
```json
{
  "detail": [
    {
      "loc": ["body", "magnitud"],
      "msg": "ensure this value is greater than or equal to -2.0",
      "type": "value_error.number.not_ge"
    }
  ]
}
```

---

#### 2.2. Slice: Corregir Evento Sísmico (`PUT /api/v1/eventos/{id}/corregir`)
**Comando:** `CorregirEventoCommand`  
**Descripción:** Corrige los parámetros de magnitud o profundidad de un sismo. Si la prioridad $P$ cambia, la clave $K$ se re-calcula y el nodo es re-ubicado en el AVL. Incrementa el número de versión/revisión (`revision += 1`) y retorna su estado de atención a `'Pendiente'`.

##### Request Payload (JSON):
```json
{
  "nueva_magnitud": 6.2,
  "nueva_profundidad": 10.0,
  "razon_correccion": "Recalibración de sensor secundario"
}
```

##### Respuestas / Responses:
- **`200 OK`**: Evento re-ubicado correctamente en el AVL.
```json
{
  "success": true,
  "message": "Evento sísmico corregido y re-estructurado en el árbol AVL.",
  "data": {
    "id": 1001,
    "clave_anterior": {"P": 2, "M": 4.8, "I": 1001},
    "nueva_clave": {"P": 3, "M": 6.2, "I": 1001},
    "revision": 2,
    "estado_atencion": "Pendiente",
    "rebalanceo_ejecutado": true
  }
}
```

- **`404 Not Found`**: El evento especificado no existe en el AVL.
```json
{
  "success": false,
  "error_code": "EVENT_NOT_FOUND",
  "message": "No se encontró ningún evento sísmico con el ID 9999."
}
```

---

#### 2.3. Slice: Procesar Cola de Reportes (`POST /api/v1/reportes/procesar`)
**Comando:** `ProcesarReporteCommand`  
**Descripción:** Extrae el siguiente reporte de la Cola FIFO de recepción y lo procesa según la matriz de 5 situaciones de la Sección 6:
- **Situación 1 (Identificador desconocido):** Se registra como nuevo evento sísmico en el AVL con estado `'Pendiente'`. La primera revisión puede ser superior a 1 si el reporte así lo indica.
- **Situación 2 (Revisión mayor que la vigente, $r_{rep} > r_{vig}$):** Se sustituyen los datos del evento, se recalcula la prioridad $P$ y clave $K = (P, M, I)$. Si la clave cambia, se reubica el nodo en el AVL. Incrementa la revisión vigente y pasa a estado `'Pendiente'`. Si estaba archivado, se reactiva en el AVL.
- **Situación 3 (Misma revisión e idénticos datos, $r_{rep} = r_{vig}$):** Se confirma el evento, se añade la estación reportante sin duplicar y se mantiene el estado previo.
- **Situación 4 (Misma revisión pero datos distintos, $r_{rep} = r_{vig}$):** Se genera conflicto de telemetría, se rechaza el reporte y se preservan intactos los datos vigentes.
- **Situación 5 (Revisión menor que la vigente, $r_{rep} < r_{vig}$):** Se reporta como desactualizado/antiguo y se descarta sin modificar el evento.
- **Identificador eliminado:** Todo reporte cuyo identificador pertenezca a un evento eliminado es rechazado sistemáticamente.

##### Respuestas / Responses:
- **`200 OK` (Situación 1 - Evento Creado):**
```json
{
  "success": true,
  "message": "Reporte procesado: nuevo evento creado.",
  "data": {
    "action": "NUEVO_EVENTO",
    "evento_id": 1002,
    "situacion": "SITUACION_1_NUEVO_EVENTO"
  }
}
```
- **`200 OK` (Situación 2 - Evento Actualizado o Reactivado):**
```json
{
  "success": true,
  "message": "Reporte procesado: evento actualizado con revisión 2.",
  "data": {
    "action": "ACTUALIZADO",
    "evento_id": 1001,
    "situacion": "SITUACION_2_REVISION_MAYOR",
    "rebalanceo_ejecutado": true
  }
}
```
- **`200 OK` (Situación 3 - Evento Confirmado):**
```json
{
  "success": true,
  "message": "Reporte procesado: evento confirmado por estación EST-SUR-01.",
  "data": {
    "action": "CONFIRMADO",
    "evento_id": 1001,
    "situacion": "SITUACION_3_CONFIRMACION"
  }
}
```
- **`200 OK` (Situación 4 - Conflicto):**
```json
{
  "success": false,
  "message": "Conflicto de reporte: misma revisión con datos discrepantes. Reporte descartado.",
  "data": {
    "action": "CONFLICTO",
    "evento_id": 1001,
    "situacion": "SITUACION_4_CONFLICTO"
  }
}
```
- **`200 OK` (Situación 5 - Reporte Antiguo Descartado):**
```json
{
  "success": false,
  "message": "Reporte antiguo descartado (revisión 1 menor a vigente 2).",
  "data": {
    "action": "DESCARTADO_ANTIGUO",
    "evento_id": 1001,
    "situacion": "SITUACION_5_REVISION_MENOR"
  }
}
```
- **`400 Bad Request` (Cola vacía o ID eliminado):**
```json
{
  "success": false,
  "error_code": "EVENT_PREVIOUSLY_DELETED",
  "message": "El reporte pertenece al evento 999 que fue eliminado del escenario y no admite nuevos reportes."
}
```

---

#### 2.4. Slice: Deshacer Última Acción (`POST /api/v1/sistema/deshacer`)
**Comando:** `DeshacerAccionCommand`  
**Descripción:** Desapila la última operación ejecutada de la Pila LIFO (Undo Stack) y revierte el cambio en el AVL.

##### Respuestas / Responses:
- **`200 OK`**: Acción revertida.
```json
{
  "success": true,
  "message": "Última acción revertida exitosamente.",
  "data": {
    "accion_revertida": "CREAR_EVENTO",
    "evento_afectado_id": 1001
  }
}
```

---

#### 2.5. Slice: Archivar Rama del AVL (`POST /api/v1/avl/archivar-rama`)
**Comando:** `ArchivarRamaCommand`  
**Descripción:** Poda y archiva un subárbol completo del AVL cuya prioridad o magnitud esté por debajo de un umbral de criticidad.

##### Request Payload (JSON):
```json
{
  "prioridad_minima": 3,
  "guardar_json": true
}
```

##### Respuestas / Responses:
- **`200 OK`**: Rama podada y archivada.
```json
{
  "success": true,
  "message": "Rama de prioridad baja archivada y podada del árbol AVL.",
  "data": {
    "nodos_archivados": 4,
    "nueva_altura_avl": 2
  }
}
```

---

#### 2.6. Endpoint de Auditoría y Métricas (`GET /api/v1/avl/metricas`)
**Descripción:** Retorna el factor de balanceo, altura, total de nodos, comparativa BST vs AVL y estado de los Modos Normal/Estrés.

##### Respuestas / Responses:
- **`200 OK`**: Métricas calculadas.
```json
{
  "success": true,
  "data": {
    "total_nodos": 15,
    "altura_avl": 4,
    "altura_bst": 7,
    "eficiencia_busqueda_avl_vs_bst": "42.8% más rápido / faster",
    "modo_operacion": "NORMAL",
    "es_avl_valido": true
  }
}
```

---

#### 2.7. Catálogo de Eventos Sísmicos Predefinidos (`GET /api/v1/eventos/predefinidos`)
**Descripción:** Retorna una lista estructurada de sismos colombianos históricos y sintéticos de referencia (P=1, P=2, P=3) para agilizar pruebas de balanceo e inserción rápida en 1 clic.

##### Respuestas / Responses:
- **`200 OK`**: Catálogo de eventos predefinidos.
```json
{
  "success": true,
  "total": 10,
  "predefinidos": [
    {
      "id": 1010,
      "nombre": "Terremoto de Armenia (1999) - Destructivo Urbano",
      "descripcion": "Sismo superficial en zona altamente poblada. Máxima prioridad de atención.",
      "magnitud": 6.2,
      "profundidad": 18.0,
      "latitud": 4.53389,
      "longitud": -75.68111,
      "estacion_id": "EST-ARMENIA-01",
      "zona_poblada": true,
      "expected_priority": 1,
      "categoria": "Crítico (P1)"
    }
  ]
}
```

---

#### 2.8. Limpieza y Reseteo Total del Árbol (`POST /api/v1/sistema/limpiar`)
**Descripción:** Vacía totalmente el árbol AVL, el árbol BST, la cola FIFO de telemetría y la pila LIFO de deshacer, dejando el sistema en 0 nodos para pruebas limpias. Opcionalmente permite cargar o no muestras iniciales mediante el parámetro `cargar_muestras=false`.

##### Respuestas / Responses:
- **`200 OK`**: Sistema vaciado exitosamente.
```json
{
  "success": true,
  "message": "Árbol AVL y estado del sistema limpiados totalmente.",
  "total_nodos": 0
}
```

---

#### 2.9. Árbol Jerárquico BST para Visualización (`GET /api/v1/bst/arbol-jerarquico`)
**Descripción:** Retorna la estructura jerárquica recursiva del árbol binario de búsqueda clásico (BST sin auto-balanceo) para su renderizado y comparación visual contra el árbol balanceado AVL.

##### Respuestas / Responses:
- **`200 OK`**: Estructura de árbol jerárquico serializada.
```json
{
  "success": true,
  "arbol": {
    "valor": {
      "id": 1001,
      "magnitud": 6.5,
      "profundidad": 15.0,
      "estacion_id": "EST-01"
    },
    "altura": 3,
    "factor_balanceo": 2,
    "hijo_izquierdo": null,
    "hijo_derecho": { ... },
    "relacion_izquierda": null,
    "relacion_derecha": "M=7.0 > M=6.5 (Der)"
  }
}
```

---

#### 2.10. Estado Completo Unificado del Dashboard (`GET /api/v1/sistema/estado-completo`)
**Descripción:** Retorna en una única petición HTTP atómica de alto rendimiento la totalidad del estado del sistema (métricas de auditoría, lista inorden de eventos, topología jerárquica AVL y topología jerárquica BST), eliminando sobrecarga de red y garantizando consistencia transaccional absoluta en la UI.

##### Respuestas / Responses:
- **`200 OK`**: Estado consolidado del sistema.
```json
{
  "success": true,
  "metricas": {
    "total_nodos": 12,
    "altura_avl": 4,
    "altura_bst": 6,
    "modo_operacion": "NORMAL"
  },
  "eventos": [ ... ],
  "avl_tree": { ... },
  "bst_tree": { ... },
  "cola_size": 0,
  "reloj_simulacion": "2026-09-22T12:00:00Z"
}
```

---

#### 2.11. Slice: Consultar Reloj de Simulación (`GET /api/v1/escenario/reloj`)
**Descripción:** Retorna el reloj de simulación actual del escenario en formato estándar UTC (ISO 8601 con precisión de segundos). A partir de este reloj y del timestamp de cada evento, se determina su antigüedad relativa.

##### Respuestas / Responses:
- **`200 OK`**: Reloj actual obtenido exitosamente.
```json
{
  "success": true,
  "reloj_simulacion": "2026-09-22T12:00:00Z",
  "message": "Reloj de simulación actual obtenido correctamente."
}
```

---

#### 2.12. Slice: Fijar Reloj de Simulación (`PUT /api/v1/escenario/reloj`)
**Comando:** `FijarRelojCommand`  
**Descripción:** Permite al operador establecer manualmente el reloj de simulación del escenario en una fecha y hora UTC específica. El timestamp debe cumplir con el estándar ISO 8601.

##### Request Payload (JSON):
```json
{
  "reloj_iso": "2026-09-22T15:30:00Z"
}
```

##### Respuestas / Responses:
- **`200 OK`**: Reloj fijado correctamente.
```json
{
  "success": true,
  "reloj_simulacion": "2026-09-22T15:30:00Z",
  "message": "Reloj de simulación fijado en 2026-09-22T15:30:00Z"
}
```
- **`400 Bad Request`**: Formato de fecha y hora ISO 8601 inválido.
```json
{
  "success": false,
  "error_code": "FORMATO_RELOJ_INVALIDO",
  "message": "El timestamp 'fecha-invalida' no cumple con el formato estándar ISO 8601 UTC."
}
```

---

#### 2.13. Slice: Avanzar Reloj de Simulación (`POST /api/v1/escenario/reloj/avanzar`)
**Comando:** `AvanzarRelojCommand`  
**Descripción:** Adelanta el reloj de simulación del escenario sumando un intervalo delta en minutos, horas, días o segundos. Al avanzar el reloj, se recalcula reactivamente la antigüedad de todos los eventos registrados en el sistema.

##### Request Payload (JSON):
```json
{
  "minutes": 60,
  "hours": 0,
  "days": 0,
  "seconds": 0
}
```

##### Respuestas / Responses:
- **`200 OK`**: Reloj adelantado con éxito.
```json
{
  "success": true,
  "reloj_simulacion": "2026-09-22T16:30:00Z",
  "message": "Reloj de simulación avanzado a 2026-09-22T16:30:00Z"
}
```
- **`400 Bad Request`**: El delta especificado no es estrictamente positivo.
```json
{
  "success": false,
  "error_code": "DELTA_RELOJ_INVALIDO",
  "message": "El delta para avanzar el reloj debe ser estrictamente positivo."
}
```

---

#### 2.14. Slice: Revisar Evento Sísmico (`PUT /api/v1/eventos/{id}/revisar`)
**Comando:** `RevisarEventoCommand`  
**Descripción:** Marca un evento sísmico existente como auditado y atendido, transicionando su `estado_atencion` de `'Pendiente'` a `'Revisado'`. Esta acción es reversible a través de la Pila LIFO de deshacer.

##### Respuestas / Responses:
- **`200 OK`**: Evento marcado como revisado exitosamente.
```json
{
  "success": true,
  "message": "Evento 1001 marcado como revisado.",
  "data": {
    "id": 1001,
    "estado_atencion": "Revisado",
    "estado_anterior": "Pendiente",
    "revision": 1
  }
}
```
- **`404 Not Found`**: El evento no existe en el catálogo AVL.
```json
{
  "success": false,
  "error_code": "EVENT_NOT_FOUND",
  "message": "No se encontró ningún evento sísmico con el identificador 9999."
}
```

---

#### 2.15. Slice: Listar Zonas del Escenario (`GET /api/v1/escenario/zonas`)
**Descripción:** Retorna el conjunto inmutable de zonas rectangulares del escenario delimitadas en el plano cartesiano $[0.0, 1000.0]\text{ km} \times [0.0, 1000.0]\text{ km}$, indicando su clasificación de habitabilidad (poblada / no poblada).

##### Respuestas / Responses:
- **`200 OK`**: Lista de zonas del escenario.
```json
{
  "success": true,
  "total": 3,
  "zonas": [
    {
      "id": "ZONA-CENTRAL",
      "nombre": "Valle Central Metropolitano",
      "x_min": 400.0,
      "x_max": 650.0,
      "y_min": 400.0,
      "y_max": 650.0,
      "es_poblada": true
    },
    {
      "id": "ZONA-NORTE",
      "nombre": "Cordillera Norte Forestal",
      "x_min": 100.0,
      "x_max": 400.0,
      "y_min": 650.0,
      "y_max": 950.0,
      "es_poblada": false
    },
    {
      "id": "ZONA-COSTA",
      "nombre": "Litoral Costero Poblado",
      "x_min": 50.0,
      "x_max": 350.0,
      "y_min": 50.0,
      "y_max": 350.0,
      "es_poblada": true
    }
  ]
}
```

---

#### 2.16. Slice: Consultar Evento Sísmico (`GET /api/v1/eventos/{id}`)
**Query:** `ConsultarEventoQuery`  
**Descripción:** Consulta exhaustiva en tiempo real de un identificador de evento en el escenario. Identifica su estado de ciclo de vida (`ACTIVO`, `ARCHIVADO`, `ELIMINADO`) y retorna, para eventos activos, las métricas topológicas de su nodo en el árbol AVL en tiempo $O(1)$: profundidad, altura, factor de balance y condición de raíz.

##### Respuestas / Responses:
- **`200 OK` (Evento Activo en AVL):**
```json
{
  "success": true,
  "data": {
    "id": 1001,
    "estado": "ACTIVO",
    "prioridad": 3,
    "magnitud": 6.5,
    "profundidad": 15.0,
    "x": 450.0,
    "y": 520.0,
    "estaciones_reportantes": ["EST-CENTRO-01"],
    "revision": 1,
    "estado_atencion": "Pendiente",
    "zona_poblada": true,
    "timestamp": "2026-09-22T17:30:00Z",
    "composite_key": {
      "P": 3,
      "M": 6.5,
      "I": 1001
    },
    "nodo_avl": {
      "profundidad_nodo": 1,
      "altura_nodo": 2,
      "factor_balance": 0,
      "es_raiz": false
    }
  }
}
```

- **`200 OK` (Evento Archivado tras Poda):**
```json
{
  "success": true,
  "data": {
    "id": 505,
    "estado": "ARCHIVADO",
    "prioridad": 1,
    "magnitud": 2.1,
    "profundidad": 50.0,
    "x": 100.0,
    "y": 100.0,
    "estaciones_reportantes": ["EST-NORTE-01"],
    "revision": 1,
    "estado_atencion": "Revisado",
    "zona_poblada": false,
    "timestamp": "2026-09-22T12:00:00Z",
    "composite_key": {
      "P": 1,
      "M": 2.1,
      "I": 505
    },
    "nodo_avl": null
  }
}
```

- **`200 OK` (Evento Eliminado):**
```json
{
  "success": true,
  "data": {
    "id": 999,
    "estado": "ELIMINADO",
    "mensaje": "El evento 999 fue eliminado y su identificador no está disponible.",
    "nodo_avl": null
  }
}
```

- **`404 Not Found` (Identificador Desconocido en el Escenario):**
```json
{
  "success": false,
  "error_code": "EVENT_NOT_FOUND",
  "message": "No se encontró ningún evento sísmico con el identificador 77777 en estado activo, archivado o eliminado."
}
```

---

#### 2.17. Slice: Eliminar Evento Sísmico (`DELETE /api/v1/eventos/{id}`)
**Comando:** `EliminarEventoCommand`  
**Descripción:** Elimina un evento activo individualmente del árbol AVL garantizando la preservación estricta de sus nodos descendientes mediante rebalanceo por rotaciones AVL (LL, RR, LR, RL). El identificador del evento eliminado queda inhabilitado en `deleted_ids` para evitar su reutilización por nuevos eventos o reportes, y la acción queda registrada en la pila de Deshacer (Undo Stack) para posibilitar su reversión.

##### Request Parameters:
- `id` (path, integer): Identificador numérico del evento a eliminar.

##### Respuestas / Responses:
- **`200 OK`**: Evento eliminado con éxito y AVL rebalanceado.
```json
{
  "success": true,
  "message": "Evento 1001 eliminado del árbol AVL preservando sus descendientes.",
  "data": {
    "id": 1001,
    "rebalanceo_ejecutado": true,
    "nueva_altura_avl": 2,
    "total_nodos_restantes": 3
  }
}
```

- **`400 Bad Request`**: El evento ya había sido eliminado previamente.
```json
{
  "success": false,
  "error_code": "EVENT_ALREADY_DELETED",
  "message": "El evento 1001 ya se encuentra eliminado del escenario sísmico."
}
```

- **`404 Not Found`**: El evento no existe en el catálogo activo ni en el escenario.
```json
{
  "success": false,
  "error_code": "EVENT_NOT_FOUND",
  "message": "No se encontró ningún evento activo con identificador 8888 para ser eliminado."
}
```

---

#### 2.18. Slice: Consultar Parámetros del Escenario (`GET /api/v1/escenario/parametros`)
**Query:** `ConsultarParametrosQuery`  
**Descripción:** Consulta los parámetros dinámicos del escenario sísmico: ventana de réplica $W$ (horas), radio de réplica $R$ (km), presupuesto de profundidad de acceso $L$ para eventos $P=3$, y umbral de antigüedad $T$ (horas) para archivo de subárboles.

##### Respuestas / Responses:
- **`200 OK`**:
```json
{
  "success": true,
  "data": {
    "param_w_hours": 48.0,
    "param_r_km": 40.0,
    "param_budget_l": 3,
    "param_archive_t_hours": 72.0
  }
}
```

---

#### 2.19. Slice: Actualizar Parámetros del Escenario (`PUT /api/v1/escenario/parametros`)
**Comando:** `ActualizarParametrosCommand`  
**Descripción:** Actualiza los parámetros dinámicos del escenario ($W, R, L, T$). Dispara reactivamente la re-evaluación determinista de asociaciones de réplica en todo el catálogo si $W$ o $R$ cambiaron, y actualiza las marcas de acceso costoso en el AVL si $L$ cambió.

##### Request Payload (JSON):
```json
{
  "param_w_hours": 36.0,
  "param_r_km": 50.0,
  "param_budget_l": 4,
  "param_archive_t_hours": 48.0
}
```

##### Respuestas / Responses:
- **`200 OK`**: Parámetros actualizados y asociaciones recalculadas.
```json
{
  "success": true,
  "message": "Parámetros del escenario actualizados correctamente.",
  "data": {
    "param_w_hours": 36.0,
    "param_r_km": 50.0,
    "param_budget_l": 4,
    "param_archive_t_hours": 48.0,
    "total_eventos_asociados": 2
  }
}
```

- **`400 Bad Request`**: Valores de parámetros inválidos ($W \le 0, R \le 0, L < 1, T \le 0$).
```json
{
  "success": false,
  "error_code": "INVALID_PARAMETERS",
  "message": "Los parámetros W, R y T deben ser estrictamente positivos y L debe ser >= 1."
}
```

---

#### 2.20. Slice: Previsualizar Archivo de Subárbol (`GET /api/v1/avl/archivar-rama/previsualizar`)
**Query:** `PrevisualizarArchivoRamaQuery`  
**Descripción:** Evalúa recursivamente en post-orden los subárboles del AVL según la regla de la Sección 10: un subárbol $S$ es elegible si y solo si todos sus nodos tienen prioridad 1 (Baja) y su antigüedad supera $T$ horas respecto al reloj de simulación. Entre las opciones elegibles, selecciona deterministamente aquella con mayor tamaño $|S|$, mayor profundidad de raíz y menor ID. Devuelve el detalle algorítmico sin modificar el árbol.

##### Query Parameters:
- `t_horas` (opcional, float): Umbral de antigüedad temporal $T$ en horas (usa el del escenario si no se especifica).

##### Respuestas / Responses:
- **`200 OK` (Subárbol Elegible Encontrado):**
```json
{
  "success": true,
  "data": {
    "elegible": true,
    "justificacion": "Subárbol con raíz SIS-000501: tamaño |S|=3, profundidad=2, ID=501 (Regla: mayor tamaño -> mayor profundidad -> menor ID)",
    "nodo_raiz": {
      "id": 501,
      "magnitud": 2.2,
      "prioridad": 1
    },
    "tamano_subarbol": 3,
    "profundidad_raiz": 2,
    "eventos_a_archivar": [
      { "id": 501, "magnitud": 2.2, "prioridad": 1 },
      { "id": 502, "magnitud": 1.8, "prioridad": 1 },
      { "id": 503, "magnitud": 1.5, "prioridad": 1 }
    ]
  }
}
```

- **`200 OK` (Sin Subárboles Elegibles):**
```json
{
  "success": true,
  "data": {
    "elegible": false,
    "mensaje": "No se encontró ningún subárbol completo elegible para archivo con P=1 y antigüedad > 72.0 h.",
    "eventos_a_archivar": []
  }
}
```

---

#### 2.21. Slice: Recuperar Balance AVL tras Modo Estrés (`POST /api/v1/avl/recuperar-estres`)
**Comando:** `RecuperarBalanceEstresCommand`  
**Descripción:** Ejecuta la restauración estricta del balance AVL $|FB| \le 1$ tras periodos de inserción diferida (Modo Estrés). Realiza pasadas iterativas de rotaciones locales (LL, RR, LR, RL) sobre la memoria del árbol, equilibrando árboles con factores de balance $|FB| \ge 2$ o degenerados sin vaciar el árbol ni delegar a colecciones externas.

##### Respuestas / Responses:
- **`200 OK`**: Balance restaurado con éxito.
```json
{
  "success": true,
  "message": "Balance AVL restaurado exitosamente tras modo estrés. Rotaciones ejecutadas: 4.",
  "data": {
    "rotaciones_ejecutadas": 4,
    "altura_final": 3,
    "es_balanceado": true,
    "total_nodos": 7
  }
}
```

---

#### 2.22. Slice: Encolar Ráfaga de Prueba Mixta (`POST /api/v1/reportes/rafaga-prueba`)
**Comando:** `EncolarRafagaPruebaCommand`  
**Descripción:** Encola una ráfaga sintética de 5 reportes telemétricos mixtos (altas nuevas y correcciones de eventos existentes provenientes de distintas estaciones sismológicas) para verificar la ejecución secuencial FIFO y el reporte paso a paso de decisiones y rotaciones producidas.

##### Respuestas / Responses:
- **`200 OK`**:
```json
{
  "success": true,
  "message": "Ráfaga de 5 reportes de prueba encolada exitosamente.",
  "total_encolados": 5,
  "reportes": [
    { "station_code": "EST-CENTRO-01", "event_id": 8100, "magnitud": 5.2, "profundidad": 15.0 },
    { "station_code": "EST-OCCIDENTE-01", "event_id": 8101, "magnitud": 4.1, "profundidad": 30.0 },
    { "station_code": "EST-SUR-01", "event_id": 8100, "magnitud": 5.4, "profundidad": 14.0 },
    { "station_code": "EST-CENTRO-01", "event_id": 8102, "magnitud": 6.8, "profundidad": 10.0 },
    { "station_code": "EST-NORTE-01", "event_id": 8103, "magnitud": 2.2, "profundidad": 45.0 }
  ]
}
```

---

#### 2.23. Consultar K Eventos Pendientes de Atención (`GET /api/v1/consultas/pendientes`)
**Query:** `ConsultarPrimerosKPendientesQuery`  
**Descripción:** Retorna los primeros $k$ eventos activos en estado 'Pendiente', ordenados descendentemente por su clave compuesta $K = (P, M, I)$. Reporta la cantidad exacta de nodos examinados y justifica la poda (recorrido inorden inverso que se detiene al alcanzar $k$ elementos).

##### Query Parameters:
- `k` (int, default 5): Número entero positivo de eventos a consultar.

##### Respuestas / Responses:
- **`200 OK`**:
```json
{
  "success": true,
  "k": 3,
  "nodos_examinados": 3,
  "total_nodos_arbol": 15,
  "justificacion_poda": "Recorrido inorden inverso (der -> raíz -> izq) podando subárboles una vez acumulados los k elementos.",
  "eventos": [
    { "id": 1005, "clave": { "P": 3, "M": 7.1, "I": 1005 }, "magnitud": 7.1, "prioridad": 3, "revisado": false }
  ]
}
```

---

#### 2.24. Consultar Eventos por Intervalo de Magnitud (`GET /api/v1/consultas/magnitud`)
**Query:** `ConsultarPorRangoMagnitudQuery`  
**Descripción:** Retorna todos los eventos activos cuya magnitud esté dentro del intervalo inclusivo $[M_{min}, M_{max}]$, reportando nodos examinados y justificación algorítmica de poda.

##### Query Parameters:
- `m_min` (float, default 0.0)
- `m_max` (float, default 10.0)

##### Respuestas / Responses:
- **`200 OK`**:
```json
{
  "success": true,
  "m_min": 5.0,
  "m_max": 7.0,
  "nodos_examinados": 8,
  "total_encontrados": 2,
  "justificacion_poda": "Poda recursiva de subárboles cuyas cotas lexicográficas descartan valores compatibles.",
  "eventos": [ ... ]
}
```

---

#### 2.25. Consultar por Profundidad y Fechas (`GET /api/v1/consultas/profundidad-fechas`)
**Query:** `ConsultarPorProfundidadYFechasQuery`  
**Descripción:** Retorna los eventos activos cuya profundidad de hipocentro sea menor o igual a $H_{max}$ y hayan ocurrido dentro del intervalo inclusivo de fechas $[T_{inicio}, T_{fin}]$.

##### Query Parameters:
- `h_max` (float, default 50.0): Límite superior de profundidad en km.
- `t_inicio` (str, ISO-8601 UTC)
- `t_fin` (str, ISO-8601 UTC)

---

#### 2.26. Consultar Asociaciones y Réplicas de un Evento (`GET /api/v1/consultas/asociaciones/{event_id}`)
**Query:** `ConsultarAsociacionesEventoQuery`  
**Descripción:** Retorna los candidatos evaluados, la referencia determinista elegida y los eventos (activos y archivados) que utilizan a este evento como su referencia principal de réplica.

##### Respuestas / Responses:
- **`200 OK`**:
```json
{
  "success": true,
  "evento": { "id": 1002, "magnitud": 4.8, "es_activo": true },
  "referencia_elegida": { "id": 1001, "magnitud": 6.8 },
  "candidatos": [
    { "id": 1001, "es_activo": true, "magnitud": 6.8, "distancia_km": 15.2, "delta_t_horas": 3.5 }
  ],
  "eventos_que_lo_referencian": []
}
```

---

#### 2.27. Consultar Eventos con Acceso Costoso (`GET /api/v1/consultas/acceso-costoso`)
**Query:** `ConsultarAccesoCostosoQuery`  
**Descripción:** Identifica los eventos activos de alta prioridad ($P=3$) cuya profundidad en el árbol supera el umbral $L$. Para cada uno, reporta su profundidad, el límite $L$ y el número exacto de nodos visitados en su búsqueda por clave.

---

#### 2.28. Benchmark Experimental Comparativo AVL vs BST (`POST /api/v1/consultas/benchmark-comparativo`)
**Query:** `EjecutarBenchmarkComparativoQuery`  
**Descripción:** Ejecuta una simulación rigurosa con $N$ nodos comparando alturas y visitas promedio de búsqueda entre el árbol AVL auto-balanceado y el árbol binario de búsqueda BST estándar bajo 4 patrones de inserción (ascendente, descendente, aleatorio, alternado).

##### Request Payload:
```json
{
  "tamano_n": 100,
  "patron_orden": "todos"
}
```

---

#### 2.29. Exportar Escenario Completo (`POST /api/v1/escenario/exportar`)
**Comando:** `ExportarEscenarioCommand`  
**Descripción:** Exporta la totalidad del estado operativo a un archivo JSON estructurado (eventos activos, archivados, eliminados, parámetros, reloj, métricas y topología recursiva explícita).

---

#### 2.30. Importar Escenario por Inserciones (`POST /api/v1/escenario/importar-inserciones`)
**Comando:** `ImportarInsercionesCommand`  
**Descripción:** Reconstruye el escenario procesando secuencialmente cada evento como una inserción nueva en AVL y BST, validando unicidad de IDs numéricos y rebalanceando dinámicamente.

---

#### 2.31. Importar AVL por Topología Explícita (`POST /api/v1/escenario/importar-topologia`)
**Comando:** `ImportarTopologiaCommand`  
**Descripción:** Reconstruye la estructura exacta del árbol a partir de un árbol precalculado con validación atómica: si se viola el orden BST global o la reciprocidad de punteros, se rechaza; si existen nodos desbalanceados ($|FB| > 1$), conmuta a Modo Estrés si está autorizado.

---

#### 2.32. Geometría Cartesiana del Escenario en 2D (`GET /api/v1/escenario/geometria`)
**Descripción:** Retorna los límites rectangulares de las zonas $[0, 1000]\text{ km}$, coordenadas de estaciones receptoras, epicentros de eventos con su radio/prioridad y los segmentos de enlace rectilíneos de réplicas.

---

#### 2.33. Versiones Persistentes con Nombre (`/api/v1/versiones`)
- **`GET /api/v1/versiones`**: Lista los snapshots guardados en disco en `data/versions/`.
- **`POST /api/v1/versiones/guardar`**: Guarda un nuevo snapshot con nombre inmutable y descripción.
- **`POST /api/v1/versiones/{nombre}/restaurar`**: Restaura una versión previa (operación reversible mediante Deshacer).
- **`DELETE /api/v1/versiones/{nombre}`**: Elimina una versión de disco.

---

#### 2.34. Auditoría Estructural e Indicadores (`/api/v1/auditoria`)
- **`GET /api/v1/auditoria/verificar-estructura`**: Auditoría exhaustiva en $O(N)$ con cotas de ancestros, punteros recíprocos y factores de balance.
- **`GET /api/v1/auditoria/indicadores-completos`**: Los 4 recorridos formales (inorden, preorden, postorden, por niveles) y matriz de rotaciones.
- **`POST /api/v1/auditoria/resetear-contadores-rotacion`**: Reinicia a cero los contadores de rotaciones para nuevas pruebas.

---

#### 2.35. Red Nacional de Estaciones Sísmicas (`GET / POST /api/v1/escenario/estaciones`)

##### 1. Listar Estaciones Telemétricas (`GET /api/v1/escenario/estaciones`)
- **Método HTTP:** `GET`
- **Ruta:** `/api/v1/escenario/estaciones` (alias: `/api/v1/estaciones`)
- **Respuesta Exitosa (`200 OK`):**
```json
{
  "success": true,
  "total": 12,
  "estaciones": [
    {
      "codigo": "EST-MANIZALES-01",
      "nombre": "Estación Central Manizales (Caldas)",
      "x": 380.0,
      "y": 520.0,
      "activo": true
    },
    {
      "codigo": "EST-PEREIRA-01",
      "nombre": "Estación Matecaña Pereira (Risaralda)",
      "x": 270.0,
      "y": 380.0,
      "activo": true
    }
  ]
}
```

##### 2. Registrar Nueva Estación de Monitoreo (`POST /api/v1/escenario/estaciones`)
- **Método HTTP:** `POST`
- **Ruta:** `/api/v1/escenario/estaciones` (alias: `/api/v1/estaciones`)
- **Payload de Entrada (JSON):**
```json
{
  "codigo": "EST-CARTAGENA-01",
  "nombre": "Estación Sismológica Costera Cartagena (Bolívar)",
  "x": 620.0,
  "y": 910.0,
  "activa": true
}
```
- **Matriz Estricta de Respuestas y Errores:**
  - **`201 Created`:**
  ```json
  {
    "success": true,
    "message": "Estación telemétrica 'EST-CARTAGENA-01' registrada exitosamente en el escenario.",
    "data": {
      "codigo": "EST-CARTAGENA-01",
      "nombre": "Estación Sismológica Costera Cartagena (Bolívar)",
      "x": 620.0,
      "y": 910.0,
      "activo": true
    }
  }
  ```
  - **`400 Bad Request` (Código ya existente o reglas de negocio quebradas):**
  ```json
  {
    "detail": {
      "code": "STATION_ALREADY_EXISTS",
      "message": "Ya existe una estación de monitoreo registrada con el código 'EST-CARTAGENA-01'."
    }
  }
  ```
  - **`422 Unprocessable Entity` (Coordenadas fuera del plano $[0, 1000]\text{ km}$ o tipos inválidos):**
  ```json
  {
    "detail": [
      {
        "loc": ["body", "x"],
        "msg": "ensure this value is less than or equal to 1000.0",
        "type": "value_error.number.not_le"
      }
    ]
  }
  ```
  - **`500 Internal Server Error`:** Estructura de falla no prevista del servidor.

---

#### 2.15. Slice: Geometría Cartesiana del Escenario (`GET /api/v1/escenario/geometria`)
- **Definición de Ruta:** `GET /api/v1/escenario/geometria`
- **Descripción:** Retorna el plano métrico $[0, 1000] \times [0, 1000]\text{ km}$, zonas urbanas y rurales, red de estaciones telemétricas, catálogo de eventos con estado activo/archivado y segmentos de conexión directa entre eventos y sus réplicas asociadas.
- **Payload de Entrada:** Ninguno (método GET idempotente).
- **Matriz Estricta de Respuestas y Errores:**
  - **`200 OK`:**
  ```json
  {
    "success": true,
    "plano": { "x_min": 0.0, "x_max": 1000.0, "y_min": 0.0, "y_max": 1000.0 },
    "parametros": {
      "param_w_hours": 48.0,
      "param_r_km": 40.0,
      "param_budget_l": 3,
      "param_archive_t_hours": 72.0
    },
    "zonas": [
      {
        "codigo": "ZONA-CENTRAL",
        "nombre": "Cordillera Central",
        "x_min": 300.0,
        "x_max": 700.0,
        "y_min": 300.0,
        "y_max": 700.0,
        "es_poblada": true
      }
    ],
    "estaciones": [
      {
        "codigo": "EST-MANIZALES-01",
        "nombre": "Estación Central Manizales",
        "x": 306.4,
        "y": 546.8
      }
    ],
    "eventos": [
      {
        "id": 1001,
        "magnitud": 6.8,
        "profundidad": 15.0,
        "prioridad": 3,
        "x": 306.4,
        "y": 546.8,
        "es_activo": true,
        "es_replica": false,
        "evento_referencia_id": null
      }
    ],
    "enlaces_replicas": [
      {
        "origen_id": 1002,
        "origen_x": 312.0,
        "origen_y": 550.0,
        "destino_id": 1001,
        "destino_x": 306.4,
        "destino_y": 546.8,
        "distancia_km": 6.45
      }
    ]
  }
  ```
  - **`500 Internal Server Error`:** Falla catastrófica en el cálculo de la geometría o el motor de asociaciones.

---

#### 2.16. Slice: Gestión de Versiones Persistentes en Disco
- **Definición de Rutas:**
  - `GET /api/v1/versiones`
  - `POST /api/v1/versiones/guardar`
  - `POST /api/v1/versiones/{nombre}/restaurar`
  - `DELETE /api/v1/versiones/{nombre}`
- **Payload de Guardado (`POST /api/v1/versiones/guardar`):**
  ```json
  {
    "nombre": "ensayo_sismico_caldas_2026",
    "descripcion": "Snapshot con 45 eventos y subárbol de réplicas en Manizales"
  }
  ```
- **Matriz de Respuestas:**
  - **`200 OK` (Listar Versiones):**
  ```json
  {
    "success": true,
    "total": 1,
    "versiones": [
      {
        "nombre": "ensayo_sismico_caldas_2026",
        "descripcion": "Snapshot con 45 eventos y subárbol de réplicas en Manizales",
        "timestamp": "2026-09-23T20:45:00Z",
        "reloj_simulacion": "2026-09-23T21:00:00Z",
        "total_eventos_activos": 45,
        "total_eventos_archivados": 12
      }
    ]
  }
  ```
  - **`400 Bad Request`:** Nombre de versión vacío o inválido.
  - **`404 Not Found`:** Versión solicitada no existe en disco al restaurar o eliminar.

---

#### 2.17. Slice: Auditoría Estructural e Indicadores Exhaustivos del AVL
- **Definición de Rutas:**
  - `GET /api/v1/auditoria/verificar-estructura`
  - `GET /api/v1/auditoria/indicadores-completos`
  - `POST /api/v1/auditoria/resetear-contadores-rotacion`
- **Matriz de Respuestas (`GET /api/v1/auditoria/verificar-estructura`):**
  ```json
  {
    "success": true,
    "es_valido": true,
    "total_nodos": 45,
    "altura_calculada": 6,
    "max_factor_balance": 1,
    "errores_encontrados": [],
    "certificacion": "ÁRBOL AVL 100% BALANCEADO Y HOMOLOGADO"
  }
  ```
- **Matriz de Respuestas (`GET /api/v1/auditoria/indicadores-completos`):**
  ```json
  {
    "success": true,
    "rotaciones": {
      "rotaciones_simples_izq": 8,
      "rotaciones_simples_der": 6,
      "rotaciones_dobles_izq_der": 3,
      "rotaciones_dobles_der_izq": 2,
      "total_giros_elementales": 24
    },
    "recorridos": {
      "inorden": [1001, 1002, 1003],
      "preorden": [1002, 1001, 1003],
      "postorden": [1001, 1003, 1002],
      "por_niveles": [[1002], [1001, 1003]]
    },
    "comparativa_bst": {
      "altura_avl": 6,
      "altura_bst": 14,
      "ahorro_altura_porcentaje": 57.14
    }
  }
  ```


