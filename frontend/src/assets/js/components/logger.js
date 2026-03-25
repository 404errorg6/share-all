import { Events } from '@wailsio/runtime';

globalThis.Components.Logger = {
    isInitialized: false,
    isOpen: false,
    isAutoScroll: true,
    logCount: 0,
    MAX_LOGS: 1000,
    PRUNE_COUNT: 200,
    STORAGE_KEY: 'ftp_session_logs',

    init() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        this.injectUI();
        this.loadFromStorage();
        this.subscribe();
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
                height: auto !important;
                max-height: min(520px, calc(100dvh - 120px)) !important;
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
        <button id="floating-log-trigger" onclick="globalThis.Components.Logger.toggle()" title="System Logs">
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
                    <button id="clear-log-btn" onclick="globalThis.Components.Logger.clear()" style="width: 36px; height: 36px; border-radius: 12px; border: none; background: transparent; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                        <span class="material-symbols-outlined" style="font-size: 20px;">delete_sweep</span>
                    </button>
                    <button id="close-log-btn" onclick="globalThis.Components.Logger.toggle()" style="width: 36px; height: 36px; border-radius: 12px; border: none; background: transparent; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                        <span class="material-symbols-outlined" style="font-size: 20px;">close</span>
                    </button>
                </div>
            </div>
            
            <div id="mini-log-container" style="flex: 1; overflow-y: auto; padding: 24px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; line-height: 1.6; background: rgba(0,0,0,0.2);">
                <div style="color: #64748b; font-style: italic; opacity: 0.5;">No logs yet...</div>
            </div>

            <div style="padding: 18px 24px; border-top: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.02); display: flex; align-items: center; justify-content: space-between;">
                <span id="mini-log-count" style="font-size: 9px; font-weight: 900; color: #475569; text-transform: uppercase; letter-spacing: 1px;">0 Lines</span>
                <button id="mini-scroll-lock" onclick="globalThis.Components.Logger.toggleScrollLock()" style="background: none; border: none; color: #38bdf8; cursor: pointer; display: flex; align-items: center;">
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
            if (container) container.scrollTop = container.scrollHeight;
        } else {
            btn.classList.remove('text-primary');
            btn.classList.add('text-slate-500');
            icon.innerText = 'vertical_align_center';
        }
    },

    clear() {
        const container = document.getElementById('mini-log-container');
        if (container) container.innerHTML = '<div class="text-slate-500 italic opacity-40">History cleared...</div>';
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
                this.renderLogs(logs);
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
        entry.className = `py-0.5 border-b border-white/5 break-all opacity-90`;

        const lowerLine = line.toLowerCase();
        const isError = lowerLine.includes('error');
        const isSuccess = lowerLine.includes('success') || lowerLine.includes('successfully');
        const isWebShare = lowerLine.includes('[web-share]');

        // Escape HTML to prevent XSS
        let html = line.replace(/&/g, '&amp;')
                       .replace(/</g, '&lt;')
                       .replace(/>/g, '&gt;');

        if (isError) {
            entry.classList.add('text-red-400');
            html = html.replace('[LOGS]:', '<span class="text-red-500 font-black">[LOGS]:</span>');
        } else if (isWebShare) {
            entry.classList.add('text-orange-400');
            html = html.replace('[LOGS]:', '<span class="text-orange-500 font-black">[LOGS]:</span>');
            html = html.replace(/\[Web-share\]/gi, '<span class="text-orange-500 font-bold">[Web-share]</span>');
        } else if (isSuccess) {
            entry.classList.add('text-green-400');
            html = html.replace('[LOGS]:', '<span class="text-green-500 font-black">[LOGS]:</span>');
        } else {
            // Default: Only the prefix is blue, the message remains neutral
            entry.classList.add('text-slate-300');
            html = html.replace('[LOGS]:', '<span class="text-primary font-black">[LOGS]:</span>');
            
            // Sub-rule: Theme specific tags if present in normal logs
            if (line.includes('[Discovery]')) {
                html = html.replace(/\[Discovery\]/gi, '<span class="text-cyan-400 font-bold">[Discovery]</span>');
            }
            if (line.includes('[SYSTEM]')) {
                html = html.replace(/\[SYSTEM\]/gi, '<span class="text-primary font-bold">[SYSTEM]</span>');
            }
        }

        entry.innerHTML = html;
        return entry;
    },



    subscribe() {
        console.log('Subscribing to session logs via Events...');
        Events.On('Logs', (event) => {
            const line = event && event.data ? event.data : event;
            if (typeof line !== 'string' || line.trim().length === 0) return;

            const container = document.getElementById('mini-log-container');
            if (!container) return;

            // Remove the "No logs yet..." placeholder if it exists
            if (this.logCount === 0) {
                container.innerHTML = '';
            }

            this.logCount++;
            container.appendChild(this.createEntry(line));
            this.saveLog(line);

            // Notify history/transfer service
            if (globalThis.Components && globalThis.Components.Transfers && globalThis.Components.Transfers.handleLog) {
                try {
                    globalThis.Components.Transfers.handleLog(line);
                } catch (e) { }
            }

            this.updateCount();

            if (!this.isOpen) {
                const badge = document.getElementById('log-badge');
                if (badge) badge.classList.add('active');
            }

            if (this.isAutoScroll && this.isOpen) {
                container.scrollTop = container.scrollHeight;
            }
        });
    }
};

