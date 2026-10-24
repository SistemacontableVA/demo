const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const backendSource = fs.readFileSync(
  path.join(__dirname, '..', 'backend', 'Código Nomina.gs'),
  'utf8'
);

function crearContexto(filasAdicionales) {
  const encabezados = ['Nombre Promotor', 'Tipo documento', 'Documento', 'Telefono', 'Foto Documento', 'Carnet'];
  const filaPromotor = ['Ana Pérez', 'V', '00123456', '+58 412 123 4567', 'https://drive.google.com/file/d/doc', 'C-100'];
  const filas = [filaPromotor].concat(filasAdicionales || []);
  let nombreHoja = 'Ana Pérez';
  let nombrePlantilla = '12';
  const celdasDatos = new Map();
  const operacionesHoja = [];
  const celdasHoja = new Map([['6:3', 'Ana Pérez']]);
  const formulasHoja = new Map([['10:9', '=SUM(I21:I205)']]);
  const formulasPlantilla = new Map();
  for (let fila = 16; fila <= 200; fila++) {
    formulasPlantilla.set(fila + ':9', '=FORMULA_I_FILA');
    formulasPlantilla.set(fila + ':10', '=IF(AND(RC[-5]<>"",RC[-5]<8),"P. Hotel","")');
  }

  function rangoHoja(row, column, rowCount, columnCount, formulasHojaLocal) {
    formulasHojaLocal = formulasHojaLocal || formulasHoja;
    if (typeof row === 'string') {
      const celdas = row.match(/^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/i);
      const numeroColumna = (letras) => letras.toUpperCase().split('').reduce((total, letra) => total * 26 + letra.charCodeAt(0) - 64, 0);
      column = numeroColumna(celdas[1]);
      row = Number(celdas[2]);
      if (celdas[3]) {
        columnCount = numeroColumna(celdas[3]) - column + 1;
        rowCount = Number(celdas[4]) - row + 1;
      }
    }
    rowCount = rowCount || 1;
    columnCount = columnCount || 1;
    function recorrer(callback) {
      for (let ro = 0; ro < rowCount; ro++) {
        for (let co = 0; co < columnCount; co++) callback(row + ro, column + co, ro, co);
      }
    }
    return {
      getCell(rowOffset, columnOffset) { return rangoHoja(row + rowOffset - 1, column + columnOffset - 1, 1, 1, formulasHojaLocal); },
      getValue() { return celdasHoja.get(row + ':' + column) || ''; },
      setValue(value) { celdasHoja.set(row + ':' + column, value); },
      getValues() {
        const values = [];
        for (let ro = 0; ro < rowCount; ro++) {
          const line = [];
          for (let co = 0; co < columnCount; co++) line.push(celdasHoja.get((row + ro) + ':' + (column + co)) || '');
          values.push(line);
        }
        return values;
      },
      getFormulas() {
        const formulas = [];
        for (let ro = 0; ro < rowCount; ro++) {
          const line = [];
          for (let co = 0; co < columnCount; co++) line.push(formulasHojaLocal.get((row + ro) + ':' + (column + co)) || '');
          formulas.push(line);
        }
        return formulas;
      },
      getFormulasR1C1() { return this.getFormulas(); },
      getFormulaR1C1() { return formulasHojaLocal.get(row + ':' + column) || ''; },
      setFormulaR1C1(formula) {
        operacionesHoja.push({ tipo: 'setFormulaR1C1', row, column, rowCount, columnCount, formula });
        recorrer((r, c) => formulasHojaLocal.set(r + ':' + c, formula));
      },
      setFormulasR1C1(formulas) {
        operacionesHoja.push({ tipo: 'setFormulasR1C1', row, column, rowCount, columnCount });
        formulas.forEach((line, ro) => line.forEach((formula, co) => {
          const key = (row + ro) + ':' + (column + co);
          if (formula) formulasHojaLocal.set(key, formula);
          else formulasHojaLocal.delete(key);
        }));
      },
      setFormula(formula) { formulasHojaLocal.set(row + ':' + column, formula); },
      setValues(values) {
        values.forEach((line, ro) => line.forEach((value, co) => celdasHoja.set((row + ro) + ':' + (column + co), value)));
      },
      clearContent() {
        operacionesHoja.push({ tipo: 'clearContent', row, column, rowCount, columnCount });
        recorrer((r, c) => {
          celdasHoja.delete(r + ':' + c);
          formulasHojaLocal.delete(r + ':' + c);
        });
      }
    };
  }

  function getRange(row, column, rowCount, columnCount) {
    rowCount = rowCount || 1;
    columnCount = columnCount || 1;
    return {
      getValues() {
        if (row === 1 && column === 1) {
          return [['Sistema', '', ''], encabezados.slice(0, 3)].concat(filas.map((fila) => fila.slice(0, 3)));
        }
        return [];
      },
      getDisplayValues() {
        if (row === 2 && column === 1) return [encabezados];
        const result = [];
        for (let offset = 0; offset < rowCount; offset++) {
          const rowValues = filas[row + offset - 3] || [];
          result.push(rowValues.slice(column - 1, column - 1 + columnCount).map(String));
        }
        return result;
      },
      setNumberFormat() {},
      setValues(values) {
        for (let rowOffset = 0; rowOffset < values.length; rowOffset++) {
          for (let columnOffset = 0; columnOffset < values[rowOffset].length; columnOffset++) {
            const key = (row + rowOffset) + ':' + (column + columnOffset);
            celdasDatos.set(key, values[rowOffset][columnOffset]);
            if (row + rowOffset >= 3) {
              const indiceFila = row + rowOffset - 3;
              while (!filas[indiceFila]) filas[indiceFila] = [];
              filas[indiceFila][column - 1 + columnOffset] = values[rowOffset][columnOffset];
            }
          }
        }
      }
    };
  }

  const hojaDatos = {
    getName: () => 'Datos',
    getLastRow: () => filas.length + 2,
    getRange,
    deleteRow(row) { filas.splice(row - 3, 1); }
  };
  const hojaPromotor = {
    getName: () => nombreHoja,
    getSheetId: () => 42,
    setName(nombre) { nombreHoja = nombre; },
    getRange(row, column, rowCount, columnCount) { return rangoHoja(row, column, rowCount, columnCount, formulasHoja); }
  };
  const hojaPlantilla = {
    getName: () => nombrePlantilla,
    getSheetId: () => 12,
    setName(nombre) { nombrePlantilla = nombre; },
    getRange(row, column, rowCount, columnCount) { return rangoHoja(row, column, rowCount, columnCount, formulasPlantilla); }
  };
  const contexto = {
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({
        getSheetByName(nombre) {
          if (nombre === 'Datos') return hojaDatos;
          if (nombre === nombreHoja) return hojaPromotor;
          if (nombre === nombrePlantilla) return hojaPlantilla;
          return null;
        },
        getSheets: () => [hojaDatos, hojaPromotor, hojaPlantilla]
      })
    },
    LockService: {
      getScriptLock: () => ({
        waitLock() {},
        hasLock: () => true,
        releaseLock() {}
      })
    },
    CacheService: { getScriptCache: () => ({ remove() {} }) },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput(content) {
        return { content, setMimeType() { return this; } };
      }
    },
    JSON,
    String,
    Number,
    Date,
    Math,
    isFinite,
    parseInt,
    console
  };
  vm.createContext(contexto);
  vm.runInContext(backendSource, contexto);
  return {
    contexto,
    filas,
    getNombreHoja: () => nombreHoja,
    getNombrePlantilla: () => nombrePlantilla,
    getC6: () => celdasHoja.get('6:3') || '',
    getFormulaI16: () => formulasHoja.get('16:9') || '',
    getFormulaJ16: () => formulasHoja.get('16:10') || '',
    getFormulaJ200: () => formulasHoja.get('200:10') || '',
    operacionesHoja
  };
}

function actualizar(contexto, cambios, documentoOriginal) {
  const payload = {
    fila: 3,
    documentoOriginal: documentoOriginal || '00123456',
    cambios: cambios || {}
  };
  const response = contexto.doGet({
    method: 'POST',
    parameter: {
      action: 'actualizar-promotor',
      payload: JSON.stringify(payload)
    }
  });
  return JSON.parse(response.content);
}

test('editar promotor actualiza Datos y renombra su pestaña cuando cambia el nombre', () => {
  const { contexto, filas, getNombreHoja, getC6 } = crearContexto();
  const resultado = actualizar(contexto, { nombre: 'Ana María Pérez', telefono: '04121234567' });

  assert.equal(resultado.ok, true, resultado.error);
  assert.equal(resultado.fila, 3);
  assert.equal(getNombreHoja(), 'ANA MARÍA PÉREZ');
  assert.equal(getC6(), 'ANA MARÍA PÉREZ');
  assert.equal(filas[0][0], 'ANA MARÍA PÉREZ');
  assert.equal(filas[0][3], '04121234567');
  assert.equal(filas[0][1], 'V');
  assert.equal(filas[0][2], '00123456');
  assert.equal(filas[0][4], 'https://drive.google.com/file/d/doc');
  assert.equal(filas[0][5], 'C-100');
});

test('edición rechaza documento original obsoleto sin cambiar Datos ni la pestaña', () => {
  const { contexto, filas, getNombreHoja } = crearContexto();
  const resultado = actualizar(contexto, { telefono: '04121234567' }, 'documento-anterior');

  assert.equal(resultado.ok, false);
  assert.match(resultado.error, /cambiaron desde que abriste la edición/);
  assert.equal(filas[0][0], 'Ana Pérez');
  assert.equal(getNombreHoja(), 'Ana Pérez');
});

test('edición rechaza un nombre ya usado por otro promotor', () => {
  const segundoPromotor = ['Luis Díaz', 'V', '00999999', '+58 412 765 4321', 'https://drive.google.com/file/d/otro', 'C-200'];
  const { contexto, filas, getNombreHoja } = crearContexto([segundoPromotor]);
  const resultado = actualizar(contexto, { nombre: 'Luis Díaz' });

  assert.equal(resultado.ok, false);
  assert.match(resultado.error, /Ya existe otro promotor/);
  assert.equal(filas[0][0], 'Ana Pérez');
  assert.equal(getNombreHoja(), 'Ana Pérez');
});

test('edición permite borrar un campo opcional sin alterar los demás', () => {
  const { contexto, filas, getNombreHoja, getC6 } = crearContexto();
  const resultado = actualizar(contexto, { telefono: '' });

  assert.equal(resultado.ok, true);
  assert.equal(filas[0][3], '');
  assert.equal(filas[0][0], 'ANA PÉREZ');
  assert.equal(getNombreHoja(), 'ANA PÉREZ');
  assert.equal(getC6(), 'ANA PÉREZ');
  assert.equal(filas[0][2], '00123456');
  assert.equal(filas[0][4], 'https://drive.google.com/file/d/doc');
  assert.equal(filas[0][5], 'C-100');
});

test('alta permite dejar campos opcionales vacíos y consume la primera plantilla', () => {
  const { contexto, filas, getNombrePlantilla, getC6 } = crearContexto();
  const response = contexto.doGet({
    method: 'POST',
    parameter: {
      action: 'crear-promotor',
      payload: JSON.stringify({
        nombre: 'Pablo Vega',
        documento: '00987654'
      })
    }
  });
  const resultado = JSON.parse(response.content);

  assert.equal(resultado.ok, true);
  assert.equal(resultado.nombre, 'PABLO VEGA');
  assert.equal(resultado.plantilla, '12');
  assert.equal(getNombrePlantilla(), 'PABLO VEGA');
  assert.equal(getC6(), 'PABLO VEGA');
  assert.deepEqual(filas[1], ['PABLO VEGA', '', '00987654', '', '', '']);
});

test('eliminar promotor conserva la pestaña y restaura fórmulas I y J antes de devolverla a plantilla', () => {
  const { contexto, filas, getNombreHoja, getC6, getFormulaI16, getFormulaJ16, getFormulaJ200, operacionesHoja } = crearContexto();
  const response = contexto.doGet({
    method: 'POST',
    parameter: {
      action: 'eliminar-promotor',
      payload: JSON.stringify({ fila: 3, documentoOriginal: '00123456' })
    }
  });
  const resultado = JSON.parse(response.content);

  assert.equal(resultado.ok, true, resultado.error);
  assert.equal(resultado.plantilla, '13');
  assert.equal(filas.length, 0);
  assert.equal(getNombreHoja(), '13');
  assert.equal(getC6(), '');
  assert.equal(getFormulaI16(), '=FORMULA_I_FILA');
  assert.equal(getFormulaJ16(), '=IF(AND(RC[-5]<>"",RC[-5]<8),"P. Hotel","")');
  assert.equal(getFormulaJ200(), '=IF(AND(RC[-5]<>"",RC[-5]<8),"P. Hotel","")');
  assert.deepEqual(
    operacionesHoja.filter((operacion) => operacion.tipo === 'clearContent').map(({ row, column, rowCount, columnCount }) => [row, column, rowCount, columnCount]),
    [[16, 2, 185, 7], [6, 3, 1, 1]]
  );
  assert.deepEqual(
    operacionesHoja.filter((operacion) => operacion.tipo === 'setFormulasR1C1').map(({ row, column, rowCount, columnCount }) => [row, column, rowCount, columnCount]),
    [[16, 9, 185, 2]]
  );
});
