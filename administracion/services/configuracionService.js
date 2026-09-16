/* ============================================================
   CONFIGURACIONSERVICE.JS — Servicio de configuración del sistema
   Módulo Administración · Óptica Visión de Águila

   ESTADO: Stub base. Implementar cuando se integre backend.
   ============================================================ */

var ConfiguracionService = {

  /**
   * Retorna la configuración actual del sistema.
   * TODO: Leer desde localStorage o base de datos.
   * @returns {object}
   */
  obtener: function () {
    return {
      nombreSistema: 'Portal de Nómina',
      empresa:       'Óptica Visión de Águila',
      version:       'v5.0'
    };
  },

  /**
   * Guarda la configuración del sistema.
   * TODO: Persistir en localStorage o base de datos.
   * @param {object} datos
   */
  guardar: function (datos) {
    return Promise.resolve({ ok: true });
  }

};
