# -*- coding: utf-8 -*-
"""
Export Scenario Command and Handler / Exportación Completa del Escenario
SismoLab AVL - Universidad de Caldas
Sección 12 del pliego oficial: Exportación de estructura y estado completo.
"""

from typing import Dict, Any
from src.core.bus.command_bus import Command
from src.infrastructure.persistence.in_memory_store import store

class ExportarEscenarioCommand(Command):
    def __init__(self, incluir_topologia: bool = True):
        self.incluir_topologia = incluir_topologia

class ExportarEscenarioHandler:
    def handle(self, command: ExportarEscenarioCommand) -> Dict[str, Any]:
        current_clock = store.get_simulation_clock()

        # Serializar eventos activos
        eventos_activos = [e.to_dict(current_clock=current_clock) for e in store.avl_tree.recorrido_inorden()]

        # Serializar histórico archivado
        eventos_archivados = [e.to_dict(current_clock=current_clock) for e in store.archived_events.values()]

        # Serializar estaciones
        estaciones_dict = {
            code: {
                "codigo": s.code,
                "nombre": s.name,
                "x": s.coordinates.x,
                "y": s.coordinates.y
            }
            for code, s in store.stations.items()
        }

        # Serializar zonas
        zonas_list = [
            {
                "codigo": z.code,
                "nombre": z.name,
                "x_min": z.x_min,
                "x_max": z.x_max,
                "y_min": z.y_min,
                "y_max": z.y_max,
                "es_poblada": z.is_populated
            }
            for z in store.zones
        ]

        payload: Dict[str, Any] = {
            "formato_version": "2026.1",
            "tipo_escenario": "SismoLab_AVL_Escenario_Completo",
            "reloj_simulacion": store.get_simulation_clock_iso(),
            "parametros": store.get_scenario_parameters(),
            "zonas": zonas_list,
            "estaciones": estaciones_dict,
            "catalogo_activo": eventos_activos,
            "historico_archivado": eventos_archivados,
            "identificadores_eliminados": list(store.deleted_ids),
            "metricas_arboles": {
                "avl": {
                    "total_nodos": store.avl_tree.contar_nodos(),
                    "altura": store.avl_tree.obtener_altura(),
                    "cantidad_hojas": store.avl_tree.contar_hojas(),
                    "desglose_rotaciones": store.avl_tree.obtener_desglose_rotaciones()
                },
                "bst": {
                    "total_nodos": store.bst_tree.contar_nodos(),
                    "altura": store.bst_tree.obtener_altura(),
                    "cantidad_hojas": store.bst_tree.contar_hojas()
                }
            }
        }

        if command.incluir_topologia:
            payload["topologia_avl"] = store.avl_tree.exportar_topologia_dict()

        return {
            "success": True,
            "message": "Escenario exportado exitosamente con topología completa y métricas.",
            "data": payload
        }
