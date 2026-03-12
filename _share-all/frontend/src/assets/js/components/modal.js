/**
 * Modal Component Logic
 */

Components.Modal = {
    inject() {
        const modalHTML = `
        <div id="gui-modal" class="fixed inset-0 z-[100] flex items-center justify-center p-6 hidden">
            <div id="modal-backdrop-gui" class="modal-overlay absolute inset-0" onclick="Components.Modal.close()"></div>
            <div id="modal-content-gui" class="modal-container relative w-full max-w-[340px] glass-panel rounded-[2rem] overflow-hidden shadow-2xl">
                <div class="p-8 text-center">
                    <div id="modal-icon-container" class="mx-auto size-20 rounded-full flex items-center justify-center mb-6">
                        <span id="modal-icon" class="material-symbols-outlined text-[40px]"></span>
                    </div>
                    <h3 id="modal-title" class="text-xl font-bold text-white mb-2 leading-tight"></h3>
                    <p id="modal-message" class="text-slate-400 text-sm leading-relaxed mb-8 px-2"></p>
                    <div class="flex flex-col gap-3">
                        <button id="modal-primary-btn" class="h-14 w-full rounded-2xl font-bold text-lg shadow-lg transition-all active:scale-95"></button>
                        <button id="modal-secondary-btn" onclick="Components.Modal.close()" class="h-14 w-full rounded-2xl font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    onPrimary: null,
    onSecondary: null,

    open({ title, message, icon, type, primaryText, secondaryText, onPrimary, onSecondary }) {
        const mTitle = document.getElementById('modal-title');
        const mMsg = document.getElementById('modal-message');
        const mIcon = document.getElementById('modal-icon');
        const mPrimaryBtn = document.getElementById('modal-primary-btn');
        const mSecondaryBtn = document.getElementById('modal-secondary-btn');
        const mIconContainer = document.getElementById('modal-icon-container');

        mTitle.innerText = title;
        mMsg.innerText = message;
        mIcon.innerText = icon;
        mPrimaryBtn.innerText = primaryText || 'Confirm';
        mSecondaryBtn.innerText = secondaryText || 'Cancel';
        this.onPrimary = onPrimary;
        this.onSecondary = onSecondary;

        mIconContainer.className = "mx-auto size-24 rounded-full flex items-center justify-center mb-6 transition-all duration-500 " +
            (type === 'danger' ? 'icon-glow-danger' : type === 'warning' ? 'icon-glow-warning' : 'icon-glow-primary');

        mPrimaryBtn.className = "h-16 w-full rounded-2xl font-bold text-lg transition-all active:scale-95 text-white shadow-lg " +
            (type === 'danger' ? 'modal-btn-danger' : type === 'warning' ? 'modal-btn-warning' : 'modal-btn-primary');

        mPrimaryBtn.onclick = () => {
            if (this.onPrimary) this.onPrimary();
            this.close();
        };

        mSecondaryBtn.onclick = () => {
            if (this.onSecondary) this.onSecondary();
            this.close();
        };

        const modalEl = document.getElementById('gui-modal');
        const backdrop = document.getElementById('modal-backdrop-gui');
        const content = document.getElementById('modal-content-gui');

        modalEl.classList.remove('hidden');
        setTimeout(() => {
            backdrop.classList.add('active');
            content.classList.add('active');
        }, 10);
    },

    close() {
        const backdrop = document.getElementById('modal-backdrop-gui');
        const content = document.getElementById('modal-content-gui');
        if (!backdrop || !content) return;
        backdrop.classList.remove('active');
        content.classList.remove('active');
        setTimeout(() => {
            const modal = document.getElementById('gui-modal');
            if (modal) modal.classList.add('hidden');
        }, 300);
    }
};

// Aliases for compatibility
Components.injectModal = () => Components.Modal.inject();
Components.openGuiModal = (opts) => Components.Modal.open(opts);
Components.closeGuiModal = () => Components.Modal.close();
