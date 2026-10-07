const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');

const apiPath = path.join(root, 'assets', 'js', 'api-config.js');
const servicePath = path.join(root, 'coordinador', 'services', 'contabilidadDiariaService.js');
const promotoresServicePath = path.join(root, 'administracion', 'services', 'promotoresService.js');

test('la configuracion central ya no publica una URL de Apps Script para contabilidad', () => {
  const apiText = fs.readFileSync(apiPath, 'utf8');
  assert.doesNotMatch(apiText, /AKfycbxeNcVqxyVVKPDAWFjj1IQjx8O--o5tPwOL7OP0R5lPX5tDWD1cOlMAMARQl0DKL0Otgg/);
  assert.doesNotMatch(apiText, /contabilidad:\s*\{/i, 'Contabilidad ya no debe tener un endpoint de Google Apps Script');
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

test('la carga inicial muestra bienvenida y mantiene el flujo para abrir el historial de Supabase', () => {
  const view = fs.readFileSync(path.join(root, 'coordinador', 'views', 'contabilidadDiaria.html'), 'utf8');
  assert.match(view, /loadRemoteDraftHistory\s*\(/i, 'Debe intentar cargar el historial remoto primero');
  assert.match(view, /loadRemoteDraftByFecha\s*\(/i, 'Debe cargar el borrador remoto por la fecha seleccionada');
  const init = view.match(/window\.addEventListener\('load'[\s\S]*?\n  \}\);/);
  assert.ok(init, 'Debe inicializar la vista cuando el iframe termine de cargar');
  assert.match(init[0], /mostrarModalBienvenidaContabilidad\(\)/i, 'La bienvenida debe mostrarse en cada entrada al módulo');
  assert.doesNotMatch(init[0], /cerrarModalBienvenidaContabilidad/i, 'La bienvenida no debe cerrarse automáticamente al hallar una jornada remota');
  assert.match(view, /guardarBorradorContabilidad\s*\(/i, 'Debe seguir ejecutando el autoguardado local mientras se trabaja');
  assert.match(view, /guardarBorradorContabilidad\(false\)/i, 'El autosave debe guardar en silencio sin abrir la modal de estado');
  assert.match(view, /if \(mostrarFeedback\)\s*\{\s*mostrarEstadoContabilidad/i, 'La modal de feedback debe quedar restringida a acciones manuales');
});

test('la sincronizacion del boton guardar usa await dentro de una funcion asincrona', () => {
  const view = fs.readFileSync(path.join(root, 'coordinador', 'views', 'contabilidadDiaria.html'), 'utf8');
  assert.match(view, /async function guardarYSincronizarContabilidad\s*\(\)\s*\{/i);
  assert.match(view, /const respuesta = await window\.ContabilidadDiariaService\.syncDraft\(draft\)/i);
});

test('todos los scripts inline de la vista se pueden interpretar', () => {
  const view = fs.readFileSync(path.join(root, 'coordinador', 'views', 'contabilidadDiaria.html'), 'utf8');
  const scripts = Array.from(view.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi))
    .map((match) => match[1])
    .filter((script) => script.trim());

  assert.ok(scripts.length > 0, 'La vista debe contener scripts inline');
  scripts.forEach((script) => new vm.Script(script));
});

test('la lista de promotores prioriza el servicio compartido del portal', () => {
  const view = fs.readFileSync(path.join(root, 'coordinador', 'views', 'contabilidadDiaria.html'), 'utf8');
  assert.match(view, /const contextos = \[window\.parent, window\.top, window\]/i);
  assert.match(view, /servicio\.getAll\(\{\s*force:\s*true\s*\}\)/i);
  assert.match(view, /select\.innerHTML = buildPromotorOptions\(currentValue\)/i);
});

test('el servicio de promotores rechaza el error de Apps Script en lugar de devolver una lista vacia', async () => {
  const source = fs.readFileSync(promotoresServicePath, 'utf8');
  const context = {
    window: { API_URL: 'https://script.google.com/macros/s/test/exec' },
    fetch: async () => ({
      ok: true,
      json: async () => ({ ok: false, error: 'Acción no reconocida: listar-promotores' })
    }),
    AbortController,
    setTimeout,
    clearTimeout,
    Promise,
    Date
  };
  vm.runInNewContext(source, context);

  await assert.rejects(
    context.PromotoresService.getAll({ force: true }),
    /Acción no reconocida: listar-promotores/
  );
});

test('el servicio de contabilidad usa RPC autenticado de Supabase, no Apps Script', () => {
  const serviceText = fs.readFileSync(servicePath, 'utf8');
  const view = fs.readFileSync(path.join(root, 'coordinador', 'views', 'contabilidadDiaria.html'), 'utf8');
  assert.match(serviceText, /rest\/v1\/rpc\//i, 'Las operaciones remotas deben usar RPC de Supabase');
  assert.match(serviceText, /contabilidad_diaria_guardar/i);
  assert.match(serviceText, /Authorization:\s*'Bearer '\s*\+\s*context\.token/i, 'Las solicitudes deben usar la sesión autenticada');
  assert.doesNotMatch(serviceText, /script\.google\.com/i, 'El servicio no debe llamar a Apps Script');
  assert.doesNotMatch(view, /script\.google\.com|API_URL_CONTABILIDAD/i, 'La vista no debe configurar ni invocar Apps Script');
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

test('el cierre confirmado transiciona la jornada en Supabase', () => {
  const view = fs.readFileSync(path.join(root, 'coordinador', 'views', 'contabilidadDiaria.html'), 'utf8');

  assert.match(view, /mostrarConfirmacionCierreContabilidad\(\)/i, 'El botón principal debe abrir la confirmación de cierre');
  assert.match(view, /onclick="cerrarContabilidad\(\)">Confirmar cierre/i, 'La modal debe confirmar el cierre mediante una acción explícita');
  assert.match(view, /cambiarEstado\(validado\.draft\.id,\s*['"]cerrada['"]\)/i, 'La confirmación debe cambiar el estado en el servidor');
  assert.match(view, /cambiarEstado\(saved\.draft\.id,\s*['"]pendiente_de_validacion['"]\)/i, 'El coordinador debe enviar la jornada a validación antes del cierre');
});

test('la migracion crea tablas por tenant, permisos RLS, auditoria y RPC de resumen', () => {
  const migration = fs.readFileSync(path.join(root, 'backend', 'supabase', 'migrations', '20261006120000_contabilidad_diaria.sql'), 'utf8');
  assert.match(migration, /create table if not exists public\.contabilidad_diaria_jornadas/i);
  assert.match(migration, /create table if not exists public\.contabilidad_diaria_afiliaciones/i);
  assert.match(migration, /create table if not exists public\.contabilidad_diaria_gastos/i);
  assert.match(migration, /create table if not exists public\.contabilidad_diaria_auditoria/i);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /private\.current_tenant_id\(\)/i);
  assert.match(migration, /private\.has_role\(array\['Administrador', 'Ejecutivo'\]/i);
  assert.match(migration, /create or replace function public\.contabilidad_diaria_resumen/i);
  assert.match(migration, /create or replace function public\.contabilidad_diaria_guardar/i);
});

test('la migracion recalcula los totales y el saldo final en Supabase', () => {
  const migration = fs.readFileSync(path.join(root, 'backend', 'supabase', 'migrations', '20261006120000_contabilidad_diaria.sql'), 'utf8');

  assert.match(migration, /v_ingresos :=/i);
  assert.match(migration, /v_deduccion :=/i);
  assert.match(migration, /v_egresos :=/i);
  assert.match(migration, /v_saldo_final := v_saldo_inicial \+ v_ingresos - v_deduccion - v_egresos/i);
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
  const migration = fs.readFileSync(path.join(root, 'backend', 'supabase', 'migrations', '20261006120000_contabilidad_diaria.sql'), 'utf8');

  assert.match(view, /detalle:\s*\{/i);
  assert.match(view, /expense-description/i);
  assert.match(view, /hotel:\s*\{[\s\S]*moneda:[\s\S]*tasa:/i);
  assert.match(service, /detalle:\s*\{\}/i);
  assert.match(migration, /payload jsonb not null/i);
  assert.match(migration, /extras jsonb not null/i);
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

test('restaurar la jornada conserva los gastos extra sin sobrescribir gastos varios', () => {
  const view = fs.readFileSync(path.join(root, 'coordinador', 'views', 'contabilidadDiaria.html'), 'utf8');
  const restauracion = view.match(/const contenedorGastosExtra[\s\S]*?const detalle = draft\.detalle/);

  assert.ok(restauracion, 'Debe existir el bloque de restauración de gastos adicionales');
  assert.match(restauracion[0], /querySelectorAll\('\.extra-expense-row'\)\[index\]/i);
  assert.doesNotMatch(restauracion[0], /getElementById\('gasto-varios'\)\.value\s*=\s*monto/i);
});

test('la migracion conserva el detalle y los gastos adicionales en JSONB', () => {
  const migration = fs.readFileSync(path.join(root, 'backend', 'supabase', 'migrations', '20261006120000_contabilidad_diaria.sql'), 'utf8');

  assert.match(migration, /payload jsonb not null/i);
  assert.match(migration, /extras jsonb not null default '\[\]'::jsonb/i);
  assert.match(migration, /v_payload := p_payload \|\| jsonb_build_object/i);
});
