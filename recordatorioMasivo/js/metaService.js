var MetaService = (function () {

  // ── Envío individual ────────────────────────────────────────

  /**
   * Envía un mensaje de WhatsApp a un paciente.
   * Si MetaConfig.MODO_SIMULADO === true, simula el envío.
   *
   * @param {string} tipo      - 'consulta' | 'entrega'
   * @param {Object} paciente  - objeto paciente normalizado
   * @param {Object} meta      - metadata de la hoja (empresa, municipio, etc.)
   * @returns {Promise<Object>} { ok: true } | { ok: false, error: '...' }
   */
  function enviarMensaje(tipo, paciente, meta, spreadsheetId) {
    if (tipo !== 'consulta' && tipo !== 'entrega') {
      return Promise.resolve({ ok: false, error: 'Tipo de recordatorio no válido' });
    }

    var telefono = String(paciente && paciente.telfLimpio || '').replace(/\D/g, '');
    if (!/^[1-9][0-9]{7,14}$/.test(telefono)) {
      return Promise.resolve({ ok: false, error: 'El teléfono debe incluir el código de país, sin +' });
    }

    if (MetaConfig.MODO_SIMULADO) {
      return _simularEnvio();
    }

    var proxyUrl = MetaConfig.getProxyUrl();
    var adminToken = typeof getTokenAdmin === 'function' ? getTokenAdmin() : '';
    if (!proxyUrl) return Promise.resolve({ ok: false, error: 'Proxy seguro de Meta no configurado' });
    if (!adminToken) return Promise.resolve({ ok: false, error: 'Inicia sesión como administrador para enviar' });
    if (!spreadsheetId) return Promise.resolve({ ok: false, error: 'Falta identificar la hoja de atención' });

    paciente = Object.assign({}, paciente, { telfLimpio: telefono });
    var payload = tipo === 'consulta'
      ? _buildPayloadConsulta(paciente, meta)
      : _buildPayloadEntrega(paciente, meta);

    var parametros = new URLSearchParams();
    parametros.set('action', 'send-whatsapp-template');
    parametros.set('adminToken', adminToken);
    parametros.set('spreadsheetId', spreadsheetId);
    parametros.set('payload', JSON.stringify(payload));

    return fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: parametros.toString()
    })
    .then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok && data.ok) return { ok: false, error: 'HTTP ' + res.status };
        return data;
      });
    })
    .catch(function (err) {
      return { ok: false, error: err.message || 'Error de conexión' };
    });
  }

  /**
   * Procesa el envío masivo de una lista de pacientes.
   * Llama a onProgreso(idx, total, resultado) tras cada paciente.
   * Llama a onFinalizado(resumen) al terminar.
   *
   * @param {string}   tipo        - 'consulta' | 'entrega'
   * @param {Array}    pacientes   - lista de pacientes a procesar
   * @param {Object}   meta        - metadata de la hoja
   * @param {Function} onProgreso  - (idxActual, total, resultado) => void
   * @param {Function} onFinalizado - ({ enviados, errores, sinTelefono }) => void
   */
  function enviarMasivo(tipo, pacientes, meta, onProgreso, onFinalizado) {
    var pendientes   = pacientes.filter(function (p) { return p._estadoEnvio !== 'enviado'; });
    var total        = pendientes.length;
    var enviados     = 0;
    var errores      = 0;
    var sinTelefono  = 0;
    var idx          = 0;

    function procesarSiguiente() {
      if (idx >= total) {
        if (typeof onFinalizado === 'function') {
          onFinalizado({ enviados: enviados, errores: errores, sinTelefono: sinTelefono });
        }
        return;
      }

      var paciente = pendientes[idx];
      idx++;

      if (!paciente.telfLimpio) {
        sinTelefono++;
        if (typeof onProgreso === 'function') {
          onProgreso(idx, total, { ok: false, error: 'Sin teléfono', paciente: paciente });
        }
        procesarSiguiente();
        return;
      }

      enviarMensaje(tipo, paciente, meta).then(function (resultado) {
        resultado.paciente = paciente;
        if (resultado.ok) {
          enviados++;
        } else {
          errores++;
        }
        if (typeof onProgreso === 'function') {
          onProgreso(idx, total, resultado);
        }
        procesarSiguiente();
      });
    }

    procesarSiguiente();
  }

  // ── Constructores de payload ────────────────────────────────

  /**
   * Construye el payload para la plantilla recordatorio_consulta.
   * Parámetros en orden:
   *   {{1}} nombre del paciente
   *   {{2}} empresa
   *   {{3}} municipio
   *   {{4}} lugar (dirección + referencia)
   *   {{5}} fecha de atención
   */
  function _buildPayloadConsulta(paciente, meta) {
    var lugarCompleto = (meta.lugar || '') +
      (meta.direccion  ? ' (' + meta.direccion : '') +
      (meta.referencia ? ' - Ref: ' + meta.referencia : '') +
      (meta.direccion  ? ')' : '');

    return {
      messaging_product: 'whatsapp',
      to:                paciente.telfLimpio,
      type:              'template',
      template: {
        name:     MetaConfig.TEMPLATE_CONSULTA,
        language: { code: MetaConfig.TEMPLATE_LANGUAGE },
        components: [{
          type:       'body',
          parameters: [
            { type: 'text', text: String(paciente.paciente  || '') },
            { type: 'text', text: String(meta.empresa       || '') },
            { type: 'text', text: String(meta.municipio     || '') },
            { type: 'text', text: lugarCompleto              || '' },
            { type: 'text', text: String(meta.fechaAtencion || '') }
          ]
        }]
      }
    };
  }

  /**
   * Construye el payload para la plantilla recordatorio_entrega.
   * Parámetros en orden:
   *   {{1}} nombre del paciente
   *   {{2}} empresa
   *   {{3}} tipo de lente
   *   {{4}} fecha de entrega
   *   {{5}} lugar
   *   {{6}} saldo
   */
  function _buildPayloadEntrega(paciente, meta) {
    return {
      messaging_product: 'whatsapp',
      to:                paciente.telfLimpio,
      type:              'template',
      template: {
        name:     MetaConfig.TEMPLATE_ENTREGA,
        language: { code: MetaConfig.TEMPLATE_LANGUAGE },
        components: [{
          type:       'body',
          parameters: [
            { type: 'text', text: String(paciente.paciente   || '') },
            { type: 'text', text: String(meta.empresa        || '') },
            { type: 'text', text: String(paciente.tipoLente  || '') },
            { type: 'text', text: String(meta.fechaEntrega   || '') },
            { type: 'text', text: String(meta.lugar          || '') },
            { type: 'text', text: String(paciente.saldo      || '0') }
          ]
        }]
      }
    };
  }

  /**
   * Simula un envío exitoso con la pausa configurada.
   * @returns {Promise<Object>}
   */
  function _simularEnvio() {
    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve({ ok: true, simulado: true });
      }, MetaConfig.SIMULADO_DELAY_MS);
    });
  }

  // ── API pública ─────────────────────────────────────────────
  return {
    enviarMensaje: enviarMensaje,
    enviarMasivo:  enviarMasivo
  };

})();
