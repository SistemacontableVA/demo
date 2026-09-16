/* ============================================================
   METACONFIG.JS — Configuración de la API de Meta (WhatsApp)
   Módulo Recordatorio Masivo · Óptica Visión de Águila

   ESTADO ACTUAL: MODO SIMULADO (credenciales pendientes)

   Cuando tengas las credenciales reales de Meta:
     1. Reemplaza META_PHONE_NUMBER_ID con el ID numérico
        obtenido en Meta Developers > WhatsApp > Configuración de la API
     2. Reemplaza META_ACCESS_TOKEN con el token permanente
        generado desde el Administrador de Sistema de Meta
     3. Cambia META_MODO_SIMULADO a false

   Con META_MODO_SIMULADO = true:
     - No se realizan llamadas reales a Meta
     - Cada paciente se marca como "Enviado (Simulado) ✅" tras 500ms
     - No se consume cuota de mensajes
   ============================================================ */

var MetaConfig = {

  // ── Credenciales de la API ─────────────────────────────────
  PHONE_NUMBER_ID: '1255054461032051',  // Ej: "123456789012345"
  ACCESS_TOKEN:    'EAA0JfF1NtxMBSaJVxAWDUAZAe3qQMCRc5vuNaq8DZC1p5brPaHwCAQUCNH128dLmBbGGbGEi1YQ54m80LGqCwohEQvKUcTk0AkkAYvYz08AZAVrVFdekIN3GDPZBLlO5dxn391wDlDoKbETf0tsnZCZBuU2rKtQtijdCYbyTeVk8yGDJ7pV7LcPq2ZCTAjYkJvVZCQbqwKQEUuKVVlxX8QXcFaeg4iRwdgm28veUamX6kiJfpzzSW46ImxbhMBe226ZAZAxNNPTjIqerMiIULhjx9G',         // Token permanente de Meta
  API_VERSION:     'v18.0',

  // ── Nombres de plantillas aprobadas en Meta ────────────────
  TEMPLATE_CONSULTA: 'recordatorio_consulta',
  TEMPLATE_ENTREGA:  'recordatorio_entrega',
  TEMPLATE_LANGUAGE: 'es',

  // ── Modo simulado ──────────────────────────────────────────
  // true  → simula envíos sin llamar a Meta (usar mientras no hay credenciales)
  // false → llama a la API real de Meta
  MODO_SIMULADO: true,
  SIMULADO_DELAY_MS: 500,   // ms de pausa por paciente en modo simulado

  // ── Helpers ───────────────────────────────────────────────

  /** URL base del endpoint de mensajes de Meta */
  getEndpointUrl: function () {
    return 'https://graph.facebook.com/' +
           this.API_VERSION + '/' +
           this.PHONE_NUMBER_ID + '/messages';
  },

  /** Indica si las credenciales reales están configuradas */
  credencialesListas: function () {
    return this.PHONE_NUMBER_ID !== 'PENDIENTE_ID_TELEFONO' &&
           this.ACCESS_TOKEN    !== 'PENDIENTE_TOKEN';
  }

};
