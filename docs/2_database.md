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
| `id` | `INTEGER` | `PRIMARY KEY, NOT NULL, 1..999999` | Identificador único numérico inmutable (formato visual `SIS-XXXXXX`). Comparación numérica. / Unique numeric ID. |
| `prioridad` | `INTEGER` | `NOT NULL, IN (1, 2, 3)` | Prioridad obligatoria Sección 4: 3 (Alta), 2 (Media), 1 (Baja). / Calculated priority: 3 (High), 2 (Med), 1 (Low). |
| `magnitud` | `NUMERIC(3, 1)` | `NOT NULL, -2.0..10.0` | Magnitud finita con máximo un decimal. / Finite magnitude (max 1 decimal). |
| `profundidad` | `NUMERIC(4, 1)` | `NOT NULL, 0.0..700.0` | Profundidad del hipocentro en kilómetros con máximo un decimal. / Hypocenter depth in km (max 1 decimal). |
| `x` | `NUMERIC(5, 1)` | `NOT NULL, 0.0..1000.0` | Coordenada cartesiana $X$ en kilómetros con máximo un decimal. / Cartesian $X$ coordinate in km. |
| `y` | `NUMERIC(5, 1)` | `NOT NULL, 0.0..1000.0` | Coordenada cartesiana $Y$ en kilómetros con máximo un decimal. / Cartesian $Y$ coordinate in km. |
| `estaciones_reportantes` | `JSON / TEXT[]` | `NOT NULL` | Conjunto de códigos de estaciones con reportes aceptados. / Set of station codes with accepted reports. |
| `revision` | `INTEGER` | `NOT NULL, DEFAULT 1, >= 1` | Número entero positivo de versión/revisión. Inicia en 1 e incrementa con cada corrección. / Positive revision integer. |
| `estado_atencion` | `VARCHAR(16)` | `NOT NULL, IN ('Pendiente', 'Revisado')` | Inicia 'Pendiente'. Correcciones retornan a 'Pendiente'. Acción explícita pasa a 'Revisado'. / Attention status. |
| `zona_poblada` | `BOOLEAN` | `NOT NULL, DEFAULT FALSE` | Indica si el epicentro impacta zona habitada según geometría de zonas. / Populated zone flag. |
| `timestamp` | `VARCHAR(32)` | `NOT NULL, ISO-8601 UTC` | Estampa de tiempo de ocurrencia ($\le$ reloj de simulación). / Occurrence timestamp in UTC ISO-8601. |
| `estado` | `VARCHAR(16)` | `NOT NULL, IN ('ACTIVO', 'ARCHIVADO', 'ELIMINADO')` | Estado operativo del evento en el ciclo de vida del escenario. / Lifecycle operational status. |
| `es_replica` | `BOOLEAN` | `NOT NULL, DEFAULT FALSE` | Flag determinista de réplica asociado según criterio Sección 7. / Replica flag. |
| `evento_referencia_id` | `INTEGER` | `NULLABLE, REFERENCES seismic_events(id)` | ID del evento principal de referencia seleccionado deterministamente. / Reference event ID. |
| `candidatos_referencia` | `JSON` | `NOT NULL, DEFAULT '[]'` | Lista de eventos candidatos evaluados con sus métricas $M, d, \Delta t$. / List of evaluated replica candidates. |
| `acceso_costoso` | `BOOLEAN` | `NOT NULL, DEFAULT FALSE` | True si $P=3$ y profundidad del nodo $> L$ en el AVL (Sección 9). / Expensive access flag. |
| `costo_simulado` | `INTEGER` | `NOT NULL, DEFAULT 1` | Número simulado de lecturas para acceder al nodo ($\text{profundidad} + 1$). / Simulated read access cost. |

---

#### Entidad: `ParametrosEscenario` (`scenario_parameters`)

| Campo / Field | Tipo / Type | Restricciones / Constraints | Descripción (ES / EN) |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY, NOT NULL, DEFAULT 1` | Clave primaria singleton para el registro de configuración. |
| `param_w_hours` | `NUMERIC(5, 1)` | `NOT NULL, DEFAULT 48.0, > 0` | Ventana temporal máxima para asociación de réplica ($W$ horas). |
| `param_r_km` | `NUMERIC(5, 1)` | `NOT NULL, DEFAULT 40.0, > 0` | Radio espacial máximo para asociación de réplica ($R$ km). |
| `param_budget_l` | `INTEGER` | `NOT NULL, DEFAULT 3, >= 1` | Presupuesto de profundidad de acceso para eventos de alta prioridad ($P=3$). |
| `param_archive_t_hours` | `NUMERIC(5, 1)` | `NOT NULL, DEFAULT 72.0, > 0` | Antigüedad mínima respecto al reloj para elegibilidad de subárbol ($T$ horas). |

---

#### Entidad: `EventoEliminado` (`deleted_events_audit`)

| Campo / Field | Tipo / Type | Restricciones / Constraints | Descripción (ES / EN) |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY, NOT NULL, 1..999999` | Identificador del evento eliminado del AVL. Su ID queda inhabilitado para futuras inserciones. / Deleted event ID. |
| `motivo` | `VARCHAR(256)` | `NULLABLE` | Causa de la eliminación manual o administrativa. / Deletion reason. |
| `eliminado_en` | `VARCHAR(32)` | `NOT NULL, ISO-8601 UTC` | Marca de tiempo del reloj de simulación al momento del borrado. / Timestamp of deletion. |

---

#### Entidad: `EventoArchivado` (`archived_events_repository`)

| Campo / Field | Tipo / Type | Restricciones / Constraints | Descripción (ES / EN) |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY, NOT NULL, 1..999999` | Identificador del evento archivado tras poda de subárbol completo elegible. / Archived event ID. |
| `evento_data` | `JSON` | `NOT NULL` | Snapshot completo de la entidad sísmica preservada fuera del árbol activo. / Full entity snapshot. |
| `archivado_en` | `VARCHAR(32)` | `NOT NULL, ISO-8601 UTC` | Marca de tiempo del reloj al podar el subárbol. / Timestamp when subtree was pruned. |

---

#### Entidad: `Zona` (`scenario_zones`)

| Campo / Field | Tipo / Type | Restricciones / Constraints | Descripción (ES / EN) |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(32)` | `PRIMARY KEY, NOT NULL` | Código identificador de la zona (ej. `ZONA-CENTRAL`). / Unique zone ID. |
| `nombre` | `VARCHAR(128)` | `NOT NULL` | Nombre descriptivo de la zona. / Descriptive zone name. |
| `x_min` | `NUMERIC(5, 1)` | `NOT NULL, 0.0..1000.0` | Límite inferior horizontal del rectángulo en km. / Left rectangle boundary in km. |
| `x_max` | `NUMERIC(5, 1)` | `NOT NULL, 0.0..1000.0, x_max > x_min` | Límite superior horizontal del rectángulo en km. / Right rectangle boundary in km. |
| `y_min` | `NUMERIC(5, 1)` | `NOT NULL, 0.0..1000.0` | Límite inferior vertical del rectángulo en km. / Bottom rectangle boundary in km. |
| `y_max` | `NUMERIC(5, 1)` | `NOT NULL, 0.0..1000.0, y_max > y_min` | Límite superior vertical del rectángulo en km. / Top rectangle boundary in km. |
| `es_poblada` | `BOOLEAN` | `NOT NULL` | Clasificación de la zona (True = poblada, False = no poblada). Borde compartido = poblada. / Populated flag. |

---

#### Entidad: `Estacion` (`stations`)

| Campo / Field | Tipo / Type | Restricciones / Constraints | Descripción (ES / EN) |
| :--- | :--- | :--- | :--- |
| `codigo` | `VARCHAR(32)` | `PRIMARY KEY, NOT NULL` | Código único de estación (ej. `EST-CENTRO-01`). / Unique station code. |
| `nombre` | `VARCHAR(128)` | `NOT NULL` | Nombre descriptivo de la estación. / Descriptive station name. |
| `x` | `NUMERIC(5, 1)` | `NOT NULL, 0.0..1000.0` | Coordenada cartesiana $X$ en kilómetros. / Cartesian $X$ position in km. |
| `y` | `NUMERIC(5, 1)` | `NOT NULL, 0.0..1000.0` | Coordenada cartesiana $Y$ en kilómetros. / Cartesian $Y$ position in km. |
| `activa` | `BOOLEAN` | `NOT NULL, DEFAULT TRUE` | Estado operacional de la estación. / Station operational status. |

---

#### Entidad: `Reporte` (`seismic_reports`)

| Campo / Field | Tipo / Type | Restricciones / Constraints | Descripción (ES / EN) |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, NOT NULL` | Identificador global único del reporte entrante. / Unique incoming report UUID. |
| `estacion_codigo` | `VARCHAR(32)` | `NOT NULL` | Código de la estación receptora. / Receiver station code. |
| `datos_raw` | `JSON` | `NOT NULL` | Telemetría sísmica cruda recibida en cola ($x, y, M, H$, timestamp). / Raw seismic telemetry. |
| `procesado` | `BOOLEAN` | `NOT NULL, DEFAULT FALSE` | Estado de procesamiento en la cola FIFO. / Processing state in FIFO queue. |

---

### 3. Script DDL Relacional (PostgreSQL Inmaculado)

```sql
-- Creación de Tablas Maestras y Operacionales SismoLab AVL
CREATE TABLE scenario_parameters (
    id INTEGER PRIMARY KEY DEFAULT 1,
    param_w_hours NUMERIC(5, 1) NOT NULL DEFAULT 48.0 CHECK (param_w_hours > 0),
    param_r_km NUMERIC(5, 1) NOT NULL DEFAULT 40.0 CHECK (param_r_km > 0),
    param_budget_l INTEGER NOT NULL DEFAULT 3 CHECK (param_budget_l >= 1),
    param_archive_t_hours NUMERIC(5, 1) NOT NULL DEFAULT 72.0 CHECK (param_archive_t_hours > 0)
);

CREATE TABLE stations (
    codigo VARCHAR(32) PRIMARY KEY NOT NULL,
    nombre VARCHAR(128) NOT NULL,
    x NUMERIC(5, 1) NOT NULL CHECK (x >= 0.0 AND x <= 1000.0),
    y NUMERIC(5, 1) NOT NULL CHECK (y >= 0.0 AND y <= 1000.0),
    activa BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE scenario_zones (
    id VARCHAR(32) PRIMARY KEY NOT NULL,
    nombre VARCHAR(128) NOT NULL,
    x_min NUMERIC(5, 1) NOT NULL CHECK (x_min >= 0.0 AND x_min <= 1000.0),
    x_max NUMERIC(5, 1) NOT NULL CHECK (x_max >= 0.0 AND x_max <= 1000.0 AND x_max > x_min),
    y_min NUMERIC(5, 1) NOT NULL CHECK (y_min >= 0.0 AND y_min <= 1000.0),
    y_max NUMERIC(5, 1) NOT NULL CHECK (y_max >= 0.0 AND y_max <= 1000.0 AND y_max > y_min),
    es_poblada BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE seismic_events (
    id INTEGER PRIMARY KEY NOT NULL CHECK (id >= 1 AND id <= 999999),
    prioridad INTEGER NOT NULL CHECK (prioridad IN (1, 2, 3)),
    magnitud NUMERIC(3, 1) NOT NULL CHECK (magnitud >= -2.0 AND magnitud <= 10.0),
    profundidad NUMERIC(4, 1) NOT NULL CHECK (profundidad >= 0.0 AND profundidad <= 700.0),
    x NUMERIC(5, 1) NOT NULL CHECK (x >= 0.0 AND x <= 1000.0),
    y NUMERIC(5, 1) NOT NULL CHECK (y >= 0.0 AND y <= 1000.0),
    estaciones_reportantes JSON NOT NULL,
    revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
    estado_atencion VARCHAR(16) NOT NULL CHECK (estado_atencion IN ('Pendiente', 'Revisado')),
    zona_poblada BOOLEAN NOT NULL DEFAULT FALSE,
    timestamp VARCHAR(32) NOT NULL,
    estado VARCHAR(16) NOT NULL CHECK (estado IN ('ACTIVO', 'ARCHIVADO', 'ELIMINADO')),
    es_replica BOOLEAN NOT NULL DEFAULT FALSE,
    evento_referencia_id INTEGER NULL REFERENCES seismic_events(id) ON DELETE SET NULL,
    candidatos_referencia JSON NOT NULL DEFAULT '[]',
    acceso_costoso BOOLEAN NOT NULL DEFAULT FALSE,
    costo_simulado INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE deleted_events_audit (
    id INTEGER PRIMARY KEY NOT NULL CHECK (id >= 1 AND id <= 999999),
    motivo VARCHAR(256) NULL,
    eliminado_en VARCHAR(32) NOT NULL
);

CREATE TABLE archived_events_repository (
    id INTEGER PRIMARY KEY NOT NULL CHECK (id >= 1 AND id <= 999999),
    evento_data JSON NOT NULL,
    archivado_en VARCHAR(32) NOT NULL
);

CREATE TABLE seismic_reports (
    id UUID PRIMARY KEY NOT NULL,
    estacion_codigo VARCHAR(32) NOT NULL REFERENCES stations(codigo) ON DELETE RESTRICT,
    datos_raw JSON NOT NULL,
    procesado BOOLEAN NOT NULL DEFAULT FALSE
);
```

---

### 4. Estructura de Persistencia JSON / JSON Persistence Schema

```json
{
  "version": "2.1",
  "exported_at": "2026-09-22T18:00:00Z",
  "reloj_simulacion": "2026-09-22T18:00:00Z",
  "parametros_escenario": {
    "param_w_hours": 48.0,
    "param_r_km": 40.0,
    "param_budget_l": 3,
    "param_archive_t_hours": 72.0
  },
  "avl_metadata": {
    "total_nodes": 4,
    "height": 3,
    "mode": "NORMAL",
    "is_balanced": true,
    "nodos_acceso_costoso": 0,
    "total_rotaciones": 3
  },
  "zones": [
    {
      "id": "ZONA-CENTRAL",
      "nombre": "Valle Central Metropolitano",
      "x_min": 400.0,
      "x_max": 650.0,
      "y_min": 400.0,
      "y_max": 650.0,
      "es_poblada": true
    }
  ],
  "events": [
    {
      "id": 1001,
      "prioridad": 3,
      "magnitud": 6.8,
      "profundidad": 12.5,
      "x": 450.0,
      "y": 520.0,
      "estaciones_reportantes": ["EST-CENTRO-01", "EST-SUR-02"],
      "revision": 1,
      "estado_atencion": "Pendiente",
      "zona_poblada": true,
      "timestamp": "2026-09-22T17:30:00Z",
      "estado": "ACTIVO",
      "es_replica": false,
      "evento_referencia_id": null,
      "candidatos_referencia": [],
      "acceso_costoso": false,
      "costo_simulado": 1,
      "composite_key": {
        "P": 3,
        "M": 6.8,
        "I": 1001
      }
    }
  ],
  "archived_events": [
    {
      "id": 505,
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
      "estado": "ARCHIVADO",
      "es_replica": false,
      "evento_referencia_id": null,
      "composite_key": {
        "P": 1,
        "M": 2.1,
        "I": 505
      }
    }
  ],
  "deleted_ids": [999, 1002],
  "topologia_arbol": {
    "clave": { "P": 3, "M": 6.8, "I": 1001 },
    "valor": { "id": 1001, "magnitud": 6.8, "prioridad": 3 },
    "altura": 0,
    "factor_balanceo": 0,
    "hijo_izquierdo": null,
    "hijo_derecho": null
  }
}
```

---

#### Entidad: `VersionPersistente` (`data/versions/{nombre}.json`)

| Campo / Field | Tipo / Type | Restricciones / Constraints | Descripción (ES / EN) |
| :--- | :--- | :--- | :--- |
| `nombre` | `VARCHAR(64)` | `PRIMARY KEY, NOT NULL` | Nombre identificador único de la versión persistente en disco. / Unique named version identifier. |
| `descripcion` | `VARCHAR(256)` | `NULLABLE` | Descripción contextual del snapshot o prueba operativa. / Contextual snapshot description. |
| `timestamp` | `VARCHAR(32)` | `NOT NULL, ISO-8601 UTC` | Fecha y hora UTC del momento en que se guardó la versión. / UTC creation timestamp. |
| `reloj_simulacion` | `VARCHAR(32)` | `NOT NULL, ISO-8601 UTC` | Valor del reloj de simulación congelado en el snapshot. / Frozen simulation clock. |
| `parametros` | `JSON` | `NOT NULL` | Valores de $W, R, L, T$ vigentes al momento de guardar. / Scenario parameters $W, R, L, T$. |
| `eventos_activos` | `JSON[]` | `NOT NULL` | Serialización completa de todos los eventos del árbol activo. / Complete active events array. |
| `eventos_archivados`| `JSON[]` | `NOT NULL` | Serialización de eventos en el histórico podado. / Archived events array. |
| `ids_eliminados` | `INTEGER[]` | `NOT NULL` | Conjunto inmutable de IDs retirados que no pueden reinsertarse. / Retired event IDs. |
| `cola_reportes` | `JSON[]` | `NOT NULL` | Estado secuencial exacto del buffer de telemetría FIFO. / FIFO report queue contents. |
| `topologia_arbol` | `JSON` | `NOT NULL` | Estructura jerárquica explícita del AVL con claves, alturas y factores de balance. / Explicit hierarchical AVL topology. |

---

### Entidad Física: `estaciones_monitoreo` (Red Telemétrica Nacional)

```sql
CREATE TABLE IF NOT EXISTS estaciones_monitoreo (
    codigo VARCHAR(32) PRIMARY KEY NOT NULL,
    nombre VARCHAR(128) NOT NULL,
    coord_x NUMERIC(6, 2) NOT NULL CHECK (coord_x >= 0.0 AND coord_x <= 1000.0),
    coord_y NUMERIC(6, 2) NOT NULL CHECK (coord_y >= 0.0 AND coord_y <= 1000.0),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

| Nombre de Columna | Tipo de Datos Exacto | Restricciones (PK, FK, NULL, etc.) | Regla de Negocio / Descripción Detallada |
| :--- | :--- | :--- | :--- |
| `codigo` | `VARCHAR(32)` | `PRIMARY KEY, NOT NULL` | Código único e inmutable de la estación (ej: `EST-MANIZALES-01`, mayúsculas). |
| `nombre` | `VARCHAR(128)` | `NOT NULL` | Denominación geográfica descriptiva y formal de la estación sismológica. |
| `coord_x` | `NUMERIC(6, 2)` | `NOT NULL, CHECK (coord_x BETWEEN 0.0 AND 1000.0)` | Posición cartesiana $X$ en kilómetros dentro del plano del escenario. |
| `coord_y` | `NUMERIC(6, 2)` | `NOT NULL, CHECK (coord_y BETWEEN 0.0 AND 1000.0)` | Posición cartesiana $Y$ en kilómetros dentro del plano del escenario. |
| `activo` | `BOOLEAN` | `NOT NULL, DEFAULT TRUE` | Indicador de disponibilidad operativa y recepción telemétrica activa. |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | Momento de registro de la estación en el catálogo de monitoreo. |

---

### Entidad Física: `departamentos_georreferenciados` (33 Departamentos de Colombia - `co.json`)

```sql
CREATE TABLE IF NOT EXISTS departamentos_georreferenciados (
    id VARCHAR(16) PRIMARY KEY NOT NULL,
    nombre VARCHAR(128) NOT NULL,
    color_relleno VARCHAR(32) NOT NULL,
    color_borde VARCHAR(32) NOT NULL,
    centroide_x NUMERIC(6, 2) NOT NULL CHECK (centroide_x >= 0.0 AND centroide_x <= 1000.0),
    centroide_y NUMERIC(6, 2) NOT NULL CHECK (centroide_y >= 0.0 AND centroide_y <= 1000.0),
    centroide_lat NUMERIC(8, 5) NOT NULL,
    centroide_lon NUMERIC(8, 5) NOT NULL,
    box_min_x NUMERIC(6, 2) NOT NULL,
    box_max_x NUMERIC(6, 2) NOT NULL,
    box_min_y NUMERIC(6, 2) NOT NULL,
    box_max_y NUMERIC(6, 2) NOT NULL,
    svg_path TEXT NOT NULL
);
```

| Nombre de Columna | Tipo de Datos Exacto | Restricciones | Regla de Negocio / Descripción Detallada |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(16)` | `PRIMARY KEY, NOT NULL` | Código ISO departamental estandarizado (ej: `COCAL` para Caldas). |
| `nombre` | `VARCHAR(128)` | `NOT NULL` | Nombre oficial del departamento (32 departamentos + Bogotá D.C.). |
| `color_relleno` | `VARCHAR(32)` | `NOT NULL` | Color temático RGBA asignado para visualización en mapa claro. |
| `color_borde` | `VARCHAR(32)` | `NOT NULL` | Color de delimitación fronteriza vectorial. |
| `centroide_x` | `NUMERIC(6, 2)` | `NOT NULL` | Coordenada $X$ cartesiana calibrada en kilómetros $[0, 1000]\text{ km}$. |
| `centroide_y` | `NUMERIC(6, 2)` | `NOT NULL` | Coordenada $Y$ cartesiana calibrada en kilómetros $[0, 1000]\text{ km}$. |
| `centroide_lat` | `NUMERIC(8, 5)` | `NOT NULL` | Latitud WGS84 del centroide geográfico. |
| `centroide_lon` | `NUMERIC(8, 5)` | `NOT NULL` | Longitud WGS84 del centroide geográfico. |
| `box_min_x` .. `box_max_y` | `NUMERIC(6, 2)` | `NOT NULL` | Delimitación matemática del Bounding Box que encierra al departamento. |
| `svg_path` | `TEXT` | `NOT NULL` | Camino vectorial SVG precalculado para renderizado acelerado $O(1)$. |

---

### Entidad: `zonas_urbanas_calibradas` (Ciudades y Zonas Pobladas Calibradas)

```sql
CREATE TABLE IF NOT EXISTS zonas_urbanas_calibradas (
    id VARCHAR(32) PRIMARY KEY NOT NULL,
    nombre VARCHAR(128) NOT NULL,
    ciudad VARCHAR(64) NOT NULL,
    departamento VARCHAR(64) NOT NULL,
    coord_x NUMERIC(6, 2) NOT NULL CHECK (coord_x >= 0.0 AND coord_x <= 1000.0),
    coord_y NUMERIC(6, 2) NOT NULL CHECK (coord_y >= 0.0 AND coord_y <= 1000.0),
    x_min NUMERIC(6, 2) NOT NULL,
    x_max NUMERIC(6, 2) NOT NULL,
    y_min NUMERIC(6, 2) NOT NULL,
    y_max NUMERIC(6, 2) NOT NULL,
    es_poblada BOOLEAN NOT NULL DEFAULT TRUE
);
```

| Nombre de Columna | Tipo de Datos Exacto | Restricciones | Regla de Negocio / Descripción Detallada |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(32)` | `PRIMARY KEY, NOT NULL` | Identificador único de zona urbana o rural (ej. `ZONA-MANIZALES`). |
| `nombre` | `VARCHAR(128)` | `NOT NULL` | Descripción formal de la zona en el escenario. |
| `ciudad` | `VARCHAR(64)` | `NOT NULL` | Nombre del centro urbano principal (ej. `Manizales`, `Pereira`, `Bogotá D.C.`). |
| `departamento` | `VARCHAR(64)` | `NOT NULL` | Departamento al que pertenece la zona. |
| `coord_x`, `coord_y` | `NUMERIC(6, 2)` | `NOT NULL` | Punto de referencia urbano exacto en kilómetros para el marcador del mapa. |
| `x_min` .. `y_max` | `NUMERIC(6, 2)` | `NOT NULL` | Límites rectangulares del bounding box de impacto para prioridad $P=3$. |
| `es_poblada` | `BOOLEAN` | `NOT NULL` | Define si el sismo superficial con $H \le 30\text{ km}$ asciende a prioridad alta $P=3$. |


