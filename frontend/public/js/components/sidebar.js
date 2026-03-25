/**
 * Sidebar Component Logic
 */

globalThis.Components.Sidebar = {
    _template: `
        <div id="drawer-backdrop" onclick="globalThis.Components.Sidebar.toggleMenu()"
            class="fixed inset-0 bg-black/50 z-40 hidden opacity-0 transition-opacity duration-300"></div>

        <div id="drawer-sidebar"
            class="fixed inset-y-0 left-0 z-50 w-[75%] max-w-[300px] bg-white dark:bg-[#1b2327] shadow-2xl transform -translate-x-full flex flex-col text-slate-900 dark:text-white">
            <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/50">
                <h3 class="text-lg font-bold text-slate-800 dark:text-white tracking-tight text-center w-full">FTP Manager</h3>
                <button onclick="globalThis.Components.Sidebar.toggleMenu()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <div class="flex-1 overflow-y-auto py-2">
                <a href="#/" onclick="globalThis.Components.Sidebar.handleClick(event, '#/')" 
                    class="sidebar-link px-6 py-4 border-b border-slate-50 dark:border-slate-800/20 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all duration-200 group border-l-4 border-transparent" data-id="browse-local">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center size-10 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-500">
                            <span class="material-symbols-outlined">sd_storage</span>
                        </div>
                        <span class="text-sm font-semibold">Local Storage</span>
                    </div>
                </a>
                <a href="#/hosting" onclick="globalThis.Components.Sidebar.handleClick(event, '#/hosting')"
                    class="sidebar-link px-6 py-4 border-b border-slate-50 dark:border-slate-800/20 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all duration-200 group border-l-4 border-transparent" data-id="hosting-panel">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center size-10 rounded-full bg-blue-50 dark:bg-blue-500/10 text-primary">
                            <span class="material-symbols-outlined">wifi</span>
                        </div>
                        <span class="text-sm font-semibold">Hosting Panel</span>
                    </div>
                </a>
                <a href="#/discover" onclick="globalThis.Components.Sidebar.handleClick(event, '#/discover')"
                    class="sidebar-link px-6 py-4 border-b border-slate-50 dark:border-slate-800/20 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all duration-200 group border-l-4 border-transparent" data-id="discover-servers">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center size-10 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-500">
                            <span class="material-symbols-outlined">wifi_tethering</span>
                        </div>
                        <span class="text-sm font-semibold">Discover Servers</span>
                    </div>
                </a>
                <a href="#/transfers" onclick="globalThis.Components.Sidebar.handleClick(event, '#/transfers')"
                    class="sidebar-link px-6 py-4 border-b border-slate-50 dark:border-slate-800/20 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all duration-200 group border-l-4 border-transparent" data-id="transfers">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center size-10 rounded-full bg-teal-50 dark:bg-teal-500/10 text-teal-500">
                            <span class="material-symbols-outlined">swap_horiz</span>
                        </div>
                        <span class="text-sm font-semibold">Transfers</span>
                    </div>
                </a>
                <a href="#/access" onclick="globalThis.Components.Sidebar.handleClick(event, '#/access')"
                    class="sidebar-link px-6 py-4 border-b border-slate-50 dark:border-slate-800/20 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all duration-200 group border-l-4 border-transparent" data-id="hosting-access">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center size-10 rounded-full bg-green-50 dark:bg-green-500/10 text-green-500">
                            <span class="material-symbols-outlined">shield</span>
                        </div>
                        <span class="text-sm font-semibold">Access Control</span>
                    </div>
                </a>
            </div>
            <div class="p-4 border-t border-slate-100 dark:border-slate-800/50">
                <p class="text-[10px] text-center text-slate-500 opacity-50 uppercase tracking-widest font-bold">FTP Project v1.0</p>
            </div>
        </div>`,

    inject(activePageId) {
        if (document.getElementById('drawer-sidebar')) return;
        document.body.insertAdjacentHTML('beforeend', this._template);
        
        // Add transition classes after initial render to avoid flash
        setTimeout(() => {
            const sidebar = document.getElementById('drawer-sidebar');
            const backdrop = document.getElementById('drawer-backdrop');
            if (sidebar) sidebar.classList.add('transition-transform', 'duration-300', 'ease-in-out');
            if (backdrop) backdrop.classList.add('transition-opacity', 'duration-300');
        }, 50);

        if (activePageId) this.highlight(activePageId);

        // Add gesture support
        let touchStartX = 0;
        document.addEventListener('touchstart', e => touchStartX = e.changedTouches[0].screenX, { passive: true });
        document.addEventListener('touchend', e => {
            const touchEndX = e.changedTouches[0].screenX;
            if (touchEndX > touchStartX + 100 && touchStartX < 50) this.toggleMenu(true);
            if (touchEndX < touchStartX - 100) this.toggleMenu(false);
        }, { passive: true });
    },

    highlight(activePageId) {
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.classList.remove('bg-primary/5', 'border-primary');
            link.classList.add('border-transparent');
        });
        const activeLink = document.querySelector(`.sidebar-link[data-id="${activePageId}"]`);
        if (activeLink) {
            activeLink.classList.remove('border-transparent');
            activeLink.classList.add('bg-primary/5', 'border-primary');
        }
    },

    isMenuOpen: false,

    toggleMenu(force) {
        // Ensure sidebar DOM is injected before attempting to toggle
        if (!document.getElementById('drawer-backdrop') || !document.getElementById('drawer-sidebar')) {
            this.inject();
        }

        this.isMenuOpen = force !== undefined ? force : !this.isMenuOpen;
        const backdrop = document.getElementById('drawer-backdrop');
        const sidebar = document.getElementById('drawer-sidebar');

        if (this.isMenuOpen) {
            backdrop.classList.remove('hidden');
            setTimeout(() => {
                backdrop.classList.add('active', 'opacity-100');
                sidebar.classList.remove('-translate-x-full');
            }, 10);
        } else {
            backdrop.classList.remove('opacity-100');
            sidebar.classList.add('-translate-x-full');
            setTimeout(() => backdrop.classList.add('hidden'), 300);
        }
    },

    handleClick(event, url) {
        const link = event.currentTarget;
        link.style.transform = 'scale(0.98)';
        link.style.opacity = '0.7';
        this.toggleMenu(false);
        setTimeout(() => {
            window.location.hash = url;
            link.style.transform = '';
            link.style.opacity = '';
        }, 150);
        event.preventDefault();
        return false;
    }
};

// Aliases for compatibility
globalThis.Components.injectSidebar = (id) => globalThis.Components.Sidebar.inject(id);
globalThis.Components.toggleMenu = (force) => globalThis.Components.Sidebar.toggleMenu(force);
globalThis.Components.handleSidebarClick = (e, url) => globalThis.Components.Sidebar.handleClick(e, url);
