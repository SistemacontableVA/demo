const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const view = fs.readFileSync(
  path.join(root, 'coordinador', 'views', 'contabilidadDiaria.html'),
  'utf8'
);

test('la tabla de afiliaciones conserva escritorio y usa tarjetas expandibles en móvil', () => {
  assert.match(view, /table\s*\{[\s\S]*?min-width:\s*980px;/, 'La tabla de escritorio conserva su ancho actual');
  assert.match(view, /@media\s*\(max-width:\s*560px\)\s*\{[\s\S]*?\.table-card tbody tr\s*\{[\s\S]*?display:\s*grid/, 'En móvil cada asesor se presenta como tarjeta');
  assert.match(view, /\.mobile-asesor-controls\s*\{\s*display:\s*none;\s*\}/, 'El control móvil permanece oculto en escritorio');
  assert.match(view, /\.table-card tbody tr\.mobile-expanded td\s*\{[\s\S]*?display:\s*grid/, 'La tarjeta expandida muestra todos los campos verticalmente');
});

test('la vista móvil etiqueta los campos y conserva totales y acciones de las filas', () => {
  [
    'Asesor / Promotor', 'Rol', 'Nº Aff', 'Recaudo ($)', 'Almuerzo', 'Cena',
    'T. Urbano', 'T. Vereda', 'A. Adic ($)', 'A. Ganado ($)',
    'Recaudo Neto', 'Préstamo'
  ].forEach(label => {
    assert.ok(view.includes("'" + label + "'"), `Debe existir etiqueta móvil para ${label}`);
  });

  assert.match(view, /function prepararFilaAfiliacionMovil\(tr, index\)/);
  assert.match(view, /toggle\.setAttribute\('aria-expanded', String\(expandida\)\)/);
  assert.match(view, /toggle\.textContent = 'Detalle'/, 'Cada tarjeta debe ofrecer el botón Detalle');
  assert.match(view, /Cerrar detalle del asesor /, 'El botón de detalle debe actualizar su nombre accesible al expandir');
  assert.match(view, /\.table-card tbody tr\.mobile-expanded td\s*\{[\s\S]*?display:\s*grid/, 'Detalle debe expandir los campos de la fila');
  assert.match(view, /function renumerarFilasAfiliacion\(\)/);
  assert.match(view, /data-mobile-label="Recaudo Neto"/, 'Los totales también deben leerse en tarjetas en móvil');
  assert.match(view, /aria-label="Eliminar asesor"/, 'La acción de borrar asesor mantiene nombre accesible');
  assert.match(view, /onclick="verConsolidadoAfiliaciones\(\)">Ver consolidado/, 'La vista móvil debe ofrecer el consolidado');
  assert.match(view, /\.table-footer-bar \.btn-ver-consolidado \{ display: none; \}/, 'El consolidado adicional no debe alterar la barra de escritorio');
  assert.match(view, /@media \(max-width: 560px\) \{\s*\.table-footer-bar \.btn-ver-consolidado \{ display: inline-flex; \}/, 'El botón de consolidado debe mostrarse en móvil');
  assert.match(view, /function verConsolidadoAfiliaciones\(\)/, 'Debe existir el visor general de registros');
  assert.match(view, /function cerrarConsolidadoAfiliaciones\(\)/, 'El consolidado debe poder cerrarse');
  assert.match(view, /aria-label="Cerrar consolidado"/, 'El cierre debe ser accesible');
});

test('el recaudo por asesor queda de solo lectura y sigue calculándose por afiliaciones', () => {
  const camposRecaudo = view.match(/<input type="number" class="input-rec-abono"[^>]*>/g) || [];
  assert.equal(camposRecaudo.length, 2, 'La fila inicial y las nuevas filas deben definir Recaudo');
  camposRecaudo.forEach(campo => {
    assert.match(campo, /\breadonly\b/, 'Recaudo debe ser un valor calculado, no editable');
    assert.doesNotMatch(campo, /oninput=/, 'Recaudo no debe tener un manejador de edición manual');
  });
  assert.match(view, /function calcularFilaAfiliacion\(tr\)/, 'El cálculo no debe admitir modo manual');
  assert.match(view, /inputRecAbono\.value = aff \* 3;/, 'Recaudo se calcula a razón de tres por afiliación');
});

test('la cabecera oculta la franja redundante de totales y conserva las métricas', () => {
  assert.match(view, /#resumen-cierre-contabilidad\s*\{\s*display:\s*none !important;/, 'La franja de totales duplicada no debe ocupar espacio en ningún tamaño');
  assert.match(view, /id="resumen-total-afiliaciones"/, 'Se conserva el nodo de total de afiliaciones');
  assert.match(view, /id="resumen-saldo-final"/, 'Se conserva el nodo de saldo final');
  assert.match(view, /\.table-card tfoot tr\s*\{[^}]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/, 'Los totales deben distribuirse en tres columnas');
  assert.match(view, /\.table-card tfoot td\s*\{[^}]*font-size:\s*0\.85rem/, 'Los valores de los totales deben tener mayor tamaño');
  assert.match(view, /\.table-card tfoot td::before\s*\{[^}]*font-size:\s*0\.7rem/, 'Las etiquetas de los totales deben ser más legibles');
});

test('el encabezado centra los selectores y conserva intactos los totales del resumen', () => {
  assert.match(view, /\.nav-tabs\s*\{[^}]*width:\s*min\(100%, 700px\);[^}]*margin:\s*0 auto;/, 'Los selectores deben tener ancho limitado y quedar centrados');
  assert.match(view, /\.nav-switcher-row\s*\{[^}]*justify-content:\s*center;[^}]*padding:\s*0\.35rem 0 0;/, 'Los selectores deben centrarse con poco espacio vertical');
  assert.match(view, /\.header-card\s*\{[^}]*padding:\s*0\.8rem 1\.25rem 0\.5rem;/, 'La cabecera reduce el espacio inferior en escritorio');
  assert.match(view, /padding:\s*0\.75rem 0\.75rem 0\.4rem;/, 'La cabecera reduce el espacio inferior en móvil');
  assert.match(view, /id="resumen-cierre-contabilidad" style="margin-top:0\.25rem;[^"]*padding: 0\.35rem 0\.85rem;/, 'El resumen conserva sus datos con menor altura');
  assert.match(view, /<div class="meta-row header-meta">[\s\S]*?id="global-fecha"[\s\S]*?id="global-municipio"[\s\S]*?id="global-coordinador"[\s\S]*?<\/div>\s*<div class="header-actions">[\s\S]*?class="header-status"/, 'Fecha, municipio y coordinador permanecen separados del estado');
  assert.match(view, /Total afiliaciones: <strong id="resumen-total-afiliaciones">0<\/strong>/, 'El total de afiliaciones no cambia');
  assert.match(view, /Saldo final: <strong id="resumen-saldo-final">\$0<\/strong>/, 'El saldo final no cambia');
  assert.doesNotMatch(view, /Estado jornada:<\/span>/, 'El estado ya no ocupa espacio junto a los totales');
});

test('la cabecera usa iconos SVG y colores diferenciados en las tarjetas de resumen', () => {
  const start = view.indexOf('<div id="tab-afiliaciones"');
  const end = view.indexOf('<!-- ═══ PESTAÑA 2: CONTABILIDAD COORDINADOR ═══ -->');
  const affiliations = view.slice(start, end);
  const cards = affiliations.match(/<div class="stat-card(?: sc-[a-z]+)?">/g) || [];
  assert.equal(cards.length, 4, 'Deben conservarse las cuatro tarjetas métricas');
  assert.match(view, /<div class="stat-card sc-blue">[\s\S]*?id="card-tot-abono"/, 'Recaudo abono usa la tarjeta azul');
  assert.match(view, /<div class="stat-card sc-purple">[\s\S]*?id="card-tot-almuerzo"/, 'Almuerzos usan la tarjeta púrpura');
  assert.match(view, /<div class="stat-card sc-navy">[\s\S]*?id="card-tot-neto"/, 'Recaudo neto conserva su tarjeta verde oscura');
  assert.match(view, /class="sc-icon"><svg class="ui-icon"/, 'Las tarjetas usan iconos SVG en vez de emojis');
  assert.match(view, /\.stat-card\s*\{[^}]*display:\s*flex;/, 'Las tarjetas de la pestaña contable conservan su disposición previa');
  assert.match(view, /#tab-afiliaciones \.summary-cards \.stat-card\s*\{[^}]*display:\s*grid;/, 'El rediseño queda limitado a la pestaña de afiliaciones');
  assert.match(view, /#tab-afiliaciones \.summary-cards \.stat-card\.sc-blue\s*\{[^}]*background:\s*linear-gradient/, 'La tarjeta azul tiene su estilo diferenciado');
  assert.match(view, /#tab-afiliaciones \.summary-cards \.stat-card\.sc-purple\s*\{[^}]*background:\s*linear-gradient/, 'La tarjeta púrpura tiene su estilo diferenciado');
  assert.match(view, /#tab-afiliaciones \.summary-cards \.stat-card\.sc-navy\s*\{[^}]*background:\s*linear-gradient/, 'La tarjeta verde oscura tiene su estilo diferenciado');
});

test('las modales de contabilidad usan la paleta azul y verde del módulo', () => {
  assert.match(view, /\.app-modal-header\s*\{[^}]*border-bottom:\s*3px solid var\(--green\);/, 'La cabecera de las modales integra el acento verde');
  assert.match(view, /\.app-modal-btn\.primary\s*\{[^}]*linear-gradient\(135deg,\s*#07865d,\s*#08744f\)/, 'Las acciones principales usan verde en vez de rojo');
  assert.match(view, /class="app-modal-actions welcome-modal-actions"/, 'Las acciones de bienvenida tienen una distribución propia');
  assert.match(view, /Iniciar nueva jornada/, 'La opción de iniciar una jornada queda clara');
  assert.match(view, /<svg class="ui-icon" aria-hidden="true" viewBox="0 0 24 24">[\s\S]*?Cargar borrador/, 'Cargar borrador conserva su acción e incluye un icono de la interfaz');
});

test('la tabla de afiliaciones adopta el acabado azul y verde sin afectar otras tablas', () => {
  assert.match(view, /#tab-afiliaciones > \.table-card thead th\s*\{[^}]*background:\s*#e3f4ed;[^}]*color:\s*#16466a;/, 'El encabezado usa fondo verde claro y texto azul');
  assert.match(view, /#tab-afiliaciones > \.table-card tfoot tr\s*\{[^}]*linear-gradient\(110deg,\s*#16466a,\s*#0d3b5c\)/, 'La fila de totales usa azul oscuro');
  assert.match(view, /#tab-afiliaciones > \.table-card \.btn-agregar-asesor\s*\{[^}]*linear-gradient\(135deg,\s*#07865d,\s*#08744f\)/, 'Agregar asesor usa el verde del módulo');
  assert.match(view, /<button class="btn btn-agregar-asesor" onclick="agregarFilaAfiliacion\(\)"><svg class="ui-icon"/, 'El botón mantiene la acción y agrega un icono consistente');
});

test('la contabilidad móvil conserva los renglones y mejora sus espacios y controles', () => {
  assert.match(view, /\.form-row\s*\{[^}]*padding:\s*0\.65rem 0\.75rem;[^}]*min-height:\s*54px;/, 'Los renglones deben tener más espacio vertical');
  assert.match(view, /\.form-row-label\s*\{[^}]*font-size:\s*0\.75rem;[^}]*white-space:\s*normal;/, 'Las etiquetas deben leerse mejor sin invadir los campos');
  assert.match(view, /\.form-row-inputs\s*\{[^}]*min-width:\s*0;/, 'Los renglones deben evitar que los controles se salgan del panel');
  assert.match(view, /\.form-row-inputs input,[\s\S]*?\.extra-expense-row input\s*\{[^}]*min-height:\s*38px;[^}]*font-size:\s*0\.84rem;/, 'Los campos deben tener un tamaño más cómodo al tacto');
  assert.match(view, /\.total-row\s*\{[^}]*min-height:\s*58px;/, 'Los totales deben separarse visualmente de los renglones');
});

test('el total de afiliaciones del cierre suma afiliados y no filas de asesores', () => {
  assert.match(view, /draft\.afiliaciones\.reduce\(function \(total, fila\) \{\s*return total \+ \(Number\(fila\.aff\) \|\| 0\);/, 'El cierre debe sumar el campo aff de cada asesor');
  assert.doesNotMatch(view, /const totalAfiliaciones = Array\.isArray\(draft\.afiliaciones\) \? draft\.afiliaciones\.length : 0;/, 'El número de asesores no debe mostrarse como total de afiliaciones');
  assert.match(view, /function recalcularTodo\(\) \{[\s\S]*?calcularContabilidad\(\);\s*renderResumenCierreContabilidad\(\);/, 'El resumen del encabezado debe actualizarse cuando cambia el total de afiliaciones');
});
