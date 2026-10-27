const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const documentos = fs.readFileSync(
  path.join(__dirname, '..', 'administracion', 'js', 'documentos.js'),
  'utf8'
);
const hojaConvenio = fs.readFileSync(
  path.join(__dirname, '..', 'administracion', 'documentos', 'templates', 'hoja-convenio.html'),
  'utf8'
);
const publicidad = fs.readFileSync(
  path.join(__dirname, '..', 'administracion', 'documentos', 'publicidad', 'publicidad.html'),
  'utf8'
);
const publicidadImagen = path.join(
  __dirname,
  '..',
  'administracion',
  'documentos',
  'publicidad',
  'Publicidad.jpg'
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

test('los documentos generados incluyen una acción móvil para descargarlos como PDF', () => {
  const integraciones = documentos.match(/doc = _agregarBotonDescargaDocumento\(doc\);/g) || [];

  assert.equal(integraciones.length, 5, 'Cada formulario generado debe agregar el botón Descargar');
  assert.match(documentos, /onclick="window\.print\(\)">Descargar/);
  assert.match(documentos, /@media print\{#documento-descargar/);
  assert.match(documentos, /min-height:56px;padding:0 24px/);
  assert.match(documentos, /font:600 18px Arial,sans-serif/);
  assert.doesNotMatch(documentos, /Ctrl\+P/);
  assert.match(hojaConvenio, /onclick="window\.print\(\)">Descargar/);
  assert.match(hojaConvenio, /min-height:56px;padding:0 24px/);
  assert.match(hojaConvenio, /font:600 18px Arial,sans-serif/);
});

test('la publicidad conserva la plantilla y la imagen en su nueva carpeta', () => {
  assert.equal(fs.existsSync(publicidadImagen), true);
  assert.match(documentos, /administracion\/documentos\/publicidad\/Publicidad\.jpg/);
  assert.match(documentos, /administracion\/documentos\/publicidad\/publicidad\.html/);
  assert.match(documentos, /onclick="_abrirEditorPublicidad\(\)"/);
  assert.match(documentos, /Editar'\s*\+\s*'<\/button>/);
  assert.match(documentos, /function _publicidadIniciarArrastre\(/);
  assert.match(documentos, /function _publicidadDescargarPlantilla\(\)/);
  assert.match(documentos, /function _publicidadActualizarCssPlantilla\(html\)/);
  assert.doesNotMatch(documentos, /\.municipio\{top: calc\(332px/);
  assert.match(publicidad, /width: 1055px/);
  assert.match(publicidad, /height: 1491px/);
  assert.match(publicidad, /fonts\.googleapis\.com\/css2\?family=Poppins/);
  assert.match(publicidad, /font-family:\s*'Poppins',\s*sans-serif/i);
  assert.doesNotMatch(publicidad, /font-family:\s*lato/i);
  assert.match(documentos, /font-family:Poppins,sans-serif/);
  assert.doesNotMatch(documentos, /font-family:lato/i);
  assert.match(publicidad, /\{\{Municipio\}\}/);
  assert.match(publicidad, /\{\{Institucion\}\}/);
  assert.match(publicidad, /class="fijo">Lugar: <\/span>/);
  assert.doesNotMatch(publicidad, /text-transform:\s*uppercase/i);
  assert.match(publicidad, /\.municipio \.fijo[^}]*font-weight:\s*400/);
  assert.match(publicidad, /\.institucion \.fijo[^}]*font-weight:\s*400/);
  assert.match(publicidad, /\.fecha \.fijo[^}]*font-weight:\s*400/);
  assert.match(publicidad, /\.horario \.fijo[^}]*font-weight:\s*400/);
  assert.match(documentos, /campo\.texto\.fijo\.fontSize \+ 'px;color:' \+ campo\.texto\.fijo\.color \+ ';font-weight:400;/);
  assert.match(documentos, /institucion: 'Lugar: '/);
  assert.match(publicidad, /\{\{Fecha\}\}/);
  assert.match(publicidad, /\{\{Horario\}\}/);

  const contexto = { window: {}, document: {} };
  vm.runInNewContext(documentos, contexto);
  const estado = contexto._publicidadLeerConfiguracion(publicidad);
  for (const nombre of ['municipio', 'institucion', 'fecha', 'horario']) {
    assert.ok(estado.campos[nombre].texto.fijo.fontSize > 0);
    assert.ok(estado.campos[nombre].texto.variable.fontSize > 0);
    assert.match(estado.campos[nombre].texto.fijo.color, /^#[0-9a-f]{6}$/i);
  }
  assert.match(documentos, /data-pub-align=/);
  assert.match(documentos, /function _publicidadCambiarAlineacion\(/);
});

test('el editor escribe nuevas posiciones y la imagen en la plantilla descargada', () => {
  const contexto = { window: {}, document: {} };
  vm.runInNewContext(documentos, contexto);
  const estado = contexto._publicidadLeerConfiguracion(publicidad);
  estado.campos.municipio.left = 410;
  estado.campos.municipio.align = 'right';
  estado.campos.institucion.align = 'right';
  estado.campos.fecha.top = 1100;
  estado.campos.municipio.texto.fijo.fontSize = 46;
  estado.campos.municipio.texto.fijo.color = '#ff0000';
  estado.campos.municipio.texto.variable.fontSize = 32;
  estado.campos.institucion.texto.fijo.fontSize = 38;
  estado.campos.institucion.texto.fijo.color = '#ff0000';
  estado.campos.institucion.texto.variable.color = '#123456';
  estado.imagen = 'data:image/png;base64,ZmFrZQ==';
  contexto.window._publicidadEdicion = estado;

  const actualizada = contexto._publicidadActualizarCssPlantilla(publicidad);
  const releida = contexto._publicidadLeerConfiguracion(actualizada);
  const guardadaOtraVez = contexto._publicidadActualizarCssPlantilla(actualizada);

  assert.match(actualizada, /\.municipio\s*\{[^}]*left:\s*410px/);
  assert.match(actualizada, /\.fecha\s*\{[^}]*top:\s*1100px/);
  assert.equal(releida.campos.municipio.align, 'right');
  assert.equal(releida.campos.institucion.align, 'right');
  assert.equal(releida.campos.municipio.texto.fijo.fontSize, 46);
  assert.equal(releida.campos.municipio.texto.fijo.color, '#ff0000');
  assert.equal(releida.campos.municipio.texto.variable.fontSize, 32);
  assert.equal(releida.campos.institucion.texto.fijo.fontSize, 38);
  assert.equal(releida.campos.institucion.texto.fijo.color, '#ff0000');
  assert.equal(releida.campos.institucion.texto.variable.color, '#123456');
  assert.match(actualizada, /background-image: url\("data:image\/png;base64,ZmFrZQ=="\)/);
  assert.equal(guardadaOtraVez, actualizada, 'Guardar nuevamente no debe aumentar ni reformatar el HTML');
});
