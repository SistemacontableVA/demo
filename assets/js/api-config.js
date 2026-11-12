/**
 * ═══════════════════════════════════════════════════════════════
 * API-CONFIG.JS — Configuración Centralizada de APIs y Endpoints
 * 
 * ═══════════════════════════════════════════════════════════════
 * 
 * SEGURIDAD:
 * • Este archivo DEBE estar en .gitignore
 * • No incluir en repositorio público
 * • En producción, cargar desde variables de entorno o servidor seguro
 * 
 * USO:
 * • Incluir ANTES de otros scripts que dependan de APIs
 * • Acceder mediante window.ApiConfig desde cualquier módulo
 * • Ejemplo: ApiConfig.buildUrl('nomina', { cedula: '12345' })
 * ═══════════════════════════════════════════════════════════════
 */

var ApiConfig = {

  // ═══════════════════════════════════════════════════════════════
  // API PRINCIPAL DE NÓMINA (Google Apps Script)
  // ═══════════════════════════════════════════════════════════════
  
  nomina: {
    baseUrl: "https://script.google.com/macros/s/AKfycbx0TmhFFf_LRpXiLEzI_Rso0WjteO2pNvSg-_iQuC69Mre6M3Hwmdvz0n3FIWcML5EOHQ/exec",
    
    descripcion: "API principal de Google Apps Script para nómina, promotores y reportes",
    
    publicada: "2026-08-15",
    
    estado: "✅ ACTIVA - En producción",
    
    responsable: "Backend Google Sheets - Código Nomina.gs",
    
    endpoints: {
      
      // ── Consultar datos de promotor ──
      consultarPromotor: {
        action: "consultarPromotor",
        metodo: "GET",
        parametros: {
          cedula: {
            tipo: "string",
            requerido: true,
            ejemplo: "V-12345678",
            descripcion: "Cédula del promotor a consultar"
          }
        },
        respuesta: {
          ok: "boolean",
          data: {
            nombre: "string",
            cedula: "string",
            municipio: "string",
            comision: "number"
          }
        },
        archivos: ["administracion/js/ingresarNomina.js:L772", "administracion/js/nominaPromotor.js:L151"],
        descripcion: "Obtiene información completa de un promotor por cédula"
      },

      // ── Guardar jornada de nómina ──
      escribirJornada: {
        action: "escribir-jornada",
        metodo: "POST",
        parametros: {
          registros: {
            tipo: "JSON array",
            requerido: true,
            ejemplo: "[{ cedula, fecha, lentes, comision }]",
            descripcion: "Array de registros de nómina del día"
          }
        },
        respuesta: {
          ok: "boolean",
          mensaje: "string",
          registrosGuardados: "number"
        },
        archivos: ["administracion/js/ingresarNomina.js:L498"],
        descripcion: "Guarda jornada de nómina diaria en Google Sheets"
      },

      // ── Reporte de Lentes y Desempeño ──
      obtenerReporteLentes: {
        action: "obtener-reporte-lentes",
        metodo: "GET",
        parametros: {
          fechaInicio: {
            tipo: "string YYYY-MM-DD",
            requerido: false,
            ejemplo: "2026-09-01"
          },
          fechaFin: {
            tipo: "string YYYY-MM-DD",
            requerido: false,
            ejemplo: "2026-09-30"
          },
          municipio: {
            tipo: "string",
            requerido: false,
            ejemplo: "Maracaibo",
            descripcion: "Filtro por municipio (búsqueda parcial)"
          }
        },
        respuesta: {
          ok: "boolean",
          kpis: "object",
          rankingPromotores: "array",
          embudoMunicipios: "array",
          municipiosDisponibles: "array"
        },
        archivos: ["administracion/js/reportes.js", "administracion/services/reportesService.js"],
        descripcion: "Genera reporte consolidado de lentes vendidos y desempeño por promotor"
      },

      // ── Dashboard ──
      dashboard: {
        action: "dashboard",
        metodo: "GET",
        parametros: {},
        respuesta: {
          ok: "boolean",
          kpis: "object",
          resumenMes: "object",
          topPromotores: "array"
        },
        archivos: ["administracion/services/dashboardService.js"],
        descripcion: "Obtiene datos consolidados para el dashboard principal"
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // MÉTODOS AUXILIARES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Construye URL completa de una API con parámetros
   * 
   * @param {string} apiName - Nombre de una API configurada en este objeto.
   * @param {object} params - Parámetros a enviar { cedula, fecha, etc. }
   * @returns {string} URL completa lista para fetch()
   * 
   * @example
   * ApiConfig.buildUrl('nomina', { cedula: 'V-12345678' })
   * // → "https://script.google.com/...?cedula=V-12345678"
   */
  buildUrl: function(apiName, params = {}) {
    const api = this[apiName];
    
    if (!api) {
      console.error(`[ApiConfig] API no encontrada: ${apiName}`);
      throw new Error(`API desconocida: ${apiName}`);
    }
    
    if (api.estado && api.estado.includes('PENDIENTE')) {
      console.warn(`[ApiConfig] ⚠️  API aún no implementada: ${apiName}`);
    }
    
    const url = new URL(api.baseUrl);
    
    // Agregar parámetros a la URL
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.append(key, value);
      }
    });
    
    return url.toString();
  },

  /**
   * Obtiene información de un endpoint específico
   * 
   * @param {string} apiName - 'nomina', 'documentos'
   * @param {string} endpointName - 'consultarPromotor', 'escribirJornada', etc.
   * @returns {object} Información detallada del endpoint
   * 
   * @example
   * ApiConfig.getEndpoint('nomina', 'consultarPromotor')
   */
  getEndpoint: function(apiName, endpointName) {
    const api = this[apiName];
    if (!api || !api.endpoints) {
      throw new Error(`API o endpoints no encontrados: ${apiName}`);
    }
    return api.endpoints[endpointName];
  },

  /**
   * Lista todos los endpoints disponibles de una API
   * 
   * @param {string} apiName - 'nomina', 'documentos', 'oficina'
   * @returns {array} Array de nombres de endpoints
   * 
   * @example
   * ApiConfig.listEndpoints('nomina')
   * // → ['consultarPromotor', 'escribirJornada', 'obtenerReporteLentes', 'dashboard']
   */
  listEndpoints: function(apiName) {
    const api = this[apiName];
    if (!api || !api.endpoints) return [];
    return Object.keys(api.endpoints);
  },

  /**
   * Obtiene documentación de un endpoint en formato legible
   * 
   * @param {string} apiName - 'nomina', 'documentos'
   * @param {string} endpointName - Nombre del endpoint
   * @returns {string} Documentación formateada
   */
  getDocsEndpoint: function(apiName, endpointName) {
    const endpoint = this.getEndpoint(apiName, endpointName);
    let docs = `\n📌 ${apiName}.${endpointName}\n`;
    docs += `─────────────────────────────────\n`;
    docs += `Descripción: ${endpoint.descripcion}\n`;
    docs += `Acción: ${endpoint.action}\n`;
    docs += `Método: ${endpoint.metodo}\n`;
    
    if (endpoint.parametros && Object.keys(endpoint.parametros).length > 0) {
      docs += `\nParámetros:\n`;
      Object.entries(endpoint.parametros).forEach(([key, param]) => {
        docs += `  • ${key} (${param.tipo}) ${param.requerido ? '[REQUERIDO]' : '[Opcional]'}\n`;
        docs += `    ${param.descripcion || param.ejemplo}\n`;
      });
    }
    
    if (endpoint.archivos && endpoint.archivos.length > 0) {
      docs += `\nUsado en:\n`;
      endpoint.archivos.forEach(file => {
        docs += `  📄 ${file}\n`;
      });
    }
    
    return docs;
  }
};

// ═══════════════════════════════════════════════════════════════
// EXPORTAR GLOBALMENTE
// ═══════════════════════════════════════════════════════════════

// Para navegadores
if (typeof window !== 'undefined') {
  window.ApiConfig = ApiConfig;
}

// Para Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiConfig;
}
