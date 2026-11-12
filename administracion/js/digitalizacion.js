var _digPlanillas = [];
var _digPlanillaActiva = -1;
var _digPdfJsPromise = null;
var _digArrastres = 0;

function renderDigitalizacion() {
  var contenedor = document.getElementById('admin-content');
  if (!contenedor) return;

  fetch('administracion/templates/digitalizacion.html?t=' + Date.now(), { cache: 'no-store' })
    .then(function (respuesta) {
      if (!respuesta.ok) throw new Error('No se pudo cargar la vista de Digitalización de Planillas.');
      return respuesta.text();
    })
    .then(function (html) {
      if (!document.getElementById('admin-content') ||
          (typeof _adminRutaActual !== 'undefined' && _adminRutaActual !== 'digitalizacion')) return;
      contenedor.innerHTML = html;
      _digInicializar();
    })
    .catch(function (error) {
      console.error('[Digitalizacion] Error cargando la vista:', error);
      contenedor.innerHTML = '<div class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">' +
        _digEscapeHtml(error.message) + '</div>';
    });
}

function _digInicializar() {
  var selector = document.getElementById('dig-file');
  var botonCarga = document.getElementById('dig-load');
  var zonaCarga = document.getElementById('dig-dropzone');
  var botonCopiar = document.getElementById('dig-copy');
  var botonExcel = document.getElementById('dig-xlsx');
  selector.multiple = true;
  selector.addEventListener('change', _digSeleccionarPdf);
  botonCarga.addEventListener('click', function () { selector.click(); });
  zonaCarga.addEventListener('click', function () { selector.click(); });
  zonaCarga.addEventListener('keydown', function (evento) {
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault();
      selector.click();
    }
  });
  zonaCarga.addEventListener('dragenter', function (evento) {
    evento.preventDefault();
    _digArrastres += 1;
    zonaCarga.classList.add('border-blue-500', 'bg-blue-100');
  });
  zonaCarga.addEventListener('dragover', function (evento) {
    evento.preventDefault();
    evento.dataTransfer.dropEffect = 'copy';
  });
  zonaCarga.addEventListener('dragleave', function (evento) {
    evento.preventDefault();
    _digArrastres = Math.max(0, _digArrastres - 1);
    if (!_digArrastres) zonaCarga.classList.remove('border-blue-500', 'bg-blue-100');
  });
  zonaCarga.addEventListener('drop', function (evento) {
    evento.preventDefault();
    _digArrastres = 0;
    zonaCarga.classList.remove('border-blue-500', 'bg-blue-100');
    _digProcesarArchivos(evento.dataTransfer.files);
  });
  botonCopiar.addEventListener('click', _digCopiar);
  botonExcel.addEventListener('click', _digDescargarExcel);
  document.getElementById('dig-rows').addEventListener('input', _digCapturarEdicion);
  ['dig-promotor', 'dig-lugar', 'dig-fecha', 'dig-municipio'].forEach(function (id) {
    document.getElementById(id).addEventListener('input', _digCapturarMetadatos);
  });
  ['dig-promotor', 'dig-fecha'].forEach(function (id) {
    document.getElementById(id).addEventListener('change', _digOrdenarYRenderizarPlanillas);
  });

  _digPlanillas = [];
  _digPlanillaActiva = -1;
  _digRenderPlanillas();
}

async function _digSeleccionarPdf(evento) {
  var archivos = Array.from(evento.target.files || []);
  evento.target.value = '';
  await _digProcesarArchivos(archivos);
}

async function _digProcesarArchivos(listaArchivos) {
  var archivos = Array.from(listaArchivos || []);
  if (!archivos.length) return;

  var validos = archivos.filter(function (archivo) {
    return archivo.type === 'application/pdf' || /\.pdf$/i.test(archivo.name);
  });
  var invalidos = archivos.filter(function (archivo) {
    return archivo.type !== 'application/pdf' && !/\.pdf$/i.test(archivo.name);
  }).map(function (archivo) { return archivo.name; });
  if (!validos.length) {
    _digEstado('Selecciona uno o varios archivos PDF.', 'error');
    return;
  }

  var botonCarga = document.getElementById('dig-load');
  var zonaCarga = document.getElementById('dig-dropzone');
  var textoBotonCarga = botonCarga.innerHTML;
  botonCarga.disabled = true;
  zonaCarga.disabled = true;
  zonaCarga.classList.add('cursor-wait', 'opacity-60');
  botonCarga.setAttribute('aria-busy', 'true');
  botonCarga.innerHTML = '<svg class="mr-2 inline h-4 w-4 animate-spin align-[-3px]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Procesando PDFs…';
  var nuevas = [];
  var errores = invalidos.map(function (nombre) {
    return nombre + ': el archivo no es un PDF.';
  });
  try {
    for (var i = 0; i < validos.length; i += 1) {
      var archivo = validos[i];
      _digEstado('Procesando planilla ' + (i + 1) + ' de ' + validos.length + ': ' + archivo.name, 'info');
      try {
        var resultado = await _digExtraerPdf(archivo);
        if (!resultado.registros.length) {
          throw new Error('No se identificaron filas de pacientes. Comprueba que sea un PDF digital generado desde la plantilla.');
        }
        nuevas.push({
          nombre: archivo.name,
          encabezado: resultado.encabezado,
          registros: resultado.registros
        });
      } catch (error) {
        console.error('[Digitalizacion] Error leyendo "' + archivo.name + '":', error);
        errores.push(archivo.name + ': ' + (error.message || 'No se pudo leer el PDF.'));
      }
    }
    if (nuevas.length) {
      var primeraNueva = nuevas[0];
      _digPlanillas = _digPlanillas.concat(nuevas);
      _digOrdenarPlanillas();
      _digPlanillaActiva = _digPlanillas.indexOf(primeraNueva);
      _digRenderPlanillas();
    }
    if (errores.length) {
      _digEstado(
        (nuevas.length ? nuevas.length + ' planilla(s) cargada(s). ' : '') +
        errores.length + ' archivo(s) no se pudieron procesar: ' + errores.join(' | '),
        'error'
      );
    } else {
      _digEstado(nuevas.length + ' planilla(s) cargada(s). Revisa cada pestaña; el Excel descargará el consolidado.', 'success');
    }
  } finally {
    botonCarga.disabled = false;
    zonaCarga.disabled = false;
    zonaCarga.classList.remove('cursor-wait', 'opacity-60');
    botonCarga.removeAttribute('aria-busy');
    botonCarga.innerHTML = textoBotonCarga;
  }
}

async function _digExtraerPdf(archivo) {
  var pdfjs = await _digCargarPdfJs();
  var pdf = await pdfjs.getDocument({ data: await archivo.arrayBuffer() }).promise;
  var paginas = [];
  var tieneTexto = false;

  for (var paginaNumero = 1; paginaNumero <= pdf.numPages; paginaNumero += 1) {
    var pagina = await pdf.getPage(paginaNumero);
    var contenido = await pagina.getTextContent();
    var items = contenido.items.filter(function (item) {
      return item && typeof item.str === 'string' && item.str.trim();
    }).map(function (item) {
      return { str: item.str.trim(), x: item.transform[4], y: item.transform[5] };
    });
    if (items.length) tieneTexto = true;
    paginas.push(_digAgruparLineas(items));
  }

  if (!tieneTexto) {
    throw new Error('Este PDF no contiene texto digital seleccionable. Solicita al promotor que lo genere desde la plantilla compartida con Imprimir → Guardar como PDF; no uses escáner ni captura de pantalla.');
  }
  return _digParsearPaginas(paginas);
}

function _digCargarPdfJs() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (_digPdfJsPromise) return _digPdfJsPromise;
  _digPdfJsPromise = import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs')
    .then(function (pdfjs) {
      pdfjs.GlobalWorkerOptions.workerSrc =
        'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
      window.pdfjsLib = pdfjs;
      return pdfjs;
    })
    .catch(function (error) {
      _digPdfJsPromise = null;
      console.error('[Digitalizacion] Error cargando PDF.js:', error);
      throw new Error('No se pudo cargar PDF.js. Verifica tu conexión e inténtalo nuevamente.');
    });
  return _digPdfJsPromise;
}

function _digAgruparLineas(items) {
  items.sort(function (a, b) { return b.y - a.y || a.x - b.x; });
  var lineas = [];
  items.forEach(function (item) {
    var linea = lineas[lineas.length - 1];
    if (linea && Math.abs(linea.y - item.y) > 2.5) linea = null;
    if (!linea) {
      linea = { y: item.y, items: [] };
      lineas.push(linea);
    }
    linea.items.push(item);
    linea.y = linea.items.reduce(function (suma, actual) { return suma + actual.y; }, 0) / linea.items.length;
  });
  lineas.forEach(function (linea) {
    linea.items.sort(function (a, b) { return a.x - b.x; });
    linea.text = linea.items.map(function (item) { return item.str; }).join(' ').replace(/\s+/g, ' ').trim();
  });
  return lineas.sort(function (a, b) { return b.y - a.y; });
}

function _digParsearPaginas(paginas) {
  var encabezado = { promotor: '', lugar_brigada: '', fecha: '', municipio: '' };
  var registros = [];
  paginas.forEach(function (lineas) {
    encabezado = _digExtraerEncabezado(lineas, encabezado);
    _digExtraerRegistrosPagina(lineas).forEach(function (registro) {
      if (Object.keys(registro).some(function (campo) { return registro[campo]; })) {
        registros.push(registro);
      }
    });
  });
  return { encabezado: encabezado, registros: registros };
}

function _digExtraerRegistrosPagina(lineas) {
  var campos = [
    { key: 'no_volante', expresion: /N(?:O\.?|[º°])\s*VOLANTE/ },
    { key: 'identificacion', expresion: /IDENTIFICACI/ },
    { key: 'nombre_paciente', expresion: /NOMBRE/ },
    { key: 'telefono_1', expresion: /TELEFONO\s*1/ },
    { key: 'telefono_2', expresion: /TELEFONO\s*2/ },
    { key: 'abono_observacion', expresion: /ABONO|NOTA/ }
  ];
  var items = [];
  lineas.forEach(function (linea) {
    linea.items.forEach(function (item) {
      items.push({ str: item.str, x: item.x, y: item.y === undefined ? linea.y : item.y });
    });
  });
  items.sort(function (a, b) { return b.y - a.y || a.x - b.x; });

  var inicios = items.filter(function (item) {
    return campos[0].expresion.test(_digNormalizar(item.str));
  });

  return inicios.map(function (inicio, indice) {
    var siguienteY = inicios[indice + 1] ? inicios[indice + 1].y : inicio.y - 50;
    var limiteInferior = siguienteY + 2;
    var anclas = campos.map(function (campo) {
      var ancla = items.find(function (item) {
        return item.y <= inicio.y + 15 && item.y > limiteInferior &&
          campo.expresion.test(_digNormalizar(item.str));
      });
      return ancla ? { key: campo.key, x: ancla.x, y: ancla.y } : null;
    }).filter(Boolean).sort(function (a, b) { return a.x - b.x; });

    var registro = {
      no_volante: '',
      identificacion: '',
      nombre_paciente: '',
      telefono_1: '',
      telefono_2: '',
      nota_digitador: '',
      abono_consulta: ''
    };
    anclas.forEach(function (ancla, anclaIndice) {
      var siguienteX = anclas[anclaIndice + 1] ? anclas[anclaIndice + 1].x - 10 : Infinity;
      var texto = items.filter(function (item) {
        return item.y < inicio.y - 2 && item.y > limiteInferior &&
          item.x >= ancla.x - 10 && item.x < siguienteX &&
          !campos.some(function (campo) {
            return campo.expresion.test(_digNormalizar(item.str));
          });
      }).sort(function (a, b) { return b.y - a.y || a.x - b.x; })
        .map(function (item) { return item.str; }).join(' ').trim();

      if (ancla.key === 'abono_observacion') {
        var separado = _digSepararAbonoNota(texto);
        registro.abono_consulta = separado.abono;
        registro.nota_digitador = separado.nota;
      } else {
        registro[ancla.key] = texto;
      }
    });
    return registro;
  });
}

function _digExtraerEncabezado(lineas, valoresIniciales) {
  var encabezado = Object.assign({}, valoresIniciales);
  var llaves = [
    { key: 'promotor', label: 'PROMOTOR' },
    { key: 'lugar_brigada', label: 'LUGAR' },
    { key: 'fecha', label: 'FECHA' },
    { key: 'municipio', label: 'MUNICIPIO' }
  ];
  var etiquetasLimite = llaves.map(function (campo) { return campo.label; }).concat('PACIENTES AFILIADOS');

  lineas.forEach(function (linea, indice) {
    var contieneEtiqueta = llaves.some(function (campo) {
      return linea.items.some(function (item) {
        return new RegExp('^' + campo.label + '(?:\\s*[:.-]|$)').test(_digNormalizar(item.str));
      });
    });
    if (!contieneEtiqueta) return;
    llaves.forEach(function (campo) {
      if (encabezado[campo.key]) return;
      var valor = _digValorDespuesDeEtiqueta(linea.items, campo.label, etiquetasLimite);
      if (!valor && lineas[indice + 1]) {
        valor = _digValorDespuesDeEtiqueta(lineas[indice + 1].items, campo.label, etiquetasLimite);
      }
      if (valor) encabezado[campo.key] = valor;
    });
  });
  encabezado.fecha = _digNormalizarFecha(encabezado.fecha);
  return encabezado;
}

function _digValorDespuesDeEtiqueta(items, etiqueta, etiquetas) {
  var indice = items.findIndex(function (item) {
    return new RegExp('^' + etiqueta + '(?:\\s*[:.-]|$)').test(_digNormalizar(item.str));
  });
  if (indice < 0) return '';
  var actual = items[indice].str;
  var indiceEtiqueta = _digNormalizar(actual).indexOf(etiqueta);
  var resto = indiceEtiqueta >= 0 ? actual.slice(indiceEtiqueta + etiqueta.length).trim() : '';
  var valores = resto ? [resto] : [];
  for (var i = indice + 1; i < items.length; i += 1) {
    var normalizado = _digNormalizar(items[i].str);
    if (etiquetas.some(function (otra) { return normalizado.indexOf(otra) === 0; })) break;
    valores.push(items[i].str);
  }
  return valores.join(' ').replace(/^[\s:.-]+|[\s:.-]+$/g, '').trim();
}

function _digContieneEtiquetasRegistro(linea) {
  var texto = _digNormalizar(linea.text);
  return texto.indexOf('VOLANTE') !== -1 &&
    texto.indexOf('IDENTIFICACION') !== -1 &&
    texto.indexOf('NOMBRE') !== -1;
}

function _digExtraerRegistro(lineaEtiquetas, lineaValores) {
  var campos = [
    { key: 'no_volante', expresion: /N(?:O\.?|[º°])\s*VOLANTE/ },
    { key: 'identificacion', expresion: /IDENTIFICACI/ },
    { key: 'nombre_paciente', expresion: /NOMBRE/ },
    { key: 'telefono_1', expresion: /TELEFONO\s*1/ },
    { key: 'telefono_2', expresion: /TELEFONO\s*2/ },
    { key: 'abono_observacion', expresion: /ABONO|NOTA/ }
  ];
  var anchors = [];
  campos.forEach(function (campo) {
    var elemento = lineaEtiquetas.items.find(function (item) {
      return campo.expresion.test(_digNormalizar(item.str));
    });
    if (elemento) anchors.push({ key: campo.key, x: elemento.x });
  });
  anchors.sort(function (a, b) { return a.x - b.x; });

  var registro = {
    no_volante: '',
    identificacion: '',
    nombre_paciente: '',
    telefono_1: '',
    telefono_2: '',
    nota_digitador: '',
    abono_consulta: ''
  };
  if (!anchors.length) return registro;

  anchors.forEach(function (anchor, indice) {
    var siguienteX = anchors[indice + 1] ? anchors[indice + 1].x : Infinity;
    var elementos = lineaValores.items.filter(function (item) {
      return item.x >= anchor.x && item.x < siguienteX;
    });
    var valor = elementos.map(function (item) { return item.str; }).join(' ').trim();
    if (anchor.key === 'abono_observacion') {
      var separado = _digSepararAbonoNota(valor);
      registro.abono_consulta = separado.abono;
      registro.nota_digitador = separado.nota;
    } else {
      registro[anchor.key] = valor;
    }
  });
  return registro;
}

function _digSepararAbonoNota(valor) {
  var texto = String(valor || '').trim();
  var soloMonto = texto.match(/^\$?\s*-?\d[\d.,\s]*$/);
  if (soloMonto) return { abono: soloMonto[0].replace(/[$\s]/g, ''), nota: '' };
  var monto = texto.match(/\$?\s*-?\d[\d.,]*/);
  if (!monto) return { abono: '', nota: texto };
  var abono = monto[0].replace(/[$\s]/g, '');
  var nota = (texto.slice(0, monto.index) + ' ' + texto.slice(monto.index + monto[0].length))
    .replace(/[;,|/-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return { abono: abono, nota: nota };
}

function _digNormalizarFecha(valor) {
  var texto = String(valor || '').trim();
  var iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[0];
  var latina = texto.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  return latina ? latina[3] + '-' + latina[2].padStart(2, '0') + '-' + latina[1].padStart(2, '0') : texto;
}

function _digNormalizar(valor) {
  return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
}

function _digCompararPlanillas(a, b) {
  var promotorA = _digNormalizar(a.encabezado.promotor || a.nombre);
  var promotorB = _digNormalizar(b.encabezado.promotor || b.nombre);
  if (promotorA !== promotorB) return promotorA < promotorB ? -1 : 1;

  var fechaA = _digNormalizarFecha(a.encabezado.fecha);
  var fechaB = _digNormalizarFecha(b.encabezado.fecha);
  if (fechaA !== fechaB) return fechaA < fechaB ? -1 : 1;

  var nombreA = _digNormalizar(a.nombre);
  var nombreB = _digNormalizar(b.nombre);
  return nombreA === nombreB ? 0 : (nombreA < nombreB ? -1 : 1);
}

function _digOrdenarPlanillas() {
  _digPlanillas.sort(_digCompararPlanillas);
}

function _digOrdenarYRenderizarPlanillas() {
  var planillaActiva = _digPlanillaActual();
  _digOrdenarPlanillas();
  _digPlanillaActiva = _digPlanillas.indexOf(planillaActiva);
  _digRenderPlanillas();
}

function _digPlanillaActual() {
  return _digPlanillas[_digPlanillaActiva] || null;
}

function _digRenderPlanillas() {
  var tabs = document.getElementById('dig-tabs');
  tabs.innerHTML = '';
  if (!_digPlanillas.length) {
    var vacio = document.createElement('p');
    vacio.className = 'px-2 py-3 text-xs text-slate-400';
    vacio.textContent = 'Carga una o varias planillas PDF.';
    tabs.appendChild(vacio);
  }
  _digPlanillas.forEach(function (planilla, indice) {
    var activa = indice === _digPlanillaActiva;
    var grupo = document.createElement('div');
    grupo.className = 'flex w-full min-w-0 items-stretch overflow-hidden rounded-lg border ' +
      (activa ? 'border-blue-700 bg-blue-50' : 'border-slate-200 bg-white');
    grupo.setAttribute('role', 'group');
    grupo.setAttribute('aria-label', 'Planilla ' + (indice + 1));

    var tab = document.createElement('button');
    tab.type = 'button';
    tab.id = 'dig-tab-' + indice;
    tab.setAttribute('aria-pressed', String(activa));
    tab.title = planilla.nombre;
    tab.className = 'min-w-0 flex-1 truncate px-3 py-2 text-left text-xs font-semibold transition ' +
      (activa ? 'text-blue-800' : 'text-slate-600 hover:bg-slate-50');
    var nombrePromotor = String(planilla.encabezado.promotor || '').trim();
    tab.textContent = 'Planilla ' + (indice + 1) + ' · ' + (nombrePromotor || planilla.nombre);
    tab.addEventListener('click', function () {
      _digPlanillaActiva = indice;
      _digRenderPlanillas();
    });
    tab.addEventListener('keydown', function (evento) {
      if (evento.key !== 'ArrowLeft' && evento.key !== 'ArrowRight') return;
      evento.preventDefault();
      var desplazamiento = evento.key === 'ArrowRight' ? 1 : -1;
      var siguiente = (_digPlanillaActiva + desplazamiento + _digPlanillas.length) % _digPlanillas.length;
      _digPlanillaActiva = siguiente;
      _digRenderPlanillas();
      document.getElementById('dig-tab-' + siguiente).focus();
    });

    var eliminar = document.createElement('button');
    eliminar.type = 'button';
    eliminar.className = 'shrink-0 border-l border-slate-200 px-2 text-slate-500 transition hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-400';
    eliminar.setAttribute('aria-label', 'Eliminar planilla ' + (indice + 1) + ': ' + (planilla.encabezado.promotor || planilla.nombre));
    eliminar.title = 'Eliminar esta planilla';
    eliminar.textContent = '×';
    eliminar.addEventListener('click', function () {
      _digEliminarPlanilla(indice);
    });

    grupo.appendChild(tab);
    grupo.appendChild(eliminar);
    tabs.appendChild(grupo);
  });
  _digRenderTabla();
}

function _digEliminarPlanilla(indice) {
  if (indice < 0 || indice >= _digPlanillas.length) return;
  var eliminada = _digPlanillas.splice(indice, 1)[0];
  if (!_digPlanillas.length) {
    _digPlanillaActiva = -1;
  } else if (indice < _digPlanillaActiva) {
    _digPlanillaActiva -= 1;
  } else if (indice === _digPlanillaActiva) {
    _digPlanillaActiva = Math.min(indice, _digPlanillas.length - 1);
  }
  _digRenderPlanillas();
  _digEstado('Se eliminó la planilla ' + (eliminada.encabezado.promotor || eliminada.nombre) + '.', 'info');
}

function _digRenderTabla() {
  var planilla = _digPlanillaActual();
  var ids = [
    ['dig-promotor', 'promotor'],
    ['dig-lugar', 'lugar_brigada'],
    ['dig-fecha', 'fecha'],
    ['dig-municipio', 'municipio']
  ];
  ids.forEach(function (campo) {
    var input = document.getElementById(campo[0]);
    input.value = planilla ? planilla.encabezado[campo[1]] || '' : '';
    input.disabled = !planilla;
  });
  var registros = planilla ? planilla.registros : [];
  _digRenderTablaRegistros();
  document.getElementById('dig-copy').disabled = !registros.length;
  document.getElementById('dig-xlsx').disabled = !_digPlanillas.some(function (item) { return item.registros.length; });
  var panel = document.getElementById('dig-panel');
  panel.setAttribute('aria-label', planilla ? 'Registros de ' + (planilla.encabezado.promotor || planilla.nombre) : 'Registros de la planilla seleccionada');
  panel.setAttribute('aria-labelledby', planilla ? 'dig-tab-' + _digPlanillaActiva : '');
}

function _digRenderTablaRegistros() {
  var cuerpo = document.getElementById('dig-rows');
  if (!cuerpo) return;
  var registros = (_digPlanillaActual() || {}).registros || [];
  cuerpo.innerHTML = '';
  if (!registros.length) {
    var filaVacia = document.createElement('tr');
    filaVacia.innerHTML = '<td colspan="8" class="px-4 py-10 text-center text-sm text-slate-400">Carga una o varias planillas PDF para extraer sus registros.</td>';
    cuerpo.appendChild(filaVacia);
  } else {
    registros.forEach(function (registro, indice) {
      var tr = document.createElement('tr');
      tr.className = 'border-b border-slate-100 last:border-0';
      var numero = document.createElement('td');
      numero.className = 'px-2 py-2 text-center text-xs text-slate-500';
      numero.textContent = String(indice + 1);
      tr.appendChild(numero);
      [
        ['no_volante', registro.no_volante],
        ['identificacion', registro.identificacion],
        ['nombre_paciente', registro.nombre_paciente],
        ['telefono_1', registro.telefono_1],
        ['telefono_2', registro.telefono_2],
        ['nota_digitador', registro.nota_digitador],
        ['abono_consulta', registro.abono_consulta]
      ].forEach(function (campo) {
        var td = document.createElement('td');
        td.className = 'px-1.5 py-1.5';
        var input = document.createElement('input');
        input.type = 'text';
        input.value = campo[1] || '';
        input.dataset.row = String(indice);
        input.dataset.field = campo[0];
        input.setAttribute('aria-label', campo[0] + ', registro ' + (indice + 1));
        input.className = 'w-full min-w-24 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100';
        td.appendChild(input);
        tr.appendChild(td);
      });
      cuerpo.appendChild(tr);
    });
  }
  var contador = document.getElementById('dig-count');
  if (contador) contador.textContent = registros.length + ' registros' +
    (_digPlanillaActual() ? ' · ' + _digPlanillaActual().nombre : '');
}

function _digCapturarEdicion(evento) {
  var input = evento.target;
  if (!input.matches('input[data-row][data-field]')) return;
  var planilla = _digPlanillaActual();
  var registro = planilla && planilla.registros[Number(input.dataset.row)];
  if (registro) registro[input.dataset.field] = input.value;
}

function _digCapturarMetadatos(evento) {
  var planilla = _digPlanillaActual();
  if (!planilla) return;
  var campos = {
    'dig-promotor': 'promotor',
    'dig-lugar': 'lugar_brigada',
    'dig-fecha': 'fecha',
    'dig-municipio': 'municipio'
  };
  var key = campos[evento.target.id];
  if (key) planilla.encabezado[key] = evento.target.value;
}

function _digDatosTsv(planilla) {
  planilla = planilla || _digPlanillaActual();
  var encabezado = ['Nº', 'Asesor de Salud', 'No. Volante', 'Identificación', 'Paciente', 'Teléfono 1', 'Teléfono 2', 'Nota Digitador', 'Abono Consulta'];
  var filas = [encabezado];
  if (!planilla) return filas;
  planilla.registros.forEach(function (registro, indice) {
    filas.push([
      String(indice + 1), planilla.encabezado.promotor || '', registro.no_volante, registro.identificacion, registro.nombre_paciente,
      registro.telefono_1, registro.telefono_2 || '', registro.nota_digitador, registro.abono_consulta
    ]);
  });
  return filas;
}

async function _digCopiar() {
  var tsv = _digDatosTsv().map(function (fila) {
    return fila.map(function (valor) { return String(valor || '').replace(/[\t\r\n]/g, ' ').trim(); }).join('\t');
  }).join('\r\n');
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(tsv);
    } else {
      var area = document.createElement('textarea');
      area.value = tsv;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      var copiado = document.execCommand('copy');
      area.remove();
      if (!copiado) throw new Error('El navegador no permitió copiar al portapapeles.');
    }
    _digEstado('Planilla seleccionada copiada en formato TSV para pegar en Excel.', 'success');
  } catch (error) {
    console.error('[Digitalizacion] Error copiando:', error);
    _digEstado(error.message || 'No se pudo copiar la tabla.', 'error');
  }
}

async function _digDescargarExcel() {
  try {
    await _digCargarSheetJs();
    var encabezado = [
      'N°', 'Asesor de Salud', 'No. Volante', 'Identificación', 'Paciente', 'Telefono 1', 'Telefono 2',
      'Nota Digitador', 'Abono Consulta'
    ];
    var filas = [encabezado];
    _digPlanillas.slice().sort(_digCompararPlanillas).forEach(function (planilla) {
      _digDatosTsv(planilla).slice(1).forEach(function (fila) {
        filas.push(fila);
      });
    });
    if (filas.length === 1) throw new Error('No hay registros para incluir en el consolidado.');
    var hoja = XLSX.utils.aoa_to_sheet(filas);
    ['C', 'D', 'F', 'G'].forEach(function (columna) {
      for (var i = 2; i <= filas.length; i += 1) {
        var celda = hoja[columna + i];
        if (celda) {
          celda.t = 's';
          celda.v = String(celda.v);
          celda.z = '@';
        }
      }
    });
    var libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Consolidado');
    XLSX.writeFile(libro, 'digitalizacion-consolidado.xlsx');
    _digEstado('Consolidado descargado con ' + (filas.length - 1) + ' registros de ' + _digPlanillas.length + ' planilla(s), en una sola hoja.', 'success');
  } catch (error) {
    console.error('[Digitalizacion] Error generando Excel:', error);
    _digEstado(error.message || 'No se pudo generar el archivo Excel.', 'error');
  }
}

function _digCargarSheetJs() {
  if (window.XLSX) return Promise.resolve();
  if (window._digXlsxPromise) return window._digXlsxPromise;
  window._digXlsxPromise = new Promise(function (resolver, rechazar) {
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    script.onload = function () {
      if (window.XLSX) resolver();
      else rechazar(new Error('La biblioteca Excel no se inicializó correctamente.'));
    };
    script.onerror = function () {
      window._digXlsxPromise = null;
      rechazar(new Error('No se pudo cargar el generador Excel. Verifica tu conexión.'));
    };
    document.head.appendChild(script);
  });
  return window._digXlsxPromise;
}

function _digEstado(mensaje, tipo) {
  var estado = document.getElementById('dig-status');
  if (!estado) return;
  estado.textContent = mensaje;
  estado.className = 'rounded-lg px-3 py-2 text-sm ' +
    (tipo === 'error' ? 'bg-red-50 text-red-700' :
      tipo === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700');
  estado.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
}

function _digEscapeHtml(valor) {
  return String(valor).replace(/[&<>"']/g, function (caracter) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[caracter];
  });
}
