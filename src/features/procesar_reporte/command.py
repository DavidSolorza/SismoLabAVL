# -*- coding: utf-8 -*-
"""
Command and Handler for procesar_reporte / Comando y Handler para procesar_reporte
SismoLab AVL - Universidad de Caldas
"""

from typing import Dict, Any
from pydantic import BaseModel, Field
from src.core.bus.command_bus import Command
from src.core.errors.exceptions import EmptyStructureException
from src.domain.entities.seismic_event import SeismicEvent
from src.domain.value_objects.coordinates import GeographicCoordinates
from src.infrastructure.persistence.in_memory_store import store

class EncolarReporteDTO(BaseModel):
    station_code: str = Field(..., description="Código de la estación / Station code")
    event_id: int = Field(..., ge=1, le=999999, description="ID asignado al evento / Assigned event ID")
    magnitud: float = Field(..., ge=-2.0, le=10.0)
    profundidad: float = Field(..., ge=0.0)
    latitud: float = Field(..., ge=-90.0, le=90.0)
    longitud: float = Field(..., ge=-180.0, le=180.0)
    zona_poblada: bool = Field(default=False)


class ProcesarReporteCommand(Command):
    """Procesa el siguiente reporte de la Cola FIFO / Processes next report from FIFO Queue"""
    pass


class ProcesarReporteHandler:
    def handle(self, command: ProcesarReporteCommand) -> Dict[str, Any]:
        if store.report_queue.is_empty():
            raise EmptyStructureException("Cola de Reportes (Report Queue)")

        reporte = store.report_queue.dequeue()
        raw = reporte.raw_data

        coords = GeographicCoordinates(raw["latitud"], raw["longitud"])
        evento = SeismicEvent(
            event_id=raw["event_id"],
            magnitude=raw["magnitud"],
            depth=raw["profundidad"],
            coordinates=coords,
            station_id=reporte.station_code,
            is_populated_zone=raw.get("zona_poblada", False)
        )

        store.avl_tree.insertar(evento)
        store.bst_tree.insertar(evento)
        reporte.mark_as_processed()

        store.undo_stack.push({
            "accion": "PROCESAR_REPORTE",
            "evento_id": evento.id,
            "datos_anteriores": None
        })

        return {
            "success": True,
            "message": f"Reporte {reporte.id} desencolado y convertido en evento {evento.composite_key.formatted_id()} en el AVL.",
            "data": {
                "reporte_id": reporte.id,
                "evento_creado": evento.to_dict(),
                "reportes_restantes_en_cola": store.report_queue.size()
            }
        }
