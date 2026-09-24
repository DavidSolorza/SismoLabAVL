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
from tests.test_sections_3_and_4 import (
    test_seccion_3_zonas_y_borde_compartido,
    test_seccion_4_calculo_obligatorio_de_prioridad,
    test_seccion_3_datos_evento_revision_procedencia_y_estado
)
from tests.test_sections_5_and_6 import (
    test_seccion_5_comparaciones_lexicograficas,
    test_seccion_5_recorridos_y_metricas_nodo,
    test_seccion_6_creacion_y_consulta,
    test_seccion_6_eliminacion_individual_y_deshacer,
    test_seccion_6_matriz_reportes
)
from tests.test_sections_7_to_10 import (
    test_section_7_associations_and_replicas,
    test_section_8_queue_step_details_and_stress_recovery,
    test_section_9_access_budget_and_expensive_flag,
    test_section_10_subtree_pruning_with_tie_breaker
)

def run_all_tests():
    print("="*60)
    print("EJECUTANDO SUITE DE PRUEBAS AUTOMATIZADAS SISMOLAB AVL")
    print("="*60)

    # 1. Pruebas de Clave Compuesta y AVL
    print("\n[1/10] Testing Composite Key K=(P, M, I) ordering (Lexicographical 3-level rule)...")
    test_composite_key_ordering()
    print("   -> PASSED! ClaveK comparison operators valid.")

    print("\n[2/10] Testing AVL O(1) Hash Index (indice_por_id) search & synchronization...")
    test_avl_hash_index_o1_search()
    print("   -> PASSED! In-memory hash index O(1) search and sync valid.")

    print("\n[3/10] Testing AVL tree recursive insertion & balance invariants...")
    test_avl_insertion_and_invariants()
    print("   -> PASSED! AVL insertion, rotations, and height balancing valid.")

    print("\n[4/10] Testing AVL Stress Mode & deferred rebalancing...")
    test_avl_rotations_stress_mode()
    print("   -> PASSED! Stress mode & deferred balance valid.")

    # 2. Pruebas de Cortes Verticales (Vertical Slices)
    print("\n[5/10] Testing Vertical Slice: crear_evento, corregir_evento & deshacer_accion...")
    setup_store()
    test_slice_crear_y_corregir_evento()
    print("   -> PASSED! Create, correct, and undo slices working cleanly.")

    print("\n[6/10] Testing Vertical Slice: procesar_reporte (FIFO) & archivar_rama...")
    setup_store()
    test_slice_procesar_reporte_y_archivar()
    print("   -> PASSED! Telemetry Queue processing and branch pruning working cleanly.")

    # 3. Pruebas del Reloj de Simulación
    print("\n[7/10] Testing Reloj de Simulación Explícito & Invariante Temporal...")
    run_simulation_clock_tests()
    print("   -> PASSED! Simulation clock advance, manual setting & future-event rejection valid.")

    # 4. Pruebas de las Secciones 3 y 4 (Plano Cartesiano, Zonas, Prioridad 3/2/1, Revisión, Procedencia y Estado)
    print("\n[8/10] Testing Secciones 3 y 4 (Zonas [0,1000]km, Prioridad 3/2/1, Revisión y Procedencia)...")
    test_seccion_3_zonas_y_borde_compartido()
    test_seccion_4_calculo_obligatorio_de_prioridad()
    test_seccion_3_datos_evento_revision_procedencia_y_estado()
    print("   -> PASSED! Zonas rectangulares, borde compartido, fórmulas P={3,2,1}, procedencia y estado 'Pendiente'/'Revisado' válidos.")

    # 5. Pruebas de las Secciones 5 y 6 (Inserción, Orden AVL, Consulta O(1), Eliminación y Matriz de Reportes)
    print("\n[9/10] Testing Secciones 5 y 6 (Orden AVL, Consulta O(1), Eliminación y Matriz de 5 Situaciones)...")
    test_seccion_5_comparaciones_lexicograficas()
    test_seccion_5_recorridos_y_metricas_nodo()
    test_seccion_6_creacion_y_consulta()
    test_seccion_6_eliminacion_individual_y_deshacer()
    test_seccion_6_matriz_reportes()
    print("   -> PASSED! Comparaciones, recorridos ascendente/descendente, eliminación y matriz de reportes válidos.")

    # 6. Pruebas de las Secciones 7, 8, 9 y 10 (Asociaciones deterministas, Cola/Estrés, Presupuesto L y Archivo Subárboles)
    print("\n[10/10] Testing Secciones 7, 8, 9 y 10 (Asociaciones W/R, Cola/Estrés, Presupuesto L, Archivo Subárboles)...")
    test_section_7_associations_and_replicas()
    test_section_8_queue_step_details_and_stress_recovery()
    test_section_9_access_budget_and_expensive_flag()
    test_section_10_subtree_pruning_with_tie_breaker()
    print("   -> PASSED! Asociaciones deterministas, reporte rotaciones/estrés, presupuesto L y poda de subárboles válidos.")

    # 7. Pruebas de las Secciones 11 a 16
    print("\n[11/11] Testing Secciones 11 a 16 (Consultas, Benchmark AVL vs BST, Topología, Versiones, Auditoría)...")
    import unittest
    suite = unittest.defaultTestLoader.loadTestsFromName("tests.test_sections_11_to_16")
    runner = unittest.TextTestRunner(verbosity=0)
    result = runner.run(suite)
    if not result.wasSuccessful():
        raise RuntimeError("Fallaron pruebas de las Secciones 11 a 16.")
    print("   -> PASSED! Consultas especializadas, benchmark, carga topológica, versiones persistentes y auditoría válidos.")

    print("\n" + "="*60)
    print("TODAS LAS PRUEBAS (11/11) PASARON EXITOSAMENTE SIN ERRORES!")
    print("="*60)

if __name__ == "__main__":
    run_all_tests()

