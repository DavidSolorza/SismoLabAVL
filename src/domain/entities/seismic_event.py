# -*- coding: utf-8 -*-
"""
Seismic Event Domain Entity / Entidad de Dominio Evento Sísmico
SismoLab AVL - Universidad de Caldas

Representa el Evento Sísmico con su Clave Compuesta K = (P, M, I) e información operacional.
Represents the Seismic Event with its Composite Key K = (P, M, I) and operational telemetry.
"""

from datetime import datetime, timezone
from typing import Dict, Any, Optional
from src.domain.value_objects.composite_key import CompositeKeyK
from src.domain.value_objects.coordinates import GeographicCoordinates
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
        coordinates: GeographicCoordinates,
        station_id: str,
        is_populated_zone: bool,
        timestamp: Optional[str] = None,
        status: str = "ACTIVO"
    ):
        self.id = event_id
        self.magnitude = round(float(magnitude), 1)
        self.depth = round(float(depth), 2)
        self.coordinates = coordinates
        self.station_id = station_id
        self.is_populated_zone = is_populated_zone
        
        # Procesar y normalizar timestamp en UTC
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

        self.status = status

        # Calcular prioridad P (1, 2, 3) y construir la Clave Compuesta K = (P, M, I)
        # Calculate priority P (1, 2, 3) and construct Composite Key K = (P, M, I)
        self.priority = calculate_seismic_priority(self.magnitude, self.depth, self.is_populated_zone)
        self.composite_key = CompositeKeyK(
            priority=self.priority,
            magnitude=self.magnitude,
            identifier=self.id
        )

    def update_telemetry(self, new_magnitude: float, new_depth: float) -> bool:
        """
        Actualiza los parámetros sísmicos y re-calcula la Clave K si cambia la prioridad.
        Updates seismic parameters and re-calculates Key K if priority changes.
        Returns True if priority changed.
        """
        old_priority = self.priority
        self.magnitude = round(float(new_magnitude), 1)
        self.depth = round(float(new_depth), 2)
        self.priority = calculate_seismic_priority(self.magnitude, self.depth, self.is_populated_zone)
        
        self.composite_key = CompositeKeyK(
            priority=self.priority,
            magnitude=self.magnitude,
            identifier=self.id
        )
        return old_priority != self.priority

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
        """Marca el evento como archivado / Marks event as archived"""
        self.status = "ARCHIVADO"

    def to_dict(self, current_clock: Optional[datetime] = None) -> Dict[str, Any]:
        data = {
            "id": self.id,
            "formatted_id": self.composite_key.formatted_id(),
            "prioridad": self.priority,
            "magnitud": self.magnitude,
            "profundidad": self.depth,
            "coordenadas": self.coordinates.to_dict(),
            "estacion_id": self.station_id,
            "zona_poblada": self.is_populated_zone,
            "timestamp": self.timestamp,
            "estado": self.status,
            "clave_k": self.composite_key.to_dict()
        }
        if current_clock:
            data["antiguedad_segundos"] = self.get_age_seconds(current_clock)
            data["antiguedad_humana"] = self.get_age_display(current_clock)
        return data

    def __repr__(self) -> str:
        return f"EventoSismico({self.composite_key.formatted_id()}, P={self.priority}, M={self.magnitude}, D={self.depth}km)"
