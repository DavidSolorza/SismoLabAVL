# -*- coding: utf-8 -*-
"""
Association Domain Service (Sección 7) / Servicio de Dominio de Asociaciones
SismoLab AVL - Universidad de Caldas

Implementa las reglas obligatorias de candidaturas a referencia y réplicas:
- A es candidato de B si:
  1. M_A > M_B
  2. A ocurrió estrictamente antes (t_A < t_B)
  3. Diferencia temporal dt = (t_B - t_A) <= W horas
  4. Distancia euclidiana en el plano cartesiano d(A, B) <= R km
- Considera eventos activos y archivados, pero no eliminados.
- Criterio determinista estricto de selección cuando hay múltiples candidatos:
  (-magnitud, distancia, dt, id)
- Garantiza ausencia de ciclos por orden temporal estricto.
"""

from typing import List, Dict, Any, Optional, Tuple
import math

class AssociationService:
    """
    Servicio de Dominio Puro para el cálculo de réplicas y asociaciones sísmicas
    """

    @staticmethod
    def calcular_candidatos_para_evento(
        evento_b: Any,
        pool_eventos: List[Any],
        w_horas: float,
        r_km: float
    ) -> List[Dict[str, Any]]:
        """
        Retorna la lista de candidatos válidos que califican como referencia para evento_b.
        Cada candidato incluye su distancia, dt y referencia al objeto.
        """
        candidatos = []
        b_x = evento_b.coordinates.x
        b_y = evento_b.coordinates.y
        b_mag = evento_b.magnitude
        b_dt = evento_b.dt

        for a in pool_eventos:
            # No compararse consigo mismo ni con eventos sin fecha/coordenadas
            if a.id == evento_b.id:
                continue

            # 1. Mayor magnitud
            if a.magnitude <= b_mag:
                continue

            # 2. Ocurrió estrictamente antes y dentro de la ventana W
            dt_segundos = (b_dt - a.dt).total_seconds()
            dt_horas = dt_segundos / 3600.0
            if dt_horas <= 0 or dt_horas > w_horas:
                continue

            # 3. Distancia euclidiana en plano cartesiano [0, 1000] km <= R
            dx = a.coordinates.x - b_x
            dy = a.coordinates.y - b_y
            distancia = math.sqrt(dx * dx + dy * dy)
            if distancia > r_km:
                continue

            candidatos.append({
                "evento": a,
                "id": a.id,
                "magnitud": a.magnitude,
                "distancia": round(distancia, 2),
                "dt": round(dt_horas, 4)
            })

        # Orden determinista: Mayor magnitud (-M), menor distancia, menor dt, menor ID
        candidatos.sort(key=lambda x: (-x["magnitud"], x["distancia"], x["dt"], x["id"]))
        return candidatos

    @classmethod
    def seleccionar_referencia_determinista(
        cls,
        candidatos: List[Dict[str, Any]]
    ) -> Optional[int]:
        """
        Selecciona la referencia ganadora única aplicando el criterio determinista.
        Retorna el ID del evento de referencia o None si no hay candidatos.
        """
        if not candidatos:
            return None
        return candidatos[0]["id"]

    @classmethod
    def actualizar_asociaciones_para_evento(
        cls,
        evento_b: Any,
        pool_eventos: List[Any],
        w_horas: float,
        r_km: float
    ) -> Tuple[List[int], Optional[int]]:
        """
        Calcula y asigna las asociaciones del evento_b.
        Retorna (lista_ids_candidatos, referencia_ganadora_id).
        """
        candidatos = cls.calcular_candidatos_para_evento(evento_b, pool_eventos, w_horas, r_km)
        candidatos_ids = [c["id"] for c in candidatos]
        referencia_id = cls.seleccionar_referencia_determinista(candidatos)
        evento_b.asignar_asociaciones(candidatos_ids, referencia_id)
        return candidatos_ids, referencia_id

    @classmethod
    def recalcular_todas_las_asociaciones(
        cls,
        pool_eventos: List[Any],
        w_horas: float,
        r_km: float
    ) -> None:
        """
        Recalcula las asociaciones para todos los eventos del catálogo activo y archivado.
        """
        for ev in pool_eventos:
            cls.actualizar_asociaciones_para_evento(ev, pool_eventos, w_horas, r_km)
