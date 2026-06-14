/**
 * Connect to Other Device - Landing Page
 */

export const template = `
  <header class="sticky top-0 z-20 bg-background-dark/95 backdrop-blur-md border-b border-white/5 p-4">
    <div class="flex items-center gap-3">
      <button id="menu-btn"
        class="text-primary flex size-10 items-center justify-center rounded-full hover:bg-slate-800 transition-colors">
        <span class="material-symbols-outlined text-3xl">menu</span>
      </button>
      <div class="flex flex-col">
        <h2 class="text-xl font-bold text-white">Connect to Other Device</h2>
      </div>
    </div>
  </header>

  <main class="flex flex-col gap-4 p-4">
    <!-- Auto-Discovery Card -->
    <div class="bg-white/5 rounded-2xl overflow-hidden border border-white/5 p-4 transition-all duration-300 cursor-pointer hover:border-primary/30 hover:bg-white/10" onclick="globalThis.Router.navigate('/discover/auto')">
      <div class="flex items-center gap-3">
        <div class="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <span class="material-symbols-outlined text-2xl">radar</span>
        </div>
        <div class="flex-1">
          <h3 class="text-white font-bold">Auto-Discovery</h3>
          <p class="text-[#9cb0ba] text-xs">Scan local network</p>
        </div>
        <span class="material-symbols-outlined text-primary">chevron_right</span>
      </div>
    </div>

    <!-- Internet App-to-App Card -->
    <div class="bg-white/5 rounded-2xl overflow-hidden border border-white/5 p-4 transition-all duration-300 cursor-pointer hover:border-violet-400/30 hover:bg-white/10" onclick="globalThis.Router.navigate('/discover/internet')">
      <div class="flex items-center gap-3">
        <div class="size-10 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400">
          <span class="material-symbols-outlined text-2xl">hub</span>
        </div>
        <div class="flex-1">
          <h3 class="text-white font-bold">Internet App-to-App</h3>
          <p class="text-[#9cb0ba] text-xs">Connect via invite link</p>
        </div>
        <span class="material-symbols-outlined text-violet-400">chevron_right</span>
      </div>
    </div>
  </main>
`;

export function init() {
  const menuBtn = document.getElementById("menu-btn");
  if (menuBtn && globalThis.Components?.toggleMenu) {
    menuBtn.onclick = () => globalThis.Components.toggleMenu();
  }
}
