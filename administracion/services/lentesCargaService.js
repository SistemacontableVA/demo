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

    leerLentesMunicipio: function (spreadsheetId) {
      if (!spreadsheetId) {
        return Promise.resolve({ ok: false, error: 'No se pudo identificar la hoja del municipio.' });
      }

      var authBaseUrl = typeof ADMIN_AUTH_BASE_URL === 'string' ? ADMIN_AUTH_BASE_URL : '';
      var publicKey = typeof ADMIN_AUTH_PUBLIC_KEY === 'string' ? ADMIN_AUTH_PUBLIC_KEY : '';
      var token = typeof getTokenAdmin === 'function' ? getTokenAdmin() : '';
      if (!authBaseUrl || !publicKey || !token) {
        return Promise.resolve({ ok: false, error: 'Inicia sesión nuevamente para cargar los lentes del municipio.' });
      }

      return fetch(authBaseUrl.replace(/\/$/, '') + '/functions/v1/lentes-gas-proxy', {
        method: 'POST',
        headers: {
          apikey: publicKey,
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          spreadsheetId: spreadsheetId
        }),
        cache: 'no-store'
      })
        .then(async function (res) {
          var data = await res.json().catch(function () { return null; });
          if (!res.ok) {
            throw new Error(data && data.error ? data.error : 'No se pudieron leer los lentes del municipio.');
          }
          return data;
        })
        .catch(function (err) {
          console.error('[LentesCargaService] leerLentesMunicipio:', err);
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
