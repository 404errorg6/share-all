/**
 * Hosting Panel Page Logic
 */

export const template = `
        <!-- Header -->
        <header class="sticky top-0 z-20 bg-background-dark/95 backdrop-blur-md border-b border-white/5 p-4">
            <div class="flex items-center gap-3">
                <button id="menu-btn"
                    class="text-primary flex size-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                    <span class="material-symbols-outlined text-3xl">menu</span>
                </button>
                <div class="flex flex-col">
                    <h2 class="text-xl font-bold text-white">My Server</h2>
                    <p id="server-status-label" class="text-xs text-red-500 font-black tracking-widest uppercase">Server
                        Offline</p>
                </div>
            </div>
        </header>

        <main class="flex flex-col gap-4 p-4">
            <!-- FTP Server Card -->
            <div class="bg-white/5 rounded-2xl overflow-hidden border border-white/5 p-4 transition-all duration-300">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-3">
                        <div class="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <span class="material-symbols-outlined text-2xl">folder_shared</span>
                        </div>
                        <div>
                            <h3 class="text-white font-bold">FTP Server</h3>
                            <p id="status-text" class="text-[#9cb0ba] text-xs">Stopped</p>
                        </div>
                    </div>
                    <label class="relative inline-flex cursor-pointer">
                        <input id="status-toggle" class="peer sr-only toggle-input" type="checkbox" />
                        <span
                            class="block h-[31px] w-[51px] rounded-full p-0.5 bg-[#283439] transition-all toggle-track"
                            aria-hidden="true">
                            <span class="toggle-knob"></span>
                        </span>
                    </label>
                </div>



                <!-- FTP info hint -->
                <div class="mt-3 flex items-start gap-2 px-1">
                    <span class="material-symbols-outlined text-[14px] text-slate-500 mt-px shrink-0">info</span>
                    <p class="text-[11px] text-slate-500 leading-relaxed">Best for sharing with others who also have the Share-All app installed. Both devices must be on the same local network.</p>
                </div>

                <!-- Advanced Configuration Toggler (Inside FTP Card) -->
                <div class="mt-4 pt-4 border-t border-white/5">
                    <button id="toggle-settings-btn"
                        class="flex items-center gap-2 text-[#9cb0ba] hover:text-white transition-colors text-xs font-medium group">
                        <span id="settings-chevron"
                            class="material-symbols-outlined transition-transform duration-300">chevron_right</span>
                        <span>Server Configuration</span>
                    </button>
                </div>

                <!-- Configuration Section (Inside FTP Card) -->
                <div id="settings-panel"
                    class="max-h-0 opacity-0 overflow-hidden transition-all duration-500 ease-in-out">
                    <form id="ftp-config-form"
                        class="flex flex-col gap-2 mt-4 bg-white/5 rounded-xl p-3 border border-white/5">
                        <!-- Root Folder (Promoted) -->
                        <div class="flex flex-col gap-1 mb-2">
                            <label class="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Root
                                Folder</label>
                            <div class="flex items-center gap-2">
                                <input id="ftp-root" name="root_folder" type="text" placeholder="/storage/emulated/0"
                                    class="bg-background-dark/50 border border-white/5 rounded-lg text-[#9cb0ba] text-xs px-3 py-2 flex-1 focus:border-primary transition-colors outline-none" />
                                <a href="#/discover-local?selectMode=true"
                                    class="size-9 flex items-center justify-center bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors">
                                    <span class="material-symbols-outlined text-xl">folder_open</span>
                                </a>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            <div class="flex flex-col gap-1">
                                <label class="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Server
                                    Name</label>
                                <input id="ftp-name" name="name" type="text" placeholder="My FTP Server" required
                                    class="bg-background-dark/50 border border-white/5 rounded-lg text-[#9cb0ba] text-xs px-3 py-2 focus:border-primary transition-colors outline-none" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <label
                                    class="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Port</label>
                                <input id="ftp-port" name="port" type="number" value="2121"
                                    class="bg-background-dark/50 border border-white/5 rounded-lg text-[#9cb0ba] text-xs px-3 py-2 focus:border-primary transition-colors outline-none" />
                            </div>
                        </div>

                        <div class="flex items-center justify-between py-2 border-t border-white/5 mt-1">
                            <span class="text-xs text-white/80">Anonymous login</span>
                            <label class="relative inline-flex cursor-pointer scale-[0.8]">
                                <input id="anonymous-login-toggle" name="anonymous" checked
                                    class="peer sr-only toggle-input" type="checkbox" />
                                <span
                                    class="block h-[31px] w-[51px] rounded-full p-0.5 bg-[#283439] transition-all toggle-track">
                                    <span class="toggle-knob"></span>
                                </span>
                            </label>
                        </div>

                        <div id="auth-fields" class="transition-all duration-300 max-h-0 opacity-0 overflow-hidden">
                            <div class="grid grid-cols-2 gap-3 pb-1">
                                <div class="flex flex-col gap-1">
                                    <label
                                        class="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Username</label>
                                    <input id="ftp-username" name="user" type="text" value="admin"
                                        class="bg-background-dark/50 border border-white/5 rounded-lg text-[#9cb0ba] text-xs px-3 py-2 outline-none" />
                                </div>
                                <div class="flex flex-col gap-1">
                                    <label
                                        class="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Password</label>
                                    <input id="ftp-password" name="password" type="password" placeholder="Required"
                                        class="bg-background-dark/50 border border-white/5 rounded-lg text-[#9cb0ba] text-xs px-3 py-2 outline-none" />
                                </div>
                            </div>
                        </div>

                        <div class="flex items-center justify-between py-2 border-t border-white/5">
                            <span class="text-xs text-white/80">Allow writing</span>
                            <label class="relative inline-flex cursor-pointer scale-[0.8]">
                                <input id="allow-writing-toggle" name="allow_writing" checked
                                    class="peer sr-only toggle-input" type="checkbox" />
                                <span
                                    class="block h-[31px] w-[51px] rounded-full p-0.5 bg-[#283439] transition-all toggle-track">
                                    <span class="toggle-knob"></span>
                                </span>
                            </label>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Web Share Card -->
            <div class="bg-white/5 rounded-2xl overflow-hidden border border-white/5 p-4 transition-all duration-300">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-3">
                        <div
                            class="size-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                            <span class="material-symbols-outlined text-2xl">public</span>
                        </div>
                        <div>
                            <h3 class="text-white font-bold">Web Browser Access</h3>
                            <p id="web-share-status" class="text-[#9cb0ba] text-xs">No App Required</p>
                        </div>
                    </div>
                    <label class="relative inline-flex cursor-pointer">
                        <input id="web-share-toggle" class="peer sr-only toggle-input" type="checkbox" />
                        <span
                            class="block h-[31px] w-[51px] rounded-full p-0.5 bg-[#283439] transition-all toggle-track"
                            aria-hidden="true">
                            <span class="toggle-knob"></span>
                        </span>
                    </label>
                </div>

                <div id="web-share-url-container"
                    class="mt-4 p-3 bg-white/5 rounded-xl flex items-center justify-between transition-all duration-300 max-h-0 opacity-0 overflow-hidden">
                    <div class="overflow-hidden">
                        <p class="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Browser URL</p>
                        <p id="web-share-url" class="text-primary text-sm font-medium truncate">http://127.0.0.1:8080
                        </p>
                    </div>
                    <button id="copy-web-url-btn"
                        class="size-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/70 transition-colors">
                        <span class="material-symbols-outlined text-lg">content_copy</span>
                    </button>
                </div>

                <!-- Web Direct Share info hint -->
                <div class="mt-3 flex items-start gap-2 px-1">
                    <span class="material-symbols-outlined text-[14px] text-slate-500 mt-px shrink-0">info</span>
                    <p class="text-[11px] text-slate-500 leading-relaxed">Use this to share with devices that don't have the app. They can simply open the address shown above in their web browser.</p>
                </div>
            </div>
        </main>
`;

export function init() {
    const statusLabel = document.getElementById('server-status-label');
    const ftpToggle = document.getElementById('status-toggle');
    const ftpStatusText = document.getElementById('status-text');
    const webToggle = document.getElementById('web-share-toggle');
    const webStatusText = document.getElementById('web-share-status');
    const webUrlContainer = document.getElementById('web-share-url-container');
    const webUrlText = document.getElementById('web-share-url');
    const settingsPanel = document.getElementById('settings-panel');
    const settingsChevron = document.getElementById('settings-chevron');
    const authFields = document.getElementById('auth-fields');

    function updateServerOnlineLabel() {
        const ftpRunning = ftpToggle?.checked ?? false;
        const webRunning = webToggle?.checked ?? false;
        if (!statusLabel) return;
        const isOnline = ftpRunning || webRunning;
        statusLabel.textContent = isOnline ? 'Server Online' : 'Server Offline';
        statusLabel.className = isOnline
            ? 'text-xs text-green- green-400 font-black tracking-widest uppercase'
            : 'text-xs text-red-500 font-black tracking-widest uppercase';
    }

    function setFtpInputsDisabled(disabled) {
        const form = document.getElementById('ftp-config-form');
        if (!form) return;
        
        // Disable all inputs, selects, and buttons inside the form
        const elements = form.querySelectorAll('input, select, button, a');
        elements.forEach(el => {
            if (el.id === 'status-toggle') return; // Don't disable the toggle itself!
            
            if (el.tagName === 'A') {
                el.style.pointerEvents = disabled ? 'none' : 'auto';
                el.style.opacity = disabled ? '0.5' : '1';
            } else {
                el.disabled = disabled;
                // Add a visual cue for disabled state
                if (disabled) {
                    el.classList.add('opacity-50', 'cursor-not-allowed');
                } else {
                    el.classList.remove('opacity-50', 'cursor-not-allowed');
                }
            }
        });

        // Also dim the label text
        const labels = form.querySelectorAll('label');
        labels.forEach(l => {
            if (disabled) l.classList.add('opacity-50');
            else l.classList.remove('opacity-50');
        });
    }

    async function toggleServer() {
        const isStarting = ftpToggle.checked;
        if (isStarting) {
            const name = document.getElementById('ftp-name').value || 'My FTP Server';
            const port = document.getElementById('ftp-port').value || '2121';
            const rootFolder = document.getElementById('ftp-root').value || '';
            const anonymous = document.getElementById('anonymous-login-toggle').checked;
            const allowWriting = document.getElementById('allow-writing-toggle').checked;

            if (!name) {
                if (globalThis.Components?.showToast) globalThis.Components.showToast('Server Name is required', 'error');
                ftpToggle.checked = false;
                return;
            }

            ftpStatusText.textContent = 'Starting...';
            try {
                const params = new URLSearchParams();
                params.append('name', name);
                params.append('server_port', port);
                params.append('server_root_dir', rootFolder);
                params.append('anonymous_allowed', anonymous ? 'true' : 'false');
                params.append('write_allowed', allowWriting ? 'true' : 'false');

                if (!anonymous) {
                    params.append('user', document.getElementById('ftp-username').value);
                    params.append('password', document.getElementById('ftp-password').value);
                }

                const response = await fetch('/api/ftp/server/start-ftp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: params.toString()
                });

                if (response.ok) {
                    ftpStatusText.textContent = 'Running';
                    updateServerOnlineLabel();
                    updateToggleUI(ftpToggle, true);
                    setFtpInputsDisabled(true);
                    if (globalThis.Components?.showToast) globalThis.Components.showToast('Server started');
                } else {
                    const err = await response.text();
                    throw new Error(err || 'Failed to start server');
                }
            } catch (error) {
                if (globalThis.Components?.showToast) globalThis.Components.showToast(error.message, 'error');
                ftpToggle.checked = false;
                ftpStatusText.textContent = 'Stopped';
                updateServerOnlineLabel();
                updateToggleUI(ftpToggle, false);
            }
        } else {
            ftpStatusText.textContent = 'Stopping...';
            try {
                const response = await fetch('/api/ftp/server/stop-ftp', { method: 'POST' });
                if (response.ok) {
                    ftpStatusText.textContent = 'Stopped';
                    updateServerOnlineLabel();
                    updateToggleUI(ftpToggle, false);
                    setFtpInputsDisabled(false);
                    if (globalThis.Components?.showToast) globalThis.Components.showToast('Server stopped');
                } else {
                    throw new Error('Failed to stop server');
                }
            } catch (error) {
                if (globalThis.Components?.showToast) globalThis.Components.showToast(error.message, 'error');
                ftpToggle.checked = true;
                ftpStatusText.textContent = 'Running';
                updateServerOnlineLabel();
                updateToggleUI(ftpToggle, true);
            }
        }
    }

    function updateToggleUI(input, isOn) {
        // Now handled by CSS via :checked state on .toggle-input
        // This function remains for potential future needs but is mostly redundant now
        if (input) input.checked = isOn;
    }

    async function fetchServerStatus() {
        try {
            const response = await fetch('/api/ftp/server/status');
            if (response.ok) {
                const result = await response.json();
                const isRunning = result !== false;
                ftpToggle.checked = isRunning;
                ftpStatusText.textContent = isRunning ? 'Running' : 'Stopped';
                updateToggleUI(ftpToggle, isRunning);
                setFtpInputsDisabled(isRunning);
                updateServerOnlineLabel();
            }
        } catch (e) { }
    }

    async function toggleWebShare() {
        const isStarting = webToggle.checked;
        if (isStarting) {
            webStatusText.textContent = 'Starting...';
            try {
                const response = await fetch('/api/http/web-share/start', { method: 'POST' });
                if (response.ok) {
                    const address = await response.json();
                    webStatusText.textContent = 'Sharing';
                    webUrlText.textContent = `http://${address}`;
                    webUrlContainer.classList.remove('max-h-0', 'opacity-0');
                    webUrlContainer.classList.add('max-h-[80px]', 'opacity-100');
                    updateServerOnlineLabel();
                    updateToggleUI(webToggle, true);
                    if (globalThis.Components?.showToast) globalThis.Components.showToast('Web share started');
                } else {
                    throw new Error('Failed to start web share');
                }
            } catch (error) {
                if (globalThis.Components?.showToast) globalThis.Components.showToast(error.message, 'error');
                webToggle.checked = false;
                webStatusText.textContent = 'Disabled';
                updateServerOnlineLabel();
                updateToggleUI(webToggle, false);
            }
        } else {
            webStatusText.textContent = 'Stopping...';
            try {
                const response = await fetch('/api/http/web-share/stop', { method: 'POST' });
                if (response.ok) {
                    webStatusText.textContent = 'Disabled';
                    webUrlContainer.classList.add('max-h-0', 'opacity-0');
                    webUrlContainer.classList.remove('max-h-[80px]', 'opacity-100');
                    updateServerOnlineLabel();
                    updateToggleUI(webToggle, false);
                    if (globalThis.Components?.showToast) globalThis.Components.showToast('Web share stopped');
                } else {
                    throw new Error('Failed to stop web share');
                }
            } catch (error) {
                if (globalThis.Components?.showToast) globalThis.Components.showToast(error.message, 'error');
                webToggle.checked = true;
                webStatusText.textContent = 'Sharing';
                updateServerOnlineLabel();
                updateToggleUI(webToggle, true);
            }
        }
    }

    async function fetchWebShareStatus() {
        try {
            const response = await fetch('/api/http/web-share/status');
            if (response.ok) {
                const result = await response.json();
                const isRunning = result !== false;
                webToggle.checked = isRunning;
                webStatusText.textContent = isRunning ? 'Sharing' : 'Disabled';
                if (isRunning) {
                    webUrlText.textContent = `http://${result}`;
                    webUrlContainer.classList.remove('max-h-0', 'opacity-0');
                    webUrlContainer.classList.add('max-h-[80px]', 'opacity-100');
                } else {
                    webUrlContainer.classList.add('max-h-0', 'opacity-0');
                    webUrlContainer.classList.remove('max-h-[80px]', 'opacity-100');
                }
                updateToggleUI(webToggle, isRunning);
                updateServerOnlineLabel();
            }
        } catch (e) { }
    }

    // Event Listeners
    if (ftpToggle) ftpToggle.onchange = toggleServer;
    if (webToggle) webToggle.onchange = toggleWebShare;

    const toggleSettingsBtn = document.getElementById('toggle-settings-btn');
    if (toggleSettingsBtn) toggleSettingsBtn.onclick = () => {
        const isHidden = settingsPanel.classList.contains('max-h-0');
        if (isHidden) {
            settingsPanel.classList.remove('max-h-0', 'opacity-0');
            settingsPanel.classList.add('max-h-[1000px]', 'opacity-100');
            settingsChevron.classList.add('rotate-90');
        } else {
            settingsPanel.classList.add('max-h-0', 'opacity-0');
            settingsPanel.classList.remove('max-h-[1000px]', 'opacity-100');
            settingsChevron.classList.remove('rotate-90');
        }
    };

    const anonymousToggle = document.getElementById('anonymous-login-toggle');
    if (anonymousToggle) anonymousToggle.onchange = () => {
        const isAnonymous = anonymousToggle.checked;
        const uInput = document.getElementById('ftp-username');
        const pInput = document.getElementById('ftp-password');
        if (isAnonymous) {
            authFields.classList.add('max-h-0', 'opacity-0');
            authFields.classList.remove('max-h-[200px]', 'opacity-100');
            if (uInput) uInput.disabled = true;
            if (pInput) pInput.disabled = true;
        } else {
            authFields.classList.remove('max-h-0', 'opacity-0');
            authFields.classList.add('max-h-[200px]', 'opacity-100');
            if (uInput) uInput.disabled = false;
            if (pInput) pInput.disabled = false;
        }
        updateToggleUI(anonymousToggle, isAnonymous);
    };

    const copyBtn = document.getElementById('copy-web-url-btn');
    if (copyBtn) copyBtn.onclick = () => {
        const url = webUrlText.innerText;
        navigator.clipboard.writeText(url).then(() => {
            if (globalThis.Components?.showToast) globalThis.Components.showToast('Web URL copied');
        });
    };

    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn && globalThis.Components?.toggleMenu) menuBtn.onclick = () => globalThis.Components.toggleMenu();

    // Init Logic
    if (globalThis.Components?.Sidebar?.highlight) {
        globalThis.Components.Sidebar.highlight('hosting-panel');
    }

    const selectedFolder = localStorage.getItem('selectedFolderPath');
    if (selectedFolder) {
        const ftpRoot = document.getElementById('ftp-root');
        if (ftpRoot) ftpRoot.value = selectedFolder;
        localStorage.removeItem('selectedFolderPath');
    }

    fetchServerStatus();
    fetchWebShareStatus();
}
