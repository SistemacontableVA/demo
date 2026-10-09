const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

test('el menú conserva las rutas y muestra las categorías solicitadas en amarillo', () => {
  const shell = fs.readFileSync(path.join(root, 'administracion', 'views', 'shell.tpl'), 'utf8');
  const styles = fs.readFileSync(path.join(root, 'administracion', 'styles', 'admin.css'), 'utf8');
  const router = fs.readFileSync(path.join(root, 'administracion', 'js', 'router.js'), 'utf8');
  const categories = Array.from(shell.matchAll(/class="admin-menu-section admin-menu-section-highlight">([^<]+)<\/div>/g))
    .map(match => match[1]);

  assert.deepEqual(categories, [
    'Centro de Información',
    'Contabilidad de Campo',
    'Administración',
    'Jornadas de Atención',
    'Sistema'
  ]);
  assert.match(styles, /\.admin-menu-section-highlight\s*\{[^}]*color:\s*#f2c94c/i);
  for (const route of [
    'dashboard', 'documentos', 'catalogos', 'contabilidadDiaria', 'nominaPromotor',
    'ingresarNomina', 'cargaLentes', 'gerencia', 'oficina', 'reportes',
    'recordatorios', 'recordatorioMasivo', 'atencionMunicipios', 'configuracion'
  ]) {
    assert.equal((shell.match(new RegExp('data-ruta="' + route + '"', 'g')) || []).length, 1, `La ruta ${route} debe mantenerse una sola vez`);
    assert.match(router, new RegExp("'" + route + "'\\s*:"));
  }
  assert.match(shell, /data-ruta="dashboard"[\s\S]*?<span>Inicio<\/span>/);
  assert.match(shell, /data-ruta="gerencia"[\s\S]*?<span>Centro de Datos<\/span>/);
  assert.match(styles, /\.admin-menu-item\s*\{[^}]*padding:\s*9px 18px/s, 'La altura de las filas debe reducirse ligeramente');
  assert.match(shell, /data-ruta="reportes"[\s\S]*?<span>Reportes Generales<\/span>/);
});

test('Herramientas se registra como módulo administrativo exclusivo', () => {
  const router = fs.readFileSync(path.join(root, 'administracion', 'js', 'router.js'), 'utf8');
  const shell = fs.readFileSync(path.join(root, 'administracion', 'views', 'shell.tpl'), 'utf8');

  assert.match(router, /'gerencia':\s*\{\s*titulo:\s*'Centro de Datos'/);
  assert.match(router, /'Administrador': Object\.keys\(ADMIN_RUTAS\)/);
  assert.doesNotMatch(router, /ADMIN_RUTAS_(?:COORDINADOR|SECRETARIA|ATENCION|EJECUTIVO)\s*=\s*\[[^\]]*'gerencia'/);
  assert.match(shell, /data-ruta="gerencia" data-solo-admin="true"/);
});

test('el servicio Gerencia limita entradas a links HTTPS y mantiene operaciones por empresa', () => {
  const service = fs.readFileSync(path.join(root, 'administracion', 'services', 'gerenciaService.js'), 'utf8');

  assert.match(service, /var TABLE = 'gerencia_herramientas'/);
  assert.match(service, /tenant_id: 'eq\.' \+ context\.tenantId/);
  assert.match(service, /parsed\.protocol !== 'https:'/);
  assert.match(service, /async function (?:listar|crear|actualizar|eliminar)/);
});

test('la tabla Herramientas exige empresa y perfil Administrador en RLS', () => {
  const migration = fs.readFileSync(path.join(root, 'backend', 'supabase', 'migrations', '20261005160000_gerencia_herramientas.sql'), 'utf8');

  assert.match(migration, /create table if not exists public\.gerencia_herramientas/);
  assert.match(migration, /alter table public\.gerencia_herramientas enable row level security/);
  assert.match(migration, /private\.current_tenant_id\(\)/);
  assert.match(migration, /private\.has_role\(array\['Administrador'\]::text\[\]\)/);
  assert.match(migration, /for all\s+to authenticated/i);
});

test('la interfaz Herramientas presenta nombre, descripción, link e iframe en pestañas', () => {
  const module = fs.readFileSync(path.join(root, 'administracion', 'js', 'gerencia.js'), 'utf8');

  assert.match(module, /<h1 class="gm-title">Centro de Datos<\/h1>/);
  assert.match(module, /name="nombre"/);
  assert.match(module, /name="descripcion"/);
  assert.match(module, /name="link"/);
  assert.match(module, /document\.createElement\('iframe'\)/);
  assert.match(module, /frame\.title = 'Hoja de ' \+ tab\.nombre/);
  assert.match(module, /frame\.allowFullscreen = true/);
  assert.match(module, /frame\.hidden = true/);
  assert.match(module, /frame\.src = tab\.url/);
  assert.doesNotMatch(module, /frame\.referrerPolicy/);
  assert.doesNotMatch(module, /id="gm-tabs"/);
  assert.match(module, /function _gerenciaSelectTab/);
  assert.match(module, /data-gm-zoom/);
  assert.match(module, /data-gm-fullscreen/);
  assert.match(module, /linear-gradient\(110deg,#082c4a,#008a69\)/);
  assert.match(module, /\.gm-btn\.primary\{border-color:#008a69;background:#008a69;color:#fff\}/);
  assert.match(module, /adminRegistrarHojaAbierta\('gerencia'/);
  assert.match(module, /window\.__ksGerenciaTabs \|\| \[\]/);
});

test('los iframes de ambos módulos reciben un ancho de escritorio en pantallas móviles', () => {
  const css = fs.readFileSync(path.join(root, 'administracion', 'styles', 'admin.css'), 'utf8');

  assert.match(css, /@media \(max-width: 760px\) \{[\s\S]*?\.gm-frame,\s*\.atm-sheet-frame\s*\{\s*min-width:\s*980px;/);
});

test('las hojas abiertas permanecen accesibles desde la barra superior al cambiar de módulo', () => {
  const shell = fs.readFileSync(path.join(root, 'administracion', 'views', 'shell.tpl'), 'utf8');
  const router = fs.readFileSync(path.join(root, 'administracion', 'js', 'router.js'), 'utf8');
  const municipality = fs.readFileSync(path.join(root, 'atencionMunicipios', 'js', 'atencionMunicipios.js'), 'utf8');

  assert.match(shell, /id="admin-open-viewers"/);
  assert.match(shell, /data-empresa-nombre[\s\S]*?id="admin-open-viewers"[\s\S]*?Manual/);
  assert.match(shell, /id="admin-viewer-host"/);
  assert.ok(shell.indexOf('</header>') < shell.indexOf('id="admin-viewer-host"'));
  assert.ok(shell.indexOf('id="admin-viewer-host"') < shell.indexOf('<main id="admin-content"'));
  assert.match(router, /function adminMostrarHojaAbierta/);
  assert.match(router, /adminMostrarHojaAbierta\(item\.tipo, item\.id\)/);
  assert.match(router, /button\.textContent = item\.titulo/);
  assert.match(router, /className = 'admin-open-viewer-close'/);
  assert.match(router, /_gerenciaCloseTab\(item\.id\)/);
  assert.match(router, /_atencionMunicipiosCloseSheetTab\(item\.id\)/);
  assert.doesNotMatch(router, /Centro de Datos - |Atención Municipios - /);
  assert.doesNotMatch(municipality, /id="atm-tab-list"/);
  assert.match(router, /document\.querySelectorAll\('\[data-admin-viewer\]'\)/);
  assert.match(fs.readFileSync(path.join(root, 'administracion', 'js', 'gerencia.js'), 'utf8'), /getElementById\('admin-viewer-host'\)/);
  assert.match(municipality, /getElementById\('admin-viewer-host'\)/);
  assert.match(municipality, /adminRegistrarHojaAbierta\('atencionMunicipios'/);
  assert.match(municipality, /window\.__ksAtencionMunicipiosOpenTabs \|\| \[\]/);
});
