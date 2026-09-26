/** Mapa de secciones: clave → { titulo, scripts[], renderFn } */
var ADMIN_RUTAS = {
  'dashboard':      { titulo: 'Dashboard',            scripts: ['administracion/services/dashboardService.js', 'administracion/js/dashboard.js'] },
  'documentos':     { titulo: 'Gestión Documental',   scripts: ['administracion/services/documentosService.js', 'administracion/js/documentos.js'] },
  'ingresarNomina': { titulo: 'Ingresar Nómina',      scripts: ['assets/js/utils.js', 'administracion/js/ingresarNomina.js'] },
  'nominaPromotor': { titulo: 'Nómina Promotor',      scripts: ['assets/js/utils.js', 'promotores/js/nomina-render.js', 'promotores/js/nomina-filtros.js', 'promotores/js/nomina.js', 'administracion/js/nominaPromotor.js'] },
  'oficina':        { titulo: 'Nómina Oficina',       scripts: ['administracion/services/oficinaNominaService.js', 'administracion/js/oficina.js'] },
  'reportes':       { titulo: 'Reportes',             scripts: ['administracion/services/reportesService.js', 'administracion/js/reportes.js'] },
  'cargaLentes':    { titulo: 'Gestión de Lentes',    scripts: ['administracion/services/lentesCargaService.js', 'administracion/js/lentesCarga.js'] },
  'recordatorios':      { titulo: 'Recordatorios',          scripts: ['recordatorios/js/recordatoriosService.js', 'recordatorios/js/recordatorios.js'] },
  'recordatorioMasivo': { titulo: 'Recordatorio Masivo',    scripts: ['assets/js/api-config.js', 'atencionMunicipio/js/atencionMunicipioService.js', 'recordatorioMasivo/js/metaConfig.js', 'recordatorioMasivo/js/metaService.js', 'recordatorioMasivo/js/recordatorioMasivoService.js', 'recordatorioMasivo/js/recordatorioMasivo.js'] },
  'atencionMunicipio':  { titulo: 'Atención Municipio',      scripts: ['assets/js/api-config.js', 'atencionMunicipio/js/atencionMunicipioService.js', 'atencionMunicipio/js/atencionMunicipio.js'] },
  'catalogos':      { titulo: 'Catálogos',            scripts: ['administracion/js/catalogos.js'] },
  'configuracion':  { titulo: 'Configuración',        scripts: ['administracion/js/configuracion.js'] },
  'contabilidadDiaria': { titulo: 'Contabilidad Diaria', scripts: [] }
};

var ADMIN_RUTAS_COORDINADOR = ['documentos', 'nominaPromotor', 'contabilidadDiaria'];
var ADMIN_RUTAS_SECRETARIA  = ['documentos', 'atencionMunicipio', 'recordatorios', 'recordatorioMasivo'];
var ADMIN_RUTAS_ATENCION    = ['atencionMunicipio', 'catalogos'];
var ADMIN_RUTAS_EJECUTIVO   = ['dashboard', 'documentos', 'ingresarNomina', 'nominaPromotor', 'contabilidadDiaria', 'oficina', 'reportes', 'cargaLentes', 'catalogos', 'atencionMunicipio'];

var ADMIN_PERFILES_RUTAS = {
  'Administrador': Object.keys(ADMIN_RUTAS),
  'Coordinador': ADMIN_RUTAS_COORDINADOR,
  'Secretaria': ADMIN_RUTAS_SECRETARIA,
  'Atención': ADMIN_RUTAS_ATENCION,
  'Ejecutivo': ADMIN_RUTAS_EJECUTIVO
};

function adminTieneAccesoRuta(perfil, seccion) {
  var rutas = ADMIN_PERFILES_RUTAS[perfil] || [];
  return rutas.indexOf(seccion) !== -1;
}

/** Sección activa actual */
var _adminRutaActual = '';

/**
 * Navega a una sección del panel administrativo.
 * Actualiza el sidebar, el título del topbar y carga
 * el JS de la sección de forma dinámica.
 * @param {string} seccion - Clave en ADMIN_RUTAS
 */
function adminNavegar(seccion) {
  var perfilActual = (typeof getPerfilAdmin === 'function') ? getPerfilAdmin() : 'Administrador';
  if (!adminTieneAccesoRuta(perfilActual, seccion)) {
    console.warn('[AdminRouter] Ruta no permitida para Coordinador:', seccion);
    return;
  }

  var ruta = ADMIN_RUTAS[seccion];
  if (!ruta) {
    console.warn('[AdminRouter] Sección no encontrada:', seccion);
    return;
  }

  _adminRutaActual = seccion;

  var scriptsRuta = ruta.scripts;
  if (seccion === 'contabilidadDiaria') {
    scriptsRuta = perfilActual === 'Coordinador'
      ? ['coordinador/js/contabilidadDiaria.js']
      : ['coordinador/services/contabilidadDiariaService.js', 'administracion/js/contabilidadAdmin.js'];
  }

  if (seccion === 'ingresarNomina' || seccion === 'nominaPromotor' || seccion === 'contabilidadDiaria') {
    adminSetNominaSubmenu(true);
  }

  // En móvil: cerrar el sidebar al navegar
  if (window.innerWidth <= 768) {
    var sidebar = document.getElementById('admin-sidebar');
    var overlay = document.getElementById('admin-mobile-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Actualizar título del topbar
  var tituloEl = document.getElementById('admin-topbar-titulo');
  if (tituloEl) tituloEl.textContent = ruta.titulo;

  // Marcar ítem activo en sidebar
  var items = document.querySelectorAll('.admin-menu-item');
  items.forEach(function (item) {
    var itemRuta = item.getAttribute('data-ruta');
    item.classList.toggle('activo', itemRuta === seccion);
  });

  // Mostrar spinner en el contenido
  var contenedor = document.getElementById('admin-content');
  if (contenedor) {
    contenedor.innerHTML = '<div class="flex items-center justify-center h-40"><div class="spinner"></div></div>';
  }

  // Cargar scripts de la sección en orden y luego renderizar
  _cargarScriptsAdmin(scriptsRuta, 0, function () {
    // Cada módulo expone una función render<Seccion>()
    // Ej: renderDashboard(), renderDocumentos(), etc.
    var fnNombre = 'render' + seccion.charAt(0).toUpperCase() + seccion.slice(1);
    if (typeof window[fnNombre] === 'function') {
      window[fnNombre]();
    } else {
      console.warn('[AdminRouter] Función no encontrada:', fnNombre);
    }
  });
}

function adminToggleNominaSubmenu() {
  var submenu = document.getElementById('admin-submenu-nomina');
  var parent = document.getElementById('admin-menu-nomina');
  if (!submenu || !parent) return;
  adminSetNominaSubmenu(!submenu.classList.contains('open'));
}

function adminSetNominaSubmenu(abierto) {
  var submenu = document.getElementById('admin-submenu-nomina');
  var parent = document.getElementById('admin-menu-nomina');
  if (!submenu || !parent) return;
  submenu.classList.toggle('open', abierto);
  submenu.setAttribute('aria-hidden', abierto ? 'false' : 'true');
  parent.classList.toggle('expanded', abierto);
  parent.setAttribute('aria-expanded', abierto ? 'true' : 'false');
}

/**
 * Carga scripts del admin de forma secuencial.
 * Elimina la versión anterior para garantizar re-ejecución fresca.
 * @param {string[]} scripts
 * @param {number} index
 * @param {Function} callback
 */
function _cargarScriptsAdmin(scripts, index, callback) {
  if (index >= scripts.length) {
    callback();
    return;
  }

  var src = scripts[index];
  var prev = document.querySelector('script[data-admin="' + src + '"]');
  if (prev) prev.remove();

  var s = document.createElement('script');
  s.src = src + '?t=' + Date.now();
  s.setAttribute('data-admin', src);
  s.onload = function () {
    _cargarScriptsAdmin(scripts, index + 1, callback);
  };
  s.onerror = function () {
    console.error('[AdminRouter] Error cargando:', src);
    _cargarScriptsAdmin(scripts, index + 1, callback);
  };
  document.body.appendChild(s);
}

/**
 * Cierra la sesión administrativa y vuelve al landing.
 */
function adminLogout() {
  if (typeof cerrarSesionAdmin === 'function') cerrarSesionAdmin();

  // Limpiar scripts del admin del DOM
  document.querySelectorAll('script[data-admin]').forEach(function (s) { s.remove(); });
  // Limpiar estilos del admin si se cargaron dinámicamente
  document.querySelectorAll('link[data-admin-css]').forEach(function (l) { l.remove(); });

  // Volver a la landing nueva y restablecer la tarjeta inicial
  var appContainer = document.getElementById('app-container');
  var landingPrincipal = document.getElementById('landing-principal');
  var vistaInicial = document.getElementById('landing-card-inicial');
  var vistaPerfiles = document.getElementById('landing-card-perfiles');
  var vistaConsulta = document.getElementById('landing-card-consulta');
  var vistaLogin = document.getElementById('landing-card-login');

  if (appContainer) appContainer.classList.add('hidden');
  if (landingPrincipal) landingPrincipal.classList.remove('hidden');

  [vistaPerfiles, vistaConsulta, vistaLogin].forEach(function (vista) {
    if (!vista) return;
    vista.classList.add('hidden', 'landing-fade-out');
    vista.classList.remove('landing-fade-in');
  });

  if (vistaLogin) vistaLogin.innerHTML = '';
  if (vistaInicial) {
    vistaInicial.classList.remove('hidden', 'landing-fade-out');
    vistaInicial.classList.add('landing-fade-in');
  }
}

// Iniciar en dashboard al cargar la shell
(function () {
  // Verificar que hay sesión admin activa
  if (typeof estaAutenticado === 'function' && !estaAutenticado()) {
    console.warn('[AdminRouter] Sesión no válida, redirigiendo al login.');
    mostrarModulo('admin-login');
    return;
  }

  // Obtener perfil
  var perfil = (typeof getPerfilAdmin === 'function') ? getPerfilAdmin() : 'Administrador';

  // Aplicar perfil al sidebar después de que el DOM de la shell esté listo
  // Usamos MutationObserver para detectar cuando el sidebar aparece en el DOM
  var observer = new MutationObserver(function(mutations, obs) {
    var sidebar = document.getElementById('admin-sidebar');
    if (sidebar) {
      _aplicarPerfilSidebar(perfil);
      obs.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Timeout de seguridad — si por alguna razón el observer no dispara
  setTimeout(function() {
    observer.disconnect();
    _aplicarPerfilSidebar(perfil);
  }, 2000);

  var rutaInicial = perfil === 'Coordinador' || perfil === 'Secretaria' ? 'documentos' :
    perfil === 'Atención' ? 'atencionMunicipio' : 'dashboard';
  adminNavegar(rutaInicial);

  // Re-validar sesión cada 30 minutos
  setInterval(function () {
    if (typeof estaAutenticado === 'function' && !estaAutenticado()) {
      if (typeof cerrarSesionAdmin === 'function') cerrarSesionAdmin();
      alert('Tu sesión ha expirado. Inicia sesión nuevamente.');
      mostrarModulo('admin-login');
    }
  }, 30 * 60 * 1000);
})();

/**
 * Aplica visibilidad del sidebar según el perfil del usuario.
 *
 * Reglas:
 *   Cada perfil usa ADMIN_PERFILES_RUTAS como fuente única de permisos.
 *
 * @param {string} perfil
 */
function _aplicarPerfilSidebar(perfil) {
  var rutasPermitidas = ADMIN_PERFILES_RUTAS[perfil] || [];
  document.querySelectorAll('.admin-menu-item').forEach(function (el) {
    var ruta = el.getAttribute('data-ruta') || '';
    el.style.display = rutasPermitidas.indexOf(ruta) !== -1 ? '' : 'none';
  });

  document.querySelectorAll('.admin-menu-section').forEach(function (sec) {
    var siguiente = sec.nextElementSibling;
    var visible = false;
    while (siguiente && !siguiente.classList.contains('admin-menu-section')) {
      if (siguiente.classList.contains('admin-menu-item') && siguiente.style.display !== 'none') {
        visible = true;
        break;
      }
      siguiente = siguiente.nextElementSibling;
    }
    sec.style.display = visible ? '' : 'none';
  });

  // Mostrar perfil en el footer del sidebar
  var perfilLabel = document.getElementById('sidebar-perfil-label');
  if (perfilLabel) perfilLabel.textContent = perfil === 'Coordinador' ? 'Coordinador de Campo' : perfil;

  // Actualizar inicial del avatar (topbar y sidebar)
  var inicial = perfil.charAt(0).toUpperCase();
  document.querySelectorAll('.avatar-inicial').forEach(function (el) {
    el.textContent = inicial;
  });
}

/**
 * Abre/cierra el sidebar en móvil (drawer).
 * Llamado desde el botón hamburguesa del topbar.
 */
function adminToggleSidebar() {
  var sidebar = document.getElementById('admin-sidebar');
  var overlay = document.getElementById('admin-mobile-overlay');
  if (!sidebar || !overlay) return;

  var isOpen = sidebar.classList.contains('open');
  if (isOpen) {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  } else {
    sidebar.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}
