/**
 * Universal File Preview System - Component
 */

globalThis.Components.Preview = {
    supportedFormats: {
        image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
        video: ['mp4', 'webm', 'ogg'],
        pdf: ['pdf'],
        text: ['txt', 'log', 'js', 'html', 'css', 'json', 'py', 'go', 'java', 'md', 'xml', 'yaml', 'sql', 'sh', 'bat']
    },

    inject() {
        if (document.getElementById('preview-modal')) return;
        
        const html = `
        <div id="preview-modal"
            class="fixed inset-0 z-[110] hidden flex flex-col bg-slate-50 dark:bg-background-dark transition-all">
            <header
                class="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/5 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md">
                <div class="flex items-center gap-3 overflow-hidden">
                    <button id="close-preview-btn"
                        class="size-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-200">
                        <span class="material-symbols-outlined text-2xl">arrow_back</span>
                    </button>
                    <div class="flex flex-col overflow-hidden">
                        <p id="preview-filename" class="text-sm font-bold dark:text-white truncate"></p>
                        <p id="preview-subtitle" class="text-[10px] text-primary font-black uppercase tracking-widest">Metadata Preview</p>
                    </div>
                </div>
            </header>
            <div class="flex-1 overflow-auto bg-slate-200 dark:bg-black/40 flex items-center justify-center relative">
                <div id="preview-container" class="w-full h-full p-4 flex items-center justify-center overflow-auto"></div>
            </div>
        </div>`;
        
        document.body.insertAdjacentHTML('beforeend', html);
        
        const closeBtn = document.getElementById('close-preview-btn');
        if (closeBtn) closeBtn.onclick = () => this.close();
    },

    /**
     * Open preview modal and load content
     */
    async show(path, name, isRemote = true) {
        if (!document.getElementById('preview-modal')) {
            this.inject();
        }

        const modal = document.getElementById('preview-modal');
        const container = document.getElementById('preview-container');
        const filenameLabel = document.getElementById('preview-filename');
        const subtitleLabel = document.getElementById('preview-subtitle');

        if (!modal || !container) return;

        filenameLabel.innerText = name;
        if (subtitleLabel) subtitleLabel.innerText = isRemote ? 'Remote Preview' : 'Local Preview';
        
        modal.classList.remove('hidden');
        container.innerHTML = `
            <div class="flex flex-col items-center gap-4">
                <div class="animate-spin size-10 border-4 border-primary border-t-transparent rounded-full font-bold"></div>
                <p class="text-[10px] font-black uppercase tracking-widest text-primary">Deciphering Content...</p>
            </div>
        `;

        const ext = name.split('.').pop().toLowerCase();
        const api = isRemote ? '/api/ftp/server/get-file' : '/api/ftp/client/get-file';
        const paramName = isRemote ? 'remote_path' : 'local_path';
        const url = `${api}?${paramName}=${encodeURIComponent(path)}`;

        if (!this.isSupported(ext)) {
            this.showUnsupported(name, path, isRemote);
            return;
        }

        try {
            if (this.supportedFormats.image.includes(ext)) {
                container.innerHTML = `<img src="${url}" class="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-fade-in" onerror="globalThis.Components.Preview.showUnsupported('${name}', '${path}', ${isRemote}, true)">`;
            } else if (this.supportedFormats.video.includes(ext)) {
                container.innerHTML = `<video controls autoplay class="max-w-full max-h-full rounded-lg shadow-2xl animate-fade-in"><source src="${url}"></video>`;
            } else if (this.supportedFormats.pdf.includes(ext)) {
                container.innerHTML = `<iframe src="${url}" class="w-full h-full border-0 bg-white rounded-lg shadow-inner animate-fade-in"></iframe>`;
            } else {
                // Text/Code based preview
                const res = await fetch(url);
                if (!res.ok) throw new Error('Failed to load text content');
                const text = await res.text();
                container.innerHTML = `
                    <pre class="w-full h-full p-8 text-[11px] font-mono text-slate-300 overflow-auto whitespace-pre-wrap bg-black/40 rounded-xl selection:bg-primary/20 leading-relaxed animate-fade-in border border-white/5">${this.escapeHtml(text)}</pre>
                `;
            }
        } catch (e) {
            this.showUnsupported(name, path, isRemote, true);
        }
    },

    /**
     * Check if extension is previewable
     */
    isSupported(ext) {
        return Object.values(this.supportedFormats).flat().includes(ext);
    },

    /**
     * Show placeholder for unsupported or failed loads
     */
    showUnsupported(name, path, isRemote, error = false) {
        const container = document.getElementById('preview-container');
        container.innerHTML = `
            <div class="flex flex-col items-center gap-6 p-8 text-center max-w-xs transition-all animate-fade-in">
                <div class="size-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 shadow-inner">
                    <span class="material-symbols-outlined text-[40px]">${error ? 'error' : 'visibility_off'}</span>
                </div>
                <div class="space-y-2">
                    <h3 class="text-lg font-bold text-white">${error ? 'Load Error' : 'No Preview Available'}</h3>
                    <p class="text-xs text-slate-500 leading-relaxed font-medium">
                        ${error ? 'Failed to fetch file content.' : 'This file type is not supported for instant preview.'}<br>
                        ${isRemote ? 'Copy it to local storage to open with external apps.' : 'Open this file using your system\'s file manager.'}
                    </p>
                </div>
                ${isRemote ? `
                    <button id="preview-add-sel-btn" class="w-full h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                        <span class="material-symbols-outlined text-sm">content_copy</span>
                        Add to Selection
                    </button>
                ` : `
                    <button onclick="globalThis.Components.Preview.close()" class="w-full h-14 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-widest active:scale-95 transition-all">
                        Got it
                    </button>
                `}
            </div>
        `;

        const addSelBtn = document.getElementById('preview-add-sel-btn');
        if (addSelBtn) {
            addSelBtn.onclick = () => {
                this.close();
                // This is a bit hacky but it works since toggleSelection is usually global or available on the page
                if (window.toggleSelection) {
                    window.toggleSelection(path, name, false, 'remote');
                }
                if (window.switchPane) {
                    window.switchPane('local');
                }
            };
        }
    },

    /**
     * Close preview modal
     */
    close() {
        const modal = document.getElementById('preview-modal');
        const container = document.getElementById('preview-container');
        if (modal) modal.classList.add('hidden');
        if (container) container.innerHTML = '';
    },

    /**
     * Helper to escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Compatibility alias
globalThis.Preview = globalThis.Components.Preview;
