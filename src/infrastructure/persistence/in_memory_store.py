# -*- coding: utf-8 -*-
"""
In-Memory Store Container / Contenedor de Almacenamiento en Memoria
SismoLab AVL - Universidad de Caldas

Mantiene el estado global thread-safe de la aplicación (Árbol AVL, BST, Pila de Deshacer, Cola de Reportes).
Maintains application thread-safe global state (AVL Tree, BST, Undo Stack, Telemetry Queue).
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, Optional
from src.domain.structures.avl import ArbolAVL
from src.domain.structures.bst import ArbolBST
from src.domain.structures.stack import Stack
from src.domain.structures.queue import Queue
from src.domain.entities.station import SeismicStation
from src.domain.entities.report import SeismicReport
from src.domain.value_objects.coordinates import GeographicCoordinates

class InMemoryStore:
    """
    Contenedor Global del Estado en Memoria / Global In-Memory State Container
    Almacena el escenario: árboles, estaciones, colas y el reloj de simulación explícito.
    """
    def __init__(self):
        # Reloj de Simulación Explícito (UTC, precisión en segundos)
        self.simulation_clock: datetime = datetime(2026, 9, 22, 12, 0, 0, tzinfo=timezone.utc)
        self.avl_tree = ArbolAVL()
        self.bst_tree = ArbolBST()
        self.undo_stack: Stack[Dict] = Stack()
        self.report_queue: Queue[SeismicReport] = Queue()
        self.stations: Dict[str, SeismicStation] = {}
        self._init_default_stations()
        self._init_sample_events()

    def get_simulation_clock(self) -> datetime:
        """Retorna el reloj de simulación actual en UTC"""
        return self.simulation_clock

    def get_simulation_clock_iso(self) -> str:
        """Retorna el reloj en formato ISO 8601 con sufijo Z"""
        return self.simulation_clock.strftime("%Y-%m-%dT%H:%M:%SZ")

    def set_simulation_clock(self, new_clock: datetime) -> str:
        """Establece manualmente el reloj de simulación"""
        if new_clock.tzinfo is None:
            new_clock = new_clock.replace(tzinfo=timezone.utc)
        self.simulation_clock = new_clock.astimezone(timezone.utc)
        return self.get_simulation_clock_iso()

    def advance_simulation_clock(self, seconds: int = 0, minutes: int = 0, hours: int = 0, days: int = 0) -> str:
        """Avanza el reloj de simulación un intervalo temporal positivo"""
        total_delta = timedelta(days=days, hours=hours, minutes=minutes, seconds=seconds)
        self.simulation_clock = self.simulation_clock + total_delta
        return self.get_simulation_clock_iso()

    def _init_default_stations(self) -> None:
        """Inicializa estaciones sísmicas por defecto / Initializes default stations"""
        s1 = SeismicStation("EST-MANIZALES-01", "Estación Central Manizales", GeographicCoordinates(5.06889, -75.51738))
        s2 = SeismicStation("EST-PEREIRA-01", "Estación Matecaña Pereira", GeographicCoordinates(4.81333, -75.69611))
        s3 = SeismicStation("EST-ARMENIA-01", "Estación Quindío Armenia", GeographicCoordinates(4.53389, -75.68111))
        self.stations[s1.code] = s1
        self.stations[s2.code] = s2
        self.stations[s3.code] = s3

    def _init_sample_events(self) -> None:
        """Inicializa eventos sísmicos de muestra con instantes coherentes con el reloj"""
        from src.domain.entities.seismic_event import SeismicEvent
        e1 = SeismicEvent(1001, 6.5, 12.0, GeographicCoordinates(5.06889, -75.51738), "EST-MANIZALES-01", True, timestamp="2026-09-22T10:00:00Z")
        e2 = SeismicEvent(1002, 5.2, 25.0, GeographicCoordinates(4.81333, -75.69611), "EST-PEREIRA-01", True, timestamp="2026-09-22T11:15:00Z")
        e3 = SeismicEvent(1003, 4.1, 45.0, GeographicCoordinates(4.53389, -75.68111), "EST-ARMENIA-01", False, timestamp="2026-09-22T11:50:00Z")
        for e in (e1, e2, e3):
            try:
                self.avl_tree.insertar(e)
                self.bst_tree.insertar(e)
            except Exception:
                pass

    def clear_all(self, load_samples: bool = True) -> None:
        """Reinicia el estado en memoria y restablece el reloj de simulación"""
        self.simulation_clock = datetime(2026, 9, 22, 12, 0, 0, tzinfo=timezone.utc)
        self.avl_tree = ArbolAVL()
        self.bst_tree = ArbolBST()
        self.undo_stack.clear()
        self.report_queue.clear()
        self._init_default_stations()
        if load_samples:
            self._init_sample_events()


# Instancia singleton del almacenamiento / Singleton instance
store = InMemoryStore()
