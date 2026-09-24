/* ── Centro de Recursos: datos configurables ────────────────
   Edita estas constantes para actualizar el contenido del
   card sin tocar la lógica de renderizado.
   ─────────────────────────────────────────────────────────── */
var FORMATOS_PDF = [
  { id: 1, titulo: 'Recepción de AFF Diaria', desc: 'Plantilla base para recepción de afiliaciones', url: 'manuales/Formato_aff.pdf' },
  { id: 2, titulo: 'Contabilidad Diaria Coordinación', desc: 'Planilla de control contable para coordinador', url: 'manuales/contabilidad_coord.pdf' },
  { id: 3, titulo: 'Planilla de AFF-Digitalización', desc: 'Formato para registrar las afiliaciones a ser digitalizadas', url: 'manuales/planilla_digitacion.pdf' },
  { id: 4, titulo: 'Hoja de Convenio', desc: 'Plantilla de convenio con institución', url: 'manuales/hoja_convenio.pdf' }
];

var ACCESOS_DIRECTOS = [
  { id: 1, titulo: '📁 Control diario de AFF', desc: 'Carpeta de seguimiento de control diario de AFF', url: 'https://drive.google.com/drive/folders/14x6mIU7kgbR2_YTpUKwbvc5rUJp3rDMp?usp=drive_link' },
  { id: 2, titulo: '📁 Documentos del Personal', desc: 'Escaneo de los documentos de identidad del personal', url: 'https://drive.google.com/drive/folders/1MFYEQbHL3njuGYK3Jvi1yVsp4QLQSdRV?usp=drive_link' },
  { id: 3, titulo: '📁 Carnet de Personal', desc: 'Escaneo de los carnet del personal del personal', url: 'https://drive.google.com/drive/folders/1cwV3kXSnJixUYfHyl6PyymsONBITucpI?usp=drive_link' },
  { id: 4, titulo: '📁 Registro de Ventas por Municipio', desc: 'Registro grafico de las ventas municipio en archivos de atención', url: 'https://drive.google.com/drive/folders/1LRwTimG26evV5mREqh66npjp26LE7mb6?usp=drive_link' }
];

function renderDashboard() {
  var contenedor = document.getElementById('admin-content');
  if (!contenedor) return;

  // Obtener perfil del usuario autenticado
  var perfil = (typeof getPerfilAdmin === 'function') ? getPerfilAdmin() : 'Administrador';

  // Mostrar shell con spinner en las tarjetas mientras carga
  contenedor.innerHTML = _dashShellHtml(perfil);

  // Cargar métricas reales de forma asíncrona
  DashboardService.obtenerMetricas()
    .then(function (metricas) {
      _dashRenderKpis(metricas, perfil);
      var subtitulo = document.getElementById('dash-subtitulo');
      if (subtitulo) {
        subtitulo.textContent = metricas.ok === false
          ? 'Resumen del sistema · No se pudo conectar con el servidor'
          : 'Resumen del sistema · Datos en tiempo real';
      }
    })
    .catch(function () {
      _dashRenderKpis(DashboardService._metricasFallback(), perfil);
    });
}

/* ════════════════════════════════════════════════════════════
   SHELL HTML — estructura fija, KPIs se inyectan después
════════════════════════════════════════════════════════════ */
function _dashShellHtml(perfil) {
  perfil = perfil || 'Administrador';
  var accesos = DashboardService.obtenerAccesosRapidos();

  // Saludo personalizado por perfil
  var saludo = perfil === 'Coordinador' ? 'Buenos días, Coordinador' : 'Buenos días, Administrador';

  var iconosAcceso = {
    doc: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>',
    report: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>',
    config: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>',
    cat: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>'
  };

  // ── Centro de Recursos: Formatos PDF ─────────────────────
  var formatosHtml = FORMATOS_PDF.map(function (f) {
    var enlaceAttr = (f.url && f.url !== '#')
      ? 'href="' + f.url + '" target="_blank" rel="noopener"'
      : 'href="#" onclick="return false;"';
    return '<div class="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0' +
      ' hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors group">' +
      '<div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">' +
      '<svg class="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
      '<path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>' +
      '</svg>' +
      '</div>' +
      '<div class="flex-1 min-w-0">' +
      '<a ' + enlaceAttr + ' class="text-xs font-semibold text-slate-700 hover:text-verde-oscuro hover:underline truncate block transition-colors cursor-pointer">' + f.titulo + '</a>' +
      '<div class="text-[10px] text-slate-400 truncate">' + f.desc + '</div>' +
      '</div>' +
      '<div class="flex items-center gap-1.5 flex-shrink-0">' +
      '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 uppercase tracking-wide">PDF</span>' +
      '<a ' + enlaceAttr + ' class="text-[10px] font-semibold text-verde-oscuro hover:text-verde-medio' +
      ' flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">' +
      'Ver' +
      '<svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">' +
      '<path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>' +
      '</svg>' +
      '</a>' +
      '</div>' +
      '</div>';
  }).join('');

  // ── Centro de Recursos: Accesos Directos ─────────────────
  var accesosDirectosHtml = ACCESOS_DIRECTOS.map(function (a) {
    var target = a.url && a.url !== '#' ? '_blank' : '_self';
    var rel = target === '_blank' ? ' rel="noopener"' : '';
    var enlace = a.url && a.url !== '#' ? a.url : 'javascript:void(0)';
    return '<div class="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0' +
      ' hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors group">' +
      '<div class="w-8 h-8 rounded-lg bg-verde-suave flex items-center justify-center flex-shrink-0">' +
      '<svg class="w-4 h-4 text-verde-oscuro" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
      '<path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>' +
      '</svg>' +
      '</div>' +
      '<div class="flex-1 min-w-0">' +
      '<a href="' + enlace + '" target="' + target + '"' + rel + ' class="text-xs font-semibold text-slate-700 hover:text-verde-oscuro hover:underline truncate block transition-colors cursor-pointer">' + a.titulo + '</a>' +
      '<div class="text-[10px] text-slate-400 truncate">' + a.desc + '</div>' +
      '</div>' +
      '<a href="' + enlace + '" target="' + target + '"' + rel + ' class="text-[10px] font-semibold' +
      ' text-verde-oscuro hover:text-verde-medio flex items-center gap-0.5' +
      ' opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">' +
      'Abrir' +
      '<svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">' +
      '<path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>' +
      '</svg>' +
      '</a>' +
      '</div>';
  }).join('');

  var accesosHtml = accesos.map(function (a) {
    return '<button onclick="adminNavegar(\'' + a.ruta.replace('#/admin/', '') + '\')"' +
      ' class="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-soft' +
      ' hover:shadow-card transition-all hover:-translate-y-0.5 active:scale-95 border border-slate-100">' +
      '<div class="w-10 h-10 rounded-xl bg-verde-suave flex items-center justify-center">' +
      '<svg class="w-5 h-5 text-verde-oscuro" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
      iconosAcceso[a.icono] +
      '</svg>' +
      '</div>' +
      '<span class="text-xs font-semibold text-slate-600 text-center leading-tight">' + a.label + '</span>' +
      '</button>';
  }).join('');

  return '<div class="fade-in">' +

    // Saludo
    '<div class="mb-6">' +
    '<h3 class="text-verde-oscuro font-bold text-lg">' + saludo + '</h3>' +
    '<p class="text-slate-400 text-sm mt-0.5" id="dash-subtitulo">Cargando datos...</p>' +
    '</div>' +

    // KPIs — placeholder con spinner mientras carga
    '<div id="dash-kpis" class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">' +
    [1, 2, 3, 4].map(function () {
      return '<div class="admin-kpi-card flex items-center justify-center h-24">' +
        '<div class="spinner"></div>' +
        '</div>';
    }).join('') +
    '</div>' +

    // Fila central: Accesos Frecuentes (izquierda en layout final) + Centro de Recursos (derecha)
    '<div class="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">' +

    // ── Panel lateral derecho (ahora renderizado primero para quedar a la izquierda en pantallas grandes): Accesos Frecuentes del router ──
    '<div class="bg-gris-claro rounded-xl p-4 min-w-[200px]">' +
    '<h4 class="font-bold text-verde-oscuro text-sm mb-3">Accesos Frecuentes</h4>' +
    '<div class="grid grid-cols-2 gap-2">' + accesosHtml + '</div>' +
    '</div>' +

    // ── Card: Centro de Recursos Operativos (ahora a la derecha en pantallas grandes) ────────────────
    '<div class="bg-white rounded-xl shadow-soft p-4">' +
    '<div class="flex items-center justify-between mb-4">' +
    '<div>' +
    '<h4 class="font-bold text-verde-oscuro text-sm leading-tight">Centro de Recursos Operativos</h4>' +
    '<p class="text-[10px] text-slate-400 mt-0.5 font-medium">Formatos y accesos directos de uso frecuente</p>' +
    '</div>' +
    '<div class="w-7 h-7 rounded-lg bg-verde-suave flex items-center justify-center flex-shrink-0">' +
    '<svg class="w-3.5 h-3.5 text-verde-oscuro" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
    '<path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>' +
    '</svg>' +
    '</div>' +
    '</div>' +

    // Grid interno: 2 columnas (1 en móvil)
    '<div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0">' +

    // Columna izquierda: Formatos PDF
    '<div>' +
    '<div class="flex items-center gap-1.5 mb-2">' +
    '<span class="text-base leading-none">📄</span>' +
    '<span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Formatos Recurrentes</span>' +
    '</div>' +
    formatosHtml +
    '</div>' +

    // Columna derecha: Accesos directos
    '<div class="sm:border-l sm:border-slate-100 sm:pl-6">' +
    '<div class="flex items-center gap-1.5 mb-2">' +
    '<span class="text-base leading-none">🔗</span>' +
    '<span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Accesos Rápidos / Drive</span>' +
    '</div>' +
    accesosDirectosHtml +
    '</div>' +

    '</div>' +
    '</div>' +

    '</div>' +

    // Estado del sistema
    '<div class="mt-4 bg-white rounded-xl shadow-soft p-4">' +
    '<h4 class="font-bold text-verde-oscuro text-sm mb-3">Estado del Sistema</h4>' +
    '<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">' +
    _estadoChip('Portal de Nómina', 'Activo', 'emerald') +
    _estadoChip('Google Apps Script', 'Activo', 'emerald') +
    _estadoChip('Base de Datos', 'Activo', 'emerald') +
    _estadoChip('Versión', 'v1.2 KG', 'blue') +
    '</div>' +
    '</div>' +

    '</div>';
}

function _dashRenderKpis(m, perfil) {
  perfil = perfil || 'Administrador';
  var el = document.getElementById('dash-kpis');
  if (!el) return;

  var montoFmt = (typeof m.totalMontoPagar === 'number')
    ? '$ ' + m.totalMontoPagar.toLocaleString('es-CO')
    : (m.totalMontoPagar || '—');

  var kpis = [
    {
      label: 'Total Promotores',
      valor: m.totalPromotores || '—',
      sub: 'registrados en el sistema',
      color: 'text-verde-oscuro',
      bg: 'bg-verde-suave',
      icono: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-3.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4"/>',
      visible: true
    },
    {
      label: 'Brigadas Atendidas',
      valor: m.brigadasAtendidas || '—',
      sub: 'con venta de lentes registrada',
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      icono: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V7.618a1 1 0 01.553-.894L9 4m0 16l6-3m-6 3V4m6 13l5.447-2.724A1 1 0 0021 13.382V4.618a1 1 0 00-1.447-.894L15 6m0 11V6m0 0L9 4"/>',
      visible: true
    },
    {
      label: 'Total Asistidos',
      valor: (typeof m.totalAsistidos === 'number')
        ? m.totalAsistidos.toLocaleString('es-CO')
        : (m.totalAsistidos || '—'),
      sub: 'personas atendidas en brigadas',
      color: 'text-verde-oscuro',
      bg: 'bg-verde-suave',
      icono: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-3.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4"/>',
      visible: true
    },
    {
      label: 'Total Monto a Pagar',
      valor: montoFmt,
      sub: 'suma total a promotores',
      color: 'text-violet-700',
      bg: 'bg-violet-50',
      icono: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>',
      // Solo visible para Administrador
      visible: perfil === 'Administrador'
    }
  ];

  // Filtrar según visibilidad del perfil y ajustar grid
  var kpisVisibles = kpis.filter(function (k) { return k.visible; });
  var cols = kpisVisibles.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4';
  el.className = 'grid ' + cols + ' gap-3 mb-6';

  el.innerHTML = kpisVisibles.map(function (k) {
    return '<div class="admin-kpi-card fade-in">' +
      '<div class="w-9 h-9 rounded-xl ' + k.bg + ' flex items-center justify-center mb-3">' +
      '<svg class="w-5 h-5 ' + k.color + '" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
      k.icono +
      '</svg>' +
      '</div>' +
      '<div class="text-2xl font-extrabold ' + k.color + ' leading-tight">' + k.valor + '</div>' +
      '<div class="text-xs text-slate-500 font-medium mt-0.5">' + k.label + '</div>' +
      '<div class="text-[10px] text-slate-400 mt-0.5">' + k.sub + '</div>' +
      '</div>';
  }).join('');
}

function _estadoChip(label, estado, color) {
  var colores = {
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-verde-suave text-verde-oscuro'
  };
  return '<div class="rounded-lg px-3 py-2.5 ' + (colores[color] || 'bg-slate-50 text-slate-600') + '">' +
    '<div class="text-[10px] font-semibold uppercase tracking-wide opacity-70">' + label + '</div>' +
    '<div class="text-xs font-bold mt-0.5">' + estado + '</div>' +
    '</div>';
}
