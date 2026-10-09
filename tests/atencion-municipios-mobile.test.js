const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'atencionMunicipios', 'js', 'atencionMunicipios.js'), 'utf8');

function loadModule() {
  const context = {
    AtencionMunicipiosService: {
      ESTADOS: ['Digitalizado', 'Por Atender', 'Sin Digitalizar']
    },
    window: {},
    document: {},
    URL,
    console
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(source, context);
  return context;
}

test('la tarjeta móvil muestra municipio y ruta en el encabezado y detalles al desplegar', () => {
  const context = loadModule();
  context._atencionMunicipiosRole = 'Coordinador';

  const html = context._atencionMunicipiosMobileCard({
    id: 'municipio-1',
    ruta: 4,
    municipio: 'San José',
    fechaAtencion: '2026-10-07',
    fechaEntrega: '2026-10-08',
    estado: 'Por Atender'
  });

  assert.match(html, /<details class="atm-mobile-card">/);
  assert.match(html, /<summary>[\s\S]*?atm-mobile-place-icon[\s\S]*?San José[\s\S]*?<\/summary>/);
  assert.doesNotMatch(html, /R-4/);
  assert.match(html, /Fecha de atención/);
  assert.match(html, /Fecha de entrega/);
  assert.match(html, /Por Atender/);
  assert.match(html, /data-atm-action="access" data-id="municipio-1">ACCEDER/);
});

test('el listado móvil escapa el nombre y conserva las acciones disponibles según el perfil', () => {
  const context = loadModule();
  context._atencionMunicipiosRole = 'Administrador';

  const html = context._atencionMunicipiosMobileCard({
    id: 'municipio-2',
    ruta: 1,
    municipio: '<Centro>',
    estado: 'Sin Digitalizar'
  });

  assert.match(html, /&lt;Centro&gt;/);
  assert.match(html, /data-atm-action="edit" data-id="municipio-2"/);
  assert.match(html, /data-atm-action="delete" data-id="municipio-2"/);
  assert.match(html, /data-atm-action="access" data-id="municipio-2">ACCEDER/);
});

test('el módulo muestra tarjetas solo en móvil y mantiene la tabla para escritorio', () => {
  assert.match(source, /class="atm-mobile-list"/);
  assert.match(source, /atm-table-wrap atm-desktop-table-wrapper/);
  assert.match(source, /@media\(max-width:640px\)\{\.atm-desktop-table-wrapper\{display:none\}\.atm-mobile-list\{display:block\}/);
  assert.doesNotMatch(source, /atm-route-tone-/);
  assert.match(source, /\.atm-route\{display:grid;width:32px;height:32px;place-items:center;border-radius:50%;background:#082c4a;color:#fff;/);
});

test('Atención Municipios usa el azul y verde de Gestión de Nómina en sus acciones', () => {
  assert.match(source, /linear-gradient\(110deg,#082c4a,#008a69\)/);
  assert.match(source, /\.atm-access\{[^}]*background:#008a69;color:#fff/);
});
