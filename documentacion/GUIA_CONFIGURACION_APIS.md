# 📋 GUÍA DE CONFIGURACIÓN Y APIs

## 🎯 Referencia Rápida

### Archivos de Configuración

| Archivo | Propósito | Contenido |
|---------|-----------|----------|
| **empresa-config.json** | Datos de empresa centralizados | Nombre, contacto, branding, permisos |
| **assets/js/api-config.js** | APIs y endpoints | URLs de Google Apps Script, métodos |
| **assets/js/utils.js** | Funciones globales | Utilidades, formateo, inicialización |

---

## 🔑 Cómo Usar Cada Archivo

### 1️⃣ empresa-config.json
**Dónde:** Raíz del proyecto  
**Cuándo usar:** Para datos de empresa que cambian raramente  
**Seguridad:** Contiene datos sensibles (email, teléfono, RIF)

```json
{
  "empresa": { nombre, rif, descripción },
  "contacto": { email, teléfono, dirección },
  "branding": { logo, colores },
  "usuarios_sistema": { roles y permisos },
  "integraciones": { WhatsApp, Google Drive, Sheets }
}
```

**Se carga en:**
- [administracion/config/auth.js](administracion/config/auth.js) → Para validar permisos
- [assets/js/empresa-brand.js](assets/js/empresa-brand.js) → Para inyectar branding

---

### 2️⃣ assets/js/api-config.js  
**Dónde:** assets/js/  
**Cuándo usar:** Para realizar llamadas a APIs de Google Apps Script  
**Seguridad:** ⚠️ Contiene URLs de Web Apps - EXCLUIR en .gitignore  

```javascript
// Ejemplo: Consultar promotor
const url = ApiConfig.buildUrl('nomina', { cedula: 'V-12345678' });
fetch(url)
  .then(r => r.json())
  .then(data => console.log(data));

// Ejemplo: Ver documentación
console.log(ApiConfig.getDocsEndpoint('nomina', 'consultarPromotor'));

// Ejemplo: Listar endpoints disponibles
ApiConfig.listEndpoints('nomina');
// → ['consultarPromotor', 'escribirJornada', 'obtenerReporteLentes', 'dashboard']
```

---

## 🌐 APIs Disponibles

### API de Nómina (Implementada ✅)

**Base URL:**  
```
https://script.google.com/macros/s/AKfycbxaxAqJ6FePwf-6rd-YTPv59WRQZ5bF5LQSjJC_HnPqxb8mapF7hIz6uqmRLn5epEtR/exec
```

**Endpoints:**

#### 1. Consultar Promotor
```javascript
// Obtener datos de un promotor
ApiConfig.buildUrl('nomina', { cedula: 'V-12345678' })

// Respuesta esperada
{
  ok: true,
  data: {
    nombre: "Juan Pérez",
    cedula: "V-12345678",
    municipio: "Maracaibo",
    comision: 15000
  }
}
```
**Usado en:**
- [administracion/js/ingresarNomina.js](administracion/js/ingresarNomina.js#L772)
- [administracion/js/nominaPromotor.js](administracion/js/nominaPromotor.js#L151)
- [promotores/js/nomina.js](promotores/js/nomina.js#L109)

---

#### 2. Escribir Jornada
```javascript
// Guardar registros de nómina diaria
const registros = [
  { cedula: 'V-111', fecha: '2026-09-01', lentes: 5, comision: 50000 },
  { cedula: 'V-222', fecha: '2026-09-01', lentes: 3, comision: 30000 }
];
const url = ApiConfig.buildUrl('nomina', { 
  action: 'escribir-jornada',
  registros: JSON.stringify(registros)
});
```
**Usado en:**
- [administracion/js/ingresarNomina.js](administracion/js/ingresarNomina.js#L498)

---

#### 3. Obtener Reporte de Lentes
```javascript
// Reportes con filtros opcionales
ApiConfig.buildUrl('nomina', {
  action: 'obtener-reporte-lentes',
  fechaInicio: '2026-09-01',
  fechaFin: '2026-09-30',
  municipio: 'Maracaibo'
})

// Respuesta
{
  ok: true,
  kpis: { totalLentes: 1240, promedio: 34.5 },
  rankingPromotores: [ /* array */ ],
  embudoMunicipios: [ /* array */ ],
  municipiosDisponibles: ['Maracaibo', 'Cabimas', ...]
}
```
**Usado en:**
- [administracion/js/reportes.js](administracion/js/reportes.js)
- [administracion/services/reportesService.js](administracion/services/reportesService.js)

---

#### 4. Dashboard
```javascript
// Datos consolidados para dashboard
ApiConfig.buildUrl('nomina', { action: 'dashboard' })

// Respuesta
{
  ok: true,
  kpis: { /* KPIs principales */ },
  resumenMes: { /* Resumen actual */ },
  topPromotores: [ /* Top 5 */ ]
}
```
**Usado en:**
- [administracion/services/dashboardService.js](administracion/services/dashboardService.js)

---

### API de Oficina (Activa ✅)

**Base URL:**  
```
https://script.google.com/macros/s/AKfycbwCD-AptMIXc7mRpQ6pJjel9-3PEIrGdDb2D843xHA0i67ynlwWh4SZ2wE7y-sljKKn/exec
```

**Endpoints:**

#### 1. Listar Empleados de Oficina
```javascript
// Obtener lista de empleados
ApiConfig.buildUrl('oficina', { action: 'listar-empleados-oficina' })

// Respuesta esperada
{
  ok: true,
  empleados: [
    { id: 1, nombre: "Maria García", cedula: "V-111", puesto: "Vendedora", salario: 50000 },
    { id: 2, nombre: "Carlos López", cedula: "V-222", puesto: "Cajero", salario: 40000 }
  ],
  total: 2
}
```
**Usado en:**
- [administracion/services/oficinaNominaService.js](administracion/services/oficinaNominaService.js)
- [administracion/js/oficina.js](administracion/js/oficina.js)

---

#### 2. Crear Empleado de Oficina
```javascript
// Agregar nuevo empleado
const params = {
  action: 'crear-empleado-oficina',
  nombre: 'Juan Pérez',
  cedula: 'V-333',
  puesto: 'Gerente',
  salario: 75000
};
const url = ApiConfig.buildUrl('oficina', params);
```

---

#### 3. Editar Empleado de Oficina
```javascript
// Actualizar datos de empleado
const params = {
  action: 'editar-empleado-oficina',
  id: '1',
  nombre: 'Maria García Updated',
  salario: 55000
};
const url = ApiConfig.buildUrl('oficina', params);
```

---

#### 4. Generar Relación de Pago
```javascript
// Crear documento de relación de pago
const params = {
  action: 'generar-relacion-pago',
  empleadoId: '1',
  mes: '09/2026'
};
const url = ApiConfig.buildUrl('oficina', params);
```

**Usado en:**
- [administracion/services/oficinaNominaService.js](administracion/services/oficinaNominaService.js) - Método generarRelacionPago()

---

## 🔧 Cómo Cambiar una URL de API

### Escenario: Actualizarse a una nueva URL de Google Apps Script

**Paso 1:** Actualizar [assets/js/api-config.js](assets/js/api-config.js)

```javascript
// Antes
nomina: {
  baseUrl: "https://script.google.com/macros/s/OLD_ID/exec",
  ...
}

// Después
nomina: {
  baseUrl: "https://script.google.com/macros/s/NEW_ID/exec",
  ...
}
```

**Paso 2:** Verificar que no hay cachés persistentes
```javascript
// En Chrome DevTools
localStorage.clear();
sessionStorage.clear();
```

**Paso 3:** Recargar la aplicación

✅ Todos los módulos usan automáticamente la nueva URL sin cambios adicionales.

---

## ⚠️ Seguridad

### Qué NO hacer
```
❌ Incluir api-config.js en repositorio público
❌ Compartir URL de Google Apps Script en chats públicos
❌ Dejar URLs hardcodeadas en múltiples archivos
❌ Versionar credenciales en .js files
```

### Qué hacer
```
✅ Agregar api-config.js a .gitignore
✅ En producción: Cargar desde variables de entorno
✅ Centralizar en un archivo único (api-config.js)
✅ Documentar dónde se usan cada URL (comentarios)
```

### Archivo .gitignore
```gitignore
# Configuración de APIs (sensible)
assets/js/api-config.js
administracion/config/auth.js

# Otros sensibles
.env
.env.local
secrets.json
```

---

## 🧪 Testing de APIs

### En Chrome DevTools Console

```javascript
// Verificar que ApiConfig está disponible
console.log(window.ApiConfig);

// Obtener URL de un endpoint
const url = ApiConfig.buildUrl('nomina', { cedula: 'V-12345678' });
console.log(url);

// Probar una llamada
fetch(url)
  .then(r => r.json())
  .then(console.log)
  .catch(e => console.error('Error:', e));

// Ver documentación de un endpoint
console.log(ApiConfig.getDocsEndpoint('nomina', 'consultarPromotor'));
```

---

## 📞 Soporte y Contacto

**Desarrollador:** KGServices  
**Email:** soporte@kgservices.com  
**Documentación adicional:** Ver [ANALISIS_APIS.md](ANALISIS_APIS.md)

---

**Última actualización:** 2026-09-01  
**Versión:** 1.0

