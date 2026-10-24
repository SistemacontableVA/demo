var MetaConfig = {

  // ── Nombres de plantillas aprobadas en Meta ────────────────
  TEMPLATE_CONSULTA: 'recordatorio_consulta',
  TEMPLATE_ENTREGA:  'recordatorio_entrega',
  TEMPLATE_LANGUAGE: 'es_CO',

  PROXY_URL: 'https://script.google.com/macros/s/AKfycbyDBpp-Lef4vFWCblQyRNnWUdD2gi1MaCacu1Qv-y5axZLImEvSeDyhd1_mDnrt-NDPZQ/exec',

  // ── Modo simulado ──────────────────────────────────────────
  // true  → simula envíos sin llamar al proxy
  // false → envía por el GAS autenticado; nunca usar credenciales en el navegador
  MODO_SIMULADO: true,
  SIMULADO_DELAY_MS: 500,   // ms de pausa por paciente en modo simulado

  // ── Helpers ───────────────────────────────────────────────
  getProxyUrl: function () {
    return this.PROXY_URL;
  }

};
