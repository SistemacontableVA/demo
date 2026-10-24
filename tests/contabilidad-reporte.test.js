const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const rendererSource = fs.readFileSync(
  path.join(root, 'coordinador', 'js', 'contabilidadReporte.js'),
  'utf8'
);
const templateSource = fs.readFileSync(
  path.join(root, 'coordinador', 'Plantilla impresion contabilidad reporte.html'),
  'utf8'
);

function createRenderer() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(rendererSource, context);
  return context.window.ContabilidadReporte;
}

function createPrintHelpers() {
  const inlineScript = templateSource.match(/<script>\s*([\s\S]*?)\s*<\/script>/);
  assert.ok(inlineScript, 'No se encontró el script de impresión de la plantilla');
  const context = { window: { addEventListener() {} }, document: {} };
  vm.createContext(context);
  vm.runInContext(inlineScript[1], context);
  return context;
}

test('el reporte prepara afiliaciones, totales y balance desde los datos de la jornada', () => {
  const model = createRenderer().crearModelo({
    fecha: '2026-10-08',
    municipio: 'Bolívar',
    coordinador: 'Coordinador de prueba',
    afiliaciones: [
      { asesor: 'Seleccionar promotor', aff: 0 },
      { asesor: 'Asesora Uno', rol: 'PROMOTOR', aff: 2, recAbono: 6, almuerzo: 3, recaudoNeto: 3 },
      { asesor: 'Asesor Dos', rol: 'COORDINADOR', aff: 1, recAbono: 3, almuerzo: 0, recaudoNeto: 3 }
    ],
    gastos: {
      recaudoBase: 9,
      abonosAdic: 2,
      giros: 4,
      consignaciones: 3,
      abonosGanados: 1,
      comidaCoor: 12,
      almuerzos: 3,
      hotel: 0,
      varios: 8,
      extra: [{ detalle: 'Material de oficina', monto: 5 }]
    },
    detalle: {
      saldoInicialOrigen: 'Efectivo',
      comidaCoordinador: 'Comida coordinador',
      varios: 'Recarga telefónica'
    },
    totales: {
      saldoInicial: 20,
      totalIngresos: 15,
      totalDeduccion: 4,
      totalEgresos: 28
    }
  }, { nombre: 'Empresa de prueba', logo: 'assets/images/logo.png' });

  assert.equal(model.empresa, 'Empresa de prueba');
  assert.equal(model.logo, 'assets/images/logo.png');
  assert.equal(model.fecha, '08/10/2026');
  assert.equal(model.nombreArchivo, 'Rcoordinacion-2026-10-08-BOLÍVAR-COORDINADOR DE PRUEBA');
  assert.equal(model.afiliaciones.length, 2);
  assert.equal(model.afiliaciones[0].rol, 'Promotor');
  assert.equal(model.totalesAfiliaciones.aff, 3);
  assert.equal(model.totalesAfiliaciones.recAbono, '$9.0');
  assert.equal(model.afiliaciones[0].almuerzo, '$3.0');
  assert.equal(model.totalCaja, 35);
  assert.equal(model.totalDeducciones, 4);
  assert.equal(model.totalEgresos, 28);
  assert.equal(model.saldoFinal, 3);
});

test('el reporte omite gastos opcionales sin detalle o con monto cero', () => {
  const model = createRenderer().crearModelo({
    gastos: {
      comidaCoor: 5,
      desayunos: 0,
      varios: 7,
      extra: [
        { detalle: 'Con monto cero', monto: 0 },
        { detalle: '', monto: 8 },
        { detalle: 'Papelería', monto: 3 }
      ]
    },
    detalle: {
      comidaCoordinador: 'Comida de ruta',
      desayunos: 'Desayuno sin gasto',
      varios: '',
    }
  });

  assert.deepEqual(
    Array.from(model.egresos).map((gasto) => [gasto.detalle, gasto.monto]),
    [['Comida de ruta', 5], ['Papelería', 3]]
  );
});

test('la plantilla define slots dinámicos, tres columnas y el logo, sin datos del ejemplo fijos', () => {
  for (const slot of [
    'data-report-logo',
    'data-report-company',
    'data-report-date',
    'data-report-municipality',
    'data-report-coordinator',
    'data-report-affiliations',
    'data-report-income',
    'data-report-deductions',
    'data-report-expenses'
  ]) {
    assert.ok(templateSource.includes(slot), `Falta ${slot}`);
  }
  assert.match(templateSource, /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(templateSource, /width:\s*min\(100%,\s*1056px\)[\s\S]*min-height:\s*816px[\s\S]*aspect-ratio:\s*11 \/ 8\.5/);
  assert.match(templateSource, /info-item--date/);
  assert.match(templateSource, /class="accounting-stack"/);
  assert.match(templateSource, /<div class="final-rendir-box">[\s\S]*data-report-formula[\s\S]*<\/div>\s*<\/div>\s*<\/div>/);
  assert.match(templateSource, /@page\s*\{\s*size:\s*11in 8\.5in;/);
  assert.match(templateSource, /@page\s*\{[\s\S]*margin:\s*8mm 5mm 5mm;/);
  assert.match(templateSource, /\.header-container\s*\{[\s\S]*position:\s*fixed;[\s\S]*top:\s*0;/);
  assert.match(templateSource, /body:not\(\.has-print-report-layout\) \.document-page > \.header-container\s*\{[\s\S]*position:\s*static;/);
  assert.match(templateSource, /\.brand-logo\s*\{[\s\S]*width:\s*auto;[\s\S]*height:\s*auto;[\s\S]*object-fit:\s*contain;/);
  assert.match(templateSource, /\.accounting-section\s*\{ break-inside:\s*avoid; page-break-inside:\s*avoid;/);
  assert.match(templateSource, /window\.addEventListener\('beforeprint',\s*prepararReporteParaImpresion\)/);
  assert.match(templateSource, /window\.addEventListener\('afterprint',\s*restaurarReporteDespuesDeImpresion\)/);
  assert.match(templateSource, /var requiereSegundaHoja = cantidad > 20/);
  assert.match(templateSource, /Math\.min\(cantidad, 30\)/);
  assert.match(templateSource, /filas\.slice\(0, distribucion\.asesoresPrimeraHoja\)/);
  assert.match(templateSource, /filas\.slice\(distribucion\.asesoresPrimeraHoja\)/);
  assert.match(templateSource, /class="print-report-layout"/);
  assert.match(templateSource, /\.styled-table\s*\{[\s\S]*?table-layout:\s*fixed/);
  assert.match(templateSource, /\.styled-table thead \{ display:\s*table-header-group;\s*\}/);
  assert.match(templateSource, /\.styled-table th:nth-child\(4\), \.styled-table td:nth-child\(4\) \{ width:\s*5% !important;/);
  assert.doesNotMatch(templateSource, /\.styled-table tbody tr\s*\{\s*display:\s*grid/);
  assert.doesNotMatch(rendererSource, /dataset\.label/);
  assert.match(templateSource, /html2canvas@1\.4\.1/);
  assert.match(templateSource, /onclick="descargarReporteComoImagen\(\)"/);
  assert.match(templateSource, /onclick="window\.print\(\)"[\s\S]*?Descargar reporte en PDF/);
  assert.match(templateSource, /onclick="descargarReporteComoImagen\(\)"[\s\S]*?Descargar reporte en Imagen/);
  assert.match(templateSource, /scale:\s*3/);
  assert.match(templateSource, /\.document-page\.is-exporting-image\s*\{[^}]*height:\s*auto;[^}]*min-height:\s*0;[^}]*aspect-ratio:\s*auto;/);
  assert.match(templateSource, /hoja\.classList\.add\('is-exporting-image'\)/);
  assert.match(templateSource, /hoja\.classList\.remove\('is-exporting-image'\)/);
  assert.match(templateSource, /height:\s*hoja\.scrollHeight/);
  assert.match(templateSource, /windowHeight:\s*hoja\.scrollHeight/);
  assert.match(templateSource, /toBlob\(function \(resultado\)/);
  assert.match(templateSource, /enlace\.download = nombreArchivo \+ '\.png'/);
  assert.match(templateSource, /\.accounting-grid \{ grid-template-columns:\s*1\.1fr 1fr 1\.15fr;/);
  assert.match(templateSource, /\.formula-header[\s\S]*linear-gradient/);
  assert.match(templateSource, /\.formula-summary[\s\S]*background:\s*#e5f3ee/);
  assert.match(templateSource, /\.final-amount-card[\s\S]*linear-gradient/);
  assert.match(templateSource, /class="formula-header"[\s\S]*data-report-final-balance/);
  assert.match(templateSource, /class="formula-calculation"[\s\S]*data-report-formula/);
  assert.match(templateSource, /class="accounting-icon"/);
  assert.doesNotMatch(templateSource, /ANGEL ANDRES ORTA QUINTERO|ANDRÉS ANDRADE|\$117\.00/);
});

test('la paginación de impresión mueve la liquidación desde 21 asesores y limita la primera hoja a 30', () => {
  const { calcularDistribucionImpresion } = createPrintHelpers();
  const distribution = (count) => JSON.parse(JSON.stringify(
    calcularDistribucionImpresion(count)
  ));

  assert.deepEqual(distribution(20), {
    requiereSegundaHoja: false,
    asesoresPrimeraHoja: 20,
    asesoresRestantes: 0
  });
  assert.deepEqual(distribution(21), {
    requiereSegundaHoja: true,
    asesoresPrimeraHoja: 21,
    asesoresRestantes: 0
  });
  assert.deepEqual(distribution(30), {
    requiereSegundaHoja: true,
    asesoresPrimeraHoja: 30,
    asesoresRestantes: 0
  });
  assert.deepEqual(distribution(31), {
    requiereSegundaHoja: true,
    asesoresPrimeraHoja: 30,
    asesoresRestantes: 1
  });
  assert.deepEqual(distribution(40), {
    requiereSegundaHoja: true,
    asesoresPrimeraHoja: 30,
    asesoresRestantes: 10
  });
});
