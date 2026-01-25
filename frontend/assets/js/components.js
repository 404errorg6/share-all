/**
 * Shared UI Components (Sidebar, Modals, Toasts)
 */

const Components = {
    /**
     * Inject Sidebar into the current page
     */
    injectSidebar(activePageId) {
        const sidebarHTML = `
        <div id="drawer-backdrop" onclick="Components.toggleMenu()"
            class="fixed inset-0 bg-black/50 z-40 hidden opacity-0 transition-opacity duration-300"></div>

        <div id="drawer-sidebar"
            class="fixed inset-y-0 left-0 z-50 w-[75%] max-w-[300px] bg-white dark:bg-[#1b2327] shadow-2xl transform -translate-x-full transition-transform duration-300 ease-in-out flex flex-col text-slate-900 dark:text-white">
            <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/50">
                <h3 class="text-lg font-bold text-slate-800 dark:text-white tracking-tight text-center w-full">FTP Manager</h3>
                <button onclick="Components.toggleMenu()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <div class="flex-1 overflow-y-auto py-2">
                <a href="/pages/browse-local.html" class="px-6 py-4 border-b border-slate-50 dark:border-slate-800/20 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group ${activePageId === 'browse-local' ? 'bg-primary/5 border-l-4 border-primary' : ''}">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center size-10 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-500">
                            <span class="material-symbols-outlined">sd_storage</span>
                        </div>
                        <span class="text-sm font-semibold">Local Storage</span>
                    </div>
                </a>
                <a href="/pages/hosting-panel.html" class="px-6 py-4 border-b border-slate-50 dark:border-slate-800/20 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group ${activePageId === 'hosting-panel' ? 'bg-primary/5 border-l-4 border-primary' : ''}">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center size-10 rounded-full bg-blue-50 dark:bg-blue-500/10 text-primary">
                            <span class="material-symbols-outlined">wifi</span>
                        </div>
                        <span class="text-sm font-semibold">Hosting Panel</span>
                    </div>
                </a>
                <a href="/pages/remote-connections.html" class="px-6 py-4 border-b border-slate-50 dark:border-slate-800/20 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group ${activePageId === 'remote-connections' ? 'bg-primary/5 border-l-4 border-primary' : ''}">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center size-10 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-500">
                            <span class="material-symbols-outlined">add_link</span>
                        </div>
                        <span class="text-sm font-semibold">Remote Connections</span>
                    </div>
                </a>
                <a href="/pages/hosting-access.html" class="px-6 py-4 border-b border-slate-50 dark:border-slate-800/20 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group ${activePageId === 'hosting-access' ? 'bg-primary/5 border-l-4 border-primary' : ''}">
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
        </div>`;
        document.body.insertAdjacentHTML('beforeend', sidebarHTML);

        // Add gesture support
        let touchStartX = 0;
        document.addEventListener('touchstart', e => touchStartX = e.changedTouches[0].screenX, { passive: true });
        document.addEventListener('touchend', e => {
            const touchEndX = e.changedTouches[0].screenX;
            if (touchEndX > touchStartX + 100 && touchStartX < 50) this.toggleMenu(true);
            if (touchEndX < touchStartX - 100) this.toggleMenu(false);
        }, { passive: true });
    },

    isMenuOpen: false,

    toggleMenu(force) {
        this.isMenuOpen = force !== undefined ? force : !this.isMenuOpen;
        const backdrop = document.getElementById('drawer-backdrop');
        const sidebar = document.getElementById('drawer-sidebar');

        if (this.isMenuOpen) {
            backdrop.classList.remove('hidden');
            setTimeout(() => { backdrop.classList.add('active', 'opacity-100'); sidebar.classList.remove('-translate-x-full'); }, 10);
        } else {
            backdrop.classList.remove('opacity-100'); sidebar.classList.add('-translate-x-full');
            setTimeout(() => backdrop.classList.add('hidden'), 300);
        }
    },

    /**
     * Global Modal Injection
     */
    injectModal() {
        const modalHTML = `
        <div id="gui-modal" class="fixed inset-0 z-[100] flex items-center justify-center p-6 hidden">
            <div id="modal-backdrop-gui" class="modal-overlay absolute inset-0" onclick="Components.closeGuiModal()"></div>
            <div id="modal-content-gui" class="modal-container relative w-full max-w-[340px] glass-panel rounded-[2rem] overflow-hidden shadow-2xl">
                <div class="p-8 text-center">
                    <div id="modal-icon-container" class="mx-auto size-20 rounded-full flex items-center justify-center mb-6">
                        <span id="modal-icon" class="material-symbols-outlined text-[40px]"></span>
                    </div>
                    <h3 id="modal-title" class="text-xl font-bold text-white mb-2 leading-tight"></h3>
                    <p id="modal-message" class="text-slate-400 text-sm leading-relaxed mb-8 px-2"></p>
                    <div class="flex flex-col gap-3">
                        <button id="modal-primary-btn" class="h-14 w-full rounded-2xl font-bold text-lg shadow-lg transition-all active:scale-95"></button>
                        <button id="modal-secondary-btn" onclick="Components.closeGuiModal()" class="h-14 w-full rounded-2xl font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    onModalPrimary: null,

    openGuiModal({ title, message, icon, type, primaryText, onPrimary }) {
        const mTitle = document.getElementById('modal-title');
        const mMsg = document.getElementById('modal-message');
        const mIcon = document.getElementById('modal-icon');
        const mPrimaryBtn = document.getElementById('modal-primary-btn');
        const mIconContainer = document.getElementById('modal-icon-container');

        mTitle.innerText = title; mMsg.innerText = message; mIcon.innerText = icon;
        mPrimaryBtn.innerText = primaryText || 'Confirm';
        this.onModalPrimary = onPrimary;

        mIconContainer.className = "mx-auto size-20 rounded-full flex items-center justify-center mb-6 " + (type === 'danger' ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary');
        mPrimaryBtn.className = "h-14 w-full rounded-2xl font-bold text-lg shadow-lg transition-all active:scale-95 " + (type === 'danger' ? 'bg-danger text-white' : 'bg-primary text-white');

        mPrimaryBtn.onclick = () => { if (this.onModalPrimary) this.onModalPrimary(); this.closeGuiModal(); };

        const modalEl = document.getElementById('gui-modal');
        const backdrop = document.getElementById('modal-backdrop-gui');
        const content = document.getElementById('modal-content-gui');

        modalEl.classList.remove('hidden');
        setTimeout(() => { backdrop.classList.add('active'); content.classList.add('active'); }, 10);
    },

    closeGuiModal() {
        const backdrop = document.getElementById('modal-backdrop-gui');
        const content = document.getElementById('modal-content-gui');
        backdrop.classList.remove('active'); content.classList.remove('active');
        setTimeout(() => document.getElementById('gui-modal').classList.add('hidden'), 300);
    },

    /**
     * Toast Injection and Show
     */
    showToast(message, type = 'success') {
        const containerId = 'global-toast-container';
        let container = document.getElementById(containerId);
        if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            container.className = 'fixed top-4 right-4 z-[110] flex flex-col gap-2 pointer-events-none';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        const bgClass = type === 'error' ? 'bg-danger' : (type === 'info' ? 'bg-blue-500' : 'bg-green-500');
        const icon = type === 'error' ? 'error' : (type === 'info' ? 'info' : 'check_circle');

        toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl ${bgClass} text-white min-w-[280px] transform transition-all duration-300 translate-x-full pointer-events-auto`;
        toast.innerHTML = `
            <span class="material-symbols-outlined text-xl bg-white/20 p-1 rounded-full">${icon}</span>
            <p class="font-medium text-sm">${message}</p>
        `;

        container.appendChild(toast);
        setTimeout(() => toast.classList.remove('translate-x-full'), 10);
        setTimeout(() => {
            toast.classList.add('translate-x-[150%]');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }
};

window.Components = Components;
