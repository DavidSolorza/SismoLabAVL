# -*- coding: utf-8 -*-
"""
DTO for archivar_rama Vertical Slice (Sección 10) / DTO para archivar_rama
SismoLab AVL - Universidad de Caldas
"""

from typing import Optional
from pydantic import BaseModel, Field

class ArchivarRamaDTO(BaseModel):
    t_horas: Optional[float] = Field(None, gt=0, description="Umbral de antigüedad en horas (por defecto usa el del escenario T=72h)")
    guardar_json: bool = Field(default=True, description="¿Exportar copia de seguridad en JSON? / Export JSON snapshot?")
    prioridad_minima: Optional[int] = Field(default=1, ge=1, le=3, description="Prioridad baja P=1 (retrocompatibilidad)")
