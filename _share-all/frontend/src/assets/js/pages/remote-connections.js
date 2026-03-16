import { StartDiscovering } from '../../../../bindings/changeme/internal/services/discovery.js';
import { Events } from '@wailsio/runtime';

/**
 * Discover Servers (Remote Connections) Page Logic
 */

export const template = `
        <!-- Header -->
        <header class="sticky top-0 z-20 bg-background-dark/95 backdrop-blur-md border-b border-slate-800 p-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <button id="menu-btn"
                        class="text-primary flex size-10 items-center justify-center rounded-full hover:bg-slate-800 transition-colors">
                        <span class="material-symbols-outlined text-3xl">menu</span>
                    </button>
                    <h2 class="text-xl font-bold leading-tight tracking-tight text-white">Discover Servers</h2>
                </div>
            </div>
        </header>

        <main class="flex-1 flex flex-col p-4 gap-8" id="connections-container">
            <!-- Discovery Section -->
            <section>
                <div class="flex items-center justify-between mb-4">
                    <h3
                        class="text-sm font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary text-lg animate-pulse">radar</span>
                        Auto-Discovery
                    </h3>
                    <div class="h-px flex-1 bg-white/5 mx-4"></div>
                    <button id="rescan-btn"
                        class="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-all">
                        <span class="material-symbols-outlined text-sm">refresh</span> RE-SCAN
                    </button>
                </div>

                <div id="discovery-state"
                    class="hidden py-16 flex flex-col items-center justify-center bg-slate-800/10 rounded-[2rem] border border-white/5">
                    <div class="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4">
                    </div>
                    <p class="text-sm font-bold text-slate-300">Scanning Network</p>
                    <p class="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-medium">Looking for active
                        FTP servers...</p>
                </div>

                <div id="discovery-list" class="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
            </section>
        </main>

    <!-- Login Modal -->
    <div id="login-modal" class="fixed inset-0 z-[100] flex items-center justify-center p-6 hidden">
        <div id="login-modal-backdrop" class="modal-overlay absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        <div id="login-modal-content"
            class="modal-container relative w-full max-w-[360px] bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl transition-all scale-95 opacity-0">
            <div class="p-8">
                <div class="flex items-center gap-4 mb-8">
                    <div class="size-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <span class="material-symbols-outlined text-4xl">lock_open</span>
                    </div>
                    <div class="flex-1 overflow-hidden">
                        <h3 id="login-server-name" class="text-xl font-bold text-white truncate leading-tight"></h3>
                        <p id="login-server-addr" class="text-slate-500 text-xs font-mono"></p>
                    </div>
                </div>

                <div class="space-y-4 mb-8">
                    <div class="group">
                        <label
                            class="block text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2 ml-1">Username</label>
                        <div class="relative">
                            <span
                                class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl group-focus-within:text-primary transition-colors">person</span>
                            <input type="text" id="login-user"
                                class="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-5 text-white focus:border-primary/50 focus:bg-primary/[0.02] outline-none transition-all"
                                placeholder="Enter username">
                        </div>
                    </div>
                    <div class="group">
                        <label
                            class="block text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2 ml-1">Password</label>
                        <div class="relative">
                            <span
                                class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl group-focus-within:text-primary transition-colors">key</span>
                            <input type="password" id="login-pass"
                                class="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-5 text-white focus:border-primary/50 focus:bg-primary/[0.02] outline-none transition-all"
                                placeholder="••••••••">
                        </div>
                    </div>
                </div>

                <div class="flex flex-col gap-3">
                    <button id="submit-login-btn"
                        class="h-16 w-full bg-primary text-white rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-lg">Connect
                        Server</button>
                    <button id="close-login-btn"
                        class="h-12 w-full rounded-xl font-bold text-slate-500 hover:text-white transition-colors">Cancel</button>
                </div>
            </div>
        </div>
    </div>
`;

export function init() {
    const discoveryList = document.getElementById('discovery-list');
    const discoveryState = document.getElementById('discovery-state');
    const loginModal = document.getElementById('login-modal');
    const rescanBtn = document.getElementById('rescan-btn');
    const loginModalContent = document.getElementById('login-modal-content');
    const loginModalBackdrop = document.getElementById('login-modal-backdrop');

    let discoveryAbortController = null;
    let discoveryTimeout = null;
    let discoveryEventUnsubscribe = null;
    const discoveredCards = new Map();
    let pendingServer = null;

    async function _StartDiscovering() {
        try {
            return StartDiscovering();
        } catch (e) {
            return Promise.reject(e);
        }
    }

    async function discoverServers() {
        if (discoveryAbortController) discoveryAbortController.abort();
        if (discoveryTimeout) clearTimeout(discoveryTimeout);
        if (discoveryEventUnsubscribe) discoveryEventUnsubscribe();

        discoveryList.innerHTML = '';
        discoveredCards.clear();

        discoveryState.innerHTML = `
            <div class="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
            <p class="text-sm font-bold text-slate-300">Scanning Network</p>
            <p class="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-medium">Looking for active FTP servers...</p>
        `;
        discoveryState.classList.remove('hidden');
        if (rescanBtn) rescanBtn.classList.add('hidden');

        discoveryAbortController = new AbortController();
        const signal = discoveryAbortController.signal;

        discoveryTimeout = setTimeout(() => {
            if (discoveryAbortController) discoveryAbortController.abort();
        }, 10000);

        try {
            discoveryEventUnsubscribe = Events.On('client:discover-servers', (event) => {
                const server = event && event.data ? event.data : event;
                const serverId = `${server.Name || ''}-${server.IP}:${server.Port}`;
                discoveryState.classList.add('hidden');
                renderDiscoveredServer(serverId, server);
            });

            const discoveryPromise = _StartDiscovering();
            signal.addEventListener('abort', () => {
                if (discoveryPromise && typeof discoveryPromise.cancel === 'function') discoveryPromise.cancel();
            });

            await discoveryPromise;
        } catch (err) {
            if (err.name !== 'AbortError') console.error('Discovery error:', err);
        } finally {
            if (discoveryTimeout) clearTimeout(discoveryTimeout);
            if (discoveredCards.size === 0) {
                discoveryState.innerHTML = `
                    <span class="material-symbols-outlined text-4xl text-slate-500 mb-3 opacity-20">search_off</span>
                    <p class="text-sm font-bold text-slate-300">No Servers Found</p>
                    <p class="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-medium">Make sure other devices are on the same network</p>
                `;
                discoveryState.classList.remove('hidden');
            }
            if (rescanBtn) rescanBtn.classList.remove('hidden');
            if (discoveryEventUnsubscribe) discoveryEventUnsubscribe();
            discoveryAbortController = null;
        }
    }

    function renderDiscoveredServer(serverId, server) {
        if (discoveredCards.has(serverId)) return;

        const card = document.createElement('div');
        card.className = "flex flex-col bg-slate-800/40 border border-white/5 rounded-2xl overflow-hidden hover:border-primary/30 transition-all cursor-pointer group animate-fade-in";
        discoveryList.appendChild(card);
        discoveredCards.set(serverId, card);

        card.onclick = () => {
            const name = server.Name || server.IP;
            localStorage.removeItem('current_server_id');
            if (server.AnonymousAllowed) {
                connectWithCredentials(server.IP, server.Port, 'anonymous', 'anonymous', true, name);
            } else {
                showLoginPrompt(server);
            }
        };

        card.innerHTML = `
            <div class="p-4 flex items-center gap-4">
                <div class="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                    <span class="material-symbols-outlined text-3xl">wifi_tethering</span>
                </div>
                <div class="flex flex-col flex-1 overflow-hidden">
                    <h3 class="text-white font-bold truncate">${server.Name || server.IP}</h3>
                    <div class="flex items-center gap-2 mt-0.5">
                        <span class="text-[10px] bg-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded font-mono">${server.IP}:${server.Port}</span>
                        ${server.AnonymousAllowed ?
                '<span class="text-[9px] bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Public</span>' :
                '<span class="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Private</span>'
            }
                    </div>
                </div>
                <div class="size-10 rounded-full flex items-center justify-center text-primary/40 group-hover:text-primary transition-colors">
                    <span class="material-symbols-outlined">chevron_right</span>
                </div>
            </div>
        `;
    }

    function showLoginPrompt(server) {
        document.getElementById('login-server-name').innerText = server.Name || server.IP;
        document.getElementById('login-server-addr').innerText = `${server.IP}:${server.Port}`;
        document.getElementById('login-user').value = '';
        document.getElementById('login-pass').value = '';

        loginModal.classList.remove('hidden');
        setTimeout(() => {
            loginModalContent.classList.remove('scale-95', 'opacity-0');
            loginModalContent.classList.add('scale-100', 'opacity-100');
        }, 10);
        pendingServer = server;
    }

    function closeLoginModal() {
        loginModalContent.classList.add('scale-95', 'opacity-0');
        loginModalContent.classList.remove('scale-100', 'opacity-100');
        setTimeout(() => loginModal.classList.add('hidden'), 300);
    }

    async function connectWithCredentials(host, port, user, pass, isAnon, name) {
        if (globalThis.Components?.showToast) globalThis.Components.showToast(`Connecting to ${host}...`, 'info');
        try {
            const params = new URLSearchParams();
            params.append('server_host', host);
            params.append('server_port', port);
            params.append('user', user);
            params.append('password', pass);
            params.append('anonymous', isAnon ? 'true' : 'false');

            const response = await fetch('/api/ftp/client/connect-to-server', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString()
            });

            const text = await response.text();
            if (response.ok || text.includes('already connected')) {
                if (globalThis.Components?.showToast) globalThis.Components.showToast('Connected successfully', 'success');
                if (name) {
                    localStorage.setItem('current_remote_name', name);
                    localStorage.setItem('current_remote_host', host);
                    localStorage.setItem('current_remote_port', port);
                }
                window.location.hash = '#/access'; // Logic updated in router
            } else {
                if (globalThis.Components?.showToast) globalThis.Components.showToast(`Connection failed: ${text}`, 'error');
            }
        } catch (err) {
            if (globalThis.Components?.showToast) globalThis.Components.showToast('Network error or server unreachable', 'error');
        }
    }

    // Set up listeners
    if (rescanBtn) rescanBtn.onclick = () => discoverServers();
    if (loginModalBackdrop) loginModalBackdrop.onclick = closeLoginModal;
    const submitBtn = document.getElementById('submit-login-btn');
    if (submitBtn) submitBtn.onclick = async () => {
        const user = document.getElementById('login-user').value;
        const pass = document.getElementById('login-pass').value;
        if (!user || !pass) {
            if (globalThis.Components?.showToast) globalThis.Components.showToast('Please enter both username and password', 'error');
            return;
        }
        const name = pendingServer.Name || pendingServer.IP;
        closeLoginModal();
        await connectWithCredentials(pendingServer.IP, pendingServer.Port, user, pass, false, name);
    };
    const closeBtn = document.getElementById('close-login-btn');
    if (closeBtn) closeBtn.onclick = closeLoginModal;

    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn && globalThis.Components?.toggleMenu) menuBtn.onclick = () => globalThis.Components.toggleMenu();

    // Check status or start discovery
    async function checkStatus() {
        try {
            const response = await fetch('/api/ftp/client/status');
            if (response.ok) {
                const status = await response.json();
                if (status === "connected") {
                    window.location.hash = '#/access';
                    return;
                }
            }
        } catch (e) { }
        discoverServers();
    }

    if (globalThis.Components?.Sidebar?.highlight) {
        globalThis.Components.Sidebar.highlight('remote-connections');
    }

    checkStatus();
}

