/* ============================================================
   EMPRESACONFIG-LOADER.JS — Cargador centralizado de configuración
   Sistema de Nómina · Óptica Visión de Águila
   
   DESCRIPCIÓN:
   Carga la configuración centralizada desde empresa-config.json
   Proporciona métodos seguros para acceder a datos de empresa
   
   USO:
   1. Cargar: await empresaConfig.cargar()
   2. Obtener: empresaConfig.get('empresa.nombre')
   
   ============================================================ */

class EmpresaConfigLoader {
  constructor() {
    this.config = null;
    this.cacheTime = 5 * 60 * 1000; // 5 minutos
    this.lastFetch = 0;
  }

  /**
   * Cargar configuración desde empresa-config.json
   */
  async cargar(forceReload = false) {
    try {
      // 1. VERIFICAR CACHE
      if (!forceReload && this.isCacheValid()) {
        return this.config;
      }

      // 2. FETCH desde servidor
      const response = await fetch('/empresa-config.json', {
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: No se pudo cargar configuración`);
      }

      const json = await response.json();

      // 3. VALIDAR ESTRUCTURA
      if (!this._validarEstructura(json)) {
        throw new Error('Estructura de configuración inválida');
      }

      // 4. GUARDAR EN CACHE Y MEMORY
      this.config = json;
      this.lastFetch = Date.now();

      // 5. GUARDAR EN SESSIONSTRAGE COMO FALLBACK
      sessionStorage.setItem('empresa_config', JSON.stringify(json));
      sessionStorage.setItem('empresa_config_time', Date.now().toString());

      return this.config;

    } catch (error) {
      console.error('[EmpresaConfig] ❌ Error:', error.message);
      
      // FALLBACK: Intentar cargar desde sessionStorage
      const cached = sessionStorage.getItem('empresa_config');
      if (cached) {
        console.warn('[EmpresaConfig] ⚠️ Usando cache de sesión (fallback)');
        this.config = JSON.parse(cached);
        return this.config;
      }

      // FALLBACK: Config por defecto
      console.warn('[EmpresaConfig] ⚠️ Usando configuración por defecto');
      return this._getDefaultConfig();
    }
  }

  /**
   * Obtener valor de configuración (soporta puntos para anidar)
   * Ejemplo: get('empresa.nombre') → "Óptica Visión de Águila"
   */
  get(path) {
    if (!this.config) return null;
    
    const keys = path.split('.');
    let value = this.config;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return null;
      }
    }

    return value;
  }

  /**
   * Verificar si cache es válido
   */
  isCacheValid() {
    return this.config && (Date.now() - this.lastFetch) < this.cacheTime;
  }

  /**
   * Validar estructura de JSON
   */
  _validarEstructura(json) {
    const requeridos = ['version', 'empresa', 'contacto', 'branding'];
    return requeridos.every(key => key in json);
  }

  /**
   * Configuración por defecto (fallback)
   */
  _getDefaultConfig() {
    return {
      version: '1.0',
      empresa: {
        nombre: 'Sistema de Nómina',
        rif: 'N/A',
        versionSistema: 'v5.0'
      },
      contacto: {
        telefonoWhatsApp: '+58-0000-0000',
        email: 'info@empresa.com',
        direccion: 'Dirección no configurada'
      },
      branding: {
        logoSvg: 'assets/images/logomenu.svg',
        logoPng: 'assets/images/logomenu.png'
      }
    };
  }

  /**
   * Recargar forzando actualización del servidor
   */
  async recargar() {
    return this.cargar(true);
  }

  /**
   * Obtener logo (SVG por defecto, PNG como fallback)
   */
  getLogoDinamico(preferSvg = true) {
    if (preferSvg) {
      return this.get('branding.logoSvg') || this.get('branding.logoPng');
    }
    return this.get('branding.logoPng') || this.get('branding.logoSvg');
  }

  /**
   * Obtener datos completos de empresa
   */
  getEmpresa() {
    return this.get('empresa') || {};
  }

  /**
   * Obtener datos completos de contacto
   */
  getContacto() {
    return this.get('contacto') || {};
  }

  /**
   * Obtener datos de branding
   */
  getBranding() {
    return this.get('branding') || {};
  }
}

// Instancia global
const empresaConfig = new EmpresaConfigLoader();

// Auto-cargar al incluir este script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    empresaConfig.cargar();
  });
} else {
  empresaConfig.cargar();
}
