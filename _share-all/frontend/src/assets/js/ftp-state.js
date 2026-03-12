export const state = {
    activePane: 'remote',
    currentRemotePath: '.',
    currentLocalPath: '.',
    showHidden: false,
    selectionMode: false,
    clipboard: []
};

// Centralized selectors so we don't call document.getElementById 100 times
export const ui = {
    loader: document.getElementById('sync-overlay'),
    hBtn: document.getElementById('toggle-hidden-btn'),
    sBtn: document.getElementById('toggle-select-mode'),
    pasteBar: document.getElementById('paste-bar'),
    rList: document.getElementById('remote-list'),
    lList: document.getElementById('local-list')
};