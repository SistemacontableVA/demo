<!-- ============================================================
     SOLICITUD-INSTITUCIONAL.HTML
     Administración > Documentos > Solicitud Institucional
     ============================================================ -->

<div class="max-w-2xl mx-auto px-4 py-8 fade-in">

  <!-- Breadcrumb -->
  <button onclick="mostrarModulo('documentos')"
    class="text-xs text-verde-oscuro hover:underline flex items-center gap-1 mb-6">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
    </svg>
    Documentos
  </button>

  <h1 class="text-verde-oscuro font-bold text-xl mb-1">Solicitud Institucional</h1>
  <p class="text-slate-500 text-sm mb-6">Complete los campos para generar el documento.</p>

  <!-- Formulario -->
  <div class="bg-white rounded-md-plus shadow-card p-6">
    <form id="form-solicitud-institucional" onsubmit="enviarDocumento(event, 'solicitud-institucional')">

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-[11px] uppercase text-slate-400 font-semibold mb-1">Entidad destinataria</label>
          <input type="text" name="entidad" required placeholder="Nombre de la entidad"
            class="w-full px-4 py-2.5 rounded-[12px] border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-azul/40">
        </div>
        <div>
          <label class="block text-[11px] uppercase text-slate-400 font-semibold mb-1">Municipio</label>
          <input type="text" name="municipio" required placeholder="Ciudad o municipio"
            class="w-full px-4 py-2.5 rounded-[12px] border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-azul/40">
        </div>
        <div>
          <label class="block text-[11px] uppercase text-slate-400 font-semibold mb-1">Fecha de brigada</label>
          <input type="date" name="fechaBrigada" required
            class="w-full px-4 py-2.5 rounded-[12px] border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-azul/40">
        </div>
        <div>
          <label class="block text-[11px] uppercase text-slate-400 font-semibold mb-1">Responsable</label>
          <input type="text" name="responsable" required placeholder="Nombre del responsable"
            class="w-full px-4 py-2.5 rounded-[12px] border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-azul/40">
        </div>
      </div>

      <div class="mb-6">
        <label class="block text-[11px] uppercase text-slate-400 font-semibold mb-1">Observaciones</label>
        <textarea name="observaciones" rows="3" placeholder="Información adicional (opcional)"
          class="w-full px-4 py-2.5 rounded-[12px] border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-azul/40 resize-none"></textarea>
      </div>

      <!-- Mensaje de estado -->
      <div id="doc-msg-solicitud-institucional" class="hidden mb-4 text-sm text-center font-medium rounded-lg px-4 py-2"></div>

      <button type="submit" id="btn-generar-solicitud-institucional"
        class="w-full btn-primario hover:bg-verde-oscuro active:scale-95 transition-all text-white font-semibold text-sm px-6 py-3 rounded-md-plus flex items-center justify-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Generar Documento
      </button>
    </form>
  </div>
</div>
