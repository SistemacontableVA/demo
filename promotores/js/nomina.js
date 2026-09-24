// Usar var para que la re-ejecución del script no lance
// "SyntaxError: Identifier already declared" en navegadores.
// API_URL también se define en assets/js/utils.js para el módulo Admin.
var API_URL = window.API_URL || '';
window.API_URL = API_URL;

var logDiarioActual = [];
var filtroActivo    = 'todos';
var vistaActual     = 'nomina';
var nominaActual    = null;

function obtenerCedulaParaConsulta() {
  var cedulaEl = document.getElementById('cedula');
  if (cedulaEl && cedulaEl.value.trim()) {
    return cedulaEl.value.trim();
  }

  if (window.__nominaCedulaOverride && window.__nominaCedulaOverride.toString().trim()) {
    return window.__nominaCedulaOverride.toString().trim();
  }

  return '';
}

/* ----------------------------------------------------------------
   NAVEGACIÓN DE PESTAÑAS (Nómina / Lentes / Brigadas)
---------------------------------------------------------------- */
function abrirPlantillaNomina() {
  if (!nominaActual) {
    alert('Primero debe consultar un promotor para imprimir su nómina.');
    return;
  }

  var popup = window.open('', '_blank', 'width=1200,height=900');
  if (!popup) {
    alert('El navegador bloqueó la ventana emergente. Permite pop-ups para imprimir la nómina.');
    return;
  }

  fetch('administracion/documentos/templates/nomina-impresion.html?ts=' + Date.now(), { cache: 'no-store' })
    .then(function(response) { return response.text(); })
    .then(function(html) {
      var logoUrl = new URL('assets/images/logomenu.png', document.baseURI).href;
      var configUrl = new URL('empresa-config.json', document.baseURI).href;
      var scriptTag = '<script>window.__nominaData = ' + JSON.stringify(nominaActual) + ';</script>';
      var htmlConDatos = html
        .replace(/\.\.\/\.\.\/\.\.\/assets\/images\/logomenu\.png/g, logoUrl)
        .replace(/fetch\(['"]empresa-config\.json/g, 'fetch(' + JSON.stringify(configUrl))
        .replace('</head>', scriptTag + '</head>');
      popup.document.write(htmlConDatos);
      popup.document.close();
      setTimeout(function() {
        if (popup && popup.window) {
          popup.window.__nominaData = nominaActual;
          if (popup.window.renderNominaImpresion) {
            popup.window.renderNominaImpresion(nominaActual);
          }
        }
      }, 250);
    })
    .catch(function(error) {
      console.error('[Nómina] Error cargando plantilla de impresión:', error);
      popup.document.write('<html><body><h2>Error al cargar la plantilla.</h2></body></html>');
      popup.document.close();
    });
}

function showVista(v) {
  vistaActual = v;

  document.querySelectorAll('.vista-btn').forEach(function(btn) {
    var activo = btn.dataset.vista === v;
    btn.classList.toggle('bg-verde-medio',  activo);
    btn.classList.toggle('text-white',      activo);
    btn.classList.toggle('bg-white',        !activo);
    btn.classList.toggle('text-gris-medio', !activo);
    btn.querySelectorAll('span').forEach(function(sp) {
      if (sp.classList.contains('uppercase')) {
        sp.classList.toggle('opacity-80',     activo);
        sp.classList.toggle('text-gris-medio', !activo);
      }
    });
  });

  document.querySelectorAll('.vista-panel').forEach(function(p) {
    p.classList.add('hidden');
  });
  document.getElementById('panel-' + v).classList.remove('hidden');
}

/* ----------------------------------------------------------------
   CONSULTA PRINCIPAL — Conecta con Google Apps Script
---------------------------------------------------------------- */
async function consultar() {
  var ci         = obtenerCedulaParaConsulta();
  var errorEl    = document.getElementById('msg-error');
  var btnText    = document.getElementById('btn-text');
  var btnSpinner = document.getElementById('btn-spinner');
  var btn        = document.getElementById('btn-consultar');

  errorEl.classList.add('hidden');
  if (!ci) return;

  btnText.textContent = 'Buscando...';
  btnSpinner.classList.remove('hidden');
  btn.disabled = true;

  try {
    var res  = await fetch(API_URL + '?cedula=' + ci);
    var data = await res.json();

    if (data.error) {
      errorEl.textContent = data.error;
      errorEl.classList.remove('hidden');
      document.getElementById('resultado').classList.add('hidden');
      nominaActual = null;
    } else {
      nominaActual = data;
      window.__nominaData = data;
      var resumen = data.resumen || {};

      document.getElementById('txt-nombre').innerText     = data.nombre || 'Asesor';
      document.getElementById('avatar-inicial').innerText = (data.nombre || 'A').trim().charAt(0).toUpperCase();

      // ── KPIs Brigadas y Asistidos ──
      document.getElementById('res-bc').innerText   = resumen.brigCampo !== undefined ? resumen.brigCampo : 0;
      document.getElementById('res-ba').innerText   = resumen.brigAtend !== undefined ? resumen.brigAtend : 0;
      var valAsistidos = resumen.asistidos !== undefined
        ? resumen.asistidos
        : (resumen.ceroAsist !== undefined ? resumen.ceroAsist : 0);
      document.getElementById('res-cero').innerText = valAsistidos;

      // ── BLOQUE INGRESOS ──
      document.getElementById('ingCantidadAff').textContent        = resumen.totalAff !== undefined ? resumen.totalAff : 0;
      document.getElementById('ingTotalAff').textContent = '$' + fmt(resumen.totalAffMonto  || 0);
      document.getElementById('ingLenteEsp').textContent    = '$' + fmt(resumen.montoLenteEsp  || 0);
      document.getElementById('ingLenteSen').textContent    = '$' + fmt(resumen.montoLenteSen  || 0);
      document.getElementById('ingPagoAsistencia').textContent      = '$' + fmt(resumen.pagoAsistencia || 0);
      const totalIngresosConAsistencia = (resumen.totalIngresos || 0) + (resumen.pagoAsistencia || 0);
      document.getElementById('ingTotalIngresos').textContent = '$' + fmt(totalIngresosConAsistencia);

      // ── KPIs en header ──
      document.getElementById('res-lent').innerText = resumen.cantLenteEsp !== undefined
        ? resumen.cantLenteEsp
        : (resumen.lenteEspecial !== undefined ? resumen.lenteEspecial : 0);
      document.getElementById('res-lent-sencillo').innerText = resumen.cantLenteSen !== undefined
        ? resumen.cantLenteSen
        : (resumen.lenteSencillo !== undefined ? resumen.lenteSencillo : 0);
      document.getElementById('res-total-ingresos').innerText = Number(
        resumen.totalVentaLentes !== undefined ? resumen.totalVentaLentes : 0
      ).toLocaleString('es-CO', { maximumFractionDigits: 0 });
      document.getElementById('res-promedio-venta').innerText = Number(resumen.promedioVenta || 0).toLocaleString('es-CO', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      });

      // ── BLOQUE DEDUCCIONES ──
      document.getElementById('dedComida').textContent    = '$' + fmt(resumen.deducComida      || 0);
      document.getElementById('dedPrestamo').textContent  = '$' + fmt(resumen.deducPrestamo    || 0);
      document.getElementById('dedDescuento').textContent = '$' + fmt(resumen.deducDescuento   || 0);
      document.getElementById('dedTotalDeducciones').textContent     = '$' + fmt(resumen.totalDeducciones || 0);

      // ── RESUMEN GENERAL ──
      var neto          = resumen.neto !== undefined ? resumen.neto : 0;
      var displayNeto   = document.getElementById('res-neto');
      displayNeto.innerText = '$' + (typeof neto === 'number' ? neto.toLocaleString('es-CO') : neto);

      // ── Historial diario ──
      logDiarioActual = data.logDiario || [];
      var dias    = logDiarioActual.length;

      // ── Renderizar secciones ──
      renderDeducciones();
      renderBrigadas();
      renderLentes(data);
      filtrar('todos');
      showVista('nomina');

      document.getElementById('resultado').classList.remove('hidden');
    }
  } catch (e) {
    console.error('[Nómina] Error:', e);
    errorEl.textContent = 'Error conectando con el sistema.';
    errorEl.classList.remove('hidden');
  } finally {
    btnText.textContent = 'Consultar';
    btnSpinner.classList.add('hidden');
    btn.disabled = false;
  }
}
