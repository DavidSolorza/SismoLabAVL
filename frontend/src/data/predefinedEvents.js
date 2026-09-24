/**
 * Catálogo Oficial de Eventos Sísmicos Predefinidos
 * SismoLab AVL - Universidad de Caldas
 * 
 * Sismos de referencia alineados rigurosamente con las Secciones 3 y 4 de la especificación técnica:
 * - Plano cartesiano [0.0, 1000.0] km en ambos ejes (x, y).
 * - Profundidad focal H <= 700.0 km.
 * - Regla Oficial de Prioridad P in {3, 2, 1}:
 *   * Prioridad 3 (Alta): M >= 6.0; o bien (M >= 4.5 y H <= 30.0 km y zona poblada).
 *   * Prioridad 2 (Media): No cumple Alta y M >= 4.5.
 *   * Prioridad 1 (Baja): Cualquier otro caso (M < 4.5).
 */

export const PREDEFINED_EVENTS = [
  // =========================================================================
  // BLOQUE 1: PRIORIDAD 3 (ALTA) - EMERGENCIAS Y AMENAZA URBANA
  // =========================================================================
  {
    id: 1010,
    nombre: "Terremoto de Armenia (1999) - Destructivo Urbano",
    descripcion: "Sismo intraplaca superficial en casco urbano. M=6.2 >= 6.0 -> Prioridad 3 (Alta).",
    magnitud: 6.2,
    profundidad: 18.0,
    x: 240.0,
    y: 250.0,
    latitud: 4.53389,
    longitud: -75.68111,
    estacion_id: "EST-ARMENIA-01",
    zona_poblada: true,
    prioridadEsperada: 3,
    categoria: "Alta (P3)",
    region: "Eje Cafetero - Quindío",
    badgeColor: "#991B1B",
    badgeBg: "#FEE2E2",
    badgeBorder: "#FECACA"
  },
  {
    id: 1011,
    nombre: "Gran Sismo Marino Litoral Pacífico (Tumaco)",
    descripcion: "Subducción placa Nazca-Suramericana con alta energía. M=7.2 >= 6.0 -> Prioridad 3 (Alta).",
    magnitud: 7.2,
    profundidad: 25.0,
    x: 120.0,
    y: 180.0,
    latitud: 1.80000,
    longitud: -78.75000,
    estacion_id: "EST-PACIFICO-01",
    zona_poblada: false,
    prioridadEsperada: 3,
    categoria: "Alta (P3)",
    region: "Pacífico Nariñense",
    badgeColor: "#991B1B",
    badgeBg: "#FEE2E2",
    badgeBorder: "#FECACA"
  },
  {
    id: 1012,
    nombre: "Terremoto de Popayán (1983) - Falla Malvazá",
    descripcion: "Superficial en zona densamente poblada. M=5.5 >= 4.5, H=15.0 <= 30.0 km -> Prioridad 3 (Alta).",
    magnitud: 5.5,
    profundidad: 15.0,
    x: 220.0,
    y: 160.0,
    latitud: 2.44420,
    longitud: -76.60590,
    estacion_id: "EST-POPAYAN-01",
    zona_poblada: true,
    prioridadEsperada: 3,
    categoria: "Alta (P3)",
    region: "Suroccidente - Cauca",
    badgeColor: "#991B1B",
    badgeBg: "#FEE2E2",
    badgeBorder: "#FECACA"
  },
  {
    id: 1013,
    nombre: "Sismo Urbano Manizales - Falla Romeral",
    descripcion: "Foco superficial bajo área urbana. M=4.8 >= 4.5, H=15.0 <= 30.0 km -> Prioridad 3 (Alta).",
    magnitud: 4.8,
    profundidad: 15.0,
    x: 380.0,
    y: 520.0,
    latitud: 5.06889,
    longitud: -75.51738,
    estacion_id: "EST-MANIZALES-01",
    zona_poblada: true,
    prioridadEsperada: 3,
    categoria: "Alta (P3)",
    region: "Caldas - Manizales",
    badgeColor: "#991B1B",
    badgeBg: "#FEE2E2",
    badgeBorder: "#FECACA"
  },
  {
    id: 1014,
    nombre: "Sismo Falla Ibagué - Complejo Machín",
    descripcion: "Sismotectónica superficial en cabecera urbana. M=5.0 >= 4.5, H=12.0 <= 30.0 km -> Prioridad 3 (Alta).",
    magnitud: 5.0,
    profundidad: 12.0,
    x: 310.0,
    y: 420.0,
    latitud: 4.43889,
    longitud: -75.23222,
    estacion_id: "EST-IBAGUE-01",
    zona_poblada: true,
    prioridadEsperada: 3,
    categoria: "Alta (P3)",
    region: "Tolima - Ibagué",
    badgeColor: "#991B1B",
    badgeBg: "#FEE2E2",
    badgeBorder: "#FECACA"
  },

  // =========================================================================
  // BLOQUE 2: PRIORIDAD 2 (MEDIA) - EVENTOS MODERADOS / PROFUNDOS / RURALES
  // =========================================================================
  {
    id: 1015,
    nombre: "Nido Sísmico de Bucaramanga (Los Santos)",
    descripcion: "Sismo profundo intraplaca. M=5.4 >= 4.5, pero H=150.0 > 30.0 km -> Prioridad 2 (Media).",
    magnitud: 5.4,
    profundidad: 150.0,
    x: 650.0,
    y: 780.0,
    latitud: 6.78000,
    longitud: -73.12000,
    estacion_id: "EST-BUCARAMANGA-01",
    zona_poblada: false,
    prioridadEsperada: 2,
    categoria: "Media (P2)",
    region: "Santander - Los Santos",
    badgeColor: "#92400E",
    badgeBg: "#FEF3C7",
    badgeBorder: "#FDE68A"
  },
  {
    id: 1016,
    nombre: "Sismo Cordillera Central Pereira - Falla Otún",
    descripcion: "M=4.5 >= 4.5 a profundidad intermedia H=45.0 > 30.0 km -> Prioridad 2 (Media).",
    magnitud: 4.5,
    profundidad: 45.0,
    x: 270.0,
    y: 380.0,
    latitud: 4.81333,
    longitud: -75.69611,
    estacion_id: "EST-PEREIRA-01",
    zona_poblada: false,
    prioridadEsperada: 2,
    categoria: "Media (P2)",
    region: "Risaralda - Cordillera",
    badgeColor: "#92400E",
    badgeBg: "#FEF3C7",
    badgeBorder: "#FDE68A"
  },
  {
    id: 1017,
    nombre: "Sismo Fronterizo Cúcuta - Cordillera Oriental",
    descripcion: "Sismo tectónico rural en zona fronteriza. M=4.6 >= 4.5 fuera de casco urbano -> Prioridad 2 (Media).",
    magnitud: 4.6,
    profundidad: 35.0,
    x: 780.0,
    y: 890.0,
    latitud: 7.89391,
    longitud: -72.50782,
    estacion_id: "EST-CUCUTA-01",
    zona_poblada: false,
    prioridadEsperada: 2,
    categoria: "Media (P2)",
    region: "Norte de Santander",
    badgeColor: "#92400E",
    badgeBg: "#FEF3C7",
    badgeBorder: "#FDE68A"
  },
  {
    id: 1018,
    nombre: "Sismo Subducción Valle del Cauca",
    descripcion: "Evento tectónico a profundidad media. M=4.7 >= 4.5, H=65.0 km no poblada -> Prioridad 2 (Media).",
    magnitud: 4.7,
    profundidad: 65.0,
    x: 210.0,
    y: 310.0,
    latitud: 3.45167,
    longitud: -76.53194,
    estacion_id: "EST-CALI-01",
    zona_poblada: false,
    prioridadEsperada: 2,
    categoria: "Media (P2)",
    region: "Valle del Cauca",
    badgeColor: "#92400E",
    badgeBg: "#FEF3C7",
    badgeBorder: "#FDE68A"
  },

  // =========================================================================
  // BLOQUE 3: PRIORIDAD 1 (BAJA) - MICROSISMOS E INSTRUMENTALES
  // =========================================================================
  {
    id: 1019,
    nombre: "Microsismo Volcánico Nevado del Ruiz",
    descripcion: "Fractura de roca volcánica de baja magnitud. M=2.3 < 4.5 -> Prioridad 1 (Baja).",
    magnitud: 2.3,
    profundidad: 4.5,
    x: 480.0,
    y: 540.0,
    latitud: 4.89500,
    longitud: -75.32100,
    estacion_id: "EST-MANIZALES-01",
    zona_poblada: false,
    prioridadEsperada: 1,
    categoria: "Baja (P1)",
    region: "Parque Los Nevados",
    badgeColor: "#065F46",
    badgeBg: "#ECFDF5",
    badgeBorder: "#A7F3D0"
  },
  {
    id: 1020,
    nombre: "Sismicidad Tectónica Leve La Cabaña (Caldas)",
    descripcion: "Sismo menor instrumental rural. M=3.1 < 4.5 -> Prioridad 1 (Baja).",
    magnitud: 3.1,
    profundidad: 14.0,
    x: 360.0,
    y: 530.0,
    latitud: 5.10500,
    longitud: -75.55000,
    estacion_id: "EST-MANIZALES-01",
    zona_poblada: false,
    prioridadEsperada: 1,
    categoria: "Baja (P1)",
    region: "Rural Caldas",
    badgeColor: "#065F46",
    badgeBg: "#ECFDF5",
    badgeBorder: "#A7F3D0"
  },
  {
    id: 1021,
    nombre: "Evento Instrumental Sierra Nevada de Santa Marta",
    descripcion: "Sismicidad regional de fondo en macizo montañoso. M=3.4 < 4.5 -> Prioridad 1 (Baja).",
    magnitud: 3.4,
    profundidad: 22.0,
    x: 680.0,
    y: 950.0,
    latitud: 10.85000,
    longitud: -73.70000,
    estacion_id: "EST-SANTA-MARTA-01",
    zona_poblada: false,
    prioridadEsperada: 1,
    categoria: "Baja (P1)",
    region: "Caribe - Magdalena",
    badgeColor: "#065F46",
    badgeBg: "#ECFDF5",
    badgeBorder: "#A7F3D0"
  },
  {
    id: 1022,
    nombre: "Evento Tectónico Profundo Sabana Bogotá",
    descripcion: "Reajuste litosférico a gran profundidad. M=3.8 < 4.5, H=110.0 km -> Prioridad 1 (Baja).",
    magnitud: 3.8,
    profundidad: 110.0,
    x: 520.0,
    y: 460.0,
    latitud: 4.71100,
    longitud: -74.07209,
    estacion_id: "EST-BOGOTA-01",
    zona_poblada: false,
    prioridadEsperada: 1,
    categoria: "Baja (P1)",
    region: "Cundinamarca",
    badgeColor: "#065F46",
    badgeBg: "#ECFDF5",
    badgeBorder: "#A7F3D0"
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
