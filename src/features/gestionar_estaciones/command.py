# -*- coding: utf-8 -*-
"""
Commands and Queries for gestionar_estaciones Vertical Slice
SismoLab AVL - Universidad de Caldas
"""

from typing import Dict, Any, List
from src.core.bus.command_bus import Command, Query
from src.features.gestionar_estaciones.dto import CrearEstacionDTO
from src.infrastructure.persistence.in_memory_store import store
from src.core.errors.exceptions import SismoLabException

class ListarEstacionesQuery(Query):
    """Consulta para obtener todas las estaciones registradas en el escenario"""
    pass

class ListarEstacionesHandler:
    """Manejador de la consulta de estaciones"""
    def handle(self, query: ListarEstacionesQuery) -> Dict[str, Any]:
        estaciones = store.get_stations_list()
        return {
            "success": True,
            "total": len(estaciones),
            "estaciones": estaciones
        }

class CrearEstacionCommand(Command):
    """Comando para registrar o actualizar una estación telemétrica de monitoreo"""
    def __init__(self, dto: CrearEstacionDTO):
        self.dto = dto

class CrearEstacionHandler:
    """Manejador del comando para registrar una nueva estación"""
    def handle(self, command: CrearEstacionCommand) -> Dict[str, Any]:
        dto = command.dto
        codigo = dto.codigo.strip().upper()

        if codigo in store.stations:
            raise SismoLabException(
                f"Ya existe una estación de monitoreo registrada con el código '{codigo}'.",
                code="STATION_ALREADY_EXISTS"
            )

        if not (0.0 <= dto.x <= 1000.0 and 0.0 <= dto.y <= 1000.0):
            raise SismoLabException(
                f"Las coordenadas ({dto.x}, {dto.y}) km están fuera de los límites del plano cartesiano [0, 1000] km.",
                code="INVALID_COORDINATES"
            )

        estacion = store.add_station(
            code=codigo,
            name=dto.nombre,
            x=dto.x,
            y=dto.y
        )
        estacion.active = dto.activa

        return {
            "success": True,
            "message": f"Estación telemétrica '{estacion.code}' registrada exitosamente en el escenario.",
            "data": {
                "codigo": estacion.code,
                "nombre": estacion.name,
                "x": estacion.coordinates.x,
                "y": estacion.coordinates.y,
                "activo": estacion.active
            }
        }
