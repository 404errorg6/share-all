Components.injectSidebar('hosting-panel');
Components.injectModal();

/**
 * Copy URL to clipboard
 */
function copyUrl() {
    const url = document.getElementById('ftp-url').innerText;
    navigator.clipboard.writeText(url).then(() => {
        Components.showToast('URL copied to clipboard');
    });
}

/**
 * Handle Server Start/Stop via Status Toggle
 */
async function toggleServer(checkbox) {
    const isStarting = checkbox.checked;
    const statusText = document.getElementById('status-text');
    const statusLabel = document.getElementById('server-status-label');

    if (isStarting) {
        // Get configuration values
        const name = document.getElementById('ftp-name').value || 'My FTP Server';
        const port = document.getElementById('ftp-port').value || '2121';
        const rootFolder = document.getElementById('ftp-root').value || '';
        const anonymous = document.getElementById('anonymous-login-toggle').checked;
        const allowWriting = document.getElementById('allow-writing-toggle').checked;

        // Validate
        if (!name) {
            Components.showToast('Server Name is required', 'error');
            checkbox.checked = false;
            updateToggleUI(false);
            return;
        }

        if (!anonymous) {
            const username = document.getElementById('ftp-username').value || '';
            const password = document.getElementById('ftp-password').value || '';

            if (!username || !password) {
                Components.showToast('Username and Password are required', 'error');
                checkbox.checked = false;
                updateToggleUI(false);
                return;
            }
        }

        statusText.textContent = 'Starting...';

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
                statusText.textContent = 'Running';
                statusLabel.textContent = 'Server Active';
                statusLabel.className = 'text-xs text-green-500 font-black tracking-widest uppercase';
                updateToggleUI(true);
                Components.showToast('Server started');
            } else {
                const err = await response.text();
                throw new Error(err || 'Failed to start server');
            }
        } catch (error) {
            Components.showToast(error.message, 'error');
            checkbox.checked = false;
            statusText.textContent = 'Stopped';
            statusLabel.textContent = 'Server Offline';
            statusLabel.className = 'text-xs text-red-500 font-black tracking-widest uppercase';
            updateToggleUI(false);
        }
    } else {
        statusText.textContent = 'Stopping...';

        try {
            const response = await fetch('/api/ftp/server/stop-ftp', { method: 'POST' });
            if (response.ok) {
                statusText.textContent = 'Stopped';
                statusLabel.textContent = 'Server Offline';
                statusLabel.className = 'text-xs text-red-500 font-black tracking-widest uppercase';
                updateToggleUI(false);
                Components.showToast('Server stopped');
            } else {
                throw new Error('Failed to stop server');
            }
        } catch (error) {
            Components.showToast(error.message, 'error');
            checkbox.checked = true;
            statusText.textContent = 'Running';
            statusLabel.textContent = 'Server Active';
            statusLabel.className = 'text-xs text-green-500 font-black tracking-widest uppercase';
            updateToggleUI(true);
        }
    }
    await fetchServerStatus();
}

function updateToggleUI(isOn) {
    const track = document.querySelector('#status-toggle + .toggle-track');
    if (track) track.classList.toggle('toggle-on', isOn);
}

async function fetchServerStatus() {
    try {
        const response = await fetch('/api/ftp/server/running-status');
        if (response.ok) {
            const isRunningString = await response.text();
            const isRunning = (isRunningString === 'true');

            const toggle = document.getElementById('status-toggle');
            const text = document.getElementById('status-text');
            const label = document.getElementById('server-status-label');

            toggle.checked = isRunning;
            text.textContent = isRunning ? 'Running' : 'Stopped';
            label.textContent = isRunning ? 'Server Active' : 'Server Offline';
            label.className = isRunning ?
                'text-xs text-green-500 font-black tracking-widest uppercase' :
                'text-xs text-red-500 font-black tracking-widest uppercase';
            updateToggleUI(isRunning);
        }
    } catch (e) { }
}

function updateUrl() {
    const port = document.getElementById('ftp-port').value || '2121';
    document.getElementById('ftp-url').textContent = `ftp://127.0.0.1:${port}/`;
}


function toggleAnonymous(isAnonymous) {
    const uCont = document.getElementById('username-container');
    const pCont = document.getElementById('password-container');
    const uInput = document.getElementById('ftp-username');
    const pInput = document.getElementById('ftp-password');

    if (isAnonymous) {
        uCont.classList.add('opacity-50', 'pointer-events-none');
        pCont.classList.add('opacity-50', 'pointer-events-none');
        uInput.disabled = true;
        pInput.disabled = true;
    } else {
        uCont.classList.remove('opacity-50', 'pointer-events-none');
        pCont.classList.remove('opacity-50', 'pointer-events-none');
        uInput.disabled = false;
        pInput.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const selectedFolder = localStorage.getItem('selectedFolderPath');
    if (selectedFolder) {
        document.getElementById('ftp-root').value = selectedFolder;
        localStorage.removeItem('selectedFolderPath');
    }

    // Sync toggles visually
    document.querySelectorAll('.toggle-input').forEach(input => {
        const track = input.nextElementSibling;
        if (track && track.classList.contains('toggle-track')) {
            track.classList.toggle('toggle-on', input.checked);
            input.addEventListener('change', () => track.classList.toggle('toggle-on', input.checked));
        }
    });

    fetchServerStatus();
    updateUrl();
    // Components.Logger.init() is now handled globally
});

// Expose functions to window because buttons use onclick
window.copyUrl = copyUrl;
window.toggleServer = toggleServer;
window.updateUrl = updateUrl;
window.toggleAnonymous = toggleAnonymous;
