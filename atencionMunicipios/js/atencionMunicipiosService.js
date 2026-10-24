var AtencionMunicipiosService = (function () {
  var TABLE = 'atencion_municipios';
  var ESTADOS = ['Sin Digitalizar', 'Por Atender', 'Digitalizado'];
  var COLUMNAS = 'id,ruta,municipio,fecha_atencion,fecha_entrega,link_hoja,estado,creado_por,creado_en,actualizado_en';

  function _contexto() {
    var token = typeof getTokenAdmin === 'function' ? getTokenAdmin() : '';
    var tenantId = localStorage.getItem('admin_tenant_id') || '';
    if (!token || !tenantId) throw new Error('Inicia sesión para consultar esta empresa.');
    return { token: token, tenantId: tenantId };
  }

  async function _request(path, options) {
    var contexto = _contexto();
    options = options || {};
    var headers = Object.assign({
      apikey: ADMIN_AUTH_PUBLIC_KEY,
      Authorization: 'Bearer ' + contexto.token,
      'Content-Type': 'application/json'
    }, options.headers || {});

    var response = await fetch(
      ADMIN_AUTH_BASE_URL + '/rest/v1/' + path,
      Object.assign({}, options, { headers: headers })
    );
    var text = await response.text();
    var data = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch (error) {
        data = text;
      }
    }

    if (!response.ok) {
      var message = data && typeof data === 'object'
        ? (data.message || data.details || data.hint || data.error)
        : data;
      throw new Error(message || 'No se pudo completar la operación.');
    }

    return data;
  }

  function _map(row) {
    return {
      id: row.id,
      ruta: row.ruta,
      municipio: row.municipio,
      fechaAtencion: row.fecha_atencion ? row.fecha_atencion + 'T12:00:00' : '',
      fechaEntrega: row.fecha_entrega ? row.fecha_entrega + 'T12:00:00' : '',
      linkHoja: row.link_hoja,
      estado: row.estado,
      creadoPor: row.creado_por || '',
      creadoEn: row.creado_en || '',
      actualizadoEn: row.actualizado_en || ''
    };
  }

  function _collectionPath(extra) {
    var contexto = _contexto();
    var query = new URLSearchParams({
      select: COLUMNAS,
      tenant_id: 'eq.' + contexto.tenantId,
      order: 'ruta.asc,municipio.asc'
    });
    Object.keys(extra || {}).forEach(function (key) {
      query.set(key, extra[key]);
    });
    return TABLE + '?' + query.toString();
  }

  function _validateRecord(data) {
    if (!data.ruta || !String(data.municipio || '').trim() ||
        !data.fechaAtencion || !String(data.linkHoja || '').trim()) {
      throw new Error('Ruta, municipio, fecha de atención y link son obligatorios.');
    }
    if (!/^https:\/\//i.test(String(data.linkHoja).trim())) {
      throw new Error('El link de la hoja debe usar HTTPS.');
    }
  }

  async function listarMunicipios() {
    var rows = await _request(_collectionPath());
    return (Array.isArray(rows) ? rows : []).map(_map);
  }

  async function guardarMunicipio(data) {
    _validateRecord(data);
    var contexto = _contexto();
    var payload = {
      tenant_id: contexto.tenantId,
      ruta: String(data.ruta).trim(),
      municipio: String(data.municipio).trim(),
      fecha_atencion: data.fechaAtencion,
      fecha_entrega: data.fechaEntrega || null,
      link_hoja: String(data.linkHoja).trim(),
      estado: data.estado || ESTADOS[0],
      creado_por: localStorage.getItem('admin_usuario') || ''
    };
    var rows = await _request(TABLE, {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(payload)
    });
    if (!Array.isArray(rows) || !rows.length) throw new Error('No se creó el municipio.');
    return _map(rows[0]);
  }

  async function actualizarMunicipio(data) {
    _validateRecord(data);
    var contexto = _contexto();
    var query = new URLSearchParams({
      id: 'eq.' + data.id,
      tenant_id: 'eq.' + contexto.tenantId,
      select: COLUMNAS
    });
    var payload = {
      ruta: String(data.ruta).trim(),
      municipio: String(data.municipio).trim(),
      fecha_atencion: data.fechaAtencion,
      fecha_entrega: data.fechaEntrega || null,
      link_hoja: String(data.linkHoja).trim(),
      estado: data.estado || ESTADOS[0],
      actualizado_en: new Date().toISOString()
    };
    var rows = await _request(TABLE + '?' + query.toString(), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(payload)
    });
    if (!Array.isArray(rows) || !rows.length) throw new Error('No se encontró el municipio o no tienes permiso para editarlo.');
    return _map(rows[0]);
  }

  async function eliminarMunicipio(id) {
    var contexto = _contexto();
    var query = new URLSearchParams({
      id: 'eq.' + id,
      tenant_id: 'eq.' + contexto.tenantId,
      select: 'id'
    });
    var rows = await _request(TABLE + '?' + query.toString(), {
      method: 'DELETE',
      headers: { Prefer: 'return=representation' }
    });
    if (!Array.isArray(rows) || !rows.length) throw new Error('No se encontró el municipio o no tienes permiso para eliminarlo.');
    return { ok: true };
  }

  async function cambiarEstado(id, estado) {
    if (ESTADOS.indexOf(estado) === -1) throw new Error('Estado no permitido.');
    var result = await _request('rpc/cambiar_estado_atencion_municipio', {
      method: 'POST',
      body: JSON.stringify({ p_id: id, p_estado: estado })
    });
    if (result !== true) throw new Error('No se pudo cambiar el estado del municipio.');
    return { ok: true };
  }

  return {
    ESTADOS: ESTADOS,
    listarMunicipios: listarMunicipios,
    guardarMunicipio: guardarMunicipio,
    actualizarMunicipio: actualizarMunicipio,
    eliminarMunicipio: eliminarMunicipio,
    cambiarEstado: cambiarEstado
  };
})();

window.AtencionMunicipiosService = AtencionMunicipiosService;
