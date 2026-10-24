(function (global) {
  'use strict';

  var coordinadores = [];
  var nominaActual = null;
  var coordinadorActual = null;
  var modulo = null;
  var guardando = false;
  var plantillaNomina = null;
  var plantillaOficial = null;
  var cierresCompletos = Object.create(null);

  var CAMPOS = [
    { key: 'municipio', label: 'Municipio', type: 'text', cell: 0 },
    { key: 'fecha', label: 'Fecha', type: 'date', cell: 1 },
    { key: 'cantidadAfiliacionesGrupales', label: 'N° Aff Grupo', type: 'number', cell: 2 },
    { key: 'cantidadBrigadas', label: 'N° Brigadas', type: 'number', cell: 3 },
    { key: 'asistidos', label: 'Asistidos', type: 'number', cell: 4 },
    { key: 'lentes', label: 'Lentes', type: 'number', cell: 5 },
    { key: 'prestamoAbono', label: 'Prest / Abon.', type: 'number', cell: 6 },
    { key: 'descuentoComida', label: 'Descuento / Comida', type: 'number', cell: 9 },
    { key: 'detalle', label: 'Detalle', type: 'text', cell: 10 }
  ];

  function texto(valor) {
    return String(valor === undefined || valor === null ? '' : valor);
  }

  function escapar(valor) {
    return texto(valor).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function baseApiUrl() {
    var baseUrl = texto(global.API_URL || (global.ApiConfig && global.ApiConfig.nomina &&
      global.ApiConfig.nomina.baseUrl)).trim();
    if (!baseUrl) throw new Error('No está configurada la URL de la API de nómina.');
    return baseUrl;
  }

  function urlApi(parametros) {
    var baseUrl = baseApiUrl();
    var separador = baseUrl.indexOf('?') === -1 ? '?' : '&';
    return baseUrl + separador + Object.keys(parametros).map(function (clave) {
      return encodeURIComponent(clave) + '=' + encodeURIComponent(parametros[clave]);
    }).join('&');
  }

  async function api(parametros) {
    var esEscritura = parametros.action === 'agregar-jornada-coordinador' ||
      parametros.action === 'editar-jornada-coordinador' ||
      parametros.action === 'eliminar-jornada-coordinador';
    var opciones = { cache: 'no-store' };
    var endpoint;
    if (esEscritura) {
      endpoint = baseApiUrl();
      opciones.method = 'POST';
      opciones.headers = { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' };
      opciones.body = new URLSearchParams(parametros).toString();
    } else {
      endpoint = urlApi(parametros);
    }
    var respuesta = await global.fetch(endpoint, opciones);
    if (!respuesta.ok) throw new Error('La API de nómina respondió HTTP ' + respuesta.status + '.');
    var datos = await respuesta.json();
    if (!datos || typeof datos !== 'object' || datos.ok === false || datos.error) {
      throw new Error(datos && (datos.error || datos.message) || 'La API devolvió una respuesta inválida.');
    }
    return datos;
  }

  function mostrarMensaje(mensaje, error) {
    var host = modulo && modulo.querySelector('#nomina-coordinador-mensaje');
    if (!host) return;
    host.textContent = mensaje;
    host.className = 'mb-4 rounded-xl px-4 py-3 text-sm ' +
      (error ? 'border border-red-200 bg-red-50 text-red-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-800');
    host.hidden = !mensaje;
  }

  function fechaInput(valor) {
    var valorTexto = texto(valor).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(valorTexto)) return valorTexto;
    var partes = valorTexto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    return partes ? partes[3] + '-' + partes[2].padStart(2, '0') + '-' + partes[1].padStart(2, '0') : '';
  }

  function fechaMostrar(valor) {
    var partes = fechaInput(valor).split('-');
    return partes.length === 3 ? partes[2] + '/' + partes[1] + '/' + partes[0] : texto(valor);
  }

  function escaparParaScript(valor) {
    return JSON.stringify(valor).replace(/</g, '\\u003c')
      .replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  }

  async function cargarPlantillaNomina(datos) {
    var frame = modulo && modulo.querySelector('#nomina-coordinador-plantilla');
    if (!frame) return;
    try {
      if (!plantillaNomina) {
        var urlPlantilla = new URL('administracion/documentos/templates/nomina_coordinador_vista.html', document.baseURI);
        plantillaNomina = global.fetch(urlPlantilla.href, { cache: 'no-store' }).then(function (respuestaPlantilla) {
          if (!respuestaPlantilla.ok) throw new Error('No se pudo cargar la plantilla (HTTP ' + respuestaPlantilla.status + ').');
          return respuestaPlantilla.text();
        }).catch(function (error) {
          plantillaNomina = null;
          throw error;
        });
      }
      var htmlPlantilla = await plantillaNomina;
      var urlBase = new URL('.', document.baseURI).href;
      var baseSeguro = urlBase.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
      var html = htmlPlantilla.replace(/<base\s+href=["'][^"']*["']\s*\/?>/i,
        '<base href="' + baseSeguro + '">');
      if (datos) {
        html = html.replace(/<head([^>]*)>/i, '$&<script>window.__nominaData=' +
          escaparParaScript(datos) + ';</script>');
      }
      await new Promise(function (resolve) {
        frame.onload = function () {
          habilitarEdicionEnPlantilla(frame, datos);
          resolve();
        };
        frame.onerror = function () {
          mostrarMensaje('No se pudo inicializar la plantilla de nómina.', true);
          resolve();
        };
        frame.srcdoc = html;
      });
    } catch (error) {
      console.error('[NominaCoordinador] Error cargando plantilla:', error);
      mostrarMensaje(error.message, true);
      throw error;
    }
  }

  async function mostrarPlantillaOficial() {
    if (!nominaActual) {
      mostrarMensaje('Consulta una nómina antes de abrirla en una pestaña nueva.', true);
      return;
    }
    var ventana = global.open('', '_blank');
    if (!ventana) {
      mostrarMensaje('El navegador bloqueó la pestaña nueva. Permite las ventanas emergentes para ver la nómina.', true);
      return;
    }
    try {
      if (!plantillaOficial) {
        var url = new URL('administracion/documentos/templates/nomina_coordinador.html', document.baseURI);
        plantillaOficial = global.fetch(url.href, { cache: 'no-store' }).then(function (respuesta) {
          if (!respuesta.ok) throw new Error('No se pudo cargar la plantilla oficial (HTTP ' + respuesta.status + ').');
          return respuesta.text();
        }).catch(function (error) {
          plantillaOficial = null;
          throw error;
        });
      }
      var htmlPlantilla = await plantillaOficial;
      var urlBase = new URL('.', document.baseURI).href;
      var baseSeguro = urlBase.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
      var html = htmlPlantilla.replace(/<base\s+href=["'][^"']*["']\s*\/?>/i,
        '<base href="' + baseSeguro + '">');
      html = html.replace(/<head([^>]*)>/i, '$&<script>window.__nominaData=' +
        escaparParaScript(nominaActual) + ';</script>');
      ventana.opener = null;
      ventana.document.open();
      ventana.document.write(html);
      ventana.document.close();
    } catch (error) {
      console.error('[NominaCoordinador] Error abriendo plantilla oficial:', error);
      mostrarMensaje(error.message, true);
      ventana.close();
    }
  }

  function leerFila(fila, nueva) {
    var valores = {};
    CAMPOS.forEach(function (campo) {
      var entrada = fila.querySelector('[data-campo="' + campo.key + '"]');
      if (!entrada) return;
      var valor = entrada.value.trim();
      if (!valor) return;
      if (campo.key === 'fecha') valor = fechaInput(valor);
      var original = fila._nominaJornada && fila._nominaJornada[campo.key];
      var originalNormalizado = campo.key === 'fecha' ? fechaInput(original) : texto(original).trim();
      if (!nueva && originalNormalizado === valor) return;
      valores[campo.key] = valor;
    });
    return valores;
  }

  function validarFila(fila) {
    var entradas = fila.querySelectorAll('[data-campo]');
    for (var i = 0; i < entradas.length; i++) {
      if (!entradas[i].checkValidity()) {
        entradas[i].reportValidity();
        return false;
      }
    }
    return true;
  }

  function agregarControlesFila(documento, fila, jornada, nueva) {
    fila._nominaJornada = Object.assign({}, jornada);
    fila.dataset.fila = nueva ? '' : texto(jornada.fila);
    fila.dataset.fechaOriginal = nueva ? '' : texto(jornada.fecha);
    fila.classList.toggle('nomina-coordinador-fila-nueva', nueva);
    fila.classList.toggle('nomina-coordinador-fila-editando', true);
    CAMPOS.forEach(function (campo) {
      var celda = fila.cells[campo.cell];
      if (!celda) return;
      var entrada = documento.createElement('input');
      entrada.type = campo.type;
      entrada.dataset.campo = campo.key;
      entrada.setAttribute('aria-label', campo.label);
      if (nueva && (campo.key === 'municipio' || campo.key === 'fecha')) entrada.required = true;
      if (campo.type === 'number') entrada.step = 'any';
      entrada.value = campo.key === 'fecha' ? fechaInput(jornada[campo.key]) : texto(jornada[campo.key]);
      entrada.className = 'campo';
      celda.textContent = '';
      celda.appendChild(entrada);
    });
    if (nueva) {
      fila.cells[7].textContent = 'Automático';
      fila.cells[7].className = 'formula';
    }
    var celdaAccion = fila.cells[11] || fila.insertCell(-1);
    celdaAccion.textContent = '';
    celdaAccion.className = 'no-print';
    celdaAccion.dataset.nominaAccionCell = 'true';
    var guardar = documento.createElement('button');
    guardar.type = 'button';
    guardar.textContent = 'Guardar';
    guardar.dataset.accionNomina = nueva ? 'guardar-nuevo' : 'guardar-fila';
    guardar.className = 'accion';
    celdaAccion.appendChild(guardar);
    if (!nueva) {
      var eliminar = documento.createElement('button');
      eliminar.type = 'button';
      eliminar.textContent = 'Eliminar';
      eliminar.dataset.accionNomina = 'eliminar-fila';
      eliminar.className = 'accion eliminar';
      celdaAccion.appendChild(eliminar);
    }
    var cancelar = documento.createElement('button');
    cancelar.type = 'button';
    cancelar.textContent = 'Cancelar';
    cancelar.dataset.accionNomina = nueva ? 'cancelar-nuevo' : 'cancelar-edicion';
    cancelar.className = 'accion secundaria';
    celdaAccion.appendChild(cancelar);
  }

  function habilitarEdicionEnPlantilla(frame, datos) {
    var documento = frame.contentDocument;
    var cuerpo = documento && documento.getElementById('tablaJornadas');
    if (!cuerpo) {
      mostrarMensaje('La plantilla de nómina no contiene la tabla de jornadas esperada.', true);
      return;
    }
    var botonVerNomina = documento.getElementById('nomina-coordinador-ver-oficial');
    if (botonVerNomina) {
      botonVerNomina.disabled = !datos;
      botonVerNomina.addEventListener('click', mostrarPlantillaOficial);
    }
    cuerpo.addEventListener('click', function (evento) {
      var boton = evento.target.closest('[data-accion-nomina]');
      if (!boton) return;
      var accion = boton.dataset.accionNomina;
      if (accion === 'cancelar-nuevo') {
        boton.closest('tr').remove();
      } else if (accion === 'cancelar-edicion') {
        consultarNomina();
      } else if (accion === 'editar-fila') {
        var filaEditar = boton.closest('tr');
        agregarControlesFila(documento, filaEditar, filaEditar._nominaJornada, false);
      } else if (accion === 'eliminar-fila') {
        var filaEliminar = boton.closest('tr');
        var jornadaEliminar = filaEliminar && filaEliminar._nominaJornada;
        if (!jornadaEliminar || !global.confirm('¿Suprimir esta jornada de ' +
            texto(jornadaEliminar.municipio || 'este municipio') + ' del ' +
            texto(jornadaEliminar.fecha) + '? Se limpiarán sus datos y el proceso es irreversible.')) return;
        eliminarJornada(jornadaEliminar, boton);
      } else {
        var fila = boton.closest('tr');
        if (!validarFila(fila)) return;
        var esNueva = accion === 'guardar-nuevo';
        var valores = leerFila(fila, esNueva);
        if (esNueva && (!valores.municipio || !valores.fecha)) {
          mostrarMensaje('Municipio y fecha son obligatorios para ingresar una jornada.', true);
          return;
        }
        if (!Object.keys(valores).length) {
          mostrarMensaje('No hay campos modificados para guardar.', true);
          return;
        }
        guardarJornada(valores,
          esNueva ? 'agregar-jornada-coordinador' : 'editar-jornada-coordinador',
          esNueva ? null : {
            fila: fila.dataset.fila,
            fechaOriginal: fila.dataset.fechaOriginal
          }, boton);
      }
    });
    Array.from(cuerpo.rows).forEach(function (fila, indice) {
      if (datos && datos.jornadas && datos.jornadas[indice]) {
        fila._nominaJornada = Object.assign({}, datos.jornadas[indice]);
      }
    });
  }

  function abrirFilaNueva(valores) {
    var frame = modulo.querySelector('#nomina-coordinador-plantilla');
    var documento = frame && frame.contentDocument;
    var cuerpo = documento && documento.getElementById('tablaJornadas');
    if (!cuerpo || !coordinadorActual) {
      mostrarMensaje('Consulta una nómina antes de añadir una jornada.', true);
      return;
    }
    var existente = cuerpo.querySelector('.nomina-coordinador-fila-nueva');
    if (existente) existente.remove();
    var filaVacia = cuerpo.querySelector('.nomina-coordinador-fila-vacia');
    if (filaVacia) filaVacia.remove();
    var fila = cuerpo.insertRow(-1);
    for (var indice = 0; indice < 12; indice++) fila.insertCell(-1);
    agregarControlesFila(documento, fila, valores || {}, true);
    var primerCampo = fila.cells[0] && fila.cells[0].querySelector('[data-campo="municipio"]');
    if (primerCampo) primerCampo.focus();
  }

  function sumarAfiliaciones(cierre) {
    return (Array.isArray(cierre && cierre.afiliaciones) ? cierre.afiliaciones : []).reduce(function (total, fila) {
      var raw = fila && (fila.aff !== undefined ? fila.aff :
        fila.afiliaciones !== undefined ? fila.afiliaciones : fila.cantidadAfiliaciones);
      var valor = raw === '' || raw === null || raw === undefined ? 0 : Number(raw);
      return total + (Number.isFinite(valor) ? valor : 0);
    }, 0);
  }

  async function cargarDetalleCierre(fecha) {
    var clave = fechaInput(fecha);
    if (!cierresCompletos[clave]) {
      var completo = await global.ContabilidadDiariaService.loadRemoteDraftByFecha(clave);
      if (!completo) throw new Error('No se encontró el cierre seleccionado.');
      cierresCompletos[clave] = completo;
    }
    return cierresCompletos[clave];
  }

  async function seleccionarCierre() {
    var selector = modulo.querySelector('#nomina-coordinador-cierre');
    var indice = selector.value;
    var cierre = indice === '' ? null : selector._cierres && selector._cierres[Number(indice)];
    if (!cierre) return;
    var botonPrecarga = modulo.querySelector('#nomina-coordinador-precargar');
    botonPrecarga.disabled = true;
    var indiceSeleccionado = indice;
    var cierreValido = false;
    mostrarMensaje('Consultando afiliaciones del cierre de ' + texto(cierre.coordinador || 'coordinador') + '...');
    try {
      var completo = await cargarDetalleCierre(cierre.fecha);
      if (['cerrada', 'validada'].indexOf(texto(completo.estado).toLowerCase()) === -1) {
        throw new Error('El cierre ya no está cerrado o validado.');
      }
      cierreValido = true;
      if (selector.value !== indiceSeleccionado) return;
      var opcion = selector.options[selector.selectedIndex];
      opcion.textContent = fechaMostrar(completo.fecha) + ' · ' + texto(completo.municipio || 'Sin municipio') +
        ' · ' + texto(completo.coordinador || 'Sin coordinador') + ' · ' +
        sumarAfiliaciones(completo) + ' AFF · ' + texto(completo.estado);
      botonPrecarga.disabled = false;
      mostrarMensaje('Cierre de ' + texto(completo.coordinador || 'coordinador sin nombre') +
        ': ' + sumarAfiliaciones(completo) + ' afiliaciones disponibles para precargar.');
    } catch (error) {
      console.error('[NominaCoordinador] Error consultando afiliaciones del cierre:', error);
      mostrarMensaje(error.message, true);
    } finally {
      if (selector.value === indiceSeleccionado) {
        botonPrecarga.disabled = !cierreValido;
      }
    }
  }

  async function consultarNomina() {
    var select = modulo.querySelector('#nomina-coordinador-select');
    coordinadorActual = coordinadores.find(function (item) { return item.cedula === select.value; }) || null;
    if (!coordinadorActual) {
      mostrarMensaje('Selecciona un coordinador antes de consultar.', true);
      return;
    }
    var botonConsultar = modulo.querySelector('#nomina-coordinador-consultar');
    select.disabled = true;
    botonConsultar.disabled = true;
    botonConsultar.textContent = 'Cargando...';
    mostrarMensaje('');
    try {
      var datos = await api({ action: 'obtener-nomina-coordinador', cedula: coordinadorActual.cedula });
      var nomina = datos.nomina || datos;
      if (!Array.isArray(nomina.jornadas)) throw new Error('La respuesta no contiene las jornadas de nómina.');
      nominaActual = nomina;
      coordinadorActual.nombreCoordinador = nomina.nombreCoordinador || coordinadorActual.nombreCoordinador;
      await cargarPlantillaNomina(nominaActual);
      modulo.querySelector('#nomina-coordinador-ingreso-manual').disabled = false;
    } catch (error) {
      console.error('[NominaCoordinador] Error consultando la nómina:', error);
      mostrarMensaje(error.message, true);
    } finally {
      select.disabled = false;
      botonConsultar.disabled = false;
      botonConsultar.textContent = 'Consultar nómina';
    }
  }

  function renderizarCierres(cierres) {
    var select = modulo.querySelector('#nomina-coordinador-cierre');
    var candidatos = cierres.filter(function (cierre) {
      return cierre && ['cerrada', 'validada'].indexOf(texto(cierre.estado).toLowerCase()) !== -1;
    });
    select.innerHTML = '<option value="">Selecciona un cierre</option>' + candidatos.map(function (cierre, index) {
      var etiqueta = fechaMostrar(cierre.fecha) + ' · ' + texto(cierre.municipio || 'Sin municipio') +
        ' · ' + texto(cierre.coordinador || 'Sin coordinador') + ' · ' + texto(cierre.estado);
      return '<option value="' + index + '">' + escapar(etiqueta) + '</option>';
    }).join('');
    select._cierres = candidatos;
    modulo.querySelector('#nomina-coordinador-precargar').disabled = true;
    cierresCompletos = Object.create(null);
    return candidatos.length;
  }

  async function cargarCierres() {
    if (!coordinadorActual) {
      mostrarMensaje('Primero consulta y selecciona la nómina del coordinador.', true);
      return;
    }
    var boton = modulo.querySelector('#nomina-coordinador-cargar-cierres');
    boton.disabled = true;
    boton.textContent = 'Buscando cierres...';
    try {
      var historial = await global.ContabilidadDiariaService.loadRemoteDraftHistory();
      if (!Array.isArray(historial)) throw new Error('El historial recibido de cierres no es válido.');
      var encontrados = renderizarCierres(historial);
      mostrarMensaje(encontrados
        ? 'Selecciona un cierre para cargar su total real de afiliaciones. La lista muestra el coordinador de cada cierre.'
        : 'No hay cierres cerrados o validados disponibles.');
    } catch (error) {
      console.error('[NominaCoordinador] Error cargando cierres contables:', error);
      mostrarMensaje('No se pudieron cargar los cierres: ' + error.message, true);
    } finally {
      boton.disabled = false;
      boton.textContent = 'Buscar cierres para precargar';
    }
  }

  async function precargarCierre() {
    var selector = modulo.querySelector('#nomina-coordinador-cierre');
    var indice = selector.value;
    var cierre = indice === '' ? null : selector._cierres && selector._cierres[Number(indice)];
    if (!cierre) {
      mostrarMensaje('Selecciona un cierre antes de precargar.', true);
      return;
    }
    var boton = modulo.querySelector('#nomina-coordinador-precargar');
    boton.disabled = true;
    try {
      var cierreCompleto = await cargarDetalleCierre(cierre.fecha);
      if (!cierreCompleto || ['cerrada', 'validada'].indexOf(texto(cierreCompleto.estado).toLowerCase()) === -1) {
        throw new Error('El cierre ya no está cerrado o validado.');
      }
      var totalAff = sumarAfiliaciones(cierreCompleto);
      var valores = {
        fecha: fechaInput(cierreCompleto.fecha),
        municipio: texto(cierreCompleto.municipio),
        cantidadAfiliacionesGrupales: String(totalAff)
      };
      abrirFilaNueva(valores);
      mostrarMensaje('Precarga lista desde el cierre de ' +
        texto(cierreCompleto.coordinador || 'coordinador sin nombre') +
        '. Completa los demás campos y guarda la fila para registrarla.');
    } catch (error) {
      console.error('[NominaCoordinador] Error precargando cierre:', error);
      mostrarMensaje(error.message, true);
    } finally {
      boton.disabled = false;
    }
  }

  async function eliminarJornada(jornada, boton) {
    if (!coordinadorActual || guardando) return;
    guardando = true;
    boton.disabled = true;
    boton.textContent = 'Eliminando...';
    try {
      var resultado = await api({
        action: 'eliminar-jornada-coordinador',
        cedula: coordinadorActual.cedula,
        fila: jornada.fila,
        fechaOriginal: jornada.fecha
      });
      mostrarMensaje(resultado.mensaje || 'La jornada se suprimió correctamente.');
      await consultarNomina();
    } catch (error) {
      console.error('[NominaCoordinador] Error suprimiendo jornada:', error);
      mostrarMensaje(error.message, true);
      boton.disabled = false;
      boton.textContent = 'Eliminar';
    } finally {
      guardando = false;
    }
  }

  async function guardarJornada(valores, accion, metadatos, boton) {
    if (!coordinadorActual || guardando) return;
    guardando = true;
    if (boton) {
      boton.disabled = true;
      boton.textContent = 'Guardando...';
    }
    var datos = {
      action: accion,
      cedula: coordinadorActual.cedula,
      payload: JSON.stringify(valores)
    };
    if (metadatos) {
      datos.fila = metadatos.fila;
      datos.fechaOriginal = metadatos.fechaOriginal;
    }

    try {
      var resultado = await api(datos);
      mostrarMensaje(resultado.mensaje || 'La jornada se guardó correctamente.');
      await consultarNomina();
    } catch (error) {
      console.error('[NominaCoordinador] Error guardando jornada:', error);
      mostrarMensaje(error.message, true);
      if (boton) {
        boton.disabled = false;
        boton.textContent = 'Guardar';
      }
    } finally {
      guardando = false;
    }
  }

  function enlazarEventos() {
    modulo.querySelector('#nomina-coordinador-select').addEventListener('change', function () {
      coordinadorActual = null;
      nominaActual = null;
      cargarPlantillaNomina(null).catch(function (error) {
        console.error('[NominaCoordinador] Error reiniciando la plantilla:', error);
        mostrarMensaje(error.message, true);
      });
      var cierres = modulo.querySelector('#nomina-coordinador-cierre');
      cierres._cierres = [];
      cierres.innerHTML = '<option value="">Consulta primero la nómina del coordinador</option>';
      modulo.querySelector('#nomina-coordinador-precargar').disabled = true;
      modulo.querySelector('#nomina-coordinador-ingreso-manual').disabled = true;
      cierresCompletos = Object.create(null);
      mostrarMensaje('Pulsa «Consultar nómina» para cargar el coordinador seleccionado.');
    });
    modulo.addEventListener('click', function (evento) {
      if (evento.target.closest('#nomina-coordinador-consultar')) consultarNomina();
      if (evento.target.closest('#nomina-coordinador-cargar-cierres')) cargarCierres();
      if (evento.target.closest('#nomina-coordinador-precargar')) precargarCierre();
      if (evento.target.closest('#nomina-coordinador-ingreso-manual')) abrirFilaNueva({});
    });
    modulo.querySelector('#nomina-coordinador-cierre').addEventListener('change', seleccionarCierre);
  }

  async function cargarCoordinadores() {
    var select = modulo.querySelector('#nomina-coordinador-select');
    try {
      var datos = await api({ action: 'listar-nominas-coordinador' });
      if (!Array.isArray(datos.nominas)) throw new Error('La respuesta no contiene una lista de coordinadores.');
      coordinadores = datos.nominas.filter(function (item) {
        return item && texto(item.cedula).trim() && texto(item.nombreCoordinador).trim();
      });
      select.innerHTML = '<option value="">Selecciona un coordinador</option>' + coordinadores.map(function (item) {
        return '<option value="' + escapar(item.cedula) + '">' + escapar(item.nombreCoordinador) + '</option>';
      }).join('');
    } catch (error) {
      console.error('[NominaCoordinador] Error cargando coordinadores:', error);
      select.innerHTML = '<option value="">No se pudo cargar la lista</option>';
      mostrarMensaje(error.message, true);
    }
  }

  global.renderNominaCoordinador = function () {
    var contenedor = document.getElementById('admin-content');
    if (!contenedor) return;
    modulo = document.createElement('section');
    modulo.className = 'fade-in';
    modulo.innerHTML = [
      '<header class="nomina-coordinador-page-heading mb-4"><span>Gestión de jornadas</span><span aria-hidden="true">·</span><span>Consulta, edita y registra nóminas de coordinador</span></header>',
      '<div id="nomina-coordinador-mensaje" class="mb-4 rounded-xl px-4 py-3 text-sm" role="status" hidden></div>',
      '<div class="nomina-coordinador-toolbar mb-4">',
      '<section class="nomina-coordinador-coordinador-card rounded-xl border border-slate-200 bg-white p-3 shadow-sm"><label class="min-w-0 flex-1"><span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Coordinador</span><select id="nomina-coordinador-select" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"><option value="">Cargando coordinadores...</option></select></label>',
      '<button id="nomina-coordinador-consultar" type="button" class="shrink-0 rounded-lg bg-emerald-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">Consultar nómina</button></section>',
      '<section class="nomina-coordinador-preload-card flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm" aria-label="Precarga de cierre diario">',
      '<button id="nomina-coordinador-cargar-cierres" type="button" class="rounded-lg border border-emerald-700 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50">Buscar cierres</button>',
      '<select id="nomina-coordinador-cierre" class="nomina-coordinador-cierre-select min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"><option value="">Consulta una nómina primero</option></select>',
      '<button id="nomina-coordinador-precargar" type="button" disabled class="rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">Precargar en nueva fila</button>',
      '<button id="nomina-coordinador-ingreso-manual" type="button" disabled class="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">Ingreso manual</button>',
      '</section>',
      '</div>',
      '<div class="nomina-coordinador-plantilla-scroll"><iframe id="nomina-coordinador-plantilla" title="Vista administrativa adicional de nómina del coordinador"></iframe></div>',
    ].join('');
    contenedor.replaceChildren(modulo);
    coordinadores = [];
    nominaActual = null;
    coordinadorActual = null;
    enlazarEventos();
    cargarCoordinadores();
    cargarPlantillaNomina(null);
  };
})(window);
