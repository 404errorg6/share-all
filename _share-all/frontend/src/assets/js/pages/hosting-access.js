/**
 * Hosting Access Page Logic
 */

export const template = `
    <header class="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4">
        <div class="flex items-center gap-3">
            <button id="menu-btn"
                class="text-primary flex size-10 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                <span class="material-symbols-outlined text-3xl">menu</span>
            </button>
            <h1 class="text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-white">Access Control</h1>
        </div>
    </header>

    <main class="flex-1 flex flex-col p-4 gap-6 overflow-y-auto">
        <!-- ACTIVE SESSIONS -->
        <section class="flex flex-col gap-3">
            <div class="flex items-center justify-between px-2">
                <h2 class="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Sessions</h2>
                <span id="active-count" class="section-badge bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-[10px] font-bold">0 Live</span>
            </div>
            <div id="clients-list" class="grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[50px]">
                <!-- Clients will be injected here -->
            </div>
        </section>

        <!-- BLACKLIST -->
        <section class="flex flex-col gap-3">
            <div class="flex items-center justify-between px-2">
                <h2 class="text-xs font-bold text-slate-500 uppercase tracking-widest">Blacklisted IPs</h2>
                <span id="blocked-count" class="section-badge bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-[10px] font-bold">0 Blocked</span>
            </div>
            <div id="blacklist-list" class="grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[50px]">
                <!-- Blacklist will be injected here -->
            </div>
        </section>

        <!-- Sync Loading -->
        <div id="sync-state" class="flex flex-col items-center justify-center py-10 text-slate-500 hidden">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
            <p class="text-[10px] uppercase font-bold">Syncing security...</p>
        </div>
    </main>
`;

export function init() {
    const clientsList = document.getElementById('clients-list');
    const blacklistList = document.getElementById('blacklist-list');
    const activeBadge = document.getElementById('active-count');
    const blockedBadge = document.getElementById('blocked-count');
    const menuBtn = document.getElementById('menu-btn');
    const syncState = document.getElementById('sync-state');

    let pollInterval = null;

    async function fetchSecurityState() {
        try {
            if (syncState) syncState.classList.remove('hidden');
            const [clients, blacklist] = await Promise.all([
                fetch('/api/ftp/server/connected-clients').then(r => r.json()),
                fetch('/api/ftp/server/blacklist-client').then(r => r.json())
            ]);
            renderUI(clients || [], blacklist || []);
        } catch (e) {
            console.error('Security Sync Error:', e);
        } finally {
            if (syncState) syncState.classList.add('hidden');
        }
    }

    function renderUI(clients, blacklist) {
        if (!clientsList || !blacklistList) return;

        clientsList.innerHTML = '';
        activeBadge.innerText = `${clients.length} Live`;
        
        if (clients.length === 0) {
            clientsList.innerHTML = `
                <div class="col-span-full py-8 text-center text-slate-400 bg-slate-50 dark:bg-white/5 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                    <p class="text-xs font-medium">No active sessions</p>
                </div>
            `;
        } else {
            clients.forEach(c => {
                const card = document.createElement('div');
                card.className = "flex items-center justify-between p-4 bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm";
                card.innerHTML = `
                    <div class="flex items-center gap-3">
                        <div class="size-11 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                            <span class="material-symbols-outlined">person</span>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-sm font-bold text-slate-900 dark:text-white">${c.Name || 'User'}</span>
                            <span class="text-[10px] font-mono text-slate-500">${c.Host}:${c.Port}</span>
                        </div>
                    </div>
                `;
                
                const blockBtn = document.createElement('button');
                blockBtn.className = "size-10 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors";
                blockBtn.innerHTML = '<span class="material-symbols-outlined text-[20px]">block</span>';
                blockBtn.onclick = () => confirmBlock(c.Host);
                
                card.appendChild(blockBtn);
                clientsList.appendChild(card);
            });
        }

        blacklistList.innerHTML = '';
        blockedBadge.innerText = `${blacklist.length} Blocked`;
        
        if (blacklist.length === 0) {
            blacklistList.innerHTML = `
                <div class="col-span-full py-8 text-center text-slate-400 bg-slate-50 dark:bg-white/5 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                    <p class="text-xs font-medium">No blacklisted IPs</p>
                </div>
            `;
        } else {
            blacklist.forEach(ip => {
                const card = document.createElement('div');
                card.className = "flex items-center justify-between p-4 bg-white dark:bg-slate-800/20 rounded-2xl border border-red-500/10 shadow-sm";
                card.innerHTML = `
                    <div class="flex items-center gap-3">
                        <div class="size-11 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                            <span class="material-symbols-outlined">security</span>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-sm font-bold text-slate-900 dark:text-slate-200">${ip}</span>
                            <span class="text-[10px] text-red-400 font-bold uppercase">Blocked</span>
                        </div>
                    </div>
                `;
                
                const unblockBtn = document.createElement('button');
                unblockBtn.className = "px-4 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-black hover:bg-primary/20 transition-all uppercase";
                unblockBtn.innerText = 'Unblock';
                unblockBtn.onclick = () => unblockIP(ip);
                
                card.appendChild(unblockBtn);
                blacklistList.appendChild(card);
            });
        }
    }

    function confirmBlock(host) {
        if (!globalThis.Components?.openGuiModal) return;
        
        globalThis.Components.openGuiModal({
            title: 'Block Client IP?',
            message: `This will disconnect ${host} and prevent any further access until manually removed.`,
            icon: 'gavel',
            type: 'danger',
            primaryText: 'Block & Terminate',
            onPrimary: async () => {
                try {
                    const params = new URLSearchParams({ host });
                    const res = await fetch('/api/ftp/server/blacklist-client', { method: 'POST', body: params });
                    if (res.ok) { 
                        if (globalThis.Components?.showToast) globalThis.Components.showToast(`IP ${host} blocked`);
                        fetchSecurityState(); 
                    }
                } catch (err) {
                    console.error('Failed to block IP:', err);
                }
            }
        });
    }

    async function unblockIP(host) {
        try {
            const params = new URLSearchParams({ host });
            const res = await fetch('/api/ftp/server/whitelist-client', { method: 'POST', body: params });
            if (res.ok) { 
                if (globalThis.Components?.showToast) globalThis.Components.showToast('Access restored');
                fetchSecurityState(); 
            }
        } catch (err) {
            console.error('Failed to unblock IP:', err);
        }
    }

    if (menuBtn && globalThis.Components?.toggleMenu) {
        menuBtn.onclick = () => globalThis.Components.toggleMenu();
    }

    // Initial load
    fetchSecurityState();
    pollInterval = setInterval(fetchSecurityState, 5000);

    if (globalThis.Components?.Sidebar?.highlight) {
        globalThis.Components.Sidebar.highlight('hosting-access');
    }

    // Return cleanup function for the router
    return () => {
        if (pollInterval) clearInterval(pollInterval);
    };
}
