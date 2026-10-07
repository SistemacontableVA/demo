var KS_TOKEN_KEY    = 'ks_lic_token';
var KS_EXPIRA_KEY   = 'ks_lic_expira';
var KS_CODIGO_KEY   = 'ks_lic_codigo';
var KS_GASURL_KEY   = 'ks_lic_gasurl';
var KS_VALIDACION_KEY = 'ks_lic_validada_at';
var ADMIN_TOKEN_KEY = 'ks_admin_token';
var ADMIN_EXPIRA_KEY= 'ks_admin_expira';
var ADMIN_REFRESH_KEY = 'ks_admin_refresh';
var ADMIN_AUTH_BASE_URL = 'https://cifevururqrlajkhveno.supabase.co';
var ADMIN_AUTH_PUBLIC_KEY = 'sb_publishable_AScKVt33ih6geDdoLJopgQ_7hqH5E6h';
var _activacionEnCurso = false;
var _adminRefreshInProgress = false;

async function activarLicencia(codigo) {
  if (_activacionEnCurso) {
    return { ok: false, error: 'La activación ya está en proceso. Espera unos segundos.' };
  }

  _activacionEnCurso = true;
  try {
    var activacion = await _solicitarPuertaLicencia({
      action: 'activate',
      code: codigo.trim()
    });

    if (activacion.ok) {
      if (!activacion.gas_url) {
        return { ok: false, error: 'La empresa no tiene configurada su conexión de datos.' };
      }
      localStorage.setItem(KS_TOKEN_KEY, activacion.session_token);
      localStorage.setItem(KS_EXPIRA_KEY, String(Date.parse(activacion.expires_at)));
      localStorage.removeItem(KS_CODIGO_KEY);
      localStorage.setItem(KS_GASURL_KEY, activacion.gas_url);
      sessionStorage.setItem(KS_VALIDACION_KEY, String(Date.now()));
      if (activacion.license && activacion.license.expires_at) {
        localStorage.setItem('ks_lic_vence', activacion.license.expires_at);
      }
      if (activacion.tenant && activacion.tenant.name) {
        localStorage.setItem('ks_lic_cliente', activacion.tenant.name);
      }
      window.API_URL = activacion.gas_url;
    }

    return activacion;
  } catch (err) {
    return { ok: false, error: err.message || 'No se pudo validar el código de licencia.' };
  } finally {
    _activacionEnCurso = false;
  }
}

async function verificarLicencia() {
  return verificarLicenciaDirecta();
}

async function _solicitarPuertaLicencia(payload) {
  var res = await fetch(ADMIN_AUTH_BASE_URL + '/functions/v1/license-gate', {
    method: 'POST',
    headers: {
      apikey: ADMIN_AUTH_PUBLIC_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  return _leerRespuestaAuth(res);
}

async function verificarLicenciaDirecta() {
  var token = localStorage.getItem(KS_TOKEN_KEY);
  var expira = Number(localStorage.getItem(KS_EXPIRA_KEY) || '0');

  if (!token || !expira || Date.now() >= expira) {
    _limpiarLicencia();
    return false;
  }

  try {
    var data = await _solicitarPuertaLicencia({
      action: 'validate',
      session_token: token
    });

    if (!data.ok) {
      _limpiarLicencia();
      return false;
    }

    if (!data.gas_url) {
      _limpiarLicencia();
      return false;
    }
    window.API_URL = data.gas_url;
    localStorage.setItem(KS_GASURL_KEY, data.gas_url);
    sessionStorage.setItem(KS_VALIDACION_KEY, String(Date.now()));
    return true;
  } catch (err) {
    return false;
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

function autenticarAdmin(usuario, password) {
  return autenticarAdminDirecto(usuario, password);
}

async function _leerRespuestaAuth(res) {
  var texto = await res.text();
  var data;

  try {
    data = texto ? JSON.parse(texto) : {};
  } catch (err) {
    data = {};
  }

  if (!res.ok) {
    var error = new Error(data.error_description || data.msg || data.error || 'No se pudo validar el acceso.');
    error.status = res.status;
    throw error;
  }

  return data;
}

async function _validarAccesoDirecto(accessToken) {
  var licenseSessionToken = localStorage.getItem(KS_TOKEN_KEY);
  if (!licenseSessionToken) {
    throw new Error('Activa primero una licencia para este navegador.');
  }

  var res = await fetch(ADMIN_AUTH_BASE_URL + '/functions/v1/validate-access', {
    method: 'POST',
    headers: {
      apikey: ADMIN_AUTH_PUBLIC_KEY,
      Authorization: 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ license_session_token: licenseSessionToken })
  });
  return _leerRespuestaAuth(res);
}

function _guardarSesionDirecta(session, validation) {
  var expira = session.expires_at
    ? Number(session.expires_at) * 1000
    : Date.now() + Number(session.expires_in || 3600) * 1000;

  localStorage.setItem(ADMIN_TOKEN_KEY, session.access_token);
  localStorage.setItem(ADMIN_REFRESH_KEY, session.refresh_token);
  localStorage.setItem(ADMIN_EXPIRA_KEY, String(expira));
  localStorage.setItem('admin_perfil', validation.user.role);
  localStorage.setItem('admin_usuario', validation.user.username || session.user.email || '');
  localStorage.setItem('admin_tenant_id', validation.tenant.id);
}

function _revocarSesionDirecta(accessToken) {
  if (!accessToken) return;
  fetch(ADMIN_AUTH_BASE_URL + '/auth/v1/logout', {
    method: 'POST',
    headers: {
      apikey: ADMIN_AUTH_PUBLIC_KEY,
      Authorization: 'Bearer ' + accessToken
    }
  }).catch(function () {});
}

async function autenticarAdminDirecto(email, password) {
  var session = null;

  try {
    var authRes = await fetch(ADMIN_AUTH_BASE_URL + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: {
        apikey: ADMIN_AUTH_PUBLIC_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: email.trim(), password: password })
    });
    session = await _leerRespuestaAuth(authRes);

    var validation = await _validarAccesoDirecto(session.access_token);
    if (!validation.ok || !validation.user || validation.user.id !== session.user.id) {
      throw new Error(validation.error || 'El usuario no tiene acceso autorizado.');
    }

    _guardarSesionDirecta(session, validation);
    return { ok: true, perfil: validation.user.role };
  } catch (err) {
    if (session && session.access_token) _revocarSesionDirecta(session.access_token);
    return {
      ok: false,
      error: err.status === 400 || err.status === 401
        ? 'Correo o contraseña incorrectos.'
        : (err.message || 'No se pudo validar el acceso.')
    };
  }
}

async function renovarSesionAdmin() {
  if (_adminRefreshInProgress) return false;

  var refreshToken = localStorage.getItem(ADMIN_REFRESH_KEY);
  if (!refreshToken) return false;

  _adminRefreshInProgress = true;
  try {
    var authRes = await fetch(ADMIN_AUTH_BASE_URL + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: {
        apikey: ADMIN_AUTH_PUBLIC_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    var session = await _leerRespuestaAuth(authRes);
    var validation = await _validarAccesoDirecto(session.access_token);

    if (!validation.ok || !validation.user || validation.user.id !== session.user.id) return false;

    _guardarSesionDirecta(session, validation);
    return true;
  } catch (err) {
    return false;
  } finally {
    _adminRefreshInProgress = false;
  }
}

function getPerfilAdmin() {
  var PERFILES_VALIDOS = ['Administrador', 'Coordinador', 'Secretaria', 'Atención', 'Ejecutivo'];
  var perfilStorage = (localStorage.getItem('admin_perfil') || sessionStorage.getItem('admin_perfil') || '').trim();
  if (PERFILES_VALIDOS.indexOf(perfilStorage) !== -1) return perfilStorage;

  return 'Coordinador';
}

function estaAutenticado() {
  var token  = localStorage.getItem(ADMIN_TOKEN_KEY) || sessionStorage.getItem(ADMIN_TOKEN_KEY);
  var expira = parseInt(localStorage.getItem(ADMIN_EXPIRA_KEY) || sessionStorage.getItem(ADMIN_EXPIRA_KEY) || '0');
  if (!token || !expira) return false;
  return new Date().getTime() < expira;
}

function cerrarSesionAdmin() {
  var token = localStorage.getItem(ADMIN_TOKEN_KEY) || sessionStorage.getItem(ADMIN_TOKEN_KEY);
  if (localStorage.getItem(ADMIN_REFRESH_KEY)) {
    _revocarSesionDirecta(token);
  }

  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_EXPIRA_KEY);
  localStorage.removeItem(ADMIN_REFRESH_KEY);
  localStorage.removeItem('admin_perfil');
  localStorage.removeItem('admin_usuario');
  localStorage.removeItem('admin_tenant_id');
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  sessionStorage.removeItem(ADMIN_EXPIRA_KEY);
  sessionStorage.removeItem(ADMIN_REFRESH_KEY);
  sessionStorage.removeItem('admin_perfil');
  sessionStorage.removeItem('admin_usuario');
  sessionStorage.removeItem('admin_tenant_id');
}

function getTokenAdmin() {
  return localStorage.getItem(ADMIN_TOKEN_KEY) || sessionStorage.getItem(ADMIN_TOKEN_KEY);
}
