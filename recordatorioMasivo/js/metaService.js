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
  function enviarMensaje(tipo, paciente, meta) {
    if (!paciente.telfLimpio) {
      return Promise.resolve({ ok: false, error: 'Sin número de teléfono' });
    }

    if (MetaConfig.MODO_SIMULADO) {
      return _simularEnvio();
    }

    if (!MetaConfig.credencialesListas()) {
      return Promise.resolve({ ok: false, error: 'Credenciales de Meta no configuradas' });
    }

    var payload = tipo === 'consulta'
      ? _buildPayloadConsulta(paciente, meta)
      : _buildPayloadEntrega(paciente, meta);

    return fetch(MetaConfig.getEndpointUrl(), {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + MetaConfig.ACCESS_TOKEN
      },
      body: JSON.stringify(payload)
    })
    .then(function (res) {
      if (res.ok) return { ok: true };
      return res.json().then(function (data) {
        return {
          ok:    false,
          error: (data.error && data.error.message) || ('HTTP ' + res.status)
        };
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
