# -*- coding: utf-8 -*-
"""
DTOs for gestionar_estaciones Vertical Slice / DTOs para gestionar_estaciones
SismoLab AVL - Universidad de Caldas
"""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, validator

class CrearEstacionDTO(BaseModel):
    codigo: str = Field(..., min_length=3, max_length=30, description="Código unívoco de la estación (ej: EST-BARRANQUILLA-01)")
    nombre: str = Field(..., min_length=3, max_length=120, description="Nombre descriptivo de la estación")
    x: float = Field(..., ge=0.0, le=1000.0, description="Coordenada X cartesiana en km [0.0, 1000.0]")
    y: float = Field(..., ge=0.0, le=1000.0, description="Coordenada Y cartesiana en km [0.0, 1000.0]")
    activa: bool = Field(default=True, description="Indica si la estación telemétrica está operativa")

    @validator('codigo')
    def formatear_codigo(cls, v: str) -> str:
        clean = v.strip().upper()
        if not clean:
            raise ValueError("El código de la estación no puede estar vacío.")
        return clean

    @validator('nombre')
    def validar_nombre(cls, v: str) -> str:
        clean = v.strip()
        if len(clean) < 3:
            raise ValueError("El nombre de la estación debe tener al menos 3 caracteres.")
        return clean


class EstacionItemDTO(BaseModel):
    codigo: str
    nombre: str
    x: float
    y: float
    activo: bool


class ListaEstacionesRespuestaDTO(BaseModel):
    success: bool
    total: int
    estaciones: List[EstacionItemDTO]
