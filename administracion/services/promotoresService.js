// Promotores
var PromotoresService = {
  _cache: { data: null, expires: 0, tiposDocumento: [], plantillasDisponibles: [] },
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

  getAll: function (opts) {
    opts = opts || {};
    var self = this;
    var now = Date.now();

    if (!opts.force && this._cache.data && this._cache.expires > now) {
      return Promise.resolve(this._cache.data);
    }

    if (this._inFlight) return this._inFlight;

    var baseUrl = window.API_URL || '';
    if (!baseUrl) return Promise.reject(new Error('No está configurada la URL de Google Apps Script para promotores.'));

    var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var signal = controller ? controller.signal : null;
    var url = baseUrl + '?action=listar-promotores';

    var fetchPromise = fetch(url, signal ? { signal: signal } : {})
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (payload) {
        if (payload && typeof payload === 'object' && (payload.ok === false || payload.error)) {
          throw new Error(payload.error || 'Google Apps Script no pudo listar los promotores.');
        }
        var lista = payload && Array.isArray(payload.promotores) ? payload.promotores : (Array.isArray(payload) ? payload : null);
        if (!lista) throw new Error('Google Apps Script devolvió una respuesta de promotores no válida.');
        self._cache.data = lista;
        self._cache.tiposDocumento = payload && Array.isArray(payload.tiposDocumento) ? payload.tiposDocumento : [];
        self._cache.plantillasDisponibles = payload && Array.isArray(payload.plantillasDisponibles) ? payload.plantillasDisponibles : [];
        self._cache.expires = Date.now() + self._ttl;
        self._inFlight = null;
        try { if (typeof self._onUpdate === 'function') self._onUpdate(lista); } catch (e) { /* ignore */ }
        return lista;
      })
      .catch(function (err) {
        self._inFlight = null;
        return Promise.reject(err);
      });

    if (controller) {
      var to = setTimeout(function () { try { controller.abort(); } catch (e) {} }, this._timeout);
      fetchPromise = fetchPromise.finally(function () { clearTimeout(to); });
    }

    this._inFlight = fetchPromise;
    return fetchPromise;
  },

  getTiposDocumento: function () {
    var self = this;
    return this.getAll().then(function () {
      return self._cache.tiposDocumento.slice();
    });
  },

  getPlantillasDisponibles: function () {
    var self = this;
    return this.getAll().then(function () {
      return self._cache.plantillasDisponibles.slice();
    });
  },

  _guardarCambios: function (accion, datos) {
    var self = this;
    if (typeof getPerfilAdmin !== 'function' || getPerfilAdmin() !== 'Administrador') {
      return Promise.reject(new Error('Solo un usuario Administrador puede gestionar promotores.'));
    }
    var baseUrl = window.API_URL || '';
    if (!baseUrl) return Promise.reject(new Error('No está configurada la URL de Google Apps Script.'));

    var params = new URLSearchParams();
    params.set('payload', JSON.stringify(datos || {}));

    return fetch(baseUrl + '?action=' + encodeURIComponent(accion), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: params.toString(),
      cache: 'no-store'
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function (payload) {
      if (!payload || payload.ok !== true) {
        if (accion === 'eliminar-promotor' && payload && /^No hay hoja para:/i.test(payload.error || '')) {
          throw new Error('El Web App de Google Apps Script no tiene publicada la acción de eliminación actualizada. Publica una nueva versión del backend e inténtalo de nuevo.');
        }
        throw new Error(payload && payload.error ? payload.error : 'Google Apps Script no pudo completar la operación del promotor.');
      }
      self.invalidate();
      return payload;
    });
  },

  crear: function (promotor) {
    return this._guardarCambios('crear-promotor', promotor);
  },

  actualizar: function (promotor) {
    return this._guardarCambios('actualizar-promotor', promotor);
  },

  eliminar: function (promotor) {
    return this._guardarCambios('eliminar-promotor', promotor);
  },

  invalidate: function () {
    this._cache.data = null;
    this._cache.expires = 0;
    this._cache.tiposDocumento = [];
    this._cache.plantillasDisponibles = [];
  },

  onUpdate: function (fn) {
    this._onUpdate = fn;
  }
};
