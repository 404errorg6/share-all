/**
 * Transfers Page Logic
 */

export const template = `
        <!-- Header -->
        <header
            class="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <button id="menu-btn"
                        class="text-primary flex size-10 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                        <span class="material-symbols-outlined text-3xl">menu</span>
                    </button>
                    <h1 class="text-xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white">Transfers
                    </h1>
                </div>
            </div>
        </header>

        <main class="flex-1 flex flex-col p-6 gap-8 overflow-y-auto min-h-0">
            <!-- Active Transfers -->
            <section>
                <div class="flex items-center gap-2 mb-6">
                    <h2 class="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Active Transfers</h2>
                    <span id="active-count"
                        class="bg-primary/10 text-primary px-3 py-0.5 rounded-full text-[10px] font-bold">0</span>
                    <div class="h-px flex-1 bg-slate-200 dark:bg-white/5 mx-2"></div>
                </div>

                <div id="transfer-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[100px]">
                    <!-- Active Items / Empty State -->
                    <div id="active-empty-state"
                        class="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 text-center opacity-50 bg-slate-100/50 dark:bg-white/5 rounded-[2rem] border border-dashed border-slate-300 dark:border-white/10">
                        <span class="material-symbols-outlined text-6xl mb-4">sync_disabled</span>
                        <p class="font-bold text-xl text-slate-500">No Active Transfers</p>
                    </div>
                </div>
            </section>

            <!-- History Section with Tabs -->
            <section>
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div class="flex items-center gap-2">
                        <h2 class="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">History</h2>
                        <div class="h-px w-8 bg-slate-200 dark:bg-white/5 mx-2"></div>

                        <!-- History Action Buttons -->
                        <div class="flex items-center gap-2 ml-2">
                            <button id="clear-selected-btn"
                                class="opacity-50 cursor-not-allowed flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-red-500 transition-all border border-slate-200 dark:border-white/10"
                                disabled>
                                <span class="material-symbols-outlined text-sm">delete_sweep</span>
                                Clear Selected
                            </button>
                            <button id="clear-all-btn"
                                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-red-500 transition-all border border-slate-200 dark:border-white/10">
                                <span class="material-symbols-outlined text-sm">delete_forever</span>
                                Clear All
                            </button>
                        </div>
                    </div>

                    <!-- Tabs -->
                    <div
                        class="flex p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 w-fit">
                        <button id="tab-downloads"
                            class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all bg-white dark:bg-primary text-slate-900 dark:text-white shadow-sm">
                            Downloads
                        </button>
                        <button id="tab-uploads"
                            class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                            Uploads
                        </button>
                    </div>
                </div>

                <!-- History Lists -->
                <div id="completed-list-downloads" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <!-- Download items will go here -->
                </div>
                <div id="completed-list-uploads" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 hidden">
                    <!-- Upload items will go here -->
                </div>
            </section>
        </main>
`;

import Utils from '../utils.js';

export function init() {
    const context = {
        container: document.getElementById('transfer-list'),
        downloadsContainer: document.getElementById('completed-list-downloads'),
        uploadsContainer: document.getElementById('completed-list-uploads'),
        activeCountEl: document.getElementById('active-count'),
        transfers: new Map(),
        previousState: new Map(),
        currentTab: 'downloads',
        isPolling: false,
        pollInterval: 1000,
        selectedNames: new Set()
    };

    function getTypeInfo(name) {
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

    function formatDuration(seconds) {
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

    function safeId(name) {
        return 'transfer-' + name.replace(/[^a-zA-Z0-9]/g, '_');
    }

    function getTemplateItem(item, id, metrics, isCompleted, isSelected = false) {
        const typeInfo = getTypeInfo(item.Name);
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
                    <div class="flex items-center flex-wrap gap-2">
                        <span class="text-[10px] font-bold uppercase tracking-wide ${opTypeColor} px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                            <span class="material-symbols-outlined text-[12px]">${opIcon}</span> ${opTypeLabel}
                        </span>
                        <div class="info-text flex items-center flex-wrap gap-x-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded-md min-w-0 overflow-hidden">
                            <span class="flex items-center gap-1 whitespace-nowrap"><span class="material-symbols-outlined text-[10px]">speed</span>${metrics.speed}</span>
                            <span class="opacity-30">|</span>
                            <span class="flex items-center gap-1 whitespace-nowrap"><span class="material-symbols-outlined text-[10px]">timer</span>${metrics.eta}</span>
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

        const selectCheckboxId = `select-${id}`;
        const selectCheckbox = isCompleted ? `
            <div class="flex items-center ml-auto">
                <label class="cursor-pointer group relative flex items-center justify-center">
                    <input type="checkbox" id="${selectCheckboxId}" ${isSelected ? 'checked' : ''} class="hidden peer">
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

    function calculateMetrics(item) {
        if (!context.previousState.has(item.Name)) return { speed: "Calculating...", rawSpeed: 0, eta: "Calculating..." };
        const prev = context.previousState.get(item.Name);
        const now = Date.now();
        const timeDiff = (now - prev.timestamp) / 1000;
        if (timeDiff < 0.5) return prev.lastMetrics || { speed: "Calculating...", rawSpeed: 0, eta: "Calculating..." };
        const writtenDiff = item.Written - prev.written;
        let bytesPerSec = writtenDiff / timeDiff;
        if (prev.lastMetrics && prev.lastMetrics.rawSpeed > 0) bytesPerSec = (bytesPerSec * 0.7) + (prev.lastMetrics.rawSpeed * 0.3);
        if (bytesPerSec <= 0.1) {
            const m = { speed: "0 B/s", rawSpeed: 0, eta: "Stalled" };
            prev.lastMetrics = m;
            return m;
        }
        const remainingBytes = item.TotalSize - item.Written;
        const etaSeconds = remainingBytes / bytesPerSec;
        const metrics = { speed: Utils.formatFileSize(bytesPerSec) + "/s", rawSpeed: bytesPerSec, eta: formatDuration(etaSeconds) };
        prev.lastMetrics = metrics;
        return metrics;
    }

    function updateActionButtons() {
        const clearSelectedBtn = document.getElementById('clear-selected-btn');
        if (!clearSelectedBtn) return;
        const hasSelected = context.selectedNames.size > 0;
        clearSelectedBtn.disabled = !hasSelected;
        clearSelectedBtn.classList.toggle('opacity-50', !hasSelected);
        clearSelectedBtn.classList.toggle('cursor-not-allowed', !hasSelected);
    }

    function renderHistory() {
        if (!globalThis.Components?.Transfers) return;
        const history = globalThis.Components.Transfers.getHistory();
        const downloads = history.filter(h => h.IsDownload);
        const uploads = history.filter(h => !h.IsDownload);

        const renderItems = (items, container, typeLabel) => {
            if (!container) return;
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
                const id = safeId(item.Name) + '-complete';
                const isSelected = context.selectedNames.has(item.Name);
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = getTemplateItem(item, id, null, true, isSelected);
                const el = tempDiv.firstElementChild;
                container.appendChild(el);
                
                const checkbox = el.querySelector('input[type="checkbox"]');
                if (checkbox) {
                    checkbox.onchange = () => {
                        if (checkbox.checked) context.selectedNames.add(item.Name);
                        else context.selectedNames.delete(item.Name);
                        updateActionButtons();
                    };
                }
            });
        };

        renderItems(downloads, context.downloadsContainer, 'downloads');
        renderItems(uploads, context.uploadsContainer, 'uploads');
        updateActionButtons();
    }

    function updateUI(data = []) {
        const currentActiveNames = new Set(data.map(d => d.Name));
        for (const [name, id] of context.transfers) {
            if (!currentActiveNames.has(name)) {
                const el = document.getElementById(id);
                if (el) el.remove();
                context.transfers.delete(name);
                context.previousState.delete(name);
            }
        }

        if (data.length === 0) {
            if (!context.container.querySelector('#active-empty-state')) {
                context.container.innerHTML = `
                    <div id="active-empty-state" class="col-span-full flex flex-col items-center justify-center py-10 text-slate-400 text-center opacity-50">
                        <span class="material-symbols-outlined text-4xl mb-2">sync_disabled</span>
                        <p class="font-medium text-sm">No Active Transfers</p>
                    </div>
                `;
            }
        } else {
            const emptyState = document.getElementById('active-empty-state');
            if (emptyState) emptyState.remove();
        }

        data.forEach(item => {
            const metrics = calculateMetrics(item);
            const id = safeId(item.Name);
            if (context.transfers.has(item.Name)) {
                const el = document.getElementById(id);
                if (el) {
                    const pb = el.querySelector('.progress-bar');
                    if (pb) pb.style.width = `${item.Percent}%`;
                    const pt = el.querySelector('.percent-text');
                    if (pt) pt.textContent = `${Math.round(item.Percent)}%`;
                    const st = el.querySelector('.size-text');
                    if (st) st.textContent = `${Utils.formatFileSize(item.Written)} / ${Utils.formatFileSize(item.TotalSize)}`;
                    const it = el.querySelector('.info-text');
                    if (it) it.innerHTML = `
                        <span class="flex items-center gap-1 whitespace-nowrap"><span class="material-symbols-outlined text-[10px]">speed</span>${metrics.speed}</span>
                        <span class="opacity-30">|</span>
                        <span class="flex items-center gap-1 whitespace-nowrap"><span class="material-symbols-outlined text-[10px]">timer</span>${metrics.eta}</span>
                    `;
                }
            } else {
                context.transfers.set(item.Name, id);
                const td = document.createElement('div');
                td.innerHTML = getTemplateItem(item, id, metrics, false);
                context.container.appendChild(td.firstElementChild);
            }
            context.previousState.set(item.Name, { written: item.Written, timestamp: Date.now(), lastMetrics: metrics });
        });

        if (context.activeCountEl) context.activeCountEl.textContent = data.length;
    }

    function startPolling() {
        if (context.isPolling) return;
        context.isPolling = true;
        const poll = async () => {
            if (!context.isPolling) return;
            if (globalThis.Components?.Transfers) {
                const data = globalThis.Components.Transfers.getActive();
                updateUI(data);
            }
            setTimeout(poll, context.pollInterval);
        };
        poll();
    }

    // Tab Logic
    const tabDown = document.getElementById('tab-downloads');
    const tabUp = document.getElementById('tab-uploads');
    
    function switchTab(tab) {
        context.currentTab = tab;
        if (tab === 'downloads') {
            tabDown.className = 'px-4 py-1.5 rounded-lg text-xs font-bold transition-all bg-white dark:bg-primary text-slate-900 dark:text-white shadow-sm';
            tabUp.className = 'px-4 py-1.5 rounded-lg text-xs font-bold transition-all text-slate-500 hover:text-slate-700 dark:hover:text-slate-300';
            context.downloadsContainer.classList.remove('hidden');
            context.uploadsContainer.classList.add('hidden');
        } else {
            tabUp.className = 'px-4 py-1.5 rounded-lg text-xs font-bold transition-all bg-white dark:bg-primary text-slate-900 dark:text-white shadow-sm';
            tabDown.className = 'px-4 py-1.5 rounded-lg text-xs font-bold transition-all text-slate-500 hover:text-slate-700 dark:hover:text-slate-300';
            context.uploadsContainer.classList.remove('hidden');
            context.downloadsContainer.classList.add('hidden');
        }
        context.selectedNames.clear();
        renderHistory();
    }

    if (tabDown) tabDown.onclick = () => switchTab('downloads');
    if (tabUp) tabUp.onclick = () => switchTab('uploads');

    // Buttons
    const clearAllBtn = document.getElementById('clear-all-btn');
    if (clearAllBtn) clearAllBtn.onclick = () => {
        if (!globalThis.Components?.openGuiModal) return;
        globalThis.Components.openGuiModal({
            title: 'Clear All History?',
            message: 'Are you sure you want to clear all transfer history? This action cannot be undone.',
            icon: 'delete_forever',
            type: 'danger',
            primaryText: 'Clear All',
            onPrimary: () => {
                globalThis.Components.Transfers.clearHistory();
                context.selectedNames.clear();
                renderHistory();
                if (globalThis.Components?.showToast) globalThis.Components.showToast('Transfer history cleared');
            }
        });
    };

    const clearSelectedBtn = document.getElementById('clear-selected-btn');
    if (clearSelectedBtn) clearSelectedBtn.onclick = () => {
        if (context.selectedNames.size === 0 || !globalThis.Components?.openGuiModal) return;
        const count = context.selectedNames.size;
        globalThis.Components.openGuiModal({
            title: 'Clear Selected?',
            message: `Are you sure you want to clear ${count} selected items from history?`,
            icon: 'delete_sweep',
            type: 'danger',
            primaryText: 'Delete Selected',
            onPrimary: () => {
                globalThis.Components.Transfers.clearItems(Array.from(context.selectedNames));
                context.selectedNames.clear();
                renderHistory();
                if (globalThis.Components?.showToast) globalThis.Components.showToast(`${count} items removed`);
            }
        });
    };

    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn && globalThis.Components?.toggleMenu) menuBtn.onclick = () => globalThis.Components.toggleMenu();

    // Initial load
    renderHistory();
    startPolling();

    window.addEventListener('transfer-completed', () => renderHistory());

    if (globalThis.Components?.Sidebar?.highlight) {
        globalThis.Components.Sidebar.highlight('transfers');
    }

    // Cleanup when router unloads? (Optionally handle)
    // For now, we just stop polling if we are not on this page (router should handle that eventually)
}
