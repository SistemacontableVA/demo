(function () {
  const DEFAULT_BRAND = {
    empresa: {
      nombre: 'Empresa no configurada',
      nombreCorto: 'Empresa no configurada'
    },
    contacto: {
      email: '',
      telefonoGeneral: '',
      telefonoSecundario: '',
      direccion: ''
    },
    branding: {
      logoUrlLocal: 'assets/images/logomenu.png',
      logoPngLocal: 'assets/images/logomenu.png'
    }
  };

  function getBrandSource() {
    if (window.EMPRESA_BRAND && typeof window.EMPRESA_BRAND === 'object') {
      return window.EMPRESA_BRAND;
    }
    return DEFAULT_BRAND;
  }

  function getBrandData() {
    const source = getBrandSource();
    const empresa = source.empresa || {};
    const contacto = source.contacto || {};
    const branding = source.branding || {};

    const nombre = empresa.nombreLegal || empresa.nombre || empresa.nombreCorto || DEFAULT_BRAND.empresa.nombre;
    const logo = branding.logoUrlLocal || branding.logoPngLocal || branding.logoSvg || branding.logoPng || 'assets/images/logomenu.png';
    const email = contacto.email || DEFAULT_BRAND.contacto.email;
    const direccion = contacto.direccion || DEFAULT_BRAND.contacto.direccion;
    const telefonoGeneral = contacto.telefonoGeneral || contacto.telefonoWhatsApp || DEFAULT_BRAND.contacto.telefonoGeneral;
    const telefonoSecundario = contacto.telefonoSecundario || DEFAULT_BRAND.contacto.telefonoSecundario;
    const telefonos = [telefonoGeneral, telefonoSecundario].filter(Boolean).join(' / ');

    return { nombre, logo, email, direccion, telefonoGeneral, telefonoSecundario, telefonos };
  }

  function applyBrand() {
    const { nombre, logo, email, direccion, telefonos } = getBrandData();

    document.querySelectorAll('[data-empresa-nombre]').forEach(function (el) {
      el.textContent = nombre;
    });

    document.querySelectorAll('[data-empresa-logo]').forEach(function (el) {
      const src = el.dataset.empresaLogo || logo;
      el.setAttribute('src', src);
      if (!el.hasAttribute('alt')) {
        el.setAttribute('alt', nombre);
      }
    });

    document.querySelectorAll('[data-empresa-email]').forEach(function (el) {
      el.textContent = el.dataset.empresaEmail || email;
    });

    document.querySelectorAll('[data-empresa-direccion]').forEach(function (el) {
      el.textContent = el.dataset.empresaDireccion || direccion;
    });

    document.querySelectorAll('[data-empresa-telefonos]').forEach(function (el) {
      el.textContent = el.dataset.empresaTelefonos || telefonos;
    });

    document.querySelectorAll('[data-empresa-telefonos-principal]').forEach(function (el) {
      el.textContent = el.dataset.empresaTelefonosPrincipal || el.textContent || '';
    });

    if (document.title) {
      const titleText = document.title;
      if (titleText.includes('Vision de Aguila') || titleText.includes('Óptica Visión de Águila')) {
        document.title = titleText.replace(/Óptica Visión de Águila|Vision de Aguila/gi, nombre);
      }
    }
  }

  async function cargarBrandDesdeConfig() {
    try {
      const response = await fetch('empresa-config.json', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('No se pudo cargar empresa-config.json');
      }

      const json = await response.json();
      if (json && typeof json === 'object') {
        window.EMPRESA_BRAND = json;
      }
    } catch (error) {
      console.warn('[Brand] Usando brand por defecto:', error.message);
      window.EMPRESA_BRAND = window.EMPRESA_BRAND || DEFAULT_BRAND;
    } finally {
      applyBrand();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      cargarBrandDesdeConfig();
    });
  } else {
    cargarBrandDesdeConfig();
  }

  window.empresaBrand = {
    getBrandData,
    applyBrand,
    cargarBrandDesdeConfig
  };
})();
