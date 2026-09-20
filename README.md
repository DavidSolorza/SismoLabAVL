# 🌋 SismoLab AVL - Backend Architecture & Technical Guide
## Universidad de Caldas - Estructuras de Datos Avanzadas

---

### 📖 Descripción / Description

**Español:**
**SismoLab AVL** es un sistema backend de ingeniería de software avanzado desarrollado en Python puro para la Universidad de Caldas. El sistema gestiona en tiempo real eventos sísmicos organizados por una clave compuesta inmutable $K = (P, M, I)$ (Prioridad, Magnitud e Identificador).

Combina los siguientes patrones y principios:
- **Domain-Driven Design (DDD):** Isolamiento del dominio puro (Entidades, Value Objects, Reglas).
- **Vertical Slicing (Cortes Verticales):** Separación autónoma por caso de uso en `src/features/`.
- **Programación por Capas (Clean Architecture):** Presentación, Aplicación, Dominio e Infraestructura.
- **Bus de Servicios (Command / Event Bus):** Despachador desacoplado in-memory.
- **Estructuras de Datos Puramente Recursivas:** Árbol AVL (Modo Normal y Modo Estrés), Árbol BST para benchmarking, Pila LIFO para deshacer comandos (Undo), y Cola FIFO para recepción de telemetría.
- **Gobernanza Técnica Estricta:** Documentación bilingüe en `docs/` (`1_architecture.md`, `2_database.md`, `3_api_spec.md`).

**English:**
**SismoLab AVL** is an advanced software engineering backend system developed in pure Python for Universidad de Caldas. The system manages real-time seismic events organized by an immutable composite key $K = (P, M, I)$ (Priority, Magnitude, Identifier).

It combines the following architectural patterns:
- **Domain-Driven Design (DDD):** Pure domain isolation (Entities, Value Objects, Rules).
- **Vertical Slicing:** Autonomous use-case slices located in `src/features/`.
- **Clean Architecture:** Presentation, Application, Domain, and Infrastructure.
- **Service Bus (Command / Event Bus):** Decoupled in-memory dispatcher.
- **Purely Recursive Data Structures:** AVL Tree (Normal Mode and Stress Mode), BST Tree for benchmarking, LIFO Stack for Undo operations, and FIFO Queue for telemetry ingestion.

---

### 🚀 Inicialización y Ejecución / Quickstart Guide

#### 1. Instalación de Dependencias / Install Dependencies
```bash
pip install -r requirements.txt
```

#### 2. Ejecutar la Aplicación CLI Interactiva / Run Interactive CLI Application
```bash
python -m src.presentation.cli.main
```

#### 3. Ejecutar el Servidor API RESTful FastAPI / Run FastAPI Server
```bash
uvicorn src.presentation.api.main:app --reload --port 8000
```
- Documentación Swagger UI disponible en: `http://127.0.0.1:8000/docs`

#### 4. Ejecutar la Suite de Pruebas Automatizadas / Run Automated Tests
```bash
pytest tests/
```

---

### 📂 Estructura del Proyecto / Project Directory Tree

```
primerProyecto/
├── docs/
│   ├── 1_architecture.md    # Arquitectura, Diagramas Mermaid y ADRs (ES/EN)
│   ├── 2_database.md        # Diccionario de datos y modelo de persistencia JSON (ES/EN)
│   └── 3_api_spec.md        # Especificación RESTful de la API (ES/EN)
├── src/
│   ├── core/
│   │   ├── bus/             # Command & Query Bus Dispatcher
│   │   ├── config/          # Configuración del sistema
│   │   ├── errors/          # Jerarquía de Excepciones
│   │   └── http/            # Cliente HTTP Nativo (Cero SDKs comerciales)
│   ├── domain/
│   │   ├── entities/        # EventoSismico, Estacion, Reporte
│   │   ├── value_objects/   # CompositeKeyK(P, M, I), Coordenadas
│   │   ├── structures/      # AVL, BST, Stack (Pila), Queue (Cola)
│   │   └── rules.py         # Reglas de prioridad sísmica
│   ├── features/            # Cortes Verticales (Vertical Slices)
│   │   ├── crear_evento/
│   │   ├── corregir_evento/
│   │   ├── procesar_reporte/
│   │   ├── deshacer_accion/
│   │   └── archivar_rama/
│   ├── infrastructure/
│   │   ├── persistence/     # Almacenamiento en memoria y adaptadores JSON
│   │   └── audit/           # Auditoría estructural del AVL y métricas
│   └── presentation/
│       ├── api/             # FastAPI REST Server
│       └── cli/             # CLI Interactiva de Consola
├── tests/                   # Suite de pruebas Pytest
├── requirements.txt
└── README.md
```
