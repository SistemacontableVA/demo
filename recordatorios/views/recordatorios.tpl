<div class="max-w-5xl mx-auto px-4 py-8 fade-in">

  <!-- Encabezado -->
  <div class="mb-6">
    <button onclick="mostrarModulo('administracion')"
      class="text-xs text-verde-oscuro hover:underline flex items-center gap-1 mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
      </svg>
      Panel Administrativo
    </button>

    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-verde-oscuro font-bold text-xl sm:text-2xl flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-verde-oscuro" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          Recordatorios WhatsApp
        </h1>
        <p class="text-slate-500 text-sm mt-1">Gestiona los municipios y genera recordatorios para pacientes.</p>
      </div>

      <button onclick="recordatoriosAbrirModalAgregar()"
        class="btn-primario flex items-center gap-2 px-4 py-2.5 rounded-md-plus text-white text-sm font-semibold hover:bg-verde-oscuro active:scale-95 transition-all">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
        Agregar Municipio
      </button>
    </div>
  </div>

  <!-- Estado vacío -->
  <div id="rec-estado-vacio" class="hidden">
    <div class="bg-white rounded-md-plus shadow-card p-10 text-center">
      <div class="w-14 h-14 rounded-full bg-verde-suave flex items-center justify-center mx-auto mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-verde-oscuro" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
      </div>
      <h3 class="font-bold text-verde-oscuro text-base mb-1">Sin municipios registrados</h3>
      <p class="text-slate-400 text-sm mb-4">Agrega el primer municipio con su hoja de cálculo para comenzar.</p>
      <button onclick="recordatoriosAbrirModalAgregar()"
        class="btn-primario px-5 py-2 rounded-md-plus text-white text-sm font-semibold hover:bg-verde-oscuro transition-all">
        Agregar Municipio
      </button>
    </div>
  </div>

  <!-- Tabla de municipios -->
  <div id="rec-tabla-wrap">
    <div class="bg-white rounded-md-plus shadow-card overflow-hidden">
      <div class="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <span class="text-sm font-semibold text-verde-oscuro">Municipios registrados</span>
        <span id="rec-contador" class="text-xs text-slate-400 font-medium">0 municipios</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-slate-50 text-[11px] uppercase text-slate-400 font-semibold tracking-wide">
              <th class="text-left px-5 py-3">Municipio</th>
              <th class="text-left px-5 py-3">Fecha de Atención</th>
              <th class="text-left px-5 py-3">ID Hoja</th>
              <th class="text-left px-5 py-3">Estado</th>
              <th class="text-right px-5 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody id="rec-tabla-body" class="divide-y divide-slate-100">
            <!-- Filas generadas por JS -->
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Spinner de carga de datos del municipio -->
  <div id="rec-panel-datos" class="hidden mt-6">
    <!-- Contenido dinámico del municipio seleccionado -->
  </div>

</div>

<!-- ══ MODAL: Agregar Municipio ══ -->
<div id="rec-modal-overlay"
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm hidden"
  onclick="recordatoriosCerrarModal(event)">

  <div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 animate-fade-in" onclick="event.stopPropagation()">

    <div class="flex items-center justify-between mb-5">
      <h2 class="font-bold text-verde-oscuro text-base">Agregar Municipio</h2>
      <button onclick="recordatoriosCerrarModal()"
        class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <form id="rec-form-municipio" onsubmit="recordatoriosGuardarMunicipio(event)" novalidate>

      <!-- Nombre del Municipio -->
      <div class="mb-4">
        <label class="block text-[11px] uppercase text-slate-400 font-semibold mb-1.5">
          Nombre / Identificador del Municipio <span class="text-red-400">*</span>
        </label>
        <input
          type="text"
          id="rec-input-municipio"
          name="municipio"
          required
          placeholder="Ej: Maracaibo, San Francisco..."
          class="w-full px-4 py-2.5 rounded-[12px] border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-verde-oscuro/30 focus:border-verde-oscuro transition-all">
      </div>

      <!-- Fecha de Atención -->
      <div class="mb-4">
        <label class="block text-[11px] uppercase text-slate-400 font-semibold mb-1.5">
          Fecha de Atención <span class="text-red-400">*</span>
        </label>
        <input
          type="date"
          id="rec-input-fecha"
          name="fechaAtencion"
          required
          class="w-full px-4 py-2.5 rounded-[12px] border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-verde-oscuro/30 focus:border-verde-oscuro transition-all">
      </div>

      <!-- ID de la Hoja de Cálculo -->
      <div class="mb-5">
        <label class="block text-[11px] uppercase text-slate-400 font-semibold mb-1.5">
          ID de la Hoja de Cálculo (Spreadsheet ID) <span class="text-red-400">*</span>
        </label>
        <input
          type="text"
          id="rec-input-spreadsheetid"
          name="spreadsheetId"
          required
          placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
          class="w-full px-4 py-2.5 rounded-[12px] border border-slate-200 text-sm font-mono outline-none focus:ring-2 focus:ring-verde-oscuro/30 focus:border-verde-oscuro transition-all">
        <p class="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
          El ID se encuentra en la URL de Google Sheets:<br>
          <span class="font-mono text-slate-500">docs.google.com/spreadsheets/d/<strong class="text-verde-oscuro">ID_AQUI</strong>/edit</span>
        </p>
      </div>

      <!-- Mensaje de error -->
      <div id="rec-modal-error" class="hidden mb-4 text-sm text-center font-medium rounded-lg px-4 py-2 bg-red-50 text-red-600"></div>

      <!-- Botones -->
      <div class="flex gap-3">
        <button type="button" onclick="recordatoriosCerrarModal()"
          class="flex-1 px-4 py-2.5 rounded-md-plus border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50 transition-all">
          Cancelar
        </button>
        <button type="submit" id="rec-btn-guardar"
          class="flex-1 btn-primario px-4 py-2.5 rounded-md-plus text-white text-sm font-semibold hover:bg-verde-oscuro active:scale-95 transition-all flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
          Guardar
        </button>
      </div>

    </form>
  </div>
</div>
