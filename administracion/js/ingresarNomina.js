/* ============================================================
   INGRESARNOMINA.JS — Módulo de ingreso y edición de jornadas
   Módulo Administración · Óptica Visión de Águila

   Flujo wizard (3 pasos tipo acordeón):
     Paso 1 — Datos de la jornada (fecha, coordinador, municipio)
     Paso 2 — Selección de promotores (checkboxes)
     Paso 3 — Tabla de conceptos por promotor + botón Cargar
   ============================================================ */

var _inPromotoresTodos = [];
var _inSeleccionados   = [];
var _inModo            = 'cargar';
var _inPasoActual      = 1;

/* ════════════════════════════════════════════════════════════
   PUNTO DE ENTRADA
════════════════════════════════════════════════════════════ */

function renderIngresarNomina() {
  var contenedor = document.getElementById('admin-content');
  if (!contenedor) return;

  var perfil = (typeof getPerfilAdmin === 'function') ? getPerfilAdmin() : 'Administrador';
  if (perfil !== 'Administrador' && perfil !== 'Secretaria') {
    contenedor.innerHTML =
      '<div class="flex items-center justify-center h-40 text-slate-400 text-sm">No tienes permiso para acceder a esta sección.</div>';
    return;
  }

  _inModo          = 'cargar';
  _inSeleccionados = [];
  _inPasoActual    = 1;

  contenedor.innerHTML = _inShellHtml();
  _inCambiarModo('cargar');
  _inCargarPromotores();
  _inIrPaso(1);
}

/* ════════════════════════════════════════════════════════════
   SHELL HTML
════════════════════════════════════════════════════════════ */

function _inShellHtml() {
  return '<div class="ingresar-nomina-module fade-in w-full max-w-none mx-auto">' +

    // ── Encabezado ──
    '<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">' +
      '<div>' +
        '<h3 class="text-verde-oscuro font-bold text-lg">Ingresar / Editar Jornada</h3>' +
        '<p class="text-slate-400 text-sm mt-0.5">Registra la jornada diaria de los promotores</p>' +
      '</div>' +
      '<div class="flex gap-2">' +
        '<button onclick="_inCambiarModo(\'cargar\')" id="tab-cargar"' +
          ' class="px-4 py-2 rounded-xl text-sm font-semibold transition-all"' +
          ' style="background:#0f4b7d;border:1px solid #0f4b7d;color:#ffffff;box-shadow:0 10px 18px -12px rgba(15,75,125,0.8);">Cargar</button>' +
        '<button onclick="_inCambiarModo(\'editar\')" id="tab-editar"' +
          ' class="px-4 py-2 rounded-xl text-sm font-semibold transition-all"' +
          ' style="background:#dfeaf6;border:1px solid #dfeaf6;color:#0f4b7d;">Editar</button>' +
      '</div>' +
    '</div>' +

    // ── MODO CARGAR ──
    '<div id="in-modo-cargar">' +

      // Indicador de pasos
      '<div class="flex items-center gap-0 mb-6">' +
        _inStepIndicator(1, 'Jornada') +
        '<div class="flex-1 h-0.5 bg-slate-200" id="in-line-1-2"></div>' +
        _inStepIndicator(2, 'Promotores') +
        '<div class="flex-1 h-0.5 bg-slate-200" id="in-line-2-3"></div>' +
        _inStepIndicator(3, 'Conceptos') +
      '</div>' +

      // ── PASO 1 ──
      '<div id="in-panel-1" class="bg-white rounded-2xl shadow-soft overflow-hidden mb-4">' +
        '<button onclick="_inTogglePanel(1)" class="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors">' +
          '<div class="flex items-center gap-3">' +
            '<span id="in-badge-1" class="w-7 h-7 rounded-full bg-verde-oscuro flex items-center justify-center text-white text-xs font-bold flex-shrink-0">1</span>' +
            '<div>' +
              '<p class="font-semibold text-slate-700 text-sm">Datos de la jornada</p>' +
              '<p id="in-resumen-1" class="text-xs text-slate-400 mt-0.5">Fecha, coordinador y municipio</p>' +
            '</div>' +
          '</div>' +
          '<svg id="in-arrow-1" class="w-4 h-4 text-slate-400 transition-transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
            '<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>' +
          '</svg>' +
        '</button>' +
        '<div id="in-body-1" class="px-6 pb-6">' +
          '<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">' +
            _inCampo('in-fecha',       'Fecha *',         'date', '') +
            _inCampo('in-coordinador', 'Coordinador *',   'text', 'Nombre del coordinador') +
            _inCampo('in-municipio',   'Municipio *',     'text', 'Municipio de la jornada') +
          '</div>' +
          '<div class="flex justify-end">' +
            '<button onclick="_inValidarPaso1()"' +
              ' class="btn-primario text-white font-semibold text-sm px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-verde-oscuro active:scale-95 transition-all">' +
              'Continuar' +
              '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // ── PASO 2 ──
      '<div id="in-panel-2" class="bg-white rounded-2xl shadow-soft overflow-hidden mb-4 opacity-60">' +
        '<button onclick="_inTogglePanel(2)" class="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors">' +
          '<div class="flex items-center gap-3">' +
            '<span id="in-badge-2" class="w-7 h-7 rounded-full bg-slate-300 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">2</span>' +
            '<div>' +
              '<p class="font-semibold text-slate-700 text-sm">Seleccionar promotores</p>' +
              '<p id="in-resumen-2" class="text-xs text-slate-400 mt-0.5">Elige quiénes participaron</p>' +
            '</div>' +
          '</div>' +
          '<div class="flex items-center gap-2">' +
            '<span id="in-count-sel" class="text-[11px] text-slate-400 font-medium">0 seleccionados</span>' +
            '<svg id="in-arrow-2" class="w-4 h-4 text-slate-400 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
              '<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>' +
            '</svg>' +
          '</div>' +
        '</button>' +
        '<div id="in-body-2" class="px-6 pb-6 hidden">' +
          '<div class="relative mb-3">' +
            '<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
              '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>' +
            '</svg>' +
            '<input id="in-buscar-p" type="text" placeholder="Buscar promotor..." oninput="_inFiltrarPromotores()"' +
              ' class="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:border-verde-oscuro focus:ring-2 focus:ring-verde-oscuro/10 focus:bg-white transition-all">' +
          '</div>' +
          '<div id="in-lista-promotores" class="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto mb-3">' +
            '<div class="flex items-center justify-center gap-2 py-6 text-slate-400 text-sm">' +
              '<div class="spinner w-4 h-4"></div> Cargando...' +
            '</div>' +
          '</div>' +
          '<div class="flex items-center justify-between">' +
            '<div class="flex gap-3">' +
              '<button type="button" onclick="_inSelTodos()" class="text-xs text-verde-oscuro hover:underline font-semibold">Seleccionar todos</button>' +
              '<span class="text-slate-200">|</span>' +
              '<button type="button" onclick="_inDeselTodos()" class="text-xs text-slate-400 hover:underline font-semibold">Limpiar</button>' +
            '</div>' +
            '<button onclick="_inValidarPaso2()"' +
              ' class="btn-primario text-white font-semibold text-sm px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-verde-oscuro active:scale-95 transition-all">' +
              'Continuar' +
              '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // ── PASO 3 ──
      '<div id="in-panel-3" class="bg-white rounded-2xl shadow-soft overflow-hidden mb-4 opacity-60">' +
        '<button onclick="_inTogglePanel(3)" class="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors">' +
          '<div class="flex items-center gap-3">' +
            '<span id="in-badge-3" class="w-7 h-7 rounded-full bg-slate-300 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">3</span>' +
            '<div>' +
              '<p class="font-semibold text-slate-700 text-sm">Registrar conceptos</p>' +
              '<p id="in-resumen-3" class="text-xs text-slate-400 mt-0.5">AFF, brigadas, deducciones por promotor</p>' +
            '</div>' +
          '</div>' +
          '<svg id="in-arrow-3" class="w-4 h-4 text-slate-400 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
            '<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>' +
          '</svg>' +
        '</button>' +
        '<div id="in-body-3" class="hidden">' +
          '<div id="in-tabla-conceptos" class="px-0"></div>' +
          '<div class="px-6 pb-6">' +
            '<div id="in-error-carga" class="hidden mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium"></div>' +
            '<div id="in-exito-carga" class="hidden mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-semibold text-center"></div>' +
            '<div id="in-carga-overlay" class="hidden fixed inset-0 z-[200] items-center justify-center bg-slate-900/40 px-4" role="status" aria-live="polite">' +
              '<div class="bg-white rounded-2xl shadow-card px-8 py-7 text-center max-w-xs w-full">' +
                '<div class="spinner w-10 h-10 mx-auto mb-4 border-4"></div>' +
                '<p class="text-verde-oscuro font-bold text-base">Guardando nómina</p>' +
                '<p class="text-slate-500 text-xs mt-1">Espera mientras se registran los conceptos...</p>' +
              '</div>' +
            '</div>' +
            '<button id="in-btn-cargar" onclick="_inCargarNomina()"' +
              ' class="w-full btn-primario hover:bg-verde-oscuro active:scale-95 transition-all text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm">' +
              '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
                '<path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>' +
              '</svg>' +
              '<span id="in-btn-texto">Cargar nómina</span>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

    '</div>' + // fin modo cargar

    // ── MODO EDITAR ──
    '<div id="in-modo-editar" class="hidden">' +
      '<div class="bg-white rounded-2xl shadow-soft p-6 mb-4">' +
        '<h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Selecciona el promotor a editar</h4>' +
        '<div class="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-end mb-4">' +
          '<div>' +
            '<label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Promotor *</label>' +
            '<select id="in-edit-promotor"' +
              ' class="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:border-verde-oscuro focus:ring-2 focus:ring-verde-oscuro/10 focus:bg-white transition-all">' +
              '<option value="">Cargando...</option>' +
            '</select>' +
          '</div>' +
          '<button onclick="_inCargarNominaCompleta()"' +
            ' id="in-edit-btn-cargar"' +
            ' class="btn-primario hover:bg-verde-oscuro active:scale-95 transition-all text-white font-semibold text-sm px-6 py-2.5 rounded-xl">' +
            '<span id="in-edit-btn-texto">Cargar nómina</span>' +
          '</button>' +
        '</div>' +
        '<div class="flex justify-end mb-4">' +
          '<button onclick="_inObservarNominasGenerales()" id="in-btn-observar-generales"' +
            ' class="nomina-general-btn" type="button">' +
            'Observar nóminas en general' +
          '</button>' +
        '</div>' +
        '<div id="in-edit-resultado"></div>' +
        '<div id="in-general-resultado"></div>' +
      '</div>' +
    '</div>' +

  '</div>';
}

function _inStepIndicator(num, label) {
  return '<div class="flex flex-col items-center gap-1">' +
    '<div id="in-step-' + num + '" class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ' +
      (num === 1 ? 'bg-verde-oscuro text-white' : 'bg-slate-200 text-slate-400') + '">' + num + '</div>' +
    '<span class="text-[10px] text-slate-400 font-medium hidden sm:block">' + label + '</span>' +
  '</div>';
}

function _inNumeroEditable(valor, mantenerCeroEnAff) {
  if (valor === null || valor === undefined || valor === '') return mantenerCeroEnAff ? '0' : '';
  var n = Number(valor);
  if (Number.isNaN(n)) return mantenerCeroEnAff ? '0' : '';
  if (n === 0 && !mantenerCeroEnAff) return '';
  return String(n);
}

function _inNumeroPayload(id) {
  var input = document.getElementById(id);
  if (!input) return '';
  var valor = (input.value === undefined || input.value === null) ? '' : String(input.value).trim();
  if (valor === '') return '';
  var num = Number(valor);
  return Number.isNaN(num) ? '' : num;
}

function _inRenderZeroSafe(valor, mostrarCero) {
  if (valor === null || valor === undefined || valor === '') return mostrarCero ? '0' : '';
  var num = Number(valor);
  if (Number.isNaN(num)) return mostrarCero ? '0' : '';
  if (num === 0 && !mostrarCero) return '';
  return String(num);
}

/* ════════════════════════════════════════════════════════════
   LÓGICA DE PASOS
════════════════════════════════════════════════════════════ */

function _inIrPaso(paso) {
  _inPasoActual = paso;

  // Actualizar indicadores
  for (var p = 1; p <= 3; p++) {
    var step  = document.getElementById('in-step-' + p);
    var badge = document.getElementById('in-badge-' + p);
    var panel = document.getElementById('in-panel-' + p);
    var body  = document.getElementById('in-body-'  + p);
    var arrow = document.getElementById('in-arrow-' + p);

    if (!step || !panel) continue;

    var done    = p < paso;
    var active  = p === paso;

    // Indicador superior
    step.className = 'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ' +
      (done ? 'bg-emerald-500 text-white' : active ? 'bg-verde-oscuro text-white' : 'bg-slate-200 text-slate-400');
    step.innerHTML = done
      ? '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>'
      : p;

    // Badge dentro del acordeón
    if (badge) {
      badge.className = 'w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 transition-all ' +
        (done ? 'bg-emerald-500' : active ? 'bg-verde-oscuro' : 'bg-slate-300');
      badge.innerHTML = done
        ? '<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>'
        : p;
    }

    // Panel: opacidad y apertura
    panel.style.opacity = (done || active) ? '1' : '0.5';

    if (body) {
      if (active) {
        body.classList.remove('hidden');
        if (arrow) arrow.style.transform = 'rotate(180deg)';
      } else {
        body.classList.add('hidden');
        if (arrow) arrow.style.transform = 'rotate(0deg)';
      }
    }

    // Líneas de conexión
    var line = document.getElementById('in-line-' + p + '-' + (p + 1));
    if (line) {
      line.style.backgroundColor = p < paso ? '#10b981' : '#e2e8f0';
    }
  }
}

function _inTogglePanel(paso) {
  var body  = document.getElementById('in-body-'  + paso);
  var arrow = document.getElementById('in-arrow-' + paso);
  if (!body) return;
  var hidden = body.classList.toggle('hidden');
  if (arrow) arrow.style.transform = hidden ? 'rotate(0deg)' : 'rotate(180deg)';
}

function _inValidarPaso1() {
  var fecha       = (document.getElementById('in-fecha')       || {}).value || '';
  var coordinador = (document.getElementById('in-coordinador') || {}).value || '';
  var municipio   = (document.getElementById('in-municipio')   || {}).value || '';

  if (!fecha.trim() || !coordinador.trim() || !municipio.trim()) {
    _inFlashError('in-body-1', 'Completa fecha, coordinador y municipio.');
    return;
  }

  // Actualizar resumen del paso 1
  var partes = fecha.split('-');
  var fechaFmt = partes.length === 3 ? partes[2] + '/' + partes[1] + '/' + partes[0] : fecha;
  var res1 = document.getElementById('in-resumen-1');
  if (res1) res1.textContent = fechaFmt + ' · ' + coordinador + ' · ' + municipio;

  _inIrPaso(2);
}

function _inValidarPaso2() {
  var checks = document.querySelectorAll('#in-lista-promotores input[type="checkbox"]:checked');
  if (checks.length === 0) {
    _inFlashError('in-body-2', 'Selecciona al menos un promotor.');
    return;
  }

  _inSeleccionados = [];
  checks.forEach(function(c) {
    _inSeleccionados.push({ cedula: c.value, nombre: c.getAttribute('data-nombre') });
  });

  var res2 = document.getElementById('in-resumen-2');
  if (res2) res2.textContent = _inSeleccionados.length + ' promotor' + (_inSeleccionados.length !== 1 ? 'es' : '') + ' seleccionado' + (_inSeleccionados.length !== 1 ? 's' : '');

  _inGenerarTabla();
  _inIrPaso(3);
}

/* ════════════════════════════════════════════════════════════
   PASO 3 — Tabla de conceptos (inyectada en #in-tabla-conceptos)
════════════════════════════════════════════════════════════ */

function _inGenerarTabla() {
  var fecha       = (document.getElementById('in-fecha')       || {}).value || '';
  var coordinador = (document.getElementById('in-coordinador') || {}).value || '';
  var municipio   = (document.getElementById('in-municipio')   || {}).value || '';
  var partes      = fecha.split('-');
  var fechaFmt    = partes.length === 3 ? partes[2] + '/' + partes[1] + '/' + partes[0] : fecha;

  var res3 = document.getElementById('in-resumen-3');
  if (res3) res3.textContent = _inSeleccionados.length + ' promotores · ' + fechaFmt + ' · ' + municipio;

  var filasHtml = _inSeleccionados.map(function(p, idx) {
    return '<tr class="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">' +
      // Nombre
      '<td class="px-4 py-3 text-xs font-medium text-verde-oscuro min-w-[160px] max-w-[220px]">' +
        '<div class="font-semibold leading-tight break-words">' + p.nombre + '</div>' +
        '<div class="text-[10px] text-slate-400 font-normal">' + p.cedula + '</div>' +
      '</td>' +
      // AFF
      '<td class="px-2 py-2 text-center">' +
        '<input type="number" min="0" id="in-aff-' + idx + '" placeholder="0"' +
          ' class="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-center bg-slate-50 focus:outline-none focus:border-verde-oscuro focus:ring-1 focus:ring-verde-oscuro/20 focus:bg-white transition-all">' +
      '</td>' +
      // Brigadas
      '<td class="px-2 py-2 text-center">' +
        '<input type="number" min="0" id="in-brig-' + idx + '" placeholder="0"' +
          ' class="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-center bg-slate-50 focus:outline-none focus:border-verde-oscuro focus:ring-1 focus:ring-verde-oscuro/20 focus:bg-white transition-all">' +
      '</td>' +
      // Comida
      '<td class="px-2 py-2 text-center">' +
        '<input type="number" min="0" id="in-com-' + idx + '" placeholder="0"' +
          ' class="w-20 px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-center bg-slate-50 focus:outline-none focus:border-verde-oscuro focus:ring-1 focus:ring-verde-oscuro/20 focus:bg-white transition-all">' +
      '</td>' +
      // Préstamo
      '<td class="px-2 py-2 text-center">' +
        '<input type="number" min="0" id="in-prest-' + idx + '" placeholder="0"' +
          ' class="w-20 px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-center bg-slate-50 focus:outline-none focus:border-verde-oscuro focus:ring-1 focus:ring-verde-oscuro/20 focus:bg-white transition-all">' +
      '</td>' +
      // Tipo descuento
      '<td class="px-2 py-2 text-center">' +
        '<select id="in-tdesc-' + idx + '" onchange="_inToggleDesc(' + idx + ')"' +
          ' class="w-28 px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:border-verde-oscuro focus:bg-white transition-all">' +
          '<option value="hotel">P. Hotel</option>' +
          '<option value="manual">Manual</option>' +
          '<option value="ninguno">Sin desc.</option>' +
        '</select>' +
      '</td>' +
      // Monto desc (solo manual)
      '<td class="px-2 py-2 text-center">' +
        '<input type="number" min="0" id="in-mdesc-' + idx + '" placeholder="0" style="display:none"' +
          ' class="w-20 px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-center bg-slate-50 focus:outline-none focus:border-verde-oscuro focus:ring-1 focus:ring-verde-oscuro/20 focus:bg-white transition-all">' +
        '<span id="in-hotel-tag-' + idx + '" style="display:none"' +
          ' class="inline-block bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">AUTO</span>' +
        '<span id="in-ninguno-tag-' + idx + '"' +
          ' class="text-slate-300 text-xs">—</span>' +
      '</td>' +
      // Detalle
      '<td class="px-2 py-2">' +
        '<input type="text" id="in-det-' + idx + '" placeholder="Observación..."' +
          ' class="w-full min-w-[140px] px-2 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-verde-oscuro focus:ring-1 focus:ring-verde-oscuro/20 focus:bg-white transition-all">' +
      '</td>' +
    '</tr>';
  }).join('');

  var tabla = document.getElementById('in-tabla-conceptos');
  if (!tabla) return;

  tabla.innerHTML =
    '<div class="overflow-x-auto border-b border-slate-100">' +
      '<table class="w-full text-sm">' +
        '<thead>' +
          '<tr class="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 border-b border-slate-200">' +
            '<th class="px-4 py-3 text-left">Promotor</th>' +
            '<th class="px-2 py-3 text-center">AFF</th>' +
            '<th class="px-2 py-3 text-center">Brig.</th>' +
            '<th class="px-2 py-3 text-center">Comida</th>' +
            '<th class="px-2 py-3 text-center">Préstamo</th>' +
            '<th class="px-2 py-3 text-center">Descuento</th>' +
            '<th class="px-2 py-3 text-center">Monto</th>' +
            '<th class="px-2 py-3 text-left">Detalle / Obs.</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>' + filasHtml + '</tbody>' +
      '</table>' +
    '</div>';
}

function _inToggleDesc(idx) {
  var tipo      = (document.getElementById('in-tdesc-'      + idx) || {}).value || 'ninguno';
  var monto     = document.getElementById('in-mdesc-'     + idx);
  var hotelTag  = document.getElementById('in-hotel-tag-'  + idx);
  var ningunoTag= document.getElementById('in-ninguno-tag-'+ idx);

  if (monto)      monto.style.display      = tipo === 'manual' ? 'block'  : 'none';
  if (hotelTag)   hotelTag.style.display   = tipo === 'hotel'  ? 'inline' : 'none';
  if (ningunoTag) ningunoTag.style.display = tipo === 'ninguno'? 'inline' : 'none';
}

/* ════════════════════════════════════════════════════════════
   ENVÍO — Cargar nómina
════════════════════════════════════════════════════════════ */

async function _inCargarNomina() {
  var btn   = document.getElementById('in-btn-cargar');
  var texto = document.getElementById('in-btn-texto');
  var errEl = document.getElementById('in-error-carga');
  var okEl  = document.getElementById('in-exito-carga');
  var overlay = document.getElementById('in-carga-overlay');

  if (btn && btn.disabled) return;

  errEl.classList.add('hidden');
  okEl.classList.add('hidden');

  var fecha       = (document.getElementById('in-fecha')       || {}).value || '';
  var coordinador = (document.getElementById('in-coordinador') || {}).value || '';
  var municipio   = (document.getElementById('in-municipio')   || {}).value || '';

  if (!fecha.trim() || !coordinador.trim() || !municipio.trim() || _inSeleccionados.length === 0) {
    errEl.textContent = 'Faltan datos de la jornada o no hay promotores seleccionados.';
    errEl.classList.remove('hidden');
    return;
  }

  var registros = _inSeleccionados.map(function(p, idx) {
    var tipo  = (document.getElementById('in-tdesc-'  + idx) || {}).value || 'ninguno';
    var monto = _inNumeroPayload('in-mdesc-' + idx);
    var det   = ((document.getElementById('in-det-'   + idx) || {}).value || '').trim();
    return {
      cedula:          p.cedula,
      coordinador:     coordinador,
      municipio:       municipio,
      fecha:           fecha,
      aff:             _inNumeroPayload('in-aff-'   + idx),
      brigadas:        _inNumeroPayload('in-brig-'  + idx),
      comida:          _inNumeroPayload('in-com-'   + idx),
      prestamo:        _inNumeroPayload('in-prest-' + idx),
      tipoDescuento:   tipo,
      montoDescuento:  monto,
      detalle:         det
    };
  });

  btn.disabled = true;
  texto.textContent = 'Cargando...';
  if (overlay) {
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
  }

  try {
    var url  = window.API_URL + '?action=escribir-jornada&registros=' + encodeURIComponent(JSON.stringify(registros));
    var res  = await fetch(url);
    var data = await res.json();

    if (data.ok) {
      var exitosos = data.resultados.filter(function(r) { return r.ok; }).length;
      var fallidos = data.resultados.filter(function(r) { return !r.ok; });

      okEl.innerHTML = '✓ ' + exitosos + ' registro' + (exitosos !== 1 ? 's' : '') + ' guardado' + (exitosos !== 1 ? 's' : '') + ' correctamente.' +
        (fallidos.length > 0
          ? '<br><span class="text-blue-600 font-normal text-xs">' + fallidos.map(function(r) { return r.cedula + ': ' + r.error; }).join(' | ') + '</span>'
          : '');
      okEl.classList.remove('hidden');

      // Marcar paso 3 como completado visualmente
      var step3 = document.getElementById('in-step-3');
      var badge3 = document.getElementById('in-badge-3');
      if (step3) {
        step3.className = 'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all bg-emerald-500 text-white';
        step3.innerHTML = '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>';
      }
      if (badge3) {
        badge3.className = 'w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 transition-all bg-emerald-500';
        badge3.innerHTML = '<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>';
      }
    } else {
      var errores = (data.resultados || [])
        .filter(function(r) { return !r.ok; })
        .map(function(r) { return r.cedula + ': ' + r.error; }).join(' | ');
      errEl.textContent = errores || data.error || 'Error al guardar.';
      errEl.classList.remove('hidden');
    }
  } catch(err) {
    errEl.textContent = 'Error de conexión: ' + err.message;
    errEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    texto.textContent = 'Cargar nómina';
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.classList.remove('flex');
    }
  }
}

/* ════════════════════════════════════════════════════════════
   MODO EDITAR
════════════════════════════════════════════════════════════ */

function _inCambiarModo(modo) {
  _inModo = modo;
  document.getElementById('in-modo-cargar').classList.toggle('hidden', modo !== 'cargar');
  document.getElementById('in-modo-editar').classList.toggle('hidden', modo !== 'editar');

  var btnCargar = document.getElementById('tab-cargar');
  var btnEditar = document.getElementById('tab-editar');

  var clsActivo   = 'tab-btn-activo px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm';
  var clsInactivo = 'tab-btn-inactivo px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm';
  btnCargar.className = modo === 'cargar' ? clsActivo : clsInactivo;
  btnEditar.className = modo === 'editar' ? clsActivo : clsInactivo;

  btnCargar.style.background = modo === 'cargar' ? '#0f4b7d' : '#dfeaf6';
  btnCargar.style.border = '1px solid ' + (modo === 'cargar' ? '#0f4b7d' : '#dfeaf6');
  btnCargar.style.color = modo === 'cargar' ? '#ffffff' : '#0f4b7d';
  btnCargar.style.boxShadow = modo === 'cargar' ? '0 10px 18px -12px rgba(15,75,125,0.8)' : 'none';

  btnEditar.style.background = modo === 'editar' ? '#0f4b7d' : '#dfeaf6';
  btnEditar.style.border = '1px solid ' + (modo === 'editar' ? '#0f4b7d' : '#dfeaf6');
  btnEditar.style.color = modo === 'editar' ? '#ffffff' : '#0f4b7d';
  btnEditar.style.boxShadow = modo === 'editar' ? '0 10px 18px -12px rgba(15,75,125,0.8)' : 'none';

  if (modo === 'editar') {
    var sel = document.getElementById('in-edit-promotor');
    if (sel && _inPromotoresTodos.length > 0) {
      sel.innerHTML = '<option value="">Selecciona un promotor</option>' +
        _inPromotoresTodos.map(function(p) {
          return '<option value="' + p.cedula + '">' + p.nombre + '</option>';
        }).join('');
    }
  }
}

/* ════════════════════════════════════════════════════════════
   MODO EDITAR — Nómina completa del promotor
════════════════════════════════════════════════════════════ */

async function _inCargarNominaCompleta() {
  var cedula = (document.getElementById('in-edit-promotor') || {}).value || '';
  var resEl  = document.getElementById('in-edit-resultado');
  var btnEl  = document.getElementById('in-edit-btn-cargar');
  var txtEl  = document.getElementById('in-edit-btn-texto');

  if (!cedula) {
    resEl.innerHTML = '<div class="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">Selecciona un promotor.</div>';
    return;
  }

  resEl.innerHTML = '<div class="flex items-center gap-2 py-4 text-slate-400 text-sm"><div class="spinner w-4 h-4"></div> Cargando nómina completa...</div>';
  btnEl.disabled = true;
  txtEl.textContent = 'Cargando...';

  try {
    var url  = window.API_URL + '?cedula=' + encodeURIComponent(cedula);
    var res  = await fetch(url);
    var data = await res.json();

    if (data.error) {
      resEl.innerHTML = '<div class="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">' + data.error + '</div>';
      return;
    }

    var log = data.logDiario || [];

    if (log.length === 0) {
      resEl.innerHTML = '<div class="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">Este promotor no tiene registros de jornada.</div>';
      return;
    }

    // Renderizar tabla editable con TODOS los registros — misma estructura de columnas que el modo Cargar
    var filasHtml = log.map(function(reg, idx) {
      // Determinar tipo de descuento existente
      var tipoDesc = 'ninguno';
      if (reg.detalle && reg.detalle.toString().indexOf('P. Hotel') !== -1) tipoDesc = 'hotel';
      else if (reg.descuento && Number(reg.descuento) > 0) tipoDesc = 'manual';

      // Convertir fecha de dd/MM/yyyy a yyyy-MM-dd para el input type="date"
      var fechaInput = '';
      if (reg.fecha) {
        var p = reg.fecha.split('/');
        if (p.length === 3) fechaInput = p[2] + '-' + p[1] + '-' + p[0];
      }

      return '<tr id="in-ed-row-' + idx + '" class="border-b border-slate-100 hover:bg-slate-50/30 transition-colors">' +

        // Fecha (editable)
        '<td class="px-2 py-2">' +
          '<input type="date" id="in-ed-fecha-' + idx + '" value="' + fechaInput + '"' +
            ' data-fecha-original="' + (reg.fecha || '') + '"' +
            ' class="w-32 px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:border-verde-oscuro focus:ring-1 focus:ring-verde-oscuro/20 focus:bg-white transition-all">' +
        '</td>' +

        // Coordinador (editable)
        '<td class="px-2 py-2">' +
          '<input type="text" id="in-ed-coord-' + idx + '" value="' + _inEsc(reg.coordinador || '') + '" placeholder="Coordinador"' +
            ' class="w-32 px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:border-verde-oscuro focus:ring-1 focus:ring-verde-oscuro/20 focus:bg-white transition-all">' +
        '</td>' +

        // Municipio (editable)
        '<td class="px-2 py-2">' +
          '<input type="text" id="in-ed-mun-' + idx + '" value="' + _inEsc(reg.municipio || '') + '" placeholder="Municipio"' +
            ' class="w-28 px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:border-verde-oscuro focus:ring-1 focus:ring-verde-oscuro/20 focus:bg-white transition-all">' +
        '</td>' +

        // AFF (editable)
        '<td class="px-2 py-2 text-center">' +
          '<input type="number" min="0" id="in-ed-aff-' + idx + '" value="' + _inNumeroEditable(reg.aff, true) + '"' +
            ' class="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center bg-slate-50 focus:outline-none focus:border-verde-oscuro focus:ring-1 focus:ring-verde-oscuro/20 focus:bg-white transition-all">' +
        '</td>' +

        // Brigadas (editable)
        '<td class="px-2 py-2 text-center">' +
          '<input type="number" min="0" id="in-ed-brig-' + idx + '" value="' + _inNumeroEditable(reg.brig, false) + '"' +
            ' class="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center bg-slate-50 focus:outline-none focus:border-verde-oscuro focus:ring-1 focus:ring-verde-oscuro/20 focus:bg-white transition-all">' +
        '</td>' +

        // Comida (editable)
        '<td class="px-2 py-2 text-center">' +
          '<input type="number" min="0" id="in-ed-com-' + idx + '" value="' + _inNumeroEditable(reg.comida, false) + '"' +
            ' class="w-20 px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center bg-slate-50 focus:outline-none focus:border-verde-oscuro focus:ring-1 focus:ring-verde-oscuro/20 focus:bg-white transition-all">' +
        '</td>' +

        // Préstamo (editable)
        '<td class="px-2 py-2 text-center">' +
          '<input type="number" min="0" id="in-ed-prest-' + idx + '" value="' + _inNumeroEditable(reg.prestamo, false) + '"' +
            ' class="w-20 px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center bg-slate-50 focus:outline-none focus:border-verde-oscuro focus:ring-1 focus:ring-verde-oscuro/20 focus:bg-white transition-all">' +
        '</td>' +

        // Tipo descuento
        '<td class="px-2 py-2 text-center">' +
          '<select id="in-ed-tdesc-' + idx + '" onchange="_inEdToggleDesc(' + idx + ')"' +
            ' class="w-24 px-1 py-1.5 border border-slate-200 rounded-lg text-[11px] bg-slate-50 focus:outline-none focus:border-verde-oscuro focus:bg-white transition-all">' +
            '<option value="hotel"'  + (tipoDesc === 'hotel'   ? ' selected' : '') + '>P. Hotel</option>' +
            '<option value="manual"' + (tipoDesc === 'manual'  ? ' selected' : '') + '>Manual</option>' +
            '<option value="ninguno"' + (tipoDesc === 'ninguno' ? ' selected' : '') + '>Sin desc.</option>' +
          '</select>' +
        '</td>' +

        // Monto descuento (solo manual)
        '<td class="px-2 py-2 text-center">' +
          '<input type="number" min="0" id="in-ed-mdesc-' + idx + '" value="' + _inNumeroEditable(reg.descuento, false) + '"' +
            (tipoDesc !== 'manual' ? ' style="display:none"' : '') +
            ' class="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center bg-slate-50 focus:outline-none focus:border-verde-oscuro focus:ring-1 focus:ring-verde-oscuro/20 focus:bg-white transition-all">' +
          '<span id="in-ed-hotel-' + idx + '"' + (tipoDesc === 'hotel' ? '' : ' style="display:none"') +
            ' class="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-full">AUTO</span>' +
          '<span id="in-ed-nin-' + idx + '"' + (tipoDesc === 'ninguno' ? '' : ' style="display:none"') +
            ' class="text-slate-300 text-xs">—</span>' +
        '</td>' +

        // Detalle (editable)
        '<td class="px-2 py-2">' +
          '<input type="text" id="in-ed-det-' + idx + '" value="' + _inEsc(tipoDesc !== 'hotel' ? (reg.detalle || '') : '') + '"' +
            ' placeholder="Observación..."' +
            ' class="w-full min-w-[120px] px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:border-verde-oscuro focus:ring-1 focus:ring-verde-oscuro/20 focus:bg-white transition-all">' +
        '</td>' +

        // Botones de acción de fila
        '<td class="px-2 py-2 text-center">' +
          '<div class="flex items-center justify-center gap-2">' +
            '<button onclick="_inGuardarFilaEdicion(' + idx + ',\'' + cedula + '\')"' +
              ' id="in-ed-save-' + idx + '"' +
              ' class="text-[11px] font-bold px-3 py-1.5 rounded-lg btn-primario text-white hover:bg-verde-oscuro transition-colors">' +
              '<span id="in-ed-save-txt-' + idx + '">Guardar</span>' +
            '</button>' +
            '<button type="button" onclick="_inSuprimirFilaEdicion(' + idx + ',\'' + cedula + '\')"' +
              ' class="text-[11px] font-bold px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors">' +
              'Suprimir' +
            '</button>' +
          '</div>' +
        '</td>' +

      '</tr>';
    }).join('');

    resEl.innerHTML =
      '<div class="mt-2">' +
        '<div class="flex items-center justify-between mb-3">' +
          '<p class="text-sm font-semibold text-verde-oscuro">' + _inEsc(data.nombre) + '</p>' +
          '<span class="text-xs text-slate-400">' + log.length + ' registros</span>' +
        '</div>' +
        '<div id="in-ed-msg" class="hidden mb-3 px-4 py-2.5 rounded-xl text-xs font-semibold"></div>' +
        '<div class="overflow-x-auto rounded-xl border border-slate-200">' +
          '<table class="w-full text-sm">' +
            '<thead>' +
              '<tr class="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 border-b border-slate-200">' +
                '<th class="px-2 py-2.5 text-left">Fecha</th>' +
                '<th class="px-2 py-2.5 text-left">Coordinador</th>' +
                '<th class="px-2 py-2.5 text-left">Municipio</th>' +
                '<th class="px-2 py-2.5 text-center">AFF</th>' +
                '<th class="px-2 py-2.5 text-center">Brig.</th>' +
                '<th class="px-2 py-2.5 text-center">Comida</th>' +
                '<th class="px-2 py-2.5 text-center">Préstamo</th>' +
                '<th class="px-2 py-2.5 text-center">Descuento</th>' +
                '<th class="px-2 py-2.5 text-center">Monto</th>' +
                '<th class="px-2 py-2.5 text-left">Detalle</th>' +
                '<th class="px-2 py-2.5 text-center">Acción</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' + filasHtml + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>';

  } catch(err) {
    resEl.innerHTML = '<div class="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">Error: ' + _inEsc(err.message) + '</div>';
  } finally {
    btnEl.disabled = false;
    txtEl.textContent = 'Cargar nómina';
  }
}

async function _inObservarNominasGenerales() {
  var resultado = document.getElementById('in-general-resultado');
  var boton = document.getElementById('in-btn-observar-generales');
  if (!resultado || !boton) return;

  if (!_inPromotoresTodos.length) {
    resultado.innerHTML = '<div class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">No hay promotores disponibles.</div>';
    return;
  }

  boton.disabled = true;
  boton.textContent = 'Cargando nóminas...';
  resultado.innerHTML = '<div class="mt-3 flex items-center gap-2 py-6 text-slate-400 text-sm"><div class="spinner w-4 h-4"></div> Consultando nóminas de todos los promotores...</div>';

  try {
    var consultas = _inPromotoresTodos.map(function(promotor) {
      var cedula = (promotor.cedula || '').toString().trim();
      return fetch(window.API_URL + '?cedula=' + encodeURIComponent(cedula))
        .then(function(res) { return res.json(); })
        .then(function(data) {
          return {
            nombre: (promotor.nombre || 'Promotor').toString().trim(),
            cedula: cedula,
            registros: data.error ? [] : (data.logDiario || []),
            error: data.error || ''
          };
        })
        .catch(function() {
          return {
            nombre: (promotor.nombre || 'Promotor').toString().trim(),
            cedula: cedula,
            registros: [],
            error: 'No se pudo consultar esta nómina.'
          };
        });
    });

    var nominas = await Promise.all(consultas);
    _inRenderNominasGenerales(nominas);
  } catch (err) {
    resultado.innerHTML = '<div class="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">No se pudieron cargar las nóminas generales.</div>';
  } finally {
    boton.disabled = false;
    boton.textContent = 'Observar nóminas en general';
  }
}

function _inRenderNominasGenerales(nominas) {
  var resultado = document.getElementById('in-general-resultado');
  if (!resultado) return;

  var botones = nominas.map(function(nomina, idx) {
    return '<button type="button" onclick="_inMostrarNominaGeneral(' + idx + ')" id="in-general-tab-' + idx + '"' +
      ' class="in-general-tab shrink-0 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ' +
      (idx === 0 ? 'text-verde-oscuro border-verde-oscuro tab-activo font-bold' : 'text-slate-500 border-transparent hover:text-verde-oscuro') + '" data-activo="' + (idx === 0 ? 'true' : 'false') + '">' +
      _inEsc(nomina.nombre) +
      '</button>';
  }).join('');

  var paneles = nominas.map(function(nomina, idx) {
    return '<div id="in-general-panel-' + idx + '" class="' + (idx === 0 ? '' : 'hidden') + '">' +
      '<div class="flex items-center justify-between mb-3">' +
        '<p class="text-sm font-semibold text-verde-oscuro">' + _inEsc(nomina.nombre) + '</p>' +
        '<span class="text-xs text-slate-400">' + nomina.registros.length + ' registros</span>' +
      '</div>' +
      (nomina.error
        ? '<div class="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">' + _inEsc(nomina.error) + '</div>'
        : _inTablaNominaGeneral(nomina.registros)) +
    '</div>';
  }).join('');

  resultado.innerHTML =
    '<div class="mt-5 pt-5 border-t border-slate-200">' +
      '<div class="flex items-center justify-between mb-3">' +
        '<h4 class="text-sm font-bold text-slate-700">Nóminas generales</h4>' +
        '<span class="text-xs text-slate-400">' + nominas.length + ' promotores</span>' +
      '</div>' +
      '<div class="overflow-x-auto border-b border-slate-200 mb-4"><div class="flex gap-1 min-w-max">' + botones + '</div></div>' +
      '<div>' + paneles + '</div>' +
    '</div>';
}

function _inMostrarNominaGeneral(idx) {
  document.querySelectorAll('[id^="in-general-tab-"]').forEach(function(tab, tabIdx) {
    var activo = tabIdx === idx;
    tab.classList.toggle('text-verde-oscuro', activo);
    tab.classList.toggle('border-verde-oscuro', activo);
    tab.classList.toggle('font-bold', activo);
    tab.classList.toggle('tab-activo', activo);
    tab.classList.toggle('text-slate-500', !activo);
    tab.classList.toggle('border-transparent', !activo);
    tab.setAttribute('data-activo', activo ? 'true' : 'false');
  });
  document.querySelectorAll('[id^="in-general-panel-"]').forEach(function(panel, panelIdx) {
    panel.classList.toggle('hidden', panelIdx !== idx);
  });
}

function _inTablaNominaGeneral(registros) {
  if (!registros.length) {
    return '<div class="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">Este promotor no tiene registros de jornada.</div>';
  }

  var filas = registros.map(function(registro) {
    var aff = Number(registro.aff || 0);
    var brig = Number(registro.brig || 0);
    var comida = Number(registro.comida || 0);
    var prestamo = Number(registro.prestamo || 0);
    var descuento = Number(registro.descuento || 0);

    return '<tr class="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">' +
      '<td class="px-3 py-2 text-xs font-semibold text-slate-700 whitespace-nowrap">' + _inEsc(registro.fecha || '') + '</td>' +
      '<td class="px-3 py-2 text-xs text-slate-600 whitespace-nowrap">' + _inEsc(registro.coordinador || '') + '</td>' +
      '<td class="px-3 py-2 text-xs text-slate-600 whitespace-nowrap">' + _inEsc(registro.municipio || '') + '</td>' +
      '<td class="px-3 py-2 text-xs text-center whitespace-nowrap">' +
        (aff > 0 ? '<span class="inline-flex items-center justify-center min-w-[26px] rounded-full bg-verde-suave text-verde-oscuro px-2 py-1 font-bold">' + aff + '</span>' : '<span class="text-slate-400">0</span>') +
      '</td>' +
      '<td class="px-3 py-2 text-xs text-center font-semibold text-verde-oscuro whitespace-nowrap">' + _inEsc(_inRenderZeroSafe(brig, false)) + '</td>' +
      '<td class="px-3 py-2 text-xs text-center text-slate-600 whitespace-nowrap">' + _inEsc(_inRenderZeroSafe(comida, false)) + '</td>' +
      '<td class="px-3 py-2 text-xs text-center font-semibold whitespace-nowrap ' + (prestamo > 0 ? 'text-rojo' : 'text-slate-500') + '">' + _inEsc(_inRenderZeroSafe(prestamo, false)) + '</td>' +
      '<td class="px-3 py-2 text-xs text-center font-semibold whitespace-nowrap ' + (descuento > 0 ? 'text-rojo' : 'text-slate-500') + '">' + _inEsc(_inRenderZeroSafe(descuento, false)) + '</td>' +
      '<td class="px-3 py-2 text-xs text-slate-600 whitespace-normal break-words">' + _inEsc(registro.detalle || '') + '</td>' +
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

/* Muestra/oculta monto en cada fila del modo editar */
function _inEdToggleDesc(idx) {
  var tipo    = (document.getElementById('in-ed-tdesc-'  + idx) || {}).value || 'ninguno';
  var monto   = document.getElementById('in-ed-mdesc-' + idx);
  var hotel   = document.getElementById('in-ed-hotel-'  + idx);
  var nin     = document.getElementById('in-ed-nin-'    + idx);
  if (monto) monto.style.display = tipo === 'manual' ? 'inline-block' : 'none';
  if (hotel) hotel.style.display = tipo === 'hotel'  ? 'inline'       : 'none';
  if (nin)   nin.style.display   = tipo === 'ninguno' ? 'inline'       : 'none';
}

/* Guarda una sola fila de la tabla editable */
async function _inGuardarFilaEdicion(idx, cedula) {
  var btnEl = document.getElementById('in-ed-save-'     + idx);
  var txtEl = document.getElementById('in-ed-save-txt-' + idx);
  var msgEl = document.getElementById('in-ed-msg');

  // Leer fecha original del atributo data y la nueva del input
  var fechaInput = (document.getElementById('in-ed-fecha-' + idx) || {}).value || '';
  // El GAS espera la fecha en formato YYYY-MM-DD para editar-registro
  var fechaOriginal = (document.getElementById('in-ed-fecha-' + idx) || {}).getAttribute('data-fecha-original') || '';

  if (!fechaOriginal) {
    if (msgEl) { msgEl.textContent = 'Fila ' + (idx + 1) + ': no se encontró la fecha original del registro.'; msgEl.className = 'mb-3 px-4 py-2.5 rounded-xl text-xs font-semibold bg-red-50 border border-red-200 text-red-700'; msgEl.classList.remove('hidden'); }
    return;
  }

  // Convertir fecha original dd/MM/yyyy → YYYY-MM-DD para enviar al GAS
  var partes = fechaOriginal.split('/');
  var fechaParaGas = partes.length === 3 ? partes[2] + '-' + partes[1] + '-' + partes[0] : fechaOriginal;

  var tipo  = (document.getElementById('in-ed-tdesc-' + idx) || {}).value || 'ninguno';
  var monto = parseFloat((document.getElementById('in-ed-mdesc-' + idx) || {}).value || '0') || 0;

  btnEl.disabled = true;
  txtEl.textContent = '...';

  try {
    var url = window.API_URL
      + '?action=editar-registro'
      + '&cedula='         + encodeURIComponent(cedula)
      + '&fecha='          + encodeURIComponent(fechaParaGas)
      + '&coordinador='    + encodeURIComponent((document.getElementById('in-ed-coord-' + idx) || {}).value || '')
      + '&municipio='      + encodeURIComponent((document.getElementById('in-ed-mun-'   + idx) || {}).value || '')
      + '&aff='            + encodeURIComponent(_inNumeroPayload('in-ed-aff-'   + idx))
      + '&brigadas='       + encodeURIComponent(_inNumeroPayload('in-ed-brig-'  + idx))
      + '&comida='         + encodeURIComponent(_inNumeroPayload('in-ed-com-'   + idx))
      + '&prestamo='       + encodeURIComponent(_inNumeroPayload('in-ed-prest-' + idx))
      + '&tipoDescuento='  + encodeURIComponent(tipo)
      + '&montoDescuento=' + encodeURIComponent(monto)
      + '&detalle='        + encodeURIComponent((document.getElementById('in-ed-det-'   + idx) || {}).value || '');

    var res  = await fetch(url);
    var data = await res.json();

    if (data.ok) {
      // Feedback visual en la fila: borde verde momentáneo
      var row = document.getElementById('in-ed-row-' + idx);
      if (row) {
        row.classList.add('bg-emerald-50');
        setTimeout(function() { if (row) row.classList.remove('bg-emerald-50'); }, 1500);
      }
      // Actualizar fecha original al nuevo valor si cambió
      var fechaInputEl = document.getElementById('in-ed-fecha-' + idx);
      if (fechaInputEl && fechaInput) {
        var np = fechaInput.split('-');
        if (np.length === 3) fechaInputEl.setAttribute('data-fecha-original', np[2] + '/' + np[1] + '/' + np[0]);
      }
      if (msgEl) { msgEl.textContent = '✓ Fila ' + (idx + 1) + ' guardada (fila ' + data.fila + ' en la hoja).'; msgEl.className = 'mb-3 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700'; msgEl.classList.remove('hidden'); setTimeout(function() { if (msgEl) msgEl.classList.add('hidden'); }, 3000); }
    } else {
      if (msgEl) { msgEl.textContent = 'Error fila ' + (idx + 1) + ': ' + (data.error || 'No se pudo guardar.'); msgEl.className = 'mb-3 px-4 py-2.5 rounded-xl text-xs font-semibold bg-red-50 border border-red-200 text-red-700'; msgEl.classList.remove('hidden'); }
    }
  } catch(err) {
    if (msgEl) { msgEl.textContent = 'Error de conexión: ' + err.message; msgEl.className = 'mb-3 px-4 py-2.5 rounded-xl text-xs font-semibold bg-red-50 border border-red-200 text-red-700'; msgEl.classList.remove('hidden'); }
  } finally {
    btnEl.disabled = false;
    txtEl.textContent = 'Guardar';
  }
}

async function _inSuprimirFilaEdicion(idx, cedula) {
  var msgEl = document.getElementById('in-ed-msg');
  var fechaOriginal = (document.getElementById('in-ed-fecha-' + idx) || {}).getAttribute('data-fecha-original') || '';

  if (!fechaOriginal) {
    if (msgEl) {
      msgEl.textContent = 'No se encontró la fecha del registro para suprimir.';
      msgEl.className = 'mb-3 px-4 py-2.5 rounded-xl text-xs font-semibold bg-red-50 border border-red-200 text-red-700';
      msgEl.classList.remove('hidden');
    }
    return;
  }

  if (!confirm('¿Deseas suprimir este registro de nómina? Se limpiará el contenido sin borrar la fila ni mover fórmulas.')) {
    return;
  }

  var partes = fechaOriginal.split('/');
  var fechaParaGas = partes.length === 3 ? partes[2] + '-' + partes[1] + '-' + partes[0] : fechaOriginal;

  try {
    var url = window.API_URL
      + '?action=suprimir-registro'
      + '&cedula=' + encodeURIComponent(cedula)
      + '&fecha=' + encodeURIComponent(fechaParaGas);

    var res = await fetch(url);
    var data = await res.json();

    if (data.ok) {
      var row = document.getElementById('in-ed-row-' + idx);
      if (row) {
        row.classList.add('bg-slate-100', 'opacity-60');
      }
      var ids = ['in-ed-coord-', 'in-ed-mun-', 'in-ed-aff-', 'in-ed-brig-', 'in-ed-com-', 'in-ed-prest-', 'in-ed-tdesc-', 'in-ed-mdesc-', 'in-ed-det-'];
      ids.forEach(function(prefix) {
        var el = document.getElementById(prefix + idx);
        if (el) {
          if (el.tagName === 'INPUT' || el.tagName === 'SELECT') {
            el.value = '';
          }
        }
      });
      var fechaInputEl = document.getElementById('in-ed-fecha-' + idx);
      if (fechaInputEl) {
        fechaInputEl.value = '';
        fechaInputEl.setAttribute('data-fecha-original', '');
      }
      if (msgEl) {
        msgEl.textContent = '✓ Registro suprimido sin mover la fila.';
        msgEl.className = 'mb-3 px-4 py-2.5 rounded-xl text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-700';
        msgEl.classList.remove('hidden');
        setTimeout(function() { if (msgEl) msgEl.classList.add('hidden'); }, 3000);
      }
    } else {
      if (msgEl) {
        msgEl.textContent = 'No se pudo suprimir: ' + (data.error || 'Error desconocido');
        msgEl.className = 'mb-3 px-4 py-2.5 rounded-xl text-xs font-semibold bg-red-50 border border-red-200 text-red-700';
        msgEl.classList.remove('hidden');
      }
    }
  } catch (err) {
    if (msgEl) {
      msgEl.textContent = 'Error de conexión al suprimir: ' + err.message;
      msgEl.className = 'mb-3 px-4 py-2.5 rounded-xl text-xs font-semibold bg-red-50 border border-red-200 text-red-700';
      msgEl.classList.remove('hidden');
    }
  }
}

/* Helper de escape para el modo editar */
function _inEsc(val) {
  return String(val == null ? '' : val).replace(/[&<>"']/g, function(c) {
    return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c];
  });
}

/* ════════════════════════════════════════════════════════════
   HELPERS — Promotores
════════════════════════════════════════════════════════════ */

function _inCargarPromotores() {
  var sel = document.getElementById('in-edit-promotor');

  PromotoresService.getAll()
    .then(function(list) {
      _inPromotoresTodos = list || [];
      _inRenderListaPromotores(_inPromotoresTodos);

      if (sel) {
        if (_inPromotoresTodos.length > 0) {
          sel.innerHTML = '<option value="">Selecciona un promotor</option>' + _inPromotoresTodos.map(function(p) {
            return '<option value="' + (p.cedula || '').toString().trim() + '">' + (p.nombre || '').toString().trim() + '</option>';
          }).join('');
        } else {
          sel.innerHTML = '<option value="">No hay promotores disponibles</option>';
        }
      }
    })
    .catch(function(err) {
      var lista = document.getElementById('in-lista-promotores');
      if (lista) lista.innerHTML = '<div class="px-4 py-3 text-sm text-red-500 text-center">Error cargando promotores: ' + (err && err.message ? err.message : '') + '</div>';
      if (sel) sel.innerHTML = '<option value="">No se pudo cargar la lista</option>';
    });
}

function _inRenderListaPromotores(promotores) {
  var lista = document.getElementById('in-lista-promotores');
  if (!lista) return;
  if (!promotores || promotores.length === 0) {
    lista.innerHTML = '<div class="px-4 py-4 text-sm text-slate-400 text-center">No hay promotores disponibles.</div>';
    return;
  }
  lista.innerHTML = promotores.map(function(p) {
    var id = 'in-chk-' + p.cedula.replace(/\W/g, '_');
    return '<label class="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors" for="' + id + '">' +
      '<input type="checkbox" id="' + id + '" value="' + p.cedula + '" data-nombre="' + p.nombre + '"' +
        ' onchange="_inActContador()" class="w-4 h-4 rounded border-slate-300 cursor-pointer flex-shrink-0">' +
      '<span class="text-sm text-slate-700 flex-1">' + p.nombre + '</span>' +
      '<span class="text-xs text-slate-400">' + p.cedula + '</span>' +
    '</label>';
  }).join('');
}

function _inFiltrarPromotores() {
  var q = ((document.getElementById('in-buscar-p') || {}).value || '').toLowerCase().trim();
  if (!q) { _inRenderListaPromotores(_inPromotoresTodos); return; }
  _inRenderListaPromotores(_inPromotoresTodos.filter(function(p) {
    return p.nombre.toLowerCase().includes(q) || p.cedula.includes(q);
  }));
}

function _inActContador() {
  var checks = document.querySelectorAll('#in-lista-promotores input[type="checkbox"]:checked');
  var el = document.getElementById('in-count-sel');
  if (el) el.textContent = checks.length + ' seleccionado' + (checks.length !== 1 ? 's' : '');
}

function _inSelTodos() {
  document.querySelectorAll('#in-lista-promotores input[type="checkbox"]').forEach(function(c) { c.checked = true; });
  _inActContador();
}

function _inDeselTodos() {
  document.querySelectorAll('#in-lista-promotores input[type="checkbox"]').forEach(function(c) { c.checked = false; });
  _inActContador();
}

/* ════════════════════════════════════════════════════════════
   HELPERS — UI
════════════════════════════════════════════════════════════ */

function _inCampo(id, label, tipo, placeholder) {
  return '<div>' +
    '<label for="' + id + '" class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">' + label + '</label>' +
    '<input type="' + tipo + '" id="' + id + '"' +
      (placeholder ? ' placeholder="' + placeholder + '"' : '') +
      ' class="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:border-verde-oscuro focus:ring-2 focus:ring-verde-oscuro/10 focus:bg-white transition-all">' +
  '</div>';
}

function _inCampoEdit(id, label, tipo, valor) {
  return '<div>' +
    '<label for="' + id + '" class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">' + label + '</label>' +
    '<input type="' + tipo + '" id="' + id + '" value="' + valor + '"' +
      ' class="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-verde-oscuro focus:ring-2 focus:ring-verde-oscuro/10 transition-all">' +
  '</div>';
}

function _inFlashError(bodyId, msg) {
  var body = document.getElementById(bodyId);
  if (!body) { alert(msg); return; }
  var prev = body.querySelector('.in-flash-err');
  if (prev) prev.remove();
  var div = document.createElement('div');
  div.className = 'in-flash-err mt-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium';
  div.textContent = msg;
  body.insertBefore(div, body.querySelector('.flex.justify-end') || body.lastChild);
  setTimeout(function() { if (div.parentNode) div.remove(); }, 4000);
}
