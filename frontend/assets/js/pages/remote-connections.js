/**
 * Remote Connections Page Logic
 */

const RemoteConnections = {
    discoveryList: null,
    discoveryState: null,
    loginModal: null,
    rescanBtn: null,
    discoveryTimeout: null,

    init() {
        console.log('RemoteConnections: init triggered');
        this.discoveryList = document.getElementById('discovery-list');
        this.discoveryState = document.getElementById('discovery-state');
        this.loginModal = document.getElementById('login-modal');
        this.rescanBtn = document.getElementById('rescan-btn');

        this.checkExistingConnection();
    },

    async checkExistingConnection() {
        const params = new URLSearchParams(window.location.search);
        const forceDiscovery = params.get('ignoreStatus') === 'true';

        try {
            const response = await fetch('/api/ftp/client/status');
            if (response.ok) {
                const status = await response.json();
                if (status === "connected") {
                    if (forceDiscovery) {
                        this.showDeauthWarning();
                        return;
                    }
                    console.log("RemoteConnections: Already connected, redirecting...");
                    window.location.href = 'browse-remote-local.html';
                    return;
                }
            }
        } catch (e) {
            console.error("Error checking connection status:", e);
        }
        this.discoverServers();
    },

    showDeauthWarning() {
        this.discoveryState.innerHTML = `
            <span class="material-symbols-outlined text-4xl text-amber-500 mb-3 animate-pulse">warning</span>
            <p class="text-sm font-bold text-slate-300 uppercase tracking-widest">Active Session</p>
            <p class="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-medium">Auto-Discovery will disconnect your current session</p>
        `;
        this.discoveryState.classList.remove('hidden');

        Components.openGuiModal({
            title: 'Scan New Servers?',
            message: 'You are currently connected to a server. Starting discovery will terminate your active session. Continue?',
            icon: 'warning',
            type: 'warning',
            primaryText: 'Continue & Scan',
            secondaryText: 'Stay Connected',
            onPrimary: () => {
                this.discoverServers();
            },
            onSecondary: () => {
                window.location.href = 'browse-remote-local.html';
            }
        });
    },

    discoveryAbortController: null,
    discoveredCards: new Map(),

    async discoverServers() {
        if (this.discoveryAbortController) {
            this.discoveryAbortController.abort();
            this.discoveryAbortController = null;
        }
        if (this.discoveryTimeout) {
            clearTimeout(this.discoveryTimeout);
            this.discoveryTimeout = null;
        }

        // Clear existing results to ensure fresh discovery
        this.discoveryList.innerHTML = '';
        this.discoveredCards.clear();

        // Reset discovery-state to scanning UI
        this.discoveryState.innerHTML = `
            <div class="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
            <p class="text-sm font-bold text-slate-300">Scanning Network</p>
            <p class="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-medium">Looking for active FTP servers...</p>
        `;
        this.discoveryState.classList.remove('hidden');

        // Hide re-scan button
        if (this.rescanBtn) this.rescanBtn.classList.add('hidden');

        this.discoveryAbortController = new AbortController();
        const signal = this.discoveryAbortController.signal;

        // Set hard 10s limit for discovery
        this.discoveryTimeout = setTimeout(() => {
            if (this.discoveryAbortController) {
                this.discoveryAbortController.abort();
            }
        }, 10000);

        try {
            const response = await fetch('/api/ftp/discover', { signal });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Try to parse JSON objects from buffer (bare structs)
                while (true) {
                    let startIdx = buffer.indexOf('{');
                    if (startIdx === -1) {
                        buffer = '';
                        break;
                    }
                    if (startIdx > 0) buffer = buffer.substring(startIdx);

                    let depth = 0;
                    let endIdx = -1;
                    let inString = false;
                    let escaped = false;

                    for (let i = 0; i < buffer.length; i++) {
                        const char = buffer[i];
                        if (escaped) { escaped = false; continue; }
                        if (char === '\\') { escaped = true; continue; }
                        if (char === '"') { inString = !inString; continue; }
                        if (!inString) {
                            if (char === '{') depth++;
                            else if (char === '}') {
                                depth--;
                                if (depth === 0) {
                                    endIdx = i;
                                    break;
                                }
                            }
                        }
                    }

                    if (endIdx !== -1) {
                        const jsonStr = buffer.substring(0, endIdx + 1);
                        try {
                            const server = JSON.parse(jsonStr);
                            // Identity: Combination of Name, IP, and Port to distinguish "another one"
                            const serverId = `${server.Name || ''}-${server.IP}:${server.Port}`;

                            this.discoveryState.classList.add('hidden');
                            this.renderDiscoveredServer(serverId, server);
                        } catch (err) {
                            console.error('Discovery parse error:', err, jsonStr);
                        }
                        buffer = buffer.substring(endIdx + 1);
                    } else {
                        break;
                    }
                }
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                console.info('Discovery scan completed (time limit reached).');
            } else {
                console.error('Discovery error:', err);
            }
        } finally {
            if (this.discoveryTimeout) {
                clearTimeout(this.discoveryTimeout);
                this.discoveryTimeout = null;
            }
            if (this.discoveredCards.size === 0) {
                this.discoveryState.innerHTML = `
                    <span class="material-symbols-outlined text-4xl text-slate-500 mb-3 opacity-20">search_off</span>
                    <p class="text-sm font-bold text-slate-300">No Servers Found</p>
                    <p class="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-medium">Make sure other devices are on the same network</p>
                `;
                this.discoveryState.classList.remove('hidden');
            }
            if (this.rescanBtn) this.rescanBtn.classList.remove('hidden');
            this.discoveryAbortController = null;
        }
    },

    renderDiscoveredServer(serverId, server, fromCache = false) {
        let card = this.discoveredCards.get(serverId);
        const isNew = !card;

        if (isNew) {
            card = document.createElement('div');
            card.className = "flex flex-col bg-slate-800/40 border border-white/5 rounded-2xl overflow-hidden hover:border-primary/30 transition-all cursor-pointer group";
            if (!fromCache) card.classList.add("animate-in", "fade-in", "slide-in-from-bottom-2", "duration-500");
            this.discoveryList.appendChild(card);
            this.discoveredCards.set(serverId, card);
        }

        card.onclick = () => this.handleDiscoveredServerClick(server);

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
    },

    handleDiscoveredServerClick(server) {
        const name = server.Name || server.IP;
        localStorage.removeItem('current_server_id'); // Ensure we use discovered info
        if (server.AnonymousAllowed) {
            this.connectWithCredentials(server.IP, server.Port, 'anonymous', 'anonymous', true, name);
        } else {
            this.showLoginPrompt(server);
        }
    },

    showLoginPrompt(server) {
        document.getElementById('login-server-name').innerText = server.Name || server.IP;
        document.getElementById('login-server-addr').innerText = `${server.IP}:${server.Port}`;

        // Reset inputs
        document.getElementById('login-user').value = '';
        document.getElementById('login-pass').value = '';

        this.loginModal.classList.remove('hidden');
        setTimeout(() => {
            document.getElementById('login-modal-backdrop').classList.add('active');
            document.getElementById('login-modal-content').classList.add('active');
        }, 10);

        // Store current server being connected to
        this.pendingServer = server;
    },

    closeLoginModal() {
        document.getElementById('login-modal-backdrop').classList.remove('active');
        document.getElementById('login-modal-content').classList.remove('active');
        setTimeout(() => this.loginModal.classList.add('hidden'), 300);
    },

    async submitLogin() {
        const user = document.getElementById('login-user').value;
        const pass = document.getElementById('login-pass').value;

        if (!user || !pass) {
            Components.showToast('Please enter both username and password', 'error');
            return;
        }

        const name = this.pendingServer.Name || this.pendingServer.IP;
        this.closeLoginModal();
        await this.connectWithCredentials(this.pendingServer.IP, this.pendingServer.Port, user, pass, false, name);
    },

    async connectWithCredentials(host, port, user, pass, isAnon, name) {
        Components.showToast(`Connecting to ${host}...`, 'info');
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
                Components.showToast('Connected successfully', 'success');

                // Store connection info for the browser page
                if (name) {
                    console.log(`RemoteConnections: Storing connection info for ${name} (${host}:${port})`);
                    localStorage.setItem('current_remote_name', name);
                    localStorage.setItem('current_remote_host', host);
                    localStorage.setItem('current_remote_port', port);
                }

                window.location.href = 'browse-remote-local.html';
            } else {
                Components.showToast(`Connection failed: ${text}`, 'error');
            }
        } catch (err) {
            Components.showToast('Network error or server unreachable', 'error');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => RemoteConnections.init());

