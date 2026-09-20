# -*- coding: utf-8 -*-
"""
Stack Data Structure (Pila LIFO) / Estructura de Datos Pila
SismoLab AVL - Universidad de Caldas

Utilizada para la pila de deshacer (Undo Stack) en el slice vertical `deshacer_accion`.
Used for the Undo Stack in the vertical slice `deshacer_accion`.
"""

from typing import Generic, TypeVar, List, Optional
from src.core.errors.exceptions import EmptyStructureException

T = TypeVar('T')

class Stack(Generic[T]):
    """
    Estructura de Datos Pila LIFO (Last-In, First-Out)
    LIFO (Last-In, First-Out) Stack Data Structure
    """
    def __init__(self):
        self._items: List[T] = []

    def push(self, item: T) -> None:
        """Apila un elemento / Pushes an item onto the stack"""
        self._items.append(item)

    def pop(self) -> T:
        """
        Desapila el elemento superior / Pops top item
        Raises EmptyStructureException if empty.
        """
        if self.is_empty():
            raise EmptyStructureException("Pila (Stack)")
        return self._items.pop()

    def peek(self) -> Optional[T]:
        """Observa el elemento superior sin desapilar / Peeks top item"""
        if self.is_empty():
            return None
        return self._items[-1]

    def is_empty(self) -> bool:
        """Verifica si la pila está vacía / Checks if stack is empty"""
        return len(self._items) == 0

    def size(self) -> int:
        """Retorna el tamaño de la pila / Returns stack size"""
        return len(self._items)

    def clear(self) -> None:
        """Limpia la pila / Clears stack"""
        self._items.clear()

    def __len__(self) -> int:
        return self.size()

    def __repr__(self) -> str:
        return f"Pila(tamano={self.size()})"
