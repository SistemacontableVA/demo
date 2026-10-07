var DocumentosService = {

  // URLs vacias usan el modo simulado.
  GAS_URLS: {
    'solicitud-institucional': 'https://script.google.com/macros/s/AKfycbyGMPJPHxp6FHuFnqBmEXdoJScar0I66wUPyRlHUmjWVbwXHm57xOPn77UM5v5GdO-AOQ/exec',
    'permiso-policial': '',
    'solicitud-espacio': '',
    'hoja-convenio': ''
  },

  // Tipos de documento
  TIPOS: {
    SOLICITUD_INSTITUCIONAL: 'solicitud-institucional',
    PERMISO_POLICIAL: 'permiso-policial',
    SOLICITUD_ESPACIO: 'solicitud-espacio',
    HOJA_CONVENIO: 'hoja-convenio',
    PUBLICIDAD: 'publicidad'
  },

  // Generacion
  generarDocumento: function (tipoDocumento, datos) {

    var url = this.GAS_URLS[tipoDocumento];

    if (!url) {
      console.warn('[DocumentosService] GAS_URLS["' + tipoDocumento + '"] no configurada. Usando modo simulado.');
      return Promise.resolve({
        ok: true,
        id: 'DOC_SIMULADO_' + Date.now(),
        url: '#',
        mensaje: 'SIMULADO — Configura GAS_URLS["' + tipoDocumento + '"] con la URL del Web App.'
      });
    }

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

  // Lista local de documentos recientes
  obtenerRecientes: function () {
    return [
      { tipo: 'solicitud-institucional', titulo: 'Solicitud Institucional', fecha: '25/07/2026', usuario: 'Admin' },
      { tipo: 'hoja-convenio', titulo: 'Hoja de Convenio', fecha: '24/07/2026', usuario: 'Admin' },
      { tipo: 'permiso-policial', titulo: 'Permiso Policial', fecha: '23/07/2026', usuario: 'Admin' },
      { tipo: 'solicitud-espacio', titulo: 'Solicitud de Espacio', fecha: '22/07/2026', usuario: 'Admin' },
      { tipo: 'solicitud-institucional', titulo: 'Solicitud Institucional', fecha: '21/07/2026', usuario: 'Admin' }
    ];
  },

  // Exportacion PDF
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

