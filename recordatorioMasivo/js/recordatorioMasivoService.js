/* ============================================================
   RECORDATORIOMASIVOSERVICE.JS — Capa de datos del módulo
   Recordatorio Masivo · Óptica Visión de Águila

   Idéntica al RecordatoriosService pero con:
   - STORAGE_KEY propio (no comparte datos con Recordatorios)
   - Mismo endpoint JSONP para leer hojas de Google
   ============================================================ */

var RecordatorioMasivoService = (function () {

  var STORAGE_KEY   = 'ks_recordatorio_masivo_municipios';  // clave separada
  var ENDPOINT_BASE = 'https://script.google.com/macros/s/AKfycbxlHPqIhMSIlYCXpDBQu1LiPwZb26MZO1cKVoVsXB1g7QNggFY_2xNBy3xsPJQ6Jq7jUA/exec';

  // ── Persistencia ──────────────────────────────────────────

  function listarMunicipios() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function guardarMunicipio(datos) {
    if (!datos.nombre || !datos.fechaAtencion || !datos.spreadsheetId) {
      throw new Error('Todos los campos son obligatorios.');
    }
    var lista = listarMunicipios();
    var dup = lista.find(function (m) {
      return m.spreadsheetId === datos.spreadsheetId.trim() &&
             m.fechaAtencion === datos.fechaAtencion;
    });
    if (dup) throw new Error('Ya existe un municipio con ese ID de hoja y fecha de atención.');

    var nuevo = {
      id:            'rm_' + Date.now(),
      nombre:        datos.nombre.trim(),
      fechaAtencion: datos.fechaAtencion,
      spreadsheetId: datos.spreadsheetId.trim(),
      creadoEn:      new Date().toISOString()
    };
    lista.push(nuevo);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    return nuevo;
  }

  function eliminarMunicipio(id) {
    var lista = listarMunicipios().filter(function (m) { return m.id !== id; });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  }

  function actualizarMunicipio(id, cambios) {
    if (!cambios.nombre || !cambios.fechaAtencion || !cambios.spreadsheetId) {
      throw new Error('Todos los campos son obligatorios.');
    }
    var lista = listarMunicipios();
    var idx   = lista.findIndex(function (m) { return m.id === id; });
    if (idx === -1) throw new Error('No se encontró el municipio a editar.');

    var dup = lista.find(function (m) {
      return m.id !== id &&
             m.spreadsheetId === cambios.spreadsheetId.trim() &&
             m.fechaAtencion === cambios.fechaAtencion;
    });
    if (dup) throw new Error('Ya existe otro municipio con ese ID de hoja y fecha de atención.');

    lista[idx] = Object.assign({}, lista[idx], {
      nombre:        cambios.nombre.trim(),
      fechaAtencion: cambios.fechaAtencion,
      spreadsheetId: cambios.spreadsheetId.trim(),
      actualizadoEn: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    return lista[idx];
  }

  // ── Lectura de Google Sheets via JSONP ────────────────────

  function obtenerDatosMunicipio(spreadsheetId) {
    return new Promise(function (resolve, reject) {
      var cbName = '__rmCallback_' + Date.now();
      var script = null;
      var timer  = null;

      timer = setTimeout(function () {
        _limpiar(script, cbName);
        reject(new Error('Tiempo de espera agotado. Verifica que el Apps Script esté publicado.'));
      }, 15000);

      window[cbName] = function (data) {
        clearTimeout(timer);
        _limpiar(script, cbName);
        if (!data || data.error) {
          reject(new Error(data && data.error ? data.error : 'Respuesta inválida del servidor.'));
          return;
        }
        resolve(_normalizar(data));
      };

      var url = ENDPOINT_BASE +
        '?spreadsheetId=' + encodeURIComponent(spreadsheetId) +
        '&callback=' + cbName;

      script = document.createElement('script');
      script.src = url;
      script.onerror = function () {
        clearTimeout(timer);
        _limpiar(script, cbName);
        reject(new Error('No se pudo conectar con el Apps Script.'));
      };
      document.body.appendChild(script);
    });
  }

  function _limpiar(script, cbName) {
    if (script && script.parentNode) script.parentNode.removeChild(script);
    try { delete window[cbName]; } catch (e) { window[cbName] = undefined; }
  }

  function _normalizar(raw) {
    var meta = raw.meta || {};
    var todos = Array.isArray(raw.pacientes) ? raw.pacientes : [];

    var consulta = todos.filter(function (p) {
      return p.paciente && p.paciente.toString().trim() !== '';
    });

    var entrega = todos.filter(function (p) {
      return p.paciente &&
             p.comproLentes &&
             p.comproLentes.toString().trim().toUpperCase() === 'SI';
    });

    return { meta: meta, pacientes: consulta, pacientesEntrega: entrega };
  }

  // ── Generadores de mensaje ────────────────────────────────

  function generarMensajeConsulta(p, meta) {
    if (!p.telfLimpio) return 'Sin Teléfono';
    return 'Hola ' + p.paciente +
           ', le saludamos de ' + (meta.empresa || '') +
           '. Le recordamos su cita de atención visual en el municipio ' + (meta.municipio || '') +
           ', en ' + (meta.lugar || '') +
           ' (' + (meta.direccion || '') +
           (meta.referencia ? ' - Ref: ' + meta.referencia : '') + ')' +
           ' el día ' + (meta.fechaAtencion || '') +
           ' en horario continuo desde las 7:30 am hasta las 5:00pm. ¡Le esperamos!';
  }

  function generarMensajeEntrega(p, meta) {
    if (!p.telfLimpio) return 'Sin Teléfono';
    return 'Hola ' + p.paciente +
           ', le informamos de ' + (meta.empresa || '') +
           ' que la entrega de sus lentes (' + (p.tipoLente || '') + ')' +
           ' está programada para el día ' + (meta.fechaEntrega || '') +
           ' en ' + (meta.lugar || '') +
           ' (' + (meta.direccion || '') + ').' +
           ' Saldo pendiente a cancelar: $' + (p.saldo || '0');
  }

  return {
    listarMunicipios:      listarMunicipios,
    guardarMunicipio:      guardarMunicipio,
    eliminarMunicipio:     eliminarMunicipio,
    actualizarMunicipio:   actualizarMunicipio,
    obtenerDatosMunicipio: obtenerDatosMunicipio,
    generarMensajeConsulta: generarMensajeConsulta,
    generarMensajeEntrega:  generarMensajeEntrega
  };

})();
