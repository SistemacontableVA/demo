// ── Estado interno ─────────────────────────────────────────
var _recMunicipios      = [];
var _recMunicipioActivo = null;
var _recDatosActivos    = null;
var _recTabActiva       = 'consulta';
var _recEditandoId      = null;   // id del municipio en edición (null = agregar nuevo)

// ══════════════════════════════════════════════════════════════
// PUNTO DE ENTRADA — llamado por el router admin
// ══════════════════════════════════════════════════════════════

function renderRecordatorios() {
  var contenedor = document.getElementById('admin-content');
  if (!contenedor) return;

  _recMunicipios      = RecordatoriosService.listarMunicipios();
  _recMunicipioActivo = null;
  _recDatosActivos    = null;
  _recTabActiva       = 'consulta';

  contenedor.innerHTML = _recShellHtml();
  _recRenderizarTabla();
}

// ══════════════════════════════════════════════════════════════
// HTML PRINCIPAL (shell)
// ══════════════════════════════════════════════════════════════

function _recShellHtml() {
  return '<div class="max-w-5xl mx-auto px-4 py-8 fade-in" id="rec-root">' +

    // Encabezado
    '<div class="mb-6">' +
      '<div class="flex items-center justify-between flex-wrap gap-3">' +
        '<div>' +
          '<h1 class="text-verde-oscuro font-bold text-xl sm:text-2xl flex items-center gap-2">' +
            '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
              '<path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>' +
            '</svg>' +
            'Recordatorios WhatsApp' +
          '</h1>' +
          '<p class="text-slate-500 text-sm mt-1">Gestiona los municipios y genera recordatorios para pacientes.</p>' +
        '</div>' +
        '<button onclick="recordatoriosAbrirModalAgregar()" ' +
          'class="btn-primario flex items-center gap-2 px-4 py-2.5 rounded-md-plus text-white text-sm font-semibold hover:bg-verde-oscuro active:scale-95 transition-all">' +
          '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
            '<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>' +
          '</svg>' +
          'Agregar Municipio' +
        '</button>' +
      '</div>' +
    '</div>' +

    // Estado vacío
    '<div id="rec-estado-vacio" class="hidden">' +
      '<div class="bg-white rounded-md-plus shadow-card p-10 text-center">' +
        '<div class="w-14 h-14 rounded-full bg-verde-suave flex items-center justify-center mx-auto mb-4">' +
          '<svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-verde-oscuro" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">' +
            '<path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>' +
            '<path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>' +
          '</svg>' +
        '</div>' +
        '<h3 class="font-bold text-verde-oscuro text-base mb-1">Sin municipios registrados</h3>' +
        '<p class="text-slate-400 text-sm mb-4">Agrega el primer municipio con su hoja de cálculo para comenzar.</p>' +
        '<button onclick="recordatoriosAbrirModalAgregar()" ' +
          'class="btn-primario px-5 py-2 rounded-md-plus text-white text-sm font-semibold hover:bg-verde-oscuro transition-all">' +
          'Agregar Municipio' +
        '</button>' +
      '</div>' +
    '</div>' +

    // Tabla de municipios
    '<div id="rec-tabla-wrap">' +
      '<div class="bg-white rounded-md-plus shadow-card overflow-hidden">' +
        '<div class="px-5 py-3 border-b border-slate-100 flex items-center justify-between">' +
          '<span class="text-sm font-semibold text-verde-oscuro">Municipios registrados</span>' +
          '<span id="rec-contador" class="text-xs text-slate-400 font-medium">0 municipios</span>' +
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
            '<tbody id="rec-tabla-body" class="divide-y divide-slate-100"></tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +
    '</div>' +

    // Panel de detalle del municipio (se inyecta dinámicamente)
    '<div id="rec-panel-datos" class="hidden"></div>' +

    // ── MODAL: Agregar Municipio ──────────────────────────────
    '<div id="rec-modal-overlay" ' +
      'class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm hidden" ' +
      'onclick="recordatoriosCerrarModal(event)">' +
      '<div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6" onclick="event.stopPropagation()">' +
        '<div class="flex items-center justify-between mb-5">' +
          '<h2 id="rec-modal-titulo" class="font-bold text-verde-oscuro text-base">Agregar Municipio</h2>' +
          '<button onclick="recordatoriosCerrarModal()" ' +
            'class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">' +
            '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
              '<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>' +
            '</svg>' +
          '</button>' +
        '</div>' +
        '<form id="rec-form-municipio" onsubmit="recordatoriosGuardarMunicipio(event)" novalidate>' +

          // Campo: nombre
          '<div class="mb-4">' +
            '<label class="block text-[11px] uppercase text-slate-400 font-semibold mb-1.5">' +
              'Nombre / Identificador del Municipio <span class="text-red-400">*</span>' +
            '</label>' +
            '<input type="text" id="rec-input-municipio" name="municipio" required ' +
              'placeholder="Ej: Maracaibo, San Francisco..." ' +
              'class="w-full px-4 py-2.5 rounded-[12px] border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-verde-oscuro/30 focus:border-verde-oscuro transition-all">' +
          '</div>' +

          // Campo: fecha
          '<div class="mb-4">' +
            '<label class="block text-[11px] uppercase text-slate-400 font-semibold mb-1.5">' +
              'Fecha de Atención <span class="text-red-400">*</span>' +
            '</label>' +
            '<input type="date" id="rec-input-fecha" name="fechaAtencion" required ' +
              'class="w-full px-4 py-2.5 rounded-[12px] border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-verde-oscuro/30 focus:border-verde-oscuro transition-all">' +
          '</div>' +

          // Campo: spreadsheet ID
          '<div class="mb-5">' +
            '<label class="block text-[11px] uppercase text-slate-400 font-semibold mb-1.5">' +
              'ID de la Hoja de Cálculo <span class="text-red-400">*</span>' +
            '</label>' +
            '<input type="text" id="rec-input-spreadsheetid" name="spreadsheetId" required ' +
              'placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms" ' +
              'class="w-full px-4 py-2.5 rounded-[12px] border border-slate-200 text-sm font-mono outline-none focus:ring-2 focus:ring-verde-oscuro/30 focus:border-verde-oscuro transition-all">' +
            '<p class="text-[11px] text-slate-400 mt-1.5 leading-relaxed">' +
              'URL: docs.google.com/spreadsheets/d/<strong class="text-verde-oscuro">ID</strong>/edit' +
            '</p>' +
          '</div>' +

          // Error
          '<div id="rec-modal-error" class="hidden mb-4 text-sm text-center font-medium rounded-lg px-4 py-2 bg-red-50 text-red-600"></div>' +

          // Botones
          '<div class="flex gap-3">' +
            '<button type="button" onclick="recordatoriosCerrarModal()" ' +
              'class="flex-1 px-4 py-2.5 rounded-md-plus border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50 transition-all">' +
              'Cancelar' +
            '</button>' +
            '<button type="submit" id="rec-btn-guardar" ' +
              'class="flex-1 btn-primario px-4 py-2.5 rounded-md-plus text-white text-sm font-semibold hover:bg-verde-oscuro active:scale-95 transition-all flex items-center justify-center gap-2">' +
              '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
                '<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>' +
              '</svg>' +
              'Guardar' +
            '</button>' +
          '</div>' +

        '</form>' +
      '</div>' +
    '</div>' +

  '</div>'; // fin rec-root
}

// ══════════════════════════════════════════════════════════════
// TABLA DE MUNICIPIOS
// ══════════════════════════════════════════════════════════════

function _recRenderizarTabla() {
  var tablaWrap   = document.getElementById('rec-tabla-wrap');
  var estadoVacio = document.getElementById('rec-estado-vacio');
  var tbody       = document.getElementById('rec-tabla-body');
  var contador    = document.getElementById('rec-contador');
  var panelDatos  = document.getElementById('rec-panel-datos');

  if (!tbody) return;

  // Ocultar panel de detalle al actualizar tabla
  if (panelDatos) { panelDatos.classList.add('hidden'); panelDatos.innerHTML = ''; }

  if (_recMunicipios.length === 0) {
    if (estadoVacio) estadoVacio.classList.remove('hidden');
    if (tablaWrap)   tablaWrap.classList.add('hidden');
    return;
  }

  if (estadoVacio) estadoVacio.classList.add('hidden');
  if (tablaWrap)   tablaWrap.classList.remove('hidden');

  if (contador) {
    contador.textContent = _recMunicipios.length + ' municipio' + (_recMunicipios.length !== 1 ? 's' : '');
  }

  tbody.innerHTML = _recMunicipios.map(function (m) {
    var fecha = m.fechaAtencion
      ? new Date(m.fechaAtencion + 'T00:00:00').toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })
      : '—';
    var idCorto = m.spreadsheetId.length > 22
      ? m.spreadsheetId.substring(0, 22) + '…'
      : m.spreadsheetId;

    return '<tr class="hover:bg-slate-50 transition-colors">' +
      '<td class="px-5 py-3">' +
        '<div class="flex items-center gap-2">' +
          '<div class="w-7 h-7 rounded-full bg-verde-suave flex items-center justify-center flex-shrink-0">' +
            '<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-verde-oscuro" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
              '<path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>' +
              '<path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>' +
            '</svg>' +
          '</div>' +
          '<span class="font-semibold text-slate-700">' + _recEscapar(m.nombre) + '</span>' +
        '</div>' +
      '</td>' +
      '<td class="px-5 py-3 text-slate-500">' + fecha + '</td>' +
      '<td class="px-5 py-3">' +
        '<span class="font-mono text-[11px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded" title="' + _recEscapar(m.spreadsheetId) + '">' +
          _recEscapar(idCorto) +
        '</span>' +
      '</td>' +
      '<td class="px-5 py-3">' +
        '<span class="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-verde-suave text-verde-oscuro">' +
          '<span class="w-1.5 h-1.5 rounded-full bg-verde-oscuro"></span>Activo' +
        '</span>' +
      '</td>' +
      '<td class="px-5 py-3 text-right">' +
        '<div class="flex items-center justify-end gap-2">' +
          '<button onclick="recordatoriosVerMunicipio(\'' + m.id + '\')" ' +
            'class="text-xs font-semibold text-verde-oscuro hover:underline flex items-center gap-1">' +
            '<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
              '<path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>' +
            '</svg>Ver' +
          '</button>' +
          // Botón Editar
          '<button onclick="recordatoriosAbrirModalEditar(\'' + m.id + '\')" ' +
            'title="Editar municipio" ' +
            'class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-blue-50 text-slate-300 hover:text-blue-500 transition-colors">' +
            '<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
              '<path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>' +
            '</svg>' +
          '</button>' +
          // Botón Eliminar
          '<button onclick="recordatoriosConfirmarEliminar(\'' + m.id + '\',\'' + _recEscapar(m.nombre) + '\')" ' +
            'title="Eliminar municipio" ' +
            'class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors">' +
            '<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
              '<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>' +
            '</svg>' +
          '</button>' +
        '</div>' +
      '</td>' +
    '</tr>';
  }).join('');
}

// ══════════════════════════════════════════════════════════════
// MODAL: AGREGAR / EDITAR MUNICIPIO
// ══════════════════════════════════════════════════════════════

function recordatoriosAbrirModalAgregar() {
  _recEditandoId = null;   // modo: nuevo

  var titulo = document.getElementById('rec-modal-titulo');
  var btnGuardar = document.getElementById('rec-btn-guardar');
  var form   = document.getElementById('rec-form-municipio');
  var error  = document.getElementById('rec-modal-error');

  if (titulo)    titulo.textContent = 'Agregar Municipio';
  if (btnGuardar) btnGuardar.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>Guardar';
  if (form)  form.reset();
  if (error) error.classList.add('hidden');

  var overlay = document.getElementById('rec-modal-overlay');
  if (overlay) {
    overlay.classList.remove('hidden');
    setTimeout(function () {
      var inp = document.getElementById('rec-input-municipio');
      if (inp) inp.focus();
    }, 80);
  }
}

function recordatoriosAbrirModalEditar(id) {
  var municipio = _recMunicipios.find(function (m) { return m.id === id; });
  if (!municipio) return;

  _recEditandoId = id;   // modo: edición

  var titulo     = document.getElementById('rec-modal-titulo');
  var btnGuardar = document.getElementById('rec-btn-guardar');
  var error      = document.getElementById('rec-modal-error');

  if (titulo)    titulo.textContent = 'Editar Municipio';
  if (btnGuardar) btnGuardar.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>Actualizar';
  if (error) error.classList.add('hidden');

  // Pre-rellenar campos con los datos actuales
  var inpNombre  = document.getElementById('rec-input-municipio');
  var inpFecha   = document.getElementById('rec-input-fecha');
  var inpSheet   = document.getElementById('rec-input-spreadsheetid');

  if (inpNombre) inpNombre.value = municipio.nombre;
  if (inpFecha)  inpFecha.value  = municipio.fechaAtencion;
  if (inpSheet)  inpSheet.value  = municipio.spreadsheetId;

  var overlay = document.getElementById('rec-modal-overlay');
  if (overlay) {
    overlay.classList.remove('hidden');
    setTimeout(function () { if (inpNombre) inpNombre.focus(); }, 80);
  }
}

function recordatoriosCerrarModal(event) {
  if (event && event.currentTarget && event.target !== document.getElementById('rec-modal-overlay')) return;
  var overlay = document.getElementById('rec-modal-overlay');
  if (overlay) overlay.classList.add('hidden');
  _recEditandoId = null;
}

function recordatoriosGuardarMunicipio(event) {
  event.preventDefault();

  var btn     = document.getElementById('rec-btn-guardar');
  var errorEl = document.getElementById('rec-modal-error');
  var nombre  = (document.getElementById('rec-input-municipio').value || '').trim();
  var fecha   = (document.getElementById('rec-input-fecha').value || '').trim();
  var sheetId = (document.getElementById('rec-input-spreadsheetid').value || '').trim();

  if (errorEl) errorEl.classList.add('hidden');

  if (!nombre || !fecha || !sheetId) {
    if (errorEl) { errorEl.textContent = 'Completa todos los campos obligatorios.'; errorEl.classList.remove('hidden'); }
    return;
  }

  // Capturar modo antes de cualquier cambio de estado
  var esEdicion = !!_recEditandoId;

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;margin-right:6px"></div>' +
      (esEdicion ? 'Actualizando…' : 'Guardando…');
  }

  try {
    if (esEdicion) {
      // ── MODO EDICIÓN ──────────────────────────────────────
      RecordatoriosService.actualizarMunicipio(_recEditandoId, {
        nombre:        nombre,
        fechaAtencion: fecha,
        spreadsheetId: sheetId
      });
      _recMunicipios = RecordatoriosService.listarMunicipios();

      // Si el municipio activo es el que se editó, actualizar el estado
      if (_recMunicipioActivo && _recMunicipioActivo.id === _recEditandoId) {
        _recMunicipioActivo = _recMunicipios.find(function (m) { return m.id === _recEditandoId; }) || null;
      }
    } else {
      // ── MODO NUEVO ────────────────────────────────────────
      var nuevo = RecordatoriosService.guardarMunicipio({ nombre: nombre, fechaAtencion: fecha, spreadsheetId: sheetId });
      _recMunicipios.push(nuevo);
    }

    _recRenderizarTabla();
    _recEditandoId = null;
    var overlay = document.getElementById('rec-modal-overlay');
    if (overlay) overlay.classList.add('hidden');

  } catch (e) {
    if (errorEl) { errorEl.textContent = e.message || 'Error al guardar.'; errorEl.classList.remove('hidden'); }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>' +
        (esEdicion ? 'Actualizar' : 'Guardar');
    }
  }
}

// ══════════════════════════════════════════════════════════════
// VER DETALLE DE MUNICIPIO
// ══════════════════════════════════════════════════════════════

function recordatoriosVerMunicipio(id) {
  var municipio = _recMunicipios.find(function (m) { return m.id === id; });
  if (!municipio) return;

  _recMunicipioActivo = municipio;
  _recDatosActivos    = null;
  _recTabActiva       = 'consulta';

  var panel = document.getElementById('rec-panel-datos');
  if (!panel) return;

  panel.innerHTML = _recDetalleShellHtml(municipio);
  panel.classList.remove('hidden');
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });

  recordatoriosCargarDatosMunicipio();
}

function _recDetalleShellHtml(municipio) {
  var f = new Date(municipio.fechaAtencion + 'T00:00:00');
  var fechaLarga = f.toLocaleDateString('es-VE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  return '<div class="mt-6 fade-in">' +

    // Header del municipio
    '<div class="bg-white rounded-md-plus shadow-card p-5 mb-4">' +
      '<div class="flex items-center justify-between flex-wrap gap-3">' +
        '<div class="flex items-center gap-3">' +
          '<div class="w-10 h-10 rounded-full bg-verde-suave flex items-center justify-center flex-shrink-0">' +
            '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-verde-oscuro" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
              '<path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>' +
              '<path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>' +
            '</svg>' +
          '</div>' +
          '<div>' +
            '<h2 class="font-bold text-verde-oscuro text-base">' + _recEscapar(municipio.nombre) + '</h2>' +
            '<p class="text-slate-400 text-xs">Fecha de atención: ' + fechaLarga + '</p>' +
          '</div>' +
        '</div>' +
        '<button onclick="recordatoriosCerrarDetalle()" ' +
          'class="text-xs text-slate-400 hover:text-verde-oscuro font-medium flex items-center gap-1 transition-colors">' +
          '<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
            '<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>' +
          '</svg>Cerrar' +
        '</button>' +
      '</div>' +
      '<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4" id="rec-det-kpis"></div>' +
    '</div>' +

    // Tarjeta con pestañas
    '<div class="bg-white rounded-md-plus shadow-card overflow-hidden">' +

      // Pestañas
      '<div class="flex border-b border-slate-100">' +
        '<button id="rec-tab-consulta" onclick="recordatoriosCambiarTab(\'consulta\')" ' +
          'class="flex-1 px-4 py-3 text-sm font-semibold text-verde-oscuro border-b-2 border-verde-oscuro transition-all">' +
          '📋 Recordatorio Consulta' +
        '</button>' +
        '<button id="rec-tab-entrega" onclick="recordatoriosCambiarTab(\'entrega\')" ' +
          'class="flex-1 px-4 py-3 text-sm font-semibold text-slate-400 border-b-2 border-transparent hover:text-verde-oscuro transition-all">' +
          '📦 Recordatorio Entrega' +
        '</button>' +
      '</div>' +

      // Spinner
      '<div id="rec-det-spinner" class="flex items-center justify-center py-12">' +
        '<div class="spinner"></div>' +
      '</div>' +

      // Error
      '<div id="rec-det-error" class="hidden px-6 py-8 text-center">' +
        '<div class="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">' +
          '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
            '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>' +
          '</svg>' +
        '</div>' +
        '<p class="text-slate-500 text-sm font-medium" id="rec-det-error-msg">No se pudieron cargar los datos.</p>' +
        '<button onclick="recordatoriosCargarDatosMunicipio()" class="mt-3 text-xs text-verde-oscuro font-semibold hover:underline">Reintentar</button>' +
      '</div>' +

      // Contenido (tabla)
      '<div id="rec-det-contenido" class="hidden">' +
        '<div class="px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs text-slate-500 grid grid-cols-2 sm:grid-cols-3 gap-2" id="rec-det-meta"></div>' +
        '<div class="overflow-x-auto">' +
          '<table class="w-full text-xs">' +
            '<thead><tr class="bg-slate-50 text-[10px] uppercase text-slate-400 font-semibold tracking-wide" id="rec-det-thead"></tr></thead>' +
            '<tbody id="rec-det-tbody" class="divide-y divide-slate-100"></tbody>' +
          '</table>' +
        '</div>' +
        '<div id="rec-det-sin-resultados" class="hidden px-6 py-8 text-center text-slate-400 text-sm">No hay pacientes que cumplan los criterios para este recordatorio.</div>' +
      '</div>' +

    '</div>' + // fin tarjeta
  '</div>';   // fin fade-in
}

function recordatoriosCargarDatosMunicipio() {
  if (!_recMunicipioActivo) return;

  var spinner   = document.getElementById('rec-det-spinner');
  var errorEl   = document.getElementById('rec-det-error');
  var contenido = document.getElementById('rec-det-contenido');

  if (spinner)   spinner.classList.remove('hidden');
  if (errorEl)   errorEl.classList.add('hidden');
  if (contenido) contenido.classList.add('hidden');

  RecordatoriosService.obtenerDatosMunicipio(_recMunicipioActivo.spreadsheetId)
    .then(function (datos) {
      _recDatosActivos = datos;
      if (spinner) spinner.classList.add('hidden');
      _recRenderizarKPIs(datos);
      _recRenderizarMeta(datos.meta);
      _recRenderizarTablaPacientes();
      if (contenido) contenido.classList.remove('hidden');
    })
    .catch(function (err) {
      if (spinner) spinner.classList.add('hidden');
      if (contenido) contenido.classList.add('hidden');
      if (errorEl) {
        errorEl.classList.remove('hidden');
        var msgEl = document.getElementById('rec-det-error-msg');
        if (msgEl) msgEl.textContent = err.message || 'No se pudieron cargar los datos. Verifica el ID de la hoja y el endpoint.';
      }
    });
}

function _recRenderizarKPIs(datos) {
  var el = document.getElementById('rec-det-kpis');
  if (!el) return;
  var total      = datos.pacientes.length;
  var conTel     = datos.pacientes.filter(function (p) { return !!p.telfLimpio; }).length;
  var entrega    = datos.pacientesEntrega.length;
  var sinTel     = total - conTel;
  var kpis = [
    { label: 'Total',        valor: total,   cls: 'bg-verde-suave text-verde-oscuro' },
    { label: 'Con Teléfono', valor: conTel,  cls: 'bg-blue-50 text-blue-700' },
    { label: 'Para Entrega', valor: entrega, cls: 'bg-amber-50 text-amber-700' },
    { label: 'Sin Teléfono', valor: sinTel,  cls: 'bg-slate-100 text-slate-500' }
  ];
  el.innerHTML = kpis.map(function (k) {
    return '<div class="' + k.cls + ' rounded-lg px-4 py-3 text-center">' +
      '<div class="text-2xl font-extrabold leading-none">' + k.valor + '</div>' +
      '<div class="text-[11px] font-semibold mt-1 uppercase tracking-wide opacity-75">' + k.label + '</div>' +
    '</div>';
  }).join('');
}

function _recRenderizarMeta(meta) {
  var el = document.getElementById('rec-det-meta');
  if (!el || !meta) return;
  var campos = [
    { label: 'Empresa',    v: meta.empresa    },
    { label: 'Municipio',  v: meta.municipio  },
    { label: 'Lugar',      v: meta.lugar      },
    { label: 'Dirección',  v: meta.direccion  },
    { label: 'Referencia', v: meta.referencia },
    { label: 'F. Entrega', v: meta.fechaEntrega }
  ];
  el.innerHTML = campos.map(function (c) {
    return '<div><span class="font-semibold text-slate-600">' + c.label + ':</span> ' + _recEscapar(c.v || '—') + '</div>';
  }).join('');
}

// ══════════════════════════════════════════════════════════════
// PESTAÑAS Y TABLA DE PACIENTES
// ══════════════════════════════════════════════════════════════

function recordatoriosCambiarTab(tab) {
  _recTabActiva = tab;
  var activo   = 'flex-1 px-4 py-3 text-sm font-semibold text-verde-oscuro border-b-2 border-verde-oscuro transition-all';
  var inactivo = 'flex-1 px-4 py-3 text-sm font-semibold text-slate-400 border-b-2 border-transparent hover:text-verde-oscuro transition-all';
  var tc = document.getElementById('rec-tab-consulta');
  var te = document.getElementById('rec-tab-entrega');
  if (tc) tc.className = tab === 'consulta' ? activo : inactivo;
  if (te) te.className = tab === 'entrega'  ? activo : inactivo;
  if (_recDatosActivos) _recRenderizarTablaPacientes();
}

function _recRenderizarTablaPacientes() {
  var thead = document.getElementById('rec-det-thead');
  var tbody = document.getElementById('rec-det-tbody');
  var sinRes = document.getElementById('rec-det-sin-resultados');
  if (!thead || !tbody || !_recDatosActivos) return;

  var meta      = _recDatosActivos.meta;
  var pacientes = _recTabActiva === 'consulta'
    ? _recDatosActivos.pacientes
    : _recDatosActivos.pacientesEntrega;

  if (_recTabActiva === 'consulta') {
    thead.innerHTML =
      '<th class="text-left px-4 py-2.5">Volante</th>' +
      '<th class="text-left px-4 py-2.5">Paciente</th>' +
      '<th class="text-left px-4 py-2.5">Teléfono</th>' +
      '<th class="text-left px-4 py-2.5">Saldo</th>' +
      '<th class="text-left px-4 py-2.5">Estado</th>' +
      '<th class="text-left px-4 py-2.5">WhatsApp</th>';
  } else {
    thead.innerHTML =
      '<th class="text-left px-4 py-2.5">Volante</th>' +
      '<th class="text-left px-4 py-2.5">Paciente</th>' +
      '<th class="text-left px-4 py-2.5">Teléfono</th>' +
      '<th class="text-left px-4 py-2.5">Tipo Lente</th>' +
      '<th class="text-left px-4 py-2.5">Saldo</th>' +
      '<th class="text-left px-4 py-2.5">WhatsApp</th>';
  }

  if (!pacientes || pacientes.length === 0) {
    tbody.innerHTML = '';
    if (sinRes) sinRes.classList.remove('hidden');
    return;
  }
  if (sinRes) sinRes.classList.add('hidden');

  tbody.innerHTML = pacientes.map(function (p, idx) {
    var msg  = _recTabActiva === 'consulta'
      ? RecordatoriosService.generarMensajeConsulta(p, meta)
      : RecordatoriosService.generarMensajeEntrega(p, meta);
    var link = RecordatoriosService.generarLinkWhatsapp(p.telfLimpio, msg);
    var btn  = link
      ? '<a href="' + link + '" target="_blank" rel="noopener noreferrer" ' +
          'class="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-[#25D366] hover:bg-[#128C7E] px-2.5 py-1 rounded-lg transition-colors">' +
          '<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">' +
            '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>' +
            '<path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.12 1.532 5.845L.06 23.37l5.636-1.478A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.944 0-3.77-.5-5.363-1.376l-.385-.22-3.974 1.041 1.061-3.87-.251-.398A9.956 9.956 0 012 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/>' +
          '</svg>Enviar' +
        '</a>'
      : '<span class="text-[11px] text-slate-300">Sin tel.</span>';

    var bg = idx % 2 === 0 ? '' : 'bg-slate-50/50';

    if (_recTabActiva === 'consulta') {
      return '<tr class="' + bg + ' hover:bg-verde-suave/20 transition-colors">' +
        '<td class="px-4 py-2.5 font-mono text-slate-400">' + _recEscapar(p.volante || '—') + '</td>' +
        '<td class="px-4 py-2.5 font-semibold text-slate-700">' + _recEscapar(p.paciente || '—') + '</td>' +
        '<td class="px-4 py-2.5 font-mono text-slate-500">' + _recEscapar(p.telfRaw || 'Sin tel.') + '</td>' +
        '<td class="px-4 py-2.5 text-slate-600">$' + _recEscapar(String(p.saldo || '0')) + '</td>' +
        '<td class="px-4 py-2.5"><span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">' + _recEscapar(p.estadoSondeo || '—') + '</span></td>' +
        '<td class="px-4 py-2.5">' + btn + '</td>' +
      '</tr>';
    } else {
      return '<tr class="' + bg + ' hover:bg-verde-suave/20 transition-colors">' +
        '<td class="px-4 py-2.5 font-mono text-slate-400">' + _recEscapar(p.volante || '—') + '</td>' +
        '<td class="px-4 py-2.5 font-semibold text-slate-700">' + _recEscapar(p.paciente || '—') + '</td>' +
        '<td class="px-4 py-2.5 font-mono text-slate-500">' + _recEscapar(p.telfRaw || 'Sin tel.') + '</td>' +
        '<td class="px-4 py-2.5 text-slate-600">' + _recEscapar(p.tipoLente || '—') + '</td>' +
        '<td class="px-4 py-2.5 text-slate-600">$' + _recEscapar(String(p.saldo || '0')) + '</td>' +
        '<td class="px-4 py-2.5">' + btn + '</td>' +
      '</tr>';
    }
  }).join('');
}

function recordatoriosCerrarDetalle() {
  var panel = document.getElementById('rec-panel-datos');
  if (panel) { panel.classList.add('hidden'); panel.innerHTML = ''; }
  _recMunicipioActivo = null;
  _recDatosActivos    = null;
}

// ══════════════════════════════════════════════════════════════
// ELIMINAR
// ══════════════════════════════════════════════════════════════

function recordatoriosConfirmarEliminar(id, nombre) {
  if (!confirm('¿Eliminar el municipio "' + nombre + '"?\nEsta acción no se puede deshacer.')) return;
  RecordatoriosService.eliminarMunicipio(id);
  _recMunicipios = RecordatoriosService.listarMunicipios();
  if (_recMunicipioActivo && _recMunicipioActivo.id === id) recordatoriosCerrarDetalle();
  _recRenderizarTabla();
}

// ══════════════════════════════════════════════════════════════
// UTILIDADES
// ══════════════════════════════════════════════════════════════

function _recEscapar(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
