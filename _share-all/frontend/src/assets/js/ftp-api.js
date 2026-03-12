const _cache = new Map();

export const FTP_API = {
  async fetchFiles(type, path, forceRefresh = false) {
    const api = type === 'remote' ? '/api/ftp/client/remote/ls' : '/api/ftp/client/local/ls';
    const paramName = type === 'remote' ? 'remote_path' : 'local_path';
    const cacheKey = `${type}:${path}`;

    if (!forceRefresh && _cache.has(cacheKey)) {
      return _cache.get(cacheKey);
    }

    const res = await fetch(`${api}?${paramName}=${encodeURIComponent(path)}`);
    if (!res.ok) throw new Error(await res.text());

    const data = await res.json();
    _cache.set(cacheKey, data);
    return data;
  },

  clearCache() {
    _cache.clear();
  },

  async deleteItem(path, isRemote) {
    const params = new URLSearchParams();
    if (isRemote) params.append('remote_path', path);
    else params.append('local_path', path);

    const res = await fetch('/api/ftp/client/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    if (!res.ok) throw new Error(await res.text());
    return true;
  },

  async transferFile(items, targetPath, isDownload) {
    const params = new URLSearchParams();
    const endpoint = isDownload ? '/api/ftp/client/download' : '/api/ftp/client/upload';
    const itemsArray = Array.isArray(items) ? items : [items];

    if (isDownload) {
      // DOWNLOAD: Source is Remote (List), Destination is Local (Single)
      params.append('local_path', targetPath);
      itemsArray.forEach(item => {
        params.append('remote_paths', item.path);
        // Start proactive tracking for history (Files only)
        if (!item.isFolder && window.Components && Components.Transfers && Components.Transfers.startTracking) {
          Components.Transfers.startTracking({
            Name: item.name,
            IsDownload: true,
            Size: item.size
          });
        }
      });
    } else {
      // UPLOAD: Source is Local (List), Destination is Remote (Single)
      params.append('remote_path', targetPath);
      itemsArray.forEach(item => {
        params.append('local_paths', item.path);
        // Start proactive tracking for history (Files only)
        if (!item.isFolder && window.Components && Components.Transfers && Components.Transfers.startTracking) {
          Components.Transfers.startTracking({
            Name: item.name,
            IsDownload: false,
            Size: item.size
          });
        }
      });
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    if (!res.ok) throw new Error(await res.text());
    return true;
  }
};
