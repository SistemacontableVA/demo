(function (root) {
  'use strict';

  function parseNumero(value) {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    var texto = String(value).trim();
    if (!texto) return 0;
    texto = texto.replace(/[$\s.]/g, '').replace(',', '.');
    var numero = Number(texto);
    return Number.isFinite(numero) ? numero : 0;
  }

  function crearFiltrosConsultaJornadas(criterio, valores) {
    if (['fecha', 'municipio', 'asesor'].indexOf(criterio) === -1) return {};
    var valor = valores && valores[criterio] !== undefined && valores[criterio] !== null
      ? String(valores[criterio]).trim()
      : '';
    var filtros = {};
    filtros[criterio] = valor;
    return filtros;
  }

  function normalizarNombrePromotor(nombre) {
    if (nombre === null || nombre === undefined) return '';
    return String(nombre)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[_\-./]/g, ' ')
      .replace(/[^A-Z0-9\s]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
  }

  function escaparHtml(valor) {
    return String(valor === null || valor === undefined ? '' : valor)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function parsearDatosPegados(texto) {
    if (!texto || !String(texto).trim()) return [];

    var lineas = String(texto).replace(/\r/g, '').split(/\n+/).map(function (linea) {
      return linea;
    }).filter(function (linea) {
      return linea.trim().length > 0;
    });

    if (!lineas.length) return [];

    var encabezado = lineas[0].split(/\t+/).map(function (valor) {
      return String(valor || '').trim();
    });

    var mapa = {};
    var patrones = {
      nombre: /(promotor|asesor|nombre)/i,
      contactos: /(afiliaciones|aff|contactos)/i,
      asistidos: /asistidos/i,
      lentesEspeciales: /(venta especial|especial|lentes especiales)/i,
      lentesSencillos: /(venta normal|normal|lentes sencillos)/i,
      totalLentes: /(total venta|total lentes|total)/i
    };

    Object.keys(patrones).forEach(function (campo) {
      var indice = encabezado.findIndex(function (valor) {
        return patrones[campo].test(valor);
      });
      if (indice >= 0) mapa[campo] = indice;
    });

    var required = ['nombre', 'contactos', 'asistidos', 'lentesEspeciales', 'lentesSencillos', 'totalLentes'];
    var faltantes = required.filter(function (campo) { return mapa[campo] === undefined; });
    if (faltantes.length) {
      return [];
    }

    var filas = [];
    for (var i = 1; i < lineas.length; i++) {
      var celdas = lineas[i].split('\t').map(function (valor) {
        return String(valor || '').trim();
      });
      if (celdas.every(function (celda) { return !celda; })) continue;

      var nombreRecibido = celdas[mapa.nombre] || '';
      var fila = {
        nombreRecibido: nombreRecibido,
        contactos: parseNumero(celdas[mapa.contactos]),
        asistidos: parseNumero(celdas[mapa.asistidos]),
        lentesEspeciales: parseNumero(celdas[mapa.lentesEspeciales]),
        lentesSencillos: parseNumero(celdas[mapa.lentesSencillos]),
        totalLentes: parseNumero(celdas[mapa.totalLentes])
      };
      filas.push(fila);
    }

    return filas;
  }

  function extraerSpreadsheetId(linkHoja) {
    try {
      var url = new URL(String(linkHoja || '').trim());
      if (url.protocol !== 'https:' || url.hostname !== 'docs.google.com') return '';
      var match = url.pathname.match(/^\/spreadsheets\/d\/([A-Za-z0-9_-]+)(?:\/|$)/);
      return match ? match[1] : '';
    } catch (error) {
      return '';
    }
  }

  function obtenerCampo(fila, nombres) {
    var normalizar = function (nombre) {
      return String(nombre).toLowerCase().replace(/[^a-z0-9]/g, '');
    };
    var buscados = nombres.map(normalizar);
    var clave = Object.keys(fila || {}).find(function (nombre) {
      return buscados.indexOf(normalizar(nombre)) !== -1;
    });
    return clave === undefined ? undefined : fila[clave];
  }

  function parsearRespuestaLentesMunicipio(respuesta) {
    if (!respuesta || respuesta.ok === false) return [];
    var filas = Array.isArray(respuesta)
      ? respuesta
      : (Array.isArray(respuesta.registros) ? respuesta.registros
        : (Array.isArray(respuesta.asesores) ? respuesta.asesores
          : (Array.isArray(respuesta.data) ? respuesta.data
            : (respuesta.data && Array.isArray(respuesta.data.asesores) ? respuesta.data.asesores : []))));

    return filas.map(function (fila) {
      var especial = parseNumero(obtenerCampo(fila, ['lenteEspecial', 'lentesEspeciales', 'ventaEspecial']));
      var sencillo = parseNumero(obtenerCampo(fila, ['lenteNormal', 'lentesSencillos', 'ventaNormal']));
      var totalValue = obtenerCampo(fila, ['totalLentes', 'total']);
      return {
        nombreRecibido: String(obtenerCampo(fila, ['asesor', 'promotor', 'nombre', 'nombrePromotor']) || '').trim(),
        contactos: parseNumero(obtenerCampo(fila, ['afiliaciones', 'contactos'])),
        asistidos: parseNumero(obtenerCampo(fila, ['asistencia', 'asistidos'])),
        lentesEspeciales: especial,
        lentesSencillos: sencillo,
        totalLentes: totalValue === undefined || totalValue === null || totalValue === ''
          ? especial + sencillo
          : parseNumero(totalValue)
      };
    }).filter(function (fila) {
      return fila.nombreRecibido !== '';
    });
  }

  function obtenerPromotoresCatalogo() {
    if (typeof LentesCargaService === 'undefined' || !LentesCargaService || typeof LentesCargaService.listarPromotores !== 'function') {
      return Promise.resolve([]);
    }

    return LentesCargaService.listarPromotores().then(function (respuesta) {
      if (!respuesta || !Array.isArray(respuesta.promotores)) {
        return [];
      }
      return respuesta.promotores;
    });
  }

  function resolverPromotor(nombreRecibido, promotores) {
    if (!nombreRecibido) {
      return { oficial: '', cedula: '', opciones: [], error: 'El nombre del promotor no puede quedar vacío.' };
    }

    var normalizado = normalizarNombrePromotor(nombreRecibido);
    var opciones = [];
    var exacta = [];

    (promotores || []).forEach(function (promotor) {
      var nombre = promotor && promotor.nombre ? promotor.nombre : '';
      var normalNombre = normalizarNombrePromotor(nombre);
      if (!normalNombre) return;

      if (normalNombre === normalizado) {
        exacta.push({ nombre: nombre, cedula: promotor.cedula || '' });
      }

      if (normalNombre.indexOf(normalizado) !== -1 || normalizado.indexOf(normalNombre) !== -1) {
        opciones.push({ nombre: nombre, cedula: promotor.cedula || '' });
      }
    });

    var lista = exacta.length ? exacta : opciones.slice(0, 5);
    var esCoincidenciaSegura = exacta.length === 1;
    var oficial = esCoincidenciaSegura ? exacta[0].nombre : '';
    var cedula = esCoincidenciaSegura ? (exacta[0].cedula || '') : '';

    if (!oficial) {
      var mensaje = lista.length
        ? 'Selecciona el promotor oficial para: ' + nombreRecibido
        : 'No se encontró un promotor compatible para: ' + nombreRecibido;
      return { oficial: '', cedula: '', opciones: lista, error: mensaje };
    }

    return { oficial: oficial, cedula: cedula, opciones: lista, error: '' };
  }

  function validarFilaLentes(fila) {
    var errores = [];
    var total = Number(fila.totalLentes || 0);
    var especial = Number(fila.lentesEspeciales || 0);
    var sencillo = Number(fila.lentesSencillos || 0);

    if (!fila.asesor) {
      errores.push('Falta el promotor oficial.');
    }
    if (!fila.nombreRecibido) {
      errores.push('Falta el nombre recibido desde Excel.');
    }
    if (Number(fila.contactos || 0) < 0 || Number(fila.asistidos || 0) < 0 || especial < 0 || sencillo < 0 || total < 0) {
      errores.push('Los valores no pueden ser negativos.');
    }
    if ((especial + sencillo) !== total) {
      errores.push('La suma de lentes especiales + sencillos debe coincidir con el total.');
    }
    return errores;
  }

  function leerDatosDesdeFormulario() {
    var texto = document.getElementById('lentes-paste').value || '';
    var filas = parsearDatosPegados(texto);
    if (!filas.length) {
      return { ok: false, error: 'No se reconocieron las columnas requeridas. Usa encabezados como Promotor, Afiliaciones, Asistidos, Venta Especial, Venta Normal y Total Venta.' };
    }

    return { ok: true, filas: filas };
  }

  function renderTablaEditable(filas, promotores) {
    var preview = document.getElementById('lentes-preview');
    if (!preview) return;

    var renderRows = filas.map(function (fila, index) {
      var resultado = resolverPromotor(fila.nombreRecibido, promotores);
      var opciones = resultado.opciones && resultado.opciones.length ? resultado.opciones : [{ nombre: resultado.oficial || '', cedula: resultado.cedula || '' }];
      var asesorActual = resultado.oficial || '';

      return {
        ...fila,
        index: index,
        asesor: asesorActual,
        cedula: resultado.cedula || '',
        opciones: opciones,
        error: resultado.error || '',
        brigadaEmpresa: index === 0 ? (document.getElementById('lentes-brigada-empresa').value || '') : '',
        brigada: 1,
        observaciones: ''
      };
    });

    preview.innerHTML = [
      '<div class="space-y-3">',
      '  <div class="flex items-center justify-between gap-3">',
      '    <h4 class="text-sm font-bold text-slate-700">Validación y edición previa</h4>',
      '    <button id="lentes-guardar" class="btn-primario text-white px-4 py-2 rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed" type="button">Guardar jornada</button>',
      '  </div>',
      '  <div id="lentes-validacion" class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"></div>',
      '  <div class="overflow-x-auto border border-slate-200 rounded-lg">',
      '    <table class="min-w-full text-left text-xs text-slate-700">',
      '      <thead class="bg-slate-50">',
      '        <tr>',
      '          <th class="px-2 py-2">Asesor</th>',
      '          <th class="px-2 py-2">Nombre recibido</th>',
      '          <th class="px-2 py-2">Aff Asesor</th>',
      '          <th class="px-2 py-2">Asistidos</th>',
      '          <th class="px-2 py-2">Lentes esp.</th>',
      '          <th class="px-2 py-2">Lente senc.</th>',
      '          <th class="px-2 py-2">Total</th>',
      '          <th class="px-2 py-2">Brigada Empresa</th>',
      '          <th class="px-2 py-2">Brigada Asesor</th>',
      '          <th class="px-2 py-2">Observaciones</th>',
      '        </tr>',
      '      </thead>',
      '      <tbody>',
      renderRows.map(function (fila) {
        var opcionesHtml = (fila.opciones || []).map(function (op) {
          return '<option value="' + escaparHtml(op.nombre) + '"' + (op.nombre === fila.asesor ? ' selected' : '') + '>' + escaparHtml(op.nombre) + '</option>';
        }).join('');

        return [
          '<tr class="border-t border-slate-200 lentes-row" data-row-index="' + fila.index + '">',
          '  <td class="px-2 py-2 align-top">',
          '    <select class="lentes-asesor w-full rounded border border-slate-200 px-2 py-1.5 bg-white" data-row-index="' + fila.index + '">',
          '      <option value="">Seleccionar promotor</option>',
          opcionesHtml,
          '    </select>',
          '  </td>',
          '  <td class="px-2 py-2 align-top font-medium">' + escaparHtml(fila.nombreRecibido || '—') + '</td>',
          '  <td class="px-2 py-2 align-top"><input class="lentes-campo w-full rounded border border-slate-200 px-2 py-1.5" data-field="contactos" data-row-index="' + fila.index + '" value="' + (fila.contactos || 0) + '"></td>',
          '  <td class="px-2 py-2 align-top"><input class="lentes-campo w-full rounded border border-slate-200 px-2 py-1.5" data-field="asistidos" data-row-index="' + fila.index + '" value="' + (fila.asistidos || 0) + '"></td>',
          '  <td class="px-2 py-2 align-top"><input class="lentes-campo w-full rounded border border-slate-200 px-2 py-1.5" data-field="lentesEspeciales" data-row-index="' + fila.index + '" value="' + (fila.lentesEspeciales || 0) + '"></td>',
          '  <td class="px-2 py-2 align-top"><input class="lentes-campo w-full rounded border border-slate-200 px-2 py-1.5" data-field="lentesSencillos" data-row-index="' + fila.index + '" value="' + (fila.lentesSencillos || 0) + '"></td>',
          '  <td class="px-2 py-2 align-top"><input class="lentes-campo w-full rounded border border-slate-200 px-2 py-1.5" data-field="totalLentes" data-row-index="' + fila.index + '" value="' + (fila.totalLentes || 0) + '"></td>',
          '  <td class="px-2 py-2 align-top"><input class="lentes-campo w-full rounded border border-slate-200 px-2 py-1.5" data-field="brigadaEmpresa" data-row-index="' + fila.index + '" value="' + (fila.brigadaEmpresa || '') + '"></td>',
          '  <td class="px-2 py-2 align-top"><input class="lentes-campo w-full rounded border border-slate-200 px-2 py-1.5" data-field="brigada" data-row-index="' + fila.index + '" value="' + (fila.brigada || 1) + '"></td>',
          '  <td class="px-2 py-2 align-top"><input class="lentes-campo w-full rounded border border-slate-200 px-2 py-1.5" data-field="observaciones" data-row-index="' + fila.index + '" value="' + (fila.observaciones || '') + '"></td>',
          '</tr>'
        ].join('');
      }).join(''),
      '      </tbody>',
      '    </table>',
      '  </div>',
      '</div>'
    ].join('');

    window._lentesEstado = { rows: renderRows, promotores: promotores };
    recalcularValidacion();

    var guardarBtn = document.getElementById('lentes-guardar');
    if (guardarBtn) {
      guardarBtn.addEventListener('click', function () {
        guardarJornada();
      });
    }

    preview.addEventListener('input', function (event) {
      if (event.target.classList.contains('lentes-campo') || event.target.classList.contains('lentes-asesor')) {
        recalcularValidacion();
      }
    });

    preview.addEventListener('change', function (event) {
      if (event.target.classList.contains('lentes-asesor')) {
        var index = Number(event.target.getAttribute('data-row-index'));
        var row = window._lentesEstado.rows[index];
        if (!row) return;
        row.asesor = event.target.value || '';
        row.error = row.asesor ? '' : 'Debe seleccionar un promotor';
        recalcularValidacion();
      }
    });
  }

  function recalcularValidacion() {
    var estado = window._lentesEstado || { rows: [] };
    var rows = estado.rows || [];
    var errores = [];
    var filaInfo = [];
    var asesoresUsados = {};

    rows.forEach(function (row) {
      var rowCopy = {
        nombreRecibido: row.nombreRecibido,
        asesor: row.asesor || (document.querySelector('.lentes-asesor[data-row-index="' + row.index + '"]') ? document.querySelector('.lentes-asesor[data-row-index="' + row.index + '"]').value : ''),
        contactos: parseNumero(document.querySelector('.lentes-campo[data-field="contactos"][data-row-index="' + row.index + '"]') ? document.querySelector('.lentes-campo[data-field="contactos"][data-row-index="' + row.index + '"]').value : row.contactos),
        asistidos: parseNumero(document.querySelector('.lentes-campo[data-field="asistidos"][data-row-index="' + row.index + '"]') ? document.querySelector('.lentes-campo[data-field="asistidos"][data-row-index="' + row.index + '"]').value : row.asistidos),
        lentesEspeciales: parseNumero(document.querySelector('.lentes-campo[data-field="lentesEspeciales"][data-row-index="' + row.index + '"]') ? document.querySelector('.lentes-campo[data-field="lentesEspeciales"][data-row-index="' + row.index + '"]').value : row.lentesEspeciales),
        lentesSencillos: parseNumero(document.querySelector('.lentes-campo[data-field="lentesSencillos"][data-row-index="' + row.index + '"]') ? document.querySelector('.lentes-campo[data-field="lentesSencillos"][data-row-index="' + row.index + '"]').value : row.lentesSencillos),
        totalLentes: parseNumero(document.querySelector('.lentes-campo[data-field="totalLentes"][data-row-index="' + row.index + '"]') ? document.querySelector('.lentes-campo[data-field="totalLentes"][data-row-index="' + row.index + '"]').value : row.totalLentes),
        brigadaEmpresa: document.querySelector('.lentes-campo[data-field="brigadaEmpresa"][data-row-index="' + row.index + '"]') ? document.querySelector('.lentes-campo[data-field="brigadaEmpresa"][data-row-index="' + row.index + '"]').value : row.brigadaEmpresa,
        brigada: parseNumero(document.querySelector('.lentes-campo[data-field="brigada"][data-row-index="' + row.index + '"]') ? document.querySelector('.lentes-campo[data-field="brigada"][data-row-index="' + row.index + '"]').value : row.brigada),
        observaciones: document.querySelector('.lentes-campo[data-field="observaciones"][data-row-index="' + row.index + '"]') ? document.querySelector('.lentes-campo[data-field="observaciones"][data-row-index="' + row.index + '"]').value : row.observaciones
      };

      row.asesor = rowCopy.asesor;
      row.contactos = rowCopy.contactos;
      row.asistidos = rowCopy.asistidos;
      row.lentesEspeciales = rowCopy.lentesEspeciales;
      row.lentesSencillos = rowCopy.lentesSencillos;
      row.totalLentes = rowCopy.totalLentes;
      row.brigadaEmpresa = rowCopy.brigadaEmpresa;
      row.brigada = rowCopy.brigada;
      row.observaciones = rowCopy.observaciones;

      var rowErrors = validarFilaLentes(rowCopy);
      var asesorNormalizado = normalizarNombrePromotor(rowCopy.asesor);
      if (asesorNormalizado && asesoresUsados[asesorNormalizado]) {
        rowErrors.push('El promotor ya está asignado en otra fila.');
      }
      if (asesorNormalizado) asesoresUsados[asesorNormalizado] = true;
      if (rowErrors.length) {
        errores.push('Fila ' + (row.index + 1) + ': ' + rowErrors.join(' '));
      }

      filaInfo.push({ fila: row.index + 1, nombre: row.nombreRecibido, asesor: row.asesor, errores: rowErrors });
    });

    var validBox = document.getElementById('lentes-validacion');
    if (validBox) {
      if (errores.length) {
        validBox.className = 'rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700';
        validBox.innerHTML = errores.join('<br>');
      } else {
        validBox.className = 'rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700';
        validBox.innerHTML = 'Validación correcta. La jornada está lista para guardar.';
      }
    }

    var guardarBtn = document.getElementById('lentes-guardar');
    if (guardarBtn) {
      guardarBtn.disabled = !!errores.length;
    }
  }

  function guardarJornada() {
    var estado = window._lentesEstado || { rows: [] };
    var rows = estado.rows || [];
    var ruta = document.getElementById('lentes-ruta').value.trim();
    var fecha = document.getElementById('lentes-fecha').value;
    var municipio = document.getElementById('lentes-municipio').value.trim();

    var brigadaEmpresa = rows.length ? rows[0].brigadaEmpresa : '';
    if (!ruta || !fecha || !municipio || !brigadaEmpresa || !rows.length) {
      alert('Completa Ruta, Fecha y Municipio antes de guardar.');
      return;
    }

    var payload = {
      ruta: ruta,
      brigadaEmpresa: brigadaEmpresa,
      fecha: fecha,
      municipio: municipio,
      registros: rows.map(function (row) {
        return {
          asesor: row.asesor || '',
          cedula: row.cedula || '',
          contactos: Number(row.contactos || 0),
          asistidos: Number(row.asistidos || 0),
          lentesEspeciales: Number(row.lentesEspeciales || 0),
          lentesSencillos: Number(row.lentesSencillos || 0),
          totalLentes: Number(row.totalLentes || 0),
          brigada: row.brigada === '' || row.brigada === null || row.brigada === undefined
            ? ''
            : Number(row.brigada),
          observaciones: row.observaciones || ''
        };
      })
    };

    if (!LentesCargaService || typeof LentesCargaService.cargarRelacionLentes !== 'function') {
      alert('No hay servicio disponible para guardar la jornada.');
      return;
    }

    var validBox = document.getElementById('lentes-validacion');
    if (validBox) {
      validBox.className = 'rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700';
      validBox.innerHTML = 'Guardando registro...';
    }

    var guardarBtn = document.getElementById('lentes-guardar');
    if (guardarBtn) guardarBtn.disabled = true;

    function enviarCarga(confirmarDuplicado) {
      payload.confirmarDuplicado = confirmarDuplicado === true;
      return LentesCargaService.cargarRelacionLentes(payload);
    }

    enviarCarga(false).then(function (respuesta) {
      if (respuesta && respuesta.requiereConfirmacion) {
        var continuar = window.confirm(respuesta.error + '\n\nRevisa la información y confirma para continuar.');
        if (!continuar) {
          if (guardarBtn) guardarBtn.disabled = false;
          if (validBox) validBox.innerHTML = 'Carga cancelada por el usuario.';
          return null;
        }
        if (validBox) validBox.innerHTML = 'Confirmación recibida. Guardando jornada...';
        return enviarCarga(true);
      }
      return respuesta;
    }).then(function (respuesta) {
      if (!respuesta) return;
      if (!respuesta || !respuesta.ok) {
        console.error('[LentesCarga] No se pudo guardar la jornada:', respuesta && respuesta.error);
        var mensaje = 'No se pudo guardar el registro. Inténtalo nuevamente.';
        if (validBox) {
          validBox.className = 'rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700';
          validBox.innerHTML = mensaje;
        }
        return;
      }

      if (validBox) {
        validBox.className = 'rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700';
        validBox.innerHTML = 'Carga exitosa. Registro actualizado correctamente.';
      }
    }).catch(function (error) {
      console.error('[LentesCarga] Error de guardado:', error);
      if (guardarBtn) guardarBtn.disabled = false;
      if (validBox) {
        validBox.className = 'rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700';
        validBox.innerHTML = 'No se pudo guardar el registro. Inténtalo nuevamente.';
      }
    });
  }

  function cargarJornadasExistentes() {
    var resultado = document.getElementById('lentes-jornadas-resultado');
    if (!resultado) return;
    resultado.innerHTML = 'Leyendo jornadas...';
    var criterio = document.getElementById('lentes-criterio').value;
    var filtros = crearFiltrosConsultaJornadas(criterio, {
      fecha: document.getElementById('lentes-editar-fecha') ? document.getElementById('lentes-editar-fecha').value : '',
      municipio: document.getElementById('lentes-editar-municipio') ? document.getElementById('lentes-editar-municipio').value.trim() : '',
      asesor: document.getElementById('lentes-editar-asesor') ? document.getElementById('lentes-editar-asesor').value.trim() : ''
    });
    LentesCargaService.listarJornadasLentes(filtros).then(function (respuesta) {
      if (!respuesta || !respuesta.ok) {
        console.error('[LentesCarga] No se pudieron consultar las jornadas:', respuesta && respuesta.error);
        resultado.innerHTML = '<div class="text-red-700">No se pudieron consultar los registros. Inténtalo nuevamente.</div>';
        return;
      }
      window._lentesJornadas = respuesta.registros || [];
      var totalJornadas = window._lentesJornadas.reduce(function (total, registro) { return total + Number(registro.totalLentes || 0); }, 0);
      var asesoresJornada = {};
      window._lentesJornadas.forEach(function (registro) { if (registro.asesor) asesoresJornada[registro.asesor] = true; });
      var resumen = window._lentesJornadas.length
        ? '<div class="lentes-search-summary">' +
            '<div class="lentes-search-metric"><span>Registros</span><strong>' + window._lentesJornadas.length + '</strong></div>' +
            '<div class="lentes-search-metric"><span>Promotores</span><strong>' + Object.keys(asesoresJornada).length + '</strong></div>' +
            '<div class="lentes-search-metric"><span>Total lentes</span><strong>' + totalJornadas + '</strong></div>' +
          '</div>'
        : '';
      resultado.innerHTML = window._lentesJornadas.length
        ? resumen +
          '<div class="lentes-results-heading"><h4>Jornadas encontradas</h4><span>' + window._lentesJornadas.length + ' resultados</span></div>' +
          '<div class="lentes-results-list">' + window._lentesJornadas.map(function (registro, index) {
            var totalLentes = registro.totalLentes === null || registro.totalLentes === undefined || registro.totalLentes === ''
              ? '—'
              : escaparHtml(registro.totalLentes);
            return '<article class="lentes-jornada-card">' +
              '<div class="lentes-jornada-date"><span>Fecha</span><strong>' + escaparHtml(registro.fecha || '—') + '</strong></div>' +
              '<div class="lentes-jornada-details">' +
                '<div class="lentes-jornada-meta"><span class="lentes-jornada-route">Ruta ' + escaparHtml(registro.ruta || '—') + '</span><span class="lentes-jornada-place">' + escaparHtml(registro.municipio || 'Municipio sin indicar') + '</span></div>' +
                '<strong class="lentes-jornada-promoter">' + escaparHtml(registro.asesor || 'Promotor sin indicar') + '</strong>' +
              '</div>' +
              '<div class="lentes-jornada-total"><span>Total lentes</span><strong>' + totalLentes + '</strong></div>' +
              '<div class="lentes-jornada-actions">' +
                '<button type="button" class="lentes-result-edit" data-editar-jornada="' + index + '" title="Abrir ventana para editar esta jornada"><span aria-hidden="true">✎</span> Editar</button>' +
                '<button type="button" class="lentes-result-delete" data-suprimir-jornada="' + index + '" title="Suprimir el contenido de esta jornada">Suprimir</button>' +
              '</div>' +
            '</article>';
          }).join('') + '</div>'
        : '<div class="lentes-empty-results">No hay jornadas que coincidan con los filtros.</div>';
    });
  }

  function suprimirJornada(registro, boton) {
    if (!registro) return;
    mostrarConfirmacionLentes('¿Está seguro de suprimir la información de esta jornada?', 'La fila se limpiará sin borrar ni mover otras jornadas.', function () {
    boton.disabled = true;
    boton.textContent = 'Suprimiendo...';
    LentesCargaService.suprimirJornadaLentes(registro.fila).then(function (respuesta) {
      if (!respuesta || !respuesta.ok) {
        console.error('[LentesCarga] No se pudo suprimir el registro:', respuesta && respuesta.error);
        alert('No se pudo eliminar el registro. Inténtalo nuevamente.');
        boton.disabled = false;
        boton.textContent = 'Suprimir';
        return;
      }
      cargarJornadasExistentes();
    });
    });
  }

  function mostrarConfirmacionLentes(titulo, detalle, confirmar) {
    var modal = document.getElementById('lentes-confirmacion-modal');
    if (!modal) return;
    modal.innerHTML = '<div class="bg-white rounded-2xl shadow-card p-6 w-full max-w-md" role="dialog" aria-modal="true" aria-labelledby="lentes-confirmacion-titulo"><div class="flex items-start gap-3"><div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-lg" aria-hidden="true">!</div><div><h4 id="lentes-confirmacion-titulo" class="text-lg font-bold text-verde-oscuro">' + escaparHtml(titulo) + '</h4><p class="text-sm text-slate-500 mt-2">' + escaparHtml(detalle) + '</p></div></div><div class="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100"><button type="button" id="lentes-confirmacion-cancelar" class="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button><button type="button" id="lentes-confirmacion-aceptar" class="btn-primario text-white px-4 py-2 rounded-lg text-sm font-semibold">Confirmar</button></div></div>';
    modal.classList.remove('hidden');
    var cerrar = function () { modal.classList.add('hidden'); };
    document.getElementById('lentes-confirmacion-cancelar').onclick = cerrar;
    document.getElementById('lentes-confirmacion-aceptar').onclick = function () {
      cerrar();
      confirmar();
    };
  }

  function abrirEditorJornada(registro) {
    var modal = document.getElementById('lentes-editor-modal');
    if (!modal) return;
    modal.innerHTML = '<div class="bg-white rounded-xl shadow-xl p-5 sm:p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="lentes-editor-titulo"><div class="flex justify-between items-start gap-4 mb-5 pb-4 border-b border-slate-100"><div><p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Registro · fila ' + registro.fila + '</p><h4 id="lentes-editor-titulo" class="font-bold text-verde-oscuro text-lg mt-1">Editar jornada</h4><p class="text-xs text-slate-500 mt-1">Revisa los valores y confirma los cambios antes de actualizar.</p></div><button type="button" id="lentes-editor-cerrar" class="w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50" title="Cerrar ventana de edición" aria-label="Cerrar ventana de edición">&times;</button></div><div class="grid grid-cols-1 sm:grid-cols-2 gap-3">' + [
      ['ruta', 'Ruta', 'text'], ['fecha', 'Fecha', 'date'], ['municipio', 'Municipio', 'text'], ['asesor', 'Asesor', 'text'],
      ['brigadaEmpresa', 'Brigada Empresa', 'number'], ['contactos', 'Aff Asesor', 'number'], ['asistidos', 'Asistidos', 'number'],
      ['lentesEspeciales', 'Lentes especiales', 'number'], ['lentesSencillos', 'Lentes sencillos', 'number'], ['totalLentes', 'Total lentes', 'number'],
      ['brigada', 'Brigada Asesor', 'number'], ['observaciones', 'Observaciones', 'text']
    ].map(function (campo) { return '<label class="text-xs font-medium text-slate-600">' + campo[1] + '<input id="lentes-ed-' + campo[0] + '" type="' + campo[2] + '" value="' + escaparHtml(registro[campo[0]] === null || registro[campo[0]] === undefined ? '' : registro[campo[0]]) + '" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-petroleo focus:ring-1 focus:ring-petroleo"></label>'; }).join('') + '</div><div class="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100"><button type="button" id="lentes-editor-cancelar" class="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100" title="Cancelar edición">Cancelar</button><button type="button" id="lentes-editor-guardar" class="btn-primario text-white px-4 py-2 rounded-lg text-sm font-semibold" title="Guardar cambios de esta jornada">Guardar cambios</button></div></div>';
    modal.classList.remove('hidden');
    document.getElementById('lentes-editor-cerrar').onclick = function () { modal.classList.add('hidden'); };
    document.getElementById('lentes-editor-cancelar').onclick = function () { modal.classList.add('hidden'); };
    document.getElementById('lentes-editor-guardar').onclick = function () {
      var nuevo = {};
      ['ruta', 'fecha', 'municipio', 'asesor', 'brigadaEmpresa', 'contactos', 'asistidos', 'lentesEspeciales', 'lentesSencillos', 'totalLentes', 'brigada', 'observaciones'].forEach(function (campo) { nuevo[campo] = document.getElementById('lentes-ed-' + campo).value; });
      if (Number(nuevo.lentesEspeciales) + Number(nuevo.lentesSencillos) !== Number(nuevo.totalLentes)) {
        mostrarConfirmacionLentes('No se pueden guardar los cambios', 'Lentes especiales + lentes sencillos debe coincidir con Total lentes.', function () {});
        return;
      }
      mostrarConfirmacionLentes('¿Está seguro de guardar los cambios?', 'Se actualizará la información de esta jornada.', function () {
        var boton = document.getElementById('lentes-editor-guardar');
        boton.disabled = true;
        nuevo.fechaOriginal = registro.fecha;
        nuevo.asesorOriginal = registro.asesor;
        LentesCargaService.editarJornadaLentes({ fila: registro.fila, registro: nuevo }).then(function (respuesta) {
          if (!respuesta || !respuesta.ok) {
            console.error('[LentesCarga] No se pudieron actualizar los cambios:', respuesta && respuesta.error);
            mostrarConfirmacionLentes('No se pudieron guardar los cambios', 'Inténtalo nuevamente.', function () {});
            boton.disabled = false;
            return;
          }
          modal.classList.add('hidden');
          cargarJornadasExistentes();
        });
      });
    };
  }

  function renderGestionLentes() {
    var contenedor = document.getElementById('admin-content');
    if (!contenedor) return;
    contenedor.innerHTML = [
      '<div class="fade-in space-y-5 lentes-workspace lentes-workspace--gestion">',
      '  <div class="flex items-center justify-between gap-3">',
      '    <div class="lentes-module-heading"><span class="lentes-module-heading-icon" aria-hidden="true">⌕</span><div><span class="lentes-module-heading-tag">Consulta y edición</span><h3>Gestión de lentes por jornada</h3><p>Selecciona un criterio para consultar únicamente las jornadas que necesitas.</p></div></div>',
      '    <button id="lentes-volver" type="button" class="lentes-back-button" title="Volver al menú de Gestión de lentes"><span aria-hidden="true">←</span> Volver</button>',
      '  </div>',
      '  <div class="lentes-form-panel">',
      '    <div class="lentes-form-panel-heading"><span class="lentes-form-panel-icon" aria-hidden="true">⌕</span><div><h4>Buscar una jornada</h4><p>Filtra los registros por fecha, municipio o promotor.</p></div></div>',
      '    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">',
      '      <label class="text-xs text-slate-600">Buscar por<select id="lentes-criterio" class="mt-1 w-full rounded border border-slate-200 px-2 py-2 text-sm"><option value="fecha">Fecha</option><option value="municipio">Municipio</option><option value="asesor">Promotor</option></select></label>',
      '      <label class="text-xs text-slate-600" id="lentes-filtro-fecha">Fecha<input id="lentes-editar-fecha" type="date" class="mt-1 w-full rounded border border-slate-200 px-2 py-2 text-sm"></label>',
      '      <label class="text-xs text-slate-600 hidden" id="lentes-filtro-municipio">Municipio<select id="lentes-editar-municipio" class="mt-1 w-full rounded border border-slate-200 px-2 py-2 text-sm"><option value="">Cargando municipios...</option></select></label>',
      '      <label class="text-xs text-slate-600 hidden" id="lentes-filtro-asesor">Promotor<select id="lentes-editar-asesor" class="mt-1 w-full rounded border border-slate-200 px-2 py-2 text-sm"><option value="">Cargando promotores...</option></select></label>',
      '    </div>',
      '    <div class="lentes-form-actions"><div class="flex flex-wrap items-center gap-2"><button id="lentes-leer-jornadas" type="button" class="btn-primario text-white px-4 py-2 rounded-lg text-sm font-semibold" title="Consultar jornadas usando el criterio seleccionado">Consultar jornada</button><button id="lentes-limpiar-filtros" type="button" class="lentes-secondary-button" title="Limpiar el criterio y los resultados">Limpiar</button></div><span class="text-xs text-slate-500">La fecha es obligatoria si buscas por fecha.</span></div>',
      '    <div id="lentes-jornadas-resultado" class="mt-4"></div>',
      '  </div>',
      '  <div id="lentes-editor-modal" class="hidden fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center"></div>',
      '  <div id="lentes-confirmacion-modal" class="hidden fixed inset-0 z-[210] bg-slate-900/40 p-4 flex items-center justify-center"></div>',
      '</div>'
    ].join('');

    document.getElementById('lentes-volver').onclick = function () { renderCargaLentes(); };
    document.getElementById('lentes-limpiar-filtros').onclick = function () {
      document.getElementById('lentes-editar-fecha').value = '';
      document.getElementById('lentes-editar-municipio').value = '';
      document.getElementById('lentes-editar-asesor').value = '';
      document.getElementById('lentes-jornadas-resultado').innerHTML = '';
    };
    var criterio = document.getElementById('lentes-criterio');
    criterio.onchange = function () {
      ['fecha', 'municipio', 'asesor'].forEach(function (campo) {
        var filtro = document.getElementById('lentes-filtro-' + campo);
        filtro.classList.toggle('hidden', criterio.value !== campo);
        if (criterio.value !== campo) {
          var control = document.getElementById('lentes-editar-' + campo);
          if (control) control.value = '';
        }
      });
    };
    LentesCargaService.listarCatalogosJornadasLentes().then(function (respuesta) {
      var municipio = document.getElementById('lentes-editar-municipio');
      var asesor = document.getElementById('lentes-editar-asesor');
      if (respuesta && respuesta.ok) {
        municipio.innerHTML = '<option value="">Seleccionar municipio</option>' + (respuesta.municipios || []).map(function (v) { return '<option value="' + escaparHtml(v) + '">' + escaparHtml(v) + '</option>'; }).join('');
        asesor.innerHTML = '<option value="">Seleccionar promotor</option>' + (respuesta.asesores || []).map(function (v) { return '<option value="' + escaparHtml(v) + '">' + escaparHtml(v) + '</option>'; }).join('');
      }
    });
    document.getElementById('lentes-leer-jornadas').onclick = function () {
      var valorSeleccionado = document.getElementById('lentes-editar-' + criterio.value).value;
      if (!valorSeleccionado) {
        var etiquetaCriterio = criterio.value === 'fecha' ? 'una fecha' : criterio.value === 'municipio' ? 'un municipio' : 'un promotor';
        alert('Selecciona ' + etiquetaCriterio + ' para consultar.');
        return;
      }
      cargarJornadasExistentes();
    };
    document.getElementById('lentes-jornadas-resultado').addEventListener('click', function (event) {
      var botonEditar = event.target.closest('[data-editar-jornada]');
      if (botonEditar) {
        var registro = (window._lentesJornadas || [])[Number(botonEditar.getAttribute('data-editar-jornada'))];
        if (registro) abrirEditorJornada(registro);
        return;
      }
      var botonSuprimir = event.target.closest('[data-suprimir-jornada]');
      if (botonSuprimir) {
        var registroSuprimir = (window._lentesJornadas || [])[Number(botonSuprimir.getAttribute('data-suprimir-jornada'))];
        if (registroSuprimir) suprimirJornada(registroSuprimir, botonSuprimir);
      }
    });
  }

  function renderCargaLentes(modo) {
    var contenedor = document.getElementById('admin-content');
    if (!contenedor) return;

    if (!modo) {
      contenedor.innerHTML = [
        '<div class="fade-in space-y-5">',
        '  <div><h3 class="text-verde-oscuro font-bold text-lg">Gestión de lentes</h3><p class="text-slate-400 text-sm mt-0.5">Administra la carga y consulta las jornadas registradas.</p></div>',
        '  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">',
        '    <button id="lentes-card-carga" type="button" class="lentes-action-card lentes-action-card--carga group" title="Abrir carga de lentes en sistema"><span class="lentes-action-card-icon" aria-hidden="true">↥</span><span class="lentes-action-card-content"><span class="lentes-action-card-tag">Nueva jornada</span><h4>Carga de Lentes en sistema</h4><p>Pega los resultados de Excel, valida los promotores y registra una nueva jornada.</p><span class="lentes-action-card-link">Abrir carga <span aria-hidden="true">→</span></span></span></button>',
        '    <button id="lentes-card-gestion" type="button" class="lentes-action-card lentes-action-card--gestion group" title="Abrir gestión de lentes por jornada"><span class="lentes-action-card-icon" aria-hidden="true">⌕</span><span class="lentes-action-card-content"><span class="lentes-action-card-tag">Consulta y edición</span><h4>Gestión de lentes por jornada</h4><p>Consulta una fecha, municipio o promotor y edita registros existentes.</p><span class="lentes-action-card-link">Abrir gestión <span aria-hidden="true">→</span></span></span></button>',
        '  </div>',
        '</div>'
      ].join('');
      document.getElementById('lentes-card-carga').onclick = function () { renderCargaLentes('carga'); };
      document.getElementById('lentes-card-gestion').onclick = renderGestionLentes;
      return;
    }

    contenedor.innerHTML = [
      '<div class="fade-in space-y-5 lentes-workspace lentes-workspace--carga">',
      '  <div class="flex items-center justify-between gap-3">',
      '    <div class="lentes-module-heading"><span class="lentes-module-heading-icon" aria-hidden="true">↥</span><div><span class="lentes-module-heading-tag">Nueva jornada</span><h3>Gestión de Lentes</h3><p>Elige cómo cargar los datos de la jornada.</p></div></div>',
      '    <button id="lentes-carga-volver" type="button" class="lentes-back-button" title="Volver al menú de Gestión de lentes"><span aria-hidden="true">←</span> Volver</button>',
      '  </div>',
      '  <section class="flex flex-wrap items-center gap-2" aria-label="Modo de carga">',
      '    <span class="mr-1 text-sm font-semibold text-slate-700">Modo de carga:</span>',
      '    <button id="lentes-modo-manual" type="button" aria-pressed="true" class="rounded-lg bg-verde-oscuro px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-verde-medio">Manual</button>',
      '    <button id="lentes-modo-precarga" type="button" aria-pressed="false" class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-verde-oscuro transition hover:border-verde-medio hover:bg-verde-suave">Precargar municipio</button>',
      '  </section>',
      '  <section id="lentes-precarga" class="hidden overflow-hidden rounded-2xl border border-slate-200 border-l-4 border-l-verde-medio bg-white shadow-sm" aria-labelledby="lentes-precarga-titulo">',
      '    <div id="lentes-precarga-selector">',
      '      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">',
      '        <div><p class="text-[10px] font-bold uppercase tracking-[0.14em] text-verde-medio">Origen de datos</p><h4 id="lentes-precarga-titulo" class="mt-0.5 text-sm font-bold text-verde-oscuro">Selecciona una jornada atendida</h4></div>',
      '        <span id="lentes-precarga-estado" class="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200" aria-live="polite"><span class="h-1.5 w-1.5 rounded-full bg-verde-medio"></span>Cargando jornadas…</span>',
      '      </div>',
      '      <div class="px-4 pt-4 sm:px-5">',
      '        <div class="inline-flex rounded-lg bg-slate-100 p-1" role="tablist" aria-label="Buscar jornada">',
      '          <button id="lentes-tab-recientes" type="button" role="tab" aria-selected="true" aria-controls="lentes-panel-recientes" class="rounded-md bg-verde-oscuro px-3 py-1.5 text-xs font-semibold text-white shadow-sm">Recientes</button>',
      '          <button id="lentes-tab-ruta" type="button" role="tab" aria-selected="false" aria-controls="lentes-panel-ruta" class="rounded-md px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:text-verde-oscuro">Por ruta</button>',
      '        </div>',
      '      </div>',
      '      <div id="lentes-panel-recientes" role="tabpanel" aria-labelledby="lentes-tab-recientes" class="px-4 pb-4 pt-3 sm:px-5">',
      '        <label class="block text-[11px] font-bold uppercase tracking-wide text-slate-500">Jornada reciente<select id="selectRecientes" class="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-verde-medio focus:ring-2 focus:ring-verde-medio/20"><option value="">Selecciona un municipio</option></select></label>',
      '      </div>',
      '      <div id="lentes-panel-ruta" role="tabpanel" aria-labelledby="lentes-tab-ruta" class="hidden px-4 pb-4 pt-3 sm:px-5">',
      '        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">',
      '          <label class="block text-[11px] font-bold uppercase tracking-wide text-slate-500">Ruta<select id="selectRuta" class="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-verde-medio focus:ring-2 focus:ring-verde-medio/20"><option value="">Selecciona una ruta</option></select></label>',
      '          <label class="block text-[11px] font-bold uppercase tracking-wide text-slate-500">Municipio<select id="selectMunicipioRuta" class="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-verde-medio focus:ring-2 focus:ring-verde-medio/20 disabled:cursor-not-allowed disabled:bg-slate-50" disabled><option value="">Selecciona primero una ruta</option></select></label>',
      '        </div>',
      '      </div>',
      '    </div>',
      '    <div id="lentes-precarga-cargada" class="hidden flex items-center justify-between gap-3 px-4 py-3 sm:px-5">',
      '      <span class="inline-flex items-center gap-2 text-sm font-semibold text-verde-oscuro"><span class="flex h-6 w-6 items-center justify-center rounded-full bg-verde-suave text-xs text-verde-oscuro" aria-hidden="true">✓</span>Jornada precargada</span>',
      '      <button id="lentes-cambiar-jornada" type="button" class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-verde-oscuro transition hover:border-verde-medio hover:bg-verde-suave">Cambiar jornada</button>',
      '    </div>',
      '    <div id="lentes-precarga-accion" class="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3 sm:px-5">',
      '      <p class="hidden text-xs text-slate-500 sm:block">Los datos se mostrarán para revisión antes de guardarlos.</p>',
      '      <button id="lentes-cargar-municipio" type="button" disabled class="btn-primario rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50">Cargar lentes del municipio</button>',
      '    </div>',
      '  </section>',
      '  <div id="lentes-datos-jornada" class="lentes-form-panel">',
      '    <div class="lentes-form-panel-heading"><span class="lentes-form-panel-icon" aria-hidden="true">1</span><div><h4>Datos de la jornada</h4><p id="lentes-datos-ayuda">Completa la información antes de pegar los datos.</p></div></div>',
      '    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">',
      '      <div>',
      '        <label class="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">Ruta</label>',
      '        <input id="lentes-ruta" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Ruta 1">',
      '      </div>',
      '        <div>',
      '          <label class="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">Brigada empresa</label>',
      '          <input id="lentes-brigada-empresa" type="number" min="1" step="1" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" value="1">',
      '        </div>',
      '        <div>',
      '          <label class="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">Fecha</label>',
      '          <input id="lentes-fecha" type="date" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">',
      '        </div>',
      '        <div>',
      '          <label class="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">Municipio</label>',
      '          <input id="lentes-municipio" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Municipio">',
      '        </div>',
      '    </div>',
      '  </div>',
      '  <div id="lentes-panel-manual" class="lentes-form-panel">',
      '    <div class="lentes-form-panel-heading"><span class="lentes-form-panel-icon" aria-hidden="true">2</span><div><h4>Datos desde Excel</h4><p>Pega el rango completo, incluidos sus encabezados.</p></div></div>',
      '    <div class="grid grid-cols-1 gap-3">',
      '      <div>',
      '        <label class="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">Rango pegado desde Excel</label>',
      '        <textarea id="lentes-paste" rows="7" class="lentes-paste-area w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono" placeholder="Promotor\tAfiliaciones\tAsistidos\tVenta Especial\tVenta Normal\tTotal Venta\nNombre Apellido\t13\t6\t3\t2\t5"></textarea>',
      '      </div>',
      '      <div class="flex items-center gap-3">',
      '        <button id="lentes-leer" class="btn-primario text-white px-4 py-2 rounded-lg font-semibold text-sm">Leer datos</button>',
      '        <span class="text-slate-500 text-xs">Revisa los datos antes de guardar.</span>',
      '      </div>',
      '    </div>',
      '  </div>',
      '  <div id="lentes-error" class="hidden rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"></div>',
      '  <div id="lentes-preview" class="overflow-x-auto"></div>',
      '</div>'
    ].join('');

    var btn = document.getElementById('lentes-leer');
    document.getElementById('lentes-carga-volver').onclick = function () { renderCargaLentes(); };
    inicializarPrecargaMunicipios();
    if (btn) {
      btn.addEventListener('click', function () {
        var result = leerDatosDesdeFormulario();
        var errorBox = document.getElementById('lentes-error');
        if (!result.ok) {
          if (errorBox) {
            errorBox.classList.remove('hidden');
            errorBox.textContent = result.error;
          }
          return;
        }

        if (errorBox) {
          errorBox.classList.add('hidden');
          errorBox.textContent = '';
        }

        obtenerPromotoresCatalogo().then(function (promotores) {
          renderTablaEditable(result.filas, promotores);
        }).catch(function () {
          renderTablaEditable(result.filas, []);
        });
      });
    }

  }

  var municipiosAtencionLentes = [];
  var municipioAtencionSeleccionado = null;
  var modoCargaActual = 'manual';
  var precargaLentesCompletada = false;

  function inicializarPrecargaMunicipios() {
    municipiosAtencionLentes = [];
    municipioAtencionSeleccionado = null;
    precargaLentesCompletada = false;

    var recientes = document.getElementById('selectRecientes');
    var ruta = document.getElementById('selectRuta');
    var municipioRuta = document.getElementById('selectMunicipioRuta');
    document.getElementById('lentes-modo-manual').addEventListener('click', function () {
      establecerModoCarga('manual');
    });
    document.getElementById('lentes-modo-precarga').addEventListener('click', function () {
      establecerModoCarga('precarga');
    });
    document.getElementById('lentes-cambiar-jornada').addEventListener('click', function () {
      document.getElementById('lentes-precarga-selector').classList.remove('hidden');
      document.getElementById('lentes-precarga-cargada').classList.add('hidden');
      document.getElementById('lentes-precarga-accion').classList.remove('hidden');
      document.getElementById('lentes-cargar-municipio').classList.remove('hidden');
      document.getElementById('lentes-preview').innerHTML = '';
      window._lentesEstado = { rows: [] };
      precargaLentesCompletada = false;
    });
    establecerModoCarga('manual');

    var tabs = [
      { button: document.getElementById('lentes-tab-recientes'), panel: document.getElementById('lentes-panel-recientes') },
      { button: document.getElementById('lentes-tab-ruta'), panel: document.getElementById('lentes-panel-ruta') }
    ];

    tabs.forEach(function (tab) {
      tab.button.addEventListener('click', function () {
        tabs.forEach(function (item) {
          var activo = item === tab;
          item.button.setAttribute('aria-selected', String(activo));
          item.button.className = activo
            ? 'rounded-md bg-verde-oscuro px-3 py-1.5 text-xs font-semibold text-white shadow-sm'
            : 'rounded-md px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:text-verde-oscuro';
          item.panel.classList.toggle('hidden', !activo);
        });
      });
    });

    recientes.addEventListener('change', function () {
      seleccionarMunicipioAtencion(recientes.value);
    });
    ruta.addEventListener('change', renderMunicipiosDeRuta);
    municipioRuta.addEventListener('change', function () {
      seleccionarMunicipioAtencion(municipioRuta.value);
    });
    document.getElementById('lentes-cargar-municipio').addEventListener('click', cargarLentesDelMunicipio);

    if (typeof AtencionMunicipiosService === 'undefined' ||
        typeof AtencionMunicipiosService.listarMunicipios !== 'function') {
      document.getElementById('lentes-precarga-estado').textContent =
        'No está disponible el servicio de jornadas de atención.';
      return;
    }

    AtencionMunicipiosService.listarMunicipios().then(function (rows) {
      municipiosAtencionLentes = (Array.isArray(rows) ? rows : []).filter(function (row) {
        return row && row.linkHoja && row.ruta && row.municipio && row.fechaAtencion;
      }).sort(function (a, b) {
        return String(b.fechaAtencion).localeCompare(String(a.fechaAtencion));
      });
      poblarMunicipiosRecientes();
      poblarRutasAtencion();
      document.getElementById('lentes-precarga-estado').textContent =
        municipiosAtencionLentes.length
          ? municipiosAtencionLentes.length + ' jornadas disponibles.'
          : 'No hay jornadas disponibles para precargar.';
    }).catch(function (error) {
      document.getElementById('lentes-precarga-estado').textContent =
        error.message || 'No se pudieron cargar las jornadas de atención.';
    });
  }

  function establecerModoCarga(modo) {
    modoCargaActual = modo === 'precarga' ? 'precarga' : 'manual';
    precargaLentesCompletada = false;
    document.getElementById('lentes-modo-manual').setAttribute('aria-pressed', String(modoCargaActual === 'manual'));
    document.getElementById('lentes-modo-precarga').setAttribute('aria-pressed', String(modoCargaActual === 'precarga'));
    document.getElementById('lentes-modo-manual').className = modoCargaActual === 'manual'
      ? 'rounded-lg bg-verde-oscuro px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-verde-medio'
      : 'rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-verde-oscuro transition hover:border-verde-medio hover:bg-verde-suave';
    document.getElementById('lentes-modo-precarga').className = modoCargaActual === 'precarga'
      ? 'rounded-lg bg-verde-oscuro px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-verde-medio'
      : 'rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-verde-oscuro transition hover:border-verde-medio hover:bg-verde-suave';
    document.getElementById('lentes-panel-manual').classList.toggle('hidden', modoCargaActual !== 'manual');
    document.getElementById('lentes-precarga').classList.toggle('hidden', modoCargaActual !== 'precarga');
    document.getElementById('lentes-datos-jornada').classList.toggle(
      'hidden',
      modoCargaActual === 'precarga' && !municipioAtencionSeleccionado
    );
    document.getElementById('lentes-datos-ayuda').textContent = modoCargaActual === 'manual'
      ? 'Completa la información antes de pegar los datos.'
      : 'Datos de la jornada seleccionada.';

    var camposCabecera = ['lentes-ruta', 'lentes-fecha', 'lentes-municipio'];
    camposCabecera.forEach(function (id) {
      document.getElementById(id).readOnly = modoCargaActual === 'precarga';
    });
    document.getElementById('lentes-precarga-selector').classList.remove('hidden');
    document.getElementById('lentes-precarga-cargada').classList.add('hidden');
    document.getElementById('lentes-precarga-accion').classList.remove('hidden');
    document.getElementById('lentes-cargar-municipio').classList.remove('hidden');
    document.getElementById('lentes-preview').innerHTML = '';
    document.getElementById('lentes-error').classList.add('hidden');
    window._lentesEstado = { rows: [] };
  }

  function poblarMunicipiosRecientes() {
    var select = document.getElementById('selectRecientes');
    select.innerHTML = '<option value="">Selecciona un municipio</option>' +
      municipiosAtencionLentes.map(function (row) {
        var fecha = String(row.fechaAtencion || '').slice(0, 10);
        var etiqueta = '[Ruta ' + row.ruta + '] ' + row.municipio + ' — Fecha de atención: ' + fecha;
        return '<option value="' + escaparHtml(row.id) + '">' + escaparHtml(etiqueta) + '</option>';
      }).join('');
  }

  function poblarRutasAtencion() {
    var select = document.getElementById('selectRuta');
    var rutas = Array.from(new Set(municipiosAtencionLentes.map(function (row) {
      return String(row.ruta);
    }))).sort(function (a, b) {
      return a.localeCompare(b, 'es', { numeric: true });
    });
    select.innerHTML = '<option value="">Selecciona una ruta</option>' +
      rutas.map(function (value) {
        return '<option value="' + escaparHtml(value) + '">Ruta ' + escaparHtml(value) + '</option>';
      }).join('');
  }

  function renderMunicipiosDeRuta() {
    var ruta = document.getElementById('selectRuta').value;
    var select = document.getElementById('selectMunicipioRuta');
    var filas = municipiosAtencionLentes.filter(function (row) {
      return String(row.ruta) === ruta;
    });
    select.disabled = !ruta;
    select.innerHTML = '<option value="">' + (ruta ? 'Selecciona un municipio' : 'Selecciona primero una ruta') + '</option>' +
      filas.map(function (row) {
        return '<option value="' + escaparHtml(row.id) + '">' + escaparHtml(row.municipio) + ' — ' +
          escaparHtml(String(row.fechaAtencion || '').slice(0, 10)) + '</option>';
      }).join('');
    seleccionarMunicipioAtencion('');
  }

  function seleccionarMunicipioAtencion(id) {
    municipioAtencionSeleccionado = municipiosAtencionLentes.find(function (row) {
      return String(row.id) === String(id);
    }) || null;

    var boton = document.getElementById('lentes-cargar-municipio');
    boton.disabled = !municipioAtencionSeleccionado;
    document.getElementById('lentes-datos-jornada').classList.toggle('hidden', !municipioAtencionSeleccionado);
    document.getElementById('lentes-precarga-selector').classList.remove('hidden');
    document.getElementById('lentes-precarga-cargada').classList.add('hidden');
    document.getElementById('lentes-precarga-accion').classList.remove('hidden');
    document.getElementById('lentes-cargar-municipio').classList.remove('hidden');
    document.getElementById('lentes-preview').innerHTML = '';
    document.getElementById('lentes-error').classList.add('hidden');
    window._lentesEstado = { rows: [] };
    precargaLentesCompletada = false;
    if (!municipioAtencionSeleccionado) {
      return;
    }

    document.getElementById('lentes-ruta').value = municipioAtencionSeleccionado.ruta;
    document.getElementById('lentes-fecha').value =
      String(municipioAtencionSeleccionado.fechaAtencion || '').slice(0, 10);
    document.getElementById('lentes-municipio').value = municipioAtencionSeleccionado.municipio;
  }

  function mostrarToastPrecarga(mensaje, error) {
    var toast = document.createElement('div');
    toast.textContent = mensaje;
    toast.setAttribute('role', error ? 'alert' : 'status');
    toast.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:1100;max-width:min(420px,calc(100vw - 40px));padding:12px 16px;border-radius:10px;background:' +
      (error ? '#9a3530' : '#087443') + ';color:#fff;font:13px/1.45 system-ui,sans-serif;box-shadow:0 8px 24px #0003';
    document.body.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 5000);
  }

  function cargarLentesDelMunicipio() {
    var boton = document.getElementById('lentes-cargar-municipio');
    if (!municipioAtencionSeleccionado) return;
    var spreadsheetId = extraerSpreadsheetId(municipioAtencionSeleccionado.linkHoja);
    if (!spreadsheetId) {
      mostrarToastPrecarga('La jornada seleccionada no está disponible para precarga.', true);
      return;
    }

    var textoOriginal = boton.textContent;
    boton.disabled = true;
    boton.setAttribute('aria-busy', 'true');
    boton.innerHTML = '<span class="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-r-transparent align-[-2px]" aria-hidden="true"></span>Cargando datos de lentes...';
    LentesCargaService.leerLentesMunicipio(spreadsheetId).then(function (respuesta) {
      if (!respuesta || respuesta.ok === false) {
        console.error('[LentesCarga] Error al precargar jornada:', respuesta && respuesta.error);
        throw new Error('No se pudieron cargar los datos de la jornada. Inténtalo nuevamente.');
      }
      if (respuesta.status === 'error') {
        console.error('[LentesCarga] Error devuelto al precargar jornada:', respuesta.message);
        throw new Error('No se pudieron cargar los datos de la jornada. Verifica la información e inténtalo nuevamente.');
      }
      if (typeof respuesta.error === 'string' && respuesta.error.trim()) {
        console.error('[LentesCarga] Error devuelto al precargar jornada:', respuesta.error);
        throw new Error('No se pudieron cargar los datos de la jornada. Verifica la información e inténtalo nuevamente.');
      }
      var filas = parsearRespuestaLentesMunicipio(respuesta);
      if (!filas.length) {
        throw new Error('La jornada no tiene registros de asesores para precargar.');
      }
      return obtenerPromotoresCatalogo().then(function (promotores) {
        renderTablaEditable(filas, promotores);
        precargaLentesCompletada = true;
        document.getElementById('lentes-precarga-selector').classList.add('hidden');
        document.getElementById('lentes-precarga-cargada').classList.remove('hidden');
        document.getElementById('lentes-precarga-accion').classList.add('hidden');
        boton.classList.add('hidden');
        mostrarToastPrecarga('Datos de la jornada precargados correctamente.', false);
      });
    }).catch(function (error) {
      mostrarToastPrecarga(error.message || 'No se pudieron cargar los datos de lentes.', true);
    }).finally(function () {
      if (boton.isConnected) {
        boton.disabled = !municipioAtencionSeleccionado;
        boton.removeAttribute('aria-busy');
        boton.textContent = textoOriginal;
      }
    });
  }

  var api = {
    crearFiltrosConsultaJornadas: crearFiltrosConsultaJornadas,
    parsearDatosPegados: parsearDatosPegados,
    parsearRespuestaLentesMunicipio: parsearRespuestaLentesMunicipio,
    extraerSpreadsheetId: extraerSpreadsheetId,
    normalizarNombrePromotor: normalizarNombrePromotor,
    renderCargaLentes: renderCargaLentes,
    parseNumero: parseNumero,
    validarFilaLentes: validarFilaLentes,
    resolverPromotor: resolverPromotor
  };

  root.LentesCarga = api;
  root.renderCargaLentes = renderCargaLentes;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
