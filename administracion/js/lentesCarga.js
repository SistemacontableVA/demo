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
        validBox.innerHTML = 'Validación correcta. La jornada está lista para guardar en Relacion Lentes.';
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
      validBox.innerHTML = 'Guardando en Relacion Lentes...';
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
        var mensaje = respuesta && respuesta.error ? respuesta.error : 'No se pudo guardar la jornada.';
        if (validBox) {
          validBox.className = 'rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700';
          validBox.innerHTML = mensaje;
        }
        return;
      }

      if (validBox) {
        validBox.className = 'rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700';
        validBox.innerHTML = respuesta.mensaje || 'Jornada guardada en Relacion Lentes.';
      }
    }).catch(function (error) {
      if (guardarBtn) guardarBtn.disabled = false;
      if (validBox) {
        validBox.className = 'rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700';
        validBox.innerHTML = 'Error al guardar: ' + (error && error.message ? error.message : error);
      }
    });
  }

  function cargarJornadasExistentes() {
    var resultado = document.getElementById('lentes-jornadas-resultado');
    if (!resultado) return;
    resultado.innerHTML = 'Leyendo jornadas...';
    var filtros = {
      fecha: document.getElementById('lentes-editar-fecha') ? document.getElementById('lentes-editar-fecha').value : '',
      ruta: document.getElementById('lentes-editar-ruta') ? document.getElementById('lentes-editar-ruta').value.trim() : '',
      municipio: document.getElementById('lentes-editar-municipio') ? document.getElementById('lentes-editar-municipio').value.trim() : '',
      asesor: document.getElementById('lentes-editar-asesor') ? document.getElementById('lentes-editar-asesor').value.trim() : ''
    };
    LentesCargaService.listarJornadasLentes(filtros).then(function (respuesta) {
      if (!respuesta || !respuesta.ok) {
        resultado.innerHTML = '<div class="text-red-700">' + escaparHtml(respuesta && respuesta.error ? respuesta.error : 'No se pudieron leer las jornadas.') + '</div>';
        return;
      }
      window._lentesJornadas = respuesta.registros || [];
      var totalJornadas = window._lentesJornadas.reduce(function (total, registro) { return total + Number(registro.totalLentes || 0); }, 0);
      var asesoresJornada = {};
      window._lentesJornadas.forEach(function (registro) { if (registro.asesor) asesoresJornada[registro.asesor] = true; });
      var resumen = window._lentesJornadas.length ? '<div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4"><div class="bg-verde-suave rounded-xl px-4 py-3"><p class="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Registros</p><p class="text-xl font-bold text-verde-oscuro mt-1">' + window._lentesJornadas.length + '</p></div><div class="bg-slate-50 rounded-xl px-4 py-3"><p class="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Promotores</p><p class="text-xl font-bold text-slate-700 mt-1">' + Object.keys(asesoresJornada).length + '</p></div><div class="bg-amber-50 rounded-xl px-4 py-3"><p class="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Total lentes</p><p class="text-xl font-bold text-amber-700 mt-1">' + totalJornadas + '</p></div></div>' : '';
      resultado.innerHTML = window._lentesJornadas.length ? resumen + '<div class="flex items-center justify-between mb-2"><h4 class="text-sm font-bold text-slate-700">Jornadas encontradas</h4><span class="text-xs text-slate-400">Selecciona una acción</span></div>' + window._lentesJornadas.map(function (registro, index) {
        return '<div class="flex flex-wrap items-center justify-between gap-3 border border-slate-200 rounded-lg px-3 py-3 mb-2 text-xs hover:border-verde-oscuro/30"><span class="min-w-0"><strong class="text-slate-700">' + escaparHtml(registro.fecha) + '</strong><span class="text-slate-400"> · </span>' + escaparHtml(registro.ruta) + '<span class="text-slate-400"> · </span>' + escaparHtml(registro.municipio) + '<span class="text-slate-400"> · </span>' + escaparHtml(registro.asesor) + '<span class="text-slate-400"> · Total: </span><strong>' + registro.totalLentes + '</strong></span><span class="flex items-center gap-2 shrink-0"><button type="button" class="btn-primario text-white font-bold px-3 py-1.5 rounded-lg text-[11px] hover:bg-verde-oscuro transition-colors" data-editar-jornada="' + index + '" title="Abrir ventana para editar esta jornada"><span aria-hidden="true">✎</span> Editar</button><button type="button" class="font-bold px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-[11px]" data-suprimir-jornada="' + index + '" title="Suprimir el contenido de esta jornada">Suprimir</button></span></div>';
      }).join('') : '<div class="py-2 text-xs text-slate-500">No hay jornadas que coincidan con los filtros.</div>';
    });
  }

  function suprimirJornada(registro, boton) {
    if (!registro) return;
    mostrarConfirmacionLentes('¿Está seguro de suprimir la información de esta jornada?', 'La fila se limpiará sin borrar ni mover otras jornadas.', function () {
    boton.disabled = true;
    boton.textContent = 'Suprimiendo...';
    LentesCargaService.suprimirJornadaLentes(registro.fila).then(function (respuesta) {
      if (!respuesta || !respuesta.ok) {
        alert(respuesta && respuesta.error ? respuesta.error : 'No se pudo suprimir el registro.');
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
    modal.innerHTML = '<div class="bg-white rounded-xl shadow-xl p-5 sm:p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="lentes-editor-titulo"><div class="flex justify-between items-start gap-4 mb-5 pb-4 border-b border-slate-100"><div><p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Relacion Lentes · fila ' + registro.fila + '</p><h4 id="lentes-editor-titulo" class="font-bold text-verde-oscuro text-lg mt-1">Editar jornada</h4><p class="text-xs text-slate-500 mt-1">Revisa los valores y confirma los cambios antes de actualizar.</p></div><button type="button" id="lentes-editor-cerrar" class="w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50" title="Cerrar ventana de edición" aria-label="Cerrar ventana de edición">&times;</button></div><div class="grid grid-cols-1 sm:grid-cols-2 gap-3">' + [
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
          if (!respuesta || !respuesta.ok) { mostrarConfirmacionLentes('No se pudieron guardar los cambios', respuesta && respuesta.error ? respuesta.error : 'Intenta nuevamente.', function () {}); boton.disabled = false; return; }
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
      '<div class="fade-in space-y-5">',
      '  <div class="flex items-center justify-between gap-3">',
      '    <div><h3 class="text-verde-oscuro font-bold text-lg">Gestión de lentes por jornada</h3><p class="text-slate-400 text-sm mt-0.5">Selecciona un criterio para consultar únicamente las jornadas que necesitas.</p></div>',
      '    <button id="lentes-volver" type="button" class="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-white hover:shadow-sm" title="Volver al menú de Gestión de lentes"><span aria-hidden="true">←</span> Volver</button>',
      '  </div>',
      '  <div class="bg-white rounded-xl shadow-soft p-4 sm:p-5">',
      '    <div class="flex items-center gap-2 mb-4"><span class="w-8 h-8 rounded-lg bg-verde-suave flex items-center justify-center text-verde-oscuro" aria-hidden="true">⌕</span><div><h4 class="font-bold text-slate-700 text-sm">Buscar una jornada</h4><p class="text-xs text-slate-400">Elige un criterio para consultar.</p></div></div>',
      '    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">',
      '      <label class="text-xs text-slate-600">Buscar por<select id="lentes-criterio" class="mt-1 w-full rounded border border-slate-200 px-2 py-2 text-sm"><option value="fecha">Fecha</option><option value="municipio">Municipio</option><option value="asesor">Promotor</option></select></label>',
      '      <label class="text-xs text-slate-600" id="lentes-filtro-fecha">Fecha<input id="lentes-editar-fecha" type="date" class="mt-1 w-full rounded border border-slate-200 px-2 py-2 text-sm"></label>',
      '      <label class="text-xs text-slate-600 hidden" id="lentes-filtro-municipio">Municipio<select id="lentes-editar-municipio" class="mt-1 w-full rounded border border-slate-200 px-2 py-2 text-sm"><option value="">Cargando municipios...</option></select></label>',
      '      <label class="text-xs text-slate-600 hidden" id="lentes-filtro-asesor">Promotor<select id="lentes-editar-asesor" class="mt-1 w-full rounded border border-slate-200 px-2 py-2 text-sm"><option value="">Cargando promotores...</option></select></label>',
      '    </div>',
      '    <div class="flex flex-wrap items-center gap-3 mt-4"><button id="lentes-leer-jornadas" type="button" class="btn-primario text-white px-4 py-2 rounded-lg text-sm font-semibold" title="Consultar jornadas usando el criterio seleccionado">Consultar jornada</button><button id="lentes-limpiar-filtros" type="button" class="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100" title="Limpiar el criterio y los resultados">Limpiar</button><span class="text-xs text-slate-400">La fecha es obligatoria si buscas por fecha.</span></div>',
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
      ['fecha', 'municipio', 'asesor'].forEach(function (campo) { document.getElementById('lentes-filtro-' + campo).classList.toggle('hidden', criterio.value !== campo); });
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
      if (criterio.value === 'fecha' && !document.getElementById('lentes-editar-fecha').value) { alert('Selecciona una fecha para consultar.'); return; }
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
        '  <div class="grid grid-cols-1 md:grid-cols-2 gap-5">',
        '    <button id="lentes-card-carga" type="button" class="group bg-white rounded-xl shadow-soft p-6 text-left border border-slate-100 hover:border-petroleo/30 hover:shadow-lg transition-all" title="Abrir carga de lentes en sistema"><div class="w-11 h-11 rounded-xl bg-verde-suave flex items-center justify-center mb-5 text-verde-oscuro text-2xl" aria-hidden="true">↥</div><h4 class="font-bold text-verde-oscuro text-base">Carga de Lentes en sistema</h4><p class="text-slate-500 text-sm mt-2 leading-relaxed">Pega los resultados de Excel, valida los promotores y registra una nueva jornada.</p><span class="inline-flex items-center gap-2 mt-5 text-sm font-semibold text-petroleo group-hover:gap-3 transition-all">Abrir carga <span aria-hidden="true">→</span></span></button>',
        '    <button id="lentes-card-gestion" type="button" class="group bg-white rounded-xl shadow-soft p-6 text-left border border-slate-100 hover:border-petroleo/30 hover:shadow-lg transition-all" title="Abrir gestión de lentes por jornada"><div class="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center mb-5 text-amber-700 text-2xl" aria-hidden="true">⌕</div><h4 class="font-bold text-verde-oscuro text-base">Gestión de lentes por jornada</h4><p class="text-slate-500 text-sm mt-2 leading-relaxed">Consulta una fecha, municipio o promotor y edita registros existentes.</p><span class="inline-flex items-center gap-2 mt-5 text-sm font-semibold text-petroleo group-hover:gap-3 transition-all">Abrir gestión <span aria-hidden="true">→</span></span></button>',
        '  </div>',
        '</div>'
      ].join('');
      document.getElementById('lentes-card-carga').onclick = function () { renderCargaLentes('carga'); };
      document.getElementById('lentes-card-gestion').onclick = renderGestionLentes;
      return;
    }

    contenedor.innerHTML = [
      '<div class="fade-in space-y-5">',
      '  <div class="flex items-center justify-between gap-3">',
      '    <div>',
      '      <h3 class="text-verde-oscuro font-bold text-lg">Gestión de Lentes</h3>',
      '      <p class="text-slate-400 text-sm mt-0.5">Pega el rango de Excel para validar nombres y preparar una nueva jornada.</p>',
      '    </div>',
      '    <button id="lentes-carga-volver" type="button" class="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-white hover:shadow-sm" title="Volver al menú de Gestión de lentes"><span aria-hidden="true">←</span> Volver</button>',
      '  </div>',
      '  <div class="bg-white rounded-xl shadow-soft p-4">',
      '    <div class="grid grid-cols-1 gap-4">',
      '      <div>',
      '        <label class="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">Ruta</label>',
      '        <input id="lentes-ruta" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Ruta 1">',
      '      </div>',
      '      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">',
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
      '      </div>',
      '      <div>',
      '        <label class="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">Rango pegado desde Excel</label>',
      '        <textarea id="lentes-paste" rows="10" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono" placeholder="Promotor\tAfiliaciones\tAsistidos\tVenta Especial\tVenta Normal\tTotal Venta\nElizabeth Quintero\t13\t6\t3\t2\t5"></textarea>',
      '      </div>',
      '      <div class="flex items-center gap-3">',
      '        <button id="lentes-leer" class="btn-primario text-white px-4 py-2 rounded-lg font-semibold text-sm">Leer datos</button>',
      '        <span class="text-slate-400 text-xs">La carga solo escribe en Relacion Lentes.</span>',
      '      </div>',
      '      <div id="lentes-error" class="hidden rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"></div>',
      '      <div id="lentes-preview" class="overflow-x-auto"></div>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');

    var btn = document.getElementById('lentes-leer');
    document.getElementById('lentes-carga-volver').onclick = function () { renderCargaLentes(); };
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

  var api = {
    parsearDatosPegados: parsearDatosPegados,
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
