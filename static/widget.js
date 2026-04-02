(function () {
  const script = document.currentScript;
  const BOT_ID = script?.getAttribute("data-bot-id");
  const API_BASE = script?.src.replace("/static/widget.js", "") || "";
  if (!BOT_ID) return console.error("[DocBot] data-bot-id is required");

  // persist session across page loads
  const STORAGE_KEY = `docbot_session_${BOT_ID}`;
  let sessionId = sessionStorage.getItem(STORAGE_KEY) || null;

  // ── styles ────────────────────────────────────────────────────────────────
  const style = document.createElement("style");
  style.textContent = `
    #docbot-launcher {
      position: fixed; bottom: 24px; right: 24px; z-index: 9998;
      width: 56px; height: 56px; border-radius: 50%;
      background: #01696f; color: #fff; border: none;
      box-shadow: 0 4px 16px rgba(0,0,0,0.18);
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: transform 180ms ease, background 180ms ease;
    }
    #docbot-launcher:hover { background: #0c4e54; transform: scale(1.08); }
    #docbot-launcher svg { width: 26px; height: 26px; }

    #docbot-frame {
      position: fixed; bottom: 92px; right: 24px; z-index: 9999;
      width: 380px; max-width: calc(100vw - 32px);
      height: 560px; max-height: calc(100vh - 120px);
      border-radius: 16px; overflow: hidden;
      box-shadow: 0 12px 48px rgba(0,0,0,0.22);
      display: none; flex-direction: column;
      background: #f7f6f2; font-family: system-ui, sans-serif;
      border: 1px solid rgba(0,0,0,0.08);
    }
    #docbot-frame.open { display: flex; }

    #docbot-header {
      background: #01696f; color: #fff;
      padding: 14px 16px; font-weight: 600; font-size: 15px;
      display: flex; align-items: center; justify-content: space-between;
      flex-shrink: 0;
    }
    #docbot-header button {
      background: none; border: none; color: #fff; cursor: pointer;
      font-size: 20px; line-height: 1; padding: 0 4px;
    }

    #docbot-messages {
      flex: 1; overflow-y: auto; padding: 14px 12px;
      display: flex; flex-direction: column; gap: 10px;
    }
    .docbot-msg {
      max-width: 80%; padding: 10px 14px; border-radius: 12px;
      font-size: 14px; line-height: 1.5; word-break: break-word;
    }
    .docbot-msg.user {
      align-self: flex-end; background: #01696f; color: #fff;
      border-bottom-right-radius: 4px;
    }
    .docbot-msg.bot {
      align-self: flex-start; background: #fff; color: #28251d;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.07);
    }
    .docbot-msg.typing { color: #7a7974; font-style: italic; }

    #docbot-input-row {
      display: flex; gap: 8px; padding: 10px 12px;
      border-top: 1px solid rgba(0,0,0,0.08); flex-shrink: 0;
      background: #fff;
    }
    #docbot-input {
      flex: 1; border: 1px solid #d4d1ca; border-radius: 8px;
      padding: 9px 12px; font-size: 14px; outline: none;
      background: #f9f8f5; color: #28251d;
      transition: border-color 180ms ease;
    }
    #docbot-input:focus { border-color: #01696f; }
    #docbot-send {
      background: #01696f; color: #fff; border: none;
      border-radius: 8px; padding: 0 16px; cursor: pointer; font-size: 14px;
      transition: background 180ms ease;
    }
    #docbot-send:hover { background: #0c4e54; }
    #docbot-send:disabled { background: #bab9b4; cursor: not-allowed; }
  `;
  document.head.appendChild(style);

  // ── DOM ───────────────────────────────────────────────────────────────────
  const frame = document.createElement("div");
  frame.id = "docbot-frame";
  frame.innerHTML = `
    <div id="docbot-header">
      <span>💬 Chat</span>
      <button id="docbot-close" aria-label="Close chat">×</button>
    </div>
    <div id="docbot-messages"></div>
    <div id="docbot-input-row">
      <input id="docbot-input" type="text" placeholder="Ask a question…" autocomplete="off" />
      <button id="docbot-send">Send</button>
    </div>
  `;

  const launcher = document.createElement("button");
  launcher.id = "docbot-launcher";
  launcher.setAttribute("aria-label", "Open chat");
  launcher.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>`;

  document.body.appendChild(frame);
  document.body.appendChild(launcher);

  const messagesEl = frame.querySelector("#docbot-messages");
  const inputEl = frame.querySelector("#docbot-input");
  const sendBtn = frame.querySelector("#docbot-send");

  // ── helpers ───────────────────────────────────────────────────────────────
  function addMessage(text, role) {
    const el = document.createElement("div");
    el.className = `docbot-msg ${role}`;
    el.textContent = text;
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return el;
  }

  // ── toggle ────────────────────────────────────────────────────────────────
  launcher.addEventListener("click", () => {
    frame.classList.toggle("open");
    if (frame.classList.contains("open")) inputEl.focus();
  });
  frame.querySelector("#docbot-close").addEventListener("click", () => {
    frame.classList.remove("open");
  });

  // ── send ──────────────────────────────────────────────────────────────────
  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = "";
    sendBtn.disabled = true;

    addMessage(text, "user");
    const typing = addMessage("Thinking…", "bot typing");

    try {
      const res = await fetch(`${API_BASE}/public/chat/${BOT_ID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, session_id: sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error");
      sessionId = data.session_id;
      sessionStorage.setItem(STORAGE_KEY, sessionId);
      typing.className = "docbot-msg bot";
      typing.textContent = data.answer;
    } catch (err) {
      typing.className = "docbot-msg bot";
      typing.textContent = "Sorry, something went wrong. Please try again.";
    } finally {
      sendBtn.disabled = false;
      inputEl.focus();
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
})();