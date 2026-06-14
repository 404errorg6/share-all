import {
  StartDiscovering,
  StopDiscovery,
} from "../../../../bindings/github.com/404errorg6/share-all/internal/services/discovery.js";
import { Events } from "@wailsio/runtime";
import { P2PConnection, parseInviteLink } from "../p2p/session.js";

/**
 * Discover Servers (Remote Connections) Page Logic
 */

export const template = `
        <header class="sticky top-0 z-20 bg-background-dark/95 backdrop-blur-md border-b border-white/5 p-4">
            <div class="flex items-center gap-3">
                <button id="menu-btn"
                    class="text-primary flex size-10 items-center justify-center rounded-full hover:bg-slate-800 transition-colors">
                    <span class="material-symbols-outlined text-3xl">menu</span>
                </button>
                <div class="flex flex-col">
                    <h2 class="text-xl font-bold text-white">Connect to Other Device</h2>
                </div>
            </div>
        </header>

        <main class="flex flex-col gap-4 p-4">
            <!-- Auto-Discovery Card -->
            <div class="bg-white/5 rounded-2xl overflow-hidden border border-white/5 p-4 transition-all duration-300">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-3">
                        <div class="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <span class="material-symbols-outlined text-2xl">radar</span>
                        </div>
                        <div>
                            <h3 class="text-white font-bold">Auto-Discovery</h3>
                            <p id="auto-discovery-status" class="text-[#9cb0ba] text-xs">Scan local network</p>
                        </div>
                    </div>
                    <button id="rescan-btn"
                        class="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-all">
                        <span class="material-symbols-outlined text-sm">refresh</span> RE-SCAN
                    </button>
                </div>

                <div class="mt-3">
                    <div id="discovery-state"
                        class="hidden py-12 flex flex-col items-center justify-center bg-slate-800/10 rounded-2xl border border-white/5">
                        <div class="size-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin mb-3"></div>
                        <p class="text-sm font-bold text-slate-300">Scanning Network</p>
                        <p class="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-medium">Looking for active FTP servers...</p>
                    </div>
                    <div id="discovery-list" class="grid grid-cols-1 gap-3"></div>
                </div>

                <div class="mt-3 flex items-start gap-2 px-1">
                    <span class="material-symbols-outlined text-[14px] text-slate-500 mt-px shrink-0">info</span>
                    <p class="text-[11px] text-slate-500 leading-relaxed">Best for devices on the same local network.</p>
                </div>
            </div>

            <!-- Internet App-to-App Card -->
            <div class="bg-white/5 rounded-2xl overflow-hidden border border-white/5 p-4 transition-all duration-300">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-3">
                        <div class="size-10 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400">
                            <span class="material-symbols-outlined text-2xl">hub</span>
                        </div>
                        <div>
                            <h3 class="text-white font-bold">Internet App-to-App</h3>
                            <p id="internet-status-text" class="text-[#9cb0ba] text-xs">Connect via invite link</p>
                        </div>
                    </div>
                    <div id="internet-pill" class="px-3 py-1 rounded-full bg-white/5 text-[10px] font-black tracking-widest uppercase text-slate-400">Idle</div>
                </div>

                <div class="mt-4 grid gap-3">
                    <div class="rounded-xl bg-white/5 border border-white/5 p-3">
                        <div class="flex items-center justify-between gap-3 mb-2">
                            <div>
                                <p class="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Invite Link</p>
                                <p id="internet-invite-hint" class="text-[11px] text-slate-500 mt-1">Paste the link sent by your friend.</p>
                            </div>
                        </div>
                        <textarea id="internet-link-input" rows="3"
                            class="w-full rounded-xl bg-background-dark/40 border border-white/5 p-3 text-[11px] text-[#9cb0ba] outline-none focus:border-primary/40"
                            placeholder="shareall://join?room=..."></textarea>
                    </div>

                    <div class="rounded-xl bg-white/5 border border-white/5 p-3">
                        <p class="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">6-Digit Code</p>
                        <input id="internet-code-input" maxlength="6"
                            class="w-full h-12 rounded-xl bg-background-dark/40 border border-white/5 px-4 text-sm tracking-[0.35em] font-black text-white outline-none focus:border-primary/40"
                            placeholder="123456" />
                        <button id="internet-connect-btn"
                            class="mt-3 w-full h-10 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 font-black text-[10px] uppercase tracking-widest transition-colors">
                            Connect Over Internet
                        </button>
                    </div>
                </div>

                <div id="internet-status"
                    class="mt-3 rounded-xl bg-white/[0.03] border border-white/5 p-3 text-[11px] text-slate-400 leading-relaxed">
                    Waiting for an invite link.
                </div>

                <div class="mt-3 flex items-start gap-2 px-1">
                    <span class="material-symbols-outlined text-[14px] text-slate-500 mt-px shrink-0">info</span>
                    <p class="text-[11px] text-slate-500 leading-relaxed">A free helper network is used only for peer discovery. Your actual file data still goes directly between devices whenever possible.</p>
                </div>
            </div>
        </main>

    <div id="login-modal" class="fixed inset-0 z-[100] flex items-center justify-center p-6 hidden">
        <div id="login-modal-backdrop" class="modal-overlay absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        <div id="login-modal-content"
            class="modal-container relative w-full max-w-[360px] bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl transition-all scale-95 opacity-0">
            <div class="p-8">
                <div class="flex items-center gap-4 mb-8">
                    <div class="size-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <span class="material-symbols-outlined text-4xl">lock_open</span>
                    </div>
                    <div class="flex-1 overflow-hidden">
                        <h3 id="login-server-name" class="text-xl font-bold text-white truncate leading-tight"></h3>
                        <p id="login-server-addr" class="text-slate-500 text-xs font-mono"></p>
                    </div>
                </div>

                <div class="space-y-4 mb-8">
                    <div class="group">
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2 ml-1">Username</label>
                        <div class="relative">
                            <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl group-focus-within:text-primary transition-colors">person</span>
                            <input type="text" id="login-user"
                                class="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-5 text-white focus:border-primary/50 focus:bg-primary/[0.02] outline-none transition-all"
                                placeholder="Enter username">
                        </div>
                    </div>
                    <div class="group">
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2 ml-1">Password</label>
                        <div class="relative">
                            <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl group-focus-within:text-primary transition-colors">key</span>
                            <input type="password" id="login-pass"
                                class="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-5 text-white focus:border-primary/50 focus:bg-primary/[0.02] outline-none transition-all"
                                placeholder="••••••••">
                        </div>
                    </div>
                </div>

                <div class="flex flex-col gap-3">
                    <button id="submit-login-btn"
                        class="h-16 w-full bg-primary text-white rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-lg">Connect
                        Server</button>
                    <button id="close-login-btn"
                        class="h-12 w-full rounded-xl font-bold text-slate-500 hover:text-white transition-colors">Cancel</button>
                </div>
            </div>
        </div>
    </div>
`;

export function init() {
  const discoveryList = document.getElementById("discovery-list");
  const discoveryState = document.getElementById("discovery-state");
  const loginModal = document.getElementById("login-modal");
  const rescanBtn = document.getElementById("rescan-btn");
  const loginModalContent = document.getElementById("login-modal-content");
  const loginModalBackdrop = document.getElementById("login-modal-backdrop");
  const linkInput = document.getElementById("internet-link-input");
  const codeInput = document.getElementById("internet-code-input");
  const connectBtn = document.getElementById("internet-connect-btn");
  const internetStatus = document.getElementById("internet-status");
  const internetPill = document.getElementById("internet-pill");
  const internetInviteHint = document.getElementById("internet-invite-hint");

  let discoveryAbortController = null;
  let discoveryTimeout = null;
  let discoveryEventUnsubscribe = null;
  let p2pUnsubscribe = null;
  const discoveredCards = new Map();
  let pendingServer = null;

  function setInternetStatus(message, tone = "muted") {
    internetStatus.textContent = message;
    internetStatus.className =
      "mt-3 rounded-xl border p-3 text-[11px] leading-relaxed";
    internetPill.className =
      "px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase";

    if (tone === "success") {
      internetStatus.classList.add(
        "bg-emerald-500/10",
        "border-emerald-500/20",
        "text-emerald-300",
      );
      internetPill.classList.add("bg-emerald-500/10", "text-emerald-300");
      internetPill.textContent = "Connected";
    } else if (tone === "error") {
      internetStatus.classList.add(
        "bg-red-500/10",
        "border-red-500/20",
        "text-red-300",
      );
      internetPill.classList.add("bg-red-500/10", "text-red-300");
      internetPill.textContent = "Error";
    } else if (tone === "info") {
      internetStatus.classList.add(
        "bg-violet-500/10",
        "border-violet-500/20",
        "text-violet-200",
      );
      internetPill.classList.add("bg-violet-500/10", "text-violet-300");
      internetPill.textContent = "Joining";
    } else {
      internetStatus.classList.add(
        "bg-white/[0.03]",
        "border-white/5",
        "text-slate-400",
      );
      internetPill.classList.add("bg-white/5", "text-slate-400");
      internetPill.textContent = "Idle";
    }
  }

  function persistInternetConnection() {
    const status = P2PConnection.getStatus();
    localStorage.removeItem("current_server_id");
    localStorage.setItem("current_remote_transport", "webrtc");
    localStorage.setItem(
      "current_remote_name",
      status.peerInfo?.name || "Internet Peer",
    );
    localStorage.setItem("current_remote_host", "p2p");
    localStorage.setItem("current_remote_port", status.roomId || "webrtc");
  }

  function prefillInviteFromRoute() {
    const params = new URLSearchParams(
      window.location.hash.split("?")[1] || "",
    );
    const inviteFromHash = params.get("invite");
    const room = params.get("room");
    const name = params.get("name");

    if (inviteFromHash) {
      linkInput.value = inviteFromHash;
    } else if (room) {
      const safeName = name || "Share-All Peer";
      linkInput.value = `shareall://join?room=${encodeURIComponent(room)}&name=${encodeURIComponent(safeName)}`;
    }

    if (linkInput.value) {
      try {
        const parsed = parseInviteLink(linkInput.value);
        internetInviteHint.textContent = `Invite ready for ${parsed.name}. Enter the 6-digit code from the host to continue.`;
        setInternetStatus(
          "Invite loaded. Enter the 6-digit code from the host, then tap Connect Over Internet.",
          "info",
        );
      } catch {
        // Ignore invalid prefill, user can replace it.
      }
    }
  }

  function stopDiscovery() {
    if (discoveryAbortController) {
      discoveryAbortController.abort();
      discoveryAbortController = null;
    }
    if (discoveryTimeout) {
      clearTimeout(discoveryTimeout);
      discoveryTimeout = null;
    }
    if (discoveryEventUnsubscribe) {
      discoveryEventUnsubscribe();
      discoveryEventUnsubscribe = null;
    }
    try {
      StopDiscovery();
    } catch (e) {
      console.warn("Failed to call StopDiscovery:", e);
    }
  }

  async function _StartDiscovering() {
    try {
      return StartDiscovering();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async function discoverServers() {
    stopDiscovery();

    discoveryList.innerHTML = "";
    discoveredCards.clear();

    discoveryState.innerHTML = `
            <div class="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
            <p class="text-sm font-bold text-slate-300">Scanning Network</p>
            <p class="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-medium">Looking for active FTP servers...</p>
        `;
    discoveryState.classList.remove("hidden");
    if (rescanBtn) rescanBtn.classList.add("hidden");

    discoveryAbortController = new AbortController();
    const signal = discoveryAbortController.signal;

    discoveryTimeout = setTimeout(() => {
      stopDiscovery();
    }, 15000);

    try {
      discoveryEventUnsubscribe = Events.On(
        "client:discover-servers",
        (event) => {
          const server = event && event.data ? event.data : event;
          const serverId = `${server.Name || ""}-${server.IP}:${server.Port}`;
          discoveryState.classList.add("hidden");
          renderDiscoveredServer(serverId, server);
        },
      );

      const discoveryPromise = _StartDiscovering();
      signal.addEventListener("abort", () => {
        if (discoveryPromise && typeof discoveryPromise.cancel === "function")
          discoveryPromise.cancel();
      });

      await discoveryPromise;
    } catch (err) {
      if (err.name !== "AbortError") console.error("Discovery error:", err);
    } finally {
      if (discoveryTimeout) clearTimeout(discoveryTimeout);
      if (discoveredCards.size === 0) {
        discoveryState.innerHTML = `
                    <span class="material-symbols-outlined text-4xl text-slate-500 mb-3 opacity-20">search_off</span>
                    <p class="text-sm font-bold text-slate-300">No Servers Found</p>
                    <p class="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-medium">Make sure other devices are on the same network</p>
                `;
        discoveryState.classList.remove("hidden");
      }
      if (rescanBtn) rescanBtn.classList.remove("hidden");
      if (discoveryEventUnsubscribe) discoveryEventUnsubscribe();
      discoveryAbortController = null;
    }
  }

  function renderDiscoveredServer(serverId, server) {
    if (discoveredCards.has(serverId)) return;

    const card = document.createElement("div");
    card.className =
      "flex flex-col bg-slate-800/40 border border-white/5 rounded-2xl overflow-hidden hover:border-primary/30 transition-all cursor-pointer group animate-fade-in";
    discoveryList.appendChild(card);
    discoveredCards.set(serverId, card);

    card.onclick = () => {
      const name = server.Name || server.IP;
      localStorage.removeItem("current_server_id");
      localStorage.removeItem("current_remote_transport");
      if (server.AnonymousAllowed) {
        connectWithCredentials(
          server.IP,
          server.Port,
          "anonymous",
          "anonymous",
          true,
          name,
        );
      } else {
        showLoginPrompt(server);
      }
    };

    card.innerHTML = `
            <div class="p-4 flex items-center gap-4">
                <div class="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                    <span class="material-symbols-outlined text-3xl">wifi_tethering</span>
                </div>
                <div class="flex flex-col flex-1 overflow-hidden">
                    <h3 class="text-white font-bold truncate">${server.Name || server.IP}</h3>
                    <div class="flex items-center gap-2 mt-0.5">
                        <span class="text-[10px] bg-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded font-mono">${server.IP}:${server.Port}</span>
                        ${
                          server.AnonymousAllowed
                            ? '<span class="text-[9px] bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Public</span>'
                            : '<span class="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Private</span>'
                        }
                    </div>
                </div>
                <div class="size-10 rounded-full flex items-center justify-center text-primary/40 group-hover:text-primary transition-colors">
                    <span class="material-symbols-outlined">chevron_right</span>
                </div>
            </div>
        `;
  }

  function showLoginPrompt(server) {
    document.getElementById("login-server-name").innerText =
      server.Name || server.IP;
    document.getElementById("login-server-addr").innerText =
      `${server.IP}:${server.Port}`;
    document.getElementById("login-user").value = "";
    document.getElementById("login-pass").value = "";

    loginModal.classList.remove("hidden");
    setTimeout(() => {
      loginModalContent.classList.remove("scale-95", "opacity-0");
      loginModalContent.classList.add("scale-100", "opacity-100");
    }, 10);
    pendingServer = server;
  }

  function closeLoginModal() {
    loginModalContent.classList.add("scale-95", "opacity-0");
    loginModalContent.classList.remove("scale-100", "opacity-100");
    setTimeout(() => loginModal.classList.add("hidden"), 300);
  }

  async function connectWithCredentials(host, port, user, pass, isAnon, name) {
    if (globalThis.Components?.showToast)
      globalThis.Components.showToast(`Connecting to ${host}...`, "info");
    try {
      const params = new URLSearchParams();
      params.append("server_host", host);
      params.append("server_port", port);
      params.append("user", user);
      params.append("password", pass);
      params.append("anonymous", isAnon ? "true" : "false");

      const response = await fetch("/api/ftp/client/connect-to-server", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });

      const text = await response.text();
      if (response.ok || text.includes("already connected")) {
        stopDiscovery();
        if (globalThis.Components?.showToast)
          globalThis.Components.showToast("Connected successfully", "success");
        if (name) {
          localStorage.setItem("current_remote_name", name);
          localStorage.setItem("current_remote_host", host);
          localStorage.setItem("current_remote_port", port);
          localStorage.removeItem("current_remote_transport");
        }
        window.location.hash = "#/browse-remote-local";
      } else {
        if (globalThis.Components?.showToast)
          globalThis.Components.showToast(
            `Connection failed: ${text}`,
            "error",
          );
      }
    } catch {
      if (globalThis.Components?.showToast)
        globalThis.Components.showToast(
          "Network error or server unreachable",
          "error",
        );
    }
  }

  async function connectOverInternet() {
    const invite = linkInput.value.trim();
    const code = codeInput.value.trim();
    if (!invite) {
      setInternetStatus("Paste the invite link from the host first.", "error");
      return;
    }
    if (!code) {
      setInternetStatus("Enter the 6-digit code from the host.", "error");
      return;
    }

    try {
      setInternetStatus("Joining secure internet session...", "info");
      await P2PConnection.joinInvite(invite, code);
      await P2PConnection.waitUntilConnected();
      persistInternetConnection();
      setInternetStatus(
        "Connected successfully. Opening remote files...",
        "success",
      );
      if (globalThis.Components?.showToast)
        globalThis.Components.showToast(
          "Internet connection established",
          "success",
        );
      window.location.hash = "#/browse-remote-local";
    } catch (error) {
      setInternetStatus(
        error.message || "Unable to connect over internet.",
        "error",
      );
    }
  }

  async function checkStatus() {
    const urlParams = new URLSearchParams(
      window.location.hash.split("?")[1] || "",
    );
    const force = urlParams.get("force") === "true";

    if (
      !force &&
      P2PConnection.getStatus().connected &&
      P2PConnection.getStatus().authenticated
    ) {
      persistInternetConnection();
      window.location.hash = "#/browse-remote-local";
      return;
    }

    try {
      const response = await fetch("/api/ftp/client/status");
      if (response.ok) {
        const status = await response.json();
        if (status === "connected" && !force) {
          window.location.hash = "#/browse-remote-local";
          return;
        }
      }
    } catch {
      // ignore
    }

    discoverServers();
  }

  if (rescanBtn) rescanBtn.onclick = () => discoverServers();
  if (loginModalBackdrop) loginModalBackdrop.onclick = closeLoginModal;

  const submitBtn = document.getElementById("submit-login-btn");
  if (submitBtn)
    submitBtn.onclick = async () => {
      const user = document.getElementById("login-user").value;
      const pass = document.getElementById("login-pass").value;
      if (!user || !pass) {
        if (globalThis.Components?.showToast)
          globalThis.Components.showToast(
            "Please enter both username and password",
            "error",
          );
        return;
      }
      const name = pendingServer.Name || pendingServer.IP;
      closeLoginModal();
      await connectWithCredentials(
        pendingServer.IP,
        pendingServer.Port,
        user,
        pass,
        false,
        name,
      );
    };

  const closeBtn = document.getElementById("close-login-btn");
  if (closeBtn) closeBtn.onclick = closeLoginModal;
  if (connectBtn) connectBtn.onclick = connectOverInternet;
  if (codeInput)
    codeInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") connectOverInternet();
    });

  const menuBtn = document.getElementById("menu-btn");
  if (menuBtn && globalThis.Components?.toggleMenu)
    menuBtn.onclick = () => globalThis.Components.toggleMenu();

  p2pUnsubscribe = P2PConnection.subscribe((status) => {
    if (status.connected && status.authenticated) {
      setInternetStatus(
        `Connected to ${status.peerInfo?.name || "internet peer"}.`,
        "success",
      );
    } else if (status.joinError) {
      setInternetStatus(status.joinError, "error");
    }
  });

  if (globalThis.Components?.Sidebar?.highlight) {
    globalThis.Components.Sidebar.highlight("discover-servers");
  }

  prefillInviteFromRoute();
  checkStatus();

  return () => {
    stopDiscovery();
    if (p2pUnsubscribe) p2pUnsubscribe();
  };
}
