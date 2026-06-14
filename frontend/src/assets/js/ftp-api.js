import { P2P_API } from "./p2p-api.js";

const _cache = new Map();

function isP2PTransport() {
  return localStorage.getItem("current_remote_transport") === "webrtc";
}

export const FTP_API = {
  async fetchFiles(type, path, forceRefresh = false) {
    if (isP2PTransport()) {
      const cacheKey = `${type}:${path}`;
      if (!forceRefresh && _cache.has(cacheKey)) {
        return _cache.get(cacheKey);
      }
      const data = await P2P_API.fetchFiles(type, path);
      _cache.set(cacheKey, data);
      return data;
    }

    const api =
      type === "remote"
        ? "/api/ftp/client/remote/ls"
        : "/api/ftp/client/local/ls";
    const paramName = type === "remote" ? "remote_path" : "local_path";
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
    if (isP2PTransport()) {
      P2P_API.clearCache();
    }
  },

  async deleteItem(path, isRemote) {
    if (isP2PTransport()) {
      return P2P_API.deleteItem(path, isRemote);
    }

    const params = new URLSearchParams();
    if (isRemote) params.append("remote_path", path);
    else params.append("local_path", path);

    const res = await fetch("/api/ftp/client/delete", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    if (!res.ok) throw new Error(await res.text());
    return true;
  },

  async transferFile(items, targetPath, isDownload) {
    const itemsArray = Array.isArray(items) ? items : [items];

    itemsArray.forEach((item) => {
      if (
        !item.isFolder &&
        window.Components &&
        Components.Transfers &&
        Components.Transfers.startTracking
      ) {
        Components.Transfers.startTracking({
          Name: item.name,
          IsDownload: isDownload,
          Size: item.size,
        });
      }
    });

    if (isP2PTransport()) {
      const result = await P2P_API.transferFile(
        itemsArray,
        targetPath,
        isDownload,
      );
      if (
        window.Components &&
        Components.Transfers &&
        Components.Transfers.addCompleted
      ) {
        itemsArray
          .filter((item) => !item.isFolder)
          .forEach((item) => {
            Components.Transfers.addCompleted({
              Name: item.name,
              TotalSize: item.size || 0,
              Written: item.size || 0,
              Percent: 100,
              IsDownload: isDownload,
              Timestamp: Date.now(),
              IsComplete: true,
            });
          });
      }
      return result;
    }

    const params = new URLSearchParams();
    const endpoint = isDownload
      ? "/api/ftp/client/download"
      : "/api/ftp/client/upload";

    if (isDownload) {
      params.append("local_path", targetPath);
      itemsArray.forEach((item) => {
        params.append("remote_paths", item.path);
      });
    } else {
      params.append("remote_path", targetPath);
      itemsArray.forEach((item) => {
        params.append("local_paths", item.path);
      });
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    if (!res.ok) throw new Error(await res.text());
    return true;
  },
};
