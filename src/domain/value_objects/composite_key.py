# -*- coding: utf-8 -*-
"""
Composite Key Value Object / Objeto de Valor Clave Compuesta K=(P, M, I)
SismoLab AVL - Universidad de Caldas

Representa la clave inmutable K = (P, M, I) utilizada para ordenar el Árbol AVL y BST.
Represents the immutable key K = (P, M, I) used to order the AVL and BST Trees.

Regla de ordenamiento / Ordering Rule:
K1 < K2 ssi:
  1. P1 < P2  (Prioridad 1 es más crítica que 2 y 3 / Priority 1 is higher priority than 2 and 3)
  2. Si P1 == P2: M1 < M2 (Menor magnitud 1.0 va a la izquierda, mayor 9.0 a la derecha)
  3. Si P1 == P2 y M1 == M2: I1 < I2 (Menor ID desempata / Smaller ID breaks ties)
"""

from typing import Dict, Any

class CompositeKeyK:
    """
    Clave Compuesta K = (P, M, I) / Composite Key K = (P, M, I)
    - P (Prioridad / Priority): int (1, 2, 3)
    - M (Magnitud / Magnitude): float (-2.0 a 10.0)
    - I (Identificador / Identifier): int (1 a 999999)
    """
    __slots__ = ('_P', '_M', '_I')

    def __init__(self, priority: int, magnitude: float, identifier: int):
        if priority not in (1, 2, 3):
            raise ValueError(f"La prioridad P debe ser 1, 2 o 3. Valor recibido: {priority} / Priority P must be 1, 2, or 3.")
        
        # Redondear magnitud a 1 decimal para consistencia sísmica
        # Round magnitude to 1 decimal place for seismic consistency
        mag_rounded = round(float(magnitude), 1)
        if mag_rounded < -2.0 or mag_rounded > 10.0:
            raise ValueError(f"La magnitud M debe estar entre -2.0 y 10.0. Valor recibido: {mag_rounded}")
            
        if not (1 <= identifier <= 999999):
            raise ValueError(f"El identificador I debe estar entre 1 y 999999. Valor recibido: {identifier}")

        self._P = priority
        self._M = mag_rounded
        self._I = identifier

    @property
    def P(self) -> int:
        """Prioridad (1=Alta, 2=Media, 3=Baja) / Priority (1=High, 2=Med, 3=Low)"""
        return self._P

    @property
    def M(self) -> float:
        """Magnitud sísmica / Seismic magnitude"""
        return self._M

    @property
    def I(self) -> int:
        """Identificador único / Unique identifier"""
        return self._I

    def formatted_id(self) -> str:
        """Formato visual / Visual string representation: SIS-XXXXXX"""
        return f"SIS-{self._I:06d}"

    def __lt__(self, other: 'CompositeKeyK') -> bool:
        if not isinstance(other, CompositeKeyK):
            return NotImplemented
        
        # Criterio 1 (Principal): Magnitud numérica M (menor va a la izquierda <, mayor a la derecha >)
        # Criterion 1 (Primary): Numerical magnitude M (smaller goes left <, greater goes right >)
        if self._M != other._M:
            return self._M < other._M
        
        # Criterio 2: Identificador único I para desempate si tienen la misma magnitud
        # Criterion 2: Unique ID I to break ties if magnitudes are identical
        if self._I != other._I:
            return self._I < other._I
        
        # Criterio 3: Prioridad P
        return self._P < other._P

    def __repr__(self) -> str:
        return f"K(P={self._P}, M={self._M:.1f}, I={self._I})"

    def __str__(self) -> str:
        return f"K=[M:{self._M:.1f}, P:{self._P}, I:{self._I}]"

    def __eq__(self, other: Any) -> bool:
        if not isinstance(other, CompositeKeyK):
            return False
        return (self._M == other._M) and (self._I == other._I) and (self._P == other._P)

    def __gt__(self, other: 'CompositeKeyK') -> bool:
        if not isinstance(other, CompositeKeyK):
            return NotImplemented
        return not (self < other or self == other)

    def __le__(self, other: 'CompositeKeyK') -> bool:
        return self < other or self == other

    def __ge__(self, other: 'CompositeKeyK') -> bool:
        return self > other or self == other

    def to_dict(self) -> Dict[str, Any]:
        """Convertir a diccionario JSON / Convert to JSON dict"""
        return {
            "P": self._P,
            "M": self._M,
            "I": self._I,
            "formatted_id": self.formatted_id()
        }

    def __repr__(self) -> str:
        return f"ClaveK(P={self._P}, M={self._M}, I={self.formatted_id()})"
