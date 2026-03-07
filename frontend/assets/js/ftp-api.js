export const FTP_API = {
  async fetchFiles(type, path) {
    const api = type === 'remote' ? '/api/ftp/client/remote/ls' : '/api/ftp/client/local/ls';
    const paramName = type === 'remote' ? 'remote_path' : 'local_path';
    const res = await fetch(`${api}?${paramName}=${encodeURIComponent(path)}`);
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
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
      // For now, download still handles one by one or is not requested to be changed
      // but let's make it support the first item at least to keep compatibility
      params.append('remote_path', itemsArray[0].path);
      params.append('local_path', targetPath);
    } else {
      // UPLOAD: Source is Local, Destination is Remote
      // Ensuring semantic consistency: remote_path = FTP, local_path = Local
      params.append('remote_path', targetPath);
      itemsArray.forEach(item => {
        params.append('local_paths', item.path);
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
