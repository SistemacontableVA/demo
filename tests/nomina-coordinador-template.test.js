const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const template = fs.readFileSync(
  path.join(__dirname, '..', 'administracion', 'documentos', 'templates', 'nomina_coordinador.html'),
  'utf8'
);

test('plantilla de coordinador no incluye datos de demostración ni renderiza una carga ausente', () => {
  assert.doesNotMatch(template, /defaultData|JUAN CARLOS CASTELLANO|La lagunilla|528,5/);
  assert.match(template, /id="hojaNomina" class="hoja" hidden/);
  assert.match(template, /id="accionesNomina".*hidden/);
  assert.match(template, /window\.__nominaData/);
  assert.match(template, /if \(!payload\) return/);
  assert.match(template, /typeof d\.nombreCoordinador !== "string"/);
  assert.match(template, /!Array\.isArray\(d\.jornadas\)/);
});

test('plantilla consume el contrato de nómina de coordinador del Apps Script', () => {
  [
    'nombreCoordinador',
    'brigadasCampo',
    'brigadasAtendidas',
    'brigadasRestantes',
    'valorLentesIndividual',
    'totalAsistencia',
    'cantidadAfiliacionesGrupales',
    'totalAfiliacionesGrupales',
    'lentesGrupalesVendidos',
    'comisionVentasGrupales',
    'saldoNomPromotor',
    'totalIngresos',
    'prestamosAdelantos',
    'descuentoComida',
    'totalDeducciones',
    'totalAPagar',
    'jornadas',
    'cantidadBrigadas',
    'asistidos',
    'lentes',
    'prestamoAbono',
    'valorDia',
    'comisionVenta',
    'detalle'
  ].forEach((nombreCampo) => assert.ok(template.includes(nombreCampo), `Falta ${nombreCampo}`));

  assert.doesNotMatch(template, /tbJornadas\.innerHTML|tr\.innerHTML/);
});

test('bibliotecas de exportación se cargan de forma diferida sin scripts CDN parser-blocking', () => {
  assert.doesNotMatch(template, /<script\s+src=["']https:\/\/cdn\.jsdelivr\.net/);
  assert.match(template, /function cargarHtml2Canvas\(\)/);
  assert.match(template, /function cargarJsPdf\(\)/);
  assert.match(template, /await cargarBibliotecasPdf\(\)/);
  assert.match(template, /await cargarHtml2Canvas\(\)/);
  assert.match(template, /script\.async = true/);
});

test('captura usa hasta 3x y limita tamaño de canvas en nóminas extensas', () => {
  assert.match(template, /const escalaMaxima = 3/);
  assert.match(template, /const dimensionMaxima = 30000/);
  assert.match(template, /const pixelesMaximos = 50000000/);
  assert.match(template, /scale: escala/);
});

test('scripts inline de la plantilla tienen sintaxis válida', () => {
  const scripts = Array.from(template.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi))
    .map((match) => match[1])
    .filter((source) => source.trim());

  assert.ok(scripts.length > 0);
  scripts.forEach((source, index) => {
    assert.doesNotThrow(() => new vm.Script(source), `Script inline ${index + 1}`);
  });
});
