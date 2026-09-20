# -*- coding: utf-8 -*-
"""
Command and Handler for archivar_rama / Comando y Handler para archivar_rama
SismoLab AVL - Universidad de Caldas
"""

from typing import Dict, Any
from src.core.bus.command_bus import Command
from src.features.archivar_rama.dto import ArchivarRamaDTO
from src.infrastructure.persistence.in_memory_store import store
from src.infrastructure.persistence.json_repository import JSONRepository

class ArchivarRamaCommand(Command):
    def __init__(self, dto: ArchivarRamaDTO):
        self.dto = dto


class ArchivarRamaHandler:
    def handle(self, command: ArchivarRamaCommand) -> Dict[str, Any]:
        dto = command.dto

        # Podar subárboles AVL por prioridad / Prune AVL subtrees by priority
        eventos_podados = store.avl_tree.podar_por_prioridad(dto.prioridad_minima)

        # También podar en el BST / Also prune in BST
        for ev in eventos_podados:
            if hasattr(ev, 'id'):
                store.bst_tree.eliminar(ev.id)

        json_path = None
        if dto.guardar_json:
            repo = JSONRepository()
            json_path = repo.export_snapshot()

        return {
            "success": True,
            "message": f"Se podaron y archivaron {len(eventos_podados)} eventos con prioridad >= {dto.prioridad_minima}.",
            "data": {
                "nodos_archivados": len(eventos_podados),
                "eventos_archivados_ids": [ev.id for ev in eventos_podados if hasattr(ev, 'id')],
                "nueva_altura_avl": store.avl_tree.obtener_altura(),
                "snapshot_json_guardado": json_path
            }
        }
