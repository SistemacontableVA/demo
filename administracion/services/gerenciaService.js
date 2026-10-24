var GerenciaService = (function () {
  var TABLE = 'gerencia_herramientas';
  var COLUMNS = 'id,nombre,descripcion,link,creado_por,creado_en,actualizado_en';

  function _contexto() {
    var token = typeof getTokenAdmin === 'function' ? getTokenAdmin() : '';
    var tenantId = localStorage.getItem('admin_tenant_id') || '';
    if (!token || !tenantId) throw new Error('Inicia sesión para consultar las herramientas.');
    if (typeof ADMIN_AUTH_BASE_URL !== 'string' || typeof ADMIN_AUTH_PUBLIC_KEY !== 'string') {
      throw new Error('No se pudo validar la sesión para consultar las herramientas.');
    }
    return { token: token, tenantId: tenantId };
  }

  async function _request(path, options) {
    var context = _contexto();
    options = options || {};
    var headers = Object.assign({
      apikey: ADMIN_AUTH_PUBLIC_KEY,
      Authorization: 'Bearer ' + context.token,
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
      nombre: row.nombre,
      descripcion: row.descripcion,
      link: row.link,
      creadoPor: row.creado_por || '',
      creadoEn: row.creado_en || '',
      actualizadoEn: row.actualizado_en || ''
    };
  }

  function _validate(data) {
    var nombre = String(data.nombre || '').trim();
    var descripcion = String(data.descripcion || '').trim();
    var link = String(data.link || '').trim();
    if (!nombre || !descripcion || !link) {
      throw new Error('Completa el nombre, la descripción y el link.');
    }
    if (nombre.length > 120) throw new Error('El nombre no puede superar 120 caracteres.');
    if (descripcion.length > 1000) throw new Error('La descripción no puede superar 1000 caracteres.');
    if (link.length > 2048) throw new Error('El link es demasiado largo.');
    var parsed;
    try {
      parsed = new URL(link);
    } catch (error) {
      throw new Error('Ingresa un link válido que comience con HTTPS.');
    }
    if (parsed.protocol !== 'https:') throw new Error('El link debe usar HTTPS.');
    return { nombre: nombre, descripcion: descripcion, link: parsed.href };
  }

  async function listar() {
    var context = _contexto();
    var query = new URLSearchParams({
      select: COLUMNS,
      tenant_id: 'eq.' + context.tenantId,
      order: 'nombre.asc'
    });
    var rows = await _request(TABLE + '?' + query.toString());
    return (Array.isArray(rows) ? rows : []).map(_map);
  }

  async function crear(data) {
    var context = _contexto();
    var values = _validate(data);
    var rows = await _request(TABLE, {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        tenant_id: context.tenantId,
        nombre: values.nombre,
        descripcion: values.descripcion,
        link: values.link
      })
    });
    if (!Array.isArray(rows) || !rows.length) throw new Error('No se pudo crear la herramienta.');
    return _map(rows[0]);
  }

  async function actualizar(id, data) {
    var context = _contexto();
    var values = _validate(data);
    var query = new URLSearchParams({
      id: 'eq.' + id,
      tenant_id: 'eq.' + context.tenantId,
      select: COLUMNS
    });
    var rows = await _request(TABLE + '?' + query.toString(), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        nombre: values.nombre,
        descripcion: values.descripcion,
        link: values.link,
        actualizado_en: new Date().toISOString()
      })
    });
    if (!Array.isArray(rows) || !rows.length) {
      throw new Error('No se encontró la herramienta o no tienes permiso para editarla.');
    }
    return _map(rows[0]);
  }

  async function eliminar(id) {
    var context = _contexto();
    var query = new URLSearchParams({
      id: 'eq.' + id,
      tenant_id: 'eq.' + context.tenantId,
      select: 'id'
    });
    var rows = await _request(TABLE + '?' + query.toString(), {
      method: 'DELETE',
      headers: { Prefer: 'return=representation' }
    });
    if (!Array.isArray(rows) || !rows.length) {
      throw new Error('No se encontró la herramienta o no tienes permiso para eliminarla.');
    }
    return { ok: true };
  }

  return { listar: listar, crear: crear, actualizar: actualizar, eliminar: eliminar };
})();

window.GerenciaService = GerenciaService;
