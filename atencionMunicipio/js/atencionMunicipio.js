/* ============================================================
   ATENCIONMUNICIPIO.JS — Módulo Atención Municipio v2
   Óptica Visión de Águila

   Vistas:
     LISTA   → municipios agrupados por Ruta (cards)
     VISOR   → iframe pantalla completa de la hoja del municipio

   Perfiles:
     Administrador → lista + crear/editar/eliminar + cambiar estado + visor
     Secretaria    → lista + cambiar estado + visor
   ============================================================ */

// ── Estado global ───────────────────────────────────────────
var _amPerfil        = 'Administrador';
var _amMunicipios    = [];
var _amCargando      = false;
var _amEditandoId    = null;     // null = crear nuevo
var _amInmersivo     = false;
var _amModoVisor     = 'ver';    // 'ver' | 'editar'
var _amMunicipioVisor = null;    // municipio activo en el visor
var _amZoomMovil     = 1;
var _amDatosCargados  = false;

// ══════════════════════════════════════════════════════════════
// PUNTO DE ENTRADA
// ══════════════════════════════════════════════════════════════

function renderAtencionMunicipio() {
  var contenedor = document.getElementById('admin-content');
  if (!contenedor) return;

  _amRestaurarMenuLateral();
  _amPerfil     = (typeof getPerfilAdmin === 'function') ? getPerfilAdmin() : 'Administrador';
  _amInmersivo  = false;
  _amZoomMovil  = 1;
  _amEditandoId = null;
  _amMunicipioVisor = null;

  contenedor.innerHTML = _amShellListaHtml();
  _amCargarMunicipios();
}

// ══════════════════════════════════════════════════════════════
// VISTA LISTA — HTML
// ══════════════════════════════════════════════════════════════

function _amShellListaHtml() {
  var esAdmin = _amPerfil === 'Administrador';

  return '<div class="max-w-6xl mx-auto px-4 py-8 fade-in" id="am-lista-root">' +

    // Encabezado
    '<div class="flex items-center justify-between flex-wrap gap-3 mb-6">' +
      '<div>' +
        '<h1 class="text-verde-oscuro font-bold text-xl sm:text-2xl flex items-center gap-2">' +
          '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
            '<path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>' +
            '<path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>' +
          '</svg>' +
          'Atención Municipio' +
        '</h1>' +
        '<p class="text-slate-500 text-sm mt-0.5">Gestión de jornadas por ruta y municipio.</p>' +
      '</div>' +
      (esAdmin
        ? '<button onclick="amAbrirModalCrear()" class="btn-primario flex items-center gap-2 px-4 py-2.5 rounded-md-plus text-white text-sm font-semibold hover:bg-verde-oscuro active:scale-95 transition-all">' +
            '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>' +
            'Agregar Municipio' +
          '</button>'
        : '') +
    '</div>' +

    // Spinner
    '<div id="am-lista-spinner" class="flex items-center justify-center py-16">' +
      '<div class="spinner"></div>' +
    '</div>' +

    // Error de carga
    '<div id="am-lista-error" class="hidden bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-red-700 text-sm flex items-center gap-3">' +
      '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>' +
      '<span id="am-lista-error-txt">Error al cargar.</span>' +
      '<button onclick="_amCargarMunicipios(true)" class="ml-auto text-xs font-semibold underline">Reintentar</button>' +
    '</div>' +

    // Contenido (rutas + cards)
    '<div id="am-lista-contenido" class="hidden"></div>' +

    // Estado vacío
    '<div id="am-lista-vacio" class="hidden">' +
      '<div class="bg-white rounded-md-plus shadow-card p-10 text-center">' +
        '<div class="w-14 h-14 rounded-full bg-verde-suave flex items-center justify-center mx-auto mb-4">' +
          '<svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-verde-oscuro" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>' +
        '</div>' +
        '<h3 class="font-bold text-verde-oscuro text-base mb-1">Sin municipios registrados</h3>' +
        '<p class="text-slate-400 text-sm">' + (esAdmin ? 'Presiona "Agregar Municipio" para comenzar.' : 'El administrador aún no ha registrado municipios.') + '</p>' +
      '</div>' +
    '</div>' +

    // MODAL crear/editar (solo admin)
    (esAdmin ? _amModalHtml() : '') +

  '</div>';
}

// ══════════════════════════════════════════════════════════════
// CARGA DE DATOS
// ══════════════════════════════════════════════════════════════

function _amCargarMunicipios(forzar) {
  if (_amCargando) return;

  if (_amDatosCargados && !forzar) {
    _amMostrarMunicipios();
    return;
  }

  _amCargando = true;
  _amDatosCargados = false;

  var spinner   = document.getElementById('am-lista-spinner');
  var errorEl   = document.getElementById('am-lista-error');
  var contenido = document.getElementById('am-lista-contenido');
  var vacio     = document.getElementById('am-lista-vacio');

  if (spinner)   spinner.classList.remove('hidden');
  if (errorEl)   errorEl.classList.add('hidden');
  if (contenido) contenido.classList.add('hidden');
  if (vacio)     vacio.classList.add('hidden');

  AtencionMunicipioService.listarMunicipios()
    .then(function (lista) {
      _amMunicipios = Array.isArray(lista) ? lista : [];
      _amDatosCargados = true;
      _amCargando   = false;
      _amMostrarMunicipios();
    })
    .catch(function (err) {
      _amCargando = false;
      if (spinner) spinner.classList.add('hidden');
      if (errorEl) {
        var txt = document.getElementById('am-lista-error-txt');
        if (txt) txt.textContent = err.message || 'Error al cargar municipios.';
        errorEl.classList.remove('hidden');
      }
    });
}

function _amMostrarMunicipios() {
  var spinner   = document.getElementById('am-lista-spinner');
  var errorEl   = document.getElementById('am-lista-error');
  var contenido = document.getElementById('am-lista-contenido');
  var vacio     = document.getElementById('am-lista-vacio');

  if (spinner) spinner.classList.add('hidden');
  if (errorEl) errorEl.classList.add('hidden');
  if (vacio) vacio.classList.toggle('hidden', _amMunicipios.length !== 0);
  if (contenido) {
    contenido.innerHTML = _amMunicipios.length ? _amRenderRutas(_amMunicipios) : '';
    contenido.classList.toggle('hidden', _amMunicipios.length === 0);
  }
}

// ══════════════════════════════════════════════════════════════
// RENDER RUTAS Y CARDS
// ══════════════════════════════════════════════════════════════

function _amRenderRutas(lista) {
  // Agrupar por Ruta
  var rutas = {};
  lista.forEach(function (m) {
    var r = String(m.ruta || 'Sin Ruta');
    if (!rutas[r]) rutas[r] = [];
    rutas[r].push(m);
  });

  // Ordenar rutas numéricamente
  var claves = Object.keys(rutas).sort(function (a, b) {
    var na = parseInt(a, 10), nb = parseInt(b, 10);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });

  return claves.map(function (ruta) {
    var municipios = rutas[ruta];
    var label = isNaN(parseInt(ruta, 10)) ? ruta : 'Ruta ' + ruta;

    return '<div class="mb-8">' +
      // Encabezado de ruta
      '<div class="flex items-center gap-3 mb-4">' +
        '<div class="flex items-center gap-2">' +
          '<div class="w-8 h-8 rounded-full bg-[#083F4A] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">' +
            _amEsc(isNaN(parseInt(ruta, 10)) ? '?' : ruta) +
          '</div>' +
          '<h2 class="font-bold text-slate-700 text-base">' + _amEsc(label) + '</h2>' +
          '<span class="text-xs text-slate-400 font-medium">' + municipios.length + ' municipio' + (municipios.length !== 1 ? 's' : '') + '</span>' +
        '</div>' +
        '<div class="flex-1 h-px bg-slate-200"></div>' +
      '</div>' +
      // Grid de cards
      '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">' +
        municipios.map(function (m) { return _amCardHtml(m); }).join('') +
      '</div>' +
    '</div>';
  }).join('');
}

function _amCardHtml(m) {
  var esAdmin   = _amPerfil === 'Administrador';
  var badgeInfo = _amBadgeEstado(m.estado);
  var fecha     = m.fechaAtencion
    ? new Date(m.fechaAtencion).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return '<div class="bg-white rounded-md-plus shadow-card overflow-hidden hover:shadow-lg transition-shadow">' +

    // Franja de color por estado
    '<div class="h-1.5 ' + badgeInfo.barra + '"></div>' +

    '<div class="p-4">' +
      // Nombre — clic abre visor
      '<button onclick="amAbrirVisor(\'' + _amEsc(m.id) + '\')" ' +
        'class="w-full text-left group">' +
        '<div class="flex items-start gap-3">' +
          '<div class="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-verde-suave transition-colors">' +
            '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-400 group-hover:text-verde-oscuro transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M3 14h18M10 3v18M14 3v18"/></svg>' +
          '</div>' +
          '<div class="min-w-0">' +
            '<h3 class="font-bold text-slate-800 text-sm truncate group-hover:text-verde-oscuro transition-colors">' + _amEsc(m.municipio) + '</h3>' +
            '<p class="text-slate-400 text-xs mt-0.5">📅 ' + fecha + '</p>' +
          '</div>' +
        '</div>' +
      '</button>' +

      // Selector de estado
      '<div class="mt-3">' +
        '<select onchange="amCambiarEstado(\'' + _amEsc(m.id) + '\', this.value)" ' +
          'class="w-full text-xs font-semibold rounded-lg px-2.5 py-1.5 border-0 outline-none cursor-pointer ' + badgeInfo.select + '" ' +
          'title="Cambiar estado">' +
          AtencionMunicipioService.ESTADOS.map(function (e) {
            return '<option value="' + e + '"' + (m.estado === e ? ' selected' : '') + '>' + e + '</option>';
          }).join('') +
        '</select>' +
      '</div>' +

      // Acciones admin
      (esAdmin
        ? '<div class="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-slate-100">' +
            '<button onclick="amAbrirModalEditar(\'' + _amEsc(m.id) + '\')" title="Editar" ' +
              'class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-blue-50 text-slate-300 hover:text-blue-500 transition-colors">' +
              '<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>' +
            '</button>' +
            '<button onclick="amConfirmarEliminar(\'' + _amEsc(m.id) + '\',\'' + _amEsc(m.municipio) + '\')" title="Eliminar" ' +
              'class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors">' +
              '<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>' +
            '</button>' +
          '</div>'
        : '') +
    '</div>' +
  '</div>';
}

function _amBadgeEstado(estado) {
  if (estado === 'Digitalizado')   return { barra: 'bg-green-400',  select: 'bg-green-100 text-green-800' };
  if (estado === 'Por Atender')    return { barra: 'bg-yellow-400', select: 'bg-yellow-100 text-yellow-800' };
  return                                  { barra: 'bg-red-400',    select: 'bg-red-100 text-red-800' };
}

// ══════════════════════════════════════════════════════════════
// CAMBIAR ESTADO
// ══════════════════════════════════════════════════════════════

function amCambiarEstado(id, nuevoEstado) {
  // Actualizar localmente de inmediato (optimista)
  var m = _amMunicipios.find(function (x) { return x.id === id; });
  if (m) m.estado = nuevoEstado;

  AtencionMunicipioService.cambiarEstado(id, nuevoEstado)
    .catch(function (err) {
      console.warn('[AtencionMunicipio] Error al cambiar estado:', err.message);
      // Recargar para sincronizar
      _amCargarMunicipios(true);
    });
}

// ══════════════════════════════════════════════════════════════
// MODAL CREAR / EDITAR (solo admin)
// ══════════════════════════════════════════════════════════════

function _amModalHtml() {
  return '<div id="am-modal-overlay" ' +
    'class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm hidden" ' +
    'onclick="amCerrarModal(event)">' +
    '<div class="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6" onclick="event.stopPropagation()">' +
      '<div class="flex items-center justify-between mb-5">' +
        '<h2 id="am-modal-titulo" class="font-bold text-verde-oscuro text-base">Agregar Municipio</h2>' +
        '<button onclick="amCerrarModal()" class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors">' +
          '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>' +
        '</button>' +
      '</div>' +
      '<form id="am-form" onsubmit="amGuardar(event)" novalidate>' +

        '<div class="grid grid-cols-2 gap-4 mb-4">' +
          // Ruta
          '<div>' +
            '<label class="block text-[11px] uppercase text-slate-400 font-semibold mb-1.5">Ruta <span class="text-red-400">*</span></label>' +
            '<input type="number" id="am-inp-ruta" required min="1" placeholder="1" ' +
              'class="w-full px-4 py-2.5 rounded-[12px] border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-verde-oscuro/30 focus:border-verde-oscuro transition-all">' +
          '</div>' +
          // Municipio
          '<div>' +
            '<label class="block text-[11px] uppercase text-slate-400 font-semibold mb-1.5">Municipio <span class="text-red-400">*</span></label>' +
            '<input type="text" id="am-inp-municipio" required placeholder="Maracaibo" ' +
              'class="w-full px-4 py-2.5 rounded-[12px] border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-verde-oscuro/30 focus:border-verde-oscuro transition-all">' +
          '</div>' +
          // Fecha Atención
          '<div>' +
            '<label class="block text-[11px] uppercase text-slate-400 font-semibold mb-1.5">Fecha Atención <span class="text-red-400">*</span></label>' +
            '<input type="date" id="am-inp-fecha-atencion" required ' +
              'class="w-full px-4 py-2.5 rounded-[12px] border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-verde-oscuro/30 focus:border-verde-oscuro transition-all">' +
          '</div>' +
          // Fecha Entrega
          '<div>' +
            '<label class="block text-[11px] uppercase text-slate-400 font-semibold mb-1.5">Fecha Entrega Lentes</label>' +
            '<input type="date" id="am-inp-fecha-entrega" ' +
              'class="w-full px-4 py-2.5 rounded-[12px] border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-verde-oscuro/30 focus:border-verde-oscuro transition-all">' +
          '</div>' +
        '</div>' +

        // Link hoja
        '<div class="mb-4">' +
          '<label class="block text-[11px] uppercase text-slate-400 font-semibold mb-1.5">Link de la Hoja de Atención <span class="text-red-400">*</span></label>' +
          '<input type="text" id="am-inp-link" required placeholder="https://docs.google.com/spreadsheets/d/..." ' +
            'class="w-full px-4 py-2.5 rounded-[12px] border border-slate-200 text-sm font-mono outline-none focus:ring-2 focus:ring-verde-oscuro/30 focus:border-verde-oscuro transition-all">' +
          '<p class="text-[11px] text-slate-400 mt-1">Pega la URL completa de la hoja de Google Sheets de este municipio.</p>' +
        '</div>' +

        // Estado
        '<div class="mb-5">' +
          '<label class="block text-[11px] uppercase text-slate-400 font-semibold mb-1.5">Estado inicial</label>' +
          '<select id="am-inp-estado" ' +
            'class="w-full px-4 py-2.5 rounded-[12px] border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-verde-oscuro/30 focus:border-verde-oscuro transition-all">' +
            AtencionMunicipioService.ESTADOS.map(function (e) {
              return '<option value="' + e + '">' + e + '</option>';
            }).join('') +
          '</select>' +
        '</div>' +

        '<div id="am-modal-error" class="hidden mb-4 text-sm text-center font-medium rounded-lg px-4 py-2 bg-red-50 text-red-600"></div>' +

        '<div class="flex gap-3">' +
          '<button type="button" onclick="amCerrarModal()" ' +
            'class="flex-1 px-4 py-2.5 rounded-md-plus border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50 transition-all">Cancelar</button>' +
          '<button type="submit" id="am-btn-guardar" ' +
            'class="flex-1 btn-primario px-4 py-2.5 rounded-md-plus text-white text-sm font-semibold hover:bg-verde-oscuro active:scale-95 transition-all flex items-center justify-center gap-2">' +
            '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>Guardar' +
          '</button>' +
        '</div>' +
      '</form>' +
    '</div>' +
  '</div>';
}

function amAbrirModalCrear() {
  _amEditandoId = null;
  var titulo = document.getElementById('am-modal-titulo');
  var form   = document.getElementById('am-form');
  var err    = document.getElementById('am-modal-error');
  var btn    = document.getElementById('am-btn-guardar');
  if (titulo) titulo.textContent = 'Agregar Municipio';
  if (form)   form.reset();
  if (err)    err.classList.add('hidden');
  if (btn)    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>Guardar';
  var overlay = document.getElementById('am-modal-overlay');
  if (overlay) {
    overlay.classList.remove('hidden');
    setTimeout(function () { var i = document.getElementById('am-inp-ruta'); if (i) i.focus(); }, 80);
  }
}

function amAbrirModalEditar(id) {
  var m = _amMunicipios.find(function (x) { return x.id === id; });
  if (!m) return;
  _amEditandoId = id;

  var titulo = document.getElementById('am-modal-titulo');
  var err    = document.getElementById('am-modal-error');
  var btn    = document.getElementById('am-btn-guardar');
  if (titulo) titulo.textContent = 'Editar Municipio';
  if (err)    err.classList.add('hidden');
  if (btn)    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>Actualizar';

  var f = function (id, v) { var el = document.getElementById(id); if (el) el.value = v || ''; };
  f('am-inp-ruta',          m.ruta          || '');
  f('am-inp-municipio',     m.municipio     || '');
  f('am-inp-fecha-atencion',m.fechaAtencion ? m.fechaAtencion.split('T')[0] : '');
  f('am-inp-fecha-entrega', m.fechaEntrega  ? m.fechaEntrega.split('T')[0]  : '');
  f('am-inp-link',          m.linkHoja      || '');
  var sel = document.getElementById('am-inp-estado');
  if (sel) sel.value = m.estado || 'Sin Digitalizar';

  var overlay = document.getElementById('am-modal-overlay');
  if (overlay) overlay.classList.remove('hidden');
}

function amCerrarModal(event) {
  if (event && event.target !== document.getElementById('am-modal-overlay')) return;
  var overlay = document.getElementById('am-modal-overlay');
  if (overlay) overlay.classList.add('hidden');
  _amEditandoId = null;
}

function amGuardar(event) {
  event.preventDefault();
  var esEdicion = !!_amEditandoId;
  var btn = document.getElementById('am-btn-guardar');
  var err = document.getElementById('am-modal-error');
  if (err) err.classList.add('hidden');

  var datos = {
    ruta:          (document.getElementById('am-inp-ruta').value         || '').trim(),
    municipio:     (document.getElementById('am-inp-municipio').value    || '').trim(),
    fechaAtencion: (document.getElementById('am-inp-fecha-atencion').value || '').trim(),
    fechaEntrega:  (document.getElementById('am-inp-fecha-entrega').value  || '').trim(),
    linkHoja:      (document.getElementById('am-inp-link').value         || '').trim(),
    estado:        (document.getElementById('am-inp-estado').value       || 'Sin Digitalizar')
  };

  if (!datos.ruta || !datos.municipio || !datos.fechaAtencion || !datos.linkHoja) {
    if (err) { err.textContent = 'Completa los campos obligatorios.'; err.classList.remove('hidden'); }
    return;
  }

  if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;margin-right:6px"></div>' + (esEdicion ? 'Actualizando…' : 'Guardando…'); }

  var promesa = esEdicion
    ? AtencionMunicipioService.actualizarMunicipio(Object.assign({ id: _amEditandoId }, datos))
    : AtencionMunicipioService.guardarMunicipio(datos);

  promesa
    .then(function () {
      _amEditandoId = null;
      var overlay = document.getElementById('am-modal-overlay');
      if (overlay) overlay.classList.add('hidden');
      _amCargarMunicipios(true); // actualizar cache desde la hoja
    })
    .catch(function (e) {
      if (err) { err.textContent = e.message || 'Error al guardar.'; err.classList.remove('hidden'); }
    })
    .finally(function () {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>' + (esEdicion ? 'Actualizar' : 'Guardar');
      }
    });
}

function amConfirmarEliminar(id, nombre) {
  if (!confirm('¿Eliminar el municipio "' + nombre + '"?\nEsta acción no se puede deshacer.')) return;
  AtencionMunicipioService.eliminarMunicipio(id)
    .then(function () { _amCargarMunicipios(true); })
    .catch(function (e) { alert('Error al eliminar: ' + e.message); });
}

// ══════════════════════════════════════════════════════════════
// VISTA VISOR — iframe pantalla completa
// ══════════════════════════════════════════════════════════════

function amAbrirVisor(id) {
  var m = _amMunicipios.find(function (x) { return x.id === id; });
  if (!m || !m.linkHoja) {
    alert('Este municipio no tiene hoja de cálculo asignada.');
    return;
  }

  _amMunicipioVisor = m;
  _amInmersivo      = false;

  var contenedor = document.getElementById('admin-content');
  if (!contenedor) return;

  contenedor.innerHTML = _amVisorHtml(m);
  _amOcultarMenuLateral();

  // Cargar iframe de inmediato en modo editar (con barra de herramientas)
  setTimeout(function () { amCargarIframe(); }, 100);
}

function _amVisorHtml(m) {
  var fecha = m.fechaAtencion
    ? new Date(m.fechaAtencion).toLocaleDateString('es-VE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  return '<div class="am-shell" id="am-visor-root">' +

    // Topbar del visor
    '<div class="am-topbar" id="am-topbar">' +

      '<div class="am-topbar-left">' +
        // Botón volver
        '<button onclick="renderAtencionMunicipio()" class="am-btn-volver" title="Volver a la lista">' +
          '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>' +
          'Volver' +
        '</button>' +
        '<div class="w-px h-5 bg-slate-200"></div>' +
        '<div>' +
          '<span class="am-title">' + _amEsc(m.municipio) + '</span>' +
          '<span class="text-[11px] text-slate-400 ml-2">📅 ' + fecha + '</span>' +
        '</div>' +
      '</div>' +

      '<div class="am-topbar-right">' +
        '<div class="am-mobile-zoom" aria-label="Zoom de la hoja">' +
          '<button type="button" onclick="amCambiarZoomMovil(-1)" title="Reducir tamaño de la hoja" class="am-mobile-zoom-btn">−</button>' +
          '<span id="am-zoom-valor" class="am-mobile-zoom-valor">100%</span>' +
          '<button type="button" onclick="amCambiarZoomMovil(1)" title="Aumentar tamaño de la hoja" class="am-mobile-zoom-btn">+</button>' +
        '</div>' +
        // Pantalla completa
        '<button id="am-btn-inmersivo" onclick="amToggleInmersivo()" title="Pantalla completa" class="am-btn-inmersivo">' +
          '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
            '<path stroke-linecap="round" stroke-linejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>' +
          '</svg>' +
          '<span id="am-txt-inmersivo" class="am-inmersivo-txt">Pantalla completa</span>' +
        '</button>' +
      '</div>' +
    '</div>' +

    // Área de contenido
    '<div class="am-body">' +
      '<div id="am-spinner" class="am-panel">' +
        '<div class="spinner" style="width:28px;height:28px;border-width:3px"></div>' +
        '<p class="am-spinner-txt mt-3">Cargando hoja…</p>' +
      '</div>' +
      '<div id="am-iframe-wrap" class="am-panel am-iframe-panel hidden">' +
        '<iframe id="am-iframe" class="am-iframe" allowfullscreen allow="clipboard-read; clipboard-write; fullscreen"></iframe>' +
      '</div>' +
    '</div>' +

  '</div>';
}

function amCargarIframe() {
  var iframe  = document.getElementById('am-iframe');
  var spinner = document.getElementById('am-spinner');
  var wrap    = document.getElementById('am-iframe-wrap');
  if (!iframe || !_amMunicipioVisor) return;

  if (spinner) spinner.classList.remove('hidden');
  if (wrap)    wrap.classList.add('hidden');

  var timer = setTimeout(function () {
    if (spinner) spinner.classList.add('hidden');
    if (wrap)    wrap.classList.remove('hidden');
  }, 3000);

  iframe.onload = function () {
    clearTimeout(timer);
    if (spinner) spinner.classList.add('hidden');
    if (wrap)    wrap.classList.remove('hidden');
  };

  // Siempre cargar en modo edición para tener barra de herramientas completa
  iframe.src = _amMunicipioVisor.linkHoja;
}

function amCambiarZoomMovil(direccion) {
  var niveles = [0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4];
  var actual = niveles.indexOf(_amZoomMovil);
  var siguiente = Math.max(0, Math.min(niveles.length - 1, actual + direccion));
  _amZoomMovil = niveles[siguiente];

  var iframe = document.getElementById('am-iframe');
  var valor = document.getElementById('am-zoom-valor');
  if (iframe) iframe.style.setProperty('--am-zoom', String(_amZoomMovil));
  if (valor) valor.textContent = Math.round(_amZoomMovil * 100) + '%';
}

function _amOcultarMenuLateral() {
  var sidebar = document.getElementById('admin-sidebar');
  if (sidebar) sidebar.style.display = 'none';
}

function _amRestaurarMenuLateral() {
  var sidebar = document.getElementById('admin-sidebar');
  if (sidebar) sidebar.style.display = '';
}

// ══════════════════════════════════════════════════════════════
// MODO INMERSIVO
// ══════════════════════════════════════════════════════════════

function amToggleInmersivo() {
  _amInmersivo ? amSalirInmersivo() : amEntrarInmersivo();
}

function amEntrarInmersivo() {
  _amInmersivo = true;
  var iframe = document.getElementById('am-iframe');
  var solicitarFullscreen = iframe && (iframe.requestFullscreen || iframe.webkitRequestFullscreen);
  var topbar   = document.getElementById('admin-topbar');
  var amTopbar = document.querySelector('.am-topbar');
  if (topbar)   topbar.style.display   = 'none';
  if (amTopbar) amTopbar.style.display = 'none';

  if (_amEsMovil() && solicitarFullscreen) {
    Promise.resolve(solicitarFullscreen.call(iframe)).catch(function () {
      _amInmersivo = false;
      amSalirInmersivo();
    });
  } else {
    _amCrearFAB();
  }
  _amActualizarBtnInmersivo();
}

function amSalirInmersivo() {
  if (_amEsMovil() && document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(function () {});
  }
  _amInmersivo = false;
  var topbar   = document.getElementById('admin-topbar');
  var amTopbar = document.querySelector('.am-topbar');
  if (topbar)   topbar.style.display   = '';
  if (amTopbar) amTopbar.style.display = '';

  var fab = document.getElementById('am-fab-salir');
  if (fab) fab.remove();

  _amActualizarBtnInmersivo();
}

function _amEsMovil() {
  return window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
}

document.addEventListener('fullscreenchange', function () {
  var visor = document.getElementById('am-visor-root');
  if (!visor || !_amEsMovil()) return;
  if (!document.fullscreenElement && _amInmersivo) {
    amSalirInmersivo();
  }
});

function _amCrearFAB() {
  var prev = document.getElementById('am-fab-salir');
  if (prev) prev.remove();
  var fab = document.createElement('button');
  fab.id        = 'am-fab-salir';
  fab.title     = 'Salir de pantalla completa';
  fab.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 9V4H4v5h5zm6 0h5V4h-5v5zm-6 6H4v5h5v-5zm6 0v5h5v-5h-5z"/></svg>' +
    '<span>Mostrar menú</span>';
  fab.onclick = amSalirInmersivo;
  document.body.appendChild(fab);
}

function _amActualizarBtnInmersivo() {
  var btn   = document.getElementById('am-btn-inmersivo');
  var texto = document.getElementById('am-txt-inmersivo');
  if (!btn) return;
  if (_amInmersivo) {
    if (texto) texto.textContent = 'Salir pantalla completa';
    btn.classList.add('am-inmersivo-activo');
  } else {
    if (texto) texto.textContent = 'Pantalla completa';
    btn.classList.remove('am-inmersivo-activo');
  }
}

// ══════════════════════════════════════════════════════════════
// UTILIDAD
// ══════════════════════════════════════════════════════════════

function _amEsc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
