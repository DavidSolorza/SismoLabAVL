# -*- coding: utf-8 -*-
"""
Version Repository / Repositorio Persistente de Versiones Nombradas (Sección 13)
SismoLab AVL - Universidad de Caldas

Permite almacenar, listar y restaurar snapshots nombrados completos del escenario operativo.
Las versiones se guardan en archivos JSON en el directorio `data/versions/` para persistir
entre sesiones y reinicios del servidor.
"""

import os
import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

class VersionRepository:
    """
    Repositorio de Versiones con Nombre en Disco / Persistent Named Version Repository
    """
    def __init__(self, versions_dir: str = "data/versions"):
        self.versions_dir = versions_dir
        os.makedirs(self.versions_dir, exist_ok=True)

    def _get_file_path(self, nombre: str) -> str:
        # Sanitizar nombre para nombre de archivo seguro
        clean_name = "".join(c for c in nombre if c.isalnum() or c in (' ', '_', '-')).strip()
        clean_name = clean_name.replace(' ', '_')
        return os.path.join(self.versions_dir, f"{clean_name}.json")

    def _crear_snapshot(self, store: Any) -> Dict[str, Any]:
        """Genera un diccionario completo con el snapshot del estado del store."""
        current_clock = store.get_simulation_clock()
        return {
            "reloj_simulacion": store.get_simulation_clock_iso(),
            "parametros": store.get_scenario_parameters(),
            "eventos": [e.to_dict(current_clock=current_clock) for e in store.avl_tree.recorrido_inorden()],
            "archivados": [e.to_dict(current_clock=current_clock) for e in store.archived_events.values()],
            "eliminados": list(store.deleted_ids),
            "topologia_avl": store.avl_tree.exportar_topologia_dict()
        }

    def _aplicar_snapshot(self, store: Any, snapshot: Dict[str, Any]) -> None:
        """Restaura el estado completo del store a partir de un snapshot."""
        from datetime import datetime
        from src.domain.structures.avl import ArbolAVL
        from src.domain.structures.bst import ArbolBST
        from src.domain.entities.seismic_event import SeismicEvent
        from src.domain.value_objects.coordinates import CartesianCoordinates

        # Reloj
        if "reloj_simulacion" in snapshot:
            ts_str = snapshot["reloj_simulacion"]
            store.set_simulation_clock(datetime.fromisoformat(ts_str.replace("Z", "+00:00")))

        # Parámetros
        if "parametros" in snapshot:
            p = snapshot["parametros"]
            store.set_scenario_parameters(
                w_horas=p.get("w_horas"),
                r_km=p.get("r_km"),
                limite_l=p.get("limite_l"),
                t_horas=p.get("t_horas")
            )

        # Reconstruir árboles
        nuevo_avl = ArbolAVL()
        nuevo_bst = ArbolBST()

        for ev_data in snapshot.get("eventos", []):
            x = float(ev_data.get("x", 500.0))
            y = float(ev_data.get("y", 500.0))
            coords = CartesianCoordinates(x, y)
            ev = SeismicEvent(
                event_id=int(ev_data.get("id") or ev_data.get("event_id")),
                magnitude=float(ev_data.get("magnitud") or ev_data.get("magnitude", 0.0)),
                depth=float(ev_data.get("profundidad") or ev_data.get("depth", 10.0)),
                coordinates=coords,
                station_id=str(ev_data.get("estacion") or ev_data.get("station_id", "EST-DEFAULT")),
                is_populated_zone=ev_data.get("zona_poblada", False),
                timestamp=ev_data.get("timestamp") or store.get_simulation_clock_iso(),
                estado_atencion=ev_data.get("estado_atencion", "Pendiente")
            )
            ev.revision = int(ev_data.get("revision", 1))
            ev.version = ev.revision
            ev.recalcular_prioridad_y_clave()
            nuevo_avl.insertar(ev)
            nuevo_bst.insertar(ev)

        store.avl_tree = nuevo_avl
        store.bst_tree = nuevo_bst

        # Reconstruir archivados
        store.archived_events.clear()
        for ev_data in snapshot.get("archivados", []):
            x = float(ev_data.get("x", 500.0))
            y = float(ev_data.get("y", 500.0))
            coords = CartesianCoordinates(x, y)
            ev = SeismicEvent(
                event_id=int(ev_data.get("id") or ev_data.get("event_id")),
                magnitude=float(ev_data.get("magnitud") or ev_data.get("magnitude", 0.0)),
                depth=float(ev_data.get("profundidad") or ev_data.get("depth", 10.0)),
                coordinates=coords,
                station_id=str(ev_data.get("estacion") or ev_data.get("station_id", "EST-DEFAULT")),
                is_populated_zone=ev_data.get("zona_poblada", False),
                timestamp=ev_data.get("timestamp") or store.get_simulation_clock_iso(),
                estado_atencion="Archivado"
            )
            ev.revision = int(ev_data.get("revision", 1))
            ev.version = ev.revision
            ev.recalcular_prioridad_y_clave()
            store.archived_events[ev.id] = ev

        store.deleted_ids = set(snapshot.get("eliminados", []))

        from src.domain.services.association_service import AssociationService
        pool = store.get_all_active_and_archived_events()
        AssociationService.recalcular_todas_las_asociaciones(pool, store.param_w_hours, store.param_r_km)
        store.avl_tree.actualizar_marcas_acceso_costoso(store.param_budget_l)

    def guardar_version(self, nombre: str, store_o_dict: Any = None, descripcion: Optional[str] = None, store: Any = None) -> Dict[str, Any]:
        """
        Guarda una versión con nombre en disco. Acepta store o diccionario.
        """
        target = store if store is not None else store_o_dict
        if hasattr(target, "avl_tree"):
            estado = self._crear_snapshot(target)
        elif isinstance(target, dict):
            estado = target
        else:
            estado = {}


        file_path = self._get_file_path(nombre)
        ahora = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

        
        datos_version = {
            "nombre": nombre,
            "descripcion": descripcion or f"Versión guardada el {ahora}",
            "guardado_en": ahora,
            "estado": estado
        }

        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(datos_version, f, indent=2, ensure_ascii=False)

        return {
            "nombre": nombre,
            "guardado_en": ahora,
            "file_path": file_path,
            "total_eventos": len(estado.get("eventos", [])),
            "total_archivados": len(estado.get("archivados", []))
        }

    def restaurar_version(self, nombre: str, store: Any) -> Dict[str, Any]:
        """
        Carga una versión nombrada de disco y la aplica sobre el store en memoria.
        """
        data = self.obtener_version(nombre)
        if not data:
            raise FileNotFoundError(f"Versión '{nombre}' no encontrada en el repositorio.")

        estado = data.get("estado", {})
        self._aplicar_snapshot(store, estado)

        return {
            "nombre": data.get("nombre", nombre),
            "descripcion": data.get("descripcion", ""),
            "guardado_en": data.get("guardado_en", ""),
            "total_eventos_activos": store.avl_tree.contar_nodos(),
            "altura_avl": store.avl_tree.obtener_altura()
        }

    def listar_versiones(self) -> List[Dict[str, Any]]:
        """
        Lista todas las versiones guardadas en disco con sus metadatos.
        """
        if not os.path.exists(self.versions_dir):
            return []

        versiones = []
        for fname in os.listdir(self.versions_dir):
            if fname.endswith(".json"):
                fpath = os.path.join(self.versions_dir, fname)
                try:
                    with open(fpath, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        estado = data.get("estado", {})
                        versiones.append({
                            "nombre": data.get("nombre", fname.replace(".json", "")),
                            "descripcion": data.get("descripcion", ""),
                            "guardado_en": data.get("guardado_en", ""),
                            "total_eventos": len(estado.get("eventos", [])),
                            "total_archivados": len(estado.get("archivados", [])),
                            "reloj": estado.get("reloj_simulacion", "")
                        })
                except Exception:
                    pass

        # Ordenar de más reciente a más antiguo
        versiones.sort(key=lambda x: x.get("guardado_en", ""), reverse=True)
        return versiones

    def obtener_version(self, nombre: str) -> Optional[Dict[str, Any]]:
        """
        Recupera el contenido íntegro de una versión guardada.
        """
        file_path = self._get_file_path(nombre)
        if not os.path.exists(file_path):
            return None

        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def eliminar_version(self, nombre: str) -> bool:
        """
        Elimina el archivo de una versión guardada.
        """
        file_path = self._get_file_path(nombre)
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False


# Instancias exportadas
version_repository = VersionRepository()
version_repo = version_repository
