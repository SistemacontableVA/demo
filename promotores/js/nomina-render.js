/* ============================================================
   NOMINA-RENDER.JS — Funciones de renderizado del módulo Nómina
   Promotores · Portal de Nómina · Óptica Visión de Águila
   ============================================================ */

/**
 * Renderiza la tabla principal de movimientos diarios.
 * Aplica el filtro activo antes de construir el HTML. Paleta V6.
 */
function renderTabla() {
  var filas = logDiarioActual;
  if (filtroActivo === 'aff')       filas = filas.filter(function(r) { return Number(r.aff) > 0; });
  if (filtroActivo === 'prestamo')  filas = filas.filter(function(r) { return Number(r.prestamo) > 0; });
  if (filtroActivo === 'descuento') filas = filas.filter(function(r) { return Number(r.descuento) > 0; });

  document.getElementById('conteo-filtro').innerText =
    filas.length + (filas.length === 1 ? ' registro' : ' registros');

  var html = '';
  filas.forEach(function(row, i) {
    var tienePrestamo  = Number(row.prestamo)  > 0;
    var tieneDescuento = Number(row.descuento) > 0;
    var coordinador    = row.coordinador || '—';
    var brig = (row.brig !== undefined && row.brig !== null && row.brig !== '') ? row.brig : '—';

    html += '<tr class="border-b border-slate-100 last:border-0 ' +
      (i % 2 === 0 ? 'bg-white' : 'bg-gris-claro-60') +
      ' fila-hover transition-colors">' +
      '<td class="px-3 py-1.5 font-semibold text-gris-oscuro whitespace-nowrap">' + (row.fecha || '') + '</td>' +
      '<td class="px-3 py-1.5 text-gris-medio whitespace-nowrap">' + (row.municipio || '') + '</td>' +
      '<td class="px-3 py-1.5 text-gris-medio whitespace-nowrap">' + coordinador + '</td>' +
      '<td class="px-3 py-1.5 text-center whitespace-nowrap">' +
        (Number(row.aff) > 0
          ? '<span class="bg-verde-suave text-verde-oscuro text-[11px] font-semibold px-2 py-1 rounded-full">' + row.aff + '</span>'
          : '<span class="text-slate-400">0</span>') +
      '</td>' +
      '<td class="px-3 py-1.5 text-center text-gris-medio whitespace-nowrap">' + brig + '</td>' +
      '<td class="px-3 py-1.5 text-right text-gris-oscuro whitespace-nowrap">$' + fmt(row.comida) + '</td>' +
      '<td class="px-3 py-1.5 text-right font-semibold whitespace-nowrap ' + (tienePrestamo ? 'text-rojo' : 'text-slate-400') + '">$' + fmt(row.prestamo) + '</td>' +
      '<td class="px-3 py-1.5 text-right font-semibold whitespace-nowrap ' + (tieneDescuento ? 'text-rojo' : 'text-slate-400') + '">$' + fmt(row.descuento) + '</td>' +
      '<td class="px-3 py-1.5 text-gris-medio whitespace-normal break-words">' + (row.detalle || '') + '</td>' +
      '</tr>';
  });

  document.getElementById('res-tabla').innerHTML = html ||
    '<tr><td colspan="9" class="text-center text-slate-400 text-sm py-8">No hay movimientos que coincidan con este filtro.</td></tr>';
}

/**
 * Stub — los valores de deducciones se asignan directamente en consultar().
 */
function renderDeducciones() {
  // Sin operación — valores ya asignados desde resumen en consultar()
}

/**
 * Renderiza la tabla y el KPI de brigadas trabajadas. Paleta V6.
 */
function renderBrigadas() {
  var filas = logDiarioActual.filter(function(r) { return Number(r.brig) > 0; });
  document.getElementById('res-total-brigadas').innerText = filas.length;

  var html = '';
  filas.forEach(function(r) {
    html +=
      '<tr class="border-b border-slate-100 last:border-0 fila-hover transition-colors">' +
      '<td class="px-3 py-2 font-semibold text-gris-oscuro whitespace-nowrap">' + (r.fecha || '') + '</td>' +
      '<td class="px-3 py-2 text-gris-medio whitespace-nowrap">' + (r.municipio || '') + '</td>' +
      '<td class="px-3 py-2 text-gris-medio whitespace-nowrap">' + (r.coordinador || '—') + '</td>' +
      '<td class="px-3 py-2 text-center font-semibold text-verde-oscuro">' + r.brig + '</td>' +
      '<td class="px-3 py-2 text-center">' +
        '<span class="bg-verde-suave text-verde-oscuro px-3 py-1 rounded-full font-semibold text-[11px] uppercase">Completada</span>' +
      '</td>' +
      '</tr>';
  });

  document.getElementById('res-tabla-brigadas').innerHTML = html ||
    '<tr><td colspan="5" class="text-center text-slate-400 text-sm py-8">No se registran brigadas en este periodo.</td></tr>';
}

/**
 * Renderiza la tabla y el KPI de venta de lentes. Paleta V6.
 * @param {Object} data - Respuesta completa del API
 */
function renderLentes(data) {
  var detalle = data.lentesDetalle || [];
  var totalLentesCalculado = 0;
  var wrap = document.getElementById('lentes-tabla-wrap');

  if (detalle.length) {
    var html = '';
    detalle.forEach(function(l) {
      var venta = Number(l.totalVenta) || 0;
      totalLentesCalculado += venta;

      html +=
        '<tr class="border-b border-slate-100 last:border-0 fila-hover transition-colors">' +
        '<td class="px-3 py-2 font-semibold text-gris-oscuro whitespace-nowrap">' + (l.fecha || '') + '</td>' +
        '<td class="px-3 py-2 text-gris-medio whitespace-nowrap">' + (l.municipio || '') + '</td>' +
        '<td class="px-3 py-2 text-center font-semibold text-gris-medio">' + (l.cProm !== undefined ? l.cProm : '') + '</td>' +
        '<td class="px-3 py-2 text-center font-semibold text-gris-medio">' + (l.asist !== undefined ? l.asist : '') + '</td>' +
        '<td class="px-3 py-2 text-center font-semibold text-verde-oscuro">' + (l.lenteEspecial || 0) + '</td>' +
        '<td class="px-3 py-2 text-center font-semibold text-verde-oscuro">' + (l.lenteSencillo || 0) + '</td>' +
        '<td class="px-3 py-2 text-right font-semibold text-verde-oscuro">' + fmt(venta) + '</td>' +
        '</tr>';
    });
    document.getElementById('res-tabla-lentes').innerHTML = html;
    wrap.classList.remove('hidden');
  } else {
    wrap.classList.add('hidden');
  }

  document.getElementById('res-lent-detalle').innerText = totalLentesCalculado;
}
