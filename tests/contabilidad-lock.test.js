const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const coordinator = fs.readFileSync(
  path.join(root, 'coordinador', 'views', 'contabilidadDiaria.html'),
  'utf8'
);
const service = fs.readFileSync(
  path.join(root, 'coordinador', 'services', 'contabilidadDiariaService.js'),
  'utf8'
);
const admin = fs.readFileSync(
  path.join(root, 'administracion', 'js', 'contabilidadAdmin.js'),
  'utf8'
);
const migration = fs.readFileSync(
  path.join(root, 'backend', 'supabase', 'migrations', '20261009140000_contabilidad_diaria_bloqueo_reapertura.sql'),
  'utf8'
);

test('el coordinador bloquea las jornadas cerradas o validadas y explica cómo pedir cambios', () => {
  assert.match(coordinator, /CONTABILIDAD_ESTADO_ACTUAL === 'cerrada' \|\| CONTABILIDAD_ESTADO_ACTUAL === 'validada'/);
  assert.match(coordinator, /function actualizarBloqueoEdicionContabilidad\(\)/);
  assert.match(coordinator, /#tbody-afiliaciones input, #tbody-afiliaciones select, #tbody-afiliaciones \.btn-danger/);
  assert.match(coordinator, /\.table-footer-bar \.btn-agregar-asesor/);
  assert.match(coordinator, /#tbody-afiliaciones \.btn-danger/);
  assert.match(coordinator, /#tab-contabilidad input, #tab-contabilidad select, #tab-contabilidad button/);
  assert.doesNotMatch(coordinator, /class="btn btn-reset"[^>]*>/);
  assert.doesNotMatch(coordinator, /class="btn btn-primary btn-validar"[^>]*>/);
  assert.match(coordinator, /id="aviso-contabilidad-bloqueada" hidden/);
  assert.match(coordinator, /solicite a administración que la reabra/i);
  assert.match(coordinator, /function rechazarEdicionContabilidadBloqueada\(\)/);
  assert.match(coordinator, /function guardarYSincronizarContabilidad\(\) \{\s*if \(rechazarEdicionContabilidadBloqueada\(\)\)/);
  assert.match(coordinator, /function restablecerContabilidad\(\) \{\s*if \(rechazarEdicionContabilidadBloqueada\(\)\)/);
  assert.match(coordinator, /function agregarFilaAfiliacion\(datos = null\) \{\s*if \(!datos && rechazarEdicionContabilidadBloqueada\(\)\)/);
});

test('administración cambia el estado desde el reporte y usa RPC dedicados para validar o reabrir', () => {
  assert.match(admin, /id="contabilidad-admin-estado"/);
  assert.match(admin, /async function guardarEstadoContabilidadAdmin\(\)/);
  assert.match(admin, /ContabilidadDiariaService\.cambiarEstado\(draft\.id, 'validada'\)/);
  assert.match(admin, /ContabilidadDiariaService\.reabrirParaEdicion\(draft\.id\)/);
  assert.match(admin, /draft\.estado = estadoNuevo/);
  assert.match(service, /reabrirParaEdicion: async function \(id\) \{\s*return rpc\('contabilidad_diaria_reabrir', \{ p_id: id \}\);/);
});

test('el backend impide modificar jornadas cerradas y registra las reaperturas por administrador', () => {
  assert.match(migration, /create trigger contabilidad_diaria_bloquear_cerradas\s+before update on public\.contabilidad_diaria_jornadas/i);
  assert.match(migration, /if old\.estado in \('cerrada', 'validada'\)[\s\S]*?private\.has_role\(array\['Administrador'\]::text\[\]\)/i);
  assert.match(migration, /new\.estado not in \('borrador', 'validada'\)/i);
  assert.match(migration, /create or replace function public\.contabilidad_diaria_reabrir\(p_id uuid\)/i);
  assert.match(migration, /v_jornada\.estado not in \('cerrada', 'validada'\)/i);
  assert.match(migration, /'reabrir', v_antes->>'estado', 'borrador'/i);
  assert.match(migration, /grant execute on function public\.contabilidad_diaria_reabrir\(uuid\) to authenticated/i);
});
