const test = require('node:test');
const assert = require('node:assert/strict');

const path = require('path');

let modulo;
try {
  modulo = require(path.join(__dirname, '..', 'administracion', 'js', 'lentesCarga.js'));
} catch (error) {
  modulo = null;
}

test('las funciones de carga de lentes existen y normalizan nombres', () => {
  assert.ok(modulo, 'Debe existir la implementación del módulo de carga de lentes');
  assert.equal(typeof modulo.normalizarNombrePromotor, 'function');
  assert.equal(typeof modulo.parsearDatosPegados, 'function');
  assert.equal(modulo.normalizarNombrePromotor('Génesis chirinos'), 'GENESIS CHIRINOS');
  assert.equal(modulo.normalizarNombrePromotor('Juan c Castellano'), 'JUAN C CASTELLANO');
});

test('el parser identifica las columnas y elimina líneas vacías', () => {
  const texto = [
    'Promotor\tAfiliaciones\tAsistidos\tVenta Especial\tVenta Normal\tTotal Venta',
    'Elizabeth Quintero\t13\t6\t3\t2\t5',
    'Génesis chirinos\t27\t14\t5\t1\t6',
    '',
    'Juan c Castellano\t14\t1\t1\t0\t1'
  ].join('\n');

  const filas = modulo.parsearDatosPegados(texto);
  assert.equal(filas.length, 3);
  assert.deepEqual(filas[0], {
    nombreRecibido: 'Elizabeth Quintero',
    contactos: 13,
    asistidos: 6,
    lentesEspeciales: 3,
    lentesSencillos: 2,
    totalLentes: 5
  });
});

test('el parser conserva columnas cuando una celda intermedia está vacía', () => {
  const texto = [
    'Promotor\tAfiliaciones\tAsistidos\tVenta Especial\tVenta Normal\tTotal Venta',
    'Elizabeth Quintero\t13\t6\t\t2\t2'
  ].join('\n');

  const filas = modulo.parsearDatosPegados(texto);
  assert.equal(filas.length, 1);
  assert.equal(filas[0].lentesEspeciales, 0);
  assert.equal(filas[0].lentesSencillos, 2);
  assert.equal(filas[0].totalLentes, 2);
});
