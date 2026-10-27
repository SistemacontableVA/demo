const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const shell = fs.readFileSync(path.join(root, 'administracion', 'views', 'shell.tpl'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'administracion', 'styles', 'admin.css'), 'utf8');

test('el menú móvil conserva visible el pie de sesión y desplaza solo la navegación', () => {
  assert.match(shell, /class="admin-sidebar-nav flex-1 py-2"/);
  assert.match(shell, /class="admin-sidebar-footer"[\s\S]*?Cerrar sesion/);
  assert.match(styles, /#admin-sidebar\s*\{[^}]*height:\s*100dvh;[^}]*overflow:\s*hidden;/s);
  assert.match(styles, /\.admin-sidebar-nav\s*\{[^}]*min-height:\s*0;[^}]*overflow-y:\s*auto;/s);
  assert.match(styles, /\.admin-sidebar-nav \.admin-menu-item\s*\{[^}]*padding-top:\s*6px;[^}]*padding-bottom:\s*6px;/s);
  assert.match(styles, /\.admin-sidebar-footer\s*\{[^}]*padding:\s*8px 14px;[^}]*background:/s);
});
