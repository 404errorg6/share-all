import { FTP_API } from '../ftp-api.js';
import { Renderer } from '../ftp-renderer.js';
import { state, ui } from '../ftp-state.js';

Components.injectSidebar('browse-remote-local');
Components.injectModal();

// Extra UI elements not in shared state
const optModal = document.getElementById('options-modal');
const optContent = document.getElementById('options-modal-content');
const paneInd = document.getElementById('pane-selection-indicator');
const bc = document.getElementById('breadcrumb-path');
const serverNameEl = document.getElementById('server-name');
const serverInfoEl = document.getElementById('server-info');
let currentServer = null;

function handleError(e) {
    let msg = e.message;
    if (msg.includes('550') && msg.includes('operation not permitted')) {
        msg = "Write not allowed here";
    }
    Components.showToast(msg, 'error');
}

// --- Pane Management ---
function switchPane(pane) {
    state.activePane = pane;

    const tRem = document.getElementById('tab-remote');
    const tLoc = document.getElementById('tab-local');
    const iRem = document.getElementById('remote-indicator');
    const iLoc = document.getElementById('local-indicator');
    const rPane = document.getElementById('remote-pane');
    const lPane = document.getElementById('local-pane');
    const paneInd = document.getElementById('pane-selection-indicator');

    if (pane === 'remote') {
        tRem.classList.remove('text-slate-400', 'text-slate-500'); tRem.classList.add('text-primary');
        tLoc.classList.remove('text-primary'); tLoc.classList.add('text-slate-400');
        iRem.classList.remove('hidden'); iLoc.classList.add('hidden');
        rPane.classList.remove('hidden'); lPane.classList.add('hidden');
        paneInd.innerText = 'Remote View';

        // Header Updates for Mobile/Tablet/Laptop (Single View)
        if (currentServer) {
            serverNameEl.innerText = currentServer.name;
            serverInfoEl.innerText = `${currentServer.host}:${currentServer.port}`;
        }

        renderBreadcrumbs(state.currentRemotePath, 'remote');
    } else {
        tLoc.classList.remove('text-slate-400', 'text-slate-500'); tLoc.classList.add('text-primary');
        tRem.classList.remove('text-primary'); tRem.classList.add('text-slate-400');
        iLoc.classList.remove('hidden'); iRem.classList.add('hidden');
        lPane.classList.remove('hidden'); rPane.classList.add('hidden');
        paneInd.innerText = 'Local View';

        // Header Updates
        serverNameEl.innerText = "Local Storage";
        serverInfoEl.innerText = "Internal Device";

        renderBreadcrumbs(state.currentLocalPath, 'local');
    }
    updatePasteBarVisibility();
}

// --- Data Fetching ---
async function fetchFiles(type, path) {
    ui.loader.classList.remove('hidden');
    try {
        const data = await FTP_API.fetchFiles(type, path);
        Renderer.renderList(type, data, path, handleAction);
        renderBreadcrumbs(path, type);
    } catch (e) {
        handleError(e);
    } finally {
        ui.loader.classList.add('hidden');
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
        toggleSelection(normalizedPath, entry.Name, entry.IsFolder, type);
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
            Preview.show(normalizedPath, entry.Name, type === 'remote');
        }
    }
}

// --- Breadcrumbs (Kept Local as not in Renderer) ---
function renderBreadcrumbs(path, type) {
    const buildInto = (container, p, t) => {
        if (!container) return;
        container.innerHTML = '';
        const isLocal = t === 'local';
        const parts = p.split('/').filter(part => part && part !== '.');

        const root = document.createElement('p');
        root.className = `text-xs font-black uppercase tracking-widest cursor-pointer hover:underline px-2 py-1 rounded transition-colors ${isLocal ? 'text-success' : 'text-primary'}`;
        root.innerText = isLocal ? "Local" : "Remote";
        root.onclick = () => {
            if (isLocal) { state.currentLocalPath = '.'; fetchFiles('local', '.'); }
            else { state.currentRemotePath = '.'; fetchFiles('remote', '.'); }
        };
        container.appendChild(root);

        let build = isLocal ? '.' : '';
        parts.forEach(part => {
            build += `/${part}`;
            const sep = document.createElement('span');
            sep.className = "text-slate-600 px-1";
            sep.innerHTML = '<span class="material-symbols-outlined text-xs">chevron_right</span>';
            container.appendChild(sep);

            const node = document.createElement('p');
            node.className = "text-xs font-bold text-slate-300 hover:text-white cursor-pointer px-2 py-1 rounded hover:bg-white/5 truncate max-w-[120px] transition-colors";
            node.innerText = part;
            const target = build;
            node.onclick = () => {
                if (isLocal) { state.currentLocalPath = target; fetchFiles('local', target); }
                else { state.currentRemotePath = target; fetchFiles('remote', target); }
            };
            container.appendChild(node);
        });
    };

    if (state.activePane === type) {
        buildInto(bc, path, type);
    }

    const specific = document.getElementById(`${type}-breadcrumbs`);
    buildInto(specific, path, type);
}

// --- Selection ---
function toggleSelectionMode() {
    state.selectionMode = !state.selectionMode;
    ui.sBtn.classList.toggle('bg-primary', state.selectionMode);
    ui.sBtn.classList.toggle('text-white', state.selectionMode);
    ui.sBtn.classList.toggle('text-slate-400', !state.selectionMode);
    ui.sBtn.querySelector('span').innerText = state.selectionMode ? 'done_all' : 'rule';
    updatePasteBarVisibility();
    refreshCurrent();
}

function toggleSelection(path, name, isFolder, pane) {
    const index = state.clipboard.findIndex(f => f.path === path && f.pane === pane);
    if (index > -1) {
        state.clipboard.splice(index, 1);
    } else {
        if (state.clipboard.length > 0 && state.clipboard[0].pane !== pane) state.clipboard.length = 0;
        state.clipboard.push({ path, name, isFolder, pane });
    }
    updatePasteBarVisibility();
    refreshCurrent();
}

function clearClipboard() {
    state.clipboard.length = 0;
    updatePasteBarVisibility();
    refreshCurrent();
}

function updatePasteBarVisibility() {
    const hasSelection = state.clipboard.length > 0;
    const btnPaste = document.getElementById('btn-paste-action');
    const btnDelete = document.getElementById('btn-delete-selected');
    const msg = document.getElementById('paste-message');
    const info = document.getElementById('paste-info');

    if (hasSelection) {
        ui.pasteBar.classList.remove('hidden');
        setTimeout(() => ui.pasteBar.classList.add('opacity-100', 'translate-y-0'), 10);

        const selectedPane = state.clipboard[0].pane;
        info.innerText = state.clipboard.length === 1 ? state.clipboard[0].name : `${state.clipboard.length} items`;

        if (state.selectionMode) {
            btnDelete.classList.remove('hidden');
            btnPaste.classList.add('hidden');
            msg.innerText = "Items Selected";
        } else {
            btnDelete.classList.add('hidden');
            if (selectedPane !== state.activePane) {
                btnPaste.classList.remove('hidden');
                msg.innerText = `Ready to ${selectedPane === 'remote' ? 'Copy' : 'Upload'}`;
            } else {
                btnPaste.classList.add('hidden');
                msg.innerText = "Items in Clipboard";
            }
        }
    } else {
        ui.pasteBar.classList.remove('opacity-100', 'translate-y-0');
        setTimeout(() => { if (state.clipboard.length === 0) ui.pasteBar.classList.add('hidden'); }, 300);
    }
}

// --- File Actions ---
function openRemoteOptions(entry, path) {
    document.getElementById('options-filename').innerText = entry.Name;
    document.getElementById('options-type').innerText = "Remote " + (entry.IsFolder ? "Folder" : "File") + " Actions";
    optModal.classList.remove('hidden');
    setTimeout(() => {
        optContent.classList.remove('scale-95', 'opacity-0');
        optContent.classList.add('scale-100', 'opacity-100');
    }, 10);

    document.getElementById('btn-preview').classList.toggle('hidden', entry.IsFolder);
    document.getElementById('btn-preview').onclick = () => { closeOptionsModal(); Preview.show(path, entry.Name, true); };
    document.getElementById('btn-copy').onclick = () => { closeOptionsModal(); toggleSelection(path, entry.Name, entry.IsFolder, 'remote'); };
    document.getElementById('btn-delete').classList.add('hidden');
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
    btnPreview.classList.toggle('hidden', entry.IsFolder);
    btnPreview.onclick = () => { closeOptionsModal(); Preview.show(path, entry.Name, false); };
    document.getElementById('btn-copy').onclick = () => { closeOptionsModal(); toggleSelection(path, entry.Name, entry.IsFolder, 'local'); };
    document.getElementById('btn-delete').classList.remove('hidden');
    document.getElementById('btn-delete').onclick = () => { closeOptionsModal(); confirmDelete(path, entry.Name, false); };
}


function closeOptionsModal() {
    optContent.classList.add('scale-95', 'opacity-0');
    optContent.classList.remove('scale-100', 'opacity-100');
    setTimeout(() => { optModal.classList.add('hidden'); }, 300);
}

function confirmDelete(path, name, isRemote) {
    Components.openGuiModal({
        title: 'Delete Item?',
        message: `Are you sure you want to delete ${name}? This action cannot be undone.`,
        icon: 'delete_forever',
        type: 'danger',
        primaryText: 'Delete',
        onPrimary: () => performDelete(path, isRemote)
    });
}

async function performDelete(path, isRemote) {
    ui.loader.classList.remove('hidden');
    try {
        await FTP_API.deleteItem(path, isRemote);
        Components.showToast('Item deleted');
        refreshCurrent();
    } catch (e) {
        handleError(e);
    } finally {
        ui.loader.classList.add('hidden');
    }
}

async function deleteSelected() {
    Components.openGuiModal({
        title: 'Delete Selected?',
        message: `Are you sure you want to delete ${state.clipboard.length} items?`,
        icon: 'delete_sweep',
        type: 'danger',
        primaryText: 'Delete All',
        onPrimary: async () => {
            ui.loader.classList.remove('hidden');
            const isRemote = state.clipboard[0].pane === 'remote';
            try {
                for (const item of state.clipboard) {
                    await FTP_API.deleteItem(item.path, isRemote);
                }
                Components.showToast('Selected items deleted');
                clearClipboard();
                refreshCurrent();
            } catch (e) {
                handleError(e);
            } finally {
                ui.loader.classList.add('hidden');
            }
        }
    });
}

async function pasteFiles() {
    if (state.clipboard.length === 0) return;
    const isRemoteToLocal = state.clipboard[0].pane === 'remote';
    ui.loader.classList.remove('hidden');

    try {
        for (const item of state.clipboard) {
            const targetPath = isRemoteToLocal ? state.currentLocalPath : state.currentRemotePath;
            await FTP_API.transferFile(item, targetPath, isRemoteToLocal);
        }
        Components.showToast('Operation complete');
        clearClipboard();

        if (isRemoteToLocal) fetchFiles('local', state.currentLocalPath);
        else fetchFiles('remote', state.currentRemotePath);

    } catch (e) {
        handleError(e);
    } finally {
        ui.loader.classList.add('hidden');
    }
}


function refreshCurrent() {
    if (state.activePane === 'remote') fetchFiles('remote', state.currentRemotePath);
    else fetchFiles('local', state.currentLocalPath);
}

function goUp(paneOverride) {
    const pane = paneOverride || state.activePane;
    let path = pane === 'remote' ? state.currentRemotePath : state.currentLocalPath;
    const parts = path.split('/').filter(p => p && p !== '.');
    parts.pop();
    const isLocal = pane === 'local';
    const newPath = isLocal ?
        (parts.length === 0 ? '.' : './' + parts.join('/')) :
        (parts.length === 0 ? '.' : parts.join('/'));

    if (isLocal) { state.currentLocalPath = newPath; fetchFiles('local', newPath); }
    else { state.currentRemotePath = newPath; fetchFiles('remote', newPath); }
}

function toggleHiddenFiles() {
    state.showHidden = !state.showHidden;
    ui.hBtn.classList.toggle('opacity-50', !state.showHidden);
    ui.hBtn.querySelector('span').innerText = state.showHidden ? 'visibility' : 'visibility_off';
    refreshCurrent();
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    const serverId = localStorage.getItem('current_server_id');
    const servers = JSON.parse(localStorage.getItem('ftp_servers') || '[]');
    const server = servers.find(s => s.id == serverId);

    if (server) {
        currentServer = server; // Store for switching
        document.getElementById('server-name').innerText = server.name;
        document.getElementById('server-info').innerText = `${server.host}:${server.port}`;
        fetchFiles('remote', '.');
        fetchFiles('local', '.');
    } else {
        window.location.href = 'remote-connections.html';
    }
});

// --- Exports ---
window.switchPane = switchPane;
window.refreshCurrent = refreshCurrent;
window.toggleHiddenFiles = toggleHiddenFiles;
window.toggleSelectionMode = toggleSelectionMode;
window.goUp = goUp;
window.closeOptionsModal = closeOptionsModal;
window.clearClipboard = clearClipboard;
window.deleteSelected = deleteSelected;
window.pasteFiles = pasteFiles;
