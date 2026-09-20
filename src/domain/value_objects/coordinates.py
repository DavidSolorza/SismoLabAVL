# -*- coding: utf-8 -*-
"""
Coordinates Value Object / Objeto de Valor de Coordenadas Geográficas
SismoLab AVL - Universidad de Caldas
"""

class GeographicCoordinates:
    """
    Coordenadas Geográficas Inmutables (Latitud, Longitud)
    Immutable Geographic Coordinates (Latitude, Longitude)
    """
    __slots__ = ('_latitude', '_longitude')

    def __init__(self, latitude: float, longitude: float):
        if not (-90.0 <= latitude <= 90.0):
            raise ValueError(f"Latitud inválida: {latitude}. Debe estar entre -90.0 y 90.0")
        if not (-180.0 <= longitude <= 180.0):
            raise ValueError(f"Longitud inválida: {longitude}. Debe estar entre -180.0 y 180.0")

        self._latitude = round(float(latitude), 5)
        self._longitude = round(float(longitude), 5)

    @property
    def latitude(self) -> float:
        return self._latitude

    @property
    def longitude(self) -> float:
        return self._longitude

    def to_dict(self) -> dict:
        return {
            "latitude": self._latitude,
            "longitude": self._longitude
        }

    def __repr__(self) -> str:
        return f"Coordenadas(Lat={self._latitude}, Lon={self._longitude})"
