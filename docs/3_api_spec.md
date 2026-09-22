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
**Descripción:** Registra un nuevo evento sísmico en el sistema, calcula su clave $K = (P, M, I)$ e inserta el nodo en el árbol AVL (y en el BST de benchmarking).

##### Request Payload (JSON):
```json
{
  "id": 1001,
  "magnitud": 6.5,
  "profundidad": 15.0,
  "latitud": 5.06889,
  "longitud": -75.51738,
  "estacion_id": "EST-MANIZALES-01",
  "zona_poblada": true
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
      "P": 1,
      "M": 6.5,
      "I": 1001
    },
    "prioridad": 1,
    "magnitud": 6.5,
    "profundidad": 15.0,
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
**Descripción:** Corrige los parámetros de magnitud o profundidad de un sismo. Si la prioridad $P$ cambia, la clave $K$ se re-calcula y el nodo es re-ubicado en el AVL.

##### Request Payload (JSON):
```json
{
  "nueva_magnitud": 7.2,
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
    "clave_anterior": {"P": 2, "M": 6.5, "I": 1001},
    "nueva_clave": {"P": 1, "M": 7.2, "I": 1001},
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
**Descripción:** Extrae el siguiente reporte de la Cola FIFO de recepción y lo convierte en un evento sísmico formal en el AVL.

##### Respuestas / Responses:
- **`200 OK`**: Reporte procesado.
```json
{
  "success": true,
  "message": "Reporte procesado desde la cola FIFO e insertado en AVL.",
  "data": {
    "reportes_restantes_en_cola": 3,
    "evento_creado_id": 1002
  }
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



