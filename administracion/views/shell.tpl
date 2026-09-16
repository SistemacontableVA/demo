<link rel="stylesheet" href="administracion/styles/admin.css">

<div id="admin-shell">

  <!-- ══ SIDEBAR ══ -->
  <nav id="admin-sidebar" role="navigation" aria-label="Menu administrativo">

    <!-- Logo -->
    <div class="admin-sidebar-logo">
      <div class="flex flex-col items-center justify-center text-center gap-0">
        <img data-empresa-logo="assets/images/logomenu.png"
             class="admin-logo-img object-contain" alt="Logo Vision de Aguila">
        <div class="flex items-center gap-2 text-white text-[13px] font-bold tracking-wide">
          <svg class="w-5 h-5 text-verde-medio" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span>Panel Administrativo</span>
        </div>
      </div>
    </div>

    <!-- Navegacion -->
    <div class="flex-1 py-2">

      <div class="admin-menu-section">Principal</div>

      <a class="admin-menu-item" data-ruta="dashboard" onclick="adminNavegar('dashboard')">
        <svg class="admin-menu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
        </svg>
        <span>Dashboard</span>
      </a>

      <div class="admin-menu-section">Gestion</div>

      <a class="admin-menu-item" data-ruta="documentos" onclick="adminNavegar('documentos')">
        <svg class="admin-menu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <span>Documentos</span>
      </a>

      <a class="admin-menu-item" data-ruta="ingresarNomina" data-solo-admin="true" onclick="adminNavegar('ingresarNomina')">
        <svg class="admin-menu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>
        <span>Gestión de Nómina</span>
      </a>

      <a class="admin-menu-item" data-ruta="nominaPromotor" onclick="adminNavegar('nominaPromotor')">
        <svg class="admin-menu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 1.343-3 3v1h6v-1c0-1.657-1.343-3-3-3zm-4 4h8M7 16h10"/>
        </svg>
        <span>Consulta Nómina</span>
      </a>

      <a class="admin-menu-item" data-ruta="contabilidadDiaria" onclick="adminNavegar('contabilidadDiaria')">
        <svg class="admin-menu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 4h16v16H4zM8 8h8M8 12h8M8 16h5"/>
        </svg>
        <span>Contabilidad Diaria</span>
      </a>

      <a class="admin-menu-item" data-ruta="oficina" onclick="adminNavegar('oficina')">
        <svg class="admin-menu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 7h6m-7 4h8m-9 4h10M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"/>
        </svg>
        <span>Nómina Oficina</span>
      </a>

      <a class="admin-menu-item" data-ruta="reportes" onclick="adminNavegar('reportes')">
        <svg class="admin-menu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
        <span>Reportes</span>
      </a>

      <a class="admin-menu-item" data-ruta="cargaLentes" onclick="adminNavegar('cargaLentes')">
        <svg class="admin-menu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m-4 8h10a2 2 0 002-2V7a2 2 0 00-2-2H7v11z"/>
        </svg>
        <span>Gestión de Lentes</span>
      </a>

      <div class="admin-menu-section">Herramientas</div>

      <a class="admin-menu-item" data-ruta="recordatorios" onclick="adminNavegar('recordatorios')">
        <svg class="admin-menu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
        <span>Recordatorios</span>
      </a>

      <a class="admin-menu-item" data-ruta="recordatorioMasivo" onclick="adminNavegar('recordatorioMasivo')">
        <svg class="admin-menu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        </svg>
        <span>Recordatorio Masivo</span>
      </a>

      <a class="admin-menu-item" data-ruta="atencionMunicipio" data-secretaria="true" onclick="adminNavegar('atencionMunicipio')">
        <svg class="admin-menu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M3 14h18M10 3v18M14 3v18M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z"/>
        </svg>
        <span>Atención Municipio</span>
      </a>

      <div class="admin-menu-section">Sistema</div>

      <a class="admin-menu-item" data-ruta="catalogos" data-solo-admin="true" onclick="adminNavegar('catalogos')">
        <svg class="admin-menu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
        </svg>
        <span>Catalogos</span>
      </a>

      <a class="admin-menu-item" data-ruta="configuracion" data-solo-admin="true" onclick="adminNavegar('configuracion')">
        <svg class="admin-menu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        <span>Configuracion</span>
      </a>

    </div>

    <!-- Footer: usuario + logout -->
    <div class="admin-sidebar-footer">
      <div class="flex items-center gap-2 mb-3">
        <div class="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 avatar-inicial">A</div>
        <div class="min-w-0">
          <div class="text-white text-sm font-bold truncate" id="sidebar-perfil-label">Administrador</div>
        </div>
      </div>
      <button onclick="adminLogout()"
              class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors text-xs">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
        </svg>
        Cerrar sesion
      </button>
    </div>

  </nav>
  <!-- fin sidebar -->

  <!-- ══ MAIN WRAPPER ══ -->
  <div id="admin-main-wrapper">

    <!-- Topbar -->
    <header id="admin-topbar">
      <div class="flex items-center gap-1">
        <!-- Botón hamburguesa (solo móvil) -->
        <button id="admin-hamburger" onclick="adminToggleSidebar()" aria-label="Abrir menú">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <line x1="3" y1="6"  x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <h2 id="admin-topbar-titulo" class="text-verde-oscuro font-semibold text-sm sm:text-base">Dashboard</h2>
        <span id="admin-topbar-badge"
              class="hidden text-[10px] font-semibold px-2 py-0.5 rounded-full bg-verde-suave text-verde-oscuro">
        </span>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-slate-400 text-xs hidden sm:block" data-empresa-nombre></span>
        <!-- Botón manual administrador -->
        <button onclick="window.open('manuales/administrador.html', '_blank')"
          title="Manual de usuario"
          class="flex items-center gap-1.5 text-slate-400 hover:text-verde-oscuro transition-colors text-xs font-medium px-2.5 py-1.5 rounded-lg hover:bg-slate-50">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
          <span class="hidden sm:inline">Manual</span>
        </button>
        <div class="w-7 h-7 rounded-full bg-verde-suave flex items-center justify-center text-verde-oscuro text-xs font-bold avatar-inicial">A</div>
      </div>
    </header>

    <!-- Contenido dinamico -->
    <main id="admin-content" role="main" aria-live="polite">
      <div class="flex items-center justify-center h-40">
        <div class="spinner"></div>
      </div>
    </main>

  </div>
  <!-- fin main wrapper -->

</div>
<!-- fin admin-shell -->

<!-- Overlay oscuro para cerrar el sidebar en móvil -->
<div id="admin-mobile-overlay" onclick="adminToggleSidebar()"></div>
