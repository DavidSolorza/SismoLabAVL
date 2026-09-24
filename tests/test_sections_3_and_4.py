# -*- coding: utf-8 -*-
"""
Tests for Sections 3 and 4 of Official Specification / Pruebas de Secciones 3 y 4
SismoLab AVL - Universidad de Caldas
"""

from src.domain.entities.zone import ScenarioZone
from src.domain.entities.seismic_event import SeismicEvent
from src.domain.value_objects.coordinates import CartesianCoordinates
from src.domain.rules import is_point_in_populated_zone, calculate_seismic_priority
from src.infrastructure.persistence.in_memory_store import store
from src.core.bus.command_bus import global_command_bus
from src.features.crear_evento.dto import CrearEventoDTO
from src.features.crear_evento.command import CrearEventoCommand, CrearEventoHandler
from src.features.corregir_evento.dto import CorregirEventoDTO
from src.features.corregir_evento.command import CorregirEventoCommand, CorregirEventoHandler
from src.features.revisar_evento.command import RevisarEventoCommand, RevisarEventoHandler

def test_seccion_3_zonas_y_borde_compartido():
    """
    Las zonas son rectángulos definidos por sus límites en un plano de 0 a 1000 km en ambos ejes.
    Un epicentro pertenece a una zona cuando está dentro de ella o sobre su borde.
    Cuando está en el borde de dos zonas, se clasifica como zona poblada si alguna de las dos
    está definida de esa forma.
    """
    # Zona 1: Poblada [100.0, 300.0] x [100.0, 300.0]
    z_poblada = ScenarioZone("Z1", "Poblada", 100.0, 300.0, 100.0, 300.0, is_populated=True)
    # Zona 2: No Poblada adyacente que comparte el borde x=300.0: [300.0, 500.0] x [100.0, 300.0]
    z_no_poblada = ScenarioZone("Z2", "No Poblada", 300.0, 500.0, 100.0, 300.0, is_populated=False)

    zonas = [z_poblada, z_no_poblada]

    # Punto 1: Totalmente dentro de la zona poblada
    assert is_point_in_populated_zone(200.0, 200.0, zonas) is True

    # Punto 2: Totalmente dentro de la zona no poblada
    assert is_point_in_populated_zone(400.0, 200.0, zonas) is False

    # Punto 3: En el borde exacto compartido x=300.0, y=200.0
    # Regla: "se clasifica como zona poblada si alguna de las dos está definida de esa forma"
    assert is_point_in_populated_zone(300.0, 200.0, zonas) is True

    # Punto 4: Fuera de ambas zonas
    assert is_point_in_populated_zone(600.0, 600.0, zonas) is False


def test_seccion_4_calculo_obligatorio_de_prioridad():
    """
    3 Alta: M >= 6.0; o bien M >= 4.5 y H <= 30.0 km y epicentro en zona poblada.
    2 Media: No cumple la condición de prioridad alta y M >= 4.5.
    1 Baja: No cumple ninguna de las condiciones anteriores.
    Límites inclusivos:
    M = 4.5 y H = 30.0 km en zona poblada produce prioridad 3.
    El mismo evento fuera de una zona poblada produce prioridad 2.
    """
    # Ejemplo exacto del enunciado: M=4.5, H=30.0 en zona poblada -> 3
    assert calculate_seismic_priority(magnitude=4.5, depth=30.0, is_populated_zone=True) == 3

    # Mismo evento fuera de zona poblada -> 2
    assert calculate_seismic_priority(magnitude=4.5, depth=30.0, is_populated_zone=False) == 2

    # M >= 6.0 siempre es Alta (3), independientemente de profundidad o zona
    assert calculate_seismic_priority(magnitude=6.0, depth=150.0, is_populated_zone=False) == 3
    assert calculate_seismic_priority(magnitude=7.5, depth=500.0, is_populated_zone=False) == 3

    # M >= 4.5 fuera de zona poblada pero H <= 30 -> 2 (Media)
    assert calculate_seismic_priority(magnitude=4.8, depth=20.0, is_populated_zone=False) == 2

    # M >= 4.5 en zona poblada pero H > 30 -> 2 (Media)
    assert calculate_seismic_priority(magnitude=5.2, depth=35.0, is_populated_zone=True) == 2

    # Menor a 4.5 -> 1 (Baja)
    assert calculate_seismic_priority(magnitude=4.4, depth=10.0, is_populated_zone=True) == 1
    assert calculate_seismic_priority(magnitude=2.5, depth=5.0, is_populated_zone=False) == 1
    assert calculate_seismic_priority(magnitude=-1.5, depth=12.0, is_populated_zone=False) == 1


def test_seccion_3_datos_evento_revision_procedencia_y_estado():
    """
    - Identificador: 1 a 999999.
    - Profundidad H: 0 a 700 km.
    - Coordenadas: 0 a 1000 km.
    - Revisión y procedencia: Se conserva la revisión vigente y el conjunto de estaciones.
    - Estado de atención: Pendiente al alta, corrección lo devuelve a Pendiente.
    """
    store.clear_all(load_samples=False)
    global_command_bus.register(CrearEventoCommand, CrearEventoHandler().handle)
    global_command_bus.register(CorregirEventoCommand, CorregirEventoHandler().handle)
    global_command_bus.register(RevisarEventoCommand, RevisarEventoHandler().handle)

    # 1. Crear evento desde estación EST-MANIZALES-01
    dto_crear = CrearEventoDTO(
        id=777,
        magnitud=4.5,
        profundidad=25.0,
        x=350.0,
        y=480.0,
        estacion_id="EST-MANIZALES-01"
    )
    res_crear = global_command_bus.dispatch(CrearEventoCommand(dto_crear))
    assert res_crear["success"] is True
    ev = res_crear["data"]
    assert ev["revision"] == 1
    assert ev["estado_atencion"] == "Pendiente"
    assert "EST-MANIZALES-01" in ev["estaciones_reportantes"]

    # 2. Notificación del mismo evento desde otra estación EST-PEREIRA-01 vía reporte (Sección 6)
    from src.domain.entities.report import SeismicReport
    from src.features.procesar_reporte.command import ProcesarReporteCommand
    rep_segunda = SeismicReport("EST-PEREIRA-01", {
        "event_id": 777,
        "magnitud": 4.5,
        "profundidad": 25.0,
        "x": 350.0,
        "y": 480.0,
        "revision": 1
    })
    store.report_queue.enqueue(rep_segunda)
    res_segunda = global_command_bus.dispatch(ProcesarReporteCommand())
    assert res_segunda["success"] is True
    ev_actualizado = res_segunda["data"]["evento"]
    # Ambas estaciones deben estar en el conjunto de procedencia
    assert "EST-MANIZALES-01" in ev_actualizado["estaciones_reportantes"]
    assert "EST-PEREIRA-01" in ev_actualizado["estaciones_reportantes"]

    # 3. Transicionar a 'Revisado'
    res_revisar = global_command_bus.dispatch(RevisarEventoCommand(777))
    assert res_revisar["success"] is True
    assert res_revisar["data"]["estado_atencion"] == "Revisado"

    # 4. Corrección de datos aceptada: debe volver a 'Pendiente' e incrementar 'revision'
    dto_corregir = CorregirEventoDTO(
        event_id=777,
        nueva_magnitud=6.1,
        nueva_profundidad=15.0,
        razon="Recalibración de onda S"
    )
    res_corregir = global_command_bus.dispatch(CorregirEventoCommand(dto_corregir))
    assert res_corregir["success"] is True
    ev_corregido = res_corregir["data"]["evento"]
    assert ev_corregido["revision"] == 2
    assert ev_corregido["estado_atencion"] == "Pendiente"
    assert ev_corregido["prioridad"] == 3  # M=6.1 -> Alta (3)
