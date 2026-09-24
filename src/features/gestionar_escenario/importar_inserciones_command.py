# -*- coding: utf-8 -*-
"""
Import by Insertions Command and Handler / Carga por Inserciones
SismoLab AVL - Universidad de Caldas
Sección 12 del pliego oficial:
"Carga por inserciones: Procesa la lista de eventos e inserta cada uno en un AVL
y en un BST, aplicando en ambos el comparador oficial. Retorna la raíz, altura,
profundidad máxima y número de hojas de cada árbol. La presencia de identificadores
duplicados provoca el rechazo de la carga."
"""

from typing import Dict, Any, List
from datetime import datetime, timezone
from src.core.bus.command_bus import Command
from src.core.errors.exceptions import DuplicateEventIdException, DomainValidationException
from src.domain.structures.avl import ArbolAVL
from src.domain.structures.bst import ArbolBST
from src.domain.entities.seismic_event import SeismicEvent
from src.domain.value_objects.coordinates import CartesianCoordinates
from src.infrastructure.persistence.in_memory_store import store

class ImportarInsercionesCommand(Command):
    def __init__(self, datos_json: Dict[str, Any], reemplazar_actual: bool = True):
        self.datos_json = datos_json
        self.reemplazar_actual = reemplazar_actual


class ImportarInsercionesHandler:
    def handle(self, command: ImportarInsercionesCommand) -> Dict[str, Any]:
        datos = command.datos_json

        eventos_raw = datos.get("eventos") or datos.get("catalogo_activo")
        if eventos_raw is None or not isinstance(eventos_raw, list):
            raise DomainValidationException("El archivo JSON debe contener una lista bajo la clave 'eventos' o 'catalogo_activo'.")

        # 1. Validación de identificadores únicos en el lote (Sección 12)
        vistos = set()
        for i, ev_data in enumerate(eventos_raw):
            ev_id = ev_data.get("id") or ev_data.get("event_id")
            if ev_id is None:
                raise DomainValidationException(f"El elemento {i} carece de identificador 'id'.")
            try:
                ev_id = int(ev_id)
            except ValueError:
                raise DomainValidationException(f"Identificador inválido '{ev_id}' en elemento {i}.")

            if not (1 <= ev_id <= 999999):
                raise DomainValidationException(f"Identificador {ev_id} fuera del rango permitido [1, 999999].")

            if ev_id in vistos:
                raise DuplicateEventIdException(ev_id)
            vistos.add(ev_id)

        # 2. Instanciar árboles limpios para la carga
        nuevo_avl = ArbolAVL()
        nuevo_bst = ArbolBST()
        eventos_construidos: List[SeismicEvent] = []

        for ev_data in eventos_raw:
            ev_id = int(ev_data.get("id") or ev_data.get("event_id"))
            mag = float(ev_data.get("magnitud") or ev_data.get("magnitude", 0.0))
            depth = float(ev_data.get("profundidad") or ev_data.get("depth", 10.0))

            x = float(ev_data.get("x", 500.0))
            y = float(ev_data.get("y", 500.0))
            coords = CartesianCoordinates(x, y)

            station = str(ev_data.get("estacion") or ev_data.get("station_id", "EST-DEFAULT"))
            ts = ev_data.get("timestamp") or store.get_simulation_clock_iso()
            estado_atencion = ev_data.get("estado_atencion", "Pendiente")

            es_poblada = ev_data.get("zona_poblada")
            if es_poblada is None:
                es_poblada = store.is_point_populated(coords.x, coords.y)

            ev = SeismicEvent(
                event_id=ev_id,
                magnitude=mag,
                depth=depth,
                coordinates=coords,
                station_id=station,
                is_populated_zone=es_poblada,
                timestamp=ts,
                estado_atencion=estado_atencion
            )
            ev.revision = int(ev_data.get("revision", 1))
            ev.version = ev.revision
            ev.recalcular_prioridad_y_clave()

            nuevo_avl.insertar(ev)
            nuevo_bst.insertar(ev)
            eventos_construidos.append(ev)

        # 3. Aplicar al store si reemplazar_actual es True
        if command.reemplazar_actual:
            store.avl_tree = nuevo_avl
            store.bst_tree = nuevo_bst
            # Recalcular asociaciones en catálogo
            from src.domain.services.association_service import AssociationService
            pool = store.get_all_active_and_archived_events()
            AssociationService.recalcular_todas_las_asociaciones(pool, store.param_w_hours, store.param_r_km)
            store.avl_tree.actualizar_marcas_acceso_costoso(store.param_budget_l)

        # 4. Métricas solicitadas por el pliego (Sección 12):
        # "Retorna la raíz, altura, profundidad máxima y número de hojas de cada árbol."
        raiz_avl = str(getattr(nuevo_avl.raiz.getValor(), 'composite_key', nuevo_avl.raiz.getValor())) if nuevo_avl.raiz else None

        h_avl = nuevo_avl.obtener_altura()
        max_prof_avl = max(0, h_avl)
        hojas_avl = nuevo_avl.contar_hojas()

        raiz_bst = str(nuevo_bst.raiz.clave) if nuevo_bst.raiz else None
        h_bst = nuevo_bst.obtener_altura()
        max_prof_bst = max(0, h_bst)
        hojas_bst = nuevo_bst.contar_hojas()

        return {
            "success": True,
            "message": f"Carga por inserciones completada exitosamente ({len(eventos_construidos)} eventos insertados en AVL y BST).",
            "metricas": {
                "total_eventos_insertados": len(eventos_construidos),
                "avl": {
                    "raiz": raiz_avl,
                    "altura": h_avl,
                    "profundidad_maxima": max_prof_avl,
                    "cantidad_hojas": hojas_avl,
                    "total_nodos": nuevo_avl.contar_nodos(),
                    "desglose_rotaciones": nuevo_avl.obtener_desglose_rotaciones()
                },
                "bst": {
                    "raiz": raiz_bst,
                    "altura": h_bst,
                    "profundidad_maxima": max_prof_bst,
                    "cantidad_hojas": hojas_bst,
                    "total_nodos": nuevo_bst.contar_nodos()
                }
            }
        }
