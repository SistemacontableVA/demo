const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const serviceFile = path.join(root, 'administracion', 'services', 'oficinaNominaService.js');
const uiFile = path.join(root, 'administracion', 'js', 'oficina.js');
const sqlFile = path.join(root, 'supabase', 'migrations', '20261005110000_nomina_oficina.sql');

function createService(fetchMock) {
  const context = {
    ADMIN_AUTH_BASE_URL: 'https://supabase.example',
    ADMIN_AUTH_PUBLIC_KEY: 'publishable-test-key',
    getTokenAdmin: () => 'access-token',
    localStorage: { getItem: key => key === 'admin_tenant_id' ? 'tenant-1' : '' },
    fetch: fetchMock,
    URLSearchParams,
    Intl,
    Promise,
    Date,
    Number,
    String,
    Object,
    Array,
    Error
  };
  vm.runInNewContext(fs.readFileSync(serviceFile, 'utf8'), context);
  return context.OficinaNominaService;
}

test('Supabase service normalizes fechas y rechaza entradas inválidas', () => {
  const service = createService(async () => ({ ok: true, text: async () => '[]' }));
  assert.equal(service.fechaIso('05/10/2026'), '2026-10-05');
  assert.equal(service.fechaIso('2026-10-05'), '2026-10-05');
  assert.throws(() => service.fechaIso('31/02/2026'), /no es válida/);
  assert.throws(() => service.fechaIso('2026-2-5'), /formato dd\/MM\/yyyy/);
});

test('calcular nómina en lote usa una sola llamada RPC autenticada', async () => {
  const calls = [];
  const service = createService(async (url, options) => {
    calls.push({ url, options });
    return { ok: true, text: async () => JSON.stringify({ ok: true, detalle: [] }) };
  });

  const result = await service.calcularNominaLote('PER-2026-10', ['EMP-001', 'EMP-002']);
  assert.equal(result.ok, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://supabase.example/rest/v1/rpc/oficina_calcular_nomina');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer access-token');
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    p_periodo: 'PER-2026-10',
    p_empleados: ['EMP-001', 'EMP-002']
  });
});

test('generación de pagos y confirmación se envían al backend transaccional', async () => {
  const calls = [];
  const service = createService(async (url, options) => {
    calls.push({ url, options });
    return { ok: true, text: async () => JSON.stringify({ ok: true }) };
  });

  await service.generarPagos('PER-2026-10', ['EMP-001']);
  await service.marcarPagoPagado('pay-1', 'transfer-123');
  assert.deepEqual(calls.map(call => new URL(call.url).pathname), [
    '/rest/v1/rpc/oficina_generar_pagos',
    '/rest/v1/rpc/oficina_marcar_pago_pagado'
  ]);
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    p_periodo: 'PER-2026-10',
    p_empleados: ['EMP-001']
  });
  assert.deepEqual(JSON.parse(calls[1].options.body), {
    p_id: 'pay-1',
    p_referencia: 'transfer-123'
  });
});

test('la migración exige aislamiento por empresa, auditoría y pagos históricos idempotentes', () => {
  const sql = fs.readFileSync(sqlFile, 'utf8');
  for (const table of [
    'oficina_empleados',
    'oficina_periodos',
    'oficina_novedades',
    'oficina_pagos',
    'oficina_pago_detalle',
    'oficina_nomina_audit'
  ]) {
    assert.match(sql, new RegExp('create table if not exists public\\.' + table));
    assert.match(sql, new RegExp('alter table public\\.' + table + ' enable row level security'));
  }
  assert.match(sql, /unique index if not exists oficina_pago_activo_unico/);
  assert.match(sql, /empleado_snapshot jsonb not null/);
  assert.match(sql, /calculo_snapshot jsonb not null/);
  assert.match(sql, /oficina_generar_pagos[\s\S]*?v_empleados_solicitados <> cardinality\(p_empleados\)/);
  assert.match(sql, /oficina_generar_pagos[\s\S]*?'periodo_cerrado', false/);
  assert.match(sql, /Genera al menos un pago antes de cerrar el período/);
  assert.match(sql, /oficina_marcar_pago_pagado[\s\S]*?oficina_tenant_requerido\(true\)/);
  assert.match(sql, /cantidad_vencido/);
  assert.match(sql, /fecha_pago_programada < current_date/);
});

test('el resumen agrega métricas de período antes de agregarlas al JSON', () => {
  const sql = fs.readFileSync(sqlFile, 'utf8');
  const start = sql.indexOf('create or replace function public.oficina_resumen_control()');
  const end = sql.indexOf('create or replace function public.oficina_obtener_pago(', start);
  const summaryFunction = sql.slice(start, end);

  assert.match(summaryFunction, /count\(pg\.id\) as pagos_generados/);
  assert.match(summaryFunction, /group by p\.id\s*\)\s+resumen/);
  assert.match(summaryFunction, /'pagos_generados', resumen\.pagos_generados/);
});

test('el cálculo en lote pasa el UUID del período a la función de cálculo individual', () => {
  const sql = fs.readFileSync(sqlFile, 'utf8');
  const start = sql.indexOf('create or replace function public.oficina_calcular_nomina(');
  const end = sql.indexOf('create or replace function public.oficina_crear_empleado(', start);
  const calculationFunction = sql.slice(start, end);

  assert.match(calculationFunction, /oficina_calcular_empleado\(v_tenant,\s*v_periodo\.id,\s*e\.codigo\)/);
  assert.doesNotMatch(calculationFunction, /oficina_calcular_empleado\(v_tenant,\s*p_periodo,/);
});

test('la nómina permite generar pagos solo para empleados seleccionados y cerrar el período manualmente', () => {
  const ui = fs.readFileSync(uiFile, 'utf8');
  assert.match(ui, /Generar pagos seleccionados/);
  assert.match(ui, /Solo se generarán pagos para los empleados seleccionados/);
  assert.match(ui, /El período permanece abierto/);
  assert.match(ui, /Puedes generar pagos parciales; cierra el período manualmente cuando termines/);
  assert.doesNotMatch(ui, /seleccionCompleta|Generar pagos y cerrar período/);
});

test('el inicio del módulo no registra acciones de historial sobre una variable panel inexistente', () => {
  const ui = fs.readFileSync(uiFile, 'utf8');
  const inicio = ui.slice(ui.indexOf('function renderOficina()'), ui.indexOf('function _ofTabBtn'));
  const historial = ui.slice(ui.indexOf('function _ofRenderPagos()'), ui.indexOf('function _ofImprimirPagoHistorico'));

  assert.doesNotMatch(inicio, /panel\.querySelectorAll/);
  assert.match(historial, /panel\.querySelectorAll\('\[data-of-anular-pago\]'\)/);
});
