# 🗄️ Especificación de Base de Datos y Persistencia / Database & Persistence Specification
## Sistema Backend SismoLab AVL - Universidad de Caldas

---

### 1. Resumen Ejecutivo / Executive Summary

**Español:**
El sistema SismoLab AVL utiliza un modelo de persistencia híbrido:
1. **Persistencia Primaria en Memoria (In-Memory Core):** Estructuras de datos puras (`AVLTree`, `BST`, `Stack`, `Queue`) para garantizar operaciones de inserción, búsqueda y rotación en tiempo real con complejidad $O(\log N)$ y $O(1)$.
2. **Persistencia Secundaria en Archivo JSON (JSON Snapshot Store):** Almacenamiento desacoplado para la serialización periódica de eventos sísmicos, estaciones, reportes y estado del árbol AVL (soporte de restauración ante fallos o podas de ramas).

**English:**
The SismoLab AVL system uses a hybrid persistence model:
1. **Primary In-Memory Persistence (In-Memory Core):** Pure data structures (`AVLTree`, `BST`, `Stack`, `Queue`) to ensure real-time insertion, search, and rotation operations with $O(\log N)$ and $O(1)$ time complexity.
2. **Secondary JSON File Persistence (JSON Snapshot Store):** Decoupled storage for periodic serialization of seismic events, stations, reports, and AVL tree state (supporting failure recovery and branch pruning).

---

### 2. Diccionario de Datos / Data Dictionary

#### Entidad: `EventoSismico` (`seismic_events`)

| Campo / Field | Tipo / Type | Restricciones / Constraints | Descripción (ES / EN) |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY, NOT NULL, 1..999999` | Identificador único numérico (formato visual `SIS-XXXXXX`). / Unique numeric ID. |
| `prioridad` | `INTEGER` | `NOT NULL, IN (1, 2, 3)` | Prioridad calculada: 1 (Alta), 2 (Media), 3 (Baja). / Calculated priority: 1 (High), 2 (Med), 3 (Low). |
| `magnitud` | `NUMERIC(4, 1)` | `NOT NULL, -2.0..10.0` | Magnitud en escala Richter/Momentum. / Magnitude on Richter scale. |
| `profundidad` | `NUMERIC(6, 2)` | `NOT NULL, profundidad >= 0.0` | Profundidad del hipocentro en kilómetros. / Depth of hypocenter in km. |
| `latitud` | `NUMERIC(8, 5)` | `NOT NULL, -90.0..90.0` | Coordenada de latitud del epicentro. / Epicenter latitude coordinate. |
| `longitud` | `NUMERIC(8, 5)` | `NOT NULL, -180.0..180.0` | Coordenada de longitud del epicentro. / Epicenter longitude coordinate. |
| `estacion_id` | `VARCHAR(32)` | `NOT NULL, Foreign Key -> Estacion` | Código identificador de la estación de origen. / Source station code ID. |
| `zona_poblada` | `BOOLEAN` | `NOT NULL, DEFAULT FALSE` | Indica si el epicentro impacta zona habitada. / Indicates impact on populated zone. |
| `timestamp` | `VARCHAR(32)` | `NOT NULL, ISO-8601` | Estampa de tiempo de detección. / ISO-8601 detection timestamp. |
| `estado` | `VARCHAR(16)` | `NOT NULL, IN ('ACTIVO', 'ARCHIVADO')` | Estado operativo del evento en el AVL. / Operational status in AVL tree. |

---

#### Entidad: `Estacion` (`stations`)

| Campo / Field | Tipo / Type | Restricciones / Constraints | Descripción (ES / EN) |
| :--- | :--- | :--- | :--- |
| `codigo` | `VARCHAR(32)` | `PRIMARY KEY, NOT NULL` | Código único de estación (ej. `EST-MANIZALES-01`). / Unique station code. |
| `nombre` | `VARCHAR(128)` | `NOT NULL` | Nombre descriptivo de la estación. / Descriptive station name. |
| `latitud` | `NUMERIC(8, 5)` | `NOT NULL` | Latitud de ubicación física. / Physical latitude. |
| `longitud` | `NUMERIC(8, 5)` | `NOT NULL` | Longitud de ubicación física. / Physical longitude. |
| `activa` | `BOOLEAN` | `NOT NULL, DEFAULT TRUE` | Estado operacional de la estación. / Station operational status. |

---

#### Entidad: `Reporte` (`seismic_reports`)

| Campo / Field | Tipo / Type | Restricciones / Constraints | Descripción (ES / EN) |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, NOT NULL` | Identificador global único del reporte entrante. / Unique incoming report UUID. |
| `estacion_codigo` | `VARCHAR(32)` | `NOT NULL` | Código de la estación receptora. / Receiver station code. |
| `datos_raw` | `JSON` | `NOT NULL` | Telemetría sísmica cruda recibida en cola. / Raw seismic telemetry received in queue. |
| `procesado` | `BOOLEAN` | `NOT NULL, DEFAULT FALSE` | Estado de procesamiento en la cola FIFO. / Processing state in FIFO queue. |

---

### 3. Estructura de Persistencia JSON / JSON Persistence Schema

```json
{
  "version": "1.0",
  "exported_at": "2026-09-13T12:00:00Z",
  "avl_metadata": {
    "total_nodes": 5,
    "height": 3,
    "mode": "NORMAL",
    "is_balanced": true
  },
  "events": [
    {
      "id": 1001,
      "prioridad": 1,
      "magnitud": 6.8,
      "profundidad": 12.5,
      "latitud": 5.06889,
      "longitud": -75.51738,
      "estacion_id": "EST-MANIZALES-01",
      "zona_poblada": true,
      "timestamp": "2026-09-13T11:45:00Z",
      "estado": "ACTIVO",
      "composite_key": {
        "P": 1,
        "M": 6.8,
        "I": 1001
      }
    }
  ],
  "archived_branches": []
}
```
