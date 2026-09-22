# -*- coding: utf-8 -*-
"""
Tests for Simulation Clock and Timestamp Invariants
SismoLab AVL - Universidad de Caldas
"""

import sys
import os
sys.path.insert(0, os.path.abspath("."))

from datetime import datetime, timezone
from src.infrastructure.persistence.in_memory_store import store
from src.domain.entities.seismic_event import SeismicEvent
from src.domain.value_objects.coordinates import GeographicCoordinates
from src.features.gestion_reloj.command import FijarRelojCommand, FijarRelojHandler, AvanzarRelojCommand, AvanzarRelojHandler
from src.features.gestion_reloj.dto import FijarRelojDTO, AvanzarRelojDTO
from src.features.crear_evento.command import CrearEventoCommand, CrearEventoHandler
from src.features.crear_evento.dto import CrearEventoDTO
from src.core.errors.exceptions import SismoLabException

def setup_store_clock():
    store.clear_all(load_samples=False)

def test_initial_clock_utc():
    setup_store_clock()
    clock = store.get_simulation_clock()
    assert clock.tzinfo is not None
    assert clock.year == 2026
    assert clock.month == 9
    assert clock.day == 22
    assert clock.hour == 12
    assert store.get_simulation_clock_iso() == "2026-09-22T12:00:00Z"

def test_advance_clock():
    setup_store_clock()
    handler = AvanzarRelojHandler()
    res = handler.handle(AvanzarRelojCommand(AvanzarRelojDTO(horas=2, minutos=30)))
    assert res["success"] is True
    assert res["reloj"] == "2026-09-22T14:30:00Z"
    assert store.get_simulation_clock_iso() == "2026-09-22T14:30:00Z"

def test_set_manual_clock():
    setup_store_clock()
    handler = FijarRelojHandler()
    res = handler.handle(FijarRelojCommand(FijarRelojDTO(reloj="2026-09-25T18:00:00Z")))
    assert res["success"] is True
    assert res["reloj"] == "2026-09-25T18:00:00Z"
    assert store.get_simulation_clock_iso() == "2026-09-25T18:00:00Z"

def test_event_cannot_be_in_future():
    setup_store_clock()
    # Simulation clock is 2026-09-22T12:00:00Z
    # Try inserting an event at 2026-09-22T13:00:00Z (1 hour in future)
    handler = CrearEventoHandler()
    future_dto = CrearEventoDTO(
        id=9991,
        magnitud=5.0,
        profundidad=20.0,
        latitud=5.0,
        longitud=-75.0,
        timestamp="2026-09-22T13:00:00Z"
    )
    failed = False
    try:
        handler.handle(CrearEventoCommand(future_dto))
    except SismoLabException as e:
        failed = True
        assert e.code == "EVENTO_FUTURO_NO_PERMITIDO"
    assert failed, "Debió haber fallado por registrar un evento posterior al reloj de simulación"

def test_event_valid_at_or_before_clock():
    setup_store_clock()
    # Event in past (10:00:00Z)
    handler = CrearEventoHandler()
    valid_dto = CrearEventoDTO(
        id=9992,
        magnitud=4.5,
        profundidad=15.0,
        latitud=5.0,
        longitud=-75.0,
        timestamp="2026-09-22T10:00:00Z"
    )
    res = handler.handle(CrearEventoCommand(valid_dto))
    assert res["success"] is True
    assert res["data"]["antiguedad_segundos"] == 7200  # 2 hours diff
    assert "2h" in res["data"]["antiguedad_humana"]

def run_simulation_clock_tests():
    test_initial_clock_utc()
    test_advance_clock()
    test_set_manual_clock()
    test_event_cannot_be_in_future()
    test_event_valid_at_or_before_clock()
    print("   -> ALL SIMULATION CLOCK TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_simulation_clock_tests()
