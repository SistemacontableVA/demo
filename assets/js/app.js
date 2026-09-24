// ═══════════════════════════════════════════════════════════════
// FASE 3: Helper global para construir URLs de API
// ═══════════════════════════════════════════════════════════════
/**
 * Construye URL completa de API de forma centralizada.
 * Prioridad:
 *   1. Si ApiConfig existe → usa ApiConfig.buildUrl()
 *   2. Si no existe → fallback manual con window.API_URL
 * 
 * @param {string} apiName - Nombre de la API ('nomina', 'oficina')
 * @param {object} params - Parámetros a enviar { cedula, fecha, etc }
 * @returns {string} URL completa lista para fetch()
 * 
 * @example
 * // Con ApiConfig disponible
 * construirUrlApi('nomina', { cedula: 'V-123' })
 * // → "https://script.google.com/.../exec?cedula=V-123"
 * 
 * // Sin ApiConfig (fallback)
 * construirUrlApi('nomina', { cedula: 'V-123' })
 * // → mismo resultado, pero usando window.API_URL
 */
function construirUrlApi(apiName, params) {
  params = params || {};
  
  // Intentar usar ApiConfig si está disponible
  if (typeof window.ApiConfig !== 'undefined' && window.ApiConfig.buildUrl) {
    try {
      return window.ApiConfig.buildUrl(apiName, params);
    } catch (err) {
      console.warn('[construirUrlApi] Error usando ApiConfig:', err.message);
      // Continuar con fallback
    }
  }
  
  // Fallback: construir URL manualmente (deprecated, pero seguro)
  var baseUrl = window.API_URL || '';
  if (!baseUrl) {
    console.error('[construirUrlApi] No hay URL base disponible. Carga api-config.js o define window.API_URL');
    return '';
  }
  
  // Construir query string
  var qs = Object.keys(params)
    .filter(function(k) { return params[k] !== undefined && params[k] !== null && params[k] !== ''; })
    .map(function(k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); })
    .join('&');
  
  return baseUrl + (qs ? '?' + qs : '');
}

// Exponer globalmente para que servicios la usen
window.construirUrlApi = construirUrlApi;

var MODULOS = {
  'nomina': {
    html: 'promotores/views/nomina.tpl',
    scripts: [
      'assets/js/utils.js',
      'promotores/js/nomina-render.js',
      'promotores/js/nomina-filtros.js',
      'promotores/js/nomina.js'
    ]
  },
  'coordinador': {
    html: 'coordinador/views/coordinador.tpl',
    scripts: [
      'coordinador/js/coordinador.js'
    ]
  },
  'contabilidadDiaria': {
    html: 'coordinador/views/contabilidadDiaria.tpl',
    scripts: []
  },
  // ── Módulo Administración ─────────────────────────────────
  // Punto de entrada: pantalla de acceso temporal
  'admin-login': {
    html: 'administracion/views/login.tpl',
    scripts: [
      'assets/js/empresa-brand.js',
      'administracion/config/auth.js',
      'administracion/js/login.js'
    ]
  },
  // ── Módulo Documentos: formularios ────────────────────────
  'documentos': {
    html: 'administracion/documentos/views/documentos.tpl',
    scripts: [
      'administracion/documentos/js/documentosService.js',
      'administracion/documentos/js/documentos.js'
    ]
  },
  'solicitud-institucional': {
    html: 'administracion/documentos/views/solicitud-institucional.tpl',
    scripts: [
      'administracion/documentos/js/documentosService.js',
      'administracion/documentos/js/documentos.js'
    ]
  },
  'solicitud-espacio': {
    html: 'administracion/documentos/views/solicitud-espacio.tpl',
    scripts: [
      'administracion/documentos/js/documentosService.js',
      'administracion/documentos/js/documentos.js'
    ]
  },
  'permiso-policial': {
    html: 'administracion/documentos/views/permiso-policial.tpl',
    scripts: [
      'administracion/documentos/js/documentosService.js',
      'administracion/documentos/js/documentos.js'
    ]
  },
  'hoja-convenio': {
    html: 'administracion/documentos/views/hoja-convenio.tpl',
    scripts: [
      'administracion/documentos/js/documentosService.js',
      'administracion/documentos/js/documentos.js'
    ]
  },
  'hoja-convenio-personalizable': {
    html: 'administracion/documentos/views/hoja-convenio-personalizable.tpl',
    scripts: [
      'administracion/documentos/js/documentos.js'
    ]
  },

  // ── Módulo Recordatorios (independiente) ─────────────────
  'recordatorios': {
    html: 'recordatorios/views/recordatorios.tpl',
    scripts: [
      'recordatorios/js/recordatoriosService.js',
      'recordatorios/js/recordatorios.js'
    ]
  },

  // Shell administrativa: sidebar + topbar + contenido dinámico
  'administracion': {
    html: 'administracion/views/shell.tpl',
    scripts: [
      'assets/js/empresa-brand.js',
      'assets/js/utils.js',               // Usa API_URL de ApiConfig si existe
      'administracion/config/auth.js',
      'administracion/services/dashboardService.js',
      'administracion/services/documentosService.js',
      'administracion/services/promotoresService.js',
      'administracion/services/configuracionService.js',
      'administracion/js/router.js'
    ]
  }
};

/**
 * Carga un módulo: hace fetch del fragmento .tpl, lo inyecta en
 * #app-container y luego carga sus scripts en orden.
 */
async function mostrarModulo(nombre) {
  var modulo = MODULOS[nombre];
  if (!modulo) { console.warn('[App] Módulo no encontrado:', nombre); return; }

  var contenedor = document.getElementById('app-container');
  contenedor.innerHTML = '<div class="flex items-center justify-center min-h-[60vh]"><div class="spinner"></div></div>';

  try {
    var res = await fetch(modulo.html + '?t=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status + ' — ' + modulo.html);
    var html = await res.text();

    contenedor.innerHTML = html;

    if (!window.empresaBrand || typeof window.empresaBrand.applyBrand !== 'function') {
      await cargarScript('assets/js/empresa-brand.js');
    }

    if (typeof window.empresaBrand !== 'undefined' && typeof window.empresaBrand.applyBrand === 'function') {
      window.empresaBrand.applyBrand();
    }

    // Cargar scripts en orden secuencial
    for (var i = 0; i < modulo.scripts.length; i++) {
      await cargarScript(modulo.scripts[i]);
    }

  } catch (err) {
    console.error('[App] Error cargando módulo:', err);
    contenedor.innerHTML = '<div class="flex items-center justify-center min-h-[60vh] text-slate-400 text-sm px-4">No se pudo cargar el módulo. Verifica que el servidor esté activo.</div>';
  }
}

/**
 * Inyecta un script dinámicamente. Elimina la versión anterior
 * para garantizar re-ejecución fresca en cada carga de módulo.
 */
function cargarScript(src) {
  return new Promise(function(resolve, reject) {
    var prev = document.querySelector('script[data-modulo="' + src + '"]');
    if (prev) prev.remove();
    var s = document.createElement('script');
    s.src = src + '?t=' + Date.now();
    s.setAttribute('data-modulo', src);
    s.onload  = resolve;
    s.onerror = function() { reject(new Error('No se pudo cargar: ' + src)); };
    document.body.appendChild(s);
  });
}

function ingresarAsesor() {
  document.getElementById('landing-principal').classList.add('hidden');
  document.getElementById('pantalla-busqueda').classList.remove('hidden');
}

/** Muestra el selector de perfiles después del landing principal. */
function ingresarPortal() {
  var vistaInicial = document.getElementById('landing-card-inicial');
  var vistaPerfiles = document.getElementById('landing-card-perfiles');
  if (!vistaInicial || !vistaPerfiles) return;

  vistaInicial.classList.add('landing-fade-out');
  setTimeout(function () {
    vistaInicial.classList.add('hidden');
    vistaPerfiles.classList.remove('hidden');
    requestAnimationFrame(function () {
      vistaPerfiles.classList.remove('landing-fade-out');
      vistaPerfiles.classList.add('landing-fade-in');
    });
  }, 300);
}

/** Regresa a la vista inicial de la tarjeta del landing. */
function volverIngresoPortal() {
  var vistaInicial = document.getElementById('landing-card-inicial');
  var vistaPerfiles = document.getElementById('landing-card-perfiles');
  if (!vistaInicial || !vistaPerfiles) return;

  vistaPerfiles.classList.remove('landing-fade-in');
  vistaPerfiles.classList.add('landing-fade-out');
  setTimeout(function () {
    vistaPerfiles.classList.add('hidden');
    vistaInicial.classList.remove('hidden');
    requestAnimationFrame(function () {
      vistaInicial.classList.remove('landing-fade-out');
      vistaInicial.classList.add('landing-fade-in');
    });
  }, 300);
}

/** Muestra la consulta de cédula dentro de la tarjeta del landing. */
function mostrarConsultaAsesor() {
  var perfiles = document.getElementById('landing-card-perfiles');
  var consulta = document.getElementById('landing-card-consulta');
  if (!perfiles || !consulta) return;

  perfiles.classList.add('landing-fade-out');
  setTimeout(function () {
    perfiles.classList.add('hidden');
    consulta.classList.remove('hidden');
    requestAnimationFrame(function () {
      consulta.classList.remove('landing-fade-out');
      consulta.classList.add('landing-fade-in');
      document.getElementById('landing-cedula').focus();
    });
  }, 300);
}

/** Regresa desde la consulta de cédula a los perfiles. */
function volverPerfilesPortal() {
  var perfiles = document.getElementById('landing-card-perfiles');
  var consulta = document.getElementById('landing-card-consulta');
  var login = document.getElementById('landing-card-login');
  if (!perfiles || !consulta) return;

  var vistaActual = !consulta.classList.contains('hidden') ? consulta : login;
  if (!vistaActual) return;

  vistaActual.classList.remove('landing-fade-in');
  vistaActual.classList.add('landing-fade-out');
  setTimeout(function () {
    vistaActual.classList.add('hidden');
    perfiles.classList.remove('hidden');
    requestAnimationFrame(function () {
      perfiles.classList.remove('landing-fade-out');
      perfiles.classList.add('landing-fade-in');
    });
  }, 300);
}

/** Conecta la consulta dentro de la tarjeta con el flujo existente de nómina. */
function iniciarBusquedaDesdeTarjeta() {
  var cedula = (document.getElementById('landing-cedula').value || '').trim();
  var campoOriginal = document.getElementById('cedula-inicial');
  if (campoOriginal) campoOriginal.value = cedula;
  iniciarBusqueda();
}

/** Regresa desde la consulta de nómina al landing principal. */
function volverAlLandingDesdeNomina() {
  var appContainer = document.getElementById('app-container');
  var landingPrincipal = document.getElementById('landing-principal');
  var pantallaBusqueda = document.getElementById('pantalla-busqueda');
  var vistaInicial = document.getElementById('landing-card-inicial');
  var vistaPerfiles = document.getElementById('landing-card-perfiles');
  var vistaConsulta = document.getElementById('landing-card-consulta');

  if (appContainer) appContainer.classList.add('hidden');
  if (pantallaBusqueda) pantallaBusqueda.classList.add('hidden');
  if (landingPrincipal) landingPrincipal.classList.remove('hidden');

  if (vistaConsulta) {
    vistaConsulta.classList.add('hidden', 'landing-fade-out');
    vistaConsulta.classList.remove('landing-fade-in');
  }
  if (vistaPerfiles) {
    vistaPerfiles.classList.add('hidden', 'landing-fade-out');
    vistaPerfiles.classList.remove('landing-fade-in');
  }
  if (vistaInicial) {
    vistaInicial.classList.remove('hidden', 'landing-fade-out');
    vistaInicial.classList.add('landing-fade-in');
  }
}

/**
 * Desde la pantalla de búsqueda intermedia (V6):
 * transfiere la cédula al módulo nómina y dispara la consulta.
 */
function iniciarBusqueda() {
  var cedulaInput = document.getElementById('cedula-inicial').value.trim();

  document.getElementById('landing-principal').classList.add('hidden');
  document.getElementById('pantalla-busqueda').classList.add('hidden');
  document.getElementById('app-container').classList.remove('hidden');

  mostrarModulo('nomina').then(function() {
    if (cedulaInput) {
      var campoCedula = document.getElementById('cedula');
      if (campoCedula) {
        campoCedula.value = cedulaInput;
        if (typeof consultar === 'function') consultar();
      }
    }
  });
}

/** Abre la pantalla de acceso del módulo Administración */
function ingresarAdmin() {
  var perfiles = document.getElementById('landing-card-perfiles');
  var login = document.getElementById('landing-card-login');
  if (!perfiles || !login) return;

  perfiles.classList.add('landing-fade-out');
  setTimeout(async function () {
    perfiles.classList.add('hidden');
    login.innerHTML = '<div class="flex items-center justify-center py-8"><div class="spinner"></div></div>';
    login.classList.remove('hidden');
    requestAnimationFrame(function () {
      login.classList.remove('landing-fade-out');
      login.classList.add('landing-fade-in');
    });

    try {
      var res = await fetch('administracion/views/login.tpl?t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      login.innerHTML = await res.text();

      // Pre-calentar el GAS de licencias mientras se carga el HTML del login
      // para reducir el cold start cuando el usuario presione Ingresar
      var gasUrl = localStorage.getItem('ks_lic_gasurl') || '';
      var ksUrl  = 'https://script.google.com/macros/s/AKfycbyDBpp-Lef4vFWCblQyRNnWUdD2gi1MaCacu1Qv-y5axZLImEvSeDyhd1_mDnrt-NDPZQ/exec';
      fetch(ksUrl + '?action=ping', { cache: 'no-store' }).catch(function () {});

      if (!window.empresaBrand || typeof window.empresaBrand.applyBrand !== 'function') {
        await cargarScript('assets/js/empresa-brand.js');
      }

      if (window.empresaBrand && typeof window.empresaBrand.applyBrand === 'function') {
        window.empresaBrand.applyBrand();
      }

      await cargarScript('administracion/config/auth.js');
      await cargarScript('administracion/js/login.js');
      var usuario = document.getElementById('admin-usuario');
      if (usuario) usuario.focus();
    } catch (err) {
      console.error('[App] Error cargando login:', err);
      login.innerHTML = '<p class="text-sm text-red-600 py-6">No se pudo cargar el acceso. Intenta nuevamente.</p><button type="button" onclick="volverPerfilesPortal()" class="text-xs font-semibold text-slate-500 hover:text-verde-oscuro">← Volver a perfiles</button>';
    }
  }, 300);
}

// Interceptar "atrás" del navegador — si el usuario está en el admin,
// ir al dashboard en lugar de salir de la sesión
window.addEventListener('popstate', function () {
  if (document.getElementById('admin-shell')) {
    history.pushState({ modulo: 'admin' }, '');
    if (typeof adminNavegar === 'function') adminNavegar('dashboard');
    return;
  }

  var appContainer = document.getElementById('app-container');
  var landingPrincipal = document.getElementById('landing-principal');
  var pantallaBusqueda = document.getElementById('pantalla-busqueda');
  if (appContainer && !appContainer.classList.contains('hidden')) {
    appContainer.classList.add('hidden');
    pantallaBusqueda.classList.add('hidden');
    landingPrincipal.classList.remove('hidden');
  }
});

function mostrarProximamente() {
  document.getElementById('modal-proximamente').classList.remove('hidden');
}

function cerrarModalProximamente() {
  document.getElementById('modal-proximamente').classList.add('hidden');
}

/* ══════════════════════════════════════════════════════════
   SISTEMA DE LICENCIAS
   ══════════════════════════════════════════════════════════ */

/**
 * Verifica la licencia al cargar la app.
 * Si no hay licencia válida, muestra la pantalla de activación.
 */
async function inicializarApp() {
  // Restaurar API_URL desde localStorage si ya fue activada
  var gasUrlGuardada = localStorage.getItem('ks_lic_gasurl');
  if (gasUrlGuardada) window.API_URL = gasUrlGuardada;

  var valida = await verificarLicencia();
  if (!valida) {
    document.getElementById('landing-principal').classList.add('hidden');
    document.getElementById('pantalla-licencia').classList.remove('hidden');
  }
}

/**
 * Intenta activar el sistema con el código ingresado.
 */
async function activarSistema() {
  if (window.__activacionVisualEnCurso) return;
  window.__activacionVisualEnCurso = true;

  var codigo  = (document.getElementById('lic-codigo').value || '').trim();
  var errorEl = document.getElementById('lic-error');
  var btnEl   = document.getElementById('lic-btn');
  var textoEl = document.getElementById('lic-btn-texto');
  var overlay = document.getElementById('lic-carga-overlay');

  errorEl.classList.add('hidden');

  if (!codigo) {
    errorEl.textContent = 'Ingresa el código de licencia.';
    errorEl.classList.remove('hidden');
    window.__activacionVisualEnCurso = false;
    return;
  }

  btnEl.disabled = true;
  textoEl.textContent = 'Verificando...';
  if (overlay) {
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
  }

  var resultado = await activarLicencia(codigo);
  window.__activacionVisualEnCurso = false;
  if (overlay) {
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
  }

  btnEl.disabled = false;
  textoEl.textContent = 'Activar sistema';

  if (resultado.ok) {
    document.getElementById('pantalla-licencia').classList.add('hidden');
    document.getElementById('landing-principal').classList.remove('hidden');
  } else {
    errorEl.textContent = resultado.error || 'Código inválido. Verifica e intenta de nuevo.';
    errorEl.classList.remove('hidden');
    document.getElementById('lic-codigo').focus();
  }
}

// Inicializar cuando carga la página
document.addEventListener('DOMContentLoaded', function() {
  inicializarApp();
});
