const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const modulo = require(path.join(__dirname, '..', 'administracion', 'js', 'promotores.js'));

const promotorValido = {
  nombre: 'Ana Pérez',
  tipoDocumento: 'V',
  documento: '00123456',
  telefono: '+58 412 123 4567',
  fotoDocumento: 'https://drive.google.com/file/d/documento',
  carnet: 'C-100'
};

test('registra con nombre y documento mínimos, preservando documentos con ceros iniciales', () => {
  const resultado = modulo.validarPromotor({
    nombre: 'Ana Pérez',
    documento: '00123456'
  }, ['V', 'E'], [], 'crear');
  assert.equal(resultado.ok, true);
  assert.deepEqual(resultado.errores, []);
  assert.equal(resultado.promotor.nombre, 'ANA PÉREZ');
  assert.equal(resultado.promotor.documento, '00123456');
});

test('permite campos opcionales vacíos, pero valida el tipo cuando se proporciona', () => {
  const resultado = modulo.validarPromotor({
    nombre: 'Ana Pérez',
    documento: '00123456',
    tipoDocumento: 'X'
  }, ['V', 'E'], [], 'crear');
  assert.equal(resultado.ok, false);
  assert.ok(resultado.errores.some((error) => /tipo de documento/.test(error)));
});

test('valida formato telefónico y enlace HTTPS de Foto Documento', () => {
  const resultado = modulo.validarPromotor(
    Object.assign({}, promotorValido, { telefono: '123', fotoDocumento: 'http://drive.google.com/doc' }),
    ['V'],
    [],
    'crear'
  );
  assert.equal(resultado.ok, false);
  assert.ok(resultado.errores.some((error) => /teléfono válido/.test(error)));
  assert.ok(resultado.errores.some((error) => /enlace HTTPS/.test(error)));
});

test('rechaza nombres no válidos para las pestañas de Google Sheets', () => {
  const resultado = modulo.validarPromotor(
    Object.assign({}, promotorValido, { nombre: 'Ana/Pérez' }),
    ['V'],
    [],
    'crear'
  );
  assert.equal(resultado.ok, false);
  assert.ok(resultado.errores.some((error) => /nombre debe tener máximo/.test(error)));
});

test('rechaza nombres o documentos ya registrados', () => {
  const resultado = modulo.validarPromotor(promotorValido, ['V'], [
    { nombre: 'ana pérez', cedula: '999999' }
  ], 'crear');
  assert.equal(resultado.ok, false);
  assert.ok(resultado.errores.some((error) => /Ya existe/.test(error)));
});

test('edición parcial valida solo el campo cambiado y permite borrar un opcional', () => {
  const resultado = modulo.validarPromotor({ telefono: '' }, ['V'], [], 'editar');
  assert.equal(resultado.ok, true);
  assert.deepEqual(resultado.errores, []);
});

test('rechaza una edición sin cambios', () => {
  const resultado = modulo.validarPromotor({}, ['V'], [], 'editar');
  assert.equal(resultado.ok, false);
  assert.ok(resultado.errores.some((error) => /Modifica al menos un campo/.test(error)));
});

test('conserva enlaces compartidos para abrir directamente Google Drive', () => {
  assert.equal(
    modulo.normalizarUrlAcceso('https://drive.google.com/file/d/abc123/view?usp=sharing'),
    'https://drive.google.com/file/d/abc123/view?usp=sharing'
  );
});

test('el acceso directo solo acepta enlaces HTTP o HTTPS', () => {
  assert.equal(modulo.normalizarUrlAcceso('javascript:alert(1)'), '');
  assert.equal(modulo.normalizarUrlAcceso('no-es-un-enlace'), '');
});
