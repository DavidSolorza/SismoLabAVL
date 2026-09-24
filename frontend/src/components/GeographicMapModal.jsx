import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MapPin, Radio, ZoomIn, ZoomOut, RotateCcw,
  Layers, Activity, CheckCircle2, Globe, Compass,
  Eye, EyeOff, Navigation, Building2, Trees, ShieldAlert,
  Search, Crosshair, Target, Maximize2, Square, Box, Building
} from 'lucide-react';
import ModalDialog from './ModalDialog';
import { fetchScenarioGeometry } from '../services/apiService';
import {
  CUSTOM_GEOJSON,
  COLOMBIA_COUNTRY_PROPERTIES,
  DEPARTMENTS_LIST,
  SCENARIO_ZONES_CALIBRATED,
  STATIONS_CALIBRATED,
  geometryToSvgPath,
  cartesianToGeo
} from '../data/colombiaGeoJson';

export default function GeographicMapModal({ isOpen, onClose, onSelectEvent, showToast }) {
  const [loading, setLoading] = useState(false);
  const [geoData, setGeoData] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  
  // Capas visuales configurables: Limpias por defecto sin contaminación visual
  const [showCountryGeoJson, setShowCountryGeoJson] = useState(true);
  const [showDepartments, setShowDepartments] = useState(true);
  const [showCities, setShowCities] = useState(true); // Puntos limpios de ciudades y zonas pobladas
  const [showZones, setShowZones] = useState(false); // Recuadros delimitadores (apagados por defecto)
  const [showDeptBoxes, setShowDeptBoxes] = useState(false);
  const [showStations, setShowStations] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  // Controles de zoom y paneo en el plano cartesiano [0, 1000] x [0, 1000] km
  const [scale, setScale] = useState(0.55);
  const [offset, setOffset] = useState({ x: 50, y: 20 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const didPanRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const containerRef = useRef(null);
  const svgRef = useRef(null);

  // Generamos el path SVG continuo de custom.geo.json (MultiPolygon con 11 polígonos e islas)
  const customColombiaSvgPath = useMemo(() => {
    if (!CUSTOM_GEOJSON?.features?.[0]?.geometry) return '';
    return geometryToSvgPath(CUSTOM_GEOJSON.features[0].geometry, false);
  }, []);

  const loadGeometry = async () => {
    setLoading(true);
    try {
      const data = await fetchScenarioGeometry();
      setGeoData(data);
    } catch (err) {
      console.error(err);
      if (showToast) showToast(err.message || 'Error al cargar geometría del escenario', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Auto-ajustar mapa centrado cuando el modal se abre
  useEffect(() => {
    if (isOpen) {
      loadGeometry();
      const timer = setTimeout(() => {
        focusFullCountry();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Zoom centralizado: mantiene siempre el punto de vista exactamente invariante
  const handleZoom = (zoomFactor, pivot = null) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const W = rect?.width || 750;
    const H = rect?.height || 580;
    const px = pivot?.x ?? W / 2;
    const py = pivot?.y ?? H / 2;

    setScale(prevScale => {
      const newScale = Math.min(Math.max(prevScale * zoomFactor, 0.35), 4.5);
      if (newScale === prevScale) return prevScale;

      setOffset(prevOffset => {
        const ratio = newScale / prevScale;
        return {
          x: px - (px - prevOffset.x) * ratio,
          y: py - (py - prevOffset.y) * ratio
        };
      });

      return newScale;
    });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    const pivot = rect ? {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    } : null;
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    handleZoom(zoomFactor, pivot);
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('.interactive-node')) return;
    setIsPanning(true);
    didPanRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      if (Math.hypot(e.clientX - dragStartRef.current.x, e.clientY - dragStartRef.current.y) > 4) {
        didPanRef.current = true;
      }
      setOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  // Conversión de coordenadas de simulación [0, 1000] km a píxeles SVG
  const mapX = (kmX) => kmX;
  const mapY = (kmY) => 1000 - kmY;

  // Clic interactivo en el plano para capturar cualquier coordenada con exactitud absoluta
  const handleSvgClick = (e) => {
    if (didPanRef.current) return;
    if (e.target.closest('.interactive-node')) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const planeX = (screenX - offset.x) / scale;
    const planeY = (screenY - offset.y) / scale;

    const kmX = Math.round(Math.max(0, Math.min(1000, planeX)) * 10) / 10;
    const kmY = Math.round(Math.max(0, Math.min(1000, 1000 - planeY)) * 10) / 10;
    const geo = cartesianToGeo(kmX, kmY);

    const matchedZone = SCENARIO_ZONES_CALIBRATED.find(z =>
      kmX >= z.x_min && kmX <= z.x_max && kmY >= z.y_min && kmY <= z.y_max
    );

    setSelectedItem({
      tipo: 'coordenada',
      data: {
        x: kmX,
        y: kmY,
        lat: geo.lat,
        lon: geo.lon,
        zona: matchedZone || null,
        es_poblada: matchedZone ? matchedZone.es_poblada : false
      }
    });
  };

  // Acceso directo a vistas focales centradas matemáticamente en el medio del visor visible
  const focusPoint = (kmX, kmY, zoom = 1.6) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const W = rect?.width || 750;
    const H = rect?.height || 580;
    const cx = mapX(kmX);      // kmX
    const cy = mapY(kmY);      // 1000 - kmY
    setScale(zoom);
    setOffset({
      x: W / 2 - cx * zoom,
      y: H / 2 - cy * zoom
    });
  };

  const focusEjeCafetero = () => {
    focusPoint(298, 532, 2.2);
    setSelectedDeptId('COCAL');
    const caldas = DEPARTMENTS_LIST.find(d => d.id === 'COCAL');
    if (caldas) setSelectedItem({ tipo: 'departamento', data: caldas });
  };

  const focusFullCountry = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    const W = rect?.width || 750;
    const H = rect?.height || 580;
    // Ajustar los 1000 x 1000 km simétricamente centrados con margen
    const fitScale = Math.min((W - 30) / 1000, (H - 30) / 1000);
    const s = Math.max(0.4, Math.min(fitScale, 1.15));
    setScale(s);
    setOffset({
      x: W / 2 - 500 * s,
      y: H / 2 - 500 * s
    });
    setSelectedDeptId('');
    setSelectedItem(null);
  };

  // Centrar en un departamento seleccionado
  const handleSelectDepartment = (deptId) => {
    setSelectedDeptId(deptId);
    if (!deptId) {
      focusFullCountry();
      return;
    }
    const dept = DEPARTMENTS_LIST.find(d => d.id === deptId);
    if (dept) {
      setSelectedItem({ tipo: 'departamento', data: dept });
      focusPoint(dept.centroid.x, dept.centroid.y, 1.5);
    }
  };

  // Zona activa para destacar delimitación bounding box de forma limpia
  const activeZone = useMemo(() => {
    if (selectedItem?.tipo === 'zona') return selectedItem.data;
    if (hoveredItem?.tipo === 'zona') return hoveredItem.data;
    if (selectedItem?.tipo === 'coordenada' && selectedItem.data?.zona) return selectedItem.data.zona;
    return null;
  }, [selectedItem, hoveredItem]);

  // Elemento activo (seleccionado o en hover)
  const activeInspection = selectedItem || hoveredItem;

  // Lista ordenada de departamentos para el selector
  const sortedDepartments = useMemo(() => {
    return [...DEPARTMENTS_LIST].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      position="center"
      maxWidth="1220px"
      maxHeight="calc(100vh - 40px)"
      title="Mapa Sísmico Georreferenciado 2D (Colombia)"
      subtitle="Coordenadas oficiales co.json (33 departamentos), delimitación precisa de rectángulos y red de estaciones"
      icon={Compass}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        {/* Barra Superior: Selector de Capas, Buscador de Departamentos y Herramientas */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '8px', padding: '8px 12px',
          backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0'
        }}>
          {/* Toggles de Capas */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', marginRight: '2px', textTransform: 'uppercase' }}>
              Capas:
            </span>

            <button
              onClick={() => setShowCountryGeoJson(!showCountryGeoJson)}
              style={{
                padding: '4px 8px', fontSize: '0.72rem', borderRadius: '6px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s ease',
                backgroundColor: showCountryGeoJson ? '#E0F2FE' : '#FFFFFF',
                color: showCountryGeoJson ? '#0369A1' : '#64748B',
                border: `1px solid ${showCountryGeoJson ? '#7DD3FC' : '#CBD5E1'}`,
                fontWeight: showCountryGeoJson ? 700 : 500
              }}
              title="Frontera de Colombia (custom.geo.json)"
            >
              <Globe size={12} />
              <span>Frontera</span>
            </button>

            <button
              onClick={() => setShowDepartments(!showDepartments)}
              style={{
                padding: '4px 8px', fontSize: '0.72rem', borderRadius: '6px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s ease',
                backgroundColor: showDepartments ? '#ECFDF5' : '#FFFFFF',
                color: showDepartments ? '#047857' : '#64748B',
                border: `1px solid ${showDepartments ? '#6EE7B7' : '#CBD5E1'}`,
                fontWeight: showDepartments ? 700 : 500
              }}
              title="33 Departamentos de Colombia (co.json)"
            >
              <Layers size={12} />
              <span>33 Deptos</span>
            </button>

            <button
              onClick={() => setShowCities(!showCities)}
              style={{
                padding: '4px 8px', fontSize: '0.72rem', borderRadius: '6px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s ease',
                backgroundColor: showCities ? '#ECFDF5' : '#FFFFFF',
                color: showCities ? '#047857' : '#64748B',
                border: `1px solid ${showCities ? '#6EE7B7' : '#CBD5E1'}`,
                fontWeight: showCities ? 700 : 500
              }}
              title="Puntos exactos de ciudades y zonas pobladas principales (clic para ver)"
            >
              <MapPin size={12} />
              <span>Ciudades</span>
            </button>

            <button
              onClick={() => setShowStations(!showStations)}
              style={{
                padding: '4px 8px', fontSize: '0.72rem', borderRadius: '6px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s ease',
                backgroundColor: showStations ? '#EFF6FF' : '#FFFFFF',
                color: showStations ? '#1D4ED8' : '#64748B',
                border: `1px solid ${showStations ? '#93C5FD' : '#CBD5E1'}`,
                fontWeight: showStations ? 700 : 500
              }}
              title="Red nacional de estaciones telemétricas (clic para ver)"
            >
              <Radio size={12} />
              <span>Estaciones</span>
            </button>

            <button
              onClick={() => setShowEvents(!showEvents)}
              style={{
                padding: '4px 8px', fontSize: '0.72rem', borderRadius: '6px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s ease',
                backgroundColor: showEvents ? '#FEE2E2' : '#FFFFFF',
                color: showEvents ? '#B91C1C' : '#64748B',
                border: `1px solid ${showEvents ? '#FCA5A5' : '#CBD5E1'}`,
                fontWeight: showEvents ? 700 : 500
              }}
              title="Sismos activos y réplicas en el plano"
            >
              <ShieldAlert size={12} />
              <span>Sismos</span>
            </button>

            <button
              onClick={() => setShowZones(!showZones)}
              style={{
                padding: '4px 8px', fontSize: '0.72rem', borderRadius: '6px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s ease',
                backgroundColor: showZones ? '#FEF3C7' : '#FFFFFF',
                color: showZones ? '#B45309' : '#64748B',
                border: `1px solid ${showZones ? '#FCD34D' : '#CBD5E1'}`,
                fontWeight: showZones ? 700 : 500
              }}
              title="Delimitaciones rectangulares bounding boxes (activar solo si se desea visualizarlas)"
            >
              <Square size={12} />
              <span>Recuadros Zonas</span>
            </button>

            <button
              onClick={() => setShowDeptBoxes(!showDeptBoxes)}
              style={{
                padding: '4px 8px', fontSize: '0.72rem', borderRadius: '6px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s ease',
                backgroundColor: showDeptBoxes ? '#F3E8FF' : '#FFFFFF',
                color: showDeptBoxes ? '#7E22CE' : '#64748B',
                border: `1px solid ${showDeptBoxes ? '#D8B4FE' : '#CBD5E1'}`,
                fontWeight: showDeptBoxes ? 700 : 500
              }}
              title="Cajas delimitadoras de departamentos"
            >
              <Box size={12} />
              <span>Cajas Deptos</span>
            </button>
          </div>

          {/* Selector de Departamento Directo y Vistas Rápidas */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Dropdown de Departamentos */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <select
                value={selectedDeptId}
                onChange={(e) => handleSelectDepartment(e.target.value)}
                style={{
                  padding: '4px 8px', fontSize: '0.72rem', borderRadius: '6px',
                  backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', color: '#1E293B',
                  fontWeight: 600, cursor: 'pointer', outline: 'none'
                }}
                title="Seleccionar y enfocar un departamento de Colombia"
              >
                <option value="">Explorar Departamento...</option>
                {sortedDepartments.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.id})
                  </option>
                ))}
              </select>
            </div>

            <button
              className="btn-secondary"
              onClick={focusEjeCafetero}
              style={{ padding: '4px 8px', fontSize: '0.72rem', fontWeight: 600, color: '#0F766E', backgroundColor: '#F0FDFA', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Enfocar con zoom Caldas, Risaralda y Quindío"
            >
              <Target size={12} />
              <span>Eje Cafetero</span>
            </button>

            <button
              className="btn-secondary"
              onClick={focusFullCountry}
              style={{ padding: '4px 8px', fontSize: '0.72rem', fontWeight: 600, color: '#0369A1', backgroundColor: '#F0F9FF', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Centrar mapa en el punto medio oficial (500, 500) km"
            >
              <Crosshair size={12} />
              <span>Centro (500, 500)</span>
            </button>

            <button
              className="btn-secondary"
              onClick={focusFullCountry}
              style={{ padding: '4px 8px', fontSize: '0.72rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Vista general completa de Colombia"
            >
              <Maximize2 size={12} />
              <span>Vista Total</span>
            </button>

            <button
              className="btn-secondary"
              onClick={() => handleZoom(1.2)}
              style={{ padding: '4px 7px', fontSize: '0.72rem' }}
              title="Acercar (Zoom In centrado en el medio)"
            >
              <ZoomIn size={13} />
            </button>

            <button
              className="btn-secondary"
              onClick={() => handleZoom(0.83)}
              style={{ padding: '4px 7px', fontSize: '0.72rem' }}
              title="Alejar (Zoom Out centrado en el medio)"
            >
              <ZoomOut size={13} />
            </button>

            <button
              className="btn-secondary"
              onClick={focusFullCountry}
              style={{ padding: '4px 7px', fontSize: '0.72rem' }}
              title="Restablecer vista centrada oficial"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>

        {/* Contenedor Principal: Mapa 2D Claro + Panel Lateral */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 310px', gap: '10px', alignItems: 'stretch' }}>
          
          {/* Lienzo SVG Cartográfico Claro [0, 1000] x [0, 1000] km */}
          <div
            ref={containerRef}
            style={{
              width: '100%',
              height: '580px',
              backgroundColor: '#EFF6FF', // Mar / Océano claro azul agua
              borderRadius: '8px',
              position: 'relative',
              overflow: 'hidden',
              cursor: isPanning ? 'grabbing' : 'grab',
              border: '1.5px solid #BAE6FD',
              boxShadow: 'inset 0 2px 6px rgba(186, 230, 253, 0.25)'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            onClick={handleSvgClick}
          >
            <svg
              ref={svgRef}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
                overflow: 'hidden'
              }}
            >
              <defs>
                {/* Filtro de Sombra Suave para Elementos Elevados */}
                <filter id="softShadow" x="-10%" y="-10%" width="130%" height="130%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0F172A" floodOpacity="0.12" />
                </filter>
                <filter id="glowP3" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#EF4444" floodOpacity="0.4" />
                </filter>
                <filter id="highlightGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#0284C7" floodOpacity="0.5" />
                </filter>

                {/* Patrón de cuadrícula cartesiana cada 100 km */}
                <pattern id="grid100Light" width="100" height="100" patternUnits="userSpaceOnUse">
                  <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
                </pattern>
                {/* Patrón de cuadrícula cada 500 km */}
                <pattern id="grid500Light" width="500" height="500" patternUnits="userSpaceOnUse">
                  <path d="M 500 0 L 0 0 0 500" fill="none" stroke="#CBD5E1" strokeWidth="1.8" />
                </pattern>

                {/* Gradientes para sismos */}
                <radialGradient id="gradP3" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#F87171" />
                  <stop offset="100%" stopColor="#DC2626" />
                </radialGradient>
                <radialGradient id="gradP2" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FCD34D" />
                  <stop offset="100%" stopColor="#D97706" />
                </radialGradient>
                <radialGradient id="gradP1" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#6EE7B7" />
                  <stop offset="100%" stopColor="#059669" />
                </radialGradient>
              </defs>

              {/* Capa de Transformación Cartesiana Centrada en el Visor [0, 1000] x [0, 1000] km */}
              <g
                transform={`translate(${offset.x}, ${offset.y}) scale(${scale})`}
                style={{
                  transition: isPanning ? 'none' : 'transform 0.08s ease-out'
                }}
              >
                {/* Fondo del mar / cuadrícula */}
                <rect x="0" y="0" width="1000" height="1000" fill="#F0F7FF" />
                {showGrid && (
                  <>
                    <rect x="0" y="0" width="1000" height="1000" fill="url(#grid100Light)" />
                    <rect x="0" y="0" width="1000" height="1000" fill="url(#grid500Light)" />
                  </>
                )}

                {/* Ejes Centrales Cartesianos (X = 500 km, Y = 500 km) */}
                <line x1="500" y1="0" x2="500" y2="1000" stroke="#0284C7" strokeWidth="1.2" strokeDasharray="5 5" opacity="0.45" />
                <line x1="0" y1="500" x2="1000" y2="500" stroke="#0284C7" strokeWidth="1.2" strokeDasharray="5 5" opacity="0.45" />

                {/* Borde exterior del plano cartesiano [0, 1000] km */}
                <rect x="0" y="0" width="1000" height="1000" fill="none" stroke="#94A3B8" strokeWidth="2.5" />

                {/* Marcador del Centro Oficial del Plano (500, 500) km */}
                <g transform="translate(500, 500)" pointerEvents="none">
                  <circle r="7" fill="none" stroke="#0284C7" strokeWidth="1.4" opacity="0.65" />
                  <circle r="2" fill="#0284C7" opacity="0.85" />
                  <text x="10" y="4" fill="#0369A1" fontSize="10" fontWeight="700" opacity="0.8" fontFamily="sans-serif">
                    Centro Oficial (500, 500) km
                  </text>
                </g>

              {/* 1. Capa Vectorial de Colombia desde custom.geo.json (Masa Continental Base) */}
              {showCountryGeoJson && customColombiaSvgPath && (
                <g className="custom-geojson-colombia">
                  <path
                    d={customColombiaSvgPath}
                    fill="#FFFFFF"
                    stroke="#0284C7"
                    strokeWidth="2.2"
                    filter="url(#softShadow)"
                    style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                    onMouseEnter={() => setHoveredItem({
                      tipo: 'pais',
                      data: {
                        nombre: "República de Colombia",
                        formal_en: COLOMBIA_COUNTRY_PROPERTIES.formal_en || "Republic of Colombia",
                        fuente: "custom.geo.json (Límites Oficiales)",
                        sovereignt: "Colombia",
                        poblacion: "50+ millones de habitantes"
                      }
                    })}
                    onMouseLeave={() => setHoveredItem(null)}
                  />
                  {/* Etiquetas de Agua */}
                  <text x="65" y="520" fill="#0284C7" fontSize="15" fontWeight="700" opacity="0.32" transform="rotate(-70 65 520)" pointerEvents="none">
                    OCÉANO PACÍFICO
                  </text>
                  <text x="280" y="90" fill="#0284C7" fontSize="15" fontWeight="700" opacity="0.32" pointerEvents="none">
                    MAR CARIBE
                  </text>
                </g>
              )}

              {/* 2. Capa Vectorial Oficial de los 33 Departamentos de Colombia (co.json) */}
              {showDepartments && (
                <g className="geojson-33-departments">
                  {DEPARTMENTS_LIST.map((dept) => {
                    const isSelected = selectedDeptId === dept.id || selectedItem?.data?.id === dept.id;
                    const isHovered = hoveredItem?.tipo === 'departamento' && hoveredItem?.data?.id === dept.id;

                    return (
                      <g key={dept.id} className="interactive-dept">
                        <path
                          d={dept.path}
                          fill={isSelected ? 'rgba(56, 189, 248, 0.42)' : (isHovered ? 'rgba(56, 189, 248, 0.28)' : dept.fill)}
                          stroke={isSelected ? '#0284C7' : (isHovered ? '#0284C7' : dept.stroke)}
                          strokeWidth={isSelected ? "2.4" : (isHovered ? "1.8" : "1.1")}
                          strokeDasharray={isSelected ? "none" : "3 2"}
                          filter={isSelected ? "url(#highlightGlow)" : undefined}
                          style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                          onMouseEnter={() => setHoveredItem({ tipo: 'departamento', data: dept })}
                          onMouseLeave={() => setHoveredItem(null)}
                          onClick={() => {
                            setSelectedDeptId(dept.id);
                            setSelectedItem({ tipo: 'departamento', data: dept });
                          }}
                        />

                        {/* Etiqueta del Departamento en su Centroide */}
                        {(scale >= 1.2 || isSelected || isHovered) && (
                          <text
                            x={mapX(dept.centroid.x)}
                            y={mapY(dept.centroid.y)}
                            fill="#1E293B"
                            fontSize={isSelected ? "13" : "11"}
                            fontWeight="800"
                            fontFamily="sans-serif"
                            textAnchor="middle"
                            pointerEvents="none"
                            style={{ textShadow: '0 1px 3px rgba(255,255,255,0.9)' }}
                          >
                            {dept.name}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              )}

              {/* 3. Cajas Delimitadoras de Departamentos (Bounding Boxes Matemáticas de co.json) */}
              {showDeptBoxes && (
                <g className="dept-bounding-boxes">
                  {DEPARTMENTS_LIST.map(dept => {
                    const bx = mapX(dept.box.minX);
                    const by = mapY(dept.box.maxY);
                    const bw = dept.box.width;
                    const bh = dept.box.height;
                    const isSelected = selectedDeptId === dept.id;

                    return (
                      <g key={'box-' + dept.id}>
                        <rect
                          x={bx}
                          y={by}
                          width={bw}
                          height={bh}
                          rx="4"
                          fill={isSelected ? 'rgba(147, 51, 234, 0.15)' : 'rgba(147, 51, 234, 0.04)'}
                          stroke={isSelected ? '#9333EA' : '#C084FC'}
                          strokeWidth={isSelected ? "1.8" : "1"}
                          strokeDasharray="4 3"
                          pointerEvents="none"
                        />
                      </g>
                    );
                  })}
                </g>
              )}

              {/* 4. Delimitaciones Sutiles de Zonas (Solo si el usuario activa la capa, sin pastillas ni recuadros gigantes) */}
              {showZones && SCENARIO_ZONES_CALIBRATED.map(z => {
                const rx = mapX(z.x_min);
                const ry = mapY(z.y_max);
                const rw = z.x_max - z.x_min;
                const rh = z.y_max - z.y_min;
                const isPop = z.es_poblada;

                return (
                  <rect
                    key={'zone-outline-' + z.id}
                    x={rx}
                    y={ry}
                    width={rw}
                    height={rh}
                    rx="6"
                    ry="6"
                    fill={isPop ? 'rgba(16, 185, 129, 0.03)' : 'rgba(148, 163, 184, 0.02)'}
                    stroke={isPop ? '#059669' : '#94A3B8'}
                    strokeWidth="1.2"
                    strokeDasharray={isPop ? '4 3' : '6 4'}
                    pointerEvents="none"
                  />
                );
              })}

              {/* 4b. Delimitación Bounding Box Destacada de la Zona Activa (Aparece únicamente al seleccionar o pasar el cursor) */}
              {activeZone && (
                <g key={'active-zone-' + activeZone.id} pointerEvents="none">
                  <rect
                    x={mapX(activeZone.x_min)}
                    y={mapY(activeZone.y_max)}
                    width={activeZone.x_max - activeZone.x_min}
                    height={activeZone.y_max - activeZone.y_min}
                    rx="8"
                    ry="8"
                    fill={activeZone.es_poblada ? 'rgba(16, 185, 129, 0.12)' : 'rgba(148, 163, 184, 0.08)'}
                    stroke={activeZone.es_poblada ? '#059669' : '#475569'}
                    strokeWidth="2.2"
                    strokeDasharray={activeZone.es_poblada ? 'none' : '5 4'}
                  />
                  {/* Etiqueta flotante pequeña solo en la zona activa */}
                  <g transform={`translate(${mapX(activeZone.x_min) + 6}, ${mapY(activeZone.y_max) + 6})`}>
                    <rect
                      width={Math.min(170, activeZone.x_max - activeZone.x_min - 12)}
                      height="18"
                      rx="4"
                      fill="#FFFFFF"
                      stroke={activeZone.es_poblada ? '#059669' : '#64748B'}
                      strokeWidth="1"
                      filter="url(#softShadow)"
                    />
                    <circle cx="9" cy="9" r="3.5" fill={activeZone.es_poblada ? '#10B981' : '#94A3B8'} />
                    <text x="16" y="13" fill="#1E293B" fontSize="9" fontWeight="700" fontFamily="sans-serif">
                      {activeZone.ciudad || activeZone.nombre.slice(0, 20)}
                    </text>
                  </g>
                </g>
              )}

              {/* 5. Enlaces de Réplicas (Líneas Índigo Conectando Sismos) */}
              {showEvents && geoData?.enlaces_replicas?.map((enlace, idx) => (
                <g key={idx}>
                  <line
                    x1={mapX(enlace.origen_x)}
                    y1={mapY(enlace.origen_y)}
                    x2={mapX(enlace.destino_x)}
                    y2={mapY(enlace.destino_y)}
                    stroke="#6366F1"
                    strokeWidth="2.2"
                    strokeDasharray="5 3"
                    opacity="0.85"
                  />
                  <circle
                    cx={(mapX(enlace.origen_x) + mapX(enlace.destino_x)) / 2}
                    cy={(mapY(enlace.origen_y) + mapY(enlace.destino_y)) / 2}
                    r="3.5"
                    fill="#4F46E5"
                  />
                </g>
              ))}

              {/* 6. PUNTOS EXACTOS DE CIUDADES Y ZONAS POBLADAS (Ubicados en sus coordenadas reales y clicables) */}
              {showCities && SCENARIO_ZONES_CALIBRATED.map(z => {
                if (z.x === undefined || z.y === undefined) return null;
                const cx = mapX(z.x);
                const cy = mapY(z.y);
                const isHovered = hoveredItem?.tipo === 'zona' && hoveredItem?.data?.id === z.id;
                const isSelected = selectedItem?.tipo === 'zona' && selectedItem?.data?.id === z.id;
                const isPop = z.es_poblada;

                return (
                  <g
                    key={'city-pt-' + z.id}
                    transform={`translate(${cx}, ${cy})`}
                    className="interactive-node"
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedItem({ tipo: 'zona', data: z });
                    }}
                    onMouseEnter={() => setHoveredItem({ tipo: 'zona', data: z })}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {/* Anillo de enfoque reactivo */}
                    {(isHovered || isSelected) && (
                      <circle
                        r="14"
                        fill="none"
                        stroke={isPop ? '#10B981' : '#64748B'}
                        strokeWidth="1.8"
                        strokeDasharray="3 3"
                        opacity="0.9"
                      />
                    )}

                    {/* Pin de ciudad exacto */}
                    <circle
                      r={isSelected ? 6.5 : (isHovered ? 6 : 5)}
                      fill={isPop ? '#10B981' : '#64748B'}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      filter="url(#softShadow)"
                    />
                    <circle
                      r={isSelected ? 3 : 2}
                      fill={isPop ? '#064E3B' : '#1E293B'}
                    />

                    {/* Nombre limpio de la ciudad con sombra de alto contraste */}
                    <text
                      x="0"
                      y="-9"
                      textAnchor="middle"
                      fill={isSelected ? '#047857' : (isPop ? '#065F46' : '#475569')}
                      fontSize={isSelected ? "11" : "10"}
                      fontWeight="800"
                      fontFamily="sans-serif"
                      pointerEvents="none"
                      style={{
                        textShadow: '0 1px 3px rgba(255,255,255,0.95), 0 -1px 3px rgba(255,255,255,0.95), 1px 0 3px rgba(255,255,255,0.95), -1px 0 3px rgba(255,255,255,0.95)'
                      }}
                    >
                      {z.ciudad || z.nombre}
                    </text>
                  </g>
                );
              })}

              {/* 7. ESTACIONES SÍSMICAS: Situadas con exactitud dentro de su departamento y clicables */}
              {showStations && (geoData?.estaciones?.length ? geoData.estaciones : STATIONS_CALIBRATED).map(st => {
                const sx = mapX(st.x);
                const sy = mapY(st.y);
                const isHovered = hoveredItem?.tipo === 'estacion' && hoveredItem?.data?.codigo === st.codigo;
                const isSelected = selectedItem?.tipo === 'estacion' && selectedItem?.data?.codigo === st.codigo;

                return (
                  <g
                    key={st.codigo}
                    transform={`translate(${sx}, ${sy})`}
                    className="interactive-node"
                    onMouseEnter={() => setHoveredItem({ tipo: 'estacion', data: st })}
                    onMouseLeave={() => setHoveredItem(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedItem({ tipo: 'estacion', data: st });
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Onda concéntrica telemétrica */}
                    <circle
                      r={isHovered || isSelected ? 14 : 11}
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="1.2"
                      strokeDasharray="3 3"
                      opacity={isHovered || isSelected ? 0.95 : 0.45}
                    />
                    
                    {/* Pin de estación: Círculo blanco con núcleo azul */}
                    <circle r={isSelected ? 7 : 5.5} fill="#FFFFFF" stroke="#1D4ED8" strokeWidth="2" filter="url(#softShadow)" />
                    <circle r={isSelected ? 3.5 : 2.5} fill="#2563EB" />

                    {/* Código de estación visible solo al interactuar o hacer zoom */}
                    {(isHovered || isSelected || scale >= 1.5) && (
                      <g transform="translate(9, -8)" pointerEvents="none">
                        <rect
                          width="88"
                          height="17"
                          rx="3"
                          fill="#FFFFFF"
                          stroke="#2563EB"
                          strokeWidth="1"
                          filter="url(#softShadow)"
                          opacity="0.96"
                        />
                        <text x="5" y="12" fill="#1E40AF" fontSize="9" fontWeight="700" fontFamily="sans-serif">
                          {st.codigo}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* 8. PIN DEL PUNTO MARCADO (Al hacer clic en cualquier área del mapa) */}
              {selectedItem?.tipo === 'coordenada' && (
                <g transform={`translate(${mapX(selectedItem.data.x)}, ${mapY(selectedItem.data.y)})`} pointerEvents="none">
                  <circle r="16" fill="rgba(249, 115, 22, 0.2)" stroke="#EA580C" strokeWidth="1.5" strokeDasharray="3 3" />
                  <circle r="6" fill="#EA580C" stroke="#FFFFFF" strokeWidth="2" filter="url(#softShadow)" />
                  <circle r="2.5" fill="#FFFFFF" />
                  <text
                    x="0"
                    y="-10"
                    textAnchor="middle"
                    fill="#C2410C"
                    fontSize="10"
                    fontWeight="800"
                    fontFamily="sans-serif"
                    style={{ textShadow: '0 1px 3px rgba(255,255,255,0.95)' }}
                  >
                    ({selectedItem.data.x}, {selectedItem.data.y}) km
                  </text>
                </g>
              )}

              {/* 7. Eventos Sísmicos (Epicentros con Ondas y Magnitud) */}
              {showEvents && geoData?.eventos?.map(ev => {
                const p = ev.prioridad || 3;
                const radius = Math.max(8, Math.min((ev.magnitud || 4.0) * 3.4, 28));
                const esActivo = ev.es_activo !== false;
                const isHovered = hoveredItem?.tipo === 'evento' && hoveredItem?.data?.id === ev.id;
                const isSelected = selectedItem?.tipo === 'evento' && selectedItem?.data?.id === ev.id;

                const gradId = p === 3 ? 'url(#gradP3)' : (p === 2 ? 'url(#gradP2)' : 'url(#gradP1)');
                const borderColor = p === 3 ? '#DC2626' : (p === 2 ? '#D97706' : '#059669');

                const ex = mapX(ev.coordenadas?.x ?? ev.coordinates?.x ?? ev.x ?? 500);
                const ey = mapY(ev.coordenadas?.y ?? ev.coordinates?.y ?? ev.y ?? 500);

                return (
                  <g
                    key={ev.id}
                    transform={`translate(${ex}, ${ey})`}
                    className="interactive-node"
                    onClick={() => {
                      setSelectedItem({ tipo: 'evento', data: ev });
                      if (onSelectEvent) onSelectEvent(ev);
                    }}
                    onMouseEnter={() => setHoveredItem({ tipo: 'evento', data: ev })}
                    onMouseLeave={() => setHoveredItem(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Onda de choque exterior */}
                    <circle
                      r={radius + (isHovered || isSelected ? 8 : 4)}
                      fill={borderColor}
                      opacity={isHovered || isSelected ? 0.35 : 0.18}
                      filter={p === 3 ? 'url(#glowP3)' : undefined}
                    />

                    {/* Círculo del Epicentro */}
                    <circle
                      r={radius}
                      fill={gradId}
                      stroke="#FFFFFF"
                      strokeWidth={esActivo ? 2 : 1.5}
                      strokeDasharray={esActivo ? 'none' : '3 2'}
                      filter="url(#softShadow)"
                    />

                    {/* Pastilla con ID y Magnitud */}
                    <text
                      x="0"
                      y="4"
                      fill="#FFFFFF"
                      fontSize="10"
                      fontWeight="800"
                      fontFamily="sans-serif"
                      textAnchor="middle"
                      pointerEvents="none"
                    >
                      {ev.magnitud ? `M${Number(ev.magnitud).toFixed(1)}` : `#${ev.id}`}
                    </text>
                  </g>
                );
              })}

              {/* Ejes y Coordenadas en las Esquinas */}
              <text x="12" y="988" fill="#64748B" fontSize="13" fontFamily="sans-serif" fontWeight="700">(0, 0) km</text>
              <text x="910" y="988" fill="#64748B" fontSize="13" fontFamily="sans-serif" fontWeight="700">X=1000 km</text>
              <text x="12" y="24" fill="#64748B" fontSize="13" fontFamily="sans-serif" fontWeight="700">Y=1000 km</text>
            </g>
          </svg>

            {/* Tooltip flotante interactivo al pasar el cursor (Solo iconos de Lucide) */}
            {hoveredItem && !selectedItem && (
              <div style={{
                position: 'absolute',
                left: `${Math.min(tooltipPos.x + 14, 520)}px`,
                top: `${Math.min(tooltipPos.y + 14, 440)}px`,
                backgroundColor: 'rgba(15, 23, 42, 0.94)',
                color: '#FFFFFF',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                pointerEvents: 'none',
                zIndex: 30,
                boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.18)',
                backdropFilter: 'blur(4px)',
                maxWidth: '270px'
              }}>
                <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {hoveredItem.tipo === 'zona' && (
                    <>
                      <MapPin size={12} style={{ color: '#10B981' }} />
                      <span>{hoveredItem.data.ciudad || hoveredItem.data.nombre}</span>
                    </>
                  )}
                  {hoveredItem.tipo === 'estacion' && (
                    <>
                      <Radio size={12} style={{ color: '#3B82F6' }} />
                      <span>{hoveredItem.data.codigo} · {hoveredItem.data.nombre}</span>
                    </>
                  )}
                  {hoveredItem.tipo === 'evento' && (
                    <>
                      <Activity size={12} style={{ color: '#EF4444' }} />
                      <span>SIS-{String(hoveredItem.data.id).padStart(6, '0')} (M {Number(hoveredItem.data.magnitud).toFixed(1)})</span>
                    </>
                  )}
                  {hoveredItem.tipo === 'departamento' && (
                    <>
                      <Building size={12} style={{ color: '#A855F7' }} />
                      <span>{hoveredItem.data.name}</span>
                    </>
                  )}
                </div>
                <div style={{ fontSize: '0.66rem', color: '#94A3B8', marginTop: '2px' }}>
                  {hoveredItem.tipo === 'zona' && `Punto: (${hoveredItem.data.x}, ${hoveredItem.data.y}) km · Clic para seleccionar`}
                  {hoveredItem.tipo === 'estacion' && `Coords: (${hoveredItem.data.x}, ${hoveredItem.data.y}) km · Clic para inspeccionar`}
                  {hoveredItem.tipo === 'evento' && `Prof: ${hoveredItem.data.profundidad} km · Clic para abrir sismo`}
                  {hoveredItem.tipo === 'departamento' && `Centroide: (${hoveredItem.data.centroid.x}, ${hoveredItem.data.centroid.y}) km · Clic para enfocar`}
                </div>
              </div>
            )}

            {/* Escala Gráfica, Centro Oficial y Atribución */}
            <div style={{
              position: 'absolute', bottom: '8px', left: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #CBD5E1', borderRadius: '5px',
              padding: '4px 9px', fontSize: '0.68rem', color: '#475569',
              boxShadow: '0 2px 5px rgba(0,0,0,0.06)', pointerEvents: 'none',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <span><strong>Escenario:</strong> 1000 × 1000 km²</span>
              <span>·</span>
              <span><strong>Centro Oficial:</strong> (500, 500) km</span>
              <span>·</span>
              <span><strong>Zoom:</strong> {Math.round(scale * 100)}%</span>
            </div>
          </div>

          {/* Panel Lateral: Ficha Estructurada de Inspección */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '10px',
            backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0',
            padding: '12px', overflowY: 'auto', maxHeight: '580px'
          }}>
            <div style={{
              fontSize: '0.78rem', fontWeight: 800, color: '#1E293B',
              borderBottom: '1px solid #E2E8F0', paddingBottom: '6px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Navigation size={14} style={{ color: '#2563EB' }} />
                Inspección del Elemento
              </span>
              {selectedItem && (
                <button
                  onClick={() => { setSelectedItem(null); setSelectedDeptId(''); }}
                  style={{ fontSize: '0.68rem', color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Contenido Dinámico de la Ficha */}
            {activeInspection ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem' }}>
                
                {/* 1. Departamento de co.json */}
                {activeInspection.tipo === 'departamento' && (() => {
                  const dept = activeInspection.data;
                  return (
                    <>
                      <div style={{ backgroundColor: '#F0FDF4', padding: '8px', borderRadius: '6px', border: '1px solid #86EFAC' }}>
                        <div style={{ fontWeight: 800, color: '#15803D', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Building size={15} />
                          <span>{dept.name}</span>
                        </div>
                        <div style={{ color: '#166534', fontSize: '0.72rem', marginTop: '2px' }}>
                          Código ISO: <strong>{dept.id}</strong> · Colombia (co.json)
                        </div>
                      </div>

                      {/* Delimitación Exacta de la Caja Bounding Box */}
                      <div style={{ backgroundColor: '#FAF5FF', padding: '7px 9px', borderRadius: '5px', border: '1px solid #E9D5FF' }}>
                        <span style={{ color: '#7E22CE', fontWeight: 700, fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Box size={12} />
                          <span>Delimitación Bounding Box [0, 1000] km:</span>
                        </span>
                        <div style={{ marginTop: '3px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '0.72rem' }}>
                          <div>X: <strong>[{dept.box.minX}, {dept.box.maxX}] km</strong></div>
                          <div>Y: <strong>[{dept.box.minY}, {dept.box.maxY}] km</strong></div>
                          <div>Ancho: <strong>{dept.box.width.toFixed(1)} km</strong></div>
                          <div>Alto: <strong>{dept.box.height.toFixed(1)} km</strong></div>
                        </div>
                      </div>

                      {/* Centroide Geográfico */}
                      <div style={{ backgroundColor: '#F8FAFC', padding: '6px 8px', borderRadius: '5px', border: '1px solid #E2E8F0' }}>
                        <span style={{ color: '#64748B', fontSize: '0.68rem', display: 'block' }}>Centroide Cartesiano:</span>
                        <code style={{ fontSize: '0.74rem', color: '#1E293B', fontWeight: 700 }}>
                          X = {dept.centroid.x} km · Y = {dept.centroid.y} km
                        </code>
                      </div>

                      <div style={{ backgroundColor: '#EFF6FF', padding: '6px 8px', borderRadius: '5px', border: '1px solid #BFDBFE' }}>
                        <span style={{ color: '#1E40AF', fontSize: '0.68rem', display: 'block' }}>Centroide GPS (WGS84):</span>
                        <code style={{ fontSize: '0.74rem', color: '#1D4ED8', fontWeight: 700 }}>
                          {dept.centroid.lat.toFixed(4)}° N, {dept.centroid.lon.toFixed(4)}° W
                        </code>
                      </div>

                      <button
                        className="btn-secondary"
                        onClick={() => focusPoint(dept.centroid.x, dept.centroid.y, 1.5)}
                        style={{ padding: '5px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                      >
                        <Crosshair size={12} />
                        <span>Enfocar Departamento</span>
                      </button>
                    </>
                  );
                })()}

                {/* 2. Sismo */}
                {activeInspection.tipo === 'evento' && (() => {
                  const ev = activeInspection.data;
                  const ex = ev.coordenadas?.x ?? ev.coordinates?.x ?? ev.x ?? 500;
                  const ey = ev.coordenadas?.y ?? ev.coordinates?.y ?? ev.y ?? 500;
                  const geo = cartesianToGeo(ex, ey);
                  const p = ev.prioridad || 3;
                  const badgeColor = p === 3 ? '#DC2626' : (p === 2 ? '#D97706' : '#059669');

                  return (
                    <>
                      <div style={{ backgroundColor: '#FEF2F2', padding: '8px', borderRadius: '6px', border: `1px solid ${p === 3 ? '#FCA5A5' : '#FED7AA'}` }}>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem', color: badgeColor, display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Activity size={14} />
                          <span>SIS-{String(ev.id).padStart(6, '0')}</span>
                        </div>
                        <div style={{ color: '#475569', fontWeight: 600, marginTop: '2px' }}>
                          Magnitud: <strong>M {Number(ev.magnitud).toFixed(1)}</strong> · Prof: <strong>{ev.profundidad} km</strong>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        <div style={{ backgroundColor: '#F8FAFC', padding: '6px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                          <span style={{ color: '#64748B', fontSize: '0.68rem' }}>Prioridad:</span>
                          <div style={{ fontWeight: 700, color: badgeColor }}>P{p} ({p === 3 ? 'Alta' : p === 2 ? 'Media' : 'Baja'})</div>
                        </div>
                        <div style={{ backgroundColor: '#F8FAFC', padding: '6px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                          <span style={{ color: '#64748B', fontSize: '0.68rem' }}>Estado AVL:</span>
                          <div style={{ fontWeight: 700, color: ev.es_activo !== false ? '#059669' : '#64748B' }}>
                            {ev.es_activo !== false ? 'Activo' : 'Archivado'}
                          </div>
                        </div>
                      </div>

                      <div style={{ backgroundColor: '#F8FAFC', padding: '6px 8px', borderRadius: '5px', border: '1px solid #E2E8F0' }}>
                        <span style={{ color: '#64748B', fontSize: '0.68rem', display: 'block' }}>Plano Cartesiano [0, 1000] km:</span>
                        <code style={{ fontSize: '0.74rem', color: '#1E293B', fontWeight: 700 }}>
                          X = {Number(ex).toFixed(1)} km · Y = {Number(ey).toFixed(1)} km
                        </code>
                      </div>

                      <div style={{ backgroundColor: '#EFF6FF', padding: '6px 8px', borderRadius: '5px', border: '1px solid #BFDBFE' }}>
                        <span style={{ color: '#1E40AF', fontSize: '0.68rem', display: 'block' }}>Coordenadas GPS (WGS84):</span>
                        <code style={{ fontSize: '0.74rem', color: '#1D4ED8', fontWeight: 700 }}>
                          {geo.lat}° N, {geo.lon}° W
                        </code>
                      </div>

                      {ev.chosen_reference_id && (
                        <div style={{ backgroundColor: '#F5F3FF', padding: '6px', borderRadius: '5px', border: '1px solid #DDD6FE', color: '#6D28D9', fontSize: '0.7rem' }}>
                          Réplica asociada al sismo principal <strong>#{ev.chosen_reference_id}</strong>
                        </div>
                      )}

                      <button
                        className="btn-secondary"
                        onClick={() => {
                          if (onSelectEvent) onSelectEvent(ev);
                        }}
                        style={{ padding: '5px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                      >
                        <Search size={12} />
                        <span>Inspeccionar Evento en Formulario</span>
                      </button>
                    </>
                  );
                })()}

                {/* 3. Estación Sísmica */}
                {activeInspection.tipo === 'estacion' && (() => {
                  const st = activeInspection.data;
                  const geo = cartesianToGeo(st.x, st.y);
                  return (
                    <>
                      <div style={{ backgroundColor: '#EFF6FF', padding: '8px', borderRadius: '6px', border: '1px solid #BFDBFE' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Radio size={14} />
                          {st.codigo}
                        </div>
                        <div style={{ color: '#334155', fontWeight: 600, marginTop: '2px' }}>
                          {st.nombre}
                        </div>
                      </div>

                      <div style={{ backgroundColor: '#F8FAFC', padding: '6px 8px', borderRadius: '5px', border: '1px solid #E2E8F0' }}>
                        <span style={{ color: '#64748B', fontSize: '0.68rem', display: 'block' }}>Plano Cartesiano [0, 1000] km:</span>
                        <code style={{ fontSize: '0.74rem', color: '#1E293B', fontWeight: 700 }}>
                          X = {st.x} km · Y = {st.y} km
                        </code>
                      </div>

                      <div style={{ backgroundColor: '#EFF6FF', padding: '6px 8px', borderRadius: '5px', border: '1px solid #BFDBFE' }}>
                        <span style={{ color: '#1E40AF', fontSize: '0.68rem', display: 'block' }}>Ubicación GPS (WGS84):</span>
                        <code style={{ fontSize: '0.74rem', color: '#1D4ED8', fontWeight: 700 }}>
                          {geo.lat}° N, {geo.lon}° W
                        </code>
                      </div>

                      <div style={{ color: '#059669', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} />
                        Estación telemétrica en servicio
                      </div>

                      <button
                        className="btn-secondary"
                        onClick={() => focusPoint(st.x, st.y, 1.8)}
                        style={{ padding: '5px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                      >
                        <Crosshair size={12} />
                        <span>Enfocar Estación</span>
                      </button>
                    </>
                  );
                })()}

                {/* 4. Zona / Ciudad */}
                {activeInspection.tipo === 'zona' && (() => {
                  const z = activeInspection.data;
                  const geo = z.x !== undefined && z.y !== undefined ? cartesianToGeo(z.x, z.y) : null;
                  return (
                    <>
                      <div style={{ backgroundColor: z.es_poblada ? '#ECFDF5' : '#F8FAFC', padding: '8px', borderRadius: '6px', border: `1px solid ${z.es_poblada ? '#A7F3D0' : '#E2E8F0'}` }}>
                        <div style={{ fontWeight: 800, color: z.es_poblada ? '#047857' : '#475569', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <MapPin size={14} />
                          {z.ciudad || z.nombre}
                        </div>
                        <div style={{ color: z.es_poblada ? '#059669' : '#64748B', fontWeight: 600, fontSize: '0.72rem', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {z.es_poblada ? (
                            <>
                              <Building2 size={12} />
                              <span>Zona Urbana Poblada (Alta P3 si H ≤ 30 km)</span>
                            </>
                          ) : (
                            <>
                              <Trees size={12} />
                              <span>Zona Rural / No Poblada</span>
                            </>
                          )}
                        </div>
                        {z.depto && (
                          <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '2px' }}>
                            Departamento: <strong>{z.depto}</strong>
                          </div>
                        )}
                      </div>

                      {/* Coordenadas Exactas del Punto */}
                      {z.x !== undefined && z.y !== undefined && (
                        <div style={{ backgroundColor: '#F8FAFC', padding: '6px 8px', borderRadius: '5px', border: '1px solid #E2E8F0' }}>
                          <span style={{ color: '#64748B', fontSize: '0.68rem', display: 'block' }}>Ubicación Exacta del Punto:</span>
                          <code style={{ fontSize: '0.74rem', color: '#047857', fontWeight: 700 }}>
                            X = {z.x} km · Y = {z.y} km
                          </code>
                          {geo && (
                            <div style={{ fontSize: '0.68rem', color: '#059669', marginTop: '2px' }}>
                              GPS: {geo.lat}° N, {geo.lon}° W
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bounding Box Delimitador */}
                      <div style={{ backgroundColor: '#FAF5FF', padding: '6px 8px', borderRadius: '5px', border: '1px solid #E9D5FF' }}>
                        <span style={{ color: '#7E22CE', fontSize: '0.68rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Box size={12} />
                          <span>Delimitación Bounding Box [0, 1000] km:</span>
                        </span>
                        <div style={{ marginTop: '2px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', fontSize: '0.7rem', color: '#4A044E' }}>
                          <div>X: <strong>[{z.x_min}, {z.x_max}]</strong></div>
                          <div>Y: <strong>[{z.y_min}, {z.y_max}]</strong></div>
                        </div>
                      </div>

                      {z.x !== undefined && z.y !== undefined && (
                        <button
                          className="btn-secondary"
                          onClick={() => focusPoint(z.x, z.y, 1.8)}
                          style={{ padding: '5px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                        >
                          <Crosshair size={12} />
                          <span>Enfocar Ciudad</span>
                        </button>
                      )}
                    </>
                  );
                })()}

                {/* 5. Punto Marcado en el Mapa */}
                {activeInspection.tipo === 'coordenada' && (() => {
                  const pt = activeInspection.data;
                  return (
                    <>
                      <div style={{ backgroundColor: '#FFF7ED', padding: '8px', borderRadius: '6px', border: '1px solid #FFEDD5' }}>
                        <div style={{ fontWeight: 800, color: '#C2410C', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Crosshair size={14} />
                          <span>Punto Marcado en el Mapa</span>
                        </div>
                        <div style={{ color: '#9A3412', fontSize: '0.72rem', marginTop: '2px' }}>
                          Coordenada cartesiana capturada por clic directo
                        </div>
                      </div>

                      <div style={{ backgroundColor: '#F8FAFC', padding: '6px 8px', borderRadius: '5px', border: '1px solid #E2E8F0' }}>
                        <span style={{ color: '#64748B', fontSize: '0.68rem', display: 'block' }}>Plano Cartesiano [0, 1000] km:</span>
                        <code style={{ fontSize: '0.74rem', color: '#1E293B', fontWeight: 700 }}>
                          X = {pt.x} km · Y = {pt.y} km
                        </code>
                      </div>

                      <div style={{ backgroundColor: '#EFF6FF', padding: '6px 8px', borderRadius: '5px', border: '1px solid #BFDBFE' }}>
                        <span style={{ color: '#1E40AF', fontSize: '0.68rem', display: 'block' }}>Coordenadas GPS (WGS84):</span>
                        <code style={{ fontSize: '0.74rem', color: '#1D4ED8', fontWeight: 700 }}>
                          {pt.lat}° N, {pt.lon}° W
                        </code>
                      </div>

                      <div style={{ backgroundColor: pt.es_poblada ? '#ECFDF5' : '#F8FAFC', padding: '7px 9px', borderRadius: '5px', border: `1px solid ${pt.es_poblada ? '#A7F3D0' : '#E2E8F0'}` }}>
                        <span style={{ color: pt.es_poblada ? '#047857' : '#64748B', fontWeight: 700, fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {pt.es_poblada ? (
                            <>
                              <Building2 size={12} />
                              <span>Coordenada en Zona Urbana Poblada</span>
                            </>
                          ) : (
                            <>
                              <Trees size={12} />
                              <span>Coordenada en Zona Rural / No Poblada</span>
                            </>
                          )}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#334155', display: 'block', marginTop: '2px' }}>
                          {pt.zona ? pt.zona.nombre : 'Fuera de polígonos urbanos densos'}
                        </span>
                      </div>

                      <button
                        className="btn-secondary"
                        onClick={() => focusPoint(pt.x, pt.y, 1.8)}
                        style={{ padding: '5px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                      >
                        <Crosshair size={12} />
                        <span>Centrar en este Punto</span>
                      </button>
                    </>
                  );
                })()}

                {/* 6. País */}
                {activeInspection.tipo === 'pais' && (
                  <div style={{ backgroundColor: '#F0F9FF', padding: '8px', borderRadius: '6px', border: '1px solid #BAE6FD' }}>
                    <div style={{ fontWeight: 800, color: '#0369A1', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Globe size={14} />
                      <span>{activeInspection.data.nombre}</span>
                    </div>
                    {activeInspection.data.formal_en && (
                      <div style={{ color: '#0284C7', fontSize: '0.7rem', marginTop: '2px' }}>
                        {activeInspection.data.formal_en}
                      </div>
                    )}
                    <div style={{ color: '#64748B', fontSize: '0.68rem', marginTop: '6px', borderTop: '1px solid #E0F2FE', paddingTop: '4px' }}>
                      {activeInspection.data.fuente || 'Límites oficiales de Colombia'}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '180px', color: '#94A3B8', textAlign: 'center', gap: '6px' }}>
                <Navigation size={24} style={{ opacity: 0.4 }} />
                <span style={{ fontSize: '0.72rem' }}>Pase el cursor o haga clic sobre cualquier departamento, sismo, estación o zona para ver su delimitación.</span>
              </div>
            )}

            {/* Resumen del Escenario en la base del panel */}
            <div style={{ marginTop: 'auto', borderTop: '1px solid #E2E8F0', paddingTop: '8px', fontSize: '0.7rem', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Departamentos en co.json:</span>
                <strong style={{ color: '#1E293B' }}>33</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Estaciones Telemétricas:</span>
                <strong style={{ color: '#1E293B' }}>{geoData?.estaciones?.length || 14}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Eventos en Mapa:</span>
                <strong style={{ color: '#1E293B' }}>{geoData?.eventos?.length || 0}</strong>
              </div>
            </div>

          </div>

        </div>

        {/* Barra Inferior con Leyenda y Confirmación */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '10px', padding: '6px 12px',
          backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0',
          fontSize: '0.72rem', color: '#475569'
        }}>
          {/* Leyenda Horizontal Limpia */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#DC2626' }} />
              <span>P3 Alta (M≥6.0 o superficial poblada)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#D97706' }} />
              <span>P2 Media (M≥4.5)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669' }} />
              <span>P1 Baja (M&lt;4.5)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '12px', height: '0px', borderTop: '2px dashed #6366F1' }} />
              <span>Enlace de Réplica</span>
            </div>
          </div>

          {/* Sello de Capa Activa */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0369A1', fontWeight: 600 }}>
            <CheckCircle2 size={13} />
            <span>33 Departamentos Oficiales (co.json) Delimitados</span>
          </div>
        </div>

      </div>
    </ModalDialog>
  );
}
