// Configuracion del portal
var ConfiguracionService = {

  obtener: function () {
    var brand = (window.empresaBrand && typeof window.empresaBrand.getBrandData === 'function')
      ? window.empresaBrand.getBrandData()
      : null;

    return {
      nombreSistema: 'Portal de Nómina',
      empresa:       brand ? brand.nombre : '',
      version:       window.ADMIN_VERSION
    };
  },

  // TODO: conectar con persistencia.
  guardar: function (datos) {
    return Promise.resolve({ ok: true });
  }

};
