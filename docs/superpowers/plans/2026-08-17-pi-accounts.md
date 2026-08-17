# Pi Multi-Account Vault Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (via pi-subagents) with **parallel waves** (`runs.all`). Fallback only if user opts out:
> superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a command-only Pi extension that stores many Antigravity and xAI accounts, switches the live `auth.json` slot, and shows cached/refreshed usage.

**Architecture:** Vault file `~/.pi/agent/accounts.json` holds every account. `/acc switch` copies one credential into Pi's single `auth.json` slot for that provider. Existing `pi-antigravity` and built-in `xai` providers stay the request path. No new provider, no header injection, no TUI.

**Tech Stack:** TypeScript Pi extension (jiti), `node:test` + `--experimental-strip-types`, Bash restore contract tests.

**Spec:** `docs/superpowers/specs/2026-08-17-pi-accounts-design.md` — binding authority.

**Execution mode:** Spec-Driven Multi-Agent · **Parallel-first**

### Agent / model matrix

Default skill matrix, **overridden for this plan** by the user:

| Role | Agent | Model | Thinking |
|------|-------|-------|----------|
| Orchestrator | main session | *(current session)* | — |
| Recon | `scout` | `antigravity/gemini-3.7-flash` | high |
| Research | `researcher` | `antigravity/gemini-3.7-flash` | high |
| Implementer | `worker` | `antigravity/gemini-3.7-flash` | high |
| Per-task reviewer | `reviewer` | `antigravity/gemini-3.7-flash` | high |
| Final reviewer | `oracle` | `openai-codex/gpt-5.6-terra` | medium |
| Oracle (risky call only) | `oracle` | `openai-codex/gpt-5.6-terra` | medium |

Do **not** use `xai/grok-4.5` or `alibaba-plan/deepseek-v4-flash-0731` on this plan.

### Lane map

| Lane | Paths | Parallel with |
|------|-------|----------------|
| shared | `.pi/agent/extensions/pi-accounts/store.ts` (types + IO primitives first) | — Wave 1 |
| vault | `store.ts`, `store.test.ts` | usage, oauth |
| usage | `usage.ts`, `usage.test.ts` | vault, oauth |
| oauth | `oauth.ts`, `oauth.test.ts` | vault, usage |
| auth | `auth-sync.ts`, `auth-sync.test.ts` | — after vault |
| cmd | `commands.ts`, `commands.test.ts` | — after auth/usage/oauth |
| glue | `index.ts`, `README.md` | infra |
| infra | `restore.sh`, `tests/restore.test.sh`, `.pi/README.md` | glue |

This is not a BE/FE web app. Lanes are file-disjoint modules of one extension.

### Parallel waves

| Wave | Mode | Tasks (ids) | Worktrees | Gate before next wave |
|------|------|-------------|-----------|------------------------|
| 0 | parallel | T0a scout-extension, T0b scout-auth | no | recon notes |
| 1 | serial | T1 store primitives + types | no | types + `atomicWrite` committed |
| 2 | **parallel** | T2 vault CRUD, T3 usage, T4 oauth | **yes** | per-task tests + reviews |
| 3 | serial | T5 auth-sync | no | auth-sync tests green |
| 4 | serial | T6 commands | no | command tests green |
| 5 | **parallel** | T7 glue index, T8 restore/docs | **yes** | restore dry-run + unit tests |
| final | parallel then serial | T9a/T9b flash reviews ∥ then T10 terra | no | ship summary |

### Orchestration

1. Dispatch **whole waves** with parallel workers — do **not** serialize T2/T3/T4 or T7/T8.
2. After each implementation wave: **parallel** fresh reviewers (`antigravity/gemini-3.7-flash` high).
3. Merge worktree handoffs at wave boundaries.
4. Wave final: two flash reviewers in parallel (correctness, tests), then one `oracle` on `openai-codex/gpt-5.6-terra` medium for the whole tree.
5. Parent synthesizes residual risks; no silent scope expansion.

## Global Constraints

- Spec is binding. No auto-rotate, no TUI, no LLM tool, no extra providers.
- Only rewrite `auth.json` keys `antigravity` and `xai`.
- Do not import `AuthStorage` (not public). Read with `readStoredCredential` or parse the file. Write with lock + temp + rename + `0600`.
- Activate order: sync old active from `auth.json` → write slot → flip vault `active` flags.
- `/acc add` must not call Pi `/login`.
- Never print `access`, `refresh`, or raw JWTs. Redact `ya29.`, `1//`, JWT-shaped strings.
- Do not commit `accounts.json` / `auth.json`. `restore.sh` must not copy them.
- Do not add an npm package or change `settings.json` `packages`.
- Tests: no live OAuth. Use `node --experimental-strip-types --test`.
- Keep existing unrelated worktree changes untouched. Commit only this feature's files.
- Repo source of truth: `thai/system/.pi/agent/extensions/pi-accounts/`.
- Alias grammar: `^[A-Za-z0-9][A-Za-z0-9_-]{0,31}$`.
- Providers: `antigravity|agy` → `antigravity`; `xai|grok` → `xai`.

---

### Task 0a: Scout extension + Pi command APIs

**Lane:** shared  
**Wave:** 0  
**Parallel group:** `scout-ext`  
**Depends on:** —  
**Owner agent:** `scout`  
**Owner model:** `antigravity/gemini-3.7-flash` (thinking: high)  
**Reviewer agent:** —  
**Context:** fresh  
**Worktree:** false  

**Files (read-only):**
- `docs/superpowers/specs/2026-08-17-pi-accounts-design.md`
- `.pi/agent/extensions/focus-mode.ts`
- `.pi/agent/extensions/compact-tool-calls.ts`
- Pi docs: `docs/extensions.md` (`registerCommand`, `session_start`, `waitForIdle`)

- [ ] **Step 1: Confirm how global extensions are discovered**

Read `~/.nvm/versions/node/v22.23.2/lib/node_modules/@earendil-works/pi-coding-agent/docs/extensions.md` (directory `index.ts` form). Note that `~/.pi/agent/extensions/pi-accounts/index.ts` auto-loads after restore copy.

- [ ] **Step 2: Write recon note for later workers**

Record: command registration signature, `ExtensionCommandContext.waitForIdle`, `ctx.ui.notify` + `console.log`, no UI dialogs. Do not commit.

---

### Task 0b: Scout auth.json + Antigravity/xAI OAuth

**Lane:** shared  
**Wave:** 0  
**Parallel group:** `scout-auth`  
**Depends on:** —  
**Owner agent:** `scout`  
**Owner model:** `antigravity/gemini-3.7-flash` (thinking: high)  
**Reviewer agent:** —  
**Context:** fresh  
**Worktree:** false  

**Files (read-only):**
- `~/.pi/agent/npm/node_modules/pi-antigravity/src/auth/oauth.ts`
- `~/.pi/agent/npm/node_modules/pi-antigravity/src/usage/usage.ts`
- `pi-ai` `dist/auth/oauth/xai.js` under the Pi install
- Pi `dist/core/auth-storage.js` (lock + revision behavior)

- [ ] **Step 1: Extract copy-safe constants**

Antigravity: AUTH_URL, TOKEN_URL, REDIRECT_URI, SCOPES, CLIENT_ID/SECRET construction, `loginAntigravity` return shape (`access`, `refresh`, `expires`, `email`, `projectId`).

xAI: device/token URLs, client id `b1a00492-073a-47ea-816f-4c329264a828`, scope string, credential `{ type, access, refresh, expires }`.

- [ ] **Step 2: Confirm usage endpoints**

`POST /v1internal:retrieveUserQuotaSummary` and `loadCodeAssist`. Note `formatUsageSummary` is multi-line — this extension must collapse to one line.

Do not commit. Do not print live tokens from `~/.pi/agent/auth.json`.

---

### Task 1: Types, paths, atomic IO

**Lane:** shared  
**Wave:** 1  
**Parallel group:** `contracts`  
**Depends on:** T0a, T0b  
**Owner agent:** `worker`  
**Owner model:** `antigravity/gemini-3.7-flash` (thinking: high)  
**Reviewer agent:** `reviewer`  
**Reviewer model:** `antigravity/gemini-3.7-flash` (thinking: high)  
**Context:** fresh for owner and reviewer  
**Worktree:** false  

**Files:**
- Create: `.pi/agent/extensions/pi-accounts/store.ts`
- Create: `.pi/agent/extensions/pi-accounts/store.test.ts`

**File lock:** `store.ts`, `store.test.ts`

**Interfaces (produce):**

```ts
export type ProviderId = "antigravity" | "xai";

export type OAuthCredential = {
  type: "oauth";
  access: string;
  refresh: string;
  expires: number;
  email?: string;
  projectId?: string;
  [key: string]: unknown;
};

export type UsageCache = {
  fetchedAt: number;
  ok: boolean;
  summary: string;
  error: string | null;
};

export type Account = {
  id: string;
  alias: string;
  provider: ProviderId;
  label: string;
  active: boolean;
  credential: OAuthCredential;
  usage?: UsageCache;
};

export type Vault = {
  version: 1;
  accounts: Account[];
};

export declare function agentDir(): string;
export declare function accountsPath(): string;
export declare function authPath(): string;
export declare function atomicWrite(filePath: string, contents: string): void;
export declare function withFileLock(lockTarget: string, fn: () => void): void;
export declare function loadVault(): Vault;
export declare function saveVault(vault: Vault): void;
```

`agentDir()` = `join(homedir(), ".pi/agent")` unless `PI_AGENT_DIR` or test override `PI_ACCOUNTS_DIR` is set. **Tests must set `PI_ACCOUNTS_DIR` to a temp dir** so they never touch the real `~/.pi/agent/accounts.json`.

`atomicWrite`: sibling `${basename}.tmp.${pid}` in the same directory, `writeFileSync` mode `0600`, `chmodSync(0600)`, `renameSync`. Parent dir `mkdirSync(..., { recursive: true, mode: 0o700 })`.

`withFileLock(lockTarget, fn)`: exclusive create `${lockTarget}.lock` (`wx`, `0600`), retry 10 × 20ms, always unlink in `finally`. Used for both vault and auth.json. Document that this is the extension lock; Pi also locks `auth.json` via `proper-lockfile` — keep critical sections short.

`loadVault`: missing file → `{ version: 1, accounts: [] }`. Unreadable / non-object / bad version → throw `accounts.json unreadable; fix or delete it`.

`saveVault`: `JSON.stringify(vault, null, 2) + "\n"` via `withFileLock(accountsPath(), () => atomicWrite(...))`.

- [ ] **Step 1: Write the failing test**

Create `store.test.ts`:

```ts
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { atomicWrite, loadVault, saveVault } from "./store.ts";

function isolatedDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "pi-acc-"));
  process.env.PI_ACCOUNTS_DIR = dir;
  mkdirSync(join(dir), { recursive: true, mode: 0o700 });
  return dir;
}

test("atomicWrite creates 0600 file", () => {
  const dir = isolatedDir();
  const file = join(dir, "sample.json");
  atomicWrite(file, '{"ok":true}\n');
  assert.equal(readFileSync(file, "utf8"), '{"ok":true}\n');
  assert.equal(statSync(file).mode & 0o777, 0o600);
});

test("loadVault missing file returns empty vault", () => {
  isolatedDir();
  assert.deepEqual(loadVault(), { version: 1, accounts: [] });
});

test("loadVault refuses corrupt file", () => {
  const dir = isolatedDir();
  writeFileSync(join(dir, "accounts.json"), "{not-json", { mode: 0o600 });
  assert.throws(() => loadVault(), /accounts\.json unreadable/);
});

test("saveVault then loadVault roundtrips", () => {
  isolatedDir();
  const vault = {
    version: 1 as const,
    accounts: [
      {
        id: "id-1",
        alias: "work",
        provider: "antigravity" as const,
        label: "a@b.com",
        active: true,
        credential: {
          type: "oauth" as const,
          access: "tok",
          refresh: "ref",
          expires: 1,
        },
      },
    ],
  };
  saveVault(vault);
  assert.deepEqual(loadVault(), vault);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd .pi/agent/extensions/pi-accounts && node --experimental-strip-types --test store.test.ts`  
Expected: FAIL (module not found or exports missing).

- [ ] **Step 3: Write minimal implementation**

Implement `store.ts` with the interfaces above. Include `export function setAccountsDirForTest(dir: string)` **or** honor `PI_ACCOUNTS_DIR` as the directory containing `accounts.json` and `auth.json` (tests set it to the temp dir). Prefer env override so later tasks share the same hook:

```ts
export function agentDir(): string {
  return process.env.PI_ACCOUNTS_DIR || join(homedir(), ".pi/agent");
}
export function accountsPath(): string {
  return join(agentDir(), "accounts.json");
}
export function authPath(): string {
  return join(agentDir(), "auth.json");
}
```

Do **not** implement add/rename/rm yet — those are Task 2. Stubs may exist as later exports only if Task 2 owns them; keep Task 1 limited to types + IO.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd .pi/agent/extensions/pi-accounts && node --experimental-strip-types --test store.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .pi/agent/extensions/pi-accounts/store.ts .pi/agent/extensions/pi-accounts/store.test.ts
git commit -m "Add pi-accounts vault IO and types"
```

---

### Task 2: Vault CRUD + alias suggestions

**Lane:** vault  
**Wave:** 2  
**Parallel group:** `vault-crud`  
**Depends on:** T1  
**Owner agent:** `worker`  
**Owner model:** `antigravity/gemini-3.7-flash` (thinking: high)  
**Reviewer agent:** `reviewer`  
**Reviewer model:** `antigravity/gemini-3.7-flash` (thinking: high)  
**Context:** fresh  
**Worktree:** true  

**Files:**
- Modify: `.pi/agent/extensions/pi-accounts/store.ts`
- Modify: `.pi/agent/extensions/pi-accounts/store.test.ts`

**File lock:** `store.ts`, `store.test.ts`

**Interfaces (produce):**

```ts
export declare const ALIAS_RE: RegExp; // /^[A-Za-z0-9][A-Za-z0-9_-]{0,31}$/
export declare function assertAlias(alias: string): void; // throws `invalid alias "..."`
export declare function normalizeProvider(raw: string): ProviderId; // throws `unknown provider "..."`
export declare function suggestAlias(input: string, aliases: string[]): string[];
export declare function findByAlias(vault: Vault, alias: string): Account | undefined;
export declare function activeAccount(vault: Vault, provider: ProviderId): Account | undefined;
export declare function addAccount(vault: Vault, account: Account): Vault; // throws on dup alias
export declare function renameAccount(vault: Vault, from: string, to: string): Vault;
export declare function removeAccount(vault: Vault, alias: string): Vault;
export declare function setActive(vault: Vault, alias: string): Vault; // sole active for that provider
export declare function upsertAccount(vault: Vault, account: Account): Vault;
export declare function updateUsage(vault: Vault, alias: string, usage: UsageCache): Vault;
```

`suggestAlias`: include aliases with the same prefix **or** Levenshtein distance ≤ 1; max 5; stable sort. Empty vault → `[]`.

`setActive`: set `active: true` on the named account; set `active: false` on every other account with the **same provider**; leave the other provider alone.

`addAccount` / `renameAccount`: duplicate alias → throw `alias "x" already exists`. Missing alias → throw `unknown alias "x"`.

Preserve unknown credential fields (spread).

- [ ] **Step 1: Write the failing tests** (append to `store.test.ts`)

```ts
import {
  addAccount,
  normalizeProvider,
  removeAccount,
  renameAccount,
  setActive,
  suggestAlias,
  assertAlias,
} from "./store.ts";

test("normalizeProvider accepts agy and grok", () => {
  assert.equal(normalizeProvider("agy"), "antigravity");
  assert.equal(normalizeProvider("GROK"), "xai");
  assert.throws(() => normalizeProvider("openai"), /unknown provider/);
});

test("assertAlias rejects leading dash and spaces", () => {
  assert.throws(() => assertAlias("-x"), /invalid alias/);
  assert.throws(() => assertAlias("my acc"), /invalid alias/);
  assertAlias("work_1");
});

test("addAccount rejects duplicate alias", () => {
  const empty = { version: 1 as const, accounts: [] };
  const once = addAccount(empty, {
    id: "1",
    alias: "work",
    provider: "antigravity",
    label: "a",
    active: true,
    credential: { type: "oauth", access: "a", refresh: "r", expires: 1 },
  });
  assert.throws(
    () =>
      addAccount(once, {
        id: "2",
        alias: "work",
        provider: "xai",
        label: "b",
        active: true,
        credential: { type: "oauth", access: "a", refresh: "r", expires: 1 },
      }),
    /already exists/,
  );
});

test("setActive is per provider", () => {
  let vault = { version: 1 as const, accounts: [] };
  vault = addAccount(vault, {
    id: "1",
    alias: "work",
    provider: "antigravity",
    label: "a",
    active: true,
    credential: { type: "oauth", access: "a", refresh: "r", expires: 1 },
  });
  vault = addAccount(vault, {
    id: "2",
    alias: "home",
    provider: "antigravity",
    label: "b",
    active: false,
    credential: { type: "oauth", access: "a", refresh: "r", expires: 1 },
  });
  vault = addAccount(vault, {
    id: "3",
    alias: "personal",
    provider: "xai",
    label: "c",
    active: true,
    credential: { type: "oauth", access: "a", refresh: "r", expires: 1 },
  });
  vault = setActive(vault, "home");
  assert.equal(vault.accounts.find((a) => a.alias === "work")?.active, false);
  assert.equal(vault.accounts.find((a) => a.alias === "home")?.active, true);
  assert.equal(vault.accounts.find((a) => a.alias === "personal")?.active, true);
});

test("suggestAlias finds prefix and distance-1", () => {
  assert.deepEqual(suggestAlias("wrok", ["work", "home"]), ["work"]);
  assert.deepEqual(suggestAlias("ho", ["work", "home"]), ["home"]);
  assert.deepEqual(suggestAlias("x", []), []);
});

test("rename and remove", () => {
  let vault = addAccount(
    { version: 1, accounts: [] },
    {
      id: "1",
      alias: "work",
      provider: "xai",
      label: "c",
      active: true,
      credential: { type: "oauth", access: "a", refresh: "r", expires: 1 },
    },
  );
  vault = renameAccount(vault, "work", "lab");
  assert.equal(vault.accounts[0]?.alias, "lab");
  vault = removeAccount(vault, "lab");
  assert.equal(vault.accounts.length, 0);
});
```

- [ ] **Step 2: Run tests (expect FAIL on missing exports)**

Run: `cd .pi/agent/extensions/pi-accounts && node --experimental-strip-types --test store.test.ts`

- [ ] **Step 3: Implement CRUD in `store.ts`**

- [ ] **Step 4: Run tests (expect PASS)**

- [ ] **Step 5: Commit**

```bash
git add .pi/agent/extensions/pi-accounts/store.ts .pi/agent/extensions/pi-accounts/store.test.ts
git commit -m "Add pi-accounts vault CRUD and alias helpers"
```

---

### Task 3: Usage fetch + one-line format + redact

**Lane:** usage  
**Wave:** 2  
**Parallel group:** `usage`  
**Depends on:** T1  
**Owner agent:** `worker`  
**Owner model:** `antigravity/gemini-3.7-flash` (thinking: high)  
**Reviewer agent:** `reviewer`  
**Reviewer model:** `antigravity/gemini-3.7-flash` (thinking: high)  
**Context:** fresh  
**Worktree:** true  

**Files:**
- Create: `.pi/agent/extensions/pi-accounts/usage.ts`
- Create: `.pi/agent/extensions/pi-accounts/usage.test.ts`

**File lock:** `usage.ts`, `usage.test.ts`

**Interfaces:**

```ts
import type { Account, UsageCache } from "./store.ts";

export declare function redactSecrets(text: string): string;
export declare function formatAge(fetchedAt: number | undefined, ok: boolean | undefined, now?: number): string;
export declare function formatLsLine(account: Account, now?: number): string;
export declare function collapseAgySummary(multiLine: string): string;
export declare function formatXaiSummary(opts: { quotaLine?: string; labelExtra?: string }): string;
export declare function fetchAccountUsageCache(
  account: Account,
  deps?: {
    fetchAgy?: (account: Account) => Promise<string>;
    fetchXai?: (account: Account) => Promise<string | undefined>;
    now?: () => number;
  },
): Promise<UsageCache>;
```

Rules from spec:

- `redactSecrets`: replace `ya29.[A-Za-z0-9._-]+`, `1//[A-Za-z0-9._-]+`, and JWT (`eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+`) with `[redacted]`.
- `formatAge`: no `fetchedAt` → `(never)`; `ok === false` → `(error 3m ago)` (same age helper); else `(3m ago)` / `(now)` if < 30s.
- `formatLsLine`:

```
* work   antigravity  lequocthai12b1@gmail.com  Google AI Pro · Gemini 5h 72% (2h)  (3m ago)
```

  `*` if active else two spaces. Columns: alias (padded 8), provider (12), label, summary or `usage error: …` if `ok === false` and `error` set (if summary exists and `ok === false`, still show `usage error: ${error}`). Never include credential fields.
- `collapseAgySummary`: first line if it looks like a plan name, then each `Name: N% left · resets X` collapsed to `Name N% (X)` joined with ` · `. If import of `formatUsageSummary` is used, still collapse.
- `formatXaiSummary`: default `xAI subscription · quota n/a`. Optional extra label (tier/team) appended, never a fake percent.
- `fetchAccountUsageCache`:
  - antigravity: call `deps.fetchAgy` or real Cloud Code Assist quota (same endpoints as `pi-antigravity`). Prefer dynamic import of `fetchAccountUsage` + `formatUsageSummary` from `~/.pi/agent/npm/node_modules/pi-antigravity/src/usage/index.ts` via `pathToFileURL`; on import failure, POST the two endpoints with `Authorization: Bearer ${access}` yourself. Collapse to one line. Success → `{ ok: true, summary, error: null, fetchedAt }`.
  - xAI: try `deps.fetchXai` or `GET https://api.x.ai/v1/api-key` with Bearer access. 404 / no remaining fields → `ok: true`, `xAI subscription · quota n/a`. 401/403 → `ok: false`, `error` like `401`, keep previous `account.usage.summary` if present.
  - thrown error → `ok: false`, `error` = redacted short message, keep previous summary.
  - Do not write `auth.json` here.

- [ ] **Step 1: Write failing tests**

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  collapseAgySummary,
  fetchAccountUsageCache,
  formatAge,
  formatLsLine,
  formatXaiSummary,
  redactSecrets,
} from "./usage.ts";
import type { Account } from "./store.ts";

const base: Account = {
  id: "1",
  alias: "work",
  provider: "antigravity",
  label: "a@b.com",
  active: true,
  credential: {
    type: "oauth",
    access: "ya29.secret-token-value",
    refresh: "1//refresh-token-value",
    expires: 1,
  },
};

test("redactSecrets strips google tokens and jwt", () => {
  const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abc";
  const out = redactSecrets(`tok ya29.secret-token-value ${jwt} 1//refresh-token-value`);
  assert.equal(out.includes("ya29."), false);
  assert.equal(out.includes("eyJ"), false);
  assert.equal(out.includes("1//"), false);
  assert.match(out, /\[redacted\]/);
});

test("formatAge never / error / minutes", () => {
  const now = 1_000_000;
  assert.equal(formatAge(undefined, true, now), "(never)");
  assert.equal(formatAge(now - 3 * 60_000, false, now), "(error 3m ago)");
  assert.equal(formatAge(now - 3 * 60_000, true, now), "(3m ago)");
});

test("formatLsLine does not include tokens", () => {
  const line = formatLsLine(
    {
      ...base,
      usage: { fetchedAt: 1, ok: true, summary: "Google AI Pro · Gemini 5h 72% (2h)", error: null },
    },
    1 + 180_000,
  );
  assert.match(line, /^\* work/);
  assert.equal(line.includes("ya29"), false);
  assert.equal(line.includes("1//"), false);
});

test("collapseAgySummary is one line", () => {
  const raw = [
    "Google AI Pro",
    "",
    "Gemini",
    "  [####] 5h: 72% left · resets 2h",
    "  [##] weekly: 40% left · resets 4d",
  ].join("\n");
  const one = collapseAgySummary(raw);
  assert.equal(one.includes("\n"), false);
  assert.match(one, /Google AI Pro/);
});

test("formatXaiSummary never invents percent", () => {
  assert.equal(formatXaiSummary({}), "xAI subscription · quota n/a");
});

test("one failed fetch does not throw", async () => {
  const failed = await fetchAccountUsageCache(base, {
    fetchAgy: async () => {
      throw new Error("401 ya29.secret-token-value");
    },
  });
  assert.equal(failed.ok, false);
  assert.equal(failed.error?.includes("ya29"), false);
});

test("xai 401 keeps previous summary", async () => {
  const acc: Account = {
    ...base,
    provider: "xai",
    usage: { fetchedAt: 1, ok: true, summary: "xAI subscription · quota n/a", error: null },
  };
  const next = await fetchAccountUsageCache(acc, {
    fetchXai: async () => {
      const err = new Error("401");
      (err as Error & { status?: number }).status = 401;
      throw err;
    },
  });
  assert.equal(next.ok, false);
  assert.equal(next.summary, "xAI subscription · quota n/a");
});
```

- [ ] **Step 2: Run (expect FAIL)**

`cd .pi/agent/extensions/pi-accounts && node --experimental-strip-types --test usage.test.ts`

- [ ] **Step 3: Implement `usage.ts`**

For Antigravity real fetch (when `deps.fetchAgy` omitted): build the same JSON key `pi-antigravity` expects (`JSON.stringify({ token: access, projectId })`) if calling `fetchAccountUsage`. Collapse the multi-line summary.

For xAI real fetch: `GET https://api.x.ai/v1/api-key` with 8s timeout. Ignore 404. If JSON has an obvious remaining/reset field, format it; otherwise `quota n/a`. Decode JWT payload (base64url, no verify) only for `tier` / `team_id` → label extra, never quota %.

- [ ] **Step 4: Run (expect PASS)**

- [ ] **Step 5: Commit**

```bash
git add .pi/agent/extensions/pi-accounts/usage.ts .pi/agent/extensions/pi-accounts/usage.test.ts
git commit -m "Add pi-accounts usage formatting and fetch"
```

---

### Task 4: OAuth add flows (no /login)

**Lane:** oauth  
**Wave:** 2  
**Parallel group:** `oauth`  
**Depends on:** T1  
**Owner agent:** `worker`  
**Owner model:** `antigravity/gemini-3.7-flash` (thinking: high)  
**Reviewer agent:** `reviewer`  
**Reviewer model:** `antigravity/gemini-3.7-flash` (thinking: high)  
**Context:** fresh  
**Worktree:** true  

**Files:**
- Create: `.pi/agent/extensions/pi-accounts/oauth.ts`
- Create: `.pi/agent/extensions/pi-accounts/oauth.test.ts`

**File lock:** `oauth.ts`, `oauth.test.ts`

**Interfaces:**

```ts
import type { OAuthCredential, ProviderId } from "./store.ts";

export type AddNotifier = {
  notify: (message: string) => void;
  log: (message: string) => void;
};

export declare function labelFromCredential(provider: ProviderId, cred: OAuthCredential): string;
export declare function loginProvider(
  provider: ProviderId,
  notifier: AddNotifier,
  deps?: {
    loginAgy?: () => Promise<OAuthCredential>;
    loginXai?: () => Promise<OAuthCredential>;
  },
): Promise<OAuthCredential>;
```

Real `loginProvider` (no deps):

- **antigravity:** Prefer `loginAntigravity` from `pi-antigravity` via `pathToFileURL(join(homedir(), ".pi/agent/npm/node_modules/pi-antigravity/src/auth/index.ts"))`. Map callbacks: `onAuth({ url })` → notify + log the URL (do not open a selector). If import fails, copy the PKCE + loopback flow from that file (same URLs, scopes, client, port `51121`). Busy port → throw `OAuth callback port 51121 is busy; retry when /login antigravity is not running`.
- **xAI:** Prefer `xaiOAuth.login` from `@earendil-works/pi-ai` if resolvable. Else copy device-code constants from recon (do **not** invent a client id). Notify user code + HTTPS verification URI. Persist `{ type: "oauth", access, refresh, expires }`.
- Cancel/timeout → throw `add cancelled` (caller writes nothing).
- `labelFromCredential`: antigravity → `email` or alias fallback later; xAI → JWT `sub` or `team_id` if decodable, else empty string (commands layer falls back to alias).

This task's tests **must not** open a browser or listen on 51121. Inject `deps.loginAgy` / `deps.loginXai`.

- [ ] **Step 1: Write failing tests**

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { labelFromCredential, loginProvider } from "./oauth.ts";

test("labelFromCredential uses email and jwt sub", () => {
  assert.equal(
    labelFromCredential("antigravity", {
      type: "oauth",
      access: "a",
      refresh: "r",
      expires: 1,
      email: "a@b.com",
    }),
    "a@b.com",
  );
});

test("loginProvider uses injected logins and does not throw tokens", async () => {
  const notes: string[] = [];
  const cred = await loginProvider(
    "antigravity",
    { notify: (m) => notes.push(m), log: (m) => notes.push(m) },
    {
      loginAgy: async () => ({
        type: "oauth",
        access: "ya29.secret-token-value",
        refresh: "1//refresh-token-value",
        expires: 9,
        email: "a@b.com",
        projectId: "p",
      }),
    },
  );
  assert.equal(cred.email, "a@b.com");
  assert.equal(notes.join(" ").includes("ya29"), false);
});

test("loginProvider cancel becomes add cancelled", async () => {
  await assert.rejects(
    () =>
      loginProvider(
        "xai",
        { notify: () => {}, log: () => {} },
        {
          loginXai: async () => {
            throw new Error("Login cancelled");
          },
        },
      ),
    /add cancelled/,
  );
});
```

- [ ] **Step 2: Run (expect FAIL)**

- [ ] **Step 3: Implement `oauth.ts`** (real import + fallback copy; tests only hit deps)

- [ ] **Step 4: Run (expect PASS)**

- [ ] **Step 5: Commit**

```bash
git add .pi/agent/extensions/pi-accounts/oauth.ts .pi/agent/extensions/pi-accounts/oauth.test.ts
git commit -m "Add pi-accounts OAuth add wrappers"
```

---

### Task 5: auth.json sync, adopt, force-delete

**Lane:** auth  
**Wave:** 3  
**Parallel group:** `auth-sync`  
**Depends on:** T2  
**Owner agent:** `worker`  
**Owner model:** `antigravity/gemini-3.7-flash` (thinking: high)  
**Reviewer agent:** `reviewer`  
**Reviewer model:** `antigravity/gemini-3.7-flash` (thinking: high)  
**Context:** fresh  
**Worktree:** false  

**Files:**
- Create: `.pi/agent/extensions/pi-accounts/auth-sync.ts`
- Create: `.pi/agent/extensions/pi-accounts/auth-sync.test.ts`

**File lock:** `auth-sync.ts`, `auth-sync.test.ts`

**Interfaces:**

```ts
import type { Account, OAuthCredential, ProviderId, Vault } from "./store.ts";

export type ReconcileMessage = { level: "info" | "warning"; text: string };

export declare function readAuthSlot(provider: ProviderId): OAuthCredential | undefined;
export declare function writeAuthSlot(provider: ProviderId, cred: OAuthCredential): void;
export declare function deleteAuthSlot(provider: ProviderId): void;
export declare function credentialsEqual(a?: OAuthCredential, b?: OAuthCredential): boolean;
export declare function isNewer(slot: OAuthCredential, vault: OAuthCredential): boolean;
export declare function syncActiveFromAuth(vault: Vault, provider: ProviderId): Vault;
export declare function activate(vault: Vault, alias: string): { vault: Vault };
export declare function adopt(
  vault: Vault,
  alias: string,
  provider?: ProviderId,
): { vault: Vault };
export declare function forceRemoveActive(vault: Vault, alias: string): { vault: Vault };
export declare function reconcileProvider(vault: Vault, provider: ProviderId): {
  vault: Vault;
  messages: ReconcileMessage[];
};
```

`readAuthSlot` / `writeAuthSlot` / `deleteAuthSlot`:

- Path = `authPath()` from store (honors `PI_ACCOUNTS_DIR`).
- Read: parse JSON object; missing file → `undefined`.
- Write: `withFileLock(authPath(), () => { parse or {}; set only that key; atomicWrite pretty JSON })`.
- Delete: same lock; `delete data[provider]`; write remaining keys **untouched**.
- Extra keys like `openai-codex` / `alibaba-plan` must survive.

`credentialsEqual`: compare `refresh` if both have it; else `access`. Do not compare only `expires`.

`isNewer`: `slot.expires > vault.expires` or (same expires and `slot.access !== vault.access`).

`syncActiveFromAuth`: if there is an active account for provider and the slot exists, copy slot credential onto that row (preserve unknown fields via spread). No `active` flag change.

`activate` (spec order):

1. `vault = syncActiveFromAuth(vault, account.provider)`
2. `writeAuthSlot(provider, chosen.credential)` — if this throws, do not flip flags; rethrow
3. `vault = setActive(vault, alias)`
4. `saveVault(vault)`

`adopt`:

- Existing alias + omitted provider → use row provider.
- New alias + omitted provider → throw usage `adopt requires <alias> <provider>`.
- Existing alias + different provider → throw `alias "x" is antigravity, not xai`.
- Empty slot → throw `no auth.json credential for <provider>`.
- Upsert row from slot; `setActive`; `saveVault`. Do **not** write `auth.json`.

`forceRemoveActive`: `removeAccount`; `deleteAuthSlot`; `saveVault`.

`reconcileProvider` (startup cases):

1. No slot and no vault accounts for provider → no message.
2. Slot equals active → if newer, update vault row + save; no message required.
3. Slot equals a non-active row → warning `auth.json <provider> != active alias <active>; matches <other>` (if no active, still warn with `none`).
4. Slot matches no row → warning `untracked <provider> credential; /acc adopt <alias> <provider>`.
5. Active row exists, slot missing → warning `auth.json missing <provider>; /acc switch <active-alias>`. Do not auto-write.

- [ ] **Step 1: Write failing tests** using `PI_ACCOUNTS_DIR`

Cover: write only `xai` leaves `openai-codex` intact; activate order (mock `writeAuthSlot` failure by making auth dir a file if needed, or export a test hook — **prefer real IO**); adopt new alias requires provider; force remove deletes key; reconcile cases 3–5 exact message prefixes.

```ts
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { addAccount, saveVault, type Vault } from "./store.ts";
import {
  activate,
  adopt,
  forceRemoveActive,
  reconcileProvider,
  writeAuthSlot,
} from "./auth-sync.ts";

function iso(): void {
  const dir = mkdtempSync(join(tmpdir(), "pi-acc-"));
  process.env.PI_ACCOUNTS_DIR = dir;
  mkdirSync(dir, { recursive: true, mode: 0o700 });
}

function seedAuth(extra: Record<string, unknown> = {}): void {
  writeFileSync(
    join(process.env.PI_ACCOUNTS_DIR!, "auth.json"),
    JSON.stringify(
      {
        "openai-codex": { type: "oauth", access: "keep", refresh: "keep", expires: 1 },
        "alibaba-plan": { type: "oauth", access: "keep2", refresh: "keep2", expires: 1 },
        ...extra,
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
}

function emptyVault(): Vault {
  return { version: 1, accounts: [] };
}

test("writeAuthSlot does not touch other providers", () => {
  iso();
  seedAuth();
  writeAuthSlot("xai", { type: "oauth", access: "new", refresh: "newr", expires: 2 });
  const parsed = JSON.parse(readFileSync(join(process.env.PI_ACCOUNTS_DIR!, "auth.json"), "utf8"));
  assert.equal(parsed["openai-codex"].access, "keep");
  assert.equal(parsed["alibaba-plan"].access, "keep2");
  assert.equal(parsed.xai.access, "new");
});

test("activate writes slot then marks active", () => {
  iso();
  seedAuth();
  let vault = addAccount(emptyVault(), {
    id: "1",
    alias: "work",
    provider: "antigravity",
    label: "a",
    active: true,
    credential: { type: "oauth", access: "old", refresh: "oldr", expires: 1 },
  });
  vault = addAccount(vault, {
    id: "2",
    alias: "home",
    provider: "antigravity",
    label: "b",
    active: false,
    credential: { type: "oauth", access: "homeA", refresh: "homeR", expires: 2 },
  });
  saveVault(vault);
  writeAuthSlot("antigravity", { type: "oauth", access: "old", refresh: "oldr", expires: 1 });
  const result = activate(vault, "home");
  const parsed = JSON.parse(readFileSync(join(process.env.PI_ACCOUNTS_DIR!, "auth.json"), "utf8"));
  assert.equal(parsed.antigravity.access, "homeA");
  assert.equal(parsed["openai-codex"].access, "keep");
  assert.equal(result.vault.accounts.find((a) => a.alias === "home")?.active, true);
  assert.equal(result.vault.accounts.find((a) => a.alias === "work")?.active, false);
});

test("adopt new alias requires provider", () => {
  iso();
  seedAuth({ xai: { type: "oauth", access: "s", refresh: "r", expires: 3 } });
  saveVault(emptyVault());
  assert.throws(() => adopt(emptyVault(), "personal"), /adopt requires/);
  const result = adopt(emptyVault(), "personal", "xai");
  assert.equal(result.vault.accounts[0]?.alias, "personal");
  assert.equal(result.vault.accounts[0]?.active, true);
});

test("forceRemoveActive deletes provider key only", () => {
  iso();
  seedAuth({ xai: { type: "oauth", access: "s", refresh: "r", expires: 3 } });
  let vault = addAccount(emptyVault(), {
    id: "1",
    alias: "personal",
    provider: "xai",
    label: "c",
    active: true,
    credential: { type: "oauth", access: "s", refresh: "r", expires: 3 },
  });
  saveVault(vault);
  const result = forceRemoveActive(vault, "personal");
  const parsed = JSON.parse(readFileSync(join(process.env.PI_ACCOUNTS_DIR!, "auth.json"), "utf8"));
  assert.equal(parsed.xai, undefined);
  assert.equal(parsed["openai-codex"].access, "keep");
  assert.equal(result.vault.accounts.length, 0);
});

test("reconcile mismatch and untracked and missing slot", () => {
  iso();
  let vault = addAccount(emptyVault(), {
    id: "1",
    alias: "work",
    provider: "antigravity",
    label: "a",
    active: true,
    credential: { type: "oauth", access: "a1", refresh: "r1", expires: 1 },
  });
  vault = addAccount(vault, {
    id: "2",
    alias: "home",
    provider: "antigravity",
    label: "b",
    active: false,
    credential: { type: "oauth", access: "a2", refresh: "r2", expires: 1 },
  });
  saveVault(vault);
  writeAuthSlot("antigravity", { type: "oauth", access: "a2", refresh: "r2", expires: 1 });
  const mismatch = reconcileProvider(vault, "antigravity");
  assert.match(mismatch.messages[0]?.text ?? "", /!= active alias work; matches home/);

  writeAuthSlot("antigravity", { type: "oauth", access: "zz", refresh: "zzr", expires: 1 });
  const untracked = reconcileProvider(vault, "antigravity");
  assert.match(untracked.messages[0]?.text ?? "", /untracked antigravity credential/);

  // missing slot
  writeFileSync(
    join(process.env.PI_ACCOUNTS_DIR!, "auth.json"),
    JSON.stringify({ "openai-codex": { type: "oauth", access: "k", refresh: "k", expires: 1 } }),
    { mode: 0o600 },
  );
  const missing = reconcileProvider(vault, "antigravity");
  assert.match(missing.messages[0]?.text ?? "", /auth.json missing antigravity; \/acc switch work/);
});
```

- [ ] **Step 2: Run (expect FAIL)**

`cd .pi/agent/extensions/pi-accounts && node --experimental-strip-types --test auth-sync.test.ts`

- [ ] **Step 3: Implement `auth-sync.ts`**

- [ ] **Step 4: Run store + auth-sync tests (expect PASS)**

`cd .pi/agent/extensions/pi-accounts && node --experimental-strip-types --test store.test.ts auth-sync.test.ts`

- [ ] **Step 5: Commit**

```bash
git add .pi/agent/extensions/pi-accounts/auth-sync.ts .pi/agent/extensions/pi-accounts/auth-sync.test.ts
git commit -m "Add pi-accounts auth.json slot sync"
```

---

### Task 6: `/acc` command parser and handlers

**Lane:** cmd  
**Wave:** 4  
**Parallel group:** `commands`  
**Depends on:** T2, T3, T4, T5  
**Owner agent:** `worker`  
**Owner model:** `antigravity/gemini-3.7-flash` (thinking: high)  
**Reviewer agent:** `reviewer`  
**Reviewer model:** `antigravity/gemini-3.7-flash` (thinking: high)  
**Context:** fresh  
**Worktree:** false  

**Files:**
- Create: `.pi/agent/extensions/pi-accounts/commands.ts`
- Create: `.pi/agent/extensions/pi-accounts/commands.test.ts`

**File lock:** `commands.ts`, `commands.test.ts`

**Interfaces:**

```ts
export type AccResult = { text: string; kind: "info" | "warning" | "error" };

export declare function parseAccArgs(args: string): {
  cmd: "help" | "ls" | "usage" | "add" | "switch" | "rename" | "rm" | "adopt";
  alias?: string;
  provider?: string;
  newAlias?: string;
  force?: boolean;
};

export declare function unknownAliasMessage(alias: string, aliases: string[]): string;

export type AccDeps = {
  waitForIdle?: () => Promise<void>;
  login?: typeof import("./oauth.ts").loginProvider;
  fetchUsage?: typeof import("./usage.ts").fetchAccountUsageCache;
};

export declare function runAcc(args: string, deps?: AccDeps): Promise<AccResult>;
```

`parseAccArgs` examples:

- `""` / `help` → help
- `ls`
- `usage` / `usage work`
- `add antigravity work` / `add agy work`
- `switch work`
- `rename work home`
- `rm work` / `rm work --force` / `rm --force work`
- `adopt work` / `adopt extra antigravity`

`unknownAliasMessage`: `unknown alias "wrok". did you mean: work, home` using `suggestAlias`. No hint if none.

`runAcc` uses `PI_ACCOUNTS_DIR`-aware store. Behaviors exactly as spec table. `add` / `switch` / `rm` / `adopt` call `waitForIdle` if provided (commands layer always calls it when `deps.waitForIdle` exists; `index.ts` passes `ctx.waitForIdle`).

`add`: login via deps or `loginProvider`; `assertAlias`; `addAccount`; if no active for that provider, `activate`; else `saveVault` only; text `added work (antigravity, a@b.com) [active]` or `[stored]`.

`switch`: unknown alias error; `activate`; `switched antigravity → work (a@b.com)`.

`rm` active without force: error `<alias> is active; switch away or pass --force`.

`ls`: join `formatLsLine` with `\n`. On unreadable vault: error `accounts.json unreadable; fix or delete it` (do not touch auth.json).

`usage` / `usage alias`: for each target, `fetchAccountUsageCache`; if refresh rotated tokens, `upsertAccount` that row; if that row is active, `writeAuthSlot` with the new credential; `updateUsage`; after all, `saveVault` once; print ls view. One failure does not abort others.

`help`: short command list + `active antigravity=<alias|none> xai=<alias|none>`.

No `ctx.ui.select`. No tokens in `text`.

- [ ] **Step 1: Write failing tests** (parser + runAcc with injected login/fetch, isolated dir)

Must include: `agy`/`grok` parse; refuse active rm; typo message; add stored vs active; switch; adopt; usage continues after one throw.

- [ ] **Step 2: Run (expect FAIL)**

- [ ] **Step 3: Implement `commands.ts`**

- [ ] **Step 4: Run all unit tests**

`cd .pi/agent/extensions/pi-accounts && node --experimental-strip-types --test`

- [ ] **Step 5: Commit**

```bash
git add .pi/agent/extensions/pi-accounts/commands.ts .pi/agent/extensions/pi-accounts/commands.test.ts
git commit -m "Add /acc command handlers"
```

---

### Task 7: Extension factory + README

**Lane:** glue  
**Wave:** 5  
**Parallel group:** `glue`  
**Depends on:** T6  
**Owner agent:** `worker`  
**Owner model:** `antigravity/gemini-3.7-flash` (thinking: high)  
**Reviewer agent:** `reviewer`  
**Reviewer model:** `antigravity/gemini-3.7-flash` (thinking: high)  
**Context:** fresh  
**Worktree:** true  

**Files:**
- Create: `.pi/agent/extensions/pi-accounts/index.ts`
- Create: `.pi/agent/extensions/pi-accounts/README.md`

**File lock:** `index.ts`, `README.md`

**Acceptance:**

- `export default function (pi: ExtensionAPI)` registers **one** command `acc`.
- Handler: `const result = await runAcc(args, { waitForIdle: () => ctx.waitForIdle() });` then `console.log(result.text)` and if `ctx.hasUI` `ctx.ui.notify(result.text, result.kind === "error" ? "warning" : result.kind === "warning" ? "warning" : "info")`.
- `session_start`: `reconcileProvider` for `antigravity` and `xai`; notify/log each message. Unreadable vault → notify warning, do not touch auth.json.
- `turn_end` and `agent_settled`: for each provider, `syncActiveFromAuth` + `saveVault` if the active row credential changed. Swallow/notify errors; never throw out of the hook.
- Do **not** `registerProvider`, `registerTool`, or `before_provider_headers`.
- README: command table, `accounts.json` + `auth.json` are secrets, not copied by restore.

- [ ] **Step 1: Write a tiny factory smoke test** `index.test.ts` that imports the factory, mocks `pi.on` / `pi.registerCommand`, asserts command name `acc` and that `on` subscribed to `session_start`, `turn_end`, `agent_settled`.

- [ ] **Step 2: Run (expect FAIL)**

- [ ] **Step 3: Implement `index.ts` + `README.md`**

```ts
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { runAcc } from "./commands.ts";
import { loadVault, saveVault } from "./store.ts";
import { reconcileProvider, syncActiveFromAuth } from "./auth-sync.ts";

function emit(
  ctx: { hasUI: boolean; ui: { notify: (m: string, k: "info" | "warning") => void } },
  text: string,
  kind: "info" | "warning",
): void {
  console.log(text);
  if (ctx.hasUI) ctx.ui.notify(text, kind);
}

export default function (pi: ExtensionAPI): void {
  pi.registerCommand("acc", {
    description: "Manage Antigravity and xAI accounts (ls, usage, add, switch, rename, rm, adopt)",
    handler: async (args, ctx) => {
      const result = await runAcc(args || "", { waitForIdle: () => ctx.waitForIdle() });
      emit(ctx, result.text, result.kind === "info" ? "info" : "warning");
    },
  });

  const syncHooks = async (
    ctx: { hasUI: boolean; ui: { notify: (m: string, k: "info" | "warning") => void } },
  ) => {
    try {
      let vault = loadVault();
      for (const provider of ["antigravity", "xai"] as const) {
        vault = syncActiveFromAuth(vault, provider);
      }
      saveVault(vault);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      emit(ctx, msg, "warning");
    }
  };

  pi.on("session_start", async (_event, ctx) => {
    try {
      const vault = loadVault();
      for (const provider of ["antigravity", "xai"] as const) {
        const { vault: next, messages } = reconcileProvider(vault, provider);
        saveVault(next);
        for (const message of messages) emit(ctx, message.text, "warning");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      emit(ctx, msg, "warning");
    }
  });

  pi.on("turn_end", async (_event, ctx) => {
    await syncHooks(ctx);
  });
  pi.on("agent_settled", async (_event, ctx) => {
    await syncHooks(ctx);
  });
}
```

Fix `session_start` so each `reconcileProvider` uses the **updated** vault (do not reuse the first snapshot). The snippet above has a bug — implementers **must** fold:

```ts
let vault = loadVault();
for (const provider of ["antigravity", "xai"] as const) {
  const result = reconcileProvider(vault, provider);
  vault = result.vault;
  for (const message of result.messages) emit(ctx, message.text, "warning");
}
saveVault(vault);
```

- [ ] **Step 4: Run unit tests including `index.test.ts`**

- [ ] **Step 5: Commit**

```bash
git add .pi/agent/extensions/pi-accounts/index.ts .pi/agent/extensions/pi-accounts/index.test.ts .pi/agent/extensions/pi-accounts/README.md
git commit -m "Register /acc extension hooks"
```

---

### Task 8: Restore copy + docs + restore contract

**Lane:** infra  
**Wave:** 5  
**Parallel group:** `infra`  
**Depends on:** T1  
**Owner agent:** `worker`  
**Owner model:** `antigravity/gemini-3.7-flash` (thinking: high)  
**Reviewer agent:** `reviewer`  
**Reviewer model:** `antigravity/gemini-3.7-flash` (thinking: high)  
**Context:** fresh  
**Worktree:** true  

**Files:**
- Modify: `restore.sh` (`restore_ai_config`)
- Modify: `tests/restore.test.sh`
- Modify: `.pi/README.md`

**File lock:** `restore.sh`, `tests/restore.test.sh`, `.pi/README.md`

**Acceptance:**

In `restore_ai_config`, next to the existing `focus-mode.ts` copy, add:

```bash
copy_managed "$REPO_DIR/.pi/agent/extensions/pi-accounts" "$HOME/.pi/agent/extensions/pi-accounts"
```

Do **not** copy `accounts.json` or `auth.json`.

`tests/restore.test.sh` in section `── Chrome và AI CLI ──`, after the existing `ai_output` assertions:

```bash
assert_contains "$ai_output" "extensions/pi-accounts" "khôi phục Pi multi-account extension"
assert_not_contains "$ai_output" "accounts.json" "--only ai không copy accounts.json"
```

`.pi/README.md`: add a bullet that `agent/extensions/pi-accounts/` is the `/acc` vault extension; restate credentials (`auth.json`, `accounts.json`) stay untracked.

- [ ] **Step 1: Add the two assertions first, run `bash tests/restore.test.sh` expecting FAIL** on the new contains.

- [ ] **Step 2: Confirm FAIL** mentions `pi-accounts`.

- [ ] **Step 3: Patch `restore.sh` + `.pi/README.md`**

- [ ] **Step 4: Verify**

```bash
bash -n restore.sh
bash tests/restore.test.sh
```

Expected: PASS. Dry-run must list the `pi-accounts` directory copy and must not list a standalone `accounts.json` source.

- [ ] **Step 5: Commit**

```bash
git add restore.sh tests/restore.test.sh .pi/README.md
git commit -m "Restore pi-accounts extension without vault secrets"
```

---

### Task 9a: Review correctness

**Lane:** shared  
**Wave:** final  
**Parallel group:** `review-correct`  
**Depends on:** T7, T8  
**Owner agent:** `reviewer`  
**Owner model:** `antigravity/gemini-3.7-flash` (thinking: high)  
**Reviewer agent:** —  
**Context:** fresh  
**Worktree:** false  

Read-only. Check spec coverage: activate order, adopt rules, reconcile 1–5, no `/login` intercept, no extra providers, no token leaks, `waitForIdle` on mutating commands.

Output: findings with file:line, or “no blocking issues”.

---

### Task 9b: Review tests + restore

**Lane:** shared  
**Wave:** final  
**Parallel group:** `review-tests`  
**Depends on:** T7, T8  
**Owner agent:** `reviewer`  
**Owner model:** `antigravity/gemini-3.7-flash` (thinking: high)  
**Reviewer agent:** —  
**Context:** fresh  
**Worktree:** false  

Read-only. Re-run:

```bash
cd .pi/agent/extensions/pi-accounts && node --experimental-strip-types --test
bash -n restore.sh
bash tests/restore.test.sh
```

Confirm no live OAuth, no writes under real `~/.pi/agent` from tests.

---

### Task 10: Final review (Terra)

**Lane:** shared  
**Wave:** final  
**Parallel group:** `final-terra`  
**Depends on:** T9a, T9b  
**Owner agent:** `oracle`  
**Owner model:** `openai-codex/gpt-5.6-terra` (thinking: medium)  
**Reviewer agent:** —  
**Context:** fresh  
**Worktree:** false  

This is the **last agent**. Read spec + diff of `pi-accounts/`, `restore.sh`, `tests/restore.test.sh`, `.pi/README.md`. No edits unless a blocking defect is found — then report it to the parent; parent may dispatch one flash worker fix.

Check YAGNI: no UI, no auto-rotate, no extra files beyond spec layout (+ `*.test.ts` allowed).

Produce a ship summary: what landed, residual risks (xAI quota n/a, port 51121 clash, AuthStorage cache delay until next mtime read), manual smoke from the spec.

---

## Spec coverage

| Spec requirement | Task |
|---|---|
| Vault schema + 0600 atomic IO | T1 |
| Alias unique / grammar / suggestions | T2 |
| `/acc ls` cache + age | T3, T6 |
| `/acc usage` refresh, isolate failures | T3, T6 |
| `/acc add` private OAuth | T4, T6 |
| `/acc switch` activate order | T5, T6 |
| rename / rm / rm --force | T2, T5, T6 |
| adopt rules | T5, T6 |
| Reconcile on session_start | T5, T7 |
| Sync after turn_end / agent_settled | T5, T7 |
| No provider/tool/UI | T7 |
| Restore without secrets | T8 |
| Redact tokens | T3, T6 |
| Final judgment | T10 |

## Placeholder / parallelism self-check

- No TBD. Same-wave writers are file-disjoint (T2/T3/T4, T7/T8).
- Parallel writers use `worktree: true`.
- Models match the user override: implement + per-task review = `antigravity/gemini-3.7-flash` high; last agent = `openai-codex/gpt-5.6-terra` medium.
