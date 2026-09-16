<!-- ============================================================
     DOCUMENTOS.HTML — Vista principal del módulo Documentos
     Administración > Documentos · Óptica Visión de Águila

     Para agregar un nuevo tipo de documento:
       1. Agrega una tarjeta aquí con onclick="abrirDocumento('clave')"
       2. Crea el archivo views/clave.html
       3. Registra la ruta en MODULOS dentro de assets/js/app.js
     Solo esos 3 pasos. Nada más cambia.
     ============================================================ -->

<div class="max-w-2xl lg:max-w-5xl mx-auto px-4 py-8 fade-in">

  <!-- Encabezado con breadcrumb -->
  <div class="mb-2">
    <button onclick="mostrarModulo('administracion')"
      class="text-xs text-verde-oscuro hover:underline flex items-center gap-1 mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Panel Administrativo
    </button>
    <h1 class="text-verde-oscuro font-bold text-xl sm:text-2xl">Documentos</h1>
    <p class="text-slate-500 text-sm mt-1">Seleccione el tipo de documento que desea generar.</p>
  </div>

  <!-- Grid de tipos de documento -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">

    <!-- Solicitud Institucional -->
    <button onclick="abrirDocumento('solicitud-institucional')"
      class="bg-white rounded-md-plus shadow-card p-6 text-left hover:shadow-lg active:scale-95 transition-all duration-200 border border-transparent hover:border-petroleo/20">
      <div class="w-10 h-10 rounded-full bg-verde-suave flex items-center justify-center mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-verde-oscuro" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 21v-8H7v8M7 3v5h8" />
        </svg>
      </div>
      <h3 class="font-bold text-verde-oscuro text-sm mb-1">Solicitud Institucional</h3>
      <p class="text-slate-400 text-xs">Carta de presentación ante entidades.</p>
    </button>

    <!-- Permiso Policial -->
    <button onclick="abrirDocumento('permiso-policial')"
      class="bg-white rounded-md-plus shadow-card p-6 text-left hover:shadow-lg active:scale-95 transition-all duration-200 border border-transparent hover:border-petroleo/20">
      <div class="w-10 h-10 rounded-full bg-verde-suave flex items-center justify-center mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-verde-oscuro" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>
      <h3 class="font-bold text-verde-oscuro text-sm mb-1">Permiso Policial</h3>
      <p class="text-slate-400 text-xs">Solicitud de autorización a la Policía.</p>
    </button>

    <!-- Solicitud de Espacio -->
    <button onclick="abrirDocumento('solicitud-espacio')"
      class="bg-white rounded-md-plus shadow-card p-6 text-left hover:shadow-lg active:scale-95 transition-all duration-200 border border-transparent hover:border-petroleo/20">
      <div class="w-10 h-10 rounded-full bg-verde-suave flex items-center justify-center mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-verde-oscuro" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <h3 class="font-bold text-verde-oscuro text-sm mb-1">Solicitud de Espacio</h3>
      <p class="text-slate-400 text-xs">Petición de lugar para brigada.</p>
    </button>

    <!-- Hoja de Convenio -->
    <button onclick="abrirDocumento('hoja-convenio')"
      class="bg-white rounded-md-plus shadow-card p-6 text-left hover:shadow-lg active:scale-95 transition-all duration-200 border border-transparent hover:border-petroleo/20">
      <div class="w-10 h-10 rounded-full bg-verde-suave flex items-center justify-center mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-verde-oscuro" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      </div>
      <h3 class="font-bold text-verde-oscuro text-sm mb-1">Hoja de Convenio</h3>
      <p class="text-slate-400 text-xs">Acuerdo de colaboración con entidad.</p>
    </button>

    <!-- Hoja de Convenio Personalizable -->
    <button onclick="abrirDocumento('hoja-convenio-personalizable')"
      class="bg-white rounded-md-plus shadow-card p-6 text-left hover:shadow-lg active:scale-95 transition-all duration-200 border border-transparent hover:border-petroleo/20">
      <div class="w-10 h-10 rounded-full bg-verde-suave flex items-center justify-center mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-verde-oscuro" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </div>
      <h3 class="font-bold text-verde-oscuro text-sm mb-1">Convenio Personalizable</h3>
      <p class="text-slate-400 text-xs">Descarga la hoja editable de convenio.</p>
    </button>

  </div>
</div>
