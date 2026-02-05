/**
 * Remote Connections Page Logic
 */

const RemoteConnections = {
    serverList: null,
    discoveryList: null,
    emptyState: null,
    discoveryState: null,
    loginModal: null,

    init() {
        this.serverList = document.getElementById('server-list');
        this.discoveryList = document.getElementById('discovery-list');
        this.emptyState = document.getElementById('empty-state');
        this.discoveryState = document.getElementById('discovery-state');
        this.loginModal = document.getElementById('login-modal');

        this.loadSavedServers();
        this.discoverServers();
    },

    loadSavedServers() {
        const servers = JSON.parse(localStorage.getItem('ftp_servers') || '[]');
        if (servers.length === 0) {
            this.emptyState.classList.remove('hidden');
            this.serverList.innerHTML = '';
        } else {
            this.emptyState.classList.add('hidden');
            this.renderSavedServers(servers);
        }
    },

    renderSavedServers(servers) {
        this.serverList.innerHTML = '';
        servers.forEach(server => {
            const card = document.createElement('div');
            card.className = "flex flex-col bg-slate-800/40 border border-white/5 rounded-2xl overflow-hidden hover:border-primary/30 transition-all cursor-pointer group";
            card.onclick = (e) => {
                if (e.target.closest('.action-btn')) return;
                this.connectToServer(server);
            };

            card.innerHTML = `
                <div class="p-4 flex items-center gap-4">
                    <div class="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                        <span class="material-symbols-outlined text-3xl">dns</span>
                    </div>
                    <div class="flex flex-col flex-1 overflow-hidden">
                        <h3 class="text-white font-bold truncate">${server.name}</h3>
                        <p class="text-slate-500 text-xs font-mono">${server.user}@${server.host}:${server.port}</p>
                    </div>
                    <div class="flex gap-1">
                        <button onclick="RemoteConnections.editServer(${server.id})" class="action-btn size-10 rounded-full flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-colors">
                            <span class="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button onclick="RemoteConnections.confirmDelete(${server.id})" class="action-btn size-10 rounded-full flex items-center justify-center text-slate-500 hover:text-danger hover:bg-danger/10 transition-colors">
                            <span class="material-symbols-outlined text-lg">delete</span>
                        </button>
                    </div>
                </div>
            `;
            this.serverList.appendChild(card);
        });
    },

    async discoverServers() {
        this.discoveryState.classList.remove('hidden');
        this.discoveryList.innerHTML = '';

        try {
            const response = await fetch('/api/ftp/discover');
            const servers = await response.json();

            this.discoveryState.classList.add('hidden');

            if (!servers || servers.length === 0) {
                this.discoveryList.innerHTML = `
                    <div class="col-span-full py-8 text-center text-slate-500 bg-slate-800/20 rounded-2xl border border-dashed border-white/10">
                        <p class="text-sm italic">No servers found on your network.</p>
                    </div>
                `;
                return;
            }

            this.renderDiscoveredServers(servers);
        } catch (err) {
            console.error('Discovery error:', err);
            this.discoveryState.classList.add('hidden');
            this.discoveryList.innerHTML = `
                <div class="col-span-full py-8 text-center text-danger bg-danger/5 rounded-2xl border border-dashed border-danger/20">
                    <p class="text-sm font-medium">Discovery failed. Please try again.</p>
                    <button onclick="RemoteConnections.discoverServers()" class="mt-2 text-xs text-primary underline">Retry</button>
                </div>
            `;
        }
    },

    renderDiscoveredServers(servers) {
        this.discoveryList.innerHTML = '';
        servers.forEach(server => {
            const card = document.createElement('div');
            card.className = "flex flex-col bg-slate-800/40 border border-white/5 rounded-2xl overflow-hidden hover:border-primary/30 transition-all cursor-pointer group animate-in fade-in slide-in-from-bottom-2 duration-500";

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
            this.discoveryList.appendChild(card);
        });
    },

    handleDiscoveredServerClick(server) {
        if (server.AnonymousAllowed) {
            this.connectWithCredentials(server.IP, server.Port, 'anonymous', 'anonymous', true);
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

        this.closeLoginModal();
        await this.connectWithCredentials(this.pendingServer.IP, this.pendingServer.Port, user, pass, false);
    },

    async connectWithCredentials(host, port, user, pass, isAnon) {
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
                // We don't have an ID for discovered servers, so we just redirect
                window.location.href = 'browse-remote-local.html';
            } else {
                Components.showToast(`Connection failed: ${text}`, 'error');
            }
        } catch (err) {
            Components.showToast('Network error or server unreachable', 'error');
        }
    },

    async connectToServer(server) {
        await this.connectWithCredentials(server.host, server.port, server.user, server.password, server.isAnon);
    },

    editServer(id) {
        window.location.href = `../forms/form-remote-manager.html?id=${id}`;
    },

    confirmDelete(id) {
        Components.openGuiModal({
            title: 'Remove Server?',
            message: 'Are you sure you want to delete this server connection? This cannot be undone.',
            icon: 'delete_forever',
            type: 'danger',
            primaryText: 'Delete',
            onPrimary: () => {
                let servers = JSON.parse(localStorage.getItem('ftp_servers') || '[]');
                servers = servers.filter(s => s.id !== id);
                localStorage.setItem('ftp_servers', JSON.stringify(servers));
                Components.showToast('Server removed');
                this.loadSavedServers();
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => RemoteConnections.init());
