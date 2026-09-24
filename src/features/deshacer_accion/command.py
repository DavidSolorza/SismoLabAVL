# -*- coding: utf-8 -*-
"""
Command and Handler for deshacer_accion / Comando y Handler para deshacer_accion
SismoLab AVL - Universidad de Caldas
"""

from typing import Dict, Any
from src.core.bus.command_bus import Command
from src.core.errors.exceptions import EmptyStructureException
from src.infrastructure.persistence.in_memory_store import store
from src.domain.entities.seismic_event import SeismicEvent
from src.domain.value_objects.coordinates import GeographicCoordinates

class DeshacerAccionCommand(Command):
    """Command to Undo the Last Executed Operation via LIFO Stack"""
    pass


class DeshacerAccionHandler:
    def handle(self, command: DeshacerAccionCommand) -> Dict[str, Any]:
        if store.undo_stack.is_empty():
            raise EmptyStructureException("Pila de Deshacer (Undo Stack)")

        operacion = store.undo_stack.pop()
        accion = operacion["accion"]
        evento_id = operacion.get("evento_id")
        datos_anteriores = operacion.get("datos_anteriores")

        if accion == "CREAR_EVENTO":
            # Revertir creación: Eliminar evento del AVL y BST
            if evento_id is not None:
                store.avl_tree.eliminar_por_id(evento_id)
                store.bst_tree.eliminar(evento_id)
            msg = f"Se revirtió la creación del evento {evento_id} (eliminado del AVL)."

        elif accion == "PROCESAR_REPORTE":
            # Sección 13: El proceso de deshacer para pasos provenientes de la cola
            # restaura el elemento en la cola y en su posición original, incluso si el reporte había sido descartado.
            reporte_obj = operacion.get("reporte_objeto")
            if reporte_obj is not None:
                store.report_queue.prepend(reporte_obj)

            subtipo = operacion.get("subtipo", "NUEVO_EVENTO")
            if subtipo == "NUEVO_EVENTO" and evento_id is not None:
                store.avl_tree.eliminar_por_id(evento_id)
                store.bst_tree.eliminar(evento_id)
                msg = f"Se revirtió el procesamiento del reporte: evento {evento_id} eliminado del AVL y reporte restaurado al frente de la cola."
            elif subtipo == "CORREGIR_EVENTO" and datos_anteriores:
                nodo = store.avl_tree.buscar_por_id(evento_id)
                if nodo:
                    ev = nodo.getValor()
                    store.avl_tree.eliminar_por_id(evento_id)
                    store.bst_tree.eliminar(evento_id)
                    ev.magnitude = datos_anteriores["magnitud"]
                    ev.depth = datos_anteriores["profundidad"]
                    ev.priority = datos_anteriores["prioridad"]
                    ev.revision = datos_anteriores.get("revision", 1)
                    ev.version = ev.revision
                    ev.estado_atencion = datos_anteriores.get("estado_atencion", "Pendiente")
                    ev.composite_key = datos_anteriores["composite_key"]
                    store.avl_tree.insertar(ev)
                    store.bst_tree.insertar(ev)
                msg = f"Se revirtió la corrección por reporte del evento {evento_id} y el reporte fue devuelto al frente de la cola."
            elif subtipo == "CONFIRMADO" and evento_id is not None:
                nodo = store.avl_tree.buscar_por_id(evento_id)
                estacion = operacion.get("estacion")
                if nodo and estacion:
                    ev = nodo.getValor()
                    if hasattr(ev, 'estaciones_reportantes') and estacion in ev.estaciones_reportantes and len(ev.estaciones_reportantes) > 1:
                        ev.estaciones_reportantes.discard(estacion)

                msg = f"Se revirtió la confirmación del reporte para evento {evento_id} y el reporte fue devuelto al frente de la cola."
            elif subtipo == "REACTIVACION_ARCHIVADO" and evento_id is not None:
                nodo = store.avl_tree.buscar_por_id(evento_id)
                if nodo:
                    ev = nodo.getValor()
                    store.avl_tree.eliminar_por_id(evento_id)
                    store.bst_tree.eliminar(evento_id)
                    ant = operacion.get("estado_anterior_archivado", {})
                    if ant:
                        ev.magnitude = ant.get("magnitude", ev.magnitude)
                        ev.depth = ant.get("depth", ev.depth)
                        ev.coordinates = ant.get("coordinates", ev.coordinates)
                        ev.is_populated_zone = ant.get("is_populated_zone", ev.is_populated_zone)
                        ev.revision = ant.get("revision", ev.revision)
                        ev.version = ant.get("version", ev.version)
                        ev.estado_atencion = ant.get("estado_atencion", "Archivado")
                        ev.recalcular_prioridad_y_clave()
                    store.archived_events[evento_id] = ev
                msg = f"Se revirtió la reactivación del evento {evento_id} (retornado al histórico archivado) y el reporte fue devuelto a la cola."
            else:
                msg = f"Se revirtió el procesamiento del reporte (reporte restaurado en su posición original al frente de la cola)."

        elif accion == "CORREGIR_EVENTO" and datos_anteriores:
            # Revertir corrección: restaurar estado anterior
            nodo = store.avl_tree.buscar_por_id(evento_id)
            if nodo:
                ev = nodo.getValor()
                store.avl_tree.eliminar_por_id(evento_id)
                store.bst_tree.eliminar(evento_id)
                ev.magnitude = datos_anteriores["magnitud"]
                ev.depth = datos_anteriores["profundidad"]
                ev.priority = datos_anteriores["prioridad"]
                ev.revision = datos_anteriores.get("revision", 1)
                ev.version = ev.revision
                ev.estado_atencion = datos_anteriores.get("estado_atencion", "Pendiente")
                ev.composite_key = datos_anteriores["composite_key"]
                store.avl_tree.insertar(ev)
                store.bst_tree.insertar(ev)
            msg = f"Se revirtieron los cambios en el evento {evento_id} a sus valores anteriores."

        elif accion == "ACTUALIZAR_PARAMETROS":
            params = operacion.get("parametros_anteriores", {})
            store.set_scenario_parameters(
                w_horas=params.get("w_horas"),
                r_km=params.get("r_km"),
                limite_l=params.get("limite_l"),
                t_horas=params.get("t_horas")
            )
            msg = "Se revirtió la actualización de parámetros del escenario a sus valores previos."

        elif accion == "RESTAURAR_VERSION":
            snapshot = operacion.get("snapshot_anterior")
            if snapshot:
                from src.infrastructure.persistence.version_repository import version_repo
                version_repo._aplicar_snapshot(store, snapshot)
            msg = "Se revirtió la restauración de la versión previa."

        elif accion == "REVISAR_EVENTO":
            # Revertir marcado como revisado: restaurar a Pendiente
            nodo = store.avl_tree.buscar_por_id(evento_id)
            if nodo:
                ev = nodo.getValor()
                ev.estado_atencion = operacion.get("estado_previo", "Pendiente")
            msg = f"Se revirtió la revisión del evento {evento_id} (restablecido a Pendiente)."

        elif accion == "ELIMINAR_EVENTO":
            # Revertir eliminación: restaurar evento en el catálogo y remover de eliminados
            evento_obj = operacion.get("evento_objeto")
            if evento_id in store.deleted_ids:
                store.deleted_ids.discard(evento_id)
            store.deleted_events.pop(evento_id, None)

            if evento_obj is not None:
                store.avl_tree.insertar(evento_obj)
                store.bst_tree.insertar(evento_obj)
            msg = f"Se revirtió la eliminación del evento SIS-{evento_id:06d} (restaurado en el AVL activo)."

        elif accion == "ARCHIVAR_RAMA":
            # Revertir archivado: reinsertar eventos podados al catálogo activo
            eventos_archivados = operacion.get("eventos_archivados", [])
            for ev in eventos_archivados:
                if hasattr(ev, 'id'):
                    store.archived_events.pop(ev.id, None)
                    if hasattr(ev, 'activate'):
                        ev.activate()
                    store.avl_tree.insertar(ev)
                    store.bst_tree.insertar(ev)
            msg = f"Se revirtió el archivado de la rama ({len(eventos_archivados)} eventos restaurados en el AVL)."

        else:
            msg = f"Acción {accion} desapilada de la pila de deshacer."

        # Recalcular asociaciones y marcas de acceso costoso tras revertir
        from src.domain.services.association_service import AssociationService
        pool = store.get_all_active_and_archived_events()
        AssociationService.recalcular_todas_las_asociaciones(pool, store.param_w_hours, store.param_r_km)
        store.avl_tree.actualizar_marcas_acceso_costoso(store.param_budget_l)

        return {
            "success": True,
            "message": msg,
            "data": {
                "accion_revertida": accion,
                "evento_afectado_id": evento_id,
                "elementos_restantes_en_pila": store.undo_stack.size()
            }
        }
