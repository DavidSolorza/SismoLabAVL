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
    # 1. La Prioridad (P) manda sobre todo lo demás:
    # Si Sismo Rojo tiene P=1 (Alta/Crítico) y Sismo Amarillo tiene P=2 (Media),
    # P=1 < P=2, por lo que el Sismo Rojo es MENOR y se va a la izquierda en el AVL.
    k_rojo = CompositeKeyK(1, 6.5, 201)
    k_amarillo = CompositeKeyK(2, 4.0, 200)
    assert k_rojo < k_amarillo  # P=1 < P=2 -> Rojo se ubica a la izquierda del amarillo
    assert not (k_amarillo < k_rojo)

    # 2. Ejemplo práctico exacto del enunciado:
    # Raíz cuya clave es (3, 5.2, 10) (Prioridad 3, Magnitud 5.2, ID 10)
    k_raiz = CompositeKeyK(3, 5.2, 10)
    
    # Caso A: Entra sismo (2, 6.0, 5). Aunque M=6.0 es mayor y ID=5 es menor,
    # su prioridad es 2, y como 2 < 3, se va estrictamente a la izquierda.
    k_caso_a = CompositeKeyK(2, 6.0, 5)
    assert k_caso_a < k_raiz

    # Caso B: Entra sismo (3, 5.2, 5). La prioridad (3) empata, la magnitud (5.2) empata,
    # pero el ID (5) es menor que 10 (5 < 10), por lo que se va a la izquierda.
    k_caso_b = CompositeKeyK(3, 5.2, 5)
    assert k_caso_b < k_raiz

    # 3. Empate de Prioridad (P=1), menor magnitud M=5.0 va antes (a la izquierda) que M=7.0
    k3 = CompositeKeyK(1, 5.0, 102)
    k4 = CompositeKeyK(1, 7.0, 103)
    assert k3 < k4

    # 4. Empate de Prioridad y Magnitud (P=1, M=5.0), menor ID 100 desempata y va antes que 105
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


def test_avl_hash_index_o1_search():
    """
    Verifica que la búsqueda por ID se resuelva en tiempo O(1) usando el índice auxiliar,
    desacoplado del orden por prioridad del Árbol AVL.
    """
    avl = ArbolAVL()
    ev1 = make_event(501, 6.2, 12.0)
    ev2 = make_event(502, 4.5, 30.0)
    ev3 = make_event(503, 3.1, 70.0)

    for ev in (ev1, ev2, ev3):
        avl.insertar(ev)

    # 1. Búsqueda instantánea O(1) mediante el índice auxiliar
    assert 501 in avl.indice_por_id
    assert 502 in avl.indice_por_id
    assert 503 in avl.indice_por_id

    nodo_501 = avl.buscar_por_id(501)
    assert nodo_501 is not None
    assert nodo_501.getValor().id == 501
    assert nodo_501.getValor().magnitude == 6.2

    # 2. Eliminar evento y verificar que se desindexa inmediatamente
    eliminado = avl.eliminar_por_id(502)
    assert eliminado is True
    assert 502 not in avl.indice_por_id
    assert avl.buscar_por_id(502) is None
    assert avl.contar_nodos() == 2

    # 3. Vaciar árbol y comprobar que el índice se limpia
    avl.vaciar()
    assert avl.contar_nodos() == 0
    assert len(avl.indice_por_id) == 0
    assert avl.buscar_por_id(501) is None
