/**
 * Mini Server Share Page Logic
 * Simplified clone of browse-local.js
 */

const listContainer = document.getElementById('file-list-container');
const emptyState = document.getElementById('empty-state');
const breadcrumbEl = document.getElementById('breadcrumb-path');
const upDirBtn = document.getElementById('up-dir-btn');
const loader = document.getElementById('sync-overlay');
const refreshBtn = document.getElementById('refresh-btn');
const hBtn = document.getElementById('toggle-hidden-btn');
const fileCountEl = document.getElementById('file-count');

const optModal = document.getElementById('options-modal');
const optContent = document.getElementById('options-modal-content');

let currentPath = '.';
let showHiddenFiles = false;

/**
 * Load directory listing from the mini server API
 */
async function loadDirectory(path) {
    currentPath = path;
    loader.classList.remove('hidden');
    try {
        const response = await fetch(`/api/ls?path=${encodeURIComponent(path)}`);
        if (!response.ok) throw new Error('Failed to load path');

        const entries = await response.json();
        renderEntries(entries, path);
    } catch (err) {
        console.error('Error loading directory:', err);
        if (window.Components && Components.showToast) {
            Components.showToast(err.message, 'error');
        } else {
            alert('Error: ' + err.message);
        }
    } finally {
        loader.classList.add('hidden');
    }
}

/**
 * Render file and folder entries
 */
function renderEntries(entries, path) {
    listContainer.innerHTML = '';

    const visible = entries.filter(e => showHiddenFiles || (window.Utils ? !Utils.isHiddenFile(e.Name) : !e.Name.startsWith('.')))
        .sort((a, b) => (b.IsFolder - a.IsFolder) || a.Name.localeCompare(b.Name));

    if (!visible || visible.length === 0) {
        emptyState.classList.remove('hidden');
        listContainer.classList.add('hidden');
        fileCountEl.innerText = '0 items';
        updateBreadcrumb(path);
        return;
    }

    emptyState.classList.add('hidden');
    listContainer.classList.remove('hidden');

    visible.forEach(entry => {
        const fullPath = (path === '.' || path === '') ? entry.Name : `${path}/${entry.Name}`;
        const normalizedPath = fullPath.replace('//', '/');

        const item = document.createElement('div');
        item.className = `flex flex-col gap-3 p-4 bg-white dark:bg-slate-800/40 rounded-2xl hover:bg-primary/5 dark:hover:bg-primary/10 cursor-pointer border border-slate-100 dark:border-white/5 shadow-sm transition-all hover:shadow-md active:scale-[0.98] group relative`;

        const icon = window.Utils ? Utils.getFileIcon(entry.Name, entry.IsFolder) : (entry.IsFolder ? 'folder' : 'description');
        const color = window.Utils ? Utils.getColorClass(entry.Name, entry.IsFolder) : 'text-slate-500';

        item.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="flex items-center justify-center rounded-xl size-12 ${color} shadow-sm group-hover:scale-110 transition-transform">
                    <span class="material-symbols-outlined text-2xl">${icon}</span>
                </div>
                <div class="flex flex-col flex-1 overflow-hidden">
                    <p class="text-sm font-bold truncate text-slate-900 dark:text-gray-100">${entry.Name}</p>
                    <p class="text-[10px] text-slate-500 font-medium uppercase">${entry.IsFolder ? 'Folder' : (window.Utils ? Utils.formatFileSize(entry.Size) : entry.Size + ' bytes')}</p>
                </div>
                ${!entry.IsFolder ? `
                <div class="size-8 flex items-center justify-center rounded-full bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                     <span class="material-symbols-outlined text-xl">more_vert</span>
                </div>` : ''}
            </div>
            <div class="mt-auto pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                <p class="text-[9px] text-slate-400 font-bold uppercase tracking-wider">${window.Utils ? Utils.formatDate(entry.LastModified) : ''}</p>
                ${entry.IsFolder ? '<span class="material-symbols-outlined text-primary text-sm">chevron_right</span>' : ''}
            </div>
        `;

        item.onclick = () => {
            if (entry.IsFolder) {
                loadDirectory(normalizedPath);
            } else {
                openOptions(entry, normalizedPath);
            }
        };

        listContainer.appendChild(item);
    });

    fileCountEl.innerText = `${visible.length} items`;
    updateBreadcrumb(path);
}

/**
 * File Options
 */
function openOptions(entry, path) {
    document.getElementById('options-filename').innerText = entry.Name;
    document.getElementById('options-type').innerText = "Shared " + (entry.IsFolder ? "Folder" : "File") + " Actions";
    optModal.classList.remove('hidden');
    setTimeout(() => {
        optContent.classList.remove('scale-95', 'opacity-0');
        optContent.classList.add('scale-100', 'opacity-100');
    }, 10);

    // Preview
    document.getElementById('btn-preview').classList.toggle('hidden', entry.IsFolder);
    document.getElementById('btn-preview').onclick = () => {
        closeOptionsModal();
        if (window.Preview) {
            // shareFS might have a different API endpoint or prefix
            // In start_web_ui.go, we have /api/ls and /file?path=...
            // the preview system defaults to /api/ftp/client/get-file for local
            // we need to override the URL logic or use a custom caller.
            // Let's monkey-patch or just call Preview.show with a custom logic if needed.
            // Actually, Preview.show constructs URL: `${api}?${paramName}=${encodeURIComponent(path)}`
            // and we want /file?path=...
            // So we can temporarily override the preview constants or build a custom previewer.
            // Let's use a simpler approach: if it's the share page, we use /file
            Preview.showShared(path, entry.Name);
        }
    };

    // Download
    document.getElementById('btn-download').onclick = () => {
        closeOptionsModal();
        const downloadUrl = `/file?path=${encodeURIComponent(path)}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = entry.Name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
}

function closeOptionsModal() {
    optContent.classList.add('scale-95', 'opacity-0');
    optContent.classList.remove('scale-100', 'opacity-100');
    setTimeout(() => { optModal.classList.add('hidden'); }, 300);
}

// Extend Preview system for shared files
if (window.Preview) {
    Preview.showShared = async function (path, name) {
        const modal = document.getElementById('preview-modal');
        const container = document.getElementById('preview-container');
        const filenameLabel = document.getElementById('preview-filename');

        if (!modal || !container) return;

        filenameLabel.innerText = name;
        modal.classList.remove('hidden');
        container.innerHTML = `
            <div class="flex flex-col items-center gap-4">
                <div class="animate-spin size-10 border-4 border-primary border-t-transparent rounded-full font-bold"></div>
                <p class="text-[10px] font-black uppercase tracking-widest text-primary">Loading Preview...</p>
            </div>
        `;

        const ext = name.split('.').pop().toLowerCase();
        const url = `/file?path=${encodeURIComponent(path)}`;

        if (!this.isSupported(ext)) {
            this.showUnsupported(name, path, false);
            return;
        }

        try {
            if (this.supportedFormats.image.includes(ext)) {
                container.innerHTML = `<img src="${url}" class="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-fade-in">`;
            } else if (this.supportedFormats.video.includes(ext)) {
                container.innerHTML = `<video controls autoplay class="max-w-full max-h-full rounded-lg shadow-2xl animate-fade-in"><source src="${url}"></video>`;
            } else if (this.supportedFormats.pdf.includes(ext)) {
                container.innerHTML = `<iframe src="${url}" class="w-full h-full border-0 bg-white rounded-lg shadow-inner animate-fade-in"></iframe>`;
            } else {
                const res = await fetch(url);
                if (!res.ok) throw new Error('Failed to load text content');
                const text = await res.text();
                container.innerHTML = `
                    <pre class="w-full h-full p-6 text-[11px] font-mono text-slate-300 overflow-auto whitespace-pre-wrap bg-black/30 rounded-lg selection:bg-primary/20 leading-relaxed animate-fade-in">${this.escapeHtml(text)}</pre>
                `;
            }
        } catch (e) {
            this.showUnsupported(name, path, false, true);
        }
    };
}

/**
 * Update breadcrumb navigation
 */
function updateBreadcrumb(path) {
    breadcrumbEl.innerHTML = '';
    const parts = path.split('/').filter(p => p && p !== '.');

    const rootNode = document.createElement('p');
    rootNode.className = "text-xs font-black uppercase tracking-widest text-primary cursor-pointer hover:bg-primary/10 px-2 py-1 rounded transition-colors";
    rootNode.innerText = "Root";
    rootNode.onclick = () => loadDirectory('.');
    breadcrumbEl.appendChild(rootNode);

    let build = '.';
    parts.forEach(part => {
        build += `/${part}`;
        const sep = document.createElement('span');
        sep.className = "text-slate-400 px-1";
        sep.innerHTML = '<span class="material-symbols-outlined text-xs">chevron_right</span>';
        breadcrumbEl.appendChild(sep);

        const node = document.createElement('p');
        node.className = "text-xs font-bold text-slate-500 dark:text-slate-300 hover:text-primary cursor-pointer px-2 py-1 rounded transition-colors truncate max-w-[100px]";
        node.innerText = part;
        const target = build;
        node.onclick = () => loadDirectory(target);
        breadcrumbEl.appendChild(node);
    });
}

// Event Listeners
refreshBtn.onclick = () => loadDirectory(currentPath);

upDirBtn.onclick = () => {
    const parts = currentPath.split('/').filter(p => p && p !== '.');
    parts.pop();
    loadDirectory(parts.length === 0 ? '.' : parts.join('/'));
};

hBtn.onclick = () => {
    showHiddenFiles = !showHiddenFiles;
    hBtn.classList.toggle('opacity-50', !showHiddenFiles);
    hBtn.querySelector('span').innerText = showHiddenFiles ? 'visibility' : 'visibility_off';
    loadDirectory(currentPath);
};

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    loadDirectory('.');
});

window.closeOptionsModal = closeOptionsModal;
