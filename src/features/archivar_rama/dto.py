# -*- coding: utf-8 -*-
"""
DTO for archivar_rama Vertical Slice / DTO para archivar_rama
SismoLab AVL - Universidad de Caldas
"""

from pydantic import BaseModel, Field

class ArchivarRamaDTO(BaseModel):
    prioridad_minima: int = Field(default=3, ge=1, le=3, description="Prioridad umbral a podar (P=3 es baja prioridad / P=3 is low priority)")
    guardar_json: bool = Field(default=True, description="¿Exportar copia de seguridad en JSON? / Export JSON snapshot?")
