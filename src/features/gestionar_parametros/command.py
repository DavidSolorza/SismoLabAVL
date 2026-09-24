# -*- coding: utf-8 -*-
"""
Commands and Handlers for Scenario Parameters (Secciones 7, 9 y 10)
SismoLab AVL - Universidad de Caldas
"""

from typing import Dict, Any
from src.core.bus.command_bus import Command, Query
from src.features.gestionar_parametros.dto import ActualizarParametrosDTO
from src.infrastructure.persistence.in_memory_store import store
from src.domain.services.association_service import AssociationService

class ConsultarParametrosQuery(Query):
    pass

class ConsultarParametrosHandler:
    def handle(self, query: ConsultarParametrosQuery) -> Dict[str, Any]:
        return {
            "success": True,
            "data": store.get_scenario_parameters()
        }

class ActualizarParametrosCommand(Command):
    def __init__(self, dto: ActualizarParametrosDTO):
        self.dto = dto

class ActualizarParametrosHandler:
    def handle(self, command: ActualizarParametrosCommand) -> Dict[str, Any]:
        dto = command.dto

        nuevos_params = store.set_scenario_parameters(
            w_horas=dto.w_horas,
            r_km=dto.r_km,
            limite_l=dto.limite_l,
            t_horas=dto.t_horas
        )

        recalculo_asociaciones = False
        recalculo_marcas_l = False

        # Si se modificó W o R, recalcular todas las asociaciones afectadas (Sección 7)
        if dto.w_horas is not None or dto.r_km is not None:
            pool = store.get_all_active_and_archived_events()
            AssociationService.recalcular_todas_las_asociaciones(pool, store.param_w_hours, store.param_r_km)
            recalculo_asociaciones = True

        # Si se modificó L, recalcular marcas de acceso costoso en el AVL (Sección 9)
        if dto.limite_l is not None:
            store.avl_tree.actualizar_marcas_acceso_costoso(store.param_budget_l)
            recalculo_marcas_l = True

        return {
            "success": True,
            "message": "Parámetros del escenario actualizados exitosamente.",
            "data": nuevos_params,
            "recalculo_asociaciones": recalculo_asociaciones,
            "recalculo_marcas_acceso": recalculo_marcas_l
        }
