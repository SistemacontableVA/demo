# Sistema de Nómina

Aplicación web administrativa de Óptica Visión de Águila.

## Inicio rápido

1. Abre la carpeta en VS Code.
2. Ejecuta `index.html` con Live Server.
3. Usa la dirección `http://127.0.0.1:5500/` que muestre VS Code.

## Estructura

- `index.html`: entrada principal de la aplicación.
- `assets/`: estilos, imágenes y JavaScript global.
- `promotores/`: consulta de nómina de promotores.
- `coordinador/`: módulo del coordinador.
- `administracion/`: acceso, dashboard, reportes y documentos.
- `backend/`: archivos de Google Apps Script.
- `tests/`: pruebas ejecutables con Node.js.
- `documentacion/`: planes, análisis, guías y resúmenes del proyecto.
- `empresa-config.json`: configuración de empresa y branding.

## Documentación

La documentación está centralizada en `documentacion/`. Para saber qué hacer, revisa primero:

1. `documentacion/PLAN_IMPLEMENTACION.md`
2. `documentacion/GUIA_CONFIGURACION_APIS.md`
3. `documentacion/VERIFICACION_API_CONFIG.md`
4. `documentacion/PLAN_MODULO_CARGA_DE_LENTES.md`

Los archivos `RESUMEN_*.txt`, `ANALISIS_*.md` y `UBICACION_ELEMENTOS_SISTEMA.md` sirven como referencia y contexto histórico.

## Pruebas

Desde la raíz del proyecto:

```powershell
node --test tests/branding-templates.test.js
```

Las URLs de API se mantienen en `assets/js/api-config.js`, que está excluido del control de versiones por seguridad.
