# -*- coding: utf-8 -*-
"""
BST (Binary Search Tree) Data Structure / Árbol Binario de Búsqueda
SismoLab AVL - Universidad de Caldas

Basado estrictamente en la implementación de 1_árbol_bst.py con soporte para la Clave Compuesta K=(P,M,I)
y entidades sísmicas. Permite benchmarking comparativo con el Árbol AVL.
Strictly based on 1_árbol_bst.py implementation with support for Composite Key K=(P,M,I)
and seismic entities. Enables comparative benchmarking against AVL Tree.
"""

from typing import Optional, List, Any

class NodoBST:
    """
    Clase Nodo para el Árbol BST / BST Node Class
    Basado en Nodo de 1_árbol_bst.py / Based on Nodo from 1_árbol_bst.py
    """
    def __init__(self, valor: Any):
        self.valor = valor
        self.hijoIzquierdo: Optional['NodoBST'] = None
        self.hijoDerecho: Optional['NodoBST'] = None
        self.padre: Optional['NodoBST'] = None

    def getValor(self) -> Any:
        return self.valor

    def setValor(self, valor: Any) -> None:
        self.valor = valor

    def getHijoIzquierdo(self) -> Optional['NodoBST']:
        return self.hijoIzquierdo

    def setHijoIzquierdo(self, nodo: Optional['NodoBST']) -> None:
        self.hijoIzquierdo = nodo

    def getHijoDerecho(self) -> Optional['NodoBST']:
        return self.hijoDerecho

    def setHijoDerecho(self, nodo: Optional['NodoBST']) -> None:
        self.hijoDerecho = nodo

    def getPadre(self) -> Optional['NodoBST']:
        return self.padre

    def setPadre(self, nodo: Optional['NodoBST']) -> None:
        self.padre = nodo


class ArbolBST:
    """
    Clase ArbolBST para almacenar información ordenada / BST Tree Class
    Basado en ArbolBST de 1_árbol_bst.py / Based on ArbolBST from 1_árbol_bst.py
    """
    def __init__(self):
        self.raiz: Optional[NodoBST] = None

    # --------------------------------------------------
    # INSERTAR / INSERT
    # --------------------------------------------------
    def insertar(self, dato: Any) -> bool:
        """
        Método público de insertar / Public insert method
        """
        nodo = NodoBST(dato)

        if self.raiz is None:
            self.raiz = nodo
            nodo.setPadre(None)
            return True
        else:
            return self._insertar(nodo, self.raiz)

    def _insertar(self, nodo: NodoBST, raizActual: NodoBST) -> bool:
        """
        Método privado recursivo de insertar / Private recursive insert method
        """
        # Extraer clave para comparación / Extract key for comparison
        clave_nodo = getattr(nodo.getValor(), 'composite_key', nodo.getValor())
        clave_actual = getattr(raizActual.getValor(), 'composite_key', raizActual.getValor())

        if clave_actual == clave_nodo:
            return False  # No duplicados / No duplicates

        if clave_nodo < clave_actual:
            izq = raizActual.getHijoIzquierdo()
            if izq is None:
                raizActual.setHijoIzquierdo(nodo)
                nodo.setPadre(raizActual)
                return True
            else:
                return self._insertar(nodo, izq)
        else:
            der = raizActual.getHijoDerecho()
            if der is None:
                raizActual.setHijoDerecho(nodo)
                nodo.setPadre(raizActual)
                return True
            else:
                return self._insertar(nodo, der)

    # --------------------------------------------------
    # BUSCAR / SEARCH
    # --------------------------------------------------
    def buscar(self, clave_o_dato: Any) -> Optional[NodoBST]:
        """
        Método público de buscar / Public search method
        """
        if self.raiz is None:
            return None
        return self._buscar(clave_o_dato, self.raiz)

    def _buscar(self, clave_o_dato: Any, raizActual: NodoBST) -> Optional[NodoBST]:
        """
        Método privado recursivo de buscar / Private recursive search method
        """
        if raizActual is None:
            return None

        # Si se busca por ID entero / If searching by integer ID
        if isinstance(clave_o_dato, int):
            ev = raizActual.getValor()
            if hasattr(ev, 'id') and ev.id == clave_o_dato:
                return raizActual
            
            izq = self._buscar(clave_o_dato, raizActual.getHijoIzquierdo()) if raizActual.getHijoIzquierdo() else None
            if izq is not None:
                return izq
            return self._buscar(clave_o_dato, raizActual.getHijoDerecho()) if raizActual.getHijoDerecho() else None

        clave_actual = getattr(raizActual.getValor(), 'composite_key', raizActual.getValor())
        target_key = getattr(clave_o_dato, 'composite_key', clave_o_dato)

        if target_key == clave_actual:
            return raizActual

        if target_key < clave_actual:
            izq = raizActual.getHijoIzquierdo()
            if izq is None:
                return None
            return self._buscar(clave_o_dato, izq)
        else:
            der = raizActual.getHijoDerecho()
            if der is None:
                return None
            return self._buscar(clave_o_dato, der)

    # --------------------------------------------------
    # ELIMINAR / DELETE
    # --------------------------------------------------
    def eliminar(self, clave_o_dato: Any) -> bool:
        """
        Método público de eliminar / Public delete method
        """
        if self.raiz is None:
            return False

        nodo = self.buscar(clave_o_dato)
        if nodo is None:
            return False

        self._eliminar(nodo)
        return True

    def _eliminar(self, nodo: NodoBST) -> None:
        """
        Método privado de eliminar con 3 casos / Private delete method handling 3 cases
        """
        # CASO 1: Es una hoja / Is a leaf
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
            return

        # CASO 2: Solamente tiene hijo derecho / Only has right child
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
            return

        # CASO 2: Solamente tiene hijo izquierdo / Only has left child
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
            return

        # CASO 3: El nodo tiene dos hijos (usar predecesor) / Has two children (use predecessor)
        predecesor = self._getPredecesor(nodo)
        nodo.setValor(predecesor.getValor())
        self._eliminar(predecesor)

    def _getPredecesor(self, nodo: NodoBST) -> NodoBST:
        """Retorna el mayor nodo del subárbol izquierdo / Returns max node of left subtree"""
        actual = nodo.getHijoIzquierdo()
        while actual.getHijoDerecho() is not None:
            actual = actual.getHijoDerecho()
        return actual

    # --------------------------------------------------
    # RECORRIDOS / TRAVERSALS
    # --------------------------------------------------
    def anchura(self) -> List[NodoBST]:
        """Recorrido por Niveles / BFS Traversal"""
        if self.raiz is None:
            return []
        cola = [self.raiz]
        recorrido = []
        while len(cola) > 0:
            nodo = cola.pop(0)
            recorrido.append(nodo)
            if nodo.getHijoIzquierdo() is not None:
                cola.append(nodo.getHijoIzquierdo())
            if nodo.getHijoDerecho() is not None:
                cola.append(nodo.getHijoDerecho())
        return recorrido

    def inorden(self) -> List[Any]:
        """Recorrido Inorden / In-order Traversal"""
        resultado = []
        def _inorden(nodo: Optional[NodoBST]):
            if nodo is not None:
                _inorden(nodo.getHijoIzquierdo())
                resultado.append(nodo.getValor())
                _inorden(nodo.getHijoDerecho())
        _inorden(self.raiz)
        return resultado

    def obtener_altura(self) -> int:
        """Calcula la altura del árbol BST / Calculates BST height"""
        def _alt(nodo: Optional[NodoBST]) -> int:
            if nodo is None:
                return -1
            return 1 + max(_alt(nodo.getHijoIzquierdo()), _alt(nodo.getHijoDerecho()))
        return _alt(self.raiz)
