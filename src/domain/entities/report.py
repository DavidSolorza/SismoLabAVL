# -*- coding: utf-8 -*-
"""
Report Domain Entity / Entidad de Dominio Reporte de Telemetría
SismoLab AVL - Universidad de Caldas
"""

import uuid
from typing import Dict, Any

class SeismicReport:
    """
    Entidad Reporte Sísmico de Telemetría / Telemetry Seismic Report Entity
    Representa un reporte encolado en la Cola FIFO / Represents a report queued in FIFO Queue.
    """
    def __init__(self, station_code: str, raw_data: Dict[str, Any], report_id: str = None):
        self.id = report_id or str(uuid.uuid4())
        self.station_code = station_code
        self.raw_data = raw_data
        self.processed = False

    def mark_as_processed(self) -> None:
        self.processed = True

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "station_code": self.station_code,
            "raw_data": self.raw_data,
            "processed": self.processed
        }
