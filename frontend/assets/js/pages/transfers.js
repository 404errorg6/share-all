
// Utility functions are loaded globally via <script src="../assets/js/utils.js">
// We can access them via window.Utils

class TransferManager {
    constructor() {
        this.container = document.getElementById('transfer-list');
        this.completedContainer = document.getElementById('completed-list');
        this.activeCountEl = document.getElementById('active-count');
        this.globalDownEl = document.getElementById('global-down-speed');
        this.globalUpEl = document.getElementById('global-up-speed');

        this.transfers = new Map(); // Map<string, ElementID>
        this.completed = new Set(); // Set<string>
        this.previousState = new Map(); // Map<string, {written: number, timestamp: number}>

        // New: Track transfers that we have seen as active to detect when they disappear (complete)
        this.seenTransfers = new Map(); // Map<string, TransferItem>

        this.isPolling = false;
        this.pollInterval = 1000;
        this.mockInterval = null;
    }

    init() {
        console.log("TransferManager initialized");
        this.startPolling();

        // UNCOMMENT THE LINE BELOW TO SEE MOCK DATA IN ACTION
        // this.startMockData();
    }

    startPolling() {
        if (this.isPolling) return;
        this.isPolling = true;

        const poll = async () => {
            // If we have mock data running, don't poll
            if (this.mockInterval) return;

            try {
                // Fetch real data from the backend
                const response = await fetch('/api/ftp/transfers');
                if (response.ok) {
                    const data = await response.json();
                    this.updateUI(data);
                }
            } catch (error) {
                // console.debug('Polling failed (backend likely not ready)', error);
            }

            if (this.isPolling) {
                setTimeout(poll, this.pollInterval);
            }
        };

        poll();
    }

    updateUI(data) {
        if (!data) data = [];

        const currentActiveNames = new Set(data.map(d => d.Name));

        // 1. Check for newly completed transfers
        // Logic: If a transfer was in 'seenTransfers' but is NOT in the current 'data' payload,
        // it implies the backend finished it and removed it from the active list.
        for (const [name, lastKnownState] of this.seenTransfers) {
            if (!currentActiveNames.has(name)) {
                // Transfer is gone from backend response -> It completed
                if (!this.completed.has(name)) {
                    // Mark as 100% and move to completed
                    lastKnownState.Percent = 100;
                    lastKnownState.Written = lastKnownState.TotalSize;
                    this.addCompletedItem(lastKnownState);
                }

                // Cleanup active state
                const id = this.transfers.get(name);
                if (id) {
                    const el = document.getElementById(id);
                    if (el) el.remove();
                    this.transfers.delete(name);
                }
                this.previousState.delete(name);
                this.seenTransfers.delete(name);
            }
        }

        // 2. Process Current Data Payload
        if (data.length === 0) {
            this.renderEmpty();
        } else {
            // If transitioning from empty state
            if (this.container.querySelector('.material-symbols-outlined') && !this.container.querySelector('[id^="transfer-"]')) {
                this.container.innerHTML = '';
            }
        }

        data.forEach(item => {
            // Update our record of seeing this transfer
            this.seenTransfers.set(item.Name, item);

            // Calculate speed and ETA
            const metrics = this.calculateMetrics(item);

            if (this.transfers.has(item.Name)) {
                this.updateItem(item, metrics);
            } else {
                this.addItem(item, metrics);
            }

            // Update previous state
            this.previousState.set(item.Name, {
                written: item.Written,
                timestamp: Date.now()
            });
        });

        this.updateCounts(data.length);
    }

    calculateMetrics(item) {
        if (!this.previousState.has(item.Name)) {
            return {
                speed: "Calculating...",
                rawSpeed: 0,
                eta: "Calculating..."
            };
        }

        const prev = this.previousState.get(item.Name);
        const now = Date.now();
        const timeDiff = (now - prev.timestamp) / 1000; // seconds

        if (timeDiff <= 0) {
            return {
                speed: "Calculating...",
                rawSpeed: 0,
                eta: "Calculating..."
            };
        }

        const writtenDiff = item.Written - prev.written;
        const bytesPerSec = writtenDiff / timeDiff;

        // If slow or stalled
        if (bytesPerSec <= 0) {
            return {
                speed: "0 B/s",
                rawSpeed: 0,
                eta: "Stalled"
            };
        }

        const remainingBytes = item.TotalSize - item.Written;
        const etaSeconds = remainingBytes / bytesPerSec;

        return {
            speed: Utils.formatFileSize(bytesPerSec) + "/s",
            rawSpeed: bytesPerSec,
            eta: this.formatDuration(etaSeconds)
        };
    }

    formatDuration(seconds) {
        if (!isFinite(seconds)) return "Unknown";
        if (seconds < 60) return `${Math.ceil(seconds)}s`;
        if (seconds < 3600) {
            const m = Math.floor(seconds / 60);
            const s = Math.ceil(seconds % 60);
            return `${m}m ${s}s`;
        }
        const h = Math.floor(seconds / 3600);
        const m = Math.ceil((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    }

    safeId(name) {
        return 'transfer-' + name.replace(/[^a-zA-Z0-9]/g, '_');
    }

    addItem(item, metrics) {
        const id = this.safeId(item.Name);
        this.transfers.set(item.Name, id);

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = this.getTemplate(item, id, metrics, false);
        const newEl = tempDiv.firstElementChild;

        this.container.appendChild(newEl);
    }

    addCompletedItem(item) {
        this.completed.add(item.Name);

        const tempDiv = document.createElement('div');
        // Render completed template (simplified, no progress bar needed or full check)
        tempDiv.innerHTML = this.getTemplate(item, `completed-${this.safeId(item.Name)}`, null, true);
        const newEl = tempDiv.firstElementChild;

        // Prepend to top of completed list
        if (this.completedContainer.firstChild) {
            this.completedContainer.insertBefore(newEl, this.completedContainer.firstChild);
        } else {
            this.completedContainer.appendChild(newEl);
        }
    }

    updateItem(item, metrics) {
        const id = this.transfers.get(item.Name);
        const el = document.getElementById(id);
        if (!el) return;

        // Update Progress Bar Width
        const progressBar = el.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = `${item.Percent}%`;
        }

        // Update Percent Text
        const percentEl = el.querySelector('.percent-text');
        if (percentEl) {
            percentEl.textContent = `${Math.round(item.Percent)}%`;
        }

        // Update Size Text
        const sizeEl = el.querySelector('.size-text');
        if (sizeEl) {
            sizeEl.textContent = `${Utils.formatFileSize(item.Written)} / ${Utils.formatFileSize(item.TotalSize)}`;
        }

        // Update Info Text (Speed & ETA)
        const infoEl = el.querySelector('.info-text');
        if (infoEl) {
            infoEl.innerHTML = `
                <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[10px]">speed</span>${metrics.speed}</span>
                <span class="mx-1 opacity-30">|</span>
                <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[10px]">timer</span>${metrics.eta}</span>
            `;
        }
    }

    getTemplate(item, id, metrics, isCompleted) {
        const typeInfo = this.getTypeInfo(item.Name);
        const total = Utils.formatFileSize(item.TotalSize);

        let statusRow = '';
        if (isCompleted) {
            statusRow = `
                 <div class="flex items-center gap-2 mt-1">
                    <span class="text-[10px] font-bold uppercase tracking-wide text-green-500 bg-green-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <span class="material-symbols-outlined text-[12px]">check_circle</span> Completed
                    </span>
                    <span class="text-xs text-slate-400">${total}</span>
                </div>
            `;
        } else {
            const percent = Math.round(item.Percent);
            const written = Utils.formatFileSize(item.Written);
            statusRow = `
                <div class="flex items-center gap-3 mt-1">
                     <div class="info-text flex items-center text-[10px] font-bold uppercase tracking-wide text-slate-500 bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded-md">
                        <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[10px]">speed</span>${metrics.speed}</span>
                        <span class="mx-1 opacity-30">|</span>
                        <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[10px]">timer</span>${metrics.eta}</span>
                    </div>
                </div>
            `;
        }

        // Progress bar is 100% and green for completed
        const progressSection = isCompleted ? '' : `
            <div class="space-y-2 mt-3">
                <div class="flex justify-between text-xs font-medium">
                    <span class="percent-text ${typeInfo.text}">${Math.round(item.Percent)}%</span>
                    <span class="size-text text-slate-500">${Utils.formatFileSize(item.Written)} / ${total}</span>
                </div>
                <div class="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div class="progress-bar ${typeInfo.bgFull} h-full rounded-full transition-all duration-500" style="width: ${item.Percent}%"></div>
                </div>
            </div>
        `;

        return `
            <div id="${id}" class="p-4 rounded-xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800/50 shadow-sm animate-fade-in transition-all">
                <div class="flex items-start gap-4">
                    <div class="w-12 h-12 flex items-center justify-center rounded-2xl ${typeInfo.bg} ${typeInfo.text}">
                        <span class="material-symbols-outlined text-3xl">${typeInfo.icon}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-start">
                            <h3 class="font-semibold truncate pr-2 text-slate-900 dark:text-slate-100">${item.Name}</h3>
                        </div>
                        ${statusRow}
                    </div>
                </div>
                ${progressSection}
            </div>
        `;
    }

    getTypeInfo(name) {
        const ext = name.split('.').pop().toLowerCase();

        // Extended Colors & Icons mapping
        const t = {
            archive: { bg: 'bg-green-500/10', text: 'text-green-500', bgFull: 'bg-green-500', icon: 'folder_zip' },
            image: { bg: 'bg-purple-500/10', text: 'text-purple-500', bgFull: 'bg-purple-500', icon: 'image' },
            video: { bg: 'bg-red-500/10', text: 'text-red-500', bgFull: 'bg-red-500', icon: 'movie' },
            audio: { bg: 'bg-pink-500/10', text: 'text-pink-500', bgFull: 'bg-pink-500', icon: 'audio_file' },
            code: { bg: 'bg-slate-500/10', text: 'text-slate-500', bgFull: 'bg-slate-500', icon: 'code' },
            doc: { bg: 'bg-blue-500/10', text: 'text-blue-500', bgFull: 'bg-blue-500', icon: 'article' },
            data: { bg: 'bg-orange-500/10', text: 'text-orange-500', bgFull: 'bg-orange-500', icon: 'description' },
            app: { bg: 'bg-teal-500/10', text: 'text-teal-500', bgFull: 'bg-teal-500', icon: 'install_desktop' },
            default: { bg: 'bg-gray-500/10', text: 'text-gray-500', bgFull: 'bg-gray-500', icon: 'draft' }
        };

        if (['zip', 'rar', 'tar', 'gz', '7z', 'bz2', 'xz'].includes(ext)) return t.archive;
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'].includes(ext)) return t.image;
        if (['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext)) return t.video;
        if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(ext)) return t.audio;
        if (['html', 'css', 'js', 'json', 'py', 'go', 'java', 'c', 'cpp', 'php', 'ts', 'jsx'].includes(ext)) return t.code;
        if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf'].includes(ext)) return t.doc;
        if (['sql', 'db', 'xml', 'csv', 'yaml', 'yml'].includes(ext)) return t.data;
        if (['exe', 'msi', 'dmg', 'pkg', 'deb', 'rpm', 'apk', 'iso'].includes(ext)) return t.app;

        return t.default;
    }

    renderEmpty() {
        if (this.container.querySelector('.material-symbols-outlined')) return;
        this.container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-10 text-slate-400 text-center opacity-50">
                <span class="material-symbols-outlined text-4xl mb-2">sync_disabled</span>
                <p class="font-medium text-sm">No Active Transfers</p>
            </div>
        `;
    }

    updateCounts(count) {
        if (this.activeCountEl) {
            this.activeCountEl.textContent = count;
        }
    }

    // --- Mock Data for Demo ---
    startMockData() {
        console.log("Starting mock data simulation...");
        const mockItems = [

            {
                Name: "database_backup_daily.sql",
                TotalSize: 9019431321, // ~8.4GB
                Percent: 28,
                Written: 2525440770
            },
            {
                Name: "completed_video.mp4",
                TotalSize: 524288000,
                Percent: 100,
                Written: 524288000
            }
        ];

        this.mockInterval = setInterval(() => {
            // Update items randomly
            mockItems.forEach(item => {
                if (item.Percent < 100) {
                    item.Percent += Math.random() * 2;
                    if (item.Percent > 100) item.Percent = 100;
                    item.Written = Math.floor((item.Percent / 100) * item.TotalSize);
                }
            });
            this.updateUI(mockItems);
        }, 1000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.TransferManager = new TransferManager();
    window.TransferManager.init();
});
