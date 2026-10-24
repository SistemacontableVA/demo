var LentesCargaService = {
  listarPromotores: function () {
    var baseUrl = window.API_URL;
    if (!baseUrl) {
      return Promise.resolve({ ok: false, error: 'API_URL no configurada.' });
    }

    return fetch(baseUrl + '?action=listar-promotores', { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .catch(function (err) {
        console.error('[LentesCargaService] listarPromotores:', err);
        return { ok: false, error: err.toString() };
      });
  },

  cargarRelacionLentes: function (payload) {
    var baseUrl = window.API_URL;
    if (!baseUrl) {
      return Promise.resolve({ ok: false, error: 'API_URL no configurada.' });
    }

    var url = baseUrl + '?action=cargar-relacion-lentes&payload=' + encodeURIComponent(JSON.stringify(payload || {}));

    return fetch(url, { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .catch(function (err) {
        console.error('[LentesCargaService] cargarRelacionLentes:', err);
        return { ok: false, error: err.toString() };
      });
    },

    listarJornadasLentes: function (filtros) {
      var baseUrl = window.API_URL;
      if (!baseUrl) return Promise.resolve({ ok: false, error: 'API_URL no configurada.' });
      var params = new URLSearchParams({ action: 'listar-jornadas-lentes' });
      Object.keys(filtros || {}).forEach(function (clave) {
        if (filtros[clave]) params.set(clave, filtros[clave]);
      });
      return fetch(baseUrl + '?' + params.toString(), { cache: 'no-store' })
        .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
        .catch(function (err) {
          console.error('[LentesCargaService] listarJornadasLentes:', err);
          return { ok: false, error: err.toString() };
        });
    },

    listarCatalogosJornadasLentes: function () {
      return this.listarJornadasLentes({ catalogos: '1' });
    },

    editarJornadaLentes: function (payload) {
      var baseUrl = window.API_URL;
      if (!baseUrl) return Promise.resolve({ ok: false, error: 'API_URL no configurada.' });
      var url = baseUrl + '?action=editar-jornada-lentes&payload=' + encodeURIComponent(JSON.stringify(payload || {}));
      return fetch(url, { cache: 'no-store' })
        .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
        .catch(function (err) {
          console.error('[LentesCargaService] editarJornadaLentes:', err);
          return { ok: false, error: err.toString() };
        });
    },

    suprimirJornadaLentes: function (fila) {
      var baseUrl = window.API_URL;
      if (!baseUrl) return Promise.resolve({ ok: false, error: 'API_URL no configurada.' });
      return fetch(baseUrl + '?action=suprimir-jornada-lentes&fila=' + encodeURIComponent(fila), { cache: 'no-store' })
        .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
        .catch(function (err) {
          console.error('[LentesCargaService] suprimirJornadaLentes:', err);
          return { ok: false, error: err.toString() };
        });
  }
};
