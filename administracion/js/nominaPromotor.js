/* ============================================================
   NOMINAPROMOTOR.JS — Integración de consulta de nómina
   Módulo Administración · Óptica Visión de Águila

   Reutiliza la lógica existente del módulo de Promotor.
   ============================================================ */

function renderNominaPromotor() {
  var contenedor = document.getElementById('admin-content');
  if (!contenedor) return;

  contenedor.innerHTML = [
    '<div class="fade-in">',
    '  <div class="mb-6">',
    '    <h3 class="text-verde-oscuro font-bold text-lg">Consulta de Nómina</h3>',
    '    <p class="text-gris-medio text-sm mt-0.5">Selecciona un promotor y consulta su nómina usando la misma lógica del módulo de promotores.</p>',
    '  </div>',
    '  <div class="bg-white rounded-xl shadow-soft p-5 max-w-2xl mb-6 border border-slate-200">',
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
    '    <div class="flex justify-end mt-3">',
    '      <button onclick="consultarNominasGenerales()" id="admin-btn-consultar-generales" class="nomina-general-btn" type="button">',
    '        Consultar nóminas en general',
    '      </button>',
    '    </div>',
    '    <div id="admin-nomina-error" class="hidden mt-4 text-sm text-rojo"></div>',
    '  </div>',
    '  <div id="admin-nomina-view"></div>',
  '  <div id="admin-nominas-generales-view"></div>',
    '</div>'
  ].join('');

  cargarPromotoresAdmin();
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
      if (resultado) {
        resultado.classList.remove('hidden');
        resultado.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  var boton = document.getElementById('admin-btn-consultar-generales');
  if (!resultado || !boton) return;

  boton.disabled = true;
  boton.textContent = 'Cargando nóminas...';
  resultado.innerHTML = '<div class="flex items-center gap-2 py-8 text-slate-400 text-sm"><div class="spinner"></div> Consultando todos los promotores...</div>';

  try {
    var promotores = await PromotoresService.getAll();
    if (!promotores || !promotores.length) {
      resultado.innerHTML = '<div class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">No hay promotores disponibles.</div>';
      return;
    }

    var consultas = promotores.map(function(promotor) {
      var cedula = (promotor.cedula || '').toString().trim();
      return fetch(window.API_URL + '?cedula=' + encodeURIComponent(cedula))
        .then(function(res) { return res.json(); })
        .then(function(data) {
          return {
            nombre: (promotor.nombre || 'Promotor').toString().trim(),
            resumen: data.resumen || {},
            lentesDetalle: data.lentesDetalle || [],
            registros: data.error ? [] : (data.logDiario || []),
            error: data.error || ''
          };
        })
        .catch(function() {
          return {
            nombre: (promotor.nombre || 'Promotor').toString().trim(),
            resumen: {},
            lentesDetalle: [],
            registros: [],
            error: 'No se pudo consultar esta nómina.'
          };
        });
    });

    _adminNominasGenerales = await Promise.all(consultas);
    renderNominasGenerales(_adminNominasGenerales);
  } catch (err) {
    resultado.innerHTML = '<div class="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">No se pudieron cargar las nóminas generales.</div>';
  } finally {
    boton.disabled = false;
    boton.textContent = 'Consultar nóminas en general';
  }
}

var _adminNominasGenerales = [];

function renderNominasGenerales(nominas) {
  var resultado = document.getElementById('admin-nominas-generales-view');
  if (!resultado) return;

  var tabs = nominas.map(function(nomina, idx) {
    return '<button type="button" onclick="mostrarNominaGeneral(' + idx + ')" id="admin-nomina-tab-' + idx + '" class="admin-nomina-tab shrink-0 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ' +
      (idx === 0 ? 'text-verde-oscuro border-verde-oscuro tab-activo font-bold' : 'text-slate-500 border-transparent hover:text-verde-oscuro') + '" data-activo="' + (idx === 0 ? 'true' : 'false') + '">' +
      escaparNominaAdmin(nomina.nombre) + '</button>';
  }).join('');

  var paneles = nominas.map(function(nomina, idx) {
    return '<div id="admin-nomina-panel-' + idx + '" class="' + (idx === 0 ? '' : 'hidden') + '">' +
      '<div class="flex items-center justify-between mb-3">' +
        '<p class="text-sm font-semibold text-verde-oscuro">' + escaparNominaAdmin(nomina.nombre) + '</p>' +
        '<span class="text-xs text-slate-400">' + nomina.registros.length + ' registros</span>' +
      '</div>' +
      (nomina.error
        ? '<div class="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">' + escaparNominaAdmin(nomina.error) + '</div>'
        : resumenNominaGeneralAdmin(nomina) + tablaNominaGeneralAdmin(nomina.registros)) +
    '</div>';
  }).join('');

  resultado.innerHTML =
    '<div class="mt-5 bg-white rounded-md-plus shadow-card p-5 border border-slate-200">' +
      '<div class="flex items-center justify-between mb-3">' +
        '<h4 class="text-sm font-bold text-verde-oscuro">Nóminas generales</h4>' +
        '<span class="text-xs text-slate-500">' + nominas.length + ' promotores</span>' +
      '</div>' +
      '<div class="overflow-x-auto border-b border-slate-200 mb-4"><div class="flex gap-1 min-w-max">' + tabs + '</div></div>' +
      paneles +
    '</div>';
}

function mostrarNominaGeneral(idx) {
  document.querySelectorAll('.admin-nomina-tab').forEach(function(tab, tabIdx) {
    var activo = tabIdx === idx;
    tab.classList.toggle('text-verde-oscuro', activo);
    tab.classList.toggle('border-verde-oscuro', activo);
    tab.classList.toggle('font-bold', activo);
    tab.classList.toggle('tab-activo', activo);
    tab.classList.toggle('text-slate-500', !activo);
    tab.classList.toggle('border-transparent', !activo);
    tab.setAttribute('data-activo', activo ? 'true' : 'false');
  });
  document.querySelectorAll('[id^="admin-nomina-panel-"]').forEach(function(panel, panelIdx) {
    panel.classList.toggle('hidden', panelIdx !== idx);
  });
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

function escaparNominaAdmin(valor) {
  return String(valor == null ? '' : valor).replace(/[&<>"']/g, function(caracter) {
    return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[caracter];
  });
}
