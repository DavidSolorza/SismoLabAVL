# -*- coding: utf-8 -*-
"""
DTOs for gestion_reloj Vertical Slice / DTOs para gestion_reloj
SismoLab AVL - Universidad de Caldas
"""

from pydantic import BaseModel, Field

class FijarRelojDTO(BaseModel):
    reloj: str = Field(..., description="Fecha y hora UTC en formato ISO 8601 (ej: 2026-09-22T15:00:00Z)")

class AvanzarRelojDTO(BaseModel):
    minutos: int = Field(default=0, ge=0, description="Minutos a avanzar")
    horas: int = Field(default=0, ge=0, description="Horas a avanzar")
    dias: int = Field(default=0, ge=0, description="Días a avanzar")
    segundos: int = Field(default=0, ge=0, description="Segundos a avanzar")

class RelojRespuestaDTO(BaseModel):
    success: bool
    reloj: str
    timestamp_epoch: int
    message: str
