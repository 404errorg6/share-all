import { P2PConnection } from './p2p/session.js';

export const P2P_API = {
    async fetchFiles(type, path) {
        if (type === 'local') {
            const response = await fetch(`/api/p2p/fs/list?mode=local&path=${encodeURIComponent(path)}`);
            if (!response.ok) throw new Error(await response.text());
            return response.json();
        }

        return P2PConnection.listRemote(path);
    },

    clearCache() {
        // No-op to keep API compatibility with FTP_API
    },

    async deleteItem(path, isRemote) {
        if (isRemote) {
            throw new Error('Remote delete is not available in internet mode yet');
        }

        const params = new URLSearchParams();
        params.append('local_path', path);
        const response = await fetch('/api/ftp/client/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });
        if (!response.ok) throw new Error(await response.text());
        return true;
    },

    async transferFile(items, targetPath, isDownload) {
        const entries = Array.isArray(items) ? items : [items];

        if (isDownload) {
            for (const item of entries) {
                await P2PConnection.downloadEntry(item.path, targetPath, item.isFolder);
            }
            return true;
        }

        for (const item of entries) {
            await P2PConnection.uploadEntry(item.path, targetPath, item.isFolder);
        }
        return true;
    },

    async getPreviewUrl(path, mimeType) {
        return P2PConnection.getRemoteBlobUrl(path, mimeType);
    },
};
