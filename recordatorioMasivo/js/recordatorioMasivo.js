// ── Estado interno (prefijo _rm) ───────────────────────────
var _rmMunicipios      = [];
var _rmMunicipioActivo = null;
var _rmDatosActivos    = null;
var _rmTabActiva       = 'consulta';
var _rmEditandoId      = null;
var _rmEnviando        = false;   // bloquea doble clic en envío masivo
var _rmEstados         = {};      // { telfLimpio: 'pendiente'|'enviado'|'error' }

// ══════════════════════════════════════════════════════════════
// PUNTO DE ENTRADA
// ══════════════════════════════════════════════════════════════

function renderRecordatorioMasivo() {
  var contenedor = document.getElementById('admin-content');
  if (!contenedor) return;

  _rmMunicipios      = RecordatorioMasivoService.listarMunicipios();
  _rmMunicipioActivo = null;
  _rmDatosActivos    = null;
  _rmTabActiva       = 'consulta';
  _rmEditandoId      = null;
  _rmEnviando        = false;
  _rmEstados         = {};

  contenedor.innerHTML = _rmShellHtml();
  _rmRenderizarTabla();
}

// ══════════════════════════════════════════════════════════════
// HTML PRINCIPAL
// ══════════════════════════════════════════════════════════════

function _rmShellHtml() {
  var modoTag = MetaConfig.MODO_SIMULADO
    ? '<span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 ml-2">⚡ Modo Simulado</span>'
    : '<span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 ml-2">✅ API Real</span>';

  return '<div class="max-w-5xl mx-auto px-4 py-8 fade-in" id="rm-root">' +

    // Encabezado
    '<div class="mb-6">' +
      '<div class="flex items-center justify-between flex-wrap gap-3">' +
        '<div>' +
          '<h1 class="text-verde-oscuro font-bold text-xl sm:text-2xl flex items-center gap-2">' +
            '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
              '<path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>' +
            '</svg>' +
            'Recordatorio Masivo' + modoTag +
          '</h1>' +
          '<p class="text-slate-500 text-sm mt-1">Envío masivo de recordatorios por WhatsApp vía API de Meta.</p>' +
        '</div>' +
        '<button onclick="rmAbrirModalAgregar()" ' +
          'class="btn-primario flex items-center gap-2 px-4 py-2.5 rounded-md-plus text-white text-sm font-semibold hover:bg-verde-oscuro active:scale-95 transition-all">' +
          '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
            '<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>' +
          '</svg>' +
          'Agregar Municipio' +
        '</button>' +
      '</div>' +
    '</div>' +

    // Banner modo simulado
    (MetaConfig.MODO_SIMULADO
      ? '<div class="mb-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">' +
          '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
            '<path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>' +
          '</svg>' +
          '<div><strong>Modo Simulado activo.</strong> Los mensajes NO se envían a Meta. ' +
          'Para activar el envío real, actualiza las credenciales en <code class="font-mono bg-amber-100 px-1 rounded">metaConfig.js</code> ' +
          'y cambia <code class="font-mono bg-amber-100 px-1 rounded">MODO_SIMULADO: false</code>.</div>' +
        '</div>'
      : '') +

    // Estado vacío
    '<div id="rm-estado-vacio" class="hidden">' +
      '<div class="bg-white rounded-md-plus shadow-card p-10 text-center">' +
        '<div class="w-14 h-14 rounded-full bg-verde-suave flex items-center justify-center mx-auto mb-4">' +
          '<svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-verde-oscuro" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">' +
            '<path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>' +
          '</svg>' +
        '</div>' +
        '<h3 class="font-bold text-verde-oscuro text-base mb-1">Sin municipios registrados</h3>' +
        '<p class="text-slate-400 text-sm mb-4">Agrega el primer municipio para comenzar con el envío masivo.</p>' +
        '<button onclick="rmAbrirModalAgregar()" class="btn-primario px-5 py-2 rounded-md-plus text-white text-sm font-semibold hover:bg-verde-oscuro transition-all">Agregar Municipio</button>' +
      '</div>' +
    '</div>' +

    // Tabla de municipios
    '<div id="rm-tabla-wrap">' +
      '<div class="bg-white rounded-md-plus shadow-card overflow-hidden">' +
        '<div class="px-5 py-3 border-b border-slate-100 flex items-center justify-between">' +
          '<span class="text-sm font-semibold text-verde-oscuro">Municipios registrados</span>' +
          '<span id="rm-contador" class="text-xs text-slate-400 font-medium">0 municipios</span>' +
        '</div>' +
        '<div class="overflow-x-auto">' +
          '<table class="w-full text-sm">' +
            '<thead>' +
              '<tr class="bg-slate-50 text-[11px] uppercase text-slate-400 font-semibold tracking-wide">' +
                '<th class="text-left px-5 py-3">Municipio</th>' +
                '<th class="text-left px-5 py-3">Fecha de Atención</th>' +
                '<th class="text-left px-5 py-3">ID Hoja</th>' +
                '<th class="text-left px-5 py-3">Estado</th>' +
                '<th class="text-right px-5 py-3">Acciones</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody id="rm-tabla-body" class="divide-y divide-slate-100"></tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +
    '</div>' +

    // Panel detalle
    '<div id="rm-panel-datos" class="hidden"></div>' +

    // ── MODAL: Agregar/Editar Municipio ───────────────────────
    '<div id="rm-modal-overlay" ' +
      'class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm hidden" ' +
      'onclick="rmCerrarModal(event)">' +
      '<div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6" onclick="event.stopPropagation()">' +
        '<div class="flex items-center justify-between mb-5">' +
          '<h2 id="rm-modal-titulo" class="font-bold text-verde-oscuro text-base">Agregar Municipio</h2>' +
          '<button onclick="rmCerrarModal()" class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">' +
            '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
              '<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>' +
            '</svg>' +
          '</button>' +
        '</div>' +
        '<form id="rm-form-municipio" onsubmit="rmGuardarMunicipio(event)" novalidate>' +
          '<div class="mb-4">' +
            '<label class="block text-[11px] uppercase text-slate-400 font-semibold mb-1.5">Nombre / Identificador <span class="text-red-400">*</span></label>' +
            '<input type="text" id="rm-input-municipio" required placeholder="Ej: Maracaibo..." ' +
              'class="w-full px-4 py-2.5 rounded-[12px] border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-verde-oscuro/30 focus:border-verde-oscuro transition-all">' +
          '</div>' +
          '<div class="mb-4">' +
            '<label class="block text-[11px] uppercase text-slate-400 font-semibold mb-1.5">Fecha de Atención <span class="text-red-400">*</span></label>' +
            '<input type="date" id="rm-input-fecha" required ' +
              'class="w-full px-4 py-2.5 rounded-[12px] border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-verde-oscuro/30 focus:border-verde-oscuro transition-all">' +
          '</div>' +
          '<div class="mb-5">' +
            '<label class="block text-[11px] uppercase text-slate-400 font-semibold mb-1.5">ID de la Hoja de Cálculo <span class="text-red-400">*</span></label>' +
            '<input type="text" id="rm-input-spreadsheetid" required placeholder="1BxiMVs0XRA5nFMd..." ' +
              'class="w-full px-4 py-2.5 rounded-[12px] border border-slate-200 text-sm font-mono outline-none focus:ring-2 focus:ring-verde-oscuro/30 focus:border-verde-oscuro transition-all">' +
            '<p class="text-[11px] text-slate-400 mt-1.5">URL: docs.google.com/spreadsheets/d/<strong class="text-verde-oscuro">ID</strong>/edit</p>' +
          '</div>' +
          '<div id="rm-modal-error" class="hidden mb-4 text-sm text-center font-medium rounded-lg px-4 py-2 bg-red-50 text-red-600"></div>' +
          '<div class="flex gap-3">' +
            '<button type="button" onclick="rmCerrarModal()" ' +
              'class="flex-1 px-4 py-2.5 rounded-md-plus border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50 transition-all">Cancelar</button>' +
            '<button type="submit" id="rm-btn-guardar" ' +
              'class="flex-1 btn-primario px-4 py-2.5 rounded-md-plus text-white text-sm font-semibold hover:bg-verde-oscuro active:scale-95 transition-all flex items-center justify-center gap-2">' +
              '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>Guardar' +
            '</button>' +
          '</div>' +
        '</form>' +
      '</div>' +
    '</div>' +

  '</div>'; // fin rm-root
}

// ══════════════════════════════════════════════════════════════
// TABLA DE MUNICIPIOS
// ══════════════════════════════════════════════════════════════

function _rmRenderizarTabla() {
  var wrap    = document.getElementById('rm-tabla-wrap');
  var vacio   = document.getElementById('rm-estado-vacio');
  var tbody   = document.getElementById('rm-tabla-body');
  var counter = document.getElementById('rm-contador');
  var panel   = document.getElementById('rm-panel-datos');

  if (!tbody) return;
  if (panel) { panel.classList.add('hidden'); panel.innerHTML = ''; }

  if (_rmMunicipios.length === 0) {
    if (vacio) vacio.classList.remove('hidden');
    if (wrap)  wrap.classList.add('hidden');
    return;
  }
  if (vacio) vacio.classList.add('hidden');
  if (wrap)  wrap.classList.remove('hidden');
  if (counter) counter.textContent = _rmMunicipios.length + ' municipio' + (_rmMunicipios.length !== 1 ? 's' : '');

  tbody.innerHTML = _rmMunicipios.map(function (m) {
    var fecha   = m.fechaAtencion ? new Date(m.fechaAtencion + 'T00:00:00').toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
    var idCorto = m.spreadsheetId.length > 22 ? m.spreadsheetId.substring(0, 22) + '…' : m.spreadsheetId;

    return '<tr class="hover:bg-slate-50 transition-colors">' +
      '<td class="px-5 py-3"><div class="flex items-center gap-2">' +
        '<div class="w-7 h-7 rounded-full bg-verde-suave flex items-center justify-center flex-shrink-0">' +
          '<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-verde-oscuro" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
            '<path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>' +
          '</svg></div>' +
        '<span class="font-semibold text-slate-700">' + _rmEsc(m.nombre) + '</span></div></td>' +
      '<td class="px-5 py-3 text-slate-500">' + fecha + '</td>' +
      '<td class="px-5 py-3"><span class="font-mono text-[11px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded" title="' + _rmEsc(m.spreadsheetId) + '">' + _rmEsc(idCorto) + '</span></td>' +
      '<td class="px-5 py-3"><span class="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-verde-suave text-verde-oscuro"><span class="w-1.5 h-1.5 rounded-full bg-verde-oscuro"></span>Activo</span></td>' +
      '<td class="px-5 py-3 text-right"><div class="flex items-center justify-end gap-2">' +
        '<button onclick="rmVerMunicipio(\'' + m.id + '\')" class="text-xs font-semibold text-verde-oscuro hover:underline flex items-center gap-1">' +
          '<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>Ver' +
        '</button>' +
        '<button onclick="rmAbrirModalEditar(\'' + m.id + '\')" title="Editar" class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-blue-50 text-slate-300 hover:text-blue-500 transition-colors">' +
          '<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>' +
        '</button>' +
        '<button onclick="rmConfirmarEliminar(\'' + m.id + '\',\'' + _rmEsc(m.nombre) + '\')" title="Eliminar" class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors">' +
          '<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>' +
        '</button>' +
      '</div></td>' +
    '</tr>';
  }).join('');
}

// ══════════════════════════════════════════════════════════════
// MODAL: AGREGAR / EDITAR
// ══════════════════════════════════════════════════════════════

function rmAbrirModalAgregar() {
  _rmEditandoId = null;
  var titulo = document.getElementById('rm-modal-titulo');
  var btn    = document.getElementById('rm-btn-guardar');
  var form   = document.getElementById('rm-form-municipio');
  var err    = document.getElementById('rm-modal-error');

  if (titulo) titulo.textContent = 'Agregar Municipio';
  if (btn)    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>Guardar';
  if (form)   form.reset();
  if (err)    err.classList.add('hidden');

  var overlay = document.getElementById('rm-modal-overlay');
  if (overlay) {
    overlay.classList.remove('hidden');
    setTimeout(function () { var i = document.getElementById('rm-input-municipio'); if (i) i.focus(); }, 80);
  }
}

function rmAbrirModalEditar(id) {
  var m = _rmMunicipios.find(function (x) { return x.id === id; });
  if (!m) return;
  _rmEditandoId = id;

  var titulo = document.getElementById('rm-modal-titulo');
  var btn    = document.getElementById('rm-btn-guardar');
  var err    = document.getElementById('rm-modal-error');
  if (titulo) titulo.textContent = 'Editar Municipio';
  if (btn)    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>Actualizar';
  if (err)    err.classList.add('hidden');

  var n = document.getElementById('rm-input-municipio');
  var f = document.getElementById('rm-input-fecha');
  var s = document.getElementById('rm-input-spreadsheetid');
  if (n) n.value = m.nombre;
  if (f) f.value = m.fechaAtencion;
  if (s) s.value = m.spreadsheetId;

  var overlay = document.getElementById('rm-modal-overlay');
  if (overlay) { overlay.classList.remove('hidden'); setTimeout(function () { if (n) n.focus(); }, 80); }
}

function rmCerrarModal(event) {
  if (event && event.target !== document.getElementById('rm-modal-overlay')) return;
  var overlay = document.getElementById('rm-modal-overlay');
  if (overlay) overlay.classList.add('hidden');
  _rmEditandoId = null;
}

function rmGuardarMunicipio(event) {
  event.preventDefault();
  var btn    = document.getElementById('rm-btn-guardar');
  var errEl  = document.getElementById('rm-modal-error');
  var nombre = (document.getElementById('rm-input-municipio').value || '').trim();
  var fecha  = (document.getElementById('rm-input-fecha').value || '').trim();
  var sheet  = (document.getElementById('rm-input-spreadsheetid').value || '').trim();
  var esEd   = !!_rmEditandoId;

  if (errEl) errEl.classList.add('hidden');
  if (!nombre || !fecha || !sheet) {
    if (errEl) { errEl.textContent = 'Completa todos los campos.'; errEl.classList.remove('hidden'); }
    return;
  }

  if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;margin-right:6px"></div>' + (esEd ? 'Actualizando…' : 'Guardando…'); }

  try {
    if (esEd) {
      RecordatorioMasivoService.actualizarMunicipio(_rmEditandoId, { nombre: nombre, fechaAtencion: fecha, spreadsheetId: sheet });
      _rmMunicipios = RecordatorioMasivoService.listarMunicipios();
      if (_rmMunicipioActivo && _rmMunicipioActivo.id === _rmEditandoId) {
        _rmMunicipioActivo = _rmMunicipios.find(function (m) { return m.id === _rmEditandoId; }) || null;
      }
    } else {
      var nuevo = RecordatorioMasivoService.guardarMunicipio({ nombre: nombre, fechaAtencion: fecha, spreadsheetId: sheet });
      _rmMunicipios.push(nuevo);
    }
    _rmRenderizarTabla();
    _rmEditandoId = null;
    var ov = document.getElementById('rm-modal-overlay');
    if (ov) ov.classList.add('hidden');
  } catch (e) {
    if (errEl) { errEl.textContent = e.message || 'Error al guardar.'; errEl.classList.remove('hidden'); }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>' + (esEd ? 'Actualizar' : 'Guardar');
    }
  }
}

// ══════════════════════════════════════════════════════════════
// VER DETALLE DEL MUNICIPIO
// ══════════════════════════════════════════════════════════════

function rmVerMunicipio(id) {
  var m = _rmMunicipios.find(function (x) { return x.id === id; });
  if (!m) return;

  _rmMunicipioActivo = m;
  _rmDatosActivos    = null;
  _rmTabActiva       = 'consulta';
  _rmEstados         = {};

  var panel = document.getElementById('rm-panel-datos');
  if (!panel) return;

  panel.innerHTML = _rmDetalleHtml(m);
  panel.classList.remove('hidden');
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });

  rmCargarDatos();
}

function _rmDetalleHtml(m) {
  var f = new Date(m.fechaAtencion + 'T00:00:00');
  var fechaLarga = f.toLocaleDateString('es-VE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  return '<div class="mt-6 fade-in">' +
    '<div class="bg-white rounded-md-plus shadow-card p-5 mb-4">' +
      '<div class="flex items-center justify-between flex-wrap gap-3">' +
        '<div class="flex items-center gap-3">' +
          '<div class="w-10 h-10 rounded-full bg-verde-suave flex items-center justify-center flex-shrink-0">' +
            '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-verde-oscuro" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>' +
          '</div>' +
          '<div><h2 class="font-bold text-verde-oscuro text-base">' + _rmEsc(m.nombre) + '</h2>' +
          '<p class="text-slate-400 text-xs">Fecha de atención: ' + fechaLarga + '</p></div>' +
        '</div>' +
        '<button onclick="rmCerrarDetalle()" class="text-xs text-slate-400 hover:text-verde-oscuro font-medium flex items-center gap-1 transition-colors">' +
          '<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>Cerrar' +
        '</button>' +
      '</div>' +
      '<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4" id="rm-det-kpis"></div>' +
    '</div>' +

    '<div class="bg-white rounded-md-plus shadow-card overflow-hidden">' +
      // Pestañas + botón masivo
      '<div class="flex items-center border-b border-slate-100">' +
        '<button id="rm-tab-consulta" onclick="rmCambiarTab(\'consulta\')" ' +
          'class="flex-1 px-4 py-3 text-sm font-semibold text-verde-oscuro border-b-2 border-verde-oscuro transition-all">📋 Recordatorio Consulta</button>' +
        '<button id="rm-tab-entrega" onclick="rmCambiarTab(\'entrega\')" ' +
          'class="flex-1 px-4 py-3 text-sm font-semibold text-slate-400 border-b-2 border-transparent hover:text-verde-oscuro transition-all">📦 Recordatorio Entrega</button>' +
        '<div class="px-3 py-2">' +
          '<button id="rm-btn-masivo" onclick="rmEnvioMasivo()" ' +
            'class="flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] active:scale-95 text-white text-xs font-bold px-3 py-2 rounded-lg transition-all">' +
            '🚀 Envío General (Masivo)' +
          '</button>' +
        '</div>' +
      '</div>' +

      // Barra de progreso masivo (oculta por defecto)
      '<div id="rm-progreso-wrap" class="hidden px-5 py-3 bg-slate-50 border-b border-slate-100">' +
        '<div class="flex items-center justify-between mb-1">' +
          '<span class="text-xs font-semibold text-slate-600" id="rm-progreso-texto">Enviando...</span>' +
          '<span class="text-xs text-slate-400" id="rm-progreso-num">0/0</span>' +
        '</div>' +
        '<div class="w-full bg-slate-200 rounded-full h-2">' +
          '<div id="rm-progreso-bar" class="bg-[#25D366] h-2 rounded-full transition-all duration-300" style="width:0%"></div>' +
        '</div>' +
      '</div>' +

      // Resumen post-envío (oculto por defecto)
      '<div id="rm-resumen-envio" class="hidden px-5 py-3 border-b border-slate-100"></div>' +

      // Spinner
      '<div id="rm-det-spinner" class="flex items-center justify-center py-12"><div class="spinner"></div></div>' +

      // Error
      '<div id="rm-det-error" class="hidden px-6 py-8 text-center">' +
        '<div class="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">' +
          '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>' +
        '</div>' +
        '<p class="text-slate-500 text-sm font-medium" id="rm-det-error-msg">No se pudieron cargar los datos.</p>' +
        '<button onclick="rmCargarDatos()" class="mt-3 text-xs text-verde-oscuro font-semibold hover:underline">Reintentar</button>' +
      '</div>' +

      // Contenido tabla
      '<div id="rm-det-contenido" class="hidden">' +
        '<div class="px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs text-slate-500 grid grid-cols-2 sm:grid-cols-3 gap-2" id="rm-det-meta"></div>' +
        '<div class="overflow-x-auto">' +
          '<table class="w-full text-xs">' +
            '<thead><tr class="bg-slate-50 text-[10px] uppercase text-slate-400 font-semibold tracking-wide" id="rm-det-thead"></tr></thead>' +
            '<tbody id="rm-det-tbody" class="divide-y divide-slate-100"></tbody>' +
          '</table>' +
        '</div>' +
        '<div id="rm-det-sin-resultados" class="hidden px-6 py-8 text-center text-slate-400 text-sm">No hay pacientes que cumplan los criterios.</div>' +
      '</div>' +

    '</div>' +
  '</div>';
}

function rmCargarDatos() {
  if (!_rmMunicipioActivo) return;

  var spinner   = document.getElementById('rm-det-spinner');
  var errorEl   = document.getElementById('rm-det-error');
  var contenido = document.getElementById('rm-det-contenido');

  if (spinner)   spinner.classList.remove('hidden');
  if (errorEl)   errorEl.classList.add('hidden');
  if (contenido) contenido.classList.add('hidden');

  RecordatorioMasivoService.obtenerDatosMunicipio(_rmMunicipioActivo.spreadsheetId)
    .then(function (datos) {
      _rmDatosActivos = datos;
      if (spinner) spinner.classList.add('hidden');
      _rmRenderizarKPIs(datos);
      _rmRenderizarMeta(datos.meta);
      _rmRenderizarTablaPacientes();
      if (contenido) contenido.classList.remove('hidden');
    })
    .catch(function (err) {
      if (spinner) spinner.classList.add('hidden');
      if (contenido) contenido.classList.add('hidden');
      if (errorEl) {
        errorEl.classList.remove('hidden');
        var m = document.getElementById('rm-det-error-msg');
        if (m) m.textContent = err.message || 'Error al cargar datos.';
      }
    });
}

function _rmRenderizarKPIs(datos) {
  var el = document.getElementById('rm-det-kpis');
  if (!el) return;
  var total   = datos.pacientes.length;
  var conTel  = datos.pacientes.filter(function (p) { return !!p.telfLimpio; }).length;
  var entrega = datos.pacientesEntrega.length;
  var sinTel  = total - conTel;
  el.innerHTML = [
    { l: 'Total',        v: total,   c: 'bg-verde-suave text-verde-oscuro' },
    { l: 'Con Teléfono', v: conTel,  c: 'bg-blue-50 text-blue-700' },
    { l: 'Para Entrega', v: entrega, c: 'bg-amber-50 text-amber-700' },
    { l: 'Sin Teléfono', v: sinTel,  c: 'bg-slate-100 text-slate-500' }
  ].map(function (k) {
    return '<div class="' + k.c + ' rounded-lg px-4 py-3 text-center">' +
      '<div class="text-2xl font-extrabold leading-none">' + k.v + '</div>' +
      '<div class="text-[11px] font-semibold mt-1 uppercase tracking-wide opacity-75">' + k.l + '</div></div>';
  }).join('');
}

function _rmRenderizarMeta(meta) {
  var el = document.getElementById('rm-det-meta');
  if (!el || !meta) return;
  el.innerHTML = [
    { l: 'Empresa',    v: meta.empresa    },
    { l: 'Municipio',  v: meta.municipio  },
    { l: 'Lugar',      v: meta.lugar      },
    { l: 'Dirección',  v: meta.direccion  },
    { l: 'Referencia', v: meta.referencia },
    { l: 'F. Entrega', v: meta.fechaEntrega }
  ].map(function (c) {
    return '<div><span class="font-semibold text-slate-600">' + c.l + ':</span> ' + _rmEsc(c.v || '—') + '</div>';
  }).join('');
}

// ══════════════════════════════════════════════════════════════
// PESTAÑAS Y TABLA CON ESTADO ENVÍO
// ══════════════════════════════════════════════════════════════

function rmCambiarTab(tab) {
  _rmTabActiva = tab;
  var ac = 'flex-1 px-4 py-3 text-sm font-semibold text-verde-oscuro border-b-2 border-verde-oscuro transition-all';
  var in_ = 'flex-1 px-4 py-3 text-sm font-semibold text-slate-400 border-b-2 border-transparent hover:text-verde-oscuro transition-all';
  var tc = document.getElementById('rm-tab-consulta');
  var te = document.getElementById('rm-tab-entrega');
  if (tc) tc.className = tab === 'consulta' ? ac : in_;
  if (te) te.className = tab === 'entrega'  ? ac : in_;
  if (_rmDatosActivos) _rmRenderizarTablaPacientes();
}

function _rmRenderizarTablaPacientes() {
  var thead  = document.getElementById('rm-det-thead');
  var tbody  = document.getElementById('rm-det-tbody');
  var sinRes = document.getElementById('rm-det-sin-resultados');
  if (!thead || !tbody || !_rmDatosActivos) return;

  var pacientes = _rmTabActiva === 'consulta'
    ? _rmDatosActivos.pacientes
    : _rmDatosActivos.pacientesEntrega;

  var colsConsulta = ['Volante','Paciente','Teléfono','Saldo','Estado Sondeo','Estado Envío','Acción Meta'];
  var colsEntrega  = ['Volante','Paciente','Teléfono','Tipo Lente','Saldo','Estado Envío','Acción Meta'];
  var cols = _rmTabActiva === 'consulta' ? colsConsulta : colsEntrega;

  thead.innerHTML = cols.map(function (c) {
    return '<th class="text-left px-4 py-2.5">' + c + '</th>';
  }).join('');

  if (!pacientes || pacientes.length === 0) {
    tbody.innerHTML = '';
    if (sinRes) sinRes.classList.remove('hidden');
    return;
  }
  if (sinRes) sinRes.classList.add('hidden');

  tbody.innerHTML = pacientes.map(function (p, idx) {
    var key    = (p.telfLimpio || ('idx_' + idx));
    var estado = _rmEstados[key] || 'pendiente';
    var estadoBadge = _rmBadgeEstadoEnvio(estado);

    var btnAccion;
    if (!p.telfLimpio) {
      btnAccion = '<span class="text-[11px] text-slate-300">Sin tel.</span>';
    } else if (estado === 'enviado') {
      btnAccion = '<span class="text-[11px] font-semibold text-green-600">Enviado ✅</span>';
    } else {
      btnAccion = '<button onclick="rmEnviarIndividual(\'' + _rmEsc(key) + '\',' + idx + ',\'' + _rmTabActiva + '\')" ' +
        'class="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-[#25D366] hover:bg-[#128C7E] px-2.5 py-1 rounded-lg transition-colors" ' +
        'id="rm-btn-ind-' + _rmEsc(key) + '">' +
        '<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">' +
          '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a10.8 10.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>' +
          '<path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.12 1.532 5.845L.06 23.37l5.636-1.478A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.944 0-3.77-.5-5.363-1.376l-.385-.22-3.974 1.041 1.061-3.87-.251-.398A9.956 9.956 0 012 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/>' +
        '</svg>Enviar' +
      '</button>';
    }

    var bg = idx % 2 === 0 ? '' : 'bg-slate-50/50';

    if (_rmTabActiva === 'consulta') {
      return '<tr class="' + bg + ' hover:bg-verde-suave/20 transition-colors" id="rm-row-' + _rmEsc(key) + '">' +
        '<td class="px-4 py-2.5 font-mono text-slate-400">'  + _rmEsc(p.volante    || '—') + '</td>' +
        '<td class="px-4 py-2.5 font-semibold text-slate-700">' + _rmEsc(p.paciente || '—') + '</td>' +
        '<td class="px-4 py-2.5 font-mono text-slate-500">'  + _rmEsc(p.telfRaw   || 'Sin tel.') + '</td>' +
        '<td class="px-4 py-2.5 text-slate-600">$'           + _rmEsc(String(p.saldo || '0')) + '</td>' +
        '<td class="px-4 py-2.5"><span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">' + _rmEsc(p.estadoSondeo || '—') + '</span></td>' +
        '<td class="px-4 py-2.5" id="rm-estado-' + _rmEsc(key) + '">' + estadoBadge + '</td>' +
        '<td class="px-4 py-2.5">' + btnAccion + '</td>' +
      '</tr>';
    } else {
      return '<tr class="' + bg + ' hover:bg-verde-suave/20 transition-colors" id="rm-row-' + _rmEsc(key) + '">' +
        '<td class="px-4 py-2.5 font-mono text-slate-400">'     + _rmEsc(p.volante    || '—') + '</td>' +
        '<td class="px-4 py-2.5 font-semibold text-slate-700">' + _rmEsc(p.paciente   || '—') + '</td>' +
        '<td class="px-4 py-2.5 font-mono text-slate-500">'     + _rmEsc(p.telfRaw    || 'Sin tel.') + '</td>' +
        '<td class="px-4 py-2.5 text-slate-600">'               + _rmEsc(p.tipoLente  || '—') + '</td>' +
        '<td class="px-4 py-2.5 text-slate-600">$'              + _rmEsc(String(p.saldo || '0')) + '</td>' +
        '<td class="px-4 py-2.5" id="rm-estado-' + _rmEsc(key) + '">' + estadoBadge + '</td>' +
        '<td class="px-4 py-2.5">' + btnAccion + '</td>' +
      '</tr>';
    }
  }).join('');
}

function _rmBadgeEstadoEnvio(estado) {
  if (estado === 'enviado') return '<span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Enviado ✅</span>';
  if (estado === 'error')   return '<span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Error ❌</span>';
  if (estado === 'enviando') return '<span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">Enviando…</span>';
  return '<span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Pendiente ⏳</span>';
}

function _rmActualizarEstadoFila(key, estado) {
  _rmEstados[key] = estado;
  var cell = document.getElementById('rm-estado-' + key);
  if (cell) cell.innerHTML = _rmBadgeEstadoEnvio(estado);

  // Si ya está enviado, deshabilitar el botón individual
  if (estado === 'enviado' || estado === 'error') {
    var btn = document.getElementById('rm-btn-ind-' + key);
    if (btn) {
      if (estado === 'enviado') {
        btn.outerHTML = '<span class="text-[11px] font-semibold text-green-600">Enviado ✅</span>';
      } else {
        btn.disabled = false;
        btn.textContent = 'Reintentar';
      }
    }
  }
}

// ══════════════════════════════════════════════════════════════
// ENVÍO INDIVIDUAL
// ══════════════════════════════════════════════════════════════

function rmEnviarIndividual(key, idx, tipo) {
  if (!_rmDatosActivos) return;

  var pacientes = tipo === 'consulta'
    ? _rmDatosActivos.pacientes
    : _rmDatosActivos.pacientesEntrega;

  var paciente = pacientes[idx];
  if (!paciente) return;

  _rmActualizarEstadoFila(key, 'enviando');

  var btn = document.getElementById('rm-btn-ind-' + key);
  if (btn) { btn.disabled = true; }

  MetaService.enviarMensaje(tipo, paciente, _rmDatosActivos.meta)
    .then(function (res) {
      if (res.ok) {
        _rmActualizarEstadoFila(key, 'enviado');
      } else {
        _rmActualizarEstadoFila(key, 'error');
        if (btn) { btn.disabled = false; }
      }
    });
}

// ══════════════════════════════════════════════════════════════
// ENVÍO MASIVO
// ══════════════════════════════════════════════════════════════

function rmEnvioMasivo() {
  if (_rmEnviando) return;
  if (!_rmDatosActivos) return;

  var pacientes = _rmTabActiva === 'consulta'
    ? _rmDatosActivos.pacientes
    : _rmDatosActivos.pacientesEntrega;

  var pendientes = pacientes.filter(function (p, i) {
    var key = p.telfLimpio || ('idx_' + i);
    return _rmEstados[key] !== 'enviado' && !!p.telfLimpio;
  });

  if (pendientes.length === 0) {
    alert('No hay pacientes pendientes con teléfono en esta pestaña.');
    return;
  }

  var modo = MetaConfig.MODO_SIMULADO ? ' (Modo Simulado)' : '';
  if (!confirm('¿Iniciar envío masivo' + modo + ' para ' + pendientes.length + ' pacientes?\nEsta acción procesará todos los pendientes con teléfono.')) return;

  _rmEnviando = true;
  var btn = document.getElementById('rm-btn-masivo');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Enviando…'; }

  // Mostrar barra de progreso
  var progWrap = document.getElementById('rm-progreso-wrap');
  var progBar  = document.getElementById('rm-progreso-bar');
  var progTxt  = document.getElementById('rm-progreso-texto');
  var progNum  = document.getElementById('rm-progreso-num');
  var resumen  = document.getElementById('rm-resumen-envio');
  if (progWrap) progWrap.classList.remove('hidden');
  if (resumen)  resumen.classList.add('hidden');

  var total = pendientes.length;
  var procesados = 0;

  // Construir lista con keys
  var lista = pendientes.map(function (p, i) {
    // Buscar el índice real dentro del array original
    var idxReal = (_rmTabActiva === 'consulta' ? _rmDatosActivos.pacientes : _rmDatosActivos.pacientesEntrega)
      .indexOf(p);
    return { paciente: p, key: p.telfLimpio || ('idx_' + idxReal), idxReal: idxReal };
  });

  function procesarSiguiente(i) {
    if (i >= lista.length) {
      // Finalizado
      _rmEnviando = false;
      if (btn) { btn.disabled = false; btn.innerHTML = '🚀 Envío General (Masivo)'; }
      if (progWrap) progWrap.classList.add('hidden');

      var env = lista.filter(function (x) { return _rmEstados[x.key] === 'enviado'; }).length;
      var err = lista.filter(function (x) { return _rmEstados[x.key] === 'error'; }).length;

      if (resumen) {
        resumen.classList.remove('hidden');
        resumen.innerHTML =
          '<div class="flex items-center gap-4 text-xs font-semibold flex-wrap">' +
          '<span class="text-green-700">✅ Enviados: ' + env + '</span>' +
          '<span class="text-red-600">❌ Errores: ' + err + '</span>' +
          '<span class="text-slate-500">📊 Total procesados: ' + lista.length + '</span>' +
          (MetaConfig.MODO_SIMULADO ? '<span class="text-amber-600">⚡ Simulado</span>' : '') +
          '</div>';
      }
      return;
    }

    var item = lista[i];
    _rmActualizarEstadoFila(item.key, 'enviando');

    MetaService.enviarMensaje(_rmTabActiva, item.paciente, _rmDatosActivos.meta)
      .then(function (res) {
        procesados++;
        _rmActualizarEstadoFila(item.key, res.ok ? 'enviado' : 'error');

        var pct = Math.round((procesados / total) * 100);
        if (progBar)  progBar.style.width  = pct + '%';
        if (progTxt)  progTxt.textContent  = res.ok ? 'Enviando...' : 'Error en un registro, continuando...';
        if (progNum)  progNum.textContent  = procesados + '/' + total;

        procesarSiguiente(i + 1);
      });
  }

  procesarSiguiente(0);
}

// ══════════════════════════════════════════════════════════════
// ELIMINAR / CERRAR
// ══════════════════════════════════════════════════════════════

function rmConfirmarEliminar(id, nombre) {
  if (!confirm('¿Eliminar el municipio "' + nombre + '"?')) return;
  RecordatorioMasivoService.eliminarMunicipio(id);
  _rmMunicipios = RecordatorioMasivoService.listarMunicipios();
  if (_rmMunicipioActivo && _rmMunicipioActivo.id === id) rmCerrarDetalle();
  _rmRenderizarTabla();
}

function rmCerrarDetalle() {
  var panel = document.getElementById('rm-panel-datos');
  if (panel) { panel.classList.add('hidden'); panel.innerHTML = ''; }
  _rmMunicipioActivo = null;
  _rmDatosActivos    = null;
  _rmEstados         = {};
}

// ══════════════════════════════════════════════════════════════
// UTILIDADES
// ══════════════════════════════════════════════════════════════

function _rmEsc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
