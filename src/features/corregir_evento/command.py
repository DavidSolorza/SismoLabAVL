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
        
        # 1. Buscar evento existente por ID / Search existing event by ID
        nodo_avl = store.avl_tree.buscar_por_id(dto.event_id)
        if nodo_avl is None:
            raise EventNotFoundException(str(dto.event_id))

        evento = nodo_avl.getValor()
        
        # Guardar snapshot anterior para deshacer / Save previous snapshot for undo
        estado_anterior = {
            "magnitud": evento.magnitude,
            "profundidad": evento.depth,
            "prioridad": evento.priority,
            "composite_key": evento.composite_key
        }

        # 2. Eliminar del AVL para re-estructuración segura si cambia la clave
        # Remove from AVL for safe restructuring if key changes
        store.avl_tree.eliminar_por_id(dto.event_id)
        store.bst_tree.eliminar(dto.event_id)

        # 3. Aplicar telemetría corregida / Apply corrected telemetry
        prioridad_cambio = evento.update_telemetry(dto.nueva_magnitud, dto.nueva_profundidad)

        # 4. Re-insertar en AVL y BST / Re-insert into AVL and BST
        store.avl_tree.insertar(evento)
        store.bst_tree.insertar(evento)

        # 5. Registrar en la Pila de Deshacer / Record in Undo Stack
        store.undo_stack.push({
            "accion": "CORREGIR_EVENTO",
            "evento_id": evento.id,
            "datos_anteriores": estado_anterior
        })

        return {
            "success": True,
            "message": f"Evento {evento.composite_key.formatted_id()} corregido exitosamente. ¿Cambió prioridad?: {prioridad_cambio}",
            "data": {
                "evento": evento.to_dict(),
                "prioridad_cambio": prioridad_cambio,
                "razon": dto.razon
            }
        }
