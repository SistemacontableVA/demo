<!-- ============================================================
     ADMINISTRACION.HTML — Shell del panel Administrativo
     Administración · Portal de Nómina · Óptica Visión de Águila
     ============================================================ -->

<div class="max-w-2xl lg:max-w-5xl mx-auto px-4 py-8 fade-in">

  <!-- Encabezado -->
  <div class="mb-8 text-center lg:text-left">
    <h1 class="text-verde-oscuro font-bold text-xl sm:text-2xl">Panel Administrativo</h1>
    <p class="text-slate-500 text-sm mt-1">Seleccione el módulo que desea gestionar.</p>
  </div>

  <!-- Tarjetas de módulos administrativos -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

    <!-- Módulo Documentos -->
    <button onclick="mostrarModulo('documentos')"
      class="bg-white rounded-md-plus shadow-card p-6 text-left hover:shadow-lg active:scale-95 transition-all duration-200 border border-transparent hover:border-petroleo/20">
      <div class="w-12 h-12 rounded-full bg-verde-suave flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-verde-oscuro" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 class="font-bold text-verde-oscuro text-base mb-1">Documentos</h3>
      <p class="text-slate-400 text-xs">Generación de solicitudes, permisos y convenios.</p>
    </button>

    <!-- Placeholder: módulo futuro -->
    <div class="bg-white rounded-md-plus shadow-soft p-6 text-left opacity-50 border border-dashed border-slate-200">
      <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <h3 class="font-bold text-slate-400 text-base mb-1">Próximamente</h3>
      <p class="text-slate-300 text-xs">Nuevo módulo en desarrollo.</p>
    </div>

  </div>
</div>
