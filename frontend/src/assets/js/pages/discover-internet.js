import { P2PConnection, parseInviteLink } from "../p2p/session.js";

/**
 * Internet App-to-App Page
 */

export const template = `
  <header class="sticky top-0 z-20 bg-background-dark/95 backdrop-blur-md border-b border-white/5 p-4">
    <div class="flex items-center gap-3">
      <button id="back-btn"
        class="text-primary flex size-10 items-center justify-center rounded-full hover:bg-slate-800 transition-colors" onclick="globalThis.Router.navigate('/discover')">
        <span class="material-symbols-outlined text-3xl">arrow_back</span>
      </button>
      <div class="flex flex-col">
        <h2 class="text-xl font-bold text-white">Internet App-to-App</h2>
      </div>
    </div>
  </header>

  <main class="flex flex-col gap-4 p-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-violet-400">hub</span>
        <h3 class="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Connect via Invite</h3>
      </div>
      <div id="internet-pill" class="px-3 py-1 rounded-full bg-white/5 text-[10px] font-black tracking-widest uppercase text-slate-400">Idle</div>
    </div>

    <div class="grid gap-3">
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
          placeholder="123456">
        <button id="internet-connect-btn"
          class="mt-3 w-full h-10 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 font-black text-[10px] uppercase tracking-widest transition-all">
          Connect Over Internet
        </button>
      </div>
    </div>

    <div id="internet-status"
      class="rounded-xl bg-white/[0.03] border border-white/5 p-3 text-[11px] text-slate-400 leading-relaxed">
      Waiting for an invite link.
    </div>

    <div class="flex items-start gap-2 px-1">
      <span class="material-symbols-outlined text-[14px] text-slate-500 mt-px shrink-0">info</span>
      <p class="text-[11px] text-slate-500 leading-relaxed">A free helper network is used only for peer discovery. Your actual file data still goes directly between devices whenever possible.</p>
    </div>
  </main>
`;

export function init() {
  const backBtn = document.getElementById("back-btn");
  const linkInput = document.getElementById("internet-link-input");
  const codeInput = document.getElementById("internet-code-input");
  const connectBtn = document.getElementById("internet-connect-btn");
  const internetStatus = document.getElementById("internet-status");
  const internetPill = document.getElementById("internet-pill");
  const internetInviteHint = document.getElementById("internet-invite-hint");
  let p2pUnsubscribe = null;

  function setInternetStatus(message, tone = "muted") {
    internetStatus.textContent = message;
    internetStatus.className = "rounded-xl border p-3 text-[11px] leading-relaxed";
    internetPill.className = "px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase";
    if (tone === "success") {
      internetStatus.classList.add("bg-emerald-500/10", "border-emerald-500/20", "text-emerald-300");
      internetPill.classList.add("bg-emerald-500/10", "text-emerald-300");
      internetPill.textContent = "Connected";
    } else if (tone === "error") {
      internetStatus.classList.add("bg-red-500/10", "border-red-500/20", "text-red-300");
      internetPill.classList.add("bg-red-500/10", "text-red-300");
      internetPill.textContent = "Error";
    } else if (tone === "info") {
      internetStatus.classList.add("bg-violet-500/10", "border-violet-500/20", "text-violet-200");
      internetPill.classList.add("bg-violet-500/10", "text-violet-300");
      internetPill.textContent = "Joining";
    } else {
      internetStatus.classList.add("bg-white/[0.03]", "border-white/5", "text-slate-400");
      internetPill.classList.add("bg-white/5", "text-slate-400");
      internetPill.textContent = "Idle";
    }
  }

  function persistInternetConnection() {
    const status = P2PConnection.getStatus();
    localStorage.removeItem("current_server_id");
    localStorage.setItem("current_remote_transport", "webrtc");
    localStorage.setItem("current_remote_name", status.peerInfo?.name || "Internet Peer");
    localStorage.setItem("current_remote_host", "p2p");
    localStorage.setItem("current_remote_port", status.roomId || "webrtc");
  }

  function prefillInviteFromRoute() {
    const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
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
        setInternetStatus("Invite loaded. Enter the 6-digit code from the host, then tap Connect Over Internet.", "info");
      } catch {
        // Ignore invalid prefill, user can replace it.
      }
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
      setInternetStatus("Connected successfully. Opening remote files...", "success");
      if (globalThis.Components?.showToast)
        globalThis.Components.showToast("Internet connection established", "success");
      window.location.hash = "#/browse-remote-local";
    } catch (error) {
      setInternetStatus(error.message || "Unable to connect over internet.", "error");
    }
  }

  if (backBtn) backBtn.onclick = () => window.location.hash = "#/discover";
  if (connectBtn) connectBtn.onclick = connectOverInternet;
  if (codeInput) {
    codeInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") connectOverInternet();
    });
  }

  p2pUnsubscribe = P2PConnection.subscribe((status) => {
    if (status.connected && status.authenticated) {
      setInternetStatus(`Connected to ${status.peerInfo?.name || "internet peer"}.`, "success");
    } else if (status.joinError) {
      setInternetStatus(status.joinError, "error");
    }
  });

  if (globalThis.Components?.Sidebar?.highlight) {
    globalThis.Components.Sidebar.highlight("discover-servers");
  }

  prefillInviteFromRoute();

  return () => {
    if (p2pUnsubscribe) p2pUnsubscribe();
  };
}
