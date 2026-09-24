# -*- coding: utf-8 -*-
"""
Restore Version Command and Handler / Restaurar Versión Persistente
SismoLab AVL - Universidad de Caldas
Sección 13 del pliego oficial:
"Permite restaurar una versión guardada (operación que también puede deshacerse)."
"""

from typing import Dict, Any
from src.core.bus.command_bus import Command
from src.infrastructure.persistence.version_repository import version_repo
from src.infrastructure.persistence.in_memory_store import store

class RestaurarVersionCommand(Command):
    def __init__(self, nombre: str):
        self.nombre = nombre

class RestaurarVersionHandler:
    def handle(self, command: RestaurarVersionCommand) -> Dict[str, Any]:
        # 1. Capturar snapshot del estado actual antes de sobreescribir para permitir Deshacer
        snapshot_previo = version_repo._crear_snapshot(store)

        # 2. Restaurar la versión desde disco
        info = version_repo.restaurar_version(command.nombre, store)

        # 3. Registrar en la pila LIFO de deshacer
        store.undo_stack.push({
            "accion": "RESTAURAR_VERSION",
            "nombre_version_restaurada": command.nombre,
            "snapshot_anterior": snapshot_previo
        })

        return {
            "success": True,
            "message": f"Versión '{command.nombre}' restaurada exitosamente. La operación puede revertirse con Deshacer.",
            "data": info
        }
