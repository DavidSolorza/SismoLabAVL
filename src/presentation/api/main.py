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
from typing import Dict, Any, List, Optional

from src.core.config.settings import settings, OperationalMode
from src.core.bus.command_bus import global_command_bus
from src.core.errors.exceptions import SismoLabException

from src.features.crear_evento.dto import CrearEventoDTO
from src.features.crear_evento.command import CrearEventoCommand, CrearEventoHandler

from src.features.corregir_evento.dto import CorregirEventoDTO
from src.features.corregir_evento.command import CorregirEventoCommand, CorregirEventoHandler

from src.features.revisar_evento.command import RevisarEventoCommand, RevisarEventoHandler
from src.features.consultar_evento.query import ConsultarEventoQuery, ConsultarEventoHandler
from src.features.eliminar_evento.command import EliminarEventoCommand, EliminarEventoHandler

from src.features.procesar_reporte.command import EncolarReporteDTO, ProcesarReporteCommand, ProcesarReporteHandler

from src.features.deshacer_accion.command import DeshacerAccionCommand, DeshacerAccionHandler

from src.features.archivar_rama.dto import ArchivarRamaDTO
from src.features.archivar_rama.command import (
    ArchivarRamaCommand, ArchivarRamaHandler,
    PrevisualizarArchivoRamaQuery, PrevisualizarArchivoRamaHandler
)

from src.features.gestionar_parametros.dto import ActualizarParametrosDTO
from src.features.gestionar_parametros.command import (
    ConsultarParametrosQuery, ConsultarParametrosHandler,
    ActualizarParametrosCommand, ActualizarParametrosHandler
)

from src.features.gestion_reloj.dto import FijarRelojDTO, AvanzarRelojDTO, RelojRespuestaDTO
from src.features.gestion_reloj.command import (
    FijarRelojCommand, FijarRelojHandler,
    AvanzarRelojCommand, AvanzarRelojHandler
)

from src.features.consultar_analisis.queries import (
    ConsultarPrimerosKPendientesQuery, ConsultarPrimerosKPendientesHandler,
    ConsultarPorRangoMagnitudQuery, ConsultarPorRangoMagnitudHandler,
    ConsultarPorProfundidadYFechasQuery, ConsultarPorProfundidadYFechasHandler,
    ConsultarAsociacionesEventoQuery, ConsultarAsociacionesEventoHandler,
    ConsultarAccesoCostosoQuery, ConsultarAccesoCostosoHandler
)
from src.features.consultar_analisis.benchmark_query import (
    EjecutarBenchmarkComparativoQuery, EjecutarBenchmarkComparativoHandler
)
from src.features.gestionar_escenario.exportar_command import (
    ExportarEscenarioCommand, ExportarEscenarioHandler
)
from src.features.gestionar_escenario.importar_inserciones_command import (
    ImportarInsercionesCommand, ImportarInsercionesHandler
)
from src.features.gestionar_escenario.importar_topologia_command import (
    ImportarTopologiaCommand, ImportarTopologiaHandler
)
from src.features.gestionar_versiones.guardar_version_command import (
    GuardarVersionCommand, GuardarVersionHandler
)
from src.features.gestionar_versiones.listar_versiones_query import (
    ListarVersionesQuery, ListarVersionesHandler
)
from src.features.gestionar_versiones.restaurar_version_command import (
    RestaurarVersionCommand, RestaurarVersionHandler
)
from src.features.auditar_estructura.audit_feature import (
    VerificarEstructuraQuery, VerificarEstructuraHandler,
    ConsultarIndicadoresCompletosQuery, ConsultarIndicadoresCompletosHandler,
    ResetearContadoresRotacionCommand, ResetearContadoresRotacionHandler
)
from src.infrastructure.persistence.version_repository import version_repo

from src.infrastructure.persistence.in_memory_store import store
from src.infrastructure.audit.avl_auditor import AVLAuditor
from src.infrastructure.persistence.json_repository import JSONRepository
from src.features.gestionar_estaciones.dto import CrearEstacionDTO
from src.features.gestionar_estaciones.command import (
    CrearEstacionCommand, CrearEstacionHandler,
    ListarEstacionesQuery, ListarEstacionesHandler
)
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
global_command_bus.register(ConsultarEventoQuery, ConsultarEventoHandler().handle)
global_command_bus.register(EliminarEventoCommand, EliminarEventoHandler().handle)
global_command_bus.register(ProcesarReporteCommand, ProcesarReporteHandler().handle)
global_command_bus.register(DeshacerAccionCommand, DeshacerAccionHandler().handle)
global_command_bus.register(ArchivarRamaCommand, ArchivarRamaHandler().handle)
global_command_bus.register(PrevisualizarArchivoRamaQuery, PrevisualizarArchivoRamaHandler().handle)
global_command_bus.register(ConsultarParametrosQuery, ConsultarParametrosHandler().handle)
global_command_bus.register(ActualizarParametrosCommand, ActualizarParametrosHandler().handle)
global_command_bus.register(RevisarEventoCommand, RevisarEventoHandler().handle)
global_command_bus.register(FijarRelojCommand, FijarRelojHandler().handle)
global_command_bus.register(AvanzarRelojCommand, AvanzarRelojHandler().handle)

# Secciones 11 a 14
global_command_bus.register(ConsultarPrimerosKPendientesQuery, ConsultarPrimerosKPendientesHandler().handle)
global_command_bus.register(ConsultarPorRangoMagnitudQuery, ConsultarPorRangoMagnitudHandler().handle)
global_command_bus.register(ConsultarPorProfundidadYFechasQuery, ConsultarPorProfundidadYFechasHandler().handle)
global_command_bus.register(ConsultarAsociacionesEventoQuery, ConsultarAsociacionesEventoHandler().handle)
global_command_bus.register(ConsultarAccesoCostosoQuery, ConsultarAccesoCostosoHandler().handle)
global_command_bus.register(EjecutarBenchmarkComparativoQuery, EjecutarBenchmarkComparativoHandler().handle)
global_command_bus.register(ExportarEscenarioCommand, ExportarEscenarioHandler().handle)
global_command_bus.register(ImportarInsercionesCommand, ImportarInsercionesHandler().handle)
global_command_bus.register(ImportarTopologiaCommand, ImportarTopologiaHandler().handle)
global_command_bus.register(GuardarVersionCommand, GuardarVersionHandler().handle)
global_command_bus.register(ListarVersionesQuery, ListarVersionesHandler().handle)
global_command_bus.register(RestaurarVersionCommand, RestaurarVersionHandler().handle)
global_command_bus.register(VerificarEstructuraQuery, VerificarEstructuraHandler().handle)
global_command_bus.register(ConsultarIndicadoresCompletosQuery, ConsultarIndicadoresCompletosHandler().handle)
global_command_bus.register(ResetearContadoresRotacionCommand, ResetearContadoresRotacionHandler().handle)
global_command_bus.register(CrearEstacionCommand, CrearEstacionHandler().handle)
global_command_bus.register(ListarEstacionesQuery, ListarEstacionesHandler().handle)


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


@app.get("/api/v1/eventos/predefinidos", tags=["Queries"])
def listar_eventos_predefinidos():
    """Retorna el catálogo de eventos sísmicos de prueba predefinidos con parámetros colombianos"""
    return {
        "success": True,
        "total": len(PREDEFINED_EVENTS),
        "predefinidos": PREDEFINED_EVENTS
    }


@app.get("/api/v1/eventos/{event_id}", tags=["Vertical Slices"])
def consultar_evento(event_id: int):
    """Slice Vertical: Consultar Evento por ID en O(1) con métricas de nodo / Query Event by ID"""
    try:
        query = ConsultarEventoQuery(event_id)
        return global_command_bus.dispatch(query)
    except SismoLabException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND if e.code == "EVENT_NOT_FOUND" else 400, detail={"code": e.code, "message": e.message})


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


@app.put("/api/v1/eventos/{event_id}/revisar", tags=["Vertical Slices"])
def revisar_evento(event_id: int):
    """Slice Vertical: Marcar Evento Sísmico como 'Revisado' / Mark Event as Reviewed"""
    try:
        command = RevisarEventoCommand(event_id)
        return global_command_bus.dispatch(command)
    except SismoLabException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND if e.code == "EVENT_NOT_FOUND" else 400, detail={"code": e.code, "message": e.message})


@app.delete("/api/v1/eventos/{event_id}", tags=["Vertical Slices"])
def eliminar_evento(event_id: int):
    """Slice Vertical: Eliminación Individual de Evento Sísmico / Delete Event from AVL"""
    try:
        command = EliminarEventoCommand(event_id)
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


@app.get("/api/v1/avl/archivar-rama/previsualizar", tags=["Vertical Slices"])
def previsualizar_archivo_rama(t_horas: Optional[float] = None):
    """Slice Vertical: Previsualiza el subárbol elegible para archivo con su justificación algorítmica (Sección 10)"""
    query = PrevisualizarArchivoRamaQuery(t_horas=t_horas)
    return global_command_bus.dispatch(query)


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


# --------------------------------------------------
# ENDPOINTS RELOJ DE SIMULACIÓN / SIMULATION CLOCK
# --------------------------------------------------

@app.get("/api/v1/escenario/reloj", tags=["Escenario & Reloj"])
def obtener_reloj_simulacion():
    """Retorna el reloj de simulación explícito del escenario en formato UTC ISO 8601"""
    clock_dt = store.get_simulation_clock()
    return {
        "success": True,
        "reloj": store.get_simulation_clock_iso(),
        "timestamp_epoch": int(clock_dt.timestamp())
    }


@app.put("/api/v1/escenario/reloj", tags=["Escenario & Reloj"])
def fijar_reloj_simulacion(dto: FijarRelojDTO):
    """Fija manualmente la fecha y hora del reloj de simulación en UTC ISO 8601"""
    try:
        command = FijarRelojCommand(dto)
        return global_command_bus.dispatch(command)
    except SismoLabException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"code": e.code, "message": e.message})


@app.post("/api/v1/escenario/reloj/avanzar", tags=["Escenario & Reloj"])
def avanzar_reloj_simulacion(dto: AvanzarRelojDTO):
    """Avanza manualmente el reloj de simulación por minutos, horas o días"""
    try:
        command = AvanzarRelojCommand(dto)
        return global_command_bus.dispatch(command)
    except SismoLabException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"code": e.code, "message": e.message})


@app.get("/api/v1/sistema/estado-completo", tags=["Queries"])
def obtener_estado_completo_sistema():
    """Retorna en una sola petición HTTP atómica: reloj de simulación, métricas de auditoría, lista de eventos ordenados con antigüedad, árbol AVL jerárquico y árbol BST jerárquico"""
    current_clock = store.get_simulation_clock()
    eventos = store.avl_tree.recorrido_inorden()
    return {
        "success": True,
        "reloj_simulacion": store.get_simulation_clock_iso(),
        "metricas": AVLAuditor.get_metrics(),
        "eventos": [e.to_dict(current_clock=current_clock) for e in eventos],
        "avl_tree": store.avl_tree.to_dict_jerarquico(),
        "bst_tree": store.bst_tree.to_dict_jerarquico(),
        "zonas": [z.to_dict() for z in store.zones],
        "cola_size": store.report_queue.size()
    }


@app.get("/api/v1/escenario/zonas", tags=["Escenario & Zonas"])
def listar_zonas_escenario():
    """Retorna las zonas rectangulares fijas del escenario en el plano [0, 1000] km"""
    return {
        "success": True,
        "total": len(store.zones),
        "zonas": [z.to_dict() for z in store.zones]
    }


@app.get("/api/v1/eventos", tags=["Queries"])
def listar_eventos_ordenados():
    """Retorna los eventos ordenados por la Clave Compuesta K=(P, M, I) mediante recorrido Inorden en el AVL"""
    eventos = store.avl_tree.recorrido_inorden()
    return {
        "total": len(eventos),
        "eventos": [e.to_dict() for e in eventos]
    }



@app.get("/api/v1/avl/arbol-jerarquico", tags=["Queries"])
def obtener_arbol_jerarquico():
    """Retorna la estructura jerárquica recursiva del Árbol AVL (Raíz, Hijos Izq/Der, Alturas y FB)"""
    return {
        "success": True,
        "arbol": store.avl_tree.to_dict_jerarquico()
    }


@app.get("/api/v1/bst/arbol-jerarquico", tags=["Queries"])
def obtener_arbol_bst_jerarquico():
    """Retorna la estructura jerárquica recursiva del Árbol BST estándar (sin balancear)"""
    return {
        "success": True,
        "arbol": store.bst_tree.to_dict_jerarquico()
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


@app.post("/api/v1/avl/recuperar-estres", tags=["Operating Modes"])
def recuperar_balance_estres():
    """Ejecuta la recuperación global del balance AVL tras modo estrés reportando rotaciones y costo (Sección 8)"""
    res = store.avl_tree.recuperar_balance_modo_estres()
    store.avl_tree.actualizar_marcas_acceso_costoso(store.param_budget_l)
    return {
        "success": res["success"],
        "message": f"Recuperación global de balance completada con {res['rotaciones_aplicadas']} rotaciones aplicadas.",
        "data": res
    }


# --------------------------------------------------
# ENDPOINTS PARÁMETROS DEL ESCENARIO (W, R, L, T)
# --------------------------------------------------

@app.get("/api/v1/escenario/parametros", tags=["Escenario & Parámetros"])
def obtener_parametros_escenario():
    """Retorna los parámetros configurables del escenario sísmico (W, R, L, T)"""
    query = ConsultarParametrosQuery()
    return global_command_bus.dispatch(query)


@app.put("/api/v1/escenario/parametros", tags=["Escenario & Parámetros"])
def actualizar_parametros_escenario(dto: ActualizarParametrosDTO):
    """Actualiza los parámetros configurables del escenario (W, R, L, T) y actualiza réplicas y presupuesto"""
    try:
        command = ActualizarParametrosCommand(dto)
        return global_command_bus.dispatch(command)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# --------------------------------------------------
# ENDPOINT RÁFAGA DE PRUEBA MIXTA (SECCIÓN 8)
# --------------------------------------------------

@app.post("/api/v1/reportes/rafaga-prueba", tags=["Telemetry Queue"])
def generar_rafaga_prueba():
    """
    Encola una ráfaga con la mezcla obligatoria de la Sección 8:
    1. Nuevos eventos (Altas)
    2. Confirmación con misma revisión e idénticos datos
    3. Conflicto con misma revisión y datos distintos
    4. Reporte antiguo descartado (revisión menor)
    5. Corrección de evento existente que altera su clave K
    """
    # 1. Alta: sismo nuevo 2001 en Manizales
    rep1 = SeismicReport(
        station_code="EST-MANIZALES-01",
        raw_data={
            "event_id": 2001,
            "magnitud": 5.8,
            "profundidad": 12.0,
            "revision": 1,
            "x": 380.0,
            "y": 520.0,
            "zona_poblada": True,
            "timestamp": store.get_simulation_clock_iso()
        }
    )
    # 2. Alta: sismo nuevo 2002 en Cordillera
    rep2 = SeismicReport(
        station_code="EST-PEREIRA-01",
        raw_data={
            "event_id": 2002,
            "magnitud": 3.8,
            "profundidad": 40.0,
            "revision": 1,
            "x": 600.0,
            "y": 600.0,
            "zona_poblada": False,
            "timestamp": store.get_simulation_clock_iso()
        }
    )
    # 3. Confirmación sobre sismo 1001 (misma rev e idénticos datos)
    rep3 = SeismicReport(
        station_code="EST-ARMENIA-01",
        raw_data={
            "event_id": 1001,
            "magnitud": 6.5,
            "profundidad": 12.0,
            "revision": 1,
            "x": 385.0,
            "y": 515.0,
            "zona_poblada": True,
            "timestamp": "2026-09-22T10:00:00Z"
        }
    )
    # 4. Corrección de clave sobre sismo 1002 (mayor revisión r=2, eleva magnitud)
    rep4 = SeismicReport(
        station_code="EST-PEREIRA-01",
        raw_data={
            "event_id": 1002,
            "magnitud": 6.2,
            "profundidad": 10.0,
            "revision": 2,
            "x": 280.0,
            "y": 370.0,
            "zona_poblada": True,
            "timestamp": "2026-09-22T11:15:00Z"
        }
    )
    # 5. Reporte antiguo descartado sobre 1001 (revisión 0 menor a vigente 1)
    rep5 = SeismicReport(
        station_code="EST-MANIZALES-01",
        raw_data={
            "event_id": 1001,
            "magnitud": 5.0,
            "profundidad": 20.0,
            "revision": 0,
            "x": 385.0,
            "y": 515.0,
            "timestamp": "2026-09-22T09:00:00Z"
        }
    )

    for r in (rep1, rep2, rep3, rep4, rep5):
        store.report_queue.enqueue(r)

    return {
        "success": True,
        "message": "Ráfaga de prueba mixta (5 reportes) encolada exitosamente en la Cola FIFO.",
        "reportes_encolados": 5,
        "cola_size": store.report_queue.size()
    }


# --------------------------------------------------
# SECCIÓN 11: CONSULTAS Y ANÁLISIS DEL DESEMPEÑO
# --------------------------------------------------

@app.get("/api/v1/consultas/pendientes", tags=["Consultas Especializadas"])
def consultar_pendientes_k(k: int = 5):
    """Retorna los primeros k eventos pendientes en orden descendente de clave K con nodos examinados y poda."""
    try:
        query = ConsultarPrimerosKPendientesQuery(k=k)
        return global_command_bus.dispatch(query)
    except SismoLabException as e:
        raise HTTPException(status_code=400, detail={"code": e.code, "message": e.message})
    except Exception as e:
        raise HTTPException(status_code=500, detail={"code": "INTERNAL_ERROR", "message": str(e)})

@app.get("/api/v1/consultas/magnitud", tags=["Consultas Especializadas"])
def consultar_por_magnitud(m_min: float = 3.0, m_max: float = 6.0):
    """Consulta eventos en intervalo inclusivo de magnitud [M_min, M_max]."""
    try:
        query = ConsultarPorRangoMagnitudQuery(m_min=m_min, m_max=m_max)
        return global_command_bus.dispatch(query)
    except SismoLabException as e:
        raise HTTPException(status_code=400, detail={"code": e.code, "message": e.message})
    except Exception as e:
        raise HTTPException(status_code=500, detail={"code": "INTERNAL_ERROR", "message": str(e)})

@app.get("/api/v1/consultas/profundidad-fechas", tags=["Consultas Especializadas"])
def consultar_por_profundidad_fechas(h_max: float = 50.0, t_inicio: str = "2026-09-20T00:00:00Z", t_fin: str = "2026-09-25T23:59:59Z"):
    """Consulta eventos con profundidad <= h_max en rango inclusivo de fechas."""
    try:
        query = ConsultarPorProfundidadYFechasQuery(h_max=h_max, t_inicio=t_inicio, t_fin=t_fin)
        return global_command_bus.dispatch(query)
    except SismoLabException as e:
        raise HTTPException(status_code=400, detail={"code": e.code, "message": e.message})
    except Exception as e:
        raise HTTPException(status_code=500, detail={"code": "INTERNAL_ERROR", "message": str(e)})

@app.get("/api/v1/consultas/asociaciones/{event_id}", tags=["Consultas Especializadas"])
def consultar_asociaciones(event_id: int):
    """Consulta candidatos y referencia elegida para un evento, y eventos que lo referencian (activos y archivados)."""
    try:
        query = ConsultarAsociacionesEventoQuery(event_id=event_id)
        res = global_command_bus.dispatch(query)
        if not res.get("success"):
            raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": res.get("message")})
        return res
    except HTTPException:
        raise
    except SismoLabException as e:
        raise HTTPException(status_code=400, detail={"code": e.code, "message": e.message})
    except Exception as e:
        raise HTTPException(status_code=500, detail={"code": "INTERNAL_ERROR", "message": str(e)})

@app.get("/api/v1/consultas/acceso-costoso", tags=["Consultas Especializadas"])
def consultar_acceso_costoso(limite_l: int = None):
    """Consulta eventos de prioridad alta con acceso costoso (profundidad > L) indicando visitas en búsqueda por clave."""
    try:
        query = ConsultarAccesoCostosoQuery(limite_l=limite_l)
        return global_command_bus.dispatch(query)
    except SismoLabException as e:
        raise HTTPException(status_code=400, detail={"code": e.code, "message": e.message})
    except Exception as e:
        raise HTTPException(status_code=500, detail={"code": "INTERNAL_ERROR", "message": str(e)})

@app.post("/api/v1/consultas/benchmark-comparativo", tags=["Consultas Especializadas"])
def ejecutar_benchmark(payload: Dict[str, Any] = None):
    """Ejecuta análisis experimental del costo de acceso: AVL vs BST bajo diferentes órdenes de llegada."""
    try:
        payload = payload or {}
        n = payload.get("tamano_n", 100)
        patron = payload.get("patron_orden", "todos")
        query = EjecutarBenchmarkComparativoQuery(tamano_n=n, patron_orden=patron)
        return global_command_bus.dispatch(query)
    except SismoLabException as e:
        raise HTTPException(status_code=400, detail={"code": e.code, "message": e.message})
    except Exception as e:
        raise HTTPException(status_code=500, detail={"code": "INTERNAL_ERROR", "message": str(e)})


# --------------------------------------------------
# SECCIÓN 12: PERSISTENCIA Y RECONSTRUCCIÓN DEL ESCENARIO
# --------------------------------------------------

@app.post("/api/v1/escenario/exportar", tags=["Persistencia y Escenario"])
def exportar_escenario(payload: Dict[str, Any] = None):
    """Exporta el escenario completo (eventos activos, archivados, eliminados, parámetros, métricas y topología)."""
    try:
        payload = payload or {}
        inc_top = payload.get("incluir_topologia", True)
        command = ExportarEscenarioCommand(incluir_topologia=inc_top)
        return global_command_bus.dispatch(command)
    except Exception as e:
        raise HTTPException(status_code=500, detail={"code": "EXPORT_ERROR", "message": str(e)})

@app.post("/api/v1/escenario/importar-inserciones", tags=["Persistencia y Escenario"])
def importar_inserciones(payload: Dict[str, Any]):
    """Reconstruye el escenario por inserciones en AVL y BST con validación de ID duplicado."""
    try:
        command = ImportarInsercionesCommand(datos_json=payload)
        return global_command_bus.dispatch(command)
    except SismoLabException as e:
        raise HTTPException(status_code=400, detail={"code": e.code, "message": e.message})
    except Exception as e:
        raise HTTPException(status_code=422, detail={"code": "VALIDATION_FAILED", "message": str(e)})

@app.post("/api/v1/escenario/importar-topologia", tags=["Persistencia y Escenario"])
def importar_topologia(payload: Dict[str, Any]):
    """Reconstruye el AVL a partir de topología explícita con validación atómica (modo normal vs modo estrés)."""
    try:
        permitir_desbalance = payload.get("permitir_desbalance", True)
        command = ImportarTopologiaCommand(datos_topologia=payload, permitir_desbalance=permitir_desbalance)
        return global_command_bus.dispatch(command)
    except SismoLabException as e:
        raise HTTPException(status_code=400, detail={"code": e.code, "message": e.message})
    except Exception as e:
        raise HTTPException(status_code=422, detail={"code": "TOPOLOGY_REJECTED", "message": str(e)})

@app.get("/api/v1/escenario/geometria", tags=["Persistencia y Escenario"])
def obtener_geometria_escenario():
    """Retorna zonas, estaciones, eventos y enlaces de réplicas en el plano cartesiano [0, 1000] x [0, 1000] km."""
    current_clock = store.get_simulation_clock()
    pool = store.get_all_active_and_archived_events()

    # Recalcular asociaciones vigentes
    from src.domain.services.association_service import AssociationService
    AssociationService.recalcular_todas_las_asociaciones(pool, store.param_w_hours, store.param_r_km)

    eventos_mapa = []
    enlaces_replicas = []

    for ev in pool:
        es_activo = store.is_id_active(ev.id)
        ev_dict = ev.to_dict(current_clock=current_clock)
        ev_dict["es_activo"] = es_activo
        eventos_mapa.append(ev_dict)

        if ev.chosen_reference_id is not None:
            ref = next((r for r in pool if r.id == ev.chosen_reference_id), None)
            if ref:
                enlaces_replicas.append({
                    "origen_id": ev.id,
                    "origen_x": ev.coordinates.x,
                    "origen_y": ev.coordinates.y,
                    "destino_id": ref.id,
                    "destino_x": ref.coordinates.x,
                    "destino_y": ref.coordinates.y,
                    "distancia_km": round(ev.coordinates.distance_to(ref.coordinates), 2)
                })

    zonas = [
        {
            "codigo": z.code,
            "nombre": z.name,
            "x_min": z.x_min,
            "x_max": z.x_max,
            "y_min": z.y_min,
            "y_max": z.y_max,
            "es_poblada": z.is_populated
        }
        for z in store.zones
    ]

    estaciones = [
        {
            "codigo": s.code,
            "nombre": s.name,
            "x": s.coordinates.x,
            "y": s.coordinates.y
        }
        for s in store.stations.values()
    ]

    return {
        "success": True,
        "plano": {"x_min": 0.0, "x_max": 1000.0, "y_min": 0.0, "y_max": 1000.0},
        "parametros": store.get_scenario_parameters(),
        "zonas": zonas,
        "estaciones": estaciones,
        "eventos": eventos_mapa,
        "enlaces_replicas": enlaces_replicas
    }


# --------------------------------------------------
# GESTIÓN DINÁMICA DE ESTACIONES SÍSMICAS
# --------------------------------------------------

@app.get("/api/v1/estaciones", tags=["Estaciones Sísmicas"])
@app.get("/api/v1/escenario/estaciones", tags=["Estaciones Sísmicas"])
def listar_estaciones():
    """Retorna todas las estaciones de monitoreo sísmico activas en el escenario."""
    query = ListarEstacionesQuery()
    return global_command_bus.dispatch(query)

@app.post("/api/v1/estaciones", tags=["Estaciones Sísmicas"], status_code=status.HTTP_201_CREATED)
@app.post("/api/v1/escenario/estaciones", tags=["Estaciones Sísmicas"], status_code=status.HTTP_201_CREATED)
def registrar_estacion(dto: CrearEstacionDTO):
    """Registra dinámicamente una nueva estación de monitoreo en el plano cartesiano [0, 1000] km."""
    try:
        command = CrearEstacionCommand(dto)
        return global_command_bus.dispatch(command)
    except SismoLabException as e:
        raise HTTPException(status_code=400, detail={"code": e.code, "message": e.message})
    except Exception as e:
        raise HTTPException(status_code=422, detail={"code": "VALIDATION_ERROR", "message": str(e)})


# --------------------------------------------------
# SECCIÓN 13: VERSIONES PERSISTENTES CON NOMBRE
# --------------------------------------------------

@app.get("/api/v1/versiones", tags=["Versiones Persistentes"])
def listar_versiones():
    """Lista todas las versiones persistentes guardadas en disco."""
    query = ListarVersionesQuery()
    return global_command_bus.dispatch(query)

@app.post("/api/v1/versiones/guardar", tags=["Versiones Persistentes"])
def guardar_version(payload: Dict[str, Any]):
    """Guarda un snapshot completo del escenario con un nombre persistente en disco."""
    nombre = payload.get("nombre")
    if not nombre or not str(nombre).strip():
        raise HTTPException(status_code=400, detail={"code": "INVALID_NAME", "message": "El nombre de la versión es obligatorio."})
    descripcion = payload.get("descripcion")
    command = GuardarVersionCommand(nombre=nombre.strip(), descripcion=descripcion)
    return global_command_bus.dispatch(command)

@app.post("/api/v1/versiones/{nombre}/restaurar", tags=["Versiones Persistentes"])
def restaurar_version(nombre: str):
    """Restaura una versión guardada en disco (operación reversible con Deshacer)."""
    try:
        command = RestaurarVersionCommand(nombre=nombre)
        return global_command_bus.dispatch(command)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": str(e)})
    except Exception as e:
        raise HTTPException(status_code=500, detail={"code": "RESTORE_ERROR", "message": str(e)})

@app.delete("/api/v1/versiones/{nombre}", tags=["Versiones Persistentes"])
def eliminar_version(nombre: str):
    """Elimina una versión guardada de disco."""
    exito = version_repo.eliminar_version(nombre)
    if not exito:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": f"Versión '{nombre}' no encontrada."})
    return {"success": True, "message": f"Versión '{nombre}' eliminada exitosamente."}


# --------------------------------------------------
# SECCIÓN 14: AUDITORÍA E INDICADORES
# --------------------------------------------------

@app.get("/api/v1/auditoria/verificar-estructura", tags=["Auditoría de Estructura"])
def verificar_estructura_exhaustiva():
    """Ejecuta la auditoría exhaustiva de la estructura del AVL (orden BST global, punteros recíprocos, alturas y factores de balance)."""
    query = VerificarEstructuraQuery()
    return global_command_bus.dispatch(query)

@app.get("/api/v1/auditoria/indicadores-completos", tags=["Auditoría de Estructura"])
def consultar_indicadores_completos():
    """Retorna los 4 recorridos formales, métricas de AVL vs BST y el desglose estricto de rotaciones."""
    query = ConsultarIndicadoresCompletosQuery()
    return global_command_bus.dispatch(query)

@app.post("/api/v1/auditoria/resetear-contadores-rotacion", tags=["Auditoría de Estructura"])
def resetear_contadores_rotacion():
    """Reinicia a cero los contadores de rotaciones (LL, RR, LR, RL y giros elementales)."""
    command = ResetearContadoresRotacionCommand()
    return global_command_bus.dispatch(command)


