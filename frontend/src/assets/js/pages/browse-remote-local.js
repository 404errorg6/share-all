import { FTP_API } from '../ftp-api.js';
import { Renderer } from '../ftp-renderer.js';
import { state, ui } from '../ftp-state.js';
import { Clipboard } from '../ftp-clipboard.js';
import { Events } from '@wailsio/runtime';

/**
 * Browse Remote Local Page Logic
 */

export const template = `
    <header class="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div class="flex items-center p-4 pb-0 justify-between">
            <div class="flex items-center gap-3">
                <button id="menu-btn"
                    class="text-primary flex size-10 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                    <span class="material-symbols-outlined text-3xl">menu</span>
                </button>
                <div class="flex flex-col">
                    <h2 id="server-name" class="text-slate-900 dark:text-white text-lg font-bold">Remote Server</h2>
                    <p id="server-info" class="text-slate-500 dark:text-[#9cb0ba] text-xs">Connecting...</p>
                </div>
            </div>
        </div>

        <!-- Context Tabs -->
        <div class="flex border-b border-slate-200 dark:border-[#3b4c54] px-4 mt-4">
            <button id="tab-remote" class="relative flex flex-col items-center justify-center pb-3 flex-1 transition-colors group">
                <p class="text-primary text-sm font-bold uppercase">Remote</p>
                <div id="remote-indicator" class="absolute bottom-0 w-full h-[3px] bg-primary"></div>
            </button>
            <button id="tab-local" class="relative flex flex-col items-center justify-center pb-3 flex-1 text-slate-400 dark:text-slate-500 transition-colors group">
                <p class="text-sm font-bold uppercase group-hover:text-primary transition-colors">Local</p>
                <div id="local-indicator" class="absolute bottom-0 w-full h-[3px] bg-primary hidden"></div>
            </button>
        </div>

        <!-- Global Toolbar -->
        <div class="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/30 px-4 py-2 border-b border-slate-200 dark:border-slate-800">
            <button id="refresh-btn"
                class="flex items-center justify-center size-9 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Refresh">
                <span class="material-symbols-outlined text-[20px]">refresh</span>
            </button>
            <button id="toggle-hidden-btn"
                class="flex items-center justify-center size-9 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors opacity-50"
                title="Toggle Hidden">
                <span id="hidden-icon" class="material-symbols-outlined text-[20px]">visibility_off</span>
            </button>
            <div class="flex-1"></div>
            <button id="toggle-select-mode"
                class="flex items-center justify-center gap-1.5 px-3 h-9 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400"
                title="Selection Mode">
                <span class="material-symbols-outlined text-[18px]">rule</span>
                <span class="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Select</span>
            </button>
            <button id="discover-btn"
                class="flex items-center justify-center gap-1.5 px-3 h-9 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all border border-primary/20"
                title="Discover Others">
                <span class="material-symbols-outlined text-[18px]">radar</span>
                <span class="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Discover Others</span>
            </button>
            <div id="pane-selection-indicator"
                class="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ml-2">
                Remote View</div>
        </div>

        <!-- Dynamic Breadcrumbs -->
        <div class="flex items-center gap-2 bg-slate-100 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-200 dark:border-white/5">
            <button id="go-up-btn"
                class="flex items-center justify-center size-9 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0">
                <span class="material-symbols-outlined text-[20px]">arrow_upward</span>
            </button>
            <div id="breadcrumb-path"
                class="flex items-center gap-1 overflow-x-auto whitespace-nowrap scrollbar-hide flex-1"></div>
        </div>
    </header>

    <main class="flex-1 flex flex-col relative min-h-0 lg:pb-0 overflow-hidden">
        <!-- Remote Pane -->
        <div id="remote-pane" data-file-drop-target class="flex-1 flex flex-col overflow-y-auto relative">
            <div id="remote-list" class="flex flex-col min-h-[100px]"></div>
            <div id="remote-empty"
                class="hidden flex flex-col items-center justify-center py-20 text-slate-400 text-center">
                <span class="material-symbols-outlined text-6xl mb-4 opacity-20">cloud_off</span>
                <p class="font-bold text-xl text-slate-300">No Files Found</p>
                <div class="mt-8 flex flex-col items-center gap-2 opacity-40">
                   <span class="material-symbols-outlined text-4xl animate-bounce">upload_file</span>
                   <p class="text-xs font-black uppercase tracking-widest">Drag files here to upload</p>
                </div>
            </div>

            <!-- Clickable Upload Toggle Button (Tablet/Desktop) -->
            <button id="upload-mode-btn" class="hidden sm:flex absolute bottom-6 right-6 items-center gap-3 bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/10 p-3 rounded-2xl opacity-60 hover:opacity-100 hover:scale-105 active:scale-95 transition-all text-slate-300">
                <div class="icon-box size-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary transition-colors">
                    <span class="material-symbols-outlined">add_circle</span>
                </div>
                <div class="flex flex-col pr-2 text-left">
                    <p class="text-[10px] font-black uppercase tracking-widest opacity-70">Upload</p>
                    <p id="upload-btn-text" class="text-[11px] font-bold">Press to Drop</p>
                </div>
            </button>
        </div>

        <!-- Local Pane -->
        <div id="local-pane" class="hidden flex-1 flex flex-col overflow-y-auto">
            <div id="local-list" class="flex flex-col min-h-[100px]"></div>
            <div id="local-empty"
                class="hidden flex flex-col items-center justify-center py-20 text-slate-400 text-center">
                <span class="material-symbols-outlined text-6xl mb-4 opacity-20">folder_off</span>
                <p class="font-bold text-xl text-slate-300">Local Folder Empty</p>
            </div>
        </div>

        <!-- Loading Indicator Overlay -->
        <div id="sync-overlay"
            class="absolute inset-0 bg-white/80 dark:bg-background-dark/80 backdrop-blur-sm z-30 flex items-center justify-center hidden">
            <div class="flex flex-col items-center gap-4">
                <div class="animate-spin size-10 border-4 border-primary border-t-transparent rounded-full"></div>
                <p class="text-xs font-black uppercase tracking-[0.2em] text-primary">Syncing Files...</p>
            </div>
        </div>
    </main>

    <!-- Options Modal Context Menu -->
    <div id="options-modal"
        class="fixed inset-0 z-40 hidden flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
        <div id="options-modal-content"
            class="modal-container relative w-full max-w-[340px] bg-white dark:bg-surface-dark rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-300">
            <div class="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5">
                <p id="options-filename" class="text-lg font-bold truncate text-slate-900 dark:text-white"></p>
                <p id="options-type" class="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black mt-1">
                    Actions</p>
            </div>
            <div class="p-4 flex flex-col gap-2">
                <button id="btn-preview"
                    class="flex items-center gap-4 w-full px-6 py-5 rounded-2xl hover:bg-primary/10 text-primary transition-all active:scale-95 group text-left">
                    <div
                        class="size-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                        <span class="material-symbols-outlined text-[22px]">visibility</span>
                    </div>
                    <span class="text-base font-bold">Preview</span>
                </button>
                <button id="btn-copy"
                    class="flex items-center gap-4 w-full px-6 py-5 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-900 dark:text-white transition-all active:scale-95 group text-left">
                    <div
                        class="size-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center group-hover:bg-slate-900 dark:group-hover:bg-white dark:group-hover:text-slate-900 group-hover:text-white transition-all">
                        <span class="material-symbols-outlined text-[22px]">content_copy</span>
                    </div>
                    <span class="text-base font-bold">Copy</span>
                </button>
                <button id="btn-delete"
                    class="flex items-center gap-4 w-full px-6 py-5 rounded-2xl hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-all active:scale-95 group text-left">
                    <div
                        class="size-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all">
                        <span class="material-symbols-outlined text-[22px]">delete</span>
                    </div>
                    <span class="text-base font-bold">Delete Item</span>
                </button>
            </div>
            <button id="close-options-btn"
                class="w-full py-6 text-xs font-black uppercase tracking-[0.2em] text-slate-500 hover:text-red-500 border-t border-slate-100 dark:border-white/5 transition-colors">Cancel</button>
        </div>
    </div>

    <!-- Paste Bar -->
    <div id="paste-bar"
        class="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-30 hidden w-[calc(100%-48px)] max-w-sm transition-all duration-300">
        <div class="bg-primary shadow-2xl shadow-primary/30 rounded-2xl p-4 flex items-center justify-between">
            <div class="flex items-center gap-3 overflow-hidden">
                <div class="size-9 bg-white/20 rounded-lg flex items-center justify-center text-white">
                    <span class="material-symbols-outlined text-xl">content_paste</span>
                </div>
                <div class="flex flex-col overflow-hidden">
                    <p id="paste-message" class="text-[10px] font-black uppercase tracking-widest text-white/70">Ready to Paste</p>
                    <p id="paste-info" class="text-xs font-bold text-white truncate"></p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <button id="clear-clipboard-btn" class="p-2 text-white/70 hover:text-white">
                    <span class="material-symbols-outlined text-xl">close</span>
                </button>
                <button id="btn-delete-selected"
                    class="hidden px-5 py-2 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">Delete All</button>
                <button id="btn-finish-selection"
                    class="hidden px-5 py-2 bg-white text-primary rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">Copy</button>
                <button id="btn-paste-action"
                    class="px-5 py-2 bg-white text-primary rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">Paste All</button>
            </div>
        </div>
    </div>
`;

export function init() {
    // --- Elements ---
    const optModal = document.getElementById('options-modal');
    const optContent = document.getElementById('options-modal-content');
    const breadcrumbsContainer = document.getElementById('breadcrumb-path');
    const serverNameEl = document.getElementById('server-name');
    const serverInfoEl = document.getElementById('server-info');
    const menuBtn = document.getElementById('menu-btn');
    const syncOverlay = document.getElementById('sync-overlay');
    const tabRemote = document.getElementById('tab-remote');
    const tabLocal = document.getElementById('tab-local');
    const refreshBtn = document.getElementById('refresh-btn');
    const toggleHiddenBtn = document.getElementById('toggle-hidden-btn');
    const toggleSelectBtn = document.getElementById('toggle-select-mode');
    const discoverBtn = document.getElementById('discover-btn');
    const goUpBtn = document.getElementById('go-up-btn');
    const clearClipboardBtn = document.getElementById('clear-clipboard-btn');
    const deleteSelectedBtn = document.getElementById('btn-delete-selected');
    const finishSelectionBtn = document.getElementById('btn-finish-selection');
    const pasteActionBtn = document.getElementById('btn-paste-action');
    const closeOptionsBtn = document.getElementById('close-options-btn');

    let currentServer = null;

    function handleError(e) {
        let msg = e.message;
        if (msg.includes('550') && msg.includes('operation not permitted')) {
            msg = "Write not allowed here";
        }
        if (globalThis.Components?.showToast) {
            globalThis.Components.showToast(msg, 'error');
        } else {
            console.error(msg);
        }
    }

    // --- Pane Management ---
    function switchPane(pane) {
        state.activePane = pane;

        const iRem = document.getElementById('remote-indicator');
        const iLoc = document.getElementById('local-indicator');
        const rPane = document.getElementById('remote-pane');
        const lPane = document.getElementById('local-pane');
        const paneInd = document.getElementById('pane-selection-indicator');

        if (pane === 'remote') {
            tabRemote.classList.remove('text-slate-400', 'text-slate-500'); tabRemote.classList.add('text-primary');
            tabLocal.classList.remove('text-primary'); tabLocal.classList.add('text-slate-400');
            iRem.classList.remove('hidden'); iLoc.classList.add('hidden');
            rPane.classList.remove('hidden'); lPane.classList.add('hidden');
            paneInd.innerText = 'Remote View';

            if (currentServer) {
                serverNameEl.innerText = currentServer.name;
                serverInfoEl.innerText = `${currentServer.host}:${currentServer.port}`;
            }
            renderActiveBreadcrumbs(state.currentRemotePath, 'remote');
        } else {
            tabLocal.classList.remove('text-slate-400', 'text-slate-500'); tabLocal.classList.add('text-primary');
            tabRemote.classList.remove('text-primary'); tabRemote.classList.add('text-slate-400');
            iLoc.classList.remove('hidden'); iRem.classList.add('hidden');
            lPane.classList.remove('hidden'); rPane.classList.add('hidden');
            paneInd.innerText = 'Local View';

            serverNameEl.innerText = "Local Storage";
            serverInfoEl.innerText = "Internal Device";
            renderActiveBreadcrumbs(state.currentLocalPath, 'local');
        }
        Clipboard.updateBar();
        Clipboard.syncModeUI();
    }
    window.switchPane = switchPane;

    // --- Data Fetching ---
    async function fetchFiles(type, path, silent = false, forceRefresh = false) {
        if (!silent && syncOverlay) syncOverlay.classList.remove('hidden');
        try {
            const data = await FTP_API.fetchFiles(type, path, forceRefresh);
            Renderer.renderList(type, data, path, handleAction);
            renderActiveBreadcrumbs(path, type);
        } catch (e) {
            handleError(e);
            if (type === 'remote') {
                if (globalThis.Components?.showToast) {
                    globalThis.Components.showToast('Remote connection failed. Redirecting to discover...', 'error');
                }
                window.location.hash = '#/discover?force=true';
            }
        } finally {
            if (!silent && syncOverlay) syncOverlay.classList.add('hidden');
        }
    }

    function handleAction(e, entry, normalizedPath, type) {
        if (!optModal.classList.contains('hidden')) return;

        const optBtn = e.target.closest('.options-trigger');
        if (optBtn) {
            e.stopPropagation();
            if (type === 'remote') openRemoteOptions(entry, normalizedPath);
            else openLocalOptions(entry, normalizedPath);
            return;
        }

        if (state.selectionMode) {
            toggleSelection(normalizedPath, entry.Name, entry.IsFolder, type, entry.Size);
        } else {
            if (entry.IsFolder) {
                if (type === 'remote') {
                    state.currentRemotePath = normalizedPath;
                    fetchFiles('remote', state.currentRemotePath);
                } else {
                    state.currentLocalPath = normalizedPath;
                    fetchFiles('local', state.currentLocalPath);
                }
            } else {
                if (globalThis.Preview) {
                    globalThis.Preview.show(normalizedPath, entry.Name, type === 'remote');
                }
            }
        }
    }

    function renderActiveBreadcrumbs(path, type) {
        const onClick = (targetPath) => {
            if (type === 'local') { state.currentLocalPath = targetPath; fetchFiles('local', targetPath); }
            else { state.currentRemotePath = targetPath; fetchFiles('remote', targetPath); }
        };

        if (state.activePane === type) {
            Renderer.renderBreadcrumbs(breadcrumbsContainer, path, type, onClick);
        }

        const specific = document.getElementById(`${type}-breadcrumbs`);
        if (specific) {
            Renderer.renderBreadcrumbs(specific, path, type, onClick);
        }
    }

    function toggleSelectionMode() {
        Clipboard.toggleMode(() => refreshCurrent());
    }

    function toggleSelection(path, name, isFolder, pane, size) {
        Clipboard.toggleSelection({ path, name, isFolder, size }, pane, () => refreshCurrent(true));
    }
    window.toggleSelection = toggleSelection;

    function refreshCurrent(silent = false, forceRefresh = false) {
        if (state.activePane === 'remote') fetchFiles('remote', state.currentRemotePath, silent, forceRefresh);
        else fetchFiles('local', state.currentLocalPath, silent, forceRefresh);
    }
    window.refreshCurrent = refreshCurrent;

    // --- File Actions ---
    function openRemoteOptions(entry, path) {
        document.getElementById('options-filename').innerText = entry.Name;
        document.getElementById('options-type').innerText = "Remote " + (entry.IsFolder ? "Folder" : "File") + " Actions";
        optModal.classList.remove('hidden');
        setTimeout(() => {
            optContent.classList.remove('scale-95', 'opacity-0');
            optContent.classList.add('scale-100', 'opacity-100');
        }, 10);

        const btnPreview = document.getElementById('btn-preview');
        const btnCopy = document.getElementById('btn-copy');
        const btnDelete = document.getElementById('btn-delete');

        btnPreview.classList.toggle('hidden', entry.IsFolder);
        btnPreview.onclick = () => { closeOptionsModal(); if (globalThis.Preview) globalThis.Preview.show(path, entry.Name, true); };

        btnCopy.classList.remove('hidden');
        btnCopy.onclick = () => { closeOptionsModal(); toggleSelection(path, entry.Name, entry.IsFolder, 'remote', entry.Size); };

        btnDelete.classList.add('hidden');
    }

    function openLocalOptions(entry, path) {
        document.getElementById('options-filename').innerText = entry.Name;
        document.getElementById('options-type').innerText = "Local " + (entry.IsFolder ? "Folder" : "File") + " Actions";
        optModal.classList.remove('hidden');
        setTimeout(() => {
            optContent.classList.remove('scale-95', 'opacity-0');
            optContent.classList.add('scale-100', 'opacity-100');
        }, 10);

        const btnPreview = document.getElementById('btn-preview');
        const btnCopy = document.getElementById('btn-copy');
        const btnDelete = document.getElementById('btn-delete');

        btnPreview.classList.toggle('hidden', entry.IsFolder);
        btnPreview.onclick = () => { closeOptionsModal(); if (globalThis.Preview) globalThis.Preview.show(path, entry.Name, false); };

        btnCopy.classList.remove('hidden');
        btnCopy.onclick = () => { closeOptionsModal(); toggleSelection(path, entry.Name, entry.IsFolder, 'local', entry.Size); };

        btnDelete.classList.remove('hidden');
        btnDelete.onclick = () => { closeOptionsModal(); confirmDelete(path, entry.Name, false); };
    }

    function closeOptionsModal() {
        optContent.classList.add('scale-95', 'opacity-0');
        optContent.classList.remove('scale-100', 'opacity-100');
        setTimeout(() => { optModal.classList.add('hidden'); }, 300);
    }

    function confirmDelete(path, name, isRemote) {
        if (!globalThis.Components?.openGuiModal) return;
        globalThis.Components.openGuiModal({
            title: 'Delete Item?',
            message: `Are you sure you want to delete ${name}? This action cannot be undone.`,
            icon: 'delete_forever',
            type: 'danger',
            primaryText: 'Delete',
            onPrimary: () => performDelete(path, isRemote)
        });
    }

    async function performDelete(path, isRemote) {
        if (syncOverlay) syncOverlay.classList.remove('hidden');
        try {
            await FTP_API.deleteItem(path, isRemote);
            if (globalThis.Components?.showToast) globalThis.Components.showToast('Item deleted');
            FTP_API.clearCache();
            refreshCurrent(false, true);
        } catch (e) {
            handleError(e);
        } finally {
            if (syncOverlay) syncOverlay.classList.add('hidden');
        }
    }

    function goUp() {
        let path = state.activePane === 'remote' ? state.currentRemotePath : state.currentLocalPath;
        const parts = path.split('/').filter(p => p && p !== '.');
        parts.pop();
        const isLocal = state.activePane === 'local';
        const newPath = isLocal ?
            (parts.length === 0 ? '.' : './' + parts.join('/')) :
            (parts.length === 0 ? '.' : parts.join('/'));

        if (isLocal) { state.currentLocalPath = newPath; fetchFiles('local', newPath, false); }
        else { state.currentRemotePath = newPath; fetchFiles('remote', newPath, false); }
    }

    function toggleHiddenFiles() {
        state.showHidden = !state.showHidden;
        const hIcon = document.getElementById('hidden-icon');
        toggleHiddenBtn.classList.toggle('opacity-50', !state.showHidden);
        if (hIcon) hIcon.innerText = state.showHidden ? 'visibility' : 'visibility_off';
        refreshCurrent(true);
    }

    // --- Init Actions ---
    tabRemote.onclick = () => switchPane('remote');
    tabLocal.onclick = () => switchPane('local');
    refreshBtn.onclick = () => refreshCurrent(false, true);
    toggleHiddenBtn.onclick = () => toggleHiddenFiles();
    toggleSelectBtn.onclick = () => toggleSelectionMode();
    goUpBtn.onclick = () => goUp();
    
    discoverBtn.onclick = () => {
        if (globalThis.Components?.openGuiModal) {
            globalThis.Components.openGuiModal({
                title: 'Scan New Servers?',
                message: 'You are currently connected to a server. Starting discovery will terminate your active session. Continue?',
                icon: 'warning',
                type: 'warning',
                primaryText: 'Continue & Scan',
                secondaryText: 'Stay Connected',
                onPrimary: () => {
                    window.location.hash = '#/discover?force=true';
                }
            });
        }
    };

    if (menuBtn && globalThis.Components?.toggleMenu) {
        menuBtn.onclick = () => globalThis.Components.toggleMenu();
    }

    clearClipboardBtn.onclick = () => Clipboard.clear(() => refreshCurrent());
    
    deleteSelectedBtn.onclick = () => {
        if (state.clipboard.length === 0) return;
        const count = state.clipboard.length;
        globalThis.Components?.openGuiModal({
            title: `Delete ${count} Items?`,
            message: `Are you sure you want to delete these ${count} local items?`,
            icon: 'delete_sweep',
            type: 'danger',
            primaryText: 'Delete All',
            onPrimary: async () => {
                if (syncOverlay) syncOverlay.classList.remove('hidden');
                try {
                    for (const item of state.clipboard) {
                        await FTP_API.deleteItem(item.path, false);
                    }
                    Clipboard.clear();
                    // Automatically exit selection mode after delete
                    Clipboard.disableMode(() => refreshCurrent(false, true));
                } catch (e) { handleError(e); }
                finally { if (syncOverlay) syncOverlay.classList.add('hidden'); }
            }
        });
    };

    finishSelectionBtn.onclick = () => {
        Clipboard.disableMode(() => refreshCurrent());
    };

    pasteActionBtn.onclick = () => {
        if (state.clipboard.length === 0) return;
        
        const items = [...state.clipboard];
        const isRemoteToLocal = items[0].pane === 'remote';
        const targetPath = isRemoteToLocal ? state.currentLocalPath : state.currentRemotePath;
        
        // Show "Started" notification immediately
        if (globalThis.Components?.showToast) {
            const label = isRemoteToLocal ? 'Download' : 'Upload';
            globalThis.Components.showToast(`${label} started. Check Transfers page.`, 'info');
        }

        // Clear clipboard immediately to prevent double-pasting while browsing
        Clipboard.clear(() => refreshCurrent(true));

        // Call API without blocking the UI with an overlay
        FTP_API.transferFile(items, targetPath, isRemoteToLocal)
            .then(() => {
                if (globalThis.Components?.showToast) {
                    globalThis.Components.showToast('Transfer completed successfully', 'success');
                }
                // Refresh the target pane to show new files
                refreshCurrent(true, true);
            })
            .catch((e) => {
                handleError(e);
            });
    };


    closeOptionsBtn.onclick = closeOptionsModal;
    optModal.onclick = (e) => { if (e.target === optModal) closeOptionsModal(); };

    // --- Wails v3 Drag n Drop Mode ---
    const uploadModeBtn = document.getElementById('upload-mode-btn');
    const uploadBtnText = document.getElementById('upload-btn-text');
    let uploadMode = false;

    function toggleUploadMode() {
        uploadMode = !uploadMode;
        
        const rPane = document.getElementById('remote-pane');
        const iconBox = uploadModeBtn.querySelector('.icon-box');

        if (uploadMode) {
            uploadModeBtn.classList.remove('opacity-60', 'text-slate-300');
            uploadModeBtn.classList.add('opacity-100', 'text-white', 'bg-primary/40', 'ring-2', 'ring-primary/50');
            iconBox.classList.remove('bg-primary/20', 'text-primary');
            iconBox.classList.add('bg-white', 'text-primary');
            uploadBtnText.innerText = "Mode: Active";
            rPane.classList.add('upload-mode-waiting'); // For potential CSS border hint
            if (globalThis.Components?.showToast) globalThis.Components.showToast('Upload Mode Enabled. Drop files now!', 'info');
        } else {
            uploadModeBtn.classList.add('opacity-60', 'text-slate-300');
            uploadModeBtn.classList.remove('opacity-100', 'text-white', 'bg-primary/40', 'ring-2', 'ring-primary/50');
            iconBox.classList.add('bg-primary/20', 'text-primary');
            iconBox.classList.remove('bg-white', 'text-primary');
            uploadBtnText.innerText = "Press to Drop";
            rPane.classList.remove('upload-mode-waiting');
        }
    }

    if (uploadModeBtn) uploadModeBtn.onclick = toggleUploadMode;

    // Wails backend event: emitted by helper.go via app.Event.Emit("item-dropped", files)
    // Wails v3 spreads Go []string into event.data directly:
    //   event.data = ["path1", "path2"]          (flat – one arg per path)
    // OR wraps the whole slice as the first arg:
    //   event.data = [["path1", "path2"]]         (nested)
    // Normalise both shapes so we always end up with a plain string[].
    Events.On('item-dropped', async (event) => {
        const raw = event?.data;
        console.log('[item-dropped] raw event.data:', raw);

        let filePaths;
        if (Array.isArray(raw?.[0])) {
            // Nested: [["path1", "path2"]]
            filePaths = raw[0];
        } else if (Array.isArray(raw) && raw.length > 0) {
            // Flat: ["path1", "path2"]
            filePaths = raw;
        } else {
            console.warn('[item-dropped] unexpected payload shape, aborting', raw);
            return;
        }

        console.log('[item-dropped] resolved paths:', filePaths);
        if (filePaths.length === 0) return;

        const remotePath = state.currentRemotePath || '.';

        if (globalThis.Components?.showToast) {
            globalThis.Components.showToast(`Uploading ${filePaths.length} dropped item(s)...`, 'info');
        }

        try {
            const body = new URLSearchParams();
            body.append('remote_path', remotePath);
            for (const p of filePaths) {
                body.append('local_paths', p);
            }

            const res = await fetch('/api/ftp/client/upload', {
                method: 'POST',
                body,
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || `Upload failed (${res.status})`);
            }

            if (globalThis.Components?.showToast) {
                globalThis.Components.showToast('Upload completed successfully!', 'success');
            }
            refreshCurrent(true, true);
        } catch (e) {
            console.error('[item-dropped] upload error:', e);
            handleError(e);
        }
    });

    // Initial state setup
    optContent.classList.add('scale-95', 'opacity-0');
    
    const serverId = localStorage.getItem('current_server_id');
    const servers = JSON.parse(localStorage.getItem('ftp_servers') || '[]');
    const savedServer = servers.find(s => s.id == serverId);

    if (savedServer) {
        currentServer = savedServer;
        serverNameEl.innerText = savedServer.name;
        serverInfoEl.innerText = `${savedServer.host}:${savedServer.port}`;
    } else {
        const discName = localStorage.getItem('current_remote_name');
        const discHost = localStorage.getItem('current_remote_host');
        const discPort = localStorage.getItem('current_remote_port');

        if (discHost) {
            currentServer = {
                name: discName || "Remote Server",
                host: discHost,
                port: discPort || "21"
            };
            serverNameEl.innerText = currentServer.name;
            serverInfoEl.innerText = `${discHost}:${discPort}`;
        } else {
            console.warn('No connection info found, redirecting to discover.');
            window.location.hash = '#/discover';
            return;
        }
    }

    fetchFiles('remote', state.currentRemotePath || '.', false, true);
    fetchFiles('local', state.currentLocalPath || '.', false);

    if (globalThis.Components?.Sidebar?.highlight) {
        globalThis.Components.Sidebar.highlight('discover-servers');
    }

    // Sync UI indicators and paste bar with current state
    switchPane(state.activePane);
}
