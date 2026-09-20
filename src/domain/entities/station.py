# -*- coding: utf-8 -*-
"""
Station Domain Entity / Entidad de Dominio Estación Sísmica
SismoLab AVL - Universidad de Caldas
"""

from typing import Dict, Any
from src.domain.value_objects.coordinates import GeographicCoordinates

class SeismicStation:
    """
    Entidad Estación Sísmica / Seismic Station Entity
    """
    def __init__(self, code: str, name: str, coordinates: GeographicCoordinates, active: bool = True):
        self.code = code
        self.name = name
        self.coordinates = coordinates
        self.active = active

    def to_dict(self) -> Dict[str, Any]:
        return {
            "code": self.code,
            "name": self.name,
            "coordinates": self.coordinates.to_dict(),
            "active": self.active
        }
