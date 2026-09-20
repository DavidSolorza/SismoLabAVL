# -*- coding: utf-8 -*-
"""
Command and Handler for crear_evento / Comando y Handler para crear_evento
SismoLab AVL - Universidad de Caldas
"""

from typing import Dict, Any
from src.core.bus.command_bus import Command
from src.features.crear_evento.dto import CrearEventoDTO
from src.domain.entities.seismic_event import SeismicEvent
from src.domain.value_objects.coordinates import GeographicCoordinates
from src.infrastructure.persistence.in_memory_store import store

class CrearEventoCommand(Command):
    """
    Comando para Crear Evento Sísmico / Command to Create Seismic Event
    """
    def __init__(self, dto: CrearEventoDTO):
        self.dto = dto


class CrearEventoHandler:
    """
    Manejador del Comando Crear Evento Sísmico / Handler for Create Event Command
    """
    def handle(self, command: CrearEventoCommand) -> Dict[str, Any]:
        dto = command.dto

        # 1. Crear Value Object de Coordenadas / Create Coordinates Value Object
        coords = GeographicCoordinates(dto.latitud, dto.longitud)

        # 2. Crear Entidad de Dominio / Create Domain Entity
        evento = SeismicEvent(
            event_id=dto.id,
            magnitude=dto.magnitud,
            depth=dto.profundidad,
            coordinates=coords,
            station_id=dto.estacion_id,
            is_populated_zone=dto.zona_poblada
        )

        # 3. Insertar en Árbol AVL y BST / Insert into AVL and BST
        store.avl_tree.insertar(evento)
        store.bst_tree.insertar(evento)

        # 4. Registrar en la Pila de Deshacer (Undo Stack) / Record in Undo Stack
        store.undo_stack.push({
            "accion": "CREAR_EVENTO",
            "evento_id": evento.id,
            "datos_anteriores": None
        })

        return {
            "success": True,
            "message": f"Evento sísmico {evento.composite_key.formatted_id()} creado e insertado en AVL con éxito.",
            "data": evento.to_dict()
        }
