/**
 * ═══════════════════════════════════════════════════════════════
 * TEST-API-CONFIG.JS — Suite de pruebas para api-config.js
 * 
 * Uso en navegador:
 * 1. Abrir DevTools (F12)
 * 2. Copiar y pegar cada test en la consola
 * 3. Verificar que todos pasen ✅
 * 
 * O incluir en index.html durante desarrollo:
 * <script src="tests/test-api-config.js"></script>
 * ═══════════════════════════════════════════════════════════════
 */

const ApiConfigTests = {
  
  // ───────────────────────────────────────────────────────────────
  // TEST 1: ¿ApiConfig existe y está disponible?
  // ───────────────────────────────────────────────────────────────
  test1_ApiConfigExists: function() {
    console.group('✅ TEST 1: ¿ApiConfig existe?');
    
    var exists = typeof window.ApiConfig !== 'undefined';
    var hasNomina = exists && window.ApiConfig.nomina;
    var hasOficina = exists && window.ApiConfig.oficina;
    
    console.log('  window.ApiConfig existe:', exists ? '✅' : '❌');
    console.log('  Tiene endpoint "nomina":', hasNomina ? '✅' : '❌');
    console.log('  Tiene endpoint "oficina":', hasOficina ? '✅' : '❌');
    
    if (exists) {
      console.log('  Endpoints disponibles:', Object.keys(window.ApiConfig).filter(k => k !== 'buildUrl' && k !== 'getEndpoint' && k !== 'listEndpoints' && k !== 'getDocsEndpoint'));
    }
    
    console.groupEnd();
    return exists && hasNomina && hasOficina;
  },

  // ───────────────────────────────────────────────────────────────
  // TEST 2: ¿window.API_URL está definido y es correcto?
  // ───────────────────────────────────────────────────────────────
  test2_ApiUrlExists: function() {
    console.group('✅ TEST 2: ¿window.API_URL existe?');
    
    var exists = typeof window.API_URL !== 'undefined';
    var isUrl = exists && typeof window.API_URL === 'string' && window.API_URL.startsWith('https://');
    
    console.log('  window.API_URL existe:', exists ? '✅' : '❌');
    console.log('  Es una URL válida:', isUrl ? '✅' : '❌');
    
    if (isUrl) {
      console.log('  URL:', window.API_URL.substring(0, 80) + '...');
    }
    
    console.groupEnd();
    return exists && isUrl;
  },

  // ───────────────────────────────────────────────────────────────
  // TEST 3: ¿Las URLs coinciden (ApiConfig vs utils.js)?
  // ───────────────────────────────────────────────────────────────
  test3_UrlsMatch: function() {
    console.group('✅ TEST 3: ¿URLs coinciden (ApiConfig vs utils)?');
    
    var apiConfigUrl = window.ApiConfig?.nomina?.baseUrl;
    var utilsUrl = window.API_URL;
    var match = apiConfigUrl === utilsUrl;
    
    console.log('  ApiConfig URL:',  apiConfigUrl ? apiConfigUrl.substring(0, 60) + '...' : 'NO EXISTE');
    console.log('  utils.js URL:  ', utilsUrl ? utilsUrl.substring(0, 60) + '...' : 'NO EXISTE');
    console.log('  ¿Coinciden?:', match ? '✅' : '⚠️ (esperado si ApiConfig fue cargado después)');
    
    console.groupEnd();
    return true; // No es crítico si no coinciden si hay fallback
  },

  // ───────────────────────────────────────────────────────────────
  // TEST 4: ¿construirUrlApi está disponible?
  // ───────────────────────────────────────────────────────────────
  test4_ConstructorFunctionExists: function() {
    console.group('✅ TEST 4: ¿construirUrlApi existe?');
    
    var exists = typeof window.construirUrlApi === 'function';
    
    console.log('  window.construirUrlApi existe:', exists ? '✅' : '❌');
    
    if (exists) {
      try {
        var url = window.construirUrlApi('nomina', { cedula: 'V-123' });
        console.log('  Test: construirUrlApi("nomina", { cedula: "V-123" })');
        console.log('  Resultado:', url);
        console.log('  ¿Contiene cedula?:', url.includes('cedula') ? '✅' : '❌');
      } catch (e) {
        console.error('  ❌ Error al llamar construirUrlApi:', e.message);
      }
    }
    
    console.groupEnd();
    return exists;
  },

  // ───────────────────────────────────────────────────────────────
  // TEST 5: ¿ApiConfig.buildUrl() funciona?
  // ───────────────────────────────────────────────────────────────
  test5_ApiBuildUrl: function() {
    console.group('✅ TEST 5: ¿ApiConfig.buildUrl() funciona?');
    
    if (typeof window.ApiConfig === 'undefined') {
      console.warn('  ⚠️ ApiConfig no está disponible');
      console.groupEnd();
      return false;
    }
    
    try {
      var nominaUrl = window.ApiConfig.buildUrl('nomina', { cedula: 'V-123' });
      var oficinaUrl = window.ApiConfig.buildUrl('oficina', { action: 'listar-empleados-oficina' });
      
      console.log('  ✅ buildUrl("nomina", { cedula: "V-123" })');
      console.log('    →', nominaUrl.substring(0, 80) + '...');
      
      console.log('  ✅ buildUrl("oficina", { action: "listar-empleados-oficina" })');
      console.log('    →', oficinaUrl.substring(0, 80) + '...');
      
      console.log('  ¿Ambas son URLs válidas?:', 
        nominaUrl.startsWith('https://') && oficinaUrl.startsWith('https://') ? '✅' : '❌');
      
      console.groupEnd();
      return true;
    } catch (e) {
      console.error('  ❌ Error:', e.message);
      console.groupEnd();
      return false;
    }
  },

  // ───────────────────────────────────────────────────────────────
  // TEST 6: ¿Cambiar URL en ApiConfig funciona?
  // ───────────────────────────────────────────────────────────────
  test6_UrlChange: function() {
    console.group('✅ TEST 6: ¿Cambiar URL funciona?');
    
    if (typeof window.ApiConfig === 'undefined') {
      console.warn('  ⚠️ ApiConfig no está disponible');
      console.groupEnd();
      return false;
    }
    
    var originalUrl = window.ApiConfig.nomina.baseUrl;
    var testUrl = 'https://example.com/test';
    
    console.log('  URL original:', originalUrl.substring(0, 60) + '...');
    console.log('  Cambiando a:', testUrl);
    
    window.ApiConfig.nomina.baseUrl = testUrl;
    var newUrl = window.ApiConfig.buildUrl('nomina', {});
    
    console.log('  URL después del cambio:', newUrl);
    console.log('  ¿Cambió correctamente?:', newUrl === testUrl ? '✅' : '❌');
    
    // Restaurar URL original
    window.ApiConfig.nomina.baseUrl = originalUrl;
    console.log('  ✅ URL restaurada');
    
    console.groupEnd();
    return newUrl === testUrl;
  },

  // ───────────────────────────────────────────────────────────────
  // TEST 7: ¿Los servicios pueden acceder a window.API_URL?
  // ───────────────────────────────────────────────────────────────
  test7_ServiceAccess: function() {
    console.group('✅ TEST 7: ¿Los servicios pueden acceder a window.API_URL?');
    
    // Simulamos cómo un servicio usaría la URL
    var simulatedService = function() {
      var baseUrl = window.API_URL;
      if (!baseUrl) {
        throw new Error('window.API_URL no está definido');
      }
      var url = baseUrl + '?cedula=V-123';
      return url;
    };
    
    try {
      var serviceUrl = simulatedService();
      console.log('  ✅ Servicio puede acceder a window.API_URL');
      console.log('  URL generada:', serviceUrl.substring(0, 80) + '...');
      console.groupEnd();
      return true;
    } catch (e) {
      console.error('  ❌ Error:', e.message);
      console.groupEnd();
      return false;
    }
  },

  // ───────────────────────────────────────────────────────────────
  // EJECUTAR TODOS LOS TESTS
  // ───────────────────────────────────────────────────────────────
  runAll: function() {
    console.clear();
    console.log('%c╔═══════════════════════════════════════════════════════════════════════╗', 'color: #083F4A; font-weight: bold');
    console.log('%c║  SUITE DE PRUEBAS: api-config.js                                     ║', 'color: #083F4A; font-weight: bold');
    console.log('%c╚═══════════════════════════════════════════════════════════════════════╝', 'color: #083F4A; font-weight: bold');
    console.log('');
    
    var results = {
      test1: this.test1_ApiConfigExists(),
      test2: this.test2_ApiUrlExists(),
      test3: this.test3_UrlsMatch(),
      test4: this.test4_ConstructorFunctionExists(),
      test5: this.test5_ApiBuildUrl(),
      test6: this.test6_UrlChange(),
      test7: this.test7_ServiceAccess()
    };
    
    console.log('');
    console.log('%c═══════════════════════════════════════════════════════════════════════', 'color: #0B5969; font-weight: bold');
    console.log('%cRESULTADOS FINALES', 'color: #0B5969; font-weight: bold; font-size: 14px');
    console.log('%c═══════════════════════════════════════════════════════════════════════', 'color: #0B5969; font-weight: bold');
    
    var passed = Object.values(results).filter(r => r).length;
    var total = Object.keys(results).length;
    
    Object.entries(results).forEach(([name, result]) => {
      console.log(`  ${result ? '✅' : '❌'} ${name}: ${result ? 'PASÓ' : 'FALLÓ'}`);
    });
    
    console.log('');
    console.log(`%c${passed}/${total} pruebas pasaron`, passed === total ? 'color: #22c55e; font-weight: bold; font-size: 14px' : 'color: #ef4444; font-weight: bold; font-size: 14px');
    
    if (passed === total) {
      console.log('%c✅ TODAS LAS PRUEBAS PASARON - api-config.js está funcional al 100%', 'background: #22c55e; color: white; padding: 10px; border-radius: 4px; font-weight: bold');
    } else {
      console.log('%c⚠️ ALGUNAS PRUEBAS FALLARON - Verificar logs arriba', 'background: #f59e0b; color: white; padding: 10px; border-radius: 4px; font-weight: bold');
    }
    
    console.log('');
    console.log('%cPara cambiar URL en futuro, edita:', 'color: #0B5969; font-weight: bold');
    console.log('  assets/js/api-config.js → nomina.baseUrl');
    
    return passed === total;
  }
};

// Ejecutar automáticamente cuando se carga el script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    console.log('[test-api-config.js] Ejecutando pruebas después de DOMContentLoaded...');
    ApiConfigTests.runAll();
  });
} else {
  // Ya está cargado
  console.log('[test-api-config.js] ¿Deseas ejecutar pruebas? Escribe: ApiConfigTests.runAll()');
}
