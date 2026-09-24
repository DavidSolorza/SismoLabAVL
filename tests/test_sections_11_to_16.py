# -*- coding: utf-8 -*-
"""
Automated Test Suite for Sections 11 through 15
SismoLab AVL - Universidad de Caldas
"""

import unittest
from datetime import datetime, timezone
import src.presentation.api.main  # Registra los handlers en el bus
from src.infrastructure.persistence.in_memory_store import store
from src.core.bus.command_bus import global_command_bus
from src.core.errors.exceptions import DuplicateEventIdException, DomainValidationException

from src.features.consultar_analisis.queries import (
    ConsultarPrimerosKPendientesQuery,
    ConsultarPorRangoMagnitudQuery,
    ConsultarPorProfundidadYFechasQuery,
    ConsultarAsociacionesEventoQuery,
    ConsultarAccesoCostosoQuery
)
from src.features.consultar_analisis.benchmark_query import EjecutarBenchmarkComparativoQuery
from src.features.gestionar_escenario.exportar_command import ExportarEscenarioCommand
from src.features.gestionar_escenario.importar_inserciones_command import ImportarInsercionesCommand
from src.features.gestionar_escenario.importar_topologia_command import ImportarTopologiaCommand
from src.features.gestionar_versiones.guardar_version_command import GuardarVersionCommand
from src.features.gestionar_versiones.listar_versiones_query import ListarVersionesQuery
from src.features.gestionar_versiones.restaurar_version_command import RestaurarVersionCommand
from src.features.auditar_estructura.audit_feature import (
    VerificarEstructuraQuery,
    ConsultarIndicadoresCompletosQuery,
    ResetearContadoresRotacionCommand
)
from src.features.deshacer_accion.command import DeshacerAccionCommand
from src.domain.entities.report import SeismicReport


class TestSections11To15(unittest.TestCase):

    def setUp(self):
        store.clear_all(load_samples=True)

    def test_section_11_queries(self):
        """Sección 11: 5 consultas especializadas y justificación de poda"""
        # 1. Primeros k pendientes en orden descendente de K
        q_pend = ConsultarPrimerosKPendientesQuery(k=2)
        res_pend = global_command_bus.dispatch(q_pend)
        self.assertTrue(res_pend["success"])
        self.assertLessEqual(len(res_pend["eventos"]), 2)
        self.assertGreater(res_pend["nodos_examinados"], 0)
        self.assertIn("poda", res_pend["justificacion_poda"].lower())

        # 2. Intervalo inclusivo de magnitud
        q_mag = ConsultarPorRangoMagnitudQuery(m_min=4.0, m_max=7.0)
        res_mag = global_command_bus.dispatch(q_mag)
        self.assertTrue(res_mag["success"])
        for ev in res_mag["eventos"]:
            self.assertTrue(4.0 <= ev["magnitud"] <= 7.0)

        # 3. Profundidad <= H y fechas inclusivas
        q_depth = ConsultarPorProfundidadYFechasQuery(
            h_max=20.0,
            t_inicio="2026-09-22T00:00:00Z",
            t_fin="2026-09-22T23:59:59Z"
        )
        res_depth = global_command_bus.dispatch(q_depth)
        self.assertTrue(res_depth["success"])
        for ev in res_depth["eventos"]:
            self.assertLessEqual(ev["profundidad"], 20.0)

        # 4. Asociaciones de un evento
        q_asoc = ConsultarAsociacionesEventoQuery(event_id=1001)
        res_asoc = global_command_bus.dispatch(q_asoc)
        self.assertTrue(res_asoc["success"])
        self.assertEqual(res_asoc["evento"]["id"], 1001)
        self.assertIn("candidatos", res_asoc)
        self.assertIn("referencia_elegida", res_asoc)

        # 5. Acceso costoso (profundidad > L)
        q_cost = ConsultarAccesoCostosoQuery(limite_l=0)
        res_cost = global_command_bus.dispatch(q_cost)
        self.assertTrue(res_cost["success"])
        self.assertGreaterEqual(res_cost["total_eventos_prioridad_alta_costosos"], 0)

    def test_section_11_benchmark(self):
        """Sección 11: Benchmark experimental comparando AVL vs BST"""
        q_bench = EjecutarBenchmarkComparativoQuery(tamano_n=30, patron_orden="todos")
        res_bench = global_command_bus.dispatch(q_bench)
        self.assertTrue(res_bench["success"])
        self.assertIn("creciente", res_bench["resultados"])
        creciente = res_bench["resultados"]["creciente"]
        # En orden degenerado creciente, BST se convierte en lista enlazada (altura ~ 29)
        # mientras AVL se mantiene estrictamente balanceado O(log N)
        self.assertLess(creciente["avl"]["altura"], creciente["bst"]["altura"])
        self.assertLess(
            creciente["avl"]["promedio_comparaciones_busqueda"],
            creciente["bst"]["promedio_comparaciones_busqueda"]
        )

    def test_section_12_persistence_export_and_insertions(self):
        """Sección 12: Exportación y carga por inserciones con rechazo de duplicados"""
        # 1. Exportar
        exp_cmd = ExportarEscenarioCommand(incluir_topologia=True)
        res_exp = global_command_bus.dispatch(exp_cmd)
        self.assertTrue(res_exp["success"])
        payload = res_exp["data"]
        self.assertIn("catalogo_activo", payload)
        self.assertIn("topologia_avl", payload)

        # 2. Carga por inserciones válida
        lote_valido = {
            "eventos": [
                {"id": 5001, "magnitud": 4.5, "profundidad": 10.0, "x": 300.0, "y": 400.0, "revision": 1},
                {"id": 5002, "magnitud": 5.5, "profundidad": 15.0, "x": 350.0, "y": 450.0, "revision": 1},
                {"id": 5003, "magnitud": 3.0, "profundidad": 20.0, "x": 200.0, "y": 200.0, "revision": 1},
            ]
        }
        imp_cmd = ImportarInsercionesCommand(datos_json=lote_valido, reemplazar_actual=True)
        res_imp = global_command_bus.dispatch(imp_cmd)
        self.assertTrue(res_imp["success"])
        self.assertIn("avl", res_imp["metricas"])
        self.assertIn("bst", res_imp["metricas"])
        self.assertEqual(res_imp["metricas"]["total_eventos_insertados"], 3)
        self.assertIsNotNone(res_imp["metricas"]["avl"]["raiz"])

        # 3. Carga con identificador duplicado en lote -> Rechazo obligatorio
        lote_duplicado = {
            "eventos": [
                {"id": 6001, "magnitud": 4.0, "profundidad": 10.0},
                {"id": 6001, "magnitud": 5.0, "profundidad": 15.0}
            ]
        }
        with self.assertRaises(DuplicateEventIdException):
            global_command_bus.dispatch(ImportarInsercionesCommand(datos_json=lote_duplicado))

    def test_section_12_persistence_topology_import(self):
        """Sección 12: Carga por topología con validación atómica y modo de operación"""
        # Exportar estado actual para obtener topología válida
        res_exp = global_command_bus.dispatch(ExportarEscenarioCommand(incluir_topologia=True))
        topologia = res_exp["data"]["topologia_avl"]

        imp_top = ImportarTopologiaCommand(datos_topologia=topologia, permitir_desbalance=True)
        res_top = global_command_bus.dispatch(imp_top)
        self.assertTrue(res_top["success"])
        self.assertEqual(res_top["modo_operacion"], "MODO_NORMAL")
        self.assertTrue(res_top["metricas"]["es_avl_estricto"])
        self.assertTrue(res_top["metricas"]["orden_bst_valido"])

        # Probar rechazo atómico ante datos corruptos
        corrupta = {"raiz": "NO_EXISTE", "nodos": {}}
        with self.assertRaises(DomainValidationException):
            global_command_bus.dispatch(ImportarTopologiaCommand(datos_topologia=corrupta))

    def test_section_13_undo_queue_and_named_versions(self):
        """Sección 13: Deshacer pasos de cola restaurando posición, y versiones con nombre"""
        # 1. Encolar y procesar reporte
        rep = SeismicReport(
            station_code="EST-PEREIRA-01",
            raw_data={"event_id": 7777, "magnitud": 4.1, "profundidad": 15.0, "revision": 1}
        )
        store.report_queue.enqueue(rep)
        self.assertEqual(store.report_queue.size(), 1)

        from src.features.procesar_reporte.command import ProcesarReporteCommand
        global_command_bus.dispatch(ProcesarReporteCommand())
        self.assertEqual(store.report_queue.size(), 0)
        self.assertTrue(store.is_id_active(7777))

        # Deshacer debe revertir creación del evento 7777 y RESTAURAR el reporte al frente de la cola
        res_undo = global_command_bus.dispatch(DeshacerAccionCommand())
        self.assertTrue(res_undo["success"])
        self.assertFalse(store.is_id_active(7777))
        self.assertEqual(store.report_queue.size(), 1)
        self.assertEqual(store.report_queue.peek().raw_data["event_id"], 7777)

        # 2. Versiones nombradas persistentes
        cmd_save = GuardarVersionCommand(nombre="Version_Test_11", descripcion="Prueba automatizada")
        res_save = global_command_bus.dispatch(cmd_save)
        self.assertTrue(res_save["success"])

        res_list = global_command_bus.dispatch(ListarVersionesQuery())
        self.assertTrue(res_list["success"])
        nombres = [v["nombre"] for v in res_list["versiones"]]
        self.assertIn("Version_Test_11", nombres)

        # Modificar store y luego restaurar versión
        store.avl_tree.eliminar_por_id(1001)
        self.assertFalse(store.is_id_active(1001))

        res_rest = global_command_bus.dispatch(RestaurarVersionCommand(nombre="Version_Test_11"))
        self.assertTrue(res_rest["success"])
        self.assertTrue(store.is_id_active(1001))

        # Restaurar versión también puede deshacerse
        res_undo_ver = global_command_bus.dispatch(DeshacerAccionCommand())
        self.assertTrue(res_undo_ver["success"])
        self.assertFalse(store.is_id_active(1001))

    def test_section_14_audit_and_rotation_indicators(self):
        """Sección 14: Verificar estructura exhaustiva, 4 recorridos y desglose de rotaciones"""
        # 1. Verificar estructura
        res_audit = global_command_bus.dispatch(VerificarEstructuraQuery())
        self.assertTrue(res_audit["success"])
        audit_data = res_audit["data"]
        self.assertTrue(audit_data["orden_bst_valido"])
        self.assertTrue(audit_data["punteros_reciprocos_validos"])
        self.assertTrue(audit_data["alturas_consistentes"])
        self.assertTrue(audit_data["factores_balance_validos"])
        self.assertTrue(audit_data["es_avl_valido"])

        # 2. Indicadores completos y 4 recorridos
        res_ind = global_command_bus.dispatch(ConsultarIndicadoresCompletosQuery())
        self.assertTrue(res_ind["success"])
        self.assertIn("inorden", res_ind["recorridos"])
        self.assertIn("preorden", res_ind["recorridos"])
        self.assertIn("postorden", res_ind["recorridos"])
        self.assertIn("por_niveles", res_ind["recorridos"])

        # 3. Desglose de rotaciones y reinicio
        desglose = res_ind["indicadores_avl"]["desglose_rotaciones"]
        self.assertIn("casos_ll", desglose)
        self.assertIn("casos_rr", desglose)
        self.assertIn("casos_lr", desglose)
        self.assertIn("casos_rl", desglose)
        self.assertIn("giros_simples_izquierda", desglose)
        self.assertIn("giros_simples_derecha", desglose)

        res_reset = global_command_bus.dispatch(ResetearContadoresRotacionCommand())
        self.assertTrue(res_reset["success"])
        desglose_post = store.avl_tree.obtener_desglose_rotaciones()
        self.assertEqual(desglose_post["total_rotaciones"], 0)


if __name__ == "__main__":
    unittest.main()
