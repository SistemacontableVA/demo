<link rel="stylesheet" href="administracion/styles/admin.css">

<div class="admin-login-shell w-full">
  <div class="admin-login-panel text-slate-800 relative">
    <div class="text-center pt-2 mb-6">
      <h1 class="text-2xl font-bold text-[#0c2d48] tracking-tight mb-0.5">Panel Administrativo</h1>
      <p class="text-sm font-semibold text-[#d4a138] mb-3" data-empresa-nombre></p>
      <div class="flex items-center justify-center gap-2 mb-4">
        <span class="w-1.5 h-1.5 rounded-full bg-[#d4a138]"></span>
      </div>
      <p class="text-[12px] text-slate-500 font-normal leading-relaxed max-w-[280px] mx-auto">
        Accede al sistema para gestionar recursos, consultar información y generar reportes.
      </p>
    </div>

    <form id="admin-login-form" onsubmit="adminLoginSubmit(event)" novalidate class="space-y-4">
      <div class="relative flex items-center bg-[#eef2f6] rounded-xl overflow-hidden border border-slate-200/80 input-shadow">
        <div class="w-12 h-12 bg-[#0c2d48] flex items-center justify-center text-white shrink-0">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <input type="text" id="admin-usuario" placeholder="Usuario" autocomplete="username"
               class="w-full bg-transparent px-4 py-3 text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none">
      </div>

      <div class="relative flex items-center bg-[#eef2f6] rounded-xl overflow-hidden border border-slate-200/80 input-shadow">
        <div class="w-12 h-12 bg-[#0c2d48] flex items-center justify-center text-white shrink-0">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <input type="password" id="admin-password" placeholder="Contraseña" autocomplete="current-password"
               class="w-full bg-transparent pl-4 pr-10 py-3 text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none">
        <button type="button" onclick="adminTogglePassword()" aria-label="Mostrar contraseña"
                class="absolute right-3.5 text-slate-400 hover:text-slate-600">
          <svg id="admin-eye-icon" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      </div>

      <div id="admin-login-error" class="admin-login-error">Usuario o contraseña incorrectos.</div>

      <div class="flex items-center justify-between text-[11px] pt-1 pb-2">
        <label class="flex items-center gap-1.5 cursor-pointer text-slate-600 font-medium select-none">
          <input type="checkbox" checked class="custom-checkbox w-3.5 h-3.5 rounded border-slate-300 text-[#078c38] focus:ring-0 cursor-pointer">
          <span>Recordarme</span>
        </label>
        <a href="#" onclick="event.preventDefault()" class="font-medium text-[#078c38] hover:underline">¿Olvidaste tu contraseña?</a>
      </div>

      <button type="submit" id="admin-btn-login"
              class="w-full btn-emerald-gradient text-white font-semibold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.99] text-sm">
        <span id="admin-btn-login-text">Ingresar al Sistema</span>
        <span id="admin-btn-login-spinner" class="hidden w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
              style="animation: spin .7s linear infinite;"></span>
        <svg id="admin-login-arrow" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </button>
    </form>

    <button type="button" onclick="adminVolverLanding()"
            class="mt-5 text-xs font-semibold text-slate-500 hover:text-[#0c2d48] transition-colors flex items-center justify-center gap-1 mx-auto">
      <span aria-hidden="true">←</span><span>Volver a perfiles</span>
    </button>

    <div class="mt-8 pt-4 border-t border-slate-300/60 flex items-center justify-between text-[11px] text-slate-400 font-medium">
      <div class="flex items-center gap-1.5 text-slate-500">
        <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Sistema Seguro</span>
      </div>
      <span class="text-slate-400">v5.0 • 2026</span>
    </div>
  </div>
</div>
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
