import { FTP_API } from '../ftp-api.js';
import { Renderer } from '../ftp-renderer.js';
import { state, ui } from '../ftp-state.js';
import { Clipboard } from '../ftp-clipboard.js';

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
        renderActiveBreadcrumbs(path, type);
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

// --- Breadcrumbs Re-integration ---
function renderActiveBreadcrumbs(path, type) {
    const onClick = (targetPath) => {
        if (type === 'local') { state.currentLocalPath = targetPath; fetchFiles('local', targetPath); }
        else { state.currentRemotePath = targetPath; fetchFiles('remote', targetPath); }
    };

    if (state.activePane === type) {
        Renderer.renderBreadcrumbs(bc, path, type, onClick);
    }

    const specific = document.getElementById(`${type}-breadcrumbs`);
    Renderer.renderBreadcrumbs(specific, path, type, onClick);
}

// --- Selection & Clipboard Wrappers ---
function toggleSelectionMode() {
    Clipboard.toggleMode(refreshCurrent);
}

function toggleSelection(path, name, isFolder, pane) {
    Clipboard.toggleSelection({ path, name, isFolder }, pane, refreshCurrent);
}

function clearClipboard() {
    Clipboard.clear(refreshCurrent);
}

const updatePasteBarVisibility = () => Clipboard.updateBar();

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
    btnPreview.onclick = () => { closeOptionsModal(); Preview.show(path, entry.Name, true); };

    btnCopy.classList.remove('hidden');
    btnCopy.onclick = () => { closeOptionsModal(); toggleSelection(path, entry.Name, entry.IsFolder, 'remote'); };

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
    btnPreview.onclick = () => { closeOptionsModal(); Preview.show(path, entry.Name, false); };

    btnCopy.classList.remove('hidden');
    btnCopy.onclick = () => { closeOptionsModal(); toggleSelection(path, entry.Name, entry.IsFolder, 'local'); };

    btnDelete.classList.remove('hidden');
    btnDelete.onclick = () => { closeOptionsModal(); confirmDelete(path, entry.Name, false); };
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
    const isRemoteToLocal = state.clipboard[0].pane === 'remote'; // True = Download, False = Upload
    ui.loader.classList.remove('hidden');

    try {
        if (isRemoteToLocal) {
            // DOWNLOAD: Async (Fire and forget from UI perspective)
            // The backend handles progress via /api/ftp/transfers
            for (const item of state.clipboard) {
                const targetPath = state.currentLocalPath;
                // Don't await the full transfer, just the initiation request
                FTP_API.transferFile(item, targetPath, true).catch(handleError);
            }

            // Give a moment for requests to fire
            await new Promise(r => setTimeout(r, 500));

            Components.showToast('Downloads started. Check Transfers page.');
            clearClipboard();
            // We don't refresh local immediately because files are still downloading

        } else {
            // UPLOAD: Async
            for (const item of state.clipboard) {
                const targetPath = state.currentRemotePath;
                FTP_API.transferFile(item, targetPath, false).catch(handleError);
            }

            // Give a moment for requests to fire
            await new Promise(r => setTimeout(r, 500));

            Components.showToast('Uploads started. Check Transfers page.');
            clearClipboard();
            // We don't refresh remote immediately because files are still uploading
        }

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

function finishSelection() {
    toggleSelectionMode();
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    // Initialize modal content with correct starting classes
    optContent.classList.add('scale-95', 'opacity-0');

    // Close modal when clicking outside
    optModal.addEventListener('click', (e) => {
        if (e.target === optModal) {
            closeOptionsModal();
        }
    });

    const serverId = localStorage.getItem('current_server_id');
    const servers = JSON.parse(localStorage.getItem('ftp_servers') || '[]');
    const savedServer = servers.find(s => s.id == serverId);

    console.log('BrowseRemoteLocal: Init. serverId:', serverId, 'savedServer found:', !!savedServer);

    if (savedServer) {
        currentServer = savedServer;
        document.getElementById('server-name').innerText = savedServer.name;
        document.getElementById('server-info').innerText = `${savedServer.host}:${savedServer.port}`;
    } else {
        const discName = localStorage.getItem('current_remote_name');
        const discHost = localStorage.getItem('current_remote_host');
        const discPort = localStorage.getItem('current_remote_port');

        console.log('BrowseRemoteLocal: Checking discovered info. discHost:', discHost);

        if (discHost) {
            currentServer = {
                name: discName || "Remote Server",
                host: discHost,
                port: discPort || "21"
            };
            document.getElementById('server-name').innerText = currentServer.name;
            document.getElementById('server-info').innerText = `${discHost}:${discPort}`;
        } else {
            console.warn('BrowseRemoteLocal: No connection info found, redirecting back.');
            window.location.href = 'discover-servers.html';
            return;
        }
    }
    fetchFiles('remote', '.');
    fetchFiles('local', '.');
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
window.finishSelection = finishSelection;
