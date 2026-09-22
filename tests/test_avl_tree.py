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
    # Menor magnitud numérica M=5.0 va antes que M=6.0
    k1 = CompositeKeyK(1, 5.0, 100)
    k2 = CompositeKeyK(2, 6.0, 101)
    assert k1 < k2

    # Un evento amarillo/verde de menor magnitud va a la izquierda de un sismo rojo
    # An event of lower magnitude (even if yellow P=2 or green P=3) goes to the left of higher magnitude (red P=1)
    k_amarillo = CompositeKeyK(2, 4.0, 200)
    k_rojo = CompositeKeyK(1, 6.5, 201)
    assert k_amarillo < k_rojo  # 4.0 M < 6.5 M -> Se ubica a la izquierda

    # Misma prioridad P=1, menor magnitud M=5.0 va antes (a la izquierda) que M=7.0
    k3 = CompositeKeyK(1, 5.0, 102)
    k4 = CompositeKeyK(1, 7.0, 103)
    assert k3 < k4

    # Misma magnitud M=5.0, menor ID 100 desempata y va antes que 105
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
