/* ============================================================
   ATENCIONMUNICIPIOSERVICE.JS
   Capa de datos del módulo Atención Municipio.

   TODAS las operaciones usan JSONP (GET) para evitar CORS.
   La URL viene exclusivamente de ApiConfig (api-config.js).
   ============================================================ */

var AtencionMunicipioService = (function () {

  var ESTADOS = ['Sin Digitalizar', 'Por Atender', 'Digitalizado'];

  // ── Helpers internos ────────────────────────────────────────

  function _getEndpoint() {
    return window.ApiConfig.atencionMunicipio.baseUrl;
  }

  function _getSheetId() {
    return window.ApiConfig.atencionMunicipio.spreadsheetId;
  }

  /**
   * Realiza una llamada JSONP universal.
   * Todos los parámetros van en la query string (GET).
   * GAS responde: callback({ ... })
   */
  function _jsonp(params, timeoutMs) {
    timeoutMs = timeoutMs || 15000;
    return new Promise(function (resolve, reject) {
      var cbName = '__amCb_' + Date.now() + '_' + Math.floor(Math.random() * 9999);
      var script = null;
      var timer  = null;

      timer = setTimeout(function () {
        _clean(script, cbName);
        reject(new Error('Tiempo de espera agotado al conectar con el servidor.'));
      }, timeoutMs);

      // Pre-registrar el callback ANTES de inyectar el script
      // para evitar la condición de carrera con GAS
      window[cbName] = function (data) {
        clearTimeout(timer);
        _clean(script, cbName);
        if (data && data.error) { reject(new Error(data.error)); return; }
        resolve(data);
      };

      // Construir URL
      var base = _getEndpoint();
      var qs   = Object.keys(params)
        .filter(function (k) { return params[k] !== null && params[k] !== undefined && params[k] !== ''; })
        .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); })
        .join('&');

      var url = base + '?' + qs + '&spreadsheetId=' + encodeURIComponent(_getSheetId()) + '&callback=' + cbName + '&_amCache=' + Date.now();

      script = document.createElement('script');
      script.async = true;
      script.charset = 'utf-8';
      script.src = url;
      script.onerror = function () {
        clearTimeout(timer);
        _clean(script, cbName);
        reject(new Error('No se pudo cargar el servidor de municipios. Revisa la conexión móvil o intenta nuevamente.'));
      };

      // Pequeño defer para garantizar que window[cbName] esté registrado
      // antes de que el navegador empiece a procesar la respuesta del script
      setTimeout(function () {
        document.body.appendChild(script);
      }, 0);
    });
  }

  function _clean(script, cbName) {
    if (script && script.parentNode) script.parentNode.removeChild(script);
    try { delete window[cbName]; } catch (e) { window[cbName] = undefined; }
  }

  // ── API pública ─────────────────────────────────────────────

  function listarMunicipios() {
    return _jsonp({ action: 'listar-municipios' })
      .then(function (data) {
        return Array.isArray(data) ? data : (data.municipios || []);
      });
  }

  function guardarMunicipio(datos) {
    return _jsonp({
      action:        'guardar-municipio',
      ruta:          datos.ruta,
      municipio:     datos.municipio,
      fechaAtencion: datos.fechaAtencion,
      fechaEntrega:  datos.fechaEntrega  || '',
      linkHoja:      datos.linkHoja,
      estado:        datos.estado        || 'Sin Digitalizar',
      creadoPor:     datos.creadoPor     || 'Administrador'
    });
  }

  function actualizarMunicipio(datos) {
    return _jsonp({
      action:        'actualizar-municipio',
      id:            datos.id,
      ruta:          datos.ruta,
      municipio:     datos.municipio,
      fechaAtencion: datos.fechaAtencion,
      fechaEntrega:  datos.fechaEntrega  || '',
      linkHoja:      datos.linkHoja,
      estado:        datos.estado        || ''
    });
  }

  function eliminarMunicipio(id) {
    return _jsonp({ action: 'eliminar-municipio', id: id });
  }

  function cambiarEstado(id, estado) {
    return _jsonp({ action: 'cambiar-estado', id: id, estado: estado });
  }

  return {
    ESTADOS:             ESTADOS,
    listarMunicipios:    listarMunicipios,
    guardarMunicipio:    guardarMunicipio,
    actualizarMunicipio: actualizarMunicipio,
    eliminarMunicipio:   eliminarMunicipio,
    cambiarEstado:       cambiarEstado
  };

})();
