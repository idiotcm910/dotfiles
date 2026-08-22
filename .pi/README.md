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
| `~/.pi/agent/skills/` | Local user skills (auto-discovered by Pi) |
| `~/.pi/agent/zentui.json` | Zentui footer/editor UI (Starship status line) |
| `~/.pi/agent/config/` | Extension configs (e.g. pi-auto-compact) |
| `~/.pi/agent/sessions/` | Chat history (not tracked) |

## Tracked in this repo

- `agent/settings.json` — packages, theme, default provider/model/thinking, compact-thinking mode, subagent model map, compaction off (handled by pi-auto-compact), fullscreen TUI
- `agent/keybindings.json` — jump to transcript end (`Ctrl+Alt+↓` / `Ctrl+Shift+B`) and top (`Ctrl+Alt+↑` / `Ctrl+Shift+T`) in fullscreen TUI (laptop-friendly, no Home/End)
- `agent/alibaba-config.json` — Alibaba plan endpoint URLs only
- `agent/zentui.json` — footer: model, context, session tokens, cost, session duration
- `agent/config/pi-auto-compact.json` — multi-model auto-compact at 60% + resume
- `agent/compact-thinking.json` — compact animated reasoning preview
- `agent/extensions/pi-rtk-optimizer/config.json`
- `agent/extensions/pi-tool-display/config.json` — hide tool results; show tool name only (`bashOutputMode: summary`)
- `agent/extensions/focus-mode.ts` — `Alt+H` hides or restores plan and subagent widgets without stopping work
- `agent/extensions/compact-tool-calls.ts` — tool headers only (name + short target); hide args/results until `Ctrl+O`
- `agent/patches/` — applies widget visibility hooks and the local `deepseek-v4-pro-0813` picker alias after Pi extension packages install
- `agent/themes/*.json`
- `agent/skills/` — local skills (UI skills + **overrides** `brainstorming` / `writing-plans` for Spec-Driven Multi-Agent plans with fixed pi-subagents model matrix; user skills win name collisions over Superpowers package)
- `agent/npm/package.json` — extension dependency input (including `pi-image-tools`, `pi-tool-display`, `pi-mcp-adapter`, compact-thinking, and the OpenCode-style `pi-todo` overlay)
- `agent/mcp.json` — Pi MCP servers (Linear official HTTP `https://mcp.linear.app/mcp`, lazy). OAuth tokens stay in the OS credential store via `/mcp-auth linear`, not in this file.

Credentials, sessions, model caches, `node_modules`, and git package checkouts
are intentionally excluded. Restore these files selectively into
`~/.pi/agent`; do not replace the whole runtime directory.

After restore, install the CLI and packages:

```bash
npm install -g @earendil-works/pi-coding-agent
# then either open pi once so packages install, or:
mkdir -p ~/.pi/agent/npm && cp .pi/agent/npm/package.json ~/.pi/agent/npm/
(cd ~/.pi/agent/npm && npm install --legacy-peer-deps)
node ~/.pi/agent/patches/apply-focus-mode.mjs
```

Re-authenticate providers inside Pi (`/login` or the auth flow) on a fresh machine.

> `deepseek-v4-pro-0813` is a local picker alias. Alibaba's Token Plan catalog
> currently advertises the stable `deepseek-v4-pro` ID, so the dated alias may
> be rejected by the remote API until Alibaba officially exposes it.
