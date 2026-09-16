/* ============================================================
   CATALOGOS.JS — Vista de Catálogos del sistema
   Módulo Administración · Óptica Visión de Águila
   Fase 5 — Arquitectura base. Administrará: instituciones,
   empresas, cargos, ciudades, tipos de documento, plantillas.
   ============================================================ */

function renderCatalogos() {
  var contenedor = document.getElementById('admin-content');
  if (!contenedor) return;

  var cats = [
    { label: 'Instituciones',       desc: 'Entidades públicas y privadas registradas',    color: 'bg-verde-suave text-verde-oscuro' },
    { label: 'Empresas',            desc: 'Empresas vinculadas al sistema',               color: 'bg-verde-suave text-verde-oscuro' },
    { label: 'Cargos',              desc: 'Cargos y roles de promotores',                 color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Ciudades',            desc: 'Municipios y localidades activos',             color: 'bg-violet-50 text-violet-700' },
    { label: 'Tipos de Documento',  desc: 'Clasificación de documentos generables',      color: 'bg-amber-50 text-amber-700' },
    { label: 'Plantillas',          desc: 'Plantillas de documentos disponibles',         color: 'bg-rojo-suave text-rose-700' }
  ];

  var itemsHtml = cats.map(function (c) {
    return '<div class="bg-white rounded-xl shadow-soft p-4 border border-slate-100 opacity-60 cursor-not-allowed">' +
      '<div class="flex items-center gap-3 mb-2">' +
        '<div class="w-8 h-8 rounded-lg ' + c.color + ' flex items-center justify-center text-xs font-bold flex-shrink-0">' +
          c.label.charAt(0) +
        '</div>' +
        '<div class="font-bold text-verde-oscuro text-sm">' + c.label + '</div>' +
      '</div>' +
      '<div class="text-xs text-slate-400">' + c.desc + '</div>' +
      '<div class="mt-2 text-[10px] font-semibold text-slate-300 uppercase tracking-wide">Próximamente</div>' +
    '</div>';
  }).join('');

  contenedor.innerHTML =
    '<div class="fade-in">' +
      '<div class="mb-6">' +
        '<h3 class="text-verde-oscuro font-bold text-lg">Catálogos</h3>' +
        '<p class="text-slate-400 text-sm mt-0.5">Parámetros y tablas maestras del sistema</p>' +
      '</div>' +
      '<div class="grid grid-cols-2 lg:grid-cols-3 gap-3">' + itemsHtml + '</div>' +
    '</div>';
}
