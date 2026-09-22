# -*- coding: utf-8 -*-
"""
Catálogo de Eventos Sísmicos Predefinidos / Predefined Seismic Events Catalog
SismoLab AVL - Universidad de Caldas

Proporciona un conjunto de sismos representativos de la sismicidad colombiana
con diversas magnitudes, profundidades, zonas pobladas y prioridades calculadas (P=1, P=2, P=3).
Permite agilizar pruebas y demostraciones sin necesidad de ingresar parámetros manualmente.
"""

from typing import List, Dict, Any

PREDEFINED_EVENTS: List[Dict[str, Any]] = [
    {
        "id": 1010,
        "nombre": "Terremoto de Armenia (1999) - Destructivo Urbano",
        "descripcion": "Sismo superficial en zona altamente poblada. Máxima prioridad de atención.",
        "magnitud": 6.2,
        "profundidad": 18.0,
        "latitud": 4.53389,
        "longitud": -75.68111,
        "estacion_id": "EST-ARMENIA-01",
        "zona_poblada": True,
        "expected_priority": 1,
        "categoria": "Crítico (P1)"
    },
    {
        "id": 1011,
        "nombre": "Gran Sismo Marino Litoral Pacífico (Tumaco)",
        "descripcion": "Evento de gran magnitud M >= 6.5 en costa pacífica con potencial tsunamigénico.",
        "magnitud": 7.2,
        "profundidad": 25.0,
        "latitud": 1.80000,
        "longitud": -78.75000,
        "estacion_id": "EST-PACIFICO-01",
        "zona_poblada": False,
        "expected_priority": 1,
        "categoria": "Crítico (P1)"
    },
    {
        "id": 1012,
        "nombre": "Terremoto de Popayán (1983) - Falla Micay",
        "descripcion": "Sismo intraplaca superficial que impactó casco urbano histórico.",
        "magnitud": 5.5,
        "profundidad": 15.0,
        "latitud": 2.4442,
        "longitud": -76.6059,
        "estacion_id": "EST-POPAYAN-01",
        "zona_poblada": True,
        "expected_priority": 1,
        "categoria": "Crítico (P1)"
    },
    {
        "id": 1013,
        "nombre": "Sismo Manizales - Falla Romeral",
        "descripcion": "Evento moderado superficial en el Eje Cafetero que activa alerta de deslizamientos.",
        "magnitud": 5.8,
        "profundidad": 22.0,
        "latitud": 5.06889,
        "longitud": -75.51738,
        "estacion_id": "EST-MANIZALES-01",
        "zona_poblada": True,
        "expected_priority": 1,
        "categoria": "Crítico (P1)"
    },
    {
        "id": 1014,
        "nombre": "Nido Sísmico de Bucaramanga (Los Santos)",
        "descripcion": "Sismicidad intermedia/profunda muy activa en Santander. Sentido ampliamente.",
        "magnitud": 5.4,
        "profundidad": 150.0,
        "latitud": 6.78000,
        "longitud": -73.12000,
        "estacion_id": "EST-BUCARAMANGA-01",
        "zona_poblada": True,
        "expected_priority": 2,
        "categoria": "Moderado (P2)"
    },
    {
        "id": 1015,
        "nombre": "Sismo Pereira - Cordillera Central",
        "descripcion": "Evento moderado con epicentro cercano al área metropolitana de Risaralda.",
        "magnitud": 4.5,
        "profundidad": 38.0,
        "latitud": 4.81333,
        "longitud": -75.69611,
        "estacion_id": "EST-PEREIRA-01",
        "zona_poblada": True,
        "expected_priority": 2,
        "categoria": "Moderado (P2)"
    },
    {
        "id": 1016,
        "nombre": "Sismo Fronterizo Cúcuta - Cordillera Oriental",
        "descripcion": "Evento de magnitud intermedia en zona montañosa rural fronteriza.",
        "magnitud": 4.2,
        "profundidad": 32.0,
        "latitud": 7.89391,
        "longitud": -72.50782,
        "estacion_id": "EST-CUCUTA-01",
        "zona_poblada": False,
        "expected_priority": 2,
        "categoria": "Moderado (P2)"
    },
    {
        "id": 1017,
        "nombre": "Microsismo Volcánico Nevado del Ruiz (Cráter Arenas)",
        "descripcion": "Sismicidad de fractura de roca volcánica (VT). Baja magnitud y focal.",
        "magnitud": 2.3,
        "profundidad": 4.5,
        "latitud": 4.89500,
        "longitud": -75.32100,
        "estacion_id": "EST-MANIZALES-01",
        "zona_poblada": False,
        "expected_priority": 3,
        "categoria": "Normal / Vigilancia (P3)"
    },
    {
        "id": 1018,
        "nombre": "Sismicidad Tectónica Leve La Cabaña (Caldas)",
        "descripcion": "Evento menor instrumental en sector rural de Manizales.",
        "magnitud": 3.1,
        "profundidad": 14.0,
        "latitud": 5.10500,
        "longitud": -75.55000,
        "estacion_id": "EST-MANIZALES-01",
        "zona_poblada": False,
        "expected_priority": 3,
        "categoria": "Normal / Vigilancia (P3)"
    },
    {
        "id": 1019,
        "nombre": "Evento Tectónico Profundo Chocó / Pacífico Norte",
        "descripcion": "Subducción profunda sin percepción en superficie ni afectación a población.",
        "magnitud": 3.8,
        "profundidad": 75.0,
        "latitud": 5.69000,
        "longitud": -77.10000,
        "estacion_id": "EST-PACIFICO-01",
        "zona_poblada": False,
        "expected_priority": 3,
        "categoria": "Normal / Vigilancia (P3)"
    }
]
