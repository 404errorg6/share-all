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
                <a href="/pages/discover-servers.html" class="px-6 py-4 border-b border-slate-50 dark:border-slate-800/20 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group ${activePageId === 'remote-connections' ? 'bg-primary/5 border-l-4 border-primary' : ''}">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center size-10 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-500">
                            <span class="material-symbols-outlined">wifi_tethering</span>
                        </div>
                        <span class="text-sm font-semibold">Discover Servers</span>
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

        mIconContainer.className = "mx-auto size-24 rounded-full flex items-center justify-center mb-6 transition-all duration-500 " +
            (type === 'danger' ? 'icon-glow-danger' : 'icon-glow-primary');

        mPrimaryBtn.className = "h-16 w-full rounded-2xl font-bold text-lg transition-all active:scale-95 text-white shadow-lg " +
            (type === 'danger' ? 'modal-btn-danger' : 'modal-btn-primary');

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
     * Map technical errors to user-friendly messages
     */
    mapError(message) {
        if (!message) return "Unknown error occurred";

        // Connection refused / Device offline
        if (message.includes("connectex") || message.includes("actively refused it") || message.includes("dial tcp")) {
            return "Device is offline or connection refused";
        }

        // Authentication error
        if (message.includes("530 Authentication error") || message.includes("Invalid credentials")) {
            return "Incorrect username/password";
        }

        return message;
    },

    /**
     * Toast Injection and Show
     */
    showToast(message, type = 'success') {
        const displayMessage = type === 'error' ? this.mapError(message) : message;
        const container = this._getToastContainer();
        const toast = this._createToastElement(displayMessage, type);

        container.appendChild(toast);

        // Finalize interactions and reveal
        this._setupToastInteractions(toast);
    },

    _getToastContainer() {
        const id = 'global-toast-container';
        let container = document.getElementById(id);
        if (!container) {
            container = document.createElement('div');
            container.id = id;
            container.className = 'fixed top-4 right-4 z-[110] flex flex-col gap-2.5 pointer-events-none';
            document.body.appendChild(container);
        }
        return container;
    },

    _createToastElement(message, type) {
        const toast = document.createElement('div');
        const config = {
            error: { class: 'toast-error', icon: 'error', color: 'text-danger' },
            info: { class: 'toast-info', icon: 'info', color: 'text-primary' },
            warning: { class: 'toast-warning', icon: 'warning', color: 'text-warning' },
            success: { class: 'toast-success', icon: 'check_circle', color: 'text-success' }
        }[type] || { class: 'toast-success', icon: 'check_circle', color: 'text-success' };

        toast.className = `premium-toast ${config.class} flex items-center gap-3 pl-3 pr-5 py-2.5 rounded-xl transition-all duration-500 transform translate-x-full opacity-0 cursor-pointer pointer-events-auto group`;
        toast.innerHTML = `
            <div class="shrink-0 flex items-center justify-center size-8 rounded-lg bg-white/5 ${config.color}">
                <span class="material-symbols-outlined text-[18px]">${config.icon}</span>
            </div>
            <div class="flex-1 overflow-hidden transition-all duration-300">
                <p class="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500 mb-0.5 leading-none">${type}</p>
                <p id="toast-text" class="font-bold text-sm text-white/95 leading-tight truncate px-0.5 whitespace-nowrap transition-all duration-300">${message}</p>
            </div>
        `;
        return toast;
    },

    _setupToastInteractions(toast) {
        let hideTimeout;
        const startHideTimer = () => {
            hideTimeout = setTimeout(() => {
                if (toast?.parentElement) {
                    toast.classList.add('translate-x-full', 'opacity-0');
                    setTimeout(() => toast.remove(), 500);
                }
            }, 5000);
        };

        toast.onclick = () => {
            if (toast.classList.toggle('toast-expanded')) {
                clearTimeout(hideTimeout);
            } else {
                startHideTimer();
            }
        };

        setTimeout(() => toast.classList.remove('translate-x-full', 'opacity-0'), 50);
        startHideTimer();
    }
};

window.Components = Components;
