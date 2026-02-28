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
                <a href="/pages/browse-local.html" onclick="Components.handleSidebarClick(event, '/pages/browse-local.html')" 
                    class="px-6 py-4 border-b border-slate-50 dark:border-slate-800/20 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all duration-200 group ${activePageId === 'browse-local' ? 'bg-primary/5 border-l-4 border-primary' : ''}">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center size-10 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-500">
                            <span class="material-symbols-outlined">sd_storage</span>
                        </div>
                        <span class="text-sm font-semibold">Local Storage</span>
                    </div>
                </a>
                <a href="/pages/hosting-panel.html" onclick="Components.handleSidebarClick(event, '/pages/hosting-panel.html')"
                    class="px-6 py-4 border-b border-slate-50 dark:border-slate-800/20 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all duration-200 group ${activePageId === 'hosting-panel' ? 'bg-primary/5 border-l-4 border-primary' : ''}">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center size-10 rounded-full bg-blue-50 dark:bg-blue-500/10 text-primary">
                            <span class="material-symbols-outlined">wifi</span>
                        </div>
                        <span class="text-sm font-semibold">Hosting Panel</span>
                    </div>
                </a>
                <a href="/pages/discover-servers.html" onclick="Components.handleSidebarClick(event, '/pages/discover-servers.html')"
                    class="px-6 py-4 border-b border-slate-50 dark:border-slate-800/20 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all duration-200 group ${activePageId === 'remote-connections' ? 'bg-primary/5 border-l-4 border-primary' : ''}">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center size-10 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-500">
                            <span class="material-symbols-outlined">wifi_tethering</span>
                        </div>
                        <span class="text-sm font-semibold">Discover Servers</span>
                    </div>
                </a>
                <a href="/pages/transfers.html" onclick="Components.handleSidebarClick(event, '/pages/transfers.html')"
                    class="px-6 py-4 border-b border-slate-50 dark:border-slate-800/20 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all duration-200 group ${activePageId === 'transfers' ? 'bg-primary/5 border-l-4 border-primary' : ''}">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center size-10 rounded-full bg-teal-50 dark:bg-teal-500/10 text-teal-500">
                            <span class="material-symbols-outlined">swap_horiz</span>
                        </div>
                        <span class="text-sm font-semibold">Transfers</span>
                    </div>
                </a>
                <a href="/pages/hosting-access.html" onclick="Components.handleSidebarClick(event, '/pages/hosting-access.html')"
                    class="px-6 py-4 border-b border-slate-50 dark:border-slate-800/20 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all duration-200 group ${activePageId === 'hosting-access' ? 'bg-primary/5 border-l-4 border-primary' : ''}">
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

        // Global Logger initialization is handled at the bottom of the file
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
     * Handle Sidebar Link Clicks for smooth transition
     */
    handleSidebarClick(event, url) {
        // Find the active anchor if child was clicked
        const link = event.currentTarget;

        // Visual feedback
        link.style.transform = 'scale(0.98)';
        link.style.opacity = '0.7';

        // Fast close
        this.toggleMenu(false);

        // Small delay to allow the sidebar to start its exit animation
        // and show the click feedback before the browser unloads the page
        setTimeout(() => {
            window.location.href = url;
        }, 150);

        event.preventDefault();
        return false;
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
        if (!backdrop || !content) return;
        backdrop.classList.remove('active'); content.classList.remove('active');
        setTimeout(() => {
            const modal = document.getElementById('gui-modal');
            if (modal) modal.classList.add('hidden');
        }, 300);
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
    },

    /**
     * Global Floating Logger Logic
     */
    Logger: {
        isInitialized: false,
        isOpen: false,
        isAutoScroll: true,
        logCount: 0,
        abortController: null,
        MAX_LOGS: 1000,
        PRUNE_COUNT: 200, // Clear 20% (200) when it hits 1000
        STORAGE_KEY: 'ftp_session_logs',

        init() {
            if (this.isInitialized) return;
            this.isInitialized = true;
            this.injectUI();
            this.loadFromStorage();
            this.connect();
        },

        injectUI() {
            if (document.getElementById('floating-log-trigger')) return;

            const styles = `
            <style id="logger-core-styles">
                #floating-log-trigger {
                    position: fixed !important;
                    bottom: 24px !important;
                    right: 24px !important;
                    z-index: 10000 !important;
                    width: 56px !important;
                    height: 56px !important;
                    border-radius: 16px !important;
                    background: #0f172a !important;
                    border: 1px solid rgba(56, 189, 248, 0.3) !important;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4) !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    color: #38bdf8 !important;
                    cursor: pointer !important;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    padding: 0 !important;
                    margin: 0 !important;
                }
                #floating-log-trigger:hover {
                    transform: scale(1.1) rotate(5deg) !important;
                    background: #1e293b !important;
                }
                #log-badge {
                    position: absolute !important;
                    top: -2px !important;
                    right: -2px !important;
                    width: 12px !important;
                    height: 12px !important;
                    background: #38bdf8 !important;
                    border: 2px solid #0f172a !important;
                    border-radius: 50% !important;
                    display: none;
                }
                #log-badge.active {
                    display: block !important;
                    animation: badge-pulse 2s infinite !important;
                }
                @keyframes badge-pulse {
                    0% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.7); }
                    70% { box-shadow: 0 0 0 8px rgba(56, 189, 248, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0); }
                }
                #mini-log-window {
                    position: fixed !important;
                    bottom: 92px !important;
                    right: 24px !important;
                    z-index: 10000 !important;
                    width: 420px !important;
                    max-width: calc(100vw - 48px) !important;
                    height: 520px !important;
                    background: rgba(15, 23, 42, 0.98) !important;
                    backdrop-filter: blur(20px) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    border-radius: 32px !important;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
                    display: flex !important;
                    flex-direction: column !important;
                    overflow: hidden !important;
                    transform-origin: bottom right !important;
                    opacity: 0 !important;
                    visibility: hidden !important;
                    transform: scale(0.9) !important;
                    pointer-events: none !important;
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
                }
                #mini-log-window.open {
                    opacity: 1 !important;
                    visibility: visible !important;
                    transform: scale(1) !important;
                    pointer-events: auto !important;
                }
                #mini-log-container::-webkit-scrollbar { width: 4px; }
                #mini-log-container::-webkit-scrollbar-thumb { background: rgba(56, 189, 248, 0.2); border-radius: 10px; }
            </style>`;

            const html = `
            ${styles}
            <button id="floating-log-trigger" onclick="Components.Logger.toggle()" title="System Logs">
                <span class="material-symbols-outlined" style="font-size: 32px;">terminal</span>
                <span id="log-badge"></span>
            </button>

            <div id="mini-log-window">
                <div style="padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03);">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 8px; height: 8px; background: #38bdf8; border-radius: 50%; box-shadow: 0 0 10px #38bdf8;"></div>
                        <span style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.5);">Session Monitor</span>
                    </div>
                    <div style="display: flex; gap: 4px;">
                        <button onclick="Components.Logger.clear()" style="width: 36px; height: 36px; border-radius: 12px; border: none; background: transparent; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.05)';this.style.color='#fff'" onmouseout="this.style.background='transparent';this.style.color='#64748b'">
                            <span class="material-symbols-outlined" style="font-size: 20px;">delete_sweep</span>
                        </button>
                        <button onclick="Components.Logger.toggle()" style="width: 36px; height: 36px; border-radius: 12px; border: none; background: transparent; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.05)';this.style.color='#fff'" onmouseout="this.style.background='transparent';this.style.color='#64748b'">
                            <span class="material-symbols-outlined" style="font-size: 20px;">close</span>
                        </button>
                    </div>
                </div>
                
                <div id="mini-log-container" style="flex: 1; overflow-y: auto; padding: 24px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; line-height: 1.6; background: rgba(0,0,0,0.2);">
                    <div style="color: #64748b; font-style: italic; opacity: 0.5;">Syncing history...</div>
                </div>

                <div style="padding: 18px 24px; border-top: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.02); display: flex; align-items: center; justify-content: space-between;">
                    <span id="mini-log-count" style="font-size: 9px; font-weight: 900; color: #475569; text-transform: uppercase; letter-spacing: 1px;">0 Lines</span>
                    <button id="mini-scroll-lock" onclick="Components.Logger.toggleScrollLock()" style="background: none; border: none; color: #38bdf8; cursor: pointer; display: flex; align-items: center;">
                        <span class="material-symbols-outlined" style="font-size: 20px;">vertical_align_bottom</span>
                    </button>
                </div>
            </div>
`;
            document.body.insertAdjacentHTML('beforeend', html);
        },

        toggle() {
            this.isOpen = !this.isOpen;
            const win = document.getElementById('mini-log-window');
            const badge = document.getElementById('log-badge');

            if (this.isOpen) {
                win.classList.add('open');
                badge.classList.remove('active');

                // Re-scroll to bottom when opened
                const container = document.getElementById('mini-log-container');
                if (this.isAutoScroll) container.scrollTop = container.scrollHeight;
            } else {
                win.classList.remove('open');
            }
        },

        toggleScrollLock() {
            this.isAutoScroll = !this.isAutoScroll;
            const btn = document.getElementById('mini-scroll-lock');
            const icon = btn.querySelector('.material-symbols-outlined');

            if (this.isAutoScroll) {
                btn.classList.add('text-primary');
                btn.classList.remove('text-slate-500');
                icon.innerText = 'vertical_align_bottom';
                const container = document.getElementById('mini-log-container');
                container.scrollTop = container.scrollHeight;
            } else {
                btn.classList.remove('text-primary');
                btn.classList.add('text-slate-500');
                icon.innerText = 'vertical_align_center';
            }
        },

        clear() {
            const container = document.getElementById('mini-log-container');
            container.innerHTML = '<div class="text-slate-500 italic opacity-40">History cleared...</div>';
            this.logCount = 0;
            sessionStorage.removeItem(this.STORAGE_KEY);
            this.updateCount();
        },

        updateCount() {
            const el = document.getElementById('mini-log-count');
            if (el) el.innerText = `${this.logCount} Lines`;
        },

        saveLog(line) {
            try {
                let logs = JSON.parse(sessionStorage.getItem(this.STORAGE_KEY) || '[]');
                logs.push(line);
                if (logs.length > this.MAX_LOGS) {
                    logs = logs.slice(this.PRUNE_COUNT);
                    this.renderLogs(logs); // Hard refresh UI when pruned
                }
                sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));
            } catch (e) {
                console.warn('Storage error', e);
            }
        },

        loadFromStorage() {
            try {
                const logs = JSON.parse(sessionStorage.getItem(this.STORAGE_KEY) || '[]');
                this.renderLogs(logs);
            } catch (e) { }
        },

        renderLogs(logs) {
            const container = document.getElementById('mini-log-container');
            if (!container) return;
            container.innerHTML = '';
            logs.forEach(msg => container.appendChild(this.createEntry(msg)));
            this.logCount = logs.length;
            this.updateCount();
            if (this.isAutoScroll) container.scrollTop = container.scrollHeight;
        },

        createEntry(line) {
            const entry = document.createElement('div');
            let colorClass = 'text-slate-300';
            if (line.includes('[ERROR]') || line.toLowerCase().includes('failed')) colorClass = 'text-red-400';
            else if (line.includes('[SYSTEM]') || line.includes('Starting')) colorClass = 'text-primary';
            else if (line.includes('[SUCCESS]')) colorClass = 'text-green-400';

            entry.className = `${colorClass} py-0.5 border-b border-white/5 break-all opacity-90`;
            entry.innerText = line;
            return entry;
        },

        async connect() {
            if (this.abortController) this.abortController.abort();
            this.abortController = new AbortController();

            try {
                const response = await fetch('/api/logs', { signal: this.abortController.signal });
                if (!response.ok) return;

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                const container = document.getElementById('mini-log-container');

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n').filter(l => l.trim().length > 0);

                    lines.forEach(line => {
                        this.logCount++;
                        container.appendChild(this.createEntry(line));
                        this.saveLog(line);
                    });

                    this.updateCount();

                    // UI Notification
                    if (!this.isOpen && lines.length > 0) {
                        document.getElementById('log-badge').classList.add('active');
                    }

                    // Auto scroll
                    if (this.isAutoScroll && this.isOpen) {
                        container.scrollTop = container.scrollHeight;
                    }
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.warn('Logging offline. Retrying...', err);
                    setTimeout(() => this.connect(), 5000);
                }
            }
        }
    },

    /**
     * Global Transfer Service (Persistence & Background Tracking)
     */
    Transfers: {
        STORAGE_KEY: 'ftp_transfer_history',
        LIMIT: 50,
        isPolling: false,

        init() {
            if (this.isPolling) return;
            this.isPolling = true;
            this.startBackgroundPolling();
        },

        getHistory() {
            try {
                return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
            } catch (e) {
                return [];
            }
        },

        addCompleted(item) {
            if (!item || !item.Name) return;
            let history = this.getHistory();

            // Check for duplicates (same name, size, and completed within 10 seconds)
            const isDup = history.some(h =>
                h.Name === item.Name &&
                Math.abs((h.Timestamp || 0) - (item.Timestamp || Date.now())) < 10000
            );

            if (isDup) return;

            item.Timestamp = item.Timestamp || Date.now();
            item.Status = 'Completed';
            item.Percent = 100;

            history.unshift(item);
            if (history.length > this.LIMIT) {
                history = history.slice(0, this.LIMIT);
            }

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));

            // Dispatch event so active UI (if any) can update
            window.dispatchEvent(new CustomEvent('transfer-completed', { detail: item }));
        },

        startBackgroundPolling() {
            const poll = async () => {
                try {
                    const response = await fetch('/api/ftp/transfers');
                    if (response.ok) {
                        const data = await response.json();
                        this.processActiveTransfers(data || []);
                    }
                } catch (e) { }

                setTimeout(() => poll(), 1000); // Background poll every 1s
            };

            poll();
        },

        processActiveTransfers(activeData) {
            // Handle null/nil case from backend gracefully
            if (!activeData || activeData === "null") activeData = [];

            // Track state in sessionStorage to detect completions across page nav
            const lastStateInput = sessionStorage.getItem('ftp_active_tracking');
            let lastState = [];
            try { lastState = JSON.parse(lastStateInput || '[]'); } catch (e) { }

            const activeNames = new Set(activeData.map(d => d.Name));

            lastState.forEach(prev => {
                // If it vanished from active list -> It completed
                // We verify it was actually registered (Percent > 0) to avoid false completions
                // during the backend's startup delay (where it returns nil for a second)
                if (!activeNames.has(prev.Name) && prev.Percent > 0) {
                    this.addCompleted({
                        ...prev,
                        Percent: 100,
                        Timestamp: Date.now()
                    });
                }
            });

            sessionStorage.setItem('ftp_active_tracking', JSON.stringify(activeData));
        }
    }
};

window.Components = Components;

// Automatic initialization for global components
document.addEventListener('DOMContentLoaded', () => {
    Components.Logger.init();
    Components.Transfers.init();
});
