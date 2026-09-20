# -*- coding: utf-8 -*-
"""
System Configuration Settings / Configuración General del Sistema
SismoLab AVL - Universidad de Caldas

Este módulo gestiona la configuración del sistema, modos operacionales (Normal / Estrés)
y umbrales de prioridad sísmica.
This module manages system configuration, operational modes (Normal / Stress),
and seismic priority thresholds.
"""

from enum import Enum

class OperationalMode(str, Enum):
    """
    Modos Operacionales del Árbol AVL / AVL Operational Modes
    - NORMAL: Auto-balanceo recursivo inmediato / Immediate recursive auto-balancing.
    - STRESS: Inserción masiva diferida sin balanceo inmediato / Deferred massive insertion without immediate balance.
    """
    NORMAL = "NORMAL"
    STRESS = "STRESS"


class SystemSettings:
    """
    Contenedor de Configuración del Sistema / System Settings Container
    """
    APP_NAME: str = "SismoLab AVL Backend"
    VERSION: str = "1.0.0"
    ORGANIZATION: str = "Universidad de Caldas"
    
    # Modo inicial del AVL / Initial AVL mode
    DEFAULT_OPERATIONAL_MODE: OperationalMode = OperationalMode.NORMAL
    
    # Ruta por defecto para snapshots de persistencia JSON / Default path for JSON snapshot persistence
    STORAGE_FILE_PATH: str = "data_snapshot.json"
    
    # Rango válido de ID de evento sísmico / Valid seismic event ID range
    MIN_EVENT_ID: int = 1
    MAX_EVENT_ID: int = 999999

    # Rango de magnitud Richter / Richter magnitude range
    MIN_MAGNITUDE: float = -2.0
    MAX_MAGNITUDE: float = 10.0


settings = SystemSettings()
