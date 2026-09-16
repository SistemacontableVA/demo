/* ============================================================
   OFICINA NOMINA SERVICE — Capa de datos
   Se comunica con OficinaNomina.gs via fetch.
   NO usa localStorage ni CSV para persistencia.
   ============================================================ */

var OficinaNominaService = (function () {

  // URL del Web App de Apps Script de Nómina Oficina
  var API = 'https://script.google.com/macros/s/AKfycbwCD-AptMIXc7mRpQ6pJjel9-3PEIrGdDb2D843xHA0i67ynlwWh4SZ2wE7y-sljKKn/exec';

  var usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  // ── Helpers internos ────────────────────────────────────────

  function _get(params) {
    var qs = Object.keys(params)
      .filter(function(k) { return params[k] !== undefined && params[k] !== null && params[k] !== ''; })
      .map(function(k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); })
      .join('&');
    return fetch(API + '?' + qs)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.ok === false) throw new Error(data.error || 'Error del servidor.');
        return data;
      });
  }

  function _usuario() {
    // Obtener usuario del token de sesión admin si está disponible
    if (typeof getPerfilAdmin === 'function') {
      return sessionStorage.getItem('admin_perfil') || 'sistema';
    }
    return 'sistema';
  }

  // ── Plantilla de relación de pago (local) ───────────────────

  var _plantillaCache = null;

  function _cargarPlantilla() {
    if (_plantillaCache) return Promise.resolve(_plantillaCache);
    return fetch('administracion/documentos/templates/plantilla_relacion_de_pago.html', { cache: 'no-store' })
      .then(function(r) { return r.text(); })
      .then(function(html) { _plantillaCache = html; return html; });
  }

  function _escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function(c) {
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c];
    });
  }

  function renderTemplate(template, item) {
    var html = template.replace(
      /{{#each detalleDiario}}([\s\S]*?){{\/each}}/g,
      function(_, rowTpl) {
        return (item.detalleDiario || []).map(function(day) {
          var row = rowTpl;

          // 1. {{#if campo}}contenido{{else}}otro{{/if}} — con else
          row = row.replace(/{{#if (\w+)}}([\s\S]*?){{else}}([\s\S]*?){{\/if}}/g,
            function(__, key, yes, no) {
              return day[key] ? yes : no;
            });

          // 2. {{#if campo}}contenido{{/if}} — sin else
          row = row.replace(/{{#if (\w+)}}([\s\S]*?){{\/if}}/g,
            function(__, key, content) {
              return day[key] ? content : '';
            });

          // 3. {{campo}} — variables simples
          row = row.replace(/{{(\w+)}}/g,
            function(__, key) {
              return _escapeHtml(day[key] != null ? day[key] : '');
            });

          return row;
        }).join('');
      }
    );

    // Variables del nivel raíz (fuera del #each)
    return html.replace(/{{(\w+)}}/g, function(_, key) {
      return _escapeHtml(item[key] != null ? item[key] : '');
    });
  }

  // ══════════════════════════════════════════════════════════
  // API PÚBLICA
  // ══════════════════════════════════════════════════════════

  // ── Empleados ───────────────────────────────────────────────

  function listarEmpleados() {
    return _get({ action: 'listar-empleados-oficina' })
      .then(function(d) { return d.empleados || []; });
  }

  function crearEmpleado(emp) {
    return _get(Object.assign({ action: 'crear-empleado-oficina', usuario: _usuario() }, emp));
  }

  function editarEmpleado(id, emp) {
    return _get(Object.assign({ action: 'editar-empleado-oficina', id_empleado: id, usuario: _usuario() }, emp));
  }

  function desactivarEmpleado(id) {
    return _get({ action: 'desactivar-empleado-oficina', id_empleado: id, usuario: _usuario() });
  }

  function reactivarEmpleado(id) {
    return _get({ action: 'reactivar-empleado-oficina', id_empleado: id, usuario: _usuario() });
  }

  function eliminarEmpleado(id) {
    return _get({ action: 'eliminar-empleado-oficina', id_empleado: id, usuario: _usuario() });
  }

  // ── Novedades ────────────────────────────────────────────────

  function listarNovedades(filtros) {
    return _get(Object.assign({ action: 'listar-novedades-oficina', solo_activas: 'true' }, filtros || {}))
      .then(function(d) { return d.novedades || []; });
  }

  function crearNovedad(nov) {
    return _get(Object.assign({ action: 'crear-novedad-oficina', usuario: _usuario() }, nov));
  }

  function editarNovedad(id, nov) {
    return _get(Object.assign({ action: 'editar-novedad-oficina', id_novedad: id, usuario: _usuario() }, nov));
  }

  function eliminarNovedad(id) {
    return _get({ action: 'eliminar-novedad-oficina', id_novedad: id, usuario: _usuario() });
  }

  // ── Periodos ─────────────────────────────────────────────────

  function listarPeriodos() {
    return _get({ action: 'listar-periodos-oficina' })
      .then(function(d) { return d.periodos || []; });
  }

  function crearPeriodo(per) {
    return _get(Object.assign({ action: 'crear-periodo-oficina', usuario: _usuario() }, per));
  }

  function cerrarPeriodo(id) {
    return _get({ action: 'cerrar-periodo-oficina', id_periodo: id, usuario: _usuario() });
  }

  function reabrirPeriodo(id) {
    return _get({ action: 'reabrir-periodo-oficina', id_periodo: id, usuario: _usuario() });
  }

  // ── Nómina ───────────────────────────────────────────────────

  function calcularNomina(idPeriodo, idEmpleado) {
    return _get({ action: 'calcular-nomina-oficina',
                  id_periodo: idPeriodo,
                  id_empleado: idEmpleado || '' });
  }

  function generarPago(idPeriodo, idEmpleado) {
    return _get({ action: 'generar-pago-oficina',
                  id_periodo: idPeriodo,
                  id_empleado: idEmpleado,
                  usuario: _usuario() });
  }

  function obtenerPago(idPago) {
    return _get({ action: 'obtener-pago-oficina', id_pago: idPago });
  }

  function listarPagosHistoricos(filtros) {
    return _get(Object.assign({ action: 'listar-pagos-historicos-oficina' }, filtros || {}))
      .then(function(d) { return d.pagos || []; });
  }

  // ── Auditoría ─────────────────────────────────────────────────

  function listarAuditoria(limite) {
    return _get({ action: 'listar-auditoria-oficina', limite: limite || 100 })
      .then(function(d) { return d.auditoria || []; });
  }

  // ── Formateo ──────────────────────────────────────────────────

  function formatMoney(value) { return usd.format(parseFloat(value) || 0); }

  // ── Carga de plantilla ────────────────────────────────────────

  function cargarPlantilla() { return _cargarPlantilla(); }

  return {
    listarEmpleados:     listarEmpleados,
    crearEmpleado:       crearEmpleado,
    editarEmpleado:      editarEmpleado,
    desactivarEmpleado:  desactivarEmpleado,
    reactivarEmpleado:   reactivarEmpleado,
    eliminarEmpleado:    eliminarEmpleado,
    listarNovedades:     listarNovedades,
    crearNovedad:        crearNovedad,
    editarNovedad:       editarNovedad,
    eliminarNovedad:     eliminarNovedad,
    listarPeriodos:      listarPeriodos,
    crearPeriodo:        crearPeriodo,
    cerrarPeriodo:       cerrarPeriodo,
    reabrirPeriodo:      reabrirPeriodo,
    calcularNomina:      calcularNomina,
    generarPago:         generarPago,
    obtenerPago:         obtenerPago,
    listarPagosHistoricos: listarPagosHistoricos,
    listarAuditoria:     listarAuditoria,
    formatMoney:         formatMoney,
    renderTemplate:      renderTemplate,
    cargarPlantilla:     cargarPlantilla
  };

})();
