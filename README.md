# 🌋 SismoLab AVL - Guía de Instalación, Ejecución y Arquitectura
## Universidad de Caldas - Estructuras de Datos Avanzadas

---

### 📖 Descripción del Proyecto

**SismoLab AVL** es un sistema de monitoreo y gestión de eventos sísmicos en tiempo real desarrollado en **Python** y **React + Vite**. El sistema organiza y clasifica eventos sísmicos mediante una clave compuesta inmutable \(K = (P, M, I)\) (Prioridad, Magnitud e Identificador), garantizando tiempos de búsqueda e inserción logarítmicos \(O(\log n)\).

#### Patrones de Diseño y Arquitectura:
- **Domain-Driven Design (DDD):** Lógica del negocio aislada e independiente en `src/domain/`.
- **Vertical Slices (Cortes Verticales):** Funcionalidades organizadas autónomamente en `src/features/`.
- **Estructuras de Datos Puramente Recursivas:** 
  - **Árbol AVL:** Árbol auto-balanceado con operaciones de rotación (Normal y Modo Estrés).
  - **Árbol BST:** Árbol binario de búsqueda para comparación y benchmarking.
  - **Pila LIFO (Stack):** Historial de operaciones para la funcionalidad Deshacer (Undo).
  - **Cola FIFO (Queue):** Telemetría e ingesta secuencial de reportes sísmicos.
- **Frontend Interactivo:** Dashboard moderno en React + Vite para visualizar el árbol AVL, interactuar con los nodos y gestionar la alerta de sismos.

---

### ⚙️ Requisitos Previos

Asegúrate de contar con los siguientes entornos instalados en tu equipo antes de comenzar:

- **Python:** Versión **3.10**, **3.11** o **3.12** (Recomendado: Python 3.11+).
- **Node.js:** Versión **18.x** o superior (Recomendado: Node.js 20 LTS) y **npm**.
- **Git:** Para clonar el repositorio.

---

### 🚀 Instalación Paso a Paso

#### 1. Clonar el Repositorio
```bash
git clone https://github.com/DavidSolorza/SismoLabAVL.git
cd SismoLabAVL
```

#### 2. Configurar el Entorno Virtual de Python (Backend)

##### En Windows (PowerShell / CMD):
```powershell
# Crear el entorno virtual
python -m venv .venv

# Activar el entorno virtual (PowerShell)
.\.venv\Scripts\Activate.ps1

# O activar en CMD:
# .venv\Scripts\activate.bat
```

##### En Linux / macOS:
```bash
# Crear el entorno virtual
python3 -m venv .venv

# Activar el entorno virtual
source .venv/bin/activate
```

#### 3. Instalar Dependencias del Backend
Con el entorno virtual activado, instala las dependencias necesarias:
```bash
pip install -r requirements.txt
```

#### 4. Instalar Dependencias del Frontend (React + Vite)
Navega a la carpeta `frontend` e instala los paquetes de Node:
```bash
cd frontend
npm install
cd ..
```

---

### ▶️ Ejecución del Proyecto

#### Opción A: Ejecutar el Servidor Backend (API RESTful FastAPI)
Inicia la API backend para permitir la comunicación con el frontend o cliente HTTP:
```bash
uvicorn src.presentation.api.main:app --reload --port 8000
```
- **Servidor activo en:** `http://localhost:8000`
- **Documentación Interactiva (Swagger UI):** `http://localhost:8000/docs`
- **Documentación alternativa (ReDoc):** `http://localhost:8000/redoc`

#### Opción B: Ejecutar la Interfaz Web Frontend (Dashboard React)
En una nueva consola de terminal, navega al directorio del frontend e inicia el servidor de desarrollo:
```bash
cd frontend
npm run dev
```
- **Aplicación web disponible en:** `http://localhost:5173`

#### Opción C: Ejecutar la CLI Interactiva (Consola de Terminal)
Si prefieres interactuar directamente desde la terminal mediante consola de comandos:
```bash
python -m src.presentation.cli.main
```

---

### 🧪 Ejecución de Pruebas Automatizadas

Para validar que las estructuras de datos (AVL, BST, Pila, Cola) y las reglas de negocio funcionan correctamente:

```bash
# Ejecutar suite completa con Pytest
pytest tests/

# O ejecutar el script de pruebas unificado
python run_tests.py
```

---

### 📂 Estructura del Directorio

```
SismoLabAVL/
├── docs/                    # Especificaciones técnicas y gobernanza del proyecto
│   ├── 1_architecture.md    # Arquitectura DDD, Diagramas Mermaid y ADRs
│   ├── 2_database.md        # Diccionario de datos y modelo de persistencia JSON
│   └── 3_api_spec.md        # Especificación técnica detallada de la API REST
├── src/                     # Código fuente del Backend
│   ├── core/                # Bus de comandos, errores y cliente HTTP nativo
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
└── README.md                # Guía técnica de inicialización
```

---

### 📄 Documentación Adicional
Para más detalles sobre la arquitectura, el diseño de datos o la especificación de los endpoints RESTful, consulta la carpeta `docs/`:
- [docs/1_architecture.md](docs/1_architecture.md)
- [docs/2_database.md](docs/2_database.md)
- [docs/3_api_spec.md](docs/3_api_spec.md)
