/* ============================================================
   DOCUMENTOSSERVICE.JS — Servicio de generación de documentos
   Módulo Administración · Óptica Visión de Águila

   ESTADO: Solicitud Institucional lista para conectar GAS.
   Los demás tipos siguen como stub.

   Para activar un documento real:
   1. Desplegar su Code.gs como Web App en Google Apps Script
   2. Copiar la URL del Web App en GAS_URLS[tipo]
   ============================================================ */

var DocumentosService = {

  /**
   * URLs de los Web Apps de Google Apps Script por tipo de documento.
   * Dejar vacío ('') para mantener modo simulado.
   *
   * ⚠️ SOLICITUD INSTITUCIONAL:
   *   Después de desplegar Code.gs como Web App, pegar aquí la URL:
   *   Formato: https://script.google.com/macros/s/XXXXX/exec
   */
  GAS_URLS: {
    'solicitud-institucional': 'https://script.google.com/macros/s/AKfycbyGMPJPHxp6FHuFnqBmEXdoJScar0I66wUPyRlHUmjWVbwXHm57xOPn77UM5v5GdO-AOQ/exec', // ← PENDIENTE: pegar URL del Web App aquí
    'permiso-policial': '',
    'solicitud-espacio': '', // ← Pegar URL del Web App de Solicitudespacio.gs después de desplegar
    'hoja-convenio': ''
  },

  /**
   * Tipos de documento disponibles en el sistema.
   * Usado para validación y para poblar selectores en la UI.
   */
  TIPOS: {
    SOLICITUD_INSTITUCIONAL: 'solicitud-institucional',
    PERMISO_POLICIAL: 'permiso-policial',
    SOLICITUD_ESPACIO: 'solicitud-espacio',
    HOJA_CONVENIO: 'hoja-convenio',
    PUBLICIDAD: 'publicidad'
  },

  /**
   * Punto de entrada único para generación de documentos.
   * Si GAS_URLS[tipo] tiene URL → llama al Web App real.
   * Si no tiene URL → retorna respuesta simulada para desarrollo.
   *
   * @param {string} tipoDocumento - Una de las claves de TIPOS
   * @param {object} datos - Datos del formulario
   * @returns {Promise<object>} { ok, id, url } o { ok, mensaje }
   */
  generarDocumento: function (tipoDocumento, datos) {

    var url = this.GAS_URLS[tipoDocumento];

    if (!url) {
      // Modo simulado — útil hasta tener la URL real
      console.warn('[DocumentosService] GAS_URLS["' + tipoDocumento + '"] no configurada. Usando modo simulado.');
      return Promise.resolve({
        ok: true,
        id: 'DOC_SIMULADO_' + Date.now(),
        url: '#',
        mensaje: 'SIMULADO — Configura GAS_URLS["' + tipoDocumento + '"] con la URL del Web App.'
      });
    }

    // ── Llamada real al Web App de Google Apps Script (GET + query params) ──
    // GAS redirige los POST externos a una URL "echo" que puede devolver 404.
    // Usar GET con parámetros en la URL es el método más confiable.
    var params = Object.keys(datos).map(function (k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(datos[k]);
    }).join('&');
    var urlCompleta = url + '?' + params;

    return fetch(urlCompleta)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .catch(function (err) {
        console.error('[DocumentosService] Error:', err);
        return { ok: false, mensaje: 'Error de conexión: ' + err.toString() };
      });
  },

  /**
   * Retorna los documentos recientes (simulados).
   * TODO: Conectar con GAS o base de datos cuando esté disponible.
   * @returns {Array}
   */
  obtenerRecientes: function () {
    return [
      { tipo: 'solicitud-institucional', titulo: 'Solicitud Institucional', fecha: '25/07/2026', usuario: 'Admin' },
      { tipo: 'hoja-convenio', titulo: 'Hoja de Convenio', fecha: '24/07/2026', usuario: 'Admin' },
      { tipo: 'permiso-policial', titulo: 'Permiso Policial', fecha: '23/07/2026', usuario: 'Admin' },
      { tipo: 'solicitud-espacio', titulo: 'Solicitud de Espacio', fecha: '22/07/2026', usuario: 'Admin' },
      { tipo: 'solicitud-institucional', titulo: 'Solicitud Institucional', fecha: '21/07/2026', usuario: 'Admin' }
    ];
  },

  /**
   * Exporta un documento generado a PDF.
   * Llama al mismo Web App con ?accion=exportarPDF&id=DOC_ID
   *
   * @param {string} tipoDocumento - Para obtener la URL del Web App
   * @param {string} idDocumento   - ID del Google Doc generado
   * @returns {Promise<object>} { ok, url } con el link del PDF
   */
  exportarPDF: function (tipoDocumento, idDocumento) {
    var url = this.GAS_URLS[tipoDocumento];
    if (!url) {
      return Promise.resolve({ ok: false, mensaje: 'GAS_URLS no configurada para este tipo.' });
    }
    var urlCompleta = url + '?accion=exportarPDF&id=' + encodeURIComponent(idDocumento);
    return fetch(urlCompleta)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .catch(function (err) {
        console.error('[DocumentosService] exportarPDF Error:', err);
        return { ok: false, mensaje: 'Error al exportar PDF: ' + err.toString() };
      });
  }

};

