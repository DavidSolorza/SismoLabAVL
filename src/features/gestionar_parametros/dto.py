# -*- coding: utf-8 -*-
"""
DTO for Scenario Parameters (Secciones 7, 9 y 10) / DTO de Parámetros del Escenario
SismoLab AVL - Universidad de Caldas
"""

from typing import Optional
from pydantic import BaseModel, Field

class ActualizarParametrosDTO(BaseModel):
    w_horas: Optional[float] = Field(None, gt=0, description="Ventana temporal máxima para réplicas W (horas, > 0)")
    r_km: Optional[float] = Field(None, gt=0, description="Radio espacial máximo para réplicas R (km, > 0)")
    limite_l: Optional[int] = Field(None, ge=0, description="Presupuesto de acceso topológico L (entero >= 0)")
    t_horas: Optional[float] = Field(None, gt=0, description="Umbral de antigüedad para archivar ramas T (horas, > 0)")
