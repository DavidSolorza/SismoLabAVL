# -*- coding: utf-8 -*-
"""
Custom Exceptions Architecture / Arquitectura de Excepciones Personalizadas
SismoLab AVL - Universidad de Caldas

Define la jerarquía de excepciones de dominio, aplicación e infraestructura.
Defines the hierarchy of domain, application, and infrastructure exceptions.
"""

class SismoLabException(Exception):
    """
    Excepción Base del Sistema SismoLab / Base SismoLab System Exception
    """
    def __init__(self, message: str, code: str = "INTERNAL_ERROR"):
        super().__init__(message)
        self.message = message
        self.code = code


class DomainException(SismoLabException):
    """
    Excepción de Violación de Regla de Dominio / Domain Rule Violation Exception
    """
    def __init__(self, message: str, code: str = "DOMAIN_RULE_VIOLATION"):
        super().__init__(message, code)


class EventAlreadyExistsException(DomainException):
    """
    Excepción al intentar insertar un evento con ID duplicado en el AVL.
    Exception thrown when attempting to insert an event with a duplicate ID into the AVL.
    """
    def __init__(self, event_id: int):
        super().__init__(
            message=f"El evento sísmico con ID {event_id} ya existe en la estructura AVL. / Event ID {event_id} already exists in AVL structure.",
            code="EVENT_ALREADY_EXISTS"
        )


class EventNotFoundException(DomainException):
    """
    Excepción emitida cuando no se encuentra un evento sísmico buscado.
    Exception thrown when a requested seismic event is not found.
    """
    def __init__(self, identifier: str):
        super().__init__(
            message=f"No se encontró el evento sísmico solicitado: {identifier}. / Requested seismic event not found: {identifier}.",
            code="EVENT_NOT_FOUND"
        )


class EmptyStructureException(DomainException):
    """
    Excepción emitida al desapilar o desencolar en estructuras vacías.
    Exception thrown when popping/dequeuing from empty structures.
    """
    def __init__(self, structure_name: str):
        super().__init__(
            message=f"La estructura {structure_name} está vacía. / Structure {structure_name} is empty.",
            code="EMPTY_STRUCTURE"
        )


class HandlerNotFoundException(SismoLabException):
    """
    Excepción del Bus de Servicios cuando no existe un Handler registrado para un Comando.
    Service Bus exception when no Handler is registered for a Command.
    """
    def __init__(self, command_name: str):
        super().__init__(
            message=f"No hay un Handler registrado para el comando: {command_name}. / No handler registered for command: {command_name}.",
            code="HANDLER_NOT_FOUND"
        )


class DuplicateEventIdException(EventAlreadyExistsException):
    pass


class DomainValidationException(DomainException):
    def __init__(self, message: str):
        super().__init__(message=message, code="VALIDATION_ERROR")

