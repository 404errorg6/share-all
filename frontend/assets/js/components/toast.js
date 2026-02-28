/**
 * Toast Component Logic
 */

Components.Toast = {
    show(message, type = 'success') {
        const displayMessage = type === 'error' ? this.mapError(message) : message;
        const container = this._getContainer();
        const toast = this._createElement(displayMessage, type);

        container.appendChild(toast);
        this._setupInteractions(toast);
    },

    mapError(message) {
        if (!message) return "Unknown error occurred";
        if (message.includes("connectex") || message.includes("actively refused it") || message.includes("dial tcp")) {
            return "Device is offline or connection refused";
        }
        if (message.includes("530 Authentication error") || message.includes("Invalid credentials")) {
            return "Incorrect username/password";
        }
        return message;
    },

    _getContainer() {
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

    _createElement(message, type) {
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

    _setupInteractions(toast) {
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

// Aliases for compatibility
Components.showToast = (msg, type) => Components.Toast.show(msg, type);
Components.mapError = (msg) => Components.Toast.mapError(msg);
