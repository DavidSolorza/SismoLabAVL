# -*- coding: utf-8 -*-
"""
AVL Structural Auditor & Performance Metrics / Auditor Estructural del AVL
SismoLab AVL - Universidad de Caldas

Inspecciona la integridad estructural del AVL, valida invariantes de balanceo y compara contra el BST.
Inspects AVL structural integrity, validates balance invariants, and compares against BST.
"""

from typing import Dict, Any
from src.infrastructure.persistence.in_memory_store import store

class AVLAuditor:
    """
    Auditor de Métricas e Invariantes del AVL / AVL Metrics & Invariants Auditor
    """
    @staticmethod
    def get_metrics() -> Dict[str, Any]:
        avl = store.avl_tree
        bst = store.bst_tree

        total_nodos = avl.contar_nodos()
        altura_avl = avl.obtener_altura()
        altura_bst = bst.obtener_altura()

        es_valido, detalle = avl.es_avl_valido()

        # Calcular porcentaje de eficiencia relativa / Calculate relative efficiency percentage
        diferencia_altura = max(0, altura_bst - altura_avl)
        mejora_pct = round((diferencia_altura / max(1, altura_bst)) * 100, 1) if altura_bst > 0 else 0.0

        return {
            "total_nodos": total_nodos,
            "altura_avl": altura_avl,
            "altura_bst": altura_bst,
            "modo_operacional": avl.modo.value,
            "es_avl_valido": es_valido,
            "detalle_balanceo": detalle,
            "diferencia_altura_bst_vs_avl": diferencia_altura,
            "eficiencia_busqueda": f"AVL es {mejora_pct}% más óptimo en profundidad que BST / AVL is {mejora_pct}% more height-optimal than BST"
        }
