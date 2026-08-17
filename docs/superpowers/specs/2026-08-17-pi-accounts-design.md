# Pi multi-account vault design

**Date:** 2026-08-17
**Repo:** `~/thai/system`
**Status:** Approved in chat (approach A); awaiting user review of this spec

## Goal

Give the local Pi agent a command-only vault of multiple **Antigravity** and
**xAI (Grok)** accounts. The user logs each account in once with
`/acc add`, then `/acc switch <alias>` copies that credential into Pi's
single active slot so the next request uses it. `/acc ls` shows cached
usage beside every alias; `/acc usage` refreshes those numbers.

Pi itself still stores **one credential per provider** in
`~/.pi/agent/auth.json`. This extension does not register new providers,
does not inject request headers, and does not ship a TUI picker.

## Decisions already locked

- One active account per provider (`antigravity`, `xai`).
- Add accounts with `/acc add <provider> <alias>` (dedicated OAuth, not `/login`).
- Switch with `/acc switch <alias>`. No interactive UI.
- `/acc ls` prints cached usage; `/acc usage` refreshes all (or one alias).
- Aliases are user-chosen and unique across the whole vault.
- Full CRUD: add, switch, list, usage, rename, delete, adopt.
- Approach A: vault file + swap the matching `auth.json` slot.

## Non-goals (v1)

- Auto-rotate on HTTP 429 or quota exhaustion.
- Custom TUI / overlay / model-picker clones (`antigravity-work/...`).
- Importing raw token JSON or files.
- LLM-callable tools that switch accounts.
- Managing any provider other than `antigravity` and `xai`.
- Copying `accounts.json` or `auth.json` through `restore.sh`.

## Architecture

```
/acc add|switch|ls|usage|rename|rm|adopt
                 │
                 ▼
     ~/.pi/agent/accounts.json     (vault, 0600)
                 │ activate / sync
                 ▼
     ~/.pi/agent/auth.json         (Pi slot: one cred / provider)
                 │
                 ▼
     existing providers: pi-antigravity, built-in xai
```

Source of truth in this repo:

`thai/system/.pi/agent/extensions/pi-accounts/`

Runtime copy (restore profile `ai`):

`~/.pi/agent/extensions/pi-accounts/`

The extension is a local TypeScript package discovered by Pi
(`index.ts` as the factory). It is **not** an npm package and does not
change `settings.json` `packages`.

### Two files

| File | Role |
|---|---|
| `~/.pi/agent/accounts.json` | Multi-account vault. Never committed. Mode `0600`. |
| `~/.pi/agent/auth.json` | Pi's live credential store. Only the `antigravity` and `xai` keys are written by this extension. Other keys (`openai-codex`, `alibaba-plan`, …) are left untouched. |

`accounts.json` schema:

```json
{
  "version": 1,
  "accounts": [
    {
      "id": "uuid",
      "alias": "work",
      "provider": "antigravity",
      "label": "lequocthai12b1@gmail.com",
      "active": true,
      "credential": {
        "type": "oauth",
        "access": "...",
        "refresh": "...",
        "expires": 0,
        "email": "...",
        "projectId": "..."
      },
      "usage": {
        "fetchedAt": 0,
        "ok": true,
        "summary": "Google AI Pro · Gemini 5h 72% (2h) · weekly 40% (4d)",
        "error": null
      }
    }
  ]
}
```

Rules:

- `alias` is unique across the vault (not per provider). `/acc switch work`
  does not take a provider argument.
- `provider` is only `"antigravity"` or `"xai"`.
- `label` is display-only: Google email for Antigravity; xAI subject /
  team id decoded from the access JWT when present, otherwise the alias.
- `credential` is a copy of the object Pi stores under that provider key,
  including extra fields `pi-antigravity` already writes (`email`,
  `projectId`).
- `usage` is a cache for `/acc ls`. It is not authoritative.
- At most one account per provider may have `active: true`.
- Unknown future fields in a stored credential object are preserved on
  rewrite (spread, do not strip).

### Runtime flow

1. `/acc add antigravity work` runs a **private** OAuth flow (does not
   call Pi `/login`, so it cannot clobber the current slot mid-login).
   On success the credential is appended to the vault. If that provider
   has no active account, the new account is activated (written into
   `auth.json`). If an active account already exists, the new one is
   stored only and the user is told `stored, not active`.
2. `/acc switch work` waits until the agent is idle, syncs the current
   active account for that provider from `auth.json` back into the vault
   (captures any token Pi just refreshed), then writes the chosen
   credential into `auth.json[provider]` and flips `active` flags.
3. Later model requests go through the already-registered
   `antigravity` / `xai` providers. This extension does not
   `registerProvider` and does not hook `before_provider_headers`.
4. After `session_start`, `turn_end`, and `agent_settled`, if
   `auth.json[provider]` differs from the vault's active credential
   (Pi refreshed OAuth), the vault is updated in place.
5. Built-in `/login antigravity` / `/login xai` still overwrite the
   slot. This extension does **not** intercept `/login`. The next
   `session_start` or `/acc ls` reconciles: matching active alias is
   updated; a slot that matches a non-active alias is reported, not
   auto-switched; a slot that matches no alias is reported as
   untracked and the user must `/acc adopt <alias>`.

### Auth.json cache (implementation constraint)

Pi's in-process `AuthStorage` caches `auth.json` and reloads when
`getFileRevision()` (dev/ino/size/mtimeNs/ctimeNs) changes. The public
package export is `readStoredCredential` only; **do not import
`AuthStorage`** (it is not a supported public API).

Concrete rule for implementers:

- Read slots with `readStoredCredential(provider)` or by parsing
  `auth.json`.
- Write `auth.json` atomically: take a `proper-lockfile` lock on the
  same path Pi uses, write a sibling temp file in that directory,
  `chmod 0600`, `rename` over `auth.json`, release the lock. The next
  Pi read sees the new revision and reloads.
- Never leave `auth.json` half-written. Never rewrite unrelated
  provider keys.

Vault writes use the same atomic temp+rename+0600 pattern on
`accounts.json`.

Activate order (so a failed slot write cannot strand the vault):

1. Sync the current active row from `auth.json` into the vault (no
   `active` flag change).
2. Write the chosen credential into `auth.json[provider]`.
3. Only then flip vault `active` flags.

If step 2 fails, the vault still names the previous active account and
the command errors. The next `/acc switch` or startup reconcile repairs
any remaining drift.

## Commands

All commands are slash commands. Feedback is `ctx.ui.notify` when
`ctx.hasUI`, plus `console.log`. No `ctx.ui.select` / `confirm` /
`custom()` in v1. `--force` is the only confirmation for a destructive
active-account delete.

Provider tokens accepted: `antigravity`, `agy`, `xai`, `grok`. They
normalize to `antigravity` or `xai`.

Alias grammar: `[A-Za-z0-9][A-Za-z0-9_-]{0,31}`. Reject empty, spaces,
and leading `-`.

| Command | Behavior |
|---|---|
| `/acc` | Short help and the current active alias per provider. |
| `/acc ls` | Every account, one line, cached usage. `*` marks active. Age is `(3m ago)`, `(never)`, or `(error 3m ago)`. |
| `/acc usage` | Refresh usage for every account, write cache, print the `ls` view. |
| `/acc usage <alias>` | Refresh one account, then print that line. |
| `/acc add <provider> <alias>` | OAuth for that provider; store under `alias`. Duplicate alias is a hard error. Activate only if the provider has no active account. |
| `/acc switch <alias>` | Idle → sync old active → write chosen credential into the provider slot → mark active. |
| `/acc rename <old> <new>` | Rename. `new` already taken is a hard error. |
| `/acc rm <alias>` | Delete from vault. Active account refused unless `--force`. |
| `/acc rm <alias> --force` | Delete even if active, and delete that provider key from `auth.json`. |
| `/acc adopt <alias> <provider>` | Create or overwrite vault row `alias` for that provider using the current `auth.json` slot. Marks it active for that provider (does not rewrite `auth.json`). |
| `/acc adopt <alias>` | Same, but only when `alias` already exists (provider comes from the row). New alias without provider is a usage error. If `<provider>` is passed and the existing row is a different provider, error and do not write. Adopt overwrites that row's credential and marks it the sole active account for its provider. |

`/acc ls` line format (single line, no tokens):

```
* work   antigravity  lequocthai12b1@gmail.com  Google AI Pro · Gemini 5h 72% (2h)  (3m ago)
  home   xai          7efa9590-…                xAI subscription · quota n/a       (never)
  old    antigravity  other@gmail.com           usage error: 401                   (error 3m ago)
```

Unknown alias: `unknown alias "wrok". did you mean: work, home` using
simple prefix / Levenshtein-1 suggestions from existing aliases (omit
the hint when the vault is empty).

Switch / add that must mutate live auth call `ctx.waitForIdle()` first.
They do not abort the current turn.

There is no LLM tool. The agent cannot switch accounts on its own.

## OAuth for `/acc add`

### Antigravity

Reuse the same PKCE authorization-code flow `pi-antigravity` already
implements (`loginAntigravity` in
`~/.pi/agent/npm/node_modules/pi-antigravity/src/auth/oauth.ts`):

- Auth URL `https://accounts.google.com/o/oauth2/v2/auth`
- Token URL `https://oauth2.googleapis.com/token`
- Loopback `http://localhost:51121/oauth-callback`
- Same scopes and public desktop client as `pi-antigravity`
- `prompt=consent` + `access_type=offline` so a refresh token is issued
- Persist `access`, `refresh`, `expires`, `email`, `projectId`, `type: "oauth"`

If port `51121` is busy, fail with a clear error (do not steal
`pi-antigravity`'s in-flight `/login`). Prefer importing
`loginAntigravity` from the installed `pi-antigravity` package when the
module path is resolvable; otherwise copy the flow into `oauth.ts` and
keep endpoints/scopes identical.

Drive the flow from the command handler with Pi's
`OAuthLoginCallbacks` mapped onto `ctx.ui.notify` (open URL via
`callbacks.onAuth` equivalent: print the URL; do not block on a
selector). Cancel / timeout writes nothing.

### xAI

Reuse the built-in device-code flow from `@earendil-works/pi-ai`
(`xaiOAuth` in `pi-ai/dist/auth/oauth/xai.js`):

- Device URL `https://auth.x.ai/oauth2/device/code`
- Token URL `https://auth.x.ai/oauth2/token`
- Client id `b1a00492-073a-47ea-816f-4c329264a828`
- Scope `openid profile email offline_access grok-cli:access api:access`
- Persist `{ type: "oauth", access, refresh, expires }`

Print the user code and verification HTTPS URL via notify / console.
Do not invent a second xAI client id.

`/acc add` never writes `auth.json` unless it is also activating the
new account.

## Usage

`/acc ls` never hits the network. `/acc usage` / `/acc usage <alias>`
does, using the **vault** credential of each target account (inactive
accounts included). A refresh that mints a new access/refresh token
updates **that vault row only**. `auth.json` is updated only when that
row is the active account for its provider.

### Antigravity

Call the same Cloud Code Assist quota path `pi-antigravity` uses
(`POST /v1internal:retrieveUserQuotaSummary` plus `loadCodeAssist` for
plan/tier). Prefer importing `fetchAccountUsage` /
`formatUsageSummary` from `pi-antigravity` when resolvable; otherwise
reimplement against the same endpoints.

Cache `summary` as **one line**, for example:

`Google AI Pro · Gemini 5h 72% (2h) · weekly 40% (4d) · Claude+GPT 5h 10%`

Do not dump the model catalog. `/antigravity.models` remains the
active-account model list.

### xAI

There is no public quota dashboard equivalent. v1 is best-effort:

1. If a documented subscription/quota endpoint accepts the OAuth access
   token and returns remaining/reset, format it the same way.
2. Otherwise cache `xAI subscription · quota n/a` with `ok: true`.
   Do not invent percentages.
3. HTTP 401/403 → `ok: false`, `error` short status text, keep the
   previous summary if any.

Probe candidates (implementer tries in order, ignores 404):

- `GET https://api.x.ai/v1/api-key` (or current xAI key/session info)
- any field on the access JWT that is already public in the token
  (`tier`, `team_id`) may be appended to the label, never treated as
  quota remaining

Timeout or failure of one account does not abort the rest. Failed
account: keep last good summary, set `ok: false`, `error`, continue.

No TTL. `ls` prints fetch age so the user decides when to refresh.

## Sync matrix

Only `antigravity` and `xai` slots participate.

| When | Action |
|---|---|
| `session_start` | Reconcile each slot vs vault (below). |
| After successful `/acc switch` or activating `/acc add` | Vault row → `auth.json[provider]`. |
| `turn_end` / `agent_settled` | If the active slot's `access`/`refresh`/`expires` differ from the vault row, write the slot back into that row. |
| `/acc rm --force` of the active account | Delete vault row and delete `auth.json[provider]`. |
| `/acc adopt <alias> [<provider>]` | Slot of that provider → named vault row; mark the row active. Does not rewrite `auth.json`. |

Startup reconcile per provider:

1. No slot and no vault accounts → silent.
2. Slot equals the active vault credential (refresh/access/expires or
   refresh token identity) → if the slot is newer, update the vault.
3. Slot equals a **non-active** vault credential → do **not** switch.
   Notify `auth.json <provider> != active alias <active>; matches <other>`.
4. Slot matches no vault credential → notify
   `untracked <provider> credential; /acc adopt <alias> <provider>`.
5. Vault has an active account but slot is missing → notify
   `auth.json missing <provider>; /acc switch <active-alias>` (do not
   auto-write on startup; the user may have logged out on purpose).

Equality: compare `refresh` first (stable identity), then `access` if
refresh is missing. Do not compare only `expires`.

## Errors

| Situation | Behavior |
|---|---|
| Switch / add / rm while the agent is running | `await ctx.waitForIdle()`, then proceed. Do not abort. |
| OAuth cancelled or timed out | No vault write. `add cancelled`. |
| Duplicate alias on add/rename | Error, no write. |
| Switch alias of provider A | Does not change provider B's active account. |
| Inactive account refresh during `/acc usage` | Update that vault row only. |
| Unreadable `accounts.json` | Do not touch `auth.json`. `accounts.json unreadable; fix or delete it`. |
| Network failure on one usage fetch | Keep cache, mark error, continue. |
| Active `rm` without `--force` | ` <alias> is active; switch away or pass --force`. |
| `/login` overwrites a slot | Next reconcile updates the active row or reports untracked / mismatch. No intercept. |

No auto-switch on 429. Pi surfaces the provider error; the user lists
usage and switches by hand.

## Module layout

```
.pi/agent/extensions/pi-accounts/
  index.ts       # factory: commands + session_start / turn_end / agent_settled
  store.ts       # load/save accounts.json, alias lookup, suggestions
  auth-sync.ts   # activate, adopt, reconcile, force-delete slot
  oauth.ts       # /acc add flows (Antigravity PKCE, xAI device-code)
  usage.ts       # fetch + one-line cache format
  commands.ts    # argv parse and command handlers
  README.md      # command table + which files hold secrets
```

`restore.sh` `restore_ai_config` copies the directory to
`~/.pi/agent/extensions/pi-accounts/` the same way it already copies
`focus-mode.ts`. It must **not** copy `accounts.json`.

Update:

- `.pi/README.md` — mention the extension; restate that credentials
  stay untracked.
- `tests/restore.test.sh` — dry-run `ai` profile mentions
  `pi-accounts`.
- Optional small node/tsx unit tests next to the extension for store /
  parse / format (no live OAuth in CI).

## Security

- `accounts.json` and `auth.json` are `0600`; parent dir stays `0700`
  as Pi already creates it.
- Never print `access`, `refresh`, or raw JWT in notify / ls / usage /
  errors. Redact anything that looks like `ya29.`, `1//`, or a JWT.
- Do not log vault contents.
- Do not commit vault or auth files. Repo `.pi/README.md` already says
  credentials are excluded; keep that true.

## Testing

Automated (no live OAuth):

- Store: add / rename / rm; duplicate alias; atomic write; mode 0600;
  corrupt file refused.
- Auth-sync: activate writes only the target provider key; leaves
  `openai-codex` / `alibaba-plan` intact; adopt; `--force` rm deletes
  the key; startup cases 3–5 produce the specified messages.
- Commands: provider aliases `agy` / `grok`; refuse active rm without
  `--force`; typo suggestions; alias grammar.
- Usage: one failed account does not drop the list; formatter never
  includes token-shaped strings.
- `bash -n restore.sh` and `restore.sh --dry-run --only ai` show the
  `pi-accounts` copy and do not mention `accounts.json`.

Manual smoke (after implementation, not a spec blocker):

1. `/acc add antigravity work` on a throwaway Google account.
2. `/acc add antigravity home` — stored, not active.
3. `/acc ls` then `/acc usage` — work has quota text; home too.
4. `/acc switch home` — next Antigravity request uses `home`.
5. `/acc add xai personal` if a Grok subscription is available.
6. `/login antigravity` then `/acc adopt extra antigravity` binds the
   new login without losing `work` / `home`.

## Implementation notes for the later plan

- Keep one writer for `accounts.json` inside this extension.
- Import from `pi-antigravity` and `@earendil-works/pi-ai` when those
  packages resolve from the Pi install; do not vendor tokens.
- Default execution after this spec is approved: write the
  Spec-Driven Multi-Agent plan, then wait for an explicit go before
  coding.
