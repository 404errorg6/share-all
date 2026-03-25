/**
 * Simple SPA Router
 */

const routes = {
    '/': {
        name: 'browse-local',
        path: 'browse-local'
    },
    '/hosting': {
        name: 'hosting-panel',
        path: 'hosting-panel'
    },
    '/discover': {
        name: 'discover-servers',
        path: 'remote-connections'
    },
    '/transfers': {
        name: 'transfers',
        path: 'transfers'
    },
    '/access': {
        name: 'hosting-access',
        path: 'hosting-access'
    },
    '/browse-remote-local': {
        name: 'browse-remote-local',
        path: 'browse-remote-local'
    },
    '/discover-local': {
        name: 'browse-local',
        path: 'browse-local'
    }
};

const appContent = document.getElementById('app-content');

let currentCleanup = null;

async function handleRoute() {
    if (currentCleanup && typeof currentCleanup === 'function') {
        currentCleanup();
        currentCleanup = null;
    }
    
    let hash = window.location.hash || '#/';
    let routePath = hash.substring(1); // Remove #
    
    // Normalize path to always start with /
    if (!routePath.startsWith('/')) routePath = '/' + routePath;
    
    // Ignore query params for route matching
    const baseRoutePath = routePath.split('?')[0];
    const route = routes[baseRoutePath] || routes['/'];
    
    try {
        // Dynamic import of the page module
        const module = await import(`./pages/${route.path}.js`);
        
        // Inject template
        if (module.template) {
            appContent.innerHTML = module.template;
        } else {
            // Fallback for files not yet fully migrated to export template
            console.warn(`No template found for route: ${routePath}`);
            appContent.innerHTML = `<div class="p-10 text-center text-slate-500">Page ${route.name} is still being migrated...</div>`;
        }

        // Initialize page logic
        if (typeof module.init === 'function') {
            currentCleanup = module.init();
        }

        // Update sidebar highlight
        if (globalThis.Components && globalThis.Components.Sidebar && typeof globalThis.Components.Sidebar.highlight === 'function') {
            globalThis.Components.Sidebar.highlight(route.name);
        }

    } catch (err) {
        console.error('Failed to load route:', routePath, err);
        appContent.innerHTML = `<div class="p-10 text-red-500">Error loading page: ${err.message}</div>`;
    }
}

// Listen for hash changes
window.addEventListener('hashchange', handleRoute);

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    // Ensure appContent exists
    if (!document.getElementById('app-content')) {
        console.error('Core element #app-content not found');
        return;
    }
    handleRoute();
});

export const Router = {
    navigate: (path) => {
        window.location.hash = path.startsWith('#') ? path : `#${path}`;
    }
};
