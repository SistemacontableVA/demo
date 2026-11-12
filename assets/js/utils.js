/* ============================================================
   UTILS.JS — Funciones de utilidad globales
   Reutilizables en todos los módulos del sistema
   ============================================================ */

/**
 * URL del Web App de Google Apps Script.
 * 
 * INTEGRACIÓN CON APICONFIG (2026-09-01):
 * Si assets/js/api-config.js está cargado, esta variable
 * se actualiza automáticamente con el valor de ApiConfig.
 * 
 * Si ApiConfig no está disponible, se mantiene la URL
 * hardcodeada como fallback seguro.
 * 
 * Usar: window.API_URL en servicios
 * O mejor: window.construirUrlApi() para centralización
 */
var API_URL = window.API_URL || '';

// ═══════════════════════════════════════════════════════════════
// FASE 2: Detectar y usar ApiConfig si existe
// ═══════════════════════════════════════════════════════════════
if (!window.API_URL && typeof window.ApiConfig !== 'undefined' && window.ApiConfig.nomina) {
  var apiConfigUrl = window.ApiConfig.nomina.baseUrl;
  if (apiConfigUrl) {
    API_URL = apiConfigUrl;
  }
} else {
}

window.API_URL = API_URL;

/**
 * Formatea un número como moneda colombiana.
 * Ejemplo: fmt(1500000) → "1.500.000"
 * @param {number|string} n
 * @returns {string}
 */
function fmt(n) {
  var v = Number(n) || 0;
  return v.toLocaleString('es-CO');
}
