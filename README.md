# SismoLab AVL - Observatorio Sísmico Inteligente / Intelligent Seismic Observatory
## Universidad de Caldas - Estructuras de Datos Avanzadas / Advanced Data Structures

---

### Descripción del Proyecto / Project Overview

**Español:**
**SismoLab AVL** es un sistema de monitoreo, clasificación y gestión de eventos sísmicos en tiempo real desarrollado en **Python (FastAPI + CLI)** y **React + Vite (Frontend)**. El sistema organiza y clasifica eventos sísmicos mediante una clave compuesta inmutable:
$$K = (P, M, I)$$
donde **$P$ es la Prioridad sísmica (1=Alta/Crítica, 2=Media, 3=Baja)**, **$M$ es la Magnitud numérica en escala Richter/Momentum**, e **$I$ es el Identificador numérico único (`SIS-XXXXXX`)**.

El Árbol AVL mantiene balance estricto mediante rotaciones simples (LL, RR) y dobles (LR, RL), operando bajo dos modalidades: **Modo Normal** (auto-balance inmediato en cada inserción) y **Modo Estrés** (inserción acelerada estilo BST con balanceo diferido). Para desacoplar el ordenamiento por prioridades del árbol de las búsquedas operativas por identificador, el sistema incorpora un **Hash Map auxiliar en memoria (`indice_por_id`)**, garantizando búsquedas por ID en tiempo constante $O(1)$ sin realizar recorridos exhaustivos $O(N)$.

**English:**
**SismoLab AVL** is a real-time seismic event monitoring, classification, and management system built with **Python (FastAPI + CLI)** and **React + Vite (Frontend)**. The system prioritizes and organizes seismic telemetry using an immutable composite key:
$$K = (P, M, I)$$
where **$P$ is Seismic Priority (1=High/Critical, 2=Medium, 3=Low)**, **$M$ is Seismic Magnitude**, and **$I$ is the Unique Numeric Identifier (`SIS-XXXXXX`)**.

The AVL Tree strictly preserves logarithmic height balance via single (LL, RR) and double (LR, RL) rotations, featuring two operational regimes: **Normal Mode** (immediate recursive auto-balancing) and **Stress Mode** (accelerated BST insertion with deferred rebalancing). To decouple priority tree ordering from operational lookups by event ID, the system integrates an **in-memory auxiliary Hash Map (`indice_por_id`)**, achieving guaranteed $O(1)$ constant-time ID retrieval without costly $O(N)$ tree scans.

---

### Lógica Numérica de la Clave Compuesta / Composite Key Ordering Logic

**Regla Lexicográfica de 3 Niveles / 3-Level Lexicographical Rule:**
$$K_1 < K_2 \iff (P_1 < P_2) \lor (P_1 = P_2 \land M_1 < M_2) \lor (P_1 = P_2 \land M_1 = M_2 \land I_1 < I_2)$$

1. **Prioridad ($P$):** La prioridad manda sobre todo lo demás. Si el Sismo A tiene Prioridad 1 (Alta) y el Sismo B tiene Prioridad 2 (Media), el Sismo A es numéricamente menor ($1 < 2$) y se ubica estrictamente a la **izquierda** en el árbol AVL.
2. **Magnitud ($M$):** Si las prioridades empatan (ej. ambos son Prioridad 1), se compara la magnitud numérica. La menor magnitud va a la izquierda.
3. **Identificador ($I$):** Si prioridad y magnitud empatan, el menor ID numérico único desempata y va a la izquierda.

**Búsqueda en Tiempo $O(1)$ por Identificador / $O(1)$ ID Search:**
Al estar el AVL ordenado por Prioridad y Magnitud, recorrer el árbol por ID requeriría tiempo lineal $O(N)$. Por ello, el árbol mantiene una tabla hash auxiliar:
```python
self.indice_por_id = { id_entero: referencia_al_nodo_avl }
```
Cada inserción, eliminación o rebalanceo sincroniza este índice, permitiendo consultar cualquier nodo por su ID en tiempo promedio $O(1)$.

---

### Requisitos Previos / Prerequisites

- **Python:** Version **3.10**, **3.11** o **3.12** (Recomendado: Python 3.11+).
- **Node.js:** Version **18.x** o superior (Recomendado: Node.js 20 LTS) y **npm**.
- **Git:** Para clonar el repositorio.

---

### Instalación Paso a Paso / Step-by-Step Setup

#### 1. Clonar el Repositorio / Clone Repository
```bash
git clone https://github.com/DavidSolorza/SismoLabAVL.git
cd SismoLabAVL
```

#### 2. Entorno Virtual de Python / Python Virtual Environment
##### En Windows (PowerShell):
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```
##### En Linux / macOS:
```bash
python3 -m venv .venv
source .venv/bin/activate
```

#### 3. Instalar Dependencias del Backend / Install Backend Dependencies
```bash
pip install -r requirements.txt
```

#### 4. Instalar Dependencias del Frontend / Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

---

### Ejecución del Sistema / Running the System

#### Opción 1: Servidor Backend FastAPI / FastAPI Backend Server
Inicia la API RESTful de alto rendimiento:
```bash
python -m uvicorn src.presentation.api.main:app --reload --port 8000
```
- **API URL:** `http://127.0.0.1:8000`
- **Documentación Swagger UI:** `http://127.0.0.1:8000/docs`
- **Documentación ReDoc:** `http://127.0.0.1:8000/redoc`

#### Opción 2: Frontend Web Interactivo / Interactive Web Frontend
En una nueva terminal, inicia el servidor de desarrollo Vite:
```bash
cd frontend
npm run dev
```
- **Dashboard Web:** `http://127.0.0.1:5173`

#### Opción 3: Consola CLI Interactiva / Interactive CLI Console
Para interactuar directamente desde la terminal con todas las operaciones del backend:
```bash
python -m src.presentation.cli.main
```

---

### Interfaz Web: Organización en Tres Bloques Funcionales / UI 3-Block Architecture

La barra superior del visualizador web implementa una arquitectura desacoplada en tres cápsulas flotantes sin emojis (solo iconos vectoriales Lucide):

| Bloque / Block | Controles Agrupados / Grouped Controls | Propósito Funcional / Functional Purpose |
| :--- | :--- | :--- |
| **Izquierdo / Left** | Logo institucional, Estado Operacional (`NORMAL` / `ESTRÉS`), Métricas en vivo (`AVL: h=... · BST: h=...`) | Identidad institucional y supervisión instantánea del estado de balance. |
| **Central / Center** | Reloj de simulación UTC con botón de recarga/avance, selector de vistas (`Ambos Dual`, `Solo AVL`, `Solo BST`), barra de búsqueda global | Dimensión temporal y filtrado interactivo sobre la estructura de datos. |
| **Derecho / Right** | `Deshacer` (Pila LIFO), `Sismos Predefinidos` (Catálogo Colombiano), `+ Nuevo Sismo` (Botón Primario) | Ingesta transaccional de eventos y reversión segura de operaciones. |

---

### Suite de Pruebas Automatizadas / Automated Test Suite

Para ejecutar las 7 baterías de pruebas unitarias y de invariantes (100% aprobadas):
```bash
python run_tests.py
```

Baterías verificadas:
1. `[1/7]` Ordenamiento estricto de Clave Compuesta $K=(P, M, I)$ (regla de tres niveles).
2. `[2/7]` Búsqueda $O(1)$ e invariantes de sincronización del índice hash en memoria (`indice_por_id`).
3. `[3/7]` Inserción recursiva, factores de balanceo $|FB| \le 1$ y rotaciones del Árbol AVL.
4. `[4/7]` Modo Estrés y balanceo diferido global post-emergencia.
5. `[5/7]` Cortes verticales: creación de eventos, corrección y reversión en Pila LIFO.
6. `[6/7]` Cortes verticales: procesamiento de cola FIFO de telemetría y poda de ramas por prioridad.
7. `[7/7]` Reloj de simulación explícito en UTC y rechazo de eventos futuros.

---

### Estructura del Directorio / Directory Layout

```
SismoLabAVL/
├── docs/                    # Especificaciones técnicas y gobernanza del proyecto
│   ├── 1_architecture.md    # Arquitectura DDD, Diagramas Mermaid y ADRs (ADR-001 a ADR-004)
│   ├── 2_database.md        # Diccionario de datos y modelo de persistencia JSON
│   └── 3_api_spec.md        # Especificación técnica detallada de la API REST
├── src/                     # Código fuente del Backend
│   ├── core/                # Bus de comandos, errores y configuraciones
│   ├── domain/              # Entidades, Value Objects, Reglas y Estructuras (AVL, BST, Stack, Queue)
│   ├── features/            # Cortes verticales por caso de uso (Crear, Corregir, Procesar, Deshacer, Archivar)
│   ├── infrastructure/      # Auditoría estructural del AVL y persistencia JSON/Memoria
│   └── presentation/        # API FastAPI (`api/`) y Consola CLI (`cli/`)
├── frontend/                # Aplicación Web Frontend (React + Vite + Vanilla CSS)
│   ├── src/                 # Componentes React, Visualizador AVL y Servicios API
│   ├── package.json
│   └── vite.config.js
├── tests/                   # Pruebas unitarias e integración de estructuras AVL
├── requirements.txt         # Dependencias backend de Python
├── run_tests.py             # Script ejecutor de pruebas
└── README.md                # Guía técnica de inicialización bilingüe
```
