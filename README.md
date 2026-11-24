# ⛏ Minecraft Panel
Tiny, iOS-styled Fabric server panel. Zero runtime deps (Node 18+, Java 21+). Discord bridge is optional.

```bash
git clone https://github.com/YOUR_NAME/mc-panel.git && cd mc-panel && npm run setup
```
Setup asks for a username + password (stored as a scrypt hash in `.env`), then serves the panel on http://localhost:8080.
Next time: `npm start`.

**Security:** scrypt hashing, constant-time compare, per-IP lockout with growing delays, HttpOnly + SameSite=Strict
sessions, CSRF header, strict CSP, path-traversal guard. Put it behind HTTPS (Caddy / Cloudflare Tunnel) before exposing it,
and set `HOST=127.0.0.1` in `.env` if the proxy is on the same machine.

**Auto-start** needs the panel to own Minecraft's port (25565) while the server sleeps. **Backups** live in `backups/` — drop any `.tar.gz` there.
