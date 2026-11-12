(function (root) {
  function validarPromotor(datos, tiposDocumento, promotoresExistentes, modo) {
    datos = datos || {};
    var promotor = {
      nombre: String(datos.nombre || '').trim().toUpperCase(),
      tipoDocumento: String(datos.tipoDocumento || '').trim(),
      documento: String(datos.documento || '').trim(),
      telefono: String(datos.telefono || '').trim(),
      fotoDocumento: String(datos.fotoDocumento || '').trim(),
      carnet: String(datos.carnet || '').trim()
    };
    var errores = [];

    if (modo === 'editar') {
      if (!Object.keys(datos).some(function (campo) {
        return ['nombre', 'tipoDocumento', 'documento', 'telefono', 'fotoDocumento', 'carnet'].indexOf(campo) !== -1;
      })) {
        errores.push('Modifica al menos un campo antes de guardar.');
      }
      if (Object.prototype.hasOwnProperty.call(datos, 'nombre') && !promotor.nombre) {
        errores.push('El nombre del promotor no se puede dejar vacío.');
      }
      if (Object.prototype.hasOwnProperty.call(datos, 'documento') && !promotor.documento) {
        errores.push('El documento no se puede dejar vacío.');
      }
    } else if (!promotor.nombre || !promotor.documento) {
      errores.push('Nombre Promotor y Documento son los datos mínimos para registrar al promotor.');
    }
    if (promotor.nombre && (promotor.nombre.length > 100 || /[:\\\/?*\[\]]/.test(promotor.nombre))) {
      errores.push('El nombre debe tener máximo 100 caracteres y no incluir : \\ / ? * [ ].');
    }
    if (promotor.documento.length > 40 || promotor.carnet.length > 100) {
      errores.push('El documento admite máximo 40 caracteres y el carnet 100.');
    }
    var digitosTelefono = promotor.telefono.replace(/\D/g, '');
    if (promotor.telefono && (digitosTelefono.length < 7 || digitosTelefono.length > 15 || !/^\+?[\d\s().-]+$/.test(promotor.telefono))) {
      errores.push('Ingresa un teléfono válido de 7 a 15 dígitos.');
    }
    if (promotor.fotoDocumento &&
        (!/^https:\/\/[A-Za-z0-9.-]+(?::\d{1,5})?(?:[/?#][^\s]*)?$/i.test(promotor.fotoDocumento) ||
         promotor.fotoDocumento.length > 2048)) {
      errores.push('Foto Documento debe ser un enlace HTTPS válido de máximo 2048 caracteres.');
    }
    if (promotor.tipoDocumento && !(tiposDocumento || []).some(function (tipo) {
      return String(tipo).trim().toLowerCase() === promotor.tipoDocumento.toLowerCase();
    })) {
      errores.push('Selecciona un tipo de documento registrado en Datos.');
    }

    var duplicado = (promotoresExistentes || []).some(function (existente) {
      return (promotor.nombre && String(existente.nombre || '').trim().toLowerCase() === promotor.nombre.toLowerCase()) ||
        (promotor.documento && String(existente.cedula || '').trim().toLowerCase() === promotor.documento.toLowerCase());
    });
    if (duplicado) errores.push('Ya existe un promotor con ese nombre o documento.');

    return { ok: errores.length === 0, errores: errores, promotor: promotor };
  }

  function escaparHtml(valor) {
    return String(valor).replace(/[&<>"']/g, function (caracter) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[caracter];
    });
  }

  function normalizarUrlAcceso(valor) {
    var texto = String(valor || '').trim();
    if (!texto) return '';
    try {
      var url = new URL(texto);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
      return url.href;
    } catch (errorUrl) {
      return '';
    }
  }

  function renderPromotores() {
    var contenedor = document.getElementById('admin-content');
    if (!contenedor) return;

    contenedor.innerHTML = [
      '<section class="fade-in w-full">',
      '  <header class="mb-4 flex flex-wrap items-end justify-between gap-2">',
      '    <div><h3 class="text-lg font-bold tracking-tight text-slate-800">Registro de personal de campo</h3>',
      '    <p class="mt-0.5 text-xs text-slate-500">Administra los datos de promotores y sus nóminas de coordinador.</p></div>',
      '  </header>',
      '  <div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(290px,0.85fr)_minmax(0,1.55fr)]">',
      '    <form id="promotores-form" class="overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 shadow-[0_8px_24px_rgba(15,23,42,0.07)]" novalidate>',
      '      <div class="border-b-2 border-[#0f4b7d] bg-gradient-to-r from-blue-50 to-slate-50 px-4 py-3">',
      '        <div class="flex items-center gap-2"><span class="flex h-6 w-6 items-center justify-center rounded-full bg-[#0f4b7d] text-xs font-extrabold text-white">+</span>',
      '          <div><h4 class="text-sm font-bold text-slate-800">Nuevo promotor</h4><p class="text-[11px] text-slate-500">Nombre y documento son obligatorios.</p></div></div>',
      '      </div>',
      '      <div class="grid grid-cols-1 gap-x-3 gap-y-2.5 p-4 sm:grid-cols-2">',
      '        <label class="block text-xs font-semibold text-slate-600 sm:col-span-2">Nombre del promotor <span class="text-rose-600">*</span>',
      '          <input name="nombre" type="text" maxlength="100" autocomplete="name" placeholder="Ingresa nombre y apellido" style="text-transform:uppercase" class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none transition focus:border-[#0f4b7d] focus:ring-2 focus:ring-blue-100" />',
      '        </label>',
      '        <label class="block text-xs font-semibold text-slate-600">Tipo documento',
      '          <select name="tipoDocumento" disabled class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700 outline-none focus:border-[#0f4b7d] focus:ring-2 focus:ring-blue-100">',
      '            <option value="">Cargando tipos...</option>',
      '          </select>',
      '        </label>',
      '        <label class="block text-xs font-semibold text-slate-600">Documento <span class="text-rose-600">*</span>',
      '          <input name="documento" type="text" maxlength="40" autocomplete="off" placeholder="Número de documento" class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none transition focus:border-[#0f4b7d] focus:ring-2 focus:ring-blue-100" />',
      '        </label>',
      '        <label class="block text-xs font-semibold text-slate-600">Teléfono',
      '          <input name="telefono" type="tel" maxlength="24" autocomplete="tel" placeholder="Opcional" class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none transition focus:border-[#0f4b7d] focus:ring-2 focus:ring-blue-100" />',
      '        </label>',
      '        <label class="block text-xs font-semibold text-slate-600">Carnet',
      '          <input name="carnet" type="text" maxlength="100" placeholder="Opcional" class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none transition focus:border-[#0f4b7d] focus:ring-2 focus:ring-blue-100" />',
      '        </label>',
      '        <label class="block text-xs font-semibold text-slate-600 sm:col-span-2">Foto Documento <span class="font-normal text-slate-400">(enlace HTTPS, opcional)</span>',
      '          <input name="fotoDocumento" type="url" maxlength="2048" placeholder="https://..." class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none transition focus:border-[#0f4b7d] focus:ring-2 focus:ring-blue-100" />',
      '        </label>',
      '        <input name="fila" type="hidden" />',
      '        <input name="documentoOriginal" type="hidden" />',
      '      </div>',
      '      <div id="promotores-form-mensaje" class="mx-4 hidden rounded-lg px-3 py-2 text-xs" role="status" aria-live="polite"></div>',
      '      <div class="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-4 py-3">',
      '        <button id="promotores-cancelar-edicion" type="button" class="hidden rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">Cancelar</button>',
      '        <button type="reset" class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">Limpiar</button>',
      '        <button id="promotores-submit" type="submit" disabled class="btn-primario rounded-lg px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-verde-oscuro disabled:cursor-not-allowed disabled:opacity-50">Registrar promotor</button>',
      '      </div>',
      '    </form>',
      '    <section class="overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 shadow-[0_8px_24px_rgba(15,23,42,0.07)]">',
      '      <header class="flex items-center justify-between gap-3 border-b-2 border-[#0f4b7d] bg-gradient-to-r from-blue-50 to-slate-50 px-4 py-3">',
      '        <div><h4 class="text-sm font-bold text-slate-800">Promotores registrados</h4><p class="text-[11px] text-slate-500">Edita sus datos o elimina su registro.</p></div>',
      '        <span id="promotores-total" class="shrink-0 rounded-full border border-blue-100 bg-white px-2.5 py-1 text-xs font-bold text-[#0f4b7d]">0</span>',
      '      </header>',
      '      <div id="promotores-lista-movil" class="divide-y divide-slate-100 md:hidden"></div>',
      '      <div class="hidden max-h-[68vh] overflow-auto md:block">',
      '        <table class="w-full min-w-[540px] text-left text-xs">',
      '          <thead class="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500"><tr><th class="px-3 py-2.5">Nombre</th><th class="px-3 py-2.5">Tipo</th><th class="px-3 py-2.5">Documento</th><th class="px-3 py-2.5">Teléfono</th><th class="px-3 py-2.5">Foto documento</th><th class="px-3 py-2.5">Carnet</th><th class="px-3 py-2.5 text-right">Acciones</th></tr></thead>',
      '          <tbody id="promotores-lista"></tbody>',
      '        </table>',
      '      </div>',
      '      <p id="promotores-lista-vacia" class="hidden px-4 py-10 text-center text-xs text-slate-400">Aún no hay promotores registrados.</p>',
      '    </section>',
      '  </div>',
      '  <section id="coordinadores-panel" class="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.07)]">',
      '    <header class="border-b-2 border-[#0f4b7d] bg-gradient-to-r from-blue-50 to-slate-50 px-4 py-3">',
      '      <h4 class="text-sm font-bold text-slate-800">Nóminas de coordinador</h4>',
      '      <p class="mt-0.5 text-[11px] text-slate-500">Asigna una nómina de coordinador. Restaurar borra permanentemente sus jornadas.</p>',
      '    </header>',
      '    <div class="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">',
      '      <label class="block text-xs font-semibold text-slate-600">Promotor o coordinador',
      '        <select id="coordinador-promotor" class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700 outline-none focus:border-[#0f4b7d] focus:ring-2 focus:ring-blue-100"><option value="">Cargando personal...</option></select>',
      '      </label>',
      '      <button id="coordinador-crear" type="button" disabled class="rounded-lg bg-[#0f4b7d] px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50">Crear nómina de coordinador</button>',
      '    </div>',
      '    <p id="coordinador-mensaje" class="mx-4 mb-3 hidden rounded-lg px-3 py-2 text-xs" role="status" aria-live="polite"></p>',
      '    <div class="border-t border-slate-100">',
      '      <div class="flex items-center justify-between px-4 py-3"><h5 class="text-xs font-bold text-slate-700">Nóminas asignadas</h5><span id="coordinador-plantillas-libres" class="text-[11px] text-slate-500"></span></div>',
      '      <div id="coordinador-lista" class="divide-y divide-slate-100"><p class="px-4 pb-4 text-xs text-slate-400">Cargando nóminas...</p></div>',
      '    </div>',
      '  </section>',
      '</section>'
    ].join('');

    var form = document.getElementById('promotores-form');
    var selectTipo = form.elements.tipoDocumento;
    var botonEnviar = document.getElementById('promotores-submit');
    var botonCancelar = document.getElementById('promotores-cancelar-edicion');
    var mensaje = document.getElementById('promotores-form-mensaje');
    var listaElement = document.getElementById('promotores-lista');
    var listaMovilElement = document.getElementById('promotores-lista-movil');
    var listaVacia = document.getElementById('promotores-lista-vacia');
    var totalElement = document.getElementById('promotores-total');
    var tiposDisponibles = [];
    var plantillasDisponibles = [];
    var nominasCoordinador = [];
    var plantillasCoordinadorDisponibles = [];
    var promotoresExistentes = [];
    var filaEnEdicion = 0;
    var valoresInicialesEdicion = null;
    var coordinadorSelect = document.getElementById('coordinador-promotor');
    var coordinadorCrear = document.getElementById('coordinador-crear');
    var coordinadorMensaje = document.getElementById('coordinador-mensaje');
    var coordinadorLista = document.getElementById('coordinador-lista');
    var coordinadorPlantillasLibres = document.getElementById('coordinador-plantillas-libres');

    function actualizarBotonEnviar() {
      botonEnviar.disabled = !filaEnEdicion && !plantillasDisponibles.length;
    }

    function mostrarMensajeCoordinador(texto, error) {
      coordinadorMensaje.textContent = texto;
      coordinadorMensaje.className = 'mx-4 mb-3 rounded-lg px-3 py-2 text-xs ' +
        (error ? 'bg-red-50 text-red-700' : 'bg-verde-suave text-verde-oscuro');
    }

    function actualizarInterfazCoordinadores() {
      coordinadorSelect.innerHTML = '<option value="">Selecciona una persona</option>' +
        promotoresExistentes.map(function (promotor) {
          var asignado = promotor.tieneNominaCoordinador ? ' — ya tiene nómina' : '';
          return '<option value="' + escaparHtml(promotor.cedula || '') + '">' +
            escaparHtml(promotor.nombre || '') + ' (' + escaparHtml(promotor.cedula || '') + ')' +
            escaparHtml(asignado) + '</option>';
        }).join('');
      coordinadorCrear.disabled = !promotoresExistentes.length || !plantillasCoordinadorDisponibles.length;
      coordinadorPlantillasLibres.textContent = plantillasCoordinadorDisponibles.length
        ? ''
        : 'Se ha superado el límite de disponibilidad permitido. Por favor, comuníquese con el administrador del sistema para recibir asistencia.';
      coordinadorLista.innerHTML = nominasCoordinador.length
        ? nominasCoordinador.map(function (nomina) {
          return '<div class="flex flex-wrap items-center justify-between gap-3 px-4 py-3">' +
            '<div><p class="text-xs font-semibold text-slate-800">' + escaparHtml(nomina.nombreCoordinador || '') + '</p>' +
            '<p class="mt-0.5 text-[11px] text-slate-500">Cédula: ' + escaparHtml(nomina.cedula || '') +
            ' · Hoja: ' + escaparHtml(nomina.hoja || '') + '</p></div>' +
            '<button type="button" data-restaurar-coordinador="' + escaparHtml(nomina.cedula || '') +
            '" class="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-50">Restaurar nómina</button>' +
            '</div>';
        }).join('')
        : '<p class="px-4 pb-4 text-xs text-slate-400">Aún no hay nóminas de coordinador asignadas.</p>';
    }

    function renderLista() {
      function renderEnlace(promotor, campo, etiqueta, indice) {
        var valor = String(promotor[campo] || '').trim();
        var urlAcceso = normalizarUrlAcceso(valor);
        if (!urlAcceso) {
          return valor
            ? '<span class="text-slate-500">Enlace no válido</span>'
            : '<span class="text-slate-300">—</span>';
        }
        return '<a href="' + escaparHtml(urlAcceso) + '" target="_blank" rel="noopener noreferrer" ' +
          'class="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-blue-200 bg-blue-50 px-2 py-1.5 text-[10px] font-semibold text-[#0f4b7d] transition hover:bg-blue-100" ' +
          'aria-label="Abrir ' + etiqueta + ' de ' + escaparHtml(promotor.nombre || '') + '">' +
          '<span aria-hidden="true">↗</span> ' + etiqueta + '</a>';
      }

      listaElement.innerHTML = promotoresExistentes.map(function (promotor, indice) {
        return '<tr class="border-b border-slate-100 transition hover:bg-blue-50/60">' +
          '<td class="max-w-[190px] px-3 py-2.5 font-semibold text-slate-800">' + escaparHtml(promotor.nombre || '') + '</td>' +
          '<td class="px-3 py-2.5 text-slate-500">' + escaparHtml(promotor.tipoDocumento || '—') + '</td>' +
          '<td class="px-3 py-2.5 font-medium text-slate-700">' + escaparHtml(promotor.cedula || '') + '</td>' +
          '<td class="px-3 py-2.5 text-slate-500">' + escaparHtml(promotor.telefono || '—') + '</td>' +
          '<td class="px-3 py-2.5">' + renderEnlace(promotor, 'fotoDocumento', 'foto', indice) + '</td>' +
          '<td class="px-3 py-2.5">' + renderEnlace(promotor, 'carnet', 'carnet', indice) + '</td>' +
          '<td class="whitespace-nowrap px-3 py-2 text-right"><button type="button" data-editar-promotor="' + indice +
          '" class="rounded-md border border-blue-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#0f4b7d] transition hover:bg-blue-50">Editar</button> ' +
          '<button type="button" data-eliminar-promotor="' + indice + '"' +
          (promotor.tieneNominaCoordinador ? ' disabled title="Restaura primero la nómina de coordinador."' : '') +
          ' class="rounded-md border border-rose-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40">Eliminar</button></td>' +
          '</tr>';
      }).join('');
      listaMovilElement.innerHTML = promotoresExistentes.map(function (promotor, indice) {
        return '<details class="promotores-accordion group">' +
          '<summary class="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-left hover:bg-blue-50/60 [&::-webkit-details-marker]:hidden">' +
          '<span class="min-w-0 truncate text-xs font-bold text-slate-800">' + escaparHtml(promotor.nombre || '') + '</span>' +
          '<span class="flex shrink-0 items-center gap-2"><span class="max-w-16 truncate rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-[#0f4b7d]">' +
          escaparHtml(promotor.tipoDocumento || 'Promotor') + '</span><span aria-hidden="true" class="text-xs text-slate-400 transition-transform group-open:rotate-180">▼</span></span>' +
          '</summary>' +
          '<div class="grid grid-cols-2 gap-x-3 gap-y-3 border-t border-slate-100 bg-slate-50/70 px-4 py-3 text-xs">' +
          '<div><p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Documento</p><p class="mt-0.5 break-all font-medium text-slate-700">' + escaparHtml(promotor.cedula || '—') + '</p></div>' +
          '<div><p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Teléfono</p><p class="mt-0.5 break-all font-medium text-slate-700">' + escaparHtml(promotor.telefono || '—') + '</p></div>' +
          '<div><p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Foto documento</p><div class="mt-1">' + renderEnlace(promotor, 'fotoDocumento', 'Ver foto', indice) + '</div></div>' +
          '<div><p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Carnet</p><div class="mt-1">' + renderEnlace(promotor, 'carnet', 'Ver carnet', indice) + '</div></div>' +
          '<div class="col-span-2 flex justify-end gap-2 border-t border-slate-200 pt-2">' +
          '<button type="button" data-editar-promotor="' + indice + '" class="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-[#0f4b7d]">Editar</button>' +
          '<button type="button" data-eliminar-promotor="' + indice + '"' +
          (promotor.tieneNominaCoordinador ? ' disabled title="Restaura primero la nómina de coordinador."' : '') +
          ' class="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-40">Eliminar</button>' +
          '</div></div></details>';
      }).join('');
      totalElement.textContent = String(promotoresExistentes.length);
      listaVacia.classList.toggle('hidden', promotoresExistentes.length > 0);
      listaElement.closest('table').classList.toggle('hidden', promotoresExistentes.length === 0);
      listaMovilElement.classList.toggle('hidden', promotoresExistentes.length === 0);
    }

    function limpiarEdicion() {
      form.reset();
      filaEnEdicion = 0;
      valoresInicialesEdicion = null;
      form.elements.fila.value = '';
      form.elements.documentoOriginal.value = '';
      botonEnviar.textContent = 'Registrar promotor';
      botonCancelar.classList.add('hidden');
      actualizarBotonEnviar();
    }

    function iniciarEdicion(promotor) {
      filaEnEdicion = Number(promotor.fila);
      form.elements.nombre.value = String(promotor.nombre || '').toUpperCase();
      form.elements.tipoDocumento.value = promotor.tipoDocumento || '';
      form.elements.documento.value = promotor.cedula || '';
      form.elements.telefono.value = promotor.telefono || '';
      form.elements.fotoDocumento.value = promotor.fotoDocumento || '';
      form.elements.carnet.value = promotor.carnet || '';
      form.elements.fila.value = String(promotor.fila || '');
      form.elements.documentoOriginal.value = promotor.cedula || '';
      valoresInicialesEdicion = {
        nombre: String(promotor.nombre || '').toUpperCase(),
        tipoDocumento: String(promotor.tipoDocumento || ''),
        documento: String(promotor.cedula || ''),
        telefono: String(promotor.telefono || ''),
        fotoDocumento: String(promotor.fotoDocumento || ''),
        carnet: String(promotor.carnet || '')
      };
      botonEnviar.textContent = 'Guardar cambios';
      botonCancelar.classList.remove('hidden');
      actualizarBotonEnviar();
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function mostrarMensaje(texto, error) {
      mensaje.textContent = texto;
      mensaje.className = 'mx-4 mb-3 rounded-lg px-3 py-2 text-xs ' +
        (error ? 'bg-red-50 text-red-700' : 'bg-verde-suave text-verde-oscuro');
    }

    Promise.all([
      PromotoresService.getAll(),
      PromotoresService.getTiposDocumento(),
      PromotoresService.getPlantillasDisponibles(),
      PromotoresService.getNominasCoordinador(),
      PromotoresService.getPlantillasCoordinadorDisponibles()
    ]).then(function (resultados) {
      promotoresExistentes = resultados[0];
      renderLista();
      tiposDisponibles = resultados[1];
      plantillasDisponibles = resultados[2];
      nominasCoordinador = resultados[3];
      plantillasCoordinadorDisponibles = resultados[4];
      actualizarInterfazCoordinadores();
      selectTipo.innerHTML = '<option value="">Selecciona un tipo</option>' +
        tiposDisponibles.map(function (tipo) {
          return '<option value="' + escaparHtml(tipo) + '">' + escaparHtml(tipo) + '</option>';
        }).join('');
      selectTipo.disabled = tiposDisponibles.length === 0;
      actualizarBotonEnviar();
    }).catch(function (error) {
      console.error('[Promotores] No se pudieron cargar los datos iniciales:', error);
      mostrarMensaje(error.message || 'No se pudo consultar Google Sheets.', true);
    });

    var listaPromotoresContenedor = document.getElementById('promotores-lista-movil').parentElement;
    listaPromotoresContenedor.addEventListener('click', function (evento) {
      if (evento.target.closest('a')) return;
      var resumenAcordeon = evento.target.closest('summary');
      if (resumenAcordeon) {
        var acordeonAbierto = resumenAcordeon.parentElement;
        window.setTimeout(function () {
          if (acordeonAbierto.open) {
            listaMovilElement.querySelectorAll('details[open]').forEach(function (detalle) {
              if (detalle !== acordeonAbierto) detalle.open = false;
            });
          }
        }, 0);
        return;
      }
      var botonEditar = evento.target.closest('[data-editar-promotor]');
      if (botonEditar) {
        var promotorEditar = promotoresExistentes[Number(botonEditar.getAttribute('data-editar-promotor'))];
        if (promotorEditar) iniciarEdicion(promotorEditar);
        return;
      }
      var botonEliminar = evento.target.closest('[data-eliminar-promotor]');
      if (!botonEliminar) return;
      var promotorEliminar = promotoresExistentes[Number(botonEliminar.getAttribute('data-eliminar-promotor'))];
      if (!promotorEliminar) return;
      if (promotorEliminar.tieneNominaCoordinador) {
        mostrarMensaje('Restaura primero la nómina de coordinador de "' + promotorEliminar.nombre + '" antes de eliminar su registro.', true);
        return;
      }
      var confirmar = root.confirm(
        '¿Confirmas que deseas eliminar los datos de "' + promotorEliminar.nombre + '"?'
      );
      if (!confirmar) return;
      botonEliminar.disabled = true;
      PromotoresService.eliminar({
        fila: promotorEliminar.fila,
        documentoOriginal: promotorEliminar.cedula
      }).then(function () {
        limpiarEdicion();
        mostrarMensaje('Registro eliminado exitosamente.', false);
        return PromotoresService.getAll({ force: true });
      }).then(function (lista) {
        promotoresExistentes = lista;
        renderLista();
        return Promise.all([
          PromotoresService.getTiposDocumento(),
          PromotoresService.getPlantillasDisponibles(),
          PromotoresService.getNominasCoordinador(),
          PromotoresService.getPlantillasCoordinadorDisponibles()
        ]);
      }).then(function (datosActualizados) {
        tiposDisponibles = datosActualizados[0];
        plantillasDisponibles = datosActualizados[1];
        nominasCoordinador = datosActualizados[2];
        plantillasCoordinadorDisponibles = datosActualizados[3];
        actualizarInterfazCoordinadores();
        selectTipo.innerHTML = '<option value="">Selecciona un tipo</option>' +
          tiposDisponibles.map(function (tipo) {
            return '<option value="' + escaparHtml(tipo) + '">' + escaparHtml(tipo) + '</option>';
          }).join('');
        selectTipo.disabled = tiposDisponibles.length === 0;
        actualizarBotonEnviar();
      }).catch(function (error) {
        console.error('[Promotores] No se pudo eliminar el promotor:', error);
        mostrarMensaje(error.message || 'No se pudo eliminar el promotor.', true);
      }).finally(function () {
        botonEliminar.disabled = false;
      });
    });

    coordinadorCrear.addEventListener('click', function () {
      var cedulaSeleccionada = coordinadorSelect.value;
      var promotorSeleccionado = promotoresExistentes.filter(function (promotor) {
        return String(promotor.cedula || '') === cedulaSeleccionada;
      })[0];
      if (!promotorSeleccionado) {
        mostrarMensajeCoordinador('Selecciona una persona registrada.', true);
        return;
      }
      if (promotorSeleccionado.tieneNominaCoordinador) {
        mostrarMensajeCoordinador('Esta persona ya tiene una nómina de coordinador asignada.', true);
        return;
      }
      if (!plantillasCoordinadorDisponibles.length) {
        mostrarMensajeCoordinador('Se ha superado el límite de disponibilidad permitido. Por favor, comuníquese con el administrador del sistema para recibir asistencia.', true);
        return;
      }
      if (!root.confirm('¿Crear una nómina de coordinador para "' + promotorSeleccionado.nombre +
          '" con cédula ' + promotorSeleccionado.cedula + '?')) return;

      coordinadorCrear.disabled = true;
      coordinadorCrear.textContent = 'Creando...';
      PromotoresService.crearNominaCoordinador({ cedula: promotorSeleccionado.cedula })
        .then(function (resultado) {
          mostrarMensajeCoordinador(resultado.mensaje || 'Nómina creada correctamente.', false);
          return PromotoresService.getAll({ force: true });
        }).then(function (lista) {
          promotoresExistentes = lista;
          renderLista();
          return Promise.all([
            PromotoresService.getNominasCoordinador(),
            PromotoresService.getPlantillasCoordinadorDisponibles()
          ]);
        }).then(function (datosCoordinadores) {
          nominasCoordinador = datosCoordinadores[0];
          plantillasCoordinadorDisponibles = datosCoordinadores[1];
          actualizarInterfazCoordinadores();
        }).catch(function (error) {
          console.error('[Promotores] No se pudo crear la nómina de coordinador:', error);
          mostrarMensajeCoordinador(error.message || 'No se pudo crear la nómina de coordinador.', true);
        }).finally(function () {
          coordinadorCrear.textContent = 'Crear nómina de coordinador';
          coordinadorCrear.disabled = !promotoresExistentes.length || !plantillasCoordinadorDisponibles.length;
        });
    });

    coordinadorLista.addEventListener('click', function (evento) {
      var botonRestaurar = evento.target.closest('[data-restaurar-coordinador]');
      if (!botonRestaurar) return;
      var nominaSeleccionada = nominasCoordinador.filter(function (nomina) {
        return String(nomina.cedula || '') === botonRestaurar.getAttribute('data-restaurar-coordinador');
      })[0];
      if (!nominaSeleccionada) return;
      var confirmarRestauracion = root.confirm(
        'Esta acción borrará permanentemente todas las jornadas de la nómina de "' +
        nominaSeleccionada.nombreCoordinador + '" (cédula ' + nominaSeleccionada.cedula +
        ') y devolverá la hoja a una plantilla disponible. El promotor seguirá registrado. ¿Deseas continuar?'
      );
      if (!confirmarRestauracion) return;

      botonRestaurar.disabled = true;
      PromotoresService.restaurarNominaCoordinador({
        cedula: nominaSeleccionada.cedula,
        nombreCoordinador: nominaSeleccionada.nombreCoordinador
      }).then(function (resultado) {
        mostrarMensajeCoordinador(resultado.mensaje || 'Nómina restaurada correctamente.', false);
        return PromotoresService.getAll({ force: true });
      }).then(function (lista) {
        promotoresExistentes = lista;
        renderLista();
        return Promise.all([
          PromotoresService.getNominasCoordinador(),
          PromotoresService.getPlantillasCoordinadorDisponibles()
        ]);
      }).then(function (datosCoordinadores) {
        nominasCoordinador = datosCoordinadores[0];
        plantillasCoordinadorDisponibles = datosCoordinadores[1];
        actualizarInterfazCoordinadores();
      }).catch(function (error) {
        console.error('[Promotores] No se pudo restaurar la nómina de coordinador:', error);
        mostrarMensajeCoordinador(error.message || 'No se pudo restaurar la nómina de coordinador.', true);
      }).finally(function () {
        botonRestaurar.disabled = false;
      });
    });

    botonCancelar.addEventListener('click', limpiarEdicion);
    form.addEventListener('reset', function () {
      if (!filaEnEdicion) return;
      filaEnEdicion = 0;
      valoresInicialesEdicion = null;
      form.elements.fila.value = '';
      form.elements.documentoOriginal.value = '';
      botonEnviar.textContent = 'Registrar promotor';
      botonCancelar.classList.add('hidden');
      actualizarBotonEnviar();
    });

    form.addEventListener('submit', function (evento) {
      evento.preventDefault();
      var valoresFormulario = {
        nombre: form.elements.nombre.value.toUpperCase(),
        tipoDocumento: form.elements.tipoDocumento.value,
        documento: form.elements.documento.value,
        telefono: form.elements.telefono.value,
        fotoDocumento: form.elements.fotoDocumento.value,
        carnet: form.elements.carnet.value
      };
      var cambios = {};
      if (filaEnEdicion) {
        Object.keys(valoresFormulario).forEach(function (campo) {
          if (valoresFormulario[campo] !== valoresInicialesEdicion[campo]) {
            cambios[campo] = valoresFormulario[campo];
          }
        });
      } else {
        cambios = valoresFormulario;
      }
      var promotoresParaValidar = promotoresExistentes.filter(function (promotor) {
        return !filaEnEdicion || Number(promotor.fila) !== filaEnEdicion;
      });
      var validacion = validarPromotor(cambios, tiposDisponibles, promotoresParaValidar, filaEnEdicion ? 'editar' : 'crear');
      if (!validacion.ok) {
        mostrarMensaje(validacion.errores.join(' '), true);
        return;
      }
      if (!filaEnEdicion && !plantillasDisponibles.length) {
        mostrarMensaje('No quedan pestañas plantilla disponibles entre 12 y 30.', true);
        return;
      }

      botonEnviar.disabled = true;
      botonEnviar.textContent = filaEnEdicion ? 'Guardando...' : 'Registrando...';
      mensaje.classList.add('hidden');
      var guardar = filaEnEdicion
        ? PromotoresService.actualizar({
          fila: form.elements.fila.value,
          documentoOriginal: form.elements.documentoOriginal.value,
          cambios: cambios
        })
        : PromotoresService.crear(validacion.promotor);
      guardar.then(function (resultado) {
        mostrarMensaje(filaEnEdicion
          ? 'Datos de "' + resultado.nombre + '" actualizados.'
          : 'Registro creado exitosamente.', false);
        limpiarEdicion();
        return PromotoresService.getAll({ force: true });
      }).then(function (lista) {
        promotoresExistentes = lista;
        renderLista();
        return Promise.all([
          PromotoresService.getTiposDocumento(),
          PromotoresService.getPlantillasDisponibles(),
          PromotoresService.getNominasCoordinador(),
          PromotoresService.getPlantillasCoordinadorDisponibles()
        ]);
      }).then(function (datosActualizados) {
        tiposDisponibles = datosActualizados[0];
        plantillasDisponibles = datosActualizados[1];
        nominasCoordinador = datosActualizados[2];
        plantillasCoordinadorDisponibles = datosActualizados[3];
        actualizarInterfazCoordinadores();
      }).catch(function (error) {
        console.error('[Promotores] No se pudo guardar el promotor:', error);
        mostrarMensaje(error.message || 'No se pudo guardar el promotor.', true);
      }).finally(function () {
        botonEnviar.textContent = filaEnEdicion ? 'Guardar cambios' : 'Registrar promotor';
        actualizarBotonEnviar();
      });
    });
  }

  var api = {
    validarPromotor: validarPromotor,
    normalizarUrlAcceso: normalizarUrlAcceso,
    renderPromotores: renderPromotores
  };
  root.PromotoresRegistro = api;
  root.renderPromotores = renderPromotores;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
