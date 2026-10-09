const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const templatesDir = path.join(root, 'administracion', 'documentos', 'templates');

function listarTemplates() {
  return fs.readdirSync(templatesDir)
    .filter(file => file.endsWith('.html'))
    .map(file => path.join(templatesDir, file));
}

test('las plantillas no deben bloquear la carga del branding central con condicionales vacíos', () => {
  const files = listarTemplates();
  assert.ok(files.length > 0, 'Debe haber plantillas HTML para verificar');

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const bloqueos = [
      'if (el.dataset.empresaEmail)',
      'if (el.dataset.empresaDireccion)',
      'if (el.dataset.empresaTelefonos)'
    ].filter(pattern => text.includes(pattern));

    assert.deepEqual(
      bloqueos,
      [],
      `La plantilla ${path.relative(root, file)} sigue bloqueando la carga del branding con condiciones vacías: ${bloqueos.join(', ')}`
    );
  }
});

test('el branding prepara las plantillas con la raíz de la aplicación en GitHub Pages', () => {
  const brandScript = fs.readFileSync(path.join(root, 'assets', 'js', 'empresa-brand.js'), 'utf8');
  let onReady;
  const document = {
    baseURI: 'https://sistemacontableva.github.io/demo/',
    readyState: 'loading',
    addEventListener: function (event, callback) {
      if (event === 'DOMContentLoaded') onReady = callback;
    },
    querySelectorAll: function () { return []; },
    title: ''
  };
  const window = {
    location: {
      href: 'https://sistemacontableva.github.io/demo/',
      pathname: '/demo/'
    }
  };

  vm.runInNewContext(brandScript, { window, document, URL, console });
  assert.equal(typeof onReady, 'function', 'El branding debe esperar al DOM');
  const html = window.empresaBrand.preparePrintHtml('<html><head><title>Prueba</title></head><body></body></html>');

  assert.match(html, /<base href="https:\/\/sistemacontableva\.github\.io\/demo\/">/);
  assert.equal(
    window.empresaBrand.resolveAppUrl('assets/images/logomenu.png'),
    'https://sistemacontableva.github.io/demo/assets/images/logomenu.png',
    'El logo debe resolverse dentro de la carpeta publicada de la aplicación'
  );
});

test('las plantillas de impresión usan la raíz de la aplicación para el logo y recursos locales', () => {
  const files = listarTemplates();
  assert.ok(files.length > 0, 'Debe haber plantillas HTML para verificar');

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    assert.match(
      text,
      /<base href="\.\.\/\.\.\/\.\.\/">/i,
      `La plantilla ${path.relative(root, file)} debe resolver sus recursos desde la raíz de la aplicación cuando se abre directamente`
    );
    assert.doesNotMatch(
      text,
      /data-empresa-logo="\.\.\/\.\.\/\.\.\/assets\/images\/logomenu\.png"/i,
      `La plantilla ${path.relative(root, file)} no debe subir fuera de la raíz publicada para cargar el logo`
    );
  }

  const documentos = fs.readFileSync(path.join(root, 'administracion', 'js', 'documentos.js'), 'utf8');
  const oficina = fs.readFileSync(path.join(root, 'administracion', 'js', 'oficina.js'), 'utf8');
  const nomina = fs.readFileSync(path.join(root, 'promotores', 'js', 'nomina.js'), 'utf8');
  assert.match(documentos, /preparePrintHtml\(doc\)/, 'La generación de documentos administrativos debe ajustar la base al escribir un pop-up');
  assert.match(oficina, /preparePrintHtml\(html\)/, 'La impresión de relación de pago debe ajustar la base al escribir un pop-up');
  assert.match(nomina, /preparePrintHtml\(html\)/, 'La impresión de nómina de promotor debe ajustar la base al escribir un pop-up');
});

test('la landing, login y contabilidad diaria deben usar el nombre dinámico de empresa y no texto estático', () => {
  const landing = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const contabilidad = fs.readFileSync(path.join(root, 'coordinador', 'views', 'contabilidadDiaria.html'), 'utf8');
  const login = fs.readFileSync(path.join(root, 'administracion', 'views', 'login.tpl'), 'utf8');
  const shell = fs.readFileSync(path.join(root, 'administracion', 'views', 'shell.tpl'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'assets', 'js', 'app.js'), 'utf8');

  assert.match(landing, /data-empresa-nombre/i, 'La landing debe usar el atributo data-empresa-nombre');
  assert.doesNotMatch(landing, /<span[^>]*data-empresa-nombre[^>]*>\s*Óptica Visión de Águila\s*<\/span>/i, 'La landing no debe mantener una marca hardcodeada como texto visible');

  assert.match(contabilidad, /data-empresa-nombre/i, 'Contabilidad Diaria debe usar el atributo data-empresa-nombre');
  assert.doesNotMatch(contabilidad, /<h1[^>]*data-empresa-nombre[^>]*>\s*Óptica Visión de Águila\s*<\/h1>/i, 'Contabilidad Diaria no debe mantener el nombre hardcodeado');
  assert.doesNotMatch(contabilidad, /const datosIniciales\s*=\s*\[/i, 'Contabilidad Diaria no debe venir con promotores precargados en la fila inicial');
  assert.match(contabilidad, /PromotoresService\.getAll|obtenerPromotoresContabilidad\s*\(/i, 'Contabilidad Diaria debe reutilizar la lista centralizada de promotores');

  assert.match(login, /data-empresa-nombre/i, 'El login debe usar el atributo data-empresa-nombre');
  assert.doesNotMatch(login, /Óptica Visión de Águila/i, 'El login no debe mantener una marca hardcodeada');

  assert.match(shell, /data-empresa-nombre/i, 'El shell administrativo debe usar el atributo data-empresa-nombre');
  assert.doesNotMatch(shell, /<span[^>]*data-empresa-nombre[^>]*>\s*Óptica Visión de Águila\s*<\/span>/i, 'El shell administrativo no debe mantener la marca hardcodeada');

  assert.match(app, /assets\/js\/empresa-brand\.js/i, 'La app debe cargar el branding central cuando inyecta los módulos administrativos');
  assert.match(app, /if \(!window\.empresaBrand \|\| typeof window\.empresaBrand\.applyBrand !== 'function'\)/i, 'La app debe forzar la carga del branding antes de aplicar el nombre del cliente');
  assert.match(app, /window\.empresaBrand\.applyBrand\(\);/i, 'La app debe aplicar la marca después de cargar el branding en el login embebido');
});

test('el reset de contabilidad diaria debe limpiar los campos del coordinador y no volver a cargar valores por defecto', () => {
  const contabilidad = fs.readFileSync(path.join(root, 'coordinador', 'views', 'contabilidadDiaria.html'), 'utf8');

  assert.match(contabilidad, /function\s+restablecerContabilidad\s*\(/, 'Debe existir la función de reset de la contabilidad');
  assert.doesNotMatch(contabilidad, /campo\.value\s*=\s*'0';/i, 'El reset no debe escribir valores por defecto de 0 sobre los campos del coordinador');
  assert.doesNotMatch(contabilidad, /value="\d+\.\d+"/i, 'La plantilla del coordinador no debe traer valores precargados de contabilidad');
  assert.doesNotMatch(contabilidad, /id="global-fecha"[^>]*value="\d{4}-\d{2}-\d{2}"/i, 'La fecha de jornada debe empezar vacía');
  assert.doesNotMatch(contabilidad, /id="global-municipio"[^>]*value="[^"]+"/i, 'El municipio debe empezar vacío');
  assert.doesNotMatch(contabilidad, /id="global-coordinador"[^>]*value="[^"]+"/i, 'El coordinador debe empezar vacío');
  assert.ok(contabilidad.includes("document.getElementById('global-fecha').value = '';"), 'El reset debe limpiar la fecha');
  assert.ok(contabilidad.includes("document.getElementById('global-municipio').value = '';"), 'El reset debe limpiar el municipio');
  assert.ok(contabilidad.includes("document.getElementById('global-coordinador').value = '';"), 'El reset debe limpiar el coordinador');

  const inicioReset = contabilidad.indexOf('function restablecerContabilidad()');
  const finReset = contabilidad.indexOf("window.addEventListener('load'", inicioReset);
  assert.ok(inicioReset >= 0 && finReset > inicioReset, 'Debe existir un bloque de reset bien definido');
  const bloqueReset = contabilidad.slice(inicioReset, finReset);
  assert.ok(!bloqueReset.includes('mostrarModalBienvenidaContabilidad'), 'El reset no debe disparar la ventana de bienvenida');
  assert.match(bloqueReset, /limpiarResumenContabilidad\s*\(/, 'El reset debe llamar a la limpieza del resumen antes de volver a mostrar la bienvenida');
});

test('el menú lateral administrativo se puede contraer y expandir en escritorio', () => {
  const shell = fs.readFileSync(path.join(root, 'administracion', 'views', 'shell.tpl'), 'utf8');
  const styles = fs.readFileSync(path.join(root, 'administracion', 'styles', 'admin.css'), 'utf8');
  const router = fs.readFileSync(path.join(root, 'administracion', 'js', 'router.js'), 'utf8');

  assert.match(shell, /id="admin-sidebar-desktop-toggle"[\s\S]*aria-expanded="true"/, 'El menú debe incluir un control accesible para escritorio');
  assert.match(shell, /id="admin-sidebar-desktop-toggle"[\s\S]*Ocultar menú/, 'La barra superior debe tener el control de visibilidad del menú');
  assert.match(styles, /#admin-shell\.sidebar-collapsed #admin-sidebar\s*\{[\s\S]*width:\s*0[\s\S]*min-width:\s*0/, 'El estado contraído no debe ocupar espacio lateral');
  assert.match(styles, /#admin-sidebar-desktop-toggle\s*\{\s*display:\s*none;/, 'El control se oculta inicialmente hasta la regla de escritorio');
  assert.doesNotMatch(shell, /id="admin-sidebar-desktop-toggle"[\s\S]{0,80}<nav/, 'El botón no debe estar en el lateral junto al logo');
  assert.match(router, /function adminToggleSidebarDesktop\s*\(/, 'El control debe alternar el estado del menú lateral');
  assert.match(router, /sidebarToggle\.setAttribute\('aria-expanded'/, 'El estado accesible debe reflejar la expansión del menú');
});

test('el dashboard muestra licencia y vencimiento usando la versión central del sistema', () => {
  const dashboard = fs.readFileSync(path.join(root, 'administracion', 'js', 'dashboard.js'), 'utf8');
  const configuracion = fs.readFileSync(path.join(root, 'administracion', 'js', 'configuracion.js'), 'utf8');
  const configService = fs.readFileSync(path.join(root, 'administracion', 'services', 'configuracionService.js'), 'utf8');
  const auth = fs.readFileSync(path.join(root, 'administracion', 'config', 'auth.js'), 'utf8');
  const login = fs.readFileSync(path.join(root, 'administracion', 'views', 'login.tpl'), 'utf8');
  const loginScript = fs.readFileSync(path.join(root, 'administracion', 'js', 'login.js'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'assets', 'js', 'app.js'), 'utf8');
  const landing = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

  assert.match(dashboard, /_estadoChip\('Sistema Administrativo', 'Activo'/, 'El dashboard debe nombrar el sistema administrativo');
  assert.match(dashboard, /_estadoChip\('Estado de Licencia', licenciaEstaActiva \? 'Activo' : 'Inactivo'/, 'El estado de licencia debe ser dinámico');
  assert.match(dashboard, /localStorage\.getItem\('ks_lic_vence'\)/, 'El vencimiento debe usar la fecha real recibida al activar la licencia');
  assert.match(configuracion, /localStorage\.getItem\('ks_lic_vence'\)/, 'Configuración debe mostrar el vencimiento de licencia y no la expiración de sesión');
  assert.match(auth, /localStorage\.setItem\('ks_lic_vence', activacion\.license\.expires_at\)/, 'La fecha mostrada debe venir del vencimiento de licencia recibido al activar');
  assert.match(dashboard, /_estadoChip\('Versión', configuracion\.version/, 'El dashboard debe usar la versión del servicio de configuración');
  assert.match(app, /window\.ADMIN_VERSION = 'v1\.2 KG'/, 'Debe existir una versión central única');
  assert.match(configService, /version:\s*window\.ADMIN_VERSION/, 'Configuración debe leer la versión central');
  assert.match(login, /data-sistema-version/, 'El login debe reservar el valor de versión para rellenarlo dinámicamente');
  assert.match(loginScript, /loginVersion\.textContent = window\.ConfiguracionService\.obtener\(\)\.version/, 'El login debe usar la versión central');
  assert.match(app, /'administracion\/services\/configuracionService\.js',\s*'administracion\/js\/login\.js'/, 'El login debe cargar la configuración antes de inicializar la versión');
  assert.match(landing, /data-sistema-version/, 'La portada debe usar el mismo valor dinámico de versión');
  assert.match(app, /function actualizarVersionSistema\s*\(/, 'La aplicación debe rellenar los marcadores de versión dinámicamente');
  assert.doesNotMatch(dashboard + configService + login + landing, /v5\.0/, 'No debe quedar la versión anterior en las superficies del sistema');

  const fechas = vm.runInNewContext(dashboard + '\n[_dashFechaVencimientoLicencia(""), _dashFechaVencimientoLicencia("2026-10-15T23:59:59-05:00")]');
  assert.equal(fechas[0], 'No disponible', 'Un vencimiento ausente o nulo no debe mostrarse como una fecha válida');
  assert.match(fechas[1], /^\d{2}\/\d{2}\/\d{4}$/, 'La fecha ISO de vencimiento debe mostrarse como dd/mm/aaaa');
});

test('el mensaje para extender la licencia usa el nombre empresarial configurado, no el de la licencia', () => {
  const configuracion = fs.readFileSync(path.join(root, 'administracion', 'js', 'configuracion.js'), 'utf8');

  assert.match(configuracion, /var nombreEmpresa = config\.empresa \|\| 'la empresa'/, 'El nombre debe proceder del servicio de branding configurado');
  assert.doesNotMatch(configuracion, /ks_lic_cliente/, 'El nombre de empresa asociado a la licencia no debe sobrescribir la configuración');
  assert.match(configuracion, /para la empresa ' \+ nombreEmpresa \+ '\.'/, 'El mensaje debe interpolar el nombre configurado');
});
