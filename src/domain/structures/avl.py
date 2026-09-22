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

    def _calcularFactorDeBalanceo(self, nodo: NodoAVL) -> int:
        """
        Calcula el Factor de Balanceo FB = hIzq - hDer
        Calculates Balance Factor FB = hLeft - hRight
        """
        if nodo is None:
            return 0
        hIzq = self._altura(nodo.getHijoIzquierdo())
        hDer = self._altura(nodo.getHijoDerecho())
        return hIzq - hDer

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
                # Rotación simple a la derecha (LL)
                return self._giroSimpleDerecha(nodo)
            else:
                # Rotación doble Izquierda-Derecha (LR)
                nodo.setHijoIzquierdo(self._giroSimpleIzquierda(nodo.getHijoIzquierdo()))
                return self._giroSimpleDerecha(nodo)

        # Caso RR: Desbalance a la derecha, hijo derecho pesado a la derecha (FB < -1 y FB_hijo <= 0)
        if fb < -1:
            fb_hijo_der = self._calcularFactorDeBalanceo(nodo.getHijoDerecho())
            if fb_hijo_der <= 0:
                # Rotación simple a la izquierda (RR)
                return self._giroSimpleIzquierda(nodo)
            else:
                # Rotación doble Derecha-Izquierda (RL)
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
        Balancea todo el árbol recursivamente post Modo Estrés.
        Recursively balances the entire tree post Stress Mode.
        """
        def _balancear_subarbol(nodo: Optional[NodoAVL]) -> Optional[NodoAVL]:
            if nodo is None:
                return None
            nodo.setHijoIzquierdo(_balancear_subarbol(nodo.getHijoIzquierdo()))
            nodo.setHijoDerecho(_balancear_subarbol(nodo.getHijoDerecho()))
            return self._rebalancear_nodo(nodo)

        self.raiz = _balancear_subarbol(self.raiz)
        self._nodos_desbalanceados.clear()
        self._reindexar_ids()

    def podar_por_prioridad(self, prioridad_minima: int) -> List[Any]:
        """
        Poda y archiva todos los eventos con prioridad P >= prioridad_minima (ej. P=3 es baja prioridad).
        Prunes and archives all events with priority P >= prioridad_minima.
        Returns list of pruned event values.
        """
        eventos_a_podar = []
        all_events = self.recorrido_inorden()
        for ev in all_events:
            if hasattr(ev, 'priority') and ev.priority >= prioridad_minima:
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
