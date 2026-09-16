# 📖 DOCUMENTACIÓN: ESTRUCTURA DE empresa-config.json

**Versión**: 1.0  
**Última actualización**: 31 Agosto 2026  
**Estado**: ✅ COMPLETO - Listo para usar

---

## 📋 TABLA DE CONTENIDOS

| Sección | Propósito | Campos |
|---------|-----------|--------|
| `empresa` | Datos legales y básicos | Nombre, RIF, versión |
| `contacto` | Información de contacto | Teléfono, email, dirección |
| `empresa_operativa` | Datos operacionales | Equipo, horarios, políticas |
| `branding` | Identidad visual | Logos, colores |
| `documentos` | Definiciones de documentos | Descripciones, tipos |
| `municipios_operativos` | Municipios donde opera | Lista de ciudades |
| `usuarios_sistema` | Roles y permisos | Admin, secretaria, coordinador, promotor |
| `configuracion_sistema` | Parámetros del sistema | Tema, idioma, zona horaria |
| `integraciones` | Servicios externos | WhatsApp, Google Drive, Google Sheets |
| `metadata` | Información del proyecto | Desarrollador, host, ambiente |

---

## 🔍 ESTRUCTURA DETALLADA

### 1. **`empresa`** - Datos Legales

```json
"empresa": {
  "nombre": "Óptica Visión de Águila",           // Nombre completo mostrado en UI
  "nombreCorto": "Visión de Águila",             // Para espacios reducidos
  "nombreLegal": "Óptica Visión de Águila C.A.", // Para documentos oficiales
  "rif": "J-506434377",                          // RIF fiscal
  "activo": true,                                // Estado operativo
  "versionSistema": "v5.0",                      // Versión actual del sistema
  "descripcion": "Empresa líder en..."           // Descripción corporativa
}
```

**Usado en:**
- Títulos de páginas
- Documentos legales
- Nóminas
- Títulos de navegación

---

### 2. **`contacto`** - Información de Contacto

```json
"contacto": {
  "telefonoWhatsApp": "+573027350587",              // WhatsApp de contacto (botón extender licencia)
  "telefonoGeneral": "+58-0412-7552868",            // Teléfono principal (documentos)
  "telefonoSecundario": "+58-0424-6592968",         // Teléfono alternativo
  "email": "OPTICAVISIONDEAGUILA@GMAIL.COM",       // Email corporativo (permisos)
  "emailAlternativo": "info@visiondeaguila.com",    // Email alternativo
  "direccion": "SECTOR HATICO 2 AV...",            // Dirección completa
  "municipio": "Maracaibo",                        // Municipio principal
  "estado": "Zulia",                               // Estado/provincia
  "pais": "Venezuela",                             // País
  "codePostal": "4001"                             // Código postal
}
```

**Usado en:**
- Plantillas de documentos (hoja-convenio, permisos)
- Footer de páginas
- Botón WhatsApp
- Links de contacto

---

### 3. **`empresa_operativa`** - Datos Operacionales

```json
"empresa_operativa": {
  "equipoDefault": 5,                                      // Cantidad de personas en brigada
  "equipoDescripcion": "equipo que consta de 5 personas",  // Descripción del equipo
  "horaInicio": "7:30 am",                                 // Hora de inicio de jornadas
  "horaFin": "5:30 pm",                                    // Hora de finalización
  "comportamientoPolitica": "mantendrán el comportamiento y compostura debida",  // Política
  "tiempoEntrega": "5 a 7 días hábiles"                   // Tiempo de entrega promedio
}
```

**Usado en:**
- Hoja de convenio
- Permisos
- Descripciones de brigadas

---

### 4. **`branding`** - Identidad Visual

```json
"branding": {
  "logoSvg": "logomenu.svg",                    // Nombre del archivo SVG
  "logoPng": "logomenu.png",                    // Nombre del archivo PNG
  "logoUrlLocal": "/assets/images/logomenu.svg",  // URL local SVG (servidor)
  "logoPngLocal": "/assets/images/logomenu.png",  // URL local PNG (servidor)
  "logoGithub": "https://raw.githubusercontent.com/...",  // URL GitHub (fallback)
  "colores": {
    "primario": "#083F4A",    // Verde oscuro principal
    "secundario": "#0B5969",  // Verde secundario
    "acento": "#D9A62E",      // Dorado acentos
    "fondo": "#dfe7e9"        // Gris claro fondo
  }
}
```

**Usado en:**
- `empresaConfig.getLogoDinamico()` → retorna logo SVG
- Plantillas HTML (img src)
- CSS personalizado
- Estilos dinámicos

---

### 5. **`documentos`** - Definiciones de Plantillas

```json
"documentos": {
  "solicitudInstucional": {
    "descripcion": "Solicitud formal para autorización...",
    "tipoServicio": "Consulta por Primera Vez de Optometría..."
  },
  "solicitudEspacio": {
    "descripcion": "Solicitud de espacio...",
    "tipoServicio": "Consulta por Primera Vez..."
  },
  // ... más documentos
}
```

**Usado en:**
- Descripciones de documentos en UI
- Tipos de servicio en nóminas
- Historiales de brigadas

---

### 6. **`municipios_operativos`** - Zonas de Cobertura

```json
"municipios_operativos": [
  "Maracaibo",
  "San Francisco",
  "Santa Rita",
  "La Cañada de Urdaneta",
  "Cabimas",
  "Ciudad Ojeda",
  "Lagunillas"
]
```

**Usado en:**
- Filtros de búsqueda
- Validación de municipios
- Reportes por zona

---

### 7. **`usuarios_sistema`** - Roles y Permisos

```json
"usuarios_sistema": {
  "admin": {
    "descripcion": "Administrador del sistema - acceso a todo",
    "permisos": ["ver_administracion", "ver_catalogos", "ver_configuracion", ...]
  },
  "secretaria": {
    "descripcion": "Secretaria - gestión de nóminas",
    "permisos": ["ver_nominas", "ingresar_nominas", "ver_reportes"]
  },
  "coordinador": { ... },
  "promotor": { ... }
}
```

**Usado en:**
- Control de acceso
- Menú navegación (ocultar/mostrar)
- Restricción de funciones

---

### 8. **`configuracion_sistema`** - Parámetros Globales

```json
"configuracion_sistema": {
  "tema": "light",                    // light | dark
  "idioma": "es",                     // es | en
  "zona_horaria": "America/Caracas",  // IANA timezone
  "formato_fecha": "DD/MM/YYYY",      // Formato de fechas
  "formato_moneda": "USD",            // Moneda
  "cache_minutos": 5,                 // Cache de config (5 min)
  "sesion_minutos": 120               // Duración de sesión
}
```

**Usado en:**
- Formateo de fechas
- Formato de números
- Duración de sesiones
- Estilos globales

---

### 9. **`integraciones`** - Servicios Externos

```json
"integraciones": {
  "whatsapp": {
    "habilitado": true,
    "numero": "+573027350587",
    "mensaje_licencia": "Buenas tardes, deseo extender..."
  },
  "google_drive": {
    "habilitado": true,
    "carpeta_ventas": "1LRwTimG26evV5mREqh66npjp26LE7mb6"
  },
  "google_sheets": {
    "habilitado": true,
    "habilitado_para_scripts": true
  }
}
```

**Usado en:**
- Botón WhatsApp
- Links a Google Drive
- Sincronización con Google Sheets
- Google Apps Script

---

### 10. **`metadata`** - Información del Proyecto

```json
"metadata": {
  "desarrollador": "KGServices",
  "host": "Óptica Visión de Águila",
  "proyecto": "Sistema de Nómina y Gestión de Brigadas",
  "ambiente": "produccion",  // produccion | desarrollo
  "soporte_email": "soporte@kgservices.com"
}
```

**Usado en:**
- Footer con información de contacto
- Identificación en reportes
- Auditoría de cambios

---

## 🔄 CÓMO USAR EN CÓDIGO

### **En JavaScript**
```javascript
// Ya cargado automáticamente por empresa-config-loader.js

// Acceso simple
var empresa = empresaConfig.get('empresa.nombre');
var logo = empresaConfig.getLogoDinamico();

// Acceso con objetos
var contacto = empresaConfig.getContacto();
console.log(contacto.telefonoWhatsApp);

// Acceso profundo
var email = empresaConfig.get('contacto.email');
```

### **En HTML (dinámico)**
```html
<h1 id="empresa-nombre"></h1>
<img id="logo" alt="Logo">
<a id="whatsapp-link"></a>

<script>
  // Esperar carga de config
  empresaConfig.cargar().then(() => {
    document.getElementById('empresa-nombre').textContent = 
      empresaConfig.get('empresa.nombre');
    
    document.getElementById('logo').src = 
      empresaConfig.getLogoDinamico();
    
    document.getElementById('whatsapp-link').href = 
      'https://wa.me/' + empresaConfig.get('integraciones.whatsapp.numero');
  });
</script>
```

### **En Google Apps Script**
```javascript
function obtenerConfig() {
  var url = 'https://tudominio.com/empresa-config.json';
  var response = UrlFetchApp.fetch(url);
  var config = JSON.parse(response.getContentText());
  return config;
}

// Usar
var config = obtenerConfig();
var empresa = config.empresa.nombre;
var telefono = config.contacto.telefonoGeneral;
```

---

## ⏳ CÓMO CAMBIAR LA CONFIGURACIÓN

### **Cambiar nombre empresa**
1. Abre: `empresa-config.json`
2. Modifica: `empresa.nombre`
3. Guarda
4. ✅ Todos los 47 archivos se actualizan automáticamente

### **Cambiar logo**
1. Coloca nuevo logo en: `/assets/images/nuevo-logo.svg`
2. Abre: `empresa-config.json`
3. Modifica: `branding.logoSvg = "nuevo-logo.svg"`
4. Guarda
5. ✅ Logo actualizado en todo el sistema

### **Agregar teléfono**
1. Abre: `empresa-config.json`
2. Modifica: `contacto.telefonoSecundario`
3. Guarda
4. ✅ Teléfono disponible en plantillas dinámicas

---

## ✅ CHECKLIST ANTES DE USAR

- [ ] Todos los datos de empresa completados
- [ ] Teléfonos con formato correcto (+58...)
- [ ] Email correcto
- [ ] Dirección actualizada
- [ ] Logo SVG en `/assets/images/logomenu.svg`
- [ ] Logo PNG en `/assets/images/logomenu.png`
- [ ] RIF correcto
- [ ] Municipios de operación actualizados
- [ ] Usuario de GitHub verificado (para github logo URL)

---

## 🚀 SIGUIENTE PASO

Con este archivo completo, ahora podemos:

1. ✅ Implementar en JavaScript
2. ✅ Actualizar plantillas HTML
3. ✅ Eliminar hardcodeados de 47 archivos
4. ✅ Hacer el sistema comercializable

**¿Aprobado? ¿Quieres que continúe con la implementación?**
