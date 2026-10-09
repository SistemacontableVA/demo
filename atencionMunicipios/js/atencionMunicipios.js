function renderAtencionMunicipios() {
  var root = document.getElementById('admin-content');
  if (!root) return;

  _atencionMunicipiosRole = typeof getPerfilAdmin === 'function' ? getPerfilAdmin() : 'Coordinador';
  _atencionMunicipiosRows = [];
  _atencionMunicipiosLoading = false;
  _atencionMunicipiosRenderShell();
  _atencionMunicipiosLoad();
}

var _atencionMunicipiosRows = [];
var _atencionMunicipiosRole = 'Coordinador';
var _atencionMunicipiosLoading = false;
var _atencionMunicipiosOpenTabs = window.__ksAtencionMunicipiosOpenTabs || [];
var _atencionMunicipiosActiveTabId = window.__ksAtencionMunicipiosActiveTabId || null;
var _atencionMunicipiosViewer = window.__ksAtencionMunicipiosViewer || null;
var _atencionMunicipiosMaxTabs = 5;
var _atencionMunicipiosZoomLevels = [0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4];
window.__ksAtencionMunicipiosOpenTabs = _atencionMunicipiosOpenTabs;
window.__ksAtencionMunicipiosActiveTabId = _atencionMunicipiosActiveTabId;
window.__ksAtencionMunicipiosViewer = _atencionMunicipiosViewer;

function _atencionMunicipiosRenderShell() {
  var isAdmin = _atencionMunicipiosRole === 'Administrador';
  var root = document.getElementById('admin-content');
  if (!root) return;

  root.innerHTML =
    '<style>' +
      '.atm-head{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:20px}' +
      '.atm-title{margin:0;color:#123c37;font-size:22px;font-weight:750}' +
      '.atm-subtitle{margin:4px 0 0;color:#7a8784;font-size:12px}' +
      '.atm-tools{display:flex;align-items:center;gap:10px;flex-wrap:wrap}' +
      '.atm-search{position:relative;min-width:230px;max-width:340px;flex:1}' +
      '.atm-search input{width:100%;height:38px;padding:0 12px 0 36px;border:1px solid #e0e5e3;border-radius:20px;background:#f6f8f7;font-size:12px;outline:none}' +
      '.atm-search input:focus{border-color:#7aa69a;background:#fff}' +
      '.atm-search svg{position:absolute;left:12px;top:11px;width:16px;height:16px;color:#98a29f}' +
      '.atm-filter select{height:38px;min-width:128px;padding:0 28px 0 11px;border:1px solid #e0e5e3;border-radius:20px;background:#fff;color:#40514c;font-size:11px;outline:none}' +
      '.atm-route-accordion{margin-bottom:9px;border:1px solid #e3e9e6;border-radius:10px;background:#fff;box-shadow:0 2px 5px #142d2808;overflow:hidden}' +
      '.atm-route-accordion summary{display:flex;align-items:center;gap:10px;min-height:46px;padding:7px 13px;cursor:pointer;list-style:none}' +
      '.atm-route-accordion summary::-webkit-details-marker{display:none}' +
      '.atm-route-accordion summary:after{content:"⌄";margin-left:auto;color:#7a8784;font-size:17px;transition:transform .15s}' +
      '.atm-route-accordion[open] summary:after{transform:rotate(180deg)}' +
      '.atm-route-accordion[open] summary{border-bottom:1px solid #e8edeb}' +
      '.atm-route-label{color:#263a35;font-size:12px;font-weight:750}' +
      '.atm-route-count{color:#82908b;font-size:10px}' +
      '.atm-route-content{padding:0 9px 4px}' +
      '.atm-mobile-list{display:none}' +
      '.atm-mobile-card{margin:9px 0;border:1px solid #dce8e3;border-left:3px solid #5b9b83;border-radius:9px;background:#fff;box-shadow:0 2px 5px #142d2808;overflow:hidden}' +
      '.atm-mobile-card summary{display:flex;align-items:center;gap:9px;min-height:48px;padding:8px 11px;cursor:pointer;list-style:none}' +
      '.atm-mobile-card summary::-webkit-details-marker{display:none}' +
      '.atm-mobile-card summary:after{content:"⌄";margin-left:auto;color:#7a8784;font-size:18px;transition:transform .15s}' +
      '.atm-mobile-card[open] summary:after{transform:rotate(180deg)}' +
      '.atm-mobile-place-icon{width:19px;height:19px;flex:none;color:#bd4d45}' +
      '.atm-mobile-card .atm-place-name{flex:1;color:#263a35;font-size:13px}' +
      '.atm-mobile-card-content{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:11px;border-top:1px solid #e8edeb;color:#354541;font-size:11px}' +
      '.atm-mobile-field{display:grid;gap:4px;min-width:0}' +
      '.atm-mobile-field-label{color:#84908c;font-size:9px;font-weight:700;text-transform:uppercase}' +
      '.atm-mobile-state,.atm-mobile-actions{grid-column:1/-1}' +
      '.atm-mobile-actions{display:flex;align-items:center;justify-content:space-between;gap:8px;padding-top:3px}' +
      '.atm-add{height:38px;padding:0 15px;border:0;border-radius:20px;background:linear-gradient(110deg,#082c4a,#008a69);color:#fff;font-size:12px;font-weight:700;cursor:pointer;box-shadow:0 3px 9px #082c4a25}' +
      '.atm-add:hover{background:linear-gradient(110deg,#0c5360,#008a69)}' +
      '.atm-table-wrap{overflow-x:auto;border-radius:10px}' +
      '.atm-table{width:100%;min-width:900px;border-collapse:separate;border-spacing:0 7px;font-size:12px}' +
      '.atm-table thead th{padding:0 10px 5px;text-align:left;color:#53615e;font-size:11px;font-weight:700;white-space:nowrap}' +
      '.atm-row td{height:45px;padding:7px 10px;background:#fff;border-top:1px solid #e7ece9;border-bottom:1px solid #e7ece9;white-space:nowrap}' +
      '.atm-row td:first-child{border-left:1px solid #e7ece9;border-radius:9px 0 0 9px}' +
      '.atm-row td:last-child{border-right:1px solid #e7ece9;border-radius:0 9px 9px 0}' +
      '.atm-row{filter:drop-shadow(0 2px 3px #142d2810)}' +
      '.atm-group-start td{border-top:2px solid #dce4e1}' +
      '.atm-route{display:grid;width:32px;height:32px;place-items:center;border-radius:50%;background:#082c4a;color:#fff;font-size:10px;font-weight:800}' +
      '.atm-place{display:flex;align-items:center;gap:9px;min-width:175px;white-space:normal}' +
      '.atm-place-icon{width:22px;height:22px;flex:none;color:#bd4d45}' +
      '.atm-place-name{font-size:12px;font-weight:750;color:#293936}' +
      '.atm-date{display:flex;align-items:center;gap:6px;color:#354541}' +
      '.atm-date svg{width:15px;height:15px;color:#53615e}' +
      '.atm-state{display:inline-flex;align-items:center;gap:5px;padding:5px 9px;border-radius:14px;font-size:10px;font-weight:700}' +
      '.atm-state[data-state="Digitalizado"]{background:#c9efd8;color:#146534}' +
      '.atm-state[data-state="Por Atender"]{background:#fff0b8;color:#765710}' +
      '.atm-state[data-state="Sin Digitalizar"]{background:#f6d4d3;color:#923632}' +
      '.atm-state-select{max-width:138px;border:0;border-radius:14px;padding:5px 8px;font-size:10px;font-weight:700;outline:none;cursor:pointer}' +
      '.atm-state-select[data-state="Digitalizado"]{background:#c9efd8;color:#146534}' +
      '.atm-state-select[data-state="Por Atender"]{background:#fff0b8;color:#765710}' +
      '.atm-state-select[data-state="Sin Digitalizar"]{background:#f6d4d3;color:#923632}' +
      '.atm-actions{display:flex;align-items:center;justify-content:flex-end;gap:6px}' +
      '.atm-icon-btn{display:grid;width:29px;height:29px;place-items:center;border:1px solid #dce4e1;border-radius:6px;background:#fff;color:#52615d;cursor:pointer}' +
      '.atm-icon-btn:hover{background:#f1f6f3;color:#008a69}' +
      '.atm-icon-btn svg{width:15px;height:15px}' +
      '.atm-icon-btn.danger{color:#a44640}' +
      '.atm-icon-btn.danger:hover{background:#fff1f0}' +
      '.atm-access{min-width:76px;height:30px;padding:0 12px;border:0;border-radius:17px;background:#008a69;color:#fff;font-size:10px;font-weight:800;cursor:pointer}' +
      '.atm-access:hover{background:#0c5360}' +
      '.atm-loading,.atm-empty,.atm-error{padding:32px 15px;text-align:center;color:#77837f;font-size:13px}' +
      '.atm-error{color:#9a3530}' +
      '.atm-modal-backdrop{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:16px;background:#10232180}' +
      '.atm-modal{width:min(100%,620px);max-height:90vh;overflow:auto;border-radius:12px;background:#fff;box-shadow:0 18px 55px #0003}' +
      '.atm-modal-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #e6ece9}' +
      '.atm-modal-head h3{margin:0;color:#123c37;font-size:16px}' +
      '.atm-modal-body{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px;padding:20px}' +
      '.atm-modal-body label{display:grid;gap:5px;color:#53615e;font-size:11px;font-weight:700}' +
      '.atm-modal-body label.wide{grid-column:1/-1}' +
      '.atm-modal-body input,.atm-modal-body select{width:100%;min-height:38px;padding:8px 9px;border:1px solid #d4dfda;border-radius:5px;background:#fff;color:#293936;font:12px inherit}' +
      '.atm-modal-footer{display:flex;justify-content:flex-end;gap:9px;padding:14px 20px;border-top:1px solid #e6ece9}' +
      '.atm-btn{min-height:36px;padding:0 14px;border:1px solid #d4dfda;border-radius:6px;background:#fff;color:#465550;font-size:12px;font-weight:700;cursor:pointer}' +
      '.atm-btn.primary{border-color:#008a69;background:#008a69;color:#fff}' +
      '.atm-sheet-viewer{position:fixed;inset:0;z-index:1100;display:flex;flex-direction:column;min-width:0;background:#f5f7f6}' +
      '.atm-sheet-head{display:flex;flex-direction:column;gap:7px;padding:8px 12px;background:#fff;border-bottom:1px solid #dce4e1}' +
      '.atm-sheet-toolbar{display:flex;align-items:center;gap:10px;min-height:36px}' +
      '.atm-back{min-height:32px;padding:0 10px;border:1px solid #e0e6e3;border-radius:7px;background:#f5f7f6;color:#344641;font-size:11px;font-weight:700;white-space:nowrap;cursor:pointer}' +
      '.atm-active-info{display:flex;align-items:center;gap:8px;flex:1;min-width:0}' +
      '.atm-active-title{overflow:hidden;color:#203b36;font-size:13px;font-weight:750;text-overflow:ellipsis;white-space:nowrap}' +
      '.atm-active-date{color:#84908c;font-size:10px;white-space:nowrap}' +
      '.atm-view-controls{display:flex;align-items:center;gap:4px;flex:none}' +
      '.atm-zoom{display:flex;align-items:center;gap:3px;padding:2px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc}' +
      '.atm-zoom button{width:30px;height:29px;border:0;border-radius:6px;background:#082c4a;color:#fff;font-size:18px;line-height:1;cursor:pointer}' +
      '.atm-zoom button:hover{background:#0c5360}' +
      '.atm-zoom-value{min-width:40px;text-align:center;color:#334155;font-size:10px;font-weight:750}' +
      '.atm-fullscreen{min-height:33px;padding:0 10px;border:0;border-radius:7px;background:#008a69;color:#fff;font-size:10px;font-weight:700;white-space:nowrap;cursor:pointer}' +
      '.atm-fullscreen:hover{background:#0c5360}' +
      '.atm-sheet-content{position:relative;flex:1;min-height:0;overflow:auto}' +
      '.atm-sheet-frame{--atm-sheet-zoom:1;position:absolute;inset:0;width:calc(100% / var(--atm-sheet-zoom));height:calc(100% / var(--atm-sheet-zoom));border:0;background:#fff;transform:scale(var(--atm-sheet-zoom));transform-origin:top left}' +
      '@media(max-width:760px){.atm-sheet-toolbar{flex-wrap:wrap}.atm-active-info{order:2;flex-basis:100%}.atm-view-controls{margin-left:auto}.atm-fullscreen{font-size:0;padding:0 9px}.atm-fullscreen:after{content:"⛶";font-size:17px}}' +
      '@media(max-width:640px){.atm-desktop-table-wrapper{display:none}.atm-mobile-list{display:block}.atm-route-content{padding:0 7px 7px}.atm-mobile-field .atm-date{font-size:10px}.atm-mobile-actions .atm-access{min-width:100px;height:36px}}' +
      '@media(max-width:640px){.atm-head{align-items:stretch}.atm-tools{width:100%}.atm-search{max-width:none}.atm-add{flex:none}.atm-modal-body{grid-template-columns:1fr}.atm-modal-body label.wide{grid-column:auto}}' +
    '</style>' +
    '<div class="atm-head">' +
      '<div><h1 class="atm-title">Atención Municipios</h1><p class="atm-subtitle">Gestión de jornadas por ruta y municipio.</p></div>' +
      '<div class="atm-tools">' +
        '<label class="atm-search" aria-label="Buscar municipios">' +
          '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path stroke-linecap="round" d="m20 20-4-4"/></svg>' +
          '<input id="atm-search" type="search" placeholder="Buscar" autocomplete="off">' +
        '</label>' +
        '<label class="atm-filter"><select id="atm-route-filter" aria-label="Filtrar por ruta"><option value="">Todas las rutas</option></select></label>' +
        '<label class="atm-filter"><select id="atm-state-filter" aria-label="Filtrar por estado"><option value="">Todos los estados</option>' +
          AtencionMunicipiosService.ESTADOS.map(function (state) { return '<option value="' + _atencionMunicipiosEsc(state) + '">' + _atencionMunicipiosEsc(state) + '</option>'; }).join('') +
        '</select></label>' +
        (isAdmin ? '<button class="atm-add" type="button" data-atm-action="add">＋ Agregar Municipio</button>' : '') +
      '</div>' +
    '</div>' +
    '<div id="atm-list-state" class="atm-loading">Cargando municipios…</div>' +
    '<div id="atm-table-host" class="atm-table-wrap" hidden></div>' +
    '<div id="atm-overlay-host"></div>';

  root.querySelector('#atm-search').addEventListener('input', function () {
    _atencionMunicipiosRenderTable();
  });
  root.querySelector('#atm-route-filter').addEventListener('change', _atencionMunicipiosRenderTable);
  root.querySelector('#atm-state-filter').addEventListener('change', _atencionMunicipiosRenderTable);
  var addButton = root.querySelector('[data-atm-action="add"]');
  if (addButton) addButton.addEventListener('click', function () { _atencionMunicipiosOpenForm(null); });
}

function _atencionMunicipiosLoad() {
  if (_atencionMunicipiosLoading) return;
  _atencionMunicipiosLoading = true;
  _atencionMunicipiosSetListState('Cargando municipios…', 'loading');

  AtencionMunicipiosService.listarMunicipios()
    .then(function (rows) {
      _atencionMunicipiosRows = Array.isArray(rows) ? rows : [];
      _atencionMunicipiosLoading = false;
      _atencionMunicipiosRenderTable();
    })
    .catch(function (error) {
      _atencionMunicipiosLoading = false;
      _atencionMunicipiosSetListState(error.message || 'No se pudo cargar el catálogo.', 'error');
    });
}

function _atencionMunicipiosSetListState(message, kind) {
  var state = document.getElementById('atm-list-state');
  var table = document.getElementById('atm-table-host');
  if (state) {
    state.textContent = message;
    state.className = 'atm-' + kind;
    state.hidden = false;
  }
  if (table) table.hidden = true;
}

function _atencionMunicipiosRenderTable() {
  var host = document.getElementById('atm-table-host');
  var state = document.getElementById('atm-list-state');
  if (!host) return;

  var searchInput = document.getElementById('atm-search');
  var routeInput = document.getElementById('atm-route-filter');
  var stateInput = document.getElementById('atm-state-filter');
  var selectedRoute = routeInput ? routeInput.value : '';
  var term = String(searchInput ? searchInput.value : '').trim().toLocaleLowerCase();
  _atencionMunicipiosUpdateRouteFilter(selectedRoute);

  var rows = _atencionMunicipiosRows.filter(function (row) {
    var matchesSearch = !term || [row.ruta, row.municipio, row.estado]
      .some(function (value) { return String(value || '').toLocaleLowerCase().includes(term); });
    var matchesRoute = !selectedRoute || String(row.ruta || 'Sin Ruta') === selectedRoute;
    var matchesState = !stateInput || !stateInput.value || row.estado === stateInput.value;
    return matchesSearch && matchesRoute && matchesState;
  }).slice().sort(function (a, b) {
    var routeSort = String(a.ruta || '').localeCompare(String(b.ruta || ''), 'es', { numeric: true });
    return routeSort || String(a.municipio || '').localeCompare(String(b.municipio || ''), 'es');
  });

  if (state) state.hidden = true;
  if (!rows.length) {
    host.innerHTML = '<div class="atm-empty">' +
      (_atencionMunicipiosRows.length ? 'No hay resultados para la búsqueda.' : 'No hay municipios registrados.') +
      '</div>';
    host.hidden = false;
    return;
  }

  var groups = {};
  rows.forEach(function (row) {
    var route = String(row.ruta || 'Sin Ruta');
    if (!groups[route]) groups[route] = [];
    groups[route].push(row);
  });

  var routes = Object.keys(groups);
  host.innerHTML = routes.map(function (route, index) {
    var members = groups[route];
    return '<details class="atm-route-accordion"' + (index === 0 ? ' open' : '') + '>' +
      '<summary><span class="atm-route">R-' + _atencionMunicipiosEsc(route) + '</span>' +
      '<span class="atm-route-label">' + _atencionMunicipiosEsc(/^\d+$/.test(route) ? 'Ruta ' + route : route) + '</span>' +
      '<span class="atm-route-count">' + members.length + ' municipio' + (members.length === 1 ? '' : 's') + '</span></summary>' +
      '<div class="atm-route-content"><div class="atm-table-wrap atm-desktop-table-wrapper"><table class="atm-table">' +
        '<thead><tr><th>Ruta</th><th>Municipio</th><th>Fecha de Atención</th><th>Fecha de entrega</th><th>Estado</th><th>Acciones</th><th></th></tr></thead>' +
        '<tbody>' + members.map(function (row) { return _atencionMunicipiosRow(row, false); }).join('') + '</tbody>' +
      '</table></div><div class="atm-mobile-list">' +
        members.map(_atencionMunicipiosMobileCard).join('') +
      '</div></div></details>';
  }).join('');

  host.hidden = false;
  host.querySelectorAll('[data-atm-action]').forEach(function (button) {
    button.addEventListener('click', function () {
      _atencionMunicipiosHandleAction(button.dataset.atmAction, button.dataset.id);
    });
  });
  host.querySelectorAll('[data-atm-state]').forEach(function (select) {
    select.addEventListener('change', function () {
      _atencionMunicipiosChangeState(select.dataset.id, select.value);
    });
  });
}

function _atencionMunicipiosUpdateRouteFilter(selected) {
  var select = document.getElementById('atm-route-filter');
  if (!select) return;

  var routes = Array.from(new Set(_atencionMunicipiosRows.map(function (row) {
    return String(row.ruta || 'Sin Ruta');
  }))).sort(function (a, b) {
    return a.localeCompare(b, 'es', { numeric: true });
  });

  select.innerHTML = '<option value="">Todas las rutas</option>' + routes.map(function (route) {
    var label = /^\d+$/.test(route) ? 'Ruta ' + route : route;
    return '<option value="' + _atencionMunicipiosEsc(route) + '">' + _atencionMunicipiosEsc(label) + '</option>';
  }).join('');
  select.value = routes.indexOf(selected) !== -1 ? selected : '';
}

function _atencionMunicipiosRow(row, groupStart) {
  var isAdmin = _atencionMunicipiosRole === 'Administrador';
  var canChangeState = ['Administrador', 'Secretaria', 'Ejecutivo'].indexOf(_atencionMunicipiosRole) !== -1;
  var id = _atencionMunicipiosEsc(row.id);
  var state = row.estado || 'Sin Digitalizar';
  var stateControl = canChangeState
    ? '<select class="atm-state-select" data-state="' + _atencionMunicipiosEsc(state) + '" data-atm-state data-id="' + id + '" aria-label="Cambiar estado">' +
        AtencionMunicipiosService.ESTADOS.map(function (value) {
          return '<option value="' + _atencionMunicipiosEsc(value) + '"' + (value === state ? ' selected' : '') + '>' + _atencionMunicipiosEsc(value) + '</option>';
        }).join('') + '</select>'
    : '<span class="atm-state" data-state="' + _atencionMunicipiosEsc(state) + '">' + _atencionMunicipiosEsc(state) + '</span>';

  return '<tr class="atm-row' + (groupStart ? ' atm-group-start' : '') + '">' +
    '<td><span class="atm-route">R-' + _atencionMunicipiosEsc(row.ruta || '—') + '</span></td>' +
    '<td><div class="atm-place"><svg class="atm-place-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>' +
      '<div><div class="atm-place-name">' + _atencionMunicipiosEsc(row.municipio) + '</div></div></div></td>' +
    '<td>' + _atencionMunicipiosDateCell(row.fechaAtencion, 'calendar') + '</td>' +
    '<td>' + _atencionMunicipiosDateCell(row.fechaEntrega, 'delivery') + '</td>' +
    '<td>' + stateControl + '</td>' +
    '<td><div class="atm-actions">' +
      (isAdmin ? '<button type="button" class="atm-icon-btn" data-atm-action="edit" data-id="' + id + '" title="Editar" aria-label="Editar municipio"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="m14 5 5 5M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z"/></svg></button>' : '') +
      '<button type="button" class="atm-icon-btn" data-atm-action="view" data-id="' + id + '" title="Vista previa" aria-label="Vista previa del municipio"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg></button>' +
      (isAdmin ? '<button type="button" class="atm-icon-btn danger" data-atm-action="delete" data-id="' + id + '" title="Eliminar" aria-label="Eliminar municipio"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3"/></svg></button>' : '') +
    '</div></td><td><button type="button" class="atm-access" data-atm-action="access" data-id="' + id + '">ACCEDER</button></td></tr>';
}

function _atencionMunicipiosMobileCard(row) {
  var isAdmin = _atencionMunicipiosRole === 'Administrador';
  var canChangeState = ['Administrador', 'Secretaria', 'Ejecutivo'].indexOf(_atencionMunicipiosRole) !== -1;
  var id = _atencionMunicipiosEsc(row.id);
  var state = row.estado || 'Sin Digitalizar';
  var stateControl = canChangeState
    ? '<select class="atm-state-select" data-state="' + _atencionMunicipiosEsc(state) + '" data-atm-state data-id="' + id + '" aria-label="Cambiar estado">' +
        AtencionMunicipiosService.ESTADOS.map(function (value) {
          return '<option value="' + _atencionMunicipiosEsc(value) + '"' + (value === state ? ' selected' : '') + '>' + _atencionMunicipiosEsc(value) + '</option>';
        }).join('') + '</select>'
    : '<span class="atm-state" data-state="' + _atencionMunicipiosEsc(state) + '">' + _atencionMunicipiosEsc(state) + '</span>';

  return '<details class="atm-mobile-card">' +
    '<summary><svg class="atm-mobile-place-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>' +
      '<span class="atm-place-name">' + _atencionMunicipiosEsc(row.municipio) + '</span></summary>' +
    '<div class="atm-mobile-card-content">' +
      '<div class="atm-mobile-field"><span class="atm-mobile-field-label">Fecha de atención</span>' + _atencionMunicipiosDateCell(row.fechaAtencion, 'calendar') + '</div>' +
      '<div class="atm-mobile-field"><span class="atm-mobile-field-label">Fecha de entrega</span>' + _atencionMunicipiosDateCell(row.fechaEntrega, 'delivery') + '</div>' +
      '<div class="atm-mobile-field atm-mobile-state"><span class="atm-mobile-field-label">Estado</span>' + stateControl + '</div>' +
      '<div class="atm-mobile-actions">' +
        '<div class="atm-actions">' +
          (isAdmin ? '<button type="button" class="atm-icon-btn" data-atm-action="edit" data-id="' + id + '" title="Editar" aria-label="Editar municipio"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="m14 5 5 5M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z"/></svg></button>' : '') +
          '<button type="button" class="atm-icon-btn" data-atm-action="view" data-id="' + id + '" title="Vista previa" aria-label="Vista previa del municipio"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg></button>' +
          (isAdmin ? '<button type="button" class="atm-icon-btn danger" data-atm-action="delete" data-id="' + id + '" title="Eliminar" aria-label="Eliminar municipio"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3"/></svg></button>' : '') +
        '</div>' +
        '<button type="button" class="atm-access" data-atm-action="access" data-id="' + id + '">ACCEDER</button>' +
      '</div>' +
    '</div></details>';
}

function _atencionMunicipiosDateCell(value, type) {
  var icon = type === 'calendar'
    ? '<rect x="3" y="5" width="18" height="16" rx="2"/><path stroke-linecap="round" d="M16 3v4M8 3v4M3 10h18"/>'
    : '<path stroke-linecap="round" stroke-linejoin="round" d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 7.8 7.5 4.4 7.5-4.4M12 12.2V21"/>';
  return '<span class="atm-date"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">' + icon + '</svg>' + _atencionMunicipiosFormatDate(value) + '</span>';
}

function _atencionMunicipiosFormatDate(value) {
  if (!value) return '—';
  var parts = String(value).slice(0, 10).split('-');
  if (parts.length !== 3) return _atencionMunicipiosEsc(value);
  var month = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][Number(parts[1]) - 1];
  return Number(parts[2]) + ' ' + month + ' ' + parts[0];
}

function _atencionMunicipiosEsc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
  });
}

async function _atencionMunicipiosHandleAction(action, id) {
  if (action === 'add') return _atencionMunicipiosOpenForm(null);
  var row = _atencionMunicipiosRows.find(function (item) { return String(item.id) === String(id); });
  if (!row) return;
  if (action === 'edit') return _atencionMunicipiosOpenForm(row);
  if (action === 'view') return _atencionMunicipiosShowDetails(row);
  if (action === 'access') return _atencionMunicipiosOpenSheet(row);
  if (action === 'delete' && _atencionMunicipiosRole === 'Administrador') {
    if (!confirm('¿Eliminar el municipio "' + row.municipio + '"? Esta acción no se puede deshacer.')) return;
    try {
      await AtencionMunicipiosService.eliminarMunicipio(row.id);
      await _atencionMunicipiosLoad();
    } catch (error) {
      alert(error.message || 'No se pudo eliminar el municipio.');
    }
  }
}

async function _atencionMunicipiosChangeState(id, state) {
  var row = _atencionMunicipiosRows.find(function (item) { return String(item.id) === String(id); });
  if (!row) return;
  var previous = row.estado;
  row.estado = state;
  _atencionMunicipiosRenderTable();
  try {
    await AtencionMunicipiosService.cambiarEstado(row.id, state);
  } catch (error) {
    row.estado = previous;
    _atencionMunicipiosRenderTable();
    alert(error.message || 'No se pudo cambiar el estado.');
  }
}

function _atencionMunicipiosOpenForm(row) {
  if (_atencionMunicipiosRole !== 'Administrador') return;
  var editing = !!row;
  var overlay = document.createElement('div');
  overlay.className = 'atm-modal-backdrop';
  overlay.innerHTML =
    '<form class="atm-modal" id="atm-form">' +
      '<div class="atm-modal-head"><h3>' + (editing ? 'Editar municipio' : 'Agregar municipio') + '</h3><button class="atm-btn" type="button" data-close>Cerrar</button></div>' +
      '<div class="atm-modal-body">' +
        '<label>Ruta<input name="ruta" type="number" min="1" required value="' + _atencionMunicipiosEsc(row && row.ruta || '') + '"></label>' +
        '<label>Municipio<input name="municipio" type="text" required value="' + _atencionMunicipiosEsc(row && row.municipio || '') + '"></label>' +
        '<label>Fecha de Atención<input name="fechaAtencion" type="date" required value="' + _atencionMunicipiosEsc(String(row && row.fechaAtencion || '').slice(0, 10)) + '"></label>' +
        '<label>Fecha de entrega<input name="fechaEntrega" type="date" value="' + _atencionMunicipiosEsc(String(row && row.fechaEntrega || '').slice(0, 10)) + '"></label>' +
        '<label class="wide">Link de la hoja<input name="linkHoja" type="url" required value="' + _atencionMunicipiosEsc(row && row.linkHoja || '') + '"></label>' +
        '<label>Estado<select name="estado">' + AtencionMunicipiosService.ESTADOS.map(function (state) {
          return '<option value="' + _atencionMunicipiosEsc(state) + '"' + (row && row.estado === state ? ' selected' : '') + '>' + _atencionMunicipiosEsc(state) + '</option>';
        }).join('') + '</select></label>' +
        '<div class="wide" id="atm-form-error" style="color:#a44640;font-size:12px"></div>' +
      '</div>' +
      '<div class="atm-modal-footer"><button class="atm-btn" type="button" data-close>Cancelar</button><button class="atm-btn primary" type="submit">' + (editing ? 'Guardar cambios' : 'Crear municipio') + '</button></div>' +
    '</form>';

  document.getElementById('atm-overlay-host').replaceChildren(overlay);
  overlay.querySelectorAll('[data-close]').forEach(function (button) {
    button.addEventListener('click', function () { overlay.remove(); });
  });
  overlay.addEventListener('click', function (event) {
    if (event.target === overlay) overlay.remove();
  });
  overlay.querySelector('#atm-form').addEventListener('submit', async function (event) {
    event.preventDefault();
    var form = event.currentTarget;
    if (!form.reportValidity()) return;
    var values = Object.fromEntries(new FormData(form).entries());
    var payload = {
      id: row && row.id,
      ruta: values.ruta,
      municipio: values.municipio,
      fechaAtencion: values.fechaAtencion,
      fechaEntrega: values.fechaEntrega,
      linkHoja: values.linkHoja,
      estado: values.estado
    };
    var submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = 'Guardando…';
    try {
      if (editing) await AtencionMunicipiosService.actualizarMunicipio(payload);
      else await AtencionMunicipiosService.guardarMunicipio(payload);
      overlay.remove();
      await _atencionMunicipiosLoad();
    } catch (error) {
      form.querySelector('#atm-form-error').textContent = error.message || 'No se pudo guardar el municipio.';
      submit.disabled = false;
      submit.textContent = editing ? 'Guardar cambios' : 'Crear municipio';
    }
  });
}

function _atencionMunicipiosShowDetails(row) {
  var overlay = document.createElement('div');
  overlay.className = 'atm-modal-backdrop';
  overlay.innerHTML =
    '<section class="atm-modal">' +
      '<div class="atm-modal-head"><h3>Detalle del municipio</h3><button class="atm-btn" type="button" data-close>Cerrar</button></div>' +
      '<div class="atm-modal-body">' +
        '<label>Ruta<input readonly value="' + _atencionMunicipiosEsc(row.ruta) + '"></label>' +
        '<label>Municipio<input readonly value="' + _atencionMunicipiosEsc(row.municipio) + '"></label>' +
        '<label>Fecha de Atención<input readonly value="' + _atencionMunicipiosEsc(_atencionMunicipiosFormatDate(row.fechaAtencion)) + '"></label>' +
        '<label>Fecha de entrega<input readonly value="' + _atencionMunicipiosEsc(_atencionMunicipiosFormatDate(row.fechaEntrega)) + '"></label>' +
        '<label>Estado<input readonly value="' + _atencionMunicipiosEsc(row.estado) + '"></label>' +
      '</div>' +
    '</section>';
  document.getElementById('atm-overlay-host').replaceChildren(overlay);
  overlay.querySelector('[data-close]').addEventListener('click', function () { overlay.remove(); });
  overlay.addEventListener('click', function (event) {
    if (event.target === overlay) overlay.remove();
  });
}

function _atencionMunicipiosOpenSheet(row) {
  var sheetUrl;
  try {
    sheetUrl = new URL(row.linkHoja);
  } catch (error) {
    alert('El link de la hoja no tiene un formato válido.');
    return;
  }
  if (sheetUrl.protocol !== 'https:') {
    alert('El link de la hoja debe usar HTTPS.');
    return;
  }

  var existing = _atencionMunicipiosOpenTabs.find(function (tab) {
    return String(tab.id) === String(row.id);
  });
  if (existing) {
    _atencionMunicipiosSelectSheetTab(existing.id);
    adminMostrarHojaAbierta('atencionMunicipios', existing.id);
    return;
  }
  if (_atencionMunicipiosOpenTabs.length >= _atencionMunicipiosMaxTabs) {
    alert('Hay ' + _atencionMunicipiosMaxTabs + ' hojas abiertas. Cierra una pestaña antes de abrir otra.');
    return;
  }

  _atencionMunicipiosEnsureSheetViewer();
  var tab = {
    id: String(row.id),
    label: String(row.municipio || 'Municipio') + ' · R-' + String(row.ruta || '—'),
    municipio: String(row.municipio || 'Municipio'),
    fechaAtencion: row.fechaAtencion || '',
    url: sheetUrl.href
  };
  _atencionMunicipiosOpenTabs.push(tab);
  _atencionMunicipiosAddSheetTab(tab);
  _atencionMunicipiosSelectSheetTab(tab.id);
  if (typeof adminRegistrarHojaAbierta === 'function') {
    adminRegistrarHojaAbierta('atencionMunicipios', tab.id, tab.label);
  }
  adminMostrarHojaAbierta('atencionMunicipios', tab.id);
}

function _atencionMunicipiosEnsureSheetViewer() {
  if (_atencionMunicipiosViewer && _atencionMunicipiosViewer.isConnected) return;

  var root = document.getElementById('admin-viewer-host') || document.getElementById('admin-content') || document.body;
  var viewer = document.createElement('section');
  viewer.className = 'atm-sheet-viewer';
  viewer.dataset.adminViewer = 'atencionMunicipios';
  viewer.setAttribute('aria-label', 'Hojas abiertas de Atención Municipios');
  viewer.innerHTML =
    '<div class="atm-sheet-head">' +
      '<div class="atm-sheet-toolbar">' +
        '<button class="atm-back" type="button" data-atm-return>← Volver</button>' +
        '<div class="atm-active-info"><span id="atm-active-title" class="atm-active-title"></span><span id="atm-active-date" class="atm-active-date"></span></div>' +
        '<div class="atm-view-controls">' +
          '<div class="atm-zoom" aria-label="Zoom de la hoja"><button type="button" data-atm-zoom="-1" title="Reducir zoom">−</button><span id="atm-zoom-value" class="atm-zoom-value">100%</span><button type="button" data-atm-zoom="1" title="Aumentar zoom">+</button></div>' +
          '<button class="atm-fullscreen" type="button" data-atm-fullscreen>Pantalla completa</button>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div id="atm-sheet-content" class="atm-sheet-content"></div>';

  viewer.querySelector('[data-atm-return]').addEventListener('click', function () {
    if (document.fullscreenElement === viewer && document.exitFullscreen) {
      document.exitFullscreen().catch(function () {
        window.alert('No se pudo salir de pantalla completa.');
      });
    }
    viewer.style.display = 'none';
  });
  viewer.querySelectorAll('[data-atm-zoom]').forEach(function (button) {
    button.addEventListener('click', function () {
      _atencionMunicipiosChangeSheetZoom(Number(button.dataset.atmZoom));
    });
  });
  viewer.querySelector('[data-atm-fullscreen]').addEventListener('click', _atencionMunicipiosToggleFullscreen);
  viewer.addEventListener('fullscreenchange', _atencionMunicipiosUpdateFullscreenButton);
  root.appendChild(viewer);
  _atencionMunicipiosViewer = viewer;
  window.__ksAtencionMunicipiosViewer = viewer;
}

function _atencionMunicipiosAddSheetTab(tab) {
  var content = _atencionMunicipiosViewer.querySelector('#atm-sheet-content');
  var frame = document.createElement('iframe');
  frame.className = 'atm-sheet-frame';
  frame.title = 'Hoja de ' + tab.label;
  frame.allowFullscreen = true;
  frame.hidden = true;
  frame.style.setProperty('--atm-sheet-zoom', '1');
  frame.src = tab.url;
  frame.dataset.tabId = tab.id;
  content.appendChild(frame);
}

function _atencionMunicipiosSelectSheetTab(id) {
  if (!_atencionMunicipiosViewer) return;
  _atencionMunicipiosActiveTabId = String(id);

  _atencionMunicipiosViewer.querySelectorAll('.atm-sheet-frame').forEach(function (frame) {
    frame.hidden = frame.dataset.tabId !== _atencionMunicipiosActiveTabId;
  });

  var activeTab = _atencionMunicipiosOpenTabs.find(function (tab) {
    return tab.id === _atencionMunicipiosActiveTabId;
  });
  var activeFrame = _atencionMunicipiosViewer.querySelector('.atm-sheet-frame[data-tab-id="' + _atencionMunicipiosActiveTabId + '"]');
  var zoom = activeFrame ? Number(activeFrame.style.getPropertyValue('--atm-sheet-zoom') || 1) : 1;
  var title = _atencionMunicipiosViewer.querySelector('#atm-active-title');
  var date = _atencionMunicipiosViewer.querySelector('#atm-active-date');
  var zoomValue = _atencionMunicipiosViewer.querySelector('#atm-zoom-value');
  if (title && activeTab) title.textContent = activeTab.municipio;
  if (date && activeTab) date.textContent = activeTab.fechaAtencion ? '📅 ' + _atencionMunicipiosFormatDate(activeTab.fechaAtencion) : '';
  if (zoomValue) zoomValue.textContent = Math.round(zoom * 100) + '%';
  window.__ksAtencionMunicipiosActiveTabId = _atencionMunicipiosActiveTabId;
}

function _atencionMunicipiosChangeSheetZoom(direction) {
  if (!_atencionMunicipiosViewer || !_atencionMunicipiosActiveTabId) return;
  var frame = _atencionMunicipiosViewer.querySelector('.atm-sheet-frame[data-tab-id="' + _atencionMunicipiosActiveTabId + '"]');
  if (!frame) return;

  var current = Number(frame.style.getPropertyValue('--atm-sheet-zoom') || 1);
  var currentIndex = _atencionMunicipiosZoomLevels.indexOf(current);
  if (currentIndex < 0) currentIndex = 2;
  var nextIndex = Math.max(0, Math.min(_atencionMunicipiosZoomLevels.length - 1, currentIndex + direction));
  var next = _atencionMunicipiosZoomLevels[nextIndex];
  frame.style.setProperty('--atm-sheet-zoom', String(next));
  var label = _atencionMunicipiosViewer.querySelector('#atm-zoom-value');
  if (label) label.textContent = Math.round(next * 100) + '%';
}

function _atencionMunicipiosToggleFullscreen() {
  if (!_atencionMunicipiosViewer) return;
  if (document.fullscreenElement === _atencionMunicipiosViewer) {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(function () {
        window.alert('No se pudo salir de pantalla completa.');
      });
    }
    return;
  }
  if (_atencionMunicipiosViewer.requestFullscreen) {
    _atencionMunicipiosViewer.requestFullscreen().catch(function () {
      window.alert('No se pudo activar pantalla completa.');
    });
  }
}

function _atencionMunicipiosUpdateFullscreenButton() {
  if (!_atencionMunicipiosViewer) return;
  var button = _atencionMunicipiosViewer.querySelector('[data-atm-fullscreen]');
  if (button) {
    button.textContent = document.fullscreenElement === _atencionMunicipiosViewer
      ? 'Salir de pantalla completa'
      : 'Pantalla completa';
  }
}

function _atencionMunicipiosCloseSheetTab(id) {
  var tabId = String(id);
  var index = _atencionMunicipiosOpenTabs.findIndex(function (tab) { return tab.id === tabId; });
  if (index < 0 || !_atencionMunicipiosViewer) return;

  var frame = _atencionMunicipiosViewer.querySelector('.atm-sheet-frame[data-tab-id="' + tabId + '"]');
  if (frame) frame.remove();
  _atencionMunicipiosOpenTabs.splice(index, 1);
  adminCerrarHojaAbierta('atencionMunicipios', tabId);

  if (!_atencionMunicipiosOpenTabs.length) {
    _atencionMunicipiosViewer.remove();
    _atencionMunicipiosViewer = null;
    _atencionMunicipiosActiveTabId = null;
    window.__ksAtencionMunicipiosViewer = null;
    window.__ksAtencionMunicipiosActiveTabId = null;
    return;
  }

  if (_atencionMunicipiosActiveTabId === tabId) {
    var next = _atencionMunicipiosOpenTabs[Math.max(0, index - 1)];
    _atencionMunicipiosSelectSheetTab(next.id);
  }
}
