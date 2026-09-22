/**
 * SismoLab AVL - High Performance Data Bus & Intelligent Cache Service
 * Universidad de Caldas
 * 
 * Provee:
 * 1. EventBus Pub/Sub desacoplado para comunicación reactiva entre componentes.
 * 2. CacheManager con TTL y deduplicación de peticiones en vuelo (Request Coalescing).
 * 3. Purga atómica del caché al limpiar o reiniciar los árboles para mantener la aplicación ultra-liviana.
 */

// Eventos Canónicos del Bus
export const BUS_EVENTS = {
  SYSTEM_DATA_UPDATED: 'SYSTEM_DATA_UPDATED',
  TREE_CLEARED: 'TREE_CLEARED',
  CACHE_PURGED: 'CACHE_PURGED',
  CLOCK_UPDATED: 'CLOCK_UPDATED',
  TREE_MUTATED: 'TREE_MUTATED',
  QUEUE_MUTATED: 'QUEUE_MUTATED',
  PERF_METRIC: 'PERF_METRIC'
};

class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Suscribe un callback a un evento. Retorna función de desuscripción.
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  /**
   * Desuscribe un callback.
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
      if (this.listeners.get(event).size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Emite un evento a todos los suscriptores registrados.
   */
  emit(event, payload) {
    if (this.listeners.has(event)) {
      for (const callback of this.listeners.get(event)) {
        try {
          callback(payload);
        } catch (err) {
          console.error(`[EventBus] Error en listener de evento ${event}:`, err);
        }
      }
    }
  }

  /**
   * Limpia todos los listeners.
   */
  clearAll() {
    this.listeners.clear();
  }
}

class CacheManager {
  constructor(defaultTtlMs = 15000) { // 15 segundos de TTL predeterminado
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.defaultTtlMs = defaultTtlMs;
    this.stats = {
      hits: 0,
      misses: 0,
      purges: 0
    };
  }

  /**
   * Obtiene un valor en caché si aún no ha expirado.
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data;
  }

  /**
   * Almacena un valor en caché con TTL específico.
   */
  set(key, data, ttlMs = this.defaultTtlMs) {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttlMs
    });
  }

  /**
   * Invalida una clave específica o un conjunto de claves coincidentes.
   */
  delete(keyPattern) {
    if (typeof keyPattern === 'string') {
      this.cache.delete(keyPattern);
      this.pendingRequests.delete(keyPattern);
    } else if (keyPattern instanceof RegExp) {
      for (const k of this.cache.keys()) {
        if (keyPattern.test(k)) {
          this.cache.delete(k);
        }
      }
      for (const k of this.pendingRequests.keys()) {
        if (keyPattern.test(k)) {
          this.pendingRequests.delete(k);
        }
      }
    }
  }

  /**
   * Request Coalescing (Deduplicación de Peticiones en Vuelo):
   * Si 2 o más componentes solicitan el mismo recurso al mismo tiempo,
   * se realiza solo 1 petición HTTP a la red y se comparte el Promise.
   */
  async fetchWithCoalescing(key, fetcherFn, ttlMs = this.defaultTtlMs, forceRefresh = false) {
    if (!forceRefresh) {
      const cached = this.get(key);
      if (cached !== null) {
        return cached;
      }
    }

    // Si ya existe una petición en curso para esta clave, retornar la misma promesa
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // Disparar la petición y almacenar la promesa
    const promise = (async () => {
      try {
        const data = await fetcherFn();
        this.set(key, data, ttlMs);
        return data;
      } finally {
        this.pendingRequests.delete(key);
      }
    })();

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * PURGA COMPLETA: Vacía absolutamente la memoria caché y limpia almacenamiento web.
   * Mandatario cuando el usuario oprime el botón 'Limpiar Árbol'.
   */
  purgeAll() {
    this.cache.clear();
    this.pendingRequests.clear();
    this.stats.purges++;

    // Limpieza de cualquier persistencia temporal en sessionStorage
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const keysToRemove = [];
        for (let i = 0; i < window.sessionStorage.length; i++) {
          const k = window.sessionStorage.key(i);
          if (k && k.startsWith('sismolab_')) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => window.sessionStorage.removeItem(k));
      }
    } catch {
      // Ignorar errores de sandbox si aplican
    }
  }

  /**
   * Retorna estadísticas del gestor de caché.
   */
  getStats() {
    return {
      entriesCount: this.cache.size,
      pendingCount: this.pendingRequests.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      purges: this.stats.purges,
      ratio: this.stats.hits + this.stats.misses > 0
        ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(1) + '%'
        : '0%'
    };
  }
}

class BusService {
  constructor() {
    this.bus = new EventBus();
    this.cache = new CacheManager(10000); // 10s TTL para datos de árbol
  }

  /**
   * Suscribirse a eventos del Bus
   */
  on(event, callback) {
    return this.bus.on(event, callback);
  }

  /**
   * Emitir evento en el Bus
   */
  emit(event, payload) {
    this.bus.emit(event, payload);
  }

  /**
   * Invalida el caché de datos del sistema (tras una inserción, corrección, etc.)
   */
  invalidateState() {
    this.cache.delete(/^system_/);
    this.bus.emit(BUS_EVENTS.CACHE_PURGED, { timestamp: Date.now() });
  }

  /**
   * Purga total del caché (al oprimir 'Limpiar Árbol')
   */
  clearAllCache() {
    this.cache.purgeAll();
    this.bus.emit(BUS_EVENTS.TREE_CLEARED, { timestamp: Date.now() });
    this.bus.emit(BUS_EVENTS.CACHE_PURGED, { timestamp: Date.now(), total: true });
  }

  /**
   * Consulta el estado del caché
   */
  getCacheStats() {
    return this.cache.getStats();
  }
}

// Exportar instancia Singleton del Bus
export const busService = new BusService();
export default busService;
