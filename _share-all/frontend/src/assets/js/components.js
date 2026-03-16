/**
 * Shared UI Components - Main Registry
 * Registry for Sidebar, Modals, Toasts, Logger, and Transfers
 */

// Initialize the global Components namespace
globalThis.Components = {
    // Component modules will be mounted here
    Sidebar: {},
    Modal: {},
    Toast: {},
    Logger: {},
    Transfers: {},
    // A promise that resolves when all component modules are loaded
    ready: null
};

// Dynamic loader for component modules using ES imports (module-safe)
function loadComponentModules() {
    const components = ['sidebar', 'modal', 'toast', 'logger', 'transfers'];
    // Import modules for side-effects (they assign into globalThis.Components)
    return Promise.all(components.map(c => import(`./components/${c}.js`).catch(err => ({ err, name: c }))))
        .then(results => {
            const failed = results.filter(r => r && r.err);
            if (failed.length) {
                console.warn('Some component modules failed to load:', failed.map(f => f.name));
            }
            // Auto-initialization after components are loaded
                if (globalThis.Components.Logger && typeof globalThis.Components.Logger.init === 'function') {
                    globalThis.Components.Logger.init();
                }

                if (globalThis.Components.Transfers && typeof globalThis.Components.Transfers.init === 'function') {
                    globalThis.Components.Transfers.init();
                }
        });
}

// Expose ready promise so pages can await component initialization
globalThis.Components.ready = loadComponentModules();

// Remove v-cloak immediately as router will handle loading states
document.body.removeAttribute('v-cloak');

// Early lightweight aliases so UI can call these functions before modules finish loading.
// These will defer to the actual implementations once `Components.ready` resolves.
globalThis.Components.injectSidebar = function(id) {
    if (globalThis.Components.Sidebar && typeof globalThis.Components.Sidebar.inject === 'function') {
        return globalThis.Components.Sidebar.inject(id);
    }
    // Defer injection until ready
    if (globalThis.Components.ready) {
        globalThis.Components.ready.then(() => {
            if (globalThis.Components.Sidebar && typeof globalThis.Components.Sidebar.inject === 'function') {
                globalThis.Components.Sidebar.inject(id);
            }
        }).catch(() => {});
    }
};

globalThis.Components.toggleMenu = function(force) {
    if (globalThis.Components.Sidebar && typeof globalThis.Components.Sidebar.toggleMenu === 'function') {
        return globalThis.Components.Sidebar.toggleMenu(force);
    }
    if (globalThis.Components.ready) {
        globalThis.Components.ready.then(() => {
            if (globalThis.Components.Sidebar && typeof globalThis.Components.Sidebar.toggleMenu === 'function') {
                globalThis.Components.Sidebar.toggleMenu(force);
            }
        }).catch(() => {});
    }
};

globalThis.Components.openGuiModal = function(opts) {
    if (globalThis.Components.Modal && typeof globalThis.Components.Modal.openGuiModal === 'function') {
        return globalThis.Components.Modal.openGuiModal(opts);
    }
    if (globalThis.Components.ready) {
        globalThis.Components.ready.then(() => {
            if (globalThis.Components.Modal && typeof globalThis.Components.Modal.openGuiModal === 'function') {
                globalThis.Components.Modal.openGuiModal(opts);
            }
        }).catch(() => {});
    }
};

globalThis.Components.showToast = function(msg, type) {
    if (globalThis.Components.Toast && typeof globalThis.Components.Toast.showToast === 'function') {
        return globalThis.Components.Toast.showToast(msg, type);
    }
    if (globalThis.Components.ready) {
        globalThis.Components.ready.then(() => {
            if (globalThis.Components.Toast && typeof globalThis.Components.Toast.showToast === 'function') {
                globalThis.Components.Toast.showToast(msg, type);
            }
        }).catch(() => {});
    }
};
