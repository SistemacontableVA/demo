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
    var brand = (window.empresaBrand && typeof window.empresaBrand.getBrandData === 'function')
      ? window.empresaBrand.getBrandData()
      : null;

    return {
      nombreSistema: 'Portal de Nómina',
      empresa:       brand ? brand.nombre : '',
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
