import { state, ui } from './ftp-state.js';
import { FTP_API } from './ftp-api.js';

/**
 * Clipboard and Selection Management Logic
 */
export const Clipboard = {
    toggleMode(refreshFn) {
        state.selectionMode = !state.selectionMode;
        ui.sBtn.classList.toggle('bg-primary', state.selectionMode);
        ui.sBtn.classList.toggle('text-white', state.selectionMode);
        ui.sBtn.classList.toggle('text-slate-400', !state.selectionMode);
        ui.sBtn.querySelector('span').innerText = state.selectionMode ? 'done_all' : 'rule';
        this.updateBar();
        refreshFn();
    },

    toggleSelection(item, pane, refreshFn) {
        const index = state.clipboard.findIndex(f => f.path === item.path && f.pane === pane);
        if (index > -1) {
            state.clipboard.splice(index, 1);
        } else {
            // If selecting from a different pane, clear previous selection
            if (state.clipboard.length > 0 && state.clipboard[0].pane !== pane) {
                state.clipboard.length = 0;
            }
            state.clipboard.push({ ...item, pane });
        }
        this.updateBar();
        refreshFn();
    },

    clear(refreshFn) {
        state.clipboard.length = 0;
        this.updateBar();
        if (refreshFn) refreshFn();
    },

    updateBar() {
        const hasSelection = state.clipboard.length > 0;
        const btnPaste = document.getElementById('btn-paste-action');
        const btnDelete = document.getElementById('btn-delete-selected');
        const btnFinish = document.getElementById('btn-finish-selection');
        const msg = document.getElementById('paste-message');
        const info = document.getElementById('paste-info');

        if (hasSelection) {
            ui.pasteBar.classList.remove('hidden');
            setTimeout(() => ui.pasteBar.classList.add('opacity-100', 'translate-y-0'), 10);

            const selectedPane = state.clipboard[0].pane;
            info.innerText = state.clipboard.length === 1 ? state.clipboard[0].name : `${state.clipboard.length} items`;

            if (state.selectionMode) {
                btnDelete.classList.toggle('hidden', selectedPane === 'remote');
                if (btnFinish) btnFinish.classList.remove('hidden');
                btnPaste.classList.add('hidden');
                msg.innerText = selectedPane === 'remote' ? "Remote Items Selected" : "Items Selected";
            } else {
                btnDelete.classList.add('hidden');
                if (btnFinish) btnFinish.classList.add('hidden');
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
};
