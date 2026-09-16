function renderContabilidadDiaria() {
  var contenedor = document.getElementById('admin-content');
  if (!contenedor) return;

  contenedor.innerHTML = [
    '<div class="fade-in p-5">',
      '<div class="bg-white rounded-2xl shadow-soft border border-slate-200 p-5 mb-5">',
        '<div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">',
          '<div>',
            '<h3 class="text-verde-oscuro font-bold text-lg">Contabilidad diaria cerrada</h3>',
            '<p class="text-slate-500 text-sm mt-1">Selecciona la fecha de la jornada cerrada por el coordinador para revisar y validar el cierre.</p>',
          '</div>',
          '<div class="flex flex-col sm:flex-row gap-2 items-end">',
            '<div>',
              '<label class="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Fecha disponible</label>',
              '<select id="contabilidad-admin-fecha" class="w-full sm:w-56 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-slate-50 focus:outline-none focus:border-verde-oscuro focus:ring-2 focus:ring-verde-oscuro/10 focus:bg-white transition-all"></select>',
            '</div>',
            '<button type="button" onclick="cargarContabilidadAdminSeleccionada()" class="btn-primario hover:bg-verde-oscuro active:scale-95 transition-all text-white font-semibold text-sm px-4 py-2.5 rounded-lg">Cargar</button>',
            '<button type="button" onclick="validarContabilidadAdminSeleccionada()" class="bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all text-white font-semibold text-sm px-4 py-2.5 rounded-lg">Validar cierre</button>',
          '</div>',
        '</div>',
      '</div>',

      '<div id="contabilidad-admin-loading" class="hidden bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600 mb-4">Cargando contabilidades disponibles...</div>',
      '<div id="contabilidad-admin-error" class="hidden bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-4"></div>',
      '<div id="contabilidad-admin-detalle" class="hidden bg-white rounded-2xl shadow-soft border border-slate-200 p-5"></div>',
    '</div>'
  ].join('');

  cargarContabilidadesDisponiblesAdmin();
}

function mostrarErrorContabilidadAdmin(mensaje) {
  var errorBox = document.getElementById('contabilidad-admin-error');
  if (errorBox) {
    errorBox.textContent = mensaje || 'No se pudo cargar la contabilidad.';
    errorBox.classList.remove('hidden');
  }
}

function ocultarErrorContabilidadAdmin() {
  var errorBox = document.getElementById('contabilidad-admin-error');
  if (errorBox) {
    errorBox.classList.add('hidden');
    errorBox.textContent = '';
  }
}

function setLoadingContabilidadAdmin(mostrar, texto) {
  var loading = document.getElementById('contabilidad-admin-loading');
  if (!loading) return;
  loading.textContent = texto || 'Cargando contabilidades disponibles...';
  if (mostrar) {
    loading.classList.remove('hidden');
  } else {
    loading.classList.add('hidden');
  }
}

async function cargarContabilidadesDisponiblesAdmin() {
  setLoadingContabilidadAdmin(true, 'Buscando jornadas cerradas...');
  ocultarErrorContabilidadAdmin();

  try {
    var fechas = [];
    if (window.ContabilidadDiariaService && typeof window.ContabilidadDiariaService.loadRemoteDraftHistory === 'function') {
      var history = await window.ContabilidadDiariaService.loadRemoteDraftHistory();
      fechas = (history || []).map(function (item) {
        var valor = item && (item.fecha || item.FECHA) ? String(item.fecha || item.FECHA) : '';
        return valor ? valor.slice(0, 10) : '';
      }).filter(Boolean).sort(function (a, b) { return new Date(b) - new Date(a); });
    }

    if (!fechas.length && window.ContabilidadDiariaService && typeof window.ContabilidadDiariaService.getDraftHistory === 'function') {
      var localHistory = window.ContabilidadDiariaService.getDraftHistory();
      fechas = Object.keys(localHistory || {}).map(function (key) {
        return String(key).slice(0, 10);
      }).filter(Boolean).sort(function (a, b) { return new Date(b) - new Date(a); });
    }

    var select = document.getElementById('contabilidad-admin-fecha');
    if (!select) return;

    if (!fechas.length) {
      select.innerHTML = '<option value="">No hay contabilidades cerradas</option>';
      setLoadingContabilidadAdmin(false, 'No hay contabilidades cerradas.');
      return;
    }

    var unicas = Array.from(new Set(fechas));
    select.innerHTML = '<option value="">Selecciona una fecha</option>' + unicas.map(function (fecha) {
      return '<option value="' + fecha + '">' + fecha + '</option>';
    }).join('');

    setLoadingContabilidadAdmin(false, 'Jornadas cerradas cargadas.');
  } catch (error) {
    console.warn('[ContabilidadAdmin] Error cargando jornadas:', error);
    mostrarErrorContabilidadAdmin('No se pudieron cargar las contabilidades cerradas.');
    setLoadingContabilidadAdmin(false, 'Error al cargar');
  }
}

async function cargarContabilidadAdminSeleccionada() {
  var select = document.getElementById('contabilidad-admin-fecha');
  var fecha = select ? select.value : '';
  if (!fecha) {
    mostrarErrorContabilidadAdmin('Selecciona una fecha antes de cargar la contabilidad.');
    return;
  }

  ocultarErrorContabilidadAdmin();
  setLoadingContabilidadAdmin(true, 'Cargando contabilidad de ' + fecha + '...');

  try {
    var draft = null;
    if (window.ContabilidadDiariaService && typeof window.ContabilidadDiariaService.loadRemoteDraftByFecha === 'function') {
      draft = await window.ContabilidadDiariaService.loadRemoteDraftByFecha(fecha);
    }

    if (!draft && window.ContabilidadDiariaService && typeof window.ContabilidadDiariaService.loadDraft === 'function') {
      draft = window.ContabilidadDiariaService.loadDraft(fecha);
    }

    if (!draft) {
      throw new Error('No existe la contabilidad para esa fecha.');
    }

    window.__CONTABILIDAD_ADMIN_SELECCIONADA = draft;
    renderDetalleContabilidadAdmin(draft);
    setLoadingContabilidadAdmin(false, 'Contabilidad cargada.');
  } catch (error) {
    console.warn('[ContabilidadAdmin] Error al cargar contabilidad:', error);
    mostrarErrorContabilidadAdmin(error && error.message ? error.message : 'No se pudo cargar la contabilidad seleccionada.');
    setLoadingContabilidadAdmin(false, 'Error al cargar');
  }
}

function renderDetalleContabilidadAdmin(draft) {
  var detalle = document.getElementById('contabilidad-admin-detalle');
  if (!detalle) return;

  var totales = draft && draft.totales ? draft.totales : {};
  var ingresos = Number(totales.totalIngresos || 0) || 0;
  var egresos = Number(totales.totalEgresos || 0) || 0;
  var deduccion = Number(totales.totalDeduccion || 0) || 0;
  var saldoInicial = Number(totales.saldoInicial || 0) || 0;
  var saldo = saldoInicial + ingresos - deduccion - egresos;
  var afiliaciones = Array.isArray(draft && draft.afiliaciones) ? draft.afiliaciones : [];
  var totalAfiliaciones = afiliaciones.reduce(function (total, fila) {
    return total + (Number(fila && (fila.aff || fila.afiliaciones)) || 0);
  }, 0);
  var gastos = draft && draft.gastos ? draft.gastos : {};
  var moneda = function (valor) { return '$' + Number(valor || 0).toLocaleString('es-VE', { maximumFractionDigits: 2 }); };
  var texto = function (valor) {
    return String(valor === undefined || valor === null || valor === '' ? '—' : valor)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };
  var filasAfiliaciones = afiliaciones.length ? afiliaciones.map(function (fila, index) {
    return '<tr class="border-t border-slate-100">' +
      '<td class="px-3 py-2 text-slate-500">' + (index + 1) + '</td>' +
      '<td class="px-3 py-2 font-medium text-slate-700">' + texto(fila.asesor || fila.promotor || fila.nombre) + '</td>' +
      '<td class="px-3 py-2 text-slate-600">' + texto(fila.rol) + '</td>' +
      '<td class="px-3 py-2 text-right">' + Number(fila.aff || 0) + '</td>' +
      '<td class="px-3 py-2 text-right">' + moneda(fila.recAbono) + '</td>' +
      '<td class="px-3 py-2 text-right">' + moneda(fila.recaudoNeto) + '</td>' +
      '<td class="px-3 py-2 text-right">' + moneda(fila.prestamo) + '</td>' +
      '</tr>';
  }).join('') : '<tr><td colspan="7" class="px-3 py-4 text-center text-slate-400">No hay afiliaciones registradas.</td></tr>';
  var detalleGastos = draft.detalle || gastos.detalle || {};
  var totalMovimiento = function (valor, movimiento) {
    if (Number(valor || 0)) return Number(valor || 0);
    if (!movimiento) return 0;
    var monto = Number(movimiento.monto || 0);
    var tasa = Number(movimiento.tasa || 0);
    return movimiento.moneda === 'BS' && tasa > 0 ? monto / tasa : monto;
  };
  var detalleTexto = function (valor) { return valor ? '<div class="text-xs text-slate-500 mt-1">Detalle: ' + texto(valor) + '</div>' : ''; };
  var lineaGasto = function (nombre, valor, detalle) {
    return '<div class="py-3 border-b border-slate-100 last:border-0"><div class="flex items-center justify-between gap-4"><span class="text-slate-700">' + texto(nombre) + '</span><strong class="text-slate-700">' + moneda(valor) + '</strong></div>' + detalleTexto(detalle) + '</div>';
  };
  var formatoMovimiento = function (nombre, valor, movimiento) {
    movimiento = movimiento || {};
    var origen = movimiento.monto !== undefined ? 'Monto original: ' + moneda(movimiento.monto) + ' ' + texto(movimiento.moneda || 'BS') : '';
    var tasa = Number(movimiento.tasa || 0) ? ' · Tasa: ' + texto(movimiento.tasa) : '';
    return lineaGasto(nombre, valor, origen + tasa);
  };
  var cenasGanadas = afiliaciones.filter(function (fila) { return Number(fila.cena || 0) > 0; }).map(function (fila) {
    return '<div class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"><span>' + texto(fila.asesor || fila.promotor || fila.nombre) + '</span><strong>' + moneda(fila.cena) + '</strong></div>';
  }).join('') || '<div class="text-xs text-slate-400">Ningún promotor registró cena ganada.</div>';
  var extra = Array.isArray(gastos.extra) ? gastos.extra : [];
  var extrasHtml = extra.map(function (item, index) {
    var monto = typeof item === 'object' ? item.monto : item;
    var descripcion = typeof item === 'object' ? item.detalle : '';
    return lineaGasto(descripcion || ('Gasto adicional ' + (index + 1)), monto, 'Concepto registrado por el coordinador');
  }).join('');

  detalle.innerHTML = [
    '<div class="flex flex-col gap-4">',
      '<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">',
        '<div class="bg-slate-50 border border-slate-200 rounded-xl p-3"><div class="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Fecha</div><div class="mt-2 font-bold text-slate-700">' + texto(draft && draft.fecha) + '</div></div>',
        '<div class="bg-slate-50 border border-slate-200 rounded-xl p-3"><div class="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Municipio</div><div class="mt-2 font-bold text-slate-700">' + texto(draft && draft.municipio) + '</div></div>',
        '<div class="bg-slate-50 border border-slate-200 rounded-xl p-3"><div class="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Coordinador</div><div class="mt-2 font-bold text-slate-700">' + texto(draft && draft.coordinador) + '</div></div>',
        '<div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3"><div class="text-[10px] uppercase tracking-wide text-emerald-700 font-bold">Estado</div><div class="mt-2 font-bold text-emerald-800">' + texto(draft && draft.estado ? draft.estado : 'borrador') + '</div></div>',
      '</div>',
      '<div class="grid grid-cols-1 md:grid-cols-4 gap-3">',
        '<div class="bg-white border border-slate-200 rounded-xl p-3"><div class="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Afiliaciones</div><div class="mt-2 font-bold text-slate-700">' + totalAfiliaciones + '</div></div>',
        '<div class="bg-white border border-slate-200 rounded-xl p-3"><div class="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Ingresos</div><div class="mt-2 font-bold text-slate-700">' + moneda(ingresos) + '</div></div>',
        '<div class="bg-white border border-slate-200 rounded-xl p-3"><div class="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Egresos</div><div class="mt-2 font-bold text-slate-700">' + moneda(egresos) + '</div></div>',
        '<div class="bg-white border border-slate-200 rounded-xl p-3"><div class="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Saldo final</div><div class="mt-2 font-bold text-slate-700">' + moneda(saldo) + '</div></div>',
      '</div>',
      '<div class="text-xs text-slate-500 border-t border-slate-200 pt-3">Saldo inicial: ' + moneda(saldoInicial) + ' · Deducción: ' + moneda(deduccion) + ' · La contabilidad ya fue cerrada por el coordinador y está lista para validación administrativa.</div>',
      '<section class="border border-slate-200 rounded-xl overflow-hidden">',
        '<div class="px-4 py-3 bg-slate-50 font-bold text-sm text-slate-700">Afiliaciones cargadas</div>',
        '<div class="overflow-x-auto"><table class="min-w-full text-xs"><thead class="bg-white text-left text-[10px] uppercase tracking-wide text-slate-500"><tr><th class="px-3 py-2">#</th><th class="px-3 py-2">Asesor</th><th class="px-3 py-2">Rol</th><th class="px-3 py-2 text-right">Afiliaciones</th><th class="px-3 py-2 text-right">Rec. abono</th><th class="px-3 py-2 text-right">Recaudo neto</th><th class="px-3 py-2 text-right">Préstamo</th></tr></thead><tbody>' + filasAfiliaciones + '</tbody></table></div>',
      '</section>',
      '<section class="border border-slate-200 rounded-xl p-4"><h4 class="font-bold text-sm text-slate-700 mb-2">Ingresos y movimientos</h4>' +
        formatoMovimiento('Giros / consignaciones', totalMovimiento(gastos.giros, detalleGastos.giros), detalleGastos.giros) +
        formatoMovimiento('Consignaciones / transferencias', totalMovimiento(gastos.consignaciones, detalleGastos.consignaciones), detalleGastos.consignaciones) +
        lineaGasto('Pago de abonos ganados', gastos.abonosGanados || 0) +
      '</section>',
      '<section class="border border-slate-200 rounded-xl p-4"><h4 class="font-bold text-sm text-slate-700 mb-2">Egresos y gastos operativos</h4>' +
        lineaGasto('Comida del coordinador', gastos.comidaCoor, detalleGastos.comidaCoordinador) +
        lineaGasto('Desayunos de brigada', gastos.desayunos, detalleGastos.desayunos) +
        lineaGasto('Almuerzos', gastos.almuerzos) +
        lineaGasto('Cenas / préstamos', gastos.cenasPrestadas) +
        lineaGasto('Hotel / hospedaje', gastos.hotel, detalleGastos.hotel ? ('Monto original: ' + moneda(detalleGastos.hotel.monto) + ' ' + texto(detalleGastos.hotel.moneda || 'BS') + (Number(detalleGastos.hotel.tasa || 0) ? ' · Tasa: ' + texto(detalleGastos.hotel.tasa) : '')) : '') +
        lineaGasto('Transporte urbano', gastos.transUrbano) +
        lineaGasto('Transporte vereda', gastos.transVereda) +
        lineaGasto('Gastos varios / recargas', gastos.varios, detalleGastos.varios) +
        extrasHtml +
      '</section>',
      '<section class="border border-slate-200 rounded-xl p-4"><h4 class="font-bold text-sm text-slate-700 mb-2">Cenas ganadas por promotor</h4>' + cenasGanadas + '</section>',
    '</div>'
  ].join('');

  detalle.classList.remove('hidden');
}

async function validarContabilidadAdminSeleccionada() {
  var select = document.getElementById('contabilidad-admin-fecha');
  var fecha = select ? select.value : '';
  if (!fecha) {
    mostrarErrorContabilidadAdmin('Primero selecciona una fecha para validar la contabilidad.');
    return;
  }

  var detalle = document.getElementById('contabilidad-admin-detalle');
  if (!detalle || detalle.classList.contains('hidden')) {
    cargarContabilidadAdminSeleccionada();
    return;
  }

  var text = detalle.textContent || '';
  if (!text || text.trim().length < 20) {
    mostrarErrorContabilidadAdmin('La contabilidad aún no se ha cargado.');
    return;
  }

  var draft = JSON.parse(JSON.stringify(window.__CONTABILIDAD_ADMIN_SELECCIONADA || {}));
  if (!draft || !draft.fecha) {
    mostrarErrorContabilidadAdmin('No existe una contabilidad válida seleccionada.');
    return;
  }

  draft.estado = 'validada';
  draft.actualizadoEn = new Date().toISOString();

  if (window.ContabilidadDiariaService && typeof window.ContabilidadDiariaService.saveDraft === 'function') {
    window.ContabilidadDiariaService.saveDraft(draft);
  }

  if (window.ContabilidadDiariaService && typeof window.ContabilidadDiariaService.syncDraft === 'function') {
    var syncResult = await window.ContabilidadDiariaService.syncDraft(draft);
    if (!syncResult || !syncResult.ok) {
      mostrarErrorContabilidadAdmin('La validación quedó guardada localmente, pero no pudo sincronizarse con Google Sheets.');
      return;
    }
  }

  localStorage.setItem('contabilidad_diaria_draft_v1', JSON.stringify(draft));
  window.__CONTABILIDAD_ADMIN_SELECCIONADA = draft;
  renderDetalleContabilidadAdmin(draft);
  alert('La contabilidad seleccionada fue validada correctamente por administración.');
}

window.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('admin-content')) {
    const existing = window.__CONTABILIDAD_ADMIN_SELECCIONADA;
    if (existing && existing.fecha) {
      renderDetalleContabilidadAdmin(existing);
    }
  }
});
