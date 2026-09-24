# -*- coding: utf-8 -*-
"""
Queue Data Structure (Cola FIFO) / Estructura de Datos Cola
SismoLab AVL - Universidad de Caldas

Utilizada para la cola de recepción de reportes sísmicos en `procesar_reporte`.
Used for receiving telemetry reports in `procesar_reporte`.
"""

from typing import Generic, TypeVar, Optional
from src.core.errors.exceptions import EmptyStructureException

T = TypeVar('T')

class NodoCola(Generic[T]):
    """
    Nodo de la Cola Simplemente Enlazada / Singly-Linked Queue Node
    """
    def __init__(self, valor: T):
        self.valor: T = valor
        self.siguiente: Optional['NodoCola[T]'] = None


class Queue(Generic[T]):
    """
    Estructura de Datos Cola FIFO (First-In, First-Out)
    FIFO (First-In, First-Out) Queue Data Structure

    Implementada mediante Lista Simplemente Enlazada con punteros al Frente y al Final.
    Garantiza costo constante estricto O(1) tanto para enqueue() como para dequeue(),
    eliminando la sobrecarga O(N) de list.pop(0).
    """
    def __init__(self):
        self._frente: Optional[NodoCola[T]] = None
        self._final: Optional[NodoCola[T]] = None
        self._tamano: int = 0

    def prepend(self, item: T) -> None:
        """
        Inserta un elemento al frente de la cola en O(1).
        Utilizado para restaurar la posición original en operaciones de Deshacer (Undo).
        """
        nuevo = NodoCola(item)
        if self._frente is None:
            self._frente = nuevo
            self._final = nuevo
        else:
            nuevo.siguiente = self._frente
            self._frente = nuevo
        self._tamano += 1

    def enqueue(self, item: T) -> None:
        """
        Encola un elemento al final en tiempo O(1) / Enqueues an item at the end in O(1)
        """
        nuevo = NodoCola(item)
        if self._final is None:
            self._frente = nuevo
            self._final = nuevo
        else:
            self._final.siguiente = nuevo
            self._final = nuevo
        self._tamano += 1

    def dequeue(self) -> T:
        """
        Desencola el primer elemento en tiempo O(1) / Dequeues front item in O(1)
        Raises EmptyStructureException if empty.
        """
        if self.is_empty():
            raise EmptyStructureException("Cola (Queue)")
        assert self._frente is not None
        valor = self._frente.valor
        self._frente = self._frente.siguiente
        if self._frente is None:
            self._final = None
        self._tamano -= 1
        return valor

    def peek(self) -> Optional[T]:
        """
        Observa el frente de la cola en tiempo O(1) / Peeks front item in O(1)
        """
        if self.is_empty() or self._frente is None:
            return None
        return self._frente.valor

    def is_empty(self) -> bool:
        """
        Verifica si la cola está vacía en tiempo O(1) / Checks if queue is empty in O(1)
        """
        return self._tamano == 0

    def size(self) -> int:
        """
        Retorna el número de elementos en tiempo O(1) / Returns number of items in O(1)
        """
        return self._tamano

    def clear(self) -> None:
        """
        Limpia la cola en tiempo O(1) / Clears queue in O(1)
        """
        self._frente = None
        self._final = None
        self._tamano = 0

    def __len__(self) -> int:
        return self.size()

    def __repr__(self) -> str:
        return f"Cola(tamano={self.size()})"
