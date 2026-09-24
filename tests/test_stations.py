# -*- coding: utf-8 -*-
"""
Tests for gestionar_estaciones Vertical Slice
SismoLab AVL - Universidad de Caldas
"""

import unittest
from src.features.gestionar_estaciones.dto import CrearEstacionDTO
from src.features.gestionar_estaciones.command import (
    CrearEstacionCommand, CrearEstacionHandler,
    ListarEstacionesQuery, ListarEstacionesHandler
)
from src.infrastructure.persistence.in_memory_store import store
from src.core.errors.exceptions import SismoLabException

class TestGestionarEstaciones(unittest.TestCase):
    def setUp(self):
        store.clear_all(load_samples=False)

    def test_listar_estaciones_iniciales(self):
        query = ListarEstacionesQuery()
        handler = ListarEstacionesHandler()
        res = handler.handle(query)
        self.assertTrue(res["success"])
        self.assertGreaterEqual(res["total"], 12)
        codigos = [s["codigo"] for s in res["estaciones"]]
        self.assertIn("EST-MANIZALES-01", codigos)
        self.assertIn("EST-PEREIRA-01", codigos)

    def test_crear_estacion_valida(self):
        dto = CrearEstacionDTO(
            codigo="EST-CARTAGENA-01",
            nombre="Estación Costera Cartagena de Indias",
            x=620.0,
            y=910.0,
            activa=True
        )
        command = CrearEstacionCommand(dto)
        handler = CrearEstacionHandler()
        res = handler.handle(command)

        self.assertTrue(res["success"])
        self.assertEqual(res["data"]["codigo"], "EST-CARTAGENA-01")
        self.assertEqual(res["data"]["x"], 620.0)
        self.assertEqual(res["data"]["y"], 910.0)

        # Verificar que aparezca en el listado
        query = ListarEstacionesQuery()
        list_res = ListarEstacionesHandler().handle(query)
        codigos = [s["codigo"] for s in list_res["estaciones"]]
        self.assertIn("EST-CARTAGENA-01", codigos)

    def test_crear_estacion_duplicada_lanza_excepcion(self):
        dto = CrearEstacionDTO(
            codigo="EST-MANIZALES-01",
            nombre="Duplicada",
            x=380.0,
            y=520.0
        )
        command = CrearEstacionCommand(dto)
        handler = CrearEstacionHandler()
        with self.assertRaises(SismoLabException):
            handler.handle(command)

    def test_crear_estacion_fuera_de_rango_lanza_excepcion(self):
        with self.assertRaises(Exception):
            CrearEstacionDTO(
                codigo="EST-INVALIDA-01",
                nombre="Estación Fuera de Plano",
                x=1200.0,
                y=500.0
            )

if __name__ == "__main__":
    unittest.main()
