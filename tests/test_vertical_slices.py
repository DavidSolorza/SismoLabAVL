# -*- coding: utf-8 -*-
"""
End-to-End Vertical Slices Tests / Pruebas E2E de Cortes Verticales
SismoLab AVL - Universidad de Caldas
"""

from src.core.bus.command_bus import global_command_bus
from src.infrastructure.persistence.in_memory_store import store

from src.features.crear_evento.dto import CrearEventoDTO
from src.features.crear_evento.command import CrearEventoCommand, CrearEventoHandler

from src.features.corregir_evento.dto import CorregirEventoDTO
from src.features.corregir_evento.command import CorregirEventoCommand, CorregirEventoHandler

from src.features.procesar_reporte.command import ProcesarReporteCommand, ProcesarReporteHandler

from src.features.deshacer_accion.command import DeshacerAccionCommand, DeshacerAccionHandler

from src.features.archivar_rama.command import ArchivarRamaDTO, ArchivarRamaCommand, ArchivarRamaHandler
from src.domain.entities.report import SeismicReport

def setup_store():
    store.clear_all(load_samples=False)
    global_command_bus.register(CrearEventoCommand, CrearEventoHandler().handle)
    global_command_bus.register(CorregirEventoCommand, CorregirEventoHandler().handle)
    global_command_bus.register(ProcesarReporteCommand, ProcesarReporteHandler().handle)
    global_command_bus.register(DeshacerAccionCommand, DeshacerAccionHandler().handle)
    global_command_bus.register(ArchivarRamaCommand, ArchivarRamaHandler().handle)


def test_slice_crear_y_corregir_evento():
    # 1. Slice: Crear Evento
    dto_crear = CrearEventoDTO(
        id=1001, magnitud=5.2, profundidad=15.0,
        latitud=5.06889, longitud=-75.51738, zona_poblada=True
    )
    res_crear = global_command_bus.dispatch(CrearEventoCommand(dto_crear))
    assert res_crear["success"] is True
    assert store.avl_tree.contar_nodos() == 1

    # 2. Slice: Corregir Evento
    dto_corregir = CorregirEventoDTO(
        event_id=1001, nueva_magnitud=7.5, nueva_profundidad=5.0, razon="Recalibración"
    )
    res_corregir = global_command_bus.dispatch(CorregirEventoCommand(dto_corregir))
    assert res_corregir["success"] is True
    assert res_corregir["data"]["evento"]["magnitud"] == 7.5

    # 3. Slice: Deshacer Corrección
    res_undo = global_command_bus.dispatch(DeshacerAccionCommand())
    assert res_undo["success"] is True


def test_slice_procesar_reporte_y_archivar():
    # 1. Encolar reporte en la cola FIFO
    rep = SeismicReport(
        station_code="EST-MANIZALES-01",
        raw_data={"event_id": 2002, "magnitud": 3.1, "profundidad": 80.0, "latitud": 4.5, "longitud": -75.6, "zona_poblada": False}
    )
    store.report_queue.enqueue(rep)
    assert store.report_queue.size() == 1

    # 2. Slice: Procesar Reporte
    res_proc = global_command_bus.dispatch(ProcesarReporteCommand())
    assert res_proc["success"] is True
    assert store.report_queue.size() == 0
    assert store.avl_tree.contar_nodos() == 1

    # 3. Slice: Archivar Rama de Baja Prioridad
    dto_archivar = ArchivarRamaDTO(prioridad_minima=3, guardar_json=False)
    res_arch = global_command_bus.dispatch(ArchivarRamaCommand(dto_archivar))
    assert res_arch["success"] is True
    assert res_arch["data"]["nodos_archivados"] == 1
    assert store.avl_tree.contar_nodos() == 0
