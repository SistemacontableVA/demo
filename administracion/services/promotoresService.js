/* ============================================================
   PROMOTORESSERVICE.JS — Servicio de datos de promotores (centralizado)
   Módulo Administración · Óptica Visión de Águila

   Provee cache, deduplicación de peticiones y API simple para
   obtener la lista de promotores desde Apps Script.
   ============================================================ */

var PromotoresService = {
  _cache: { data: null, expires: 0 },
  _inFlight: null,
  _ttl: 120000, // ms - cache por defecto (2 minutos)
  _timeout: 10000, // ms - timeout de la petición
  _onUpdate: null,

  obtenerResumen: function () {
    return Promise.resolve({
      total:   (this._cache.data || []).length,
      activos: (this._cache.data || []).length,
      inactivos: 0
    });
  },

  /**
   * Devuelve la lista de promotores. Opciones: { force: true }
   * Implementa cache + deduplicación y timeout.
   * @returns {Promise<Array>}
   */
  getAll: function (opts) {
    opts = opts || {};
    var self = this;
    var now = Date.now();

    if (!opts.force && this._cache.data && this._cache.expires > now) {
      return Promise.resolve(this._cache.data);
    }

    if (this._inFlight) return this._inFlight;

    var baseUrl = window.API_URL || '';
    if (!baseUrl) return Promise.resolve([]);

    var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var signal = controller ? controller.signal : null;
    var url = baseUrl + '?action=listar-promotores';

    var fetchPromise = fetch(url, signal ? { signal: signal } : {})
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (payload) {
        var lista = payload && Array.isArray(payload.promotores) ? payload.promotores : (Array.isArray(payload) ? payload : []);
        self._cache.data = lista;
        self._cache.expires = Date.now() + self._ttl;
        self._inFlight = null;
        try { if (typeof self._onUpdate === 'function') self._onUpdate(lista); } catch (e) { /* ignore */ }
        return lista;
      })
      .catch(function (err) {
        self._inFlight = null;
        return Promise.reject(err);
      });

    // Abort on timeout if supported
    if (controller) {
      var to = setTimeout(function () { try { controller.abort(); } catch (e) {} }, this._timeout);
      fetchPromise = fetchPromise.finally(function () { clearTimeout(to); });
    }

    this._inFlight = fetchPromise;
    return fetchPromise;
  },

  invalidate: function () {
    this._cache.data = null;
    this._cache.expires = 0;
  },

  onUpdate: function (fn) {
    this._onUpdate = fn;
  }
};
