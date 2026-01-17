/**
 * FTP Server Manager - Frontend Logic
 * Handles UI updates, API calls, log streaming, and simulation.
 */

// ==========================================
// 1. DOM Elements & Constants
// ==========================================
const DOM = {
    startBtn: document.getElementById('startBtn'),
    stopBtn: document.getElementById('stopBtn'),
    ftpUrlLabel: document.getElementById('ftpUrl'),
    urlPlaceholder: document.getElementById('urlPlaceholder'),
    consoleEl: document.getElementById('console'),
    logContainer: document.getElementById('console').querySelector('.text-log-text'),
    scrollAnchor: document.getElementById('scrollAnchor')
};

const CONFIG = {
    MAX_LOGS: 1000,
    PRUNE_PERCENT: 0.05,
    DEFAULT_URL: "ftp://127.0.0.1:2121",
};

// ==========================================
// 2. State Management
// ==========================================
let state = {
    isRunning: false,
    isUserScrolling: false,
    abortController: null,
};

// ==========================================
// 3. UI Helpers
// ==========================================
function updateUI(running, url = "") {
    state.isRunning = running;
    
    // Button States
    DOM.startBtn.disabled = running;
    DOM.stopBtn.disabled = !running;
    DOM.startBtn.style.opacity = running ? "0.5" : "1";
    DOM.stopBtn.style.opacity = running ? "1" : "0.5";

    // URL Display
    if (running && url) {
        DOM.ftpUrlLabel.innerText = url;
        DOM.ftpUrlLabel.classList.remove('hidden');
        DOM.urlPlaceholder.classList.add('hidden');
    } else {
        DOM.ftpUrlLabel.classList.add('hidden');
        DOM.urlPlaceholder.classList.remove('hidden');
    }
}

function addLog(text) {
    const now = new Date().toLocaleTimeString();
    
    // Create Log Entry
    const entryDiv = document.createElement('div');
    entryDiv.className = "mb-1 group relative";
    
    const p = document.createElement('p');
    p.className = "line-clamp-3 break-all whitespace-pre-wrap"; 
    p.innerHTML = `<span class="text-gray-500 mr-2">[${now}]</span><span>${text}</span>`;
    
    entryDiv.appendChild(p);

    if (!DOM.logContainer) return;

    // Insert Log
    const cursorDiv = DOM.logContainer.querySelector('.animate-pulse');
    if (cursorDiv) {
        DOM.logContainer.insertBefore(entryDiv, cursorDiv);
    } else {
        DOM.logContainer.appendChild(entryDiv);
    }

    // Handle "Show More" for long logs
    if (p.scrollHeight > p.clientHeight) {
        const showMoreBtn = document.createElement('button');
        showMoreBtn.innerText = "Show more";
        showMoreBtn.className = "text-xs text-primary/80 hover:text-primary mt-0.5 focus:outline-none hover:underline block";
        showMoreBtn.onclick = () => {
            p.classList.remove('line-clamp-3');
            showMoreBtn.remove();
        };
        entryDiv.appendChild(showMoreBtn);
    }

    // Buffer Management (Prune old logs)
    if (DOM.logContainer.children.length > CONFIG.MAX_LOGS) {
        const pruneCount = Math.floor(CONFIG.MAX_LOGS * CONFIG.PRUNE_PERCENT);
        for (let i = 0; i < pruneCount; i++) {
            const firstLog = DOM.logContainer.firstElementChild;
            if (firstLog && firstLog !== cursorDiv) {
                DOM.logContainer.removeChild(firstLog);
            }
        }
    }

    // Auto-Scroll
    if (!state.isUserScrolling) {
        if (DOM.scrollAnchor) {
            DOM.scrollAnchor.scrollIntoView({ behavior: "smooth", block: "end" });
        } else {
            DOM.consoleEl.scrollTop = DOM.consoleEl.scrollHeight;
        }
    }
}

// Scroll Detection (Pause auto-scroll on user interaction)
DOM.consoleEl.addEventListener('scroll', () => {
    const threshold = 100;
    const position = DOM.consoleEl.scrollTop + DOM.consoleEl.clientHeight;
    const height = DOM.consoleEl.scrollHeight;
    state.isUserScrolling = Math.abs(height - position) >= threshold;
});



// ==========================================
// 5. API Interactions
// ==========================================

/**
 * Parses the response from start-ftp API.
 * Handles both JSON objects and plain text strings.
 */
async function parseResponse(res) {
    const text = await res.text();
    try {
        const data = JSON.parse(text);
        return {
            message: (typeof data === 'string') ? data : (data.message || text),
            url: (typeof data === 'object' && data.url) ? data.url : CONFIG.DEFAULT_URL
        };
    } catch {
        return { message: text, url: CONFIG.DEFAULT_URL };
    }
}

async function startServer() {
    // 1. Prepare UI
    initLogs(); // Start listener immediately

    try {
        // 2. Call API
        const res = await fetch('/api/start-ftp', { method: 'POST' });
        const { message, url } = await parseResponse(res);

        if (res.ok) {
            // 3. Success State
            updateUI(true, url);
            addLog("SYSTEM: FTP Server Started successfully on port 2121");

            
            if (message && message !== "server started successfully") {
                addLog(`SYSTEM: ${message}`);
            }
        } else {
            // 4. Error State (Backend rejected start)
            addLog(`ERROR: ${message}`);
            shutdownLogStream();
        }
    } catch (err) {
        addLog(`ERROR: Could not connect to backend. ${err.message}`);
        shutdownLogStream();
    }
}

async function stopServer() {
    try {
        const res = await fetch('/api/stop-ftp', { method: 'POST' });

        if (res.ok) {
            updateUI(false);

            shutdownLogStream();
            addLog("SYSTEM: Server stopped.");
        } else {
            const { message } = await parseResponse(res);
            addLog(`ERROR: ${message}`);
        }
    } catch (err) {
        addLog(`ERROR: ${err.message}`);
    }
}

// ==========================================
// 6. Log Streaming (SSE / Reader)
// ==========================================
function shutdownLogStream() {
    if (state.abortController) {
        state.abortController.abort();
        state.abortController = null;
    }
}

async function initLogs() {
    if (state.abortController) return;

    state.abortController = new AbortController();

    try {
        const response = await fetch('/api/logs', {
            signal: state.abortController.signal
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim() !== "");

            lines.forEach(line => addLog(line));
        }
    } catch (err) {
        if (err.name !== 'AbortError') {
            addLog(`ERROR: Log stream failed. ${err.message}`);
        }
        state.abortController = null;
    }
}

// ==========================================
// 7. Initialization
// ==========================================
DOM.startBtn.addEventListener('click', startServer);
DOM.stopBtn.addEventListener('click', stopServer);
