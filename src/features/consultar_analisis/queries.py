# -*- coding: utf-8 -*-
"""
Queries and Handlers for consultar_analisis / Consultas Especializadas y Análisis
SismoLab AVL - Universidad de Caldas
Sección 11 del pliego oficial:
1. Primeros k eventos pendientes de atención en orden descendente de K.
2. Eventos por intervalo inclusivo de magnitud [M_min, M_max].
3. Eventos con profundidad hipocentral <= H_max dentro de rango de fechas [T_inicio, T_fin].
4. Candidatos y referencia elegida para un evento, y eventos que lo referencian (activos y archivados).
5. Eventos de prioridad alta con acceso costoso (profundidad > L) indicando visitas por búsqueda por clave.
Cada consulta reporta la cantidad exacta de nodos examinados y la justificación de poda.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
from src.core.bus.query_bus import Query
from src.infrastructure.persistence.in_memory_store import store
from src.domain.services.association_service import AssociationService

class ConsultarPrimerosKPendientesQuery(Query):
    def __init__(self, k: int):
        self.k = int(k)

class ConsultarPrimerosKPendientesHandler:
    def handle(self, query: ConsultarPrimerosKPendientesQuery) -> Dict[str, Any]:
        k = max(1, query.k)
        eventos_raw, nodos_examinados = store.avl_tree.consultar_primeros_k_pendientes(k)
        current_clock = store.get_simulation_clock()

        eventos = [e.to_dict(current_clock=current_clock) for e in eventos_raw]
        return {
            "success": True,
            "k_solicitado": k,
            "total_encontrados": len(eventos),
            "nodos_examinados": nodos_examinados,
            "justificacion_poda": (
                "Poda por orden lexicográfico descendente: el recorrido prioriza la rama derecha (claves K mayores). "
                "Tan pronto se recolectan k eventos con estado 'Pendiente', se interrumpen y podan las ramas restantes "
                "evitando visitar innecesariamente nodos con claves de menor prioridad."
            ),
            "eventos": eventos
        }


class ConsultarPorRangoMagnitudQuery(Query):
    def __init__(self, m_min: float, m_max: float):
        self.m_min = float(m_min)
        self.m_max = float(m_max)

class ConsultarPorRangoMagnitudHandler:
    def handle(self, query: ConsultarPorRangoMagnitudQuery) -> Dict[str, Any]:
        m_min, m_max = query.m_min, query.m_max
        if m_min > m_max:
            m_min, m_max = m_max, m_min

        eventos_raw, nodos_examinados, *_ = store.avl_tree.consultar_por_rango_magnitud(m_min, m_max)
        current_clock = store.get_simulation_clock()


        eventos = [e.to_dict(current_clock=current_clock) for e in eventos_raw]
        return {
            "success": True,
            "rango": {"m_min": m_min, "m_max": m_max},
            "total_encontrados": len(eventos),
            "nodos_examinados": nodos_examinados,
            "justificacion_poda": (
                "Dado que la clave del AVL es la tupla K=(P, M, I), la magnitud M se encuentra subordinada a la prioridad P. "
                "Por consiguiente, dentro de cada subárbol con prioridad constante P existe orden por magnitud, pero no "
                "globalmente entre diferentes niveles de P. El recorrido examina los nodos descartando en tiempo O(1) "
                "aquellos fuera del intervalo inclusivo sin alterar la estructura del árbol."
            ),
            "eventos": eventos
        }


class ConsultarPorProfundidadYFechasQuery(Query):
    def __init__(self, h_max: float, t_inicio: str, t_fin: str):
        self.h_max = float(h_max)
        self.t_inicio = t_inicio
        self.t_fin = t_fin

class ConsultarPorProfundidadYFechasHandler:
    def handle(self, query: ConsultarPorProfundidadYFechasQuery) -> Dict[str, Any]:
        t_ini = datetime.fromisoformat(query.t_inicio.replace("Z", "+00:00"))
        t_end = datetime.fromisoformat(query.t_fin.replace("Z", "+00:00"))
        if t_ini > t_end:
            t_ini, t_end = t_end, t_ini

        eventos_raw, nodos_examinados = store.avl_tree.consultar_por_profundidad_y_fechas(query.h_max, t_ini, t_end)
        current_clock = store.get_simulation_clock()

        eventos = [e.to_dict(current_clock=current_clock) for e in eventos_raw]
        return {
            "success": True,
            "criterios": {
                "profundidad_maxima_h": query.h_max,
                "t_inicio": t_ini.isoformat(),
                "t_fin": t_end.isoformat()
            },
            "total_encontrados": len(eventos),
            "nodos_examinados": nodos_examinados,
            "justificacion_poda": (
                "La profundidad del hipocentro y la fecha temporal no forman parte de la clave de orden K=(P, M, I). "
                "Se realiza una evaluación exhaustiva de los nodos activos en O(N), descartando en tiempo O(1) los sismos "
                "que no satisfagan simultáneamente h <= H_max y t_inicio <= t <= t_fin."
            ),
            "eventos": eventos
        }


class ConsultarAsociacionesEventoQuery(Query):
    def __init__(self, event_id: int):
        self.event_id = int(event_id)

class ConsultarAsociacionesEventoHandler:
    def handle(self, query: ConsultarAsociacionesEventoQuery) -> Dict[str, Any]:
        ev_id = query.event_id
        current_clock = store.get_simulation_clock()

        # Buscar en catálogo activo
        nodo = store.avl_tree.buscar_por_id(ev_id)
        target = nodo.getValor() if nodo else None
        es_activo = target is not None
        es_archivado = False

        if not target and ev_id in store.archived_events:
            target = store.archived_events[ev_id]
            es_archivado = True

        if not target:
            return {
                "success": False,
                "message": f"Evento SIS-{ev_id:06d} no encontrado ni en el catálogo activo ni en el histórico archivado.",
                "data": None
            }

        # Asegurar asociaciones actualizadas
        pool = store.get_all_active_and_archived_events()
        AssociationService.recalcular_todas_las_asociaciones(pool, store.param_w_hours, store.param_r_km)

        # Mapear candidatos
        candidatos_dto = []
        for cand_id in target.replica_candidates_ids:
            cand = next((e for e in pool if e.id == cand_id), None)
            if cand:
                candidatos_dto.append({
                    "id": cand.id,
                    "codigo": cand.composite_key.formatted_id(),
                    "magnitud": cand.magnitude,
                    "prioridad": cand.priority,
                    "timestamp": cand.timestamp,
                    "estado_catalogo": "Activo" if store.is_id_active(cand.id) else "Archivado"
                })

        # Mapear referencia elegida
        referencia_dto = None
        if target.chosen_reference_id is not None:
            ref = next((e for e in pool if e.id == target.chosen_reference_id), None)
            if ref:
                referencia_dto = {
                    "id": ref.id,
                    "codigo": ref.composite_key.formatted_id(),
                    "magnitud": ref.magnitude,
                    "prioridad": ref.priority,
                    "timestamp": ref.timestamp,
                    "estado_catalogo": "Activo" if store.is_id_active(ref.id) else "Archivado"
                }

        # Mapear eventos que utilizan a este evento como referencia elegida
        referenciantes_dto = []
        for other in pool:
            if other.chosen_reference_id == target.id:
                referenciantes_dto.append({
                    "id": other.id,
                    "codigo": other.composite_key.formatted_id(),
                    "magnitud": other.magnitude,
                    "prioridad": other.priority,
                    "timestamp": other.timestamp,
                    "estado_catalogo": "Activo" if store.is_id_active(other.id) else "Archivado"
                })

        return {
            "success": True,
            "evento": {
                "id": target.id,
                "codigo": target.composite_key.formatted_id(),
                "magnitud": target.magnitude,
                "profundidad": target.depth,
                "prioridad": target.priority,
                "timestamp": target.timestamp,
                "estado_catalogo": "Activo" if es_activo else "Archivado",
                "estado_atencion": target.estado_atencion
            },
            "parametros_asociacion": {
                "w_horas": store.param_w_hours,
                "r_km": store.param_r_km
            },
            "candidatos": candidatos_dto,
            "referencia_elegida": referencia_dto,
            "eventos_que_lo_referencian": referenciantes_dto,
            "nodos_examinados": len(pool),
            "justificacion_poda": (
                "La consulta de asociaciones abarca eventos activos y archivados (excluyendo eliminados). "
                "Se evalúan condiciones físicas deterministas de ventana temporal delta_t <= W y distancia geodésica d <= R."
            )
        }


class ConsultarAccesoCostosoQuery(Query):
    def __init__(self, limite_l: Optional[int] = None):
        self.limite_l = limite_l

class ConsultarAccesoCostosoHandler:
    def handle(self, query: ConsultarAccesoCostosoQuery) -> Dict[str, Any]:
        l_vigente = query.limite_l if query.limite_l is not None else store.param_budget_l
        store.avl_tree.actualizar_marcas_acceso_costoso(l_vigente)

        # Buscar eventos de prioridad alta (P=3)
        todos_activos = store.avl_tree.recorrido_inorden()
        eventos_costosos = []
        total_visitas = 0

        for ev in todos_activos:
            if ev.priority == 3:
                # Realizar búsqueda exacta por clave K y registrar nodos visitados
                nodo_encontrado, visitas = store.avl_tree.buscar_nodo_por_clave_con_visitas(ev.composite_key)
                total_visitas += visitas
                profundidad = ev.depth_in_tree

                if profundidad > l_vigente:
                    eventos_costosos.append({
                        "id": ev.id,
                        "codigo": ev.composite_key.formatted_id(),
                        "clave_k": str(ev.composite_key),
                        "prioridad": ev.priority,
                        "magnitud": ev.magnitude,
                        "profundidad_en_arbol": profundidad,
                        "limite_l": l_vigente,
                        "nodos_visitados_busqueda_clave": visitas,
                        "supera_limite": True,
                        "estado_atencion": ev.estado_atencion
                    })

        return {
            "success": True,
            "limite_l_vigente": l_vigente,
            "total_eventos_prioridad_alta_costosos": len(eventos_costosos),
            "total_visitas_acumuladas": total_visitas,
            "nodos_examinados": total_visitas,
            "justificacion_poda": (
                "Búsqueda por clave K=(P, M, I) en el AVL con poda binaria estándar O(log N): "
                "en cada nodo se compara la tupla completa y se desciende estrictamente a la izquierda o derecha "
                "podando la mitad del subárbol en cada paso."
            ),
            "eventos_costosos": eventos_costosos
        }
