
// DOM Elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const ftpUrlLabel = document.getElementById('ftpUrl');
const urlPlaceholder = document.getElementById('urlPlaceholder');
const consoleEl = document.getElementById('console');
const consoleContainer = consoleEl.querySelector('div'); // The inner div

// State
let isRunning = false;
let logArray = [];
const MAX_LOGS = 1000;
const PRUNE_PERCENT = 0.05;
let isUserScrolling = false;
let abortController = null;

// Helpers
function updateUI(running, url = "") {
    isRunning = running;
    startBtn.disabled = running;
    stopBtn.disabled = !running;

    // Toggle opacity for disabled state visualization (Tailwind handles cursor-not-allowed)
    startBtn.style.opacity = running ? "0.5" : "1";
    stopBtn.style.opacity = running ? "1" : "0.5";

    if (running && url) {
        ftpUrlLabel.innerText = url;
        ftpUrlLabel.classList.remove('hidden');
        urlPlaceholder.classList.add('hidden');
    } else {
        ftpUrlLabel.classList.add('hidden');
        urlPlaceholder.classList.remove('hidden');
    }
}

const scrollAnchor = document.getElementById('scrollAnchor');

function addLog(text) {
    const now = new Date().toLocaleTimeString();

    // Create Log Element
    const p = document.createElement('p');
    p.innerHTML = `<span class="text-gray-500">[${now}]</span> <span class="text-log-text">${text}</span>`;

    // Append before the cursor or anchor. Actually, we want it before the cursor div which is usually last. 
    // But since I added an anchor at the very end, let's append to the log container div (the first child of consoleEl)
    // The consoleEl has a direct child (the div with text-log-text).
    // Let's just find that inner container.
    const logContainer = consoleEl.querySelector('.text-log-text');

    // Insert before the last element (the cursor or anchor logic handled by just appending to list, but we have cursor)
    // Actually, simply appending to logContainer works if cursor is part of it.
    // The previous code used consoleContainer which was undefined in the snippets above, let's fix that.

    // Safety check
    if (logContainer) {
        // Find the cursor div to insert before
        const cursorDiv = logContainer.querySelector('.animate-pulse');
        if (cursorDiv) {
            logContainer.insertBefore(p, cursorDiv);
        } else {
            logContainer.appendChild(p);
        }
    }

    // Buffer Logic
    if (logContainer && logContainer.children.length > MAX_LOGS) {
        const removeCount = Math.floor(MAX_LOGS * PRUNE_PERCENT);
        for (let i = 0; i < removeCount; i++) {
            if (logContainer.firstElementChild) {
                logContainer.removeChild(logContainer.firstElementChild);
            }
        }
    }

    // Auto-scroll
    if (!isUserScrolling) {
        // Use scrollIntoView on the anchor for smooth/reliable scrolling
        if (scrollAnchor) {
            scrollAnchor.scrollIntoView({ behavior: "smooth", block: "end" });
        } else {
            consoleEl.scrollTop = consoleEl.scrollHeight;
        }
    }
}

// Scroll Detection
consoleEl.addEventListener('scroll', () => {
    const threshold = 100; // Increased threshold for mobile touch variance
    const position = consoleEl.scrollTop + consoleEl.clientHeight;
    const height = consoleEl.scrollHeight;

    // If user is near bottom, enable auto-scroll. If they scroll up, disable it.
    if (Math.abs(height - position) < threshold) {
        isUserScrolling = false;
    } else {
        isUserScrolling = true;
    }
});

// API Calls
async function startServer() {
    try {
        const res = await fetch('http://localhost:8085/api/start-ftp', { method: 'POST' });
        // The legacy backend sends a JSON string, not an object with 'message'
        const data = await res.json();
        const message = (typeof data === 'string') ? data : data.message;
        const url = (typeof data === 'object' && data.url) ? data.url : "ftp://127.0.0.1:2121";

        if (res.ok) {
            updateUI(true, url);
            addLog(`SYSTEM: ${message}`);

            // Start reading logs
            initLogs();
        } else {
            addLog(`ERROR: ${message}`);
        }
    } catch (err) {
        addLog(`ERROR: Could not connect to backend. ${err.message}`);
    }
}

async function stopServer() {
    try {
        const res = await fetch('http://localhost:8085/api/stop-ftp', { method: 'POST' });

        if (res.ok) {
            // Backend sends 200 OK (Empty Body)
            updateUI(false);
            addLog(`SYSTEM: Server stopped successfully.`);

            // Stop reading logs
            if (abortController) {
                abortController.abort();
                abortController = null;
            }
        } else {
            // Try to read error message if any
            try {
                const data = await res.json();
                const message = (typeof data === 'string') ? data : data.message || "Unknown error";
                addLog(`ERROR: ${message}`);
            } catch (e) {
                addLog(`ERROR: Server returned ${res.status}`);
            }
        }
    } catch (err) {
        addLog(`ERROR: ${err.message}`);
    }
}

async function initLogs() {
    if (abortController) return; // Already running

    abortController = new AbortController();

    try {
        const response = await fetch('http://localhost:8085/api/logs', {
            signal: abortController.signal
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        addLog("SYSTEM: Log stream connected.");

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim() !== "");

            for (const line of lines) {
                // If line contains specific strings, we can style it or filter it
                // For now, raw output
                addLog(line);
            }
        }
    } catch (err) {
        if (err.name === 'AbortError') {
            addLog("SYSTEM: Log stream stopped.");
        } else {
            addLog(`ERROR: Log stream failed. ${err.message}`);
        }
        abortController = null;
    }
}

// Event Listeners
startBtn.addEventListener('click', startServer);
stopBtn.addEventListener('click', stopServer);

// Init
addLog("SYSTEM: Dashboard initialized.");
// Check status (Optional, if backend supported it)
// But since backend doesn't serve frontend, we assume start disjointly

