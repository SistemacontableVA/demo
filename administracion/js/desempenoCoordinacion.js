(function (global) {
  'use strict';

  var estadosIncluidos = { cerrada: true, validada: true };
  var jornadas = [];
  var modulo;
  var secuenciaCarga = 0;

  function numero(valor) {
    var resultado = Number(valor);
    return Number.isFinite(resultado) ? resultado : 0;
  }

  function textoPlano(valor) {
    return String(valor === undefined || valor === null ? '' : valor);
  }

  function escaparHtml(valor) {
    return textoPlano(valor).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function afiliacionesDe(jornada) {
    return Array.isArray(jornada && jornada.afiliaciones) ? jornada.afiliaciones : [];
  }

  function contarAfiliaciones(jornada) {
    return afiliacionesDe(jornada).reduce(function (total, fila) {
      return total + numero(fila && (fila.aff !== undefined ? fila.aff : fila.afiliaciones));
    }, 0);
  }

  function contarPromotores(jornada) {
    var unicos = Object.create(null);
    afiliacionesDe(jornada).forEach(function (fila) {
      if (!fila) return;
      var nombre = textoPlano(fila.asesor || fila.promotor || fila.nombre).trim();
      if (!nombre || /^seleccionar\b/i.test(nombre)) return;
      var rol = textoPlano(fila.rol || 'PROMOTOR').trim().toLocaleUpperCase('es');
      if (rol !== 'PROMOTOR') return;
      unicos[nombre.toLocaleLowerCase('es')] = true;
    });
    return Object.keys(unicos).length;
  }

  function listaAfiliacionesPromotores(jornada) {
    return afiliacionesDe(jornada).map(function (fila) {
      if (!fila) return null;
      var nombre = textoPlano(fila.asesor || fila.promotor || fila.nombre).trim();
      if (!nombre || /^seleccionar\b/i.test(nombre)) return null;
      return {
        nombre: nombre,
        rol: textoPlano(fila.rol || 'PROMOTOR').trim(),
        afiliaciones: numero(fila.aff !== undefined ? fila.aff : fila.afiliaciones)
      };
    }).filter(Boolean);
  }

  function totalesDe(jornada) {
    return jornada && jornada.totales ? jornada.totales : {};
  }

  function saldoFinalDe(jornada) {
    var totales = totalesDe(jornada);
    if (totales.saldoFinal !== undefined && totales.saldoFinal !== null) return numero(totales.saldoFinal);
    return numero(totales.saldoInicial) + numero(totales.totalIngresos) -
      numero(totales.totalDeduccion) - numero(totales.totalEgresos);
  }

  function recaudoBrutoDe(jornada) {
    return numero(jornada && jornada.gastos && jornada.gastos.recaudoBase);
  }

  function calcularMetricas(lista) {
    var cierres = Array.isArray(lista) ? lista : [];
    var totalAfiliaciones = cierres.reduce(function (total, jornada) {
      return total + contarAfiliaciones(jornada);
    }, 0);
    var totalSaldoFinal = cierres.reduce(function (total, jornada) {
      return total + saldoFinalDe(jornada);
    }, 0);
    var totalEgresos = cierres.reduce(function (total, jornada) {
      return total + numero(totalesDe(jornada).totalEgresos);
    }, 0);
    var totalRecaudoBruto = cierres.reduce(function (total, jornada) {
      return total + recaudoBrutoDe(jornada);
    }, 0);
    var totalPromotores = cierres.reduce(function (total, jornada) {
      return total + contarPromotores(jornada);
    }, 0);

    return {
      jornadas: cierres.length,
      totalAfiliaciones: totalAfiliaciones,
      promedioAfiliaciones: cierres.length ? totalAfiliaciones / cierres.length : 0,
      promedioSaldoFinal: cierres.length ? totalSaldoFinal / cierres.length : 0,
      porcentajeGastoOperativo: totalRecaudoBruto > 0 ? totalEgresos / totalRecaudoBruto * 100 : null,
      promedioPromotores: cierres.length ? totalPromotores / cierres.length : 0,
      totalRecaudoBruto: totalRecaudoBruto,
      totalEgresos: totalEgresos
    };
  }

  function estadoIncluido(jornada) {
    return Boolean(jornada && estadosIncluidos[textoPlano(jornada.estado).toLowerCase()]);
  }

  function filtrarJornadas(lista, filtros) {
    filtros = filtros || {};
    return (Array.isArray(lista) ? lista : []).filter(function (jornada) {
      var fecha = textoPlano(jornada.fecha).slice(0, 10);
      return estadoIncluido(jornada) &&
        (!filtros.desde || fecha >= filtros.desde) &&
        (!filtros.hasta || fecha <= filtros.hasta) &&
        (!filtros.coordinador || filtros.coordinador === 'Todos' ||
          textoPlano(jornada.coordinador).toLocaleLowerCase('es') === filtros.coordinador.toLocaleLowerCase('es'));
    }).sort(function (a, b) {
      return textoPlano(a.fecha).localeCompare(textoPlano(b.fecha)) ||
        textoPlano(a.coordinador).localeCompare(textoPlano(b.coordinador), 'es');
    });
  }

  function agruparCoordinadores(lista) {
    var porCoordinador = Object.create(null);
    (Array.isArray(lista) ? lista : []).forEach(function (jornada) {
      var nombre = textoPlano(jornada.coordinador).trim();
      if (!nombre) return;
      var clave = nombre.toLocaleLowerCase('es');
      if (!porCoordinador[clave]) porCoordinador[clave] = { nombre: nombre, afiliaciones: 0, jornadas: 0 };
      porCoordinador[clave].afiliaciones += contarAfiliaciones(jornada);
      porCoordinador[clave].jornadas += 1;
    });
    return Object.keys(porCoordinador).map(function (clave) {
      var item = porCoordinador[clave];
      return {
        nombre: item.nombre,
        jornadas: item.jornadas,
        promedio: item.jornadas ? item.afiliaciones / item.jornadas : 0
      };
    }).sort(function (a, b) {
      return b.promedio - a.promedio || a.nombre.localeCompare(b.nombre, 'es');
    });
  }

  function moneda(valor) {
    return '$' + numero(valor).toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  function decimal(valor) {
    return numero(valor).toLocaleString('es-VE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }

  function fechaCorta(fecha) {
    var partes = textoPlano(fecha).slice(0, 10).split('-');
    return partes.length === 3 ? partes[2] + '/' + partes[1] + '/' + partes[0] : textoPlano(fecha);
  }

  function descripcionEstado(estado) {
    return estado === 'validada' ? 'Validada' : 'Cerrada';
  }

  function obtenerFiltros() {
    return {
      coordinador: modulo.querySelector('#desempeno-coordinador').value,
      desde: modulo.querySelector('#desempeno-desde').value,
      hasta: modulo.querySelector('#desempeno-hasta').value
    };
  }

  function mostrarMetricas(metricas) {
    var porcentaje = metricas.porcentajeGastoOperativo === null
      ? '—'
      : decimal(metricas.porcentajeGastoOperativo) + '%';
    modulo.querySelector('#desempeno-kpis').innerHTML = [
      ['Promedio de afiliaciones diarias', decimal(metricas.promedioAfiliaciones), 'afiliaciones por jornada'],
      ['Promedio de saldo final en caja', moneda(metricas.promedioSaldoFinal), 'saldo final'],
      ['Porcentaje de gasto operativo', porcentaje, 'egresos / recaudo base'],
      ['Promedio de promotores por jornada', decimal(metricas.promedioPromotores), 'promotores asignados']
    ].map(function (item) {
      return '<article class="desempeno-kpi"><span>' + item[0] + '</span><strong>' +
        item[1] + '</strong><small>' + item[2] + '</small></article>';
    }).join('');
  }

  function crearGraficoAfiliaciones(lista) {
    if (!lista.length) return '<div class="desempeno-empty">No hay cierres en este rango para graficar.</div>';
    var maxAfiliaciones = Math.max(1, ...lista.map(contarAfiliaciones));
    var barras = lista.map(function (jornada) {
      var afiliaciones = contarAfiliaciones(jornada);
      var altura = afiliaciones ? Math.max(6, afiliaciones / maxAfiliaciones * 100) : 0;
      var municipio = textoPlano(jornada.municipio || 'Sin municipio');
      return '<article class="desempeno-bar-item" aria-label="' + escaparHtml(
        fechaCorta(jornada.fecha) + ', ' + municipio + ', ' + afiliaciones + ' afiliaciones') + '">' +
        '<strong class="desempeno-bar-value">' + afiliaciones + '</strong>' +
        '<div class="desempeno-bar-track"><span style="height:' + altura + '%"></span></div>' +
        '<time class="desempeno-bar-date" datetime="' + escaparHtml(textoPlano(jornada.fecha).slice(0, 10)) +
        '">' + escaparHtml(fechaCorta(jornada.fecha)) + '</time>' +
        '<span class="desempeno-bar-municipality" title="' + escaparHtml(municipio) + '">' +
        escaparHtml(municipio) + '</span></article>';
    }).join('');
    return '<div class="desempeno-bars-scroll" role="region" aria-label="Afiliaciones por fecha y municipio" tabindex="0">' +
      '<div class="desempeno-bars">' + barras + '</div></div>';
  }

  function crearGraficoBarras(lista) {
    if (!lista.length) return '<div class="desempeno-empty">No hay datos suficientes para comparar coordinadores.</div>';
    var maximo = Math.max(1, ...lista.map(function (item) { return item.promedio; }));
    return '<ol class="desempeno-ranking">' + lista.map(function (item, index) {
      var ancho = Math.max(0, item.promedio / maximo * 100);
      return '<li><div class="desempeno-ranking-label"><span><b>' + (index + 1) + '.</b> ' +
        escaparHtml(item.nombre) + '</span><strong>' + decimal(item.promedio) + '</strong></div>' +
        '<div class="desempeno-ranking-track"><span style="width:' + ancho + '%"></span></div>' +
        '<small>' + item.jornadas + (item.jornadas === 1 ? ' jornada' : ' jornadas') + '</small></li>';
    }).join('') + '</ol>';
  }

  function construirDetalle(jornada) {
    var promotores = listaAfiliacionesPromotores(jornada);
    var gastos = jornada.gastos || {};
    var totales = totalesDe(jornada);
    var nombres = promotores.map(function (promotor) {
      return '<li><span class="desempeno-promoter-name">' + escaparHtml(promotor.nombre) +
        '</span><span class="desempeno-promoter-role">' + escaparHtml(promotor.rol) +
        '</span><strong>' + promotor.afiliaciones + (promotor.afiliaciones === 1
          ? ' afiliación' : ' afiliaciones') + '</strong></li>';
    }).join('');
    return '<div class="desempeno-detail-grid"><section><h4>Personal de la jornada</h4><p>' +
      contarPromotores(jornada) + ' promotores activos · ' + contarAfiliaciones(jornada) +
      ' afiliaciones</p><ul>' + (nombres || '<li>Sin personal registrado.</li>') +
      '</ul></section><section><h4>Resumen financiero</h4><dl>' +
      '<div><dt>Recaudo base</dt><dd>' + moneda(recaudoBrutoDe(jornada)) + '</dd></div>' +
      '<div><dt>Ingresos totales</dt><dd>' + moneda(totales.totalIngresos) + '</dd></div>' +
      '<div><dt>Deducciones</dt><dd>' + moneda(totales.totalDeduccion) + '</dd></div>' +
      '<div><dt>Egresos</dt><dd>' + moneda(totales.totalEgresos) + '</dd></div>' +
      '<div><dt>Saldo Final</dt><dd>' + moneda(saldoFinalDe(jornada)) + '</dd></div>' +
      '</dl></section></div>';
  }

  function renderizarHistorico(lista) {
    var cuerpo = modulo.querySelector('#desempeno-historico');
    if (!lista.length) {
    cuerpo.innerHTML = '<p class="desempeno-empty">No hay jornadas cerradas para los filtros seleccionados.</p>';
      return;
    }
    cuerpo.innerHTML = lista.map(function (jornada, index) {
    var municipio = textoPlano(jornada.municipio || 'Sin municipio');
    var idDetalle = 'desempeno-detalle-' + index;
    return '<article class="desempeno-history-item"><button class="desempeno-history-toggle" ' +
      'type="button" aria-expanded="false" aria-controls="' + idDetalle +
      '" onclick="toggleDesempenoJornada(' + index + ')">' +
      '<time class="desempeno-history-date" datetime="' +
      escaparHtml(textoPlano(jornada.fecha).slice(0, 10)) + '">' +
      escaparHtml(fechaCorta(jornada.fecha)) + '</time>' +
      '<span class="desempeno-history-municipality" title="' + escaparHtml(municipio) + '">' +
      escaparHtml(municipio) + '</span>' +
      '<span class="desempeno-history-affiliations"><strong>' + contarAfiliaciones(jornada) +
      '</strong><small>afiliaciones</small></span>' +
      '<span class="desempeno-history-balance"><strong>' + moneda(saldoFinalDe(jornada)) +
      '</strong><small>saldo final</small></span>' +
      '<span class="desempeno-state desempeno-state-' + escaparHtml(jornada.estado) + '">' +
      descripcionEstado(jornada.estado) + '</span>' +
      '<svg class="desempeno-history-chevron" aria-hidden="true" viewBox="0 0 20 20" fill="none">' +
      '<path d="m5 7.5 5 5 5-5" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
      '<div id="' + idDetalle + '" class="desempeno-history-detail" hidden>' +
      construirDetalle(jornada) + '</div></article>';
    }).join('');
  }

  function actualizarVista() {
    if (!modulo || !modulo.isConnected) return;
    var filtros = obtenerFiltros();
    var visibles = filtrarJornadas(jornadas, filtros);
    var dentroDelRango = filtrarJornadas(jornadas, {
      desde: filtros.desde,
      hasta: filtros.hasta
    });
    mostrarMetricas(calcularMetricas(visibles));
    modulo.querySelector('#desempeno-grafico-afiliaciones').innerHTML = crearGraficoAfiliaciones(visibles);
    modulo.querySelector('#desempeno-grafico-ranking').innerHTML = crearGraficoBarras(agruparCoordinadores(dentroDelRango));
    renderizarHistorico(visibles.slice().reverse());
    modulo.querySelector('#desempeno-conteo-jornadas').textContent =
      visibles.length + (visibles.length === 1 ? ' jornada' : ' jornadas');
  }

  function llenarCoordinadores(lista) {
    var select = modulo.querySelector('#desempeno-coordinador');
    var actuales = Object.create(null);
    lista.forEach(function (jornada) {
      var nombre = textoPlano(jornada.coordinador).trim();
      if (nombre) actuales[nombre.toLocaleLowerCase('es')] = nombre;
    });
    var nombres = Object.keys(actuales).map(function (clave) { return actuales[clave]; })
      .sort(function (a, b) { return a.localeCompare(b, 'es'); });
    select.innerHTML = '<option value="Todos">Todos</option>' + nombres.map(function (nombre) {
      return '<option value="' + escaparHtml(nombre) + '">' + escaparHtml(nombre) + '</option>';
    }).join('');
  }

  async function cargarDetalles(lista, idCarga) {
    var resultado = [];
    var tamanioLote = 5;
    for (var inicio = 0; inicio < lista.length; inicio += tamanioLote) {
      if (idCarga !== secuenciaCarga) return [];
      var lote = lista.slice(inicio, inicio + tamanioLote);
      var detalles = await Promise.all(lote.map(function (resumen) {
        return global.ContabilidadDiariaService.loadRemoteDraftByFecha(resumen.fecha);
      }));
      detalles.forEach(function (detalle, indice) {
        if (!detalle) throw new Error('No se encontró el detalle del cierre de ' + lista[inicio + indice].fecha + '.');
        resultado.push(detalle);
      });
      var progreso = modulo.querySelector('#desempeno-progreso');
      if (progreso && idCarga === secuenciaCarga) {
        progreso.textContent = 'Cargando detalles: ' + Math.min(inicio + lote.length, lista.length) + ' de ' + lista.length + ' jornadas...';
      }
    }
    return resultado;
  }

  async function cargarDatos() {
    var idCarga = ++secuenciaCarga;
    var error = modulo.querySelector('#desempeno-error');
    var progreso = modulo.querySelector('#desempeno-progreso');
    error.hidden = true;
    modulo.querySelector('#desempeno-instruccion').hidden = true;
    modulo.querySelector('#desempeno-vacio').hidden = true;
    progreso.hidden = false;
    progreso.textContent = 'Cargando historial de cierres...';
    modulo.querySelector('#desempeno-contenido').hidden = true;

    try {
      var historial = await global.ContabilidadDiariaService.loadRemoteDraftHistory();
      if (!Array.isArray(historial)) throw new Error('El historial recibido no tiene un formato válido.');
      var cierres = historial.filter(estadoIncluido).sort(function (a, b) {
        return textoPlano(a.fecha).localeCompare(textoPlano(b.fecha));
      });
      llenarCoordinadores(cierres);
      if (!cierres.length) {
        jornadas = [];
        modulo.querySelector('#desempeno-contenido').hidden = false;
        actualizarVista();
        progreso.hidden = true;
        modulo.querySelector('#desempeno-vacio').hidden = false;
        return;
      }

      modulo.querySelector('#desempeno-vacio').hidden = true;
      var desde = modulo.querySelector('#desempeno-desde');
      var hasta = modulo.querySelector('#desempeno-hasta');
      if (!desde.value) desde.value = textoPlano(cierres[0].fecha).slice(0, 10);
      if (!hasta.value) hasta.value = textoPlano(cierres[cierres.length - 1].fecha).slice(0, 10);
      var detalles = await cargarDetalles(cierres, idCarga);
      if (idCarga !== secuenciaCarga || !modulo.isConnected) return;
      jornadas = detalles.filter(estadoIncluido);
      modulo.querySelector('#desempeno-contenido').hidden = false;
      actualizarVista();
      progreso.hidden = true;
    } catch (cargaError) {
      if (idCarga !== secuenciaCarga || !modulo.isConnected) return;
      console.error('[DesempenoCoordinacion] No se pudieron cargar las jornadas:', cargaError);
      progreso.hidden = true;
      error.textContent = 'No se pudo cargar el desempeño: ' + cargaError.message;
      error.hidden = false;
    }
  }

  function renderDesempenoCoordinacion() {
    var contenedor = document.getElementById('admin-content');
    if (!contenedor) return;
    modulo = document.createElement('section');
    modulo.className = 'desempeno-module';
    modulo.innerHTML = [
      '<header class="desempeno-heading"><div><span>ADMINISTRACIÓN · AUDITORÍA DE CAMPO</span>',
      '<h1>Desempeño Coordinación</h1><p>Indicadores basados en los cierres diarios validados y cerrados.</p></div>',
      '<button class="desempeno-refresh" type="button" id="desempeno-consultar">Consultar</button></header>',
      '<section class="desempeno-filters" aria-label="Filtros del reporte">',
      '<label>Coordinador<select id="desempeno-coordinador"><option value="Todos">Todos</option></select></label>',
      '<label>Desde<input id="desempeno-desde" type="date"></label>',
      '<label>Hasta<input id="desempeno-hasta" type="date"></label>',
      '<span id="desempeno-conteo-jornadas" class="desempeno-count">0 jornadas</span></section>',
      '<div id="desempeno-progreso" class="desempeno-message" hidden></div>',
      '<div id="desempeno-error" class="desempeno-message desempeno-error" hidden></div>',
      '<div id="desempeno-instruccion" class="desempeno-message">Selecciona el coordinador y el rango de fechas, luego pulsa «Consultar» para cargar las métricas.</div>',
      '<div id="desempeno-vacio" class="desempeno-message" hidden>No hay jornadas cerradas o validadas para analizar.</div>',
      '<div id="desempeno-contenido" hidden>',
      '<section id="desempeno-kpis" class="desempeno-kpis" aria-label="Indicadores de desempeño"></section>',
      '<div class="desempeno-charts">',
      '<section class="desempeno-panel"><header><div><span>COMPORTAMIENTO DIARIO</span><h2>Afiliaciones por fecha y municipio</h2></div></header>',
      '<div id="desempeno-grafico-afiliaciones"></div><p class="desempeno-chart-note">Desliza horizontalmente para recorrer las fechas.</p></section>',
      '<section class="desempeno-panel"><header><div><span>COMPARATIVO</span><h2>Promedio de afiliaciones por coordinador</h2></div></header>',
      '<div id="desempeno-grafico-ranking"></div><p class="desempeno-chart-note">Ranking de todos los coordinadores con cierres en el rango seleccionado.</p></section>',
      '</div>',
      '<section class="desempeno-panel desempeno-history"><header><div><span>SEGUIMIENTO Y AUDITORÍA</span><h2>Histórico de cierres diarios</h2></div></header>',
      '<div id="desempeno-historico" class="desempeno-history-list" aria-label="Cierres diarios"></div>',
      '</section></div>'
    ].join('');
    contenedor.replaceChildren(modulo);
    modulo.querySelector('#desempeno-coordinador').addEventListener('change', actualizarVista);
    modulo.querySelector('#desempeno-desde').addEventListener('change', actualizarVista);
    modulo.querySelector('#desempeno-hasta').addEventListener('change', actualizarVista);
    modulo.querySelector('#desempeno-consultar').addEventListener('click', cargarDatos);
  }

  function toggleDesempenoJornada(indice) {
    if (!modulo) return;
    var detalle = modulo.querySelector('#desempeno-detalle-' + indice);
    var item = detalle && detalle.closest('.desempeno-history-item');
    var boton = item && item.querySelector('.desempeno-history-toggle');
    if (!detalle || !boton) return;
    var abrir = detalle.hidden;
    if (abrir) {
      modulo.querySelectorAll('.desempeno-history-item.is-expanded').forEach(function (abierto) {
        if (abierto === item) return;
        var detalleAbierto = abierto.querySelector('.desempeno-history-detail');
        var botonAbierto = abierto.querySelector('.desempeno-history-toggle');
        if (detalleAbierto) detalleAbierto.hidden = true;
        if (botonAbierto) botonAbierto.setAttribute('aria-expanded', 'false');
        abierto.classList.remove('is-expanded');
      });
    }
    detalle.hidden = !abrir;
    boton.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    item.classList.toggle('is-expanded', abrir);
  }

  global.toggleDesempenoJornada = toggleDesempenoJornada;
  global.renderDesempenoCoordinacion = renderDesempenoCoordinacion;
  global.DesempenoCoordinacion = {
    calcularMetricas: calcularMetricas,
    contarAfiliaciones: contarAfiliaciones,
    contarPromotores: contarPromotores,
    filtrarJornadas: filtrarJornadas,
    agruparCoordinadores: agruparCoordinadores,
    crearGraficoAfiliaciones: crearGraficoAfiliaciones,
    listaAfiliacionesPromotores: listaAfiliacionesPromotores,
    construirDetalle: construirDetalle,
    saldoFinalDe: saldoFinalDe,
    recaudoBrutoDe: recaudoBrutoDe
  };
})(window);
