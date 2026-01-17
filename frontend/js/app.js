
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

    // Create Wrapper Div
    const entryDiv = document.createElement('div');
    entryDiv.className = "mb-1 group relative";

    // Create Text Paragraph with line clamping
    const p = document.createElement('p');
    // whitespace-pre-wrap preserves newlines but allows wrapping
    // break-all ensures long text doesn't overflow horizontally
    p.className = "line-clamp-3 break-all whitespace-pre-wrap"; 
    p.innerHTML = `<span class="text-gray-500 mr-2">[${now}]</span><span>${text}</span>`;

    entryDiv.appendChild(p);

    // Connect to Container
    const logContainer = consoleEl.querySelector('.text-log-text');

    if (logContainer) {
        // Insert before cursor or append
        const cursorDiv = logContainer.querySelector('.animate-pulse');
        if (cursorDiv) {
            logContainer.insertBefore(entryDiv, cursorDiv);
        } else {
            logContainer.appendChild(entryDiv);
        }

        // Check for overflow (Log must be in DOM to calculate height)
        // If content height > visible height (which is clamped), show button
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

        // Buffer Logic - Prune old logs
        // Note: We are removing 'entryDiv' elements now, which is correct (first child)
        // Ensure we don't accidentally remove the cursor if buffer is small/empty, but MAX_LOGS is 1000 so safe.
        if (logContainer.children.length > MAX_LOGS) {
            const removeCount = Math.floor(MAX_LOGS * PRUNE_PERCENT);
            for (let i = 0; i < removeCount; i++) {
                // Remove from top
                if (logContainer.firstElementChild && logContainer.firstElementChild !== cursorDiv) {
                    logContainer.removeChild(logContainer.firstElementChild);
                }
            }
        }
    }

    // Auto-scroll
    if (!isUserScrolling) {
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
        const res = await fetch('/api/start-ftp', { method: 'POST' });
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
        const res = await fetch('/api/stop-ftp', { method: 'POST' });

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
        const response = await fetch('/api/logs', {
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

