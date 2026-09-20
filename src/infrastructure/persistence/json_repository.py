# -*- coding: utf-8 -*-
"""
JSON Persistence Repository / Adaptador de Persistencia en Formato JSON
SismoLab AVL - Universidad de Caldas

Permite guardar y cargar instantáneas (snapshots) del estado del sistema en disco.
Allows saving and loading system state snapshots to/from disk.
"""

import json
import os
from typing import Dict, Any, List
from src.infrastructure.persistence.in_memory_store import store
from src.domain.entities.seismic_event import SeismicEvent
from src.domain.value_objects.coordinates import GeographicCoordinates
from src.core.config.settings import settings

class JSONRepository:
    """
    Repositorio de Persistencia JSON / JSON Persistence Repository
    """
    def __init__(self, file_path: str = settings.STORAGE_FILE_PATH):
        self.file_path = file_path

    def export_snapshot(self) -> str:
        """
        Exporta el estado actual del AVLTree a un archivo JSON.
        Exports current AVLTree state to a JSON file.
        """
        eventos = store.avl_tree.recorrido_inorden()
        events_data = [e.to_dict() for e in eventos]

        snapshot = {
            "version": settings.VERSION,
            "exported_at": os.path.basename(self.file_path),
            "avl_metadata": {
                "total_nodes": store.avl_tree.contar_nodos(),
                "height": store.avl_tree.obtener_altura(),
                "mode": store.avl_tree.modo.value
            },
            "events": events_data
        }

        with open(self.file_path, "w", encoding="utf-8") as f:
            json.dump(snapshot, f, indent=2, ensure_ascii=False)

        return self.file_path

    def import_snapshot(self) -> int:
        """
        Importa eventos desde un archivo JSON hacia el AVLTree y BST.
        Imports events from a JSON file into AVLTree and BST.
        Returns count of imported events.
        """
        if not os.path.exists(self.file_path):
            return 0

        with open(self.file_path, "r", encoding="utf-8") as f:
            snapshot = json.load(f)

        events_list: List[Dict[str, Any]] = snapshot.get("events", [])
        imported_count = 0

        for item in events_list:
            try:
                coords = GeographicCoordinates(
                    latitude=item["coordenadas"]["latitude"],
                    longitude=item["coordenadas"]["longitude"]
                )
                ev = SeismicEvent(
                    event_id=item["id"],
                    magnitude=item["magnitud"],
                    depth=item["profundidad"],
                    coordinates=coords,
                    station_id=item.get("estacion_id", "EST-MANIZALES-01"),
                    is_populated_zone=item.get("zona_poblada", False),
                    timestamp=item.get("timestamp"),
                    status=item.get("estado", "ACTIVO")
                )
                store.avl_tree.insertar(ev)
                store.bst_tree.insertar(ev)
                imported_count += 1
            except Exception:
                pass

        return imported_count
