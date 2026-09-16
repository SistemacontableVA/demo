/* ============================================================
   DOCUMENTOS.JS — Lógica del módulo Documentos
   Administración > Documentos · Óptica Visión de Águila

   Gestiona la navegación entre tipos de documentos.
   Para agregar un nuevo documento:
     1. Crea su vista en administracion/documentos/views/
     2. Agrégalo a MODULOS en assets/js/app.js
     3. Agrega su tarjeta en documentos.html
   No se modifica este archivo.
   ============================================================ */

/**
 * Navega hacia un formulario de documento específico.
 * Wrapper sobre mostrarModulo() del router principal (app.js).
 * @param {string} tipoDoc - clave del documento en MODULOS (app.js)
 */
function abrirDocumento(tipoDoc) {
  if (typeof mostrarModulo === 'function') {
    mostrarModulo(tipoDoc);
  } else {
    console.error('[Documentos] mostrarModulo no está disponible.');
  }
}

/**
 * Handler genérico para el submit de cualquier formulario de documento.
 * Recolecta los datos del formulario y llama a documentosService.generarDocumento().
 * Muestra el estado al usuario: cargando → éxito / error.
 *
 * @param {Event}  event   - Evento submit del formulario
 * @param {string} tipoDoc - Tipo de documento (coincide con la clave en MODULOS)
 */
async function enviarDocumento(event, tipoDoc) {
  event.preventDefault();

  const form    = event.target;
  const msgEl   = document.getElementById(`doc-msg-${tipoDoc}`);
  const btnEl   = document.getElementById(`btn-generar-${tipoDoc}`);
  const datos   = Object.fromEntries(new FormData(form).entries());

  // Estado: cargando
  btnEl.disabled = true;
  btnEl.textContent = 'Generando...';
  msgEl.className = 'mb-4 text-sm text-center font-medium rounded-lg px-4 py-2 bg-slate-100 text-slate-500';
  msgEl.textContent = 'Preparando documento...';
  msgEl.classList.remove('hidden');

  try {
    // Llama a la capa de servicio (documentosService.js)
    // Esta función lanzará error si DOCS_API_URL no está configurada aún
    const resultado = await generarDocumento(tipoDoc, datos);

    msgEl.className = 'mb-4 text-sm text-center font-medium rounded-lg px-4 py-2 bg-emerald-50 text-emerald-600';
    msgEl.textContent = resultado.mensaje || 'Documento generado correctamente.';

    if (resultado.url) {
      msgEl.innerHTML += ` <a href="${resultado.url}" target="_blank" class="underline font-bold">Abrir documento</a>`;
    }
  } catch (err) {
    msgEl.className = 'mb-4 text-sm text-center font-medium rounded-lg px-4 py-2 bg-rojo-suave text-rojo';
    msgEl.textContent = 'El servicio de documentos aún no está configurado. Se habilitará próximamente.';
    console.warn('[Documentos]', err.message);
  } finally {
    btnEl.disabled = false;
    btnEl.textContent = 'Generar Documento';
  }
}
