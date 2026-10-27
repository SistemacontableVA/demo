/* ──────────────────────────────────────────────────────────────
   VISTA PRINCIPAL — Lista de tipos de documento
────────────────────────────────────────────────────────────── */

function renderDocumentos() {
  var contenedor = document.getElementById('admin-content');
  if (!contenedor) return;

  var formatos = [
    { titulo: 'Recepción de AFF Diaria', desc: 'Plantilla base para recepción de afiliaciones', url: 'manuales/Formato_aff.pdf' },
    { titulo: 'Contabilidad Diaria Coordinación', desc: 'Planilla de control contable para coordinador', url: 'manuales/contabilidad_coord.pdf' },
    { titulo: 'Planilla de AFF-Digitalización', desc: 'Formato para registrar las afiliaciones a ser digitalizadas', url: 'manuales/planilla_digitacion.pdf' },
    { titulo: 'Hoja de Convenio', desc: 'Plantilla de convenio con institución', url: 'manuales/hoja_convenio.pdf' }
  ];
  var accesos = [
    { titulo: 'Control diario de AFF', desc: 'Carpeta de seguimiento de control diario de AFF', url: 'https://drive.google.com/drive/folders/14x6mIU7kgbR2_YTpUKwbvc5rUJp3rDMp?usp=drive_link' },
    { titulo: 'Documentos del Personal', desc: 'Escaneo de los documentos de identidad del personal', url: 'https://drive.google.com/drive/folders/1MFYEQbHL3njuGYK3Jvi1yVsp4QLQSdRV?usp=drive_link' },
    { titulo: 'Carnet de Personal', desc: 'Escaneo de los carnets del personal', url: 'https://drive.google.com/drive/folders/1cwV3kXSnJixUYfHyl6PyymsONBITucpI?usp=drive_link' },
    { titulo: 'Registro de Ventas por Municipio', desc: 'Registro gráfico de ventas por municipio', url: 'https://drive.google.com/drive/folders/1LRwTimG26evV5mREqh66npjp26LE7mb6?usp=drive_link' }
  ];

  var tipos = [
    {
      clave:  DocumentosService.TIPOS.SOLICITUD_INSTITUCIONAL,
      label:  'Solicitud Institucional',
      desc:   'Solicitud formal ante institución pública o privada',
      color:  'bg-verde-suave text-verde-oscuro',
      activo: true,
      icono:  '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>'
    },
    {
      clave:  DocumentosService.TIPOS.PERMISO_POLICIAL,
      label:  'Permiso Policial',
      desc:   'Autorización policial para actividades en vía pública',
      color:  'bg-emerald-50 text-emerald-700',
      activo: true,
      icono:  '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>'
    },
    {
      clave:  DocumentosService.TIPOS.SOLICITUD_ESPACIO,
      label:  'Solicitud de Espacio',
      desc:   'Solicitud de uso de espacio físico para brigada',
      color:  'bg-violet-50 text-violet-700',
      activo: true,
      icono:  '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>'
    },
    {
      clave:  DocumentosService.TIPOS.HOJA_CONVENIO,
      label:  'Hoja de Convenio',
      desc:   'Convenio formal entre la empresa y una institución aliada',
      color:  'bg-amber-50 text-amber-700',
      activo: true,
      icono:  '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"/>'
    },
    {
      clave:  DocumentosService.TIPOS.PUBLICIDAD,
      label:  'Publicidad de Brigada',
      desc:   'Afiche informativo para brigadas optométricas en municipios',
      color:  'bg-pink-50 text-pink-700',
      activo: true,
      icono:  '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>'
    }
  ];

  var tiposHtml = tipos.map(function (t) {
    if (t.activo) {
      // Documento activo — clickeable
      return '<div class="bg-white rounded-xl shadow-soft p-4 border border-slate-100 hover:shadow-card hover:border-azul/30 transition-all hover:-translate-y-0.5 cursor-pointer group"' +
             ' onclick="adminDocumentoSeleccionar(\'' + t.clave + '\')">' +
        '<div class="flex items-start justify-between mb-3">' +
          '<div class="w-10 h-10 rounded-xl ' + t.color + ' flex items-center justify-center">' +
            '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">' + t.icono + '</svg>' +
          '</div>' +
          '<span class="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wide">Activo</span>' +
        '</div>' +
        '<div class="font-bold text-verde-oscuro text-sm mb-1">' + t.label + '</div>' +
        '<div class="text-xs text-slate-400 leading-snug">' + t.desc + '</div>' +
        '<div class="mt-3 flex items-center gap-1 text-verde-oscuro text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">' +
          'Generar' +
          '<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>' +
          '</svg>' +
        '</div>' +
      '</div>';
    } else {
      // Documento pendiente — no clickeable
      return '<div class="bg-white rounded-xl p-4 border border-slate-100 opacity-50 cursor-not-allowed">' +
        '<div class="flex items-start justify-between mb-3">' +
          '<div class="w-10 h-10 rounded-xl ' + t.color + ' flex items-center justify-center">' +
            '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">' + t.icono + '</svg>' +
          '</div>' +
          '<span class="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full uppercase tracking-wide">Próximamente</span>' +
        '</div>' +
        '<div class="font-bold text-verde-oscuro text-sm mb-1">' + t.label + '</div>' +
        '<div class="text-xs text-slate-400 leading-snug">' + t.desc + '</div>' +
      '</div>';
    }
  }).join('');

  contenedor.innerHTML =
    '<div class="fade-in">' +

      // Encabezado
      '<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">' +
        '<div>' +
          '<h3 class="text-verde-oscuro font-bold text-lg">Centro de Gestión Documental</h3>' +
          '<p class="text-slate-400 text-sm mt-0.5">Generación de documentos oficiales</p>' +
        '</div>' +
      '</div>' +

      // Grid de tipos
      '<h4 class="font-bold text-verde-oscuro text-sm mb-3">Crear Nuevo Documento</h4>' +
      '<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">' + tiposHtml + '</div>' +

      // Centro de Recursos Operativos
      '<div class="bg-white rounded-xl shadow-soft p-4">' +
        '<div class="flex items-center justify-between mb-4">' +
          '<div>' +
            '<h4 class="font-bold text-verde-oscuro text-sm">Centro de Recursos Operativos</h4>' +
            '<p class="text-[10px] text-slate-400 mt-0.5 font-medium">Formatos y accesos directos de uso frecuente</p>' +
          '</div>' +
          '<div class="w-7 h-7 rounded-lg bg-verde-suave flex items-center justify-center flex-shrink-0">' +
            '<svg class="w-3.5 h-3.5 text-verde-oscuro" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
              '<path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>' +
            '</svg>' +
          '</div>' +
        '</div>' +
        '<div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6">' +
          '<div><div class="flex items-center gap-1.5 mb-2"><span class="text-base leading-none">📄</span><span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Formatos recurrentes</span></div>' +
            formatos.map(function (item) { return '<div class="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors group"><div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0"><svg class="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg></div><div class="flex-1 min-w-0"><a href="' + item.url + '" target="_blank" rel="noopener" class="text-xs font-semibold text-slate-700 hover:text-verde-oscuro hover:underline truncate block transition-colors">' + item.titulo + '</a><div class="text-[10px] text-slate-400 truncate">' + item.desc + '</div></div><span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 uppercase tracking-wide">PDF</span></div>'; }).join('') +
          '</div>' +
          '<div class="sm:border-l sm:border-slate-100 sm:pl-6 mt-4 sm:mt-0"><div class="flex items-center gap-1.5 mb-2"><span class="text-base leading-none">🔗</span><span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Accesos directos</span></div>' +
            accesos.map(function (item) { return '<div class="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors group"><div class="w-8 h-8 rounded-lg bg-verde-suave flex items-center justify-center flex-shrink-0"><svg class="w-4 h-4 text-verde-oscuro" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg></div><div class="flex-1 min-w-0"><a href="' + item.url + '" target="_blank" rel="noopener" class="text-xs font-semibold text-slate-700 hover:text-verde-oscuro hover:underline truncate block transition-colors">' + item.titulo + '</a><div class="text-[10px] text-slate-400 truncate">' + item.desc + '</div></div><span class="text-[10px] font-semibold text-verde-oscuro">Abrir</span></div>'; }).join('') +
          '</div>' +
        '</div>' +
      '</div>' +

    '</div>';
}

/* ──────────────────────────────────────────────────────────────
   FORMULARIO — Solicitud Institucional
────────────────────────────────────────────────────────────── */

/**
 * Despacha al formulario correcto según el tipo de documento.
 * @param {string} tipo - Clave en DocumentosService.TIPOS
 */
function adminDocumentoSeleccionar(tipo) {
  switch (tipo) {
    case DocumentosService.TIPOS.SOLICITUD_INSTITUCIONAL:
      _renderFormSolicitudInstitucional();
      break;
    case DocumentosService.TIPOS.SOLICITUD_ESPACIO:
      _renderFormSolicitudEspacio();
      break;
    case DocumentosService.TIPOS.PERMISO_POLICIAL:
      _renderFormPermisoPolicial();
      break;
    case DocumentosService.TIPOS.HOJA_CONVENIO:
      _renderSelectorHojaConvenio();
      break;
    case DocumentosService.TIPOS.PUBLICIDAD:
      _renderFormPublicidad();
      break;
    default:
      var el = document.querySelector('[onclick*="' + tipo + '"]');
      if (el) el.classList.add('pointer-events-none');
  }
}

/**
 * Renderiza el formulario completo de Solicitud Institucional
 * en #admin-content.
 */
function _renderFormSolicitudInstitucional() {
  var contenedor = document.getElementById('admin-content');
  if (!contenedor) return;

  // Fecha de hoy en formato dd/MM/yyyy
  var hoy  = new Date();
  var yyyy = hoy.getFullYear();
  var mm   = ('0' + (hoy.getMonth() + 1)).slice(-2);
  var dd   = ('0' + hoy.getDate()).slice(-2);
  var fechaHoy = dd + '/' + mm + '/' + yyyy;

  contenedor.innerHTML =
    '<div class="fade-in">' +

      // ── Encabezado ──
      '<div class="flex items-center gap-3 mb-6">' +
        '<button onclick="renderDocumentos()"' +
          ' class="flex items-center gap-1.5 text-slate-500 hover:text-verde-oscuro transition-colors text-sm font-medium group">' +
          '<svg class="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>' +
          '</svg>' +
          'Volver' +
        '</button>' +
        '<div class="w-px h-5 bg-slate-200"></div>' +
        '<div class="w-8 h-8 rounded-lg bg-verde-suave flex items-center justify-center">' +
          '<svg class="w-4 h-4 text-verde-oscuro" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>' +
          '</svg>' +
        '</div>' +
        '<div>' +
          '<h3 class="text-verde-oscuro font-bold text-base leading-tight">Solicitud Institucional</h3>' +
          '<p class="text-slate-400 text-xs">Complete los campos y genere el documento</p>' +
        '</div>' +
      '</div>' +

      // ── Tarjeta del formulario ──
      '<div class="bg-white rounded-xl shadow-soft p-6 max-w-2xl">' +

        // Grid de campos 2 columnas
        '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">' +

          // Col 1: Fecha Informe (auto)
          _campoInput('si-fechaInforme', 'Fecha del Informe', fechaHoy,    'text',  false) +
          // Col 2: Institución (requerido)
          _campoInput('si-institucion',  'Institución',       '',          'text',  true,  'Ej: Alcaldía de Cali') +
          // Col 1: Municipio (requerido)
          _campoInput('si-municipio',    'Municipio',         '',          'text',  true,  'Ej: Santiago de Cali') +
          // Col 2: Lugar (requerido)
          _campoInput('si-lugar',        'Lugar de la Jornada', '',        'text',  true,  'Ej: Salón comunal principal') +
          // Col 1: Fechas difusión (requerido)
          _campoInput('si-difusion',     'Fechas de Difusión',  '',        'text',  true,  '15, 16 y 17 de julio de 2026') +
          // Col 2: Fecha jornada (requerido)
          _campoInput('si-fechaJornada', 'Fecha de la Jornada', '',        'text',  true,  '04 de agosto de 2026') +
          // Col 1: Hora inicio (pre-llenado)
          _campoInput('si-horaInicio',   'Hora Inicio',         '08:00 AM','text',  false) +
          // Col 2: Hora fin (pre-llenado)
          _campoInput('si-horaFin',      'Hora Fin',            '05:30 PM','text',  false) +

        '</div>' +

        // Botón generar
        '<button id="si-btn-generar" onclick="_enviarSolicitudInstitucional()"' +
          ' class="w-full btn-primario hover:bg-verde-oscuro active:scale-95 transition-all duration-200 text-white font-semibold text-sm px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-card">' +
          '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>' +
          '</svg>' +
          '<span id="si-btn-texto">Generar Documento</span>' +
        '</button>' +

        // Estado de carga
        '<div id="si-loading" class="hidden mt-5 flex items-center justify-center gap-3 py-3">' +
          '<div class="spinner"></div>' +
          '<span class="text-sm text-slate-500 font-medium">Generando documento en Google Drive...</span>' +
        '</div>' +

        // Estado de éxito
        '<div id="si-resultado" class="hidden mt-5 rounded-xl overflow-hidden border border-emerald-200">' +
          '<div class="bg-emerald-50 px-4 py-3 flex items-center gap-2">' +
            '<svg class="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
              '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>' +
            '</svg>' +
            '<span class="font-bold text-emerald-700 text-sm">¡Documento generado! Usa el botón Descargar en la vista del documento para guardarlo como PDF.</span>' +
          '</div>' +
          '<div class="bg-slate-50 px-4 py-3 border-t border-emerald-100 flex flex-wrap gap-2">' +
            '<button onclick="_enviarSolicitudInstitucional()"' +
              ' class="flex items-center gap-1.5 btn-primario hover:bg-verde-oscuro text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors">' +
              '<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>' +
              '</svg>' +
              'Generar de nuevo' +
            '</button>' +
            '<button onclick="_resetFormSI()"' +
              ' class="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors ml-auto">' +
              '<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>' +
              '</svg>' +
              'Nueva solicitud' +
            '</button>' +
          '</div>' +
        '</div>' +

        // Estado de error
        '<div id="si-error" class="hidden mt-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">' +
          '<svg class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>' +
          '</svg>' +
          '<span id="si-error-msg" class="text-sm text-red-700">Error al generar el documento.</span>' +
        '</div>' +

      '</div>' + // fin tarjeta

    '</div>'; // fin fade-in
}

/* ──────────────────────────────────────────────────────────────
   ACCIONES DEL FORMULARIO
────────────────────────────────────────────────────────────── */

/** Valida y envía el formulario — genera documento desde plantilla HTML local */
function _enviarSolicitudInstitucional() {

  var requeridos = [
    { id: 'si-institucion',  label: 'Institución' },
    { id: 'si-municipio',    label: 'Municipio' },
    { id: 'si-lugar',        label: 'Lugar de la Jornada' },
    { id: 'si-difusion',     label: 'Fechas de Difusión' },
    { id: 'si-fechaJornada', label: 'Fecha de la Jornada' }
  ];

  for (var i = 0; i < requeridos.length; i++) {
    var el = document.getElementById(requeridos[i].id);
    if (!el || !el.value.trim()) {
      if (el) {
        el.classList.add('border-red-400', 'ring-2', 'ring-red-100');
        el.focus();
        el.addEventListener('input', function () {
          this.classList.remove('border-red-400', 'ring-2', 'ring-red-100');
        }, { once: true });
      }
      return;
    }
  }

  // Mapeo: clave del objeto → marcador en la plantilla (MAYÚSCULAS)
  var datos = {
    FECHA_INFORME:      document.getElementById('si-fechaInforme').value.trim(),
    NOMBRE_INSTITUCION: document.getElementById('si-institucion').value.trim(),
    NOMBRE_MUNICIPIO:   document.getElementById('si-municipio').value.trim(),
    LUGAR_JORNADA:      document.getElementById('si-lugar').value.trim(),
    FECHAS_DIFUSION:    document.getElementById('si-difusion').value.trim(),
    FECHA_JORNADA:      document.getElementById('si-fechaJornada').value.trim(),
    HORA_INICIO:        document.getElementById('si-horaInicio').value.trim(),
    HORA_FIN:           document.getElementById('si-horaFin').value.trim()
  };

  document.getElementById('si-btn-generar').disabled = true;
  document.getElementById('si-btn-texto').textContent = 'Generando...';
  document.getElementById('si-loading').classList.remove('hidden');
  document.getElementById('si-resultado').classList.add('hidden');
  document.getElementById('si-error').classList.add('hidden');

  fetch('administracion/documentos/templates/solicitud-institucional.html?t=' + Date.now())
    .then(function(res) {
      if (!res.ok) throw new Error('No se pudo cargar la plantilla.');
      return res.text();
    })
    .then(function(html) {
      // Reemplazar marcadores {{CLAVE}} con los valores del formulario
      var doc = html;
      Object.keys(datos).forEach(function(clave) {
        var regex = new RegExp('\\{\\{' + clave + '\\}\\}', 'g');
        doc = doc.replace(regex, datos[clave]);
      });
      doc = window.empresaBrand.preparePrintHtml(doc);
      doc = _agregarBotonDescargaDocumento(doc);

      var ventana = window.open('', '_blank', 'width=900,height=700');
      ventana.document.write(doc);
      ventana.document.close();
      ventana.focus();

      if (!/Mobi|Android/i.test(navigator.userAgent)) {
        setTimeout(function() { ventana.print(); }, 600);
      }

      document.getElementById('si-btn-generar').disabled = false;
      document.getElementById('si-btn-texto').textContent = 'Generar Documento';
      document.getElementById('si-loading').classList.add('hidden');
      document.getElementById('si-resultado').classList.remove('hidden');
      document.getElementById('si-resultado').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    })
    .catch(function(err) {
      document.getElementById('si-btn-generar').disabled = false;
      document.getElementById('si-btn-texto').textContent = 'Generar Documento';
      document.getElementById('si-loading').classList.add('hidden');
      document.getElementById('si-error-msg').textContent = 'Error al cargar la plantilla: ' + err.toString();
      document.getElementById('si-error').classList.remove('hidden');
    });
}

/** Resetea el formulario para una nueva solicitud */
function _resetFormSI() {
  var campos = ['si-institucion', 'si-municipio', 'si-lugar', 'si-difusion', 'si-fechaJornada'];
  campos.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('si-resultado').classList.add('hidden');
  document.getElementById('si-error').classList.add('hidden');
  document.getElementById('si-btn-generar').disabled = false;
  document.getElementById('si-btn-texto').textContent = 'Generar Documento';
  document.getElementById('si-institucion').focus();
}

/* ──────────────────────────────────────────────────────────────
   EXPORTAR PDF — Solicitud Institucional
────────────────────────────────────────────────────────────── */

/**
 * Llama a DocumentosService.exportarPDF con el ID del documento generado.
 * El ID se guarda en data-doc-id del botón PDF después de la generación.
 */
function _exportarPDFSolicitudInstitucional() {
  var btnPDF   = document.getElementById('si-btn-pdf');
  var textoBtn = document.getElementById('si-pdf-texto');
  var docId    = btnPDF ? btnPDF.getAttribute('data-doc-id') : '';

  if (!docId) {
    alert('No se encontró el ID del documento. Genera el documento primero.');
    return;
  }

  // Estado de carga
  btnPDF.disabled = true;
  if (textoBtn) textoBtn.textContent = 'Exportando...';

  DocumentosService.exportarPDF(DocumentosService.TIPOS.SOLICITUD_INSTITUCIONAL, docId)
    .then(function (r) {
      btnPDF.disabled = false;
      if (textoBtn) textoBtn.textContent = 'Exportar PDF';

      if (r.ok && r.url) {
        window.open(r.url, '_blank');
      } else {
        alert('Error al exportar PDF: ' + (r.mensaje || 'Respuesta inesperada del servidor.'));
      }
    })
    .catch(function (err) {
      btnPDF.disabled = false;
      if (textoBtn) textoBtn.textContent = 'Exportar PDF';
      alert('Error: ' + err.toString());
    });
}

/* ──────────────────────────────────────────────────────────────
   FORMULARIO — Solicitud de Espacio
────────────────────────────────────────────────────────────── */

/**
 * Renderiza el formulario completo de Solicitud de Espacio
 * en #admin-content.
 */
function _renderFormSolicitudEspacio() {
  var contenedor = document.getElementById('admin-content');
  if (!contenedor) return;

  // Fecha de hoy en formato dd/MM/yyyy (editable por el usuario)
  var hoy  = new Date();
  var yyyy = hoy.getFullYear();
  var mm   = ('0' + (hoy.getMonth() + 1)).slice(-2);
  var dd   = ('0' + hoy.getDate()).slice(-2);
  var fechaHoy = dd + '/' + mm + '/' + yyyy;

  contenedor.innerHTML =
    '<div class="fade-in">' +

      // ── Encabezado con breadcrumb ──
      '<div class="flex items-center gap-3 mb-6">' +
        '<button onclick="renderDocumentos()"' +
          ' class="flex items-center gap-1.5 text-slate-500 hover:text-verde-oscuro transition-colors text-sm font-medium group">' +
          '<svg class="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>' +
          '</svg>' +
          'Volver' +
        '</button>' +
        '<div class="w-px h-5 bg-slate-200"></div>' +
        '<div class="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">' +
          '<svg class="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>' +
          '</svg>' +
        '</div>' +
        '<div>' +
          '<h3 class="text-verde-oscuro font-bold text-base leading-tight">Solicitud de Espacio</h3>' +
          '<p class="text-slate-400 text-xs">Complete los campos y genere el documento</p>' +
        '</div>' +
      '</div>' +

      // ── Tarjeta del formulario ──
      '<div class="bg-white rounded-xl shadow-soft p-6 max-w-2xl">' +

        // Grid de campos 2 columnas
        '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">' +
          // Fecha solicitud (editable, default hoy)
          _campoInput('se-fechasolicitud', 'Fecha de Solicitud',    fechaHoy,    'text', false, 'dd/mm/aaaa') +
          // Dirigido a (requerido)
          _campoInput('se-dirigido',       'Dirigido a (Señores)',  '',          'text', true,  'Ej: Administración del Centro Comercial') +
          // Municipio (requerido)
          _campoInput('se-municipio',      'Municipio',             '',          'text', true,  'Ej: Santiago de Cali') +
          // Lugar (requerido)
          _campoInput('se-lugar',          'Lugar de Atención',     '',          'text', true,  'Ej: Salón comunal principal') +
          // Fecha de atención (requerido)
          _campoInput('se-fechaatencion',  'Fecha de la Jornada',   '',          'text', true,  'Ej: 04 de agosto de 2026') +
          // Hora inicio (default 7:30 AM)
          _campoInput('se-horainicio',     'Hora Inicio',           '7:30 AM',   'text', false) +
          // Hora final (default 5:30 PM)
          _campoInput('se-horafinal',      'Hora Final',            '5:30 PM',   'text', false) +
        '</div>' +

        // Botón generar
        '<button id="se-btn-generar" onclick="_enviarSolicitudEspacio()"' +
          ' class="w-full btn-primario hover:bg-verde-oscuro active:scale-95 transition-all duration-200 text-white font-semibold text-sm px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-card">' +
          '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>' +
          '</svg>' +
          '<span id="se-btn-texto">Generar Documento</span>' +
        '</button>' +

        // Estado de carga
        '<div id="se-loading" class="hidden mt-5 flex items-center justify-center gap-3 py-3">' +
          '<div class="spinner"></div>' +
          '<span class="text-sm text-slate-500 font-medium">Generando documento en Google Drive...</span>' +
        '</div>' +

        // Estado de éxito
        '<div id="se-resultado" class="hidden mt-5 rounded-xl overflow-hidden border border-emerald-200">' +
          '<div class="bg-emerald-50 px-4 py-3 flex items-center gap-2">' +
            '<svg class="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
              '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>' +
            '</svg>' +
            '<span class="font-bold text-emerald-700 text-sm">¡Documento generado! Usa el botón Descargar en la vista del documento para guardarlo como PDF.</span>' +
          '</div>' +
          '<div class="bg-slate-50 px-4 py-3 border-t border-emerald-100 flex flex-wrap gap-2">' +
            '<button onclick="_enviarSolicitudEspacio()"' +
              ' class="flex items-center gap-1.5 btn-primario hover:bg-verde-oscuro text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors">' +
              '<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>' +
              '</svg>' +
              'Generar de nuevo' +
            '</button>' +
            '<button onclick="_resetFormSE()"' +
              ' class="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors ml-auto">' +
              '<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>' +
              '</svg>' +
              'Nueva solicitud' +
            '</button>' +
          '</div>' +
        '</div>' +

        // Estado de error
        '<div id="se-error" class="hidden mt-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">' +
          '<svg class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>' +
          '</svg>' +
          '<span id="se-error-msg" class="text-sm text-red-700">Error al generar el documento.</span>' +
        '</div>' +

      '</div>' + // fin tarjeta
    '</div>';   // fin fade-in
}

/* ──────────────────────────────────────────────────────────────
   ACCIONES — Solicitud de Espacio
────────────────────────────────────────────────────────────── */

function _enviarSolicitudEspacio() {
  var requeridos = [
    { id: 'se-dirigido',      label: 'Dirigido a' },
    { id: 'se-municipio',     label: 'Municipio' },
    { id: 'se-lugar',         label: 'Lugar de Atención' },
    { id: 'se-fechaatencion', label: 'Fecha de la Jornada' }
  ];

  for (var i = 0; i < requeridos.length; i++) {
    var el = document.getElementById(requeridos[i].id);
    if (!el || !el.value.trim()) {
      if (el) {
        el.classList.add('border-red-400', 'ring-2', 'ring-red-100');
        el.focus();
        el.addEventListener('input', function () {
          this.classList.remove('border-red-400', 'ring-2', 'ring-red-100');
        }, { once: true });
      }
      return;
    }
  }

  var datos = {
    fechasolicitud: document.getElementById('se-fechasolicitud').value.trim(),
    dirigido:       document.getElementById('se-dirigido').value.trim(),
    municipio:      document.getElementById('se-municipio').value.trim(),
    lugar:          document.getElementById('se-lugar').value.trim(),
    fechaatencion:  document.getElementById('se-fechaatencion').value.trim(),
    horainicio:     document.getElementById('se-horainicio').value.trim(),
    horafinal:      document.getElementById('se-horafinal').value.trim()
  };

  // Mostrar spinner mientras carga la plantilla
  document.getElementById('se-btn-generar').disabled = true;
  document.getElementById('se-btn-texto').textContent = 'Generando...';
  document.getElementById('se-loading').classList.remove('hidden');
  document.getElementById('se-resultado').classList.add('hidden');
  document.getElementById('se-error').classList.add('hidden');

  // Cargar la plantilla HTML y reemplazar marcadores
  fetch('administracion/documentos/templates/solicitud-espacio.html?t=' + Date.now())
    .then(function(res) {
      if (!res.ok) throw new Error('No se pudo cargar la plantilla.');
      return res.text();
    })
    .then(function(html) {
      // Reemplazar todos los marcadores con los datos del formulario
      var doc = html;
      Object.keys(datos).forEach(function(clave) {
        var regex = new RegExp('\\{\\{' + clave + '\\}\\}', 'g');
        doc = doc.replace(regex, datos[clave]);
      });
      doc = window.empresaBrand.preparePrintHtml(doc);
      doc = _agregarBotonDescargaDocumento(doc);

      // Abrir en nueva ventana y disparar impresión
      var ventana = window.open('', '_blank', 'width=900,height=700');
      ventana.document.write(doc);
      ventana.document.close();
      ventana.focus();

      // En escritorio: imprimir automáticamente
      // En móvil: el usuario usa el menú nativo del navegador
      if (!/Mobi|Android/i.test(navigator.userAgent)) {
        setTimeout(function() { ventana.print(); }, 600);
      }

      // Restaurar estado del botón
      document.getElementById('se-btn-generar').disabled = false;
      document.getElementById('se-btn-texto').textContent = 'Generar Documento';
      document.getElementById('se-loading').classList.add('hidden');

      // Mostrar confirmación
      document.getElementById('se-resultado').classList.remove('hidden');
      document.getElementById('se-resultado').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    })
    .catch(function(err) {
      document.getElementById('se-btn-generar').disabled = false;
      document.getElementById('se-btn-texto').textContent = 'Generar Documento';
      document.getElementById('se-loading').classList.add('hidden');
      document.getElementById('se-error-msg').textContent = 'Error al cargar la plantilla: ' + err.toString();
      document.getElementById('se-error').classList.remove('hidden');
    });
}

function _resetFormSE() {
  var campos = ['se-dirigido', 'se-municipio', 'se-lugar', 'se-fechaatencion'];
  campos.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('se-resultado').classList.add('hidden');
  document.getElementById('se-error').classList.add('hidden');
  document.getElementById('se-btn-generar').disabled = false;
  document.getElementById('se-btn-texto').textContent = 'Generar Documento';
  document.getElementById('se-dirigido').focus();
}

function _agregarBotonDescargaDocumento(html) {
  var acciones =
    '<style id="documento-descarga-styles">' +
      '#documento-descargar{position:fixed;right:16px;bottom:16px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:9999;' +
        'min-height:56px;padding:0 24px;border:0;border-radius:12px;background:#0B5969;color:#fff;' +
        'font:600 18px Arial,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.24);cursor:pointer}' +
      '#documento-descargar:focus-visible{outline:3px solid #D9A62E;outline-offset:3px}' +
      '@media print{#documento-descargar,#documento-descarga-styles{display:none!important}}' +
    '</style>' +
    '<button id="documento-descargar" type="button" aria-label="Descargar documento como PDF" ' +
      'onclick="window.print()">Descargar</button>';

  if (!/<\/body>/i.test(html)) {
    throw new Error('La plantilla del documento no contiene la etiqueta de cierre del cuerpo.');
  }

  return html.replace(/<\/body>/i, acciones + '</body>');
}

function _campoInput(id, label, valor, tipo, requerido, placeholder) {
  return '<div>' +
    '<label for="' + id + '" class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">' +
      label + (requerido ? ' <span class="text-red-400 normal-case">*</span>' : '') +
    '</label>' +
    '<input type="' + tipo + '" id="' + id + '"' +
      ' value="' + (valor || '') + '"' +
      (placeholder ? ' placeholder="' + placeholder + '"' : '') +
      ' class="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700' +
      ' bg-slate-50 focus:outline-none focus:border-verde-oscuro focus:ring-2 focus:ring-verde-oscuro/10' +
      ' focus:bg-white transition-all">' +
  '</div>';
}

/**
 * Genera un campo selector de color.
 * @param {string} id
 * @param {string} label
 * @param {string} defaultColor - color hex por defecto, ej: '#ffffff'
 */
function _campoColor(id, label, defaultColor) {
  return '<div>' +
    '<label for="' + id + '" class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">' +
      label +
    '</label>' +
    '<div class="flex items-center gap-2">' +
      '<input type="color" id="' + id + '" value="' + (defaultColor || '#ffffff') + '"' +
        ' class="w-10 h-9 rounded cursor-pointer border border-slate-200 bg-slate-50 p-0.5">' +
      '<span class="text-xs text-slate-400" id="' + id + '-txt">' + (defaultColor || '#ffffff') + '</span>' +
    '</div>' +
  '</div>';
}


/* ──────────────────────────────────────────────────────────────
   HOJA DE CONVENIO — Vista con 2 acciones directas
────────────────────────────────────────────────────────────── */

/**
 * Muestra la tarjeta de Hoja de Convenio con dos botones:
 *  1. Imprimir/Descargar → abre hoja-convenio.html directo (sin variables)
 *  2. Editar/Personalizar → formulario que usa hoja-convenio-personalizable.html
 */
function _renderSelectorHojaConvenio() {
  var contenedor = document.getElementById('admin-content');
  if (!contenedor) return;

  contenedor.innerHTML =
    '<div class="fade-in">' +

      // ── Encabezado ──
      '<div class="flex items-center gap-3 mb-6">' +
        '<button onclick="renderDocumentos()"' +
          ' class="flex items-center gap-1.5 text-slate-500 hover:text-verde-oscuro transition-colors text-sm font-medium group">' +
          '<svg class="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>' +
          '</svg>' +
          'Volver' +
        '</button>' +
        '<div class="w-px h-5 bg-slate-200"></div>' +
        '<div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">' +
          '<svg class="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"/>' +
          '</svg>' +
        '</div>' +
        '<div>' +
          '<h3 class="text-verde-oscuro font-bold text-base leading-tight">Hoja de Convenio</h3>' +
          '<p class="text-slate-400 text-xs">Acuerdo formal entre la empresa y una institución aliada</p>' +
        '</div>' +
      '</div>' +

      // ── Tarjeta con las dos acciones ──
      '<div class="bg-white rounded-xl shadow-soft p-6 max-w-2xl">' +

        '<p class="text-sm text-slate-500 mb-5">Selecciona cómo quieres usar este documento:</p>' +

        '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">' +

          // ── Botón 1: Imprimir / Descargar
          '<button onclick="_abrirHojaConvenioFija()"' +
            ' class="group flex flex-col gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-400 active:scale-95 transition-all text-left">' +
            '<div class="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">' +
              '<svg class="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>' +
              '</svg>' +
            '</div>' +
            '<div>' +
              '<div class="font-bold text-amber-800 text-sm mb-0.5">Imprimir / Descargar</div>' +
              '<div class="text-xs text-amber-700 leading-snug">Abre el formato oficial y usa el botón Descargar para guardarlo como PDF.</div>' +
            '</div>' +
            '<div class="flex items-center gap-1 text-amber-700 text-xs font-semibold mt-1">' +
              'Abrir formato' +
              '<svg class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>' +
              '</svg>' +
            '</div>' +
          '</button>' +

          // ── Botón 2: Editar / Personalizar
          '<button onclick="_renderFormHojaConvenioPersonalizable()"' +
            ' class="group flex flex-col gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-verde-suave hover:border-verde-oscuro/30 active:scale-95 transition-all text-left">' +
            '<div class="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">' +
              '<svg class="w-5 h-5 text-verde-oscuro" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>' +
              '</svg>' +
            '</div>' +
            '<div>' +
              '<div class="font-bold text-verde-oscuro text-sm mb-0.5">Editar / Personalizar</div>' +
              '<div class="text-xs text-slate-500 leading-snug">Completa un formulario y genera una versión personalizada del convenio.</div>' +
            '</div>' +
            '<div class="flex items-center gap-1 text-verde-oscuro text-xs font-semibold mt-1">' +
              'Llenar formulario' +
              '<svg class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>' +
              '</svg>' +
            '</div>' +
          '</button>' +

        '</div>' +
      '</div>' +
    '</div>';
}

/** Abre hoja-convenio.html directo en nueva ventana y dispara impresión */
function _abrirHojaConvenioFija() {
  var ventana = window.open('administracion/documentos/templates/hoja-convenio.html', '_blank', 'width=900,height=700');
  if (ventana && !/Mobi|Android/i.test(navigator.userAgent)) {
    ventana.addEventListener('load', function () {
      setTimeout(function () { ventana.print(); }, 400);
    });
  }
}

/* ──────────────────────────────────────────────────────────────
   FORMULARIO — Hoja de Convenio Personalizable
────────────────────────────────────────────────────────────── */

function _renderFormHojaConvenioPersonalizable() {
  var contenedor = document.getElementById('admin-content');
  if (!contenedor) return;

  contenedor.innerHTML =
    '<div class="fade-in">' +

      '<div class="flex items-center gap-3 mb-6">' +
        '<button onclick="_renderSelectorHojaConvenio()"' +
          ' class="flex items-center gap-1.5 text-slate-500 hover:text-verde-oscuro transition-colors text-sm font-medium group">' +
          '<svg class="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>' +
          '</svg>' +
          'Volver' +
        '</button>' +
        '<div class="w-px h-5 bg-slate-200"></div>' +
        '<div class="w-8 h-8 rounded-lg bg-verde-suave flex items-center justify-center">' +
          '<svg class="w-4 h-4 text-verde-oscuro" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>' +
          '</svg>' +
        '</div>' +
        '<div>' +
          '<h3 class="text-verde-oscuro font-bold text-base leading-tight">Convenio Personalizable</h3>' +
          '<p class="text-slate-400 text-xs">Complete los campos y genere el documento</p>' +
        '</div>' +
      '</div>' +

      '<div class="bg-white rounded-xl shadow-soft p-6 max-w-2xl">' +

        '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">' +
          _campoInput('hcp-sres',               'Dirigido a (Sres.)',        '', 'text', true,  'Ej: Laboratorio Clinico Floresta') +
          _campoInput('hcp-fecha',              'Fecha',                     '', 'text', true,  'Ej: 13 de agosto de 2026') +
          _campoInput('hcp-ciudad',             'Ciudad',                    '', 'text', true,  'Ej: Santiago de Cali') +
          _campoInput('hcp-estado',             'Estado / Departamento',     '', 'text', true,  'Ej: Valle del Cauca') +
          _campoInput('hcp-direccion',          'Dirección',                 '', 'text', true,  'Ej: Cra 98 # 16-200, Local 142') +
          _campoInput('hcp-telefono',           'Teléfono',                  '', 'text', false, 'Ej: 602 555 1234') +
          _campoInput('hcp-dia_jornada',        'Día de la Jornada',         '', 'text', true,  'Ej: 04') +
          _campoInput('hcp-mes_jornada',        'Mes de la Jornada',         '', 'text', false, 'Ej: agosto') +
          _campoInput('hcp-valor_pago',         'Valor / Pago acordado',     '', 'text', false, 'Ej: Sin costo / $0') +
          _campoInput('hcp-nombre_coordinador', 'Nombre del Coordinador',    '', 'text', true,  'Ej: María García') +
          _campoInput('hcp-telefono_coordinador','Teléfono del Coordinador', '', 'text', false, 'Ej: 300 123 4567') +
          _campoInput('hcp-observaciones',      'Observaciones',             '', 'text', false, 'Información adicional (opcional)') +
        '</div>' +

        '<button id="hcp-btn-generar" onclick="_enviarHojaConvenioPersonalizable()"' +
          ' class="w-full btn-primario hover:bg-verde-oscuro active:scale-95 transition-all duration-200 text-white font-semibold text-sm px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-card">' +
          '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>' +
          '</svg>' +
          '<span id="hcp-btn-texto">Generar Documento</span>' +
        '</button>' +

        '<div id="hcp-loading" class="hidden mt-5 flex items-center justify-center gap-3 py-3">' +
          '<div class="spinner"></div>' +
          '<span class="text-sm text-slate-500 font-medium">Preparando documento...</span>' +
        '</div>' +

        '<div id="hcp-resultado" class="hidden mt-5 rounded-xl overflow-hidden border border-emerald-200">' +
          '<div class="bg-emerald-50 px-4 py-3 flex items-center gap-2">' +
            '<svg class="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
              '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>' +
            '</svg>' +
            '<span class="font-bold text-emerald-700 text-sm">¡Documento generado! Usa el botón Descargar en la vista del documento para guardarlo como PDF.</span>' +
          '</div>' +
          '<div class="bg-slate-50 px-4 py-3 border-t border-emerald-100 flex flex-wrap gap-2">' +
            '<button onclick="_enviarHojaConvenioPersonalizable()"' +
              ' class="flex items-center gap-1.5 btn-primario hover:bg-verde-oscuro text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors">' +
              '<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>' +
              '</svg>' +
              'Generar de nuevo' +
            '</button>' +
            '<button onclick="_resetFormHCP()"' +
              ' class="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors ml-auto">' +
              '<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>' +
              '</svg>' +
              'Nuevo convenio' +
            '</button>' +
          '</div>' +
        '</div>' +

        '<div id="hcp-error" class="hidden mt-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">' +
          '<svg class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>' +
          '</svg>' +
          '<span id="hcp-error-msg" class="text-sm text-red-700">Error al generar el documento.</span>' +
        '</div>' +

      '</div>' +
    '</div>';
}

function _enviarHojaConvenioPersonalizable() {
  var requeridos = [
    { id: 'hcp-sres',               label: 'Dirigido a (Sres.)' },
    { id: 'hcp-fecha',              label: 'Fecha' },
    { id: 'hcp-ciudad',             label: 'Ciudad' },
    { id: 'hcp-estado',             label: 'Estado / Departamento' },
    { id: 'hcp-direccion',          label: 'Dirección' },
    { id: 'hcp-dia_jornada',        label: 'Día de la Jornada' },
    { id: 'hcp-nombre_coordinador', label: 'Nombre del Coordinador' }
  ];

  for (var i = 0; i < requeridos.length; i++) {
    var el = document.getElementById(requeridos[i].id);
    if (!el || !el.value.trim()) {
      if (el) {
        el.classList.add('border-red-400', 'ring-2', 'ring-red-100');
        el.focus();
        el.addEventListener('input', function () {
          this.classList.remove('border-red-400', 'ring-2', 'ring-red-100');
        }, { once: true });
      }
      return;
    }
  }

  // Mapeo id-campo → clave {{marcador}} exacta del template
  var datos = {
    sres:               document.getElementById('hcp-sres').value.trim(),
    fecha:              document.getElementById('hcp-fecha').value.trim(),
    ciudad:             document.getElementById('hcp-ciudad').value.trim(),
    estado:             document.getElementById('hcp-estado').value.trim(),
    direccion:          document.getElementById('hcp-direccion').value.trim(),
    telefono:           document.getElementById('hcp-telefono').value.trim(),
    dia_jornada:        document.getElementById('hcp-dia_jornada').value.trim(),
    mes_jornada:        document.getElementById('hcp-mes_jornada').value.trim(),
    valor_pago:         document.getElementById('hcp-valor_pago').value.trim(),
    nombre_coordinador: document.getElementById('hcp-nombre_coordinador').value.trim(),
    telefono_coordinador: document.getElementById('hcp-telefono_coordinador').value.trim(),
    observaciones:      document.getElementById('hcp-observaciones').value.trim()
  };

  document.getElementById('hcp-btn-generar').disabled = true;
  document.getElementById('hcp-btn-texto').textContent = 'Generando...';
  document.getElementById('hcp-loading').classList.remove('hidden');
  document.getElementById('hcp-resultado').classList.add('hidden');
  document.getElementById('hcp-error').classList.add('hidden');

  fetch('administracion/documentos/templates/hoja-convenio-personalizable.html?t=' + Date.now())
    .then(function(res) {
      if (!res.ok) throw new Error('No se pudo cargar la plantilla.');
      return res.text();
    })
    .then(function(html) {
      var doc = html;
      Object.keys(datos).forEach(function(clave) {
        var regex = new RegExp('\\{\\{' + clave + '\\}\\}', 'g');
        doc = doc.replace(regex, datos[clave]);
      });
      doc = window.empresaBrand.preparePrintHtml(doc);
      doc = _agregarBotonDescargaDocumento(doc);

      var ventana = window.open('', '_blank', 'width=900,height=700');
      ventana.document.write(doc);
      ventana.document.close();
      ventana.focus();

      if (!/Mobi|Android/i.test(navigator.userAgent)) {
        setTimeout(function() { ventana.print(); }, 600);
      }

      document.getElementById('hcp-btn-generar').disabled = false;
      document.getElementById('hcp-btn-texto').textContent = 'Generar Documento';
      document.getElementById('hcp-loading').classList.add('hidden');
      document.getElementById('hcp-resultado').classList.remove('hidden');
      document.getElementById('hcp-resultado').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    })
    .catch(function(err) {
      document.getElementById('hcp-btn-generar').disabled = false;
      document.getElementById('hcp-btn-texto').textContent = 'Generar Documento';
      document.getElementById('hcp-loading').classList.add('hidden');
      document.getElementById('hcp-error-msg').textContent = 'Error al cargar la plantilla: ' + err.toString();
      document.getElementById('hcp-error').classList.remove('hidden');
    });
}


function _resetFormHCP() {
  var campos = ['hcp-sres', 'hcp-fecha', 'hcp-ciudad', 'hcp-estado', 'hcp-direccion',
                'hcp-telefono', 'hcp-dia_jornada', 'hcp-mes_jornada', 'hcp-valor_pago',
                'hcp-nombre_coordinador', 'hcp-telefono_coordinador', 'hcp-observaciones'];
  campos.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('hcp-resultado').classList.add('hidden');
  document.getElementById('hcp-error').classList.add('hidden');
  document.getElementById('hcp-btn-generar').disabled = false;
  document.getElementById('hcp-btn-texto').textContent = 'Generar Documento';
  document.getElementById('hcp-sres').focus();
}

/* ──────────────────────────────────────────────────────────────
   FORMULARIO — Permiso Policial
────────────────────────────────────────────────────────────── */

/**
 * Renderiza el formulario de Permiso Policial en #admin-content.
 * Incluye un selector múltiple con checkbox para elegir promotores
 * dinámicamente desde la API.
 */
function _renderFormPermisoPolicial() {
  var contenedor = document.getElementById('admin-content');
  if (!contenedor) return;

  var hoy  = new Date();
  var yyyy = hoy.getFullYear();
  var mm   = ('0' + (hoy.getMonth() + 1)).slice(-2);
  var dd   = ('0' + hoy.getDate()).slice(-2);
  var fechaHoy = dd + '/' + mm + '/' + yyyy;

  contenedor.innerHTML =
    '<div class="fade-in">' +

      // ── Encabezado ──
      '<div class="flex items-center gap-3 mb-6">' +
        '<button onclick="renderDocumentos()"' +
          ' class="flex items-center gap-1.5 text-slate-500 hover:text-verde-oscuro transition-colors text-sm font-medium group">' +
          '<svg class="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>' +
          '</svg>' +
          'Volver' +
        '</button>' +
        '<div class="w-px h-5 bg-slate-200"></div>' +
        '<div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">' +
          '<svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>' +
          '</svg>' +
        '</div>' +
        '<div>' +
          '<h3 class="text-verde-oscuro font-bold text-base leading-tight">Permiso Policial</h3>' +
          '<p class="text-slate-400 text-xs">Complete los campos y genere el documento</p>' +
        '</div>' +
      '</div>' +

      // ── Tarjeta ──
      '<div class="bg-white rounded-xl shadow-soft p-6 max-w-2xl">' +

        // Grid de campos
        '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">' +
          _campoInput('pp-fsolicitud',       'Fecha de Solicitud',          fechaHoy,       'text', false, 'dd/mm/aaaa') +
          _campoInput('pp-senores',          'Señores (destinatario)',       '',             'text', true,  'Ej: Comandancia de Policía') +
          _campoInput('pp-municipio',        'Municipio',                   '',             'text', true,  'Ej: Calabozo') +
          _campoInput('pp-diaspp',           'Días puerta a puerta',        '',             'text', true,  'Ej: 12, 13 y 14') +
          _campoInput('pp-mespp',            'Mes puerta a puerta',         '',             'text', true,  'Ej: agosto') +
          _campoInput('pp-fechajornada',     'Fecha de la Jornada',         '',             'text', true,  'Ej: 15 de agosto de 2026') +
          _campoInput('pp-lugarjornada',     'Lugar de la Jornada',         '',             'text', true,  'Ej: Laboratorio Clinico San Rafael')  +
          _campoInput('pp-municipiojornada', 'Municipio de la Jornada',     '',             'text', true,  'Ej: Calabozo') +
          _campoInput('pp-horainicio',       'Hora Inicio',                 '7:30 a.m.',    'text', false) +
          _campoInput('pp-horafin',          'Hora Fin',                    '5:30 p.m.',    'text', false) +
        '</div>' +

        // ── Selector de promotores ──
        '<div class="mb-6">' +
          '<div class="flex items-center justify-between mb-2">' +
            '<label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide">' +
              'Promotores asistentes <span class="text-red-400 normal-case">*</span>' +
            '</label>' +
            '<span id="pp-count" class="text-[11px] text-slate-400 font-medium">0 seleccionados</span>' +
          '</div>' +

          // Input de búsqueda
          '<div class="relative mb-2">' +
            '<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
              '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>' +
            '</svg>' +
            '<input id="pp-buscar" type="text" placeholder="Buscar promotor..." oninput="_ppFiltrar()" ' +
              'class="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-slate-50 focus:outline-none focus:border-verde-oscuro focus:ring-2 focus:ring-verde-oscuro/10 focus:bg-white transition-all">' +
          '</div>' +

          // Lista de promotores con checkbox
          '<div id="pp-lista" class="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">' +
            '<div class="flex items-center justify-center gap-2 py-6 text-slate-400 text-sm">' +
              '<div class="spinner w-4 h-4"></div>' +
              'Cargando promotores...' +
            '</div>' +
          '</div>' +

          // Botones de selección rápida
          '<div class="flex gap-2 mt-2">' +
            '<button type="button" onclick="_ppSeleccionarTodos()" ' +
              'class="text-xs text-verde-oscuro hover:underline font-semibold">Seleccionar todos</button>' +
            '<span class="text-slate-200">|</span>' +
            '<button type="button" onclick="_ppDeseleccionarTodos()" ' +
              'class="text-xs text-slate-400 hover:underline font-semibold">Limpiar</button>' +
          '</div>' +
        '</div>' +

        // Botón generar
        '<button id="pp-btn-generar" onclick="_enviarPermisoPolicial()"' +
          ' class="w-full btn-primario hover:bg-verde-oscuro active:scale-95 transition-all duration-200 text-white font-semibold text-sm px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-card">' +
          '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>' +
          '</svg>' +
          '<span id="pp-btn-texto">Generar Documento</span>' +
        '</button>' +

        '<div id="pp-loading" class="hidden mt-5 flex items-center justify-center gap-3 py-3">' +
          '<div class="spinner"></div>' +
          '<span class="text-sm text-slate-500 font-medium">Preparando documento...</span>' +
        '</div>' +

        '<div id="pp-resultado" class="hidden mt-5 rounded-xl overflow-hidden border border-emerald-200">' +
          '<div class="bg-emerald-50 px-4 py-3 flex items-center gap-2">' +
            '<svg class="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
              '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>' +
            '</svg>' +
            '<span class="font-bold text-emerald-700 text-sm">¡Documento generado! Usa el botón Descargar en la vista del documento para guardarlo como PDF.</span>' +
          '</div>' +
          '<div class="bg-slate-50 px-4 py-3 border-t border-emerald-100 flex flex-wrap gap-2">' +
            '<button onclick="_enviarPermisoPolicial()" class="flex items-center gap-1.5 btn-primario hover:bg-verde-oscuro text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors">' +
              '<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>' +
              '</svg>' +
              'Generar de nuevo' +
            '</button>' +
            '<button onclick="_resetFormPP()" class="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors ml-auto">' +
              '<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>' +
              '</svg>' +
              'Nuevo permiso' +
            '</button>' +
          '</div>' +
        '</div>' +

        '<div id="pp-error" class="hidden mt-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">' +
          '<svg class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>' +
          '</svg>' +
          '<span id="pp-error-msg" class="text-sm text-red-700">Error al generar el documento.</span>' +
        '</div>' +

      '</div>' +
    '</div>';

  // Cargar promotores desde la API
  _ppCargarPromotores();
}

/* ── Carga y renderiza la lista de promotores con checkboxes ── */
var _ppPromotoresTodos = []; // cache de todos los promotores

function _ppCargarPromotores() {
  var lista = document.getElementById('pp-lista');
  if (!lista) return;

  lista.innerHTML = '<div class="flex items-center justify-center gap-2 py-6 text-slate-400 text-sm"><div class="spinner w-4 h-4"></div> Cargando...</div>';

  PromotoresService.getAll()
    .then(function(arr) {
      _ppPromotoresTodos = arr || [];
      _ppRenderLista(_ppPromotoresTodos);
    })
    .catch(function(err) {
      lista.innerHTML = '<div class="px-4 py-3 text-sm text-red-500">Error cargando promotores: ' + (err && err.message ? err.message : '') + '</div>';
    });
}

function _ppRenderLista(promotores) {
  var lista = document.getElementById('pp-lista');
  if (!lista) return;

  if (!promotores || promotores.length === 0) {
    lista.innerHTML = '<div class="px-4 py-3 text-sm text-slate-400 text-center">No hay promotores disponibles.</div>';
    return;
  }

  lista.innerHTML = promotores.map(function(p, i) {
    var cedula = (p.cedula || '').toString().trim();
    var nombre = (p.nombre || '').toString().trim();
    var id = 'pp-chk-' + cedula.replace(/\W/g, '_');
    return '<label class="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors" for="' + id + '">' +
      '<input type="checkbox" id="' + id + '" value="' + cedula + '" data-nombre="' + nombre + '"' +
        ' onchange="_ppActualizarContador()"' +
        ' class="w-4 h-4 rounded border-slate-300 text-verde-oscuro focus:ring-verde-oscuro/30 cursor-pointer flex-shrink-0">' +
      '<span class="text-sm text-slate-700 flex-1 min-w-0">' + nombre + '</span>' +
      '<span class="text-xs text-slate-400 flex-shrink-0">' + cedula + '</span>' +
    '</label>';
  }).join('');
}

function _ppFiltrar() {
  var q = (document.getElementById('pp-buscar') || {}).value || '';
  q = q.toLowerCase().trim();
  if (!q) {
    _ppRenderLista(_ppPromotoresTodos);
    return;
  }
  var filtrados = _ppPromotoresTodos.filter(function(p) {
    var cedula = (p.cedula || '').toString().toLowerCase();
    var nombre = (p.nombre || '').toString().toLowerCase();
    return cedula.includes(q) || nombre.includes(q);
  });
  _ppRenderLista(filtrados);
}

function _ppActualizarContador() {
  var checks = document.querySelectorAll('#pp-lista input[type="checkbox"]:checked');
  var countEl = document.getElementById('pp-count');
  if (countEl) countEl.textContent = checks.length + ' seleccionado' + (checks.length !== 1 ? 's' : '');
}

function _ppSeleccionarTodos() {
  document.querySelectorAll('#pp-lista input[type="checkbox"]').forEach(function(c) { c.checked = true; });
  _ppActualizarContador();
}

function _ppDeseleccionarTodos() {
  document.querySelectorAll('#pp-lista input[type="checkbox"]').forEach(function(c) { c.checked = false; });
  _ppActualizarContador();
}

/* ── Construye las filas HTML de la tabla de promotores ── */
function _ppBuildFilasPromotores() {
  var checks = document.querySelectorAll('#pp-lista input[type="checkbox"]:checked');
  if (checks.length === 0) return null;

  var filas = '';
  checks.forEach(function(c) {
    filas += '<tr><td>' + c.value + '</td><td>' + c.getAttribute('data-nombre') + '</td></tr>';
  });
  return filas;
}

/**
 * Construye el HTML de la tabla de doble columna.
 * Cada fila contiene: N° | Documento | Nombre  ||  N° | Documento | Nombre
 * @param {Array} promotores - Array de {cedula, nombre}
 * @param {number} offset    - Número inicial para el índice N°
 * @returns {string} HTML del <table>
 */
function _ppBuildTablaDoble(promotores, offset) {
  offset = offset || 0;

  // Encabezado con proporciones ajustadas:
  // N°(4%) | Doc(14%) | Nombre(31%) | sep | N°(4%) | Doc(14%) | Nombre(31%)  = ~98%
  var thead =
    '<thead><tr>' +
      '<th class="col-n"  style="width:4%">N°</th>' +
      '<th class="col-doc" style="width:14%">Documento</th>' +
      '<th class="col-nom" style="width:31%">Nombre y apellido</th>' +
      '<th class="col-n sep" style="width:4%">N°</th>' +
      '<th class="col-doc" style="width:14%">Documento</th>' +
      '<th class="col-nom" style="width:31%">Nombre y apellido</th>' +
    '</tr></thead>';

  var filas = '';
  var mid = Math.ceil(promotores.length / 2);

  for (var i = 0; i < mid; i++) {
    var izq = promotores[i];
    var der = promotores[i + mid];
    var even = (i % 2 === 1) ? ' style="background:#f7fafb"' : '';
    filas += '<tr' + even + '>';
    // Columna izquierda
    filas += '<td class="col-n">' + (offset + i + 1) + '</td>';
    filas += '<td class="col-doc">' + izq.cedula + '</td>';
    filas += '<td class="col-nom">' + izq.nombre + '</td>';
    // Columna derecha
    if (der) {
      filas += '<td class="col-n sep">' + (offset + i + mid + 1) + '</td>';
      filas += '<td class="col-doc">' + der.cedula + '</td>';
      filas += '<td class="col-nom">' + der.nombre + '</td>';
    } else {
      filas += '<td class="sep"></td><td></td><td></td>';
    }
    filas += '</tr>';
  }

  return '<table class="team-table" style="table-layout:fixed;width:100%">' +
    thead + '<tbody>' + filas + '</tbody></table>';
}

/**
 * Devuelve el HTML de una segunda página completa para el permiso policial.
 * Solo incluye tabla de continuación + firmas + footer (SIN firmas en pág 1).
 */
function _ppBuildSegundaPagina(promotoresPag2, offset, footerHtml, conFirmas) {
  var tablaHTML = _ppBuildTablaDoble(promotoresPag2, offset);

  var firmasHTML = conFirmas ?
    '<section class="signatures">' +
      '<div class="card"><div class="card-head">Coordinador(a)</div><div class="card-body">' +
        '<div class="sig"><b>Firma:</b><span class="line"></span></div>' +
        '<div class="sig"><b>Teléfono:</b><span class="line"></span></div>' +
      '</div></div>' +
      '<div class="card"><div class="card-head">Representante / Recibido</div><div class="card-body">' +
        '<div class="sig"><b>Nombre:</b><span class="line"></span></div>' +
        '<div class="sig"><b>Cargo:</b><span class="line"></span></div>' +
        '<div class="sig"><b>Teléfono:</b><span class="line"></span></div>' +
        '<div class="sig"><b>Firma:</b><span class="line"></span></div>' +
      '</div></div>' +
    '</section>' : '';

  return '<div class="page">' +
    '<div class="top"></div>' +
    '<div class="team-title" style="margin-top:.18in">Continuación — Equipo de asesores de salud visual:</div>' +
    '<div class="team-table-wrap">' + tablaHTML + '</div>' +
    firmasHTML +
    footerHtml +
  '</div>';
}

/* ── Submit del formulario ── */
function _enviarPermisoPolicial() {

  // Validar campos requeridos
  var requeridos = [
    { id: 'pp-senores',    label: 'Señores' },
    { id: 'pp-municipio',  label: 'Municipio' },
    { id: 'pp-diaspp',     label: 'Días puerta a puerta' },
    { id: 'pp-mespp',      label: 'Mes puerta a puerta' },
    { id: 'pp-fechajornada', label: 'Fecha de la Jornada' }
  ];

  for (var i = 0; i < requeridos.length; i++) {
    var el = document.getElementById(requeridos[i].id);
    if (!el || !el.value.trim()) {
      if (el) {
        el.classList.add('border-red-400', 'ring-2', 'ring-red-100');
        el.focus();
        el.addEventListener('input', function() {
          this.classList.remove('border-red-400', 'ring-2', 'ring-red-100');
        }, { once: true });
      }
      return;
    }
  }

  // Validar que haya al menos un promotor seleccionado
  var filasPromotores = _ppBuildFilasPromotores();
  if (!filasPromotores) {
    var lista = document.getElementById('pp-lista');
    if (lista) {
      lista.classList.add('ring-2', 'ring-red-200', 'border-red-300');
      setTimeout(function() {
        lista.classList.remove('ring-2', 'ring-red-200', 'border-red-300');
      }, 2000);
    }
    return;
  }

  var datos = {
    Fsolicitud:       document.getElementById('pp-fsolicitud').value.trim(),
    Senores:          document.getElementById('pp-senores').value.trim(),
    Municipio:        document.getElementById('pp-municipio').value.trim(),
    DiasPuertaPuerta: document.getElementById('pp-diaspp').value.trim(),
    MesPuertaPuerta:  document.getElementById('pp-mespp').value.trim(),
    FechaJornada:     document.getElementById('pp-fechajornada').value.trim(),
    LugarJornada:     document.getElementById('pp-lugarjornada').value.trim(),
    MunicipioJornada: document.getElementById('pp-municipiojornada').value.trim(),
    HoraInicio:       document.getElementById('pp-horainicio').value.trim(),
    HoraFin:          document.getElementById('pp-horafin').value.trim(),
    Promotores:       filasPromotores
  };

  document.getElementById('pp-btn-generar').disabled = true;
  document.getElementById('pp-btn-texto').textContent = 'Generando...';
  document.getElementById('pp-loading').classList.remove('hidden');
  document.getElementById('pp-resultado').classList.add('hidden');
  document.getElementById('pp-error').classList.add('hidden');

  fetch('administracion/documentos/templates/permiso-policial.html?t=' + Date.now())
    .then(function(res) {
      if (!res.ok) throw new Error('No se pudo cargar la plantilla.');
      return res.text();
    })
    .then(function(html) {
      // Obtener todos los promotores seleccionados
      var checks = document.querySelectorAll('#pp-lista input[type="checkbox"]:checked');
      var todosPromotores = [];
      checks.forEach(function(c) {
        todosPromotores.push({ cedula: c.value, nombre: c.getAttribute('data-nombre') });
      });

      var MAX_PAG1 = 22; // máximo promotores en tabla doble de página 1

      // Extraer footer del template para reutilizarlo
      var footerMatch = html.match(/<footer[\s\S]*?<\/footer>/);
      var footerHtml = footerMatch ? footerMatch[0] : '';

      var pag1Promotores = todosPromotores.slice(0, MAX_PAG1);
      var pag2Promotores = todosPromotores.slice(MAX_PAG1);
      var hayPag2 = pag2Promotores.length > 0;

      // Tabla doble para página 1
      var tablaDoble = _ppBuildTablaDoble(pag1Promotores, 0);
      datos.Promotores = tablaDoble;

      // En página 1: firmas solo si NO hay segunda página
      var firmasPag1 = hayPag2 ? '' :
        '<section class="signatures">' +
          '<div class="card"><div class="card-head">Coordinador(a)</div><div class="card-body">' +
            '<div class="sig"><b>Firma:</b><span class="line"></span></div>' +
            '<div class="sig"><b>Teléfono:</b><span class="line"></span></div>' +
          '</div></div>' +
          '<div class="card"><div class="card-head">Representante / Recibido</div><div class="card-body">' +
            '<div class="sig"><b>Nombre:</b><span class="line"></span></div>' +
            '<div class="sig"><b>Cargo:</b><span class="line"></span></div>' +
            '<div class="sig"><b>Teléfono:</b><span class="line"></span></div>' +
            '<div class="sig"><b>Firma:</b><span class="line"></span></div>' +
          '</div></div>' +
        '</section>';

      var doc = html;
      Object.keys(datos).forEach(function(clave) {
        var regex = new RegExp('\\{\\{' + clave + '\\}\\}', 'g');
        doc = doc.replace(regex, datos[clave]);
      });

      // Si hay segunda página: quitar firmas de pág 1 e inyectar segunda página
      if (hayPag2) {
        // Eliminar el bloque .signatures que viene en el template original
        doc = doc.replace(/<section class="signatures">[\s\S]*?<\/section>/, '');
        // Inyectar segunda página (con firmas al final)
        var pag2HTML = _ppBuildSegundaPagina(pag2Promotores, MAX_PAG1, footerHtml, true);
        doc = doc.replace('</body>', pag2HTML + '</body>');
      } else {
        // Una sola página: reemplazar las firmas originales con las correctas
        doc = doc.replace(/<section class="signatures">[\s\S]*?<\/section>/, firmasPag1);
      }
      doc = window.empresaBrand.preparePrintHtml(doc);
      doc = _agregarBotonDescargaDocumento(doc);

      var ventana = window.open('', '_blank', 'width=900,height=700');
      ventana.document.write(doc);
      ventana.document.close();
      ventana.focus();

      if (!/Mobi|Android/i.test(navigator.userAgent)) {
        setTimeout(function() { ventana.print(); }, 600);
      }

      document.getElementById('pp-btn-generar').disabled = false;
      document.getElementById('pp-btn-texto').textContent = 'Generar Documento';
      document.getElementById('pp-loading').classList.add('hidden');
      document.getElementById('pp-resultado').classList.remove('hidden');
      document.getElementById('pp-resultado').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    })
    .catch(function(err) {
      document.getElementById('pp-btn-generar').disabled = false;
      document.getElementById('pp-btn-texto').textContent = 'Generar Documento';
      document.getElementById('pp-loading').classList.add('hidden');
      document.getElementById('pp-error-msg').textContent = 'Error al cargar la plantilla: ' + err.toString();
      document.getElementById('pp-error').classList.remove('hidden');
    });
}

function _resetFormPP() {
  var campos = ['pp-senores', 'pp-municipio', 'pp-diaspp', 'pp-mespp', 'pp-fechajornada'];
  campos.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  _ppDeseleccionarTodos();
  document.getElementById('pp-resultado').classList.add('hidden');
  document.getElementById('pp-error').classList.add('hidden');
  document.getElementById('pp-btn-generar').disabled = false;
  document.getElementById('pp-btn-texto').textContent = 'Generar Documento';
  document.getElementById('pp-senores').focus();
}

/* ──────────────────────────────────────────────────────────────
   PUBLICIDAD DE BRIGADA — Formulario + render con imagen base
────────────────────────────────────────────────────────────── */

function _renderFormPublicidad() {
  var contenedor = document.getElementById('admin-content');
  if (!contenedor) return;

  contenedor.innerHTML =
    '<div class="fade-in">' +

      // Encabezado
      '<div class="flex items-center gap-3 mb-6">' +
        '<button onclick="renderDocumentos()"' +
          ' class="flex items-center gap-1.5 text-slate-500 hover:text-verde-oscuro transition-colors text-sm font-medium group">' +
          '<svg class="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>' +
          '</svg>Volver' +
        '</button>' +
        '<div class="w-px h-5 bg-slate-200"></div>' +
        '<div class="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center">' +
          '<svg class="w-4 h-4 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>' +
          '</svg>' +
        '</div>' +
        '<div>' +
          '<h3 class="text-verde-oscuro font-bold text-base leading-tight">Publicidad de Brigada</h3>' +
          '<p class="text-slate-400 text-xs">Afiche informativo para brigadas optométricas</p>' +
        '</div>' +
      '</div>' +

      // Layout: formulario izquierda + preview derecha
      '<div class="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-start">' +

        // Formulario
        '<div class="bg-white rounded-xl shadow-soft p-6">' +

          '<div class="space-y-4 mb-6">' +
            _campoInput('pub-municipio',        'Municipio',                   '',           'text',  true,  'Ej: Ejido') +
            _campoInput('pub-institucion',      'Institución',                 '',           'text',  true,  'Ej: Clínica José Martí') +
            _campoInput('pub-fecha',            'Fecha',                       '',           'text',  true,  'Ej: Miércoles 2 de agosto') +
            _campoInput('pub-horario',          'Horario',                     '8:00 AM a 5:00 PM', 'text', false, 'Ej: 8:00 AM a 5:00 PM') +
          '</div>' +

          '<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">' +
            '<button onclick="_generarPublicidad()" id="pub-btn-generar"' +
              ' class="col-span-2 sm:col-span-1 btn-primario hover:bg-verde-oscuro active:scale-95 transition-all text-white font-semibold text-sm px-4 py-3 rounded-xl flex items-center justify-center gap-2 shadow-card">' +
              '<svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>' +
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>' +
              '</svg>' +
              '<span id="pub-btn-texto">Previsualizar</span>' +
            '</button>' +
            '<button onclick="_imprimirPublicidad()" id="pub-btn-imprimir"' +
              ' class="py-3 px-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:border-verde-oscuro hover:text-verde-oscuro transition-all text-sm font-semibold flex items-center justify-center gap-1">' +
              '<svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>' +
              '</svg>' +
              '<span>Imprimir</span>' +
            '</button>' +
            '<button onclick="_descargarPublicidad()" id="pub-btn-descargar"' +
              ' class="py-3 px-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:border-azul hover:text-azul transition-all text-sm font-semibold flex items-center justify-center gap-1">' +
              '<svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>' +
              '</svg>' +
              '<span>Descargar</span>' +
            '</button>' +
          '</div>' +

          '<div id="pub-error" class="hidden mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"></div>' +

        '</div>' +

        // Preview en vivo — posiciones escaladas: factor 280/1055 = 0.2654
        // Preview con proporciones exactas (escala 0.2654 de 1055x1491)
        '<div class="block">' +
          '<p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2 text-center">Vista previa · 1:3.77</p>' +
          '<div id="pub-preview-wrap"' +
            ' style="position:relative;width:280px;height:396px;' +
            'background-image:url(\'administracion/documentos/publicidad/Publicidad.jpg\');' +
            'background-size:100% 100%;border-radius:8px;overflow:hidden;' +
            'box-shadow:0 8px 24px rgba(0,0,0,0.18);">' +
            /* Municipio: left:265->70 top:335->89 w:395->105 fs:40->11 colores fijo=#fff din=#d49500 */
            '<div id="prev-municipio" data-publicidad-campo="municipio" style="position:absolute;left:70px;top:89px;width:105px;' +
              'text-align:center;font-family:Poppins,sans-serif;font-size:11px;font-weight:800;' +
              'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2;">' +
              '<span data-publicidad-texto="municipio:fijo" style="color:#ffffff;">Municipio: </span>' +
              '<span id="prev-mun-val" data-publicidad-texto="municipio:variable" style="color:#d49500;"></span>' +
            '</div>' +
            /* Institucion: left:320->85 top:548->145 w:525->139 fs:35->9 color=#00363a */
            '<div id="preview-campo-institucion" data-publicidad-campo="institucion" style="position:absolute;left:85px;top:145px;width:139px;' +
              'text-align:center;font-family:Poppins,sans-serif;font-size:9px;font-weight:900;color:#00363a;' +
              'white-space:normal;word-break:break-word;line-height:1.2;">' +
              '<span data-publicidad-texto="institucion:fijo">Lugar: </span>' +
              '<span id="prev-institucion" data-publicidad-texto="institucion:variable"></span>' +
            '</div>' +
            /* Fecha: left:140->37 top:1162->308 w:350->93 fs:29->8 colores fijo=#fff din=#fff */
            '<div id="prev-fecha" data-publicidad-campo="fecha" style="position:absolute;left:37px;top:308px;width:93px;' +
              'text-align:left;font-family:Poppins,sans-serif;font-size:8px;font-weight:700;' +
              'white-space:nowrap;line-height:1.2;">' +
              '<span data-publicidad-texto="fecha:fijo" style="color:#ffffff;">Fecha: </span>' +
              '<span id="prev-fecha-val" data-publicidad-texto="fecha:variable" style="color:#ffffff;"></span>' +
            '</div>' +
            /* Horario: left:140->37 top:1200->318 w:355->94 fs:29->8 colores fijo=#fff din=#d49500 */
            '<div id="prev-horario" data-publicidad-campo="horario" style="position:absolute;left:37px;top:318px;width:94px;' +
              'text-align:left;font-family:Poppins,sans-serif;font-size:8px;font-weight:700;' +
              'white-space:nowrap;line-height:1.2;">' +
              '<span data-publicidad-texto="horario:fijo" style="color:#ffffff;">Horario: </span>' +
              '<span id="prev-hor-val" data-publicidad-texto="horario:variable" style="color:#d49500;"></span>' +
            '</div>' +
            '<button type="button" onclick="_abrirEditorPublicidad()"' +
              ' class="mt-3 w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-verde-oscuro hover:border-verde-oscuro transition-all text-sm font-semibold">' +
              'Editar' +
            '</button>' +
          '</div>' +
        '</div>' +

      '</div>' + // fin grid

    '</div>';

  // Actualizar preview en tiempo real al escribir
  ['pub-municipio', 'pub-institucion', 'pub-fecha', 'pub-horario'].forEach(function(id) {
    var input = document.getElementById(id);
    if (input) input.addEventListener('input', _actualizarPreviewPublicidad);
  });
  _publicidadCargarPlantillaBase();
}

var _PUBLICIDAD_ANCHO = 1055;
var _PUBLICIDAD_ALTO = 1491;
var _PUBLICIDAD_CAMPOS = {
  municipio: {
    selector: 'municipio', left: 265, top: 335, width: 395, fontSize: 25, weight: 800,
    fijo: { fontSize: 25, color: '#023459' },
    variable: { fontSize: 25, color: '#d49500' }
  },
  institucion: {
    selector: 'institucion', left: 320, top: 548, width: 525, fontSize: 25, weight: 900,
    fijo: { fontSize: 25, color: '#023459' },
    variable: { fontSize: 25, color: '#00363a' }
  },
  fecha: {
    selector: 'fecha', left: 140, top: 1162, width: 350, fontSize: 29, weight: 700,
    fijo: { fontSize: 25, color: '#023459' },
    variable: { fontSize: 25, color: '#d49500' }
  },
  horario: {
    selector: 'horario', left: 140, top: 1200, width: 355, fontSize: 29, weight: 700,
    fijo: { fontSize: 25, color: '#023459' },
    variable: { fontSize: 25, color: '#d49500' }
  }
};

function _publicidadLeerConfiguracion(html) {
  var campos = {};
  Object.keys(_PUBLICIDAD_CAMPOS).forEach(function(nombre) {
    var base = _PUBLICIDAD_CAMPOS[nombre];
    var estilo = _publicidadLeerReglaCss(html, '.' + base.selector);
    var texto = {};
    Object.keys(base).forEach(function(tipo) {
      if (tipo !== 'fijo' && tipo !== 'variable') return;
      var regla = _publicidadLeerReglaCss(
        html,
        '.' + base.selector + (tipo === 'fijo' ? ' .fijo' : ' .dinamico')
      );
      texto[tipo] = {
        fontSize: _publicidadLeerNumeroCss(regla, 'font-size', base[tipo].fontSize),
        color: _publicidadLeerColorCss(regla, base[tipo].color)
      };
    });
    campos[nombre] = {
      left: _publicidadLeerNumeroCss(estilo, 'left', base.left),
      top: _publicidadLeerNumeroCss(estilo, 'top', base.top),
      width: _publicidadLeerNumeroCss(estilo, 'width', base.width),
      fontSize: _publicidadLeerNumeroCss(estilo, 'font-size', base.fontSize),
      align: _publicidadLeerAlineacionCss(estilo),
      weight: base.weight,
      texto: texto
    };
  });
  var bloqueFondo = /\.publicidad\s*\{([^}]*)\}/.exec(html);
  var fondo = bloqueFondo && /background-image\s*:\s*url\(["']?([^"')]+)["']?\)/.exec(bloqueFondo[1]);
  if (!fondo) throw new Error('No se encontró la imagen de fondo en la plantilla de publicidad.');
  return {
    campos: campos,
    baseCampos: JSON.parse(JSON.stringify(campos)),
    imagen: fondo[1],
    plantilla: html,
    modificado: false
  };
}

function _publicidadLeerReglaCss(html, selector) {
  var seguro = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  var bloque = new RegExp('(?:^|})\\s*' + seguro + '\\s*\\{([^}]*)\\}', 'm').exec(html);
  return bloque ? bloque[1] : '';
}

function _publicidadLeerNumeroCss(estilo, propiedad, predeterminado) {
  var coincidencia = new RegExp('\\b' + propiedad + '\\s*:\\s*([\\d.]+)px').exec(estilo);
  return coincidencia ? Number(coincidencia[1]) : predeterminado;
}

function _publicidadLeerColorCss(estilo, predeterminado) {
  var coincidencia = /\bcolor\s*:\s*(#[0-9a-f]{3,8})\b/i.exec(estilo);
  return coincidencia ? coincidencia[1] : predeterminado;
}

function _publicidadLeerAlineacionCss(estilo) {
  var coincidencia = /\btext-align\s*:\s*(left|center|right)\b/i.exec(estilo);
  return coincidencia ? coincidencia[1].toLowerCase() : 'left';
}

function _publicidadCargarPlantillaBase() {
  fetch('administracion/documentos/publicidad/publicidad.html?t=' + Date.now())
    .then(function(res) {
      if (!res.ok) throw new Error('No se pudo cargar la plantilla de publicidad.');
      return res.text();
    })
    .then(function(html) {
      if (!window._publicidadEdicion || !window._publicidadEdicion.modificado) {
        window._publicidadEdicion = _publicidadLeerConfiguracion(html);
      }
      _publicidadAplicarVistaPrevia();
    })
    .catch(function(err) {
      _publicidadMostrarError('No se pudo cargar la plantilla para editar: ' + err.message);
    });
}

function _publicidadAplicarVistaPrevia() {
  var estado = window._publicidadEdicion;
  if (!estado) return;
  var marco = document.getElementById('pub-preview-wrap');
  if (marco) marco.style.backgroundImage = 'url("' + estado.imagen + '")';
  Object.keys(estado.campos).forEach(function(nombre) {
    var campo = estado.campos[nombre];
    var vista = document.querySelector('[data-publicidad-campo="' + nombre + '"]');
    if (!vista) return;
    vista.style.left = (campo.left / _PUBLICIDAD_ANCHO * 280) + 'px';
    vista.style.top = (campo.top / _PUBLICIDAD_ALTO * 396) + 'px';
    vista.style.width = (campo.width / _PUBLICIDAD_ANCHO * 280) + 'px';
    vista.style.fontSize = (campo.fontSize / _PUBLICIDAD_ANCHO * 280) + 'px';
    vista.style.textAlign = campo.align;
    Object.keys(campo.texto).forEach(function(tipo) {
      _publicidadAplicarEstiloTexto(nombre, tipo, campo.texto[tipo]);
    });
  });
}

function _publicidadMostrarError(mensaje) {
  var error = document.getElementById('pub-error');
  if (error) {
    error.textContent = mensaje;
    error.classList.remove('hidden');
  }
}

function _publicidadEscaparHtml(texto) {
  return String(texto).replace(/[&<>"']/g, function(caracter) {
    return {
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[caracter];
  });
}

function _abrirEditorPublicidad() {
  if (!window._publicidadEdicion) {
    fetch('administracion/documentos/publicidad/publicidad.html?t=' + Date.now())
      .then(function(res) {
        if (!res.ok) throw new Error('No se pudo cargar la plantilla de publicidad.');
        return res.text();
      })
      .then(function(html) {
        window._publicidadEdicion = _publicidadLeerConfiguracion(html);
        _publicidadAplicarVistaPrevia();
        _publicidadMostrarEditor();
      })
      .catch(function(err) {
        _publicidadMostrarError('No se pudo abrir el editor: ' + err.message);
      });
    return;
  }
  _publicidadMostrarEditor();
}

function _publicidadMostrarEditor() {
  var anterior = document.getElementById('pub-editor-modal');
  if (anterior) anterior.remove();
  var modal = document.createElement('div');
  modal.id = 'pub-editor-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(15,23,42,.72);overflow:auto;padding:20px;';
  modal.innerHTML =
    '<div style="max-width:900px;margin:0 auto;background:#fff;border-radius:16px;padding:20px;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px;">' +
        '<div><h2 style="font-size:20px;font-weight:700;color:#064e3b;">Editar afiche de publicidad</h2>' +
        '<p style="font-size:13px;color:#64748b;">Arrastra cada variable sobre la imagen. Al guardar se descargará la plantilla actualizada.</p></div>' +
        '<button type="button" data-pub-cerrar style="border:0;background:transparent;font-size:24px;cursor:pointer;">&times;</button>' +
      '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px;">' +
        '<label style="cursor:pointer;padding:9px 12px;border:1px solid #cbd5e1;border-radius:9px;font-size:13px;font-weight:600;">' +
          'Cambiar imagen<input id="pub-editor-imagen" type="file" accept="image/*" style="display:none;">' +
        '</label>' +
        '<button type="button" data-pub-restablecer style="padding:9px 12px;border:1px solid #cbd5e1;border-radius:9px;background:#fff;cursor:pointer;">Restablecer posiciones</button>' +
      '</div>' +
      _publicidadControlesEstiloHtml() +
      '<div id="pub-editor-error" style="display:none;margin-bottom:12px;padding:10px;background:#fef2f2;color:#b91c1c;border-radius:8px;font-size:13px;"></div>' +
      '<div style="display:flex;justify-content:center;overflow:auto;padding:8px;">' +
        '<div id="pub-editor-viewport" style="position:relative;width:min(78vw,520px);aspect-ratio:1055/1491;flex:none;">' +
          '<div id="pub-editor-stage" style="position:absolute;left:0;top:0;width:1055px;height:1491px;transform-origin:top left;background-size:100% 100%;background-repeat:no-repeat;box-shadow:0 4px 18px rgba(0,0,0,.2);touch-action:none;"></div>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;">' +
        '<button type="button" data-pub-cancelar style="padding:10px 16px;border:1px solid #cbd5e1;border-radius:9px;background:#fff;cursor:pointer;">Cancelar</button>' +
        '<button type="button" data-pub-guardar style="padding:10px 16px;border:0;border-radius:9px;background:#047857;color:#fff;font-weight:700;cursor:pointer;">Descargar plantilla actualizada</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(modal);
  modal.querySelector('[data-pub-cerrar]').addEventListener('click', _publicidadCancelarEdicion);
  modal.querySelector('[data-pub-cancelar]').addEventListener('click', _publicidadCancelarEdicion);
  modal.querySelector('[data-pub-guardar]').addEventListener('click', _publicidadDescargarPlantilla);
  modal.querySelector('[data-pub-restablecer]').addEventListener('click', _publicidadRestablecerPosiciones);
  modal.querySelector('#pub-editor-imagen').addEventListener('change', _publicidadCargarImagenEditor);
  modal.querySelectorAll('[data-pub-font-size]').forEach(function(control) {
    control.addEventListener('input', _publicidadCambiarEstiloTexto);
  });
  modal.querySelectorAll('[data-pub-color]').forEach(function(control) {
    control.addEventListener('input', _publicidadCambiarEstiloTexto);
  });
  modal.querySelectorAll('[data-pub-align]').forEach(function(control) {
    control.addEventListener('change', _publicidadCambiarAlineacion);
  });
  _publicidadRenderizarEditor();
}

function _publicidadCambiarAlineacion(evento) {
  var control = evento.currentTarget;
  var nombre = control.getAttribute('data-pub-align');
  var alineacion = control.value;
  if (['left', 'center', 'right'].indexOf(alineacion) === -1) return;
  window._publicidadEdicion.campos[nombre].align = alineacion;
  window._publicidadEdicion.modificado = true;
  window._pubHtmlGenerado = null;
  _publicidadAplicarVistaPrevia();
  var campoEditor = document.querySelector('[data-pub-editor-campo="' + nombre + '"]');
  if (campoEditor) campoEditor.style.textAlign = alineacion;
}

function _publicidadCambiarEstiloTexto(evento) {
  var control = evento.currentTarget;
  var identificador = control.getAttribute('data-pub-font-size') ||
    control.getAttribute('data-pub-color');
  var partes = identificador.split(':');
  var nombre = partes[0];
  var tipo = partes[1];
  var estilo = window._publicidadEdicion.campos[nombre].texto[tipo];
  if (control.hasAttribute('data-pub-font-size')) {
    var tamano = Number(control.value);
    if (!Number.isFinite(tamano) || tamano < 8 || tamano > 160) return;
    estilo.fontSize = tamano;
  } else {
    estilo.color = control.value;
  }
  window._publicidadEdicion.modificado = true;
  window._pubHtmlGenerado = null;
  _publicidadAplicarEstiloTexto(nombre, tipo, estilo);
}

function _publicidadAplicarEstiloTexto(nombre, tipo, estilo) {
  var selector = '[data-publicidad-texto="' + nombre + ':' + tipo + '"]';
  document.querySelectorAll(selector).forEach(function(elemento) {
    var enPreview = elemento.closest('#pub-preview-wrap');
    var escala = enPreview ? 280 / _PUBLICIDAD_ANCHO : 1;
    elemento.style.fontSize = (estilo.fontSize * escala) + 'px';
    elemento.style.color = estilo.color;
  });
}

function _publicidadControlesEstiloHtml() {
  var partes = [];
  Object.keys(_PUBLICIDAD_CAMPOS).forEach(function(nombre) {
    var config = _PUBLICIDAD_CAMPOS[nombre];
    var etiquetaCampo = nombre === 'institucion' ? 'Lugar' :
      nombre.charAt(0).toUpperCase() + nombre.slice(1);
    partes.push(
      '<label style="display:flex;align-items:center;gap:8px;padding:8px;border:1px solid #e2e8f0;border-radius:8px;font-size:12px;">' +
        '<span style="flex:1;min-width:110px;">Alineación · ' + etiquetaCampo + '</span>' +
        '<select aria-label="Alineación de ' + etiquetaCampo + '" data-pub-align="' + nombre + '"' +
          ' style="padding:5px;border:1px solid #cbd5e1;border-radius:6px;">' +
          '<option value="left"' + (config.align === 'left' ? ' selected' : '') + '>Izquierda</option>' +
          '<option value="center"' + (config.align === 'center' ? ' selected' : '') + '>Centro</option>' +
          '<option value="right"' + (config.align === 'right' ? ' selected' : '') + '>Derecha</option>' +
        '</select>' +
      '</label>'
    );
    ['fijo', 'variable'].forEach(function(tipo) {
      if (!config[tipo]) return;
      var etiqueta = nombre === 'institucion' ? 'Institución' :
        nombre.charAt(0).toUpperCase() + nombre.slice(1);
      etiqueta += tipo === 'fijo' ? ' · texto fijo' : ' · variable';
      partes.push(
        '<label style="display:flex;align-items:center;gap:8px;padding:8px;border:1px solid #e2e8f0;border-radius:8px;font-size:12px;">' +
          '<span style="flex:1;min-width:110px;">' + etiqueta + '</span>' +
          '<input type="number" min="8" max="160" step="1" aria-label="Tamaño de ' + etiqueta + '"' +
            ' data-pub-font-size="' + nombre + ':' + tipo + '"' +
            ' value="' + config[tipo].fontSize + '" style="width:64px;padding:5px;border:1px solid #cbd5e1;border-radius:6px;">' +
          '<span>px</span>' +
          '<input type="color" aria-label="Color de ' + etiqueta + '"' +
            ' data-pub-color="' + nombre + ':' + tipo + '"' +
            ' value="' + config[tipo].color + '" style="width:34px;height:30px;border:0;padding:0;background:transparent;">' +
        '</label>'
      );
    });
  });
  return '<section style="margin-bottom:14px;"><h3 style="font-size:14px;font-weight:700;margin-bottom:8px;">Tamaño y color del texto</h3>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:8px;">' +
    partes.join('') + '</div></section>';
}

function _publicidadCerrarEditor() {
  var modal = document.getElementById('pub-editor-modal');
  if (modal) modal.remove();
}

function _publicidadCancelarEdicion() {
  if (window._publicidadEdicion && window._publicidadEdicionAntesDeEditar) {
    window._publicidadEdicion = window._publicidadEdicionAntesDeEditar;
    _publicidadAplicarVistaPrevia();
  }
  window._publicidadEdicionAntesDeEditar = null;
  _publicidadCerrarEditor();
}

function _publicidadRenderizarEditor() {
  var estado = window._publicidadEdicion;
  var etapa = document.getElementById('pub-editor-stage');
  var marco = document.getElementById('pub-editor-viewport');
  if (!estado || !etapa || !marco) return;
  if (!window._publicidadEdicionAntesDeEditar) {
    window._publicidadEdicionAntesDeEditar = JSON.parse(JSON.stringify(estado));
  }
  var escala = marco.clientWidth / _PUBLICIDAD_ANCHO;
  etapa.style.transform = 'scale(' + escala + ')';
  etapa.style.backgroundImage = 'url("' + estado.imagen + '")';
  var valores = {
    municipio: document.getElementById('pub-municipio').value,
    institucion: document.getElementById('pub-institucion').value,
    fecha: document.getElementById('pub-fecha').value,
    horario: document.getElementById('pub-horario').value
  };
  var etiquetas = {
    municipio: 'Municipio: ',
    institucion: 'Lugar: ',
    fecha: 'Fecha: ',
    horario: 'Horario: '
  };
  etapa.innerHTML = Object.keys(estado.campos).map(function(nombre) {
    var campo = estado.campos[nombre];
    var base = _PUBLICIDAD_CAMPOS[nombre];
    var clase = 'display:block;position:absolute;left:' + campo.left + 'px;top:' + campo.top + 'px;' +
      'width:' + campo.width + 'px;font-family:Poppins,Arial,sans-serif;font-size:' + campo.fontSize + 'px;' +
      'font-weight:' + base.weight + ';line-height:1.2;text-align:' + campo.align + ';' +
      'outline:2px dashed #0ea5e9;outline-offset:3px;cursor:move;touch-action:none;user-select:none;' +
      (nombre === 'municipio' ? 'white-space:nowrap;overflow:hidden;' :
        nombre === 'institucion' ? 'word-break:break-word;' : 'white-space:nowrap;');
    var texto = '';
    if (campo.texto.fijo) {
      texto += '<span data-pub-editor-texto="' + nombre + ':fijo" style="font-size:' +
        campo.texto.fijo.fontSize + 'px;color:' + campo.texto.fijo.color + ';font-weight:400;">' +
        _publicidadEscaparHtml(etiquetas[nombre]) + '</span>';
    }
    texto += '<span data-pub-editor-texto="' + nombre + ':variable" style="font-size:' +
      campo.texto.variable.fontSize + 'px;color:' + campo.texto.variable.color + ';">' +
      _publicidadEscaparHtml(valores[nombre]) + '</span>';
    return '<div data-pub-editor-campo="' + nombre + '" style="' + clase + '">' + texto + '</div>';
  }).join('');
  etapa.onpointerdown = _publicidadIniciarArrastre;
  etapa.onpointermove = _publicidadMoverCampo;
  etapa.onpointerup = _publicidadFinalizarArrastre;
  etapa.onpointercancel = _publicidadFinalizarArrastre;
}

function _publicidadIniciarArrastre(evento) {
  var elemento = evento.target.closest('[data-pub-editor-campo]');
  if (!elemento) return;
  evento.preventDefault();
  var nombre = elemento.getAttribute('data-pub-editor-campo');
  var campo = window._publicidadEdicion.campos[nombre];
  var marco = document.getElementById('pub-editor-viewport').getBoundingClientRect();
  var escala = marco.width / _PUBLICIDAD_ANCHO;
  window._publicidadArrastre = {
    nombre: nombre,
    pointerId: evento.pointerId,
    offsetX: (evento.clientX - marco.left) / escala - campo.left,
    offsetY: (evento.clientY - marco.top) / escala - campo.top
  };
  evento.currentTarget.setPointerCapture(evento.pointerId);
}

function _publicidadMoverCampo(evento) {
  var arrastre = window._publicidadArrastre;
  if (!arrastre || arrastre.pointerId !== evento.pointerId) return;
  var marco = document.getElementById('pub-editor-viewport').getBoundingClientRect();
  var escala = marco.width / _PUBLICIDAD_ANCHO;
  var campo = window._publicidadEdicion.campos[arrastre.nombre];
  campo.left = Math.max(0, Math.min(_PUBLICIDAD_ANCHO - campo.width,
    Math.round((evento.clientX - marco.left) / escala - arrastre.offsetX)));
  campo.top = Math.max(0, Math.min(_PUBLICIDAD_ALTO - 40,
    Math.round((evento.clientY - marco.top) / escala - arrastre.offsetY)));
  window._publicidadEdicion.modificado = true;
  window._pubHtmlGenerado = null;
  var elemento = document.querySelector('[data-pub-editor-campo="' + arrastre.nombre + '"]');
  if (elemento) {
    elemento.style.left = campo.left + 'px';
    elemento.style.top = campo.top + 'px';
  }
}

function _publicidadFinalizarArrastre(evento) {
  if (window._publicidadArrastre && window._publicidadArrastre.pointerId === evento.pointerId) {
    window._publicidadArrastre = null;
    _publicidadAplicarVistaPrevia();
  }
}

function _publicidadRestablecerPosiciones() {
  Object.keys(_PUBLICIDAD_CAMPOS).forEach(function(nombre) {
    var base = window._publicidadEdicion.baseCampos[nombre];
    var campo = window._publicidadEdicion.campos[nombre];
    campo.left = base.left;
    campo.top = base.top;
    campo.width = base.width;
    campo.fontSize = base.fontSize;
    campo.texto = JSON.parse(JSON.stringify(base.texto));
  });
  window._publicidadEdicion.modificado = true;
  window._pubHtmlGenerado = null;
  _publicidadRenderizarEditor();
  _publicidadAplicarVistaPrevia();
}

function _publicidadCargarImagenEditor(evento) {
  var archivo = evento.target.files && evento.target.files[0];
  if (!archivo) return;
  if (!archivo.type || archivo.type.indexOf('image/') !== 0) {
    _publicidadMostrarErrorEditor('Selecciona un archivo de imagen válido.');
    return;
  }
  if (archivo.size > 5 * 1024 * 1024) {
    _publicidadMostrarErrorEditor('La imagen debe pesar 5 MB o menos.');
    evento.target.value = '';
    return;
  }
  var lector = new FileReader();
  lector.onload = function() {
    window._publicidadEdicion.imagen = lector.result;
    window._publicidadEdicion.modificado = true;
    window._pubHtmlGenerado = null;
    _publicidadRenderizarEditor();
    _publicidadAplicarVistaPrevia();
  };
  lector.onerror = function() {
    _publicidadMostrarErrorEditor('No se pudo leer la imagen seleccionada.');
  };
  lector.readAsDataURL(archivo);
}

function _publicidadMostrarErrorEditor(mensaje) {
  var error = document.getElementById('pub-editor-error');
  if (error) {
    error.textContent = mensaje;
    error.style.display = 'block';
  }
}

function _publicidadActualizarCssPlantilla(html) {
  Object.keys(window._publicidadEdicion.campos).forEach(function(nombre) {
    var campo = window._publicidadEdicion.campos[nombre];
    var selector = _PUBLICIDAD_CAMPOS[nombre].selector;
    var propiedadesCampo = {
      left: campo.left + 'px',
      top: campo.top + 'px',
      width: campo.width + 'px',
      'font-size': campo.texto.variable.fontSize + 'px',
      'text-align': campo.align
    };
    if (nombre === 'institucion') propiedadesCampo.color = campo.texto.variable.color;
    html = _publicidadActualizarReglaCss(html, '.' + selector, propiedadesCampo);
    ['fijo', 'variable'].forEach(function(tipo) {
      var estilo = campo.texto[tipo];
      html = _publicidadActualizarReglaCss(
        html,
        '.' + selector + (tipo === 'fijo' ? ' .fijo' : ' .dinamico'),
        { 'font-size': estilo.fontSize + 'px', color: estilo.color }
      );
    });
  });
  var fondo = /(\.publicidad\s*\{[^}]*?background-image\s*:\s*url\()(["'][^"']+["'])(\))/;
  if (!fondo.test(html)) throw new Error('No se pudo actualizar la imagen de fondo de la plantilla.');
  return html.replace(fondo, '$1"' + window._publicidadEdicion.imagen + '"$3');
}

function _publicidadActualizarReglaCss(html, selector, propiedades) {
  var seguro = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  var regla = new RegExp('(^|})(\\s*)(' + seguro + ')(\\s*\\{)([^}]*)(\\})', 'm');
  if (!regla.test(html)) throw new Error('No se encontró el estilo ' + selector + ' en la plantilla.');
  return html.replace(regla, function(coincidencia, cierre, espacio, nombreRegla, apertura, cuerpo, fin) {
    Object.keys(propiedades).forEach(function(propiedad) {
      var seguroPropiedad = propiedad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var declaracion = new RegExp(
        '(^\\s*|;\\s*)(' + seguroPropiedad + '\\s*:\\s*)[^;\\r\\n]*(?:;+)',
        'm'
      );
      if (declaracion.test(cuerpo)) {
        cuerpo = cuerpo.replace(declaracion, function(_, separador, prefijo) {
          return separador + prefijo + propiedades[propiedad] + ';';
        });
      } else {
        cuerpo += '\n      ' + propiedad + ': ' + propiedades[propiedad] + ';';
      }
    });
    return cierre + espacio + nombreRegla + apertura + cuerpo + fin;
  });
}

function _publicidadDescargarPlantilla() {
  fetch('administracion/documentos/publicidad/publicidad.html?t=' + Date.now())
    .then(function(res) {
      if (!res.ok) throw new Error('No se pudo leer la plantilla original.');
      return res.text();
    })
    .then(function(html) {
      var actualizado = _publicidadActualizarCssPlantilla(html);
      var enlace = document.createElement('a');
      var url = URL.createObjectURL(new Blob([actualizado], { type: 'text/html;charset=utf-8' }));
      enlace.href = url;
      enlace.download = 'publicidad.html';
      enlace.click();
      setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
      _publicidadEdicion.plantilla = actualizado;
      _publicidadEdicion.baseCampos = JSON.parse(JSON.stringify(_publicidadEdicion.campos));
      window._pubHtmlGenerado = null;
      _publicidadAplicarVistaPrevia();
      window._publicidadEdicionAntesDeEditar = null;
      _publicidadCerrarEditor();
    })
    .catch(function(err) {
      _publicidadMostrarErrorEditor('No se pudo guardar la plantilla: ' + err.message);
    });
}

/** Actualiza la vista previa mientras el usuario escribe */
function _actualizarPreviewPublicidad() {
  var campos = [
    { inputId: 'pub-municipio',   prevId: 'prev-mun-val',   prefijo: '' },
    { inputId: 'pub-institucion', prevId: 'prev-institucion', prefijo: '' },
    { inputId: 'pub-fecha',       prevId: 'prev-fecha-val', prefijo: '' },
    { inputId: 'pub-horario',     prevId: 'prev-hor-val',   prefijo: '' }
  ];
  campos.forEach(function(c) {
    var input = document.getElementById(c.inputId);
    var prev  = document.getElementById(c.prevId);
    if (input && prev) {
      prev.textContent = input.value;
    }
  });
  if (document.getElementById('pub-editor-modal')) _publicidadRenderizarEditor();
}

/** Genera la publicidad en una ventana nueva lista para imprimir */
function _generarPublicidad() {
  var requeridos = ['pub-municipio', 'pub-institucion', 'pub-fecha'];
  for (var i = 0; i < requeridos.length; i++) {
    var el = document.getElementById(requeridos[i]);
    if (!el || !el.value.trim()) {
      if (el) {
        el.classList.add('border-red-400', 'ring-2', 'ring-red-100');
        el.focus();
        el.addEventListener('input', function() {
          this.classList.remove('border-red-400', 'ring-2', 'ring-red-100');
        }, { once: true });
      }
      return;
    }
  }

  var datos = {
    Municipio:   document.getElementById('pub-municipio').value.trim(),
    Institucion: document.getElementById('pub-institucion').value.trim(),
    Fecha:       document.getElementById('pub-fecha').value.trim(),
    Horario:     document.getElementById('pub-horario').value.trim()
  };

  var btn  = document.getElementById('pub-btn-generar');
  var texto = document.getElementById('pub-btn-texto');
  btn.disabled = true;
  texto.textContent = 'Cargando...';

  fetch('administracion/documentos/publicidad/publicidad.html?t=' + Date.now())
    .then(function(res) {
      if (!res.ok) throw new Error('No se pudo cargar la plantilla.');
      return res.text();
    })
    .then(function(html) {
      // Reemplazar marcadores {{Clave}} con los valores
      if (!window._publicidadEdicion || !window._publicidadEdicion.modificado) {
        window._publicidadEdicion = _publicidadLeerConfiguracion(html);
      }
      var doc = window._publicidadEdicion.modificado
        ? _publicidadActualizarCssPlantilla(html)
        : html;
      Object.keys(datos).forEach(function(clave) {
        var regex = new RegExp('\\{\\{' + clave + '\\}\\}', 'g');
        doc = doc.replace(regex, _publicidadEscaparHtml(datos[clave]));
      });
      doc = window.empresaBrand.preparePrintHtml(doc);
      doc = _agregarBotonDescargaDocumento(doc);

      // Guardar el HTML generado para el botón de imprimir
      window._pubHtmlGenerado = doc;

      // Mostrar en ventana nueva
      var ventana = window.open('', '_blank', 'width=1100,height=800,scrollbars=yes');
      ventana.document.write(doc);
      ventana.document.close();
      ventana.focus();

      btn.disabled = false;
      texto.textContent = 'Previsualizar';

      var errorEl = document.getElementById('pub-error');
      if (errorEl) errorEl.classList.add('hidden');
    })
    .catch(function(err) {
      btn.disabled = false;
      texto.textContent = 'Previsualizar';
      var errorEl = document.getElementById('pub-error');
      if (errorEl) {
        errorEl.textContent = 'Error al cargar la plantilla: ' + err.toString();
        errorEl.classList.remove('hidden');
      }
    });
}

/** Imprime directamente si ya se generó previamente */
function _imprimirPublicidad() {
  if (!window._pubHtmlGenerado) {
    _generarPublicidad();
    return;
  }
  var ventana = window.open('', '_blank', 'width=1100,height=800');
  ventana.document.write(window._pubHtmlGenerado);
  ventana.document.close();
  ventana.focus();
  setTimeout(function() { ventana.print(); }, 500);
}

/**
 * Descarga la publicidad como imagen JPG usando html2canvas.
 * Renderiza el HTML generado en un iframe oculto y captura el canvas.
 */
function _descargarPublicidad() {
  if (!window._pubHtmlGenerado) {
    _generarPublicidad();
    setTimeout(function() {
      if (window._pubHtmlGenerado) _descargarPublicidad();
    }, 1500);
    return;
  }

  var btn = document.getElementById('pub-btn-descargar');
  if (btn) { btn.disabled = true; btn.textContent = 'Generando...'; }

  // Crear iframe oculto para renderizar el HTML
  var iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:1055px;height:1491px;border:none;visibility:hidden;';
  document.body.appendChild(iframe);

  iframe.onload = function() {
    // Cargar html2canvas dinámicamente si no está disponible
    function capturar() {
      var target = iframe.contentDocument.querySelector('.publicidad') || iframe.contentDocument.body;
      html2canvas(target, {
        width:       1055,
        height:      1491,
        scale:       1,
        useCORS:     true,
        allowTaint:  true,
        logging:     false,
        x:           0,
        y:           0,        // ← ajusta este valor si los textos quedan desplazados en el JPG
        scrollX:     0,
        scrollY:     0,
        windowWidth: 1055,
        windowHeight: 1491
      }).then(function(canvas) {
        // Descargar como JPG
        var mun    = document.getElementById('pub-municipio');
        var nombre = 'Publicidad' + (mun && mun.value.trim() ? '-' + mun.value.trim() : '') + '.jpg';
        var link   = document.createElement('a');
        link.download = nombre;
        link.href     = canvas.toDataURL('image/jpeg', 0.96);
        link.click();

        document.body.removeChild(iframe);
        if (btn) { btn.disabled = false; btn.innerHTML = '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg> Descargar'; }
      }).catch(function(err) {
        console.error('[Publicidad] Error al generar imagen:', err);
        document.body.removeChild(iframe);
        if (btn) { btn.disabled = false; btn.textContent = 'Descargar'; }
        alert('No se pudo generar la imagen. Usa Imprimir → Guardar como PDF como alternativa.');
      });
    }

    if (typeof html2canvas === 'function') {
      capturar();
    } else {
      // Cargar html2canvas desde CDN
      var s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      s.onload  = capturar;
      s.onerror = function() {
        document.body.removeChild(iframe);
        if (btn) { btn.disabled = false; btn.textContent = 'Descargar'; }
        alert('No se pudo cargar html2canvas. Verifica tu conexión a internet.');
      };
      document.head.appendChild(s);
    }
  };

  iframe.srcdoc = window._pubHtmlGenerado.replace(
    '</head>',
    '<style>' +
    'body{margin:0!important;padding:0!important;display:block!important;min-height:0!important;}' +
    Object.keys(window._publicidadEdicion.campos).map(function(nombre) {
      var campo = window._publicidadEdicion.campos[nombre];
      var ajusteCanvas = nombre === 'municipio' ? 14 : 11;
      return '.' + _PUBLICIDAD_CAMPOS[nombre].selector + '{top:' +
        Math.max(0, campo.top - ajusteCanvas) + 'px!important;}';
    }).join('') +
    '</style></head>'
  );
}
