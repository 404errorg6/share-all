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
    Transfers: {}
};

// Dynamic loader for component modules
(function () {
    const scripts = ['sidebar.js', 'modal.js', 'toast.js', 'logger.js', 'transfers.js'];
    const currentScript = document.querySelector('script[src*="components.js"]');
    if (!currentScript) return;

    const basePath = currentScript.src.replace('components.js', 'components/');
    scripts.forEach(file => {
        document.write(`<script src="${basePath}${file}"></script>`);
    });
})();

// Auto-initialization
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize components that have an init method
    if (Components.Logger && typeof Components.Logger.init === 'function') {
        Components.Logger.init();
    }

    if (Components.Transfers && typeof Components.Transfers.init === 'function') {
        Components.Transfers.init();
    }

    // Remove v-cloak once components are ready
    setTimeout(() => {
        document.body.removeAttribute('v-cloak');
    }, 150); // Small buffer for initial layout/renders
});
