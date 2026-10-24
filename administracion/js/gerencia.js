var _gerenciaHerramientas = [];
var _gerenciaTabs = window.__ksGerenciaTabs || [];
var _gerenciaActiveTabId = window.__ksGerenciaActiveTabId || null;
var _gerenciaViewer = window.__ksGerenciaViewer || null;
var _gerenciaLoadGeneration = 0;
var _gerenciaMaxTabs = 5;
var _gerenciaZoomLevels = [0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4];
window.__ksGerenciaTabs = _gerenciaTabs;
window.__ksGerenciaActiveTabId = _gerenciaActiveTabId;
window.__ksGerenciaViewer = _gerenciaViewer;

function renderGerencia() {
  var root = document.getElementById('admin-content');
  if (!root) return;

  _gerenciaHerramientas = [];
  _gerenciaLoadGeneration++;

  if (typeof getPerfilAdmin !== 'function' || getPerfilAdmin() !== 'Administrador') {
    root.innerHTML = '<div class="gm-state gm-error">No tienes permiso para acceder a Gerencia.</div>';
    return;
  }

  _gerenciaRenderShell(root);
  _gerenciaLoad();
}

function _gerenciaRenderShell(root) {
  root.innerHTML =
    '<style>' +
      '.gm-head{position:relative;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;overflow:hidden;margin-bottom:18px;padding:19px 21px;border:1px solid #176a68;border-radius:16px;background:linear-gradient(112deg,#123d5a 0%,#126b69 58%,#07865d 100%);box-shadow:0 12px 24px -18px #0c3c4ca6}' +
      '.gm-head:after{position:absolute;top:-66px;right:32%;width:170px;height:170px;border:1px solid #ffffff20;border-radius:50%;content:"";pointer-events:none}' +
      '.gm-title{margin:0;color:#fff;font-size:21px;font-weight:800}' +
      '.gm-subtitle{margin:4px 0 0;color:#e1f1ec;font-size:12px}' +
      '.gm-toolbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap}' +
      '.gm-search{height:40px;min-width:220px;padding:0 14px;border:1px solid #ffffff55;border-radius:11px;background:#ffffffed;color:#263a35;font-size:12px;outline:none}' +
      '.gm-search:focus{border-color:#b8ead7;background:#fff;box-shadow:0 0 0 3px #ffffff25}' +
      '.gm-add{height:40px;padding:0 15px;border:1px solid #ffffff35;border-radius:11px;background:linear-gradient(110deg,#082c4a,#008a69);color:#fff;font-size:12px;font-weight:800;cursor:pointer;box-shadow:0 4px 12px #062d2730;transition:transform .16s,box-shadow .16s}' +
      '.gm-add:hover{transform:translateY(-1px);background:linear-gradient(110deg,#0c5360,#008a69);box-shadow:0 7px 15px #062d2740}' +
      '.gm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,290px),1fr));gap:13px}' +
      '.gm-card{position:relative;display:flex;flex-direction:column;min-height:176px;overflow:hidden;padding:18px;border:1px solid #d8e4df;border-radius:14px;background:linear-gradient(155deg,#fff 0%,#fff 75%,#f8fbf9 100%);box-shadow:0 10px 26px -22px #0f2d3e59,0 1px 3px #0f2d3e0a;transition:transform .16s,border-color .16s,box-shadow .16s}' +
      '.gm-card:before{position:absolute;inset:0 0 auto;height:3px;background:linear-gradient(90deg,#16466a,#07865d);content:""}' +
      '.gm-card:hover{transform:translateY(-2px);border-color:#aacbbd;box-shadow:0 12px 24px -18px #0c3c4c70}' +
      '.gm-card h2{margin:0;color:#173b52;font-size:15px;font-weight:800;overflow-wrap:anywhere}' +
      '.gm-description{flex:1;margin:9px 0 16px;color:#64748b;font-size:12px;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere}' +
      '.gm-link{display:flex;justify-content:flex-end;gap:7px;flex-wrap:wrap}' +
      '.gm-btn{min-height:34px;padding:0 12px;border:1px solid #d7e3dd;border-radius:9px;background:#fff;color:#465b54;font-size:11px;font-weight:750;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;transition:background .16s,border-color .16s,transform .16s}' +
      '.gm-btn:hover{transform:translateY(-1px);border-color:#a9cbbd;background:#f2f8f4;color:#08764f}' +
      '.gm-btn.primary{border-color:#008a69;background:#008a69;color:#fff}' +
      '.gm-btn.primary:hover{border-color:#0c5360;background:#0c5360;color:#fff}' +
      '.gm-btn.danger{border-color:#f0d3d1;background:#fff7f6;color:#a44640}' +
      '.gm-state{padding:28px 15px;border:1px dashed #cbdad3;border-radius:13px;background:#f8fbf9;text-align:center;color:#77837f;font-size:13px}' +
      '.gm-error{color:#9a3530}' +
      '.gm-modal-backdrop{position:fixed;inset:0;z-index:1200;display:grid;place-items:center;padding:16px;background:#10232180}' +
      '.gm-modal{width:min(100%,560px);max-height:90vh;overflow:auto;border-radius:12px;background:#fff;box-shadow:0 18px 55px #0003}' +
      '.gm-modal-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #e6ece9}' +
      '.gm-modal-head h2{margin:0;color:#123c37;font-size:16px}' +
      '.gm-modal-body{display:grid;gap:13px;padding:20px}' +
      '.gm-modal-body label{display:grid;gap:5px;color:#53615e;font-size:11px;font-weight:700}' +
      '.gm-modal-body input,.gm-modal-body textarea{width:100%;min-height:38px;padding:8px 9px;border:1px solid #d4dfda;border-radius:6px;background:#fff;color:#293936;font:12px Arial,sans-serif}' +
      '.gm-modal-body textarea{min-height:90px;resize:vertical}' +
      '.gm-modal-footer{display:flex;justify-content:flex-end;gap:9px;padding:14px 20px;border-top:1px solid #e6ece9}' +
      '.gm-viewer{position:fixed;inset:0;z-index:1100;display:flex;flex-direction:column;min-width:0;background:#f5f7f6}' +
      '.gm-viewer-head{display:flex;flex-direction:column;gap:8px;padding:9px 12px;background:#fff;border-bottom:1px solid #dce4e1}' +
      '.gm-viewer-toolbar{display:flex;align-items:center;gap:8px;min-height:36px}' +
      '.gm-back{min-height:32px;padding:0 10px;border:1px solid #e0e6e3;border-radius:7px;background:#f5f7f6;color:#344641;font-size:11px;font-weight:700;white-space:nowrap;cursor:pointer}' +
      '.gm-active-title{flex:none;max-width:190px;min-width:0;color:#203b36;font-size:13px;font-weight:750;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
      '.gm-frame-wrap{position:relative;flex:1;min-height:0;overflow:auto;background:#fff}' +
      '.gm-frame{--gm-zoom:1;position:absolute;inset:0;width:calc(100% / var(--gm-zoom));height:calc(100% / var(--gm-zoom));border:0;background:#fff;transform:scale(var(--gm-zoom));transform-origin:top left}' +
      '.gm-open-external{display:inline-flex;align-items:center;justify-content:center;min-height:33px;padding:0 10px;border-radius:7px;background:#008a69;color:#fff;font-size:10px;font-weight:700;text-decoration:none;white-space:nowrap}' +
      '.gm-view-controls{display:flex;align-items:center;gap:4px;flex:none}' +
      '.gm-zoom{display:flex;align-items:center;gap:3px;padding:2px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc}' +
      '.gm-zoom button{width:30px;height:29px;border:0;border-radius:6px;background:#082c4a;color:#fff;font-size:18px;line-height:1;cursor:pointer}' +
      '.gm-zoom-value{min-width:40px;text-align:center;color:#334155;font-size:10px;font-weight:750}' +
      '.gm-fullscreen{min-height:33px;padding:0 10px;border:0;border-radius:7px;background:#008a69;color:#fff;font-size:10px;font-weight:700;white-space:nowrap;cursor:pointer}' +
      '@media(max-width:760px){.gm-head{align-items:stretch;padding:16px}.gm-head:after{right:-42px}.gm-toolbar{width:100%}.gm-search{flex:1;min-width:0}.gm-add{flex:none}.gm-viewer-toolbar{flex-wrap:wrap}.gm-view-controls{margin-left:auto}.gm-fullscreen{font-size:0;padding:0 9px}.gm-fullscreen:after{content:"⛶";font-size:17px}}' +
    '</style>' +
    '<section class="gm-head">' +
      '<div><h1 class="gm-title">Centro de Datos</h1><p class="gm-subtitle">Accesos directos a las herramientas administrativas.</p></div>' +
      '<div class="gm-toolbar"><input id="gm-search" class="gm-search" type="search" placeholder="Buscar herramientas" aria-label="Buscar herramientas" autocomplete="off">' +
      '<button class="gm-add" type="button" data-gm-action="add">＋ Agregar herramienta</button></div>' +
    '</section>' +
    '<div id="gm-state" class="gm-state">Cargando herramientas…</div>' +
    '<section id="gm-grid" class="gm-grid" aria-label="Herramientas registradas" hidden></section>' +
    '<div id="gm-overlay"></div>';

  root.querySelector('#gm-search').addEventListener('input', _gerenciaRenderCards);
  root.querySelector('[data-gm-action="add"]').addEventListener('click', function () {
    _gerenciaOpenForm(null);
  });
}

async function _gerenciaLoad() {
  var generation = _gerenciaLoadGeneration;
  var state = document.getElementById('gm-state');
  if (state) {
    state.hidden = false;
    state.className = 'gm-state';
    state.textContent = 'Cargando herramientas…';
  }
  try {
    var rows = await GerenciaService.listar();
    if (generation !== _gerenciaLoadGeneration) return;
    _gerenciaHerramientas = rows;
    _gerenciaRenderCards();
  } catch (error) {
    if (generation !== _gerenciaLoadGeneration) return;
    console.error('[Gerencia] No se pudieron cargar las herramientas:', error);
    if (state) {
      state.hidden = false;
      state.className = 'gm-state gm-error';
      state.textContent = 'No se pudieron cargar las herramientas. Verifica tu sesión o conexión e inténtalo de nuevo.';
    }
  }
}

function _gerenciaRenderCards() {
  var host = document.getElementById('gm-grid');
  var state = document.getElementById('gm-state');
  var search = document.getElementById('gm-search');
  if (!host || !state) return;

  var term = String(search ? search.value : '').trim().toLocaleLowerCase();
  var rows = _gerenciaHerramientas.filter(function (tool) {
    return !term || [tool.nombre, tool.descripcion].some(function (value) {
      return String(value || '').toLocaleLowerCase().includes(term);
    });
  });
  if (!rows.length) {
    host.hidden = true;
    state.hidden = false;
    state.className = 'gm-state';
    state.textContent = _gerenciaHerramientas.length
      ? 'No hay herramientas que coincidan con la búsqueda.'
      : 'Aún no hay herramientas registradas. Agrega la primera para empezar.';
    return;
  }

  state.hidden = true;
  host.hidden = false;
  host.innerHTML = rows.map(function (tool) {
    return '<article class="gm-card">' +
      '<h2>' + _gerenciaEsc(tool.nombre) + '</h2>' +
      '<p class="gm-description">' + _gerenciaEsc(tool.descripcion) + '</p>' +
      '<div class="gm-link">' +
        '<button class="gm-btn primary" type="button" data-gm-action="open" data-id="' + _gerenciaEsc(tool.id) + '">Abrir herramienta</button>' +
        '<button class="gm-btn" type="button" data-gm-action="edit" data-id="' + _gerenciaEsc(tool.id) + '">Editar</button>' +
        '<button class="gm-btn danger" type="button" data-gm-action="delete" data-id="' + _gerenciaEsc(tool.id) + '">Eliminar</button>' +
      '</div></article>';
  }).join('');

  host.querySelectorAll('[data-gm-action]').forEach(function (button) {
    button.addEventListener('click', function () {
      _gerenciaHandleAction(button.dataset.gmAction, button.dataset.id);
    });
  });
}

function _gerenciaHandleAction(action, id) {
  var tool = _gerenciaHerramientas.find(function (item) { return String(item.id) === String(id); });
  if (action === 'open' && tool) _gerenciaOpenTool(tool);
  if (action === 'edit' && tool) _gerenciaOpenForm(tool);
  if (action === 'delete' && tool) _gerenciaDelete(tool);
}

function _gerenciaOpenForm(tool) {
  var host = document.getElementById('gm-overlay');
  if (!host) return;
  var editing = !!tool;
  host.innerHTML =
    '<div class="gm-modal-backdrop" data-gm-dismiss>' +
      '<form class="gm-modal" role="dialog" aria-modal="true" aria-labelledby="gm-modal-title">' +
        '<div class="gm-modal-head"><h2 id="gm-modal-title">' + (editing ? 'Editar herramienta' : 'Agregar herramienta') + '</h2>' +
          '<button class="gm-btn" type="button" data-gm-cancel aria-label="Cerrar">×</button></div>' +
        '<div class="gm-modal-body">' +
          '<label>Nombre<input name="nombre" maxlength="120" required value="' + _gerenciaEsc(tool ? tool.nombre : '') + '"></label>' +
          '<label>Descripción<textarea name="descripcion" maxlength="1000" required>' + _gerenciaEsc(tool ? tool.descripcion : '') + '</textarea></label>' +
          '<label>Link<input name="link" type="url" inputmode="url" placeholder="https://…" maxlength="2048" required value="' + _gerenciaEsc(tool ? tool.link : '') + '"></label>' +
          '<div id="gm-form-error" class="gm-error" role="alert"></div>' +
        '</div>' +
        '<div class="gm-modal-footer"><button class="gm-btn" type="button" data-gm-cancel>Cancelar</button>' +
          '<button class="gm-btn primary" type="submit">Guardar</button></div>' +
      '</form>' +
    '</div>';

  var backdrop = host.querySelector('.gm-modal-backdrop');
  var form = host.querySelector('form');
  host.querySelectorAll('[data-gm-cancel]').forEach(function (button) {
    button.addEventListener('click', function () { host.innerHTML = ''; });
  });
  backdrop.addEventListener('click', function (event) {
    if (event.target === backdrop) host.innerHTML = '';
  });
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    var submit = form.querySelector('[type="submit"]');
    var error = form.querySelector('#gm-form-error');
    var values = {
      nombre: form.elements.nombre.value,
      descripcion: form.elements.descripcion.value,
      link: form.elements.link.value
    };
    submit.disabled = true;
    submit.textContent = 'Guardando…';
    error.textContent = '';
    try {
      if (editing) await GerenciaService.actualizar(tool.id, values);
      else await GerenciaService.crear(values);
      host.innerHTML = '';
      await _gerenciaLoad();
    } catch (saveError) {
      console.error('[Gerencia] No se pudo guardar la herramienta:', saveError);
      error.textContent = saveError.message || 'No se pudo guardar la herramienta.';
      submit.disabled = false;
      submit.textContent = 'Guardar';
    }
  });
}

async function _gerenciaDelete(tool) {
  if (!window.confirm('¿Eliminar la herramienta "' + tool.nombre + '"?')) return;
  try {
    await GerenciaService.eliminar(tool.id);
    _gerenciaHerramientas = _gerenciaHerramientas.filter(function (row) {
      return String(row.id) !== String(tool.id);
    });
    _gerenciaCloseTab(String(tool.id));
    _gerenciaRenderCards();
  } catch (error) {
    console.error('[Gerencia] No se pudo eliminar la herramienta:', error);
    window.alert(error.message || 'No se pudo eliminar la herramienta.');
  }
}

function _gerenciaOpenTool(tool) {
  var parsed;
  try {
    parsed = new URL(tool.link);
  } catch (error) {
    window.alert('El link de esta herramienta no tiene un formato válido.');
    return;
  }
  if (parsed.protocol !== 'https:') {
    window.alert('El link de la herramienta debe usar HTTPS.');
    return;
  }

  var existing = _gerenciaTabs.find(function (tab) { return tab.id === String(tool.id); });
  if (existing) {
    _gerenciaSelectTab(existing.id);
    adminMostrarHojaAbierta('gerencia', existing.id);
    return;
  }
  if (_gerenciaTabs.length >= _gerenciaMaxTabs) {
    window.alert('Hay ' + _gerenciaMaxTabs + ' herramientas abiertas. Cierra una pestaña antes de abrir otra.');
    return;
  }

  _gerenciaEnsureViewer();
  var tab = { id: String(tool.id), nombre: tool.nombre, url: parsed.href };
  _gerenciaTabs.push(tab);
  _gerenciaAddTab(tab);
  _gerenciaSelectTab(tab.id);
  if (typeof adminRegistrarHojaAbierta === 'function') {
    adminRegistrarHojaAbierta('gerencia', tab.id, tab.nombre);
  }
  adminMostrarHojaAbierta('gerencia', tab.id);
}

function _gerenciaEnsureViewer() {
  if (_gerenciaViewer && _gerenciaViewer.isConnected) return;
  var root = document.getElementById('admin-viewer-host') || document.getElementById('admin-content') || document.body;
  var viewer = document.createElement('section');
  viewer.className = 'gm-viewer';
  viewer.dataset.adminViewer = 'gerencia';
  viewer.setAttribute('aria-label', 'Herramientas abiertas');
  viewer.innerHTML =
    '<header class="gm-viewer-head">' +
      '<div class="gm-viewer-toolbar">' +
        '<button class="gm-back" type="button" data-gm-return>← Volver a Centro de Datos</button>' +
        '<span id="gm-active-title" class="gm-active-title"></span>' +
        '<div class="gm-view-controls">' +
          '<div class="gm-zoom" aria-label="Zoom de la herramienta"><button type="button" data-gm-zoom="-1" title="Reducir zoom">−</button><span id="gm-zoom-value" class="gm-zoom-value">100%</span><button type="button" data-gm-zoom="1" title="Aumentar zoom">+</button></div>' +
          '<button class="gm-fullscreen" type="button" data-gm-fullscreen>Pantalla completa</button>' +
          '<a id="gm-open-external" class="gm-open-external" target="_blank" rel="noopener noreferrer" title="Abrir en pestaña nueva">↗</a>' +
        '</div>' +
      '</div>' +
    '</header>' +
    '<div id="gm-frames" class="gm-frame-wrap"></div>';
  viewer.querySelector('[data-gm-return]').addEventListener('click', function () {
    if (document.fullscreenElement === viewer && document.exitFullscreen) {
      document.exitFullscreen().catch(function () {
        window.alert('No se pudo salir de pantalla completa.');
      });
    }
    viewer.style.display = 'none';
  });
  viewer.querySelectorAll('[data-gm-zoom]').forEach(function (button) {
    button.addEventListener('click', function () {
      _gerenciaChangeZoom(Number(button.dataset.gmZoom));
    });
  });
  viewer.querySelector('[data-gm-fullscreen]').addEventListener('click', _gerenciaToggleFullscreen);
  viewer.addEventListener('fullscreenchange', _gerenciaUpdateFullscreenButton);
  root.appendChild(viewer);
  _gerenciaViewer = viewer;
  window.__ksGerenciaViewer = viewer;
}

function _gerenciaAddTab(tab) {
  var frameHost = _gerenciaViewer.querySelector('#gm-frames');
  var frame = document.createElement('iframe');
  frame.className = 'gm-frame';
  frame.title = 'Hoja de ' + tab.nombre;
  frame.allowFullscreen = true;
  frame.hidden = true;
  frame.style.setProperty('--gm-zoom', '1');
  frame.src = tab.url;
  frame.dataset.tabId = tab.id;
  frameHost.appendChild(frame);
}

function _gerenciaSelectTab(id) {
  if (!_gerenciaViewer) return;
  _gerenciaActiveTabId = String(id);
  _gerenciaViewer.querySelectorAll('.gm-frame').forEach(function (frame) {
    frame.hidden = frame.dataset.tabId !== _gerenciaActiveTabId;
  });
  var active = _gerenciaTabs.find(function (tab) { return tab.id === _gerenciaActiveTabId; });
  var title = _gerenciaViewer.querySelector('#gm-active-title');
  var external = _gerenciaViewer.querySelector('#gm-open-external');
  var activeFrame = _gerenciaViewer.querySelector('.gm-frame[data-tab-id="' + _gerenciaActiveTabId + '"]');
  var zoomValue = _gerenciaViewer.querySelector('#gm-zoom-value');
  if (title && active) title.textContent = active.nombre;
  if (external && active) external.href = active.url;
  if (zoomValue) {
    var zoom = activeFrame ? Number(activeFrame.style.getPropertyValue('--gm-zoom') || 1) : 1;
    zoomValue.textContent = Math.round(zoom * 100) + '%';
  }
  window.__ksGerenciaActiveTabId = _gerenciaActiveTabId;
}

function _gerenciaChangeZoom(direction) {
  if (!_gerenciaViewer || !_gerenciaActiveTabId) return;
  var frame = _gerenciaViewer.querySelector('.gm-frame[data-tab-id="' + _gerenciaActiveTabId + '"]');
  if (!frame) return;

  var current = Number(frame.style.getPropertyValue('--gm-zoom') || 1);
  var currentIndex = _gerenciaZoomLevels.indexOf(current);
  if (currentIndex < 0) currentIndex = 2;
  var nextIndex = Math.max(0, Math.min(_gerenciaZoomLevels.length - 1, currentIndex + direction));
  var next = _gerenciaZoomLevels[nextIndex];
  frame.style.setProperty('--gm-zoom', String(next));
  var label = _gerenciaViewer.querySelector('#gm-zoom-value');
  if (label) label.textContent = Math.round(next * 100) + '%';
}

function _gerenciaToggleFullscreen() {
  if (!_gerenciaViewer) return;
  if (document.fullscreenElement === _gerenciaViewer) {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(function () {
        window.alert('No se pudo salir de pantalla completa.');
      });
    }
    return;
  }
  if (_gerenciaViewer.requestFullscreen) {
    _gerenciaViewer.requestFullscreen().catch(function () {
      window.alert('No se pudo activar pantalla completa.');
    });
  }
}

function _gerenciaUpdateFullscreenButton() {
  if (!_gerenciaViewer) return;
  var button = _gerenciaViewer.querySelector('[data-gm-fullscreen]');
  if (button) {
    button.textContent = document.fullscreenElement === _gerenciaViewer
      ? 'Salir de pantalla completa'
      : 'Pantalla completa';
  }
}

function _gerenciaCloseTab(id) {
  if (!_gerenciaViewer) return;
  var closedIndex = _gerenciaTabs.findIndex(function (tab) { return tab.id === String(id); });
  if (closedIndex === -1) return;
  var wasActive = _gerenciaActiveTabId === String(id);
  _gerenciaTabs.splice(closedIndex, 1);
  var frame = _gerenciaViewer.querySelector('.gm-frame[data-tab-id="' + id + '"]');
  if (frame) frame.remove();
  adminCerrarHojaAbierta('gerencia', String(id));
  if (wasActive) {
    _gerenciaActiveTabId = null;
    if (_gerenciaTabs.length) {
      var next = _gerenciaTabs[Math.min(closedIndex, _gerenciaTabs.length - 1)];
      _gerenciaSelectTab(next.id);
    } else {
      _gerenciaViewer.style.display = 'none';
    }
  }
  if (!_gerenciaTabs.length) {
    _gerenciaViewer.remove();
    _gerenciaViewer = null;
    window.__ksGerenciaViewer = null;
  }
}

function _gerenciaEsc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
  });
}
