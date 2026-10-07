(function () {
  'use strict';

  var STORAGE_KEY = 'contabilidad_diaria_draft_v1';
  var QUEUE_KEY = 'contabilidad_diaria_sync_queue_v1';
  var HISTORY_KEY = 'contabilidad_diaria_history_v1';

  function getRemoteContext() {
    var authWindow = window;
    if (window.parent && window.parent !== window) {
      try {
        if (!authWindow.ADMIN_AUTH_BASE_URL) authWindow = window.parent;
      } catch (error) {
        throw new Error('No se pudo acceder a la sesión del portal.');
      }
    }

    var token = typeof authWindow.getTokenAdmin === 'function'
      ? authWindow.getTokenAdmin()
      : (localStorage.getItem('ks_admin_token') || sessionStorage.getItem('ks_admin_token') || '');
    if (!token) throw new Error('Inicia sesión para guardar o consultar la contabilidad.');
    if (!authWindow.ADMIN_AUTH_BASE_URL || !authWindow.ADMIN_AUTH_PUBLIC_KEY) {
      throw new Error('No se pudo validar la sesión para guardar la jornada.');
    }
    return {
      baseUrl: authWindow.ADMIN_AUTH_BASE_URL.replace(/\/$/, ''),
      publicKey: authWindow.ADMIN_AUTH_PUBLIC_KEY,
      token: token
    };
  }

  function rpc(name, params) {
    var context = getRemoteContext();
    return fetch(context.baseUrl + '/rest/v1/rpc/' + name, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        apikey: context.publicKey,
        Authorization: 'Bearer ' + context.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params || {})
    }).catch(function () {
      var networkError = new Error('No fue posible comunicarse con el servicio de datos.');
      networkError.status = 0;
      throw networkError;
    }).then(function (response) {
      return response.text().then(function (text) {
        var data = null;
        if (text) {
          try { data = JSON.parse(text); } catch (error) { data = text; }
        }
        if (!response.ok) {
          var message = data && typeof data === 'object'
            ? (data.message || data.details || data.hint || data.error)
            : data;
          var apiError = new Error(message || 'No se pudo completar la operación de contabilidad.');
          apiError.status = response.status;
          throw apiError;
        }
        return data;
      });
    });
  }

  function getDefaultDraft() {
    return {
      id: '',
      fecha: '',
      municipio: '',
      coordinador: '',
      estado: 'borrador',
      sincronizado: false,
      actualizadoEn: null,
      afiliaciones: [],
      gastos: {},
      detalle: {},
      totales: {},
      auditoria: []
    };
  }

  function normalizarPayload(payload) {
    var draft = payload || {};
    var base = getDefaultDraft();

    Object.keys(base).forEach(function (key) {
      if (draft[key] !== undefined) base[key] = draft[key];
    });

    if (!base.id) {
      base.id = 'jornada-' + Date.now();
    }

    base.actualizadoEn = new Date().toISOString();
    base.estado = base.estado || 'borrador';
    base.afiliaciones = Array.isArray(base.afiliaciones) ? base.afiliaciones : [];
    if (base.gastos && typeof base.gastos === 'object' && !Array.isArray(base.gastos)) {
      base.gastos = base.gastos;
    } else {
      base.gastos = {};
    }
    base.totales = (base.totales && typeof base.totales === 'object' && !Array.isArray(base.totales)) ? base.totales : {};
    base.detalle = (base.detalle && typeof base.detalle === 'object' && !Array.isArray(base.detalle)) ? base.detalle : {};
    base.auditoria = Array.isArray(base.auditoria) ? base.auditoria : [];

    return base;
  }

  function getDraftHistory() {
    try {
      var raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (error) {
      console.warn('[ContabilidadDiariaService] Error leyendo historial de borradores:', error);
      return {};
    }
  }

  function saveDraftHistory(historyMap) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(historyMap || {}));
      return true;
    } catch (error) {
      console.warn('[ContabilidadDiariaService] Error guardando historial de borradores:', error);
      return false;
    }
  }

  function normalizarFechaClave(valor) {
    if (!valor && valor !== 0) return '';
    var texto = String(valor).trim();
    if (!texto) return '';

    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;

    var date = new Date(texto);
    if (Number.isNaN(date.getTime())) return texto;

    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function ordenarFechas(fechaA, fechaB) {
    return new Date(fechaB).getTime() - new Date(fechaA).getTime();
  }

  var ContabilidadDiariaService = {
    storageKey: STORAGE_KEY,
    queueKey: QUEUE_KEY,
    historyKey: HISTORY_KEY,

    getDraftHistory: function () {
      return getDraftHistory();
    },

    getAvailableDraftDates: function () {
      var history = getDraftHistory();
      return Object.keys(history).sort(ordenarFechas);
    },

    loadDraft: function (fecha) {
      try {
        if (fecha) {
          var history = getDraftHistory();
          var clave = normalizarFechaClave(fecha);
          if (history[fecha]) return normalizarPayload(history[fecha]);
          if (history[clave]) return normalizarPayload(history[clave]);

          var matchedEntry = Object.keys(history).find(function (key) {
            return normalizarFechaClave(key) === clave;
          });
          if (matchedEntry) return normalizarPayload(history[matchedEntry]);
          return null;
        }

        var raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        var parsed = JSON.parse(raw);
        if (!parsed) return null;
        return normalizarPayload(parsed);
      } catch (error) {
        console.warn('[ContabilidadDiariaService] Error leyendo borrador local:', error);
        return null;
      }
    },

    saveDraft: function (payload) {
      var draft = normalizarPayload(payload);
      try {
        var history = getDraftHistory();
        if (draft.fecha) {
          var clave = normalizarFechaClave(draft.fecha);
          history[draft.fecha] = draft;
          if (clave && clave !== draft.fecha) {
            history[clave] = draft;
          }
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
        saveDraftHistory(history);
        return { ok: true, draft: draft };
      } catch (error) {
        console.error('[ContabilidadDiariaService] No se pudo guardar borrador local:', error);
        return { ok: false, error: error.toString() };
      }
    },

    clearDraft: function (fecha) {
      try {
        if (fecha) {
          var history = getDraftHistory();
          if (history[fecha]) delete history[fecha];
          saveDraftHistory(history);
          var queueForDate = this.getPendingQueue().filter(function (item) {
            return !(item && normalizarFechaClave(item.fecha) === normalizarFechaClave(fecha));
          });
          localStorage.setItem(QUEUE_KEY, JSON.stringify(queueForDate));
          if (localStorage.getItem(STORAGE_KEY)) {
            var active = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            if (active && active.fecha === fecha) {
              localStorage.removeItem(STORAGE_KEY);
            }
          }
          return { ok: true };
        }

        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(HISTORY_KEY);
        localStorage.removeItem(QUEUE_KEY);
        return { ok: true };
      } catch (error) {
        console.error('[ContabilidadDiariaService] No se pudo borrar borrador local:', error);
        return { ok: false, error: error.toString() };
      }
    },

    loadRemoteDraftHistory: async function () {
      var items = await rpc('contabilidad_diaria_listar');
      if (!Array.isArray(items)) throw new Error('El historial de jornadas recibido no es válido.');
      return items;
    },

    loadRemoteDraftByFecha: async function (fecha) {
      if (!fecha) return null;
      var draft = await rpc('contabilidad_diaria_obtener', { p_fecha: normalizarFechaClave(fecha) });
      return draft ? normalizarPayload(draft) : null;
    },

    loadRemoteDraftById: async function (id) {
      if (!id) return null;
      var history = await this.loadRemoteDraftHistory();
      var item = history.find(function (draft) { return draft && String(draft.id) === String(id); });
      return item ? this.loadRemoteDraftByFecha(item.fecha) : null;
    },

    getPendingQueue: function () {
      try {
        var raw = localStorage.getItem(QUEUE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (error) {
        console.warn('[ContabilidadDiariaService] Cola de sincronización inválida:', error);
        return [];
      }
    },

    enqueueSync: function (payload) {
      var draft = normalizarPayload(payload);
      var queue = this.getPendingQueue();
      var index = queue.findIndex(function (item) { return item && item.id === draft.id; });
      if (index >= 0) queue.splice(index, 1);
      queue.push(draft);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      return { ok: true, queue: queue };
    },

    syncDraft: async function (payload) {
      var draft = normalizarPayload(payload);
      var localResult = this.saveDraft(draft);
      if (!localResult.ok) throw new Error(localResult.error || 'No se pudo guardar el borrador local.');

      try {
        var saved = normalizarPayload(await rpc('contabilidad_diaria_guardar', { p_payload: draft }));
        saved.sincronizado = true;
        this.saveDraft(saved);
        var remaining = this.getPendingQueue().filter(function (item) {
          return !(item && item.fecha === saved.fecha);
        });
        localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
        return { ok: true, data: saved, draft: saved };
      } catch (error) {
        if (error.status === 0 || error.status >= 500) {
          this.enqueueSync(draft);
          return { ok: false, offline: true, error: error.message };
        }
        throw error;
      }
    },

    cambiarEstado: async function (id, estado) {
      return rpc('contabilidad_diaria_cambiar_estado', { p_id: id, p_estado: estado });
    },

    obtenerResumen: async function () {
      return rpc('contabilidad_diaria_resumen');
    },

    syncPendingQueue: async function () {
      var queue = this.getPendingQueue();
      if (!queue.length) return { ok: true, sincronizados: 0 };

      var pendientes = queue.slice();
      var sincronizados = 0;
      for (var i = 0; i < pendientes.length; i++) {
        var result = await this.syncDraft(pendientes[i]);
        if (!result || !result.ok) {
          return {
            ok: false,
            offline: !!(result && result.offline),
            sincronizados: sincronizados,
            error: result && result.error ? result.error : 'No se sincronizaron todas las jornadas pendientes.'
          };
        }
        sincronizados += 1;
      }
      return { ok: true, sincronizados: sincronizados };
    }
  };

  window.ContabilidadDiariaService = ContabilidadDiariaService;
  window.addEventListener('online', function () {
    ContabilidadDiariaService.syncPendingQueue().then(function (result) {
      if (result && !result.ok) console.warn('[ContabilidadDiariaService] Hay jornadas sin sincronizar:', result.error);
    }).catch(function (error) {
      console.error('[ContabilidadDiariaService] No se pudo vaciar la cola de sincronización:', error);
    });
  });
})();
