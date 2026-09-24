# -*- coding: utf-8 -*-
"""
List Versions Query and Handler / Listar Versiones Persistentes
SismoLab AVL - Universidad de Caldas
Sección 13 del pliego oficial: Listar las versiones existentes en almacenamiento.
"""

from typing import Dict, Any
from src.core.bus.query_bus import Query
from src.infrastructure.persistence.version_repository import version_repo

class ListarVersionesQuery(Query):
    pass

class ListarVersionesHandler:
    def handle(self, query: ListarVersionesQuery) -> Dict[str, Any]:
        versiones = version_repo.listar_versiones()
        return {
            "success": True,
            "total_versiones": len(versiones),
            "versiones": versiones
        }
