# -*- coding: utf-8 -*-
"""
Command and Handlers for gestion_reloj / Comando y Handlers para gestion_reloj
SismoLab AVL - Universidad de Caldas
"""

from datetime import datetime, timezone
from typing import Dict, Any
from src.core.bus.command_bus import Command
from src.core.errors.exceptions import SismoLabException
from src.features.gestion_reloj.dto import FijarRelojDTO, AvanzarRelojDTO
from src.infrastructure.persistence.in_memory_store import store

class FijarRelojCommand(Command):
    """Comando para establecer manualmente el reloj de simulación"""
    def __init__(self, dto: FijarRelojDTO):
        self.dto = dto

class FijarRelojHandler:
    """Manejador para fijar el reloj de simulación"""
    def handle(self, command: FijarRelojCommand) -> Dict[str, Any]:
        raw = command.dto.reloj.strip()
        try:
            clean_ts = raw.replace("Z", "+00:00")
            parsed_dt = datetime.fromisoformat(clean_ts)
            if parsed_dt.tzinfo is None:
                parsed_dt = parsed_dt.replace(tzinfo=timezone.utc)
            parsed_dt = parsed_dt.astimezone(timezone.utc)
        except Exception as e:
            raise SismoLabException(
                f"Formato de fecha y hora inválido '{raw}'. Use el estándar UTC ISO 8601 (ej: 2026-09-22T14:30:00Z).",
                code="FORMATO_FECHA_INVALIDO"
            )

        iso_result = store.set_simulation_clock(parsed_dt)
        return {
            "success": True,
            "reloj": iso_result,
            "timestamp_epoch": int(parsed_dt.timestamp()),
            "message": f"Reloj de simulación fijado a {iso_result}"
        }


class AvanzarRelojCommand(Command):
    """Comando para avanzar el reloj de simulación"""
    def __init__(self, dto: AvanzarRelojDTO):
        self.dto = dto

class AvanzarRelojHandler:
    """Manejador para avanzar el reloj de simulación"""
    def handle(self, command: AvanzarRelojCommand) -> Dict[str, Any]:
        dto = command.dto
        total_seconds = dto.segundos + (dto.minutos * 60) + (dto.horas * 3600) + (dto.dias * 86400)
        if total_seconds <= 0:
            raise SismoLabException(
                "El avance temporal debe ser mayor a 0 segundos.",
                code="AVANCE_TEMPORAL_INVALIDO"
            )

        iso_result = store.advance_simulation_clock(
            seconds=dto.segundos,
            minutes=dto.minutos,
            hours=dto.horas,
            days=dto.dias
        )
        current_dt = store.get_simulation_clock()
        return {
            "success": True,
            "reloj": iso_result,
            "timestamp_epoch": int(current_dt.timestamp()),
            "message": f"Reloj de simulación avanzado {total_seconds}s. Nuevo valor: {iso_result}"
        }
