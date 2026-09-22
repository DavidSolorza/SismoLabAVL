# -*- coding: utf-8 -*-
"""
Interactive CLI Console Application / Aplicación Interactiva de Consola CLI
SismoLab AVL - Universidad de Caldas

Permite ejecutar interactivamente todas las operaciones del backend SismoLab AVL:
- Crear Eventos Sísmicos
- Corregir Eventos (Re-balanceo AVL)
- Encolar y Procesar Cola FIFO de Telemetría
- Deshacer Operaciones mediante Pila LIFO (Undo Stack)
- Archivar y Podar Ramas del Árbol AVL
- Visualizar el Dibujo Conceptual del Árbol (basado en _dibujar de 1_árbol_bst.py y 2_árbol_avl.py)
- Alternar Modos de Operación (Modo Normal vs Modo Estrés)
- Auditoría Estructural y Métricas Comparativas BST vs AVL
"""

import sys
from src.core.config.settings import OperationalMode
from src.core.bus.command_bus import global_command_bus
from src.features.crear_evento.dto import CrearEventoDTO
from src.features.crear_evento.command import CrearEventoCommand, CrearEventoHandler
from src.features.corregir_evento.dto import CorregirEventoDTO
from src.features.corregir_evento.command import CorregirEventoCommand, CorregirEventoHandler
from src.features.procesar_reporte.command import ProcesarReporteCommand, ProcesarReporteHandler
from src.features.deshacer_accion.command import DeshacerAccionCommand, DeshacerAccionHandler
from src.features.archivar_rama.command import ArchivarRamaDTO, ArchivarRamaCommand, ArchivarRamaHandler
from src.infrastructure.persistence.in_memory_store import store
from src.infrastructure.audit.avl_auditor import AVLAuditor
from src.domain.entities.report import SeismicReport
from src.domain.constants.predefined_events import PREDEFINED_EVENTS

def init_handlers():
    global_command_bus.register(CrearEventoCommand, CrearEventoHandler().handle)
    global_command_bus.register(CorregirEventoCommand, CorregirEventoHandler().handle)
    global_command_bus.register(ProcesarReporteCommand, ProcesarReporteHandler().handle)
    global_command_bus.register(DeshacerAccionCommand, DeshacerAccionHandler().handle)
    global_command_bus.register(ArchivarRamaCommand, ArchivarRamaHandler().handle)

def dibujar_arbol_conceptual(nodo, espacio="", posicion="R"):
    """
    Método para dibujar conceptualmente el árbol binario
    Basado directamente en _dibujar de 1_árbol_bst.py y 2_árbol_avl.py
    """
    if nodo is not None:
        dibujar_arbol_conceptual(nodo.getHijoDerecho(), espacio + "     ", "D")
        evento = nodo.getValor()
        str_val = f"{evento.composite_key.formatted_id()} (M={evento.magnitude}M, P={evento.priority})" if hasattr(evento, 'composite_key') else str(evento)
        print(f"{espacio}{posicion}── {str_val}")
        dibujar_arbol_conceptual(nodo.getHijoIzquierdo(), espacio + "     ", "I")

def seleccionar_sismo_predefinido():
    """Permite seleccionar interactivamente un sismo predefinido del catálogo colombiano"""
    print("\n" + "-"*65)
    print("⚡ CATÁLOGO DE SISMOS PREDEFINIDOS PARA PRUEBAS RÁPIDAS ⚡")
    print("-"*65)
    for i, s in enumerate(PREDEFINED_EVENTS, 1):
        zona = "Urbana" if s["zona_poblada"] else "Rural"
        print(f" {i:2d}. {s['nombre']}")
        print(f"     Magnitud: {s['magnitud']}M | Prof: {s['profundidad']}km | {zona} | P{s['expected_priority']}")
    print("  0. Cancelar selección")
    print("-"*65)
    
    sel = input(f"Seleccione un sismo (1-{len(PREDEFINED_EVENTS)}, 0=Cancelar): ").strip()
    if not sel.isdigit() or int(sel) < 1 or int(sel) > len(PREDEFINED_EVENTS):
        return None, None
    
    preset = PREDEFINED_EVENTS[int(sel) - 1]
    
    # Resolver ID para evitar colisiones con eventos existentes
    existing_events = store.avl_tree.recorrido_inorden()
    existing_ids = {e.id for e in existing_events}
    target_id = preset["id"]
    if target_id in existing_ids:
        target_id = max(existing_ids) + 1 if existing_ids else 2001
    
    dto = CrearEventoDTO(
        id=target_id,
        magnitud=preset["magnitud"],
        profundidad=preset["profundidad"],
        latitud=preset["latitud"],
        longitud=preset["longitud"],
        estacion_id=preset["estacion_id"],
        zona_poblada=preset["zona_poblada"]
    )
    return dto, preset["nombre"]

def menu_principal():
    print("\n" + "="*70)
    print("🌋 SISTEMA BACKEND SISMOLAB AVL - UNIVERSIDAD DE CALDAS 🌋")
    print("="*70)
    print(" 1. ➕ Crear Evento Sísmico (Manual o Catálogo Rápido)")
    print(" 2. ✏️ Corregir Evento Sísmico (Slice: corregir_evento)")
    print(" 3. 📥 Encolar Reporte de Telemetría (Cola FIFO)")
    print(" 4. ⚙️ Procesar Siguiente Reporte de Cola (Slice: procesar_reporte)")
    print(" 5. ↩️ Deshacer Última Acción (Slice: deshacer_accion - Pila LIFO)")
    print(" 6. ✂️ Archivar / Podar Rama del AVL (Slice: archivar_rama)")
    print(" 7. 📜 Listar Eventos Ordenados por Clave Compuesta K=(P, M, I)")
    print(" 8. 🌳 Dibujar Estructura Conceptual del Árbol AVL")
    print(" 9. 📊 Ver Auditoría y Métricas (AVL vs BST)")
    print("10. 🔄 Alternar Modo Operacional (NORMAL <-> ESTRÉS)")
    print("11. ⚡ Insertar Sismo Predefinido (Catálogo Rápido)")
    print("12. 🧹 Limpiar Árbol Totalmente (Vaciar todo para pruebas)")
    print(" 0. 🚪 Salir / Exit")
    print("="*70)

def main_cli():
    init_handlers()
    while True:
        menu_principal()
        opc = input("Seleccione una opción / Select an option (0-12): ").strip()
        
        if opc == "1":
            try:
                usar_predef = input("¿Desea usar un sismo predefinido del catálogo? (s/n, default=s): ").strip().lower()
                if usar_predef in ("", "s", "si", "y", "yes"):
                    dto, nombre = seleccionar_sismo_predefinido()
                    if dto:
                        res = global_command_bus.dispatch(CrearEventoCommand(dto))
                        print(f"\n✅ OK: Insertado [{nombre}] (ID: {dto.id}) - {res['message']}")
                    else:
                        print("\nℹ️ Inserción cancelada.")
                else:
                    ev_id = int(input("ID del evento (1..999999): "))
                    mag = float(input("Magnitud (-2.0..10.0): "))
                    prof = float(input("Profundidad (km >= 0): "))
                    lat = float(input("Latitud (-90..90): "))
                    lon = float(input("Longitud (-180..180): "))
                    poblada = input("¿Afecta zona poblada? (s/n): ").strip().lower() == 's'
                    
                    dto = CrearEventoDTO(
                        id=ev_id, magnitud=mag, profundidad=prof,
                        latitud=lat, longitud=lon, zona_poblada=poblada
                    )
                    res = global_command_bus.dispatch(CrearEventoCommand(dto))
                    print("\n✅ OK:", res["message"])
            except Exception as e:
                print("\n❌ Error:", str(e))

        elif opc == "11":
            try:
                dto, nombre = seleccionar_sismo_predefinido()
                if dto:
                    res = global_command_bus.dispatch(CrearEventoCommand(dto))
                    print(f"\n✅ OK: Insertado [{nombre}] (ID: {dto.id}) - {res['message']}")
                else:
                    print("\nℹ️ Inserción cancelada.")
            except Exception as e:
                print("\n❌ Error:", str(e))

        elif opc == "2":
            try:
                ev_id = int(input("ID del evento a corregir: "))
                mag = float(input("Nueva magnitud: "))
                prof = float(input("Nueva profundidad (km): "))
                razon = input("Razón de corrección: ")
                
                dto = CorregirEventoDTO(event_id=ev_id, nueva_magnitud=mag, nueva_profundidad=prof, razon=razon)
                res = global_command_bus.dispatch(CorregirEventoCommand(dto))
                print("\n✅ OK:", res["message"])
            except Exception as e:
                print("\n❌ Error:", str(e))

        elif opc == "3":
            try:
                ev_id = int(input("ID asignado al reporte: "))
                mag = float(input("Magnitud: "))
                prof = float(input("Profundidad: "))
                lat = float(input("Latitud: "))
                lon = float(input("Longitud: "))
                
                raw = {
                    "event_id": ev_id, "magnitud": mag, "profundidad": prof,
                    "latitud": lat, "longitud": lon, "zona_poblada": True
                }
                rep = SeismicReport(station_code="EST-MANIZALES-01", raw_data=raw)
                store.report_queue.enqueue(rep)
                print(f"\n✅ Reporte {rep.id} encolado. Total en cola FIFO: {store.report_queue.size()}")
            except Exception as e:
                print("\n❌ Error:", str(e))

        elif opc == "4":
            try:
                res = global_command_bus.dispatch(ProcesarReporteCommand())
                print("\n✅ OK:", res["message"])
            except Exception as e:
                print("\n❌ Error:", str(e))

        elif opc == "5":
            try:
                res = global_command_bus.dispatch(DeshacerAccionCommand())
                print("\n✅ OK:", res["message"])
            except Exception as e:
                print("\n❌ Error:", str(e))

        elif opc == "6":
            try:
                p_min = int(input("Prioridad mínima a podar (3=Baja, 2=Media+Baja): "))
                dto = ArchivarRamaDTO(prioridad_minima=p_min, guardar_json=True)
                res = global_command_bus.dispatch(ArchivarRamaCommand(dto))
                print("\n✅ OK:", res["message"])
            except Exception as e:
                print("\n❌ Error:", str(e))

        elif opc == "7":
            eventos = store.avl_tree.recorrido_inorden()
            print(f"\n--- LISTADO DE EVENTOS EN ORDEN DE CRITICIDAD (Total: {len(eventos)}) ---")
            for idx, ev in enumerate(eventos, 1):
                print(f"{idx}. {ev.composite_key.formatted_id()} -> P={ev.priority}, M={ev.magnitude}, D={ev.depth}km, Estación={ev.station_id}")

        elif opc == "8":
            print("\n" + "="*50)
            print("🌳 DIBUJO CONCEPTUAL DEL ÁRBOL AVL")
            print("="*50)
            if store.avl_tree.raiz is None:
                print("El árbol está vacío / Tree is empty")
            else:
                dibujar_arbol_conceptual(store.avl_tree.raiz)

        elif opc == "9":
            metricas = AVLAuditor.get_metrics()
            print("\n--- AUDITORÍA Y MÉTRICAS (AVL vs BST) ---")
            for k, v in metricas.items():
                print(f"  • {k}: {v}")

        elif opc == "10":
            modo_act = store.avl_tree.modo
            nuevo_modo = OperationalMode.STRESS if modo_act == OperationalMode.NORMAL else OperationalMode.NORMAL
            store.avl_tree.set_modo(nuevo_modo)
            print(f"\n✅ Modo cambiado de {modo_act.value} a {nuevo_modo.value}")

        elif opc == "12":
            conf = input("¿Está seguro de vaciar totalmente el árbol AVL y la memoria? (s/n): ").strip().lower()
            if conf in ("s", "si", "y", "yes"):
                store.clear_all(load_samples=False)
                print("\n🧹 OK: Árbol AVL, BST, cola FIFO y pila LIFO vaciados totalmente (0 nodos).")
            else:
                print("\nℹ️ Limpieza cancelada.")

        elif opc == "0":
            print("\n¡Gracias por utilizar SismoLab AVL!")
            sys.exit(0)

if __name__ == "__main__":
    main_cli()
