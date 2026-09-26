const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const modulo = (...parts) => path.join(root, 'recordatorioMasivo', 'js', ...parts);

test('MetaConfig no expone credenciales y usa el idioma aprobado', () => {
  const config = fs.readFileSync(modulo('metaConfig.js'), 'utf8');
  const service = fs.readFileSync(modulo('metaService.js'), 'utf8');

  assert.match(config, /TEMPLATE_LANGUAGE:\s*'es_CO'/);
  assert.doesNotMatch(config, /ACCESS_TOKEN|PHONE_NUMBER_ID|graph\.facebook\.com/);
  assert.doesNotMatch(service, /Authorization:\s*['"]Bearer|graph\.facebook\.com/);
  assert.match(service, /send-whatsapp-template/);
});

test('el router carga ApiConfig y Atención Municipio antes de Recordatorio Masivo', () => {
  const router = fs.readFileSync(path.join(root, 'administracion', 'js', 'router.js'), 'utf8');
  const inicio = router.indexOf("'recordatorioMasivo':");
  const ruta = router.slice(inicio, router.indexOf('\n', inicio));

  assert.match(ruta, /scripts:\s*\['assets\/js\/api-config\.js',\s*'atencionMunicipio\/js\/atencionMunicipioService\.js'/);
});

test('normaliza teléfonos internacionales sin + y rechaza números locales', async () => {
  const context = {
    window: {},
    document: {
      createElement: () => ({ parentNode: null }),
      body: {
        appendChild(script) {
          const callback = new URL(script.src).searchParams.get('callback');
          context.window[callback]({
            meta: {},
            pacientes: [
              { paciente: 'Ana', telfLimpio: '+57 (300) 123-4567' },
              { paciente: 'Luis', telfLimpio: '0412-1234567' }
            ]
          });
        }
      }
    },
    setTimeout: () => 1,
    clearTimeout: () => {}
  };
  vm.runInNewContext(fs.readFileSync(modulo('recordatorioMasivoService.js'), 'utf8'), context);

  const datos = await context.RecordatorioMasivoService.obtenerDatosMunicipio('sheet');
  assert.equal(datos.pacientes[0].telfLimpio, '573001234567');
  assert.equal(datos.pacientes[1].telfLimpio, '');
});

test('reutiliza el registro central de Atención Municipio y conserva los datos locales antiguos', async () => {
  const llamadas = [];
  const municipiosCentral = [{
    id: 'MUN_1',
    ruta: 4,
    municipio: 'Maracaibo',
    fechaAtencion: '2026-09-30',
    fechaEntrega: '2026-10-15',
    linkHoja: 'https://docs.google.com/spreadsheets/d/attention-sheet-1/edit',
    estado: 'Por Atender'
  }];
  const localAnterior = [{ nombre: 'Local', fechaAtencion: '2026-09-01', spreadsheetId: 'old-sheet' }];
  const context = {
    window: {
      AtencionMunicipioService: {
        listarMunicipios: async () => municipiosCentral,
        guardarMunicipio: async datos => { llamadas.push({ accion: 'guardar', datos }); return { ok: true, id: 'MUN_2' }; },
        actualizarMunicipio: async datos => { llamadas.push({ accion: 'actualizar', datos }); return { ok: true }; },
        eliminarMunicipio: async id => { llamadas.push({ accion: 'eliminar', id }); return { ok: true }; }
      }
    },
    localStorage: {
      getItem: () => JSON.stringify(localAnterior),
      setItem: () => { throw new Error('No debe escribir la lista de municipios en localStorage'); }
    }
  };
  vm.runInNewContext(fs.readFileSync(modulo('recordatorioMasivoService.js'), 'utf8'), context);

  const central = await context.RecordatorioMasivoService.listarMunicipios();
  assert.equal(central.length, 1);
  assert.equal(central[0].nombre, 'Maracaibo');
  assert.equal(central[0].ruta, 4);
  assert.equal(central[0].spreadsheetId, 'attention-sheet-1');
  assert.equal(context.RecordatorioMasivoService.listarMunicipiosLocales().length, 1);

  const guardado = await context.RecordatorioMasivoService.guardarMunicipio({
    ruta: '5', nombre: 'Cabimas', fechaAtencion: '2026-10-01', fechaEntrega: '2026-10-15',
    linkHoja: 'https://docs.google.com/spreadsheets/d/attention-sheet-2/edit'
  });
  assert.equal(guardado.id, 'MUN_2');
  assert.equal(llamadas[0].accion, 'guardar');
  assert.equal(llamadas[0].datos.municipio, 'Cabimas');
  assert.equal(llamadas[0].datos.linkHoja, 'https://docs.google.com/spreadsheets/d/attention-sheet-2/edit');
});

test('envía las plantillas aprobadas al proxy con idioma y parámetros correctos', async () => {
  const llamadas = [];
  const context = {
    MetaConfig: {
      MODO_SIMULADO: false,
      TEMPLATE_CONSULTA: 'recordatorio_consulta',
      TEMPLATE_ENTREGA: 'recordatorio_entrega',
      TEMPLATE_LANGUAGE: 'es_CO',
      getProxyUrl: () => 'https://proxy.example/exec'
    },
    getTokenAdmin: () => 'session-token',
    URLSearchParams,
    fetch: async (url, options) => {
      llamadas.push({ url, options });
      return { ok: true, json: async () => ({ ok: true, messageId: 'wamid.test' }) };
    }
  };
  vm.runInNewContext(fs.readFileSync(modulo('metaService.js'), 'utf8'), context);

  const paciente = { paciente: 'Ana', telfLimpio: '573001234567', tipoLente: 'Monofocal', saldo: '250' };
  const meta = {
    empresa: 'Óptica', municipio: 'Cali', lugar: 'Centro', direccion: 'Calle 1',
    referencia: 'Frente al parque', fechaAtencion: '2026-10-01', fechaEntrega: '2026-10-15'
  };
  await context.MetaService.enviarMensaje('consulta', paciente, meta, 'attention-sheet-test');
  await context.MetaService.enviarMensaje('entrega', paciente, meta, 'attention-sheet-test');

  const consulta = JSON.parse(new URLSearchParams(llamadas[0].options.body).get('payload'));
  const entrega = JSON.parse(new URLSearchParams(llamadas[1].options.body).get('payload'));
  assert.equal(llamadas[0].url, 'https://proxy.example/exec');
  assert.equal(new URLSearchParams(llamadas[0].options.body).get('adminToken'), 'session-token');
  assert.equal(new URLSearchParams(llamadas[0].options.body).get('spreadsheetId'), 'attention-sheet-test');
  assert.equal(consulta.template.language.code, 'es_CO');
  assert.deepEqual(consulta.template.components[0].parameters.map(item => item.text), [
    'Ana', 'Óptica', 'Cali', 'Centro (Calle 1 - Ref: Frente al parque)', '2026-10-01'
  ]);
  assert.equal(entrega.template.language.code, 'es_CO');
  assert.deepEqual(entrega.template.components[0].parameters.map(item => item.text), [
    'Ana', 'Óptica', 'Monofocal', '2026-10-15', 'Centro', '250'
  ]);
});