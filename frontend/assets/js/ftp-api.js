export const FTP_API = {
    async fetchFiles(type, path) {
        const api = type === 'remote' ? '/api/ftp/server/ls' : '/api/ftp/client/ls';
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

    async transferFile(item, targetPath, isDownload) {
        const params = new URLSearchParams();
        const endpoint = isDownload ? '/api/ftp/client/download' : '/api/ftp/client/upload';

        if (isDownload) {
            params.append('remote_path', item.path);
            params.append('local_path', targetPath);
        } else {
            params.append('local_path', item.path);
            params.append('remote_path', targetPath);
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