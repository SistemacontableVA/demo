const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const authSource = fs.readFileSync(path.join(root, 'administracion', 'config', 'auth.js'), 'utf8');
const appSource = fs.readFileSync(path.join(root, 'assets', 'js', 'app.js'), 'utf8');
const routerSource = fs.readFileSync(path.join(root, 'administracion', 'js', 'router.js'), 'utf8');

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    }
  };
}

function createAuthContext(fetch) {
  const context = {
    localStorage: createStorage({
      ks_lic_token: 'license-session',
      ks_admin_token: 'expired-token',
      ks_admin_expira: '1',
      ks_admin_refresh: 'refresh-token'
    }),
    sessionStorage: createStorage(),
    fetch,
    Date,
    JSON,
    Number,
    String,
    Error,
    Promise,
    parseInt
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(authSource, context);
  return context;
}

function jsonResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(data)
  };
}

test('restaura una sesión administrativa cuyo access token sigue vigente sin renovarlo', async () => {
  let fetchCount = 0;
  const context = createAuthContext(async () => {
    fetchCount += 1;
    throw new Error('No debe solicitarse una renovación');
  });
  context.localStorage.setItem('ks_admin_expira', String(Date.now() + 60_000));

  assert.equal(await context.restaurarSesionAdmin(), true);
  assert.equal(fetchCount, 0);
});

test('renueva un access token vencido y persiste el refresh token rotado', async () => {
  const requests = [];
  const context = createAuthContext(async (url) => {
    requests.push(url);
    if (url.includes('/token?grant_type=refresh_token')) {
      return jsonResponse({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
        user: { id: 'admin-1', email: 'admin@example.test' }
      });
    }
    return jsonResponse({
      ok: true,
      user: { id: 'admin-1', role: 'Administrador', username: 'admin' },
      tenant: { id: 'tenant-1' }
    });
  });

  assert.equal(await context.restaurarSesionAdmin(), true);
  assert.equal(context.localStorage.getItem('ks_admin_token'), 'new-access-token');
  assert.equal(context.localStorage.getItem('ks_admin_refresh'), 'new-refresh-token');
  assert.equal(requests.length, 2);
});

test('conserva las credenciales guardadas si falla la renovación por red', async () => {
  const context = createAuthContext(async () => {
    throw new Error('Network unavailable');
  });

  assert.equal(await context.restaurarSesionAdmin(), false);
  assert.equal(context.localStorage.getItem('ks_admin_refresh'), 'refresh-token');
  assert.equal(context.localStorage.getItem('ks_admin_token'), 'expired-token');
});

test('guarda el refresh token rotado aunque la validación posterior falle', async () => {
  const context = createAuthContext(async (url) => {
    if (url.includes('/token?grant_type=refresh_token')) {
      return jsonResponse({
        access_token: 'new-access-token',
        refresh_token: 'rotated-refresh-token',
        expires_in: 3600,
        user: { id: 'admin-1', email: 'admin@example.test' }
      });
    }
    throw new Error('Validation endpoint unavailable');
  });

  assert.equal(await context.restaurarSesionAdmin(), false);
  assert.equal(context.localStorage.getItem('ks_admin_refresh'), 'rotated-refresh-token');
  assert.equal(context.localStorage.getItem('ks_admin_token'), 'expired-token');
});

test('la app retoma administración al recargar y el router no borra la sesión ante un fallo de renovación', () => {
  assert.match(appSource, /restaurarSesionAdmin\(\)[\s\S]*mostrarModulo\(sesionRestaurada \? 'administracion' : 'admin-login'\)/);
  assert.match(routerSource, /Tus credenciales se conservaron/);
  assert.doesNotMatch(routerSource, /if \(!valida\) \{\s*if \(typeof cerrarSesionAdmin === 'function'\) cerrarSesionAdmin\(\)/);
});
