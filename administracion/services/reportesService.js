// Reportes
var ReportesService = {
  obtenerReporteLentes: function (filtros) {
    var baseUrl = window.API_URL;
    if (!baseUrl) {
      console.error('[ReportesService] window.API_URL no está definido.');
      return Promise.resolve({ ok: false, error: 'API_URL no configurada.' });
    }

    var params = ['action=obtener-reporte-lentes'];
    filtros = filtros || {};

    if (filtros.fechaInicio && filtros.fechaInicio.trim()) {
      params.push('fechaInicio=' + encodeURIComponent(filtros.fechaInicio.trim()));
    }
    if (filtros.fechaFin && filtros.fechaFin.trim()) {
      params.push('fechaFin=' + encodeURIComponent(filtros.fechaFin.trim()));
    }
    if (filtros.municipio && filtros.municipio.trim()) {
      params.push('municipio=' + encodeURIComponent(filtros.municipio.trim()));
    }
    if (filtros.asesor && filtros.asesor.trim()) {
      params.push('asesor=' + encodeURIComponent(filtros.asesor.trim()));
    }

    var url = baseUrl + '?' + params.join('&');
    return fetch(url, { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .catch(function (err) {
        console.error('[ReportesService] Error:', err);
        return { ok: false, error: err.toString() };
      });
  }

};
