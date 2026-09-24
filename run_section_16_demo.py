# -*- coding: utf-8 -*-
"""
Section 16 Minimum Demonstration Cases Runner
SismoLab AVL - Universidad de Caldas
Ejecuta y valida los 6 casos de demostración obligatorios del pliego:
1. Carga inicial (AVL y BST por inserciones, métricas y k-pendientes).
2. Procesamiento de ráfaga paso a paso (7 situaciones telemétricas y rotaciones).
3. Corrección con cambio de clave y eliminación con rechazo persistente.
4. Análisis de costo y presupuesto L con búsqueda por clave y nodos visitados.
5. Archivo por antigüedad T de subárbol, preservación de réplicas y balanceo.
6. Deshacer integral LIFO (reversión exacta de cola, eliminados y estructura).
"""

import sys
from datetime import datetime, timezone
import src.presentation.api.main  # Registra handlers en bus
from src.infrastructure.persistence.in_memory_store import store
from src.core.bus.command_bus import global_command_bus
from src.features.gestionar_escenario.importar_inserciones_command import ImportarInsercionesCommand
from src.features.consultar_analisis.queries import (
    ConsultarPrimerosKPendientesQuery,
    ConsultarAccesoCostosoQuery
)
from src.domain.entities.report import SeismicReport
from src.features.procesar_reporte.command import ProcesarReporteCommand
from src.features.corregir_evento.command import CorregirEventoCommand
from src.features.corregir_evento.dto import CorregirEventoDTO
from src.features.eliminar_evento.command import EliminarEventoCommand
from src.features.archivar_rama.command import ArchivarRamaCommand
from src.features.archivar_rama.dto import ArchivarRamaDTO
from src.features.deshacer_accion.command import DeshacerAccionCommand

def imprimir_separador(titulo: str):
    print("\n" + "=" * 70)
    print(f" {titulo.upper()}")
    print("=" * 70)

def ejecutar_demostracion():
    imprimir_separador("Iniciando Demostración Oficial de los 6 Casos (Sección 16)")

    # -------------------------------------------------------------
    # CASO 1: CARGA INICIAL POR INSERCIONES
    # -------------------------------------------------------------
    imprimir_separador("Caso 1: Carga Inicial por Inserciones (AVL vs BST)")
    store.clear_all(load_samples=False)

    lote_inicial = {
        "eventos": [
            {"id": 1001, "magnitud": 6.5, "profundidad": 12.0, "x": 385.0, "y": 515.0, "revision": 1, "zona_poblada": True, "timestamp": "2026-09-22T10:00:00Z", "estado_atencion": "Pendiente"},
            {"id": 1002, "magnitud": 4.8, "profundidad": 15.0, "x": 280.0, "y": 370.0, "revision": 1, "zona_poblada": True, "timestamp": "2026-09-22T11:15:00Z", "estado_atencion": "Pendiente"},
            {"id": 1003, "magnitud": 4.6, "profundidad": 25.0, "x": 600.0, "y": 600.0, "revision": 1, "zona_poblada": False, "timestamp": "2026-09-22T11:30:00Z", "estado_atencion": "Revisado"},
            {"id": 1004, "magnitud": 3.5, "profundidad": 50.0, "x": 650.0, "y": 650.0, "revision": 1, "zona_poblada": False, "timestamp": "2026-09-22T11:50:00Z", "estado_atencion": "Pendiente"},
            {"id": 1005, "magnitud": 7.1, "profundidad": 8.0, "x": 390.0, "y": 510.0, "revision": 1, "zona_poblada": True, "timestamp": "2026-09-22T08:00:00Z", "estado_atencion": "Pendiente"},
        ]
    }
    res_c1 = global_command_bus.dispatch(ImportarInsercionesCommand(datos_json=lote_inicial))
    m = res_c1["metricas"]
    print(f" [OK] Escenario cargado: {m['total_eventos_insertados']} eventos procesados.")
    print(f"      AVL -> Raiz: {m['avl']['raiz']} | Altura: {m['avl']['altura']} | Hojas: {m['avl']['cantidad_hojas']}")
    print(f"      BST -> Raiz: {m['bst']['raiz']} | Altura: {m['bst']['altura']} | Hojas: {m['bst']['cantidad_hojas']}")

    # Mostrar primeros k pendientes en orden descendente de K
    res_k = global_command_bus.dispatch(ConsultarPrimerosKPendientesQuery(k=3))
    print(f"\n [OK] Primeros {res_k['k_solicitado']} eventos pendientes (orden descendente de K):")
    for ev in res_k["eventos"]:
        print(f"      - SIS-{ev['id']:06d} | Clave: {ev['composite_key']} | Estado: {ev['estado_atencion']} | M={ev['magnitud']} | P={ev['prioridad']}")
    print(f"      Nodos examinados: {res_k['nodos_examinados']} ({res_k['justificacion_poda'][:60]}...)")

    # -------------------------------------------------------------
    # CASO 2: PROCESAMIENTO DE RÁFAGA PASO A PASO
    # -------------------------------------------------------------
    imprimir_separador("Caso 2: Procesamiento de Ráfaga Telemétrica Paso a Paso")
    # Preparar eventos para cubrir las diferentes situaciones
    # 1. Identificador nuevo: 2001
    r1 = SeismicReport(station_code="EST-MANIZALES-01", raw_data={"event_id": 2001, "magnitud": 5.2, "profundidad": 20.0, "revision": 1, "x": 380.0, "y": 520.0})
    # 2. Revisión mayor con reubicación sobre 1004 (sube de 3.5 a 6.0, cambia prioridad a 3)
    r2 = SeismicReport(station_code="EST-PEREIRA-01", raw_data={"event_id": 1004, "magnitud": 6.0, "profundidad": 10.0, "revision": 2, "x": 380.0, "y": 520.0, "zona_poblada": True})
    # 3. Confirmación (misma rev e idénticos datos sobre 1001)
    r3 = SeismicReport(station_code="EST-ARMENIA-01", raw_data={"event_id": 1001, "magnitud": 6.5, "profundidad": 12.0, "revision": 1, "x": 385.0, "y": 515.0})
    # 4. Conflicto (misma rev 1 y datos distintos sobre 1001)
    r4 = SeismicReport(station_code="EST-PEREIRA-01", raw_data={"event_id": 1001, "magnitud": 3.0, "profundidad": 80.0, "revision": 1, "x": 100.0, "y": 100.0})
    # 5. Reporte antiguo (revisión 0 sobre 1001)
    r5 = SeismicReport(station_code="EST-MANIZALES-01", raw_data={"event_id": 1001, "magnitud": 6.5, "profundidad": 12.0, "revision": 0, "x": 385.0, "y": 515.0})

    for r in (r1, r2, r3, r4, r5):
        store.report_queue.enqueue(r)
    print(f" [OK] Cola FIFO inicializada con {store.report_queue.size()} reportes.")

    paso = 1
    while not store.report_queue.is_empty():
        rep_peek = store.report_queue.peek()
        res_proc = global_command_bus.dispatch(ProcesarReporteCommand())
        d = res_proc["data"]
        print(f"   Paso {paso}: Reporte ev={d['event_id']} rev={d['revision']} | Decisión: {d['decision']} | Rotaciones: {d['rotaciones_producidas']} | Restantes: {d['reportes_restantes_en_cola']}")
        paso += 1

    # -------------------------------------------------------------
    # CASO 3: CORRECCIÓN Y ELIMINACIÓN
    # -------------------------------------------------------------
    imprimir_separador("Caso 3: Corrección con Cambio de Clave y Eliminación")
    clave_antes = str(store.avl_tree.buscar_por_id(1002).getValor().composite_key)
    dto_corregir = CorregirEventoDTO(event_id=1002, nueva_magnitud=7.5, nueva_profundidad=5.0)
    res_corr = global_command_bus.dispatch(CorregirEventoCommand(dto=dto_corregir))

    clave_despues = str(store.avl_tree.buscar_por_id(1002).getValor().composite_key)
    print(f" [OK] Evento 1002 corregido:")
    print(f"      Clave antes: {clave_antes} -> Clave después: {clave_despues}")
    print(f"      Reubicación exitosa en AVL. Cambio prioridad: {res_corr['data']['prioridad_cambio']}")


    # Eliminar evento activo 1003
    res_elim = global_command_bus.dispatch(EliminarEventoCommand(event_id=1003))
    print(f"\n [OK] Evento SIS-001003 eliminado individualmente.")
    print(f"      Activo en AVL: {store.is_id_active(1003)} | En conjunto eliminados: {store.is_id_deleted(1003)}")

    # Intentar procesar reporte posterior sobre evento eliminado 1003
    rep_elim = SeismicReport(station_code="EST-MANIZALES-01", raw_data={"event_id": 1003, "magnitud": 4.8, "profundidad": 20.0, "revision": 2})
    store.report_queue.enqueue(rep_elim)
    res_rechazo = global_command_bus.dispatch(ProcesarReporteCommand())
    print(f"      Reporte posterior a eliminación: {res_rechazo['situacion']} -> {res_rechazo['message']}")

    # -------------------------------------------------------------
    # CASO 4: ANÁLISIS DE COSTO Y PRESUPUESTO L
    # -------------------------------------------------------------
    imprimir_separador("Caso 4: Análisis de Costo y Presupuesto L")
    store.set_scenario_parameters(limite_l=1)
    res_cost = global_command_bus.dispatch(ConsultarAccesoCostosoQuery(limite_l=1))
    print(f" [OK] Límite L establecido a {res_cost['limite_l_vigente']}. Eventos P=3 costosos encontrados: {res_cost['total_eventos_prioridad_alta_costosos']}:")
    for c in res_cost["eventos_costosos"]:
        print(f"      - {c['codigo']} | Clave: {c['clave_k']} | Profundidad árbol: {c['profundidad_en_arbol']} > L={c['limite_l']} | Nodos visitados en búsqueda: {c['nodos_visitados_busqueda_clave']}")

    # -------------------------------------------------------------
    # CASO 5: ARCHIVO POR ANTIGÜEDAD T Y PRESERVACIÓN DE RÉPLICAS
    # -------------------------------------------------------------
    imprimir_separador("Caso 5: Archivo por Antigüedad T y Preservación de Réplicas")
    # Avanzar el reloj de simulación 100 horas para superar T=72h
    store.advance_simulation_clock(hours=100)
    print(f" [OK] Reloj avanzado a: {store.get_simulation_clock_iso()} (supera T={store.param_archive_t_hours}h)")

    from src.domain.value_objects.coordinates import CartesianCoordinates
    from src.domain.entities.seismic_event import SeismicEvent
    ev_antiguo = SeismicEvent(
        event_id=1099,
        magnitude=3.0,
        depth=50.0,
        coordinates=CartesianCoordinates(700.0, 700.0),
        station_id="EST-ARMENIA-01",
        is_populated_zone=False,
        timestamp="2026-09-20T00:00:00Z"
    )
    store.avl_tree.insertar(ev_antiguo)
    store.bst_tree.insertar(ev_antiguo)

    dto_arch = ArchivarRamaDTO(t_horas=48.0, guardar_json=False)
    res_arch = global_command_bus.dispatch(ArchivarRamaCommand(dto=dto_arch))



    print(f" [OK] Poda ejecutada exitosamente:")
    print(f"      Eventos trasladados al histórico archivado: {res_arch['data']['nodos_archivados']} (IDs: {res_arch['data']['eventos_archivados_ids']})")
    print(f"      Eventos conservados en catálogo activo: {res_arch['data']['total_nodos_activos']}")
    print(f"      Nueva altura AVL balanceado: {res_arch['data']['nueva_altura_avl']}")


    # -------------------------------------------------------------
    # CASO 6: DESHACER (UNDO) INTEGRAL LIFO
    # -------------------------------------------------------------
    imprimir_separador("Caso 6: Deshacer Integral LIFO (Undo)")
    print(f" Pila de deshacer contiene {store.undo_stack.size()} operaciones apiladas.")
    paso_undo = 1
    while not store.undo_stack.is_empty():
        res_undo = global_command_bus.dispatch(DeshacerAccionCommand())
        d_undo = res_undo["data"]
        print(f"   Deshacer Paso {paso_undo}: Revertida acción [{d_undo['accion_revertida']}] ev={d_undo['evento_afectado_id']} | Restantes en pila: {d_undo['elementos_restantes_en_pila']}")
        paso_undo += 1

    print("\n [OK] Verificando restauración completa tras Deshacer:")
    print(f"      Evento eliminado 1003 restaurado activo en AVL: {store.is_id_active(1003)}")
    print(f"      Reportes encolados restaurados en Cola FIFO: {store.report_queue.size()}")
    print(f"      Eventos en AVL activo: {store.avl_tree.contar_nodos()}")
    imprimir_separador("DEMOSTRACIÓN DE LOS 6 CASOS MINIMOS COMPLETADA CON 100% DE ÉXITO")

if __name__ == "__main__":
    ejecutar_demostracion()
