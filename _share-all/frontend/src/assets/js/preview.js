/**
 * Universal File Preview System
 */

const Preview = {
    supportedFormats: {
        image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
        video: ['mp4', 'webm', 'ogg'],
        pdf: ['pdf'],
        text: ['txt', 'log', 'js', 'html', 'css', 'json', 'py', 'go', 'java', 'md', 'xml', 'yaml', 'sql', 'sh', 'bat']
    },

    /**
     * Open preview modal and load content
     */
    async show(path, name, isRemote = true) {
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
        const api = isRemote ? '/api/ftp/server/get-file' : '/api/ftp/client/get-file';
        const paramName = isRemote ? 'remote_path' : 'local_path';
        const url = `${api}?${paramName}=${encodeURIComponent(path)}`;

        if (!this.isSupported(ext)) {
            this.showUnsupported(name, path, isRemote);
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
                // Text/Code based preview
                const res = await fetch(url);
                if (!res.ok) throw new Error('Failed to load text content');
                const text = await res.text();
                container.innerHTML = `
                    <pre class="w-full h-full p-6 text-[11px] font-mono text-slate-300 overflow-auto whitespace-pre-wrap bg-black/30 rounded-lg selection:bg-primary/20 leading-relaxed animate-fade-in">${this.escapeHtml(text)}</pre>
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
                    <button onclick="Preview.close(); if(typeof toggleSelection === 'function') toggleSelection('${path}', '${name}', false, 'remote'); if(typeof switchPane === 'function') switchPane('local');" class="w-full h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                        <span class="material-symbols-outlined text-sm">content_copy</span>
                        Add to Selection
                    </button>
                ` : `
                    <button onclick="Preview.close()" class="w-full h-14 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-widest active:scale-95 transition-all">
                        Got it
                    </button>
                `}
            </div>
        `;
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

window.Preview = Preview;
