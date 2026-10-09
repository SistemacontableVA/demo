const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const admin = fs.readFileSync(
  path.join(root, 'administracion', 'js', 'contabilidadAdmin.js'),
  'utf8'
);
const styles = fs.readFileSync(
  path.join(root, 'administracion', 'styles', 'admin.css'),
  'utf8'
);

test('el reporte administrativo organiza identificación, estado y resumen financiero', () => {
  assert.match(admin, /contabilidad-report-hero/);
  assert.match(admin, /contabilidad-report-meta/);
  assert.match(admin, /contabilidad-report-status/);
  assert.match(admin, /contabilidad-report-metrics/);
  assert.match(admin, /metric-balance/);
  assert.match(admin, /contabilidad-report-affiliations/);
  assert.match(admin, /contabilidad-report-grid/);
  assert.match(admin, /contabilidad-report-dinners/);
  assert.match(admin, /id="contabilidad-admin-estado"/);
  assert.match(admin, /id="btn-guardar-estado-contabilidad-admin"/);
  assert.match(admin, /async function guardarEstadoContabilidadAdmin\(\)/);
  assert.doesNotMatch(admin, /¿Necesita una corrección\?/);
  assert.match(admin, /ContabilidadDiariaService\.reabrirParaEdicion\(draft\.id\)/);
  assert.match(admin, /Imprimir \/ Guardar PDF/);
  assert.match(admin, /function imprimirContabilidadAdminPDF\(\)/);
  assert.match(admin, /window\.print\(\)/);
  assert.match(admin, /contabilidad-report-status-/);
});

test('las cenas ganadas muestran el conteo de afiliaciones de cada promotor', () => {
  assert.match(admin, /var cantidadAfiliaciones = Number\(fila\.aff \|\| fila\.afiliaciones\) \|\| 0;/);
  assert.match(admin, /contabilidad-report-affiliation-count/);
  assert.match(admin, /cantidadAfiliaciones\.toLocaleString\('es-VE'\)/);
  assert.match(admin, /afiliaciones<\/small>/);
});

test('la interfaz del reporte usa el ancho del módulo y se adapta a escritorio y móvil', () => {
  assert.match(styles, /#admin-content:has\(\.contabilidad-admin-module\)\s*\{\s*padding:\s*0;/);
  assert.match(styles, /\.contabilidad-admin-module\s*\{[^}]*width:\s*100%;[^}]*max-width:\s*1760px;/);
  assert.match(styles, /\.contabilidad-report-metrics\s*\{[^}]*grid-template-columns:\s*repeat\(6, minmax\(0, 1fr\)\)/);
  assert.match(styles, /\.contabilidad-report-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(styles, /\.contabilidad-report-affiliations,[\s\S]*?\.contabilidad-report-expenses\s*\{\s*grid-column:\s*span 2;/);
  assert.match(styles, /\.contabilidad-report-expense-list\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styles, /\.contabilidad-report-hero-copy h2\s*\{[^}]*margin:\s*3px 0 0;/);
  assert.match(styles, /\.contabilidad-report-metric\s*\{[^}]*min-height:\s*88px;/);
  assert.match(styles, /@media \(max-width: 700px\)[\s\S]*?\.contabilidad-report-metrics\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styles, /@media \(max-width: 700px\)[\s\S]*?\.contabilidad-report-grid\s*\{[^}]*grid-template-columns:\s*1fr/);
  assert.match(styles, /\.contabilidad-report-table-wrap\s*\{\s*overflow-x:\s*auto;/);
  assert.match(styles, /\.contabilidad-report-hero\s*\{[^}]*grid-template-columns:\s*minmax\(180px, 1\.3fr\) repeat\(3, minmax\(125px, 1fr\)\) auto/);
  assert.match(styles, /\.contabilidad-report-meta strong\s*\{[^}]*font-size:\s*15px;[^}]*font-weight:\s*750;/);
  assert.match(styles, /\.contabilidad-report-status-control button/);
  assert.match(styles, /@page\s*\{\s*size:\s*A4 landscape;/);
  assert.match(styles, /@media print\s*\{[\s\S]*?visibility:\s*hidden !important;[\s\S]*?visibility:\s*visible !important;/);
});
