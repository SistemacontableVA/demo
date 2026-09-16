(function () {
  'use strict';

  var STORAGE_KEY = 'contabilidad_diaria_draft_v1';
  var QUEUE_KEY = 'contabilidad_diaria_sync_queue_v1';
  var HISTORY_KEY = 'contabilidad_diaria_history_v1';

  function getBaseUrl() {
    if (window.API_URL_CONTABILIDAD && typeof window.API_URL_CONTABILIDAD === 'string' && window.API_URL_CONTABILIDAD.trim()) {
      return window.API_URL_CONTABILIDAD.replace(/\/$/, '');
    }

    if (window.ApiConfig && window.ApiConfig.contabilidad && window.ApiConfig.contabilidad.baseUrl) {
      return window.ApiConfig.contabilidad.baseUrl.replace(/\/$/, '');
    }

    return '';
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
        return { ok: true };
      } catch (error) {
        console.error('[ContabilidadDiariaService] No se pudo borrar borrador local:', error);
        return { ok: false, error: error.toString() };
      }
    },

    loadRemoteDraftHistory: async function () {
      var baseUrl = getBaseUrl();
      if (!baseUrl) {
        return [];
      }

      try {
        var response = await fetch(baseUrl + '?action=listar-borradores-contabilidad', { cache: 'no-store' });
        var data = await response.json();
        var items = data && Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
        return items.filter(function (item) {
          return item && (item.fecha || item.FECHA || item.municipio || item.coordinador);
        });
      } catch (error) {
        console.warn('[ContabilidadDiariaService] No se pudo cargar el historial remoto de Google Sheets:', error);
        return [];
      }
    },

    loadRemoteDraftByFecha: async function (fecha) {
      if (!fecha) return null;

      var fechaClave = normalizarFechaClave(fecha);
      var history = await this.loadRemoteDraftHistory();

      var item = history.find(function (draft) {
        var fechaRemota = normalizarFechaClave(draft.fecha || draft.FECHA || '');
        return fechaRemota && fechaRemota === fechaClave;
      });

      if (!item || !item.id) return null;
      return this.loadRemoteDraftById(item.id);
    },

    loadRemoteDraftById: async function (id) {
      var baseUrl = getBaseUrl();
      if (!baseUrl || !id) return null;

      try {
        var query = new URLSearchParams({ action: 'consultar-borrador-contabilidad', id: String(id) });
        var response = await fetch(baseUrl + '?' + query.toString(), { cache: 'no-store' });
        var data = await response.json();
        if (!data || !data.data) return null;
        return normalizarPayload(data.data);
      } catch (error) {
        console.warn('[ContabilidadDiariaService] No se pudo cargar el borrador remoto por id:', error);
        return null;
      }
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
      var baseUrl = getBaseUrl();
      if (!baseUrl) {
        return { ok: false, offline: true, error: 'API_URL no configurada.' };
      }

      var draft = normalizarPayload(payload);
      var candidates = [
        { action: 'guardar-borrador-contabilidad', payload: draft },
        { action: 'guardar-jornada-contabilidad', payload: draft },
        { action: 'guardar-borrador', payload: draft }
      ];

      var lastError = null;

      for (var i = 0; i < candidates.length; i++) {
        var candidate = candidates[i];
        var query = new URLSearchParams({ action: candidate.action });
        query.set('payload', JSON.stringify(candidate.payload));

        try {
          var response = await fetch(baseUrl + '?' + query.toString(), { cache: 'no-store' });
          var data = await response.json();

          if (data && data.ok) {
            draft.sincronizado = true;
            if (draft.estado === 'borrador') {
              draft.estado = 'pendiente_de_validacion';
            }
            draft.actualizadoEn = new Date().toISOString();
            this.saveDraft(draft);
            return { ok: true, data: data, draft: draft };
          }

          lastError = data && data.error ? data.error : 'Error al sincronizar la contabilidad';
        } catch (error) {
          lastError = error && error.toString ? error.toString() : 'Error de red';
        }
      }

      this.enqueueSync(draft);
      return { ok: false, offline: true, error: lastError || 'No se pudo sincronizar el borrador.' };
    },

    syncPendingQueue: async function () {
      var queue = this.getPendingQueue();
      if (!queue.length) return { ok: true, sincronizados: 0 };

      var pendientes = queue.slice();
      var sincronizados = 0;

      for (var i = 0; i < pendientes.length; i++) {
        var item = pendientes[i];
        var result = await this.syncDraft(item);
        if (result && result.ok) {
          sincronizados += 1;
        }
      }

      var remaining = this.getPendingQueue().filter(function (item) {
        return !(item && item.id && pendientes.some(function (pending) { return pending && pending.id === item.id; }));
      });

      if (sincronizados > 0) {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
      }

      return { ok: true, sincronizados: sincronizados };
    }
  };

  window.ContabilidadDiariaService = ContabilidadDiariaService;
})();
