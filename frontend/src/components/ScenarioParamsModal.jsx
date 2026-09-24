import React, { useState, useEffect } from 'react';
import { Sliders, Check, RotateCcw, Shield, Clock, MapPin, Gauge } from 'lucide-react';
import ModalDialog from './ModalDialog';
import { fetchScenarioParameters, updateScenarioParameters } from '../services/apiService';

/**
 * ScenarioParamsModal - Configuración Dinámica de Parámetros del Escenario (Secciones 7, 9 & 10)
 * Permite consultar y modificar reactivamente:
 * - W (horas): Ventana temporal de réplica
 * - R (km): Radio espacial de réplica
 * - L: Presupuesto de acceso / profundidad máxima permitida para eventos P=3
 * - T (horas): Antigüedad mínima para archivo de subárboles P=1
 */
export default function ScenarioParamsModal({
  isOpen,
  onClose,
  onParamsUpdated,
  showToast
}) {
  const [wHours, setWHours] = useState(48.0);
  const [rKm, setRKm] = useState(40.0);
  const [budgetL, setBudgetL] = useState(3);
  const [archiveT, setArchiveT] = useState(72.0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadParams();
    }
  }, [isOpen]);

  const loadParams = async () => {
    setLoading(true);
    try {
      const res = await fetchScenarioParameters();
      if (res.data) {
        setWHours(res.data.param_w_hours ?? 48.0);
        setRKm(res.data.param_r_km ?? 40.0);
        setBudgetL(res.data.param_budget_l ?? 3);
        setArchiveT(res.data.param_archive_t_hours ?? 72.0);
      }
    } catch (err) {
      if (showToast) showToast('No se pudieron cargar los parámetros del escenario', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateScenarioParameters({
        param_w_hours: parseFloat(wHours),
        param_r_km: parseFloat(rKm),
        param_budget_l: parseInt(budgetL, 10),
        param_archive_t_hours: parseFloat(archiveT)
      });
      if (showToast) {
        showToast(
          res.message || 'Parámetros actualizados y asociaciones recalculadas.',
          'success',
          { title: 'Parámetros del Escenario' }
        );
      }
      if (onParamsUpdated) onParamsUpdated();
      onClose();
    } catch (err) {
      if (showToast) {
        showToast(err.message || 'Error al actualizar parámetros', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setWHours(48.0);
    setRKm(40.0);
    setBudgetL(3);
    setArchiveT(72.0);
  };

  if (!isOpen) return null;

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Parámetros del Escenario"
      subtitle="Secciones 7, 9 & 10 • Reactivos"
      icon={Sliders}
      iconBg="#FEF3C7"
      iconColor="#D97706"
      position="top-right"
      maxWidth="320px"
    >
      <form onSubmit={handleSave} style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.80rem' }}>
            Cargando parámetros...
          </div>
        ) : (
          <>
            {/* Parámetro W: Ventana Temporal de Réplicas */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} color="#2563EB" />
                  Ventana Réplica (W)
                </span>
                <span style={{ fontSize: '0.70rem', fontWeight: 800, color: '#2563EB', fontFamily: 'var(--font-mono)' }}>
                  {wHours} h
                </span>
              </div>
              <input
                type="number"
                step="1"
                min="1"
                max="720"
                value={wHours}
                onChange={(e) => setWHours(e.target.value)}
                style={{ width: '100%', padding: '5px 8px', fontSize: '0.80rem', borderRadius: '5px', border: '1px solid #CBD5E1' }}
              />
              <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                Diferencia temporal máxima $\Delta t \le W$ (horas).
              </span>
            </div>

            {/* Parámetro R: Radio Espacial de Réplicas */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} color="#059669" />
                  Radio Réplica (R)
                </span>
                <span style={{ fontSize: '0.70rem', fontWeight: 800, color: '#059669', fontFamily: 'var(--font-mono)' }}>
                  {rKm} km
                </span>
              </div>
              <input
                type="number"
                step="1"
                min="1"
                max="1000"
                value={rKm}
                onChange={(e) => setRKm(e.target.value)}
                style={{ width: '100%', padding: '5px 8px', fontSize: '0.80rem', borderRadius: '5px', border: '1px solid #CBD5E1' }}
              />
              <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                Distancia euclidiana máxima $d \le R$ (km).
              </span>
            </div>

            {/* Parámetro L: Presupuesto de Acceso */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Gauge size={12} color="#D97706" />
                  Presupuesto Acceso (L)
                </span>
                <span style={{ fontSize: '0.70rem', fontWeight: 800, color: '#D97706', fontFamily: 'var(--font-mono)' }}>
                  Nivel {budgetL}
                </span>
              </div>
              <input
                type="number"
                step="1"
                min="1"
                max="20"
                value={budgetL}
                onChange={(e) => setBudgetL(e.target.value)}
                style={{ width: '100%', padding: '5px 8px', fontSize: '0.80rem', borderRadius: '5px', border: '1px solid #CBD5E1' }}
              />
              <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                Nodos P=3 con profundidad &gt; L se marcan ⚡ Acceso Costoso.
              </span>
            </div>

            {/* Parámetro T: Antigüedad de Archivo de Subárbol */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Shield size={12} color="#7C3AED" />
                  Umbral Archivo (T)
                </span>
                <span style={{ fontSize: '0.70rem', fontWeight: 800, color: '#7C3AED', fontFamily: 'var(--font-mono)' }}>
                  {archiveT} h
                </span>
              </div>
              <input
                type="number"
                step="1"
                min="1"
                max="1000"
                value={archiveT}
                onChange={(e) => setArchiveT(e.target.value)}
                style={{ width: '100%', padding: '5px 8px', fontSize: '0.80rem', borderRadius: '5px', border: '1px solid #CBD5E1' }}
              />
              <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                Subárboles con todo nodo P=1 y antigüedad &gt; T son elegibles.
              </span>
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleResetDefaults}
                style={{ flex: 1, padding: '7px', fontSize: '0.72rem', justifyContent: 'center' }}
                title="Restablecer a valores por defecto (W=48, R=40, L=3, T=72)"
              >
                <RotateCcw size={12} />
                <span>Por Defecto</span>
              </button>

              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
                style={{ flex: 2, padding: '7px', fontSize: '0.74rem', justifyContent: 'center', fontWeight: 700 }}
              >
                <Check size={14} />
                <span>{saving ? 'Guardando...' : 'Aplicar Cambios'}</span>
              </button>
            </div>
          </>
        )}

      </form>
    </ModalDialog>
  );
}
