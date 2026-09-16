/**
 * ═══════════════════════════════════════════════════════════════
 * API-CONFIG.JS — Configuración Centralizada de APIs y Endpoints
 * 
 * Óptica Visión de Águila · Sistema de Nómina y Gestión de Brigadas
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
  // 0️⃣  API DE CONTABILIDAD DIARIA (Google Apps Script)
  // ═══════════════════════════════════════════════════════════════
  // IMPORTANTE: esta API debe ser independiente de la de nómina.
  // No reutilizar window.API_URL ni ApiConfig.nomina.baseUrl para contabilidad.
  // Debe apuntar al Web App publicado del archivo backend/Codigocontrabilidaddiaria.gs.
  contabilidad: {
    baseUrl: "https://script.google.com/macros/s/AKfycbxeNcVqxyVVKPDAWFjj1IQjx8O--o5tPwOL7OP0R5lPX5tDWD1cOlMAMARQl0DKL0Otgg/exec",
    descripcion: "API independiente para Contabilidad Diaria y borradores de jornada",
    publicada: "2026-09-10",
    estado: "⏳ PENDIENTE - publicar el Web App de contabilidad",
    responsable: "backend/Codigocontrabilidaddiaria.gs",
    endpoints: {
      guardarBorrador: {
        action: "guardar-borrador-contabilidad",
        metodo: "POST",
        parametros: {
          payload: { tipo: "JSON object", requerido: true, descripcion: "Payload del borrador de contabilidad" }
        },
        respuesta: {
          ok: "boolean",
          id: "string",
          message: "string"
        },
        descripcion: "Guarda o actualiza el borrador de contabilidad diaria"
      },
      listarBorradores: {
        action: "listar-borradores-contabilidad",
        metodo: "GET",
        parametros: {},
        respuesta: {
          ok: "boolean",
          data: "array"
        },
        descripcion: "Lista todos los borradores disponibles"
      },
      consultarBorrador: {
        action: "consultar-borrador-contabilidad",
        metodo: "GET",
        parametros: {
          id: { tipo: "string", requerido: true, descripcion: "ID del borrador a consultar" }
        },
        respuesta: {
          ok: "boolean",
          data: "object"
        },
        descripcion: "Trae el borrador completo por ID"
      }
    }
  },
  
  // ═══════════════════════════════════════════════════════════════
  // 1️⃣  API PRINCIPAL DE NÓMINA (Google Apps Script)
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
  // 2️⃣  API DE OFICINA/NÓMINA DE OFICINA (Google Apps Script)
  // ═══════════════════════════════════════════════════════════════
  
  oficina: {
    baseUrl: "https://script.google.com/macros/s/AKfycbwCD-AptMIXc7mRpQ6pJjel9-3PEIrGdDb2D843xHA0i67ynlwWh4SZ2wE7y-sljKKn/exec",
    
    descripcion: "API para gestión de nómina de oficina (empleados, sucursales)",
    
    publicada: "2026-08-15",
    
    estado: "✅ ACTIVA - En producción",
    
    responsable: "Backend Google Apps Script - backend/OficinaNomina.gs",
    
    endpoints: {
      
      // ── Listar empleados de oficina ──
      listarEmpleados: {
        action: "listar-empleados-oficina",
        metodo: "GET",
        parametros: {},
        respuesta: {
          ok: "boolean",
          empleados: "array",
          total: "number"
        },
        archivos: ["administracion/services/oficinaNominaService.js", "administracion/js/oficina.js"],
        descripcion: "Obtiene lista de empleados de oficina con sus datos"
      },

      // ── Crear empleado de oficina ──
      crearEmpleado: {
        action: "crear-empleado-oficina",
        metodo: "POST",
        parametros: {
          nombre: {
            tipo: "string",
            requerido: true,
            descripcion: "Nombre completo del empleado"
          },
          cedula: {
            tipo: "string",
            requerido: true,
            descripcion: "Cédula del empleado"
          },
          puesto: {
            tipo: "string",
            requerido: true,
            descripcion: "Puesto o cargo del empleado"
          },
          salario: {
            tipo: "number",
            requerido: true,
            descripcion: "Salario base del empleado"
          }
        },
        respuesta: {
          ok: "boolean",
          mensaje: "string",
          empleadoId: "string"
        },
        archivos: ["administracion/services/oficinaNominaService.js"],
        descripcion: "Crea un nuevo empleado de oficina"
      },

      // ── Editar empleado de oficina ──
      editarEmpleado: {
        action: "editar-empleado-oficina",
        metodo: "POST",
        parametros: {
          id: {
            tipo: "string",
            requerido: true,
            descripcion: "ID del empleado a editar"
          },
          nombre: {
            tipo: "string",
            requerido: false,
            descripcion: "Nuevo nombre"
          },
          salario: {
            tipo: "number",
            requerido: false,
            descripcion: "Nuevo salario"
          }
        },
        respuesta: {
          ok: "boolean",
          mensaje: "string"
        },
        archivos: ["administracion/services/oficinaNominaService.js"],
        descripcion: "Actualiza datos de un empleado de oficina"
      },

      // ── Generar relación de pago ──
      generarRelacionPago: {
        action: "generar-relacion-pago",
        metodo: "POST",
        parametros: {
          empleadoId: {
            tipo: "string",
            requerido: true,
            descripcion: "ID del empleado"
          },
          mes: {
            tipo: "string MM/YYYY",
            requerido: true,
            descripcion: "Mes para generar relación de pago"
          }
        },
        respuesta: {
          ok: "boolean",
          html: "string",
          mensaje: "string"
        },
        archivos: ["administracion/services/oficinaNominaService.js"],
        descripcion: "Genera HTML de relación de pago del empleado"
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 3️⃣  API DE ATENCIÓN MUNICIPIO (Google Apps Script)
  // ═══════════════════════════════════════════════════════════════
  // Libro de control de municipios — hoja "Municipios"
  // SpreadsheetId: 1Iv4mfFbwyfIKqYBQhFvLjd3utyFk1OZsBgx7yI-rEeQ
  // Código fuente: documentacion/Proyecto Whatsapp/5. Apps Script Control Municipios.txt
  atencionMunicipio: {
    baseUrl: 'https://script.google.com/macros/s/AKfycbwNriOfnYcck_KmZr8YZ58N2UovsxDIX6yhcZ8VG_V7CruBeyneYXuq4ReAYNhADWjXkA/exec',
    spreadsheetId: '1Iv4mfFbwyfIKqYBQhFvLjd3utyFk1OZsBgx7yI-rEeQ',

    descripcion: 'API para gestión del libro de control de municipios y jornadas de atención',

    publicada: '2026-09-16',

    estado: '✅ ACTIVA — Web App publicado con JSONP',

    responsable: 'documentacion/Proyecto Whatsapp/5. Apps Script Control Municipios.txt',

    endpoints: {
      listarMunicipios: {
        action: 'listar-municipios',
        metodo: 'GET',
        parametros: {
          spreadsheetId: { tipo: 'string', requerido: true, descripcion: 'ID del libro de control' }
        },
        respuesta: { ok: 'boolean', municipios: 'array' },
        descripcion: 'Devuelve todos los municipios registrados agrupables por ruta'
      },
      guardarMunicipio: {
        action: 'guardar-municipio',
        metodo: 'POST',
        parametros: {
          ruta:          { tipo: 'number', requerido: true },
          municipio:     { tipo: 'string', requerido: true },
          fechaAtencion: { tipo: 'string YYYY-MM-DD', requerido: true },
          fechaEntrega:  { tipo: 'string YYYY-MM-DD', requerido: false },
          linkHoja:      { tipo: 'string URL', requerido: true },
          estado:        { tipo: 'string', requerido: false, ejemplo: 'Sin Digitalizar' }
        },
        respuesta: { ok: 'boolean', id: 'string' },
        descripcion: 'Crea un nuevo municipio en el libro de control'
      },
      actualizarMunicipio: {
        action: 'actualizar-municipio',
        metodo: 'POST',
        parametros: {
          id: { tipo: 'string', requerido: true }
        },
        respuesta: { ok: 'boolean' },
        descripcion: 'Actualiza los datos de un municipio existente'
      },
      eliminarMunicipio: {
        action: 'eliminar-municipio',
        metodo: 'POST',
        parametros: {
          id: { tipo: 'string', requerido: true }
        },
        respuesta: { ok: 'boolean' },
        descripcion: 'Elimina un municipio del libro de control'
      },
      cambiarEstado: {
        action: 'cambiar-estado',
        metodo: 'POST',
        parametros: {
          id:     { tipo: 'string', requerido: true },
          estado: { tipo: 'string', requerido: true, ejemplo: 'Digitalizado | Por Atender | Sin Digitalizar' }
        },
        respuesta: { ok: 'boolean' },
        descripcion: 'Cambia el estado de un municipio'
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // MÉTODOS AUXILIARES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Construye URL completa de una API con parámetros
   * 
   * @param {string} apiName - 'nomina', 'documentos', 'oficina'
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

