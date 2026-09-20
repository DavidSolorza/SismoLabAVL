# -*- coding: utf-8 -*-
"""
AVL Tree Invariants & Rotation Tests / Pruebas de Invariantes del Árbol AVL
SismoLab AVL - Universidad de Caldas
"""

from src.domain.structures.avl import ArbolAVL
from src.domain.entities.seismic_event import SeismicEvent
from src.domain.value_objects.coordinates import GeographicCoordinates
from src.domain.value_objects.composite_key import CompositeKeyK
from src.core.config.settings import OperationalMode

def make_event(ev_id: int, mag: float, depth: float, priority: int = None) -> SeismicEvent:
    coords = GeographicCoordinates(5.0, -75.5)
    ev = SeismicEvent(
        event_id=ev_id,
        magnitude=mag,
        depth=depth,
        coordinates=coords,
        station_id="EST-TEST",
        is_populated_zone=True
    )
    if priority:
        ev.priority = priority
        ev.composite_key = CompositeKeyK(priority, ev.magnitude, ev.id)
    return ev


def test_composite_key_ordering():
    # Key 1: P=1 (High priority) vs Key 2: P=2 (Medium priority)
    k1 = CompositeKeyK(1, 5.0, 100)
    k2 = CompositeKeyK(2, 6.0, 101)
    assert k1 < k2  # P=1 comes before P=2

    # Same P=1, higher magnitude M=7.0 comes before M=5.0
    k3 = CompositeKeyK(1, 7.0, 102)
    k4 = CompositeKeyK(1, 5.0, 103)
    assert k3 < k4

    # Same P=1, same M=5.0, smaller ID 100 comes before 105
    k5 = CompositeKeyK(1, 5.0, 100)
    k6 = CompositeKeyK(1, 5.0, 105)
    assert k5 < k6


def test_avl_insertion_and_invariants():
    avl = ArbolAVL()
    events = [
        make_event(101, 4.5, 10.0),
        make_event(102, 6.5, 5.0),
        make_event(103, 3.2, 50.0),
        make_event(104, 7.1, 12.0),
        make_event(105, 5.5, 20.0),
    ]

    for ev in events:
        avl.insertar(ev)

    assert avl.contar_nodos() == 5
    is_valid, msg = avl.es_avl_valido()
    assert is_valid, f"AVL desbalanceado: {msg}"

    # Inorder traversal must return events in strictly increasing order of Key K
    inorden = avl.recorrido_inorden()
    for i in range(len(inorden) - 1):
        assert inorden[i].composite_key < inorden[i+1].composite_key or inorden[i].composite_key == inorden[i+1].composite_key


def test_avl_rotations_stress_mode():
    avl = ArbolAVL(modo=OperationalMode.STRESS)
    events = [make_event(i, 5.0 + (i % 3), 10.0) for i in range(1, 10)]

    for ev in events:
        avl.insertar(ev)

    assert avl.contar_nodos() == 9
    assert avl.modo == OperationalMode.STRESS

    # Switch back to Normal mode should trigger balancear_todo()
    avl.set_modo(OperationalMode.NORMAL)
    assert avl.modo == OperationalMode.NORMAL
    is_valid, msg = avl.es_avl_valido()
    assert is_valid, f"Falló balanceo diferido: {msg}"
