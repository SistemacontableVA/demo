<!-- ============================================================
     COORDINADOR.HTML — Vista del perfil Coordinador de Campo
     Coordinador · Portal de Nómina · Óptica Angelus Visión
     ============================================================ -->

<div class="min-h-[70vh] flex items-center justify-center px-4 fade-in">
  <div class="w-full max-w-2xl">
    <div class="text-center mb-8">
      <div class="w-16 h-16 mx-auto rounded-full bg-verde-suave flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-verde-oscuro" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7h18M5 7v13h14V7M8 4h8l2 3H6l2-3zm1 8h6m-6 4h6" />
        </svg>
      </div>
      <h2 class="text-verde-oscuro font-bold text-xl mb-2">Coordinador de Campo</h2>
      <p class="text-slate-500 text-sm">Selecciona una herramienta para iniciar la jornada.</p>
    </div>

    <button type="button" onclick="mostrarModulo('contabilidadDiaria')" class="w-full text-left bg-white border border-slate-200 rounded-xl shadow-card p-5 hover:border-verde-oscuro/40 transition-colors">
      <span class="flex items-start gap-4">
        <span class="w-11 h-11 rounded-xl bg-verde-suave text-verde-oscuro flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 4h16v16H4zM8 8h8M8 12h8M8 16h5" />
          </svg>
        </span>
        <span>
          <strong class="block text-verde-oscuro font-bold">Contabilidad Diaria</strong>
          <span class="block text-slate-500 text-sm mt-1">Recepción de afiliaciones, control operativo y reporte diario en PDF.</span>
        </span>
      </span>
    </button>

    <button onclick="ingresarAsesor()" class="block mx-auto mt-6 text-sm text-verde-oscuro underline">← Volver al inicio</button>
  </div>
</div>
