/**
 * Catálogo de Eventos Sísmicos Predefinidos
 * SismoLab AVL - Universidad de Caldas
 * 
 * Sismos históricos y sintéticos de referencia para pruebas ágiles del árbol AVL.
 * Cubren los tres niveles de Prioridad P=(1, 2, 3) con parámetros reales de Colombia.
 */

export const PREDEFINED_EVENTS = [
  {
    id: 1010,
    nombre: "Terremoto de Armenia (1999) - Destructivo Urbano",
    descripcion: "Sismo superficial en casco urbano. Prioridad P=1 inmediata.",
    magnitud: 6.2,
    profundidad: 18.0,
    latitud: 4.53389,
    longitud: -75.68111,
    estacion_id: "EST-ARMENIA-01",
    zona_poblada: true,
    prioridadEsperada: 1,
    badgeColor: "var(--p1-text)",
    badgeBg: "var(--p1-bg)"
  },
  {
    id: 1011,
    nombre: "Gran Sismo Marino Litoral Pacífico (Tumaco)",
    descripcion: "Magnitud crítica M=7.2 >= 6.5. Prioridad P=1 por alta energía.",
    magnitud: 7.2,
    profundidad: 25.0,
    latitud: 1.80000,
    longitud: -78.75000,
    estacion_id: "EST-PACIFICO-01",
    zona_poblada: false,
    prioridadEsperada: 1,
    badgeColor: "var(--p1-text)",
    badgeBg: "var(--p1-bg)"
  },
  {
    id: 1012,
    nombre: "Terremoto de Popayán (1983) - Falla Micay",
    descripcion: "Superficial en zona densa (M=5.5, prof=15km). Prioridad P=1.",
    magnitud: 5.5,
    profundidad: 15.0,
    latitud: 2.44420,
    longitud: -76.60590,
    estacion_id: "EST-MANIZALES-01",
    zona_poblada: true,
    prioridadEsperada: 1,
    badgeColor: "var(--p1-text)",
    badgeBg: "var(--p1-bg)"
  },
  {
    id: 1013,
    nombre: "Sismo Manizales - Falla Romeral",
    descripcion: "Moderado fuerte en Eje Cafetero (M=5.8, prof=22km, urbana). Prioridad P=1.",
    magnitud: 5.8,
    profundidad: 22.0,
    latitud: 5.06889,
    longitud: -75.51738,
    estacion_id: "EST-MANIZALES-01",
    zona_poblada: true,
    prioridadEsperada: 1,
    badgeColor: "var(--p1-text)",
    badgeBg: "var(--p1-bg)"
  },
  {
    id: 1014,
    nombre: "Nido Sísmico de Bucaramanga (Los Santos)",
    descripcion: "Sismo profundo M=5.4 a 150km. Moderado P=2 por profundidad.",
    magnitud: 5.4,
    profundidad: 150.0,
    latitud: 6.78000,
    longitud: -73.12000,
    estacion_id: "EST-PEREIRA-01",
    zona_poblada: true,
    prioridadEsperada: 2,
    badgeColor: "var(--p2-text)",
    badgeBg: "var(--p2-bg)"
  },
  {
    id: 1015,
    nombre: "Sismo Pereira - Cordillera Central",
    descripcion: "Magnitud M=4.5 a 38km en zona metropolitana. Prioridad P=2.",
    magnitud: 4.5,
    profundidad: 38.0,
    latitud: 4.81333,
    longitud: -75.69611,
    estacion_id: "EST-PEREIRA-01",
    zona_poblada: true,
    prioridadEsperada: 2,
    badgeColor: "var(--p2-text)",
    badgeBg: "var(--p2-bg)"
  },
  {
    id: 1016,
    nombre: "Sismo Fronterizo Cúcuta - Cordillera Oriental",
    descripcion: "Magnitud M=4.2 rural. Prioridad P=2 por M >= 4.0.",
    magnitud: 4.2,
    profundidad: 32.0,
    latitud: 7.89391,
    longitud: -72.50782,
    estacion_id: "EST-ARMENIA-01",
    zona_poblada: false,
    prioridadEsperada: 2,
    badgeColor: "var(--p2-text)",
    badgeBg: "var(--p2-bg)"
  },
  {
    id: 1017,
    nombre: "Microsismo Volcánico Nevado del Ruiz",
    descripcion: "Fracturamiento volcánico M=2.3 superficial en zona rural. Prioridad P=3.",
    magnitud: 2.3,
    profundidad: 4.5,
    latitud: 4.89500,
    longitud: -75.32100,
    estacion_id: "EST-MANIZALES-01",
    zona_poblada: false,
    prioridadEsperada: 3,
    badgeColor: "var(--p3-text)",
    badgeBg: "var(--p3-bg)"
  },
  {
    id: 1018,
    nombre: "Sismicidad Tectónica Leve La Cabaña (Caldas)",
    descripcion: "Sismo instrumental menor M=3.1 rural. Prioridad P=3.",
    magnitud: 3.1,
    profundidad: 14.0,
    latitud: 5.10500,
    longitud: -75.55000,
    estacion_id: "EST-MANIZALES-01",
    zona_poblada: false,
    prioridadEsperada: 3,
    badgeColor: "var(--p3-text)",
    badgeBg: "var(--p3-bg)"
  },
  {
    id: 1019,
    nombre: "Evento Tectónico Profundo Chocó",
    descripcion: "Subducción a 75km de profundidad M=3.8 no habitado. Prioridad P=3.",
    magnitud: 3.8,
    profundidad: 75.0,
    latitud: 5.69000,
    longitud: -77.10000,
    estacion_id: "EST-PACIFICO-01",
    zona_poblada: false,
    prioridadEsperada: 3,
    badgeColor: "var(--p3-text)",
    badgeBg: "var(--p3-bg)"
  }
];

/**
 * Calcula un ID disponible que no colisione con los eventos ya registrados en el AVL
 */
export function getAvailableId(existingEvents = [], preferredId = 1010) {
  const ids = new Set((existingEvents || []).map(e => Number(e.id)));
  if (!ids.has(preferredId)) {
    return preferredId;
  }
  let candidate = preferredId + 100;
  while (ids.has(candidate)) {
    candidate += 1;
  }
  return candidate;
}
