Components.injectSidebar('hosting-panel');
Components.injectModal();

/**
 * Copy URL to clipboard
 */
function copyUrl() {
  const url = document.getElementById('ftp-url').innerText;
  navigator.clipboard.writeText(url).then(() => {
    Components.showToast('URL copied to clipboard');
  });
}

/**
 * Handle Server Start/Stop via Status Toggle
 */
async function toggleServer(checkbox) {
  const isStarting = checkbox.checked;
  const statusText = document.getElementById('status-text');
  const urlContainer = document.getElementById('ftp-url-container');
  const urlText = document.getElementById('ftp-url');

  if (isStarting) {
    const name = document.getElementById('ftp-name').value || 'My FTP Server';
    const port = document.getElementById('ftp-port').value || '2121';
    const rootFolder = document.getElementById('ftp-root').value || '';
    const anonymous = document.getElementById('anonymous-login-toggle').checked;
    const allowWriting = document.getElementById('allow-writing-toggle').checked;

    if (!name) {
      Components.showToast('Server Name is required', 'error');
      checkbox.checked = false;
      return;
    }

    statusText.textContent = 'Starting...';

    try {
      const params = new URLSearchParams();
      params.append('name', name);
      params.append('server_port', port);
      params.append('server_root_dir', rootFolder);
      params.append('anonymous_allowed', anonymous ? 'true' : 'false');
      params.append('write_allowed', allowWriting ? 'true' : 'false');

      if (!anonymous) {
        params.append('user', document.getElementById('ftp-username').value);
        params.append('password', document.getElementById('ftp-password').value);
      }

      const response = await fetch('/api/ftp/server/start-ftp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });

      if (response.ok) {
        // Assume backend sends address as JSON string
        // Since we don't have the explicit response type yet, but status yields JSON result
        let address = '';
        try {
          address = await response.json();
        } catch (e) {
          // Fallback if it's plain text (though SendJSON is preferred)
          address = await response.text();
        }

        statusText.textContent = 'Running';
        urlText.textContent = `ftp://${address || '127.0.0.1'}/`;
        urlContainer.classList.remove('max-h-0', 'opacity-0');
        urlContainer.classList.add('max-h-[80px]', 'opacity-100');
        Components.showToast('Server started');
      } else {
        const err = await response.text();
        throw new Error(err || 'Failed to start server');
      }
    } catch (error) {
      Components.showToast(error.message, 'error');
      checkbox.checked = false;
      statusText.textContent = 'Stopped';
    }
  } else {
    statusText.textContent = 'Stopping...';
    try {
      const response = await fetch('/api/ftp/server/stop-ftp', { method: 'POST' });
      if (response.ok) {
        statusText.textContent = 'Stopped';
        urlContainer.classList.add('max-h-0', 'opacity-0');
        urlContainer.classList.remove('max-h-[80px]', 'opacity-100');
        Components.showToast('Server stopped');
      } else {
        throw new Error('Failed to stop server');
      }
    } catch (error) {
      Components.showToast(error.message, 'error');
      checkbox.checked = true;
      statusText.textContent = 'Running';
    }
  }
}

function updateToggleUI(isOn) {
  const track = document.querySelector('#status-toggle + .toggle-track');
  if (track) track.classList.toggle('toggle-on', isOn);
}

async function fetchServerStatus() {
  try {
    const response = await fetch('/api/ftp/server/status');
    if (response.ok) {
      const result = await response.json();
      const isRunning = result !== false;

      const toggle = document.getElementById('status-toggle');
      const text = document.getElementById('status-text');
      const urlText = document.getElementById('ftp-url');
      const urlContainer = document.getElementById('ftp-url-container');

      toggle.checked = isRunning;
      text.textContent = isRunning ? 'Running' : 'Stopped';

      if (isRunning) {
        urlText.textContent = `ftp://${result}/`;
        urlContainer.classList.remove('max-h-0', 'opacity-0');
        urlContainer.classList.add('max-h-[80px]', 'opacity-100');
      } else {
        urlContainer.classList.add('max-h-0', 'opacity-0');
        urlContainer.classList.remove('max-h-[80px]', 'opacity-100');
      }

      updateToggleUI(isRunning);
    }
  } catch (e) { }
}

function updateUrl() {
  const port = document.getElementById('ftp-port').value || '2121';
  const toggle = document.getElementById('status-toggle');

  // Only update if server is not running to avoid overwriting the active IP address
  if (!toggle || !toggle.checked) {
    document.getElementById('ftp-url').textContent = `ftp://127.0.0.1:${port}/`;
  }
}

/**
 * Load current server config from the backend and populate the form fields.
 */
async function fetchConfig() {
  try {
    const response = await fetch('/api/ftp/server/config');
    if (!response.ok) return;
    const cfg = await response.json();

    if (cfg.Name) {
      document.getElementById('ftp-name').value = cfg.Name;
    }
    if (cfg.Port) {
      document.getElementById('ftp-port').value = cfg.Port;
      updateUrl();
    }
    if (cfg.RootDir) {
      document.getElementById('ftp-root').value = cfg.RootDir;
    }
    if (cfg.User) {
      document.getElementById('ftp-username').value = cfg.User;
    }

    const isAnonymous = cfg.AnonymousAccessAllowed !== false;
    const anonToggle = document.getElementById('anonymous-login-toggle');
    anonToggle.checked = isAnonymous;
    toggleAnonymous(isAnonymous);

    const writeToggle = document.getElementById('allow-writing-toggle');
    writeToggle.checked = !!cfg.WriteAllowed;
    // Sync toggle track visuals
    const writeTrack = writeToggle.nextElementSibling;
    if (writeTrack && writeTrack.classList.contains('toggle-track')) {
      writeTrack.classList.toggle('toggle-on', writeToggle.checked);
    }
  } catch (e) { }
}


function toggleAnonymous(isAnonymous) {
  const authFields = document.getElementById('auth-fields');
  const uInput = document.getElementById('ftp-username');
  const pInput = document.getElementById('ftp-password');

  if (isAnonymous) {
    authFields.classList.add('max-h-0', 'opacity-0', 'pointer-events-none');
    authFields.classList.remove('max-h-[200px]', 'opacity-100');
    uInput.disabled = true;
    pInput.disabled = true;
  } else {
    authFields.classList.remove('max-h-0', 'opacity-0', 'pointer-events-none');
    authFields.classList.add('max-h-[200px]', 'opacity-100');
    uInput.disabled = false;
    pInput.disabled = false;
  }
}

/**
 * Toggle Settings Panel visibility
 */
function toggleSettings() {
  const settingsPanel = document.getElementById('settings-panel');
  const chevron = document.getElementById('settings-chevron');
  const isHidden = settingsPanel.classList.contains('max-h-0');

  if (isHidden) {
    settingsPanel.classList.remove('max-h-0', 'opacity-0');
    settingsPanel.classList.add('max-h-[1000px]', 'opacity-100');
    chevron.classList.add('rotate-90');
  } else {
    settingsPanel.classList.add('max-h-0', 'opacity-0');
    settingsPanel.classList.remove('max-h-[1000px]', 'opacity-100');
    chevron.classList.remove('rotate-90');
  }
}

/**
 * Fetch Web Share Running Status
 */
async function fetchWebShareStatus() {
  try {
    const response = await fetch('/api/http/web-share/status');
    if (response.ok) {
      const result = await response.json();
      const isRunning = result !== false;
      const toggle = document.getElementById('web-share-toggle');
      const statusText = document.getElementById('web-share-status');
      const urlContainer = document.getElementById('web-share-url-container');
      const urlText = document.getElementById('web-share-url');

      toggle.checked = isRunning;
      statusText.textContent = isRunning ? 'Sharing' : 'Disabled';

      if (isRunning) {
        urlText.textContent = `http://${result}`;
        urlContainer.classList.remove('max-h-0', 'opacity-0');
        urlContainer.classList.add('max-h-[80px]', 'opacity-100');
      } else {
        urlContainer.classList.add('max-h-0', 'opacity-0');
        urlContainer.classList.remove('max-h-[80px]', 'opacity-100');
      }

      const track = toggle.nextElementSibling;
      if (track && track.classList.contains('toggle-track')) {
        track.classList.toggle('toggle-on', isRunning);
      }
    }
  } catch (e) { }
}

document.addEventListener('DOMContentLoaded', () => {
  const selectedFolder = localStorage.getItem('selectedFolderPath');
  if (selectedFolder) {
    document.getElementById('ftp-root').value = selectedFolder;
    localStorage.removeItem('selectedFolderPath');
  }

  // Sync toggles visually
  document.querySelectorAll('.toggle-input').forEach(input => {
    const track = input.nextElementSibling;
    if (track && track.classList.contains('toggle-track')) {
      track.classList.toggle('toggle-on', input.checked);
      input.addEventListener('change', () => track.classList.toggle('toggle-on', input.checked));
    }
  });

  fetchServerStatus();
  fetchConfig();
  fetchWebShareStatus();
  updateUrl();
  // Components.Logger.init() is now handled globally
});

/**
 * Toggle Web Share (Share without app)
 */
async function toggleWebShare(checkbox) {
  const isStarting = checkbox.checked;
  const statusText = document.getElementById('web-share-status');
  const urlContainer = document.getElementById('web-share-url-container');
  const urlText = document.getElementById('web-share-url');

  if (isStarting) {
    statusText.textContent = 'Starting...';
    try {
      const response = await fetch('/api/http/web-share/start', { method: 'POST' });
      if (response.ok) {
        const address = await response.json();
        statusText.textContent = 'Sharing';
        urlText.textContent = `http://${address}`;

        // Show URL container
        urlContainer.classList.remove('max-h-0', 'opacity-0');
        urlContainer.classList.add('max-h-[80px]', 'opacity-100');

        Components.showToast('Web share started');
      } else {
        throw new Error('Failed to start web share');
      }
    } catch (error) {
      Components.showToast(error.message, 'error');
      checkbox.checked = false;
      statusText.textContent = 'Disabled';
    }
  } else {
    statusText.textContent = 'Stopping...';
    try {
      const response = await fetch('/api/http/web-share/stop', { method: 'POST' });
      if (response.ok) {
        statusText.textContent = 'Disabled';

        // Hide URL container
        urlContainer.classList.add('max-h-0', 'opacity-0');
        urlContainer.classList.remove('max-h-[80px]', 'opacity-100');

        Components.showToast('Web share stopped');
      } else {
        throw new Error('Failed to stop web share');
      }
    } catch (error) {
      Components.showToast(error.message, 'error');
      checkbox.checked = true;
      statusText.textContent = 'Sharing';
    }
  }
}

/**
 * Copy Web Share URL
 */
function copyWebUrl() {
  const url = document.getElementById('web-share-url').innerText;
  navigator.clipboard.writeText(url).then(() => {
    Components.showToast('Web URL copied');
  });
}

// Expose functions to window because buttons use onclick
window.copyUrl = copyUrl;
window.toggleServer = toggleServer;
window.updateUrl = updateUrl;
window.toggleAnonymous = toggleAnonymous;
window.fetchConfig = fetchConfig;
window.toggleWebShare = toggleWebShare;
window.copyWebUrl = copyWebUrl;
window.toggleSettings = toggleSettings;
