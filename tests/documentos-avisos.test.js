const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const documentos = fs.readFileSync(
  path.join(__dirname, '..', 'administracion', 'js', 'documentos.js'),
  'utf8'
);

test('el módulo de documentos no muestra avisos sobre plantillas o impresión al entrar', () => {
  assert.doesNotMatch(documentos, /están operativas\. Los documentos se generan localmente/i);
  assert.doesNotMatch(documentos, /El documento se genera localmente desde la plantilla(?: HTML)?/i);
  assert.doesNotMatch(documentos, /Los datos se colocan sobre la imagen de la plantilla/i);
  assert.doesNotMatch(documentos, /modoAviso/);
});

test('se conservan los formularios y el feedback al generar documentos', () => {
  assert.match(documentos, /function _renderFormSolicitudInstitucional\(\)/);
  assert.match(documentos, /function _renderFormSolicitudEspacio\(\)/);
  assert.match(documentos, /function _renderSelectorHojaConvenio\(\)/);
  assert.match(documentos, /function _renderFormHojaConvenioPersonalizable\(\)/);
  assert.match(documentos, /¡Documento generado!/);
});
