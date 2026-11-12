function renderPoliticasContabilidad() {
  var contenedor = document.getElementById('admin-content');
  if (!contenedor) return;

  contenedor.innerHTML =
    '<div class="fade-in max-w-5xl mx-auto px-4 py-6">' +
      '<div class="mb-6">' +
        '<span class="text-xs font-bold uppercase tracking-wide text-emerald-700">Contabilidad de campo</span>' +
        '<h2 class="mt-1 text-xl font-bold text-verde-oscuro">Políticas de contabilidad diaria</h2>' +
        '<p class="mt-2 text-sm text-slate-500">Define los valores aplicados a cada coordinador. Las reglas de elegibilidad se mantienen: almuerzo desde 1 afiliación y cena desde 10, únicamente para promotores.</p>' +
      '</div>' +
      '<div id="politicas-contabilidad-status" class="mb-4 text-sm" role="status" aria-live="polite"></div>' +
      '<div id="politicas-contabilidad-lista" class="grid gap-4">' +
        '<div class="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">Cargando coordinadores…</div>' +
      '</div>' +
    '</div>';

  PoliticasContabilidadService.listar().then(function (politicas) {
    _renderListaPoliticasContabilidad(politicas);
  }).catch(function (error) {
    console.error('[PoliticasContabilidad] No se pudieron cargar las políticas:', error);
    _mostrarEstadoPoliticasContabilidad(error.message || 'No se pudieron cargar las políticas.', true);
    var lista = document.getElementById('politicas-contabilidad-lista');
    if (lista) lista.innerHTML = '';
  });
}

function _renderListaPoliticasContabilidad(politicas) {
  var lista = document.getElementById('politicas-contabilidad-lista');
  if (!lista) return;
  if (!politicas.length) {
    lista.innerHTML = '<div class="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">No hay coordinadores registrados en esta empresa.</div>';
    return;
  }

  lista.innerHTML = politicas.map(function (politica) {
    var userId = _escaparPoliticaHTML(politica.userId);
    var nombre = _escaparPoliticaHTML(politica.nombre || politica.usuario || 'Coordinador');
    var usuario = _escaparPoliticaHTML(politica.usuario || '');
    var activo = politica.activo === true;
    return '<form class="politica-contabilidad-card rounded-lg border border-slate-200 bg-white p-5 shadow-sm" data-user-id="' + userId + '">' +
      '<div class="mb-4 flex flex-wrap items-start justify-between gap-2">' +
        '<div><h3 class="font-bold text-verde-oscuro">' + nombre + '</h3><p class="mt-1 text-xs text-slate-500">' + usuario + '</p></div>' +
        '<span class="rounded-full px-2.5 py-1 text-xs font-semibold ' + (activo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500') + '">' +
          (activo ? 'Activo' : 'Inactivo') +
        '</span>' +
      '</div>' +
      '<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">' +
        _campoPolitica('Valor por afiliación', 'valorAfiliacion', politica.valorAfiliacion, 'Multiplicador del total de afiliaciones.') +
        _campoPolitica('Almuerzo por promotor', 'valorAlmuerzo', politica.valorAlmuerzo, 'Se asigna desde 1 afiliación.') +
        _campoPolitica('Cena ganada por promotor', 'valorCena', politica.valorCena, 'Se asigna desde 10 afiliaciones.') +
      '</div>' +
      '<div class="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">' +
        '<h4 class="mb-3 text-sm font-semibold text-slate-700">Penalización P. Hotel</h4>' +
        '<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">' +
          _campoPolitica('Monto', 'valorPenalizacionHotel', politica.valorPenalizacionHotel, 'Valor descontado cuando aplica.') +
          _campoPolitica('Afiliaciones mínimas', 'afiliacionesHotelMinimas', politica.afiliacionesHotelMinimas, 'Desde este número de afiliaciones.', '1', '1') +
          _campoPolitica('Afiliaciones máximas', 'afiliacionesHotelMaximas', politica.afiliacionesHotelMaximas, 'Hasta este número de afiliaciones.', '1', '1') +
        '</div>' +
      '</div>' +
      '<div class="mt-4 flex flex-wrap items-center justify-between gap-3">' +
        '<p class="text-xs text-slate-500">Los valores contables aplican a jornadas nuevas o borradores que se vuelvan a guardar. P. Hotel usa estas reglas al cargar o editar nómina.</p>' +
        '<button type="submit" class="rounded-md bg-verde-oscuro px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"' + (activo ? '' : ' disabled') + '>Guardar valores</button>' +
      '</div>' +
    '</form>';
  }).join('');

  lista.addEventListener('submit', _guardarPoliticaDesdeFormulario);
}

function _campoPolitica(etiqueta, campo, valor, ayuda, paso, minimo) {
  var valorSeguro = Number(valor);
  if (!Number.isFinite(valorSeguro)) valorSeguro = 0;
  paso = paso || '0.01';
  minimo = minimo || '0';
  return '<label class="block text-sm font-medium text-slate-700">' + etiqueta +
    '<input name="' + campo + '" type="number" min="' + minimo + '" max="1000000" step="' + paso + '" required value="' + valorSeguro + '"' +
      ' class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-base text-slate-900 focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700">' +
    '<span class="mt-1 block text-xs font-normal text-slate-500">' + ayuda + '</span>' +
  '</label>';
}

async function _guardarPoliticaDesdeFormulario(event) {
  if (!event.target.matches('.politica-contabilidad-card')) return;
  event.preventDefault();
  var formulario = event.target;
  var userId = formulario.getAttribute('data-user-id');
  var boton = formulario.querySelector('button[type="submit"]');
  if (boton) {
    boton.disabled = true;
    boton.textContent = 'Guardando…';
  }
  try {
    var valores = {};
    ['valorAfiliacion', 'valorAlmuerzo', 'valorCena', 'valorPenalizacionHotel'].forEach(function (nombre) {
      var input = formulario.elements.namedItem(nombre);
      var numero = input ? Number(input.value) : NaN;
      if (!Number.isFinite(numero) || numero < 0 || numero > 1000000) {
        throw new Error('Ingresa valores entre 0 y 1.000.000.');
      }
      valores[nombre] = numero;
    });
    ['afiliacionesHotelMinimas', 'afiliacionesHotelMaximas'].forEach(function (nombre) {
      var input = formulario.elements.namedItem(nombre);
      var numero = input ? Number(input.value) : NaN;
      if (!Number.isInteger(numero) || numero < 1 || numero > 1000000) {
        throw new Error('Las afiliaciones mínimas y máximas deben ser números enteros positivos.');
      }
      valores[nombre] = numero;
    });
    if (valores.afiliacionesHotelMinimas > valores.afiliacionesHotelMaximas) {
      throw new Error('Las afiliaciones mínimas no pueden ser mayores que las máximas.');
    }
    await PoliticasContabilidadService.guardar(userId, valores);
    _mostrarEstadoPoliticasContabilidad('Los valores se guardaron correctamente.', false);
  } catch (error) {
    console.error('[PoliticasContabilidad] No se pudo guardar la política:', error);
    _mostrarEstadoPoliticasContabilidad(error.message || 'No se pudieron guardar los valores.', true);
  } finally {
    if (boton) {
      boton.disabled = false;
      boton.textContent = 'Guardar valores';
    }
  }
}

function _mostrarEstadoPoliticasContabilidad(mensaje, esError) {
  var estado = document.getElementById('politicas-contabilidad-status');
  if (!estado) return;
  estado.textContent = mensaje;
  estado.className = 'mb-4 rounded-md border px-3 py-2 text-sm ' +
    (esError ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800');
}

function _escaparPoliticaHTML(valor) {
  return String(valor == null ? '' : valor).replace(/[&<>"']/g, function (caracter) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[caracter];
  });
}
