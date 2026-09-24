# -*- coding: utf-8 -*-
"""
DTOs for crear_evento Vertical Slice / DTOs para crear_evento
SismoLab AVL - Universidad de Caldas
"""

from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

class CrearEventoDTO(BaseModel):
    id: int = Field(..., ge=1, le=999999, description="ID único del evento sísmico SIS-XXXXXX")
    magnitud: float = Field(..., ge=-2.0, le=10.0, description="Magnitud M (-2.0 a 10.0 con máx 1 decimal)")
    profundidad: float = Field(..., ge=0.0, le=700.0, description="Profundidad H (0.0 a 700.0 km con máx 1 decimal)")
    x: Optional[float] = Field(default=None, ge=0.0, le=1000.0, description="Coordenada X en km [0.0, 1000.0]")
    y: Optional[float] = Field(default=None, ge=0.0, le=1000.0, description="Coordenada Y en km [0.0, 1000.0]")
    latitud: Optional[float] = Field(default=None, description="Compatibilidad con clientes anteriores")
    longitud: Optional[float] = Field(default=None, description="Compatibilidad con clientes anteriores")
    estacion_id: str = Field(default="EST-MANIZALES-01", description="Código de la estación emisora")
    zona_poblada: Optional[bool] = Field(default=None, description="Opcional: cálculo geométrico automático según plano de zonas")
    timestamp: Optional[str] = Field(default=None, description="Instante de ocurrencia en UTC ISO 8601 (ej: 2026-09-22T10:30:00Z)")


class EventoRespuestaDTO(BaseModel):
    success: bool
    message: str
    data: Dict[str, Any]
