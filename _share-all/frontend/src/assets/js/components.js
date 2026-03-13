/**
 * Shared UI Components - Main Registry
 * Registry for Sidebar, Modals, Toasts, Logger, and Transfers
 */

// Initialize the global Components namespace
window.Components = {
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
    const basePath = '/src/assets/js/components';

    // Import modules for side-effects (they assign into window.Components)
    return Promise.all(components.map(c => import(`${basePath}/${c}.js`).catch(err => ({ err, name: c }))))
        .then(results => {
            const failed = results.filter(r => r && r.err);
            if (failed.length) {
                console.warn('Some component modules failed to load:', failed.map(f => f.name));
            }
            // Auto-initialization after components are loaded
            if (window.Components.Logger && typeof window.Components.Logger.init === 'function') {
                window.Components.Logger.init();
            }

            if (window.Components.Transfers && typeof window.Components.Transfers.init === 'function') {
                window.Components.Transfers.init();
            }

            // Remove v-cloak once components are ready
            document.body.removeAttribute('v-cloak');
        });
}

// Expose ready promise so pages can await component initialization
window.Components.ready = loadComponentModules();

// Early lightweight aliases so UI can call these functions before modules finish loading.
// These will defer to the actual implementations once `Components.ready` resolves.
window.Components.injectSidebar = function(id) {
    if (window.Components.Sidebar && typeof window.Components.Sidebar.inject === 'function') {
        return window.Components.Sidebar.inject(id);
    }
    // Defer injection until ready
    if (window.Components.ready) {
        window.Components.ready.then(() => {
            if (window.Components.Sidebar && typeof window.Components.Sidebar.inject === 'function') {
                window.Components.Sidebar.inject(id);
            }
        }).catch(() => {});
    }
};

window.Components.toggleMenu = function(force) {
    if (window.Components.Sidebar && typeof window.Components.Sidebar.toggleMenu === 'function') {
        return window.Components.Sidebar.toggleMenu(force);
    }
    if (window.Components.ready) {
        window.Components.ready.then(() => {
            if (window.Components.Sidebar && typeof window.Components.Sidebar.toggleMenu === 'function') {
                window.Components.Sidebar.toggleMenu(force);
            }
        }).catch(() => {});
    }
};

window.Components.openGuiModal = function(opts) {
    if (window.Components.Modal && typeof window.Components.Modal.openGuiModal === 'function') {
        return window.Components.Modal.openGuiModal(opts);
    }
    if (window.Components.ready) {
        window.Components.ready.then(() => {
            if (window.Components.Modal && typeof window.Components.Modal.openGuiModal === 'function') {
                window.Components.Modal.openGuiModal(opts);
            }
        }).catch(() => {});
    }
};

window.Components.showToast = function(msg, type) {
    if (window.Components.Toast && typeof window.Components.Toast.showToast === 'function') {
        return window.Components.Toast.showToast(msg, type);
    }
    if (window.Components.ready) {
        window.Components.ready.then(() => {
            if (window.Components.Toast && typeof window.Components.Toast.showToast === 'function') {
                window.Components.Toast.showToast(msg, type);
            }
        }).catch(() => {});
    }
};
