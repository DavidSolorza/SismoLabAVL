# -*- coding: utf-8 -*-
"""
Seismic Priority and Spatial Domain Rules / Reglas de Dominio de Prioridad y Clasificación Espacial
SismoLab AVL - Universidad de Caldas

Sección 3 & 4 de la especificación técnica oficial:
- Las zonas son rectángulos en un plano de 0 a 1000 km en ambos ejes.
- Un epicentro pertenece a una zona cuando está dentro de ella o sobre su borde.
- Cuando está en el borde de dos zonas, se clasifica como zona poblada si alguna de las dos está definida de esa forma.

Cálculo obligatorio de la prioridad:
- Prioridad 3 (Alta): M >= 6.0; o bien M >= 4.5 y H <= 30.0 km y epicentro en zona poblada.
- Prioridad 2 (Media): No cumple la condición de prioridad alta y M >= 4.5.
- Prioridad 1 (Baja): No cumple ninguna de las condiciones anteriores.
Todos los límites son inclusivos.
"""

from typing import List
from src.domain.entities.zone import ScenarioZone

def is_point_in_populated_zone(x: float, y: float, zones: List[ScenarioZone]) -> bool:
    """
    Evalúa si las coordenadas (x, y) pertenecen a una zona poblada.
    Si el punto cae en el borde compartido de dos zonas y al menos una es poblada,
    se clasifica estrictamente como zona poblada.
    """
    x_val = round(float(x), 1)
    y_val = round(float(y), 1)

    zonas_que_contienen = [z for z in zones if z.contains_point(x_val, y_val)]
    
    # Si alguna de las zonas en las que se ubica el punto es poblada, retorna True
    for z in zonas_que_contienen:
        if z.is_populated:
            return True

    return False


def calculate_seismic_priority(magnitude: float, depth: float, is_populated_zone: bool) -> int:
    """
    Calcula la prioridad sísmica obligatoria P en el conjunto {3, 2, 1}:
    - 3 (Alta): M >= 6.0; o bien (M >= 4.5 y H <= 30.0 km y epicentro en zona poblada).
    - 2 (Media): No cumple alta y M >= 4.5.
    - 1 (Baja): No cumple ninguna de las anteriores.

    Los límites son inclusivos.
    Por ejemplo, M = 4.5 y H = 30.0 km en zona poblada produce prioridad 3.
    El mismo evento fuera de una zona poblada produce prioridad 2.
    """
    m = round(float(magnitude), 1)
    h = round(float(depth), 1)

    # 1. Condición de Prioridad 3 (Alta)
    if m >= 6.0 or (m >= 4.5 and h <= 30.0 and is_populated_zone):
        return 3

    # 2. Condición de Prioridad 2 (Media)
    if m >= 4.5:
        return 2

    # 3. Prioridad 1 (Baja)
    return 1
