import { state } from './ftp-state.js';

export const Renderer = {
    renderList(type, entries, path, onAction) {
        const container = type === 'remote' ? document.getElementById('remote-list') : document.getElementById('local-list');
        const empty = document.getElementById(`${type}-empty`);
        container.innerHTML = '';

        const visible = entries
            .filter(e => state.showHidden || !Utils.isHiddenFile(e.Name))
            .sort((a, b) => (b.IsFolder - a.IsFolder) || a.Name.localeCompare(b.Name));

        if (visible.length === 0) {
            empty.classList.remove('hidden');
            return;
        }
        empty.classList.add('hidden');

        visible.forEach(entry => {
            const fullPath = (path === '/' || path === '.') ? `${path === '/' ? '.' : path}/${entry.Name}` : `${path}/${entry.Name}`;
            const normalizedPath = fullPath.replace('//', '/');
            const isSelected = state.clipboard.some(f => f.path === normalizedPath && f.pane === type);

            const item = document.createElement('div');
            item.className = `flex items-center gap-4 px-4 py-3 hover:bg-white/5 cursor-pointer border-b border-white/5 group transition-colors ${isSelected ? 'bg-primary/10 ring-1 ring-inset ring-primary/30 shadow-sm' : ''}`;

            const icon = Utils.getFileIcon(entry.Name, entry.IsFolder);
            const color = Utils.getColorClass(entry.Name, entry.IsFolder);

            item.innerHTML = `
                <div class="size-11 rounded-xl flex items-center justify-center ${color} shadow-sm relative shrink-0">
                    <span class="material-symbols-outlined">${isSelected ? 'check_circle' : icon}</span>
                </div>
                <div class="flex flex-col flex-1 overflow-hidden">
                    <span class="text-sm font-bold truncate ${isSelected ? 'text-primary' : 'text-white'}">${entry.Name}</span>
                    <span class="text-[10px] text-slate-500 font-medium uppercase">${entry.IsFolder ? 'Folder' : Utils.formatFileSize(entry.Size)} • ${Utils.formatDate(entry.LastModified)}</span>
                </div>
                <div class="flex items-center gap-2">
                    <button class="options-trigger size-9 flex items-center justify-center rounded-full hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span class="material-symbols-outlined text-lg">more_vert</span>
                    </button>
                    <span class="material-symbols-outlined text-slate-600 group-hover:text-primary transition-colors text-sm">chevron_right</span>
                </div>`;

            item.onclick = (e) => onAction(e, entry, normalizedPath, type);
            container.appendChild(item);
        });

        const countEl = document.getElementById(`${type}-count`);
        if (countEl) countEl.innerText = `${visible.length} items`;
    }
};