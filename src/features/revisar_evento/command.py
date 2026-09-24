# -*- coding: utf-8 -*-
"""
Command and Handler for revisar_evento / Comando y Handler para revisar_evento
SismoLab AVL - Universidad de Caldas

Permite transicionar el estado de atención de un evento a 'Revisado'
(Sección 3: 'Estado de atención: Pendiente o revisado. Un alta inicia pendiente.
Una corrección aceptada de sus datos lo devuelve a pendiente').
"""

from typing import Dict, Any
from src.core.bus.command_bus import Command
from src.core.errors.exceptions import EventNotFoundException
from src.infrastructure.persistence.in_memory_store import store

class RevisarEventoCommand(Command):
    def __init__(self, event_id: int):
        self.event_id = int(event_id)


class RevisarEventoHandler:
    def handle(self, command: RevisarEventoCommand) -> Dict[str, Any]:
        nodo = store.avl_tree.buscar_por_id(command.event_id)
        if nodo is None:
            raise EventNotFoundException(str(command.event_id))
        evento = nodo.getValor()
        estado_previo = evento.estado_atencion
        evento.marcar_revisado()

        # Registrar en Pila LIFO para permitir deshacer (Sección 6)
        store.undo_stack.push({
            "accion": "REVISAR_EVENTO",
            "evento_id": evento.id,
            "estado_previo": estado_previo
        })

        current_clock = store.get_simulation_clock()
        return {
            "success": True,
            "message": f"Evento {evento.composite_key.formatted_id()} marcado como 'Revisado'.",
            "data": evento.to_dict(current_clock=current_clock)
        }
