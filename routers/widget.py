from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends
from core.database import get_db
from models.bot import Bot

router = APIRouter(tags=["Widget"])


@router.get("/public/chat-widget/{bot_id}", response_class=HTMLResponse)
async def chat_widget(
    bot_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Serves a minimal embeddable chat UI for a bot. Used by the JS widget snippet."""
    bot = await db.get(Bot, bot_id)
    if not bot or not bot.is_active:
        raise HTTPException(status_code=404, detail="Bot not found")

    # bot.name is safe to embed — it's owner-controlled, not user input
    bot_name = bot.name.replace('"', "&quot;").replace("<", "&lt;").replace(">", "&gt;")

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{bot_name}</title>
  <style>
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: system-ui, sans-serif;
      font-size: 14px;
      display: flex;
      flex-direction: column;
      height: 100dvh;
      background: #f8f8f8;
      color: #1a1a1a;
    }}
    #header {{
      padding: 12px 16px;
      background: #fff;
      border-bottom: 1px solid #e5e5e5;
      font-weight: 600;
      font-size: 15px;
    }}
    #messages {{
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }}
    .msg {{
      max-width: 80%;
      padding: 10px 14px;
      border-radius: 12px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }}
    .msg.user {{
      background: #1a73e8;
      color: #fff;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }}
    .msg.bot {{
      background: #fff;
      border: 1px solid #e5e5e5;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }}
    .msg.thinking {{
      color: #888;
      font-style: italic;
    }}
    #form {{
      display: flex;
      gap: 8px;
      padding: 12px 16px;
      background: #fff;
      border-top: 1px solid #e5e5e5;
    }}
    #input {{
      flex: 1;
      padding: 9px 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
    }}
    #input:focus {{ border-color: #1a73e8; }}
    #send {{
      padding: 9px 18px;
      background: #1a73e8;
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    }}
    #send:disabled {{ opacity: 0.5; cursor: not-allowed; }}
  </style>
</head>
<body>
  <div id="header">{bot_name}</div>
  <div id="messages"></div>
  <form id="form">
    <input id="input" type="text" placeholder="Ask a question…" autocomplete="off" />
    <button id="send" type="submit">Send</button>
  </form>
  <script>
    const BOT_ID = "{bot_id}";
    const API_URL = "/public/chat/" + BOT_ID;
    let sessionId = null;

    const messagesEl = document.getElementById("messages");
    const inputEl = document.getElementById("input");
    const sendEl = document.getElementById("send");
    const formEl = document.getElementById("form");

    function addMessage(role, text) {{
      const div = document.createElement("div");
      div.className = "msg " + role;
      div.textContent = text;
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return div;
    }}

    formEl.addEventListener("submit", async (e) => {{
      e.preventDefault();
      const message = inputEl.value.trim();
      if (!message) return;
      inputEl.value = "";
      sendEl.disabled = true;

      addMessage("user", message);
      const thinking = addMessage("bot thinking", "Thinking…");

      try {{
        const res = await fetch(API_URL, {{
          method: "POST",
          headers: {{ "Content-Type": "application/json" }},
          body: JSON.stringify({{ message, session_id: sessionId }}),
        }});
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Error");
        sessionId = data.session_id;
        thinking.textContent = data.answer;
        thinking.className = "msg bot";
      }} catch (err) {{
        thinking.textContent = "Sorry, something went wrong. Please try again.";
        thinking.className = "msg bot";
      }} finally {{
        sendEl.disabled = false;
        inputEl.focus();
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
  btn.style.cssText = 'position:fixed;bottom:20px;right:20px;width:52px;height:52px;border-radius:50%;background:#1a73e8;color:#fff;border:none;font-size:22px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.18);z-index:9999;';
  btn.onclick = function() {{
    var f = document.getElementById('docbot-iframe');
    f.style.display = f.style.display === 'none' ? 'block' : 'none';
  }};
  document.body.appendChild(btn);
}})();
</script>"""

    return HTMLResponse(content=f"<pre style='font-family:monospace;padding:20px'>{snippet}</pre>")