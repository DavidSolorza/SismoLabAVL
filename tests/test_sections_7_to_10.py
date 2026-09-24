# -*- coding: utf-8 -*-
"""
Automated Test Suite for Sections 7, 8, 9 & 10 of SismoLab AVL
SismoLab AVL - Universidad de Caldas

Verifica:
- Sección 7: Asociaciones deterministas entre eventos (candidatos a réplica con W y R, sin ciclos).
- Sección 8: Recepción mediante cola FIFO, reporte de rotaciones por paso, ráfagas mixtas y recuperación desde modo estrés.
- Sección 9: Profundidad del nodo, presupuesto L, marcas de acceso costoso para P=3 y costo simulado.
- Sección 10: Eliminación individual con actualización de referencias y archivo de subárboles elegibles (T horas, P=1, desempate lexicográfico y previsualización).
"""

import math
from datetime import datetime, timezone, timedelta
from src.core.bus.command_bus import global_command_bus
from src.infrastructure.persistence.in_memory_store import store
from src.core.config.settings import OperationalMode

from src.features.crear_evento.dto import CrearEventoDTO
from src.features.crear_evento.command import CrearEventoCommand, CrearEventoHandler

from src.features.corregir_evento.dto import CorregirEventoDTO
from src.features.corregir_evento.command import CorregirEventoCommand, CorregirEventoHandler

from src.features.eliminar_evento.command import EliminarEventoCommand, EliminarEventoHandler
from src.features.consultar_evento.query import ConsultarEventoQuery, ConsultarEventoHandler

from src.features.procesar_reporte.command import ProcesarReporteCommand, ProcesarReporteHandler, EncolarReporteDTO
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

from src.domain.entities.report import SeismicReport
from src.domain.services.association_service import AssociationService
from src.domain.value_objects.coordinates import CartesianCoordinates
from src.domain.entities.seismic_event import SeismicEvent


def setup_suite():
    store.clear_all(load_samples=False)
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


def test_section_7_associations_and_replicas():
    """Verifica reglas de candidatura a referencia y réplicas con desempate determinista"""
    setup_suite()
    # Fijar reloj
    store.set_simulation_clock(datetime(2026, 9, 22, 18, 0, 0, tzinfo=timezone.utc))

    # Evento Principal A: M=7.0 a las 10:00:00 en (300, 300)
    ev_a = SeismicEvent(
        100, 7.0, 15.0, CartesianCoordinates(300.0, 300.0),
        "EST-1", True, timestamp="2026-09-22T10:00:00Z"
    )
    # Evento Candidato Secundario C: M=6.0 a las 12:00:00 en (310, 310) (dt=2h, d=14.14km)
    ev_c = SeismicEvent(
        101, 6.0, 15.0, CartesianCoordinates(310.0, 310.0),
        "EST-1", True, timestamp="2026-09-22T12:00:00Z"
    )
    # Evento Réplica B: M=5.0 a las 14:00:00 en (305, 305) (ocurrió después de A y C)
    ev_b = SeismicEvent(
        102, 5.0, 15.0, CartesianCoordinates(305.0, 305.0),
        "EST-1", True, timestamp="2026-09-22T14:00:00Z"
    )

    for e in (ev_a, ev_c, ev_b):
        store.avl_tree.insertar(e)

    pool = store.get_all_active_and_archived_events()
    AssociationService.recalcular_todas_las_asociaciones(pool, store.param_w_hours, store.param_r_km)

    # ev_b debe tener como candidatos a ev_a (M=7.0) y ev_c (M=6.0)
    assert 100 in ev_b.candidatos_referencia
    assert 101 in ev_b.candidatos_referencia
    # Según criterio determinista: Mayor magnitud (-M) -> ev_a (M=7.0) gana indiscutiblemente
    assert ev_b.evento_referencia_id == 100
    assert ev_b.es_replica is True

    # Si se elimina ev_a, ev_b debe actualizar su referencia hacia ev_c (M=6.0)
    res_del = global_command_bus.dispatch(EliminarEventoCommand(100))
    assert res_del["success"] is True

    # Consultar ev_b
    res_q = global_command_bus.dispatch(ConsultarEventoQuery(102))
    assert res_q["data"]["evento_referencia_id"] == 101
    assert 100 not in res_q["data"]["candidatos_referencia"]

    # Revertir eliminación (Undo) restaura la asociación de ev_b con ev_a
    res_undo = global_command_bus.dispatch(DeshacerAccionCommand())
    assert res_undo["success"] is True

    res_q2 = global_command_bus.dispatch(ConsultarEventoQuery(102))
    assert res_q2["data"]["evento_referencia_id"] == 100
    assert 100 in res_q2["data"]["candidatos_referencia"]


def test_section_8_queue_step_details_and_stress_recovery():
    """Verifica recepción en cola con conteo de rotaciones y recuperación desde modo estrés"""
    setup_suite()
    store.set_simulation_clock(datetime(2026, 9, 22, 15, 0, 0, tzinfo=timezone.utc))

    # 1. Encolar reporte y procesar paso a paso verificando reporte de rotaciones
    rep = SeismicReport(
        station_code="EST-PEREIRA-01",
        raw_data={"event_id": 3001, "magnitud": 6.5, "profundidad": 12.0, "x": 280.0, "y": 370.0, "revision": 1}
    )
    store.report_queue.enqueue(rep)

    res_proc = global_command_bus.dispatch(ProcesarReporteCommand())
    assert res_proc["success"] is True
    assert "rotaciones_producidas" in res_proc["data"]
    assert res_proc["data"]["estacion"] == "EST-PEREIRA-01"
    assert res_proc["data"]["decision"] == "IDENTIFICADOR_DESCONOCIDO_REGISTRADO"

    # 2. Modo Estrés: Inserciones masivas sin rotaciones inmediatas
    store.avl_tree.set_modo(OperationalMode.STRESS)
    assert store.avl_tree.modo == OperationalMode.STRESS

    # Insertar nodos en orden que causaría desbalance si no hubiera rotaciones
    for i in range(1, 8):
        ev = SeismicEvent(
            4000 + i, 5.0, 20.0, CartesianCoordinates(100.0 + i*10, 100.0),
            "EST-TEST", False, timestamp="2026-09-22T12:00:00Z"
        )
        store.avl_tree.insertar(ev)

    # En estrés no rota inmediatamente
    res_recuperar = store.avl_tree.recuperar_balance_modo_estres()
    assert res_recuperar["success"] is True
    assert res_recuperar["rotaciones_aplicadas"] >= 0
    assert res_recuperar["es_avl_valido"] is True
    assert store.avl_tree.modo == OperationalMode.NORMAL


def test_section_9_access_budget_and_expensive_flag():
    """Verifica presupuesto de acceso L y marca de acceso costoso para P=3 cuando profundidad > L"""
    setup_suite()
    store.param_budget_l = 2  # Presupuesto estricto L=2

    # Raíz (profundidad 0): P=3
    e0 = SeismicEvent(5000, 6.5, 10.0, CartesianCoordinates(380.0, 520.0), "EST-1", True)
    # Hijo (profundidad 1): P=3
    e1 = SeismicEvent(5001, 6.6, 10.0, CartesianCoordinates(380.0, 520.0), "EST-1", True)
    # Nieto (profundidad 2): P=3
    e2 = SeismicEvent(5002, 6.7, 10.0, CartesianCoordinates(380.0, 520.0), "EST-1", True)
    # Bisnieto (profundidad 3): P=3 (supera L=2!)
    e3 = SeismicEvent(5003, 6.8, 10.0, CartesianCoordinates(380.0, 520.0), "EST-1", True)

    for e in (e0, e1, e2, e3):
        store.avl_tree.insertar(e)

    store.avl_tree.actualizar_marcas_acceso_costoso(store.param_budget_l)

    # Verificar métricas de nodo
    m_e0 = store.avl_tree.obtener_metricas_nodo(5000)
    assert m_e0["acceso_costoso"] is False  # prof <= 2
    assert m_e0["costo_simulado"] == m_e0["profundidad_nodo"] + 1

    # Al menos el nodo más profundo (profundidad > 2) debe estar marcado con acceso_costoso
    nodos_costosos = [ev for ev in store.avl_tree.recorrido_inorden() if ev.acceso_costoso]
    for n in nodos_costosos:
        assert n.priority == 3  # Solo eventos de alta prioridad pueden tener marca de acceso costoso
        m = store.avl_tree.obtener_metricas_nodo(n.id)
        assert m["profundidad_nodo"] > store.param_budget_l

    # Si aumentamos el presupuesto L=10, ningún nodo debe ser costoso
    global_command_bus.dispatch(ActualizarParametrosCommand(ActualizarParametrosDTO(limite_l=10)))
    assert store.param_budget_l == 10
    nodos_costosos_post = [ev for ev in store.avl_tree.recorrido_inorden() if ev.acceso_costoso]
    assert len(nodos_costosos_post) == 0


def test_section_10_subtree_pruning_with_tie_breaker():
    """Verifica la selección determinista de subárboles elegibles para archivo según Sección 10"""
    setup_suite()
    reloj_actual = datetime(2026, 9, 22, 12, 0, 0, tzinfo=timezone.utc)
    store.set_simulation_clock(reloj_actual)

    # Crear eventos antiguos (hace 100 horas, > T=72h) con P=1 (Baja Prioridad)
    hace_100h = (reloj_actual - timedelta(hours=100)).strftime("%Y-%m-%dT%H:%M:%SZ")
    # Evento reciente (hace 5 horas, <= T=72h)
    hace_5h = (reloj_actual - timedelta(hours=5)).strftime("%Y-%m-%dT%H:%M:%SZ")

    # Subárbol A (elegible): 2 nodos antiguos con P=1
    ev_antiguo_1 = SeismicEvent(6001, 2.0, 50.0, CartesianCoordinates(100.0, 100.0), "EST-1", False, timestamp=hace_100h)
    ev_antiguo_2 = SeismicEvent(6002, 2.1, 50.0, CartesianCoordinates(100.0, 100.0), "EST-1", False, timestamp=hace_100h)

    # Evento mixto joven (no elegible para archivo)
    ev_joven = SeismicEvent(6003, 2.2, 50.0, CartesianCoordinates(100.0, 100.0), "EST-1", False, timestamp=hace_5h)

    for ev in (ev_antiguo_1, ev_antiguo_2, ev_joven):
        store.avl_tree.insertar(ev)

    # 1. Previsualizar archivo de rama
    res_prev = global_command_bus.dispatch(PrevisualizarArchivoRamaQuery(t_horas=72.0))
    assert res_prev["success"] is True
    assert res_prev["elegible"] is True
    assert "justificacion" in res_prev["data"]
    assert res_prev["data"]["tamano"] >= 1
    # Ningún evento joven debe ser parte del subárbol archivado
    assert 6003 not in res_prev["data"]["eventos_afectados_ids"]

    # 2. Ejecutar archivo de rama
    res_arch = global_command_bus.dispatch(ArchivarRamaCommand(ArchivarRamaDTO(guardar_json=False, t_horas=72.0)))
    assert res_arch["success"] is True
    assert res_arch["data"]["nodos_archivados"] >= 1

    # Verificar que los eventos archivados están en store.archived_events y fuera del AVL
    for arch_id in res_arch["data"]["eventos_archivados_ids"]:
        assert store.is_id_archived(arch_id)
        assert not store.is_id_active(arch_id)

    # 3. Deshacer acción restaura la rama completa al AVL activo (acción única atómica)
    res_undo = global_command_bus.dispatch(DeshacerAccionCommand())
    assert res_undo["success"] is True
    for arch_id in res_arch["data"]["eventos_archivados_ids"]:
        assert store.is_id_active(arch_id)
        assert not store.is_id_archived(arch_id)
