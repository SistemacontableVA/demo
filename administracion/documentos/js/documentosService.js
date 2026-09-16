/* ============================================================
   DOCUMENTOSSERVICE.JS — Capa de servicio para Google Apps Script
   Administración > Documentos · Óptica Visión de Águila

   ESTADO: Arquitectura preparada — comunicación pendiente.

   Este archivo es el único punto de contacto entre el módulo
   Documentos y el proyecto de Google Apps Script existente
   (Code.gs + Formulario.html).

   Para implementar la integración real, solo debes:
   1. Completar DOCS_API_URL con la URL del Web App publicado.
   2. Implementar el cuerpo de generarDocumento().
   3. No es necesario modificar ningún otro archivo.
   ============================================================ */

// ── URL del Web App de Google Apps Script ──
// Reemplaza este valor con la URL real al publicar el proyecto GAS.
const DOCS_API_URL = '';

/**
 * Genera un documento enviando los datos del formulario al Apps Script.
 * @param {string} tipo    - Tipo de documento (ej: 'solicitud-institucional')
 * @param {Object} datos   - Objeto con los campos del formulario
 * @returns {Promise<Object>} Respuesta del servidor (URL del doc generado, etc.)
 *
 * TODO: Implementar cuando DOCS_API_URL esté disponible.
 */
async function generarDocumento(tipo, datos) {
  if (!DOCS_API_URL) {
    throw new Error('[DocumentosService] DOCS_API_URL no está configurada.');
  }

  const res = await fetch(DOCS_API_URL, {
    method: 'POST',
    body: JSON.stringify({ tipo, datos }),
    headers: { 'Content-Type': 'application/json' }
  });

  if (!res.ok) {
    throw new Error(`[DocumentosService] Error del servidor: ${res.status}`);
  }

  return res.json();
}

/**
 * Obtiene la lista de plantillas disponibles desde el Apps Script.
 * @returns {Promise<Array>} Lista de plantillas registradas en el GAS
 *
 * TODO: Implementar cuando DOCS_API_URL esté disponible.
 */
async function obtenerPlantillas() {
  if (!DOCS_API_URL) {
    throw new Error('[DocumentosService] DOCS_API_URL no está configurada.');
  }

  const res = await fetch(`${DOCS_API_URL}?action=plantillas`);
  if (!res.ok) {
    throw new Error(`[DocumentosService] Error del servidor: ${res.status}`);
  }

  return res.json();
}
