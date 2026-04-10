from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models.bot import Bot

router = APIRouter(tags=["Widget"])


@router.get("/public/chat-widget/{bot_id}", response_class=HTMLResponse)
async def chat_widget(
    bot_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Serves a full-page chat UI for a bot."""
    bot = await db.get(Bot, bot_id)
    if not bot or not bot.is_active:
        raise HTTPException(status_code=404, detail="Bot not found")

    def _esc(s: str) -> str:
        return s.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;").replace(">", "&gt;")

    bot_name = _esc(bot.name)

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>{bot_name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}

    :root {{
      --accent:        #01696f;
      --accent-hover:  #0c4e54;
      --accent-light:  #e6f2f2;
      --bg:            #f5f5f4;
      --surface:       #ffffff;
      --border:        rgba(0,0,0,0.08);
      --text:          #18181b;
      --text-muted:    #71717a;
      --text-faint:    #a1a1aa;
      --user-bubble:   #01696f;
      --user-text:     #ffffff;
      --bot-bubble:    #ffffff;
      --bot-border:    rgba(0,0,0,0.08);
      --radius-msg:    16px;
      --shadow-sm:     0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
      --shadow-input:  0 0 0 3px rgba(1,105,111,0.15);
    }}

    html, body {{
      height: 100%;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 14px;
      color: var(--text);
      background: var(--bg);
      -webkit-font-smoothing: antialiased;
    }}

    /* ── Layout shell ── */
    #shell {{
      display: flex;
      flex-direction: column;
      height: 100dvh;
      max-width: 780px;
      margin: 0 auto;
    }}

    /* ── Header ── */
    #header {{
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 20px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
      flex-shrink: 0;
      z-index: 10;
    }}
    #header-avatar {{
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }}
    #header-avatar svg {{ color: #fff; }}
    #header-info {{ flex: 1; min-width: 0; }}
    #header-name {{
      font-size: 15px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }}
    #header-status {{
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 1px;
    }}
    #status-dot {{
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #22c55e;
      flex-shrink: 0;
    }}
    #header-badge {{
      font-size: 11px;
      color: var(--text-faint);
      font-weight: 500;
      flex-shrink: 0;
    }}

    /* ── Messages area ── */
    #messages {{
      flex: 1;
      overflow-y: auto;
      padding: 24px 20px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      scroll-behavior: smooth;
    }}
    #messages::-webkit-scrollbar {{ width: 4px; }}
    #messages::-webkit-scrollbar-track {{ background: transparent; }}
    #messages::-webkit-scrollbar-thumb {{ background: #d4d4d8; border-radius: 99px; }}

    /* ── Welcome state ── */
    #welcome {{
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 32px 16px 24px;
      gap: 8px;
    }}
    #welcome-icon {{
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 4px;
    }}
    #welcome h2 {{
      font-size: 18px;
      font-weight: 600;
      color: var(--text);
    }}
    #welcome p {{
      font-size: 13px;
      color: var(--text-muted);
      max-width: 340px;
      line-height: 1.6;
    }}

    /* ── Suggestion chips ── */
    #suggestions {{
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
      padding: 16px 0 8px;
    }}
    .suggestion-chip {{
      padding: 8px 14px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 99px;
      font-size: 13px;
      font-weight: 500;
      color: var(--accent);
      cursor: pointer;
      transition: background 140ms ease, border-color 140ms ease, transform 100ms ease;
      text-align: left;
      line-height: 1.4;
    }}
    .suggestion-chip:hover {{
      background: var(--accent-light);
      border-color: var(--accent);
      transform: translateY(-1px);
    }}
    .suggestion-chip:active {{ transform: translateY(0); }}

    /* ── Date divider ── */
    .date-divider {{
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 12px 0 8px;
      color: var(--text-faint);
      font-size: 11px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }}
    .date-divider::before, .date-divider::after {{
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border);
    }}

    /* ── Message rows ── */
    .msg-row {{
      display: flex;
      flex-direction: column;
      max-width: 75%;
      gap: 2px;
    }}
    .msg-row.user {{ align-self: flex-end; align-items: flex-end; }}
    .msg-row.bot  {{ align-self: flex-start; align-items: flex-start; }}

    .bubble {{
      padding: 10px 14px;
      border-radius: var(--radius-msg);
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 14px;
    }}
    .msg-row.user .bubble {{
      background: var(--user-bubble);
      color: var(--user-text);
      border-bottom-right-radius: 4px;
    }}
    .msg-row.bot .bubble {{
      background: var(--bot-bubble);
      border: 1px solid var(--bot-border);
      color: var(--text);
      border-bottom-left-radius: 4px;
      box-shadow: var(--shadow-sm);
    }}
    .msg-meta {{
      font-size: 11px;
      color: var(--text-faint);
      padding: 0 4px;
    }}

    /* ── Sources ── */
    .sources {{
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 6px;
      padding: 0 2px;
    }}
    .source-tag {{
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 9px;
      border-radius: 99px;
      background: var(--accent-light);
      border: 1px solid rgba(1,105,111,0.2);
      font-size: 11px;
      font-weight: 500;
      color: var(--accent);
      cursor: pointer;
      transition: background 140ms;
    }}
    .source-tag:hover {{ background: #d0e8e8; }}
    .source-preview {{
      display: none;
      margin-top: 6px;
      padding: 10px 12px;
      background: #f0f9f9;
      border: 1px solid rgba(1,105,111,0.15);
      border-radius: 10px;
      font-size: 12px;
      line-height: 1.6;
      color: var(--text-muted);
      white-space: pre-wrap;
      word-break: break-word;
    }}
    .source-preview.open {{ display: block; }}

    /* ── Typing indicator ── */
    .typing-bubble {{
      background: var(--bot-bubble);
      border: 1px solid var(--bot-border);
      box-shadow: var(--shadow-sm);
      border-radius: var(--radius-msg);
      border-bottom-left-radius: 4px;
      padding: 12px 16px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }}
    .typing-dot {{
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--text-faint);
      animation: typingBounce 1.2s ease-in-out infinite;
    }}
    .typing-dot:nth-child(2) {{ animation-delay: 0.2s; }}
    .typing-dot:nth-child(3) {{ animation-delay: 0.4s; }}
    @keyframes typingBounce {{
      0%, 60%, 100% {{ transform: translateY(0); opacity: 0.4; }}
      30%            {{ transform: translateY(-5px); opacity: 1; }}
    }}

    /* ── Copy button ── */
    .copy-btn {{
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-top: 4px;
      padding: 3px 8px;
      border-radius: 6px;
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text-faint);
      font-size: 11px;
      cursor: pointer;
      transition: color 140ms, border-color 140ms, background 140ms;
    }}
    .copy-btn:hover {{ color: var(--accent); border-color: var(--accent); background: var(--accent-light); }}
    .copy-btn.copied {{ color: #22c55e; border-color: #22c55e; background: #f0fdf4; }}

    /* ── Bottom input bar ── */
    #inputbar {{
      padding: 12px 16px 16px;
      background: var(--surface);
      border-top: 1px solid var(--border);
      flex-shrink: 0;
    }}
    #form {{
      display: flex;
      align-items: flex-end;
      gap: 10px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 8px 8px 8px 14px;
      transition: box-shadow 180ms, border-color 180ms;
    }}
    #form:focus-within {{
      border-color: var(--accent);
      box-shadow: var(--shadow-input);
    }}
    #input {{
      flex: 1;
      border: none;
      background: transparent;
      outline: none;
      font-size: 14px;
      font-family: inherit;
      color: var(--text);
      resize: none;
      max-height: 96px;
      line-height: 1.5;
      padding: 2px 0;
    }}
    #input::placeholder {{ color: var(--text-faint); }}
    #send {{
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: var(--accent);
      color: #fff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 140ms, transform 100ms;
    }}
    #send:hover  {{ background: var(--accent-hover); }}
    #send:active {{ transform: scale(0.94); }}
    #send:disabled {{ opacity: 0.4; cursor: not-allowed; transform: none; }}
    #char-hint {{
      font-size: 11px;
      color: var(--text-faint);
      text-align: right;
      margin-top: 4px;
      padding: 0 4px;
      min-height: 14px;
    }}

    /* ── Mobile ── */
    @media (max-width: 600px) {{
      #messages {{ padding: 16px 12px 8px; }}
      .msg-row {{ max-width: 88%; }}
      #inputbar {{ padding: 10px 12px 14px; }}
      #suggestions {{ padding: 12px 0 4px; }}
    }}

    /* ── Fade-in animation ── */
    @keyframes fadeUp {{
      from {{ opacity: 0; transform: translateY(6px); }}
      to   {{ opacity: 1; transform: translateY(0); }}
    }}
    .msg-row {{ animation: fadeUp 180ms ease forwards; }}
  </style>
</head>
<body>
<div id="shell">

  <!-- Header -->
  <div id="header">
    <div id="header-avatar">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </div>
    <div id="header-info">
      <div id="header-name">{bot_name}</div>
      <div id="header-status">
        <span id="status-dot"></span>
        <span>Online · Answers from your documents</span>
      </div>
    </div>
    <div id="header-badge">Powered by DocBot</div>
  </div>

  <!-- Messages -->
  <div id="messages">
    <div id="welcome">
      <div id="welcome-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <h2>Hi, I'm {bot_name}</h2>
      <p>Ask me anything — I'll answer based on the documents I've been trained on.</p>
      <div id="suggestions">
        <button class="suggestion-chip" onclick="useSuggestion(this)">📄 What topics are covered?</button>
        <button class="suggestion-chip" onclick="useSuggestion(this)">🔍 Summarize the main points</button>
        <button class="suggestion-chip" onclick="useSuggestion(this)">❓ What can you help me with?</button>
      </div>
    </div>
  </div>

  <!-- Input bar -->
  <div id="inputbar">
    <form id="form">
      <textarea id="input" rows="1" placeholder="Ask a question…" autocomplete="off"></textarea>
      <button id="send" type="submit" aria-label="Send message">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </form>
    <div id="char-hint"></div>
  </div>

</div>

<script>
  const BOT_ID  = "{bot_id}";
  const API_URL = "/public/chat/" + BOT_ID;
  const STORAGE_KEY = "docbot_session_" + BOT_ID;
  let sessionId = null;
  try {{ sessionId = localStorage.getItem(STORAGE_KEY); }} catch(e) {{}}

  const messagesEl = document.getElementById("messages");
  const welcomeEl  = document.getElementById("welcome");
  const inputEl    = document.getElementById("input");
  const sendEl     = document.getElementById("send");
  const formEl     = document.getElementById("form");
  const charHint   = document.getElementById("char-hint");

  // ── Auto-grow textarea ──
  inputEl.addEventListener("input", () => {{
    inputEl.style.height = "auto";
    inputEl.style.height = Math.min(inputEl.scrollHeight, 96) + "px";
    const len = inputEl.value.length;
    charHint.textContent = len > 400 ? len + " chars" : "";
  }});

  // ── Enter to send, Shift+Enter for newline ──
  inputEl.addEventListener("keydown", (e) => {{
    if (e.key === "Enter" && !e.shiftKey) {{
      e.preventDefault();
      formEl.dispatchEvent(new Event("submit"));
    }}
  }});

  // ── Suggestion chips ──
  function useSuggestion(btn) {{
    const text = btn.textContent.replace(/^[\\u{{1F300}}-\\u{{1FAFF}}\\s]+/u, "").trim();
    inputEl.value = text;
    inputEl.focus();
    formEl.dispatchEvent(new Event("submit"));
  }}

  // ── Add a message row ──
  function addRow(role) {{
    const row = document.createElement("div");
    row.className = "msg-row " + role;
    messagesEl.appendChild(row);
    return row;
  }}

  function addBubble(row, text) {{
    const b = document.createElement("div");
    b.className = "bubble";
    b.textContent = text;
    row.appendChild(b);
    return b;
  }}

  function addMeta(row, timeStr) {{
    const m = document.createElement("div");
    m.className = "msg-meta";
    m.textContent = timeStr;
    row.appendChild(m);
  }}

  function addTyping() {{
    const row = addRow("bot");
    const tb = document.createElement("div");
    tb.className = "typing-bubble";
    tb.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    row.appendChild(tb);
    scroll();
    return row;
  }}

  function addSources(sources) {{
    if (!sources || !sources.length) return null;
    const wrap = document.createElement("div");
    wrap.className = "sources";
    sources.forEach(s => {{
      const tag = document.createElement("button");
      tag.className = "source-tag";
      tag.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>${{s.filename}}`;
      const preview = document.createElement("div");
      preview.className = "source-preview";
      preview.textContent = s.text;
      tag.onclick = () => {{
        preview.classList.toggle("open");
        tag.style.background = preview.classList.contains("open") ? "var(--accent-light)" : "";
      }};
      wrap.appendChild(tag);
      wrap.appendChild(preview);
    }});
    return wrap;
  }}

  function addCopyBtn(row, text) {{
    const btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy`;
    btn.onclick = () => {{
      navigator.clipboard.writeText(text).then(() => {{
        btn.textContent = "✓ Copied";
        btn.classList.add("copied");
        setTimeout(() => {{
          btn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy`;
          btn.classList.remove("copied");
        }}, 2000);
      }});
    }};
    row.appendChild(btn);
  }}

  function now() {{
    return new Date().toLocaleTimeString([], {{ hour: "2-digit", minute: "2-digit" }});
  }}

  function scroll() {{
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }}

  function hideWelcome() {{
    if (welcomeEl) welcomeEl.style.display = "none";
  }}

  // ── Submit ──
  formEl.addEventListener("submit", async (e) => {{
    e.preventDefault();
    const message = inputEl.value.trim();
    if (!message) return;

    hideWelcome();
    inputEl.value = "";
    inputEl.style.height = "auto";
    charHint.textContent = "";
    sendEl.disabled = true;

    // User row
    const uRow = addRow("user");
    addBubble(uRow, message);
    addMeta(uRow, now());
    scroll();

    // Typing
    const typingRow = addTyping();

    try {{
      const res  = await fetch(API_URL, {{
        method: "POST",
        headers: {{ "Content-Type": "application/json" }},
        body: JSON.stringify({{ message, session_id: sessionId }}),
      }});
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Server error");

      sessionId = data.session_id;
      try {{ localStorage.setItem(STORAGE_KEY, sessionId); }} catch(e) {{}}

      // Replace typing with real answer
      typingRow.innerHTML = "";
      typingRow.className = "msg-row bot";
      addBubble(typingRow, data.answer);
      addMeta(typingRow, now());

      const srcs = addSources(data.sources);
      if (srcs) typingRow.appendChild(srcs);
      addCopyBtn(typingRow, data.answer);

    }} catch (err) {{
      typingRow.innerHTML = "";
      typingRow.className = "msg-row bot";
      const b = addBubble(typingRow, "Sorry, something went wrong. Please try again.");
      b.style.color = "#ef4444";
      addMeta(typingRow, now());
    }} finally {{
      sendEl.disabled = false;
      inputEl.focus();
      scroll();
    }}
  }});
</script>
</body>
</html>"""
    return HTMLResponse(content=html)


@router.get("/public/widget-snippet/{bot_id}", response_class=HTMLResponse)
async def widget_snippet(
    bot_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Returns a copyable HTML snippet to embed the chat widget on any website."""
    bot = await db.get(Bot, bot_id)
    if not bot or not bot.is_active:
        raise HTTPException(status_code=404, detail="Bot not found")

    snippet = f"""<!-- DocBot Widget — paste before </body> -->
<script>
(function() {{
  var iframe = document.createElement('iframe');
  iframe.src = '/public/chat-widget/{bot_id}';
  iframe.style.cssText = 'position:fixed;bottom:80px;right:20px;width:370px;height:500px;border:none;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.18);z-index:9999;display:none;';
  iframe.id = 'docbot-iframe';
  document.body.appendChild(iframe);

  var btn = document.createElement('button');
  btn.innerHTML = '&#x1F4AC;';
  btn.style.cssText = 'position:fixed;bottom:20px;right:20px;width:52px;height:52px;border-radius:50%;background:#01696f;color:#fff;border:none;font-size:22px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.18);z-index:9999;';
  btn.onclick = function() {{
    var f = document.getElementById('docbot-iframe');
    f.style.display = f.style.display === 'none' ? 'block' : 'none';
  }};
  document.body.appendChild(btn);
}})();
</script>"""

    return HTMLResponse(content=f"<pre style='font-family:monospace;padding:20px'>{snippet}</pre>")