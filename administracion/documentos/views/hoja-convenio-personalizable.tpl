<!-- ============================================================
     HOJA-CONVENIO-PERSONALIZABLE.TPL
     Administración > Documentos > Convenio Personalizable
     ============================================================ -->

<div class="max-w-2xl mx-auto px-4 py-8 fade-in">

  <button onclick="mostrarModulo('documentos')"
    class="text-xs text-verde-oscuro hover:underline flex items-center gap-1 mb-6">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
    </svg>
    Documentos
  </button>

  <h1 class="text-verde-oscuro font-bold text-xl mb-1">Convenio Personalizable</h1>
  <p class="text-slate-500 text-sm mb-6">Descarga la hoja de convenio editable para completarla manualmente.</p>

  <div class="bg-white rounded-md-plus shadow-card p-6">

    <!-- Previsualización / descripción -->
    <div class="flex items-start gap-4 mb-6">
      <div class="w-12 h-12 rounded-full bg-verde-suave flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-verde-oscuro" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </div>
      <div>
        <h2 class="font-bold text-verde-oscuro text-sm mb-1">Hoja de Convenio — Versión Editable</h2>
        <p class="text-slate-500 text-xs leading-relaxed">
          Este documento contiene la plantilla oficial de convenio con los espacios para completar a mano o en pantalla.
          Ábrelo directamente en el navegador para imprimirlo o descárgalo para editarlo.
        </p>
      </div>
    </div>

    <!-- Botones de acción -->
    <div class="flex flex-col sm:flex-row gap-3">

      <a href="administracion/documentos/templates/hoja-convenio-personalizable.html"
        target="_blank"
        class="flex-1 btn-primario hover:bg-verde-oscuro active:scale-95 transition-all text-white font-semibold text-sm px-6 py-3 rounded-md-plus flex items-center justify-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        Abrir documento
      </a>

      <a href="administracion/documentos/templates/hoja-convenio-personalizable.html"
        download="hoja-convenio-personalizable.html"
        class="flex-1 border border-verde-oscuro text-verde-oscuro hover:bg-verde-suave active:scale-95 transition-all font-semibold text-sm px-6 py-3 rounded-md-plus flex items-center justify-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Descargar
      </a>

    </div>

  </div>
</div>
