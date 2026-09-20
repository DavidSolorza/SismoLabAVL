# -*- coding: utf-8 -*-
"""
Seismic Priority Domain Rules / Reglas de Dominio de Prioridad Sísmica
SismoLab AVL - Universidad de Caldas

Este módulo implementa el cálculo automático de la Prioridad P (1, 2, 3) basado en:
- Magnitud M
- Profundidad D (Superficial <= 30km aumenta el riesgo)
- Zona Poblada (Impacto habitado aumenta el riesgo)
"""

def calculate_seismic_priority(magnitude: float, depth: float, is_populated_zone: bool) -> int:
    """
    Calcula la prioridad sísmica P in mutable en el conjunto {1, 2, 3}:
    - Priority 1 (Alta/Crítico / High/Critical):
      * Magnitud M >= 6.0 O (M >= 5.0 en zona poblada con profundidad superficial <= 30km)
    - Priority 2 (Media / Medium):
      * Magnitud 4.0 <= M < 6.0 O (M >= 3.5 en zona poblada)
    - Priority 3 (Baja / Low):
      * Sismos menores M < 4.0 en zonas no pobladas o profundos.

    Returns:
      int: 1, 2, o 3
    """
    # Sismos de gran magnitud o sismos moderados superficiales en áreas habitadas
    if magnitude >= 6.0 or (magnitude >= 5.0 and is_populated_zone and depth <= 30.0):
        return 1
    
    # Sismos intermedios o moderados habitados
    if magnitude >= 4.0 or (magnitude >= 3.5 and is_populated_zone):
        return 2

    # Sismos de menor intensidad o profundos no poblados
    return 3
