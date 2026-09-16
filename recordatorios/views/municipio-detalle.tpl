<!-- ============================================================
     MUNICIPIO-DETALLE.TPL — Vista de datos de un municipio
     Módulo Recordatorios · Óptica Visión de Águila
     ============================================================ -->

<div class="mt-6 fade-in" id="rec-detalle-contenedor">

  <!-- Header del municipio -->
  <div class="bg-white rounded-md-plus shadow-card p-5 mb-4">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-verde-suave flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-verde-oscuro" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
        <div>
          <h2 class="font-bold text-verde-oscuro text-base" id="rec-det-nombre">—</h2>
          <p class="text-slate-400 text-xs" id="rec-det-fecha">—</p>
        </div>
      </div>
      <button onclick="recordatoriosCerrarDetalle()"
        class="text-xs text-slate-400 hover:text-verde-oscuro font-medium flex items-center gap-1 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
        Cerrar
      </button>
    </div>

    <!-- KPIs de la hoja -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4" id="rec-det-kpis">
      <!-- Generados por JS -->
    </div>
  </div>

  <!-- Pestañas: Consulta / Entrega -->
  <div class="bg-white rounded-md-plus shadow-card overflow-hidden">
    <div class="flex border-b border-slate-100">
      <button id="rec-tab-consulta"
        onclick="recordatoriosCambiarTab('consulta')"
        class="flex-1 px-4 py-3 text-sm font-semibold text-verde-oscuro border-b-2 border-verde-oscuro transition-all">
        📋 Recordatorio Consulta
      </button>
      <button id="rec-tab-entrega"
        onclick="recordatoriosCambiarTab('entrega')"
        class="flex-1 px-4 py-3 text-sm font-semibold text-slate-400 border-b-2 border-transparent hover:text-verde-oscuro transition-all">
        📦 Recordatorio Entrega
      </button>
    </div>

    <!-- Spinner de carga -->
    <div id="rec-det-spinner" class="flex items-center justify-center py-12">
      <div class="spinner"></div>
    </div>

    <!-- Error de carga -->
    <div id="rec-det-error" class="hidden px-6 py-8 text-center">
      <div class="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
      </div>
      <p class="text-slate-500 text-sm font-medium" id="rec-det-error-msg">No se pudieron cargar los datos.</p>
      <button onclick="recordatoriosCargarDatosMunicipio()" class="mt-3 text-xs text-verde-oscuro font-semibold hover:underline">
        Reintentar
      </button>
    </div>

    <!-- Contenido de la tabla -->
    <div id="rec-det-contenido" class="hidden">

      <!-- Metadata de la hoja -->
      <div class="px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs text-slate-500 grid grid-cols-2 sm:grid-cols-3 gap-2" id="rec-det-meta">
        <!-- Generado por JS -->
      </div>

      <!-- Tabla de pacientes -->
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead>
            <tr class="bg-slate-50 text-[10px] uppercase text-slate-400 font-semibold tracking-wide" id="rec-det-thead">
              <!-- Generado por JS según pestaña activa -->
            </tr>
          </thead>
          <tbody id="rec-det-tbody" class="divide-y divide-slate-100">
            <!-- Generado por JS -->
          </tbody>
        </table>
      </div>

      <!-- Sin resultados -->
      <div id="rec-det-sin-resultados" class="hidden px-6 py-8 text-center text-slate-400 text-sm">
        No hay pacientes que cumplan los criterios para este recordatorio.
      </div>

    </div>
  </div>

</div>
