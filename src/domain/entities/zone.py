# -*- coding: utf-8 -*-
"""
Zone Domain Entity / Entidad de Dominio Zona del Escenario
SismoLab AVL - Universidad de Caldas

Las zonas son rectángulos definidos por sus límites en un plano de 0 a 1000 km en ambos ejes.
Un epicentro pertenece a una zona cuando está dentro de ella o sobre su borde.
Cuando está en el borde de dos zonas, se clasifica como zona poblada si alguna de las dos
está definida de esa forma.
"""

from typing import Dict, Any

class ScenarioZone:
    """
    Entidad de Dominio Zona Rectangular
    Rectangular Zone Domain Entity
    """
    def __init__(
        self,
        zone_id: str,
        name: str,
        x_min: float,
        x_max: float,
        y_min: float,
        y_max: float,
        is_populated: bool = True
    ):
        if x_min > x_max:
            raise ValueError(f"x_min ({x_min}) no puede ser mayor que x_max ({x_max})")
        if y_min > y_max:
            raise ValueError(f"y_min ({y_min}) no puede ser mayor que y_max ({y_max})")

        self.id = zone_id
        self.code = zone_id
        self.name = name
        self.x_min = round(float(x_min), 1)
        self.x_max = round(float(x_max), 1)
        self.y_min = round(float(y_min), 1)
        self.y_max = round(float(y_max), 1)
        self.is_populated = is_populated

    def contains_point(self, x: float, y: float) -> bool:
        """
        Verifica si el punto (x, y) está dentro del rectángulo o sobre su borde (inclusivo).
        """
        x_round = round(float(x), 1)
        y_round = round(float(y), 1)
        return (self.x_min <= x_round <= self.x_max) and (self.y_min <= y_round <= self.y_max)

    def is_on_border(self, x: float, y: float) -> bool:
        """
        Determina si el punto (x, y) se encuentra exactamente sobre el borde del rectángulo.
        """
        if not self.contains_point(x, y):
            return False
        x_round = round(float(x), 1)
        y_round = round(float(y), 1)
        return (x_round in (self.x_min, self.x_max)) or (y_round in (self.y_min, self.y_max))

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "nombre": self.name,
            "x_min": self.x_min,
            "x_max": self.x_max,
            "y_min": self.y_min,
            "y_max": self.y_max,
            "es_poblada": self.is_populated
        }

    def __repr__(self) -> str:
        tipo = "Poblada" if self.is_populated else "No Poblada"
        return f"Zona({self.name} [{tipo}]: X=[{self.x_min}, {self.x_max}], Y=[{self.y_min}, {self.y_max}])"


# Alias en español
Zona = ScenarioZone
