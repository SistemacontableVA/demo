const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const backendSource = fs.readFileSync(
  path.join(__dirname, '..', 'backend', 'Código Nomina.gs'),
  'utf8'
);

test('listar-nominas-coordinador devuelve nombre y cédula de hojas registradas', () => {
  const sheets = [
    'Datos',
    'Juan Pérez',
    'Coordinador_Juan Pérez',
    'Coordinador_ Ana Gómez ',
    'coordinador_Luis',
    'Coordinador_',
    'Resumen coordinador'
  ].map((name) => ({ getName: () => name }));
  const masterRows = [
    ['Encabezado', '', ''],
    ['Encabezado', '', ''],
    ['Juan Pérez', '', '123'],
    ['Ana Gómez', '', '456'],
    ['Luis', '', '789'],
    ['Sin nómina', '', '000']
  ];

  const context = {
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({
        getSheetByName: () => ({
          getLastRow: () => masterRows.length,
          getRange: () => ({ getValues: () => masterRows })
        }),
        getSheets: () => sheets
      })
    },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: (content) => ({
        content,
        setMimeType() { return this; }
      })
    },
    JSON,
    String
  };
  vm.createContext(context);
  vm.runInContext(backendSource, context);

  const response = context.doGet({ parameter: { action: 'listar-nominas-coordinador' } });
  const payload = JSON.parse(response.content);

  assert.equal(payload.ok, true);
  assert.deepEqual(
    JSON.parse(JSON.stringify(payload.nominas)),
    [
      { nombreCoordinador: 'Ana Gómez', cedula: '456' },
      { nombreCoordinador: 'Juan Pérez', cedula: '123' },
      { nombreCoordinador: 'Luis', cedula: '789' }
    ]
  );
});

test('obtener-nomina-coordinador consulta por cédula y mapea resumen y jornadas', () => {
  const lecturas = [];
  const campos = {
    'E5:L10': [
      ['', '', 3, 0, 3, 25, 0, 528.5],
      ['', '', '', '', '', '', '', ''],
      [173, '', '', '', 86.5, '', 442, ''],
      [0, '', '', '', 0, '', '', 528.5],
      ['', '', '', '', '', '', '', ''],
      [0, '', '', '', 0, '', '', 0]
    ]
  };
  const sheet = {
    getName: () => 'Coordinador_JUAN CARLOS CASTELLANO CHIRINOS',
    getLastRow: () => 15,
    getRange: (range) => {
      lecturas.push(range);
      return {
        getValues: () => {
          if (range === 'E5:L10') return campos[range];
        lecturas.push(range);
        assert.equal(range, 'B14:L15');
        return [
          ['La lagunilla', new Date(2026, 7, 4), 9, 1, '', '', '', 4.5, '', '', ''],
          ['', '', '', '', '', '', '', '', '', '', '']
        ];
        }
      };
    }
  };
  const masterRows = [
    ['', '', ''],
    ['', '', ''],
    ['JUAN CARLOS CASTELLANO CHIRINOS', '', '12345']
  ];
  const context = {
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({
        getSheetByName: (name) => name === 'Datos'
          ? {
            getLastRow: () => masterRows.length,
            getRange: () => ({ getValues: () => masterRows })
          }
          : name === sheet.getName() ? sheet : null,
        getSheets: () => [sheet]
      })
    },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: (content) => ({
        content,
        setMimeType() { return this; }
      })
    },
    Utilities: {
      formatDate: () => '04/08/2026'
    },
    JSON,
    String,
    Number,
    Math,
    Date
  };
  vm.createContext(context);
  vm.runInContext(backendSource, context);

  const response = context.doGet({
    parameter: {
      action: 'obtener-nomina-coordinador',
      cedula: '12345'
    }
  });
  const payload = JSON.parse(response.content);

  assert.equal(payload.ok, true);
  assert.equal(payload.nombreCoordinador, 'JUAN CARLOS CASTELLANO CHIRINOS');
  assert.equal(payload.resumen.brigadasCampo, 3);
  assert.equal(payload.resumen.cantidadAfiliacionesGrupales, 173);
  assert.equal(payload.resumen.totalAPagar, 528.5);
  assert.deepEqual(
    JSON.parse(JSON.stringify(payload.jornadas)),
    [{
      fila: 14,
      municipio: 'La lagunilla',
      fecha: '04/08/2026',
      cantidadAfiliacionesGrupales: 9,
      cantidadBrigadas: 1,
      asistidos: '',
      lentes: '',
      prestamoAbono: '',
      valorDia: 4.5,
      comisionVenta: '',
      descuentoComida: '',
      detalle: ''
    }]
  );
  assert.equal(lecturas.filter((range) => range === 'E5:L10').length, 1);
  assert.ok(lecturas.includes('B14:L15'));

  const missing = context.doGet({
    parameter: {
      action: 'obtener-nomina-coordinador',
      cedula: '99999'
    }
  });
  assert.equal(JSON.parse(missing.content).ok, false);
  assert.match(JSON.parse(missing.content).error, /no está registrado/);
});

test('editar y suprimir jornadas de coordinador conserva las fórmulas', () => {
  const celdasGuardadas = [];
  const rangosLimpiados = [];
  let rangoFormato = null;
  let lockActivo = false;
  const filaActual = ['', '', '', '', '', '', '', 'Fórmula Valor Día', 'Fórmula Comisión', '', ''];
  const masterRows = [
    ['', '', ''],
    ['', '', ''],
    ['Ana Coordinadora', '', '123']
  ];
  const coordinatorSheet = {
    getName: () => 'Coordinador_Ana Coordinadora',
    getLastRow: () => 14,
    getRange(row, column, rowCount, columnCount) {
      if (typeof row === 'string') throw new Error('No se esperaba acceso al resumen.');
      rowCount = rowCount || 1;
      columnCount = columnCount || 1;
      return {
        getValues() {
          if (row === 14 && column === 3 && rowCount === 1 && columnCount === 1) return [[filaActual[1]]];
          if (row === 14 && column === 2 && rowCount === 1 && columnCount === 11) return [filaActual.slice()];
          throw new Error('Rango de lectura inesperado: ' + [row, column, rowCount, columnCount].join(','));
        },
        setValue(value) {
          celdasGuardadas.push({ row, column, value });
          filaActual[column - 2] = value;
        },
        setNumberFormat(format) {
          rangoFormato = { row, column, format };
        },
        clearContent() {
          rangosLimpiados.push({ row, column, rowCount, columnCount });
          for (let offset = 0; offset < columnCount; offset++) filaActual[column - 2 + offset] = '';
        }
      };
    }
  };
  const context = {
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({
        getSheetByName: (name) => name === 'Datos'
          ? { getLastRow: () => masterRows.length, getRange: () => ({ getValues: () => masterRows }) }
          : name === coordinatorSheet.getName() ? coordinatorSheet : null,
        getSheets: () => [coordinatorSheet]
      }),
      flush() {}
    },
    LockService: {
      getScriptLock: () => ({
        waitLock() { lockActivo = true; },
        hasLock() { return lockActivo; },
        releaseLock() { lockActivo = false; }
      })
    },
    UrlFetchApp: {
      fetch(url, options) {
        assert.match(url, /functions\/v1\/validate-access/);
        assert.equal(options.headers.Authorization, 'Bearer admin-access');
        return {
          getResponseCode: () => 200,
          getContentText: () => JSON.stringify({ ok: true, user: { role: 'Administrador' } })
        };
      }
    },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: (content) => ({
        content,
        setMimeType() { return this; }
      })
    },
    JSON,
    String,
    Number,
    Date,
    Utilities: {
      formatDate: (date) => [
        String(date.getDate()).padStart(2, '0'),
        String(date.getMonth() + 1).padStart(2, '0'),
        date.getFullYear()
      ].join('/')
    },
    isFinite,
    parseInt
  };
  vm.createContext(context);
  vm.runInContext(backendSource, context);

  const response = context.doGet({
    parameter: {
      action: 'agregar-jornada-coordinador',
      cedula: '123',
      payload: JSON.stringify({
        municipio: 'Valencia',
        fecha: '2026-10-10',
        cantidadAfiliacionesGrupales: '12',
        cantidadBrigadas: '',
        detalle: '  Jornada de prueba  '
      })
    }
  });
  const result = JSON.parse(response.content);

  assert.equal(result.ok, true);
  assert.equal(result.fila, 14);
  assert.deepEqual(celdasGuardadas.map(({ column, value }) => [
    column,
    value instanceof Date ? value.toISOString() : value
  ]), [
    [2, 'Valencia'],
    [3, new Date(2026, 9, 10).toISOString()],
    [4, 12],
    [12, 'Jornada de prueba']
  ]);
  assert.equal(celdasGuardadas.some(({ column }) => column === 9), false);
  assert.deepEqual(rangoFormato, { row: 14, column: 3, format: 'dd/MM/yyyy' });

  const formulaRejected = context.doGet({
    parameter: {
      action: 'agregar-jornada-coordinador',
      cedula: '123',
      payload: JSON.stringify({
        municipio: 'Valencia',
        fecha: '2026-10-11',
        valorDia: '125.50'
      })
    }
  });
  const rejectedResult = JSON.parse(formulaRejected.content);
  assert.equal(rejectedResult.ok, false);
  assert.match(rejectedResult.error, /Valor por Día y Comisión por Venta se calculan en la hoja/);
  assert.equal(celdasGuardadas.length, 4);

  const commissionFormulaRejected = context.doGet({
    parameter: {
      action: 'agregar-jornada-coordinador',
      cedula: '123',
      payload: JSON.stringify({
        municipio: 'Valencia',
        fecha: '2026-10-11',
        comisionVenta: '125.50'
      })
    }
  });
  assert.match(JSON.parse(commissionFormulaRejected.content).error, /Comisión por Venta se calculan/);
  assert.equal(celdasGuardadas.length, 4);

  const deletion = context.doGet({
    parameter: {
      action: 'eliminar-jornada-coordinador',
      cedula: '123',
      fila: '14',
      fechaOriginal: '10/10/2026'
    }
  });
  const deletionResult = JSON.parse(deletion.content);
  assert.equal(deletionResult.ok, true);
  assert.deepEqual(rangosLimpiados.map(({ row, column, rowCount, columnCount }) =>
    [row, column, rowCount, columnCount]), [
    [14, 2, 1, 7],
    [14, 11, 1, 2]
  ]);
  assert.equal(filaActual[7], 'Fórmula Valor Día');
  assert.equal(filaActual[8], 'Fórmula Comisión');
});
