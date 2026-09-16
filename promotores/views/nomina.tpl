<!-- ============================================================
     NOMINA.TPL — Vista del módulo Nómina (Asesor de Campo) · V6
     Promotores · Portal de Nómina · Óptica Visión de Águila
     ============================================================ -->

<style>
  .fila-resumen {
    display: grid;
    grid-template-columns: 1fr 1fr 0.65fr;
    gap: 12px;
    margin-bottom: 16px;
  }

  @media (max-width: 1024px) {
    .fila-resumen {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 768px) {
    .fila-resumen {
      grid-template-columns: 1fr;
    }
  }

  .panel {
    background: #fff;
    border: 1.5px solid #C8D7DA;
    border-radius: 13px;
    padding: 14px;
  }

  .panel-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .panel-header .icon-circle {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    flex-shrink: 0;
  }

  .panel-header .icon-circle .icon {
    width: 18px;
    height: 18px;
  }

  .panel-header .icon-circle .icon svg {
    width: 100%;
    height: 100%;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .nomina-consulta-header {
    background: rgba(255, 255, 255, 0.82);
    border: 1px solid #dbe5ec;
    border-radius: 18px;
    padding: 12px 16px;
    box-shadow: 0 8px 22px -14px rgba(8, 44, 74, 0.45);
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .nomina-consulta-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    flex: 1 1 auto;
    min-width: 0;
  }

  .nomina-consulta-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }

  .nomina-consulta-brand img {
    width: 104px;
    height: 68px;
    object-fit: contain;
    margin: 0;
  }

  .nomina-consulta-search {
    width: 310px;
    flex-shrink: 1;
  }

  .nomina-consulta-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    margin-top: 0;
  }

  .nomina-consulta-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 38px;
    padding: 9px 14px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 700;
    transition: all .2s ease;
  }

  .nomina-consulta-action.volver {
    color: #082c4a;
    background: #e8f0f5;
    border: 1px solid #c8d7da;
  }

  .nomina-consulta-action.manual {
    color: #ffffff;
    background: linear-gradient(135deg, #0c2d48, #143c5e);
    border: 1px solid #0c2d48;
  }

  .nomina-consulta-action:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 14px -8px rgba(8, 44, 74, .6);
  }

  @media (max-width: 1100px) {
    .nomina-consulta-row { flex-wrap: wrap; }
    .nomina-consulta-actions { width: 100%; justify-content: center; }
  }

  @media (max-width: 640px) {
    .nomina-consulta-header { padding: 14px; }
    .nomina-consulta-header { display: block; }
    .nomina-consulta-row { flex-direction: column; gap: 12px; }
    .nomina-consulta-brand { width: 100%; justify-content: center; }
    .nomina-consulta-brand img { width: 92px; height: 62px; }
    .nomina-consulta-search { width: 100%; }
    .nomina-consulta-actions { flex-wrap: wrap; }
  }

  .icon-circle.verde {
    background: #008A69;
  }

  .icon-circle.morado {
    background: #b40018;
  }

  .panel-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #082c4a;
    letter-spacing: .02em;
  }

  table.linea {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    margin-bottom: 10px;
  }

  table.linea td {
    padding: 4px 0;
    border-bottom: 1px solid #e2e8f0;
    color: #17242A;
    font-weight: 600;
  }

  table.linea tr:last-child td {
    border-bottom: none;
  }

  table.linea td.d {
    text-align: right;
    font-weight: 800;
    color: #082c4a;
  }

  /* Header layout responsive */
  .header-layout {
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: 12px;
    align-items: stretch;
  }

  @media (max-width: 1024px) {
    .header-layout {
      grid-template-columns: 1fr;
      gap: 16px;
    }
  }

  /* KPI stat-grid responsive - 3 cols en desktop, 2 cols en mobile */
  @media (max-width: 768px) {
    .header-layout {
      grid-template-columns: 1fr !important;
      gap: 10px !important;
    }

    .titles-col {
      gap: 8px !important;
    }

    .titulo-block {
      padding: 6px 10px !important;
    }

    .titulo-block h1 {
      white-space: nowrap;
      font-size: 15px !important;
      line-height: 1.1 !important;
    }

    .titulo-block .subt {
      font-size: 9px !important;
      white-space: nowrap;
    }

    .asesor-bar {
      flex-direction: row !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 8px !important;
      padding: 6px 10px !important;
    }

    .asesor-bar > div:last-child {
      text-align: left !important;
      width: auto !important;
      min-width: 0;
    }

    .asesor-bar .lbl {
      white-space: nowrap;
      margin-bottom: 0 !important;
    }

    .asesor-bar .nombre {
      width: auto !important;
      max-width: 180px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: block;
    }

    .stat-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 8px !important;
    }

    .stat-card {
      min-width: 0 !important;
    }

    .stat-card .lbl {
      font-size: 8px !important;
      line-height: 1.15 !important;
    }

    .stat-card .val {
      font-size: 12px !important;
    }

    table.linea {
      font-size: 13px;
    }

    table.linea td {
      padding: 6px 0;
    }

    .panel-header h3 {
      font-size: 16px;
    }

    .total-fila {
      padding: 10px 12px;
      font-size: 16px;
    }
  }

  .total-fila {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-radius: 6px;
    padding: 7px 10px;
    font-weight: 700;
    font-size: 15px;
  }

  .total-fila.verde {
    background: #e6f5ef;
    color: #008A69;
    border: 1px solid #c8e6c9;
  }

  .total-fila.morado {
    background: #b4001811;
    color: #b40018;
    border: 1px solid #b4001823;
  }

  .panel-resumen {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 24px 16px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    z-index: 1;
  }

  .panel-resumen::before {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 90px;
    background: linear-gradient(135deg, #0f6f5c, #064e3b);
    z-index: -1;
    border-radius: 0 0 16px 16px;
    clip-path: ellipse(110% 100% at 50% 100%);
  }

  .panel-resumen .icon-circle-big {
    width: 58px;
    height: 58px;
    border-radius: 50%;
    background: #0f6f5c;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 5px solid #fff;
    box-shadow: 0 6px 16px rgba(15, 111, 92, 0.3);
    margin-bottom: 8px;
  }

  .panel-resumen .icon-circle-big .icon {
    width: 26px;
    height: 26px;
  }

  .panel-resumen .icon-circle-big .icon svg {
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .panel-resumen h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 900;
    color: #082c4a;
    line-height: 1.1;
    text-transform: uppercase;
    letter-spacing: -0.02em;
  }

  .panel-resumen .subt {
    font-size: 11.5px;
    color: #0f6f5c;
    margin-top: 4px;
    font-weight: 800;
  }

  .panel-resumen .separator {
    width: 40px;
    height: 3px;
    background: #0f6f5c;
    border-radius: 2px;
    margin: 8px 0;
  }

  .panel-resumen .val-grande {
    background: #fff;
    font-size: 32px;
    font-weight: 900;
    color: #0f6f5c;
    line-height: 1;
    padding: 10px 32px;
    border-radius: 24px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    margin-top: 4px;
  }

  @media (max-width: 768px) {
    .panel-resumen {
      padding: 16px 12px;
    }

    .panel-resumen .icon-circle-big {
      width: 48px;
      height: 48px;
      border: 4px solid #fff;
    }

    .panel-resumen .icon-circle-big .icon {
      width: 22px;
      height: 22px;
    }

    .panel-resumen h3 {
      font-size: 16px;
    }

    .panel-resumen .subt {
      font-size: 10px;
    }

    .panel-resumen .val-grande {
      font-size: 28px;
      padding: 8px 24px;
    }
  }
</style>

<div class="max-w-2xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 py-6 lg:py-8">

  <!-- Encabezado / Buscador -->
  <div class="nomina-consulta-header mb-6 lg:mb-8 fade-in no-print">
    <div class="nomina-consulta-row text-center">
      <div class="nomina-consulta-brand">
        <img
          src="assets/images/logomenu.png" data-empresa-logo="assets/images/logomenu.png" data-empresa-nombre=""
          class="mx-auto lg:mx-0"
          alt="">
        <div class="text-center lg:text-left">
          <h1 class="text-verde-oscuro font-bold text-lg sm:text-xl">Portal de Nómina</h1>
          <p class="text-gris-medio text-sm">Consulta individual</p>
        </div>
      </div>

      <div class="nomina-consulta-search bg-white rounded-md-plus shadow-soft p-2 flex items-center gap-2">
        <input type="text" id="cedula" inputmode="numeric" placeholder="Cédula del asesor"
          class="flex-1 min-w-0 px-4 py-3 rounded-[14px] text-sm sm:text-base input-foco-verde placeholder:text-slate-400 bg-transparent"
          onkeydown="if(event.key==='Enter') consultar()">
        <button onclick="consultar()" id="btn-consultar"
          class="shrink-0 btn-primario active:scale-95 transition-all text-white font-semibold text-sm sm:text-base px-5 py-3 rounded-[14px] flex items-center gap-2">
          <span id="btn-text">Consultar</span>
          <span id="btn-spinner" class="spinner hidden"
            style="border-color: rgba(255,255,255,.3); border-top-color:#fff;"></span>
        </button>
      </div>
    </div>

    <div class="nomina-consulta-actions">
      <button type="button" onclick="volverAlLandingDesdeNomina()"
        class="nomina-consulta-action volver" title="Volver al inicio del portal">
        <span aria-hidden="true">←</span>
        Volver al inicio
      </button>
      <button onclick="window.open('manuales/asesor.html', '_blank')"
        class="nomina-consulta-action manual" title="Abrir manual de usuario">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
        </svg>
        Manual de usuario
      </button>
    </div>

    <p id="msg-error" class="text-rojo text-sm mt-3 text-center lg:text-left hidden"></p>
  </div>

  <!-- ── Resultado ── -->
  <div id="resultado" class="hidden">

    <div class="max-w-2xl lg:max-w-5xl mx-auto">

      <div class="top-section " style="margin-bottom: 16px;">
        <div class="header-layout" style="display: grid; grid-template-columns: 1fr 360px; gap: 12px; align-items: stretch;">

          <div class="titles-col" style="display: flex; flex-direction: column; gap: 8px; justify-content: center;">
            <div class="titulo-block" style="background: #082c4a; border: 2px solid #082c4a; border-radius: 13px; padding: 2px 12px; display: flex; flex-direction: column; justify-content: center;">
              <h1 style="font-size: 16.5px; line-height: 1.1; font-weight: 900; color: #e6f5ef; margin: 0 0 2px; letter-spacing: .01em; text-transform: uppercase; text-align: center;">NÓMINA DE PROMOTOR</h1>
              <div class="subt" style="font-size: 10px; color: #f1d27a; font-weight: 700; text-align: center;">Resumen de ingresos, deducciones y jornadas</div>
            </div>
            <div class="asesor-bar" style="background: #f0f4f8; border: 1.5px solid #c8d7da; border-radius: 13px; padding: 2px 10px; display: flex; align-items: center; gap: 12px;">
              <div id="avatar-inicial" class="avatar" style="width: 36px; height: 36px; border-radius: 50%; background: #082c4a; color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: 900;">
                <div class="icon" style="width: 20px; height: 20px; display: inline-block; vertical-align: middle;">
                  <svg viewBox="0 0 24 24" style="width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              </div>
              <div>
                <div class="lbl" style="font-size: 10px; font-weight: 900; letter-spacing: .05em; color: #24535C; text-transform: uppercase; margin-bottom: 2px;">Nombre Asesor</div>
                <div class="nombre" id="txt-nombre" style="font-size: 13px; font-weight: 900; color: #082c4a; line-height: 1.1; text-transform: uppercase;">...</div>
              </div>
            </div>
          </div>

          <div class="stat-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; align-content: center;">
            <div class="stat-card green-bg" style="background: #1a8769; border: 1.5px solid transparent; border-radius: 8px; padding: 8px 6px; display: flex; flex-direction: row; align-items: center; gap: 6px; min-width: 0;">
              <div class="icon-wrap" style="width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #fff;">
                <div class="icon" style="width: 20px; height: 20px; display: inline-block; vertical-align: middle;">
                  <svg viewBox="0 0 24 24" style="width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;">
                    <circle cx="6" cy="15" r="3" />
                    <circle cx="18" cy="15" r="3" />
                    <path d="M9 15h6" />
                    <path d="M4 12l2-6h12l2 6" />
                  </svg>
                </div>
              </div>
              <div class="lbl" style="flex: 1; font-size: 9px; font-weight: 600; letter-spacing: .015em; color: rgba(255,255,255,.95); text-transform: uppercase; line-height: 1.2; text-align: left;">LENTE<br>ESPECIAL</div>
              <div class="val" id="res-lent" style="font-size: 14.5px; font-weight: 700; color: #fff; text-align: right; flex-shrink: 0;">0</div>
            </div>

            <div class="stat-card green-bg" style="background: #1a8769; border: 1.5px solid transparent; border-radius: 8px; padding: 8px 6px; display: flex; flex-direction: row; align-items: center; gap: 6px; min-width: 0;">
              <div class="icon-wrap" style="width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #fff;">
                <div class="icon" style="width: 20px; height: 20px; display: inline-block; vertical-align: middle;">
                  <svg viewBox="0 0 24 24" style="width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;">
                    <circle cx="6" cy="15" r="3" />
                    <circle cx="18" cy="15" r="3" />
                    <path d="M9 15h6" />
                    <path d="M4 12l2-6h12l2 6" />
                  </svg>
                </div>
              </div>
              <div class="lbl" style="flex: 1; font-size: 9px; font-weight: 600; letter-spacing: .015em; color: rgba(255,255,255,.95); text-transform: uppercase; line-height: 1.2; text-align: left;">LENTE<br>SENCILLO</div>
              <div class="val" id="res-lent-sencillo" style="font-size: 14.5px; font-weight: 700; color: #fff; text-align: right; flex-shrink: 0;">0</div>
            </div>

            <div class="stat-card blue-bg" style="background: #082c4a; border: 1.5px solid transparent; border-radius: 8px; padding: 8px 6px; display: flex; flex-direction: row; align-items: center; gap: 6px; min-width: 0;">
              <div class="icon-wrap" style="width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #fff;">
                <div class="icon" style="width: 20px; height: 20px; display: inline-block; vertical-align: middle;">
                  <svg viewBox="0 0 24 24" style="width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
              </div>
              <div class="lbl" style="flex: 1; font-size: 9px; font-weight: 600; letter-spacing: .015em; color: rgba(255,255,255,.95); text-transform: uppercase; line-height: 1.2; text-align: left;">TOTAL<br>VENTA</div>
              <div class="val" id="res-total-ingresos" style="font-size: 14.5px; font-weight: 700; color: #fff; text-align: right; flex-shrink: 0;">$0</div>
            </div>

            <div class="stat-card blue-bg" style="background: #082c4a; border: 1.5px solid transparent; border-radius: 8px; padding: 8px 6px; display: flex; flex-direction: row; align-items: center; gap: 6px; min-width: 0;">
              <div class="icon-wrap" style="width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #fff;">
                <div class="icon" style="width: 20px; height: 20px; display: inline-block; vertical-align: middle;">
                  <svg viewBox="0 0 24 24" style="width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v10M9.5 9.5c0-1.1 1.1-2 2.5-2s2.5.9 2.5 2-1.1 2-2.5 2-2.5.9-2.5 2 1.1 2 2.5 2 2.5-.9 2.5-2" />
                  </svg>
                </div>
              </div>
              <div class="lbl" style="flex: 1; font-size: 9px; font-weight: 600; letter-spacing: .015em; color: rgba(255,255,255,.95); text-transform: uppercase; line-height: 1.2; text-align: left;">PROMEDIO<br>X VENTA</div>
              <div class="val" id="res-promedio-venta" style="font-size: 14.5px; font-weight: 700; color: #fff; text-align: right; flex-shrink: 0;">0,0</div>
            </div>

            <div class="stat-card blue-bg" style="background: #082c4a; border: 1.5px solid transparent; border-radius: 8px; padding: 8px 6px; display: flex; flex-direction: row; align-items: center; gap: 6px; min-width: 0;">
              <div class="icon-wrap" style="width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #fff;">
                <div class="icon" style="width: 20px; height: 20px; display: inline-block; vertical-align: middle;">
                  <svg viewBox="0 0 24 24" style="width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
              </div>
              <div class="lbl" style="flex: 1; font-size: 9px; font-weight: 600; letter-spacing: .015em; color: rgba(255,255,255,.95); text-transform: uppercase; line-height: 1.2; text-align: left;">BRIG.<br>CAMPO</div>
              <div class="val" id="res-bc" style="font-size: 14.5px; font-weight: 700; color: #fff; text-align: right; flex-shrink: 0;">0</div>
            </div>

            <div class="stat-card blue-bg" style="background: #082c4a; border: 1.5px solid transparent; border-radius: 8px; padding: 8px 6px; display: flex; flex-direction: row; align-items: center; gap: 6px; min-width: 0;">
              <div class="icon-wrap" style="width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #fff;">
                <div class="icon" style="width: 20px; height: 20px; display: inline-block; vertical-align: middle;">
                  <svg viewBox="0 0 24 24" style="width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
              </div>
              <div class="lbl" style="flex: 1; font-size: 9px; font-weight: 600; letter-spacing: .015em; color: rgba(255,255,255,.95); text-transform: uppercase; line-height: 1.2; text-align: left;">BRIG.<br>ATENCIÓN</div>
              <div class="val" id="res-ba" style="font-size: 14.5px; font-weight: 700; color: #fff; text-align: right; flex-shrink: 0;">0</div>
            </div>
          </div>

          <span id="res-cero" class="hidden">0</span>
        </div>
      </div>

      <div class="no-print flex justify-end mb-3">
        <button onclick="abrirPlantillaNomina()" id="btn-pdf" title="Generar PDF"
          class="shrink-0 bg-white hover:bg-slate-100 text-gris-medio rounded-full w-9 h-9 flex items-center justify-center transition-all border border-slate-200 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
          </svg>
        </button>
      </div>

      <!-- ══ BLOQUE FINANCIERO: INGRESOS · DEDUCCIONES · RESUMEN ══ -->
      <div class="fila-resumen">

        <!-- Panel 1: INGRESOS -->
        <div class="panel">
          <div class="panel-header">
            <div class="icon-circle verde">
              <div class="icon"><svg viewBox="0 0 24 24">
                  <path d="M23 6l-9.5 9.5-5-5L1 18" />
                  <path d="M17 6h6v6" />
                </svg></div>
            </div>
            <h3>INGRESOS</h3>
          </div>
          <table class="linea">
            <tr>
              <td>Cantidad Afiliaciones</td>
              <td class="d" id="ingCantidadAff">0</td>
            </tr>
            <tr>
              <td>Total Afiliaciones</td>
              <td class="d" id="ingTotalAff">$0</td>
            </tr>
            <tr>
              <td>Lent. Especial</td>
              <td class="d" id="ingLenteEsp">$0</td>
            </tr>
            <tr>
              <td>Lent. Sencillo</td>
              <td class="d" id="ingLenteSen">$0</td>
            </tr>
            <tr>
              <td>Bono Asistencia</td>
              <td class="d" id="ingPagoAsistencia">$0</td>
            </tr>
          </table>
          <div class="total-fila verde"><span>TOTAL INGRESOS</span><span id="ingTotalIngresos">$0</span></div>
        </div>

        <!-- Panel 2: DEDUCCIONES -->
        <div class="panel">
          <div class="panel-header">
            <div class="icon-circle morado">
              <div class="icon"><svg viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <path d="M7 10l5 5 5-5" />
                  <path d="M12 15V3" />
                </svg></div>
            </div>
            <h3>DEDUCCIONES</h3>
          </div>
          <table class="linea">
            <tr>
              <td>Préstamos / Adelantos</td>
              <td class="d" id="dedPrestamo">$0</td>
            </tr>
            <tr>
              <td>Comida / Medicina</td>
              <td class="d" id="dedComida">$0</td>
            </tr>
            <tr>
              <td>Descuento</td>
              <td class="d" id="dedDescuento">$0</td>
            </tr>
          </table>
          <div class="total-fila morado"><span>TOTAL DEDUCCIONES</span><span id="dedTotalDeducciones">$0</span></div>
        </div>

        <!-- Panel 3: RESUMEN GENERAL -->
        <div class="panel-resumen">
          <div class="icon-circle-big">
            <div class="icon"><svg viewBox="0 0 24 24">
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
              </svg></div>
          </div>
          <h3>RESUMEN GENERAL</h3>
          <div class="subt">Ingresos − Deducciones</div>
          <div class="separator"></div>
          <div class="val-grande" id="res-neto">$0</div>
        </div>

      </div>

      <!-- ══ PESTAÑAS DE SECCIÓN ══ -->
      <div class="grid grid-cols-3 gap-2 mb-4 no-print" id="vistas">
        <button data-vista="nomina" onclick="showVista('nomina')"
          class="vista-btn flex items-center gap-2.5 text-left p-3 rounded-md-plus bg-verde-medio text-white shadow-soft transition-colors">
          <span class="icon-wrap w-8 h-8 shrink-0 rounded-lg fondo-sobre-oscuro-fuerte flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </span>
          <span class="min-w-0">
            <span class="block text-[10px] sm:text-[11px] uppercase opacity-80 font-medium">Sección</span>
            <span class="block text-xs sm:text-sm font-bold mt-0.5">Detalle Jornadas</span>
          </span>
        </button>
        <button data-vista="lentes" onclick="showVista('lentes')"
          class="vista-btn flex items-center gap-2.5 text-left p-3 rounded-md-plus bg-white text-gris-medio shadow-soft transition-colors">
          <span class="icon-wrap w-8 h-8 shrink-0 rounded-lg bg-verde-suave flex items-center justify-center">
            <svg class="w-4 h-4 text-verde-medio" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </span>
          <span class="min-w-0">
            <span class="block text-[10px] sm:text-[11px] uppercase text-gris-medio font-medium">Sección</span>
            <span class="block text-xs sm:text-sm font-bold mt-0.5">Venta de Lentes</span>
          </span>
        </button>
        <button data-vista="brigadas" onclick="showVista('brigadas')"
          class="vista-btn flex items-center gap-2.5 text-left p-3 rounded-md-plus bg-white text-gris-medio shadow-soft transition-colors">
          <span class="icon-wrap w-8 h-8 shrink-0 rounded-lg bg-verde-suave flex items-center justify-center">
            <svg class="w-4 h-4 text-verde-oscuro" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-3.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4"/>
            </svg>
          </span>
          <span class="min-w-0">
            <span class="block text-[10px] sm:text-[11px] uppercase text-gris-medio font-medium">Sección</span>
            <span class="block text-xs sm:text-sm font-bold mt-0.5">Brigadas Trabajadas</span>
          </span>
        </button>
      </div>

    </div>
    <!-- fin wrapper max-w-5xl -->

    <!-- ══ PANEL: DETALLE DE JORNADAS ══ -->
    <div id="panel-nomina" class="vista-panel">

      <div class="max-w-2xl lg:max-w-none mx-auto flex items-center justify-between mb-3 px-1">
        <h3 class="font-bold text-verde-oscuro text-sm sm:text-base uppercase tracking-wide">Detalle de Jornadas y Deducciones</h3>
        <span id="conteo-filtro" class="text-xs text-gris-medio"></span>
      </div>

      <!-- Filtros -->
      <div class="max-w-2xl lg:max-w-none mx-auto grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3" id="filtros">
        <button data-filtro="todos" onclick="filtrar('todos')"
          class="filtro-btn flex items-center gap-2.5 text-left p-3 rounded-md-plus bg-verde-medio text-white shadow-soft transition-colors">
          <span class="icon-wrap w-8 h-8 shrink-0 rounded-lg fondo-sobre-oscuro-fuerte flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </span>
          <span class="min-w-0">
            <span class="block text-[11px] uppercase opacity-80 font-medium">Vista</span>
            <span class="block text-sm font-bold mt-0.5">Nómina por día</span>
          </span>
        </button>
        <button data-filtro="prestamo" onclick="filtrar('prestamo')"
          class="filtro-btn flex items-center gap-2.5 text-left p-3 rounded-md-plus bg-white text-gris-medio border border-slate-200 shadow-soft transition-colors">
          <span class="icon-wrap w-8 h-8 shrink-0 rounded-lg bg-verde-suave flex items-center justify-center">
            <svg class="w-4 h-4 text-verde-medio" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.66 0-3 .9-3 2s1.34 2 3 2 3 .9 3 2-1.34 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 10v2m0-12a4 4 0 100 8 4 4 0 000-8z"/>
            </svg>
          </span>
          <span class="min-w-0">
            <span class="block text-[11px] uppercase text-gris-medio font-medium">Observar</span>
            <span class="block text-sm font-bold mt-0.5">Préstamos</span>
          </span>
        </button>
        <button data-filtro="descuento" onclick="filtrar('descuento')"
          class="filtro-btn flex items-center gap-2.5 text-left p-3 rounded-md-plus bg-white text-gris-medio border border-slate-200 shadow-soft transition-colors">
          <span class="icon-wrap w-8 h-8 shrink-0 rounded-lg bg-verde-suave flex items-center justify-center">
            <svg class="w-4 h-4 text-verde-medio" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h.01M15 12h.01M12 3a9 9 0 100 18 9 9 0 000-18z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 15l8-8"/>
            </svg>
          </span>
          <span class="min-w-0">
            <span class="block text-[11px] uppercase text-gris-medio font-medium">Observar</span>
            <span class="block text-sm font-bold mt-0.5">Descuentos</span>
          </span>
        </button>
        <button data-filtro="aff" onclick="filtrar('aff')"
          class="filtro-btn flex items-center gap-2.5 text-left p-3 rounded-md-plus bg-white text-gris-medio border border-slate-200 shadow-soft transition-colors">
          <span class="icon-wrap w-8 h-8 shrink-0 rounded-lg bg-verde-suave flex items-center justify-center">
            <svg class="w-4 h-4 text-verde-medio" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-3.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4"/>
            </svg>
          </span>
          <span class="min-w-0">
            <span class="block text-[11px] uppercase text-gris-medio font-medium">Observar</span>
            <span class="block text-sm font-bold mt-0.5">Afiliaciones</span>
          </span>
        </button>
      </div>

      <!-- Tabla de movimientos -->
      <div class="max-w-2xl lg:max-w-none mx-auto bg-white rounded-md-plus shadow-card overflow-x-auto border border-slate-200">
        <table class="w-full text-[11px] sm:text-xs">
          <thead>
            <tr class="bg-verde-oscuro text-white text-[10px] sm:text-[11px] uppercase tracking-wide">
              <th class="px-3 py-2.5 text-left font-semibold whitespace-nowrap">Fecha</th>
              <th class="px-3 py-2.5 text-left font-semibold whitespace-nowrap">Municipio</th>
              <th class="px-3 py-2.5 text-left font-semibold whitespace-nowrap">Coordinador</th>
              <th class="px-3 py-2.5 text-center font-semibold whitespace-nowrap">N° Aff</th>
              <th class="px-3 py-2.5 text-center font-semibold whitespace-nowrap">N° Brig</th>
              <th class="px-3 py-2.5 text-right font-semibold whitespace-nowrap">Comida/Med</th>
              <th class="px-3 py-2.5 text-right font-semibold whitespace-nowrap">Prést/Adel</th>
              <th class="px-3 py-2.5 text-right font-semibold whitespace-nowrap">Descuento</th>
              <th class="px-3 py-2.5 text-left font-semibold w-full">Detalle</th>
            </tr>
          </thead>
          <tbody id="res-tabla"></tbody>
        </table>
      </div>
    </div>

    <!-- ══ PANEL: VENTA DE LENTES ══ -->
    <div id="panel-lentes" class="vista-panel hidden max-w-2xl lg:max-w-5xl mx-auto">
      <div class="bg-white rounded-md-plus shadow-card p-6 text-center fade-in border border-slate-200">
        <span class="block text-xs uppercase tracking-wide text-gris-medio font-medium mb-1">Venta de Lentes</span>
        <strong id="res-lent-detalle" class="block text-4xl font-extrabold text-verde-oscuro">0</strong>
        <p class="text-gris-medio text-xs mt-2">Total de lentes vendidos en el periodo de liquidación.</p>
      </div>
      <div id="lentes-tabla-wrap" class="hidden mt-3 bg-white rounded-md-plus shadow-card overflow-x-auto border border-slate-200">
        <table class="w-full text-xs sm:text-sm">
          <thead>
            <tr class="bg-verde-oscuro text-white text-[10px] sm:text-[11px] uppercase tracking-wide">
              <th class="px-3 py-2.5 text-left font-semibold whitespace-nowrap">Fecha</th>
              <th class="px-3 py-2.5 text-left font-semibold whitespace-nowrap">Municipio</th>
              <th class="px-3 py-2.5 text-center font-semibold whitespace-nowrap">C. Prom.</th>
              <th class="px-3 py-2.5 text-center font-semibold whitespace-nowrap">Asist.</th>
              <th class="px-3 py-2.5 text-center font-semibold whitespace-nowrap">Lente Especial</th>
              <th class="px-3 py-2.5 text-center font-semibold whitespace-nowrap">Lente Sencillo</th>
              <th class="px-3 py-2.5 text-right font-semibold whitespace-nowrap">Total Venta</th>
            </tr>
          </thead>
          <tbody id="res-tabla-lentes"></tbody>
        </table>
      </div>
    </div>

    <!-- ══ PANEL: BRIGADAS TRABAJADAS ══ -->
    <div id="panel-brigadas" class="vista-panel hidden">
      <div class="max-w-2xl lg:max-w-5xl mx-auto bg-white rounded-md-plus shadow-card p-6 text-center fade-in mb-3 border border-slate-200">
        <span class="block text-xs uppercase tracking-wide text-gris-medio font-medium mb-1">Total Brigadas Trabajadas</span>
        <strong id="res-total-brigadas" class="block text-4xl font-extrabold text-verde-oscuro">0</strong>
        <p class="text-gris-medio text-xs mt-2">Municipios con jornada de brigada registrada.</p>
      </div>
      <div class="max-w-2xl lg:max-w-5xl mx-auto bg-white rounded-md-plus shadow-card overflow-x-auto border border-slate-200">
        <table class="w-full text-xs sm:text-sm">
          <thead>
            <tr class="bg-verde-oscuro text-white text-[10px] sm:text-[11px] uppercase tracking-wide">
              <th class="px-3 py-2.5 text-left font-semibold whitespace-nowrap">Fecha</th>
              <th class="px-3 py-2.5 text-left font-semibold whitespace-nowrap">Municipio</th>
              <th class="px-3 py-2.5 text-left font-semibold whitespace-nowrap">Coordinador</th>
              <th class="px-3 py-2.5 text-center font-semibold whitespace-nowrap">N° Brigada</th>
              <th class="px-3 py-2.5 text-center font-semibold whitespace-nowrap">Estatus</th>
            </tr>
          </thead>
          <tbody id="res-tabla-brigadas"></tbody>
        </table>
      </div>
    </div>

    <!-- ══ PIE DE PÁGINA INSTITUCIONAL ══ -->
    <div class="max-w-2xl lg:max-w-5xl mx-auto mt-4 rounded-md-plus overflow-hidden bg-verde-oscuro fade-in">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 text-white text-[10px] sm:text-xs text-center sm:text-left">
        <div class="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
          <span>Salud visual para todos, a tu alcance.</span>
        </div>
        <div class="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>Comprometidos con tu bienestar visual.</span>
        </div>
      </div>
    </div>

  </div>
  <!-- fin #resultado -->

</div>
<!-- fin contenedor principal -->

<script>
(function() {
  function loadLogos() {
    const logoElements = document.querySelectorAll('[data-empresa-logo]');
    if (logoElements.length === 0) return;
    
    logoElements.forEach(el => {
      const fallback = el.dataset.empresaLogo || 'assets/images/logomenu.png';
      el.setAttribute('src', fallback);
      const altText = el.dataset.empresaNombre || '';
      if (altText) el.setAttribute('alt', altText);
    });
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadLogos);
  } else {
    loadLogos();
  }
})();
</script>
