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

let currentPath = '.';

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
        // Fallback or simple alert if toast is not available
        alert('Error: ' + err.message);
    } finally {
        loader.classList.add('hidden');
    }
}

/**
 * Render file and folder entries
 */
function renderEntries(entries, path) {
    listContainer.innerHTML = '';

    if (!entries || entries.length === 0) {
        emptyState.classList.remove('hidden');
        listContainer.classList.add('hidden');
        updateBreadcrumb(path);
        return;
    }

    emptyState.classList.add('hidden');
    listContainer.classList.remove('hidden');

    // Sort: Folders first, then Alphabetical
    const sorted = entries.sort((a, b) => (b.IsFolder - a.IsFolder) || a.Name.localeCompare(b.Name));

    sorted.forEach(entry => {
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
                     <span class="material-symbols-outlined text-xl">download</span>
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
                // BROWSER DOWNLOAD: Using query parameter for path
                window.location.href = `/file?path=${encodeURIComponent(normalizedPath)}`;
            }
        };

        listContainer.appendChild(item);
    });

    updateBreadcrumb(path);
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

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    loadDirectory('.');
});
