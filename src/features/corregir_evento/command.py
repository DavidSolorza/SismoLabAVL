# -*- coding: utf-8 -*-
"""
Command and Handler for corregir_evento / Comando y Handler para corregir_evento
SismoLab AVL - Universidad de Caldas
"""

from typing import Dict, Any
from src.core.bus.command_bus import Command
from src.core.errors.exceptions import EventNotFoundException
from src.features.corregir_evento.dto import CorregirEventoDTO
from src.infrastructure.persistence.in_memory_store import store

class CorregirEventoCommand(Command):
    def __init__(self, dto: CorregirEventoDTO):
        self.dto = dto


class CorregirEventoHandler:
    def handle(self, command: CorregirEventoCommand) -> Dict[str, Any]:
        dto = command.dto

        # 1. Buscar evento existente por ID
        nodo_avl = store.avl_tree.buscar_por_id(dto.event_id)
        if nodo_avl is None:
            raise EventNotFoundException(str(dto.event_id))

        evento = nodo_avl.getValor()

        # Guardar snapshot anterior para deshacer
        estado_anterior = {
            "magnitud": evento.magnitude,
            "profundidad": evento.depth,
            "prioridad": evento.priority,
            "revision": evento.revision,
            "estado_atencion": evento.estado_atencion,
            "composite_key": evento.composite_key
        }

        # 2. Calcular si la clave compuesta K = (P, M, I) cambia (Sección 6)
        # "Si la nueva clave es igual a la anterior, el equipo puede evitar una eliminación y reinserción innecesarias"
        from src.domain.rules import calculate_seismic_priority
        nueva_prioridad = calculate_seismic_priority(dto.nueva_magnitud, dto.nueva_profundidad, evento.is_populated_zone)
        clave_cambia = (nueva_prioridad != evento.priority) or (round(dto.nueva_magnitud, 1) != round(evento.magnitude, 1))

        if clave_cambia:
            # Retirar del AVL y BST usando la clave anterior, actualizar y reinsertar con la nueva
            store.avl_tree.eliminar_por_id(dto.event_id)
            store.bst_tree.eliminar(dto.event_id)

            prioridad_cambio = evento.update_telemetry(
                dto.nueva_magnitud,
                dto.nueva_profundidad,
                dto.estacion_id
            )

            store.avl_tree.insertar(evento)
            store.bst_tree.insertar(evento)
        else:
            # Clave idéntica: evitamos retiro y reinserción innecesarios demostrando que el orden K sigue siendo válido
            prioridad_cambio = evento.update_telemetry(
                dto.nueva_magnitud,
                dto.nueva_profundidad,
                dto.estacion_id
            )

        # 4. Actualizar asociaciones de réplicas y marcas de acceso costoso (Secciones 7 y 9)
        from src.domain.services.association_service import AssociationService
        pool = store.get_all_active_and_archived_events()
        AssociationService.recalcular_todas_las_asociaciones(pool, store.param_w_hours, store.param_r_km)
        store.avl_tree.actualizar_marcas_acceso_costoso(store.param_budget_l)

        # 5. Registrar en la Pila de Deshacer
        store.undo_stack.push({
            "accion": "CORREGIR_EVENTO",
            "evento_id": evento.id,
            "datos_anteriores": estado_anterior
        })

        current_clock = store.get_simulation_clock()
        return {
            "success": True,
            "message": f"Evento {evento.composite_key.formatted_id()} corregido exitosamente (Revisión {evento.revision}, Estado: {evento.estado_atencion}).",
            "data": {
                "evento": evento.to_dict(current_clock=current_clock),
                "prioridad_cambio": prioridad_cambio,
                "razon": dto.razon
            }
        }
