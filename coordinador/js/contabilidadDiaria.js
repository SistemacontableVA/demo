function renderContabilidadDiaria() {
  var contenedor = document.getElementById('admin-content');
  if (!contenedor) return;

  fetch('coordinador/views/contabilidadDiaria.tpl?t=' + Date.now(), { cache: 'no-store' })
    .then(function (respuesta) {
      if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
      return respuesta.text();
    })
    .then(function (html) {
      contenedor.innerHTML = html;
      if (window.empresaBrand && typeof window.empresaBrand.applyBrand === 'function') {
        window.empresaBrand.applyBrand();
      }
    })
    .catch(function (error) {
      console.error('[ContabilidadDiaria] Error cargando la vista:', error);
      contenedor.innerHTML = '<div class="p-6 text-sm text-red-700">No se pudo cargar Contabilidad Diaria.</div>';
    });
}
