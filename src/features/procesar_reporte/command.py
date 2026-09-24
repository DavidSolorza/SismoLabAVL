# -*- coding: utf-8 -*-
"""
Command and Handler for procesar_reporte / Comando y Handler para procesar_reporte
SismoLab AVL - Universidad de Caldas

Implementa la matriz estricta de procesamiento de reportes telemétricos (Sección 6):
1. Identificador desconocido: Registrar un evento nuevo si los datos son válidos (primera revisión puede ser > 1).
2. Revisión mayor que la vigente: Sustituir datos vigentes, recalcular prioridad y asociaciones, y reubicar en el AVL. Pasa a 'Pendiente'.
3. Igual revisión e iguales datos: Confirmar el evento y añadir la estación emisora.
4. Igual revisión y datos distintos: Informar un conflicto y rechazar el reporte sin sobrescribir datos.
5. Revisión menor que la vigente: Informar reporte antiguo y descartar sin modificar.
- Evento archivado: Reactiva como 'Pendiente' en AVL si revisión > vigente; confirmación o antiguo no reactivan.
- Identificador eliminado: Reportes posteriores se rechazan sistemáticamente.
"""

from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from src.core.bus.command_bus import Command
from src.core.errors.exceptions import EmptyStructureException
from src.domain.entities.seismic_event import SeismicEvent
from src.domain.value_objects.coordinates import CartesianCoordinates
from src.infrastructure.persistence.in_memory_store import store

class EncolarReporteDTO(BaseModel):
    station_code: str = Field(..., description="Código de la estación / Station code")
    event_id: int = Field(..., ge=1, le=999999, description="ID asignado al evento SIS-XXXXXX")
    magnitud: float = Field(..., ge=-2.0, le=10.0, description="Magnitud M con máx 1 decimal")
    profundidad: float = Field(..., ge=0.0, le=700.0, description="Profundidad H en km [0.0, 700.0]")
    revision: int = Field(default=1, ge=1, description="Número de revisión global del reporte")
    x: Optional[float] = Field(default=None, ge=0.0, le=1000.0, description="Coordenada X en km [0.0, 1000.0]")
    y: Optional[float] = Field(default=None, ge=0.0, le=1000.0, description="Coordenada Y en km [0.0, 1000.0]")
    latitud: Optional[float] = Field(default=None, description="Compatibilidad")
    longitud: Optional[float] = Field(default=None, description="Compatibilidad")
    zona_poblada: Optional[bool] = Field(default=None, description="Opcional: cálculo geométrico")
    timestamp: Optional[str] = Field(default=None, description="Instante de ocurrencia UTC ISO 8601")


class ProcesarReporteCommand(Command):
    """Procesa el siguiente reporte de la Cola FIFO / Processes next report from FIFO Queue"""
    pass


class ProcesarReporteHandler:
    def handle(self, command: ProcesarReporteCommand) -> Dict[str, Any]:
        if store.report_queue.is_empty():
            raise EmptyStructureException("Cola de Reportes (Report Queue)")

        reporte = store.report_queue.dequeue()
        raw = reporte.raw_data

        ev_id = raw["event_id"]
        rep_revision = raw.get("revision", 1)
        rep_mag = round(float(raw["magnitud"]), 1)
        rep_depth = round(float(raw["profundidad"]), 1)
        station_code = reporte.station_code

        # Coordenadas cartesianas en plano [0, 1000] km
        if "x" in raw and raw["x"] is not None and "y" in raw and raw["y"] is not None:
            coord_x = round(float(raw["x"]), 1)
            coord_y = round(float(raw["y"]), 1)
        elif "longitud" in raw and "latitud" in raw:
            coord_x = round(float(abs(raw["longitud"]) if 0.0 <= abs(raw["longitud"]) <= 1000.0 else 500.0), 1)
            coord_y = round(float(abs(raw["latitud"]) if 0.0 <= abs(raw["latitud"]) <= 1000.0 else 500.0), 1)
        else:
            coord_x, coord_y = 500.0, 500.0

        coords = CartesianCoordinates(coord_x, coord_y)

        # Determinar zona poblada
        if raw.get("zona_poblada") is not None:
            es_poblada = raw["zona_poblada"]
        else:
            es_poblada = store.is_point_populated(coords.x, coords.y)

        rep_ts = raw.get("timestamp") or store.get_simulation_clock_iso()
        current_clock = store.get_simulation_clock()
        store.avl_tree.reset_contador_rotaciones()

        # -------------------------------------------------------------
        # REGLA: Identificador eliminado individualmente (Sección 6)
        # "Un identificador eliminado se conserva como retirado: sus reportes posteriores se rechazan hasta deshacer esa eliminación."
        # -------------------------------------------------------------
        if store.is_id_deleted(ev_id):
            reporte.mark_as_processed()
            store.undo_stack.push({
                "accion": "PROCESAR_REPORTE",
                "subtipo": "RECHAZADO_ELIMINADO",
                "reporte_objeto": reporte
            })
            return {
                "success": False,
                "situacion": "RECHAZADO_IDENTIFICADOR_ELIMINADO",
                "message": f"Reporte rechazado: el evento SIS-{ev_id:06d} fue eliminado del sistema y se conserva como retirado.",
                "data": {
                    "estacion": station_code,
                    "event_id": ev_id,
                    "revision": rep_revision,
                    "decision": "RECHAZADO_IDENTIFICADOR_ELIMINADO",
                    "rotaciones_producidas": store.avl_tree.reset_contador_rotaciones(),
                    "reportes_restantes_en_cola": store.report_queue.size()
                }
            }

        # -------------------------------------------------------------
        # REGLA: Evento archivado en el histórico (Sección 6)
        # "Un evento archivado conserva su identidad. Una revisión mayor y válida lo reactiva como pendiente en el AVL con sus datos corregidos. Una confirmación o un reporte antiguo no lo reactiva."
        # -------------------------------------------------------------
        if store.is_id_archived(ev_id):
            ev_arch = store.archived_events[ev_id]
            if rep_revision > ev_arch.revision:
                # Guardar snapshot previo de evento archivado para deshacer
                estado_anterior_archivado = {
                    "magnitude": ev_arch.magnitude,
                    "depth": ev_arch.depth,
                    "coordinates": ev_arch.coordinates,
                    "is_populated_zone": ev_arch.is_populated_zone,
                    "revision": ev_arch.revision,
                    "version": ev_arch.version,
                    "estado_atencion": ev_arch.estado_atencion
                }
                # Reactivación en AVL
                store.archived_events.pop(ev_id, None)
                ev_arch.magnitude = rep_mag
                ev_arch.depth = rep_depth
                ev_arch.coordinates = coords
                ev_arch.is_populated_zone = es_poblada
                ev_arch.revision = rep_revision
                ev_arch.version = rep_revision
                ev_arch.estado_atencion = "Pendiente"
                ev_arch.agregar_estacion_reportante(station_code)
                ev_arch.recalcular_prioridad_y_clave()
                if hasattr(ev_arch, 'activate'):
                    ev_arch.activate()

                store.avl_tree.insertar(ev_arch)
                store.bst_tree.insertar(ev_arch)
                rotaciones = store.avl_tree.reset_contador_rotaciones()

                # Actualizar asociaciones de réplicas y acceso costoso (Secciones 7 y 9)
                from src.domain.services.association_service import AssociationService
                pool = store.get_all_active_and_archived_events()
                AssociationService.recalcular_todas_las_asociaciones(pool, store.param_w_hours, store.param_r_km)
                store.avl_tree.actualizar_marcas_acceso_costoso(store.param_budget_l)

                reporte.mark_as_processed()

                store.undo_stack.push({
                    "accion": "PROCESAR_REPORTE",
                    "subtipo": "REACTIVACION_ARCHIVADO",
                    "evento_id": ev_id,
                    "reporte_objeto": reporte,
                    "estado_anterior_archivado": estado_anterior_archivado
                })

                return {
                    "success": True,
                    "situacion": "REACTIVACION_EVENTO_ARCHIVADO",
                    "message": f"Evento archivado SIS-{ev_id:06d} reactivado exitosamente en el AVL con revisión superior r={rep_revision}.",
                    "data": {
                        "estacion": station_code,
                        "event_id": ev_id,
                        "revision": rep_revision,
                        "decision": "REACTIVACION_EVENTO_ARCHIVADO",
                        "rotaciones_producidas": rotaciones,
                        "evento": ev_arch.to_dict(current_clock=current_clock),
                        "reportes_restantes_en_cola": store.report_queue.size()
                    }
                }
            else:
                reporte.mark_as_processed()
                store.undo_stack.push({
                    "accion": "PROCESAR_REPORTE",
                    "subtipo": "DESCARTADO_ARCHIVADO",
                    "reporte_objeto": reporte
                })
                return {
                    "success": False,
                    "situacion": "DESCARTADO_EVENTO_ARCHIVADO",
                    "message": f"Reporte descartado: el evento SIS-{ev_id:06d} está archivado y la revisión recibida ({rep_revision}) no es mayor que la vigente ({ev_arch.revision}).",
                    "data": {
                        "estacion": station_code,
                        "event_id": ev_id,
                        "revision": rep_revision,
                        "decision": "DESCARTADO_EVENTO_ARCHIVADO",
                        "rotaciones_producidas": store.avl_tree.reset_contador_rotaciones(),
                        "revision_recibida": rep_revision,
                        "revision_archivada": ev_arch.revision,
                        "reportes_restantes_en_cola": store.report_queue.size()
                    }
                }

        # -------------------------------------------------------------
        # REGLA: Evento activo en el Árbol AVL (Sección 6)
        # -------------------------------------------------------------
        nodo_existente = store.avl_tree.buscar_por_id(ev_id)
        if nodo_existente is not None:
            ev_vigente = nodo_existente.getValor()
            r_vig = ev_vigente.revision

            # SITUACIÓN 2: Revisión mayor que la vigente (r_rep > r_vig)
            # "Sustituir los datos vigentes, recalcular prioridad y asociaciones y ajustar la ubicación en el árbol si cambió la clave."
            # SITUACIÓN 2: Revisión mayor que la vigente (r_rep > r_vig)
            # "Sustituir los datos vigentes, recalcular prioridad y asociaciones y ajustar la ubicación en el árbol si cambió la clave."
            if rep_revision > r_vig:
                datos_anteriores = {
                    "magnitud": ev_vigente.magnitude,
                    "profundidad": ev_vigente.depth,
                    "prioridad": ev_vigente.priority,
                    "revision": ev_vigente.revision,
                    "estado_atencion": ev_vigente.estado_atencion,
                    "composite_key": ev_vigente.composite_key
                }

                store.avl_tree.eliminar_por_id(ev_id)
                store.bst_tree.eliminar(ev_id)

                ev_vigente.magnitude = rep_mag
                ev_vigente.depth = rep_depth
                ev_vigente.coordinates = coords
                ev_vigente.is_populated_zone = es_poblada
                ev_vigente.revision = rep_revision
                ev_vigente.version = rep_revision
                ev_vigente.estado_atencion = "Pendiente"
                ev_vigente.agregar_estacion_reportante(station_code)
                ev_vigente.recalcular_prioridad_y_clave()

                store.avl_tree.insertar(ev_vigente)
                store.bst_tree.insertar(ev_vigente)
                rotaciones = store.avl_tree.reset_contador_rotaciones()

                # Actualizar asociaciones y acceso costoso (Secciones 7 y 9)
                from src.domain.services.association_service import AssociationService
                pool = store.get_all_active_and_archived_events()
                AssociationService.recalcular_todas_las_asociaciones(pool, store.param_w_hours, store.param_r_km)
                store.avl_tree.actualizar_marcas_acceso_costoso(store.param_budget_l)

                reporte.mark_as_processed()

                store.undo_stack.push({
                    "accion": "PROCESAR_REPORTE",
                    "subtipo": "CORREGIR_EVENTO",
                    "evento_id": ev_id,
                    "datos_anteriores": datos_anteriores,
                    "reporte_objeto": reporte
                })

                return {
                    "success": True,
                    "situacion": "REVISION_MAYOR_ACTUALIZADA",
                    "message": f"Evento SIS-{ev_id:06d} actualizado a nueva revisión r={rep_revision} y reubicado en el AVL.",
                    "data": {
                        "estacion": station_code,
                        "event_id": ev_id,
                        "revision": rep_revision,
                        "decision": "REVISION_MAYOR_ACTUALIZADA",
                        "rotaciones_producidas": rotaciones,
                        "evento": ev_vigente.to_dict(current_clock=current_clock),
                        "reportes_restantes_en_cola": store.report_queue.size()
                    }
                }

            # SITUACIÓN 3 o 4: Igual revisión (r_rep == r_vig)
            elif rep_revision == r_vig:
                # Comprobar igualdad de datos físicos: magnitud, profundidad y coordenadas
                datos_coinciden = (
                    round(ev_vigente.magnitude, 1) == rep_mag and
                    round(ev_vigente.depth, 1) == rep_depth and
                    round(ev_vigente.coordinates.x, 1) == coords.x and
                    round(ev_vigente.coordinates.y, 1) == coords.y
                )

                if datos_coinciden:
                    # SITUACIÓN 3: Igual revisión e iguales datos -> Confirmar y añadir estación
                    ev_vigente.agregar_estacion_reportante(station_code)
                    reporte.mark_as_processed()
                    store.undo_stack.push({
                        "accion": "PROCESAR_REPORTE",
                        "subtipo": "CONFIRMADO",
                        "evento_id": ev_id,
                        "estacion": station_code,
                        "reporte_objeto": reporte
                    })
                    return {
                        "success": True,
                        "situacion": "IGUAL_REVISION_CONFIRMADO",
                        "message": f"Confirmación de evento SIS-{ev_id:06d} aceptada. Estación {station_code} añadida al registro de procedencia.",
                        "data": {
                            "estacion": station_code,
                            "event_id": ev_id,
                            "revision": rep_revision,
                            "decision": "IGUAL_REVISION_CONFIRMADO",
                            "rotaciones_producidas": store.avl_tree.reset_contador_rotaciones(),
                            "evento": ev_vigente.to_dict(current_clock=current_clock),
                            "reportes_restantes_en_cola": store.report_queue.size()
                        }
                    }
                else:
                    # SITUACIÓN 4: Igual revisión y datos distintos -> Informar conflicto y rechazar
                    reporte.mark_as_processed()
                    store.undo_stack.push({
                        "accion": "PROCESAR_REPORTE",
                        "subtipo": "CONFLICTO",
                        "reporte_objeto": reporte
                    })
                    return {
                        "success": False,
                        "situacion": "CONFLICTO_DATOS_DISTINTOS",
                        "message": f"Conflicto en revisión r={rep_revision}: datos recibidos difieren de los datos vigentes para el evento SIS-{ev_id:06d}. Reporte rechazado sin modificar el evento.",
                        "data": {
                            "estacion": station_code,
                            "event_id": ev_id,
                            "revision": rep_revision,
                            "decision": "CONFLICTO_DATOS_DISTINTOS",
                            "rotaciones_producidas": store.avl_tree.reset_contador_rotaciones(),
                            "reportes_restantes_en_cola": store.report_queue.size()
                        }
                    }

            # SITUACIÓN 5: Revisión menor que la vigente (r_rep < r_vig)
            # "Informar que el reporte es antiguo y descartarlo sin modificar el evento."
            else:
                reporte.mark_as_processed()
                store.undo_stack.push({
                    "accion": "PROCESAR_REPORTE",
                    "subtipo": "DESCARTADO_ANTIGUO",
                    "reporte_objeto": reporte
                })
                return {
                    "success": False,
                    "situacion": "REPORTE_ANTIGUO_DESCARTADO",
                    "message": f"Reporte antiguo descartado: la revisión recibida r={rep_revision} es menor que la revisión vigente r={r_vig} para el evento SIS-{ev_id:06d}.",
                    "data": {
                        "estacion": station_code,
                        "event_id": ev_id,
                        "revision": rep_revision,
                        "decision": "REPORTE_ANTIGUO_DESCARTADO",
                        "rotaciones_producidas": store.avl_tree.reset_contador_rotaciones(),
                        "revision_recibida": rep_revision,
                        "revision_vigente": r_vig,
                        "reportes_restantes_en_cola": store.report_queue.size()
                    }
                }

        # -------------------------------------------------------------
        # SITUACIÓN 1: Identificador desconocido (Sección 6)
        # "Registrar un evento nuevo si los datos son válidos. La primera revisión recibida puede ser mayor que 1."
        # -------------------------------------------------------------
        nuevo_evento = SeismicEvent(
            event_id=ev_id,
            magnitude=rep_mag,
            depth=rep_depth,
            coordinates=coords,
            station_id=station_code,
            is_populated_zone=es_poblada,
            timestamp=rep_ts,
            origin_report_id=reporte.id,
            estado_atencion="Pendiente"
        )
        nuevo_evento.revision = rep_revision
        nuevo_evento.version = rep_revision
        nuevo_evento.recalcular_prioridad_y_clave()

        store.avl_tree.insertar(nuevo_evento)
        store.bst_tree.insertar(nuevo_evento)
        rotaciones = store.avl_tree.reset_contador_rotaciones()

        # Actualizar asociaciones de réplicas y acceso costoso (Secciones 7 y 9)
        from src.domain.services.association_service import AssociationService
        pool = store.get_all_active_and_archived_events()
        AssociationService.actualizar_asociaciones_para_evento(nuevo_evento, pool, store.param_w_hours, store.param_r_km)
        for other in pool:
            if other.id != nuevo_evento.id and other.dt > nuevo_evento.dt:
                AssociationService.actualizar_asociaciones_para_evento(other, pool, store.param_w_hours, store.param_r_km)
        store.avl_tree.actualizar_marcas_acceso_costoso(store.param_budget_l)

        reporte.mark_as_processed()

        store.undo_stack.push({
            "accion": "PROCESAR_REPORTE",
            "subtipo": "NUEVO_EVENTO",
            "evento_id": nuevo_evento.id,
            "reporte_objeto": reporte
        })

        return {
            "success": True,
            "situacion": "IDENTIFICADOR_DESCONOCIDO_REGISTRADO",
            "message": f"Reporte {reporte.id} procesado: nuevo evento {nuevo_evento.composite_key.formatted_id()} registrado con revisión inicial r={rep_revision} en el AVL.",
            "data": {
                "estacion": station_code,
                "event_id": ev_id,
                "revision": rep_revision,
                "decision": "IDENTIFICADOR_DESCONOCIDO_REGISTRADO",
                "rotaciones_producidas": rotaciones,
                "evento": nuevo_evento.to_dict(current_clock=current_clock),
                "reportes_restantes_en_cola": store.report_queue.size()
            }
        }
