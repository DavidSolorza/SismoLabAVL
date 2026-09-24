# -*- coding: utf-8 -*-
"""
Benchmark Query and Handler / Análisis Experimental Comparativo AVL vs BST
SismoLab AVL - Universidad de Caldas
Sección 11 del pliego oficial:
"Análisis experimental del costo de acceso: Evaluar altura y cantidad de comparaciones
en búsquedas para árboles de diferentes tamaños (por ejemplo, n = 50, 100, 200, 500)
construidos con diferentes órdenes de llegada (aleatorio, orden degenerado creciente, etc.)."
"""

import random
from typing import Dict, Any, List
from src.core.bus.query_bus import Query
from src.domain.structures.avl import ArbolAVL
from src.domain.structures.bst import ArbolBST
from src.domain.entities.seismic_event import SeismicEvent
from src.domain.value_objects.coordinates import CartesianCoordinates

class EjecutarBenchmarkComparativoQuery(Query):
    def __init__(self, tamano_n: int = 100, patron_orden: str = "todos"):
        self.tamano_n = max(10, min(1000, int(tamano_n)))
        self.patron_orden = patron_orden.lower()  # "aleatorio", "creciente", "decreciente", "todos"


class EjecutarBenchmarkComparativoHandler:
    def handle(self, query: EjecutarBenchmarkComparativoQuery) -> Dict[str, Any]:
        n = query.tamano_n
        patrones = ["aleatorio", "creciente", "decreciente"] if query.patron_orden == "todos" else [query.patron_orden]

        resultados_por_patron = {}

        for patron in patrones:
            # 1. Generar N eventos base
            eventos = []
            for i in range(1, n + 1):
                ev = SeismicEvent(
                    event_id=10000 + i,
                    magnitude=round(random.uniform(2.0, 7.5), 1),
                    depth=round(random.uniform(5.0, 150.0), 1),
                    coordinates=CartesianCoordinates(
                        round(random.uniform(50.0, 950.0), 1),
                        round(random.uniform(50.0, 950.0), 1)
                    ),
                    station_id="EST-BENCH-01",
                    is_populated_zone=(i % 2 == 0),
                    timestamp=f"2026-09-22T10:{i%60:02d}:00Z"
                )
                ev.recalcular_prioridad_y_clave()
                eventos.append(ev)

            # 2. Ordenar según el patrón
            if patron == "creciente":
                # Orden degenerado creciente por clave K=(P, M, I)
                eventos.sort(key=lambda e: (e.priority, e.magnitude, e.id))
            elif patron == "decreciente":
                # Orden degenerado decreciente
                eventos.sort(key=lambda e: (e.priority, e.magnitude, e.id), reverse=True)
            else:
                # Aleatorio uniforme reproducible
                rnd = random.Random(42 + n)
                rnd.shuffle(eventos)

            # 3. Construir AVL y BST desde cero
            arbol_avl = ArbolAVL()
            arbol_bst = ArbolBST()

            for ev in eventos:
                arbol_avl.insertar(ev)
                arbol_bst.insertar(ev)

            # 4. Medir propiedades estructurales
            h_avl = arbol_avl.obtener_altura()
            h_bst = arbol_bst.obtener_altura()
            hojas_avl = arbol_avl.contar_hojas()
            hojas_bst = arbol_bst.contar_hojas()

            # 5. Medir costo de búsqueda exitosa (promedio de comparaciones/visitas para cada elemento)
            comps_avl_exito = []
            comps_bst_exito = []

            for ev in eventos:
                _, visitas_avl = arbol_avl.buscar_nodo_por_clave_con_visitas(ev.composite_key)
                comps_avl_exito.append(visitas_avl)

                _, comps_bst = arbol_bst.buscar_clave_con_comparaciones(ev.composite_key)
                comps_bst_exito.append(comps_bst)

            prom_avl_exito = round(sum(comps_avl_exito) / len(comps_avl_exito), 2)
            prom_bst_exito = round(sum(comps_bst_exito) / len(comps_bst_exito), 2)
            max_avl_exito = max(comps_avl_exito)
            max_bst_exito = max(comps_bst_exito)

            # 6. Desglose de rotaciones producidas en AVL
            rotaciones_desglose = arbol_avl.obtener_desglose_rotaciones()

            resultados_por_patron[patron] = {
                "n_elementos": n,
                "orden_insercion": patron,
                "avl": {
                    "altura": h_avl,
                    "cantidad_hojas": hojas_avl,
                    "promedio_comparaciones_busqueda": prom_avl_exito,
                    "maximo_comparaciones_busqueda": max_avl_exito,
                    "rotaciones_totales": rotaciones_desglose["total_rotaciones"],
                    "desglose_rotaciones": rotaciones_desglose
                },
                "bst": {
                    "altura": h_bst,
                    "cantidad_hojas": hojas_bst,
                    "promedio_comparaciones_busqueda": prom_bst_exito,
                    "maximo_comparaciones_busqueda": max_bst_exito
                },
                "comparativa": {
                    "reduccion_altura_porcentual": round((1.0 - (h_avl / max(1, h_bst))) * 100.0, 1),
                    "eficiencia_busqueda_factor": round(prom_bst_exito / max(1.0, prom_avl_exito), 2),
                    "conclusion": (
                        f"En orden {patron}, el AVL garantiza O(log N) con altura {h_avl}, "
                        f"mientras el BST {f'se degenera en lista O(N) alcanzando altura {h_bst}' if h_bst > h_avl * 2 else f'mantiene altura {h_bst}'}."
                    )
                }
            }

        return {
            "success": True,
            "tamano_n": n,
            "patrones_evaluados": list(resultados_por_patron.keys()),
            "resultados": resultados_por_patron
        }
