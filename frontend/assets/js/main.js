/**
 * Main Dashboard Logic
 */

// DOM Elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const ftpUrlLabel = document.getElementById('ftpUrl');
const urlPlaceholder = document.getElementById('urlPlaceholder');

// State
let isRunning = false;

// Helpers
function updateUI(running, url = "") {
    isRunning = running;
    startBtn.disabled = running;
    stopBtn.disabled = !running;

    // Toggle opacity for disabled state visualization
    startBtn.style.opacity = running ? "0.5" : "1";
    stopBtn.style.opacity = running ? "1" : "0.5";
    startBtn.style.cursor = running ? "not-allowed" : "pointer";
    stopBtn.style.cursor = running ? "pointer" : "not-allowed";

    if (running && url) {
        ftpUrlLabel.innerText = url;
        ftpUrlLabel.classList.remove('hidden');
        urlPlaceholder.classList.add('hidden');
    } else {
        ftpUrlLabel.classList.add('hidden');
        urlPlaceholder.classList.remove('hidden');
    }
}

// API Calls
async function startServer() {
    try {
        // Use the new API path based on hosting-panel.js
        const params = new URLSearchParams();
        params.append('name', 'FTP Server');
        params.append('server_port', '2121');
        params.append('anonymous_allowed', 'true');
        params.append('write_allowed', 'true');

        const res = await fetch('/api/ftp/server/start-ftp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });

        if (res.ok) {
            updateUI(true, "ftp://127.0.0.1:2121");
            Components.showToast('Server started successfully');
        } else {
            const err = await res.text();
            Components.showToast(err || 'Failed to start server', 'error');
        }
    } catch (err) {
        Components.showToast(`Connection error: ${err.message}`, 'error');
    }
}

async function stopServer() {
    try {
        const res = await fetch('/api/ftp/server/stop-ftp', { method: 'POST' });

        if (res.ok) {
            updateUI(false);
            Components.showToast('Server stopped successfully');
        } else {
            Components.showToast('Failed to stop server', 'error');
        }
    } catch (err) {
        Components.showToast(`Connection error: ${err.message}`, 'error');
    }
}

async function checkStatus() {
    try {
        const res = await fetch('/api/ftp/server/running-status');
        if (res.ok) {
            const status = await res.text();
            const isRunning = (status === 'true');
            updateUI(isRunning, isRunning ? "ftp://127.0.0.1:2121" : "");
        }
    } catch (e) { }
}

// Event Listeners
if (startBtn) startBtn.addEventListener('click', startServer);
if (stopBtn) stopBtn.addEventListener('click', stopServer);

// Init
document.addEventListener('DOMContentLoaded', () => {
    checkStatus();
});
