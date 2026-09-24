# -*- coding: utf-8 -*-
"""
Save Named Version Command and Handler / Guardar Versión Persistente
SismoLab AVL - Universidad de Caldas
Sección 13 del pliego oficial:
"Almacenar versiones persistentes del escenario con nombres asignados por el usuario
y recuperarlas posteriormente... Permite listar las versiones existentes..."
"""

from typing import Dict, Any, Optional
from src.core.bus.command_bus import Command
from src.infrastructure.persistence.version_repository import version_repo
from src.infrastructure.persistence.in_memory_store import store

class GuardarVersionCommand(Command):
    def __init__(self, nombre: str, descripcion: Optional[str] = None):
        self.nombre = nombre
        self.descripcion = descripcion


class GuardarVersionHandler:
    def handle(self, command: GuardarVersionCommand) -> Dict[str, Any]:
        info = version_repo.guardar_version(
            nombre=command.nombre,
            store=store,
            descripcion=command.descripcion
        )
        return {
            "success": True,
            "message": f"Versión persistente '{command.nombre}' guardada exitosamente en disco.",
            "data": info
        }
