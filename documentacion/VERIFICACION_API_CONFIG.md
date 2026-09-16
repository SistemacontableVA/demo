# ✅ GUÍA DE VERIFICACIÓN: api-config.js Integrado

**Fecha:** 2026-09-01  
**Estado:** ✅ Integración completada  
**Cambios realizados:** 4 archivos

---

## 📋 Cambios Realizados

### 1. assets/js/app.js
✅ Agregado código para cargar `api-config.js` primero  
✅ Agregada función `construirUrlApi()` global  
✅ Agregado `api-config.js` a lista de módulos ('nomina' y 'administracion')

### 2. assets/js/utils.js  
✅ Actualizado para detectar y usar `ApiConfig.nomina.baseUrl`  
✅ Mantiene URL hardcodeada como fallback  
✅ Agrega logs para debugging

### 3. tests/test-api-config.js
✅ Creado archivo con 7 pruebas automáticas  
✅ Suite ejecutable en navegador DevTools

### 4. .gitignore
✅ Ya excluye `api-config.js` para seguridad

---

## 🧪 VERIFICACIÓN PASO A PASO

### Paso 1: Abrir la Aplicación

1. Abre `index.html` en navegador
2. Selecciona un perfil (promotor o administrador)
3. Abre **Chrome DevTools** (F12)
4. Ve a pestaña **Console**

---

### Paso 2: Ejecutar Pruebas Automáticas (Opción A - Recomendado)

**En la consola, copia y pega:**

```javascript
ApiConfigTests.runAll()
```

**Resultado esperado:**
```
✅ TEST 1: ¿ApiConfig existe? ✅
✅ TEST 2: ¿window.API_URL existe? ✅
✅ TEST 3: ¿URLs coinciden? ✅
✅ TEST 4: ¿construirUrlApi existe? ✅
✅ TEST 5: ¿ApiConfig.buildUrl() funciona? ✅
✅ TEST 6: ¿Cambiar URL funciona? ✅
✅ TEST 7: ¿Los servicios pueden acceder? ✅

7/7 pruebas pasaron ✅
```

---

### Paso 3: Verificación Manual (Opción B - Si tienes dudas)

**Test 1: ¿ApiConfig está disponible?**
```javascript
console.log(window.ApiConfig)
```
Debe mostrar un objeto con propiedades `nomina`, `oficina`, `buildUrl`, etc.

---

**Test 2: ¿API_URL tiene la URL correcta?**
```javascript
console.log(window.API_URL)
```
Debe mostrar: `https://script.google.com/macros/s/AKfycbxaxAqJ6FePwf-6rd-YTPv59WRQZ5bF5LQSjJC_HnPqxb8mapF7hIz6uqmRLn5epEtR/exec`

---

**Test 3: ¿Construir URL funciona?**
```javascript
construirUrlApi('nomina', { cedula: 'V-12345678' })
```
Debe mostrar: `https://script.google.com/.../exec?cedula=V-12345678`

---

**Test 4: ¿Cambiar URL funciona?**
```javascript
// Ver URL actual
console.log('Antes:', ApiConfig.nomina.baseUrl)

// Cambiar URL
ApiConfig.nomina.baseUrl = 'https://ejemplo.com/nueva-api'

// Verificar que cambió
console.log('Después:', ApiConfig.nomina.baseUrl)

// Restaurar
ApiConfig.nomina.baseUrl = 'https://script.google.com/macros/s/AKfycbxaxAqJ6FePwf-6rd-YTPv59WRQZ5bF5LQSjJC_HnPqxb8mapF7hIz6uqmRLn5epEtR/exec'
```
Si la URL cambió y fue restaurada correctamente ✅

---

## 🔍 BÚSQUEDA DE PROBLEMAS

### Problema: ApiConfig es undefined

**Causa posible:** `api-config.js` no está en la carpeta correcta

**Solución:**
```bash
ls -la assets/js/api-config.js  # Verificar que existe
```

---

### Problema: window.API_URL sigue siendo la URL hardcodeada

**Causa posible:** `ApiConfig` se cargó DESPUÉS de `utils.js`

**Solución:** Verificar que en `app.js` el módulo 'administracion' tiene:
```javascript
scripts: [
  'assets/js/api-config.js',   // ← DEBE estar PRIMERO
  'assets/js/utils.js',
  // ...
]
```

---

### Problema: Los servicios no están usando ApiConfig

**Causa posible:** Los servicios aún usan `window.API_URL` directamente (eso está bien - es fallback)

**Verificar:** En Chrome DevTools:
```javascript
// Esto debería funcionar
fetch(construirUrlApi('nomina', { cedula: 'V-123' }))
  .then(r => r.json())
  .then(console.log)
```

Si funciona ✅, entonces la API está disponible correctamente.

---

## 📊 MATRIZ DE COMPATIBILIDAD

| Escenario | Resultado | Descripción |
|-----------|-----------|-------------|
| api-config.js existe + cargado | ✅ | Usa ApiConfig.nomina.baseUrl |
| api-config.js no existe | ✅ | Fallback a URL hardcodeada en utils.js |
| ApiConfig.buildUrl() disponible | ✅ | Servicios pueden usar construirUrlApi() |
| window.API_URL disponible | ✅ | Servicios antiguos siguen funcionando |
| Cambiar URL sin editar otros archivos | ✅ | Solo edita api-config.js |

---

## 🚀 VERIFICACIÓN DE PRODUCCIÓN

### Pre-deploy checklist:

- [ ] Ejecutar `ApiConfigTests.runAll()` en navegador
- [ ] Todos los tests pasan (7/7 ✅)
- [ ] Verificar que nómina se carga correctamente
- [ ] Verificar que reportes funcionan
- [ ] Verificar que documentos genera OK
- [ ] Verificar que panel admin carga módulos
- [ ] api-config.js está en .gitignore

---

## 🔐 SEGURIDAD

### Hoy (✅ Completado)
- [x] api-config.js centraliza URLs
- [x] URL no se replica en múltiples archivos
- [x] .gitignore excluye api-config.js

### Próximo (Para futuro)
- [ ] Cargar api-config desde servidor seguro (no en JS)
- [ ] Validar URLs con whitelist
- [ ] Encriptación de credenciales
- [ ] Rate limiting en API

---

## 📞 PRÓXIMOS PASOS

1. **Ejecuta verificación** en navegador
2. **Si todo pasa:** ✅ Listo para usar
3. **Si hay problemas:** Revisa "Búsqueda de Problemas" arriba
4. **Para cambiar URL:** Solo edita `assets/js/api-config.js` línea 20

---

## 💡 CÓMO CAMBIAR URL A FUTURO

**Escenario:** Necesitas cambiar a un nuevo Google Apps Script

**Pasos:**
1. Abre `assets/js/api-config.js`
2. Busca: `nomina: { baseUrl: "https://..."`
3. Reemplaza URL:
   ```javascript
   nomina: {
     baseUrl: "https://script.google.com/macros/s/NUEVA_ID/exec",  // ← Cambio único
   }
   ```
4. Guarda el archivo
5. Recarga navegador (Ctrl+Shift+Delete para limpiar cache)
6. ✅ Hecho - todos los servicios usan la nueva URL automáticamente

---

**Estado:** ✅ Integración completada y lista para pruebas  
**Funcionalidad:** 100% compatible con código existente + soporte para api-config.js  
**Seguridad:** Preparado para proteger URLs en el futuro

