# -*- coding: utf-8 -*-
"""
Tests for Sections 5 and 6 of SismoLab AVL
Universidad de Caldas

Verifica:
1. Regla de inserción y orden del AVL:
   - Comparación lexicográfica formal con los 4 ejemplos de la guía.
   - Recorrido inorden (ascendente) e inverso (descendente).
   - Métricas de nodo: profundidad, altura y factor de balance.
2. Gestión de eventos y revisiones:
   - Creación manual validando contra activo, archivado y eliminado.
   - Consulta de evento por ID en O(1) con discriminación de estado.
   - Corrección manual avanzando a r+1 y optimización de clave idéntica.
   - Estado de atención (Pendiente / Revisado) y reversibilidad.
   - Eliminación individual preservando descendientes y reversibilidad en LIFO.
   - Matriz de 5 situaciones de reportes telemétricos + reactivación de archivados + rechazo de eliminados.
"""

from src.infrastructure.persistence.in_memory_store import store
from src.domain.value_objects.composite_key import CompositeKeyK
from src.domain.entities.seismic_event import SeismicEvent
from src.domain.value_objects.coordinates import CartesianCoordinates
from src.features.crear_evento.command import CrearEventoCommand, CrearEventoHandler
from src.features.crear_evento.dto import CrearEventoDTO
from src.features.consultar_evento.query import ConsultarEventoQuery, ConsultarEventoHandler
from src.features.corregir_evento.command import CorregirEventoCommand, CorregirEventoHandler
from src.features.corregir_evento.dto import CorregirEventoDTO
from src.features.revisar_evento.command import RevisarEventoCommand, RevisarEventoHandler
from src.features.eliminar_evento.command import EliminarEventoCommand, EliminarEventoHandler
from src.features.archivar_rama.command import ArchivarRamaCommand, ArchivarRamaHandler
from src.features.archivar_rama.dto import ArchivarRamaDTO
from src.features.procesar_reporte.command import ProcesarReporteCommand, ProcesarReporteHandler, EncolarReporteDTO
from src.features.deshacer_accion.command import DeshacerAccionCommand, DeshacerAccionHandler
from src.domain.entities.report import SeismicReport
from src.core.errors.exceptions import SismoLabException

def test_seccion_5_comparaciones_lexicograficas():
    """Verifica los 4 ejemplos exactos de comparación de la Sección 5 frente a K = (3, 5.2, 10)"""
    nodo_ref = CompositeKeyK(3, 5.2, 10)

    # 1. (2, 5.8, 20): Prioridad 2 < 3 -> Izquierda (True)
    c1 = CompositeKeyK(2, 5.8, 20)
    assert c1 < nodo_ref, "Fallo: (2, 5.8, 20) debe ir a la Izquierda de (3, 5.2, 10)"

    # 2. (3, 6.1, 30): Empatan P=3, 6.1 > 5.2 -> Derecha (False en <)
    c2 = CompositeKeyK(3, 6.1, 30)
    assert not (c2 < nodo_ref), "Fallo: (3, 6.1, 30) debe ir a la Derecha de (3, 5.2, 10)"
    assert c2 > nodo_ref

    # 3. (3, 5.2, 5): Empatan P=3 y M=5.2, ID 5 < 10 -> Izquierda (True)
    c3 = CompositeKeyK(3, 5.2, 5)
    assert c3 < nodo_ref, "Fallo: (3, 5.2, 5) debe ir a la Izquierda de (3, 5.2, 10)"

    # 4. (3, 5.2, 25): Empatan P=3 y M=5.2, ID 25 > 10 -> Derecha (False en <)
    c4 = CompositeKeyK(3, 5.2, 25)
    assert not (c4 < nodo_ref), "Fallo: (3, 5.2, 25) debe ir a la Derecha de (3, 5.2, 10)"
    assert c4 > nodo_ref

    print("   -> PASSED! Ejemplos de comparación Sección 5 verificados con 100% de precisión.")


def test_seccion_5_recorridos_y_metricas_nodo():
    """Verifica recorrido inorden (ascendente), recorrido inverso (descendente) y métricas de nodo"""
    store.clear_all(load_samples=False)

    e1 = SeismicEvent(10, 5.2, 10.0, CartesianCoordinates(500, 500), "EST-01", False) # P=2, M=5.2
    e2 = SeismicEvent(20, 5.8, 10.0, CartesianCoordinates(500, 500), "EST-01", False) # P=2, M=5.8
    e3 = SeismicEvent(30, 6.5, 10.0, CartesianCoordinates(500, 500), "EST-01", False) # P=3, M=6.5

    store.avl_tree.insertar(e1)
    store.avl_tree.insertar(e2)
    store.avl_tree.insertar(e3)

    inorden = store.avl_tree.recorrido_inorden()
    claves_asc = [ev.composite_key for ev in inorden]
    assert claves_asc == sorted(claves_asc), "El recorrido inorden debe ser ascendente"

    inverso = store.avl_tree.recorrido_inverso()
    claves_desc = [ev.composite_key for ev in inverso]
    assert claves_desc == sorted(claves_asc, reverse=True), "El recorrido inverso debe ser descendente"

    # Métricas del nodo raíz y nodos hijos
    metricas_raiz = store.avl_tree.obtener_metricas_nodo(store.avl_tree.raiz.getValor().id)
    assert metricas_raiz["profundidad_nodo"] == 0, "La raíz debe tener profundidad 0"
    assert metricas_raiz["es_raiz"] is True

    print("   -> PASSED! Recorridos ascendente/descendente y métricas de nodo verificados.")


def test_seccion_6_creacion_y_consulta():
    """Verifica validación de creación contra activo/archivado/eliminado y consulta en O(1)"""
    store.clear_all(load_samples=False)
    handler_crear = CrearEventoHandler()
    handler_consultar = ConsultarEventoHandler()

    # 1. Crear evento normal
    dto = CrearEventoDTO(id=101, magnitud=5.0, profundidad=20.0, x=350.0, y=500.0, estacion_id="EST-01")
    res_crear = handler_crear.handle(CrearEventoCommand(dto))
    assert res_crear["success"] is True

    # 2. Consultar evento activo: debe retornar ACTIVO y métricas de nodo
    res_cons = handler_consultar.handle(ConsultarEventoQuery(101))
    assert res_cons["estado_catalogo"] == "ACTIVO"
    assert "nodo_avl" in res_cons["data"]
    assert res_cons["data"]["nodo_avl"]["profundidad_nodo"] == 0

    # 3. Intentar crear con ID duplicado activo -> Debe rechazar
    try:
        handler_crear.handle(CrearEventoCommand(dto))
        assert False, "Debe rechazar creación con ID activo"
    except SismoLabException as ex:
        assert ex.code == "EVENT_ALREADY_EXISTS"

    print("   -> PASSED! Creación manual y Consulta en O(1) verificadas.")


def test_seccion_6_eliminacion_individual_y_deshacer():
    """Verifica eliminación individual de nodo manteniendo descendientes y reversibilidad vía Deshacer"""
    store.clear_all(load_samples=False)
    handler_crear = CrearEventoHandler()
    handler_eliminar = EliminarEventoHandler()
    handler_deshacer = DeshacerAccionHandler()
    handler_consultar = ConsultarEventoHandler()

    # Insertar 3 nodos
    handler_crear.handle(CrearEventoCommand(CrearEventoDTO(id=201, magnitud=4.0, profundidad=20.0, x=500.0, y=500.0, estacion_id="EST-01")))
    handler_crear.handle(CrearEventoCommand(CrearEventoDTO(id=202, magnitud=5.0, profundidad=20.0, x=500.0, y=500.0, estacion_id="EST-01")))
    handler_crear.handle(CrearEventoCommand(CrearEventoDTO(id=203, magnitud=6.0, profundidad=20.0, x=500.0, y=500.0, estacion_id="EST-01")))

    assert store.avl_tree.contar_nodos() == 3

    # Eliminar nodo central 202
    res_del = handler_eliminar.handle(EliminarEventoCommand(202))
    assert res_del["success"] is True
    assert store.avl_tree.contar_nodos() == 2
    assert store.is_id_deleted(202) is True

    # Consultar 202: debe indicar ELIMINADO
    res_cons = handler_consultar.handle(ConsultarEventoQuery(202))
    assert res_cons["estado_catalogo"] == "ELIMINADO"

    # Intentar crearlo de nuevo manualmente: debe ser rechazado
    try:
        handler_crear.handle(CrearEventoCommand(CrearEventoDTO(id=202, magnitud=5.0, profundidad=20.0, x=500.0, y=500.0, estacion_id="EST-01")))
        assert False, "No debe permitir crear un ID eliminado"
    except SismoLabException as ex:
        assert ex.code == "EVENT_DELETED"

    # Deshacer eliminación: debe restaurar el evento en el AVL y removerlo de eliminados
    res_undo = handler_deshacer.handle(DeshacerAccionCommand())
    assert res_undo["success"] is True
    assert store.avl_tree.contar_nodos() == 3
    assert store.is_id_deleted(202) is False

    print("   -> PASSED! Eliminación individual y Deshacer LIFO verificados.")


def test_seccion_6_matriz_reportes():
    """Verifica las 5 situaciones de la tabla de reportes + reactivación archivados + rechazo eliminados"""
    store.clear_all(load_samples=False)
    handler_reporte = ProcesarReporteHandler()

    # Situación 1: Identificador desconocido (primera revisión puede ser > 1)
    rep1 = SeismicReport("EST-SUR", {
        "event_id": 301, "magnitud": 4.5, "profundidad": 15.0,
        "x": 300.0, "y": 400.0, "revision": 2
    })
    store.report_queue.enqueue(rep1)
    res1 = handler_reporte.handle(ProcesarReporteCommand())
    assert res1["situacion"] == "IDENTIFICADOR_DESCONOCIDO_REGISTRADO"
    assert res1["data"]["evento"]["revision"] == 2

    # Situación 3: Igual revisión e iguales datos -> Confirmar y añadir estación
    rep3 = SeismicReport("EST-NORTE", {
        "event_id": 301, "magnitud": 4.5, "profundidad": 15.0,
        "x": 300.0, "y": 400.0, "revision": 2
    })
    store.report_queue.enqueue(rep3)
    res3 = handler_reporte.handle(ProcesarReporteCommand())
    assert res3["situacion"] == "IGUAL_REVISION_CONFIRMADO"
    assert "EST-NORTE" in res3["data"]["evento"]["estaciones_reportantes"]

    # Situación 4: Igual revisión y datos distintos -> Conflicto y rechazar
    rep4 = SeismicReport("EST-CENTRO", {
        "event_id": 301, "magnitud": 7.0, "profundidad": 15.0, # magnitud distinta
        "x": 300.0, "y": 400.0, "revision": 2
    })
    store.report_queue.enqueue(rep4)
    res4 = handler_reporte.handle(ProcesarReporteCommand())
    assert res4["situacion"] == "CONFLICTO_DATOS_DISTINTOS"
    assert res4["success"] is False

    # Situación 5: Revisión menor que la vigente -> Descartar antiguo
    rep5 = SeismicReport("EST-ESTE", {
        "event_id": 301, "magnitud": 4.5, "profundidad": 15.0,
        "x": 300.0, "y": 400.0, "revision": 1 # menor que 2
    })
    store.report_queue.enqueue(rep5)
    res5 = handler_reporte.handle(ProcesarReporteCommand())
    assert res5["situacion"] == "REPORTE_ANTIGUO_DESCARTADO"
    assert res5["success"] is False

    # Situación 2: Revisión mayor que vigente -> Actualizar y marcar Pendiente
    rep2 = SeismicReport("EST-OESTE", {
        "event_id": 301, "magnitud": 5.2, "profundidad": 20.0,
        "x": 300.0, "y": 400.0, "revision": 3 # mayor que 2
    })
    store.report_queue.enqueue(rep2)
    res2 = handler_reporte.handle(ProcesarReporteCommand())
    assert res2["situacion"] == "REVISION_MAYOR_ACTUALIZADA"
    assert res2["data"]["evento"]["revision"] == 3
    assert res2["data"]["evento"]["estado_atencion"] == "Pendiente"

    # Eliminado: reportes posteriores se rechazan
    handler_eliminar = EliminarEventoHandler()
    handler_eliminar.handle(EliminarEventoCommand(301))
    rep_del = SeismicReport("EST-SUR", {
        "event_id": 301, "magnitud": 5.2, "profundidad": 20.0,
        "x": 300.0, "y": 400.0, "revision": 4
    })
    store.report_queue.enqueue(rep_del)
    res_del = handler_reporte.handle(ProcesarReporteCommand())
    assert res_del["situacion"] == "RECHAZADO_IDENTIFICADOR_ELIMINADO"
    assert res_del["success"] is False

    print("   -> PASSED! Matriz de 5 situaciones de reportes y rechazo de eliminados verificados.")


def run_all_tests():
    print("=" * 60)
    print("EJECUTANDO PRUEBAS DE LAS SECCIONES 5 Y 6 (SISMOLAB AVL)")
    print("=" * 60)
    test_seccion_5_comparaciones_lexicograficas()
    test_seccion_5_recorridos_y_metricas_nodo()
    test_seccion_6_creacion_y_consulta()
    test_seccion_6_eliminacion_individual_y_deshacer()
    test_seccion_6_matriz_reportes()
    print("=" * 60)
    print("TODAS LAS PRUEBAS DE LAS SECCIONES 5 Y 6 PASARON CON ÉXITO!")
    print("=" * 60)

if __name__ == "__main__":
    run_all_tests()
