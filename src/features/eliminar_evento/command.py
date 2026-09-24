# -*- coding: utf-8 -*-
"""
Command and Handler for eliminar_evento / Eliminación Individual de Evento Sísmico
SismoLab AVL - Universidad de Caldas

Retira únicamente el evento seleccionado del Árbol AVL y del BST mediante el procedimiento
de eliminación con rebalanceo (conservando los nodos descendientes activos).
Registra su ID en store.deleted_ids y sus datos en store.deleted_events.
Apila la acción en store.undo_stack para permitir la reversión atómica (Deshacer).
"""

from typing import Dict, Any
from src.core.bus.command_bus import Command
from src.core.errors.exceptions import SismoLabException
from src.infrastructure.persistence.in_memory_store import store

class EliminarEventoCommand(Command):
    """Comando para eliminar individualmente un evento activo"""
    def __init__(self, event_id: int):
        self.event_id = event_id


class EliminarEventoHandler:
    """Manejador de la Eliminación Individual de Evento Sísmico"""
    def handle(self, command: EliminarEventoCommand) -> Dict[str, Any]:
        event_id = command.event_id

        # 1. Verificar si existe en el Árbol AVL activo
        nodo = store.avl_tree.buscar_por_id(event_id)
        if nodo is None:
            if store.is_id_deleted(event_id):
                raise SismoLabException(
                    f"El evento SIS-{event_id:06d} ya fue eliminado previamente.",
                    code="EVENT_ALREADY_DELETED"
                )
            if store.is_id_archived(event_id):
                raise SismoLabException(
                    f"El evento SIS-{event_id:06d} está archivado en el histórico; no puede eliminarse del catálogo activo.",
                    code="EVENT_ARCHIVED"
                )
            raise SismoLabException(
                f"No se encontró ningún evento sísmico con el identificador SIS-{event_id:06d}.",
                code="EVENT_NOT_FOUND"
            )

        evento = nodo.getValor()
        current_clock = store.get_simulation_clock()
        snapshot_evento = evento.to_dict(current_clock=current_clock)

        # 2. Retirar físicamente del Árbol AVL (con rebalanceo) y del BST
        store.avl_tree.eliminar_por_id(event_id)
        store.bst_tree.eliminar(event_id)

        # 3. Registrar identificador en el registro inmutable de eliminados
        store.deleted_ids.add(event_id)
        store.deleted_events[event_id] = snapshot_evento

        # 4. Actualizar asociaciones que utilizaban al evento como referencia (Secciones 7 y 10)
        from src.domain.services.association_service import AssociationService
        pool_restante = store.get_all_active_and_archived_events()
        asociaciones_afectadas = {}
        for ev in pool_restante:
            if ev.evento_referencia_id == event_id or event_id in ev.candidatos_referencia:
                asociaciones_afectadas[ev.id] = (list(ev.candidatos_referencia), ev.evento_referencia_id)
                AssociationService.actualizar_asociaciones_para_evento(ev, pool_restante, store.param_w_hours, store.param_r_km)

        # 5. Actualizar marcas de acceso costoso tras rebalanceo del AVL (Sección 9)
        store.avl_tree.actualizar_marcas_acceso_costoso(store.param_budget_l)

        # 6. Apilar en la Pila LIFO de Deshacer (Undo Stack) con el objeto original para restauración
        store.undo_stack.push({
            "accion": "ELIMINAR_EVENTO",
            "evento_id": event_id,
            "evento_objeto": evento,
            "snapshot": snapshot_evento,
            "asociaciones_afectadas": asociaciones_afectadas
        })

        return {
            "success": True,
            "message": f"Evento {evento.composite_key.formatted_id()} eliminado individualmente del catálogo activo.",
            "data": {
                "id": event_id,
                "evento_eliminado": snapshot_evento,
                "nueva_altura_avl": store.avl_tree.obtener_altura(),
                "total_nodos_activos": store.avl_tree.contar_nodos()
            }
        }
