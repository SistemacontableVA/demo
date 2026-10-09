function renderContabilidadDiaria() {
  var contenedor = document.getElementById('admin-content');
  if (!contenedor) return;

  contenedor.innerHTML = [
    '<div class="fade-in contabilidad-admin-module">',
      '<section class="contabilidad-admin-toolbar">',
        '<div class="contabilidad-admin-heading">',
          '<div class="contabilidad-admin-mark" aria-hidden="true">CD</div>',
          '<div><span class="contabilidad-admin-eyebrow">CONTROL FINANCIERO</span><h2>Revisión de contabilidad</h2><p>Consulta los movimientos de la jornada y valida el cierre del coordinador.</p></div>',
        '</div>',
        '<div class="contabilidad-admin-controls">',
          '<label for="contabilidad-admin-fecha">Jornada disponible</label>',
          '<div class="contabilidad-admin-control-row">',
            '<select id="contabilidad-admin-fecha"></select>',
            '<button type="button" onclick="cargarContabilidadAdminSeleccionada()" class="contabilidad-admin-button contabilidad-admin-button-load">Ver reporte</button>',
            '<button id="btn-pdf-contabilidad-admin" type="button" disabled onclick="imprimirContabilidadAdminPDF()" class="contabilidad-admin-button contabilidad-admin-button-pdf">Imprimir / Guardar PDF</button>',
          '</div>',
        '</div>',
      '</section>',
      '<div id="contabilidad-admin-loading" class="hidden contabilidad-admin-feedback">Cargando contabilidades disponibles...</div>',
      '<div id="contabilidad-admin-error" class="hidden contabilidad-admin-error"></div>',
      '<div id="contabilidad-admin-detalle" class="hidden contabilidad-admin-detail"></div>',
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
    var history = await window.ContabilidadDiariaService.loadRemoteDraftHistory();
    var fechas = history.filter(function (item) {
      return item && (item.estado === 'cerrada' || item.estado === 'validada');
    }).map(function (item) {
      return item.fecha ? String(item.fecha).slice(0, 10) : '';
    }).filter(Boolean).sort(function (a, b) { return new Date(b) - new Date(a); });

    var select = document.getElementById('contabilidad-admin-fecha');
    if (!select) return;

    if (!fechas.length) {
      select.innerHTML = '<option value="">No hay jornadas cerradas</option>';
      setLoadingContabilidadAdmin(false, 'No hay jornadas cerradas.');
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
    var draft = await window.ContabilidadDiariaService.loadRemoteDraftByFecha(fecha);

    if (!draft) {
      throw new Error('No existe la contabilidad para esa fecha.');
    }

    window.__CONTABILIDAD_ADMIN_SELECCIONADA = draft;
    renderDetalleContabilidadAdmin(draft);
    setLoadingContabilidadAdmin(false, 'Contabilidad cargada.');
  } catch (error) {
    console.warn('[ContabilidadAdmin] Error al cargar contabilidad:', error);
    mostrarErrorContabilidadAdmin('No se pudo cargar la contabilidad seleccionada.');
    setLoadingContabilidadAdmin(false, 'Error al cargar');
  }
}

function renderDetalleContabilidadAdmin(draft) {
  var detalle = document.getElementById('contabilidad-admin-detalle');
  if (!detalle) return;
  var botonPdf = document.getElementById('btn-pdf-contabilidad-admin');
  if (botonPdf) botonPdf.disabled = !draft;

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
    return '<div class="contabilidad-report-ledger-row"><div><span>' + texto(nombre) + '</span>' + detalleTexto(detalle) + '</div><strong>' + moneda(valor) + '</strong></div>';
  };
  var formatoMovimiento = function (nombre, valor, movimiento) {
    movimiento = movimiento || {};
    var origen = movimiento.monto !== undefined ? 'Monto original: ' + moneda(movimiento.monto) + ' ' + texto(movimiento.moneda || 'BS') : '';
    var tasa = Number(movimiento.tasa || 0) ? ' · Tasa: ' + texto(movimiento.tasa) : '';
    return lineaGasto(nombre, valor, origen + tasa);
  };
  var cenasGanadas = afiliaciones.filter(function (fila) { return Number(fila.cena || 0) > 0; }).map(function (fila) {
    var cantidadAfiliaciones = Number(fila.aff || fila.afiliaciones) || 0;
    return '<div class="contabilidad-report-ledger-row"><div><span>' + texto(fila.asesor || fila.promotor || fila.nombre) + '</span><small class="contabilidad-report-affiliation-count">' + cantidadAfiliaciones.toLocaleString('es-VE') + ' afiliaciones</small></div><strong>' + moneda(fila.cena) + '</strong></div>';
  }).join('') || '<div class="text-xs text-slate-400">Ningún promotor registró cena ganada.</div>';
  var extra = Array.isArray(gastos.extra) ? gastos.extra : [];
  var extrasHtml = extra.map(function (item, index) {
    var monto = typeof item === 'object' ? item.monto : item;
    var descripcion = typeof item === 'object' ? item.detalle : '';
    return lineaGasto(descripcion || ('Gasto adicional ' + (index + 1)), monto, 'Concepto registrado por el coordinador');
  }).join('');
  var estadoActual = draft && draft.estado ? draft.estado : 'borrador';
  var etiquetaEstado = function (estado) {
    return estado.replace(/_/g, ' ').replace(/^\w/, function (letra) { return letra.toUpperCase(); });
  };
  var opcionesEstado = '<option value="' + texto(estadoActual) + '" selected>' + texto(etiquetaEstado(estadoActual)) + '</option>';
  if (estadoActual === 'cerrada') {
    opcionesEstado += '<option value="validada">Validada</option><option value="borrador">Reabrir para edición</option>';
  } else if (estadoActual === 'validada') {
    opcionesEstado += '<option value="borrador">Reabrir para edición</option>';
  }
  var mensajeEstado = draft && draft.estado === 'borrador'
    ? 'La jornada fue reabierta y queda pendiente de corrección por el coordinador.'
    : (draft && draft.estado === 'validada'
      ? 'La contabilidad fue validada por administración; el coordinador no puede editarla mientras mantenga este estado.'
      : 'La contabilidad ya fue cerrada por el coordinador y está lista para validación administrativa.');

  detalle.innerHTML = [
    '<div class="contabilidad-report-layout">',
      '<header class="contabilidad-report-hero">',
        '<div class="contabilidad-report-hero-copy"><span>REPORTE CONTABLE</span><h2>Cierre de jornada</h2></div>',
        '<div class="contabilidad-report-meta"><span>Fecha<strong>' + texto(draft && draft.fecha) + '</strong></span><span>Municipio<strong>' + texto(draft && draft.municipio) + '</strong></span><span>Coordinador<strong>' + texto(draft && draft.coordinador) + '</strong></span></div>',
        '<div class="contabilidad-report-status-control"><select id="contabilidad-admin-estado" class="contabilidad-report-status contabilidad-report-status-' + texto(estadoActual) + '" aria-label="Estado de la jornada" onchange="actualizarBotonGuardarEstadoAdmin()">' + opcionesEstado + '</select><button id="btn-guardar-estado-contabilidad-admin" type="button" disabled onclick="guardarEstadoContabilidadAdmin()">Guardar</button></div>',
      '</header>',
      '<section class="contabilidad-report-metrics" aria-label="Resumen financiero">',
        '<article class="contabilidad-report-metric metric-affiliations"><span>Afiliaciones</span><strong>' + totalAfiliaciones.toLocaleString('es-VE') + '</strong><small>Registradas en la jornada</small></article>',
        '<article class="contabilidad-report-metric"><span>Saldo inicial</span><strong>' + moneda(saldoInicial) + '</strong><small>Disponible al comenzar</small></article>',
        '<article class="contabilidad-report-metric"><span>Total ingresos</span><strong>' + moneda(ingresos) + '</strong><small>Entradas de caja</small></article>',
        '<article class="contabilidad-report-metric"><span>Deducciones</span><strong>' + moneda(deduccion) + '</strong><small>Consignaciones y abonos</small></article>',
        '<article class="contabilidad-report-metric"><span>Egresos</span><strong>' + moneda(egresos) + '</strong><small>Gastos de la jornada</small></article>',
        '<article class="contabilidad-report-metric metric-balance"><span>Saldo final</span><strong>' + moneda(saldo) + '</strong><small>Saldo a rendir</small></article>',
      '</section>',
      '<div class="contabilidad-report-grid">',
      '<section class="contabilidad-report-panel contabilidad-report-affiliations">',
        '<div class="contabilidad-report-panel-heading"><div><span>DETALLE DE CAMPO</span><h3>Afiliaciones registradas</h3></div><b>' + afiliaciones.length + ' asesores</b></div>',
        '<div class="contabilidad-report-table-wrap"><table><thead><tr><th>#</th><th>Asesor / promotor</th><th>Rol</th><th class="is-number">Afiliaciones</th><th class="is-number">Recaudo abono</th><th class="is-number">Recaudo neto</th><th class="is-number">Préstamo</th></tr></thead><tbody>' + filasAfiliaciones + '</tbody></table></div>',
      '</section>',
      '<section class="contabilidad-report-panel contabilidad-report-movements">',
        '<div class="contabilidad-report-panel-heading"><div><span>ENTRADAS Y DEDUCCIONES</span><h3>Movimientos de caja</h3></div></div>' +
        formatoMovimiento('Giros / consignaciones', totalMovimiento(gastos.giros, detalleGastos.giros), detalleGastos.giros) +
        formatoMovimiento('Consignaciones / transferencias', totalMovimiento(gastos.consignaciones, detalleGastos.consignaciones), detalleGastos.consignaciones) +
        lineaGasto('Pago de abonos ganados', gastos.abonosGanados || 0) +
      '</section>',
      '<section class="contabilidad-report-panel contabilidad-report-expenses">',
        '<div class="contabilidad-report-panel-heading"><div><span>SALIDAS DE CAJA</span><h3>Gastos operativos</h3></div></div>' +
        '<div class="contabilidad-report-expense-list">' +
        lineaGasto('Comida del coordinador', gastos.comidaCoor, detalleGastos.comidaCoordinador) +
        lineaGasto('Desayunos de brigada', gastos.desayunos, detalleGastos.desayunos) +
        lineaGasto('Almuerzos', gastos.almuerzos) +
        lineaGasto('Cenas / préstamos', gastos.cenasPrestadas) +
        lineaGasto('Hotel / hospedaje', gastos.hotel, detalleGastos.hotel ? ('Monto original: ' + moneda(detalleGastos.hotel.monto) + ' ' + texto(detalleGastos.hotel.moneda || 'BS') + (Number(detalleGastos.hotel.tasa || 0) ? ' · Tasa: ' + texto(detalleGastos.hotel.tasa) : '')) : '') +
        lineaGasto('Transporte urbano', gastos.transUrbano) +
        lineaGasto('Transporte vereda', gastos.transVereda) +
        lineaGasto('Gastos varios / recargas', gastos.varios, detalleGastos.varios) +
        extrasHtml +
        '</div>' +
      '</section>',
      '<section class="contabilidad-report-panel contabilidad-report-dinners"><div class="contabilidad-report-panel-heading"><div><span>BENEFICIOS DE CAMPO</span><h3>Cenas ganadas por promotor</h3></div></div><div class="contabilidad-report-dinner-list">' + cenasGanadas + '</div></section>',
      '</div>',
      '<footer class="contabilidad-report-note">' + mensajeEstado + '</footer>',
    '</div>'
  ].join('');

  detalle.classList.remove('hidden');
}

function imprimirContabilidadAdminPDF() {
  var detalle = document.getElementById('contabilidad-admin-detalle');
  if (!detalle || detalle.classList.contains('hidden') || !window.__CONTABILIDAD_ADMIN_SELECCIONADA) {
    mostrarErrorContabilidadAdmin('Carga primero una jornada antes de generar el PDF.');
    return;
  }

  window.print();
}

function actualizarBotonGuardarEstadoAdmin() {
  var select = document.getElementById('contabilidad-admin-estado');
  var boton = document.getElementById('btn-guardar-estado-contabilidad-admin');
  var draft = window.__CONTABILIDAD_ADMIN_SELECCIONADA;
  if (select) {
    select.classList.remove('contabilidad-report-status-cerrada', 'contabilidad-report-status-validada', 'contabilidad-report-status-borrador');
    select.classList.add('contabilidad-report-status-' + select.value);
  }
  if (boton) boton.disabled = !select || !draft || select.value === draft.estado;
}

async function guardarEstadoContabilidadAdmin() {
  var draft = window.__CONTABILIDAD_ADMIN_SELECCIONADA;
  var select = document.getElementById('contabilidad-admin-estado');
  var estadoNuevo = select ? select.value : '';
  if (!draft || !draft.id || !select || estadoNuevo === draft.estado) {
    mostrarErrorContabilidadAdmin('Selecciona un cambio de estado válido para guardar.');
    return;
  }

  ocultarErrorContabilidadAdmin();
  setLoadingContabilidadAdmin(true, 'Guardando estado de la jornada...');
  select.disabled = true;
  var botonGuardar = document.getElementById('btn-guardar-estado-contabilidad-admin');
  if (botonGuardar) botonGuardar.disabled = true;
  try {
    if (estadoNuevo === 'validada' && draft.estado === 'cerrada') {
      await window.ContabilidadDiariaService.cambiarEstado(draft.id, 'validada');
    } else if (estadoNuevo === 'borrador' && (draft.estado === 'cerrada' || draft.estado === 'validada')) {
      if (!window.confirm('¿Reabrir esta jornada para que el coordinador pueda editarla? La acción quedará registrada.')) {
        setLoadingContabilidadAdmin(false, 'No se realizaron cambios.');
        select.value = draft.estado;
        actualizarBotonGuardarEstadoAdmin();
        return;
      }
      await window.ContabilidadDiariaService.reabrirParaEdicion(draft.id);
    } else {
      mostrarErrorContabilidadAdmin('Ese cambio de estado no está permitido.');
      return;
    }

    draft.estado = estadoNuevo;
    draft.actualizadoEn = new Date().toISOString();
    window.__CONTABILIDAD_ADMIN_SELECCIONADA = draft;
    renderDetalleContabilidadAdmin(draft);
    setLoadingContabilidadAdmin(false, 'Estado de la jornada actualizado.');
  } catch (error) {
    console.error('[ContabilidadAdmin] No se pudo guardar el estado:', error);
    mostrarErrorContabilidadAdmin(error && error.message
      ? error.message
      : 'No se pudo actualizar el estado de la jornada. Reintenta o contacta con soporte.');
  } finally {
    setLoadingContabilidadAdmin(false);
    var selectorActual = document.getElementById('contabilidad-admin-estado');
    if (selectorActual) selectorActual.disabled = false;
    actualizarBotonGuardarEstadoAdmin();
  }
}

window.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('admin-content')) {
    const existing = window.__CONTABILIDAD_ADMIN_SELECCIONADA;
    if (existing && existing.fecha) {
      renderDetalleContabilidadAdmin(existing);
    }
  }
});
