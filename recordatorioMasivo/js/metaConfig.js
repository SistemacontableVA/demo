var MetaConfig = {

  // ── Nombres de plantillas aprobadas en Meta ────────────────
  TEMPLATE_CONSULTA: 'recordatorio_consulta',
  TEMPLATE_ENTREGA:  'recordatorio_entrega',
  TEMPLATE_LANGUAGE: 'es_CO',

  // ── Modo simulado ──────────────────────────────────────────
  // true  → simula envíos sin llamar al proxy
  // false → envía por el GAS autenticado; nunca usar credenciales en el navegador
  MODO_SIMULADO: true,
  SIMULADO_DELAY_MS: 500,   // ms de pausa por paciente en modo simulado

  // ── Helpers ───────────────────────────────────────────────
  getProxyUrl: function () {
    return typeof window !== 'undefined' ? (window.KS_LICENCIAS_URL || '') : '';
  }

};
