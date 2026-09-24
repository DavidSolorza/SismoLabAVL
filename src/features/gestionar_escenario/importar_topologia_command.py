# -*- coding: utf-8 -*-
"""
Import by Topology Command and Handler / Carga por Topología Explícita
SismoLab AVL - Universidad de Caldas
Sección 12 del pliego oficial:
"Carga por topología: Reconstruye el AVL a partir de enlaces explícitos sin
reinserciones. Valida previamente: tipo de datos, ausencia de ciclos, orden del BST,
alturas y factores de balance, y correspondencia de prioridad almacenada vs calculada.
Si es válido entra en modo normal; si está desbalanceado entra en modo estrés
(advertencia). En caso de error, rechaza toda la carga sin alterar el estado previo."
"""

from typing import Dict, Any
from src.core.bus.command_bus import Command
from src.core.errors.exceptions import DomainValidationException
from src.domain.structures.avl import ArbolAVL
from src.domain.structures.bst import ArbolBST
from src.infrastructure.persistence.in_memory_store import store

class ImportarTopologiaCommand(Command):
    def __init__(self, datos_topologia: Dict[str, Any], permitir_desbalance: bool = True):
        self.datos_topologia = datos_topologia
        self.permitir_desbalance = permitir_desbalance


class ImportarTopologiaHandler:
    def handle(self, command: ImportarTopologiaCommand) -> Dict[str, Any]:
        datos = command.datos_topologia
        if isinstance(datos, dict) and "topologia_avl" in datos and isinstance(datos["topologia_avl"], dict):
            topologia_raw = datos["topologia_avl"]
        elif isinstance(datos, dict):
            topologia_raw = datos
        else:
            raise DomainValidationException("Estructura de topología inválida (se esperaba objeto JSON).")

        nuevo_avl = ArbolAVL()

        # Validación atómica y reconstrucción
        try:
            exito, errores, nueva_raiz = nuevo_avl.construir_desde_topologia(
                topologia_raw,
                permitir_desbalance=command.permitir_desbalance
            )
            if not exito:
                raise DomainValidationException(f"Falla de validación atómica en carga por topología: {'; '.join(errores)}")
        except DomainValidationException:
            raise
        except Exception as e:
            raise DomainValidationException(f"Falla de validación atómica en carga por topología: {str(e)}")

        from src.core.config.settings import OperationalMode
        modo = "MODO_ESTRES" if nuevo_avl.modo == OperationalMode.STRESS else "MODO_NORMAL"


        # Reconstruir BST en paralelo a partir de los eventos reconstruidos
        nuevo_bst = ArbolBST()
        eventos = nuevo_avl.recorrido_inorden()
        for ev in eventos:
            nuevo_bst.insertar(ev)

        # Reemplazar atómicamente el estado activo
        store.avl_tree = nuevo_avl
        store.bst_tree = nuevo_bst

        from src.domain.services.association_service import AssociationService
        pool = store.get_all_active_and_archived_events()
        AssociationService.recalcular_todas_las_asociaciones(pool, store.param_w_hours, store.param_r_km)
        store.avl_tree.actualizar_marcas_acceso_costoso(store.param_budget_l)

        audit = nuevo_avl.verificar_estructura_exhaustiva()

        return {
            "success": True,
            "message": f"Carga por topología completada exitosamente en {modo}.",
            "modo_operacion": modo,
            "advertencia_desbalance": modo == "MODO_ESTRES",
            "metricas": {
                "total_nodos": nuevo_avl.contar_nodos(),
                "altura": nuevo_avl.obtener_altura(),
                "cantidad_hojas": nuevo_avl.contar_hojas(),
                "factor_balance_raiz": nuevo_avl.obtener_factor_balance_raiz(),
                "es_avl_estricto": audit["es_avl_valido"],
                "orden_bst_valido": audit["orden_bst_valido"],
                "alturas_consistentes": audit["alturas_consistentes"]
            }
        }
