# -*- coding: utf-8 -*-
"""
DTOs for crear_evento Vertical Slice / DTOs para crear_evento
SismoLab AVL - Universidad de Caldas
"""

from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

class CrearEventoDTO(BaseModel):
    id: int = Field(..., ge=1, le=999999, description="ID único del evento sísmico / Unique seismic event ID")
    magnitud: float = Field(..., ge=-2.0, le=10.0, description="Magnitud Richter / Richter magnitude")
    profundidad: float = Field(..., ge=0.0, description="Profundidad en km / Depth in km")
    latitud: float = Field(..., ge=-90.0, le=90.0, description="Latitud epicentral / Latitude")
    longitud: float = Field(..., ge=-180.0, le=180.0, description="Longitud epicentral / Longitude")
    estacion_id: str = Field(default="EST-MANIZALES-01", description="Código de la estación / Station code")
    zona_poblada: bool = Field(default=False, description="¿Afecta área habitada? / Populated zone flag?")
    timestamp: Optional[str] = Field(default=None, description="Instante de ocurrencia en UTC ISO 8601 (ej: 2026-09-22T10:30:00Z)")


class EventoRespuestaDTO(BaseModel):
    success: bool
    message: str
    data: Dict[str, Any]
