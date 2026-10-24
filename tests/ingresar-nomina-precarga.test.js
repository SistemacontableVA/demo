const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'administracion', 'js', 'ingresarNomina.js'), 'utf8');
const router = fs.readFileSync(path.join(root, 'administracion', 'js', 'router.js'), 'utf8');

function cargarModulo(perfil) {
  const context = {
    getPerfilAdmin: () => perfil,
    document: {},
    console
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(source, context);
  return context;
}

test('la precarga solo se muestra al Administrador y el router carga su servicio de contabilidad', () => {
  const admin = cargarModulo('Administrador');
  const secretaria = cargarModulo('Secretaria');

  assert.match(admin._inShellHtml(), /Precargar desde Contabilidad/);
  assert.doesNotMatch(secretaria._inShellHtml(), /Precargar desde Contabilidad/);
  assert.match(router, /seccion === 'ingresarNomina' && perfilActual === 'Administrador'[\s\S]*coordinador\/services\/contabilidadDiariaService\.js/);
});

test('el mapeo usa fecha, coordinador, municipio, AFF y préstamo contable como comida editable', () => {
  const context = cargarModulo('Administrador');
  const preparada = context._inPrepararDatosPrecarga({
    fecha: '2026-10-10',
    coordinador: 'Coordinadora',
    municipio: 'Maracaibo',
    estado: 'cerrada',
    afiliaciones: [{ asesor: 'Génesis Chirinos', aff: 12, prestamo: 35 }]
  }, [{ cedula: 'V-123', nombre: 'GENESIS CHIRINOS' }]);

  assert.equal(preparada.fecha, '2026-10-10');
  assert.equal(preparada.coordinador, 'Coordinadora');
  assert.equal(preparada.municipio, 'Maracaibo');
  assert.equal(preparada.cedulas.length, 1);
  assert.equal(preparada.cedulas[0], 'V-123');
  assert.equal(preparada.conceptos['V-123'].aff, '12');
  assert.equal(preparada.conceptos['V-123'].comida, '35');
  assert.equal(preparada.advertencias.length, 0);

  const elements = {};
  const table = { innerHTML: '' };
  const document = {
    getElementById(id) {
      if (id === 'in-tabla-conceptos') return table;
      if (!elements[id]) elements[id] = { value: id === 'in-fecha' ? '2026-10-10' : '', style: {} };
      return elements[id];
    }
  };
  context.document = document;
  context._inSeleccionados = [{ cedula: 'V-123', nombre: 'GENESIS CHIRINOS' }];
  context._inConceptosPorCedula = { 'V-123': preparada.conceptos['V-123'] };
  context._inGenerarTabla();
  assert.match(table.innerHTML, /id="in-aff-0" value="12"/);
  assert.match(table.innerHTML, /id="in-com-0" value="35"/);
  assert.match(table.innerHTML, /id="in-prest-0" value="" placeholder="0"/);
  assert.doesNotMatch(table.innerHTML, /<input[^>]*disabled/);
});

test('el mapeo no aproxima nombres ambiguos o repetidos y rechaza jornadas abiertas', () => {
  const context = cargarModulo('Administrador');
  const prepared = context._inPrepararDatosPrecarga({
    fecha: '2026-10-10',
    estado: 'validada',
    afiliaciones: [
      { asesor: 'Ana Pérez', aff: 4, prestamo: 10 },
      { asesor: 'Luis Díaz', aff: 2, prestamo: 5 },
      { asesor: 'Ana Pérez', aff: 1, prestamo: 3 }
    ]
  }, [
    { cedula: 'A-1', nombre: 'Ana Pérez' },
    { cedula: 'A-2', nombre: 'ANA PEREZ' },
    { cedula: 'L-1', nombre: 'Luis Díaz' }
  ]);

  assert.equal(prepared.cedulas.length, 1);
  assert.equal(prepared.cedulas[0], 'L-1');
  assert.equal(prepared.advertencias.length, 2);
  assert.throws(() => context._inPrepararDatosPrecarga({ estado: 'borrador', afiliaciones: [] }, []), /cerrada o validada/);
});

test('los valores asociados por cédula se guardan antes de regenerar la tabla editable', () => {
  assert.match(source, /function _inGuardarConceptosActuales\(\)/);
  assert.match(source, /_inGuardarConceptosActuales\(\);\s*_inSeleccionados = _inPromotoresTodos/);
  assert.match(source, /brigadas:\s*\(document\.getElementById\('in-brig-' \+ idx\)/);
  assert.match(source, /tipoDescuento:\s*\(document\.getElementById\('in-tdesc-' \+ idx\)/);
  assert.match(source, /aff:\s*_inNumeroPayload\('in-aff-'\s*\+ idx\)/);
  assert.match(source, /comida:\s*_inNumeroPayload\('in-com-'\s*\+ idx\)/);
});
