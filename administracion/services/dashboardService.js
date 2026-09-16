/* ============================================================
   DASHBOARDSERVICE.JS — Servicio de datos del Dashboard
   Módulo Administración · Óptica Visión de Águila

   obtenerMetricas() consume el endpoint real del GAS.
   El resto de funciones retorna datos estáticos de soporte.
   ============================================================ */

var DashboardService = {
  _cache: { data: null, expires: 0 },
  _inFlight: null,
  _ttl: 60000, // ms - cache por defecto (1 minuto)

  /**
   * Obtiene las 4 métricas reales desde Google Apps Script.
   * Retorna una Promise con el objeto de métricas.
   * Implementa cache en memoria con TTL y deduplicación de peticiones.
   *
   * @param {Object} opts - { force: true } para forzar recarga
   * @returns {Promise<object>}
   */
  obtenerMetricas: function (opts) {
    opts = opts || {};
    var now = Date.now();

    

    // Devolver cache si sigue válida y no se fuerza recarga
    if (!opts.force && this._cache.data && this._cache.expires > now) {
      return Promise.resolve(this._cache.data);
    }

    // Si ya hay una petición en curso, devolverla
    if (this._inFlight) return this._inFlight;

    var baseUrl = window.API_URL;
    if (!baseUrl) {
      console.warn('[DashboardService] API_URL no definida, usando datos de respaldo.');
      return Promise.resolve(this._metricasFallback());
    }

    var url = baseUrl + '?action=obtener-metricas-dashboard';

    var fetchPromise = fetch(url, { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        DashboardService._cache.data = data;
        DashboardService._cache.expires = Date.now() + DashboardService._ttl;
        DashboardService._inFlight = null;
        return data;
      })
      .catch(function (err) {
        DashboardService._inFlight = null;
        console.warn('[DashboardService] Error al obtener métricas, usando fallback.', err);
        return DashboardService._metricasFallback();
      });

    this._inFlight = fetchPromise;
    return fetchPromise;
  },

  /** Métricas de respaldo cuando la API no está disponible */
  _metricasFallback: function () {
    return {
      ok:               false,
      totalPromotores:  '—',
      brigadasAtendidas: '—',
      totalAsistidos:   '—',
      totalMontoPagar:  '—'
    };
  },

  /**
   * Retorna la actividad reciente del sistema (estática por ahora).
   * @returns {Array}
   */
  obtenerActividadReciente: function () {
    return [
      { tipo: 'documento',  texto: 'Solicitud institucional generada',    tiempo: 'Hace 5 min' },
      { tipo: 'promotor',   texto: 'Consulta de nómina realizada',        tiempo: 'Hace 18 min' },
      { tipo: 'brigada',    texto: 'Reporte de lentes consultado',        tiempo: 'Hace 32 min' },
      { tipo: 'documento',  texto: 'Hoja de convenio generada',           tiempo: 'Hace 1h' },
      { tipo: 'promotor',   texto: 'Escalafón de promotores consultado',  tiempo: 'Hace 2h' },
      { tipo: 'documento',  texto: 'Permiso policial generado',           tiempo: 'Hace 3h' }
    ];
  },

  /**
   * Retorna los accesos rápidos del dashboard.
   * @returns {Array}
   */
  obtenerAccesosRapidos: function () {
    return [
      { icono: 'doc',    label: 'Nuevo Documento',   ruta: '#/admin/documentos' },
      { icono: 'report', label: 'Ver Reportes',      ruta: '#/admin/reportes' },
      { icono: 'config', label: 'Configuración',     ruta: '#/admin/configuracion' },
      { icono: 'cat',    label: 'Catálogos',         ruta: '#/admin/catalogos' }
    ];
  }

};

