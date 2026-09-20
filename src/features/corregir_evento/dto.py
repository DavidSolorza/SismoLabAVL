# -*- coding: utf-8 -*-
"""
DTO for corregir_evento Vertical Slice / DTO para corregir_evento
SismoLab AVL - Universidad de Caldas
"""

from pydantic import BaseModel, Field

class CorregirEventoDTO(BaseModel):
    event_id: int = Field(..., ge=1, le=999999, description="ID del evento a corregir / Event ID to correct")
    nueva_magnitud: float = Field(..., ge=-2.0, le=10.0, description="Nueva magnitud / New magnitude")
    nueva_profundidad: float = Field(..., ge=0.0, description="Nueva profundidad / New depth")
    razon: str = Field(default="Calibración técnica", description="Razón de la corrección / Reason")
