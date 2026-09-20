# -*- coding: utf-8 -*-
"""
In-Memory Store Container / Contenedor de Almacenamiento en Memoria
SismoLab AVL - Universidad de Caldas

Mantiene el estado global thread-safe de la aplicación (Árbol AVL, BST, Pila de Deshacer, Cola de Reportes).
Maintains application thread-safe global state (AVL Tree, BST, Undo Stack, Telemetry Queue).
"""

from typing import Dict
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
    """
    def __init__(self):
        self.avl_tree = ArbolAVL()
        self.bst_tree = ArbolBST()
        self.undo_stack: Stack[Dict] = Stack()
        self.report_queue: Queue[SeismicReport] = Queue()
        self.stations: Dict[str, SeismicStation] = {}
        self._init_default_stations()
        self._init_sample_events()

    def _init_default_stations(self) -> None:
        """Inicializa estaciones sísmicas por defecto / Initializes default stations"""
        s1 = SeismicStation("EST-MANIZALES-01", "Estación Central Manizales", GeographicCoordinates(5.06889, -75.51738))
        s2 = SeismicStation("EST-PEREIRA-01", "Estación Matecaña Pereira", GeographicCoordinates(4.81333, -75.69611))
        s3 = SeismicStation("EST-ARMENIA-01", "Estación Quindío Armenia", GeographicCoordinates(4.53389, -75.68111))
        self.stations[s1.code] = s1
        self.stations[s2.code] = s2
        self.stations[s3.code] = s3

    def _init_sample_events(self) -> None:
        """Inicializa eventos sísmicos de muestra en el Árbol AVL y BST"""
        from src.domain.entities.seismic_event import SeismicEvent
        e1 = SeismicEvent(1001, 6.5, 12.0, GeographicCoordinates(5.06889, -75.51738), "EST-MANIZALES-01", True)
        e2 = SeismicEvent(1002, 5.2, 25.0, GeographicCoordinates(4.81333, -75.69611), "EST-PEREIRA-01", True)
        e3 = SeismicEvent(1003, 4.1, 45.0, GeographicCoordinates(4.53389, -75.68111), "EST-ARMENIA-01", False)
        for e in (e1, e2, e3):
            try:
                self.avl_tree.insertar(e)
                self.bst_tree.insertar(e)
            except Exception:
                pass

    def clear_all(self, load_samples: bool = True) -> None:
        """Reinicia el estado en memoria / Resets in-memory state"""
        self.avl_tree = ArbolAVL()
        self.bst_tree = ArbolBST()
        self.undo_stack.clear()
        self.report_queue.clear()
        self._init_default_stations()
        if load_samples:
            self._init_sample_events()


# Instancia singleton del almacenamiento / Singleton instance
store = InMemoryStore()
