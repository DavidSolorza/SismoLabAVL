# -*- coding: utf-8 -*-
"""
Queue Data Structure (Cola FIFO) / Estructura de Datos Cola
SismoLab AVL - Universidad de Caldas

Utilizada para la cola de recepción de reportes sísmicos en `procesar_reporte`.
Used for receiving telemetry reports in `procesar_reporte`.
"""

from typing import Generic, TypeVar, List, Optional
from src.core.errors.exceptions import EmptyStructureException

T = TypeVar('T')

class Queue(Generic[T]):
    """
    Estructura de Datos Cola FIFO (First-In, First-Out)
    FIFO (First-In, First-Out) Queue Data Structure
    """
    def __init__(self):
        self._items: List[T] = []

    def enqueue(self, item: T) -> None:
        """Encola un elemento al final / Enqueues an item at the end"""
        self._items.append(item)

    def dequeue(self) -> T:
        """
        Desencola el primer elemento / Dequeues the first item
        Raises EmptyStructureException if empty.
        """
        if self.is_empty():
            raise EmptyStructureException("Cola (Queue)")
        return self._items.pop(0)

    def peek(self) -> Optional[T]:
        """Observa el frente de la cola / Peeks front item"""
        if self.is_empty():
            return None
        return self._items[0]

    def is_empty(self) -> bool:
        """Verifica si la cola está vacía / Checks if queue is empty"""
        return len(self._items) == 0

    def size(self) -> int:
        """Retorna el número de elementos / Returns number of items"""
        return len(self._items)

    def clear(self) -> None:
        """Limpia la cola / Clears queue"""
        self._items.clear()

    def __len__(self) -> int:
        return self.size()

    def __repr__(self) -> str:
        return f"Cola(tamano={self.size()})"
