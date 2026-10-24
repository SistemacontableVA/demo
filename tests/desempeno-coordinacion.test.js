const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const moduleSource = fs.readFileSync(
  path.join(root, 'administracion', 'js', 'desempenoCoordinacion.js'),
  'utf8'
);

function crearModulo() {
  const window = {};
  const context = { window, Number, Object, String, Set, Math, Promise, console };
  vm.createContext(context);
  vm.runInContext(moduleSource, context);
  return window.DesempenoCoordinacion;
}

function crearJornada(overrides) {
  return Object.assign({
    fecha: '2026-10-08',
    municipio: 'Bolívar',
    coordinador: 'Ana',
    estado: 'cerrada',
    afiliaciones: [
      { asesor: 'Promotora 1', rol: 'PROMOTOR', aff: 3 },
      { asesor: 'Promotor 2', rol: 'Promotor', aff: 2 },
      { asesor: 'Coordinador', rol: 'COORDINADOR', aff: 1 },
      { asesor: 'Seleccionar promotor', rol: 'PROMOTOR', aff: 0 }
    ],
    gastos: { recaudoBase: 100 },
    totales: {
      totalIngresos: 30,
      totalDeduccion: 5,
      totalEgresos: 20,
      saldoInicial: 60,
      saldoFinal: 65
    }
  }, overrides);
}

test('calcula KPIs a partir de los cierres y usa recaudo base como recaudo bruto', () => {
  const api = crearModulo();
  const jornadaAna = crearJornada({});
  const jornadaLuis = crearJornada({
    fecha: '2026-10-09',
    coordinador: 'Luis',
    gastos: { recaudoBase: 200 },
    afiliaciones: [{ asesor: 'Promotora 3', rol: 'PROMOTOR', aff: 4 }],
    totales: {
      totalIngresos: 70,
      totalDeduccion: 10,
      totalEgresos: 60,
      saldoInicial: 80,
      saldoFinal: 80
    }
  });

  const metrics = api.calcularMetricas([jornadaAna, jornadaLuis]);
  assert.equal(metrics.jornadas, 2);
  assert.equal(metrics.totalAfiliaciones, 10);
  assert.equal(metrics.promedioAfiliaciones, 5);
  assert.equal(metrics.promedioSaldoFinal, 72.5);
  assert.equal(metrics.totalRecaudoBruto, 300);
  assert.equal(metrics.totalEgresos, 80);
  assert.equal(metrics.porcentajeGastoOperativo, 80 / 300 * 100);
  assert.equal(metrics.promedioPromotores, 1.5);
  assert.equal(api.contarPromotores(jornadaAna), 2);
  assert.deepEqual(Array.from(api.listaAfiliacionesPromotores(jornadaAna)).map((promotor) => [
    promotor.nombre, promotor.afiliaciones
  ]), [
    ['Promotora 1', 3],
    ['Promotor 2', 2],
    ['Coordinador', 1]
  ]);
  const detalle = api.construirDetalle(jornadaAna);
  assert.match(detalle, /Promotora 1<\/span>.*3 afiliaciones/);
  assert.match(detalle, /Promotor 2<\/span>.*2 afiliaciones/);
  assert.match(detalle, /Coordinador<\/span>.*1 afiliación/);
  assert.match(detalle, /<dt>Saldo Final<\/dt>/);
});

test('filtra solo cierres en rango y por coordinador, y conserva ranking comparativo', () => {
  const api = crearModulo();
  const anaPrimera = crearJornada({ fecha: '2026-10-07' });
  const anaSegunda = crearJornada({ fecha: '2026-10-08' });
  const luis = crearJornada({ fecha: '2026-10-08', coordinador: 'Luis' });
  const abierta = crearJornada({ fecha: '2026-10-08', estado: 'borrador' });
  const jornadas = [anaPrimera, anaSegunda, luis, abierta];

  const visibles = api.filtrarJornadas(jornadas, {
    desde: '2026-10-08',
    hasta: '2026-10-08',
    coordinador: 'Ana'
  });
  assert.deepEqual(Array.from(visibles), [anaSegunda]);

  const ranking = Array.from(api.agruparCoordinadores(api.filtrarJornadas(jornadas, {
    desde: '2026-10-07',
    hasta: '2026-10-08'
  })));
  assert.deepEqual(ranking.map((item) => [item.nombre, item.jornadas, item.promedio]), [
    ['Ana', 2, 6],
    ['Luis', 1, 6]
  ]);
});

test('dashboard incluye filtros, gráficos comparativos e histórico desplegable', () => {
  const router = fs.readFileSync(path.join(root, 'administracion', 'js', 'router.js'), 'utf8');
  const shell = fs.readFileSync(path.join(root, 'administracion', 'views', 'shell.tpl'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'administracion', 'styles', 'admin.css'), 'utf8');

  assert.match(router, /'desempenoCoordinacion':[\s\S]*'administracion\/js\/desempenoCoordinacion\.js'/);
  assert.match(shell, /data-ruta="desempenoCoordinacion" data-solo-admin="true"/);
  assert.match(moduleSource, /id="desempeno-coordinador"/);
  assert.doesNotMatch(moduleSource, /nomina-coordinador|obtener-nomina-coordinador|nomina_coordinador\.html/);
  assert.doesNotMatch(moduleSource, /Buscando hojas Coordinador_/);
  assert.match(moduleSource, /id="desempeno-desde"/);
  assert.match(moduleSource, /id="desempeno-hasta"/);
  assert.match(moduleSource, /desempeno-grafico-afiliaciones/);
  assert.match(moduleSource, /Afiliaciones por fecha y municipio/);
  assert.match(moduleSource, /desempeno-grafico-ranking/);
  assert.match(moduleSource, /desempeno-historico/);
  assert.match(moduleSource, /class="desempeno-history-toggle"/);
  assert.match(moduleSource, /class="desempeno-history-balance"/);
  assert.match(moduleSource, /moneda\(saldoFinalDe\(jornada\)\)/);
  assert.match(moduleSource, /class="desempeno-history-detail" hidden/);
  assert.match(moduleSource, /aria-expanded="false" aria-controls=/);
  assert.match(moduleSource, /querySelectorAll\('\.desempeno-history-item\.is-expanded'\)/);
  assert.doesNotMatch(moduleSource, /<tbody id="desempeno-historico"/);
  assert.match(moduleSource, /toggleDesempenoJornada/);
  assert.match(moduleSource, /recaudoBase/);
  assert.match(moduleSource, /Saldo Final/);
  assert.match(moduleSource, /id="desempeno-consultar"/);
  assert.doesNotMatch(moduleSource, /Saldo final a rendir/i);
  assert.match(moduleSource, /desempeno-promoter-name/);
  assert.match(moduleSource, /desempeno-promoter-role/);
  assert.match(moduleSource, /id="desempeno-instruccion"/);
  assert.match(moduleSource, /querySelector\('#desempeno-consultar'\)\.addEventListener\('click',\s*cargarDatos\)/);
  assert.doesNotMatch(moduleSource, /modulo\.querySelector\('#desempeno-consultar'\)\.addEventListener\('click',\s*cargarDatos\);\s*cargarDatos\(\)/);
  assert.match(css, /\.desempeno-kpis\s*\{/);
  assert.match(css, /\.desempeno-bars-scroll\s*\{/);
  assert.match(css, /\.desempeno-history-list\s*\{/);
  assert.match(css, /\.desempeno-history-toggle\s*\{/);
  assert.match(css, /\.desempeno-history-balance\s*\{/);
  assert.match(css, /grid-template-columns: auto minmax\(0, 1fr\) auto auto auto auto/);
  assert.match(css, /\.desempeno-history-balance \{ display: none; \}/);
  assert.match(css, /@media \(min-width: 1024px\) \{[\s\S]*?\.desempeno-heading h1 \{[\s\S]*?font-size: clamp\(28px/);
  assert.match(css, /@media \(min-width: 1024px\) \{[\s\S]*?\.desempeno-history-toggle \{[\s\S]*?grid-template-columns: 130px/);
  assert.match(css, /max-height: min\(70vh, 760px\)/);
  assert.match(css, /overscroll-behavior: contain/);
  assert.match(css, /\.desempeno-bar-value\s*\{/);
  assert.match(css, /\.desempeno-ranking-track\s*\{/);
  assert.match(css, /\.desempeno-detail-row/);
});

test('gráfica de barras identifica fecha, municipio y afiliaciones por jornada', () => {
  const api = crearModulo();
  const html = api.crearGraficoAfiliaciones([
    crearJornada({ fecha: '2026-10-08', municipio: 'Bolívar' }),
    crearJornada({
      fecha: '2026-10-09',
      municipio: 'Valencia',
      afiliaciones: [{ asesor: 'Promotora', rol: 'PROMOTOR', aff: 4 }]
    })
  ]);

  assert.match(html, /class="desempeno-bars-scroll"/);
  assert.match(html, /aria-label="08\/10\/2026, Bolívar, 6 afiliaciones"/);
  assert.match(html, /aria-label="09\/10\/2026, Valencia, 4 afiliaciones"/);
  assert.match(html, /<strong class="desempeno-bar-value">6<\/strong>/);
  assert.match(html, /<strong class="desempeno-bar-value">4<\/strong>/);
  assert.match(html, /<time class="desempeno-bar-date" datetime="2026-10-08">08\/10\/2026<\/time>/);
  assert.match(html, /<span class="desempeno-bar-municipality" title="Valencia">Valencia<\/span>/);
});

test('render inicial del desempeño espera Consultar y no consulta nóminas', async () => {
  let llamadas = 0;
  const controles = new Map();
  function elemento() {
    return {
      value: '',
      hidden: false,
      children: [],
      listeners: {},
      classList: { toggle() {} },
      addEventListener(evento, callback) {
        this.listeners[evento] = callback;
      },
      replaceChildren() {
        this.children = [];
      },
      appendChild(hijo) {
        this.children.push(hijo);
      },
      querySelector(selector) {
        if (!controles.has(selector)) controles.set(selector, elemento());
        return controles.get(selector);
      }
    };
  }
  const modulo = elemento();
  const contenedor = {
    replaceChildren(elementoModulo) {
      assert.equal(elementoModulo, modulo);
      modulo.isConnected = true;
      modulo.innerHTML = elementoModulo.innerHTML;
    }
  };
  const window = {
    ContabilidadDiariaService: {
      loadRemoteDraftHistory() {
        llamadas += 1;
        return new Promise(() => {});
      }
    }
  };
  const context = {
    window,
    document: {
      getElementById: () => contenedor,
      createElement: (tagName) => tagName === 'section' ? modulo : elemento()
    },
    Number,
    Object,
    String,
    Set,
    Math,
    Promise,
    console
  };
  vm.createContext(context);
  vm.runInContext(moduleSource, context);

  window.renderDesempenoCoordinacion();
  assert.doesNotMatch(modulo.innerHTML, /nomina-coordinador|Consulta nómina/);
  assert.equal(llamadas, 0);
  assert.match(modulo.innerHTML, /id="desempeno-contenido" hidden/);
  assert.equal(typeof controles.get('#desempeno-consultar').listeners.click, 'function');
  await Promise.resolve();
  await Promise.resolve();

  controles.get('#desempeno-consultar').listeners.click();
  assert.equal(llamadas, 1);
});
