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
