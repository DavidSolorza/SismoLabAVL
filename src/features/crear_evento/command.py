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

from src.core.errors.exceptions import SismoLabException

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

        # 2. Determinar timestamp y validar contra el Reloj de Simulación
        # Regla obligatoria: "Los tiempos de ocurrencia no pueden ser posteriores a ese reloj"
        ts = dto.timestamp if dto.timestamp else store.get_simulation_clock_iso()

        # 3. Crear Entidad de Dominio / Create Domain Entity
        evento = SeismicEvent(
            event_id=dto.id,
            magnitude=dto.magnitud,
            depth=dto.profundidad,
            coordinates=coords,
            station_id=dto.estacion_id,
            is_populated_zone=dto.zona_poblada,
            timestamp=ts
        )

        current_clock = store.get_simulation_clock()
        if evento.dt > current_clock:
            raise SismoLabException(
                f"El instante de ocurrencia ({evento.timestamp}) no puede ser posterior al reloj de simulación actual ({store.get_simulation_clock_iso()}).",
                code="EVENTO_FUTURO_NO_PERMITIDO"
            )

        # 4. Insertar en Árbol AVL y BST / Insert into AVL and BST
        store.avl_tree.insertar(evento)
        store.bst_tree.insertar(evento)

        # 5. Registrar en la Pila de Deshacer (Undo Stack) / Record in Undo Stack
        store.undo_stack.push({
            "accion": "CREAR_EVENTO",
            "evento_id": evento.id,
            "datos_anteriores": None
        })

        return {
            "success": True,
            "message": f"Evento sísmico {evento.composite_key.formatted_id()} creado e insertado en AVL con éxito.",
            "data": evento.to_dict(current_clock=current_clock)
        }
