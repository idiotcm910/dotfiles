# Pi coding agent

Portable Pi agent configuration exported from `~/.pi/agent`.

## Live config path

| Path | Role |
|---|---|
| `~/.pi/agent/` | Pi agent home (settings, auth, packages, sessions) |
| `~/.pi/agent/settings.json` | Default model/provider, theme, package list |
| `~/.pi/agent/auth.json` | Credentials (not tracked) |
| `~/.pi/agent/npm/` | Installed npm packages for extensions |
| `~/.pi/agent/extensions/` | Local extension config overrides |
| `~/.pi/agent/themes/` | Custom / selected themes |
| `~/.pi/agent/sessions/` | Chat history (not tracked) |

## Tracked in this repo

- `agent/settings.json` — packages, theme, default provider/model/thinking
- `agent/alibaba-config.json` — Alibaba plan endpoint URLs only
- `agent/extensions/pi-rtk-optimizer/config.json`
- `agent/themes/*.json`
- `agent/npm/package.json` — extension dependency lock input

Credentials, sessions, model caches, `node_modules`, and git package checkouts
are intentionally excluded. Restore these files selectively into
`~/.pi/agent`; do not replace the whole runtime directory.

After restore, install the CLI and packages:

```bash
npm install -g @earendil-works/pi-coding-agent
# then either open pi once so packages install, or:
mkdir -p ~/.pi/agent/npm && cp .pi/agent/npm/package.json ~/.pi/agent/npm/
(cd ~/.pi/agent/npm && npm install)
```

Re-authenticate providers inside Pi (`/login` or the auth flow) on a fresh machine.
