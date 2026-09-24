# -*- coding: utf-8 -*-
"""
Coordinates Value Object / Objeto de Valor de Coordenadas Cartesianas
SismoLab AVL - Universidad de Caldas

Epicentro: Coordenadas x e y en km, entre 0,0 y 1000,0 con máximo un decimal.
Permiten determinar la pertenencia a zonas y el cálculo euclidiano de distancias.
"""

import math
from typing import Dict, Any

class CartesianCoordinates:
    """
    Coordenadas Cartesianas Inmutables en km (x, y) en el plano [0.0, 1000.0]
    Immutable Cartesian Coordinates in km (x, y) in range [0.0, 1000.0]
    """
    __slots__ = ('_x', '_y')

    def __init__(self, x: float, y: float):
        x_val = round(abs(float(x)), 1)
        y_val = round(abs(float(y)), 1)

        if not (0.0 <= x_val <= 1000.0):
            raise ValueError(f"Coordenada X fuera de rango: {x_val}. Debe estar entre 0.0 y 1000.0 km.")
        if not (0.0 <= y_val <= 1000.0):
            raise ValueError(f"Coordenada Y fuera de rango: {y_val}. Debe estar entre 0.0 y 1000.0 km.")

        self._x = x_val
        self._y = y_val

    @property
    def x(self) -> float:
        return self._x

    @property
    def y(self) -> float:
        return self._y

    # Compatibilidad con accesos previos
    @property
    def latitude(self) -> float:
        return self._y

    @property
    def longitude(self) -> float:
        return self._x

    def distancia_a(self, otra: 'CartesianCoordinates') -> float:
        """Calcula la distancia euclidiana en km a otra coordenada"""
        return round(math.sqrt((self._x - otra.x) ** 2 + (self._y - otra.y) ** 2), 1)

    def to_dict(self) -> Dict[str, float]:
        return {
            "x": self._x,
            "y": self._y
        }

    def __repr__(self) -> str:
        return f"Coordenadas(x={self._x:.1f} km, y={self._y:.1f} km)"

    def __eq__(self, other: Any) -> bool:
        if isinstance(other, CartesianCoordinates):
            return self._x == other.x and self._y == other.y
        return False


# Alias para retrocompatibilidad
GeographicCoordinates = CartesianCoordinates
