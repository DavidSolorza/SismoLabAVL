# -*- coding: utf-8 -*-
"""
Service Bus (Command & Query Dispatcher) / Bus de Servicios
SismoLab AVL - Universidad de Caldas

Proporciona un despachador desacoplado para enrutar Comandos y Consultas hacia sus Handlers.
Provides a decoupled dispatcher to route Commands and Queries to their respective Handlers.
"""

from typing import Dict, Type, Any, Callable
from src.core.errors.exceptions import HandlerNotFoundException

class Command:
    """
    Clase Base para Comandos / Base Class for Commands
    """
    pass


class Query:
    """
    Clase Base para Consultas / Base Class for Queries
    """
    pass


class CommandBus:
    """
    Despachador de Comandos y Consultas (In-Memory Service Bus Dispatcher)
    """
    def __init__(self):
        # Mapeo de Clase de Comando -> Instancia de Handler o Función Ejecutora
        # Mapping of Command Class -> Handler Instance or Executor Function
        self._handlers: Dict[Type[Command], Callable[[Any], Any]] = {}

    def register(self, command_type: Type[Command], handler: Callable[[Any], Any]) -> None:
        """
        Registra un Handler para un tipo de Comando específico.
        Registers a Handler for a specific Command type.
        """
        self._handlers[command_type] = handler

    def dispatch(self, command: Command) -> Any:
        """
        Despacha un Comando hacia su Handler registrado.
        Dispatches a Command to its registered Handler.
        """
        command_type = type(command)
        if command_type not in self._handlers:
            raise HandlerNotFoundException(command_type.__name__)
        
        handler = self._handlers[command_type]
        return handler(command)


# Instancia global del Bus de Servicios / Global Service Bus Instance
global_command_bus = CommandBus()
