# pi-accounts

Multi-account vault extension for Pi coding agent managing **Antigravity** and **xAI (Grok)** accounts.

## Overview

`pi-accounts` provides a command-only interface (`/acc`) to store multiple OAuth credentials in a dedicated vault (`accounts.json`) and switch the active credential into Pi's credential slot (`auth.json`).

Pi continues to store **one credential per provider** in `~/.pi/agent/auth.json`. This extension does not register synthetic providers, does not inject request headers, and does not require interactive TUI pickers.

## Secrets & Security Notice

> **IMPORTANT:**
> - `~/.pi/agent/accounts.json` (the multi-account vault, permissions `0600`) and `~/.pi/agent/auth.json` (Pi's live credential store) contain sensitive OAuth refresh and access tokens.
> - **Neither file is ever committed to git.**
> - **Neither file is copied or restored by `restore.sh`.**
> - All credentials must be added interactively via `/acc add` or adopted via `/acc adopt` on fresh machines.

## Commands

All operations are executed via `/acc` slash commands:

| Command | Description |
|---|---|
| `/acc` | Display quick help and current active accounts per provider |
| `/acc ls` | List all stored accounts with cached usage and active status (`*`) |
| `/acc usage` | Fetch and update quota/usage summaries for all accounts, then display the list |
| `/acc usage <alias>` | Fetch and update usage for a single account alias |
| `/acc add <provider> <alias>` | Start dedicated OAuth login flow for `<provider>` (`antigravity` or `xai`) and store under `<alias>` |
| `/acc switch <alias>` | Wait for agent idle, sync current active credentials, and activate the specified alias |
| `/acc rename <old> <new>` | Rename an account alias |
| `/acc rm <alias>` | Delete an inactive account from the vault |
| `/acc rm <alias> --force` | Delete an account even if active (also clears the provider slot in `auth.json`) |
| `/acc adopt <alias> [provider]` | Import existing active credentials from `auth.json` into the vault under `<alias>` |

### Provider Aliases
- Antigravity: `antigravity`, `agy`
- xAI: `xai`, `grok`

### Alias Syntax
- 1 to 32 alphanumeric characters, underscores, or hyphens: `[A-Za-z0-9][A-Za-z0-9_-]{0,31}`
- Cannot start with a hyphen.

## Lifecycle & Synchronization

The extension automatically hooks into Pi session events to ensure consistency:

- **`session_start`**: Reconciles `accounts.json` against `auth.json` across all supported providers (`antigravity` and `xai`). Emits warnings if credentials mismatch or if untracked credentials exist.
- **`turn_end` & `agent_settled`**: Automatically captures any OAuth tokens refreshed by Pi and updates the active account's credential record in `accounts.json`.
- **Atomic file writes**: File modifications use locked temporary files with `0600` permissions followed by atomic renames to prevent corruption.
