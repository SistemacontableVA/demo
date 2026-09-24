function renderConfiguracion() {
  var contenedor = document.getElementById('admin-content');
  if (!contenedor) return;

  // Leer datos de licencia desde localStorage
  var licToken  = localStorage.getItem('ks_lic_token');
  var licExpira = parseInt(localStorage.getItem('ks_lic_expira') || '0');
  var config    = ConfiguracionService.obtener();

  var ahora       = new Date().getTime();
  var licActiva   = !!(licToken && ahora < licExpira);
  var fechaExpira = licExpira ? _formatearFecha(new Date(licExpira)) : '—';

  // Calcular días restantes (solo matemática, sin validación)
  var diasRestantes = 0;
  if (licExpira > ahora) {
    diasRestantes = Math.ceil((licExpira - ahora) / (1000 * 60 * 60 * 24));
  }

  // Texto y color según días restantes
  var diasTexto, diasColor;
  if (!licActiva) {
    diasTexto = 'Licencia vencida';
    diasColor = 'text-red-600 bg-red-50 border-red-200';
  } else if (diasRestantes <= 5) {
    diasTexto = '⚠ Vence en ' + diasRestantes + (diasRestantes === 1 ? ' día' : ' días');
    diasColor = 'text-amber-700 bg-amber-50 border-amber-200';
  } else {
    diasTexto = diasRestantes + ' días disponibles';
    diasColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  }

  // Nombre del cliente desde localStorage o config
  var nombreEmpresa = localStorage.getItem('ks_lic_cliente') || config.empresa || 'la empresa';

  // Mensaje prearmado para WhatsApp
  var mensaje = 'Buenas tardes, deseo extender la licencia del sistema administrativo para óptica, para la empresa ' + nombreEmpresa + '.';
  var waUrl   = 'https://wa.me/573027350587?text=' + encodeURIComponent(mensaje);

  // Badge de estado
  var estadoBadge = licActiva
    ? '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">' +
        '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Activa' +
      '</span>'
    : '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold">' +
        '<span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>Inactiva' +
      '</span>';

  contenedor.innerHTML =
    '<div class="fade-in">' +
      '<div class="mb-6">' +
        '<h3 class="text-verde-oscuro font-bold text-lg">Configuración</h3>' +
        '<p class="text-slate-400 text-sm mt-0.5">Parámetros generales del sistema</p>' +
      '</div>' +

      // ── Tarjeta del sistema ──
      '<div class="bg-white rounded-xl shadow-soft p-6 max-w-lg mb-4">' +
        '<h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Sistema</h4>' +
        '<div class="space-y-4">' +
          _configField('Nombre del sistema', config.nombreSistema, true) +
          _configField('Empresa',            config.empresa,       true) +
          _configField('Versión',            config.version,       true) +
        '</div>' +
      '</div>' +

      // ── Tarjeta de licencia ──
      '<div class="bg-white rounded-xl shadow-soft p-6 max-w-lg">' +
        '<div class="flex items-center justify-between mb-4">' +
          '<h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Licencia</h4>' +
          estadoBadge +
        '</div>' +
        '<div class="space-y-4">' +
          _configField('Estado',   licActiva ? 'Sistema activo' : 'Sin licencia activa', licActiva) +
          _configField('Vence el', fechaExpira, licActiva) +
        '</div>' +

        // Días restantes
        '<div class="mt-4 px-4 py-3 rounded-xl border text-sm font-semibold ' + diasColor + '">' +
          diasTexto +
        '</div>' +

        // Botón extender licencia → WhatsApp
        '<div class="mt-5 pt-4 border-t border-slate-100">' +
          '<a href="' + waUrl + '" target="_blank"' +
            ' class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] active:scale-95 transition-all text-white font-semibold text-sm">' +
            '<svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">' +
              '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>' +
              '<path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.962-1.418A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.946 7.946 0 01-4.33-1.284l-.31-.184-3.22.92.95-3.14-.202-.322A7.944 7.944 0 014 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8z"/>' +
            '</svg>' +
            'Extender licencia' +
          '</a>' +
        '</div>' +
      '</div>' +
    '</div>';
}

/* ── Helpers ──────────────────────────────────────────────── */

function _configField(label, valor, activo) {
  return '<div>' +
    '<label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">' + label + '</label>' +
    '<div class="px-3 py-2.5 rounded-lg text-sm ' +
      (activo
        ? 'bg-slate-50 text-slate-700 font-medium truncate'
        : 'bg-slate-50 text-slate-400 italic') + '">' +
      valor +
    '</div>' +
  '</div>';
}

function _formatearFecha(fecha) {
  if (!(fecha instanceof Date) || isNaN(fecha)) return '—';
  var d  = ('0' + fecha.getDate()).slice(-2);
  var m  = ('0' + (fecha.getMonth() + 1)).slice(-2);
  var y  = fecha.getFullYear();
  var hh = ('0' + fecha.getHours()).slice(-2);
  var mm = ('0' + fecha.getMinutes()).slice(-2);
  return d + '/' + m + '/' + y + ' ' + hh + ':' + mm;
}
