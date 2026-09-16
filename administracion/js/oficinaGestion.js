var OficinaGestionUI = (function () {
  var data;
  var state = { tab: 'relaciones', inicio: '01/08/2026', fin: '15/08/2026' };
  var employeeFields = ['id_empleado', 'fecha_ingreso', 'personal', 'cedula', 'cargo', 'sueldo_mensual', 'banco', 'n_cuenta', 'telefono', 'documento_url'];

  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function input(id, label, value, type) { return '<label class="text-xs font-semibold text-slate-500">' + label + '<input id="' + id + '" class="admin-input w-full mt-1" type="' + (type || 'text') + '" value="' + esc(value || '') + '"></label>'; }
  function value(id) { return document.getElementById(id).value.trim(); }
  function download(name, text) { var link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' })); link.download = name; link.click(); URL.revokeObjectURL(link.href); }
  function parseDate(value) { var parts = String(value || '').split('/'); if (parts.length !== 3) return null; var parsed = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])); return parsed.getFullYear() === Number(parts[2]) && parsed.getMonth() === Number(parts[1]) - 1 && parsed.getDate() === Number(parts[0]) ? parsed : null; }
  function validDate(value) { return !!parseDate(value); }

  function render() {
    var root = document.getElementById('admin-content');
    if (!root) return;
    root.innerHTML = '<div class="fade-in"><div class="flex flex-wrap items-center justify-between gap-3 mb-5"><div><h3 class="text-verde-oscuro font-bold text-lg">Nómina Oficina</h3><p class="text-slate-400 text-sm">Gestión de empleados, novedades y relaciones de pago</p></div><div class="flex gap-2"><button id="oficina-exportar" class="btn-secundario">Exportar datos</button><button id="oficina-restaurar" class="btn-secundario">Restaurar CSV</button></div></div><nav class="flex flex-wrap gap-2 mb-4" aria-label="Secciones de nómina"><button data-tab="relaciones" class="oficina-tab">Relaciones</button><button data-tab="empleados" class="oficina-tab">Empleados</button><button data-tab="novedades" class="oficina-tab">Novedades</button><button data-tab="periodos" class="oficina-tab">Periodos</button></nav><div id="oficina-panel"></div></div>';
    root.querySelectorAll('[data-tab]').forEach(function (button) { button.addEventListener('click', function () { state.tab = button.dataset.tab; renderPanel(); }); });
    document.getElementById('oficina-exportar').addEventListener('click', exportData);
    document.getElementById('oficina-restaurar').addEventListener('click', function () { OficinaNominaService.resetLocalData().then(function (loaded) { data = loaded; renderPanel(); }); });
    OficinaNominaService.load().then(function (loaded) { data = loaded; renderPanel(); }).catch(function (error) { document.getElementById('oficina-panel').innerHTML = '<p class="text-red-600">' + esc(error.message) + '</p>'; });
  }

  function renderPanel() {
    var panel = document.getElementById('oficina-panel');
    if (!panel || !data) return;
    document.querySelectorAll('.oficina-tab').forEach(function (button) { button.classList.toggle('bg-verde-oscuro', button.dataset.tab === state.tab); button.classList.toggle('text-white', button.dataset.tab === state.tab); });
    if (state.tab === 'empleados') renderEmployees(panel); else if (state.tab === 'novedades') renderNovelties(panel); else if (state.tab === 'periodos') renderPeriods(panel); else renderRelations(panel);
  }

  function renderEmployees(panel) {
    panel.innerHTML = '<div class="bg-white rounded-xl shadow-soft p-4 mb-4"><h4 class="font-bold text-verde-oscuro mb-3">Registrar empleado</h4><form id="empleado-form" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">' + input('e-id_empleado', 'ID empleado') + input('e-fecha_ingreso', 'Fecha de ingreso', '', 'text') + input('e-personal', 'Nombre completo') + input('e-cedula', 'Cédula') + input('e-cargo', 'Cargo') + input('e-sueldo_mensual', 'Sueldo mensual USD', '', 'number') + input('e-banco', 'Banco / medio de pago') + input('e-n_cuenta', 'Número de cuenta') + input('e-telefono', 'Teléfono') + input('e-documento_url', 'URL documento') + '<div class="sm:col-span-2 lg:col-span-3 flex justify-end"><button class="btn-primario" type="submit">Guardar empleado</button></div></form></div><div class="bg-white rounded-xl shadow-soft p-4 overflow-auto"><h4 class="font-bold text-verde-oscuro mb-3">Empleados registrados</h4><table class="w-full text-xs"><thead><tr class="text-left border-b"><th class="p-2">ID</th><th class="p-2">Personal</th><th class="p-2">Cargo</th><th class="p-2">Sueldo USD</th><th class="p-2">Acciones</th></tr></thead><tbody>' + data.empleados.map(function (item) { return '<tr class="border-b border-slate-100"><td class="p-2">' + esc(item.id_empleado) + '</td><td class="p-2">' + esc(item.personal) + '</td><td class="p-2">' + esc(item.cargo) + '</td><td class="p-2">' + esc(item.sueldo_mensual) + '</td><td class="p-2"><button class="text-red-600" data-delete-employee="' + esc(item.id_empleado) + '">Eliminar</button></td></tr>'; }).join('') + '</tbody></table></div>';
    document.getElementById('empleado-form').addEventListener('submit', saveEmployee);
    panel.querySelectorAll('[data-delete-employee]').forEach(function (button) { button.addEventListener('click', function () { if (confirm('¿Eliminar empleado y sus novedades?')) { OficinaNominaService.removeEmployee(button.dataset.deleteEmployee); renderPanel(); } }); });
  }

  function saveEmployee(event) {
    event.preventDefault();
    var employee = {}; employeeFields.forEach(function (field) { employee[field] = value('e-' + field); });
    if (!employee.id_empleado || !employee.personal || !employee.cedula || !employee.sueldo_mensual) return alert('Completa ID, nombre, cédula y sueldo mensual.');
    try { OficinaNominaService.createEmployee(employee); renderPanel(); } catch (error) { alert(error.message); }
  }

  function renderNovelties(panel) {
    var options = data.empleados.map(function (item) { return '<option value="' + esc(item.id_empleado) + '">' + esc(item.personal) + '</option>'; }).join('');
    panel.innerHTML = '<div class="bg-white rounded-xl shadow-soft p-4 mb-4"><h4 class="font-bold text-verde-oscuro mb-3">Registrar novedad</h4><form id="novedad-form" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">' + input('n-id_novedad', 'ID novedad') + '<label class="text-xs font-semibold text-slate-500">Empleado<select id="n-id_empleado" class="admin-input w-full mt-1">' + options + '</select></label>' + input('n-fecha', 'Fecha', '', 'text') + '<label class="text-xs font-semibold text-slate-500">Tipo<select id="n-tipo" class="admin-input w-full mt-1"><option>Adicional</option><option>Festivo</option><option>Prestamo</option><option>Penalizacion</option></select></label>' + input('n-monto', 'Monto USD', '', 'number') + input('n-observacion', 'Observación') + '<div class="flex items-end"><button class="btn-primario w-full" type="submit">Guardar novedad</button></div></form></div><div class="bg-white rounded-xl shadow-soft p-4 overflow-auto"><h4 class="font-bold text-verde-oscuro mb-3">Novedades registradas</h4><table class="w-full text-xs"><thead><tr class="text-left border-b"><th class="p-2">Fecha</th><th class="p-2">Empleado</th><th class="p-2">Tipo</th><th class="p-2">Monto</th><th class="p-2">Detalle</th><th class="p-2"></th></tr></thead><tbody>' + data.novedades.map(function (item) { return '<tr class="border-b border-slate-100"><td class="p-2">' + esc(item.fecha) + '</td><td class="p-2">' + esc(item.id_empleado) + '</td><td class="p-2">' + esc(item.tipo) + '</td><td class="p-2">$ ' + esc(item.monto) + '</td><td class="p-2">' + esc(item.observacion) + '</td><td class="p-2"><button class="text-red-600" data-delete-novelty="' + esc(item.id_novedad) + '">Eliminar</button></td></tr>'; }).join('') + '</tbody></table></div>';
    document.getElementById('novedad-form').addEventListener('submit', saveNovelty);
    panel.querySelectorAll('[data-delete-novelty]').forEach(function (button) { button.addEventListener('click', function () { OficinaNominaService.removeNovelty(button.dataset.deleteNovelty); renderPanel(); }); });
  }

  function saveNovelty(event) {
    event.preventDefault();
    var novelty = { id_novedad: value('n-id_novedad'), id_empleado: value('n-id_empleado'), fecha: value('n-fecha'), tipo: value('n-tipo'), monto: value('n-monto'), observacion: value('n-observacion') };
    if (!novelty.id_novedad || !novelty.fecha || !novelty.monto) return alert('Completa ID, fecha y monto.');
    try { OficinaNominaService.createNovelty(novelty); renderPanel(); } catch (error) { alert(error.message); }
  }

  function renderPeriods(panel) {
    var periods = JSON.parse(localStorage.getItem('oficina.nomina.periodos.v1') || '[]');
    panel.innerHTML = '<div class="bg-white rounded-xl shadow-soft p-4"><h4 class="font-bold text-verde-oscuro mb-3">Definir periodo de nómina</h4><form id="periodo-form" class="grid grid-cols-1 sm:grid-cols-3 gap-3">' + input('p-nombre', 'Nombre del periodo') + input('p-inicio', 'Inicio', state.inicio) + input('p-fin', 'Fin', state.fin) + '<div class="flex items-end"><button class="btn-primario w-full" type="submit">Guardar periodo</button></div></form><div class="mt-5 overflow-auto"><table class="w-full text-xs"><thead><tr class="text-left border-b"><th class="p-2">Nombre</th><th class="p-2">Inicio</th><th class="p-2">Fin</th><th class="p-2"></th></tr></thead><tbody>' + periods.map(function (item, index) { return '<tr class="border-b border-slate-100"><td class="p-2">' + esc(item.nombre) + '</td><td class="p-2">' + esc(item.inicio) + '</td><td class="p-2">' + esc(item.fin) + '</td><td class="p-2"><button class="text-red-600" data-delete-period="' + index + '">Eliminar</button></td></tr>'; }).join('') + '</tbody></table></div></div>';
    document.getElementById('periodo-form').addEventListener('submit', function (event) { event.preventDefault(); var period = { nombre: value('p-nombre'), inicio: value('p-inicio'), fin: value('p-fin') }; if (!period.nombre || !validDate(period.inicio) || !validDate(period.fin) || parseDate(period.inicio) > parseDate(period.fin)) return alert('Completa un nombre y un rango válido en formato dd/mm/yyyy.'); periods.push(period); localStorage.setItem('oficina.nomina.periodos.v1', JSON.stringify(periods)); renderPanel(); });
    panel.querySelectorAll('[data-delete-period]').forEach(function (button) { button.addEventListener('click', function () { periods.splice(Number(button.dataset.deletePeriod), 1); localStorage.setItem('oficina.nomina.periodos.v1', JSON.stringify(periods)); renderPanel(); }); });
  }

  function renderRelations(panel) {
    var options = data.empleados.map(function (item) { return '<option value="' + esc(item.id_empleado) + '">' + esc(item.personal) + '</option>'; }).join('');
    panel.innerHTML = '<div class="bg-white rounded-xl shadow-soft p-4 mb-4"><h4 class="font-bold text-verde-oscuro mb-3">Generar relaciones de pago</h4><div class="grid grid-cols-1 sm:grid-cols-3 gap-3">' + input('r-inicio', 'Inicio', state.inicio) + input('r-fin', 'Fin', state.fin) + '<label class="text-xs font-semibold text-slate-500">Empleado<select id="r-empleado" class="admin-input w-full mt-1"><option value="">Todos</option>' + options + '</select></label></div><button id="r-generar" class="btn-primario mt-4">Calcular periodo</button></div><div id="r-resultados"></div>';
    document.getElementById('r-generar').addEventListener('click', renderRelationResults);
  }

  function renderRelationResults() {
    state.inicio = value('r-inicio'); state.fin = value('r-fin');
    var selected = value('r-empleado');
    var results = data.empleados.filter(function (item) { return !selected || item.id_empleado === selected; }).map(function (employee) { return OficinaNominaService.calcular(employee, state.inicio, state.fin, data); });
    document.getElementById('r-resultados').innerHTML = results.map(function (item) { return '<div class="bg-white rounded-xl shadow-soft p-4 mb-3 flex flex-wrap items-center justify-between gap-3"><div><b class="text-verde-oscuro">' + esc(item.empleado.personal) + '</b><div class="text-xs text-slate-400">' + item.diasLaborados + ' días · Ingresos ' + item.usd.format(item.totalIngresos) + ' · Neto ' + item.usd.format(item.netoAPagar) + '</div></div><button class="btn-secundario" data-print="' + esc(item.empleado.id_empleado) + '">Usar plantilla e imprimir</button></div>'; }).join('');
    document.querySelectorAll('[data-print]').forEach(function (button) { button.addEventListener('click', function () { printRelation(button.dataset.print); }); });
  }

  function printRelation(id) {
    var employee = data.empleados.find(function (item) { return item.id_empleado === id; });
    var item = OficinaNominaService.calcular(employee, state.inicio, state.fin, data);
    var rendered = OficinaNominaService.renderTemplate(data.plantilla, { nombreEmpleado: employee.personal, bancoPago: employee.banco, identificacionEmpleado: employee.cedula, cargoEmpleado: employee.cargo, telefonoEmpleado: employee.telefono, diasLaborados: item.diasLaborados, valorDiasLaborados: item.usd.format(item.valorDiasLaborados), adicionalFestivos: item.usd.format(item.adicionalFestivos), totalIngresos: item.usd.format(item.totalIngresos), prestamosAdelanto: item.usd.format(item.prestamosAdelanto), penalizacionDeduccion: item.usd.format(item.penalizacionDeduccion), totalDeducciones: item.usd.format(item.totalDeducciones), netoAPagar: item.usd.format(item.netoAPagar), detalleDiario: item.dias });
    var popup = window.open('', '_blank');
    if (!popup) return alert('Permite ventanas emergentes para imprimir.');
    popup.document.open(); popup.document.write(rendered); popup.document.close(); popup.onload = function () { popup.print(); };
  }

  function exportData() {
    download('empleados.csv', OficinaNominaService.toCsv(data.empleados, employeeFields));
    download('novedades_diarias.csv', OficinaNominaService.toCsv(data.novedades, ['id_novedad', 'id_empleado', 'fecha', 'tipo', 'monto', 'observacion']));
    download('pagos_historicos.csv', OficinaNominaService.toCsv(data.pagos, ['id_pago', 'id_empleado', 'fecha_pago', 'fecha_inicio', 'fecha_fin', 'dias_trabajados', 'sueldo_devengado', 'prestamos', 'adicionales', 'neto_pagar']));
    download('periodos.json', localStorage.getItem('oficina.nomina.periodos.v1') || '[]');
  }

  return { render: render };
})();

function renderOficina() { OficinaGestionUI.render(); }
