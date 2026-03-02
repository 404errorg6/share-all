/**
 * Local Browser Page Logic
 */

const listContainer = document.getElementById('file-list-container');
const emptyState = document.getElementById('empty-state');
const fileCountEl = document.getElementById('file-count');
const breadcrumbEl = document.getElementById('breadcrumb-path');
const upDirBtn = document.getElementById('up-dir-btn');
const loader = document.getElementById('sync-overlay');
const hBtn = document.getElementById('toggle-hidden-btn');
const sBtn = document.getElementById('toggle-select-mode');

const optModal = document.getElementById('options-modal');
const optContent = document.getElementById('options-modal-content');
const prevModal = document.getElementById('preview-modal');
const prevContainer = document.getElementById('preview-container');
const selectionBar = document.getElementById('selection-bar');

let currentPath = '.';
let showHiddenFiles = false;
let selectionMode = false;
let selection = []; // Array of { path, name, isFolder }

async function loadDirectory(path) {
  currentPath = path;
  loader.classList.remove('hidden');
  try {
    const response = await fetch(`/api/ftp/client/local/ls?local_path=${encodeURIComponent(path)}`);
    if (!response.ok) throw new Error('Failed to load path');
    const entries = await response.json();
    renderEntries(entries, path);
  } catch (err) {
    Components.showToast(err.message, 'error');
  } finally {
    loader.classList.add('hidden');
  }
}

function renderEntries(entries, path) {
  listContainer.innerHTML = '';
  listContainer.classList.remove('hidden');
  emptyState.classList.add('hidden');

  const visible = entries.filter(e => showHiddenFiles || !Utils.isHiddenFile(e.Name))
    .sort((a, b) => (b.IsFolder - a.IsFolder) || a.Name.localeCompare(b.Name));

  visible.forEach(entry => {
    const fullPath = (path === '.' || path === '') ? entry.Name : `${path}/${entry.Name}`;
    const normalizedPath = fullPath.replace('//', '/');
    const isSelected = selection.some(s => s.path === normalizedPath);

    const item = document.createElement('div');
    item.className = `flex flex-col gap-3 p-4 bg-white dark:bg-slate-800/40 rounded-2xl hover:bg-primary/5 dark:hover:bg-primary/10 cursor-pointer border border-slate-100 dark:border-white/5 shadow-sm transition-all hover:shadow-md active:scale-[0.98] group relative ${isSelected ? 'ring-2 ring-primary border-primary bg-primary/5' : ''}`;
    const icon = Utils.getFileIcon(entry.Name, entry.IsFolder);
    const color = Utils.getColorClass(entry.Name, entry.IsFolder);

    item.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="flex items-center justify-center rounded-xl size-12 ${color} shadow-sm group-hover:scale-110 transition-transform">
                    <span class="material-symbols-outlined text-2xl">${isSelected ? 'check_circle' : icon}</span>
                </div>
                <div class="flex flex-col flex-1 overflow-hidden">
                    <p class="text-sm font-bold truncate ${isSelected ? 'text-primary' : 'text-slate-900 dark:text-gray-100'}">${entry.Name}</p>
                    <p class="text-[10px] text-slate-500 font-medium uppercase">${entry.IsFolder ? 'Folder' : Utils.formatFileSize(entry.Size)}</p>
                </div>
                <button class="size-8 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                     <span class="material-symbols-outlined text-xl">more_vert</span>
                </button>
            </div>
            <div class="mt-auto pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                <p class="text-[9px] text-slate-400 font-bold uppercase tracking-wider">${Utils.formatDate(entry.LastModified)}</p>
                ${entry.IsFolder ? '<span class="material-symbols-outlined text-primary text-sm">folder_open</span>' : ''}
            </div>
        `;

    // Re-wire click to handle the inner button vs card click
    item.onclick = (e) => {
      const btn = e.target.closest('button');
      if (btn) {
        openOptions(entry, normalizedPath);
        return;
      }
      if (selectionMode) {
        toggleSelection(normalizedPath, entry.Name, entry.IsFolder);
      } else {
        if (entry.IsFolder) loadDirectory(normalizedPath);
        else Preview.show(normalizedPath, entry.Name, false);
      }
    };

    item.oncontextmenu = (e) => {
      e.preventDefault();
      openOptions(entry, normalizedPath);
    };

    listContainer.appendChild(item);
  });
  fileCountEl.innerText = `${visible.length} items`;
  updateBreadcrumb(path);
}

function updateBreadcrumb(path) {
  breadcrumbEl.innerHTML = '';
  const parts = path.split('/').filter(p => p && p !== '.');

  const rootNode = document.createElement('p');
  rootNode.className = "text-xs font-black uppercase tracking-widest text-primary cursor-pointer hover:bg-primary/10 px-2 py-1 rounded transition-colors";
  rootNode.innerText = "Local";
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

/**
 * Selection Logic
 */
function toggleSelectionMode() {
  selectionMode = !selectionMode;
  sBtn.classList.toggle('bg-primary', selectionMode);
  sBtn.classList.toggle('text-white', selectionMode);
  sBtn.classList.toggle('text-slate-400', !selectionMode);
  sBtn.querySelector('span').innerText = selectionMode ? 'done_all' : 'rule';
  updateSelectionBar();
  loadDirectory(currentPath);
}

function toggleSelection(path, name, isFolder) {
  const index = selection.findIndex(s => s.path === path);
  if (index > -1) selection.splice(index, 1);
  else selection.push({ path, name, isFolder });
  updateSelectionBar();
  loadDirectory(currentPath);
}

function clearSelection() {
  selection = [];
  updateSelectionBar();
  loadDirectory(currentPath);
}

function updateSelectionBar() {
  const hasSelection = selection.length > 0;
  if (hasSelection && selectionMode) {
    document.getElementById('selection-info').innerText = selection.length === 1 ? selection[0].name : `${selection.length} items`;
    selectionBar.classList.remove('hidden');
    setTimeout(() => selectionBar.classList.add('opacity-100', 'translate-y-0'), 10);
  } else {
    selectionBar.classList.remove('opacity-100', 'translate-y-0');
    setTimeout(() => { if (selection.length === 0 || !selectionMode) selectionBar.classList.add('hidden'); }, 300);
  }
}

/**
 * File Options
 */
function openOptions(entry, path) {
  document.getElementById('options-filename').innerText = entry.Name;
  document.getElementById('options-type').innerText = "Local " + (entry.IsFolder ? "Folder" : "File") + " Actions";
  optModal.classList.remove('hidden');
  setTimeout(() => {
    optContent.classList.remove('scale-95', 'opacity-0');
    optContent.classList.add('scale-100', 'opacity-100');
  }, 10);

  document.getElementById('btn-preview').classList.toggle('hidden', entry.IsFolder);
  document.getElementById('btn-preview').onclick = () => { closeOptionsModal(); Preview.show(path, entry.Name, false); };
  document.getElementById('btn-delete').onclick = () => { closeOptionsModal(); confirmDelete(path, entry.Name); };
}

function closeOptionsModal() {
  optContent.classList.add('scale-95', 'opacity-0');
  optContent.classList.remove('scale-100', 'opacity-100');
  setTimeout(() => { optModal.classList.add('hidden'); }, 300);
}

/**
 * Delete Logic
 */
function confirmDelete(path, name) {
  Components.openGuiModal({
    title: 'Delete Local Item?',
    message: `Are you sure you want to delete ${name}? This action is permanent.`,
    icon: 'delete_forever',
    type: 'danger',
    primaryText: 'Delete',
    onPrimary: () => performDelete(path)
  });
}

async function performDelete(path) {
  loader.classList.remove('hidden');
  try {
    const params = new URLSearchParams();
    params.append('local_path', path);
    const res = await fetch('/api/ftp/client/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    if (!res.ok) throw new Error(await res.text());
    Components.showToast('Item deleted');
    loadDirectory(currentPath);
  } catch (e) {
    Components.showToast(e.message, 'error');
  } finally {
    loader.classList.add('hidden');
  }
}

async function deleteSelected() {
  Components.openGuiModal({
    title: 'Delete Selected?',
    message: `Are you sure you want to delete ${selection.length} local items?`,
    icon: 'delete_sweep',
    type: 'danger',
    primaryText: 'Delete All',
    onPrimary: async () => {
      loader.classList.remove('hidden');
      try {
        for (const item of selection) {
          const params = new URLSearchParams();
          params.append('local_path', item.path);
          await fetch('/api/ftp/client/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
          });
        }
        Components.showToast('Selected items deleted');
        clearSelection();
        loadDirectory(currentPath);
      } catch (e) {
        Components.showToast(e.message, 'error');
      } finally {
        loader.classList.add('hidden');
      }
    }
  });
}

// Global Events
document.getElementById('browse-btn').onclick = () => loadDirectory('.');
document.getElementById('refresh-btn').onclick = () => loadDirectory(currentPath);

hBtn.onclick = () => {
  showHiddenFiles = !showHiddenFiles;
  hBtn.classList.toggle('opacity-50', !showHiddenFiles);
  hBtn.querySelector('span').innerText = showHiddenFiles ? 'visibility' : 'visibility_off';
  loadDirectory(currentPath);
};

upDirBtn.onclick = () => {
  const parts = currentPath.split('/').filter(p => p && p !== '.');
  parts.pop();
  loadDirectory(parts.length === 0 ? '.' : parts.join('/'));
};

// Auto-load root on start
document.addEventListener('DOMContentLoaded', () => {
  Components.injectSidebar('browse-local');
  Components.injectModal();

  const urlParams = new URLSearchParams(window.location.search);
  const isSelectMode = urlParams.get('selectMode') === 'true';

  if (isSelectMode) {
    const selectBtn = document.getElementById('select-folder-btn');
    if (selectBtn) {
      selectBtn.classList.remove('hidden');
      selectBtn.onclick = () => {
        localStorage.setItem('selectedFolderPath', currentPath);
        window.location.href = 'hosting-panel.html';
      };
    }
  }

  loadDirectory('.');
});

// Expose globals for HTML event handlers if needed
window.toggleSelectionMode = toggleSelectionMode;
window.clearSelection = clearSelection;
window.deleteSelected = deleteSelected;
window.closeOptionsModal = closeOptionsModal;
