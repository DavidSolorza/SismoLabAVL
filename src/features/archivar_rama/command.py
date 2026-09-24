# -*- coding: utf-8 -*-
"""
Command and Handler for archivar_rama (Sección 10) / Comando y Handler para archivar_rama
SismoLab AVL - Universidad de Caldas

Poda y traslada al almacén histórico un subárbol completo elegible del AVL activo:
- Todos los eventos del subárbol deben tener Prioridad Baja (P=1) y antigüedad > T horas.
- Desempate estricto: mayor tamaño |S| -> mayor profundidad de raíz -> mayor ID numérico de raíz.
- Previsualización fija con IDs afectados y justificación algorítmica.
- Reversible mediante acción única en la Pila LIFO de Deshacer.
"""

from typing import Dict, Any, Optional
from src.core.bus.command_bus import Command, Query
from src.features.archivar_rama.dto import ArchivarRamaDTO
from src.infrastructure.persistence.in_memory_store import store
from src.infrastructure.persistence.json_repository import JSONRepository

class PrevisualizarArchivoRamaQuery(Query):
    def __init__(self, t_horas: Optional[float] = None):
        self.t_horas = t_horas


class PrevisualizarArchivoRamaHandler:
    def handle(self, query: PrevisualizarArchivoRamaQuery) -> Dict[str, Any]:
        t_umbral = query.t_horas if query.t_horas is not None else store.param_archive_t_hours
        reloj_utc = store.get_simulation_clock()

        seleccion = store.avl_tree.buscar_subarbol_elegible_archivo(reloj_utc, t_umbral)

        if seleccion is None:
            return {
                "success": True,
                "elegible": False,
                "message": f"No existe ninguna rama elegible para archivo en el estado actual (P=1 y antigüedad > {t_umbral}h).",
                "data": None
            }

        eventos_ids = [ev.id for ev in seleccion["eventos"] if hasattr(ev, 'id')]

        return {
            "success": True,
            "elegible": True,
            "message": "Rama elegible para archivo encontrada exitosamente.",
            "data": {
                "tamano": seleccion["tamano"],
                "profundidad_raiz": seleccion["profundidad_raiz"],
                "id_raiz": seleccion["id_raiz"],
                "es_todo_el_arbol": seleccion["es_todo_el_arbol"],
                "eventos_afectados_ids": eventos_ids,
                "justificacion": seleccion["justificacion"],
                "umbral_t_horas": t_umbral
            }
        }


class ArchivarRamaCommand(Command):
    def __init__(self, dto: ArchivarRamaDTO):
        self.dto = dto


class ArchivarRamaHandler:
    def handle(self, command: ArchivarRamaCommand) -> Dict[str, Any]:
        dto = command.dto
        t_umbral = dto.t_horas if dto.t_horas is not None else store.param_archive_t_hours
        reloj_utc = store.get_simulation_clock()

        # 1. Evaluar subárboles elegibles aplicando desempate determinista (Sección 10)
        seleccion = store.avl_tree.buscar_subarbol_elegible_archivo(reloj_utc, t_umbral)

        if seleccion is None:
            return {
                "success": False,
                "message": f"No existe ninguna rama elegible para archivo en el árbol AVL activo (con P=1 y antigüedad > {t_umbral}h). Se conserva el estado actual.",
                "data": {
                    "nodos_archivados": 0,
                    "eventos_archivados_ids": []
                }
            }

        nodo_raiz_elegido = seleccion["nodo_raiz"]
        justificacion = seleccion["justificacion"]

        # 2. Podar físicamente el subárbol completo seleccionado
        eventos_podados = store.avl_tree.podar_subarbol_por_nodo(nodo_raiz_elegido)

        # 3. Remover del BST e incorporar al almacén histórico de archivados
        for ev in eventos_podados:
            if hasattr(ev, 'id'):
                store.bst_tree.eliminar(ev.id)
                store.archived_events[ev.id] = ev

        # 4. Actualizar marcas de acceso costoso en el AVL restante
        store.avl_tree.actualizar_marcas_acceso_costoso(store.param_budget_l)

        # 5. Registrar en la Pila LIFO de Deshacer como acción única atómica
        store.undo_stack.push({
            "accion": "ARCHIVAR_RAMA",
            "eventos_archivados": eventos_podados
        })

        json_path = None
        if dto.guardar_json:
            repo = JSONRepository()
            json_path = repo.export_snapshot()

        eventos_ids = [ev.id for ev in eventos_podados if hasattr(ev, 'id')]

        return {
            "success": True,
            "message": f"Se archivó exitosamente la rama seleccionada ({len(eventos_podados)} eventos trasladados al histórico).",
            "data": {
                "nodos_archivados": len(eventos_podados),
                "eventos_archivados_ids": eventos_ids,
                "justificacion": justificacion,
                "nueva_altura_avl": store.avl_tree.obtener_altura(),
                "total_nodos_activos": store.avl_tree.contar_nodos(),
                "snapshot_json_guardado": json_path
            }
        }
