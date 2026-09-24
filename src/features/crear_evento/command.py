# -*- coding: utf-8 -*-
"""
Command and Handler for crear_evento / Comando y Handler para crear_evento
SismoLab AVL - Universidad de Caldas
"""

from typing import Dict, Any
from src.core.bus.command_bus import Command
from src.features.crear_evento.dto import CrearEventoDTO
from src.domain.entities.seismic_event import SeismicEvent
from src.domain.value_objects.coordinates import CartesianCoordinates
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

        # 1. Determinar coordenadas en el plano cartesiano [0.0, 1000.0] km
        if dto.x is not None and dto.y is not None:
            coord_x, coord_y = dto.x, dto.y
        elif dto.longitud is not None and dto.latitud is not None:
            # Compatibilidad: mapear coordenadas previas
            coord_x = abs(dto.longitud) if 0.0 <= abs(dto.longitud) <= 1000.0 else 500.0
            coord_y = abs(dto.latitud) if 0.0 <= abs(dto.latitud) <= 1000.0 else 500.0
        else:
            coord_x, coord_y = 500.0, 500.0

        coords = CartesianCoordinates(coord_x, coord_y)

        # 2. Determinar pertenencia a zona poblada mediante el escenario
        if dto.zona_poblada is not None:
            es_poblada = dto.zona_poblada
        else:
            es_poblada = store.is_point_populated(coords.x, coords.y)

        # 3. Determinar timestamp y validar contra el Reloj de Simulación
        ts = dto.timestamp if dto.timestamp else store.get_simulation_clock_iso()

        # 4. Validar que el identificador no pertenezca a un evento activo, archivado o eliminado (Sección 6)
        if store.is_id_active(dto.id):
            raise SismoLabException(
                f"El identificador SIS-{dto.id:06d} ya pertenece a un evento activo en el catálogo.",
                code="EVENT_ALREADY_EXISTS"
            )
        if store.is_id_archived(dto.id):
            raise SismoLabException(
                f"El identificador SIS-{dto.id:06d} pertenece a un evento archivado en el histórico.",
                code="EVENT_ARCHIVED"
            )
        if store.is_id_deleted(dto.id):
            raise SismoLabException(
                f"El identificador SIS-{dto.id:06d} fue eliminado y no puede reutilizarse.",
                code="EVENT_DELETED"
            )

        # 5. Crear Entidad de Dominio (Revisión 1, Estado Pendiente, Sección 6)
        evento = SeismicEvent(
            event_id=dto.id,
            magnitude=dto.magnitud,
            depth=dto.profundidad,
            coordinates=coords,
            station_id=dto.estacion_id,
            is_populated_zone=es_poblada,
            timestamp=ts,
            estado_atencion="Pendiente"
        )

        current_clock = store.get_simulation_clock()
        if evento.dt > current_clock:
            raise SismoLabException(
                f"El instante de ocurrencia ({evento.timestamp}) no puede ser posterior al reloj de simulación actual ({store.get_simulation_clock_iso()}).",
                code="EVENTO_FUTURO_NO_PERMITIDO"
            )

        # 6. Insertar en Árbol AVL y BST registrando rotaciones
        store.avl_tree.reset_contador_rotaciones()
        store.avl_tree.insertar(evento)
        store.bst_tree.insertar(evento)
        rotaciones = store.avl_tree.reset_contador_rotaciones()

        # 7. Actualizar asociaciones de réplicas (Sección 7)
        from src.domain.services.association_service import AssociationService
        pool = store.get_all_active_and_archived_events()
        AssociationService.actualizar_asociaciones_para_evento(evento, pool, store.param_w_hours, store.param_r_km)
        for other in pool:
            if other.id != evento.id and other.dt > evento.dt:
                AssociationService.actualizar_asociaciones_para_evento(other, pool, store.param_w_hours, store.param_r_km)

        # 8. Actualizar marcas de acceso costoso según presupuesto L (Sección 9)
        store.avl_tree.actualizar_marcas_acceso_costoso(store.param_budget_l)

        # 9. Registrar en la Pila de Deshacer
        store.undo_stack.push({
            "accion": "CREAR_EVENTO",
            "evento_id": evento.id,
            "datos_anteriores": None
        })

        evento_dict = evento.to_dict(current_clock=current_clock)
        evento_dict["rotaciones_producidas"] = rotaciones

        return {
            "success": True,
            "message": f"Evento sísmico {evento.composite_key.formatted_id()} creado e insertado en AVL con éxito.",
            "data": evento_dict
        }
