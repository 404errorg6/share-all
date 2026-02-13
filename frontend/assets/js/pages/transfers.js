
// Utility functions are loaded globally via <script src="../assets/js/utils.js">
// We can access them via window.Utils

class TransferManager {
    constructor() {
        this.container = document.getElementById('transfer-list');
        this.activeCountEl = document.getElementById('active-count');
        this.globalDownEl = document.getElementById('global-down-speed');
        this.globalUpEl = document.getElementById('global-up-speed');

        this.transfers = new Map(); // Map<string, ElementID>
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
            // If we have mock data running, don't poll (or do both, but mock takes precedence for demo)
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
        if (!data || data.length === 0) {
            this.renderEmpty();
            this.updateCounts(0);
            return;
        }

        // If transitioning from empty state
        if (this.container.querySelector('.material-symbols-outlined') && this.container.children.length === 1 && !this.container.querySelector('[id^="transfer-"]')) {
            this.container.innerHTML = '';
        }

        const currentNames = new Set(data.map(d => d.Name));

        // 1. Remove old transfers
        for (const [name, id] of this.transfers) {
            if (!currentNames.has(name)) {
                const el = document.getElementById(id);
                if (el) el.remove();
                this.transfers.delete(name);
            }
        }

        // 2. Update or Add transfers
        data.forEach(item => {
            if (this.transfers.has(item.Name)) {
                this.updateItem(item);
            } else {
                this.addItem(item);
            }
        });

        this.updateCounts(data.length);
    }

    safeId(name) {
        return 'transfer-' + name.replace(/[^a-zA-Z0-9]/g, '_');
    }

    addItem(item) {
        const id = this.safeId(item.Name);
        this.transfers.set(item.Name, id);

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = this.getTemplate(item, id);
        const newEl = tempDiv.firstElementChild;

        this.container.appendChild(newEl);
    }

    updateItem(item) {
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

        // Update Remaining Time (optional, check if element exists)
        // We didn't put it in the template initially, let's add it dynamically if we want
    }

    getTemplate(item, id) {
        const typeInfo = this.getTypeInfo(item.Name);
        const percent = Math.round(item.Percent);
        const written = Utils.formatFileSize(item.Written);
        const total = Utils.formatFileSize(item.TotalSize);

        return `
            <div id="${id}" class="space-y-3 animate-fade-in transition-all">
                <div class="flex items-start gap-4">
                    <div class="w-12 h-12 flex items-center justify-center rounded-2xl ${typeInfo.bg} ${typeInfo.text}">
                        <span class="material-symbols-outlined text-3xl">${typeInfo.icon}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-start">
                            <h3 class="font-semibold truncate pr-2 text-slate-900 dark:text-slate-100">${item.Name}</h3>
                        </div>
                    </div>
                </div>
                <div class="space-y-2">
                    <div class="flex justify-between text-xs font-medium">
                        <span class="percent-text ${typeInfo.text}">${percent}%</span>
                        <span class="size-text text-slate-500">${written} / ${total}</span>
                    </div>
                    <div class="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div class="progress-bar ${typeInfo.bgFull} h-full rounded-full transition-all duration-500" style="width: ${item.Percent}%"></div>
                    </div>
                </div>
            </div>
        `;
    }

    getTypeInfo(name) {
        const ext = name.split('.').pop().toLowerCase();

        // Colors mapping based on user design
        const colors = {
            blue: { bg: 'bg-blue-500/10', text: 'text-blue-500', bgFull: 'bg-blue-500', icon: 'cloud_upload' },
            orange: { bg: 'bg-orange-500/10', text: 'text-orange-500', bgFull: 'bg-orange-500', icon: 'description' },
            purple: { bg: 'bg-purple-500/10', text: 'text-purple-500', bgFull: 'bg-purple-500', icon: 'image' },
            green: { bg: 'bg-green-500/10', text: 'text-green-500', bgFull: 'bg-green-500', icon: 'folder_zip' }
        };

        if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) return colors.green;
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return colors.purple;
        if (['sql', 'db', 'json', 'xml', 'txt', 'md'].includes(ext)) return colors.orange;

        return colors.blue;
    }

    renderEmpty() {
        this.container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-20 text-slate-400 text-center opacity-50">
                <span class="material-symbols-outlined text-6xl mb-4">sync_disabled</span>
                <p class="font-bold text-lg">No Active Transfers</p>
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
                Name: "project_assets_v2.zip",
                TotalSize: 125829120, // ~120MB
                Percent: 64,
                Written: 80530636,
                EstimatedRemainingTime: "2m 30s"
            },
            {
                Name: "database_backup_daily.sql",
                TotalSize: 9019431321, // ~8.4GB
                Percent: 28,
                Written: 2525440770,
                EstimatedRemainingTime: "15m"
            },
            {
                Name: "hero_banner_4k.png",
                TotalSize: 13107200, // ~12.5MB
                Percent: 0,
                Written: 0,
                EstimatedRemainingTime: "Pending"
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
