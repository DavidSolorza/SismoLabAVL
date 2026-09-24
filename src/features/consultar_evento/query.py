# -*- coding: utf-8 -*-
"""
Query and Handler for consultar_evento / Consulta de Evento Sísmico
SismoLab AVL - Universidad de Caldas

Permite localizar un evento por su identificador único (I) en O(1) usando self.indice_por_id.
Retorna su estado operativo ('ACTIVO', 'ARCHIVADO', 'ELIMINADO') y, si está activo,
sus datos vigentes completos junto con las métricas del nodo en el Árbol AVL
(profundidad del nodo, altura, factor de balance y asociaciones).
"""

from typing import Dict, Any, Optional
from src.core.bus.command_bus import Command
from src.core.errors.exceptions import SismoLabException
from src.infrastructure.persistence.in_memory_store import store

class ConsultarEventoQuery(Command):
    """Query para consultar un evento sísmico por ID"""
    def __init__(self, event_id: int):
        self.event_id = event_id


class ConsultarEventoHandler:
    """Manejador de la Consulta de Evento Sísmico"""
    def handle(self, query: ConsultarEventoQuery) -> Dict[str, Any]:
        event_id = query.event_id

        # 1. Comprobar si está activo en el Árbol AVL (Búsqueda O(1) vía indice_por_id)
        nodo = store.avl_tree.buscar_por_id(event_id)
        if nodo is not None:
            evento = nodo.getValor()
            metricas_nodo = store.avl_tree.obtener_metricas_nodo(event_id) or {}
            current_clock = store.get_simulation_clock()
            ev_dict = evento.to_dict(current_clock=current_clock)

            return {
                "success": True,
                "estado_catalogo": "ACTIVO",
                "message": f"Evento {evento.composite_key.formatted_id()} localizado en el Árbol AVL activo.",
                "data": {
                    **ev_dict,
                    "nodo_avl": metricas_nodo,
                    "estructura_localizacion": "Índice Hash Auxiliar O(1) (indice_por_id)"
                }
            }

        # 2. Comprobar si está archivado en el histórico (tras poda de ramas)
        if store.is_id_archived(event_id):
            evento_arch = store.archived_events[event_id]
            ev_dict = evento_arch.to_dict() if hasattr(evento_arch, 'to_dict') else str(evento_arch)
            return {
                "success": True,
                "estado_catalogo": "ARCHIVADO",
                "message": f"El evento SIS-{event_id:06d} se encuentra en el registro histórico de ramas archivadas.",
                "data": ev_dict
            }

        # 3. Comprobar si está eliminado individualmente
        if store.is_id_deleted(event_id):
            datos_previos = store.deleted_events.get(event_id, {})
            return {
                "success": True,
                "estado_catalogo": "ELIMINADO",
                "message": f"El evento SIS-{event_id:06d} fue eliminado individualmente del catálogo activo.",
                "data": datos_previos
            }

        # 4. No encontrado
        raise SismoLabException(
            f"No se encontró ningún evento sísmico con el identificador SIS-{event_id:06d} (no existe en activos, archivados ni eliminados).",
            code="EVENT_NOT_FOUND"
        )
