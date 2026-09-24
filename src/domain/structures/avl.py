# -*- coding: utf-8 -*-
"""
AVL Tree Data Structure / Estructura de Datos Árbol AVL Recursivo
SismoLab AVL - Universidad de Caldas

Basado en 2_árbol_avl.py con soporte para:
1. Clave Compuesta K = (P, M, I) (Prioridad, Magnitud, Identificador).
2. Modos de Operación: Modo Normal (auto-balanceo recursivo inmediato) y Modo Estrés (balanceo diferido).
3. Rotaciones simples (LL, RR) y dobles (LR, RL).
4. Poda y archivado de ramas del árbol por prioridad.
5. Comentarios y documentación bilingüe (Español / Inglés).

Based on 2_árbol_avl.py with support for:
1. Composite Key K = (P, M, I) (Priority, Magnitude, Identifier).
2. Operating Modes: Normal Mode (immediate recursive auto-balancing) and Stress Mode (deferred balancing).
3. Single (LL, RR) and Double (LR, RL) rotations.
4. Pruning and archiving of tree branches by priority.
5. Bilingual documentation and comments (Spanish / English).
"""

from datetime import datetime
from typing import Optional, List, Any, Tuple, Dict
from src.core.config.settings import OperationalMode
from src.core.errors.exceptions import EventAlreadyExistsException

class NodoAVL:
    """
    Nodo del Árbol AVL / AVL Tree Node
    Basado en NodoAVL de 2_árbol_avl.py / Based on NodoAVL from 2_árbol_avl.py
    """
    def __init__(self, valor: Any):
        self.valor = valor
        self.altura: int = 0
        self.hijoIzquierdo: Optional['NodoAVL'] = None
        self.hijoDerecho: Optional['NodoAVL'] = None
        self.padre: Optional['NodoAVL'] = None

    def getAltura(self) -> int:
        return self.altura

    def setAltura(self, h: int) -> None:
        self.altura = h

    def getValor(self) -> Any:
        return self.valor

    def setValor(self, valor: Any) -> None:
        self.valor = valor

    def getHijoIzquierdo(self) -> Optional['NodoAVL']:
        return self.hijoIzquierdo

    def setHijoIzquierdo(self, nodo: Optional['NodoAVL']) -> None:
        self.hijoIzquierdo = nodo

    def getHijoDerecho(self) -> Optional['NodoAVL']:
        return self.hijoDerecho

    def setHijoDerecho(self, nodo: Optional['NodoAVL']) -> None:
        self.hijoDerecho = nodo

    def getPadre(self) -> Optional['NodoAVL']:
        return self.padre

    def setPadre(self, nodo: Optional['NodoAVL']) -> None:
        self.padre = nodo


class ArbolAVL:
    """
    Árbol AVL Recursivo de Alto Rendimiento / High-Performance Recursive AVL Tree
    """
    def __init__(self, modo: OperationalMode = OperationalMode.NORMAL):
        self.raiz: Optional[NodoAVL] = None
        self.modo: OperationalMode = modo
        # Estructura auxiliar de búsqueda O(1) por Identificador Único (Hash Map en memoria)
        # Auxiliary O(1) search structure by Unique Identifier (In-memory Hash Map)
        self.indice_por_id: Dict[int, NodoAVL] = {}
        # Registro de nodos potencialmente desbalanceados durante Modo Estrés
        # Registry of potentially unbalanced nodes during Stress Mode
        self._nodos_desbalanceados: List[NodoAVL] = []
        # Contadores de rotaciones (Sección 8 & 14)
        self.rotaciones_ultima_operacion: int = 0
        self.total_rotaciones: int = 0
        self.casos_ll: int = 0
        self.casos_rr: int = 0
        self.casos_lr: int = 0
        self.casos_rl: int = 0
        self.giros_simples_izq: int = 0
        self.giros_simples_der: int = 0

    def reset_contador_rotaciones(self, reset_totales: bool = False) -> int:
        """Reinicia el contador de rotaciones de la última operación o totales"""
        prev = self.rotaciones_ultima_operacion
        self.rotaciones_ultima_operacion = 0
        if reset_totales:
            self.total_rotaciones = 0
            self.casos_ll = 0
            self.casos_rr = 0
            self.casos_lr = 0
            self.casos_rl = 0
            self.giros_simples_izq = 0
            self.giros_simples_der = 0
        return prev

    def resetear_todos_los_contadores(self) -> None:
        """Reinicia todos los contadores de rotaciones (Sección 14)"""
        self.total_rotaciones = 0
        self.rotaciones_ultima_operacion = 0
        self.casos_ll = 0
        self.casos_rr = 0
        self.casos_lr = 0
        self.casos_rl = 0
        self.giros_simples_izq = 0
        self.giros_simples_der = 0

    def obtener_desglose_rotaciones(self) -> Dict[str, int]:
        """
        Retorna el desglose estricto de rotaciones (Sección 14):
        Casos LL, RR, LR, RL y giros simples elementales (izq, der).
        Un caso doble cuenta como LR/RL y dos giros elementales simples.
        """
        return {
            "total_rotaciones": self.casos_ll + self.casos_rr + self.casos_lr + self.casos_rl,
            "casos_ll": self.casos_ll,
            "casos_rr": self.casos_rr,
            "casos_lr": self.casos_lr,
            "casos_rl": self.casos_rl,
            "giros_simples_izquierda": self.giros_simples_izq,
            "giros_simples_derecha": self.giros_simples_der,
            "rotaciones_ultima_operacion": self.rotaciones_ultima_operacion
        }


    @staticmethod
    def _extraer_id(dato: Any) -> Optional[int]:
        """Extrae el ID numérico del dato / Extracts numeric ID from data item"""
        if hasattr(dato, 'id'):
            return getattr(dato, 'id')
        if hasattr(dato, 'identificador'):
            return getattr(dato, 'identificador')
        if hasattr(dato, 'composite_key') and hasattr(dato.composite_key, 'I'):
            return dato.composite_key.I
        if isinstance(dato, int):
            return dato
        return None

    def set_modo(self, modo: OperationalMode) -> None:
        """
        Cambia el modo operacional del árbol / Changes tree operational mode
        Si se cambia de ESTRÉS a NORMAL, ejecuta un balanceo diferido completo.
        If switching from STRESS to NORMAL, executes a complete deferred rebalance.
        """
        if self.modo == OperationalMode.STRESS and modo == OperationalMode.NORMAL:
            self.modo = modo
            self.balancear_todo()
        else:
            self.modo = modo

    # --------------------------------------------------
    # ALTURA Y FACTOR DE BALANCEO / HEIGHT & BALANCE FACTOR
    # --------------------------------------------------
    def _altura(self, nodo: Optional[NodoAVL]) -> int:
        """Retorna la altura de un nodo (-1 si es None) / Returns node height (-1 if None)"""
        if nodo is None:
            return -1
        return nodo.getAltura()

    def _actualizarAltura(self, nodo: NodoAVL) -> None:
        """Actualiza la altura de un nodo basado en sus hijos / Updates node height based on children"""
        hIzq = self._altura(nodo.getHijoIzquierdo())
        hDer = self._altura(nodo.getHijoDerecho())
        nodo.setAltura(max(hIzq, hDer) + 1)

    def _calcularFactorDeBalanceo(self, nodo: Optional[NodoAVL]) -> int:
        """Calcula el factor de balanceo (h_izq - h_der) / Calculates balance factor (h_left - h_right)"""
        if nodo is None:
            return 0
        hIzq = self._altura(nodo.getHijoIzquierdo())
        hDer = self._altura(nodo.getHijoDerecho())
        return hIzq - hDer

    def obtener_factor_balance_raiz(self) -> int:
        """Retorna el factor de balance de la raíz (0 si el árbol está vacío)"""
        if self.raiz is None:
            return 0
        return self._calcularFactorDeBalanceo(self.raiz)


    # --------------------------------------------------
    # ROTACIONES AVL / AVL ROTATIONS
    # --------------------------------------------------
    def _giroSimpleIzquierda(self, superior: NodoAVL) -> NodoAVL:
        """
        Giro Simple a la Izquierda (Rotación RR)
        Single Left Rotation (RR Rotation)
        """
        mitad = superior.getHijoDerecho()
        if mitad is None:
            return superior

        hijoIzqMitad = mitad.getHijoIzquierdo()
        padreSuperior = superior.getPadre()

        # Re-enlazar mitad y superior / Re-link middle and top
        mitad.setHijoIzquierdo(superior)
        superior.setPadre(mitad)

        superior.setHijoDerecho(hijoIzqMitad)
        if hijoIzqMitad:
            hijoIzqMitad.setPadre(superior)

        mitad.setPadre(padreSuperior)
        if padreSuperior is None:
            self.raiz = mitad
        else:
            if padreSuperior.getHijoIzquierdo() == superior:
                padreSuperior.setHijoIzquierdo(mitad)
            else:
                padreSuperior.setHijoDerecho(mitad)

        self._actualizarAltura(superior)
        self._actualizarAltura(mitad)

        self.rotaciones_ultima_operacion += 1
        self.total_rotaciones += 1
        self.giros_simples_izq += 1

        return mitad

    def _giroSimpleDerecha(self, superior: NodoAVL) -> NodoAVL:
        """
        Giro Simple a la Derecha (Rotación LL)
        Single Right Rotation (LL Rotation)
        """
        mitad = superior.getHijoIzquierdo()
        if mitad is None:
            return superior

        hijoDerMitad = mitad.getHijoDerecho()
        padreSuperior = superior.getPadre()

        # Re-enlazar mitad y superior / Re-link middle and top
        mitad.setHijoDerecho(superior)
        superior.setPadre(mitad)

        superior.setHijoIzquierdo(hijoDerMitad)
        if hijoDerMitad:
            hijoDerMitad.setPadre(superior)

        mitad.setPadre(padreSuperior)
        if padreSuperior is None:
            self.raiz = mitad
        else:
            if padreSuperior.getHijoIzquierdo() == superior:
                padreSuperior.setHijoIzquierdo(mitad)
            else:
                padreSuperior.setHijoDerecho(mitad)

        self._actualizarAltura(superior)
        self._actualizarAltura(mitad)

        self.rotaciones_ultima_operacion += 1
        self.total_rotaciones += 1
        self.giros_simples_der += 1

        return mitad

    def _rebalancear_nodo(self, nodo: NodoAVL) -> NodoAVL:
        """
        Evalúa y aplica rotaciones en un nodo desbalanceado (FB > 1 o FB < -1).
        Evaluates and applies rotations on an unbalanced node (FB > 1 or FB < -1).
        """
        self._actualizarAltura(nodo)
        fb = self._calcularFactorDeBalanceo(nodo)

        # Caso LL: Desbalance a la izquierda, hijo izquierdo pesado a la izquierda (FB > 1 y FB_hijo >= 0)
        if fb > 1:
            fb_hijo_izq = self._calcularFactorDeBalanceo(nodo.getHijoIzquierdo())
            if fb_hijo_izq >= 0:
                self.casos_ll += 1
                return self._giroSimpleDerecha(nodo)
            else:
                self.casos_lr += 1
                nodo.setHijoIzquierdo(self._giroSimpleIzquierda(nodo.getHijoIzquierdo()))
                return self._giroSimpleDerecha(nodo)

        # Caso RR: Desbalance a la derecha, hijo derecho pesado a la derecha (FB < -1 y FB_hijo <= 0)
        if fb < -1:
            fb_hijo_der = self._calcularFactorDeBalanceo(nodo.getHijoDerecho())
            if fb_hijo_der <= 0:
                self.casos_rr += 1
                return self._giroSimpleIzquierda(nodo)
            else:
                self.casos_rl += 1
                nodo.setHijoDerecho(self._giroSimpleDerecha(nodo.getHijoDerecho()))
                return self._giroSimpleIzquierda(nodo)

        return nodo

    def _propagar_balanceo_hacia_arriba(self, nodo: Optional[NodoAVL]) -> None:
        """
        Propaga la actualización de alturas y balanceo desde un nodo hacia la raíz.
        Propagates height updates and rebalancing upwards from a node to the root.
        """
        actual = nodo
        while actual is not None:
            padre = actual.getPadre()
            if self.modo == OperationalMode.NORMAL:
                nuevo_subarbol = self._rebalancear_nodo(actual)
                actual = nuevo_subarbol.getPadre()
            else:
                # En Modo Estrés, solo actualizamos altura y registramos si hay desbalance
                self._actualizarAltura(actual)
                fb = self._calcularFactorDeBalanceo(actual)
                if abs(fb) > 1 and actual not in self._nodos_desbalanceados:
                    self._nodos_desbalanceados.append(actual)
                actual = padre

    # --------------------------------------------------
    # INSERTAR / INSERT
    # --------------------------------------------------
    def insertar(self, dato: Any) -> bool:
        """
        Inserta un nuevo elemento en el AVL ordenado por su Clave Compuesta K.
        Inserts a new element into AVL ordered by its Composite Key K.
        Registra la referencia en self.indice_por_id para búsquedas instantáneas O(1).
        """
        ev_id = self._extraer_id(dato)
        if ev_id is not None and self.buscar_por_id(ev_id) is not None:
            raise EventAlreadyExistsException(ev_id)

        nodo = NodoAVL(dato)

        if self.raiz is None:
            self.raiz = nodo
            nodo.setPadre(None)
            self._actualizarAltura(nodo)
            if ev_id is not None:
                self.indice_por_id[ev_id] = nodo
            return True

        insertado = self._insertar_recursivo(nodo, self.raiz)
        if insertado and ev_id is not None:
            self.indice_por_id[ev_id] = nodo
        return insertado

    def _insertar_recursivo(self, nodo: NodoAVL, raizActual: NodoAVL) -> bool:
        clave_nodo = getattr(nodo.getValor(), 'composite_key', nodo.getValor())
        clave_actual = getattr(raizActual.getValor(), 'composite_key', raizActual.getValor())

        id_nodo = self._extraer_id(nodo.getValor())
        id_actual = self._extraer_id(raizActual.getValor())

        # Validar identificador único / Validate unique ID
        if id_nodo is not None and id_actual is not None and id_nodo == id_actual:
            raise EventAlreadyExistsException(id_nodo)

        if clave_nodo == clave_actual:
            raise EventAlreadyExistsException(id_nodo if id_nodo is not None else 0)

        if clave_nodo < clave_actual:
            izq = raizActual.getHijoIzquierdo()
            if izq is None:
                raizActual.setHijoIzquierdo(nodo)
                nodo.setPadre(raizActual)
                self._propagar_balanceo_hacia_arriba(nodo)
                return True
            else:
                return self._insertar_recursivo(nodo, izq)
        else:
            der = raizActual.getHijoDerecho()
            if der is None:
                raizActual.setHijoDerecho(nodo)
                nodo.setPadre(raizActual)
                self._propagar_balanceo_hacia_arriba(nodo)
                return True
            else:
                return self._insertar_recursivo(nodo, der)

    # --------------------------------------------------
    # BUSCAR / SEARCH
    # --------------------------------------------------
    def buscar_por_id(self, event_id: int) -> Optional[NodoAVL]:
        """
        Busca un nodo en el AVL por su ID entero en tiempo O(1) promedio
        utilizando la estructura auxiliar Hash Map (self.indice_por_id).
        Cumple estrictamente con el principio de desacoplamiento entre el orden
        del árbol y la eficiencia de recuperación por identificador.

        Searches for an AVL node by integer ID in O(1) average time using
        the auxiliary Hash Map structure (self.indice_por_id).
        Strictly satisfies decoupling between tree order and ID retrieval.
        """
        # Búsqueda instantánea O(1) en el índice en memoria / Instant O(1) lookup in memory index
        if event_id in self.indice_por_id:
            return self.indice_por_id[event_id]
        
        # Fallback de seguridad en caso de desincronización / Safety fallback if out of sync
        nodo = self._buscar_id_recursivo(self.raiz, event_id)
        if nodo is not None:
            self.indice_por_id[event_id] = nodo
        return nodo

    def _buscar_id_recursivo(self, nodo: Optional[NodoAVL], event_id: int) -> Optional[NodoAVL]:
        if nodo is None:
            return None
        nodo_id = self._extraer_id(nodo.getValor())
        if nodo_id is not None and nodo_id == event_id:
            return nodo
        
        izq = self._buscar_id_recursivo(nodo.getHijoIzquierdo(), event_id)
        if izq is not None:
            return izq
        return self._buscar_id_recursivo(nodo.getHijoDerecho(), event_id)

    def buscar_por_clave(self, clave_k: Any) -> Optional[NodoAVL]:
        """Busca por objeto ClaveK / Searches by ClaveK object"""
        if self.raiz is None:
            return None
        return self._buscar_clave_recursivo(self.raiz, clave_k)

    def _buscar_clave_recursivo(self, nodo: Optional[NodoAVL], target_key: Any) -> Optional[NodoAVL]:
        if nodo is None:
            return None
        clave_actual = getattr(nodo.getValor(), 'composite_key', nodo.getValor())
        if clave_actual == target_key:
            return nodo
        if target_key < clave_actual:
            return self._buscar_clave_recursivo(nodo.getHijoIzquierdo(), target_key)
        return self._buscar_clave_recursivo(nodo.getHijoDerecho(), target_key)

    # --------------------------------------------------
    # ELIMINAR / DELETE
    # --------------------------------------------------
    def eliminar_por_id(self, event_id: int) -> bool:
        """
        Elimina un nodo del AVL por su ID / Deletes node from AVL by ID
        Garantiza sincronización total de self.indice_por_id.
        """
        nodo = self.buscar_por_id(event_id)
        if nodo is None:
            return False
        
        padre_afectado = nodo.getPadre()
        self._eliminar_nodo(nodo)
        if padre_afectado:
            self._propagar_balanceo_hacia_arriba(padre_afectado)
        elif self.raiz:
            self._propagar_balanceo_hacia_arriba(self.raiz)
        return True

    def _eliminar_nodo(self, nodo: NodoAVL) -> None:
        """
        Eliminación física del nodo adaptado de 2_árbol_avl.py
        Physical node deletion adapted from 2_árbol_avl.py
        Manteniendo sincronizado el índice auxiliar hash self.indice_por_id.
        """
        ev_id = self._extraer_id(nodo.getValor())

        # CASO 1: Es hoja / Is leaf
        if nodo.getHijoIzquierdo() is None and nodo.getHijoDerecho() is None:
            padre = nodo.getPadre()
            if padre is None:
                self.raiz = None
            else:
                if padre.getHijoIzquierdo() == nodo:
                    padre.setHijoIzquierdo(None)
                else:
                    padre.setHijoDerecho(None)
            nodo.setPadre(None)
            if ev_id is not None:
                self.indice_por_id.pop(ev_id, None)
            return

        # CASO 2: Solamente hijo derecho / Only right child
        if nodo.getHijoIzquierdo() is None:
            hijo = nodo.getHijoDerecho()
            padre = nodo.getPadre()
            if padre is None:
                self.raiz = hijo
                if hijo: hijo.setPadre(None)
            else:
                if padre.getHijoIzquierdo() == nodo:
                    padre.setHijoIzquierdo(hijo)
                else:
                    padre.setHijoDerecho(hijo)
                if hijo: hijo.setPadre(padre)
            nodo.setPadre(None)
            nodo.setHijoDerecho(None)
            if ev_id is not None:
                self.indice_por_id.pop(ev_id, None)
            return

        # CASO 2: Solamente hijo izquierdo / Only left child
        if nodo.getHijoDerecho() is None:
            hijo = nodo.getHijoIzquierdo()
            padre = nodo.getPadre()
            if padre is None:
                self.raiz = hijo
                if hijo: hijo.setPadre(None)
            else:
                if padre.getHijoIzquierdo() == nodo:
                    padre.setHijoIzquierdo(hijo)
                else:
                    padre.setHijoDerecho(hijo)
                if hijo: hijo.setPadre(padre)
            nodo.setPadre(None)
            nodo.setHijoIzquierdo(None)
            if ev_id is not None:
                self.indice_por_id.pop(ev_id, None)
            return

        # CASO 3: Dos hijos (reemplazar por predecesor) / Two children (replace by predecessor)
        predecesor = self._getPredecesor(nodo)
        id_anterior = ev_id
        id_predecesor = self._extraer_id(predecesor.getValor())

        # Copiar valor del predecesor al nodo actual
        nodo.setValor(predecesor.getValor())
        if id_predecesor is not None:
            self.indice_por_id[id_predecesor] = nodo
        if id_anterior is not None and id_anterior != id_predecesor:
            self.indice_por_id.pop(id_anterior, None)

        self._eliminar_nodo(predecesor)

    def _getPredecesor(self, nodo: NodoAVL) -> NodoAVL:
        actual = nodo.getHijoIzquierdo()
        while actual.getHijoDerecho() is not None:
            actual = actual.getHijoDerecho()
        return actual

    def _reindexar_ids(self) -> None:
        """
        Reconstruye el índice hash auxiliar por ID en memoria O(N).
        Rebuilds the auxiliary in-memory hash map index by ID O(N).
        """
        self.indice_por_id.clear()
        def _recorrer(n: Optional[NodoAVL]):
            if n is not None:
                ev_id = self._extraer_id(n.getValor())
                if ev_id is not None:
                    self.indice_por_id[ev_id] = n
                _recorrer(n.getHijoIzquierdo())
                _recorrer(n.getHijoDerecho())
        _recorrer(self.raiz)

    def vaciar(self) -> None:
        """
        Vacía completamente el árbol AVL y el índice auxiliar.
        Completely clears the AVL tree and the auxiliary hash index.
        """
        self.raiz = None
        self.indice_por_id.clear()
        self._nodos_desbalanceados.clear()

    # --------------------------------------------------
    # OPERACIONES ESPECIALES / SPECIAL OPERATIONS
    # --------------------------------------------------
    def balancear_todo(self) -> None:
        """
        Balancea todo el árbol recursivamente post Modo Estrés aun cuando existan
        diferencias de altura mayores que 2 (Sección 8).
        Aplica rotaciones progresivas in-place hasta que todos los nodos satisfagan |FB| <= 1.
        """
        def _rebalancear_completamente(nodo: Optional[NodoAVL]) -> Optional[NodoAVL]:
            if nodo is None:
                return None
            nodo.setHijoIzquierdo(_rebalancear_completamente(nodo.getHijoIzquierdo()))
            nodo.setHijoDerecho(_rebalancear_completamente(nodo.getHijoDerecho()))
            self._actualizarAltura(nodo)
            
            # Aplicar rotaciones mientras exista desbalance en este nodo
            limite_iter = 20
            while abs(self._calcularFactorDeBalanceo(nodo)) > 1 and limite_iter > 0:
                limite_iter -= 1
                nodo = self._rebalancear_nodo(nodo)
                if nodo.getHijoIzquierdo():
                    nodo.setHijoIzquierdo(_rebalancear_completamente(nodo.getHijoIzquierdo()))
                if nodo.getHijoDerecho():
                    nodo.setHijoDerecho(_rebalancear_completamente(nodo.getHijoDerecho()))
                self._actualizarAltura(nodo)
            return nodo

        # Ejecutar pasadas hasta que la auditoría confirme equilibrio absoluto
        max_pasadas = max(10, self.contar_nodos())
        for _ in range(max_pasadas):
            self.raiz = _rebalancear_completamente(self.raiz)
            es_valido, _ = self.es_avl_valido()
            if es_valido:
                break

        self._nodos_desbalanceados.clear()
        self._reindexar_ids()

    def recuperar_balance_modo_estres(self) -> Dict[str, Any]:
        """
        Restaura la condición de equilibrio AVL tras Modo Estrés aplicando rotaciones necesarias.
        No vacía ni reconstruye el árbol a partir de listas; rebalancea los nodos enlazados existentes.
        Retorna el informe de cambios, rotaciones ejecutadas y confirmación de auditoría (Sección 8).
        """
        rotaciones_inicio = self.total_rotaciones
        nodos_desbalanceados_previos = len(self._nodos_desbalanceados)
        self.balancear_todo()
        rotaciones_aplicadas = self.total_rotaciones - rotaciones_inicio
        self.modo = OperationalMode.NORMAL
        es_valido, msg = self.es_avl_valido()

        return {
            "success": es_valido,
            "rotaciones_aplicadas": rotaciones_aplicadas,
            "nodos_desbalanceados_atendidos": nodos_desbalanceados_previos,
            "altura_final": self.obtener_altura(),
            "total_nodos": self.contar_nodos(),
            "es_avl_valido": es_valido,
            "auditoria": msg
        }

    def buscar_subarbol_elegible_archivo(self, reloj_utc: datetime, t_horas: float) -> Optional[Dict[str, Any]]:
        """
        Busca y selecciona el subárbol óptimo elegible para archivo masivo (Sección 10).
        Regla de elegibilidad: TODOS los eventos del subárbol deben tener prioridad baja (P=1)
        y antigüedad estrictamente mayor a t_horas respecto al reloj_utc.
        Criterio determinista de desempate:
        1. Mayor cantidad de nodos en el subárbol.
        2. Mayor profundidad de la raíz del subárbol.
        3. Mayor identificador numérico de la raíz del subárbol.
        """
        if self.raiz is None:
            return None

        candidatos = []

        def _profundidad_de(n: NodoAVL) -> int:
            prof = 0
            cur = n
            while cur.getPadre() is not None:
                prof += 1
                cur = cur.getPadre()
            return prof

        def _evaluar(nodo: Optional[NodoAVL]) -> Tuple[bool, int, List[Any], List[NodoAVL]]:
            if nodo is None:
                return True, 0, [], []

            ev = nodo.getValor()
            dt_segundos = (reloj_utc - ev.dt).total_seconds()
            dt_horas = dt_segundos / 3600.0
            condicion_propia = (getattr(ev, 'priority', 1) == 1) and (dt_horas > t_horas)

            izq_valido, tam_izq, evs_izq, nodos_izq = _evaluar(nodo.getHijoIzquierdo())
            der_valido, tam_der, evs_der, nodos_der = _evaluar(nodo.getHijoDerecho())

            es_elegible = condicion_propia and izq_valido and der_valido
            tam_total = 1 + tam_izq + tam_der
            todos_eventos = [ev] + evs_izq + evs_der
            todos_nodos = [nodo] + nodos_izq + nodos_der

            if es_elegible:
                prof = _profundidad_de(nodo)
                id_raiz = self._extraer_id(ev) or 0
                candidatos.append({
                    "nodo_raiz": nodo,
                    "eventos": todos_eventos,
                    "nodos": todos_nodos,
                    "tamano": tam_total,
                    "profundidad_raiz": prof,
                    "id_raiz": id_raiz,
                    "es_todo_el_arbol": (nodo == self.raiz)
                })

            return es_elegible, tam_total, todos_eventos, todos_nodos

        _evaluar(self.raiz)

        if not candidatos:
            return None

        # Ordenar aplicando desempate estricto: Mayor tamaño, mayor profundidad, mayor ID raíz
        candidatos.sort(key=lambda s: (s["tamano"], s["profundidad_raiz"], s["id_raiz"]), reverse=True)
        ganador = candidatos[0]

        justificacion = (
            f"Subárbol seleccionado con raíz SIS-{ganador['id_raiz']:06d} (profundidad {ganador['profundidad_raiz']}): "
            f"contiene {ganador['tamano']} nodos (todos con P=1 y antigüedad > {t_horas}h). "
            f"Criterio de desempate aplicado: tamaño={ganador['tamano']}, profundidad={ganador['profundidad_raiz']}, ID raíz={ganador['id_raiz']}."
        )
        ganador["justificacion"] = justificacion
        return ganador

    def podar_subarbol_por_nodo(self, nodo_raiz: NodoAVL) -> List[Any]:
        """
        Poda físicamente del árbol AVL el subárbol completo enraizado en nodo_raiz (Sección 10).
        En modo normal restablece el balance; en estrés conserva el orden BST.
        Sincroniza el índice por ID y retorna la lista de eventos archivados.
        """
        if nodo_raiz is None:
            return []

        # 1. Recolectar todos los nodos y eventos del subárbol
        eventos = []
        def _recolectar(n: Optional[NodoAVL]):
            if n is not None:
                eventos.append(n.getValor())
                _recolectar(n.getHijoIzquierdo())
                _recolectar(n.getHijoDerecho())
        _recolectar(nodo_raiz)

        # 2. Desconectar nodo_raiz de su padre
        padre = nodo_raiz.getPadre()
        if padre is None:
            # Se poda el árbol completo
            self.raiz = None
        else:
            if padre.getHijoIzquierdo() == nodo_raiz:
                padre.setHijoIzquierdo(None)
            else:
                padre.setHijoDerecho(None)
            nodo_raiz.setPadre(None)

        # 3. Remover del índice hash y marcar en memoria
        for ev in eventos:
            ev_id = self._extraer_id(ev)
            if ev_id is not None:
                self.indice_por_id.pop(ev_id, None)
            if hasattr(ev, 'archive'):
                ev.archive()

        # 4. Rebalancear hacia arriba según modo activo
        if padre is not None:
            if self.modo == OperationalMode.NORMAL:
                self._propagar_balanceo_hacia_arriba(padre)
            else:
                cur = padre
                while cur is not None:
                    self._actualizarAltura(cur)
                    cur = cur.getPadre()

        self._reindexar_ids()
        return eventos

    def actualizar_marcas_acceso_costoso(self, limite_l: int) -> None:
        """
        Recorre todos los nodos activos en el árbol y actualiza su costo simulado
        y marca de acceso costoso según el límite L (Sección 9).
        """
        def _visitar(nodo: Optional[NodoAVL], prof: int):
            if nodo is not None:
                ev = nodo.getValor()
                if hasattr(ev, 'actualizar_marca_acceso'):
                    ev.actualizar_marca_acceso(prof, limite_l)
                _visitar(nodo.getHijoIzquierdo(), prof + 1)
                _visitar(nodo.getHijoDerecho(), prof + 1)
        _visitar(self.raiz, 0)

    def podar_por_prioridad(self, prioridad: int) -> List[Any]:
        """
        Poda por prioridad (Mantiene compatibilidad hacia atrás).
        """
        eventos_a_podar = []
        all_events = self.recorrido_inorden()
        p_target = 1 if prioridad in (1, 3) else prioridad
        for ev in all_events:
            if hasattr(ev, 'priority'):
                if ev.priority == p_target or ev.priority == prioridad:
                    eventos_a_podar.append(ev)

        for ev in eventos_a_podar:
            if hasattr(ev, 'id'):
                self.eliminar_por_id(ev.id)
                if hasattr(ev, 'archive'):
                    ev.archive()

        return eventos_a_podar

    def recorrido_inorden(self) -> List[Any]:
        """Retorna eventos ordenados estrictamente por la Clave K / Returns events sorted strictly by Key K"""
        res = []
        def _inorden(n: Optional[NodoAVL]):
            if n is not None:
                _inorden(n.getHijoIzquierdo())
                res.append(n.getValor())
                _inorden(n.getHijoDerecho())
        _inorden(self.raiz)
        return res

    def recorrido_inverso(self) -> List[Any]:
        """
        Retorna eventos en orden inverso (claves estrictamente descendentes).
        Recorre: Subárbol Derecho -> Raíz -> Subárbol Izquierdo.
        Returns events in reverse order (strictly descending keys).
        """
        res = []
        def _inverso(n: Optional[NodoAVL]):
            if n is not None:
                _inverso(n.getHijoDerecho())
                res.append(n.getValor())
                _inverso(n.getHijoIzquierdo())
        _inverso(self.raiz)
        return res

    def obtener_metricas_nodo(self, event_id: int) -> Optional[Dict[str, Any]]:
        """
        Calcula las métricas estructurales del nodo asociado a event_id:
        - profundidad_nodo: Distancia (número de aristas) desde la raíz hasta el nodo.
        - altura_nodo: Altura del subárbol en este nodo.
        - factor_balance: Factor de balance (h_izq - h_der).
        - es_raiz: Si el nodo es la raíz del árbol.
        """
        nodo = self.buscar_por_id(event_id)
        if nodo is None:
            return None

        # Calcular profundidad subiendo por los padres hasta la raíz
        profundidad = 0
        actual = nodo
        while actual.getPadre() is not None:
            profundidad += 1
            actual = actual.getPadre()

        fb = self._calcularFactorDeBalanceo(nodo)
        h = nodo.getAltura()
        ev = nodo.getValor()

        return {
            "profundidad_nodo": profundidad,
            "altura_nodo": h,
            "factor_balance": fb,
            "es_raiz": nodo == self.raiz,
            "costo_simulado": profundidad + 1,
            "acceso_costoso": getattr(ev, 'acceso_costoso', False),
            "tiene_hijo_izquierdo": nodo.getHijoIzquierdo() is not None,
            "tiene_hijo_derecho": nodo.getHijoDerecho() is not None
        }

    def to_dict_jerarquico(self) -> Optional[Dict[str, Any]]:
        """
        Retorna la estructura jerárquica recursiva del árbol para renderizado gráfico.
        Returns recursive hierarchical structure of tree for visual rendering.
        """
        if self.raiz is None:
            return None
        return self._nodo_to_dict(self.raiz)

    def _nodo_to_dict(self, nodo: Optional[NodoAVL]) -> Optional[Dict[str, Any]]:
        if nodo is None:
            return None
        fb = self._calcularFactorDeBalanceo(nodo)
        ev = nodo.getValor()
        ev_dict = ev.to_dict() if hasattr(ev, 'to_dict') else str(ev)
        
        return {
            "valor": ev_dict,
            "altura": nodo.getAltura(),
            "factor_balanceo": fb,
            "relacion_izquierda": "MENOR (<)",
            "relacion_derecha": "MAYOR (>)",
            "hijo_izquierdo": self._nodo_to_dict(nodo.getHijoIzquierdo()),
            "hijo_derecho": self._nodo_to_dict(nodo.getHijoDerecho())
        }

    def imprimir_arbol(self) -> str:
        """
        Genera una representación visual en texto del árbol AVL indicando
        explícitamente qué nodos son MENORES (izquierda <) y MAYORES (derecha >).
        """
        if self.raiz is None:
            return "Árbol AVL Vacío (0 nodos)"

        lineas: List[str] = []

        def _recorrer(nodo: Optional[NodoAVL], prefijo: str = "", es_izq: Optional[bool] = None) -> None:
            if nodo is None:
                return

            etiqueta = "RAIZ" if es_izq is None else ("<- [IZQ: MENOR (<)]" if es_izq else "[DER: MAYOR (>)] ->")
            ev = nodo.getValor()
            clave_str = str(getattr(ev, 'composite_key', ev))
            mag_str = f"Mag: {getattr(ev, 'magnitude', getattr(ev, 'magnitud', '?'))} M"
            info = f"{prefijo}{etiqueta}: {clave_str} | {mag_str} (h={nodo.getAltura()}, FB={self._calcularFactorDeBalanceo(nodo)})"
            lineas.append(info)

            h_izq = nodo.getHijoIzquierdo()
            h_der = nodo.getHijoDerecho()
            if h_izq or h_der:
                if h_izq:
                    _recorrer(h_izq, prefijo + "   |-- ", True)
                else:
                    lineas.append(prefijo + "   |-- <- [IZQ: MENOR (<)]: (Vacio)")

                if h_der:
                    _recorrer(h_der, prefijo + "   \\-- ", False)
                else:
                    lineas.append(prefijo + "   \\-- [DER: MAYOR (>)] ->: (Vacio)")

        _recorrer(self.raiz)
        resultado = "\n".join(lineas)
        return resultado

    def contar_nodos(self) -> int:
        """Cuenta el total de nodos / Counts total nodes"""
        return len(self.recorrido_inorden())

    def obtener_altura(self) -> int:
        """Retorna la altura de la raíz / Returns root height"""
        return self._altura(self.raiz)

    def es_avl_valido(self) -> Tuple[bool, str]:
        """
        Verifica que el factor de balanceo |FB| <= 1 en todos los nodos.
        Checks that balance factor |FB| <= 1 on all nodes.
        """
        def _verificar(nodo: Optional[NodoAVL]) -> Tuple[bool, str]:
            if nodo is None:
                return True, "OK"
            fb = self._calcularFactorDeBalanceo(nodo)
            if abs(fb) > 1:
                event_str = str(getattr(nodo.getValor(), 'id', nodo.getValor()))
                return False, f"Nodo {event_str} desbalanceado con FB={fb}"
            izq_val, msg_i = _verificar(nodo.getHijoIzquierdo())
            if not izq_val: return False, msg_i
            return _verificar(nodo.getHijoDerecho())

        return _verificar(self.raiz)

    # --------------------------------------------------
    # RECORRIDOS COMPLETOS E INDICADORES (SECCIÓN 14)
    # --------------------------------------------------
    def contar_hojas(self) -> int:
        """Retorna el número de nodos hoja (sin hijos) en el AVL"""
        def _hojas(nodo: Optional[NodoAVL]) -> int:
            if nodo is None:
                return 0
            if nodo.getHijoIzquierdo() is None and nodo.getHijoDerecho() is None:
                return 1
            return _hojas(nodo.getHijoIzquierdo()) + _hojas(nodo.getHijoDerecho())
        return _hojas(self.raiz)

    def recorrido_preorden(self) -> List[Any]:
        """Recorrido Pre-Orden (Raíz, Izquierda, Derecha)"""
        res = []
        def _pre(n: Optional[NodoAVL]):
            if n is not None:
                res.append(n.getValor())
                _pre(n.getHijoIzquierdo())
                _pre(n.getHijoDerecho())
        _pre(self.raiz)
        return res

    def recorrido_postorden(self) -> List[Any]:
        """Recorrido Post-Orden (Izquierda, Derecha, Raíz)"""
        res = []
        def _post(n: Optional[NodoAVL]):
            if n is not None:
                _post(n.getHijoIzquierdo())
                _post(n.getHijoDerecho())
                res.append(n.getValor())
        _post(self.raiz)
        return res

    def recorrido_por_niveles(self) -> List[Any]:
        """Recorrido por Niveles / BFS (Amplitud)"""
        if self.raiz is None:
            return []
        res = []
        cola = [self.raiz]
        while cola:
            cur = cola.pop(0)
            res.append(cur.getValor())
            if cur.getHijoIzquierdo():
                cola.append(cur.getHijoIzquierdo())
            if cur.getHijoDerecho():
                cola.append(cur.getHijoDerecho())
        return res

    # --------------------------------------------------
    # CONSULTAS ESPECIALIZADAS Y DESEMPEÑO (SECCIÓN 11)
    # --------------------------------------------------
    def consultar_primeros_k_pendientes(self, k: int) -> Tuple[List[Any], int]:
        """
        Retorna los primeros k eventos pendientes de atención en orden descendente de K.
        k es entero positivo. Si hay menos pendientes, retorna todos los disponibles.
        Reporta el número exacto de nodos examinados.
        Justificación de poda: Realiza un recorrido inverso (Derecha -> Raíz -> Izquierda).
        Tan pronto como se recolectan k eventos pendientes, se detiene la recursión,
        descartando examinar las ramas restantes con claves menores.
        """
        if k <= 0 or self.raiz is None:
            return [], 0

        resultados = []
        nodos_visitados = 0

        def _recorrer_descendente(nodo: Optional[NodoAVL]):
            nonlocal nodos_visitados
            if nodo is None or len(resultados) >= k:
                return

            _recorrer_descendente(nodo.getHijoDerecho())

            if len(resultados) >= k:
                return

            nodos_visitados += 1
            ev = nodo.getValor()
            estado = getattr(ev, 'estado_atencion', 'Pendiente')
            if estado == 'Pendiente':
                resultados.append(ev)

            if len(resultados) >= k:
                return

            _recorrer_descendente(nodo.getHijoIzquierdo())

        _recorrer_descendente(self.raiz)
        return resultados, nodos_visitados

    def consultar_por_rango_magnitud(self, m_min: float, m_max: float) -> Tuple[List[Any], int, str]:
        """
        Retorna todos los eventos activos con magnitud en el intervalo inclusivo [m_min, m_max].
        Reporta la cantidad de nodos examinados y la justificación algorítmica.
        """
        if self.raiz is None:
            return [], 0, "Árbol vacío; 0 nodos examinados."

        resultados = []
        nodos_visitados = 0

        def _buscar(nodo: Optional[NodoAVL]):
            nonlocal nodos_visitados
            if nodo is None:
                return

            _buscar(nodo.getHijoIzquierdo())

            nodos_visitados += 1
            ev = nodo.getValor()
            mag = getattr(ev, 'magnitude', getattr(ev, 'magnitud', None))
            if mag is not None and m_min <= mag <= m_max:
                resultados.append(ev)

            _buscar(nodo.getHijoDerecho())

        _buscar(self.raiz)
        justificacion = (
            f"Búsqueda por rango de magnitud [{m_min}, {m_max}]. Como K=(P, M, I) ordena "
            f"primero por prioridad P y luego por magnitud M, se examinaron {nodos_visitados} nodos."
        )
        return resultados, nodos_visitados, justificacion

    def consultar_por_profundidad_y_fechas(self, h_max: float, t_inicio: str, t_fin: str) -> Tuple[List[Any], int]:
        """
        Eventos con profundidad H <= h_max dentro del intervalo inclusivo de fechas [t_inicio, t_fin].
        Reporta la cantidad de nodos examinados.
        """
        if self.raiz is None:
            return [], 0

        resultados = []
        nodos_visitados = 0

        for ev in self.recorrido_inorden():
            nodos_visitados += 1
            prof = getattr(ev, 'depth', getattr(ev, 'profundidad', None))
            ts = getattr(ev, 'timestamp', None)
            if prof is not None and prof <= h_max:
                if ts is not None:
                    ts_str = ts.isoformat() if hasattr(ts, 'isoformat') else str(ts)
                    t_ini_str = t_inicio.isoformat() if hasattr(t_inicio, 'isoformat') else str(t_inicio)
                    t_fin_str = t_fin.isoformat() if hasattr(t_fin, 'isoformat') else str(t_fin)
                    if t_ini_str <= ts_str <= t_fin_str:
                        resultados.append(ev)


        return resultados, nodos_visitados

    def buscar_nodo_por_clave_con_visitas(self, target_key: Any) -> Tuple[Optional[NodoAVL], int]:
        """
        Busca un nodo por clave K reportando el número exacto de nodos examinados en la ruta.
        Retorna (nodo, nodos_visitados).
        """
        visitas = 0
        actual = self.raiz
        while actual is not None:
            visitas += 1
            clave_actual = getattr(actual.getValor(), 'composite_key', actual.getValor())
            if clave_actual == target_key:
                return actual, visitas
            if target_key < clave_actual:
                actual = actual.getHijoIzquierdo()
            else:
                actual = actual.getHijoDerecho()
        return None, visitas

    # --------------------------------------------------
    # AUDITORÍA EXHAUSTIVA DE INVARIANTES (SECCIÓN 14)
    # --------------------------------------------------
    def verificar_estructura_exhaustiva(self) -> Dict[str, Any]:
        """
        Auditoría estructural exhaustiva (Sección 14).
        Comprueba:
        1. Orden global estricto por K (heredando cotas min y max de todos los ancestros).
        2. Unicidad de identificadores e indexación en indice_por_id.
        3. Consistencia de punteros (hijo.padre == nodo y raíz.padre == None).
        4. Alturas recalculadas según convención (-1 vacío, 0 hoja) y factores de balance.
        5. En modo NORMAL: |FB| <= 1. En modo ESTRÉS: informa desbalance esperado.
        Genera reporte estructurado por evento inconsistente.
        """
        errores_orden = []
        errores_punteros = []
        errores_alturas_fb = []
        desbalances_esperados_estres = []
        ids_visitados = set()
        total_analizados = 0

        if self.raiz is not None and self.raiz.getPadre() is not None:
            errores_punteros.append({
                "id": self._extraer_id(self.raiz.getValor()),
                "error": "El nodo raíz tiene un puntero a padre distinto de None."
            })

        def _auditar(nodo: Optional[NodoAVL], k_min: Any, k_max: Any) -> Tuple[int, bool]:
            nonlocal total_analizados
            if nodo is None:
                return -1, True

            total_analizados += 1
            ev = nodo.getValor()
            ev_id = self._extraer_id(ev)
            k_actual = getattr(ev, 'composite_key', ev)

            # 1. Unicidad
            if ev_id in ids_visitados:
                errores_orden.append({
                    "id": ev_id,
                    "error": f"Identificador duplicado {ev_id} detectado en el árbol."
                })
            else:
                ids_visitados.add(ev_id)

            # 2. Orden global BST
            if k_min is not None and not (k_min < k_actual):
                errores_orden.append({
                    "id": ev_id,
                    "error": f"Violación de orden global: K={k_actual} no es estrictamente mayor que el límite inferior {k_min} heredado de sus ancestros."
                })
            if k_max is not None and not (k_actual < k_max):
                errores_orden.append({
                    "id": ev_id,
                    "error": f"Violación de orden global: K={k_actual} no es estrictamente menor que el límite superior {k_max} heredado de sus ancestros."
                })

            # 3. Consistencia de punteros
            h_izq = nodo.getHijoIzquierdo()
            h_der = nodo.getHijoDerecho()
            if h_izq and h_izq.getPadre() != nodo:
                errores_punteros.append({
                    "id": ev_id,
                    "hijo_izq_id": self._extraer_id(h_izq.getValor()),
                    "error": "Puntero padre del hijo izquierdo no apunta al nodo actual."
                })
            if h_der and h_der.getPadre() != nodo:
                errores_punteros.append({
                    "id": ev_id,
                    "hijo_der_id": self._extraer_id(h_der.getValor()),
                    "error": "Puntero padre del hijo derecho no apunta al nodo actual."
                })

            # Recorrer hijos
            alt_izq, _ = _auditar(h_izq, k_min, k_actual)
            alt_der, _ = _auditar(h_der, k_actual, k_max)

            # 4. Altura y FB recalculados
            alt_calculada = 1 + max(alt_izq, alt_der)
            fb_calculado = alt_izq - alt_der

            if nodo.getAltura() != alt_calculada:
                errores_alturas_fb.append({
                    "id": ev_id,
                    "altura_almacenada": nodo.getAltura(),
                    "altura_recalculada": alt_calculada,
                    "error": f"Altura almacenada ({nodo.getAltura()}) no coincide con la recalculada ({alt_calculada})."
                })

            if self.modo == OperationalMode.NORMAL:
                if abs(fb_calculado) > 1:
                    errores_alturas_fb.append({
                        "id": ev_id,
                        "factor_balance": fb_calculado,
                        "error": f"Desbalance ilegal en Modo NORMAL (|FB|={abs(fb_calculado)} > 1)."
                    })
            else:
                if abs(fb_calculado) > 1:
                    desbalances_esperados_estres.append({
                        "id": ev_id,
                        "factor_balance": fb_calculado,
                        "nota": f"Desbalance esperado en Modo ESTRÉS (FB={fb_calculado}). Pendiente de rebalanceo diferido."
                    })

            return alt_calculada, True

        _auditar(self.raiz, None, None)

        es_valido = len(errores_orden) == 0 and len(errores_punteros) == 0 and len(errores_alturas_fb) == 0

        if es_valido:
            reporte = (
                f"Estructura 100% válida. Total nodos analizados: {total_analizados}. "
                f"Modo: {self.modo.value}. Orden global BST e invariantes de altura verificadas sin errores."
            )
            if self.modo == OperationalMode.STRESS and desbalances_esperados_estres:
                reporte += f" Nodos con desbalance diferido: {len(desbalances_esperados_estres)}."
        else:
            reporte = (
                f"Inconsistencias detectadas ({len(errores_orden) + len(errores_punteros) + len(errores_alturas_fb)} errores). "
                f"Orden: {len(errores_orden)}, Punteros: {len(errores_punteros)}, Alturas/FB: {len(errores_alturas_fb)}."
            )

        return {
            "valido": es_valido,
            "es_avl_valido": es_valido,
            "orden_bst_valido": len(errores_orden) == 0,
            "punteros_reciprocos_validos": len(errores_punteros) == 0,
            "alturas_consistentes": len(errores_alturas_fb) == 0,
            "factores_balance_validos": len(errores_alturas_fb) == 0,
            "modo": self.modo.value,
            "total_eventos_analizados": total_analizados,
            "errores_orden": errores_orden,
            "errores_punteros": errores_punteros,
            "errores_alturas_fb": errores_alturas_fb,
            "desbalances_esperados_estres": desbalances_esperados_estres,
            "reporte": reporte
        }


    # --------------------------------------------------
    # PERSISTENCIA Y RECONSTRUCCIÓN TOPOLÓGICA (SECCIÓN 12)
    # --------------------------------------------------
    def exportar_topologia_dict(self) -> Dict[str, Any]:
        """
        Exporta la topología explícita del árbol AVL (Sección 12) incluyendo
        referencias a enlaces izquierdo y derecho, alturas y factores de balance.
        """
        if self.raiz is None:
            return {"raiz_id": None, "nodos": [], "total_nodos": 0, "modo": self.modo.value}

        nodos_dict = []
        for ev in self.recorrido_por_niveles():
            nid = self._extraer_id(ev)
            nodo_avl = self.buscar_por_id(nid)
            if nodo_avl:
                izq_id = self._extraer_id(nodo_avl.getHijoIzquierdo().getValor()) if nodo_avl.getHijoIzquierdo() else None
                der_id = self._extraer_id(nodo_avl.getHijoDerecho().getValor()) if nodo_avl.getHijoDerecho() else None
                nodos_dict.append({
                    "id": nid,
                    "evento": ev.to_dict() if hasattr(ev, 'to_dict') else str(ev),
                    "altura": nodo_avl.getAltura(),
                    "factor_balance": self._calcularFactorDeBalanceo(nodo_avl),
                    "hijo_izquierdo_id": izq_id,
                    "hijo_derecho_id": der_id
                })

        return {
            "raiz_id": self._extraer_id(self.raiz.getValor()),
            "total_nodos": len(nodos_dict),
            "modo": self.modo.value,
            "altura_arbol": self.obtener_altura(),
            "nodos": nodos_dict
        }

    def construir_desde_topologia(self, datos_topologia: Dict[str, Any], permitir_desbalance: bool = False) -> Tuple[bool, List[str], Optional[NodoAVL]]:
        """
        Reconstruye la topología enlazando punteros directamente (sin reinserciones) (Sección 12).
        Valida:
        - Unicidad de IDs y existencia de la raíz.
        - Ausencia de ciclos.
        - Cada nodo activo pertenece a una sola posición.
        - Orden global BST estricto.
        - Alturas y factores de balance.
        - Si está desbalanceado y permitir_desbalance es False, retorna error.
        Retorna (exito, lista_de_errores, nueva_raiz).
        """
        errores = []
        raiz_id = datos_topologia.get("raiz_id") or datos_topologia.get("raiz")
        nodos_raw = datos_topologia.get("nodos")


        if raiz_id is None and not nodos_raw:
            self.raiz = None
            self.indice_por_id.clear()
            return True, [], None

        if raiz_id is not None and not nodos_raw:
            errores.append(f"Raíz especificada ({raiz_id}) pero no existen nodos en la topología.")
            return False, errores, None

        if isinstance(nodos_raw, dict):
            nodos_raw = list(nodos_raw.values())
        elif not isinstance(nodos_raw, list):
            errores.append("La estructura 'nodos' debe ser una lista.")
            return False, errores, None

        nodos_map: Dict[int, Dict[str, Any]] = {}

        for item in nodos_raw:
            nid = item.get("id")
            if nid in nodos_map:
                errores.append(f"Identificador duplicado {nid} en la lista de nodos.")
            nodos_map[nid] = item

        if raiz_id not in nodos_map:
            errores.append(f"El nodo raíz especificado (ID {raiz_id}) no existe en la lista de nodos.")
            return False, errores, None

        from src.domain.entities.seismic_event import SeismicEvent
        from src.domain.value_objects.coordinates import CartesianCoordinates

        nodos_instanciados: Dict[int, NodoAVL] = {}
        for nid, item in nodos_map.items():
            ev_data = item.get("evento", {})
            try:
                x = float(ev_data.get("x", ev_data.get("coordenadas", {}).get("x", 500.0)))
                y = float(ev_data.get("y", ev_data.get("coordenadas", {}).get("y", 500.0)))
                coords = CartesianCoordinates(x, y)
                ev = SeismicEvent(
                    event_id=ev_data.get("id", nid),
                    magnitude=float(ev_data.get("magnitud", ev_data.get("magnitude", 5.0))),
                    depth=float(ev_data.get("profundidad", ev_data.get("depth", 10.0))),
                    coordinates=coords,
                    station_id=str(ev_data.get("estacion", ev_data.get("station_id", "EST-DEFAULT"))),
                    is_populated_zone=bool(ev_data.get("zona_poblada", ev_data.get("is_populated_zone", False))),
                    timestamp=ev_data.get("timestamp"),
                    estado_atencion=ev_data.get("estado_atencion", "Pendiente"),
                    revision=int(ev_data.get("revision", 1))
                )
                p_almacenada = ev_data.get("prioridad")
                if p_almacenada is not None and p_almacenada != ev.priority:
                    errores.append(f"Prioridad inconsistente en evento {nid}: almacenada={p_almacenada}, calculada={ev.priority}.")

                nodo = NodoAVL(ev)
                nodo.setAltura(item.get("altura", 0))
                nodos_instanciados[nid] = nodo
            except Exception as e:
                errores.append(f"Error instanciando evento {nid}: {str(e)}")


        if errores:
            return False, errores, None

        padres_asignados: Dict[int, int] = {}
        for nid, item in nodos_map.items():
            nodo = nodos_instanciados[nid]
            izq_id = item.get("hijo_izquierdo_id")
            der_id = item.get("hijo_derecho_id")

            if izq_id is not None:
                if izq_id not in nodos_instanciados:
                    errores.append(f"Nodo {nid} referencia hijo izquierdo inexistente {izq_id}.")
                elif izq_id in padres_asignados:
                    errores.append(f"Ciclo o nodo compartido: el nodo {izq_id} ya tenía padre {padres_asignados[izq_id]} y ahora es asignado a {nid}.")
                else:
                    h_izq = nodos_instanciados[izq_id]
                    nodo.setHijoIzquierdo(h_izq)
                    h_izq.setPadre(nodo)
                    padres_asignados[izq_id] = nid

            if der_id is not None:
                if der_id not in nodos_instanciados:
                    errores.append(f"Nodo {nid} referencia hijo derecho inexistente {der_id}.")
                elif der_id in padres_asignados:
                    errores.append(f"Ciclo o nodo compartido: el nodo {der_id} ya tenía padre {padres_asignados[der_id]} y ahora es asignado a {nid}.")
                else:
                    h_der = nodos_instanciados[der_id]
                    nodo.setHijoDerecho(h_der)
                    h_der.setPadre(nodo)
                    padres_asignados[der_id] = nid

        if errores:
            return False, errores, None

        nueva_raiz = nodos_instanciados[raiz_id]

        def _validar_arbol(n: Optional[NodoAVL], k_min: Any, k_max: Any) -> Tuple[int, bool]:
            if n is None:
                return -1, True
            k = n.getValor().composite_key
            nid = n.getValor().id
            if k_min is not None and not (k_min < k):
                errores.append(f"Violación de orden BST en nodo {nid}: K={k} no es mayor que cota inferior {k_min}.")
            if k_max is not None and not (k < k_max):
                errores.append(f"Violación de orden BST en nodo {nid}: K={k} no es menor que cota superior {k_max}.")

            alt_izq, _ = _validar_arbol(n.getHijoIzquierdo(), k_min, k)
            alt_der, _ = _validar_arbol(n.getHijoDerecho(), k, k_max)

            alt_real = 1 + max(alt_izq, alt_der)
            fb_real = alt_izq - alt_der

            if n.getAltura() != alt_real:
                errores.append(f"Altura inválida en nodo {nid}: almacenada={n.getAltura()}, real={alt_real}.")

            if abs(fb_real) > 1 and not permitir_desbalance:
                errores.append(f"Topología desbalanceada (|FB|={abs(fb_real)} > 1) en nodo {nid}. Requiere modo ESTRÉS para ser cargada.")

            return alt_real, True

        _validar_arbol(nueva_raiz, None, None)

        if errores:
            return False, errores, None

        self.raiz = nueva_raiz
        self.indice_por_id = {nid: nodo for nid, nodo in nodos_instanciados.items()}
        
        # Evaluar si la topología cargada tiene desbalance
        hay_desbalance = False
        for n in nodos_instanciados.values():
            h_izq = n.getHijoIzquierdo().getAltura() if n.getHijoIzquierdo() else -1
            h_der = n.getHijoDerecho().getAltura() if n.getHijoDerecho() else -1
            if abs(h_izq - h_der) > 1:
                hay_desbalance = True
                break

        self.modo = OperationalMode.STRESS if hay_desbalance else OperationalMode.NORMAL

        return True, [], nueva_raiz

