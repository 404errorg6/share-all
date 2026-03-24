/**
 * Mini Server Share Page Logic
 */

// We wait for DOM and Components to be ready
async function init() {
    // Wait for the global Components namespace to be fully populated (Sidebar, Preview, etc.)
    if (globalThis.Components && globalThis.Components.ready) {
        await globalThis.Components.ready;
    }

    const listContainer = document.getElementById('file-list-container');
    const emptyState = document.getElementById('empty-state');
    const breadcrumbEl = document.getElementById('breadcrumb-path');
    const upDirBtn = document.getElementById('up-dir-btn');
    const loader = document.getElementById('sync-overlay');
    const refreshBtn = document.getElementById('refresh-btn');
    const fileCountEl = document.getElementById('file-count');

    const optModal = document.getElementById('options-modal');
    const optContent = document.getElementById('options-modal-content');

    let currentPath = '.';

    /**
     * Load directory listing from the mini server API
     */
    async function loadDirectory(path) {
        currentPath = path;
        if (loader) loader.classList.remove('hidden');
        try {
            const response = await fetch(`/api/ls?path=${encodeURIComponent(path)}`);
            if (!response.ok) throw new Error('Failed to load path');

            const entries = await response.json();
            renderEntries(entries, path);
        } catch (err) {
            console.error('Error loading directory:', err);
            if (globalThis.Components?.showToast) {
                globalThis.Components.showToast(err.message, 'error');
            }
        } finally {
            if (loader) loader.classList.add('hidden');
        }
    }

    /**
     * Render file and folder entries
     */
    function renderEntries(entries, path) {
        if (!listContainer) return;
        listContainer.innerHTML = '';

        // Filter hidden files and sort (Folders first, then Alphabetical)
        const visible = entries.filter(e => window.Utils ? !Utils.isHiddenFile(e.Name) : !e.Name.startsWith('.'))
            .sort((a, b) => (b.IsFolder - a.IsFolder) || a.Name.localeCompare(b.Name));

        if (!visible || visible.length === 0) {
            if (emptyState) emptyState.classList.remove('hidden');
            listContainer.classList.add('hidden');
            updateBreadcrumb(path);
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');
        listContainer.classList.remove('hidden');

        visible.forEach(entry => {
            const fullPath = (path === '.' || path === '') ? entry.Name : `${path}/${entry.Name}`;
            const normalizedPath = fullPath.replace('//', '/');

            const item = document.createElement('div');
            item.className = `flex flex-col gap-3 p-5 glass-panel rounded-[1.5rem] hover:bg-white/5 cursor-pointer border border-white/5 hover:border-primary/20 transition-all hover:shadow-2xl hover:shadow-primary/5 active:scale-[0.98] group relative animate-fade-in`;

            const icon = window.Utils ? Utils.getFileIcon(entry.Name, entry.IsFolder) : (entry.IsFolder ? 'folder' : 'description');
            const color = window.Utils ? Utils.getColorClass(entry.Name, entry.IsFolder) : 'bg-white/5 text-slate-400';

            item.innerHTML = `
                <div class="flex items-center gap-4">
                    <div class="flex items-center justify-center rounded-2xl size-12 ${color.split(' ')[0]} ${color.split(' ')[1]} shadow-lg transition-all group-hover:scale-110">
                        <span class="material-symbols-outlined text-2xl">${icon}</span>
                    </div>
                    <div class="flex flex-col flex-1 overflow-hidden">
                        <p class="text-sm font-bold truncate text-white group-hover:text-primary transition-colors">${entry.Name}</p>
                        <p class="text-[10px] text-slate-500 font-black uppercase tracking-widest">${entry.IsFolder ? 'Directory' : (window.Utils ? Utils.formatFileSize(entry.Size) : entry.Size + ' bytes')}</p>
                    </div>
                    ${!entry.IsFolder ? `
                    <div class="size-9 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10 hover:text-white">
                         <span class="material-symbols-outlined text-xl">more_vert</span>
                    </div>` : ''}
                </div>
                <div class="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                    <p class="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">${window.Utils ? Utils.formatDate(entry.LastModified) : ''}</p>
                    ${entry.IsFolder ? '<span class="material-symbols-outlined text-primary text-sm animate-pulse">chevron_right</span>' : ''}
                </div>
            `;

            item.onclick = (e) => {
                if (entry.IsFolder) {
                    loadDirectory(normalizedPath);
                } else {
                    openOptions(entry, normalizedPath);
                }
            };

            listContainer.appendChild(item);
        });

        updateBreadcrumb(path);
    }

    /**
     * File Options Modal
     */
    function openOptions(entry, path) {
        const titleEl = document.getElementById('options-filename');
        const typeEl = document.getElementById('options-type');

        if (titleEl) titleEl.innerText = entry.Name;
        if (typeEl) typeEl.innerText = "Shared " + (entry.IsFolder ? "Folder" : "File") + " Access";

        if (optModal) optModal.classList.remove('hidden');
        setTimeout(() => {
            if (optContent) {
                optContent.classList.remove('scale-95', 'opacity-0');
                optContent.classList.add('scale-100', 'opacity-100');
            }
        }, 10);

        // Preview Setup
        const prevBtn = document.getElementById('btn-preview');
        if (prevBtn) {
            prevBtn.classList.toggle('hidden', entry.IsFolder);
            prevBtn.onclick = () => {
                closeOptionsModal();
                if (globalThis.Preview) {
                    showSharedPreview(path, entry.Name);
                }
            };
        }

        // Download Setup
        const dlBtn = document.getElementById('btn-download');
        if (dlBtn) {
            dlBtn.onclick = () => {
                closeOptionsModal();
                const downloadUrl = `/api/file?path=${encodeURIComponent(path)}`;
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = entry.Name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };
        }
    }

    function closeOptionsModal() {
        if (optContent) {
            optContent.classList.add('scale-95', 'opacity-0');
            optContent.classList.remove('scale-100', 'opacity-100');
        }
        setTimeout(() => { if (optModal) optModal.classList.add('hidden'); }, 300);
    }

    /**
     * Shared Preview Implementation
     */
    async function showSharedPreview(path, name) {
        const modal = document.getElementById('preview-modal');
        const container = document.getElementById('preview-container');
        const filenameLabel = document.getElementById('preview-filename');

        // We use globalThis.Components.Preview for checking formats if available, 
        // else fallback to basic logic
        const PreviewComp = globalThis.Components.Preview;

        if (!modal || !container) return;

        filenameLabel.innerText = name;
        modal.classList.remove('hidden');
        container.innerHTML = `
            <div class="flex flex-col items-center gap-4">
                <div class="animate-spin size-10 border-4 border-primary border-t-transparent rounded-full font-bold"></div>
                <p class="text-[10px] font-black uppercase tracking-widest text-primary">Deciphering Content...</p>
            </div>
        `;

        const ext = name.split('.').pop().toLowerCase();
        const url = `/api/file?path=${encodeURIComponent(path)}`;

        // Determine if supported
        const textFormats = ['txt', 'js', 'css', 'html', 'json', 'md', 'go', 'py', 'mod', 'sum', 'yml', 'yaml', 'sql', 'sh', 'bat', 'conf', 'ini', 'cfg', 'env', 'gitignore', 'dockerfile'];
        const supported = PreviewComp ? PreviewComp.isSupported(ext) : ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'webm', 'mov', 'pdf', ...textFormats].includes(ext);

        if (!supported) {
            if (PreviewComp) {
                PreviewComp.showUnsupported(name, path, false);
            } else {
                container.innerHTML = `<div class="p-8 text-center"><p class="text-slate-400">Preview not supported for .${ext}</p></div>`;
            }
            return;
        }

        try {
            const isImg = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
            const isVid = ['mp4', 'webm', 'mov', 'ogg'].includes(ext);
            const isPdf = ext === 'pdf';

            if (isImg) {
                container.innerHTML = `<img src="${url}" class="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-fade-in">`;
            } else if (isVid) {
                container.innerHTML = `<video controls autoplay class="max-w-full max-h-full rounded-lg shadow-2xl animate-fade-in"><source src="${url}"></video>`;
            } else if (isPdf) {
                container.innerHTML = `<iframe src="${url}" class="w-full h-full border-0 bg-white rounded-lg shadow-inner animate-fade-in"></iframe>`;
            } else {
                const res = await fetch(url);
                if (!res.ok) throw new Error('Failed to load text content');
                const text = await res.text();
                const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                container.innerHTML = `
                    <pre class="w-full h-full p-8 text-[11px] font-mono text-slate-300 overflow-auto whitespace-pre-wrap bg-black/40 rounded-xl selection:bg-primary/20 leading-relaxed animate-fade-in border border-white/5">${escaped}</pre>
                `;
            }
        } catch (e) {
            container.innerHTML = `<div class="p-8 text-center text-red-400 font-bold">Failed to load preview</div>`;
        }
    }

    /**
     * Update breadcrumb navigation
     */
    function updateBreadcrumb(path) {
        if (!breadcrumbEl) return;
        breadcrumbEl.innerHTML = '';
        const parts = path.split('/').filter(p => p && p !== '.');

        const rootNode = document.createElement('p');
        rootNode.className = "text-[10px] font-black uppercase tracking-[0.2em] text-primary cursor-pointer hover:bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 transition-all";
        rootNode.innerText = "Shared Root";
        rootNode.onclick = () => loadDirectory('.');
        breadcrumbEl.appendChild(rootNode);

        let build = '.';
        parts.forEach(part => {
            build += `/${part}`;
            const sep = document.createElement('span');
            sep.className = "text-slate-600 px-1";
            sep.innerHTML = '<span class="material-symbols-outlined text-xs">chevron_right</span>';
            breadcrumbEl.appendChild(sep);

            const node = document.createElement('p');
            node.className = "text-[10px] font-bold text-slate-400 hover:text-white cursor-pointer px-2 py-1.5 rounded-lg transition-all truncate max-w-[120px] uppercase tracking-widest";
            node.innerText = part;
            const target = build;
            node.onclick = () => loadDirectory(target);
            breadcrumbEl.appendChild(node);
        });
    }

    // Event Listeners
    if (refreshBtn) refreshBtn.onclick = () => loadDirectory(currentPath);

    if (upDirBtn) upDirBtn.onclick = () => {
        const parts = currentPath.split('/').filter(p => p && p !== '.');
        parts.pop();
        loadDirectory(parts.length === 0 ? '.' : parts.join('/'));
    };

    // Upload handling
    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('file-input');

    if (uploadBtn && fileInput) {
        uploadBtn.onclick = () => fileInput.click();
        fileInput.onchange = () => {
            if (fileInput.files.length === 0) return;
            handleUploadAction(fileInput.files);
            fileInput.value = ''; // Reset input
        };
    }

    async function handleUploadAction(files) {
        if (globalThis.Components?.showToast) {
            globalThis.Components.showToast(`Starting background upload of ${files.length} file(s)...`, 'info');
        }

        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);
                
                const uploadPath = (currentPath === '.' || currentPath === '') ? file.name : `${currentPath}/${file.name}`;
                formData.append('path', uploadPath);

                const response = await fetch('/api/file', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to upload ${file.name}: ${errorText}`);
                }
            }

            if (globalThis.Components?.showToast) {
                globalThis.Components.showToast(`Successfully uploaded ${files.length} file(s)`, 'success');
            }
            
            // Refresh current view if we're still in the same directory
            loadDirectory(currentPath);
        } catch (err) {
            console.error('Upload error:', err);
            if (globalThis.Components?.showToast) {
                globalThis.Components.showToast(err.message, 'error');
            }
        }
    }

    // Global closure helper
    window.closeOptionsModal = closeOptionsModal;

    // Initial Load
    loadDirectory('.');
}

// Start initialization
init();
