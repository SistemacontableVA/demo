function renderNominaPromotor() {
  var contenedor = document.getElementById('admin-content');
  if (!contenedor) return;

  contenedor.innerHTML = [
    '<div class="fade-in">',
    '  <div id="admin-nomina-modal" class="fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-y-auto bg-[#082c4a]/90 px-4 py-8 backdrop-blur-sm">',
    '    <div class="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl">',
    '      <div class="bg-gradient-to-br from-[#082c4a] via-[#0c5360] to-[#008a69] px-6 py-8 text-white sm:px-10">',
    '        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-2xl ring-1 ring-white/30">$</div>',
    '        <h3 class="mt-4 text-center text-2xl font-extrabold tracking-tight text-white">Consulta de Nóminas</h3>',
    '        <p class="mx-auto mt-2 max-w-md text-center text-sm text-white/80">Elige una vista para revisar una nómina individual o consultar todas en una sola carga.</p>',
    '      </div>',
    '      <div class="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 sm:p-8">',
    '        <button type="button" onclick="seleccionarModoNomina(\'individual\')" class="group rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left shadow-soft transition hover:-translate-y-1 hover:border-verde-medio hover:shadow-card">',
    '          <span class="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-verde-suave text-xl font-bold text-verde-oscuro transition group-hover:bg-verde-medio group-hover:text-white">1</span>',
    '          <strong class="block text-base text-verde-oscuro">Consulta Individual</strong>',
    '          <span class="mt-1 block text-xs text-slate-500">Selecciona un promotor y consulta su nómina.</span>',
    '        </button>',
    '        <button type="button" onclick="seleccionarModoNomina(\'general\')" class="group rounded-2xl border border-verde-medio/30 bg-emerald-50/40 p-5 text-left shadow-soft transition hover:-translate-y-1 hover:border-verde-medio hover:shadow-card">',
    '          <span class="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-verde-medio text-xl font-bold text-white transition group-hover:bg-verde-oscuro">2</span>',
    '          <strong class="block text-base text-verde-oscuro">Consulta Nómina General</strong>',
    '          <span class="mt-1 block text-xs text-slate-500">Carga todas las nóminas para revisarlas rápidamente.</span>',
    '        </button>',
    '      </div>',
    '    </div>',
    '  </div>',
    '  <div id="admin-nomina-workspace" class="hidden">',
    '  <div class="mb-6">',
    '    <h3 class="text-verde-oscuro font-bold text-lg">Consulta de Nómina</h3>',
    '    <p class="text-gris-medio text-sm mt-0.5">Selecciona un promotor y consulta su nómina.</p>',
    '  </div>',
    '  <div id="admin-nomina-selector" class="bg-white rounded-xl shadow-soft p-5 max-w-2xl mb-6 border border-slate-200">',
    '    <div class="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">',
    '      <div>',
    '        <label class="block text-xs font-semibold text-gris-medio uppercase tracking-wide mb-1.5">Promotor</label>',
    '        <select id="admin-promotor-select" class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-gris-oscuro focus:outline-none input-foco-verde">',
    '        </select>',
    '      </div>',
    '      <button onclick="consultarNominaPromotor()" id="admin-btn-consultar-nomina" class="btn-primario text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70" type="button">',
    '        <span id="admin-btn-consultar-texto">Consultar Nómina</span>',
    '        <span id="admin-btn-consultar-spinner" class="hidden inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" style="animation: spin .7s linear infinite;"></span>',
    '      </button>',
    '    </div>',
    '    <div id="admin-nomina-error" class="hidden mt-4 text-sm text-rojo"></div>',
    '  </div>',
    '  </div>',
    '  <div id="admin-nomina-view"></div>',
    '  <div id="admin-nominas-generales-view"></div>',
    '  </div>',
    '</div>'
  ].join('');

  cargarPromotoresAdmin();
}

function seleccionarModoNomina(modo) {
  var modal = document.getElementById('admin-nomina-modal');
  var workspace = document.getElementById('admin-nomina-workspace');
  var selector = document.getElementById('admin-nomina-selector');
  var general = document.getElementById('admin-nominas-generales-view');
  if (modal) modal.classList.add('hidden');
  if (workspace) workspace.classList.remove('hidden');
  if (selector) selector.classList.toggle('hidden', modo !== 'individual');
  if (general) general.classList.toggle('hidden', modo !== 'general');
  if (modo === 'general') consultarNominasGenerales();
}

function cargarPromotoresAdmin() {
  var select = document.getElementById('admin-promotor-select');
  if (!select) return;

  select.innerHTML = '<option value="">Cargando promotores...</option>';

  PromotoresService.getAll()
    .then(function (lista) {
      select.innerHTML = '<option value="">Selecciona un promotor</option>' + (lista || []).map(function (p) {
        return '<option value="' + (p.cedula || '').toString().trim() + '">' + (p.nombre || '').toString().trim() + '</option>';
      }).join('');
    })
    .catch(function (err) {
      console.error('[AdminNomina] Error cargando promotores:', err);
      select.innerHTML = '<option value="">No se pudo cargar la lista</option>';
    });
}

function consultarNominaPromotor() {
  var select = document.getElementById('admin-promotor-select');
  var errorEl = document.getElementById('admin-nomina-error');
  var wrapper = document.getElementById('admin-nomina-view');

  if (!select || !wrapper) return;

  var cedula = select.value;
  if (!cedula) {
    errorEl.textContent = 'Selecciona un promotor antes de consultar.';
    errorEl.classList.remove('hidden');
    return;
  }

  errorEl.classList.add('hidden');

  var btn = document.getElementById('admin-btn-consultar-nomina');
  var btnText = document.getElementById('admin-btn-consultar-texto');
  var btnSpinner = document.getElementById('admin-btn-consultar-spinner');
  if (btn && btnText && btnSpinner) {
    btn.disabled = true;
    btnText.textContent = 'Cargando...';
    btnSpinner.classList.remove('hidden');
  }

  wrapper.innerHTML = '<div class="flex items-center justify-center py-8"><div class="spinner"></div></div>';

  window.__nominaCedulaOverride = cedula;

  fetch('promotores/views/nomina.tpl?t=' + Date.now())
    .then(function (res) { return res.text(); })
    .then(function (html) {
      wrapper.innerHTML = html;
      var header = wrapper.querySelector('.mb-6.lg\\:mb-8.fade-in.no-print');
      if (header) header.style.display = 'none';
      var resultado = wrapper.querySelector('#resultado');
      if (resultado) resultado.classList.add('hidden');

      var cedulaInput = wrapper.querySelector('#cedula');
      if (cedulaInput) {
        cedulaInput.value = cedula;
      }

      return consultar().finally(function () {
        window.__nominaCedulaOverride = '';
      });
    })
    .then(function () {
      var resultado = wrapper.querySelector('#resultado');
      if (resultado && nominaActual) {
        resultado.classList.remove('hidden');
        resultado.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (!nominaActual) {
        wrapper.innerHTML = '';
        errorEl.textContent = 'No se puede mostrar la nómina porque este promotor no tiene datos de AFF.';
        errorEl.classList.remove('hidden');
      }
    })
    .catch(function (err) {
      console.error('[AdminNomina] Error consultando nómina:', err);
      wrapper.innerHTML = '<div class="text-sm text-rojo">No se pudo cargar la nómina del promotor seleccionado.</div>';
    })
    .finally(function () {
      var btn = document.getElementById('admin-btn-consultar-nomina');
      var btnText = document.getElementById('admin-btn-consultar-texto');
      var btnSpinner = document.getElementById('admin-btn-consultar-spinner');
      if (btn && btnText && btnSpinner) {
        btn.disabled = false;
        btnText.textContent = 'Consultar Nómina';
        btnSpinner.classList.add('hidden');
      }
    });
}

async function consultarNominasGenerales() {
  var resultado = document.getElementById('admin-nominas-generales-view');
  if (!resultado) return;

  resultado.innerHTML = '<div class="flex items-center gap-2 py-8 text-slate-400 text-sm"><div class="spinner"></div> Consultando todos los promotores...</div>';

  try {
    var respuesta = await fetch(window.API_URL + '?action=listar-nominas-generales', { cache: 'no-store' });
    if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
    var payload = await respuesta.json();
    var nominas = Array.isArray(payload) ? payload : (payload.nominas || []);
    if (!nominas.length) {
      resultado.innerHTML = '<div class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">No hay promotores disponibles.</div>';
      return;
    }
    _adminNominasGenerales = nominas.map(function(nomina) {
      var resumen = nomina.resumen || {};
      var resumenPago = nomina.resumenPago || {};
      return {
        nombre: nomina.nombre || 'Promotor',
        resumen: resumen,
        resumenPago: {
          afiliaciones: resumenPago.afiliaciones || resumen.totalAff || 0,
          lentesVendidos: resumenPago.lentesVendidos || resumen.totalVentaLentes || 0,
          totalPagar: resumenPago.totalPagar || resumen.neto || 0
        },
        lentesDetalle: nomina.lentesDetalle || [],
        registros: nomina.logDiario || [],
        error: nomina.error || ''
      };
    });
    renderNominasGenerales(_adminNominasGenerales);
  } catch (err) {
    resultado.innerHTML = '<div class="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">No se pudieron cargar las nóminas generales.</div>';
  } finally {
  }
}

var _adminNominasGenerales = [];
var _adminNominasResumenPago = [];
var _adminNominaPlantillaHtml = '';
var _adminNominaGeneralActiva = -1;

function renderNominasGenerales(nominas) {
  var resultado = document.getElementById('admin-nominas-generales-view');
  if (!resultado) return;

  var nominasDisponibles = nominas.filter(function(nomina) { return !nomina.error; });
  var nominasSinHoja = nominas.filter(function(nomina) { return !!nomina.error; });
  _adminNominasResumenPago = nominas;
  _adminNominasGenerales = nominasDisponibles;

  if (!nominasDisponibles.length) {
    resultado.innerHTML = '<div class="mt-5"><button type="button" onclick="abrirResumenPagoNominas()" class="mb-4 inline-flex items-center gap-2 rounded-xl bg-verde-oscuro px-4 py-2.5 text-sm font-semibold text-white shadow-soft">Resumen de Pago</button><div class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">No hay promotores con información de nómina disponible.</div></div>' +
      listaNominasSinHojaAdmin(nominasSinHoja);
    return;
  }

  var paneles = nominasDisponibles.map(function(nomina, idx) {
    return '<div id="admin-nomina-panel-' + idx + '" class="' + (idx === 0 ? '' : 'hidden') + '">' +
      (nomina.error
        ? '<div class="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">' + escaparNominaAdmin(nomina.error) + '</div>'
        : '<div id="admin-nomina-detalle-' + idx + '"></div>') +
    '</div>';
  }).join('');

  resultado.innerHTML =
    '<div class="mt-5">' +
      '<div class="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-soft">' +
        '<div class="mb-1.5 flex items-center justify-between gap-3">' +
          '<label for="admin-promotor-general-select" class="block text-xs font-semibold uppercase tracking-wide text-gris-medio">Promotor</label>' +
          '<button type="button" onclick="abrirResumenPagoNominas()" class="inline-flex shrink-0 items-center gap-2 rounded-lg bg-verde-oscuro px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:shadow-card">Resumen de Pago</button>' +
        '</div>' +
        '<select id="admin-promotor-general-select" onchange="mostrarNominaGeneral(this.value)" class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-gris-oscuro focus:outline-none input-foco-verde">' +
          nominasDisponibles.map(function(nomina, idx) { return '<option value="' + idx + '">' + escaparNominaAdmin(nomina.nombre) + '</option>'; }).join('') +
        '</select>' +
        '<p class="mt-2 text-xs text-slate-400">' + nominasDisponibles.length + ' promotores con información cargados. El cambio de selección es instantáneo.</p>' +
      '</div>' +
      paneles +
    '</div>' +
    listaNominasSinHojaAdmin(nominasSinHoja);

  cargarPlantillaNominaGeneral().then(function() {
    mostrarNominaGeneral(0);
  });
}

function abrirResumenPagoNominas() {
  var existente = document.getElementById('admin-resumen-pago-modal');
  if (existente) existente.remove();

  var totalPagoPositivo = _adminNominasResumenPago.reduce(function(total, nomina) {
    var valor = Number((nomina.resumenPago || {}).totalPagar) || 0;
    return total + (valor > 0 ? valor : 0);
  }, 0);

  var filas = _adminNominasResumenPago.map(function(nomina, indice) {
    var resumen = nomina.resumenPago || {};
    return '<tr class="border-b border-slate-100 last:border-0 ' + (indice % 2 === 0 ? 'bg-white' : 'bg-slate-50') + '">' +
      '<td class="w-[44%] px-3 py-2.5 text-left text-sm font-semibold text-slate-700">' + escaparNominaAdmin(nomina.nombre) + '</td>' +
      '<td class="w-[20%] border-l border-slate-100 px-3 py-2.5 text-right text-sm font-semibold text-verde-oscuro">$' + fmt(resumen.totalPagar || 0) + '</td>' +
      '<td class="w-[18%] border-l border-slate-100 px-3 py-2.5 text-center text-sm text-slate-600">' + escaparNominaAdmin(resumen.afiliaciones || 0) + '</td>' +
      '<td class="w-[18%] border-l border-slate-100 px-3 py-2.5 text-center text-sm text-slate-600">' + escaparNominaAdmin(resumen.lentesVendidos || 0) + '</td>' +
    '</tr>';
  }).join('');

  var modal = document.createElement('div');
  modal.id = 'admin-resumen-pago-modal';
  modal.className = 'fixed inset-0 z-[110] flex min-h-screen items-center justify-center overflow-y-auto bg-[#082c4a]/70 px-4 py-8 backdrop-blur-sm';
  modal.innerHTML = '<div class="w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="admin-resumen-pago-titulo">' +
    '<div class="flex items-center justify-between bg-verde-oscuro px-5 py-4 text-white">' +
      '<div><h3 id="admin-resumen-pago-titulo" class="text-lg font-bold text-verde-medio">Resumen de Pago</h3><p class="mt-0.5 text-xs text-white/75">Afiliaciones, lentes vendidos y total a pagar</p></div>' +
      '<button type="button" onclick="cerrarResumenPagoNominas()" class="rounded-lg px-3 py-1 text-xl leading-none text-white/80 hover:bg-white/10 hover:text-white" aria-label="Cerrar">&times;</button>' +
    '</div>' +
    '<div class="max-h-[70vh] overflow-auto p-4">' +
      '<div class="overflow-x-auto rounded-xl border border-slate-200"><table class="w-full min-w-[620px] table-fixed text-sm">' +
        '<colgroup><col class="w-[44%]"><col class="w-[20%]"><col class="w-[18%]"><col class="w-[18%]"></colgroup>' +
        '<thead><tr class="bg-slate-50 text-xs uppercase tracking-wide text-slate-600"><th class="px-3 py-2.5 text-left">Promotor</th><th class="border-l border-slate-200 px-3 py-2.5 text-right">Total a pagar</th><th class="border-l border-slate-200 px-3 py-2.5 text-center">Afiliaciones</th><th class="border-l border-slate-200 px-3 py-2.5 text-center">Lentes vendidos</th></tr></thead>' +
        '<tbody>' + filas + '</tbody>' +
        '<tfoot><tr class="border-t-2 border-slate-200 bg-slate-100 font-bold text-slate-700"><td class="px-3 py-3 text-left text-sm">Total a Pagar</td><td class="border-l border-slate-200 px-3 py-3 text-right text-sm text-verde-oscuro">$' + fmt(totalPagoPositivo) + '</td><td class="border-l border-slate-200 px-3 py-3"></td><td class="border-l border-slate-200 px-3 py-3"></td></tr></tfoot>' +
      '</table></div>' +
    '</div>' +
  '</div>';
  document.body.appendChild(modal);
}

function cerrarResumenPagoNominas() {
  var modal = document.getElementById('admin-resumen-pago-modal');
  if (modal) modal.remove();
}

function listaNominasSinHojaAdmin(nominas) {
  if (!nominas.length) return '';

  return '<div class="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">' +
    '<h5 class="text-sm font-bold text-slate-700">Promotores sin datos de AFF</h5>' +
    '<p class="mt-1 text-xs text-slate-500">No aparecen en el selector porque no tienen información disponible.</p>' +
    '<ul class="mt-3 space-y-1.5">' +
      nominas.map(function(nomina) {
        return '<li class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">' + escaparNominaAdmin(nomina.nombre) +
          '<span class="ml-1 font-normal text-slate-500">(' + escaparNominaAdmin(nomina.error) + ')</span></li>';
      }).join('') +
    '</ul>' +
  '</div>';
}

function cargarPlantillaNominaGeneral() {
  if (_adminNominaPlantillaHtml) return Promise.resolve(_adminNominaPlantillaHtml);
  return fetch('promotores/views/nomina.tpl?t=' + Date.now(), { cache: 'no-store' })
    .then(function(res) {
      if (!res.ok) throw new Error('No se pudo cargar la vista de nómina.');
      return res.text();
    })
    .then(function(html) {
      _adminNominaPlantillaHtml = html;
      return html;
    });
}

function mostrarNominaGeneral(idx) {
  idx = Number(idx) || 0;
  document.querySelectorAll('[id^="admin-nomina-panel-"]').forEach(function(panel, panelIdx) {
    panel.classList.toggle('hidden', panelIdx !== idx);
  });

  var select = document.getElementById('admin-promotor-general-select');
  if (select && select.value !== String(idx)) select.value = String(idx);

  var nomina = _adminNominasGenerales[idx];
  if (nomina && !nomina.error) {
    _adminNominaGeneralActiva = idx;
    cargarPlantillaNominaGeneral().then(function() {
      renderDetalleNominaGeneral(nomina);
    });
  }
}

function renderDetalleNominaGeneral(nomina) {
  var detalle = document.getElementById('admin-nomina-detalle-' + _adminNominaGeneralActiva);
  if (!detalle || !_adminNominaPlantillaHtml) return;

  document.querySelectorAll('[id^="admin-nomina-detalle-"]').forEach(function(contenedor) {
    if (contenedor !== detalle) contenedor.innerHTML = '';
  });
  detalle.innerHTML = _adminNominaPlantillaHtml;
  var header = detalle.querySelector('.mb-6.lg\\:mb-8.fade-in.no-print');
  if (header) header.style.display = 'none';

  var resultado = detalle.querySelector('#resultado');
  if (resultado) resultado.classList.remove('hidden');

  var data = {
    nombre: nomina.nombre,
    resumen: nomina.resumen || {},
    logDiario: nomina.registros || [],
    lentesDetalle: nomina.lentesDetalle || []
  };
  nominaActual = data;
  logDiarioActual = data.logDiario;

  detalle.querySelector('#txt-nombre').innerText = data.nombre || 'Asesor';
  detalle.querySelector('#avatar-inicial').innerText = (data.nombre || 'A').trim().charAt(0).toUpperCase();
  asignarValoresNominaGeneral(data, detalle);
  renderDeducciones();
  renderBrigadas();
  renderLentes(data);
  filtrar('todos');
  showVista('nomina');
}

function asignarValoresNominaGeneral(data, detalle) {
  var resumen = data.resumen || {};
  function texto(id, valor) {
    var elemento = detalle.querySelector('#' + id);
    if (elemento) elemento.textContent = valor;
  }
  texto('res-bc', resumen.brigCampo !== undefined ? resumen.brigCampo : 0);
  texto('res-ba', resumen.brigAtend !== undefined ? resumen.brigAtend : 0);
  texto('res-lent', resumen.cantLenteEsp !== undefined ? resumen.cantLenteEsp : (resumen.lenteEspecial || 0));
  texto('res-lent-sencillo', resumen.cantLenteSen !== undefined ? resumen.cantLenteSen : (resumen.lenteSencillo || 0));
  texto('res-total-ingresos', Number(resumen.totalVentaLentes || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 }));
  texto('res-promedio-venta', Number(resumen.promedioVenta || 0).toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
  texto('ingCantidadAff', resumen.totalAff || 0);
  texto('ingTotalAff', '$' + fmt(resumen.totalAffMonto || 0));
  texto('ingLenteEsp', '$' + fmt(resumen.montoLenteEsp || 0));
  texto('ingLenteSen', '$' + fmt(resumen.montoLenteSen || 0));
  texto('ingPagoAsistencia', '$' + fmt(resumen.pagoAsistencia || 0));
  texto('ingTotalIngresos', '$' + fmt((resumen.totalIngresos || 0) + (resumen.pagoAsistencia || 0)));
  texto('dedComida', '$' + fmt(resumen.deducComida || 0));
  texto('dedPrestamo', '$' + fmt(resumen.deducPrestamo || 0));
  texto('dedDescuento', '$' + fmt(resumen.deducDescuento || 0));
  texto('dedTotalDeducciones', '$' + fmt(resumen.totalDeducciones || 0));
  texto('res-neto', '$' + fmt(resumen.neto || 0));
}

function resumenNominaGeneralAdmin(nomina) {
  var resumen = nomina.resumen || {};
  var totalLentes = (nomina.lentesDetalle || []).reduce(function(total, lente) {
    return total + (Number(lente.totalVenta) || 0);
  }, 0);
  var totalAff = resumen.totalAff || 0;
  var dias = nomina.registros.length;
  var promedioAff = dias ? Math.round((Number(totalAff) || 0) / dias) : 0;
  var asistidos = resumen.asistidos !== undefined ? resumen.asistidos : (resumen.ceroAsist || 0);
  var neto = Number(resumen.neto) || 0;

  return '<div class="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-9 gap-2 mb-4">' +
    tarjetaResumenNominaAdmin('Total a pagar', '$ ' + fmt(neto), 'text-verde-oscuro', true) +
    tarjetaResumenNominaAdmin('Ingresos', '$ ' + fmt(resumen.totalIngresos || 0), 'text-verde-oscuro', false) +
    tarjetaResumenNominaAdmin('Deducciones', '$ ' + fmt(resumen.totalDeducciones || 0), 'text-rojo', false) +
    tarjetaResumenNominaAdmin('Venta lentes', fmt(totalLentes), 'text-verde-oscuro', false) +
    tarjetaResumenNominaAdmin('Afiliaciones', totalAff, 'text-verde-oscuro', false) +
    tarjetaResumenNominaAdmin('Brig. campo', resumen.brigCampo || 0, 'text-verde-oscuro', false) +
    tarjetaResumenNominaAdmin('Brig. atend.', resumen.brigAtend || 0, 'text-verde-oscuro', false) +
    tarjetaResumenNominaAdmin('Asistidos', asistidos, 'text-verde-oscuro', false) +
    tarjetaResumenNominaAdmin('Días trabajados', dias, 'text-verde-oscuro', false) +
  '</div>';
}

function tarjetaResumenNominaAdmin(etiqueta, valor, claseValor, esTotal) {
  var extraClass = esTotal ? 'bg-emerald-50 border-emerald-200 shadow-card' : 'bg-white border-slate-200';

  return '<div class="rounded-md-plus border overflow-hidden ' + extraClass + '">' +
    '<div class="bg-verde-oscuro text-white text-[10px] sm:text-[11px] uppercase tracking-wide font-bold text-center py-1.5 px-1.5">' + etiqueta + '</div>' +
    '<div class="px-2 py-3 text-center min-h-[60px] flex items-center justify-center">' +
      '<strong class="block text-sm sm:text-lg md:text-xl font-extrabold leading-tight ' + claseValor + '">' + escaparNominaAdmin(valor) + '</strong>' +
    '</div>' +
  '</div>';
}

function tablaNominaGeneralAdmin(registros) {
  if (!registros.length) {
    return '<div class="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">Este promotor no tiene registros de jornada.</div>';
  }

  var filas = registros.map(function(registro) {
    var aff = Number(registro.aff || 0);
    var brig = Number(registro.brig || 0);
    var prestamo = Number(registro.prestamo || 0);
    var descuento = Number(registro.descuento || 0);

    return '<tr class="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">' +
      '<td class="px-3 py-2 text-xs font-semibold text-slate-700 whitespace-nowrap">' + escaparNominaAdmin(registro.fecha || '') + '</td>' +
      '<td class="px-3 py-2 text-xs text-slate-600 whitespace-nowrap">' + escaparNominaAdmin(registro.coordinador || '') + '</td>' +
      '<td class="px-3 py-2 text-xs text-slate-600 whitespace-nowrap">' + escaparNominaAdmin(registro.municipio || '') + '</td>' +
      '<td class="px-3 py-2 text-xs text-center whitespace-nowrap">' +
        (aff > 0 ? '<span class="inline-flex items-center justify-center min-w-[26px] rounded-full bg-verde-suave text-verde-oscuro px-2 py-1 font-bold">' + aff + '</span>' : '<span class="text-slate-400">0</span>') +
      '</td>' +
      '<td class="px-3 py-2 text-xs text-center font-semibold text-verde-oscuro whitespace-nowrap">' + escaparNominaAdmin(brig) + '</td>' +
      '<td class="px-3 py-2 text-xs text-center text-slate-600 whitespace-nowrap">' + escaparNominaAdmin(registro.comida || 0) + '</td>' +
      '<td class="px-3 py-2 text-xs text-center font-semibold whitespace-nowrap ' + (prestamo > 0 ? 'text-rojo' : 'text-slate-500') + '">' + escaparNominaAdmin(registro.prestamo || 0) + '</td>' +
      '<td class="px-3 py-2 text-xs text-center font-semibold whitespace-nowrap ' + (descuento > 0 ? 'text-rojo' : 'text-slate-500') + '">' + escaparNominaAdmin(registro.descuento || 0) + '</td>' +
      '<td class="px-3 py-2 text-xs text-slate-600 whitespace-normal break-words">' + escaparNominaAdmin(registro.detalle || '') + '</td>' +
    '</tr>';
  }).join('');

  return '<div class="overflow-x-auto rounded-xl border border-slate-200">' +
    '<table class="w-full min-w-[820px] text-sm">' +
      '<thead><tr class="bg-verde-oscuro text-white text-[10px] uppercase tracking-wide border-b border-slate-200">' +
        '<th class="px-3 py-2.5 text-left font-semibold">Fecha</th>' +
        '<th class="px-3 py-2.5 text-left font-semibold">Coordinador</th>' +
        '<th class="px-3 py-2.5 text-left font-semibold">Municipio</th>' +
        '<th class="px-3 py-2.5 text-center font-semibold">AFF</th>' +
        '<th class="px-3 py-2.5 text-center font-semibold">Brig. campo</th>' +
        '<th class="px-3 py-2.5 text-center font-semibold">Comida</th>' +
        '<th class="px-3 py-2.5 text-center font-semibold">Préstamo</th>' +
        '<th class="px-3 py-2.5 text-center font-semibold">Descuento</th>' +
        '<th class="px-3 py-2.5 text-left font-semibold">Detalle</th>' +
      '</tr></thead>' +
      '<tbody>' + filas + '</tbody>' +
    '</table>' +
  '</div>';
}

function tablaLentesGeneralAdmin(lentes) {
  if (!lentes.length) {
    return '<div class="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">Este promotor no tiene registros de lentes.</div>';
  }

  var filas = lentes.map(function(lente) {
    return '<tr class="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">' +
      '<td class="px-3 py-2 text-xs font-semibold text-slate-700 whitespace-nowrap">' + escaparNominaAdmin(lente.fecha || '') + '</td>' +
      '<td class="px-3 py-2 text-xs text-slate-600 whitespace-nowrap">' + escaparNominaAdmin(lente.municipio || '') + '</td>' +
      '<td class="px-3 py-2 text-xs text-slate-600 whitespace-nowrap">' + escaparNominaAdmin(lente.asesor || '') + '</td>' +
      '<td class="px-3 py-2 text-xs text-center font-semibold text-verde-oscuro">' + escaparNominaAdmin(lente.cProm || 0) + '</td>' +
      '<td class="px-3 py-2 text-xs text-center font-semibold text-verde-oscuro">' + escaparNominaAdmin(lente.asist || 0) + '</td>' +
      '<td class="px-3 py-2 text-xs text-right font-semibold text-verde-oscuro">$' + fmt(lente.totalVenta || 0) + '</td>' +
      '<td class="px-3 py-2 text-xs text-center text-slate-600">' + escaparNominaAdmin(lente.brigada || 0) + '</td>' +
    '</tr>';
  }).join('');

  return '<div class="mt-4 overflow-x-auto rounded-xl border border-slate-200">' +
    '<div class="bg-verde-oscuro text-white text-xs uppercase tracking-wide font-bold px-3 py-2.5">Relación de lentes vendidos</div>' +
    '<table class="w-full min-w-[720px] text-sm"><thead><tr class="bg-slate-50 text-slate-600 text-[10px] uppercase tracking-wide">' +
      '<th class="px-3 py-2 text-left">Fecha</th><th class="px-3 py-2 text-left">Municipio</th><th class="px-3 py-2 text-left">Asesor</th>' +
      '<th class="px-3 py-2 text-center">C. Prom.</th><th class="px-3 py-2 text-center">Asist.</th><th class="px-3 py-2 text-right">Venta</th><th class="px-3 py-2 text-center">Brigada</th>' +
    '</tr></thead><tbody>' + filas + '</tbody></table></div>';
}

function escaparNominaAdmin(valor) {
  return String(valor == null ? '' : valor).replace(/[&<>"']/g, function(caracter) {
    return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[caracter];
  });
}
