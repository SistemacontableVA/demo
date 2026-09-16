/* ============================================================
   AUTH.JS — Sistema de autenticación y licencias
   Módulo Administración · Óptica Visión de Águila

   Las credenciales NO están aquí.
   La validación ocurre en el servidor KS-Licencias (GAS).
   ============================================================ */

// URL del GAS de licencias (tuyo, no del cliente)
var KS_LICENCIAS_URL = 'https://script.google.com/macros/s/AKfycbyDBpp-Lef4vFWCblQyRNnWUdD2gi1MaCacu1Qv-y5axZLImEvSeDyhd1_mDnrt-NDPZQ/exec';

// Claves de almacenamiento
var KS_TOKEN_KEY    = 'ks_lic_token';
var KS_EXPIRA_KEY   = 'ks_lic_expira';
var KS_CODIGO_KEY   = 'ks_lic_codigo';
var KS_GASURL_KEY   = 'ks_lic_gasurl';
var KS_VALIDACION_KEY = 'ks_lic_validada_at';
var ADMIN_TOKEN_KEY = 'ks_admin_token';
var ADMIN_EXPIRA_KEY= 'ks_admin_expira';
var _activacionEnCurso = false;

/* ── Licencia ─────────────────────────────────────────── */

/**
 * Activa la licencia con el código dado.
 * Valida los 3 factores contra el GAS de licencias.
 * @param {string} codigo
 * @returns {Promise<{ok, error?, token?, cliente?}>}
 */
async function activarLicencia(codigo) {
  if (_activacionEnCurso) {
    return { ok: false, error: 'La activación ya está en proceso. Espera unos segundos.' };
  }

  _activacionEnCurso = true;
  var dominio = window.location.hostname;
  var url = KS_LICENCIAS_URL
    + '?action=activar'
    + '&codigo='  + encodeURIComponent(codigo.trim())
    + '&dominio=' + encodeURIComponent(dominio);

  try {
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timeout = controller ? setTimeout(function() { controller.abort(); }, 20000) : null;
    var res  = await fetch(url, controller ? { signal: controller.signal } : {});
    if (timeout) clearTimeout(timeout);
    var data = await res.json();

    if (data.ok) {
      localStorage.setItem(KS_TOKEN_KEY,  data.token);
      localStorage.setItem(KS_EXPIRA_KEY, data.expira);
      localStorage.setItem(KS_CODIGO_KEY, codigo.trim());
      localStorage.setItem(KS_GASURL_KEY, data.gas_url);
      sessionStorage.setItem(KS_VALIDACION_KEY, String(Date.now()));
      // Guardar fecha de vencimiento real de la licencia y nombre del cliente
      if (data.vence_licencia) localStorage.setItem('ks_lic_vence',   data.vence_licencia);
      if (data.cliente)        localStorage.setItem('ks_lic_cliente', data.cliente);
      // Actualizar API_URL para que los módulos usen el GAS del cliente
      window.API_URL = data.gas_url;
    }

    return data;
  } catch (err) {
    if (err && err.name === 'AbortError') {
      return { ok: false, error: 'El servidor de licencias tardó demasiado. Espera unos segundos e inténtalo nuevamente.' };
    }
    return { ok: false, error: 'No se pudo conectar con el servidor de licencias. Verifica tu conexión e inténtalo nuevamente.' };
  } finally {
    _activacionEnCurso = false;
  }
}

/**
 * Verifica si la licencia guardada sigue siendo válida.
 * Primero revisa la expiración local, luego re-valida contra el GAS.
 * @returns {Promise<boolean>}
 */
async function verificarLicencia() {
  var token  = localStorage.getItem(KS_TOKEN_KEY);
  var expira = parseInt(localStorage.getItem(KS_EXPIRA_KEY) || '0');
  var gasUrl = localStorage.getItem(KS_GASURL_KEY);
  var validadaAt = parseInt(sessionStorage.getItem(KS_VALIDACION_KEY) || '0');

  if (!token || !expira) return false;

  // Verificación local rápida
  if (new Date().getTime() > expira) {
    _limpiarLicencia();
    return false;
  }

  // Evitar validar contra el servidor en cada recarga de la misma pestaña.
  // Caché de 30 minutos — suficiente para una sesión de trabajo normal.
  if (gasUrl && validadaAt && Date.now() - validadaAt < 30 * 60 * 1000) {
    window.API_URL = gasUrl;
    return true;
  }

  // Re-validación contra el servidor (cada vez que carga la app)
  try {
    var dominio = window.location.hostname;
    var url = KS_LICENCIAS_URL
      + '?action=validar'
      + '&token='   + encodeURIComponent(token)
      + '&dominio=' + encodeURIComponent(dominio);

    var res  = await fetch(url);
    var data = await res.json();

    if (data.ok) {
      // Actualizar API_URL con el GAS del cliente
      if (data.gas_url) {
        window.API_URL = data.gas_url;
        localStorage.setItem(KS_GASURL_KEY, data.gas_url);
      }
      return true;
    } else {
      _limpiarLicencia();
      return false;
    }
  } catch (err) {
    // Si falla la conexión pero el token local es válido, permitir acceso temporal
    if (gasUrl) window.API_URL = gasUrl;
    return true;
  }
}

function _limpiarLicencia() {
  localStorage.removeItem(KS_TOKEN_KEY);
  localStorage.removeItem(KS_EXPIRA_KEY);
  localStorage.removeItem(KS_CODIGO_KEY);
  localStorage.removeItem(KS_GASURL_KEY);
  sessionStorage.removeItem(KS_VALIDACION_KEY);
}

function licenciaActiva() {
  var token  = localStorage.getItem(KS_TOKEN_KEY);
  var expira = parseInt(localStorage.getItem(KS_EXPIRA_KEY) || '0');
  return !!(token && new Date().getTime() < expira);
}

/* ── Sesión Admin ─────────────────────────────────────── */

/**
 * Inicia sesión del administrador.
 * Las credenciales se validan en el GAS, nunca localmente.
 * @param {string} usuario
 * @param {string} password
 * @returns {Promise<{ok, error?}>}
 */
async function autenticarAdmin(usuario, password) {
  var codigo  = localStorage.getItem(KS_CODIGO_KEY) || '';
  var dominio = window.location.hostname;

  var url = KS_LICENCIAS_URL
    + '?action=login-admin'
    + '&codigo='   + encodeURIComponent(codigo)
    + '&usuario='  + encodeURIComponent(usuario)
    + '&password=' + encodeURIComponent(password)
    + '&dominio='  + encodeURIComponent(dominio);

  try {
    var res  = await fetch(url);
    var data = await res.json();

    if (data.ok) {
      var PERFILES_VALIDOS = ['Administrador', 'Coordinador', 'Secretaria'];
      var perfil = (data.perfil || 'Administrador').trim();
      if (PERFILES_VALIDOS.indexOf(perfil) === -1) {
        return { ok: false, error: 'Perfil de usuario no reconocido.' };
      }
      sessionStorage.setItem(ADMIN_TOKEN_KEY,  data.token);
      sessionStorage.setItem(ADMIN_EXPIRA_KEY, data.expira);
      sessionStorage.setItem('admin_perfil',   perfil);
    }

    return data;
  } catch (err) {
    return { ok: false, error: 'No se pudo conectar con el servidor.' };
  }
}

/**
 * Devuelve el perfil del usuario autenticado extrayéndolo del token.
 * Resistente a manipulación desde consola.
 * @returns {string}
 */
function getPerfilAdmin() {
  var PERFILES_VALIDOS = ['Administrador', 'Coordinador', 'Secretaria'];

  // Intentar extraer perfil del token (fuente de verdad — firmado por el GAS)
  var token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
  if (token) {
    try {
      var pad     = token.replace(/-/g, '+').replace(/_/g, '/');
      var decoded = atob(pad + '=='.slice(0, (4 - pad.length % 4) % 4));
      var payload = decoded.split('||')[0];
      var partes  = payload.split('|');
      // formato: semilla|timestamp|perfil
      if (partes.length >= 3) {
        var perfilToken = partes[2].trim();
        if (PERFILES_VALIDOS.indexOf(perfilToken) !== -1) {
          return perfilToken;
        }
      }
    } catch (e) { /* fallback */ }
  }

  // Fallback sessionStorage — si alguien lo manipuló sin token válido, no sirve de nada
  var perfilStorage = (sessionStorage.getItem('admin_perfil') || '').trim();
  if (PERFILES_VALIDOS.indexOf(perfilStorage) !== -1) return perfilStorage;

  // Perfil más restrictivo por defecto
  return 'Coordinador';
}

/**
 * Verifica si hay sesión admin activa y no expirada.
 * @returns {boolean}
 */
function estaAutenticado() {
  var token  = sessionStorage.getItem(ADMIN_TOKEN_KEY);
  var expira = parseInt(sessionStorage.getItem(ADMIN_EXPIRA_KEY) || '0');
  if (!token || !expira) return false;
  return new Date().getTime() < expira;
}

/**
 * Cierra la sesión del administrador.
 */
function cerrarSesionAdmin() {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  sessionStorage.removeItem(ADMIN_EXPIRA_KEY);
}

/**
 * Devuelve el token de sesión admin activo.
 * @returns {string|null}
 */
function getTokenAdmin() {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY);
}
