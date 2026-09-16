const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

const apiPath = path.join(root, 'assets', 'js', 'api-config.js');
const servicePath = path.join(root, 'coordinador', 'services', 'contabilidadDiariaService.js');

test('la configuracion central usa la URL publicada del web app de Google', () => {
  const apiText = fs.readFileSync(apiPath, 'utf8');
  assert.match(apiText, /AKfycbx0TmhFFf_LRpXiLEzI_Rso0WjteO2pNvSg-_iQuC69Mre6M3Hwmdvz0n3FIWcML5EOHQ/);
  assert.match(apiText, /contabilidad:\s*\{/i, 'Debe existir una API independiente para contabilidad');
  assert.doesNotMatch(apiText, /ApiConfig\.nomina\.baseUrl\.replace\(\/\\\/\$\/\s*\)/i, 'La contabilidad no debe reutilizar la baseUrl de nómina');
});

test('existe un servicio local de borrador para contabilidad diaria', () => {
  const exists = fs.existsSync(servicePath);
  assert.equal(exists, true, 'Debe existir el servicio de borrador de contabilidad');

  if (exists) {
    const text = fs.readFileSync(servicePath, 'utf8');
    assert.match(text, /localStorage/i, 'El servicio debe guardar en localStorage');
    assert.match(text, /loadDraft|saveDraft|syncDraft|clearDraft/i, 'El servicio debe exponer guardar, cargar, sincronizar y limpiar el borrador');
  }
});

test('el borrador conserva la estructura de gastos y totales al serializarse', () => {
  const source = fs.readFileSync(servicePath, 'utf8');
  assert.match(source, /base\.gastos\s*=\s*\(|gastos && typeof base\.gastos === 'object'/i, 'Debe mantener la estructura de gastos como objeto en el payload normalizado');
  assert.match(source, /base\.totales\s*=\s*\(base\.totales && typeof base\.totales === 'object'/i, 'Debe conservar los totales del borrador');
});

test('la carga inicial prioriza Google Sheets sobre el borrador local y mantiene el autoguardado', () => {
  const view = fs.readFileSync(path.join(root, 'coordinador', 'views', 'contabilidadDiaria.html'), 'utf8');
  assert.match(view, /loadRemoteDraftHistory\s*\(/i, 'Debe intentar cargar el historial remoto primero');
  assert.match(view, /loadRemoteDraftByFecha\s*\(/i, 'Debe cargar el borrador remoto por la fecha seleccionada');
  assert.doesNotMatch(view, /restaurarBorradorContabilidad\(\);\s*\n\s*if \(!draftRestaurado\)/i, 'La carga inicial no debe depender del borrador local antes del remoto');
  assert.match(view, /guardarBorradorContabilidad\s*\(/i, 'Debe seguir ejecutando el autoguardado local mientras se trabaja');
  assert.match(view, /guardarBorradorContabilidad\(false\)/i, 'El autosave debe guardar en silencio sin abrir la modal de estado');
  assert.match(view, /if \(mostrarFeedback\)\s*\{\s*mostrarEstadoContabilidad/i, 'La modal de feedback debe quedar restringida a acciones manuales');
});

test('el servicio de contabilidad usa su propia URL y no la API de nomina', () => {
  const serviceText = fs.readFileSync(servicePath, 'utf8');
  const view = fs.readFileSync(path.join(root, 'coordinador', 'views', 'contabilidadDiaria.html'), 'utf8');
  assert.match(serviceText, /API_URL_CONTABILIDAD|ApiConfig\.contabilidad/i, 'Debe existir una URL explícita para contabilidad');
  assert.doesNotMatch(serviceText, /window\.API_URL\s*&&\s*typeof window\.API_URL === 'string'\s*\?\s*window\.API_URL/i, 'No debe reutilizar window.API_URL para la contabilidad');
  assert.doesNotMatch(view, /window\.API_URL\s*=\s*apiUrl/i, 'La contabilidad no debe sobreescribir la API global de nómina');
});

test('la carga remota por fecha normaliza la fecha ISO antes de comparar', () => {
  const source = fs.readFileSync(servicePath, 'utf8');
  assert.match(source, /loadRemoteDraftByFecha:\s*async\s*function\s*\(fecha\)\s*\{[\s\S]*normalizarFechaClave\s*\(/i, 'Debe normalizar la fecha del elemento remoto y la fecha seleccionada antes de comparar');
});

test('la vista no duplica ids de metadatos y valida antes de sincronizar', () => {
  const view = fs.readFileSync(path.join(root, 'coordinador', 'views', 'contabilidadDiaria.html'), 'utf8');
  const fechaMatches = (view.match(/id="global-fecha"/g) || []).length;
  const municipioMatches = (view.match(/id="global-municipio"/g) || []).length;
  const coordinadorMatches = (view.match(/id="global-coordinador"/g) || []).length;

  assert.equal(fechaMatches, 1, 'No debe haber IDs duplicados para la fecha');
  assert.equal(municipioMatches, 1, 'No debe haber IDs duplicados para el municipio');
  assert.equal(coordinadorMatches, 1, 'No debe haber IDs duplicados para el coordinador');
  assert.match(view, /if \(!draft\.fecha\s*\|\|\s*!draft\.municipio\s*\|\|\s*!draft\.coordinador\)/i, 'Debe validar que la fecha, municipio y coordinador estén completos antes de sincronizar');
});

test('al cargar un borrador la modal se cierra sin reiniciar la jornada', () => {
  const view = fs.readFileSync(path.join(root, 'coordinador', 'views', 'contabilidadDiaria.html'), 'utf8');

  assert.match(view, /cerrarModalCargaBorradoresContabilidad\s*\(\s*true\s*\)/i, 'El cancelar debe reabrir la pantalla de bienvenida');
  assert.match(view, /modalCarga\.classList\.remove\('visible'\)\s*;\s*modalCarga\.classList\.add\('hidden'\)/i, 'La confirmación debe cerrar la modal de borradores sin dejarla visible');
});

test('la jornada tiene cierre de validacion y un reporte visible para el administrador', () => {
  const view = fs.readFileSync(path.join(root, 'coordinador', 'views', 'contabilidadDiaria.html'), 'utf8');

  assert.match(view, /Validar cierre/i, 'Debe existir la acción de validación del cierre');
  assert.match(view, /Cerrar contabilidad/i, 'Debe existir la acción para cerrar la contabilidad');
  assert.match(view, /pendiente_de_validacion|validada|cerrada/i, 'Debe existir un estado claro para la jornada');
  assert.match(view, /generarResumenCierreContabilidad|renderResumenCierreContabilidad/i, 'Debe existir un resumen exportable del cierre para la administración');
});

test('la vista administrativa para contabilidad carga una selección independiente de la plantilla del coordinador', () => {
  const router = fs.readFileSync(path.join(root, 'administracion', 'js', 'router.js'), 'utf8');
  const adminFile = path.join(root, 'administracion', 'js', 'contabilidadAdmin.js');

  assert.match(router, /administracion\/js\/contabilidadAdmin\.js/i, 'El router del admin debe apuntar a un módulo independiente de contabilidad');
  assert.equal(fs.existsSync(adminFile), true, 'Debe existir un módulo de administración para cargar contabilidad guardada');

  if (fs.existsSync(adminFile)) {
    const adminText = fs.readFileSync(adminFile, 'utf8');
    assert.match(adminText, /seleccion.*fecha|fecha.*contabilidad|cargar.*contabilidad|historial.*contabilidad/i, 'El módulo administrativo debe permitir elegir una fecha y cargar la contabilidad guardada');
    assert.doesNotMatch(adminText, /fetch\(['"]coordinador\/views\/contabilidadDiaria\.tpl/i, 'El módulo de admin no debe reutilizar la plantilla de captura del coordinador');
  }
});

test('el router carga la vista correcta segun el perfil', () => {
  const router = fs.readFileSync(path.join(root, 'administracion', 'js', 'router.js'), 'utf8');

  assert.match(router, /perfilActual === 'Coordinador'[\s\S]*coordinador\/js\/contabilidadDiaria\.js/i, 'El coordinador debe cargar su plantilla de captura');
  assert.match(router, /perfilActual === 'Coordinador'[\s\S]*administracion\/js\/contabilidadAdmin\.js/i, 'La ruta debe contemplar la vista administrativa independiente');
  assert.doesNotMatch(router, /contabilidadDiaria': \{ titulo: 'Contabilidad Diaria', scripts: \['coordinador\/services\/contabilidadDiariaService\.js', 'administracion\/js\/contabilidadAdmin\.js'\]/i, 'La ruta no debe tener una única vista fija para todos los perfiles');
});

test('la modal de cierre confirma el cambio de estado y no solo cierra la ventana', () => {
  const view = fs.readFileSync(path.join(root, 'coordinador', 'views', 'contabilidadDiaria.html'), 'utf8');

  assert.match(view, /mostrarConfirmacionCierreContabilidad\(\)/i, 'El botón principal debe abrir la confirmación de cierre');
  assert.match(view, /onclick="cerrarContabilidad\(\)">Confirmar cierre/i, 'La modal debe confirmar el cierre mediante una acción explícita');
  assert.match(view, /draftCerrado\.estado\s*=\s*['"]cerrada['"]/i, 'La confirmación debe cambiar el estado a cerrada');
  assert.match(view, /syncDraft\(draftCerrado\)/i, 'El cierre confirmado debe sincronizarse con Google Sheets');
});

test('la lectura remota reconstruye gastos, totales y saldo final', () => {
  const backend = fs.readFileSync(path.join(root, 'backend', 'Codigocontrabilidaddiaria.gs'), 'utf8');

  assert.match(backend, /gastos\.totalEgresos\s*=\s*Number\(rowGasto\[11\]/i);
  assert.match(backend, /gastos\.totalDeduccion\s*=\s*Number\(rowGasto\[12\]/i);
  assert.match(backend, /gastos\.totalIngresos\s*=\s*Number\(rowGasto\[13\]/i);
  assert.match(backend, /saldoFinal:\s*saldoInicial\s*\+\s*totalIngresos\s*-\s*totalDeduccion\s*-\s*totalEgresos/i);
});

test('administracion muestra la suma de afiliaciones y el nombre del promotor', () => {
  const admin = fs.readFileSync(path.join(root, 'administracion', 'js', 'contabilidadAdmin.js'), 'utf8');
  const view = fs.readFileSync(path.join(root, 'coordinador', 'views', 'contabilidadDiaria.html'), 'utf8');

  assert.match(admin, /totalAfiliaciones\s*=\s*afiliaciones\.reduce/i, 'El resumen debe sumar las afiliaciones de cada fila');
  assert.match(admin, /fila\.asesor\s*\|\|\s*fila\.promotor\s*\|\|\s*fila\.nombre/i, 'Debe mostrar el nombre aunque llegue con un alias');
  assert.match(view, /selectedOptions\[0\].*textContent/i, 'El snapshot debe conservar el texto visible del promotor seleccionado');
});

test('la contabilidad conserva el detalle de gastos, monedas y cenas por promotor', () => {
  const view = fs.readFileSync(path.join(root, 'coordinador', 'views', 'contabilidadDiaria.html'), 'utf8');
  const service = fs.readFileSync(servicePath, 'utf8');
  const admin = fs.readFileSync(path.join(root, 'administracion', 'js', 'contabilidadAdmin.js'), 'utf8');
  const backend = fs.readFileSync(path.join(root, 'backend', 'Codigocontrabilidaddiaria.gs'), 'utf8');

  assert.match(view, /detalle:\s*\{/i);
  assert.match(view, /expense-description/i);
  assert.match(view, /hotel:\s*\{[\s\S]*moneda:[\s\S]*tasa:/i);
  assert.match(service, /detalle:\s*\{\}/i);
  assert.match(backend, /JSON\.stringify\(payload\.detalle/i);
  assert.match(admin, /Cenas ganadas por promotor/i);
  assert.match(admin, /detalleGastos\.hotel|detalleGastos\.varios/i);
});

test('la plantilla captura todos los campos manuales y gastos adicionales dinámicos', () => {
  const view = fs.readFileSync(path.join(root, 'coordinador', 'views', 'contabilidadDiaria.html'), 'utf8');

  assert.match(view, /saldo-inicial-origen/i);
  assert.match(view, /gasto-comida-coor-detalle/i);
  assert.match(view, /gasto-desayunos-detalle/i);
  assert.match(view, /gasto-varios-detalle/i);
  assert.match(view, /extra-expense-row[\s\S]*numero:/i);
  assert.match(view, /detalle:\s*\{[\s\S]*saldoInicialOrigen/i);
  assert.match(view, /detalle\.sald[o]?InicialOrigen/i);
});

test('Apps Script guarda extras como JSON y mantiene compatibilidad con el formato anterior', () => {
  const backend = fs.readFileSync(path.join(root, 'backend', 'Codigocontrabilidaddiaria.gs'), 'utf8');

  assert.match(backend, /JSON\.stringify\(gastos\.extra\)/i);
  assert.match(backend, /JSON\.parse\(extraGuardado\)/i);
  assert.ok(backend.includes("extraGuardado.split(';')"), 'Debe poder leer extras guardados con el separador legado');
  assert.match(backend, /detalle:\s*gastos\.detalle/i);
});
