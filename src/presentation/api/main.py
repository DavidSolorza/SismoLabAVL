# -*- coding: utf-8 -*-
"""
FastAPI REST Application Entrypoint / Aplicación REST Principal FastAPI
SismoLab AVL - Universidad de Caldas

Expone los endpoints HTTP RESTful para todos los cortes verticales (Vertical Slices),
métricas del AVL y gestión de modos operacionales (Normal / Estrés).
Exposes RESTful HTTP endpoints for all Vertical Slices, AVL metrics,
and operational mode management (Normal / Stress).
"""

from fastapi import FastAPI, HTTPException, status
from typing import Dict, Any, List

from src.core.config.settings import settings, OperationalMode
from src.core.bus.command_bus import global_command_bus
from src.core.errors.exceptions import SismoLabException

from src.features.crear_evento.dto import CrearEventoDTO
from src.features.crear_evento.command import CrearEventoCommand, CrearEventoHandler

from src.features.corregir_evento.dto import CorregirEventoDTO
from src.features.corregir_evento.command import CorregirEventoCommand, CorregirEventoHandler

from src.features.procesar_reporte.command import EncolarReporteDTO, ProcesarReporteCommand, ProcesarReporteHandler

from src.features.deshacer_accion.command import DeshacerAccionCommand, DeshacerAccionHandler

from src.features.archivar_rama.dto import ArchivarRamaDTO
from src.features.archivar_rama.command import ArchivarRamaCommand, ArchivarRamaHandler

from src.infrastructure.persistence.in_memory_store import store
from src.infrastructure.audit.avl_auditor import AVLAuditor
from src.infrastructure.persistence.json_repository import JSONRepository
from src.domain.entities.report import SeismicReport
from src.domain.constants.predefined_events import PREDEFINED_EVENTS

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="API RESTful de SismoLab AVL - Universidad de Caldas (DDD, Vertical Slicing & Clean Architecture)"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r"^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# REGISTRO DE HANDLERS EN EL BUS / HANDLER REGISTRATION
# --------------------------------------------------
global_command_bus.register(CrearEventoCommand, CrearEventoHandler().handle)
global_command_bus.register(CorregirEventoCommand, CorregirEventoHandler().handle)
global_command_bus.register(ProcesarReporteCommand, ProcesarReporteHandler().handle)
global_command_bus.register(DeshacerAccionCommand, DeshacerAccionHandler().handle)
global_command_bus.register(ArchivarRamaCommand, ArchivarRamaHandler().handle)


# --------------------------------------------------
# ENDPOINTS RESTFUL / REST ENDPOINTS
# --------------------------------------------------

@app.get("/", tags=["Info"])
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.VERSION,
        "organization": settings.ORGANIZATION,
        "status": "OPERACIONAL"
    }


@app.post("/api/v1/eventos", status_code=status.HTTP_201_CREATED, tags=["Vertical Slices"])
def crear_evento(dto: CrearEventoDTO):
    """Slice Vertical: Crear Evento Sísmico en el AVL / Create Seismic Event"""
    try:
        command = CrearEventoCommand(dto)
        return global_command_bus.dispatch(command)
    except SismoLabException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"code": e.code, "message": e.message})


@app.put("/api/v1/eventos/{event_id}/corregir", tags=["Vertical Slices"])
def corregir_evento(event_id: int, nueva_magnitud: float, nueva_profundidad: float, razon: str = "Recalibración"):
    """Slice Vertical: Corregir Evento Sísmico en caliente / Correct Seismic Event"""
    try:
        dto = CorregirEventoDTO(
            event_id=event_id,
            nueva_magnitud=nueva_magnitud,
            nueva_profundidad=nueva_profundidad,
            razon=razon
        )
        command = CorregirEventoCommand(dto)
        return global_command_bus.dispatch(command)
    except SismoLabException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND if e.code == "EVENT_NOT_FOUND" else 400, detail={"code": e.code, "message": e.message})


@app.post("/api/v1/reportes/encolar", tags=["Telemetry Queue"])
def encolar_reporte(dto: EncolarReporteDTO):
    """Encola un reporte sísmico entrante en la Cola FIFO / Enqueues telemetry report"""
    reporte = SeismicReport(station_code=dto.station_code, raw_data=dto.model_dump())
    store.report_queue.enqueue(reporte)
    return {
        "success": True,
        "message": f"Reporte {reporte.id} encolado exitosamente.",
        "cola_size": store.report_queue.size()
    }


@app.post("/api/v1/reportes/procesar", tags=["Vertical Slices"])
def procesar_reporte():
    """Slice Vertical: Desencola y procesa reporte de la Cola FIFO hacia el AVL / Process Telemetry Queue"""
    try:
        command = ProcesarReporteCommand()
        return global_command_bus.dispatch(command)
    except SismoLabException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"code": e.code, "message": e.message})


@app.post("/api/v1/sistema/deshacer", tags=["Vertical Slices"])
def deshacer_accion():
    """Slice Vertical: Desapila y revierte la última acción de la Pila LIFO / Undo Last Action"""
    try:
        command = DeshacerAccionCommand()
        return global_command_bus.dispatch(command)
    except SismoLabException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"code": e.code, "message": e.message})


@app.post("/api/v1/avl/archivar-rama", tags=["Vertical Slices"])
def archivar_rama(dto: ArchivarRamaDTO):
    """Slice Vertical: Podar subárboles AVL y archivar eventos por prioridad / Archive & Prune Branch"""
    try:
        command = ArchivarRamaCommand(dto)
        return global_command_bus.dispatch(command)
    except SismoLabException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"code": e.code, "message": e.message})


@app.post("/api/v1/sistema/limpiar", tags=["Maintenance"])
def limpiar_arbol_total(cargar_muestras: bool = False):
    """Limpia y resetea totalmente el árbol AVL, BST, cola de telemetría y pila de deshacer"""
    store.clear_all(load_samples=cargar_muestras)
    return {
        "success": True,
        "message": "Árbol AVL y estado del sistema limpiados totalmente.",
        "total_nodos": store.avl_tree.contar_nodos()
    }


@app.get("/api/v1/eventos", tags=["Queries"])
def listar_eventos_ordenados():
    """Retorna los eventos ordenados por la Clave Compuesta K=(P, M, I) mediante recorrido Inorden en el AVL"""
    eventos = store.avl_tree.recorrido_inorden()
    return {
        "total": len(eventos),
        "eventos": [e.to_dict() for e in eventos]
    }


@app.get("/api/v1/eventos/predefinidos", tags=["Queries"])
def listar_eventos_predefinidos():
    """Retorna el catálogo de eventos sísmicos de prueba predefinidos con parámetros colombianos"""
    return {
        "success": True,
        "total": len(PREDEFINED_EVENTS),
        "predefinidos": PREDEFINED_EVENTS
    }


@app.get("/api/v1/avl/arbol-jerarquico", tags=["Queries"])
def obtener_arbol_jerarquico():
    """Retorna la estructura jerárquica recursiva del Árbol AVL (Raíz, Hijos Izq/Der, Alturas y FB)"""
    return {
        "success": True,
        "arbol": store.avl_tree.to_dict_jerarquico()
    }


@app.get("/api/v1/avl/metricas", tags=["Audit & Metrics"])
def obtener_metricas_avl():
    """Retorna métricas de altura, factor de balanceo e invariantes comparados contra BST"""
    return {
        "success": True,
        "data": AVLAuditor.get_metrics()
    }


@app.post("/api/v1/avl/modo", tags=["Operating Modes"])
def cambiar_modo_operacional(modo: OperationalMode):
    """Cambia el modo operacional del AVL entre NORMAL (auto-balance inmediato) y STRESS (balance diferido)"""
    store.avl_tree.set_modo(modo)
    return {
        "success": True,
        "nuevo_modo": store.avl_tree.modo.value,
        "mensaje": "Modo cambiado exitosamente."
    }
