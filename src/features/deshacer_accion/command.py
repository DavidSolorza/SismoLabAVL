# -*- coding: utf-8 -*-
"""
Command and Handler for deshacer_accion / Comando y Handler para deshacer_accion
SismoLab AVL - Universidad de Caldas
"""

from typing import Dict, Any
from src.core.bus.command_bus import Command
from src.core.errors.exceptions import EmptyStructureException
from src.infrastructure.persistence.in_memory_store import store
from src.domain.entities.seismic_event import SeismicEvent
from src.domain.value_objects.coordinates import GeographicCoordinates

class DeshacerAccionCommand(Command):
    """Command to Undo the Last Executed Operation via LIFO Stack"""
    pass


class DeshacerAccionHandler:
    def handle(self, command: DeshacerAccionCommand) -> Dict[str, Any]:
        if store.undo_stack.is_empty():
            raise EmptyStructureException("Pila de Deshacer (Undo Stack)")

        operacion = store.undo_stack.pop()
        accion = operacion["accion"]
        evento_id = operacion["evento_id"]
        datos_anteriores = operacion.get("datos_anteriores")

        if accion in ("CREAR_EVENTO", "PROCESAR_REPORTE"):
            # Revertir creación: Eliminar evento del AVL y BST / Revert creation: Delete from AVL & BST
            store.avl_tree.eliminar_por_id(evento_id)
            store.bst_tree.eliminar(evento_id)
            msg = f"Se revirtió la creación del evento {evento_id} (eliminado del AVL)."

        elif accion == "CORREGIR_EVENTO" and datos_anteriores:
            # Revertir corrección: restaurar estado anterior / Revert correction: restore previous state
            nodo = store.avl_tree.buscar_por_id(evento_id)
            if nodo:
                ev = nodo.getValor()
                store.avl_tree.eliminar_por_id(evento_id)
                store.bst_tree.eliminar(evento_id)
                ev.update_telemetry(datos_anteriores["magnitud"], datos_anteriores["profundidad"])
                store.avl_tree.insertar(ev)
                store.bst_tree.insertar(ev)
            msg = f"Se revirtieron los cambios en el evento {evento_id} a sus valores anteriores."
        else:
            msg = f"Acción {accion} desapilada de la pila de deshacer."

        return {
            "success": True,
            "message": msg,
            "data": {
                "accion_revertida": accion,
                "evento_afectado_id": evento_id,
                "elementos_restantes_en_pila": store.undo_stack.size()
            }
        }
