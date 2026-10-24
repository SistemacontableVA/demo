(function (global) {
  'use strict';

  function numero(valor) {
    var resultado = Number(valor);
    return Number.isFinite(resultado) ? resultado : 0;
  }

  function formatoDinero(valor) {
    return '$' + numero(valor).toFixed(1);
  }

  function agregarSiCorresponde(lista, detalle, monto) {
    var texto = String(detalle || '').trim();
    var valor = numero(monto);
    if (texto && valor !== 0) lista.push({ detalle: texto, monto: valor });
  }

  function fechaLegible(fecha) {
    var partes = String(fecha || '').split('-');
    return partes.length === 3 ? partes[2] + '/' + partes[1] + '/' + partes[0] : (fecha || 'No disponible');
  }

  function parteNombreArchivo(valor, alternativo) {
    return String(valor || alternativo).trim()
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, ' ')
      .replace(/\s+/g, ' ');
  }

  function crearModelo(snapshot, marca) {
    snapshot = snapshot || {};
    var gastos = snapshot.gastos || {};
    var detalle = snapshot.detalle || {};
    var totales = snapshot.totales || {};
    var afiliaciones = (Array.isArray(snapshot.afiliaciones) ? snapshot.afiliaciones : []).filter(function (fila) {
      var asesor = String(fila.asesor || '').trim();
      var tieneAsesor = asesor && !/^seleccionar\s/i.test(asesor);
      var tieneValores = ['aff', 'recAbono', 'almuerzo', 'cena', 'urbano', 'vereda', 'adic', 'ganado', 'recaudoNeto', 'prestamo']
        .some(function (campo) { return numero(fila[campo]) !== 0; });
      return Boolean(tieneAsesor || tieneValores);
    });
    var totalAff = afiliaciones.reduce(function (total, fila) { return total + numero(fila.aff); }, 0);
    var totalRecaudo = afiliaciones.reduce(function (total, fila) { return total + numero(fila.recAbono); }, 0);
    var totalAlmuerzo = afiliaciones.reduce(function (total, fila) { return total + numero(fila.almuerzo); }, 0);
    var totalCena = afiliaciones.reduce(function (total, fila) { return total + numero(fila.cena); }, 0);
    var totalUrbano = afiliaciones.reduce(function (total, fila) { return total + numero(fila.urbano); }, 0);
    var totalVereda = afiliaciones.reduce(function (total, fila) { return total + numero(fila.vereda); }, 0);
    var totalAdicional = afiliaciones.reduce(function (total, fila) { return total + numero(fila.adic); }, 0);
    var totalGanado = afiliaciones.reduce(function (total, fila) { return total + numero(fila.ganado); }, 0);
    var totalNeto = afiliaciones.reduce(function (total, fila) { return total + numero(fila.recaudoNeto); }, 0);
    var totalPrestamo = afiliaciones.reduce(function (total, fila) { return total + numero(fila.prestamo); }, 0);
    var saldoInicial = numero(totales.saldoInicial);
    var totalIngresos = numero(totales.totalIngresos);
    var totalDeduccion = numero(totales.totalDeduccion);
    var totalEgresos = numero(totales.totalEgresos);
    var filasIngresos = [];
    var filasDeducciones = [];
    var filasEgresos = [];

    agregarSiCorresponde(filasIngresos, 'Saldo inicial en caja' + (detalle.saldoInicialOrigen ? ' · ' + detalle.saldoInicialOrigen : ''), saldoInicial);
    agregarSiCorresponde(filasIngresos, 'Recaudo base (' + totalAff + ' afiliaciones)', gastos.recaudoBase);
    agregarSiCorresponde(filasIngresos, 'Abonos adicionales', gastos.abonosAdic);
    agregarSiCorresponde(filasIngresos, 'Giros / consignaciones recibidas', gastos.giros);

    agregarSiCorresponde(filasDeducciones, 'Consignaciones / transferencias', gastos.consignaciones);
    agregarSiCorresponde(filasDeducciones, 'Pago de abonos ganados', gastos.abonosGanados);

    agregarSiCorresponde(filasEgresos, detalle.comidaCoordinador, gastos.comidaCoor);
    agregarSiCorresponde(filasEgresos, detalle.desayunos, gastos.desayunos);
    agregarSiCorresponde(filasEgresos, 'Almuerzos de campo', gastos.almuerzos);
    agregarSiCorresponde(filasEgresos, 'Cenas generadas', gastos.cenasGanadas);
    agregarSiCorresponde(filasEgresos, 'Cenas / préstamos a promotores', gastos.cenasPrestadas);
    agregarSiCorresponde(filasEgresos, 'Hotel / hospedaje', gastos.hotel);
    agregarSiCorresponde(filasEgresos, 'Transporte urbano', gastos.transUrbano);
    agregarSiCorresponde(filasEgresos, 'Transporte vereda', gastos.transVereda);
    agregarSiCorresponde(filasEgresos, detalle.varios, gastos.varios);
    (Array.isArray(gastos.extra) ? gastos.extra : []).forEach(function (gasto) {
      agregarSiCorresponde(filasEgresos, gasto.detalle, gasto.monto);
    });

    return {
      empresa: (marca && marca.nombre) || 'Empresa',
      logo: (marca && marca.logo) || 'assets/images/logomenu.png',
      fecha: fechaLegible(snapshot.fecha),
      municipio: snapshot.municipio || 'No disponible',
      coordinador: snapshot.coordinador || 'No disponible',
      nombreArchivo: [
        'Rcoordinacion',
        parteNombreArchivo(snapshot.fecha, 'fecha'),
        parteNombreArchivo(snapshot.municipio, 'municipio').toLocaleUpperCase('es'),
        parteNombreArchivo(snapshot.coordinador, 'coordinador').toLocaleUpperCase('es')
      ].join('-'),
      afiliaciones: afiliaciones.map(function (fila, index) {
        var rol = String(fila.rol || 'Sin rol').toLocaleLowerCase('es');
        return {
          numero: index + 1,
          asesor: fila.asesor || 'Sin asesor',
          rol: rol.replace(/(^|\s)\S/g, function (letra) { return letra.toLocaleUpperCase('es'); }),
          aff: numero(fila.aff),
          recAbono: formatoDinero(fila.recAbono),
          almuerzo: formatoDinero(fila.almuerzo),
          cena: formatoDinero(fila.cena),
          urbano: formatoDinero(fila.urbano),
          vereda: formatoDinero(fila.vereda),
          adic: formatoDinero(fila.adic),
          ganado: formatoDinero(fila.ganado),
          recaudoNeto: formatoDinero(fila.recaudoNeto),
          prestamo: formatoDinero(fila.prestamo)
        };
      }),
      totalesAfiliaciones: {
        aff: totalAff,
        recAbono: formatoDinero(totalRecaudo),
        almuerzo: formatoDinero(totalAlmuerzo),
        cena: formatoDinero(totalCena),
        urbano: formatoDinero(totalUrbano),
        vereda: formatoDinero(totalVereda),
        adic: formatoDinero(totalAdicional),
        ganado: formatoDinero(totalGanado),
        recaudoNeto: formatoDinero(totalNeto),
        prestamo: formatoDinero(totalPrestamo)
      },
      ingresos: filasIngresos,
      totalCaja: saldoInicial + totalIngresos,
      deducciones: filasDeducciones,
      totalDeducciones: totalDeduccion,
      egresos: filasEgresos,
      totalEgresos: totalEgresos,
      saldoInicial: saldoInicial,
      totalIngresos: totalIngresos,
      saldoFinal: saldoInicial + totalIngresos - totalDeduccion - totalEgresos
    };
  }

  function ponerTexto(documento, selector, valor) {
    var elemento = documento.querySelector(selector);
    if (elemento) elemento.textContent = valor;
  }

  function ponerFilas(documento, selector, filas) {
    var contenedor = documento.querySelector(selector);
    if (!contenedor) throw new Error('La plantilla no contiene el espacio requerido: ' + selector);
    filas.forEach(function (fila) {
      var elemento = documento.createElement('div');
      elemento.className = 'accounting-row';
      var etiqueta = documento.createElement('span');
      etiqueta.textContent = fila.detalle;
      var monto = documento.createElement('strong');
      monto.textContent = formatoDinero(fila.monto);
      elemento.append(etiqueta, monto);
      contenedor.appendChild(elemento);
    });
  }

  function renderizar(html, snapshot, marca, raizApp) {
    var documento = new DOMParser().parseFromString(html, 'text/html');
    var modelo = crearModelo(snapshot, marca);
    var tabla = documento.querySelector('[data-report-affiliations]');
    if (!tabla) throw new Error('La plantilla no contiene la tabla de afiliaciones.');

    ponerTexto(documento, '[data-report-company]', modelo.empresa);
    ponerTexto(documento, '[data-report-date]', modelo.fecha);
    ponerTexto(documento, '[data-report-municipality]', modelo.municipio);
    ponerTexto(documento, '[data-report-coordinator]', modelo.coordinador);

    var logo = documento.querySelector('[data-report-logo]');
    if (!logo) throw new Error('La plantilla no contiene el espacio para el logo.');
    logo.src = new URL(modelo.logo, raizApp).href;
    logo.alt = modelo.empresa;

    modelo.afiliaciones.forEach(function (fila) {
      var tr = documento.createElement('tr');
      [
        fila.numero, fila.asesor, fila.rol, fila.aff, fila.recAbono, fila.almuerzo,
        fila.cena, fila.urbano, fila.vereda, fila.adic, fila.ganado, fila.recaudoNeto, fila.prestamo
      ].forEach(function (valor, indice) {
        var celda = documento.createElement('td');
        if (indice === 1) celda.className = 'text-left';
        celda.textContent = valor;
        tr.appendChild(celda);
      });
      tabla.appendChild(tr);
    });

    Object.keys(modelo.totalesAfiliaciones).forEach(function (campo) {
      ponerTexto(documento, '[data-report-total="' + campo + '"]', modelo.totalesAfiliaciones[campo]);
    });
    ponerFilas(documento, '[data-report-income]', modelo.ingresos);
    ponerFilas(documento, '[data-report-deductions]', modelo.deducciones);
    ponerFilas(documento, '[data-report-expenses]', modelo.egresos);
    ponerTexto(documento, '[data-report-income-total]', formatoDinero(modelo.totalCaja));
    ponerTexto(documento, '[data-report-deductions-total]', formatoDinero(modelo.totalDeducciones));
    ponerTexto(documento, '[data-report-expenses-total]', formatoDinero(modelo.totalEgresos));
    ponerTexto(documento, '[data-report-formula]', '(' + formatoDinero(modelo.saldoInicial) + ' + ' +
      formatoDinero(modelo.totalIngresos) + ') - ' + formatoDinero(modelo.totalDeducciones) +
      ' - ' + formatoDinero(modelo.totalEgresos) + ' = ' + formatoDinero(modelo.saldoFinal));
    ponerTexto(documento, '[data-report-final-balance]', formatoDinero(modelo.saldoFinal));
    documento.title = modelo.nombreArchivo;

    var base = documento.createElement('base');
    base.href = raizApp;
    documento.head.prepend(base);
    return '<!DOCTYPE html>\n' + documento.documentElement.outerHTML;
  }

  global.ContabilidadReporte = {
    crearModelo: crearModelo,
    renderizar: renderizar
  };
})(window);
