export const state = {
    activePane: 'remote',
    currentRemotePath: '.',
    currentLocalPath: '.',
    showHidden: false,
    selectionMode: false,
    clipboard: []
};

// Use getters so elements are looked up only when needed (after router injection)
export const ui = {
    get loader() { return document.getElementById('sync-overlay'); },
    get hBtn() { return document.getElementById('toggle-hidden-btn'); },
    get sBtn() { return document.getElementById('toggle-select-mode'); },
    get pasteBar() { return document.getElementById('paste-bar'); },
    get rList() { return document.getElementById('remote-list'); },
    get lList() { return document.getElementById('local-list'); }
};