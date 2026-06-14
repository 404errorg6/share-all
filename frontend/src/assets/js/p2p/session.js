import { joinRoom } from "trystero";

const APP_ID = "github.com/404errorg6/share-all/internet-app";
const CHUNK_SIZE = 48 * 1024;
const ROOM_WAIT_MS = 45000;

function randomId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function randomToken(length = 18) {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join(
    "",
  );
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function buildInviteLink(roomId, name = "Share-All Peer") {
  const url = new URL("shareall://join");
  url.searchParams.set("room", roomId);
  url.searchParams.set("name", name);
  return url.toString();
}

function parseInviteLink(input) {
  const trimmed = String(input || "").trim();
  if (!trimmed) {
    throw new Error("Invite link is required");
  }

  let url;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("Invalid invite link");
  }

  if (url.protocol !== "shareall:") {
    throw new Error("Invite link must start with shareall://");
  }

  const roomId = url.searchParams.get("room") || "";
  if (!roomId) {
    throw new Error("Invite link is missing room information");
  }

  return {
    roomId,
    name: url.searchParams.get("name") || "Share-All Peer",
    invite: buildInviteLink(
      roomId,
      url.searchParams.get("name") || "Share-All Peer",
    ),
  };
}

function normalizeRemotePath(p) {
  if (!p || p === "/" || p === "./") return ".";
  return p.replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\//, "") || ".";
}

function joinRemotePath(base, name) {
  const cleanBase = normalizeRemotePath(base);
  if (cleanBase === ".") return name;
  return `${cleanBase}/${name}`.replace(/\/+/g, "/");
}

function joinLocalPath(base, name) {
  if (!base || base === ".") return `./${name}`;
  return `${base.replace(/\/$/, "")}/${name}`;
}

function basename(targetPath) {
  const normalized = String(targetPath || "")
    .replace(/\\/g, "/")
    .replace(/\/$/, "");
  const parts = normalized.split("/").filter(Boolean);
  return parts[parts.length - 1] || normalized || "";
}

async function requestJSON(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(
      (await response.text()) || `Request failed (${response.status})`,
    );
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function requestNoContent(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(
      (await response.text()) || `Request failed (${response.status})`,
    );
  }
  return true;
}

class ShareAllP2PConnection {
  constructor() {
    this.events = new EventTarget();
    this.reset();
  }

  reset() {
    this.room = null;
    this.roomId = null;
    this.targetPeerId = null;
    this.role = null;
    this.connected = false;
    this.authenticated = false;
    this.peerInfo = null;
    this.verificationCode = null;
    this.inviteLink = null;
    this.joinError = null;
    this.roomWaiters = [];
    this.authWaiters = [];
    this.pendingTransfers = new Map();
    this.eventAction = null;
    this.binaryAction = null;
    this.rpcAction = null;
  }

  emitChange() {
    this.events.dispatchEvent(
      new CustomEvent("change", { detail: this.getStatus() }),
    );
  }

  subscribe(callback) {
    const handler = (event) => callback(event.detail);
    this.events.addEventListener("change", handler);
    callback(this.getStatus());
    return () => this.events.removeEventListener("change", handler);
  }

  getStatus() {
    return {
      role: this.role,
      roomId: this.roomId,
      connected: this.connected,
      authenticated: this.authenticated,
      peerInfo: this.peerInfo,
      verificationCode: this.verificationCode,
      inviteLink: this.inviteLink,
      joinError: this.joinError,
    };
  }

  async configureShare(config) {
    const params = new URLSearchParams();
    params.append("name", config.name || "Share-All Peer");
    params.append("server_root_dir", config.rootDir || "");
    params.append("write_allowed", config.writeAllowed ? "true" : "false");
    return requestJSON("/api/p2p/share/configure", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
  }

  async getShareStatus() {
    return requestJSON("/api/p2p/share/status");
  }

  async createInvite(config) {
    await this.configureShare(config);
    await this.close();

    const roomId = randomToken();
    const verificationCode = generateOtp();
    const shareName = config?.name || "Share-All Peer";

    this.role = "host";
    this.roomId = roomId;
    this.verificationCode = verificationCode;
    this.inviteLink = buildInviteLink(roomId, shareName);
    this.joinError = null;

    this.startRoom(roomId, verificationCode);
    this.emitChange();
    return this.inviteLink;
  }

  async joinInvite(inviteInput, otp) {
    const invite = parseInviteLink(inviteInput);
    const password = String(otp || "").trim();
    if (!/^\d{6}$/.test(password)) {
      throw new Error("Enter the 6-digit code from the host");
    }

    await this.close();

    this.role = "client";
    this.roomId = invite.roomId;
    this.verificationCode = password;
    this.inviteLink = invite.invite;
    this.peerInfo = invite.name ? { name: invite.name } : null;
    this.joinError = null;

    this.startRoom(invite.roomId, password);
    this.emitChange();
    return invite;
  }

  startRoom(roomId, password) {
    const roomConfig = {
      appId: APP_ID,
      password,
      relayConfig: { redundancy: 2 },
      trickleIce: true,
    };

    this.room = joinRoom(roomConfig, roomId, {
      onJoinError: (details) => {
        this.joinError = details.error || "Unable to join internet session";
        this.connected = false;
        this.authenticated = false;
        this.rejectWaiters(new Error(this.joinError));
        this.emitChange();
      },
      handshakeTimeoutMs: 15000,
    });

    this.eventAction = this.room.makeAction("event");
    this.binaryAction = this.room.makeAction("binary");
    this.rpcAction = this.room.makeAction("rpc", {
      kind: "request",
      onRequest: (data, context) => this.handleRpcRequest(data, context),
    });

    this.eventAction.onMessage = (data, context) =>
      this.handleEventMessage(data, context);
    this.binaryAction.onMessage = (data, context) =>
      this.handleBinaryMessage(data, context);

    this.room.onPeerJoin = (peerId) => this.handlePeerJoin(peerId);
    this.room.onPeerLeave = (peerId) => this.handlePeerLeave(peerId);
  }

  async handlePeerJoin(peerId) {
    if (!this.targetPeerId) {
      this.targetPeerId = peerId;
    }

    if (peerId !== this.targetPeerId) {
      return;
    }

    this.connected = true;
    this.authenticated = true;
    this.joinError = null;
    this.resolveRoomWaiters();
    this.resolveAuthWaiters(true);
    this.emitChange();

    try {
      await this.sendPeerInfo(peerId);
    } catch (error) {
      console.error("Failed to send peer info:", error);
    }
  }

  handlePeerLeave(peerId) {
    if (peerId !== this.targetPeerId) {
      return;
    }

    this.connected = false;
    this.authenticated = false;
    this.targetPeerId = null;
    this.peerInfo = null;
    this.emitChange();
  }

  async sendPeerInfo(peerId = this.targetPeerId) {
    if (!peerId || !this.eventAction) return;
    const share = await this.getShareStatus();
    await this.eventAction.send(
      {
        type: "peer-info",
        peer: {
          name: share?.name || "Share-All Peer",
          writeAllowed: !!share?.writeAllowed,
          configured: !!share?.configured,
        },
      },
      { target: peerId },
    );
  }

  async handleEventMessage(data, { peerId }) {
    if (!data || typeof data !== "object") return;

    if (!this.targetPeerId) {
      this.targetPeerId = peerId;
    }

    if (data.type === "peer-info") {
      this.peerInfo = data.peer || null;
      this.connected = true;
      this.authenticated = true;
      this.joinError = null;
      this.resolveRoomWaiters();
      this.resolveAuthWaiters(true);
      this.emitChange();
      return;
    }

    const transfer = this.pendingTransfers.get(data.transferId);
    if (!transfer) return;

    if (data.type === "download-meta") {
      transfer.meta = data;
      return;
    }

    if (data.type === "download-complete") {
      try {
        if (transfer.mode === "file") {
          await this.finishWriteSession(transfer.uploadId);
          transfer.resolve(true);
        } else {
          const blob = new Blob(transfer.chunks, {
            type: transfer.mimeType || "application/octet-stream",
          });
          transfer.resolve(URL.createObjectURL(blob));
        }
      } catch (error) {
        transfer.reject(error);
      } finally {
        this.pendingTransfers.delete(data.transferId);
      }
      return;
    }

    if (data.type === "download-error") {
      transfer.reject(new Error(data.error || "Download failed"));
      this.pendingTransfers.delete(data.transferId);
    }
  }

  async handleBinaryMessage(data, { metadata }) {
    if (!metadata || typeof metadata !== "object") return;

    if (metadata.kind === "upload") {
      const bytes =
        data instanceof ArrayBuffer
          ? new Uint8Array(data)
          : new Uint8Array(data.buffer || data);
      await this.appendWriteChunk(metadata.uploadId, bytes);
      return;
    }

    if (metadata.kind === "download") {
      const transfer = this.pendingTransfers.get(metadata.transferId);
      if (!transfer) return;
      const bytes =
        data instanceof ArrayBuffer
          ? new Uint8Array(data)
          : new Uint8Array(data.buffer || data);
      if (transfer.mode === "file") {
        await this.appendWriteChunk(transfer.uploadId, bytes);
      } else {
        transfer.chunks.push(bytes);
      }
    }
  }

  async handleRpcRequest(data, { peerId }) {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid request");
    }

    switch (data.action) {
      case "list": {
        const entries = await requestJSON(
          `/api/p2p/fs/list?mode=shared&path=${encodeURIComponent(normalizeRemotePath(data.path))}`,
        );
        return { entries };
      }
      case "mkdir": {
        const params = new URLSearchParams();
        params.append("mode", "shared");
        params.append("path", normalizeRemotePath(data.path));
        await requestNoContent("/api/p2p/fs/mkdir", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString(),
        });
        return { ok: true };
      }
      case "upload-start": {
        const params = new URLSearchParams();
        params.append("mode", "shared");
        params.append("path", normalizeRemotePath(data.path));
        const result = await requestJSON("/api/p2p/fs/write/start", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString(),
        });
        return result;
      }
      case "upload-finish": {
        await requestNoContent(
          `/api/p2p/fs/write/finish?upload_id=${encodeURIComponent(data.uploadId)}`,
          {
            method: "POST",
          },
        );
        return { ok: true };
      }
      case "download-start": {
        this.streamSharedFile(
          peerId,
          data.transferId,
          normalizeRemotePath(data.path),
        ).catch(async (error) => {
          await this.eventAction.send(
            {
              type: "download-error",
              transferId: data.transferId,
              error: error.message || "Download failed",
            },
            { target: peerId },
          );
        });
        return { ok: true };
      }
      default:
        throw new Error(`Unsupported action: ${data.action}`);
    }
  }

  async streamSharedFile(peerId, transferId, remotePath) {
    const response = await fetch(
      `/api/p2p/fs/file?mode=shared&path=${encodeURIComponent(remotePath)}`,
    );
    if (!response.ok) {
      throw new Error((await response.text()) || "Unable to read shared file");
    }

    const size = Number(response.headers.get("content-length") || 0);
    await this.eventAction.send(
      {
        type: "download-meta",
        transferId,
        size,
        name: basename(remotePath),
      },
      { target: peerId },
    );

    if (!response.body) {
      const bytes = new Uint8Array(await response.arrayBuffer());
      await this.binaryAction.send(bytes, {
        target: peerId,
        metadata: { kind: "download", transferId },
      });
      await this.eventAction.send(
        { type: "download-complete", transferId },
        { target: peerId },
      );
      return;
    }

    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      for (let offset = 0; offset < value.length; offset += CHUNK_SIZE) {
        const part = value.slice(offset, offset + CHUNK_SIZE);
        await this.binaryAction.send(part, {
          target: peerId,
          metadata: { kind: "download", transferId },
        });
      }
    }

    await this.eventAction.send(
      { type: "download-complete", transferId },
      { target: peerId },
    );
  }

  waitUntilConnected(timeoutMs = ROOM_WAIT_MS) {
    if (this.connected) return Promise.resolve(true);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.roomWaiters = this.roomWaiters.filter(
          (waiter) => waiter.resolve !== resolve,
        );
        reject(
          new Error(this.joinError || "Timed out waiting for peer connection"),
        );
      }, timeoutMs);
      this.roomWaiters.push({ resolve, reject, timer });
    });
  }

  waitUntilAuthenticated(timeoutMs = ROOM_WAIT_MS) {
    if (this.authenticated) return Promise.resolve(true);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.authWaiters = this.authWaiters.filter(
          (waiter) => waiter.resolve !== resolve,
        );
        reject(
          new Error(
            this.joinError || "Timed out waiting for code verification",
          ),
        );
      }, timeoutMs);
      this.authWaiters.push({ resolve, reject, timer });
    });
  }

  resolveRoomWaiters() {
    for (const waiter of this.roomWaiters) {
      clearTimeout(waiter.timer);
      waiter.resolve(true);
    }
    this.roomWaiters = [];
  }

  resolveAuthWaiters(value) {
    for (const waiter of this.authWaiters) {
      clearTimeout(waiter.timer);
      waiter.resolve(value);
    }
    this.authWaiters = [];
  }

  rejectWaiters(error) {
    for (const waiter of this.roomWaiters) {
      clearTimeout(waiter.timer);
      waiter.reject(error);
    }
    for (const waiter of this.authWaiters) {
      clearTimeout(waiter.timer);
      waiter.reject(error);
    }
    this.roomWaiters = [];
    this.authWaiters = [];
  }

  ensureClientReady() {
    if (this.role !== "client") {
      throw new Error("This action is only available on the joining device");
    }
    if (!this.connected || !this.targetPeerId) {
      throw new Error("Peer connection is not established yet");
    }
    if (!this.authenticated) {
      throw new Error("Enter the 6-digit code and wait for connection first");
    }
  }

  async listRemote(path = ".") {
    this.ensureClientReady();
    const response = await this.rpcAction.request(
      {
        action: "list",
        path: normalizeRemotePath(path),
      },
      {
        target: this.targetPeerId,
        timeoutMs: 30000,
      },
    );
    return response.entries || [];
  }

  async mkdirRemote(path) {
    this.ensureClientReady();
    await this.rpcAction.request(
      {
        action: "mkdir",
        path: normalizeRemotePath(path),
      },
      {
        target: this.targetPeerId,
        timeoutMs: 30000,
      },
    );
  }

  async listLocal(path = ".") {
    return requestJSON(
      `/api/p2p/fs/list?mode=local&path=${encodeURIComponent(path)}`,
    );
  }

  async startWriteSession(mode, path) {
    const params = new URLSearchParams();
    params.append("mode", mode);
    params.append("path", path);
    return requestJSON("/api/p2p/fs/write/start", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
  }

  async appendWriteChunk(uploadId, bytes) {
    await requestNoContent(
      `/api/p2p/fs/write/chunk?upload_id=${encodeURIComponent(uploadId)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: bytes,
      },
    );
  }

  async finishWriteSession(uploadId) {
    await requestNoContent(
      `/api/p2p/fs/write/finish?upload_id=${encodeURIComponent(uploadId)}`,
      {
        method: "POST",
      },
    );
  }

  async downloadFileToLocal(remotePath, localFilePath) {
    this.ensureClientReady();
    const transferId = randomId();
    const writeSession = await this.startWriteSession("local", localFilePath);

    return new Promise(async (resolve, reject) => {
      this.pendingTransfers.set(transferId, {
        mode: "file",
        uploadId: writeSession.uploadId,
        resolve,
        reject,
      });

      try {
        await this.rpcAction.request(
          {
            action: "download-start",
            path: normalizeRemotePath(remotePath),
            transferId,
          },
          {
            target: this.targetPeerId,
            timeoutMs: 30000,
          },
        );
      } catch (error) {
        this.pendingTransfers.delete(transferId);
        reject(error);
      }
    });
  }

  async getRemoteBlobUrl(remotePath, mimeType = "application/octet-stream") {
    this.ensureClientReady();
    const transferId = randomId();

    return new Promise(async (resolve, reject) => {
      this.pendingTransfers.set(transferId, {
        mode: "blob",
        chunks: [],
        mimeType,
        resolve,
        reject,
      });

      try {
        await this.rpcAction.request(
          {
            action: "download-start",
            path: normalizeRemotePath(remotePath),
            transferId,
          },
          {
            target: this.targetPeerId,
            timeoutMs: 30000,
          },
        );
      } catch (error) {
        this.pendingTransfers.delete(transferId);
        reject(error);
      }
    });
  }

  async uploadFile(localFilePath, remoteDirPath) {
    this.ensureClientReady();
    const remoteFilePath = joinRemotePath(
      remoteDirPath,
      basename(localFilePath),
    );
    const start = await this.rpcAction.request(
      {
        action: "upload-start",
        path: remoteFilePath,
      },
      {
        target: this.targetPeerId,
        timeoutMs: 30000,
      },
    );

    const response = await fetch(
      `/api/p2p/fs/file?mode=local&path=${encodeURIComponent(localFilePath)}`,
    );
    if (!response.ok) {
      throw new Error((await response.text()) || "Unable to read local file");
    }

    if (!response.body) {
      const bytes = new Uint8Array(await response.arrayBuffer());
      await this.binaryAction.send(bytes, {
        target: this.targetPeerId,
        metadata: { kind: "upload", uploadId: start.uploadId },
      });
    } else {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (let offset = 0; offset < value.length; offset += CHUNK_SIZE) {
          const part = value.slice(offset, offset + CHUNK_SIZE);
          await this.binaryAction.send(part, {
            target: this.targetPeerId,
            metadata: { kind: "upload", uploadId: start.uploadId },
          });
        }
      }
    }

    await this.rpcAction.request(
      {
        action: "upload-finish",
        uploadId: start.uploadId,
      },
      {
        target: this.targetPeerId,
        timeoutMs: 30000,
      },
    );
  }

  async downloadEntry(remotePath, targetLocalDir, isFolder) {
    if (isFolder) {
      const folderName = basename(remotePath);
      const localDir = joinLocalPath(targetLocalDir, folderName);
      const params = new URLSearchParams();
      params.append("mode", "local");
      params.append("path", localDir);
      await requestNoContent("/api/p2p/fs/mkdir", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });

      const entries = await this.listRemote(remotePath);
      for (const entry of entries) {
        await this.downloadEntry(
          joinRemotePath(remotePath, entry.Name),
          localDir,
          entry.IsFolder,
        );
      }
      return;
    }

    const localFilePath = joinLocalPath(targetLocalDir, basename(remotePath));
    await this.downloadFileToLocal(remotePath, localFilePath);
  }

  async uploadEntry(localPath, remoteDirPath, isFolder) {
    if (isFolder) {
      const folderName = basename(localPath);
      const remoteFolderPath = joinRemotePath(remoteDirPath, folderName);
      await this.mkdirRemote(remoteFolderPath);
      const entries = await this.listLocal(localPath);
      for (const entry of entries) {
        await this.uploadEntry(
          joinLocalPath(localPath, entry.Name),
          remoteFolderPath,
          entry.IsFolder,
        );
      }
      return;
    }

    await this.uploadFile(localPath, remoteDirPath);
  }

  async close() {
    if (this.room) {
      try {
        await this.room.leave();
      } catch {
        // ignore
      }
    }

    this.rejectWaiters(new Error("Peer session closed"));
    for (const transfer of this.pendingTransfers.values()) {
      transfer.reject?.(new Error("Peer session closed"));
    }
    this.reset();
    this.emitChange();
  }
}

export { buildInviteLink, parseInviteLink };
export const P2PConnection = new ShareAllP2PConnection();
globalThis.P2PConnection = P2PConnection;
