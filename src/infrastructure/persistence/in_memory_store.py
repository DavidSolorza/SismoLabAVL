# -*- coding: utf-8 -*-
"""
In-Memory Store Container / Contenedor de Almacenamiento en Memoria
SismoLab AVL - Universidad de Caldas

Mantiene el estado global thread-safe de la aplicación:
- Escenario: Reloj explícito, Zonas rectangulares (1000x1000 km), Estaciones sísmicas.
- Estructuras puras: Árbol AVL, BST, Pila LIFO de Deshacer, Cola FIFO de Reportes.
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Set, Any
from src.domain.structures.avl import ArbolAVL
from src.domain.structures.bst import ArbolBST
from src.domain.structures.stack import Stack
from src.domain.structures.queue import Queue
from src.domain.entities.station import SeismicStation
from src.domain.entities.report import SeismicReport
from src.domain.entities.zone import ScenarioZone
from src.domain.value_objects.coordinates import CartesianCoordinates
from src.domain.rules import is_point_in_populated_zone

class InMemoryStore:
    """
    Contenedor Global del Estado en Memoria / Global In-Memory State Container
    """
    def __init__(self):
        # Reloj de Simulación Explícito (UTC, precisión en segundos)
        self.simulation_clock: datetime = datetime(2026, 9, 22, 12, 0, 0, tzinfo=timezone.utc)
        self.avl_tree = ArbolAVL()
        self.bst_tree = ArbolBST()
        self.undo_stack: Stack[Dict] = Stack()
        self.report_queue: Queue[SeismicReport] = Queue()
        self.stations: Dict[str, SeismicStation] = {}
        self.zones: List[ScenarioZone] = []

        # Colecciones para el ciclo de vida de eventos (Sección 6)
        # Eventos archivados mediante poda de subárboles (conservan identidad en histórico)
        self.archived_events: Dict[int, Any] = {}
        # Identificadores eliminados individualmente (no reutilizables por reportes posteriores)
        self.deleted_ids: Set[int] = set()
        # Resguardo de datos de eventos eliminados para recuperación vía Deshacer
        self.deleted_events: Dict[int, Dict[str, Any]] = {}

        # Parámetros del escenario configurables (Secciones 7, 9 y 10)
        from src.core.config.settings import settings
        self.param_w_hours: float = settings.DEFAULT_W_HOURS
        self.param_r_km: float = settings.DEFAULT_R_KM
        self.param_budget_l: int = settings.DEFAULT_ACCESS_BUDGET_L
        self.param_archive_t_hours: float = settings.DEFAULT_ARCHIVE_THRESHOLD_T

        self._init_default_zones()
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

    def is_point_populated(self, x: float, y: float) -> bool:
        """Evalúa si las coordenadas (x, y) pertenecen a una zona poblada del escenario"""
        return is_point_in_populated_zone(x, y, self.zones)

    def _init_default_zones(self) -> None:
        """
        Inicializa las zonas rectangulares del escenario delimitadas según las coordenadas reales de co.json.
        """
        self.zones = [
            ScenarioZone("ZONA-MANIZALES", "Área Urbana Manizales (Caldas)", 275.0, 375.0, 530.0, 590.0, is_populated=True),
            ScenarioZone("ZONA-PEREIRA", "Área Metropolitana Pereira (Risaralda)", 255.0, 320.0, 520.0, 580.0, is_populated=True),
            ScenarioZone("ZONA-ARMENIA", "Área Urbana Armenia (Quindío)", 275.0, 320.0, 490.0, 530.0, is_populated=True),
            ScenarioZone("ZONA-BOGOTA", "Sabana Metropolitana Bogotá D.C.", 380.0, 440.0, 465.0, 540.0, is_populated=True),
            ScenarioZone("ZONA-MEDELLIN", "Valle de Aburrá Medellín (Antioquia)", 260.0, 350.0, 580.0, 650.0, is_populated=True),
            ScenarioZone("ZONA-CALI", "Área Metropolitana Cali (Valle)", 190.0, 260.0, 420.0, 485.0, is_populated=True),
            ScenarioZone("ZONA-SANTANDER", "Nido Sísmico Bucaramanga (Santander)", 450.0, 535.0, 620.0, 710.0, is_populated=True),
            ScenarioZone("ZONA-CORDILLERA", "Cordillera Central / Rural", 450.0, 750.0, 400.0, 750.0, is_populated=False),
        ]

    def _init_default_stations(self) -> None:
        """Inicializa la red nacional de estaciones sísmicas situadas con precisión dentro de sus respectivos departamentos según co.json"""
        default_stations = [
            SeismicStation("EST-MANIZALES-01", "Estación Central Manizales (Caldas)", CartesianCoordinates(306.4, 546.8)),
            SeismicStation("EST-PEREIRA-01", "Estación Matecaña Pereira (Risaralda)", CartesianCoordinates(292.6, 532.2)),
            SeismicStation("EST-ARMENIA-01", "Estación Quindío Armenia (Quindío)", CartesianCoordinates(293.8, 516.2)),
            SeismicStation("EST-BOGOTA-01", "Estación Nacional Sabana Bogotá (Cundinamarca)", CartesianCoordinates(417.5, 526.3)),
            SeismicStation("EST-MEDELLIN-01", "Estación Valle de Aburrá Medellín (Antioquia)", CartesianCoordinates(301.4, 614.0)),
            SeismicStation("EST-BUCARAMANGA-01", "Estación Nido Sísmico Los Santos (Santander)", CartesianCoordinates(490.8, 664.3)),
            SeismicStation("EST-CALI-01", "Estación Valle del Cauca Cali (Valle)", CartesianCoordinates(228.3, 454.4)),
            SeismicStation("EST-PACIFICO-01", "Estación Litoral Pacífico Tumaco (Nariño)", CartesianCoordinates(52.6, 360.0)),
            SeismicStation("EST-POPAYAN-01", "Estación Falla Micay Popayán (Cauca)", CartesianCoordinates(222.6, 396.7)),
            SeismicStation("EST-CUCUTA-01", "Estación Frontera Cordillera Oriental (Cúcuta)", CartesianCoordinates(537.9, 708.2)),
            SeismicStation("EST-SANTA-MARTA-01", "Estación Sierra Nevada Santa Marta (Magdalena)", CartesianCoordinates(407.8, 899.5)),
            SeismicStation("EST-IBAGUE-01", "Estación Volcánica Machín Ibagué (Tolima)", CartesianCoordinates(328.3, 510.8)),
            SeismicStation("EST-PASTO-01", "Estación Volcán Galeras Pasto (Nariño)", CartesianCoordinates(170.7, 326.5)),
        ]
        for s in default_stations:
            self.stations[s.code] = s

    def add_station(self, code: str, name: str, x: float, y: float) -> SeismicStation:
        """Registra o actualiza una estación telemétrica en el plano cartesiano [0, 1000] km"""
        clean_code = str(code).strip().upper()
        clean_name = str(name).strip()
        station = SeismicStation(clean_code, clean_name, CartesianCoordinates(float(x), float(y)))
        self.stations[clean_code] = station
        return station

    def get_stations_list(self) -> List[Dict[str, Any]]:
        """Retorna la lista ordenada de todas las estaciones registradas"""
        return [
            {
                "codigo": s.code,
                "nombre": s.name,
                "x": s.coordinates.x,
                "y": s.coordinates.y,
                "activo": s.active
            }
            for s in sorted(self.stations.values(), key=lambda st: st.code)
        ]

    def _init_sample_events(self) -> None:
        """Inicializa eventos sísmicos de muestra alineados con las reglas de prioridad y escenario"""
        from src.domain.entities.seismic_event import SeismicEvent

        # Sismo 1001: M=6.5 en (306.4, 546.8) -> Poblada (Manizales, Caldas) -> P=3 (Alta)
        e1 = SeismicEvent(
            1001, 6.5, 12.0, CartesianCoordinates(306.4, 546.8),
            "EST-MANIZALES-01", self.is_point_populated(306.4, 546.8),
            timestamp="2026-09-22T10:00:00Z", estado_atencion="Pendiente"
        )
        # Sismo 1002: M=4.8 en (292.6, 532.2) -> Poblada (Pereira, Risaralda), H=15.0 -> P=3 (Alta)
        e2 = SeismicEvent(
            1002, 4.8, 15.0, CartesianCoordinates(292.6, 532.2),
            "EST-PEREIRA-01", self.is_point_populated(292.6, 532.2),
            timestamp="2026-09-22T11:15:00Z", estado_atencion="Pendiente"
        )
        # Sismo 1003: M=4.6 en (600.0, 600.0) -> No Poblada (Cordillera) -> P=2 (Media, M>=4.5 no alta)
        e3 = SeismicEvent(
            1003, 4.6, 25.0, CartesianCoordinates(600.0, 600.0),
            "EST-MANIZALES-01", self.is_point_populated(600.0, 600.0),
            timestamp="2026-09-22T11:30:00Z", estado_atencion="Revisado"
        )
        # Sismo 1004: M=3.5 en (650.0, 650.0) -> No Poblada -> P=1 (Baja)
        e4 = SeismicEvent(
            1004, 3.5, 50.0, CartesianCoordinates(650.0, 650.0),
            "EST-ARMENIA-01", self.is_point_populated(650.0, 650.0),
            timestamp="2026-09-22T11:50:00Z", estado_atencion="Pendiente"
        )

        for e in (e1, e2, e3, e4):
            try:
                self.avl_tree.insertar(e)
                self.bst_tree.insertar(e)
            except Exception:
                pass

    def is_id_active(self, event_id: int) -> bool:
        """Determina si un ID de evento está activo en el Árbol AVL"""
        return self.avl_tree.buscar_por_id(event_id) is not None

    def is_id_archived(self, event_id: int) -> bool:
        """Determina si un ID de evento está archivado en el histórico"""
        return event_id in self.archived_events

    def is_id_deleted(self, event_id: int) -> bool:
        """Determina si un ID de evento fue eliminado individualmente"""
        return event_id in self.deleted_ids

    def get_all_active_and_archived_events(self) -> List[Any]:
        """
        Retorna la lista unificada de todos los eventos activos y archivados (Sección 7).
        Excluye estrictamente eventos eliminados.
        """
        active_events = self.avl_tree.recorrido_inorden()
        archived_list = list(self.archived_events.values())
        return active_events + archived_list

    def get_scenario_parameters(self) -> Dict[str, Any]:
        """Retorna los parámetros configurables del escenario sísmico"""
        return {
            "w_horas": self.param_w_hours,
            "r_km": self.param_r_km,
            "limite_l": self.param_budget_l,
            "t_horas": self.param_archive_t_hours,
        }

    def set_scenario_parameters(
        self,
        w_horas: Optional[float] = None,
        r_km: Optional[float] = None,
        limite_l: Optional[int] = None,
        t_horas: Optional[float] = None
    ) -> Dict[str, Any]:
        """Actualiza los parámetros configurables del escenario validando restricciones"""
        if w_horas is not None:
            if w_horas <= 0:
                raise ValueError("El parámetro W (horas) debe ser estrictamente positivo.")
            self.param_w_hours = float(w_horas)
        if r_km is not None:
            if r_km <= 0:
                raise ValueError("El parámetro R (km) debe ser estrictamente positivo.")
            self.param_r_km = float(r_km)
        if limite_l is not None:
            if limite_l < 0:
                raise ValueError("El límite de acceso L debe ser un entero no negativo.")
            self.param_budget_l = int(limite_l)
        if t_horas is not None:
            if t_horas <= 0:
                raise ValueError("El parámetro T (antigüedad de archivo) debe ser estrictamente positivo.")
            self.param_archive_t_hours = float(t_horas)

        return self.get_scenario_parameters()

    def clear_all(self, load_samples: bool = True) -> None:
        """Reinicia el estado en memoria y restablece el escenario"""
        from src.core.config.settings import settings
        self.simulation_clock = datetime(2026, 9, 22, 12, 0, 0, tzinfo=timezone.utc)
        self.param_w_hours = settings.DEFAULT_W_HOURS
        self.param_r_km = settings.DEFAULT_R_KM
        self.param_budget_l = settings.DEFAULT_ACCESS_BUDGET_L
        self.param_archive_t_hours = settings.DEFAULT_ARCHIVE_THRESHOLD_T
        self.avl_tree = ArbolAVL()
        self.bst_tree = ArbolBST()
        self.undo_stack.clear()
        self.report_queue.clear()
        self.archived_events.clear()
        self.deleted_ids.clear()
        self.deleted_events.clear()
        self._init_default_zones()
        self._init_default_stations()
        if load_samples:
            self._init_sample_events()


# Instancia singleton del almacenamiento / Singleton instance
store = InMemoryStore()
