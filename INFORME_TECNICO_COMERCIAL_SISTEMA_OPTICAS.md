# Informe técnico y comercial
## Plataforma de gestión para ópticas y jornadas de salud visual

**Fecha de revisión del repositorio:** 17 de octubre de 2026

**Propósito:** evaluación de producto, arquitectura, alcance comercial y oportunidades de evolución.
**Base de análisis:** código y migraciones disponibles en este repositorio. Este informe no es una auditoría de seguridad, contable ni legal.

> **Nota de rigor:** se separan las capacidades que aparecen en el código de las propuestas que todavía requerirían desarrollo. No se deben vender como implementadas las funciones señaladas como brecha o roadmap.

## 1. Resumen ejecutivo

El sistema es una aplicación web administrativa para operación de jornadas de salud visual, nóminas, cierres diarios de campo, seguimiento de municipios, recordatorios y reportes de lentes. Su arquitectura actual es híbrida:

- Interfaz web construida con HTML, CSS y JavaScript, con navegación modular.
- Google Apps Script y Google Sheets para partes del flujo heredado de nóminas, jornadas, lentes y métricas.
- Supabase Auth, PostgreSQL, funciones RPC, Row Level Security (RLS) y Edge Functions para autenticación/licencias y algunos módulos multiempresa.
- Integración con WhatsApp mediante un servicio/proxy de Meta para plantillas de consulta y entrega.

El producto puede presentarse hoy como **herramienta de gestión operativa de jornadas, nómina y seguimiento administrativo para ópticas**. La evidencia del repositorio no respalda describirlo como un sistema completo de laboratorio óptico, punto de venta por paciente, inventario, cuentas por cobrar ni contabilidad financiera integral.

Tampoco se encontró una integración de Make ni suscripciones de tiempo real de Supabase. Los módulos consultan o guardan datos al realizar acciones del usuario. La contabilidad diaria cuenta con borrador local y cola de sincronización para recuperarse de interrupciones, pero eso no equivale a actualizaciones instantáneas entre usuarios.

## 2. Ficha técnica y arquitectura

### 2.1 Componentes identificados

| Capa | Tecnología observada | Uso identificado |
|---|---|---|
| Aplicación web | HTML, CSS y JavaScript | Portal, vistas, navegación por módulos y formularios. |
| API heredada | Google Apps Script (GAS) | Operaciones vinculadas a libros de Google Sheets: nóminas, jornadas, lentes y algunos reportes. |
| Datos heredados | Google Sheets | Hojas operativas y de nómina consultadas o actualizadas por los scripts. |
| Identidad y licencias | Supabase Auth y Edge Functions | Inicio de sesión administrativo, activación/validación de licencia y asociación de usuario a empresa. |
| Persistencia moderna | Supabase PostgreSQL, REST y RPC | Contabilidad diaria, nómina de oficina, atención de municipios y herramientas administrativas, entre otros módulos definidos por migraciones. |
| Mensajería | Meta WhatsApp mediante proxy configurado | Envío de plantillas individuales y masivas de recordatorio de consulta o entrega. |
| Make | No encontrado en el código inspeccionado | No se debe describir como integración actual sin evidencia y configuración adicional. |

La aplicación carga los módulos de forma dinámica desde el router administrativo. La configuración de endpoints de API se mantiene fuera del repositorio; por esa razón, este informe no incluye URLs, tokens, claves, identificadores de hojas ni datos personales.

### 2.2 Flujo de datos y uso multiusuario

1. El usuario abre la aplicación web e inicia sesión.
2. La puerta de licencia valida la licencia, el origen autorizado y el tenant asociado. La validación de acceso comprueba además la sesión de Supabase, el perfil activo, el rol y la pertenencia al tenant.
3. En los módulos conectados a Supabase, el frontend usa REST/RPC con el token de sesión. Las tablas multiempresa usan `tenant_id`; las políticas RLS y las funciones del servidor limitan el acceso según empresa y rol.
4. En módulos heredados, el frontend llama a una Web App de Apps Script vinculada al Google Sheet. La URL de datos se obtiene de la configuración/licencia, por lo que los libros de distintas instalaciones pueden estar separados.
5. El servicio de contabilidad diaria guarda borradores localmente y sincroniza mediante RPC cuando hay conexión. Si la sincronización falla, mantiene una cola en el almacenamiento local del navegador y puede reintentarla.

**Alcance de “multiusuario”:** hay persistencia central compartida para módulos que usan Supabase y datos compartidos en hojas para los módulos GAS. El comportamiento exacto de concurrencia y permisos depende del subsistema; no hay evidencia suficiente para afirmar que todos los módulos ofrecen el mismo aislamiento servidor-side.

**Alcance de “tiempo real”:** no se encontraron listeners de Supabase Realtime, eventos `postgres_changes` ni canales WebSocket de sincronización de datos. Los datos se consultan y actualizan en respuesta a acciones del usuario; una persona puede necesitar volver a consultar para ver cambios de otra sesión. La cola offline de contabilidad es un mecanismo de resiliencia, no sincronización en vivo.

### 2.3 Seguridad y estabilidad: capacidades y límites

**Controles observados**

- La activación de licencia compara estado y vencimiento, valida el origen autorizado y emite una sesión cuya expiración está acotada por la licencia. El token de licencia se almacena como hash en la base de datos.
- La función de validación administrativa comprueba que el usuario tenga un perfil activo, un rol permitido y el mismo tenant que la licencia.
- En módulos Supabase se emplean políticas RLS por empresa/rol y operaciones RPC que validan el tenant y las transiciones de estado.
- El cierre diario tiene estados de borrador, pendiente de validación, cerrado y validado, registros de auditoría y protección de cierres ya cerrados/validados.
- En varias operaciones de Apps Script se utiliza `LockService`; algunas métricas usan `CacheService`. Algunas fórmulas de nómina se excluyen expresamente de la escritura manual.

**Límites que deben comunicarse**

- La autorización y el aislamiento no son uniformes entre Supabase y todas las rutas GAS heredadas. El frontend oculta rutas por rol, pero la autorización en el servidor debe verificarse para cada operación GAS antes de comercializar el producto como SaaS con aislamiento completo entre empresas.
- Google Sheets sigue sujeto a límites, cuotas, cambios manuales de estructura y mantenimiento de fórmulas. El uso de bloqueos en operaciones puntuales no convierte todas las escrituras de Sheets en transacciones.
- El repositorio no demuestra un plan completo de copias de seguridad, recuperación ante desastre, monitoreo, acuerdos de disponibilidad ni pruebas de restauración. Esos controles se deben definir para una oferta de producción.
- La cola de contabilidad se guarda en el navegador. Hasta sincronizarse, depende del almacenamiento de ese dispositivo y navegador.

## 3. Alcance funcional por módulo

### 3.1 Jornadas y registro de lentes

**Implementado según el código**

- Carga de relaciones de lentes con información agregada por promotor/asesor y jornada.
- Registro de ruta, fecha, municipio, brigada, contactos, asistidos, lentes especiales, lentes sencillos, total y observaciones.
- Validaciones de cantidades y consistencia entre lentes especiales + sencillos y el total.
- Consulta, filtros y acciones de edición/supresión de relaciones de jornadas.
- Nómina de promotores y coordinadores con consulta y operaciones de jornada; ciertos campos calculados se preservan como fórmulas.

**Lo que no debe confundirse con este módulo**

- El flujo de lentes revisado registra principalmente totales de jornada/promotor. No aparecen registros por venta individual con paciente, receta, montura, precio, pago, abono o costo.
- No equivale a un punto de venta, expediente clínico ni historial completo de pacientes.
- La lógica completa de algunas operaciones heredadas depende de un endpoint GAS cuya implementación no está toda disponible en este repositorio.

### 3.2 Laboratorio óptico, órdenes y entregas

**No se encontró un módulo de laboratorio implementado** con ciclo de vida de órdenes, prescripción, selección de lente/montura, laboratorio asignado, producción, control de calidad, despacho, recepción o entrega individual.

Hay funciones relacionadas pero de alcance diferente:

- El módulo de Atención de Municipios registra ruta, municipio, fechas, hoja enlazada y estados administrativos como “Sin Digitalizar”, “Por Atender” y “Digitalizado”.
- Los recordatorios pueden trabajar con datos de pacientes existentes en hojas de atención y enviar mensajes de consulta o entrega por WhatsApp.
- Estos registros no demuestran trazabilidad de una orden óptica ni confirmación individual de entrega.

Por tanto, dolores como “lente perdido en laboratorio” o “orden fuera de sede sin rastreo” son una **oportunidad comercial y de producto**, no un problema que el código actual resuelva de extremo a extremo.

### 3.3 Finanzas, caja y nómina

**Cierres diarios de campo**

- Registro por jornada de municipio, coordinador, afiliaciones y gastos categorizados.
- Cálculo de ingresos, deducciones, egresos, saldo inicial y saldo final.
- Flujo de borrador, envío a validación, cierre y validación administrativa.
- Auditoría de acciones y bloqueo de cambios en cierres protegidos.
- Persistencia Supabase con controles tenant/rol y cola local de sincronización ante fallas de red.

El saldo de jornada calculado es un control operativo; no es evidencia de un libro mayor, conciliación bancaria o contabilidad tributaria completa.

**Nómina de oficina**

- Administración de empleados, períodos, novedades (por ejemplo, adicionales, festivos, préstamos, penalizaciones e inasistencias) y pagos.
- Cálculo de nómina por período, creación de instantáneas de pago, registro de estado pendiente/pagado/anulado, historial y auditoría.
- La interfaz genera relaciones de pago; en el código inspeccionado no se observa integración con bancos para ejecutar transferencias.

**Nómina de promotores y coordinadores**

- Consulta e ingreso de jornadas a través de Apps Script/Sheets, con fórmulas y datos de nómina.
- El comportamiento de almacenamiento y cálculo depende de los libros y endpoints GAS configurados.

**No se encontró evidencia de**

- Libro mayor y catálogo contable integral.
- Conciliación bancaria automática.
- Cuentas por cobrar por paciente con saldo y vencimiento.
- Integración de pagos, pasarela o desembolso bancario.
- Cálculo de costo/COGS por lente o montura y márgenes unitarios.

### 3.4 Consolidación, dashboards y métricas

- El dashboard presenta métricas operativas como promotores, brigadas atendidas, asistidos y monto a pagar; consulta un endpoint externo y usa caché de corta duración.
- Los reportes de lentes permiten filtros por fechas, municipio y asesor/promotor, con totales de lentes, rankings, eficiencia de ventas y desgloses por municipio.
- Las métricas observadas se orientan a volumen y operación de jornadas. No se encontró cálculo fiable de rentabilidad o margen por montura/lente porque no aparece asociado el costo de producto a una venta individual.
- La lista de “actividad reciente” del dashboard es contenido estático de ejemplo en el código, no una bitácora alimentada por eventos reales.

### 3.5 Otras funciones disponibles

- **Atención de Municipios:** administración multiempresa de rutas, municipios, fechas, enlaces a hojas y estados.
- **Recordatorios:** lectura de hojas de atención y selección de pacientes para recordatorios de consulta o entrega; contempla envíos individuales y masivos mediante plantillas de WhatsApp y un proxy de Meta.
- **Documentos:** plantillas de solicitudes, convenios y documentos imprimibles. El flujo principal observado utiliza vistas HTML/impresión del navegador; no se debe prometer archivo automático en Drive para todos los tipos sin validar cada endpoint.
- **Centro de Datos/Herramientas:** enlaces y descripciones guardados por empresa, con política administrativa.

## 4. Problemas del cliente y pitch comercial B2B

### Propuesta de valor defendible hoy

> “Centraliza la operación de jornadas y municipios, organiza nóminas de equipos de campo y oficina, registra cierres diarios con revisión administrativa y convierte los resultados de lentes por jornada en métricas operativas. Además, facilita el seguimiento de pacientes mediante recordatorios por WhatsApp desde las hojas de atención existentes.”

### Dolores y cobertura real

| Dolor del comprador | Qué aporta hoy el sistema | Límite que debe explicarse |
|---|---|---|
| Diferencias y demoras al consolidar el cierre de cada jornada | Formularios de caja/cierre, cálculo de totales, estados y auditoría en contabilidad diaria | Requiere operación disciplinada y validación; no sustituye contabilidad general ni conciliación bancaria. |
| Nóminas dispersas o cálculos manuales | Módulos de nómina de promotores, coordinadores y oficina, con consultas, registros y reportes | Los datos están repartidos entre Sheets/GAS y Supabase; conviene completar la consolidación y probar cada tenant. |
| Poca visibilidad de productividad por municipio o asesor | Reportes de volumen de lentes y eficiencia con filtros | No calcula margen neto por producto ni garantiza atribución de costos. |
| Pacientes que olvidan acudir o recoger | Recordatorios individuales/masivos desde datos de hojas | El recordatorio de entrega no equivale a una orden de laboratorio ni prueba de entrega completada. |
| Información de municipio/sede en hojas y enlaces separados | Registro de rutas, municipio, fechas, estados y acceso a la hoja correspondiente | Parte del detalle operativo continúa residiendo fuera de la base central. |
| Órdenes perdidas o entregas sin trazabilidad | **No cubierto de extremo a extremo en el código revisado** | Requiere desarrollar el módulo de laboratorio/órdenes y estados por paciente. |
| Fugas de dinero en saldos de pacientes | El cierre de jornada registra saldos operativos de campo | No hay libro de cuentas por cobrar individual; no afirmar que elimina fugas de pagos de pacientes. |

## 5. Modelo de licenciamiento y oferta comercial

### 5.1 Estado actual y propuesta

El código incluye activación de licencia y asociación a empresa/tenant, con estado, vencimiento y validación de origen. No se observó aplicación técnica de límites comerciales por número de sedes, usuarios o volumen. Los planes siguientes son una **hipótesis de lanzamiento**, no tarifas existentes ni un estudio de mercado.

Precios de referencia en USD, sujetos a validación con clientes, alcance del soporte, impuestos y costos de mensajería:

| Oferta piloto sugerida | Precio de implementación | Licencia mensual sugerida | Alcance comercial propuesto |
|---|---:|---:|---|
| Inicial | USD 250–500 | USD 79–129 | Una empresa/sede, configuración, carga inicial acotada y capacitación básica sobre módulos disponibles. |
| Operación | USD 500–1.200 | USD 149–249 | Varias sedes/rutas, acompañamiento de puesta en marcha, reportes y soporte prioritario; confirmar los límites operativos antes de contratar. |
| Red/Enterprise | Desde USD 1.200 | Desde USD 299 | Alcance, migración, integraciones, soporte y niveles de servicio acordados a medida. |

**Condiciones comerciales recomendadas**

- Cobrar implementación por parametrización, importación, capacitación y validación de datos.
- Cobrar licencia mensual por tenant, con bandas de sedes/usuarios acordadas contractualmente; antes de ofrecer límites automáticos, implementarlos en el sistema.
- Ofrecer pago anual anticipado con descuento moderado (por ejemplo, 10%) solo después de tener definido soporte, renovación y cancelación.
- Cotizar por separado desarrollos de laboratorio, migraciones especiales, WhatsApp/Meta, soporte fuera de horario y cualquier integración con sistemas de terceros.
- Especificar disponibilidad, respaldo, recuperación, privacidad de datos, propiedad de los datos y tiempos de soporte en el contrato.

### 5.2 Ejemplo ilustrativo de retorno de inversión

El ROI debe calcularse con datos del cliente; la siguiente cuenta es solo un ejemplo editable y no una promesa:

- Ahorro de administración: 12 horas al mes × USD 6/hora = **USD 72/mes**.
- Diferencias de caja detectadas y corregidas durante la revisión de cierres (supuesto a medir, no detección automática del sistema): 10 casos al mes × USD 20 = **USD 200/mes**.
- Beneficio mensual supuesto: **USD 272**.
- Ejemplo de licencia: USD 149/mes.
- Implementación: USD 500, amortizada para comparación en 12 meses = USD 41,67/mes.
- Costo mensual equivalente del primer año: USD 149 + USD 41,67 = **USD 190,67**.
- Beneficio neto supuesto: USD 272 − USD 190,67 = **USD 81,33/mes**.
- ROI mensual ilustrativo: (USD 272 − USD 190,67) ÷ USD 190,67 = **42,7%**.

Fórmula recomendada:

```text
ROI = (beneficio medible atribuible al sistema - costo total del sistema)
      / costo total del sistema
```

En la evaluación real, sustituir horas, costo laboral y diferencias detectadas por cifras verificables del cliente. El ejemplo no implica que el sistema detecte o recupere automáticamente esos montos; medirlo en un piloto y excluir beneficios no demostrados o capacidades aún no implementadas.

## 6. Hoja de ruta recomendada para ampliar el producto

### Prioridad 0 — Base comercial segura

- Revisar autorización servidor-side de cada endpoint GAS y eliminar dependencia exclusiva de restricciones visuales del frontend.
- Formalizar aislamiento de datos por empresa en todos los servicios, planes de respaldo y pruebas de restauración.
- Documentar fuente oficial por dato, procedimiento de conciliación y exportación de datos.
- Definir monitoreo de errores, cuotas y estados de sincronización.

### Prioridad 1 — Órdenes y laboratorio

- Crear ficha de paciente y orden con identificador único y consentimiento de datos.
- Capturar receta, montura/lente, parámetros técnicos, sede, laboratorio/proveedor, fecha prometida y costo.
- Definir estados auditables: solicitada, enviada, recibida por laboratorio, en producción, control de calidad, lista, despachada, recibida en sede, entregada y cancelada.
- Registrar responsables, cambios de estado, fechas, evidencia de recepción y alertas de demora.

### Prioridad 2 — Venta y caja por paciente

- Vincular orden a presupuesto/venta, pagos, abonos, saldo pendiente y recibos.
- Gestionar cuentas por cobrar y vencimientos.
- Incorporar costo de lente/montura y descuentos para calcular margen por transacción.
- Agregar conciliación entre caja diaria, ventas, recaudos y cierres.

### Prioridad 3 — Consolidación y sincronización avanzada

- Consolidar progresivamente los módulos GAS/Sheets bajo un modelo de datos tenant-aware.
- Diseñar actualizaciones en vivo solo si existe una necesidad de usuario confirmada; hoy el producto opera principalmente por consulta/guardado.
- Añadir rentabilidad por sede, producto, proveedor y canal una vez que existan costos y transacciones detalladas confiables.

## 7. Evidencia y archivos de referencia

Las rutas siguientes son referencias al código revisado; no incluyen endpoints ni secretos:

- Navegación y catálogo de módulos: [`administracion/js/router.js`](./administracion/js/router.js)
- Licencias y autenticación administrativa: [`administracion/config/auth.js`](./administracion/config/auth.js)
- Funciones de licencia y validación de acceso: [`backend/supabase/edge%20functions/license-gate/index.ts`](./backend/supabase/edge%20functions/license-gate/index.ts), [`backend/supabase/edge%20functions/validate-access/index.ts`](./backend/supabase/edge%20functions/validate-access/index.ts)
- Contabilidad diaria y auditoría/RLS: [`backend/supabase/migrations/20261006120000_contabilidad_diaria.sql`](./backend/supabase/migrations/20261006120000_contabilidad_diaria.sql), [`backend/supabase/migrations/20261009140000_contabilidad_diaria_bloqueo_reapertura.sql`](./backend/supabase/migrations/20261009140000_contabilidad_diaria_bloqueo_reapertura.sql)
- Servicio de sincronización local/remota: [`coordinador/services/contabilidadDiariaService.js`](./coordinador/services/contabilidadDiariaService.js)
- Nómina de oficina: [`backend/supabase/migrations/20261005110000_nomina_oficina.sql`](./backend/supabase/migrations/20261005110000_nomina_oficina.sql), [`administracion/services/oficinaNominaService.js`](./administracion/services/oficinaNominaService.js)
- Registro y reportes de lentes: [`administracion/js/lentesCarga.js`](./administracion/js/lentesCarga.js), [`administracion/services/reportesService.js`](./administracion/services/reportesService.js), [`administracion/js/reportes.js`](./administracion/js/reportes.js)
- Métricas del dashboard: [`administracion/services/dashboardService.js`](./administracion/services/dashboardService.js), [`backend/Código Nomina.gs`](./backend/Código%20Nomina.gs)
- Atención de municipios y esquema: [`atencionMunicipios/js/atencionMunicipiosService.js`](./atencionMunicipios/js/atencionMunicipiosService.js), [`backend/supabase/migrations/atencion-municipios.sql`](./backend/supabase/migrations/atencion-municipios.sql)
- Recordatorios y WhatsApp: [`recordatorios/js/recordatoriosService.js`](./recordatorios/js/recordatoriosService.js), [`recordatorioMasivo/js/metaService.js`](./recordatorioMasivo/js/metaService.js)
- Descripción general disponible: [`README.md`](./README.md), [`documentacion/GUIA_CONFIGURACION_APIS.md`](./documentacion/GUIA_CONFIGURACION_APIS.md)

## Conclusión

El valor comercial más sólido en el estado actual es la combinación de **operación de jornadas, nómina, cierre diario revisable, seguimiento administrativo de municipios y métricas de lentes**. El posicionamiento debería ser explícito respecto a sus límites: el laboratorio óptico, la trazabilidad por orden/paciente, las cuentas por cobrar completas y los márgenes unitarios son líneas de producto recomendadas, no funcionalidades acreditadas por el código revisado.
