/**
 * GeoJSON Oficial y Calibración Espacial de Colombia
 * SismoLab AVL - Universidad de Caldas
 * 
 * Integra los archivos oficiales provistos por el usuario:
 * 1. custom.geo.json: Frontera continental y marítima nacional (MultiPolygon de 11 polígonos).
 * 2. co.json: Coordenadas y delimitaciones oficiales de los 33 departamentos de Colombia.
 */

import customGeoJson from './custom.geo.json';
import departmentsGeoJson from './co.json';

// Bounding box geográfico de referencia calibrado para Colombia en el plano [0, 1000] x [0, 1000] km
export const GEO_BOUNDS = {
  minLon: -79.5,
  maxLon: -66.5,
  minLat: -4.5,
  maxLat: 13.0
};

// Bounding box extendido que incluye el archipiélago de San Andrés y Providencia
export const GEO_BOUNDS_EXTENDED = {
  minLon: -82.2,
  maxLon: -66.5,
  minLat: -4.5,
  maxLat: 14.0
};

/**
 * Convierte coordenadas geográficas (longitud, latitud) al plano cartesiano [0, 1000] km
 */
export function geoToCartesian(lon, lat, useExtended = false) {
  const bounds = useExtended ? GEO_BOUNDS_EXTENDED : GEO_BOUNDS;
  const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * 1000.0;
  const y = ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 1000.0;
  return {
    x: Math.max(0, Math.min(1000, Math.round(x * 10) / 10)),
    y: Math.max(0, Math.min(1000, Math.round(y * 10) / 10))
  };
}

/**
 * Convierte coordenadas cartesianas [0, 1000] km a coordenadas geográficas (latitud, longitud)
 */
export function cartesianToGeo(x, y, useExtended = false) {
  const bounds = useExtended ? GEO_BOUNDS_EXTENDED : GEO_BOUNDS;
  const lon = bounds.minLon + (x / 1000.0) * (bounds.maxLon - bounds.minLon);
  const lat = bounds.minLat + (y / 1000.0) * (bounds.maxLat - bounds.minLat);
  return {
    lat: Math.round(lat * 100000) / 100000,
    lon: Math.round(lon * 100000) / 100000
  };
}

/**
 * Convierte coordenadas geográficas [lon, lat] a coordenadas de píxeles SVG
 * En SVG, el origen (0, 0) está en la esquina superior izquierda,
 * por lo que Y_svg = 1000 - Y_cartesiano.
 */
export function geoToSvg(lon, lat, useExtended = false) {
  const { x, y } = geoToCartesian(lon, lat, useExtended);
  return {
    x: x,
    y: 1000.0 - y
  };
}

/**
 * Convierte un anillo de coordenadas [[lon, lat], ...] a un path string SVG
 */
export function ringToSvgPath(ring, useExtended = false) {
  if (!ring || ring.length === 0) return '';
  return ring
    .map((point, idx) => {
      const { x, y } = geoToSvg(point[0], point[1], useExtended);
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ') + ' Z';
}

/**
 * Convierte cualquier geometría GeoJSON (Polygon o MultiPolygon) a un path string SVG continuo
 */
export function geometryToSvgPath(geometry, useExtended = false) {
  if (!geometry) return '';
  if (geometry.type === 'Polygon') {
    return geometry.coordinates.map(ring => ringToSvgPath(ring, useExtended)).join(' ');
  } else if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.map(polygon => {
      return polygon.map(ring => ringToSvgPath(ring, useExtended)).join(' ');
    }).join(' ');
  }
  return '';
}

/**
 * Exportación directa del archivo GeoJSON de la República de Colombia
 */
export const CUSTOM_GEOJSON = customGeoJson;

/**
 * Exportación directa del GeoJSON con los 33 Departamentos de Colombia (co.json)
 */
export const DEPARTMENTS_GEOJSON = departmentsGeoJson;

/**
 * Paleta de colores suaves y diferenciados para los departamentos de Colombia
 */
const DEPARTMENT_COLORS = {
  COCAL: { fill: 'rgba(16, 185, 129, 0.24)', stroke: '#059669', name: 'Caldas' },
  CORIS: { fill: 'rgba(59, 130, 246, 0.22)', stroke: '#2563EB', name: 'Risaralda' },
  COQUI: { fill: 'rgba(245, 158, 11, 0.22)', stroke: '#D97706', name: 'Quindío' },
  COANT: { fill: 'rgba(99, 102, 241, 0.18)', stroke: '#4F46E5', name: 'Antioquia' },
  COCUN: { fill: 'rgba(236, 72, 153, 0.18)', stroke: '#DB2777', name: 'Cundinamarca' },
  CODC:  { fill: 'rgba(219, 39, 119, 0.30)', stroke: '#BE185D', name: 'Distrito Capital de Bogotá' },
  COSAN: { fill: 'rgba(239, 68, 68, 0.18)',  stroke: '#DC2626', name: 'Santander' },
  CONSA: { fill: 'rgba(249, 115, 22, 0.18)', stroke: '#EA580C', name: 'Norte de Santander' },
  COVAC: { fill: 'rgba(139, 92, 246, 0.18)', stroke: '#7C3AED', name: 'Valle del Cauca' },
  COCAU: { fill: 'rgba(20, 184, 166, 0.18)', stroke: '#0D9488', name: 'Cauca' },
  CONAR: { fill: 'rgba(234, 179, 8, 0.18)',  stroke: '#CA8A04', name: 'Nariño' },
  COCHO: { fill: 'rgba(16, 185, 129, 0.18)', stroke: '#059669', name: 'Chocó' },
  COTOL: { fill: 'rgba(168, 85, 247, 0.18)', stroke: '#9333EA', name: 'Tolima' },
  COHUI: { fill: 'rgba(244, 63, 94, 0.18)',  stroke: '#E11D48', name: 'Huila' },
  COBOY: { fill: 'rgba(34, 197, 94, 0.18)',  stroke: '#16A34A', name: 'Boyacá' },
  COMET: { fill: 'rgba(56, 189, 248, 0.18)', stroke: '#0284C7', name: 'Meta' },
  COCAS: { fill: 'rgba(251, 146, 60, 0.18)', stroke: '#C2410C', name: 'Casanare' },
  COARA: { fill: 'rgba(250, 204, 21, 0.18)', stroke: '#A16207', name: 'Arauca' },
  COVID: { fill: 'rgba(148, 163, 184, 0.18)',stroke: '#475569', name: 'Vichada' },
  COGUV: { fill: 'rgba(52, 211, 153, 0.18)', stroke: '#059669', name: 'Guaviare' },
  COGUA: { fill: 'rgba(129, 140, 248, 0.18)',stroke: '#4338CA', name: 'Guainía' },
  COVAU: { fill: 'rgba(192, 132, 252, 0.18)',stroke: '#7E22CE', name: 'Vaupés' },
  COCAQ: { fill: 'rgba(74, 222, 128, 0.18)', stroke: '#15803D', name: 'Caquetá' },
  COPUT: { fill: 'rgba(45, 212, 191, 0.18)', stroke: '#0F766E', name: 'Putumayo' },
  COAMA: { fill: 'rgba(163, 230, 53, 0.18)', stroke: '#4D7C0F', name: 'Amazonas' },
  COCOR: { fill: 'rgba(253, 186, 116, 0.18)',stroke: '#C2410C', name: 'Córdoba' },
  COSUC: { fill: 'rgba(254, 215, 170, 0.20)',stroke: '#D97706', name: 'Sucre' },
  COBOL: { fill: 'rgba(147, 197, 253, 0.18)',stroke: '#1D4ED8', name: 'Bolívar' },
  COATL: { fill: 'rgba(191, 219, 254, 0.25)',stroke: '#2563EB', name: 'Atlántico' },
  COMAG: { fill: 'rgba(186, 230, 253, 0.20)',stroke: '#0284C7', name: 'Magdalena' },
  COCES: { fill: 'rgba(254, 240, 138, 0.20)',stroke: '#CA8A04', name: 'Cesar' },
  COLAG: { fill: 'rgba(253, 224, 71, 0.22)', stroke: '#A16207', name: 'La Guajira' },
  COSAP: { fill: 'rgba(56, 189, 248, 0.25)', stroke: '#0369A1', name: 'San Andrés y Providencia' },
};

/**
 * Lista de los 33 departamentos procesados con sus caminos SVG, cajas delimitadoras y centroides
 */
export const DEPARTMENTS_LIST = departmentsGeoJson.features.map(f => {
  const id = f.properties.id;
  const name = f.properties.name;
  const path = geometryToSvgPath(f.geometry);
  
  // Cálculo del centroide y caja cartesiana [minX, maxX, minY, maxY]
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
  let sumLon = 0, sumLat = 0, count = 0;

  function scanRing(ring) {
    ring.forEach(([lon, lat]) => {
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      sumLon += lon;
      sumLat += lat;
      count++;
    });
  }

  if (f.geometry.type === 'Polygon') {
    f.geometry.coordinates.forEach(scanRing);
  } else if (f.geometry.type === 'MultiPolygon') {
    f.geometry.coordinates.forEach(poly => poly.forEach(scanRing));
  }

  const cLon = count > 0 ? sumLon / count : 0;
  const cLat = count > 0 ? sumLat / count : 0;
  const centroid = geoToCartesian(cLon, cLat);
  const minCart = geoToCartesian(minLon, minLat);
  const maxCart = geoToCartesian(maxLon, maxLat);

  const style = DEPARTMENT_COLORS[id] || {
    fill: 'rgba(148, 163, 184, 0.16)',
    stroke: '#64748B',
    name: name
  };

  return {
    id,
    name,
    path,
    centroid: { x: centroid.x, y: centroid.y, lat: cLat, lon: cLon },
    box: {
      minX: minCart.x,
      maxX: maxCart.x,
      minY: minCart.y,
      maxY: maxCart.y,
      width: Math.max(10, maxCart.x - minCart.x),
      height: Math.max(10, maxCart.y - minCart.y)
    },
    fill: style.fill,
    stroke: style.stroke
  };
});

/**
 * Propiedades del país extraídas de custom.geo.json
 */
export const COLOMBIA_COUNTRY_PROPERTIES = customGeoJson.features?.[0]?.properties || {
  name: "Colombia",
  formal_en: "Republic of Colombia",
  continent: "South America"
};

/**
 * Zonas del Escenario Calibradas con Coordenadas Matemáticas Reales de co.json
 */
export const SCENARIO_ZONES_CALIBRATED = [
  { id: "ZONA-MANIZALES", nombre: "Área Urbana Manizales (Caldas)", x_min: 275.0, x_max: 375.0, y_min: 530.0, y_max: 590.0, es_poblada: true, x: 306.4, y: 546.8, depto: "Caldas", ciudad: "Manizales" },
  { id: "ZONA-PEREIRA", nombre: "Área Metropolitana Pereira (Risaralda)", x_min: 255.0, x_max: 320.0, y_min: 520.0, y_max: 580.0, es_poblada: true, x: 292.6, y: 532.2, depto: "Risaralda", ciudad: "Pereira" },
  { id: "ZONA-ARMENIA", nombre: "Área Urbana Armenia (Quindío)", x_min: 275.0, x_max: 320.0, y_min: 490.0, y_max: 530.0, es_poblada: true, x: 293.8, y: 516.2, depto: "Quindío", ciudad: "Armenia" },
  { id: "ZONA-BOGOTA", nombre: "Sabana Metropolitana Bogotá D.C.", x_min: 380.0, x_max: 440.0, y_min: 465.0, y_max: 540.0, es_poblada: true, x: 417.5, y: 526.3, depto: "Bogotá D.C.", ciudad: "Bogotá D.C." },
  { id: "ZONA-MEDELLIN", nombre: "Valle de Aburrá Medellín (Antioquia)", x_min: 260.0, x_max: 350.0, y_min: 580.0, y_max: 650.0, es_poblada: true, x: 301.4, y: 614.0, depto: "Antioquia", ciudad: "Medellín" },
  { id: "ZONA-CALI", nombre: "Área Metropolitana Cali (Valle)", x_min: 190.0, x_max: 260.0, y_min: 420.0, y_max: 485.0, es_poblada: true, x: 228.3, y: 454.4, depto: "Valle del Cauca", ciudad: "Cali" },
  { id: "ZONA-SANTANDER", nombre: "Nido Sísmico Bucaramanga (Santander)", x_min: 450.0, x_max: 535.0, y_min: 620.0, y_max: 710.0, es_poblada: true, x: 490.8, y: 664.3, depto: "Santander", ciudad: "Bucaramanga" },
  { id: "ZONA-CORDILLERA", nombre: "Cordillera Central / Rural", x_min: 450.0, x_max: 750.0, y_min: 400.0, y_max: 750.0, es_poblada: false, x: 550.0, y: 550.0, depto: "Zona Central", ciudad: "Cordillera Central" }
];

/**
 * Estaciones Sísmicas Situadas con Exactitud Dentro de sus Respectivos Departamentos
 */
export const STATIONS_CALIBRATED = [
  { codigo: "EST-MANIZALES-01", nombre: "Estación Central Manizales (Caldas)", x: 306.4, y: 546.8, depto: "Caldas" },
  { codigo: "EST-PEREIRA-01", nombre: "Estación Matecaña Pereira (Risaralda)", x: 292.6, y: 532.2, depto: "Risaralda" },
  { codigo: "EST-ARMENIA-01", nombre: "Estación Quindío Armenia (Quindío)", x: 293.8, y: 516.2, depto: "Quindío" },
  { codigo: "EST-BOGOTA-01", nombre: "Estación Nacional Sabana Bogotá (Cundinamarca)", x: 417.5, y: 526.3, depto: "Bogotá D.C." },
  { codigo: "EST-MEDELLIN-01", nombre: "Estación Valle de Aburrá Medellín (Antioquia)", x: 301.4, y: 614.0, depto: "Antioquia" },
  { codigo: "EST-BUCARAMANGA-01", nombre: "Estación Nido Sísmico Los Santos (Santander)", x: 490.8, y: 664.3, depto: "Santander" },
  { codigo: "EST-CALI-01", nombre: "Estación Valle del Cauca Cali (Valle)", x: 228.3, y: 454.4, depto: "Valle del Cauca" },
  { codigo: "EST-PACIFICO-01", nombre: "Estación Litoral Pacífico Tumaco (Nariño)", x: 52.6, y: 360.0, depto: "Nariño" },
  { codigo: "EST-POPAYAN-01", nombre: "Estación Falla Micay Popayán (Cauca)", x: 222.6, y: 396.7, depto: "Cauca" },
  { codigo: "EST-CUCUTA-01", nombre: "Estación Frontera Cordillera Oriental (Cúcuta)", x: 537.9, y: 708.2, depto: "Norte de Santander" },
  { codigo: "EST-SANTA-MARTA-01", nombre: "Estación Sierra Nevada Santa Marta (Magdalena)", x: 407.8, y: 899.5, depto: "Magdalena" },
  { codigo: "EST-IBAGUE-01", nombre: "Estación Volcánica Machín Ibagué (Tolima)", x: 328.3, y: 510.8, depto: "Tolima" },
  { codigo: "EST-PASTO-01", nombre: "Estación Volcán Galeras Pasto (Nariño)", x: 170.7, y: 326.5, depto: "Nariño" },
  { codigo: "EST-CARTAGENA-01", nombre: "Estación Litoral Caribe Cartagena (Bolívar)", x: 309.3, y: 850.9, depto: "Bolívar" }
];
