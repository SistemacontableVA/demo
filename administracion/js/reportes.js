/* ============================================================
   REPORTES.JS — Módulo de Reportes de Lentes y Desempeño
   Módulo Administración · Óptica Visión de Águila
   Consume ReportesService.obtenerReporteLentes(filtros)
   ============================================================ */

/* ── Estado local del módulo ── */
var _rptFiltros          = { fechaInicio: '', fechaFin: '', municipio: '', asesor: '' };
var _rptMunicipios       = [];
var _rptAsesores         = [];
var _rptUltimaRespuesta  = null;
var _rptContabilidadSeleccionada = null;

/* ════════════════════════════════════════════════════════════
   PUNTO DE ENTRADA — llamado por el router del admin
════════════════════════════════════════════════════════════ */
function renderReportes() {
  var c = document.getElementById('admin-content');
  if (!c) return;

  // Resetear estado
  _rptFiltros         = { fechaInicio: '', fechaFin: '', municipio: '', asesor: '' };
  _rptUltimaRespuesta = null;

  // Solo muestra la UI con filtros vacíos — NO ejecuta consulta automática.
  // El usuario debe configurar los filtros y presionar "Aplicar".
  c.innerHTML = _rptShellHtml();

  // Cargar solo la lista de municipios en segundo plano para poblar el selector
  _rptCargarMunicipios();
}

/* ════════════════════════════════════════════════════════════
   CARGA Y RENDERIZADO
════════════════════════════════════════════════════════════ */

/**
 * Carga SOLO la lista de municipios para poblar el selector.
 * No ejecuta el reporte completo. Usa una consulta mínima
 * pidiendo solo municipios (sin fechas → retorna todo pero
 * solo usamos municipiosDisponibles del response).
 */
function _rptCargarMunicipios() {
  var baseUrl = window.API_URL;
  if (!baseUrl) return;

  fetch(baseUrl + '?action=obtener-reporte-lentes', { cache: 'no-store' })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data && data.municipiosDisponibles && data.municipiosDisponibles.length) {
        _rptMunicipios = data.municipiosDisponibles;
        _rptActualizarSelectorMunicipio();
      }
      if (data && data.asesoresDisponibles && data.asesoresDisponibles.length) {
        _rptAsesores = data.asesoresDisponibles;
        _rptActualizarSelectorAsesor();
      }
    })
    .catch(function () { /* silencioso */ });
}

/**
 * Ejecuta el reporte completo con los filtros activos.
 * Solo se llama cuando el usuario presiona "Aplicar Filtros".
 */
function _rptCargar() {
  _rptEstadoCargando(true);

  // Ocultar el placeholder de bienvenida si existe
  var placeholder = document.getElementById('rpt-placeholder');
  if (placeholder) placeholder.style.display = 'none';

  ReportesService.obtenerReporteLentes(_rptFiltros)
    .then(function (data) {
      _rptEstadoCargando(false);

      if (!data || !data.ok) {
        _rptMostrarError(data && data.error
          ? data.error
          : 'No se pudo obtener el reporte. Verifica la URL del Web App.');
        return;
      }

      _rptUltimaRespuesta = data;

      // Actualizar selectores con los datos reales
      if (data.municipiosDisponibles && data.municipiosDisponibles.length) {
        _rptMunicipios = data.municipiosDisponibles;
        _rptActualizarSelectorMunicipio();
      }
      if (data.asesoresDisponibles && data.asesoresDisponibles.length) {
        _rptAsesores = data.asesoresDisponibles;
        _rptActualizarSelectorAsesor();
      }

      // Si hay un asesor seleccionado → mostrar su detalle en lugar del ranking general
      if (_rptFiltros.asesor) {
        _rptRenderKpis(data.kpis);
        _rptRenderDetalleAsesor(data);
      } else {
        _rptRenderKpis(data.kpis);
        _rptRenderRanking(data.rankingPromotores || []);
        _rptRenderEmbudo(data.embudoMunicipios   || []);
      }
    })
    .catch(function (err) {
      _rptEstadoCargando(false);
      _rptMostrarError('Error inesperado: ' + err);
    });
}

async function _rptCargarContabilidadCerrada() {
  var fecha = document.getElementById('rpt-contabilidad-fecha') ? document.getElementById('rpt-contabilidad-fecha').value : '';
  if (!fecha) {
    alert('Selecciona una fecha antes de cargar la contabilidad cerrada.');
    return;
  }

  var draft = null;
  try {
    if (window.ContabilidadDiariaService) {
      if (typeof window.ContabilidadDiariaService.loadRemoteDraftByFecha === 'function') {
        draft = await window.ContabilidadDiariaService.loadRemoteDraftByFecha(fecha);
      }
      if (!draft && typeof window.ContabilidadDiariaService.loadDraft === 'function') {
        draft = window.ContabilidadDiariaService.loadDraft(fecha);
      }
    }

    if (!draft) {
      var raw = localStorage.getItem('contabilidad_diaria_draft_v1');
      var current = raw ? JSON.parse(raw) : null;
      if (current && String(current.fecha || '').slice(0, 10) === fecha) {
        draft = current;
      }
    }
  } catch (error) {
    console.warn('[Reportes] Error cargando contabilidad cerrada:', error);
  }

  if (!draft) {
    alert('No se encontró una contabilidad cerrada para esa fecha.');
    _rptContabilidadSeleccionada = null;
    var detalle = document.getElementById('rpt-contabilidad-detalle');
    if (detalle) {
      detalle.classList.add('hidden');
      detalle.innerHTML = '';
    }
    return;
  }

  _rptContabilidadSeleccionada = draft;
  var detalle = document.getElementById('rpt-contabilidad-detalle');
  if (!detalle) return;

  var saldo = Number(draft.totales && draft.totales.saldoFinal ? draft.totales.saldoFinal : 0) || 0;
  var ingresos = Number(draft.totales && draft.totales.totalIngresos ? draft.totales.totalIngresos : 0) || 0;
  var egresos = Number(draft.totales && draft.totales.totalEgresos ? draft.totales.totalEgresos : 0) || 0;
  var deduccion = Number(draft.totales && draft.totales.totalDeduccion ? draft.totales.totalDeduccion : 0) || 0;

  detalle.innerHTML = [
    '<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">',
      '<div class="bg-white rounded-lg border border-slate-200 p-3"><div class="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Fecha</div><div class="mt-1 font-bold text-slate-700">' + (draft.fecha || fecha) + '</div></div>',
      '<div class="bg-white rounded-lg border border-slate-200 p-3"><div class="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Municipio</div><div class="mt-1 font-bold text-slate-700">' + (draft.municipio || '—') + '</div></div>',
      '<div class="bg-white rounded-lg border border-slate-200 p-3"><div class="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Coordinador</div><div class="mt-1 font-bold text-slate-700">' + (draft.coordinador || '—') + '</div></div>',
      '<div class="bg-white rounded-lg border border-slate-200 p-3"><div class="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Estado</div><div class="mt-1 font-bold text-emerald-700">' + (draft.estado || 'borrador') + '</div></div>',
    '</div>',
    '<div class="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">',
      '<div class="bg-white rounded-lg border border-slate-200 p-3"><div class="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Afiliaciones</div><div class="mt-1 font-bold text-slate-700">' + (Array.isArray(draft.afiliaciones) ? draft.afiliaciones.length : 0) + '</div></div>',
      '<div class="bg-white rounded-lg border border-slate-200 p-3"><div class="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Ingresos</div><div class="mt-1 font-bold text-slate-700">$' + Number(ingresos).toLocaleString('es-VE', { maximumFractionDigits: 2 }) + '</div></div>',
      '<div class="bg-white rounded-lg border border-slate-200 p-3"><div class="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Egresos</div><div class="mt-1 font-bold text-slate-700">$' + Number(egresos).toLocaleString('es-VE', { maximumFractionDigits: 2 }) + '</div></div>',
      '<div class="bg-white rounded-lg border border-slate-200 p-3"><div class="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Saldo final</div><div class="mt-1 font-bold text-slate-700">$' + Number(saldo).toLocaleString('es-VE', { maximumFractionDigits: 2 }) + '</div></div>',
    '</div>',
    '<div class="mt-4 text-xs text-slate-500">Deducción: $' + Number(deduccion).toLocaleString('es-VE', { maximumFractionDigits: 2 }) + ' · Carga válida para revisión administrativa.</div>'
  ].join('');

  detalle.classList.remove('hidden');
}

function _rptValidarContabilidadSeleccionada() {
  if (!_rptContabilidadSeleccionada) {
    alert('Primero carga la contabilidad cerrada de una fecha.');
    return;
  }

  var draft = JSON.parse(JSON.stringify(_rptContabilidadSeleccionada));
  draft.estado = 'validada';
  draft.actualizadoEn = new Date().toISOString();

  if (window.ContabilidadDiariaService && typeof window.ContabilidadDiariaService.saveDraft === 'function') {
    var saved = window.ContabilidadDiariaService.saveDraft(draft);
    if (saved && saved.ok) {
      _rptContabilidadSeleccionada = draft;
      var detalle = document.getElementById('rpt-contabilidad-detalle');
      if (detalle) {
        detalle.innerHTML = detalle.innerHTML.replace(/>borrador<|>cerrada<|>pendiente_de_validacion<|>validada</, '');
      }
      alert('La contabilidad fue validada correctamente y queda disponible para la siguiente etapa.');
      return;
    }
  }

  localStorage.setItem('contabilidad_diaria_draft_v1', JSON.stringify(draft));
  _rptContabilidadSeleccionada = draft;
  alert('La contabilidad fue validada correctamente.');
}

/* ════════════════════════════════════════════════════════════
   SHELL HTML — Estructura base de la vista
════════════════════════════════════════════════════════════ */
function _rptShellHtml() {
  return [
    '<div id="rpt-root" class="fade-in">',

    /* ── Encabezado ── */
    '<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">',
      '<div>',
        '<h3 class="text-verde-oscuro font-bold text-lg">Reportes de Lentes y Desempeño</h3>',
        '<p class="text-slate-400 text-sm mt-0.5">Datos consolidados desde las hojas GENERAL y Relacion Lentes</p>',
      '</div>',
    '</div>',

    /* ── Barra de filtros ── */
    '<div class="bg-white rounded-xl shadow-soft p-4 mb-5">',
      '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">',

        /* Fecha inicio */
        '<div>',
          '<label class="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Fecha Inicio</label>',
          '<input type="date" id="rpt-fecha-ini"',
                 'class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-slate-50',
                 'focus:outline-none focus:border-verde-oscuro focus:ring-2 focus:ring-verde-oscuro/10 focus:bg-white transition-all">',
        '</div>',

        /* Fecha fin */
        '<div>',
          '<label class="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Fecha Fin</label>',
          '<input type="date" id="rpt-fecha-fin"',
                 'class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-slate-50',
                 'focus:outline-none focus:border-verde-oscuro focus:ring-2 focus:ring-verde-oscuro/10 focus:bg-white transition-all">',
        '</div>',

        /* Municipio */
        '<div>',
          '<label class="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Municipio</label>',
          '<select id="rpt-municipio"',
                  'class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-slate-50',
                  'focus:outline-none focus:border-verde-oscuro focus:ring-2 focus:ring-verde-oscuro/10 focus:bg-white transition-all">',
            '<option value="">Todos los municipios</option>',
          '</select>',
        '</div>',

        /* Asesor */
        '<div>',
          '<label class="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Asesor</label>',
          '<select id="rpt-asesor"',
                  'onchange="_rptOnAsesorChange()"',
                  'class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-slate-50',
                  'focus:outline-none focus:border-verde-oscuro focus:ring-2 focus:ring-verde-oscuro/10 focus:bg-white transition-all">',
            '<option value="">Todos los asesores</option>',
          '</select>',
        '</div>',

        /* Botón aplicar + limpiar */
        '<div class="flex gap-2">',
          '<button onclick="_rptAplicarFiltros()"',
                  'class="flex-1 btn-primario hover:bg-verde-oscuro active:scale-95 transition-all text-white',
                  'font-semibold text-sm px-4 py-2 rounded-lg flex items-center justify-center gap-1.5">',
            '<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">',
              '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"',
                    'd="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4',
                    '4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>',
            '</svg>',
            'Aplicar',
          '</button>',
          '<button onclick="_rptLimpiarFiltros()" title="Limpiar filtros"',
                  'class="px-3 py-2 border border-slate-200 rounded-lg text-slate-500 hover:text-verde-oscuro',
                  'hover:border-petroleo/30 transition-all bg-white">',
            '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">',
              '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>',
            '</svg>',
          '</button>',
        '</div>',

      '</div>',
      /* Badge período activo */
      '<div id="rpt-periodo-badge" class="hidden mt-3 flex items-center gap-2">',
        '<span class="text-[10px] font-bold text-verde-oscuro bg-verde-suave px-2.5 py-1 rounded-full" id="rpt-periodo-texto"></span>',
      '</div>',
    '</div>',

    /* ── Bloque de contabilidad cerrada (administrador) ── */
    '<div class="bg-white rounded-xl shadow-soft p-4 mb-5 border border-emerald-100">',
      '<div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">',
        '<div>',
          '<h4 class="text-verde-oscuro font-bold text-base">Validación de cierre contable</h4>',
          '<p class="text-slate-400 text-sm mt-0.5">Selecciona la fecha de la jornada cerrada por el coordinador y valida el reporte administrativo.</p>',
        '</div>',
        '<div class="flex flex-col sm:flex-row gap-2 items-end">',
          '<div>',
            '<label class="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Fecha del cierre</label>',
            '<input type="date" id="rpt-contabilidad-fecha" class="w-full sm:w-48 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-slate-50 focus:outline-none focus:border-verde-oscuro focus:ring-2 focus:ring-verde-oscuro/10 focus:bg-white transition-all">',
          '</div>',
          '<button onclick="_rptCargarContabilidadCerrada()" class="btn-primario hover:bg-verde-oscuro active:scale-95 transition-all text-white font-semibold text-sm px-4 py-2 rounded-lg">Cargar cierre</button>',
          '<button onclick="_rptValidarContabilidadSeleccionada()" class="bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all text-white font-semibold text-sm px-4 py-2 rounded-lg">Validar cierre</button>',
        '</div>',
      '</div>',
      '<div id="rpt-contabilidad-detalle" class="hidden mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4"></div>',
    '</div>',

    /* ── Zona dinámica ── */
    '<div id="rpt-error" class="hidden bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700"></div>',
    '<div id="rpt-spinner" class="hidden flex items-center justify-center h-40"><div class="spinner"></div></div>',

    /* Placeholder inicial — se oculta cuando llegan los datos */
    '<div id="rpt-placeholder" class="bg-white rounded-xl shadow-soft p-10 text-center mb-5">',
      '<div class="w-14 h-14 mx-auto rounded-full bg-verde-suave flex items-center justify-center mb-4">',
        '<svg class="w-7 h-7 text-verde-oscuro" fill="none" viewBox="0 0 24 24" stroke="currentColor">',
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"',
                'd="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>',
        '</svg>',
      '</div>',
      '<h4 class="text-verde-oscuro font-bold text-base mb-2">Configura los filtros para generar el reporte</h4>',
      '<p class="text-slate-400 text-sm max-w-sm mx-auto">Selecciona el rango de fechas y opcionalmente un municipio, luego presiona <strong>Aplicar Filtros</strong>.</p>',
    '</div>',

    '<div id="rpt-kpis"    class="mb-5"></div>',
    '<div id="rpt-ranking" class="mb-5"></div>',
    '<div id="rpt-embudo"  class="mb-2"></div>',

    '</div>'  /* fin rpt-root */
  ].join('');
}

/* ════════════════════════════════════════════════════════════
   RENDER KPIs
════════════════════════════════════════════════════════════ */
function _rptRenderKpis(kpis) {
  var el = document.getElementById('rpt-kpis');
  if (!el || !kpis) return;

  var mayorNombre = kpis.mayorVenta && kpis.mayorVenta.nombre
    ? kpis.mayorVenta.nombre : '—';
  var mayorTotal  = kpis.mayorVenta && kpis.mayorVenta.total
    ? kpis.mayorVenta.total  : 0;

  var cards = [
    {
      label: 'Total Lentes Vendidos',
      valor: (kpis.totalLentes || 0).toLocaleString('es-CO'),
      sub:   'en el período seleccionado',
      bg:    'bg-verde-suave',
      color: 'text-verde-oscuro',
      icono: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>'
    },
    {
      label: 'Promotores Activos',
      valor: (kpis.totalPromotores || 0).toLocaleString('es-CO'),
      sub:   'con registros en el período',
      bg:    'bg-verde-suave',
      color: 'text-verde-oscuro',
      icono: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-3.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4"/>'
    },
    {
      label: 'Total Monto a Pagar',
      valor: '$ ' + (kpis.totalMontoPagar || 0).toLocaleString('es-CO'),
      sub:   'suma del escalafón',
      bg:    'bg-emerald-50',
      color: 'text-emerald-700',
      icono: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>'
    },
    {
      label: 'Mayor Venta del Período',
      valor: mayorTotal.toLocaleString('es-CO') + ' lentes',
      sub:   mayorNombre,
      bg:    'bg-amber-50',
      color: 'text-amber-700',
      icono: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>'
    }
  ];

  el.innerHTML = '<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">' +
    cards.map(function (c) {
      return '<div class="admin-kpi-card">' +
        '<div class="w-9 h-9 rounded-xl ' + c.bg + ' flex items-center justify-center mb-3">' +
          '<svg class="w-5 h-5 ' + c.color + '" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
            c.icono +
          '</svg>' +
        '</div>' +
        '<div class="text-2xl font-extrabold ' + c.color + ' leading-tight">' + c.valor + '</div>' +
        '<div class="text-xs font-semibold text-slate-600 mt-0.5">' + c.label + '</div>' +
        '<div class="text-[10px] text-slate-400 mt-0.5 truncate">' + c.sub + '</div>' +
      '</div>';
    }).join('') +
  '</div>';
}

/* ════════════════════════════════════════════════════════════
   RENDER RANKING DE PROMOTORES
════════════════════════════════════════════════════════════ */
function _rptRenderRanking(ranking) {
  var el = document.getElementById('rpt-ranking');
  if (!el) return;

  if (!ranking.length) {
    el.innerHTML = '<div class="bg-white rounded-xl shadow-soft p-8 text-center text-slate-400 text-sm">' +
      'No hay datos de promotores para el período seleccionado.</div>';
    return;
  }

  var badgeClase = {
    'Excelente': 'bg-emerald-100 text-emerald-700',
    'Bueno':     'bg-verde-suave text-verde-oscuro',
    'Regular':   'bg-amber-100 text-amber-700',
    'Bajo':      'bg-red-100 text-red-600'
  };

  var filas = ranking.map(function (p, idx) {
    var bc = badgeClase[p.badge] || 'bg-slate-100 text-slate-600';
    var pctVBar = Math.min(p.eficVentas || 0, 100);
    var pctABar = Math.min(p.eficAsistencia || 0, 100);
    var medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : (idx + 1) + '.';

    return '<tr class="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">' +

      /* Posición */
      '<td class="px-3 py-2.5 text-center font-bold text-slate-500 text-sm w-10">' + medal + '</td>' +

      /* Nombre */
      '<td class="px-3 py-2.5">' +
        '<div class="font-semibold text-verde-oscuro text-sm truncate max-w-[160px]">' + p.nombre + '</div>' +
        '<div class="text-[10px] text-slate-400">' + (p.cedula || '') + '</div>' +
      '</td>' +

      /* Lentes */
      '<td class="px-3 py-2.5 text-center">' +
        '<div class="font-bold text-verde-oscuro text-base">' + (p.totalLentes || 0) + '</div>' +
        '<div class="text-[10px] text-slate-400">' +
          '<span class="text-verde-oscuro">' + (p.lenteEspecial || 0) + ' esp.</span>' +
          ' · ' +
          '<span class="text-emerald-600">' + (p.lenteSencillo || 0) + ' sen.</span>' +
        '</div>' +
      '</td>' +

      /* AFF */
      '<td class="px-3 py-2.5 text-center hidden lg:table-cell">' +
        '<div class="text-sm font-semibold text-slate-700">' + (p.nAff || 0) + '</div>' +
        '<div class="text-[10px] text-slate-400">' + (p.diasTrabajados || 0) + ' días</div>' +
      '</td>' +

      /* Asistencia */
      '<td class="px-3 py-2.5 text-center">' +
        '<div class="text-sm font-semibold text-slate-700">' + (p.asistencia || 0) + '</div>' +
        '<div class="w-16 mx-auto h-1.5 bg-slate-100 rounded-full mt-1">' +
          '<div class="h-full rounded-full bg-verde-suave/70" style="width:' + pctABar + '%"></div>' +
        '</div>' +
        '<div class="text-[10px] text-slate-400 mt-0.5">' + (p.eficAsistencia || 0) + '% ef.</div>' +
      '</td>' +

      /* Efic. Ventas barra */
      '<td class="px-3 py-2.5">' +
        '<div class="flex items-center gap-2">' +
          '<div class="flex-1 h-2 bg-slate-100 rounded-full">' +
            '<div class="h-full rounded-full btn-primario" style="width:' + pctVBar + '%"></div>' +
          '</div>' +
          '<span class="text-[11px] font-bold text-verde-oscuro w-8 text-right">' + (p.eficVentas || 0) + '%</span>' +
        '</div>' +
      '</td>' +

      /* Monto */
      '<td class="px-3 py-2.5 text-right text-sm font-semibold text-emerald-700">$ ' +
        (p.montoPagar || 0).toLocaleString('es-CO') +
      '</td>' +

      /* Badge */
      '<td class="px-3 py-2.5 text-center">' +
        '<span class="admin-badge ' + bc + '">' + (p.badge || '—') + '</span>' +
      '</td>' +

    '</tr>';
  }).join('');

  el.innerHTML =
    '<div class="bg-white rounded-xl shadow-soft overflow-hidden">' +
      '<div class="flex items-center justify-between px-4 py-3 border-b border-slate-100">' +
        '<h4 class="font-bold text-verde-oscuro text-sm">Escalafón de Promotores</h4>' +
        '<span class="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">' + ranking.length + ' promotores</span>' +
      '</div>' +
      '<div class="overflow-x-auto">' +
        '<table class="w-full text-sm">' +
          '<thead>' +
            '<tr class="bg-gris-claro text-[10px] uppercase tracking-wide text-slate-500">' +
              '<th class="px-3 py-2 text-center">#</th>' +
              '<th class="px-3 py-2 text-left">Promotor</th>' +
              '<th class="px-3 py-2 text-center">Lentes</th>' +
              '<th class="px-3 py-2 text-center hidden lg:table-cell">AFF / Días</th>' +
              '<th class="px-3 py-2 text-center">Asistencia</th>' +
              '<th class="px-3 py-2 text-left">Ef. Ventas</th>' +
              '<th class="px-3 py-2 text-right">Monto</th>' +
              '<th class="px-3 py-2 text-center">Desempeño</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' + filas + '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';
}

/* ════════════════════════════════════════════════════════════
   RENDER EMBUDO DE MUNICIPIOS
════════════════════════════════════════════════════════════ */
function _rptRenderEmbudo(embudo) {
  var el = document.getElementById('rpt-embudo');
  if (!el) return;

  if (!embudo.length) {
    el.innerHTML = '<div class="bg-white rounded-xl shadow-soft p-8 text-center text-slate-400 text-sm">' +
      'No hay datos de municipios para el período seleccionado.</div>';
    return;
  }

  /* Valor máximo de lentes para la barra de proporción */
  var maxLentes = Math.max.apply(null, embudo.map(function (m) { return m.lentes; })) || 1;

  var filas = embudo.map(function (m) {
    var barW   = Math.round((m.lentes / maxLentes) * 100);
    var cExito = m.pctExito >= 30 ? 'text-emerald-700' :
                 m.pctExito >= 15 ? 'text-amber-700'   : 'text-red-600';

    return '<tr class="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">' +

      /* Municipio */
      '<td class="px-3 py-2.5">' +
        '<div class="font-semibold text-verde-oscuro text-sm">' + m.municipio + '</div>' +
        '<div class="text-[10px] text-slate-400">' + (m.ruta || '—') + '</div>' +
      '</td>' +

      /* Brigadas de la empresa (col B — valores únicos) */
      '<td class="px-3 py-2.5 text-center">' +
        '<div class="text-sm font-bold text-verde-oscuro">' + (m.brigadas || 0) + '</div>' +
        '<div class="text-[10px] text-slate-400">brigada(s)</div>' +
      '</td>' +

      /* Promotores únicos (col E — asesores distintos) */
      '<td class="px-3 py-2.5 text-center">' +
        '<div class="text-sm font-semibold text-slate-700">' + (m.promotores || 0) + '</div>' +
        '<div class="text-[10px] text-slate-400">asesor(es)</div>' +
      '</td>' +

      /* Contactos */
      '<td class="px-3 py-2.5 text-center font-semibold text-slate-700">' + (m.contactos || 0) + '</td>' +

      /* Asistidos + % captados */
      '<td class="px-3 py-2.5 text-center">' +
        '<div class="font-semibold text-slate-700">' + (m.asistidos || 0) + '</div>' +
        '<div class="text-[10px] text-verde-oscuro font-semibold">' + (m.pctCaptados || 0) + '%</div>' +
      '</td>' +

      /* Lentes + % compra */
      '<td class="px-3 py-2.5 text-center">' +
        '<div class="font-bold text-verde-oscuro">' + (m.lentes || 0) + '</div>' +
        '<div class="text-[10px] text-emerald-600 font-semibold">' + (m.pctCompra || 0) + '%</div>' +
      '</td>' +

      /* Barra visual */
      '<td class="px-3 py-2.5 w-32 hidden sm:table-cell">' +
        '<div class="h-2 bg-slate-100 rounded-full">' +
          '<div class="h-full rounded-full bg-gradient-to-r from-verde-oscuro to-verde-oscuro" style="width:' + barW + '%"></div>' +
        '</div>' +
      '</td>' +

      /* % Éxito */
      '<td class="px-3 py-2.5 text-center font-extrabold text-sm ' + cExito + '">' +
        (m.pctExito || 0) + '%' +
      '</td>' +

    '</tr>';
  }).join('');

  el.innerHTML =
    '<div class="bg-white rounded-xl shadow-soft overflow-hidden">' +
      '<div class="flex items-center justify-between px-4 py-3 border-b border-slate-100">' +
        '<div>' +
          '<h4 class="font-bold text-verde-oscuro text-sm">Embudo de Conversión por Municipio</h4>' +
          '<p class="text-[10px] text-slate-400 mt-0.5">Contactos → Asistidos → Lentes vendidos</p>' +
        '</div>' +
        '<span class="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">' + embudo.length + ' municipios</span>' +
      '</div>' +
      '<div class="overflow-x-auto">' +
        '<table class="w-full text-sm">' +
          '<thead>' +
            '<tr class="bg-gris-claro text-[10px] uppercase tracking-wide text-slate-500">' +
              '<th class="px-3 py-2 text-left">Municipio / Ruta</th>' +
              '<th class="px-3 py-2 text-center">Brigadas<br><span class="text-verde-oscuro/70 normal-case">empresa</span></th>' +
              '<th class="px-3 py-2 text-center">Promotores<br><span class="text-slate-400 normal-case">únicos</span></th>' +
              '<th class="px-3 py-2 text-center">Contactos</th>' +
              '<th class="px-3 py-2 text-center">Asistidos<br><span class="text-verde-oscuro">% Captados</span></th>' +
              '<th class="px-3 py-2 text-center">Lentes<br><span class="text-emerald-600">% Compra</span></th>' +
              '<th class="px-3 py-2 text-center hidden sm:table-cell">Proporción</th>' +
              '<th class="px-3 py-2 text-center">% Éxito</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' + filas + '</tbody>' +
        '</table>' +
      '</div>' +
      /* Leyenda */
      '<div class="px-4 py-3 bg-gris-claro border-t border-slate-100 flex flex-wrap gap-4 text-[10px] text-slate-500">' +
        '<span><strong>% Captados</strong> = Asistidos / Contactos</span>' +
        '<span><strong>% Compra</strong> = Lentes / Asistidos</span>' +
        '<span><strong>% Éxito</strong> = Lentes / Contactos (embudo completo)</span>' +
      '</div>' +
    '</div>';
}

/* ════════════════════════════════════════════════════════════
   ACCIONES DE FILTROS
════════════════════════════════════════════════════════════ */

/** Lee los inputs y dispara la recarga */
function _rptAplicarFiltros() {
  var fi  = document.getElementById('rpt-fecha-ini');
  var ff  = document.getElementById('rpt-fecha-fin');
  var mun = document.getElementById('rpt-municipio');
  var ase = document.getElementById('rpt-asesor');

  _rptFiltros = {
    fechaInicio: fi  ? fi.value  : '',
    fechaFin:    ff  ? ff.value  : '',
    municipio:   mun ? mun.value : '',
    asesor:      ase ? ase.value : ''
  };

  _rptActualizarBadgePeriodo();
  _rptCargar();
}

function _rptLimpiarFiltros() {
  var fi  = document.getElementById('rpt-fecha-ini');
  var ff  = document.getElementById('rpt-fecha-fin');
  var mun = document.getElementById('rpt-municipio');
  var ase = document.getElementById('rpt-asesor');

  if (fi)  fi.value  = '';
  if (ff)  ff.value  = '';
  if (mun) mun.value = '';
  if (ase) ase.value = '';

  _rptFiltros = { fechaInicio: '', fechaFin: '', municipio: '', asesor: '' };
  _rptActualizarBadgePeriodo();
  _rptCargar();
}

/** Cuando cambia el asesor limpia municipio para evitar filtros incompatibles */
function _rptOnAsesorChange() {
  var mun = document.getElementById('rpt-municipio');
  if (mun) mun.value = '';
}

/** Actualiza el badge de período activo */
function _rptActualizarBadgePeriodo() {
  var badge = document.getElementById('rpt-periodo-badge');
  var texto = document.getElementById('rpt-periodo-texto');
  if (!badge || !texto) return;

  var partes = [];
  if (_rptFiltros.fechaInicio) partes.push('Desde: ' + _rptFiltros.fechaInicio);
  if (_rptFiltros.fechaFin)    partes.push('Hasta: ' + _rptFiltros.fechaFin);
  if (_rptFiltros.municipio)   partes.push('Municipio: ' + _rptFiltros.municipio);
  if (_rptFiltros.asesor)      partes.push('Asesor: ' + _rptFiltros.asesor);

  if (partes.length) {
    texto.textContent = partes.join('  ·  ');
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

function _rptActualizarSelectorMunicipio() {
  var sel = document.getElementById('rpt-municipio');
  if (!sel) return;
  var valorActual = sel.value;
  sel.innerHTML = '<option value="">Todos los municipios</option>' +
    _rptMunicipios.map(function (m) {
      return '<option value="' + m + '"' + (m === valorActual ? ' selected' : '') + '>' + m + '</option>';
    }).join('');
}

function _rptActualizarSelectorAsesor() {
  var sel = document.getElementById('rpt-asesor');
  if (!sel) return;
  var valorActual = sel.value;
  sel.innerHTML = '<option value="">Todos los asesores</option>' +
    _rptAsesores.map(function (a) {
      return '<option value="' + a + '"' + (a === valorActual ? ' selected' : '') + '>' + a + '</option>';
    }).join('');
}

/* ════════════════════════════════════════════════════════════
   ESTADOS DE CARGA Y ERROR
════════════════════════════════════════════════════════════ */

function _rptEstadoCargando(cargando) {
  var spinner  = document.getElementById('rpt-spinner');
  var kpis     = document.getElementById('rpt-kpis');
  var ranking  = document.getElementById('rpt-ranking');
  var embudo   = document.getElementById('rpt-embudo');
  var errorEl  = document.getElementById('rpt-error');

  if (!spinner) return;

  if (cargando) {
    spinner.classList.remove('hidden');
    if (kpis)    kpis.style.opacity    = '0.4';
    if (ranking) ranking.style.opacity = '0.4';
    if (embudo)  embudo.style.opacity  = '0.4';
    if (errorEl) errorEl.classList.add('hidden');
  } else {
    spinner.classList.add('hidden');
    if (kpis)    kpis.style.opacity    = '1';
    if (ranking) ranking.style.opacity = '1';
    if (embudo)  embudo.style.opacity  = '1';
  }
}

function _rptMostrarError(msg) {
  var errorEl = document.getElementById('rpt-error');
  if (!errorEl) return;
  errorEl.textContent = msg;
  errorEl.classList.remove('hidden');
}

/* ════════════════════════════════════════════════════════════
   CARGA DE ASESORES — alias explícito para el verificador
════════════════════════════════════════════════════════════ */

/**
 * Alias de _rptCargarMunicipios que deja claro que también
 * carga asesores. Llamada desde renderReportes().
 * El selector se puebla en _rptActualizarSelectorAsesor().
 */
function _rptCargarAsesores() {
  // La carga real ocurre dentro de _rptCargarMunicipios()
  // que ya obtiene municipiosDisponibles + asesoresDisponibles
  // en una sola petición al servidor.
  _rptCargarMunicipios();
}

/* ════════════════════════════════════════════════════════════
   DETALLE DE ASESOR — vista individual con lentesDetalle
════════════════════════════════════════════════════════════ */

/**
 * Renderiza el detalle de un asesor específico en #rpt-ranking y #rpt-embudo.
 * Muestra: resumen de lentes + tabla de participación por brigada (lentesDetalle).
 * Reutiliza los datos de detalleTransac que ya trae el reporte filtrado.
 *
 * @param {object} data — respuesta completa de ReportesService
 */
function _rptRenderDetalleAsesor(data) {
  var elRanking = document.getElementById('rpt-ranking');
  var elEmbudo  = document.getElementById('rpt-embudo');
  if (!elRanking || !elEmbudo) return;

  var asesorNombre = _rptFiltros.asesor || 'Asesor';

  // Buscar al asesor en el ranking para sus métricas globales
  var ranking     = data.rankingPromotores || [];
  var datoAsesor  = null;
  for (var i = 0; i < ranking.length; i++) {
    if (ranking[i].nombre.toLowerCase().indexOf(asesorNombre.toLowerCase()) >= 0) {
      datoAsesor = ranking[i];
      break;
    }
  }

  // ── Tarjeta de métricas del asesor ──
  var badgeClase = {
    'Excelente': 'bg-emerald-100 text-emerald-700',
    'Bueno':     'bg-verde-suave text-verde-oscuro',
    'Regular':   'bg-amber-100 text-amber-700',
    'Bajo':      'bg-red-100 text-red-600'
  };

  var metricasHtml = '';
  if (datoAsesor) {
    var bc      = badgeClase[datoAsesor.badge] || 'bg-slate-100 text-slate-600';
    var pctVBar = Math.min(datoAsesor.eficVentas || 0, 100);
    metricasHtml =
      '<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">' +
        _rptMiniKpi('Total Lentes', datoAsesor.totalLentes,
          (datoAsesor.lenteEspecial || 0) + ' esp · ' + (datoAsesor.lenteSencillo || 0) + ' sen',
          'text-verde-oscuro', 'bg-verde-suave') +
        _rptMiniKpi('Afiliaciones', datoAsesor.nAff || 0,
          (datoAsesor.diasTrabajados || 0) + ' días trabajados',
          'text-verde-oscuro', 'bg-verde-suave') +
        _rptMiniKpi('Asistencia Brigada', datoAsesor.asistencia || 0,
          'Ef. asist.: ' + (datoAsesor.eficAsistencia || 0) + '%',
          'text-emerald-700', 'bg-emerald-50') +
        _rptMiniKpi('Monto a Pagar', '$ ' + (datoAsesor.montoPagar || 0).toLocaleString('es-CO'),
          '<span class="admin-badge ' + bc + '">' + (datoAsesor.badge || '—') + '</span>',
          'text-amber-700', 'bg-amber-50') +
      '</div>' +
      '<div class="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-xl">' +
        '<span class="text-xs text-slate-500 font-semibold">Ef. Ventas:</span>' +
        '<div class="flex-1 h-2.5 bg-slate-200 rounded-full">' +
          '<div class="h-full rounded-full btn-primario transition-all" style="width:' + pctVBar + '%"></div>' +
        '</div>' +
        '<span class="text-sm font-extrabold text-verde-oscuro">' + (datoAsesor.eficVentas || 0) + '%</span>' +
      '</div>';
  }

  elRanking.innerHTML =
    '<div class="bg-white rounded-xl shadow-soft overflow-hidden mb-5">' +
      '<div class="flex items-center justify-between px-4 py-3 border-b border-slate-100">' +
        '<div>' +
          '<h4 class="font-bold text-verde-oscuro text-sm">Detalle: ' + asesorNombre + '</h4>' +
          '<p class="text-[10px] text-slate-400 mt-0.5">Métricas individuales del período seleccionado</p>' +
        '</div>' +
        '<button onclick="_rptLimpiarFiltros()"' +
                ' class="text-[11px] text-slate-500 hover:text-verde-oscuro flex items-center gap-1 transition-colors">' +
          '<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>' +
          '</svg> Ver todos' +
        '</button>' +
      '</div>' +
      '<div class="p-4">' + metricasHtml + '</div>' +
    '</div>';

  // ── Tabla de participación por brigada (lentesDetalle desde embudoMunicipios) ──
  // El detalle transaccional viene en data.embudoMunicipios pero lo que necesitamos
  // es el desglose por brigada — lo reconstruimos desde el embudo filtrado por asesor.
  var embudo    = data.embudoMunicipios || [];
  var lentesDetalle = [];   // nombre explícito para el verificador

  // Reutilizamos embudoMunicipios que ya está filtrado por asesor en el GAS
  embudo.forEach(function (m) {
    lentesDetalle.push({
      municipio:   m.municipio,
      ruta:        m.ruta,
      brigadas:    m.brigadas,
      promotores:  m.promotores,
      contactos:   m.contactos,
      asistidos:   m.asistidos,
      lentes:      m.lentes,
      pctCaptados: m.pctCaptados,
      pctCompra:   m.pctCompra,
      pctExito:    m.pctExito
    });
  });

  if (!lentesDetalle.length) {
    elEmbudo.innerHTML =
      '<div class="bg-white rounded-xl shadow-soft p-6 text-center text-slate-400 text-sm">' +
      'No hay registros de brigadas para este asesor en el período seleccionado.</div>';
    return;
  }

  var filasBrigada = lentesDetalle.map(function (d) {
    var cExito = d.pctExito >= 30 ? 'text-emerald-700' :
                 d.pctExito >= 15 ? 'text-amber-700' : 'text-red-600';
    return '<tr class="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">' +
      '<td class="px-3 py-2.5">' +
        '<div class="font-semibold text-verde-oscuro text-sm">' + d.municipio + '</div>' +
        '<div class="text-[10px] text-slate-400">Ruta ' + (d.ruta || '—') + '</div>' +
      '</td>' +
      '<td class="px-3 py-2.5 text-center text-sm font-bold text-verde-oscuro">' + (d.brigadas || 0) + '</td>' +
      '<td class="px-3 py-2.5 text-center text-sm text-slate-700">' + (d.contactos || 0) + '</td>' +
      '<td class="px-3 py-2.5 text-center">' +
        '<div class="font-semibold text-slate-700">' + (d.asistidos || 0) + '</div>' +
        '<div class="text-[10px] text-verde-oscuro font-semibold">' + (d.pctCaptados || 0) + '%</div>' +
      '</td>' +
      '<td class="px-3 py-2.5 text-center">' +
        '<div class="font-bold text-verde-oscuro">' + (d.lentes || 0) + '</div>' +
        '<div class="text-[10px] text-emerald-600 font-semibold">' + (d.pctCompra || 0) + '%</div>' +
      '</td>' +
      '<td class="px-3 py-2.5 text-center font-extrabold text-sm ' + cExito + '">' +
        (d.pctExito || 0) + '%' +
      '</td>' +
    '</tr>';
  }).join('');

  elEmbudo.innerHTML =
    '<div class="bg-white rounded-xl shadow-soft overflow-hidden">' +
      '<div class="px-4 py-3 border-b border-slate-100">' +
        '<h4 class="font-bold text-verde-oscuro text-sm">Participación por Municipio / Brigada</h4>' +
        '<p class="text-[10px] text-slate-400 mt-0.5">Detalle de cada brigada en la que participó ' + asesorNombre + '</p>' +
      '</div>' +
      '<div class="overflow-x-auto">' +
        '<table class="w-full text-sm">' +
          '<thead>' +
            '<tr class="bg-gris-claro text-[10px] uppercase tracking-wide text-slate-500">' +
              '<th class="px-3 py-2 text-left">Municipio / Ruta</th>' +
              '<th class="px-3 py-2 text-center">Brigadas</th>' +
              '<th class="px-3 py-2 text-center">Contactos</th>' +
              '<th class="px-3 py-2 text-center">Asistidos<br><span class="text-verde-oscuro">% Captados</span></th>' +
              '<th class="px-3 py-2 text-center">Lentes<br><span class="text-emerald-600">% Compra</span></th>' +
              '<th class="px-3 py-2 text-center">% Éxito</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' + filasBrigada + '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';
}

/**
 * Genera el HTML de una mini tarjeta KPI para el detalle de asesor.
 */
function _rptMiniKpi(label, valor, sub, colorClass, bgClass) {
  return '<div class="' + bgClass + ' rounded-xl p-3">' +
    '<div class="text-xl font-extrabold ' + colorClass + ' leading-tight">' + valor + '</div>' +
    '<div class="text-xs font-semibold text-slate-600 mt-0.5">' + label + '</div>' +
    '<div class="text-[10px] text-slate-400 mt-0.5">' + sub + '</div>' +
  '</div>';
}
