var _ofTab       = 'relaciones';
var _ofEmpleados = [];
var _ofPeriodos  = [];
var _ofNovedades = [];
var _ofPagos     = [];

/* ════════════════════════════════════════════════════════════
   PUNTO DE ENTRADA
════════════════════════════════════════════════════════════ */

function renderOficina() {
  var root = document.getElementById('admin-content');
  if (!root) return;

  root.innerHTML =
    '<div class="oficina-module fade-in">' +
    '<div class="oficina-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">' +
      '<div>' +
        '<h3 class="text-verde-oscuro font-bold text-lg">Nómina Oficina</h3>' +
        '<p class="text-slate-400 text-sm mt-0.5">Empleados, novedades y relaciones de pago</p>' +
      '</div>' +
    '</div>' +
    '<nav class="oficina-nav flex flex-wrap gap-2 mb-5">' +
      _ofTabBtn('relaciones', 'Relaciones') +
      _ofTabBtn('empleados',  'Empleados') +
      _ofTabBtn('novedades',  'Novedades') +
      _ofTabBtn('periodos',   'Períodos') +
      _ofTabBtn('pagos',      'Historial pagos') +
    '</nav>' +
    '<div id="of-panel" class="oficina-panel"><div class="flex items-center justify-center h-32"><div class="spinner"></div></div></div>' +
    '<div id="of-carga-overlay" class="hidden fixed inset-0 z-[200] items-center justify-center bg-slate-900/40 px-4" role="status" aria-live="polite">' +
      '<div class="bg-white rounded-2xl shadow-card px-8 py-7 text-center max-w-xs w-full">' +
        '<div class="spinner w-10 h-10 mx-auto mb-4 border-4"></div>' +
        '<p id="of-carga-titulo" class="text-verde-oscuro font-bold text-base">Procesando</p>' +
        '<p class="text-slate-500 text-xs mt-1">Espera mientras se guarda la información...</p>' +
      '</div>' +
    '</div>' +
    '</div>';

  root.querySelectorAll('[data-of-tab]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      _ofTab = btn.getAttribute('data-of-tab');
      _ofActualizarTabs();
      _ofRenderPanel();
    });
  });

  _ofCargarBase().then(function() { _ofRenderPanel(); });
}

function _ofTabBtn(id, label) {
  var activo = id === _ofTab;
  return '<button data-of-tab="' + id + '" class="px-4 py-2 rounded-xl text-sm font-semibold transition-all ' +
    (activo ? 'tab-btn-activo' : 'tab-btn-inactivo') +
    '">' + label + '</button>';
}

function _ofActualizarTabs() {
  document.querySelectorAll('[data-of-tab]').forEach(function(btn) {
    var activo = btn.getAttribute('data-of-tab') === _ofTab;
    btn.className = 'px-4 py-2 rounded-xl text-sm font-semibold transition-all ' +
      (activo ? 'tab-btn-activo' : 'tab-btn-inactivo');
  });
}

function _ofCargarBase() {
  return Promise.all([
    OficinaNominaService.listarEmpleados(),
    OficinaNominaService.listarPeriodos(),
    OficinaNominaService.listarNovedades(),
    OficinaNominaService.listarPagosHistoricos()
  ]).then(function(res) {
    _ofEmpleados = res[0];
    _ofPeriodos  = res[1];
    _ofNovedades = res[2];
    _ofPagos     = res[3];
  }).catch(function(err) {
    _ofMostrarError('of-panel', 'Error cargando datos: ' + err.message);
  });
}

function _ofRenderPanel() {
  if (_ofTab === 'empleados') return _ofRenderEmpleados();
  if (_ofTab === 'novedades') return _ofRenderNovedades();
  if (_ofTab === 'periodos')  return _ofRenderPeriodos();
  if (_ofTab === 'pagos')     return _ofRenderPagos();
  _ofRenderRelaciones();
}

/* ════════════════════════════════════════════════════════════
   RELACIONES
════════════════════════════════════════════════════════════ */

function _ofRenderRelaciones() {
  var panel = document.getElementById('of-panel');
  if (!panel) return;

  var periodosActivos = _ofPeriodos.filter(function(p) {
    return p.estado === 'abierto' || p.estado === 'calculado';
  });

  var optsPer = periodosActivos.length
    ? periodosActivos.map(function(p) {
        return '<option value="' + _esc(p.id_periodo) + '">' +
          _esc(p.nombre) + ' · ' + _esc(p.fecha_inicio) + ' — ' + _esc(p.fecha_fin) +
          ' [' + _esc(p.estado) + ']</option>';
      }).join('')
    : '<option value="">— Sin períodos activos. Crea uno nuevo —</option>';

  var empleadosActivos = _ofEmpleados.filter(function(e) { return _ofActivo(e); });

  var listaEmpleados = empleadosActivos.length
    ? empleadosActivos.map(function(e) {
        var id = 'chk-rel-' + _esc(e.id_empleado);
        return '<label class="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors" for="' + id + '">' +
          '<input type="checkbox" id="' + id + '" value="' + _esc(e.id_empleado) + '" data-nombre="' + _esc(e.personal) + '"' +
            ' onchange="_ofActContadorRel()"' +
            ' class="w-4 h-4 rounded border-slate-300 cursor-pointer flex-shrink-0 checked:accent-green-700">' +
          '<div class="flex-1 min-w-0">' +
            '<p class="text-sm font-medium text-slate-700 truncate">' + _esc(e.personal) + '</p>' +
            '<p class="text-xs text-slate-400">' + _esc(e.cargo) + ' · ' + OficinaNominaService.formatMoney(e.sueldo_mensual) + '/mes</p>' +
          '</div>' +
        '</label>';
      }).join('')
    : '<div class="px-4 py-4 text-sm text-slate-400 text-center">Sin empleados activos. Crea empleados primero.</div>';

  panel.innerHTML =
    '<div class="bg-white rounded-2xl shadow-soft p-5 mb-4">' +

      // Selector de período
      '<h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Paso 1 — Selecciona el período</h4>' +
      '<select id="rel-periodo" class="' + _ofClsSelect + ' mb-5">' + optsPer + '</select>' +

      // Lista de empleados con checkboxes
      '<h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">' +
        'Paso 2 — Selecciona empleados' +
        '<span id="rel-count" class="ml-2 text-[10px] font-semibold text-verde-oscuro normal-case">0 seleccionados</span>' +
      '</h4>' +
      '<div class="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto mb-3">' +
        listaEmpleados +
      '</div>' +
      '<div class="flex items-center gap-4 mb-5">' +
        '<button onclick="_ofSelTodosRel()" class="text-xs text-verde-oscuro hover:underline font-semibold">Seleccionar todos</button>' +
        '<span class="text-slate-200">|</span>' +
        '<button onclick="_ofDeselTodosRel()" class="text-xs text-slate-400 hover:underline font-semibold">Limpiar</button>' +
      '</div>' +

      // Botón calcular
      '<div id="rel-error" class="hidden mb-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700"></div>' +
      '<button id="rel-btn-calc" onclick="_ofCalcular()"' +
        ' class="btn-primario text-white font-bold px-8 py-3 rounded-xl text-sm hover:bg-verde-oscuro active:scale-95 transition-all">' +
        '<span id="rel-btn-txt">Calcular nómina</span>' +
      '</button>' +
    '</div>' +

    // Resultados
    '<div id="rel-resultado"></div>';
}

function _ofActContadorRel() {
  var checks = document.querySelectorAll('[id^="chk-rel-"]:checked');
  var el = document.getElementById('rel-count');
  if (el) el.textContent = checks.length + ' seleccionado' + (checks.length !== 1 ? 's' : '');
}

function _ofSelTodosRel() {
  document.querySelectorAll('[id^="chk-rel-"]').forEach(function(c) { c.checked = true; });
  _ofActContadorRel();
}

function _ofDeselTodosRel() {
  document.querySelectorAll('[id^="chk-rel-"]').forEach(function(c) { c.checked = false; });
  _ofActContadorRel();
}

function _ofCalcular() {
  var btnEl  = document.getElementById('rel-btn-calc');
  var txtEl  = document.getElementById('rel-btn-txt');
  var errEl  = document.getElementById('rel-error');
  var resEl  = document.getElementById('rel-resultado');
  errEl.classList.add('hidden');

  var idPer = _ofVal('rel-periodo');
  if (!idPer) {
    errEl.textContent = 'Selecciona un período.';
    errEl.classList.remove('hidden');
    return;
  }

  // Recoger empleados seleccionados
  var checks = document.querySelectorAll('[id^="chk-rel-"]:checked');
  if (checks.length === 0) {
    errEl.textContent = 'Selecciona al menos un empleado.';
    errEl.classList.remove('hidden');
    return;
  }

  var idsSeleccionados = [];
  checks.forEach(function(c) { idsSeleccionados.push(c.value); });

  btnEl.disabled = true;
  txtEl.textContent = 'Calculando...';
  _ofMostrarCarga('Calculando nómina');
  resEl.innerHTML = '<div class="flex items-center gap-2 py-6 text-slate-400 text-sm"><div class="spinner w-4 h-4"></div> Calculando ' + idsSeleccionados.length + ' empleado' + (idsSeleccionados.length !== 1 ? 's' : '') + '...</div>';

  var periodo = _ofPeriodos.find(function(p) { return p.id_periodo === idPer; });

  // Calcular todos en paralelo
  Promise.all(idsSeleccionados.map(function(idEmp) {
    return OficinaNominaService.calcularNomina(idPer, idEmp)
      .then(function(data) {
        return (data.detalle || [])[0] || null;
      })
      .catch(function(err) {
        return { _error: err.message, empleado: { id_empleado: idEmp, personal: idEmp } };
      });
  }))
  .then(function(resultados) {
    resultados = resultados.filter(Boolean);

    var totalIngresos    = resultados.reduce(function(s, r) { return s + (r._error ? 0 : (r.totalIngresos    || 0)); }, 0);
    var totalDeducciones = resultados.reduce(function(s, r) { return s + (r._error ? 0 : (r.totalDeducciones || 0)); }, 0);
    var totalNeto        = resultados.reduce(function(s, r) { return s + (r._error ? 0 : (r.netoAPagar       || 0)); }, 0);

    var puedeGenerar = periodo && (periodo.estado === 'abierto' || periodo.estado === 'calculado');

    resEl.innerHTML =
      // Resumen global
      '<div class="bg-white rounded-2xl shadow-soft p-5 mb-4">' +
        '<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">' +
          '<div>' +
            '<h4 class="font-bold text-verde-oscuro">' + _esc(periodo ? periodo.nombre : idPer) + '</h4>' +
            '<p class="text-xs text-slate-400">' +
              (periodo ? _esc(periodo.fecha_inicio) + ' — ' + _esc(periodo.fecha_fin) : '') +
              ' · <span class="font-semibold">' + (periodo ? _esc(periodo.estado) : '') + '</span>' +
            '</p>' +
          '</div>' +
          (puedeGenerar
            ? '<button id="btn-gen-todos" onclick="_ofGenerarTodos(\'' + _esc(idPer) + '\')" ' +
                'class="btn-primario text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-verde-oscuro active:scale-95 transition-all">' +
                '<span id="btn-gen-todos-txt">Generar todos los pagos</span>' +
              '</button>'
            : '') +
        '</div>' +
        '<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">' +
          _ofMetrica('Empleados',   resultados.length) +
          _ofMetrica('Ingresos',    OficinaNominaService.formatMoney(totalIngresos)) +
          _ofMetrica('Deducciones', OficinaNominaService.formatMoney(totalDeducciones)) +
          _ofMetrica('Neto total',  OficinaNominaService.formatMoney(totalNeto)) +
        '</div>' +
      '</div>' +

      // Tarjeta por empleado
      resultados.map(function(item) {
        if (item._error) {
          return '<div class="bg-white rounded-2xl shadow-soft p-4 mb-3">' +
            '<p class="font-medium text-slate-600">' + _esc(item.empleado.personal) + '</p>' +
            '<p class="text-xs text-red-500 mt-1">' + _esc(item._error) + '</p>' +
          '</div>';
        }
        return _ofTarjetaRelacion(item, idPer, periodo ? periodo.estado : '');
      }).join('');

    // Guardar resultados en variable global para el botón "Generar todos"
    window._ofUltimosResultados = { idPer: idPer, ids: idsSeleccionados };
  })
  .catch(function(err) {
    resEl.innerHTML = _ofAlerta('rojo', err.message);
  })
  .finally(function() {
    btnEl.disabled = false;
    txtEl.textContent = 'Calcular nómina';
    _ofOcultarCarga();
  });
}

function _ofGenerarTodos(idPer) {
  var btn = document.getElementById('btn-gen-todos');
  var txt = document.getElementById('btn-gen-todos-txt');
  if (!window._ofUltimosResultados || window._ofUltimosResultados.idPer !== idPer) return;

  var ids = window._ofUltimosResultados.ids;
  if (!confirm('¿Generar y guardar los pagos de ' + ids.length + ' empleado' + (ids.length !== 1 ? 's' : '') + '?\nEsta acción queda registrada en el historial.')) return;

  if (btn) { btn.disabled = true; }
  if (txt) { txt.textContent = 'Generando...'; }
  _ofMostrarCarga('Generando pagos');

  Promise.all(ids.map(function(idEmp) {
    return OficinaNominaService.generarPago(idPer, idEmp)
      .then(function(d) { return { idEmp: idEmp, ok: true, id_pago: d.id_pago, neto: d.calculo ? d.calculo.netoAPagar : 0 }; })
      .catch(function(e) { return { idEmp: idEmp, ok: false, error: e.message }; });
  }))
  .then(function(res) {
    var ok  = res.filter(function(r) { return r.ok; });
    var err = res.filter(function(r) { return !r.ok; });
    var msg = '✓ ' + ok.length + ' pago' + (ok.length !== 1 ? 's' : '') + ' generado' + (ok.length !== 1 ? 's' : '') + '.';
    if (err.length) msg += '\n⚠ ' + err.length + ' con error:\n' + err.map(function(r) { return r.idEmp + ': ' + r.error; }).join('\n');

    var finaliza = ok.length === ids.length;
    if (finaliza) {
      return OficinaNominaService.cerrarPeriodo(idPer)
        .then(function() {
          msg += '\n\nEl período quedó cerrado y listo para crear el siguiente.';
          alert(msg);
          if (btn) { btn.disabled = false; }
          if (txt) { txt.textContent = 'Generar todos los pagos'; }
          return _ofCargarBase();
        })
        .then(function() { _ofRenderPanel(); });
    }

    alert(msg);
    if (btn) { btn.disabled = false; }
    if (txt) { txt.textContent = 'Generar todos los pagos'; }
    return _ofCargarBase();
  })
  .then(function() { _ofRenderPanel(); })
  .catch(function(err) {
    alert('Error finalizando pagos: ' + err.message);
    if (btn) { btn.disabled = false; }
    if (txt) { txt.textContent = 'Generar todos los pagos'; }
  })
  .finally(function() { _ofOcultarCarga(); });
}

function _ofTarjetaRelacion(item, idPeriodo, estadoPeriodo) {
  var emp = item.empleado || {};
  var filas = (item.detalleDiario || []).map(function(dia) {
    return '<tr class="border-b border-slate-100 ' + (!dia.laborado ? 'bg-red-50/40' : '') + '">' +
      '<td class="px-3 py-1.5 text-xs">' + _esc(dia.fecha) + '</td>' +
      '<td class="px-3 py-1.5 text-center">' +
        (dia.laborado
          ? '<span class="text-emerald-600 text-xs font-bold">✓</span>'
          : '<span class="text-red-400 text-xs font-bold">✗</span>') +
      '</td>' +
      '<td class="px-3 py-1.5 text-xs text-right">' + (dia.prestamo     ? OficinaNominaService.formatMoney(dia.prestamo)      : '') + '</td>' +
      '<td class="px-3 py-1.5 text-xs text-right">' + (dia.adicionalFestivo ? OficinaNominaService.formatMoney(dia.adicionalFestivo) : '') + '</td>' +
      '<td class="px-3 py-1.5 text-xs text-slate-400">' + _esc(dia.detalle) + '</td>' +
    '</tr>';
  }).join('');

  var idSafe = _esc(emp.id_empleado);

  return '<div class="bg-white rounded-2xl shadow-soft overflow-hidden mb-4">' +
    // Header empleado
    '<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-slate-100">' +
      '<div>' +
        '<p class="font-bold text-verde-oscuro">' + _esc(emp.personal) + '</p>' +
        '<p class="text-xs text-slate-400">' + _esc(emp.cargo) + ' · ' + _esc(emp.cedula) + '</p>' +
      '</div>' +
      '<button onclick="_ofImprimirRelacion(\'' + _esc(idPeriodo) + '\',\'' + idSafe + '\')" ' +
        'class="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:border-verde-oscuro/50 transition-colors">Imprimir relación</button>' +
    '</div>' +
    // KPIs
    '<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 py-4 border-b border-slate-100">' +
      _ofMetrica('Días laborados', item.diasLaborados) +
      _ofMetrica('Ingresos',       OficinaNominaService.formatMoney(item.totalIngresos)) +
      _ofMetrica('Deducciones',    OficinaNominaService.formatMoney(item.totalDeducciones)) +
      _ofMetrica('Neto a pagar',   OficinaNominaService.formatMoney(item.netoAPagar)) +
    '</div>' +
    // Tabla diaria
    '<div class="overflow-x-auto">' +
      '<table class="w-full">' +
        '<thead><tr class="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400 border-b border-slate-200">' +
          '<th class="px-3 py-2 text-left">Fecha</th>' +
          '<th class="px-3 py-2 text-center">Lab.</th>' +
          '<th class="px-3 py-2 text-right">Préstamo</th>' +
          '<th class="px-3 py-2 text-right">Adicional</th>' +
          '<th class="px-3 py-2 text-left">Detalle</th>' +
        '</tr></thead>' +
        '<tbody>' + filas + '</tbody>' +
      '</table>' +
    '</div>' +
  '</div>';
}

function _ofImprimirRelacion(idPeriodo, idEmpleado) {
  var periodo = _ofPeriodos.find(function(p) { return p.id_periodo === idPeriodo; });
  var emp     = _ofEmpleados.find(function(e) { return e.id_empleado === idEmpleado; });
  if (!periodo || !emp) return alert('No se encontraron los datos necesarios.');

  OficinaNominaService.calcularNomina(idPeriodo, idEmpleado)
    .then(function(data) {
      var item = (data.detalle || [])[0];
      if (!item) throw new Error('Sin datos de cálculo.');

      // Formatear el detalle diario para la plantilla
      // Los números deben ser strings con formato para que {{#if}} funcione correctamente:
      // - 0  → cadena vacía (para que #if sea falso y no muestre nada)
      // - >0 → string con formato $XX.XX
      var detalleDiarioFormateado = (item.detalleDiario || []).map(function(dia) {
        return {
          fecha:            dia.fecha,
          laborado:         dia.laborado,
          prestamo:         dia.prestamo > 0
                              ? OficinaNominaService.formatMoney(dia.prestamo)
                              : '',
          adicionalFestivo: dia.adicionalFestivo > 0
                              ? OficinaNominaService.formatMoney(dia.adicionalFestivo)
                              : '',
          detalle:          dia.detalle || ''
        };
      });

      return OficinaNominaService.cargarPlantilla().then(function(plantilla) {
        return OficinaNominaService.renderTemplate(plantilla, {
          nombreEmpleado:        emp.personal,
          bancoPago:             emp.banco          || '',
          identificacionEmpleado:emp.cedula         || '',
          cargoEmpleado:         emp.cargo          || '',
          telefonoEmpleado:      emp.telefono       || '',
          periodoNombre:         periodo.nombre     || '',
          fechaInicio:           periodo.fecha_inicio || '',
          fechaFin:              periodo.fecha_fin    || '',
          diasLaborados:         item.diasLaborados,
          valorDiasLaborados:    OficinaNominaService.formatMoney(item.valorDiasLaborados),
          adicionalFestivos:     OficinaNominaService.formatMoney(item.adicionalFestivos),
          totalIngresos:         OficinaNominaService.formatMoney(item.totalIngresos),
          prestamosAdelanto:     OficinaNominaService.formatMoney(item.prestamosAdelanto),
          penalizacionDeduccion: OficinaNominaService.formatMoney(item.penalizacionDeduccion),
          totalDeducciones:      OficinaNominaService.formatMoney(item.totalDeducciones),
          netoAPagar:            OficinaNominaService.formatMoney(item.netoAPagar),
          detalleDiario:         detalleDiarioFormateado
        });
      });
    })
    .then(function(html) {
      var popup = window.open('', '_blank');
      if (!popup) return alert('Permite ventanas emergentes para imprimir.');
      popup.document.open();
      popup.document.write(html);
      popup.document.close();
      popup.focus();
      // Dar tiempo al DOM para renderizar antes de imprimir
      setTimeout(function() {
        try { popup.print(); } catch(e) { /* el usuario puede imprimir manualmente */ }
      }, 800);
    })
    .catch(function(err) { alert('Error al imprimir: ' + err.message); });
}

/* ════════════════════════════════════════════════════════════
   EMPLEADOS
════════════════════════════════════════════════════════════ */

function _ofRenderEmpleados() {
  var panel = document.getElementById('of-panel');
  if (!panel) return;

  // Calcular el próximo ID sugerido automáticamente
  var proximoId = _ofGenerarSiguienteId();

  var filas = _ofEmpleados.map(function(e) {
    var activo = _ofActivo(e);
    var idSafe = _esc(e.id_empleado);
    return (
      '<tr class="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">' +
        // ID — primera columna visible
        '<td class="px-3 py-2.5">' +
          '<span class="inline-block text-[10px] font-bold font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded">' + _esc(e.id_empleado) + '</span>' +
        '</td>' +
        '<td class="px-3 py-2.5 text-sm font-medium text-verde-oscuro">' + _esc(e.personal) + '</td>' +
        '<td class="px-3 py-2.5 text-xs text-slate-500">' + _esc(e.cedula) + '</td>' +
        '<td class="px-3 py-2.5 text-xs text-slate-500 hidden sm:table-cell">' + _esc(e.cargo) + '</td>' +
        '<td class="px-3 py-2.5 text-xs text-right font-semibold hidden md:table-cell">' + OficinaNominaService.formatMoney(e.sueldo_mensual) + '</td>' +
        '<td class="px-3 py-2.5 text-center">' +
          '<span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ' +
            (activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400') + '">' +
            (activo ? 'Activo' : 'Inactivo') + '</span>' +
        '</td>' +
        '<td class="px-3 py-2.5 text-right whitespace-nowrap">' +
          '<button onclick="_ofAbrirEdicion(\'' + idSafe + '\')" ' +
            'class="text-xs text-verde-oscuro hover:underline font-semibold mr-2">Editar</button>' +
          (activo
            ? '<button id="btn-desact-' + idSafe + '" onclick="_ofDesactivarEmpleado(\'' + idSafe + '\')" ' +
                'class="text-xs text-amber-600 hover:text-amber-800 font-semibold mr-2">Desactivar</button>'
            : '<button id="btn-react-' + idSafe + '" onclick="_ofReactivarEmpleado(\'' + idSafe + '\')" ' +
                'class="text-xs text-emerald-600 hover:text-emerald-800 font-semibold mr-2">Reactivar</button>') +
          '<button id="btn-del-' + idSafe + '" onclick="_ofEliminarEmpleado(\'' + idSafe + '\')" ' +
            'class="text-xs text-red-400 hover:text-red-700 font-semibold">Eliminar</button>' +
        '</td>' +
      '</tr>' +
      // Fila edición inline
      '<tr id="emp-edit-row-' + idSafe + '" class="hidden bg-slate-50/70 border-b border-slate-200">' +
        '<td colspan="7" class="px-4 py-4">' +
          '<div class="flex items-center gap-2 mb-3">' +
            '<span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Editando:</span>' +
            '<span class="text-xs font-bold font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded">' + _esc(e.id_empleado) + '</span>' +
            '<span class="text-sm font-semibold text-verde-oscuro">' + _esc(e.personal) + '</span>' +
          '</div>' +
          '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">' +
            _ofCampoVal('ed-ingreso-'  + idSafe, 'Fecha ingreso',        'text',   e.fecha_ingreso  || '') +
            _ofCampoVal('ed-nombre-'   + idSafe, 'Nombre completo *',    'text',   e.personal       || '') +
            _ofCampoVal('ed-cedula-'   + idSafe, 'Cédula *',             'text',   e.cedula         || '') +
            _ofCampoVal('ed-cargo-'    + idSafe, 'Cargo',                'text',   e.cargo          || '') +
            _ofCampoVal('ed-sueldo-'   + idSafe, 'Sueldo mensual USD *', 'number', e.sueldo_mensual || '') +
            _ofCampoVal('ed-banco-'    + idSafe, 'Banco / medio pago',   'text',   e.banco          || '') +
            _ofCampoVal('ed-cuenta-'   + idSafe, 'N° de cuenta',         'text',   e.n_cuenta       || '') +
            _ofCampoVal('ed-telefono-' + idSafe, 'Teléfono',             'text',   e.telefono       || '') +
            _ofCampoVal('ed-docurl-'   + idSafe, 'URL documento',        'text',   e.documento_url  || '') +
          '</div>' +
          '<div id="ed-error-' + idSafe + '" class="hidden mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700"></div>' +
          '<div class="flex gap-2 justify-end">' +
            '<button id="ed-cancel-' + idSafe + '" onclick="_ofCerrarEdicion(\'' + idSafe + '\')" ' +
              'class="text-xs px-4 py-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors">Cancelar</button>' +
            '<button id="ed-save-' + idSafe + '" onclick="_ofGuardarEdicion(\'' + idSafe + '\')" ' +
              'class="text-xs px-4 py-2 rounded-lg btn-primario text-white font-semibold hover:bg-verde-oscuro transition-colors">' +
              '<span id="ed-save-txt-' + idSafe + '">Guardar cambios</span>' +
            '</button>' +
          '</div>' +
        '</td>' +
      '</tr>'
    );
  }).join('');

  panel.innerHTML =
    '<div class="bg-white rounded-2xl shadow-soft p-5 mb-4">' +
      '<h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nuevo empleado</h4>' +
      '<p class="text-xs text-slate-400 mb-4">El ID se genera automáticamente si lo dejas vacío.</p>' +
      '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">' +
        // ID con valor sugerido y placeholder
        '<div>' +
          '<label for="emp-id" class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">ID Empleado</label>' +
          '<input type="text" id="emp-id" placeholder="' + _esc(proximoId) + ' (auto si vacío)"' +
            ' class="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:border-verde-oscuro focus:ring-2 focus:ring-verde-oscuro/10 focus:bg-white transition-all font-mono">' +
        '</div>' +
        _ofCampo('emp-ingreso',  'Fecha ingreso *',      'text',   'dd/MM/yyyy') +
        _ofCampo('emp-nombre',   'Nombre completo *',    'text',   '') +
        _ofCampo('emp-cedula',   'Cédula *',             'text',   '') +
        _ofCampo('emp-cargo',    'Cargo',                'text',   '') +
        _ofCampo('emp-sueldo',   'Sueldo mensual USD *', 'number', '0') +
        _ofCampo('emp-banco',    'Banco / medio pago',   'text',   '') +
        _ofCampo('emp-cuenta',   'N° de cuenta',         'text',   '') +
        _ofCampo('emp-telefono', 'Teléfono',             'text',   '') +
        _ofCampo('emp-docurl',   'URL documento',        'text',   '') +
      '</div>' +
      '<div id="emp-error" class="hidden mb-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700"></div>' +
      '<div class="flex justify-end">' +
        '<button id="emp-btn-guardar" onclick="_ofGuardarEmpleado()" ' +
          'class="btn-primario text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-verde-oscuro active:scale-95 transition-all">' +
          '<span id="emp-btn-txt">Guardar empleado</span>' +
        '</button>' +
      '</div>' +
    '</div>' +
    '<div class="bg-white rounded-2xl shadow-soft overflow-hidden">' +
      '<div class="px-5 py-3 border-b border-slate-100">' +
        '<h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Empleados (' + _ofEmpleados.length + ')</h4>' +
      '</div>' +
      '<div class="overflow-x-auto">' +
        '<table class="w-full">' +
          '<thead><tr class="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400 border-b border-slate-200">' +
            '<th class="px-3 py-2 text-left">ID</th>' +
            '<th class="px-3 py-2 text-left">Nombre</th>' +
            '<th class="px-3 py-2 text-left">Cédula</th>' +
            '<th class="px-3 py-2 text-left hidden sm:table-cell">Cargo</th>' +
            '<th class="px-3 py-2 text-right hidden md:table-cell">Sueldo</th>' +
            '<th class="px-3 py-2 text-center">Estado</th>' +
            '<th class="px-3 py-2 text-right">Acciones</th>' +
          '</tr></thead>' +
          '<tbody>' + (filas || '<tr><td colspan="7" class="px-3 py-6 text-center text-slate-400 text-sm">Sin empleados registrados</td></tr>') + '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';
}

/* Alta */
function _ofGuardarEmpleado() {
  var btnEl = document.getElementById('emp-btn-guardar');
  var txtEl = document.getElementById('emp-btn-txt');
  var errEl = document.getElementById('emp-error');
  errEl.classList.add('hidden');

  // Si el ID está vacío, generar automáticamente
  var idManual = _ofVal('emp-id');
  var idFinal  = idManual || _ofGenerarSiguienteId();

  var emp = {
    id_empleado:    idFinal,
    fecha_ingreso:  _ofVal('emp-ingreso'),
    personal:       _ofVal('emp-nombre'),
    cedula:         _ofVal('emp-cedula'),
    cargo:          _ofVal('emp-cargo'),
    sueldo_mensual: _ofVal('emp-sueldo'),
    banco:          _ofVal('emp-banco'),
    n_cuenta:       _ofVal('emp-cuenta'),
    telefono:       _ofVal('emp-telefono'),
    documento_url:  _ofVal('emp-docurl')
  };

  if (!emp.personal || !emp.cedula || !emp.sueldo_mensual || !emp.fecha_ingreso) {
    errEl.textContent = 'Completa los campos obligatorios: nombre, cédula, fecha ingreso y sueldo.';
    errEl.classList.remove('hidden');
    return;
  }

  btnEl.disabled = true;
  txtEl.textContent = 'Guardando...';
  _ofMostrarCarga('Guardando empleado');

  OficinaNominaService.crearEmpleado(emp)
    .then(function() { return _ofCargarBase(); })
    .then(function() { _ofRenderEmpleados(); })
    .catch(function(err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
      btnEl.disabled = false;
      txtEl.textContent = 'Guardar empleado';
    })
    .finally(function() { _ofOcultarCarga(); });
}

/**
 * Genera el siguiente ID correlativo basado en los empleados existentes.
 * Formato: EMP-001, EMP-002, etc.
 * Si ya hay IDs con ese patrón, toma el mayor número y suma 1.
 */
function _ofGenerarSiguienteId() {
  var max = 0;
  _ofEmpleados.forEach(function(e) {
    var id = (e.id_empleado || '').toString().toUpperCase();
    // Acepta patrones como EMP-001, EMP001, EM_OFIC01, cualquier cosa terminada en número
    var match = id.match(/(\d+)$/);
    if (match) {
      var num = parseInt(match[1], 10);
      if (num > max) max = num;
    }
  });
  var siguiente = max + 1;
  return 'EMP-' + (siguiente < 10 ? '00' : siguiente < 100 ? '0' : '') + siguiente;
}

/* Edición inline */
function _ofAbrirEdicion(id) {
  document.querySelectorAll('[id^="emp-edit-row-"]').forEach(function(r) { r.classList.add('hidden'); });
  var row = document.getElementById('emp-edit-row-' + id);
  if (row) row.classList.remove('hidden');
}

function _ofCerrarEdicion(id) {
  var row = document.getElementById('emp-edit-row-' + id);
  if (row) row.classList.add('hidden');
}

function _ofGuardarEdicion(id) {
  var btnEl = document.getElementById('ed-save-'     + id);
  var txtEl = document.getElementById('ed-save-txt-' + id);
  var canEl = document.getElementById('ed-cancel-'   + id);
  var errEl = document.getElementById('ed-error-'    + id);
  if (errEl) errEl.classList.add('hidden');

  var emp = {
    id_empleado:    id,
    fecha_ingreso:  _ofVal('ed-ingreso-'  + id),
    personal:       _ofVal('ed-nombre-'   + id),
    cedula:         _ofVal('ed-cedula-'   + id),
    cargo:          _ofVal('ed-cargo-'    + id),
    sueldo_mensual: _ofVal('ed-sueldo-'   + id),
    banco:          _ofVal('ed-banco-'    + id),
    n_cuenta:       _ofVal('ed-cuenta-'   + id),
    telefono:       _ofVal('ed-telefono-' + id),
    documento_url:  _ofVal('ed-docurl-'   + id)
  };

  if (!emp.personal || !emp.cedula || !emp.sueldo_mensual) {
    if (errEl) { errEl.textContent = 'Nombre, cédula y sueldo son obligatorios.'; errEl.classList.remove('hidden'); }
    return;
  }

  if (btnEl) { btnEl.disabled = true; }
  if (canEl) { canEl.disabled = true; }
  if (txtEl) { txtEl.textContent = 'Guardando...'; }
  _ofMostrarCarga('Guardando cambios del empleado');

  OficinaNominaService.editarEmpleado(id, emp)
    .then(function() { return _ofCargarBase(); })
    .then(function() { _ofRenderEmpleados(); })
    .catch(function(err) {
      if (errEl) { errEl.textContent = err.message; errEl.classList.remove('hidden'); }
      else { alert('Error: ' + err.message); }
      if (btnEl) { btnEl.disabled = false; }
      if (canEl) { canEl.disabled = false; }
      if (txtEl) { txtEl.textContent = 'Guardar cambios'; }
    })
    .finally(function() { _ofOcultarCarga(); });
}

/* Desactivar / Reactivar / Eliminar */
function _ofDesactivarEmpleado(id) {
  if (!confirm('¿Desactivar este empleado? No aparecerá en nuevas nóminas pero su historial se conserva.')) return;
  var btn = document.getElementById('btn-desact-' + id);
  if (btn) { btn.disabled = true; btn.textContent = '...'; }
  _ofMostrarCarga('Actualizando empleado');

  OficinaNominaService.desactivarEmpleado(id)
    .then(function() { return _ofCargarBase(); })
    .then(function() { _ofRenderEmpleados(); })
    .catch(function(err) {
      alert('Error: ' + err.message);
      if (btn) { btn.disabled = false; btn.textContent = 'Desactivar'; }
    })
    .finally(function() { _ofOcultarCarga(); });
}

function _ofReactivarEmpleado(id) {
  if (!confirm('¿Reactivar este empleado?')) return;
  var btn = document.getElementById('btn-react-' + id);
  if (btn) { btn.disabled = true; btn.textContent = '...'; }
  _ofMostrarCarga('Reactivando empleado');

  OficinaNominaService.reactivarEmpleado(id)
    .then(function() { return _ofCargarBase(); })
    .then(function() { _ofRenderEmpleados(); })
    .catch(function(err) {
      alert('Error: ' + err.message);
      if (btn) { btn.disabled = false; btn.textContent = 'Reactivar'; }
    })
    .finally(function() { _ofOcultarCarga(); });
}

function _ofEliminarEmpleado(id) {
  var nombre = '';
  var emp = _ofEmpleados.find(function(e) { return e.id_empleado === id; });
  if (emp) nombre = emp.personal;

  if (!confirm(
    '¿Eliminar permanentemente a ' + (nombre || id) + '?\n\n' +
    'Solo es posible si no tiene pagos generados.\n' +
    'También se eliminarán sus novedades.\n\n' +
    'Esta acción NO se puede deshacer.'
  )) return;

  var btn = document.getElementById('btn-del-' + id);
  if (btn) { btn.disabled = true; btn.textContent = '...'; }
  _ofMostrarCarga('Eliminando empleado');

  OficinaNominaService.eliminarEmpleado(id)
    .then(function() { return _ofCargarBase(); })
    .then(function() { _ofRenderEmpleados(); })
    .catch(function(err) {
      alert('Error: ' + err.message);
      if (btn) { btn.disabled = false; btn.textContent = 'Eliminar'; }
    })
    .finally(function() { _ofOcultarCarga(); });
}

/* ════════════════════════════════════════════════════════════
   NOVEDADES
════════════════════════════════════════════════════════════ */

function _ofRenderNovedades() {
  var panel = document.getElementById('of-panel');
  if (!panel) return;

  var empleadosActivos = _ofEmpleados.filter(function(e) { return _ofActivo(e); });

  var listaEmpleados = empleadosActivos.length
    ? empleadosActivos.map(function(e) {
        var id = 'chk-nov-' + _esc(e.id_empleado);
        return '<label class="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors" for="' + id + '">' +
          '<input type="checkbox" id="' + id + '" value="' + _esc(e.id_empleado) + '" data-nombre="' + _esc(e.personal) + '"' +
            ' onchange="_ofActContadorNov()"' +
            ' class="w-4 h-4 rounded border-slate-300 cursor-pointer flex-shrink-0">' +
          '<div class="flex-1 min-w-0">' +
            '<p class="text-sm font-medium text-slate-700 truncate">' + _esc(e.personal) + '</p>' +
            '<p class="text-xs text-slate-400">' + _esc(e.cargo) + '</p>' +
          '</div>' +
        '</label>';
      }).join('')
    : '<div class="px-4 py-4 text-sm text-slate-400 text-center">Sin empleados activos.</div>';

  var periodoAbierto = _ofPeriodos.filter(function(p) { return p.estado === 'abierto'; })[0] || null;
  var optsPer = periodoAbierto
    ? '<option value="' + _esc(periodoAbierto.id_periodo) + '" selected>' + _esc(periodoAbierto.nombre) + '</option>'
    : '<option value="" disabled selected>No hay período abierto</option>';

  var filas = _ofNovedades.slice().reverse().slice(0, 100).map(function(n) {
    return '<tr class="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">' +
      '<td class="px-3 py-2 text-xs">' + _esc(n.fecha) + '</td>' +
      '<td class="px-3 py-2 text-xs font-medium">' + _esc(_ofNombreEmp(n.id_empleado)) + '</td>' +
      '<td class="px-3 py-2 text-center">' + _ofBadgeTipo(n.tipo) + '</td>' +
      '<td class="px-3 py-2 text-xs text-right font-semibold">' + (n.monto && n.monto !== '0' ? OficinaNominaService.formatMoney(n.monto) : '—') + '</td>' +
      '<td class="px-3 py-2 text-xs text-slate-400 max-w-xs truncate">' + _esc(n.observacion) + '</td>' +
      '<td class="px-3 py-2 text-right">' +
        '<button id="btn-nov-' + _esc(n.id_novedad) + '" onclick="_ofAnularNovedad(\'' + _esc(n.id_novedad) + '\')" ' +
          'class="text-xs text-red-400 hover:text-red-600 font-semibold">Anular</button>' +
      '</td>' +
    '</tr>';
  }).join('');

  panel.innerHTML =
    '<div class="bg-white rounded-2xl shadow-soft p-5 mb-4">' +
      '<h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Registrar novedad</h4>' +

      // Selección de empleados (checkboxes)
      '<p class="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">' +
        'Empleados *' +
        '<span id="nov-count" class="ml-2 text-[10px] font-semibold text-verde-oscuro normal-case">0 seleccionados</span>' +
      '</p>' +
      '<div class="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto mb-2">' + listaEmpleados + '</div>' +
      '<div class="flex gap-3 mb-4">' +
        '<button onclick="_ofSelTodosNov()" class="text-xs text-verde-oscuro hover:underline font-semibold">Seleccionar todos</button>' +
        '<span class="text-slate-200">|</span>' +
        '<button onclick="_ofDeselTodosNov()" class="text-xs text-slate-400 hover:underline font-semibold">Limpiar</button>' +
      '</div>' +

      // Datos de la novedad (compartidos para todos los seleccionados)
      '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">' +
        _ofCampo('nov-fecha', 'Fecha *',    'text',   'dd/MM/yyyy') +
        '<div><label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Tipo *</label>' +
          '<select id="nov-tipo" class="' + _ofClsSelect + '">' +
          '<option>Adicional</option><option>Festivo</option><option>Prestamo</option>' +
          '<option>Penalizacion</option><option>Inasistencia</option>' +
          '</select></div>' +
        _ofCampo('nov-monto', 'Monto USD',  'number', '0') +
        '<div><label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Período</label>' +
          '<select id="nov-periodo" class="' + _ofClsSelect + '" ' + (periodoAbierto ? '' : 'disabled') + '>' + optsPer + '</select></div>' +
        _ofCampo('nov-obs',  'Observación', 'text',   '') +
      '</div>' +

      '<div id="nov-error" class="hidden mb-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700"></div>' +
      '<div id="nov-ok"    class="hidden mb-3 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-semibold"></div>' +
      '<div class="flex justify-end">' +
        '<button id="nov-btn" onclick="_ofGuardarNovedad()" ' +
          'class="btn-primario text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-verde-oscuro active:scale-95 transition-all">' +
          '<span id="nov-btn-txt">Guardar novedad</span>' +
        '</button>' +
      '</div>' +
    '</div>' +

    '<div class="bg-white rounded-2xl shadow-soft overflow-hidden">' +
      '<div class="px-5 py-3 border-b border-slate-100">' +
        '<h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Novedades recientes</h4>' +
      '</div>' +
      '<div class="overflow-x-auto">' +
        '<table class="w-full">' +
          '<thead><tr class="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400 border-b border-slate-200">' +
            '<th class="px-3 py-2 text-left">Fecha</th><th class="px-3 py-2 text-left">Empleado</th>' +
            '<th class="px-3 py-2 text-center">Tipo</th><th class="px-3 py-2 text-right">Monto</th>' +
            '<th class="px-3 py-2 text-left">Observación</th><th class="px-3 py-2"></th>' +
          '</tr></thead>' +
          '<tbody>' + (filas || '<tr><td colspan="6" class="px-3 py-6 text-center text-slate-400 text-sm">Sin novedades</td></tr>') + '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';
}

function _ofActContadorNov() {
  var n  = document.querySelectorAll('[id^="chk-nov-"]:checked').length;
  var el = document.getElementById('nov-count');
  if (el) el.textContent = n + ' seleccionado' + (n !== 1 ? 's' : '');
}

function _ofSelTodosNov() {
  document.querySelectorAll('[id^="chk-nov-"]').forEach(function(c) { c.checked = true; });
  _ofActContadorNov();
}

function _ofDeselTodosNov() {
  document.querySelectorAll('[id^="chk-nov-"]').forEach(function(c) { c.checked = false; });
  _ofActContadorNov();
}

function _ofGuardarNovedad() {
  var btnEl = document.getElementById('nov-btn');
  var txtEl = document.getElementById('nov-btn-txt');
  var errEl = document.getElementById('nov-error');
  var okEl  = document.getElementById('nov-ok');
  errEl.classList.add('hidden');
  okEl.classList.add('hidden');

  // Recoger empleados seleccionados
  var checks = document.querySelectorAll('[id^="chk-nov-"]:checked');
  if (checks.length === 0) {
    errEl.textContent = 'Selecciona al menos un empleado.';
    errEl.classList.remove('hidden');
    return;
  }

  var fecha  = _ofVal('nov-fecha');
  var tipo   = _ofVal('nov-tipo');
  var monto  = _ofVal('nov-monto');
  var idPer  = _ofVal('nov-periodo');
  var obs    = _ofVal('nov-obs');

  if (!idPer) {
    var periodoAbierto = _ofPeriodos.filter(function(p) { return p.estado === 'abierto'; })[0] || null;
    if (!periodoAbierto) {
      errEl.textContent = 'Debe existir un período abierto para registrar novedades.';
      errEl.classList.remove('hidden');
      return;
    }
    idPer = periodoAbierto.id_periodo;
  }

  if (!fecha || !tipo) {
    errEl.textContent = 'Completa fecha y tipo.';
    errEl.classList.remove('hidden');
    return;
  }

  var periodoSeleccionado = _ofPeriodos.find(function(p) { return p.id_periodo === idPer; });
  var fechaNovedad = _ofParseFecha(fecha);
  var inicioPeriodo = periodoSeleccionado && _ofParseFecha(periodoSeleccionado.fecha_inicio);
  var finPeriodo = periodoSeleccionado && _ofParseFecha(periodoSeleccionado.fecha_fin);
  if (!fechaNovedad) {
    errEl.textContent = 'La fecha debe tener el formato dd/MM/yyyy.';
    errEl.classList.remove('hidden');
    return;
  }
  if (!periodoSeleccionado || !inicioPeriodo || !finPeriodo || fechaNovedad < inicioPeriodo || fechaNovedad > finPeriodo) {
    errEl.textContent = periodoSeleccionado
      ? 'La fecha debe estar entre ' + periodoSeleccionado.fecha_inicio + ' y ' + periodoSeleccionado.fecha_fin + '.'
      : 'No se encontró el período seleccionado. Actualiza la información e inténtalo nuevamente.';
    errEl.classList.remove('hidden');
    return;
  }

  var empleadosSeleccionados = [];
  checks.forEach(function(c) {
    empleadosSeleccionados.push({ id: c.value, nombre: c.getAttribute('data-nombre') });
  });

  btnEl.disabled = true;
  txtEl.textContent = 'Guardando ' + empleadosSeleccionados.length + '...';
  _ofMostrarCarga('Registrando novedades');

  // Generar ID único por empleado: timestamp + índice
  var base = Date.now();
  var promesas = empleadosSeleccionados.map(function(emp, i) {
    return OficinaNominaService.crearNovedad({
      id_novedad:  'NOV-' + base + '-' + i,
      id_empleado: emp.id,
      fecha:       fecha,
      tipo:        tipo,
      monto:       monto || '0',
      id_periodo:  idPer,
      observacion: obs
    }).then(function() { return { ok: true, nombre: emp.nombre }; })
      .catch(function(e) { return { ok: false, nombre: emp.nombre, error: e.message }; });
  });

  Promise.all(promesas)
    .then(function(res) {
      var ok  = res.filter(function(r) { return r.ok; });
      var err = res.filter(function(r) { return !r.ok; });

      if (ok.length) {
        okEl.textContent = '✓ ' + ok.length + ' novedad' + (ok.length !== 1 ? 'es' : '') + ' registrada' + (ok.length !== 1 ? 's' : '') + '.';
        okEl.classList.remove('hidden');
      }
      if (err.length) {
        errEl.textContent = err.map(function(r) { return r.nombre + ': ' + r.error; }).join(' | ');
        errEl.classList.remove('hidden');
      }

      return _ofCargarBase();
    })
    .then(function() {
      // Refrescar solo la tabla sin redibujar el formulario
      _ofActualizarTablaNovedades();
    })
    .catch(function(err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    })
    .finally(function() {
      btnEl.disabled = false;
      txtEl.textContent = 'Guardar novedad';
      _ofOcultarCarga();
    });
}

function _ofActualizarTablaNovedades() {
  // Solo actualiza el tbody sin redibujar el formulario completo
  var tbody = document.querySelector('#of-panel table tbody');
  if (!tbody) return;
  var filas = _ofNovedades.slice().reverse().slice(0, 100).map(function(n) {
    return '<tr class="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">' +
      '<td class="px-3 py-2 text-xs">' + _esc(n.fecha) + '</td>' +
      '<td class="px-3 py-2 text-xs font-medium">' + _esc(_ofNombreEmp(n.id_empleado)) + '</td>' +
      '<td class="px-3 py-2 text-center">' + _ofBadgeTipo(n.tipo) + '</td>' +
      '<td class="px-3 py-2 text-xs text-right font-semibold">' + (n.monto && n.monto !== '0' ? OficinaNominaService.formatMoney(n.monto) : '—') + '</td>' +
      '<td class="px-3 py-2 text-xs text-slate-400 max-w-xs truncate">' + _esc(n.observacion) + '</td>' +
      '<td class="px-3 py-2 text-right">' +
        '<button id="btn-nov-' + _esc(n.id_novedad) + '" onclick="_ofAnularNovedad(\'' + _esc(n.id_novedad) + '\')" ' +
          'class="text-xs text-red-400 hover:text-red-600 font-semibold">Anular</button>' +
      '</td>' +
    '</tr>';
  }).join('');
  tbody.innerHTML = filas || '<tr><td colspan="6" class="px-3 py-6 text-center text-slate-400 text-sm">Sin novedades</td></tr>';
}

function _ofAnularNovedad(id) {
  if (!confirm('¿Anular esta novedad? No se eliminará físicamente pero quedará inactiva.')) return;
  var btn = document.getElementById('btn-nov-' + id);
  if (btn) { btn.disabled = true; btn.textContent = '...'; }
  _ofMostrarCarga('Anulando novedad');

  OficinaNominaService.eliminarNovedad(id)
    .then(function() { return _ofCargarBase(); })
    .then(function() { _ofRenderNovedades(); })
    .catch(function(err) {
      alert('Error: ' + err.message);
      if (btn) { btn.disabled = false; btn.textContent = 'Anular'; }
    })
    .finally(function() { _ofOcultarCarga(); });
}

/* ════════════════════════════════════════════════════════════
   PERÍODOS
════════════════════════════════════════════════════════════ */

function _ofGenerarIdPeriodo() {
  var ts = Date.now().toString(36).toUpperCase();
  return 'PER-' + ts;
}

function _ofRenderPeriodos() {
  var panel = document.getElementById('of-panel');
  if (!panel) return;

  var idAuto = _ofGenerarIdPeriodo();

  var COLORES = {
    abierto: 'bg-emerald-100 text-emerald-700', calculado: 'bg-blue-100 text-blue-700',
    cerrado: 'bg-slate-100 text-slate-500',      pagado:    'bg-purple-100 text-purple-700',
    anulado: 'bg-red-100 text-red-400'
  };

  var filas = _ofPeriodos.slice().reverse().map(function(p) {
    var cls    = COLORES[p.estado] || 'bg-slate-100 text-slate-400';
    var idSafe = _esc(p.id_periodo);
    var historialLink = '<button onclick="_ofTab = \'pagos\'; _ofActualizarTabs(); _ofRenderPagos();" class="text-[10px] font-semibold text-slate-500 hover:text-verde-oscuro underline mr-2">Ver pagos</button>';

    return '<tr class="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">' +
      '<td class="px-3 py-2.5 text-xs font-semibold text-slate-500">' + _esc(p.id_periodo || '—') + '</td>' +
      '<td class="px-3 py-2.5 text-sm font-medium text-verde-oscuro">' + _esc(p.nombre) + '</td>' +
      '<td class="px-3 py-2.5 text-xs text-slate-500">' + _esc(p.fecha_inicio) + '</td>' +
      '<td class="px-3 py-2.5 text-xs text-slate-500">' + _esc(p.fecha_fin) + '</td>' +
      '<td class="px-3 py-2.5 text-xs text-slate-400">' + _esc(p.fecha_pago) + '</td>' +
      '<td class="px-3 py-2.5 text-center">' +
        '<span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ' + cls + '">' + _esc(p.estado) + '</span>' +
      '</td>' +
      '<td class="px-3 py-2.5 text-right whitespace-nowrap">' +
        historialLink +
        (p.estado === 'abierto' || p.estado === 'calculado'
          ? '<button id="btn-cerrar-' + idSafe + '" onclick="_ofCerrarPeriodo(\'' + idSafe + '\')" ' +
              'class="text-xs text-amber-600 hover:text-amber-800 font-semibold mr-2">Cerrar</button>'
          : '') +
        (p.estado === 'cerrado'
          ? '<button id="btn-reabrir-' + idSafe + '" onclick="_ofReabrirPeriodo(\'' + idSafe + '\')" ' +
              'class="text-xs text-slate-500 hover:text-verde-oscuro font-semibold">Reabrir</button>'
          : '') +
      '</td>' +
    '</tr>';
  }).join('');

  panel.innerHTML =
    '<div class="bg-white rounded-2xl shadow-soft p-5 mb-4">' +
      '<h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Nuevo período</h4>' +
      '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">' +
        '<div>' +
          '<label for="per-id" class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">ID Período</label>' +
          '<input type="text" id="per-id" value="' + _esc(idAuto) + '" readonly ' +
            'class="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-100 text-slate-600 focus:outline-none focus:border-verde-oscuro focus:ring-2 focus:ring-verde-oscuro/10 transition-all">' +
        '</div>' +
        _ofCampo('per-nombre', 'Nombre *', 'text', '') +
        _ofCampo('per-ini',    'Fecha inicio *', 'text', 'dd/MM/yyyy') +
        _ofCampo('per-fin',    'Fecha fin *', 'text', 'dd/MM/yyyy') +
        _ofCampo('per-pago',   'Fecha de pago', 'text', 'dd/MM/yyyy') +
        _ofCampo('per-obs',    'Observación', 'text', '') +
      '</div>' +
      '<div id="per-error" class="hidden mb-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700"></div>' +
      '<div class="flex justify-end">' +
        '<button id="per-btn" onclick="_ofGuardarPeriodo()" ' +
          'class="btn-primario text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-verde-oscuro active:scale-95 transition-all">' +
          '<span id="per-btn-txt">Crear período</span>' +
        '</button>' +
      '</div>' +
    '</div>' +
    '<div class="bg-white rounded-2xl shadow-soft overflow-hidden">' +
      '<div class="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3">' +
        '<h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Períodos (' + _ofPeriodos.length + ')</h4>' +
        '<span class="text-[10px] text-slate-400">El período se cierra al generarse el pago.</span>' +
      '</div>' +
      '<div class="overflow-x-auto">' +
        '<table class="w-full">' +
          '<thead><tr class="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400 border-b border-slate-200">' +
            '<th class="px-3 py-2 text-left">ID</th><th class="px-3 py-2 text-left">Nombre</th><th class="px-3 py-2 text-left">Inicio</th>' +
            '<th class="px-3 py-2 text-left">Fin</th><th class="px-3 py-2 text-left">F. Pago</th>' +
            '<th class="px-3 py-2 text-center">Estado</th><th class="px-3 py-2"></th>' +
          '</tr></thead>' +
          '<tbody>' + (filas || '<tr><td colspan="7" class="px-3 py-6 text-center text-slate-400 text-sm">Sin períodos</td></tr>') + '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';
}

function _ofRenderPagos() {
  var panel = document.getElementById('of-panel');
  if (!panel) return;

  var pagos = _ofPagos.slice().reverse();

  var filas = pagos.map(function(p) {
    var emp = _ofEmpleados.find(function(e) { return e.id_empleado === p.id_empleado; }) || {};
    var neto = parseFloat(p.neto_pagar || p.netoAPagar || p.neto_apagar || 0) || 0;
    var estado = (p.estado || 'pagado').toString().trim();
    var badge = estado === 'anulado'
      ? 'bg-red-100 text-red-600'
      : 'bg-emerald-100 text-emerald-700';

    return '<tr class="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">' +
      '<td class="px-3 py-2.5 text-xs text-slate-700">' + _esc(emp.personal || p.id_empleado || '—') + '</td>' +
      '<td class="px-3 py-2.5 text-xs text-slate-500">' + _esc(p.id_periodo || '—') + '</td>' +
      '<td class="px-3 py-2.5 text-xs text-slate-500">' + _esc(p.fecha_pago || p.fecha_generacion || '—') + '</td>' +
      '<td class="px-3 py-2.5 text-xs text-right font-semibold text-slate-700">' + OficinaNominaService.formatMoney(neto) + '</td>' +
      '<td class="px-3 py-2.5 text-center">' +
        '<span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ' + badge + '">' + _esc(estado === 'generado' ? 'Pagado' : (estado === 'anulado' ? 'Anulado' : estado)) + '</span>' +
      '</td>' +
    '</tr>';
  }).join('');

  panel.innerHTML =
    '<div class="bg-white rounded-2xl shadow-soft p-5 mb-4">' +
      '<div class="flex items-center justify-between gap-3 mb-3">' +
        '<div>' +
          '<h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Historial de pagos</h4>' +
          '<p class="text-xs text-slate-400 mt-1">Cada pago queda registrado como una fila histórica; el detalle diario se guarda aparte para auditoría y respaldo.</p>' +
        '</div>' +
      '</div>' +
      '<div class="overflow-x-auto">' +
        '<table class="w-full">' +
          '<thead><tr class="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400 border-b border-slate-200">' +
            '<th class="px-3 py-2 text-left">Empleado</th><th class="px-3 py-2 text-left">Período</th>' +
            '<th class="px-3 py-2 text-left">Fecha pago</th><th class="px-3 py-2 text-right">Neto</th><th class="px-3 py-2 text-center">Estado</th>' +
          '</tr></thead>' +
          '<tbody>' + (filas || '<tr><td colspan="5" class="px-3 py-6 text-center text-slate-400 text-sm">Sin pagos registrados aún</td></tr>') + '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';
}

function _ofGuardarPeriodo() {
  var btnEl = document.getElementById('per-btn');
  var txtEl = document.getElementById('per-btn-txt');
  var errEl = document.getElementById('per-error');
  errEl.classList.add('hidden');

  var per = {
    id_periodo:   _ofVal('per-id') || _ofGenerarIdPeriodo(),
    nombre:       _ofVal('per-nombre'),
    fecha_inicio: _ofVal('per-ini'),
    fecha_fin:    _ofVal('per-fin'),
    fecha_pago:   _ofVal('per-pago'),
    observacion:  _ofVal('per-obs')
  };

  if (!per.nombre || !per.fecha_inicio || !per.fecha_fin) {
    errEl.textContent = 'Completa nombre, fecha inicio y fecha fin.';
    errEl.classList.remove('hidden');
    return;
  }

  btnEl.disabled = true;
  txtEl.textContent = 'Guardando...';
  _ofMostrarCarga('Creando período');

  OficinaNominaService.crearPeriodo(per)
    .then(function() { return _ofCargarBase(); })
    .then(function() { _ofRenderPeriodos(); })
    .catch(function(err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
      btnEl.disabled = false;
      txtEl.textContent = 'Crear período';
    })
    .finally(function() { _ofOcultarCarga(); });
}

function _ofCerrarPeriodo(id) {
  if (!confirm('¿Cerrar el período? Las novedades no podrán modificarse después.')) return;
  var btn = document.getElementById('btn-cerrar-' + id);
  if (btn) { btn.disabled = true; btn.textContent = '...'; }
  _ofMostrarCarga('Cerrando período');

  OficinaNominaService.cerrarPeriodo(id)
    .then(function() { return _ofCargarBase(); })
    .then(function() { _ofRenderPeriodos(); })
    .catch(function(err) {
      alert('Error: ' + err.message);
      if (btn) { btn.disabled = false; btn.textContent = 'Cerrar'; }
    })
    .finally(function() { _ofOcultarCarga(); });
}

function _ofReabrirPeriodo(id) {
  if (!confirm('¿Reabrir el período? Esta acción queda auditada.')) return;
  var btn = document.getElementById('btn-reabrir-' + id);
  if (btn) { btn.disabled = true; btn.textContent = '...'; }
  _ofMostrarCarga('Reabriendo período');

  OficinaNominaService.reabrirPeriodo(id)
    .then(function() { return _ofCargarBase(); })
    .then(function() { _ofRenderPeriodos(); })
    .catch(function(err) {
      alert('Error: ' + err.message);
      if (btn) { btn.disabled = false; btn.textContent = 'Reabrir'; }
    })
    .finally(function() { _ofOcultarCarga(); });
}

/* ════════════════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════════════════ */

function _ofMostrarCarga(mensaje) {
  var overlay = document.getElementById('of-carga-overlay');
  var titulo = document.getElementById('of-carga-titulo');
  if (titulo) titulo.textContent = mensaje || 'Procesando';
  if (overlay) {
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
  }
}

function _ofOcultarCarga() {
  var overlay = document.getElementById('of-carga-overlay');
  if (overlay) {
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
  }
}

var _ofClsSelect = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 ' +
  'focus:outline-none focus:border-verde-oscuro focus:ring-2 focus:ring-verde-oscuro/10 focus:bg-white transition-all';

function _esc(val) {
  return String(val == null ? '' : val).replace(/[&<>"']/g, function(c) {
    return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c];
  });
}

function _ofVal(id) {
  var el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function _ofParseFecha(value) {
  var match = String(value || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return match ? new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1])) : null;
}

/* Activo acepta string "TRUE"/"true" o boolean true */
function _ofActivo(e) {
  var v = e.activo;
  return v === true || v === 'TRUE' || v === 'true';
}

function _ofCampo(id, label, tipo, placeholder) {
  return '<div>' +
    '<label for="' + id + '" class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">' + label + '</label>' +
    '<input type="' + tipo + '" id="' + id + '"' + (placeholder ? ' placeholder="' + placeholder + '"' : '') +
      ' class="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:border-verde-oscuro focus:ring-2 focus:ring-verde-oscuro/10 focus:bg-white transition-all">' +
  '</div>';
}

function _ofCampoVal(id, label, tipo, valor) {
  return '<div>' +
    '<label for="' + id + '" class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">' + label + '</label>' +
    '<input type="' + tipo + '" id="' + id + '" value="' + _esc(valor) + '"' +
      ' class="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-verde-oscuro focus:ring-2 focus:ring-verde-oscuro/10 transition-all">' +
  '</div>';
}

function _ofMetrica(label, valor) {
  return '<div class="bg-slate-50 rounded-xl p-3">' +
    '<div class="text-[10px] uppercase text-slate-400 font-semibold">' + label + '</div>' +
    '<div class="font-bold text-verde-oscuro mt-1 text-sm">' + valor + '</div>' +
  '</div>';
}

function _ofAlerta(tipo, msg) {
  var cls = tipo === 'rojo'
    ? 'bg-red-50 border border-red-200 text-red-700'
    : 'bg-amber-50 border border-amber-200 text-amber-700';
  return '<div class="' + cls + ' rounded-xl px-4 py-3 text-sm font-medium">' + _esc(msg) + '</div>';
}

function _ofBadgeTipo(tipo) {
  var mapa = {
    'Adicional':    'bg-emerald-100 text-emerald-700',
    'Festivo':      'bg-blue-100 text-blue-700',
    'Prestamo':     'bg-amber-100 text-amber-700',
    'Penalizacion': 'bg-red-100 text-red-600',
    'Inasistencia': 'bg-slate-100 text-slate-500'
  };
  return '<span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ' +
    (mapa[tipo] || 'bg-slate-100 text-slate-400') + '">' + _esc(tipo) + '</span>';
}

function _ofNombreEmp(id) {
  var emp = _ofEmpleados.find(function(e) { return e.id_empleado === id; });
  return emp ? emp.personal : id;
}

function _ofMostrarError(panelId, msg) {
  var el = document.getElementById(panelId);
  if (el) el.innerHTML = _ofAlerta('rojo', msg);
}
