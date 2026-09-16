/* ============================================================
   NOMINA-FILTROS.JS — Lógica de filtros del panel Nómina
   Promotores · Portal de Nómina · Óptica Visión de Águila
   ============================================================ */

/**
 * Aplica un filtro a la tabla de movimientos y actualiza el estado visual
 * de los botones de filtro. Paleta V6.
 * @param {string} tipo - 'todos' | 'prestamo' | 'descuento' | 'aff'
 */
function filtrar(tipo) {
  filtroActivo = tipo;

  document.querySelectorAll('.filtro-btn').forEach(function(btn) {
    var activo = btn.dataset.filtro === tipo;
    btn.classList.toggle('bg-verde-medio',   activo);
    btn.classList.toggle('text-white',       activo);
    btn.classList.toggle('bg-white',         !activo);
    btn.classList.toggle('text-gris-medio',  !activo);
    btn.classList.toggle('border',           !activo);
    btn.classList.toggle('border-slate-200', !activo);
    btn.querySelectorAll('span').forEach(function(sp) {
      if (sp.classList.contains('uppercase')) {
        sp.classList.toggle('opacity-80',    activo);
        sp.classList.toggle('text-gris-medio', !activo);
      }
    });
  });

  renderTabla();
}
