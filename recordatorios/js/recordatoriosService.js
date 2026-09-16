/* ============================================================
   RECORDATORIOSSERVICE.JS — Capa de servicio del módulo Recordatorios
   Módulo independiente · Óptica Visión de Águila

   Responsabilidades:
     - Persistir municipios en localStorage
     - Consultar el Apps Script Web App mediante el spreadsheetId
     - Normalizar la respuesta JSON para el módulo

   Endpoint Apps Script:
     https://script.google.com/macros/s/AKfycbxlHPqIhMSIlYCXpDBQu1LiPwZb26MZO1cKVoVsXB1g7QNggFY_2xNBy3xsPJQ6Jq7jUA/exec
   ============================================================ */

var RecordatoriosService = (function () {

  // ── Constantes ────────────────────────────────────────────
  var STORAGE_KEY   = 'ks_recordatorios_municipios';
  var ENDPOINT_BASE = 'https://script.google.com/macros/s/AKfycbxlHPqIhMSIlYCXpDBQu1LiPwZb26MZO1cKVoVsXB1g7QNggFY_2xNBy3xsPJQ6Jq7jUA/exec';

  // ── Persistencia local ────────────────────────────────────

  /**
   * Devuelve todos los municipios guardados.
   * @returns {Array} lista de objetos { id, nombre, fechaAtencion, spreadsheetId, creadoEn }
   */
  function listarMunicipios() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {
      console.warn('[RecordatoriosService] Error leyendo localStorage:', e);
      return [];
    }
  }

  /**
   * Guarda un nuevo municipio.
   * @param {Object} datos - { nombre, fechaAtencion, spreadsheetId }
   * @returns {Object} municipio guardado con id generado
   */
  function guardarMunicipio(datos) {
    if (!datos.nombre || !datos.fechaAtencion || !datos.spreadsheetId) {
      throw new Error('Todos los campos son obligatorios.');
    }

    var lista = listarMunicipios();

    // Evitar duplicado por spreadsheetId + fecha
    var duplicado = lista.find(function (m) {
      return m.spreadsheetId === datos.spreadsheetId.trim() &&
             m.fechaAtencion === datos.fechaAtencion;
    });
    if (duplicado) {
      throw new Error('Ya existe un municipio con ese ID de hoja y fecha de atención.');
    }

    var nuevo = {
      id:            'rec_' + Date.now(),
      nombre:        datos.nombre.trim(),
      fechaAtencion: datos.fechaAtencion,
      spreadsheetId: datos.spreadsheetId.trim(),
      creadoEn:      new Date().toISOString()
    };

    lista.push(nuevo);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    return nuevo;
  }

  /**
   * Elimina un municipio por su id.
   * @param {string} id
   */
  function eliminarMunicipio(id) {
    var lista = listarMunicipios().filter(function (m) { return m.id !== id; });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  }

  /**
   * Actualiza los datos de un municipio existente.
   * @param {string} id - id del municipio a actualizar
   * @param {Object} cambios - { nombre, fechaAtencion, spreadsheetId }
   * @returns {Object} municipio actualizado
   */
  function actualizarMunicipio(id, cambios) {
    if (!cambios.nombre || !cambios.fechaAtencion || !cambios.spreadsheetId) {
      throw new Error('Todos los campos son obligatorios.');
    }

    var lista = listarMunicipios();
    var idx   = lista.findIndex(function (m) { return m.id === id; });

    if (idx === -1) {
      throw new Error('No se encontró el municipio a editar.');
    }

    // Verificar duplicado con otro municipio (distinto id)
    var duplicado = lista.find(function (m) {
      return m.id !== id &&
             m.spreadsheetId === cambios.spreadsheetId.trim() &&
             m.fechaAtencion === cambios.fechaAtencion;
    });
    if (duplicado) {
      throw new Error('Ya existe otro municipio con ese ID de hoja y fecha de atención.');
    }

    lista[idx] = Object.assign({}, lista[idx], {
      nombre:        cambios.nombre.trim(),
      fechaAtencion: cambios.fechaAtencion,
      spreadsheetId: cambios.spreadsheetId.trim(),
      actualizadoEn: new Date().toISOString()
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    return lista[idx];
  }

  // ── Consulta al Apps Script (JSONP para evitar CORS) ─────

  /**
   * Obtiene los datos de la hoja ATENCION para un municipio.
   *
   * Usa JSONP porque Google Apps Script devuelve un redirect 302
   * que el navegador no puede seguir con fetch() normal (CORS bloqueado).
   * JSONP inyecta un <script> tag que sí puede cruzar orígenes.
   *
   * El Apps Script debe envolver la respuesta así:
   *   callback({ meta: {...}, pacientes: [...] })
   * cuando recibe ?callback=nombreFuncion en la URL.
   *
   * @param {string} spreadsheetId - ID de la hoja de cálculo
   * @returns {Promise<Object>} { meta, pacientes }
   */
  function obtenerDatosMunicipio(spreadsheetId) {
    return new Promise(function (resolve, reject) {
      // Nombre único para el callback global
      var cbName = '__recCallback_' + Date.now();
      var script  = null;
      var timer   = null;

      // Timeout de 15 segundos
      timer = setTimeout(function () {
        _recJsonpLimpiar(script, cbName);
        reject(new Error('Tiempo de espera agotado. Verifica que el Apps Script esté publicado y accesible.'));
      }, 15000);

      // Función global que GAS llamará con los datos
      window[cbName] = function (data) {
        clearTimeout(timer);
        _recJsonpLimpiar(script, cbName);

        if (!data || data.error) {
          reject(new Error(data && data.error ? data.error : 'Respuesta inválida del servidor.'));
          return;
        }
        resolve(_normalizarRespuesta(data));
      };

      // Construir URL con parámetro callback
      var url = ENDPOINT_BASE +
        '?spreadsheetId=' + encodeURIComponent(spreadsheetId) +
        '&callback=' + cbName;

      // Inyectar script tag
      script = document.createElement('script');
      script.src = url;
      script.onerror = function () {
        clearTimeout(timer);
        _recJsonpLimpiar(script, cbName);
        reject(new Error('No se pudo conectar con el Apps Script. Verifica la URL del endpoint.'));
      };
      document.body.appendChild(script);
    });
  }

  /**
   * Limpia el script tag y la función global de callback JSONP.
   */
  function _recJsonpLimpiar(script, cbName) {
    if (script && script.parentNode) script.parentNode.removeChild(script);
    try { delete window[cbName]; } catch (e) { window[cbName] = undefined; }
  }

  /**
   * Normaliza la respuesta del Apps Script para garantizar
   * que siempre tengamos la estructura esperada.
   * @param {Object} raw
   * @returns {Object} { meta, pacientes, pacientesEntrega }
   */
  function _normalizarRespuesta(raw) {
    var meta = raw.meta || {};
    var pacientes = Array.isArray(raw.pacientes) ? raw.pacientes : [];

    // Pacientes para Recordatorio Consulta: todos los que tienen nombre
    var pacientesConsulta = pacientes.filter(function (p) {
      return p.paciente && p.paciente.toString().trim() !== '';
    });

    // Pacientes para Recordatorio Entrega: solo los que compraron lentes (comproLentes === "SI")
    var pacientesEntrega = pacientes.filter(function (p) {
      return p.paciente &&
             p.comproLentes &&
             p.comproLentes.toString().trim().toUpperCase() === 'SI';
    });

    return {
      meta:              meta,
      pacientes:         pacientesConsulta,
      pacientesEntrega:  pacientesEntrega
    };
  }

  /**
   * Genera el mensaje de recordatorio de consulta para un paciente.
   * @param {Object} paciente
   * @param {Object} meta
   * @returns {string}
   */
  function generarMensajeConsulta(paciente, meta) {
    if (!paciente.telfLimpio) return 'Sin Teléfono';
    return 'Hola ' + paciente.paciente +
           ', le saludamos de ' + (meta.empresa || '') +
           '. Le recordamos su cita de atención visual en el municipio ' + (meta.municipio || '') +
           ', en ' + (meta.lugar || '') +
           ' (' + (meta.direccion || '') +
           (meta.referencia ? ' - Ref: ' + meta.referencia : '') + ')' +
           ' el día ' + (meta.fechaAtencion || '') +
           ' en horario continuo desde las 7:30 am hasta las 5:00pm. ¡Le esperamos!';
  }

  /**
   * Genera el mensaje de recordatorio de entrega para un paciente.
   * @param {Object} paciente
   * @param {Object} meta
   * @returns {string}
   */
  function generarMensajeEntrega(paciente, meta) {
    if (!paciente.telfLimpio) return 'Sin Teléfono';
    return 'Hola ' + paciente.paciente +
           ', le informamos de ' + (meta.empresa || '') +
           ' que la entrega de sus lentes (' + (paciente.tipoLente || '') + ')' +
           ' está programada para el día ' + (meta.fechaEntrega || '') +
           ' en ' + (meta.lugar || '') +
           ' (' + (meta.direccion || '') + ').' +
           ' Saldo pendiente a cancelar: $' + (paciente.saldo || '0');
  }

  /**
   * Genera el link de WhatsApp para un mensaje.
   * @param {string} telefono - número limpio (ej: 584121234567)
   * @param {string} mensaje
   * @returns {string}
   */
  function generarLinkWhatsapp(telefono, mensaje) {
    if (!telefono) return '';
    return 'https://wa.me/' + telefono + '?text=' + encodeURIComponent(mensaje);
  }

  // ── Exposición pública ────────────────────────────────────
  return {
    listarMunicipios:       listarMunicipios,
    guardarMunicipio:       guardarMunicipio,
    eliminarMunicipio:      eliminarMunicipio,
    actualizarMunicipio:    actualizarMunicipio,
    obtenerDatosMunicipio:  obtenerDatosMunicipio,
    generarMensajeConsulta: generarMensajeConsulta,
    generarMensajeEntrega:  generarMensajeEntrega,
    generarLinkWhatsapp:    generarLinkWhatsapp
  };

})();
