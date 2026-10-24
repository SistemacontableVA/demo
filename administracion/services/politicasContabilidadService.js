var PoliticasContabilidadService = (function () {
  function _contexto() {
    var token = typeof getTokenAdmin === 'function' ? getTokenAdmin() : '';
    if (!token) throw new Error('Inicia sesión para administrar las políticas.');
    if (typeof ADMIN_AUTH_BASE_URL !== 'string' || typeof ADMIN_AUTH_PUBLIC_KEY !== 'string') {
      throw new Error('No se pudo validar la sesión para consultar las políticas.');
    }
    return { token: token };
  }

  async function _rpc(nombre, parametros) {
    var contexto = _contexto();
    var respuesta = await fetch(ADMIN_AUTH_BASE_URL.replace(/\/$/, '') + '/rest/v1/rpc/' + nombre, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        apikey: ADMIN_AUTH_PUBLIC_KEY,
        Authorization: 'Bearer ' + contexto.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(parametros || {})
    });
    var texto = await respuesta.text();
    var datos = null;
    if (texto) {
      try {
        datos = JSON.parse(texto);
      } catch (error) {
        datos = texto;
      }
    }
    if (!respuesta.ok) {
      var mensaje = datos && typeof datos === 'object'
        ? (datos.message || datos.details || datos.hint || datos.error)
        : datos;
      throw new Error(mensaje || 'No se pudo completar la operación de políticas.');
    }
    return datos;
  }

  return {
    listar: async function () {
      var resultado = await _rpc('contabilidad_diaria_politicas_listar');
      if (!Array.isArray(resultado)) throw new Error('La lista de coordinadores recibida no es válida.');
      return resultado;
    },

    guardar: async function (userId, valores) {
      if (!userId) throw new Error('Selecciona un coordinador válido.');
      return _rpc('contabilidad_diaria_politica_guardar', {
        p_user_id: userId,
        p_valor_afiliacion: valores.valorAfiliacion,
        p_valor_almuerzo: valores.valorAlmuerzo,
        p_valor_cena: valores.valorCena
      });
    }
  };
})();
