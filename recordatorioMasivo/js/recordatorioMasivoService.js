var RecordatorioMasivoService = (function () {

  var LEGACY_STORAGE_KEY = 'ks_recordatorio_masivo_municipios';
  var ENDPOINT_BASE = 'https://script.google.com/macros/s/AKfycbxlHPqIhMSIlYCXpDBQu1LiPwZb26MZO1cKVoVsXB1g7QNggFY_2xNBy3xsPJQ6Jq7jUA/exec';

  // ── Registro central de Atención Municipio ───────────────

  function listarMunicipiosLocales() {
    try {
      return JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function _getAtencionService() {
    if (!window.AtencionMunicipioService) {
      throw new Error('No se cargó el servicio central de Atención Municipio.');
    }
    return window.AtencionMunicipioService;
  }

  function _extraerSpreadsheetId(linkHoja) {
    var valor = String(linkHoja || '').trim();
    var match = valor.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : valor;
  }

  function _normalizarMunicipio(municipio) {
    var linkHoja = String(municipio.linkHoja || '');
    return Object.assign({}, municipio, {
      nombre: municipio.municipio || municipio.nombre || '',
      fechaAtencion: String(municipio.fechaAtencion || '').slice(0, 10),
      fechaEntrega: String(municipio.fechaEntrega || '').slice(0, 10),
      linkHoja: linkHoja,
      spreadsheetId: _extraerSpreadsheetId(linkHoja)
    });
  }

  function _datosParaRegistro(datos) {
    var linkHoja = String(datos.linkHoja || datos.spreadsheetId || '').trim();
    if (linkHoja && linkHoja.indexOf('/spreadsheets/d/') === -1) {
      linkHoja = 'https://docs.google.com/spreadsheets/d/' + linkHoja + '/edit';
    }
    return {
      ruta: datos.ruta,
      municipio: String(datos.nombre || datos.municipio || '').trim(),
      fechaAtencion: datos.fechaAtencion,
      fechaEntrega: datos.fechaEntrega || '',
      linkHoja: linkHoja,
      estado: datos.estado || 'Sin Digitalizar',
      creadoPor: datos.creadoPor || 'Administrador'
    };
  }

  function listarMunicipios() {
    return _getAtencionService().listarMunicipios().then(function (lista) {
      return (Array.isArray(lista) ? lista : []).map(_normalizarMunicipio);
    });
  }

  function guardarMunicipio(datos) {
    var registro = _datosParaRegistro(datos);
    if (!registro.ruta || !registro.municipio || !registro.fechaAtencion || !registro.linkHoja) {
      return Promise.reject(new Error('Ruta, municipio, fecha y enlace de hoja son obligatorios.'));
    }
    return _getAtencionService().guardarMunicipio(registro).then(function (respuesta) {
      return _normalizarMunicipio(Object.assign({}, registro, {
        id: respuesta.id,
        linkHoja: registro.linkHoja
      }));
    });
  }

  function actualizarMunicipio(id, cambios) {
    var registro = _datosParaRegistro(cambios);
    if (!id || !registro.ruta || !registro.municipio || !registro.fechaAtencion || !registro.linkHoja) {
      return Promise.reject(new Error('Ruta, municipio, fecha y enlace de hoja son obligatorios.'));
    }
    return _getAtencionService().actualizarMunicipio(Object.assign({ id: id }, registro))
      .then(function () {
        return _normalizarMunicipio(Object.assign({}, registro, { id: id }));
      });
  }

  function eliminarMunicipio(id) {
    return _getAtencionService().eliminarMunicipio(id);
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
    var todos = (Array.isArray(raw.pacientes) ? raw.pacientes : []).map(function (paciente) {
      var telefono = String(paciente.telfLimpio || '').replace(/\D/g, '');
      if (!/^[1-9][0-9]{7,14}$/.test(telefono)) telefono = '';
      return Object.assign({}, paciente, { telfLimpio: telefono });
    });

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
    listarMunicipiosLocales: listarMunicipiosLocales,
    guardarMunicipio:      guardarMunicipio,
    eliminarMunicipio:     eliminarMunicipio,
    actualizarMunicipio:   actualizarMunicipio,
    obtenerDatosMunicipio: obtenerDatosMunicipio,
    generarMensajeConsulta: generarMensajeConsulta,
    generarMensajeEntrega:  generarMensajeEntrega
  };

})();
