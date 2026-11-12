var OficinaNominaService = (function () {
  var TABLES = {
    empleados: 'oficina_empleados',
    novedades: 'oficina_novedades',
    periodos: 'oficina_periodos',
    pagos: 'oficina_pagos',
    auditoria: 'oficina_nomina_audit'
  };
  var usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  function _contexto() {
    var token = typeof getTokenAdmin === 'function' ? getTokenAdmin() : '';
    var tenantId = localStorage.getItem('admin_tenant_id') || '';
    if (!token || !tenantId) throw new Error('Inicia sesión para consultar esta empresa.');
    if (typeof ADMIN_AUTH_BASE_URL !== 'string' || typeof ADMIN_AUTH_PUBLIC_KEY !== 'string') {
      throw new Error('No se pudo validar la sesión para consultar esta empresa.');
    }
    return { token: token, tenantId: tenantId };
  }

  function _api(path, options) {
    var contexto = _contexto();
    options = options || {};
    var headers = Object.assign({
      apikey: ADMIN_AUTH_PUBLIC_KEY,
      Authorization: 'Bearer ' + contexto.token,
      'Content-Type': 'application/json'
    }, options.headers || {});

    return fetch(ADMIN_AUTH_BASE_URL + '/rest/v1/' + path, Object.assign({}, options, { headers: headers }))
      .then(function (response) {
        return response.text().then(function (text) {
          var data = null;
          if (text) {
            try { data = JSON.parse(text); } catch (error) { data = text; }
          }
          if (!response.ok) {
            var message = data && typeof data === 'object'
              ? (data.message || data.details || data.hint || data.error)
              : data;
            throw new Error(message || 'No se pudo completar la operación.');
          }
          return data;
        });
      });
  }

  function _rpc(name, params) {
    return _api('rpc/' + name, { method: 'POST', body: JSON.stringify(params || {}) });
  }

  function _select(table, columns, filters, order, limit, offset) {
    var contexto = _contexto();
    var query = new URLSearchParams({
      select: columns,
      tenant_id: 'eq.' + contexto.tenantId
    });
    Object.keys(filters || {}).forEach(function (key) { query.set(key, filters[key]); });
    if (order) query.set('order', order);
    if (limit) query.set('limit', String(limit));
    if (offset) query.set('offset', String(offset));
    return _api(table + '?' + query.toString());
  }

  function _selectAllPages(table, columns, filters, order, offset, accumulated) {
    var pageSize = 1000;
    return _select(table, columns, filters, order, pageSize, offset).then(function (rows) {
      var results = accumulated.concat(rows);
      return rows.length === pageSize
        ? _selectAllPages(table, columns, filters, order, offset + pageSize, results)
        : results;
    });
  }

  function _fechaIso(value, nombre) {
    var texto = String(value == null ? '' : value).trim();
    var iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    var local = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    var anio, mes, dia;
    if (iso) {
      anio = Number(iso[1]); mes = Number(iso[2]); dia = Number(iso[3]);
    } else if (local) {
      dia = Number(local[1]); mes = Number(local[2]); anio = Number(local[3]);
    } else {
      throw new Error((nombre || 'La fecha') + ' debe tener formato dd/MM/yyyy.');
    }
    var fecha = new Date(Date.UTC(anio, mes - 1, dia));
    if (fecha.getUTCFullYear() !== anio || fecha.getUTCMonth() !== mes - 1 || fecha.getUTCDate() !== dia) {
      throw new Error((nombre || 'La fecha') + ' no es válida.');
    }
    return anio + '-' + String(mes).padStart(2, '0') + '-' + String(dia).padStart(2, '0');
  }

  function _fechaLocal(value) {
    var texto = String(value == null ? '' : value);
    var iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return iso[3] + '/' + iso[2] + '/' + iso[1];
    return texto;
  }

  function _mapEmpleado(row) {
    return {
      id_empleado: row.codigo,
      fecha_ingreso: _fechaLocal(row.fecha_ingreso),
      personal: row.personal,
      cedula: row.cedula,
      cargo: row.cargo || '',
      sueldo_mensual: row.sueldo_mensual,
      banco: row.banco || '',
      n_cuenta: row.n_cuenta || '',
      telefono: row.telefono || '',
      documento_url: row.documento_url || '',
      activo: row.activo === true
    };
  }

  function _mapPeriodo(row) {
    return {
      id_periodo: row.codigo,
      nombre: row.nombre,
      fecha_inicio: _fechaLocal(row.fecha_inicio),
      fecha_fin: _fechaLocal(row.fecha_fin),
      fecha_pago: _fechaLocal(row.fecha_pago),
      estado: row.estado,
      observacion: row.observacion || ''
    };
  }

  function _mapNovedad(row) {
    return {
      id_novedad: row.id,
      id_empleado: row.oficina_empleados ? row.oficina_empleados.codigo : row.empleado_id,
      id_periodo: row.oficina_periodos ? row.oficina_periodos.codigo : row.periodo_id,
      fecha: _fechaLocal(row.fecha),
      tipo: row.tipo,
      monto: row.monto,
      observacion: row.observacion || '',
      estado: row.estado
    };
  }

  function _mapPago(row) {
    var empleado = row.empleado_snapshot || {};
    var periodo = row.periodo_snapshot || {};
    var calculo = row.calculo_snapshot || {};
    return {
      id_pago: row.id,
      id_empleado: empleado.id_empleado || '',
      empleado: empleado.personal || '',
      id_periodo: periodo.id_periodo || '',
      periodo_nombre: periodo.nombre || '',
      fecha_pago: _fechaLocal(row.fecha_pago_programada),
      fecha_generacion: row.generado_en || '',
      fecha_generado: row.generado_en || '',
      fecha_pagado: row.pagado_en || '',
      referencia_pago: row.referencia_pago || '',
      estado: row.estado,
      neto_pagar: calculo.netoAPagar || 0,
      calculo: calculo,
      empleado_snapshot: empleado,
      periodo_snapshot: periodo
    };
  }

  function _empleadoPayload(employee) {
    return {
      id_empleado: String(employee.id_empleado || '').trim(),
      fecha_ingreso: _fechaIso(employee.fecha_ingreso, 'La fecha de ingreso'),
      personal: String(employee.personal || '').trim(),
      cedula: String(employee.cedula || '').trim(),
      cargo: String(employee.cargo || '').trim(),
      sueldo_mensual: employee.sueldo_mensual,
      banco: String(employee.banco || '').trim(),
      n_cuenta: String(employee.n_cuenta || '').trim(),
      telefono: String(employee.telefono || '').trim(),
      documento_url: String(employee.documento_url || '').trim()
    };
  }

  function listarEmpleados() {
    return _select(TABLES.empleados,
      'codigo,fecha_ingreso,personal,cedula,cargo,sueldo_mensual,banco,n_cuenta,telefono,documento_url,activo',
      {}, 'personal.asc', 1000).then(function (rows) { return rows.map(_mapEmpleado); });
  }

  function crearEmpleado(employee) {
    return _rpc('oficina_crear_empleado', { p_empleado: _empleadoPayload(employee) });
  }

  function editarEmpleado(id, employee) {
    return _rpc('oficina_actualizar_empleado', {
      p_codigo: id,
      p_empleado: _empleadoPayload(employee)
    });
  }

  function desactivarEmpleado(id) {
    return _rpc('oficina_cambiar_estado_empleado', { p_codigo: id, p_activo: false });
  }

  function reactivarEmpleado(id) {
    return _rpc('oficina_cambiar_estado_empleado', { p_codigo: id, p_activo: true });
  }

  function eliminarEmpleado(id) {
    return _rpc('oficina_eliminar_empleado', { p_codigo: id });
  }

  function listarNovedades(filtros) {
    filtros = filtros || {};
    var query = { estado: 'eq.activa' };
    if (filtros.id_empleado) query.empleado_id = 'eq.' + filtros.id_empleado;
    if (filtros.id_periodo) query.periodo_id = 'eq.' + filtros.id_periodo;
    return _select(TABLES.novedades,
      'id,empleado_id,periodo_id,fecha,tipo,monto,observacion,estado,oficina_empleados(codigo),oficina_periodos(codigo)',
      query, 'fecha.desc,creado_en.desc', 100).then(function (rows) { return rows.map(_mapNovedad); });
  }

  function crearNovedad(novelty) {
    var payload = Object.assign({}, novelty, {
      fecha: _fechaIso(novelty.fecha, 'La fecha de la novedad'),
      monto: novelty.tipo === 'Inasistencia' ? 0 : (novelty.monto || 0)
    });
    return _rpc('oficina_crear_novedad', { p_novedad: payload });
  }

  function eliminarNovedad(id) {
    return _rpc('oficina_anular_novedad', { p_id: id });
  }

  function listarPeriodos() {
    return _select(TABLES.periodos,
      'codigo,nombre,fecha_inicio,fecha_fin,fecha_pago,estado,observacion',
      {}, 'fecha_inicio.desc', 1000).then(function (rows) { return rows.map(_mapPeriodo); });
  }

  function crearPeriodo(periodo) {
    var payload = Object.assign({}, periodo, {
      fecha_inicio: _fechaIso(periodo.fecha_inicio, 'La fecha de inicio'),
      fecha_fin: _fechaIso(periodo.fecha_fin, 'La fecha de fin'),
      fecha_pago: periodo.fecha_pago ? _fechaIso(periodo.fecha_pago, 'La fecha de pago') : ''
    });
    return _rpc('oficina_crear_periodo', { p_periodo: payload });
  }

  function cerrarPeriodo(id) {
    return _rpc('oficina_cambiar_estado_periodo', { p_codigo: id, p_estado: 'cerrado' });
  }

  function reabrirPeriodo(id) {
    return _rpc('oficina_cambiar_estado_periodo', { p_codigo: id, p_estado: 'abierto' });
  }

  function calcularNominaLote(idPeriodo, idsEmpleados) {
    return _rpc('oficina_calcular_nomina', {
      p_periodo: idPeriodo,
      p_empleados: idsEmpleados
    });
  }

  function calcularNomina(idPeriodo, idEmpleado) {
    return calcularNominaLote(idPeriodo, [idEmpleado]);
  }

  function generarPagos(idPeriodo, idsEmpleados) {
    return _rpc('oficina_generar_pagos', {
      p_periodo: idPeriodo,
      p_empleados: idsEmpleados
    });
  }

  function generarPago(idPeriodo, idEmpleado) {
    return generarPagos(idPeriodo, [idEmpleado]);
  }

  function marcarPagoPagado(idPago, referencia) {
    return _rpc('oficina_marcar_pago_pagado', {
      p_id: idPago,
      p_referencia: referencia || ''
    });
  }

  function anularPago(idPago, motivo) {
    return _rpc('oficina_anular_pago', { p_id: idPago, p_motivo: motivo });
  }

  function obtenerPago(idPago) {
    return _rpc('oficina_obtener_pago', { p_id: idPago }).then(function (data) {
      var row = data.pago || {};
      var pago = _mapPago(row);
      var calculo = row.calculo_snapshot || {};
      return {
        ok: true,
        pago: pago,
        detalleDiario: data.detalleDiario || [],
        calculo: calculo
      };
    });
  }

  function listarPagosHistoricos(filtros) {
    filtros = filtros || {};
    var query = {};
    if (filtros.id_periodo) query.periodo_snapshot = 'cs.{"id_periodo":"' + filtros.id_periodo + '"}';
    if (filtros.estado) query.estado = 'eq.' + filtros.estado;
    return _selectAllPages(TABLES.pagos,
      'id,estado,fecha_pago_programada,generado_en,pagado_en,referencia_pago,empleado_snapshot,periodo_snapshot,calculo_snapshot',
      query, 'generado_en.desc,id.desc', 0, []).then(function (rows) { return rows.map(_mapPago); });
  }

  function obtenerResumenControl() {
    return _rpc('oficina_resumen_control', {});
  }

  function listarAuditoria(limite) {
    return _select(TABLES.auditoria,
      'id,usuario_id,accion,entidad,entidad_id,antes,despues,ocurrido_en',
      {}, 'ocurrido_en.desc', limite || 100);
  }

  function formatMoney(value) { return usd.format(Number(value) || 0); }

  var _plantillaCache = null;
  function cargarPlantilla() {
    if (_plantillaCache) return Promise.resolve(_plantillaCache);
    return fetch('administracion/documentos/templates/plantilla_relacion_de_pago.html', { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) throw new Error('No se pudo cargar la plantilla de relación de pago.');
        return response.text();
      })
      .then(function (html) { _plantillaCache = html; return html; });
  }

  function _escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character];
    });
  }

  function renderTemplate(template, item) {
    var html = template.replace(/{{#each detalleDiario}}([\s\S]*?){{\/each}}/g, function (_, rowTemplate) {
      return (item.detalleDiario || []).map(function (day) {
        var row = rowTemplate;
        row = row.replace(/{{#if (\w+)}}([\s\S]*?){{else}}([\s\S]*?){{\/if}}/g,
          function (__, key, yes, no) { return day[key] ? yes : no; });
        row = row.replace(/{{#if (\w+)}}([\s\S]*?){{\/if}}/g,
          function (__, key, content) { return day[key] ? content : ''; });
        return row.replace(/{{(\w+)}}/g, function (__, key) {
          return _escapeHtml(day[key] != null ? day[key] : '');
        });
      }).join('');
    });
    return html.replace(/{{(\w+)}}/g, function (_, key) {
      return _escapeHtml(item[key] != null ? item[key] : '');
    });
  }

  return {
    listarEmpleados: listarEmpleados,
    crearEmpleado: crearEmpleado,
    editarEmpleado: editarEmpleado,
    desactivarEmpleado: desactivarEmpleado,
    reactivarEmpleado: reactivarEmpleado,
    eliminarEmpleado: eliminarEmpleado,
    listarNovedades: listarNovedades,
    crearNovedad: crearNovedad,
    eliminarNovedad: eliminarNovedad,
    listarPeriodos: listarPeriodos,
    crearPeriodo: crearPeriodo,
    cerrarPeriodo: cerrarPeriodo,
    reabrirPeriodo: reabrirPeriodo,
    calcularNomina: calcularNomina,
    calcularNominaLote: calcularNominaLote,
    generarPago: generarPago,
    generarPagos: generarPagos,
    obtenerPago: obtenerPago,
    listarPagosHistoricos: listarPagosHistoricos,
    marcarPagoPagado: marcarPagoPagado,
    anularPago: anularPago,
    obtenerResumenControl: obtenerResumenControl,
    listarAuditoria: listarAuditoria,
    formatMoney: formatMoney,
    renderTemplate: renderTemplate,
    cargarPlantilla: cargarPlantilla,
    fechaIso: _fechaIso
  };
})();
