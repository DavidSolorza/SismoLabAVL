# -*- coding: utf-8 -*-
"""
Seismic Event Domain Entity / Entidad de Dominio Evento Sísmico
SismoLab AVL - Universidad de Caldas

Alineado con las Secciones 3 y 4 de la especificación técnica oficial:
- Identificador único SIS-XXXXXX (1 a 999999).
- Magnitud M en [-2.0, 10.0] con máx 1 decimal.
- Profundidad H en [0.0, 700.0] km con máx 1 decimal.
- Epicentro en plano cartesiano [0.0, 1000.0] km.
- Timestamp UTC ISO 8601 con precisión de segundos.
- Revisión entera positiva (inicia en 1).
- Conjunto de estaciones reportantes con reportes aceptados.
- Estado de atención: 'Pendiente' o 'Revisado'. Alta inicia Pendiente; corrección lo devuelve a Pendiente.
- Prioridad P in {3=Alta, 2=Media, 1=Baja}.
"""

from datetime import datetime, timezone
from typing import Dict, Any, Optional, List, Set
from src.domain.value_objects.composite_key import CompositeKeyK
from src.domain.value_objects.coordinates import CartesianCoordinates
from src.domain.rules import calculate_seismic_priority

class SeismicEvent:
    """
    Entidad de Dominio Evento Sísmico / Seismic Event Domain Entity
    """
    def __init__(
        self,
        event_id: int,
        magnitude: float,
        depth: float,
        coordinates: CartesianCoordinates,
        station_id: str,
        is_populated_zone: bool,
        timestamp: Optional[str] = None,
        estado_atencion: str = "Pendiente",
        revision: int = 1,
        origin_report_id: Optional[str] = None,
        estaciones_reportantes: Optional[List[str]] = None
    ):
        if not (1 <= int(event_id) <= 999999):
            raise ValueError(f"Identificador fuera de rango: {event_id}. Debe estar entre 1 y 999999.")

        mag_val = round(float(magnitude), 1)
        if not (-2.0 <= mag_val <= 10.0):
            raise ValueError(f"Magnitud fuera de rango: {mag_val}. Debe estar entre -2.0 y 10.0.")

        depth_val = round(float(depth), 1)
        if not (0.0 <= depth_val <= 700.0):
            raise ValueError(f"Profundidad H fuera de rango: {depth_val}. Debe estar entre 0.0 y 700.0 km.")

        self.id = int(event_id)
        self.magnitude = mag_val
        self.depth = depth_val
        self.coordinates = coordinates
        self.station_id = station_id
        self.is_populated_zone = is_populated_zone
        self.revision = int(revision)
        self.version = self.revision  # Alias de conveniencia
        self.origin_report_id = origin_report_id

        # Conjunto de estaciones con reportes aceptados
        self.estaciones_reportantes: Set[str] = set(estaciones_reportantes) if estaciones_reportantes else {station_id}

        # Estado de atención: 'Pendiente' o 'Revisado'
        self.estado_atencion = estado_atencion if estado_atencion in ("Pendiente", "Revisado") else "Pendiente"
        self.status = "ACTIVO"  # Estado operativo del nodo en el AVL

        # Procesar y normalizar timestamp en UTC con precisión de segundos
        if timestamp:
            clean_ts = timestamp.replace("Z", "+00:00")
            parsed_dt = datetime.fromisoformat(clean_ts)
            if parsed_dt.tzinfo is None:
                parsed_dt = parsed_dt.replace(tzinfo=timezone.utc)
            self.dt = parsed_dt.astimezone(timezone.utc)
            self.timestamp = self.dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        else:
            self.dt = datetime.now(timezone.utc)
            self.timestamp = self.dt.strftime("%Y-%m-%dT%H:%M:%SZ")

        # Calcular prioridad P (3, 2, 1) y Clave Compuesta K = (P, M, I)
        self.priority = calculate_seismic_priority(self.magnitude, self.depth, self.is_populated_zone)
        self.composite_key = CompositeKeyK(
            priority=self.priority,
            magnitude=self.magnitude,
            identifier=self.id
        )

        # Asociaciones y Réplicas (Sección 7)
        self.candidatos_referencia: List[int] = []
        self.evento_referencia_id: Optional[int] = None
        self.es_replica: bool = False

        # Presupuesto de acceso topológico L (Sección 9)
        self.acceso_costoso: bool = False
        self.costo_simulado: int = 1
        self.depth_in_tree: int = 0


    def asignar_asociaciones(self, candidatos: List[int], referencia_id: Optional[int]) -> None:
        """Asigna los identificadores de candidatos y la referencia ganadora única"""
        self.candidatos_referencia = list(candidatos)
        self.evento_referencia_id = referencia_id
        self.es_replica = referencia_id is not None

    @property
    def replica_candidates_ids(self) -> List[int]:
        return self.candidatos_referencia

    @property
    def chosen_reference_id(self) -> Optional[int]:
        return self.evento_referencia_id

    @property
    def reporting_stations(self) -> Set[str]:
        return self.estaciones_reportantes


    def update_telemetry(self, new_magnitude: float, new_depth: float, nueva_estacion: Optional[str] = None) -> bool:

        """
        Actualiza los parámetros sísmicos.
        Reglas obligatorias:
        - Incrementa la revisión.
        - Devuelve el estado de atención a 'Pendiente'.
        - Registra la estación si es nueva.
        - Re-calcula la prioridad y la Clave K.
        Returns True si cambió la prioridad.
        """
        mag_val = round(float(new_magnitude), 1)
        if not (-2.0 <= mag_val <= 10.0):
            raise ValueError(f"Magnitud fuera de rango: {mag_val}. Debe estar entre -2.0 y 10.0.")

        depth_val = round(float(new_depth), 1)
        if not (0.0 <= depth_val <= 700.0):
            raise ValueError(f"Profundidad H fuera de rango: {depth_val}. Debe estar entre 0.0 y 700.0 km.")

        old_priority = self.priority
        self.magnitude = mag_val
        self.depth = depth_val
        self.revision += 1
        self.version = self.revision
        self.estado_atencion = "Pendiente"

        if nueva_estacion:
            self.estaciones_reportantes.add(nueva_estacion)

        return self.recalcular_prioridad_y_clave()

    def recalcular_prioridad_y_clave(self) -> bool:
        """
        Recalcula la prioridad P y la clave K a partir de la magnitud, profundidad y zona poblada vigentes.
        Retorna True si cambió la prioridad.
        """
        p_ant = getattr(self, 'priority', None)
        self.priority = calculate_seismic_priority(self.magnitude, self.depth, self.is_populated_zone)
        self.composite_key = CompositeKeyK(
            priority=self.priority,
            magnitude=self.magnitude,
            identifier=self.id
        )
        return p_ant is not None and self.priority != p_ant

    def agregar_estacion_reportante(self, station_code: str) -> None:
        """Agrega una estación al conjunto de reportes aceptados"""
        self.estaciones_reportantes.add(station_code)

    def marcar_revisado(self) -> None:
        """Transiciona el estado de atención a 'Revisado'"""
        self.estado_atencion = "Revisado"

    def asignar_asociaciones(self, candidatos: List[int], referencia_id: Optional[int]) -> None:
        """
        Asigna la lista de candidatos a referencia y la réplica oficial (Sección 7).
        """
        self.candidatos_referencia = list(candidatos)
        self.evento_referencia_id = referencia_id
        self.es_replica = (referencia_id is not None)

    def actualizar_marca_acceso(self, profundidad: int, limite_l: int) -> None:
        """
        Actualiza el costo simulado y la marca de acceso costoso según presupuesto L (Sección 9).
        La marca se activa si y solo si P=3 (Alta Prioridad) y profundidad > L.
        """
        self.costo_simulado = profundidad + 1
        if self.priority == 3 and profundidad > limite_l:
            self.acceso_costoso = True
        else:
            self.acceso_costoso = False

    def get_age_seconds(self, current_clock: datetime) -> int:
        """Retorna la antigüedad del evento en segundos respecto al reloj de simulación"""
        if current_clock.tzinfo is None:
            current_clock = current_clock.replace(tzinfo=timezone.utc)
        diff = (current_clock - self.dt).total_seconds()
        return max(0, int(diff))

    def get_age_display(self, current_clock: datetime) -> str:
        """Retorna la antigüedad formateada de manera amigable"""
        secs = self.get_age_seconds(current_clock)
        if secs < 60:
            return f"hace {secs}s"
        mins = secs // 60
        if mins < 60:
            return f"hace {mins}m"
        hours = mins // 60
        if hours < 24:
            return f"hace {hours}h"
        days = hours // 24
        return f"hace {days}d"

    def archive(self) -> None:
        """Marca el evento como archivado"""
        self.status = "ARCHIVADO"

    def to_dict(self, current_clock: Optional[datetime] = None) -> Dict[str, Any]:
        data = {
            "id": self.id,
            "formatted_id": self.composite_key.formatted_id(),
            "prioridad": self.priority,
            "prioridad_etiqueta": "Alta" if self.priority == 3 else ("Media" if self.priority == 2 else "Baja"),
            "magnitud": self.magnitude,
            "profundidad": self.depth,
            "coordenadas": self.coordinates.to_dict(),
            "x": self.coordinates.x,
            "y": self.coordinates.y,
            "estacion_id": self.station_id,
            "estaciones_reportantes": sorted(list(self.estaciones_reportantes)),
            "revision": self.revision,
            "version": self.revision,
            "estado_atencion": self.estado_atencion,
            "zona_poblada": self.is_populated_zone,
            "timestamp": self.timestamp,
            "estado": self.status,
            "origin_report_id": self.origin_report_id,
            "clave_k": self.composite_key.to_dict(),
            "composite_key": str(self.composite_key),
            "candidatos_referencia": list(self.candidatos_referencia),

            "evento_referencia_id": self.evento_referencia_id,
            "es_replica": self.es_replica,
            "acceso_costoso": self.acceso_costoso,
            "costo_simulado": self.costo_simulado
        }
        if current_clock:
            data["antiguedad_segundos"] = self.get_age_seconds(current_clock)
            data["antiguedad_humana"] = self.get_age_display(current_clock)
        return data

    def __repr__(self) -> str:
        return f"EventoSismico({self.composite_key.formatted_id()}, P={self.priority}, M={self.magnitude}, H={self.depth}km, Rev={self.revision}, [{self.estado_atencion}])"
