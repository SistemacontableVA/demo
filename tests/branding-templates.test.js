const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

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
  const finReset = contabilidad.indexOf('window.onload = function ()');
  assert.ok(inicioReset >= 0 && finReset > inicioReset, 'Debe existir un bloque de reset bien definido');
  const bloqueReset = contabilidad.slice(inicioReset, finReset);
  assert.ok(!bloqueReset.includes('mostrarModalBienvenidaContabilidad'), 'El reset no debe disparar la ventana de bienvenida');
  assert.match(bloqueReset, /limpiarResumenContabilidad\s*\(/, 'El reset debe llamar a la limpieza del resumen antes de volver a mostrar la bienvenida');
});
