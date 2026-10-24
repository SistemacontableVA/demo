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
    'desempenoCoordinacion', 'nominaCoordinador', 'recordatorios', 'recordatorioMasivo', 'atencionMunicipios', 'configuracion'
  ]) {
    assert.equal((shell.match(new RegExp('data-ruta="' + route + '"', 'g')) || []).length, 1, `La ruta ${route} debe mantenerse una sola vez`);
    assert.match(router, new RegExp("'" + route + "'\\s*:"));
  }
  assert.match(shell, /data-ruta="dashboard"[\s\S]*?<span>Inicio<\/span>/);
  assert.match(shell, /data-ruta="gerencia"[\s\S]*?<span>Centro de Datos<\/span>/);
  assert.match(shell, /data-ruta="desempenoCoordinacion" data-solo-admin="true"[\s\S]*?<span>Desempeño Coordinación<\/span>/);
  assert.match(shell, /data-ruta="nominaCoordinador" data-solo-admin="true"[\s\S]*?<span>Nómina Coordinador<\/span>/);
  assert.match(styles, /\.admin-menu-item\s*\{[^}]*padding:\s*9px 18px/s, 'La altura de las filas debe reducirse ligeramente');
  assert.match(shell, /data-ruta="reportes"[\s\S]*?<span>Reportes Generales<\/span>/);
});

test('la sección Administración presenta los módulos en el orden solicitado', () => {
  const shell = fs.readFileSync(path.join(root, 'administracion', 'views', 'shell.tpl'), 'utf8');
  const seccionAdmin = shell.split('>Administración</div>')[1].split('>Jornadas de Atención</div>')[0];
  const rutas = Array.from(seccionAdmin.matchAll(/data-ruta="([^"]+)"/g)).map(match => match[1]);

  assert.deepEqual(rutas, [
    'gerencia',
    'reportes',
    'desempenoCoordinacion',
    'promotores',
    'politicasContabilidad',
    'oficina'
  ]);
  assert.match(seccionAdmin, /data-ruta="promotores" data-solo-admin="true"/);
  assert.match(seccionAdmin, /data-ruta="politicasContabilidad" data-solo-admin="true"/);
});

test('Herramientas se registra como módulo administrativo exclusivo', () => {
  const router = fs.readFileSync(path.join(root, 'administracion', 'js', 'router.js'), 'utf8');
  const shell = fs.readFileSync(path.join(root, 'administracion', 'views', 'shell.tpl'), 'utf8');

  assert.match(router, /'gerencia':\s*\{\s*titulo:\s*'Centro de Datos'/);
  assert.match(router, /'Administrador': Object\.keys\(ADMIN_RUTAS\)/);
  assert.doesNotMatch(router, /ADMIN_RUTAS_(?:COORDINADOR|SECRETARIA|ATENCION|EJECUTIVO)\s*=\s*\[[^\]]*'gerencia'/);
  assert.match(shell, /data-ruta="gerencia" data-solo-admin="true"/);
  assert.match(router, /'desempenoCoordinacion':\s*\{\s*titulo:\s*'Desempeño Coordinación',\s*scripts:\s*\['coordinador\/services\/contabilidadDiariaService\.js', 'administracion\/js\/desempenoCoordinacion\.js'\]\s*\}/);
  assert.doesNotMatch(router, /ADMIN_RUTAS_(?:COORDINADOR|SECRETARIA|ATENCION|EJECUTIVO)\s*=\s*\[[^\]]*'desempenoCoordinacion'/);
  assert.match(router, /'nominaCoordinador':\s*\{\s*titulo:\s*'Nómina Coordinador',\s*scripts:\s*\['coordinador\/services\/contabilidadDiariaService\.js', 'administracion\/js\/nominaCoordinador\.js'\]\s*\}/);
  assert.doesNotMatch(router, /ADMIN_RUTAS_(?:COORDINADOR|SECRETARIA|ATENCION|EJECUTIVO)\s*=\s*\[[^\]]*'nominaCoordinador'/);
  assert.match(router, /'Administrador': Object\.keys\(ADMIN_RUTAS\)/);
});

test('Nómina Coordinador integra consulta, edición, carga manual y precarga explícita', () => {
  const module = fs.readFileSync(path.join(root, 'administracion', 'js', 'nominaCoordinador.js'), 'utf8');
  const adminStyles = fs.readFileSync(path.join(root, 'administracion', 'styles', 'admin.css'), 'utf8');
  const backend = fs.readFileSync(path.join(root, 'backend', 'Código Nomina.gs'), 'utf8');
  for (const field of [
    'municipio', 'fecha', 'cantidadAfiliacionesGrupales', 'cantidadBrigadas', 'asistidos',
    'lentes', 'prestamoAbono', 'descuentoComida', 'detalle'
  ]) assert.match(module, new RegExp("key: '" + field + "'"));
  assert.match(module, /estado\)\.toLowerCase\(\)\)\s*!== -1/);
  assert.match(module, /loadRemoteDraftByFecha/);
  assert.match(module, /fecha: fechaInput\(cierreCompleto\.fecha\)/);
  assert.match(module, /municipio: texto\(cierreCompleto\.municipio\)/);
  assert.match(module, /cantidadAfiliacionesGrupales: String\(totalAff\)/);
  assert.match(module, /nomina-coordinador-plantilla/);
  assert.match(module, /nomina_coordinador_vista\.html/);
  assert.match(module, /nomina_coordinador\.html/);
  assert.match(module, /habilitarEdicionEnPlantilla/);
  assert.match(module, /dataset\.accionNomina = nueva \? 'guardar-nuevo' : 'guardar-fila'/);
  assert.match(module, /dataset\.accionNomina = 'eliminar-fila'/);
  assert.match(module, /async function eliminarJornada\(jornada, boton\)/);
  assert.match(module, /^  async function eliminarJornada\(jornada, boton\)/m, 'La eliminación debe estar en el ámbito del módulo');
  assert.match(module, /action: 'eliminar-jornada-coordinador'/);
  assert.match(module, /id="nomina-coordinador-ingreso-manual"[^>]*>Ingreso manual/);
  assert.match(module, /for \(var indice = 0; indice < 12; indice\+\+\) fila\.insertCell\(-1\)/);
  assert.match(module, /var fila = cuerpo\.insertRow\(-1\)/);
  assert.match(module, /botonVerNomina\.addEventListener\('click', mostrarPlantillaOficial\)/);
  assert.match(module, /global\.open\('', '_blank'\)/);
  assert.match(module, /ventana\.document\.write\(html\)/);
  assert.doesNotMatch(module, /nomina-coordinador-modal/);
  assert.match(module, /var primerCampo = fila\.cells\[0\] && fila\.cells\[0\]\.querySelector\('\[data-campo="municipio"\]'\)/);
  assert.match(module, /function sumarAfiliaciones\(cierre\)/);
  assert.match(module, /async function seleccionarCierre\(\)/);
  assert.match(module, /var completo = await cargarDetalleCierre\(cierre\.fecha\)/);
  assert.match(module, /botonConsultar\.textContent = 'Cargando\.\.\.'/);
  assert.match(module, /botonConsultar\.textContent = 'Consultar nómina'/);
  assert.doesNotMatch(module, /mostrarMensaje\('Se cargaron '/);
  assert.match(module, /class="nomina-coordinador-toolbar mb-4"/);
  assert.match(module, /class="nomina-coordinador-coordinador-card/);
  assert.match(module, /class="nomina-coordinador-preload-card/);
  assert.doesNotMatch(module, /Precargar cierre:/);
  assert.match(module, /Consulta una nómina primero/);
  assert.match(adminStyles, /\.nomina-coordinador-toolbar \{\s*display: grid;\s*grid-template-columns: minmax\(0, 2fr\) minmax\(0, 3fr\);/);
  assert.match(adminStyles, /\.nomina-coordinador-cierre-select \{\s*width: 210px;/);
  assert.match(module, /if \(!nueva && originalNormalizado === valor\) return/);
  assert.doesNotMatch(module, /key: 'valorDia'/);
  assert.doesNotMatch(module, /var totalAff = \(Array\.isArray\(cierre\.afiliaciones\)/);
  assert.match(module, /texto\(cierre\.coordinador \|\| 'Sin coordinador'\)/);
  assert.doesNotMatch(module, /coordinadorActual\.nombreCoordinador\)\.trim\(\)\.toLocaleLowerCase/);
  assert.match(module, /'agregar-jornada-coordinador'/);
  assert.match(module, /'editar-jornada-coordinador'/);
  assert.match(module, /opciones\.method = 'POST'/);
  assert.doesNotMatch(module, /ks_admin_token|ks_lic_token/);
  assert.doesNotMatch(backend, /validarSesionAdminNominaCoordinador|functions\/v1\/validate-access/);
  assert.match(backend, /fila: indiceFila \+ 14/);
  assert.match(backend, /getRange\(filaDestinoCoordinador, cambio\.columna\)\.setValue/);
  assert.match(backend, /Valor por Día y Comisión por Venta se calculan en la hoja y no pueden editarse/);
  assert.match(backend, /comisionVenta/);
  assert.match(backend, /getRange\(filaDestinoCoordinador, 11, 1, 2\)\.clearContent\(\)/);
  assert.match(backend, /getRange\(filaDestinoCoordinador, 2, 1, 7\)\.clearContent\(\)/);
  assert.match(backend, /ni alterar las fórmulas de Valor por Día o Comisión por Venta/);
  assert.match(backend, /getRange\(filaDestinoCoordinador, 3\)\.setNumberFormat\("dd\/MM\/yyyy"\)/);
  assert.match(backend, /La jornada cambió desde que fue cargada/);

  const template = fs.readFileSync(path.join(root, 'administracion', 'documentos', 'templates', 'nomina_coordinador_vista.html'), 'utf8');
  assert.match(template, /id="kpiBrigCampo"/);
  assert.match(template, /id="ingTotalIngresos"/);
  assert.match(template, /id="dedTotalDeducciones"/);
  assert.match(template, /id="resumenGeneral"/);
  assert.match(template, /id="nomina-coordinador-ver-oficial"[^>]*disabled>Ver Nómina/);
  assert.match(template, /\.ver-nomina \{\s*padding: 6px 13px;\s*border: 1px solid #059669;/);
  assert.match(template, /background: #059669;\s*font: 700 12px/);
  assert.match(template, /boton\.textContent = "Editar fila"/);
  assert.match(template, /jornada\.valorDia/);
  assert.match(template, /moneda\(jornada\.comisionVenta\), "formula"/);
  assert.match(template, /"formula"/);
  assert.doesNotMatch(template, /type="number"[^>]*valorDia/);
  assert.match(template, /<div class="resumen-linea" aria-label="Indicadores y totales">/);
  assert.match(template, /<span class="dato-resumen pago"><span>Total a pagar<\/span><strong id="resumenGeneral"><\/strong><\/span>/);
  assert.match(template, /\.dato-resumen span \{ color: #dce9ec; font-size: 13px; font-weight: 400; \}/);
  assert.match(template, /\.dato-resumen strong \{ color: #fff; font-size: 21px; font-weight: 500; letter-spacing: \.04em; \}/);
  assert.match(template, /\.dato-resumen \{ display: inline-flex; align-items: baseline; gap: 10px;/);
  assert.doesNotMatch(template, /class="tarjeta/);
  assert.match(template, /th \{ position: sticky; top: 0;/);
  assert.match(template, /\.tabla-scroll \{ height: calc\(100vh - 165px\); min-height: 300px; overflow: auto; \}/);
  assert.match(template, /\.hoja \{ width: 100%; margin: 0 auto; \}/);
  assert.match(template, /table \{ width: 100%; min-width: 1060px; border-collapse: collapse; table-layout: fixed; font-size: 12px; \}/);
  assert.match(template, /td \{ padding: 3px 4px;/);
  assert.match(module, /nomina-coordinador-page-heading/);
  assert.match(adminStyles, /\.nomina-coordinador-page-heading \{/);
  assert.match(template, /font-size: 12px; text-align: center; \}/);
  assert.match(template, /td \{ padding: 3px 4px;/);
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
