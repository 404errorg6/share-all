class TransferManager {
    constructor() {
        this.container = document.getElementById('transfer-list');
        this.downloadsContainer = document.getElementById('completed-list-downloads');
        this.uploadsContainer = document.getElementById('completed-list-uploads');
        this.activeCountEl = document.getElementById('active-count');

        this.transfers = new Map(); // Map<string, ElementID>
        this.previousState = new Map(); // Map<string, {written: number, timestamp: number}>
        this.currentTab = 'downloads';
        this.isPolling = false;
        this.pollInterval = 1000;
        this.selectedNames = new Set();
    }

    init() {
        console.log("TransferManager initialized");
        this.renderHistory();
        this.startPolling();

        // Listen for completions to update moving items to history list
        window.addEventListener('transfer-completed', (e) => {
            this.renderHistory();
        });
    }

    startPolling() {
        if (this.isPolling) return;
        this.isPolling = true;

        const poll = async () => {
            const data = Components.Transfers.getActive();
            this.updateUI(data);

            if (this.isPolling) {
                setTimeout(poll, this.pollInterval);
            }
        };

        poll();
    }

    switchTab(tab) {
        this.currentTab = tab;

        // Update UI Tabs
        const tabDown = document.getElementById('tab-downloads');
        const tabUp = document.getElementById('tab-uploads');
        const listDown = document.getElementById('completed-list-downloads');
        const listUp = document.getElementById('completed-list-uploads');

        if (tab === 'downloads') {
            tabDown.className = 'px-4 py-1.5 rounded-lg text-xs font-bold transition-all bg-white dark:bg-primary text-slate-900 dark:text-white shadow-sm';
            tabUp.className = 'px-4 py-1.5 rounded-lg text-xs font-bold transition-all text-slate-500 hover:text-slate-700 dark:hover:text-slate-300';
            listDown.classList.remove('hidden');
            listUp.classList.add('hidden');
        } else {
            tabUp.className = 'px-4 py-1.5 rounded-lg text-xs font-bold transition-all bg-white dark:bg-primary text-slate-900 dark:text-white shadow-sm';
            tabDown.className = 'px-4 py-1.5 rounded-lg text-xs font-bold transition-all text-slate-500 hover:text-slate-700 dark:hover:text-slate-300';
            listUp.classList.remove('hidden');
            listDown.classList.add('hidden');
        }

        this.selectedNames.clear();
        this.renderHistory();
        this.updateActionButtons();
    }

    updateActionButtons() {
        const clearSelectedBtn = document.getElementById('clear-selected-btn');
        if (clearSelectedBtn) {
            clearSelectedBtn.disabled = this.selectedNames.size === 0;
            if (this.selectedNames.size > 0) {
                clearSelectedBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            } else {
                clearSelectedBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
        }
    }

    toggleSelect(name) {
        if (this.selectedNames.has(name)) {
            this.selectedNames.delete(name);
        } else {
            this.selectedNames.add(name);
        }
        this.updateActionButtons();
    }

    clearAll() {
        Components.openGuiModal({
            title: 'Clear All History?',
            message: 'Are you sure you want to clear all transfer history? This action cannot be undone.',
            icon: 'delete_forever',
            type: 'danger',
            primaryText: 'Clear All',
            onPrimary: () => {
                Components.Transfers.clearHistory();
                this.selectedNames.clear();
                this.updateActionButtons();
                Components.showToast('Transfer history cleared');
            }
        });
    }

    clearSelected() {
        if (this.selectedNames.size === 0) return;
        Components.openGuiModal({
            title: 'Clear Selected?',
            message: `Are you sure you want to clear ${this.selectedNames.size} selected items from history?`,
            icon: 'delete_sweep',
            type: 'danger',
            primaryText: 'Delete Selected',
            onPrimary: () => {
                Components.Transfers.clearItems(Array.from(this.selectedNames));
                this.selectedNames.clear();
                this.updateActionButtons();
                Components.showToast(`${this.selectedNames.size} items removed`);
            }
        });
    }

    renderHistory() {
        const history = Components.Transfers.getHistory();
        const downloads = history.filter(h => h.IsDownload);
        const uploads = history.filter(h => !h.IsDownload);

        const renderItems = (items, container, typeLabel) => {
            container.innerHTML = '';
            if (items.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full flex flex-col items-center justify-center py-10 text-slate-400 text-center opacity-50 bg-slate-100/30 dark:bg-white/5 rounded-2xl border border-dashed border-slate-200 dark:border-white/5">
                        <span class="material-symbols-outlined text-4xl mb-2">history</span>
                        <p class="font-medium text-sm">No ${typeLabel} in history</p>
                    </div>
                `;
                return;
            }
            items.forEach(item => {
                const tempDiv = document.createElement('div');
                const isSelected = this.selectedNames.has(item.Name);
                tempDiv.innerHTML = this.getTemplate(item, `completed-${this.safeId(item.Name)}`, null, true, isSelected);
                container.appendChild(tempDiv.firstElementChild);
            });
        };

        renderItems(downloads, this.downloadsContainer, 'downloads');
        renderItems(uploads, this.uploadsContainer, 'uploads');
        this.updateActionButtons();
    }

    updateUI(data) {
        if (!data) data = [];

        // 1. Clean up active transfers
        const currentActiveNames = new Set(data.map(d => d.Name));
        for (const [name, id] of this.transfers) {
            if (!currentActiveNames.has(name)) {
                const el = document.getElementById(id);
                if (el) el.remove();
                this.transfers.delete(name);
                this.previousState.delete(name);
            }
        }

        // 2. Process Current Data Payload
        if (data.length === 0) {
            this.renderEmpty();
        } else {
            const emptyState = document.getElementById('active-empty-state');
            if (emptyState) emptyState.remove();

            if (this.container.querySelector('.material-symbols-outlined') && !this.container.querySelector('[id^="transfer-"]')) {
                this.container.innerHTML = '';
            }
        }

        data.forEach(item => {
            const metrics = this.calculateMetrics(item);
            if (this.transfers.has(item.Name)) {
                this.updateItem(item, metrics);
            } else {
                this.addItem(item, metrics);
            }

            this.previousState.set(item.Name, {
                written: item.Written,
                timestamp: Date.now(),
                lastMetrics: metrics
            });
        });

        this.updateCounts(data.length);
    }

    calculateMetrics(item) {
        if (!this.previousState.has(item.Name)) {
            return { speed: "Calculating...", rawSpeed: 0, eta: "Calculating..." };
        }
        const prev = this.previousState.get(item.Name);
        const now = Date.now();
        const timeDiff = (now - prev.timestamp) / 1000;

        // Don't update speed if less than 500ms has passed to avoid noise
        if (timeDiff < 0.5) {
            return prev.lastMetrics || { speed: "Calculating...", rawSpeed: 0, eta: "Calculating..." };
        }

        const writtenDiff = item.Written - prev.written;
        let bytesPerSec = writtenDiff / timeDiff;

        // Smooth speed with previous value (70% current, 30% previous)
        if (prev.lastMetrics && prev.lastMetrics.rawSpeed > 0) {
            bytesPerSec = (bytesPerSec * 0.7) + (prev.lastMetrics.rawSpeed * 0.3);
        }

        if (bytesPerSec <= 0.1) {
            const metrics = { speed: "0 B/s", rawSpeed: 0, eta: "Stalled" };
            prev.lastMetrics = metrics;
            return metrics;
        }

        const remainingBytes = item.TotalSize - item.Written;
        const etaSeconds = remainingBytes / bytesPerSec;

        const metrics = {
            speed: Utils.formatFileSize(bytesPerSec) + "/s",
            rawSpeed: bytesPerSec,
            eta: this.formatDuration(etaSeconds)
        };

        prev.lastMetrics = metrics;
        return metrics;
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

    updateItem(item, metrics) {
        const id = this.transfers.get(item.Name);
        const el = document.getElementById(id);
        if (!el) return;

        const progressBar = el.querySelector('.progress-bar');
        if (progressBar) progressBar.style.width = `${item.Percent}%`;

        const percentEl = el.querySelector('.percent-text');
        if (percentEl) percentEl.textContent = `${Math.round(item.Percent)}%`;

        const sizeEl = el.querySelector('.size-text');
        if (sizeEl) sizeEl.textContent = `${Utils.formatFileSize(item.Written)} / ${Utils.formatFileSize(item.TotalSize)}`;

        const infoEl = el.querySelector('.info-text');
        if (infoEl) {
            infoEl.innerHTML = `
                <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[10px]">speed</span>${metrics.speed}</span>
                <span class="mx-1 opacity-30">|</span>
                <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[10px]">timer</span>${metrics.eta}</span>
            `;
        }
    }

    getTemplate(item, id, metrics, isCompleted, isSelected = false) {
        const typeInfo = this.getTypeInfo(item.Name);
        const total = Utils.formatFileSize(item.TotalSize);
        const opTypeLabel = item.IsDownload ? 'Download' : 'Upload';
        const opTypeColor = item.IsDownload ? 'text-primary bg-primary/10' : 'text-orange-500 bg-orange-500/10';
        const opIcon = item.IsDownload ? 'download' : 'upload';

        let statusRow = '';
        if (isCompleted) {
            statusRow = `
                 <div class="flex items-center gap-2 mt-1">
                    <span class="text-[10px] font-bold uppercase tracking-wide text-green-500 bg-green-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <span class="material-symbols-outlined text-[12px]">check_circle</span> Completed
                    </span>
                    <span class="text-[10px] font-bold uppercase tracking-wide ${opTypeColor} px-2 py-0.5 rounded-md flex items-center gap-1">
                        <span class="material-symbols-outlined text-[12px]">${opIcon}</span> ${opTypeLabel}
                    </span>
                </div>
            `;
        } else {
            statusRow = `
                <div class="flex flex-col gap-2 mt-1">
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] font-bold uppercase tracking-wide ${opTypeColor} px-2 py-0.5 rounded-md flex items-center gap-1">
                            <span class="material-symbols-outlined text-[12px]">${opIcon}</span> ${opTypeLabel}
                        </span>
                        <div class="info-text flex items-center text-[10px] font-bold uppercase tracking-wide text-slate-500 bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded-md">
                            <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[10px]">speed</span>${metrics.speed}</span>
                            <span class="mx-1 opacity-30">|</span>
                            <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[10px]">timer</span>${metrics.eta}</span>
                        </div>
                    </div>
                </div>
            `;
        }

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

        const selectCheckbox = isCompleted ? `
            <div class="flex items-center ml-auto">
                <label class="cursor-pointer group relative flex items-center justify-center">
                    <input type="checkbox" 
                        ${isSelected ? 'checked' : ''} 
                        onchange="TransferManager.toggleSelect('${item.Name.replace(/'/g, "\\'")}')"
                        class="hidden peer">
                    <div class="size-7 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 peer-checked:bg-primary peer-checked:border-primary flex items-center justify-center transition-all duration-300 shadow-sm group-hover:border-primary/50 group-hover:bg-primary/5">
                        <span class="material-symbols-outlined text-white text-[18px] scale-0 peer-checked:scale-100 transition-transform duration-300 font-bold">check</span>
                    </div>
                </label>
            </div>
        ` : '';

        return `
            <div id="${id}" class="p-4 rounded-xl bg-white dark:bg-surface-dark border ${isSelected ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'border-slate-100 dark:border-slate-800/50'} shadow-sm animate-fade-in transition-all">
                <div class="flex items-start gap-4">
                    <div class="w-12 h-12 flex items-center justify-center rounded-2xl ${typeInfo.bg} ${typeInfo.text}">
                        <span class="material-symbols-outlined text-3xl">${typeInfo.icon}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-start">
                            <h3 class="font-semibold truncate pr-2 text-slate-900 dark:text-slate-100">${item.Name}</h3>
                            ${selectCheckbox}
                        </div>
                        ${statusRow}
                        ${isCompleted ? `<div class="mt-2 text-[10px] text-slate-400 font-medium">Size: ${total}</div>` : ''}
                    </div>
                </div>
                ${progressSection}
            </div>
        `;
    }

    getTypeInfo(name) {
        const ext = name.split('.').pop().toLowerCase();
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
        if (this.container.querySelector('.material-symbols-outlined') && !this.container.querySelector('[id^="transfer-"]')) return;
        this.container.innerHTML = `
            <div id="active-empty-state" class="col-span-full flex flex-col items-center justify-center py-10 text-slate-400 text-center opacity-50">
                <span class="material-symbols-outlined text-4xl mb-2">sync_disabled</span>
                <p class="font-medium text-sm">No Active Transfers</p>
            </div>
        `;
    }

    updateCounts(count) {
        if (this.activeCountEl) this.activeCountEl.textContent = count;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.TransferManager = new TransferManager();
    window.TransferManager.init();
});
