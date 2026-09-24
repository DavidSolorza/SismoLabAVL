# -*- coding: utf-8 -*-
"""
DTO for corregir_evento Vertical Slice / DTO para corregir_evento
SismoLab AVL - Universidad de Caldas
"""

from typing import Optional
from pydantic import BaseModel, Field

class CorregirEventoDTO(BaseModel):
    event_id: int = Field(..., ge=1, le=999999, description="ID del evento a corregir SIS-XXXXXX")
    nueva_magnitud: float = Field(..., ge=-2.0, le=10.0, description="Nueva magnitud Richter M [-2.0, 10.0]")
    nueva_profundidad: float = Field(..., ge=0.0, le=700.0, description="Nueva profundidad H en km [0.0, 700.0]")
    estacion_id: Optional[str] = Field(default=None, description="Estación que emite la corrección")
    razon: str = Field(default="Calibración técnica", description="Razón de la corrección")
