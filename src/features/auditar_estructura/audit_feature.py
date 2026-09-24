# -*- coding: utf-8 -*-
"""
Auditing Feature, Indicators, and Traversals / Auditoría e Indicadores de Estructura
SismoLab AVL - Universidad de Caldas
Sección 14 del pliego oficial:
- Opción "Verificar estructura": orden del BST con cotas de ancestros, reciprocidad de punteros,
  alturas recalculadas (árbol vacío=-1, hoja=0) y FB=h_izq - h_der.
- 4 Recorridos: inorden, preorden, postorden, por niveles.
- Desglose de rotaciones: casos LL, RR, LR, RL y giros elementales simples (izq, der).
  Un caso doble cuenta como LR/RL y dos giros elementales simples.
- Opción de reiniciar contadores de rotación.
"""

from typing import Dict, Any, List
from src.core.bus.query_bus import Query
from src.core.bus.command_bus import Command
from src.infrastructure.persistence.in_memory_store import store

class VerificarEstructuraQuery(Query):
    pass

class VerificarEstructuraHandler:
    def handle(self, query: VerificarEstructuraQuery) -> Dict[str, Any]:
        resultado = store.avl_tree.verificar_estructura_exhaustiva()
        return {
            "success": True,
            "data": resultado
        }


class ConsultarIndicadoresCompletosQuery(Query):
    pass

class ConsultarIndicadoresCompletosHandler:
    def handle(self, query: ConsultarIndicadoresCompletosQuery) -> Dict[str, Any]:
        avl = store.avl_tree
        bst = store.bst_tree
        current_clock = store.get_simulation_clock()

        # 4 recorridos formales
        recorrido_inorden = [e.to_dict(current_clock=current_clock) for e in avl.recorrido_inorden()]
        recorrido_preorden = [e.to_dict(current_clock=current_clock) for e in avl.recorrido_preorden()]
        recorrido_postorden = [e.to_dict(current_clock=current_clock) for e in avl.recorrido_postorden()]
        recorrido_niveles = [e.to_dict(current_clock=current_clock) for e in avl.recorrido_por_niveles()]

        return {
            "success": True,
            "indicadores_avl": {
                "total_nodos": avl.contar_nodos(),
                "altura": avl.obtener_altura(),
                "cantidad_hojas": avl.contar_hojas(),
                "factor_balance_raiz": avl.obtener_factor_balance_raiz(),
                "desglose_rotaciones": avl.obtener_desglose_rotaciones(),
                "verificacion_estructural": avl.verificar_estructura_exhaustiva()
            },
            "indicadores_bst": {
                "total_nodos": bst.contar_nodos(),
                "altura": bst.obtener_altura(),
                "cantidad_hojas": bst.contar_hojas()
            },
            "recorridos": {
                "inorden": recorrido_inorden,
                "preorden": recorrido_preorden,
                "postorden": recorrido_postorden,
                "por_niveles": recorrido_niveles
            }
        }


class ResetearContadoresRotacionCommand(Command):
    pass

class ResetearContadoresRotacionHandler:
    def handle(self, command: ResetearContadoresRotacionCommand) -> Dict[str, Any]:
        valores_previos = store.avl_tree.obtener_desglose_rotaciones()
        store.avl_tree.resetear_todos_los_contadores()
        return {
            "success": True,
            "message": "Contadores de rotaciones (LL, RR, LR, RL y giros simples) reiniciados a cero.",
            "valores_anteriores": valores_previos
        }
