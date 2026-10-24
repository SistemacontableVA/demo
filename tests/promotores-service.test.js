const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const serviceSource = fs.readFileSync(
  path.join(__dirname, '..', 'administracion', 'services', 'promotoresService.js'),
  'utf8'
);

test('guarda cambios con el Web App sin depender de la validación de sesión Supabase', async () => {
  const requests = [];
  const contexto = {
    window: { API_URL: 'https://gas.example/exec' },
    localStorage: { getItem: () => '' },
    getPerfilAdmin: () => 'Administrador',
    fetch: (url, options) => {
      requests.push({ url, options });
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true, nombre: 'Ana Pérez', fila: 3 }) });
    },
    URLSearchParams,
    Promise,
    Date,
    AbortController
  };
  vm.createContext(contexto);
  vm.runInContext(serviceSource, contexto);

  const resultado = await contexto.PromotoresService.actualizar({
    fila: 3,
    documentoOriginal: '00123456',
    cambios: { telefono: '04121234567' }
  });

  assert.equal(resultado.ok, true);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].options.method, 'POST');
  const body = new URLSearchParams(requests[0].options.body);
  assert.equal(body.has('accessToken'), false);
  assert.deepEqual(JSON.parse(body.get('payload')).cambios, { telefono: '04121234567' });
});

test('envía la eliminación de promotores al Web App de Apps Script', async () => {
  const requests = [];
  const contexto = {
    window: { API_URL: 'https://gas.example/exec' },
    getPerfilAdmin: () => 'Administrador',
    fetch: (url, options) => {
      requests.push({ url, options });
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) });
    },
    URLSearchParams,
    Promise,
    Date,
    AbortController
  };
  vm.createContext(contexto);
  vm.runInContext(serviceSource, contexto);

  await contexto.PromotoresService.eliminar({ fila: 3, documentoOriginal: '00123456' });

  assert.equal(requests.length, 1);
  assert.match(requests[0].url, /action=eliminar-promotor/);
  const body = new URLSearchParams(requests[0].options.body);
  assert.deepEqual(JSON.parse(body.get('payload')), { fila: 3, documentoOriginal: '00123456' });
});

test('explica que debe publicarse el backend si Apps Script no reconoce la acción eliminar', async () => {
  const contexto = {
    window: { API_URL: 'https://gas.example/exec' },
    getPerfilAdmin: () => 'Administrador',
    fetch: () => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ ok: false, error: 'No hay hoja para: ' })
    }),
    URLSearchParams,
    Promise,
    Date,
    AbortController
  };
  vm.createContext(contexto);
  vm.runInContext(serviceSource, contexto);

  await assert.rejects(
    contexto.PromotoresService.eliminar({ fila: 3, documentoOriginal: '00123456' }),
    /no tiene publicada la acción de eliminación actualizada/
  );
});
