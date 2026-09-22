# -*- coding: utf-8 -*-
"""
Standalone Test Runner / Ejecutor de Pruebas Autónomo
SismoLab AVL - Universidad de Caldas
"""

import sys
import os
sys.path.insert(0, os.path.abspath("."))

from tests.test_avl_tree import (
    test_composite_key_ordering,
    test_avl_insertion_and_invariants,
    test_avl_rotations_stress_mode,
    test_avl_hash_index_o1_search
)
from tests.test_vertical_slices import setup_store, test_slice_crear_y_corregir_evento, test_slice_procesar_reporte_y_archivar
from tests.test_simulation_clock import run_simulation_clock_tests

def run_all_tests():
    print("="*60)
    print("EJECUTANDO SUITE DE PRUEBAS AUTOMATIZADAS SISMOLAB AVL")
    print("="*60)

    # 1. Pruebas de Clave Compuesta y AVL
    print("\n[1/7] Testing Composite Key K=(P, M, I) ordering (Lexicographical 3-level rule)...")
    test_composite_key_ordering()
    print("   -> PASSED! ClaveK comparison operators valid.")

    print("\n[2/7] Testing AVL O(1) Hash Index (indice_por_id) search & synchronization...")
    test_avl_hash_index_o1_search()
    print("   -> PASSED! In-memory hash index O(1) search and sync valid.")

    print("\n[3/7] Testing AVL tree recursive insertion & balance invariants...")
    test_avl_insertion_and_invariants()
    print("   -> PASSED! AVL insertion, rotations, and height balancing valid.")

    print("\n[4/7] Testing AVL Stress Mode & deferred rebalancing...")
    test_avl_rotations_stress_mode()
    print("   -> PASSED! Stress mode & deferred balance valid.")

    # 2. Pruebas de Cortes Verticales (Vertical Slices)
    print("\n[5/7] Testing Vertical Slice: crear_evento, corregir_evento & deshacer_accion...")
    setup_store()
    test_slice_crear_y_corregir_evento()
    print("   -> PASSED! Create, correct, and undo slices working cleanly.")

    print("\n[6/7] Testing Vertical Slice: procesar_reporte (FIFO) & archivar_rama...")
    setup_store()
    test_slice_procesar_reporte_y_archivar()
    print("   -> PASSED! Telemetry Queue processing and branch pruning working cleanly.")

    # 3. Pruebas del Reloj de Simulación
    print("\n[7/7] Testing Reloj de Simulación Explícito & Invariante Temporal...")
    run_simulation_clock_tests()
    print("   -> PASSED! Simulation clock advance, manual setting & future-event rejection valid.")

    print("\n" + "="*60)
    print("TODAS LAS PRUEBAS (7/7) PASARON EXITOSAMENTE SIN ERRORES!")
    print("="*60)

if __name__ == "__main__":
    run_all_tests()
