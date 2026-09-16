/* ============================================================
   LOGIN.JS — Lógica de la pantalla de acceso administrativo
   Módulo Administración · Óptica Visión de Águila

   Las credenciales se validan en el servidor (GAS KS-Licencias).
   No hay contraseñas en este archivo ni en el frontend.
   ============================================================ */

/**
 * Maneja el submit del formulario de login.
 * Llama a autenticarAdmin() definida en config/auth.js.
 * @param {Event} e
 */
async function adminLoginSubmit(e) {
  e.preventDefault();

  var usuario  = document.getElementById('admin-usuario').value.trim();
  var password = document.getElementById('admin-password').value;
  var errorEl  = document.getElementById('admin-login-error');
  var btnText  = document.getElementById('admin-btn-login-text');
  var spinner  = document.getElementById('admin-btn-login-spinner');
  var arrow    = document.getElementById('admin-login-arrow');
  var btn      = document.getElementById('admin-btn-login');

  // Ocultar error previo
  errorEl.classList.remove('visible');

  if (!usuario || !password) {
    errorEl.textContent = 'Completa todos los campos.';
    errorEl.classList.add('visible');
    return;
  }

  // Estado de carga
  btnText.textContent = 'Verificando...';
  spinner.classList.remove('hidden');
  arrow.classList.add('hidden');
  btn.disabled = true;

  try {
    var resultado = await autenticarAdmin(usuario, password);

    if (resultado.ok) {
      // Acceso concedido → cargar la shell administrativa
      document.getElementById('landing-principal').classList.add('hidden');
      document.getElementById('app-container').classList.remove('hidden');
      mostrarModulo('administracion');
    } else {
      // Acceso denegado
      errorEl.textContent = resultado.error || 'Usuario o contraseña incorrectos.';
      errorEl.classList.add('visible');
      btnText.textContent = 'Ingresar';
      spinner.classList.add('hidden');
      arrow.classList.remove('hidden');
      btn.disabled = false;
      document.getElementById('admin-password').value = '';
      document.getElementById('admin-password').focus();
    }
  } catch (err) {
    errorEl.textContent = 'Error de conexión. Verifica tu internet e intenta de nuevo.';
    errorEl.classList.add('visible');
    btnText.textContent = 'Ingresar';
    spinner.classList.add('hidden');
    arrow.classList.remove('hidden');
    btn.disabled = false;
  }
}

/**
 * Alterna la visibilidad de la contraseña.
 */
function adminTogglePassword() {
  var input = document.getElementById('admin-password');
  input.type = input.type === 'password' ? 'text' : 'password';
}

/**
 * Vuelve al landing principal.
 */
function adminVolverLanding() {
  if (typeof volverPerfilesPortal === 'function') {
    volverPerfilesPortal();
    return;
  }

  document.getElementById('app-container').classList.add('hidden');
  document.getElementById('pantalla-busqueda').classList.add('hidden');
  document.getElementById('landing-principal').classList.remove('hidden');
}

// Autofocus y pre-calentamiento del GAS al cargar la vista
(function () {
  var u = document.getElementById('admin-usuario');
  if (u) u.focus();

  // Pre-calentar el GAS de licencias INMEDIATAMENTE al cargar el formulario.
  // No esperar a que el usuario interactúe — el cold start tarda hasta 10s.
  // El ping sale en cuanto aparece el login en pantalla.
  var _precalentado = false;
  function _precalentarGAS() {
    if (_precalentado) return;
    _precalentado = true;
    fetch(KS_LICENCIAS_URL + '?action=ping', { cache: 'no-store' }).catch(function () {});
  }

  // Lanzar ping de inmediato
  _precalentarGAS();
})();
