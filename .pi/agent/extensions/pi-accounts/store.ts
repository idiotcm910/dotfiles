import {
  chmodSync,
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";

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

/**
 * Pi AuthStorage only accepts credentials with `type: "oauth"` (+ access/refresh/expires).
 * Provider login helpers (e.g. pi-antigravity `loginAntigravity`) often omit `type`;
 * Pi's own `/login` path re-adds it — /acc must do the same before writing auth.json.
 */
export function normalizeOAuthCredential(raw: unknown): OAuthCredential {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("invalid oauth credential");
  }
  const c = raw as Record<string, unknown>;
  const access = typeof c.access === "string" ? c.access : "";
  const refresh = typeof c.refresh === "string" ? c.refresh : "";
  const expires =
    typeof c.expires === "number" && Number.isFinite(c.expires) ? c.expires : NaN;
  if (!access || !refresh || !Number.isFinite(expires)) {
    throw new Error("invalid oauth credential: need access, refresh, expires");
  }
  return {
    ...c,
    type: "oauth",
    access,
    refresh,
    expires,
  } as OAuthCredential;
}

export function agentDir(): string {
  return process.env.PI_ACCOUNTS_DIR || join(homedir(), ".pi/agent");
}

export function accountsPath(): string {
  return join(agentDir(), "accounts.json");
}

export function authPath(): string {
  return join(agentDir(), "auth.json");
}

export function atomicWrite(filePath: string, contents: string): void {
  const dir = dirname(filePath);
  mkdirSync(dir, { recursive: true, mode: 0o700 });

  const tmpPath = join(dir, `${basename(filePath)}.tmp.${process.pid}`);
  writeFileSync(tmpPath, contents, { mode: 0o600 });
  chmodSync(tmpPath, 0o600);
  renameSync(tmpPath, filePath);
  chmodSync(filePath, 0o600);
}

function sleepSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

export function withFileLock(lockTarget: string, fn: () => void): void {
  const dir = dirname(lockTarget);
  mkdirSync(dir, { recursive: true, mode: 0o700 });

  const lockFile = `${lockTarget}.lock`;
  const maxAttempts = 10;
  const retryDelayMs = 20;

  let fd: number | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      fd = openSync(lockFile, "wx", 0o600);
      break;
    } catch (err: any) {
      if (err && (err.code === "EEXIST" || err.code === "EBUSY")) {
        if (attempt === maxAttempts) {
          throw new Error(`Could not acquire lock on ${lockTarget} after ${maxAttempts} attempts`);
        }
        sleepSync(retryDelayMs);
        continue;
      }
      throw err;
    }
  }

  try {
    fn();
  } finally {
    if (fd !== null) {
      try {
        closeSync(fd);
      } catch {
        // ignore close error
      }
      try {
        unlinkSync(lockFile);
      } catch {
        // ignore unlink error
      }
    }
  }
}

export function loadVault(): Vault {
  const file = accountsPath();
  if (!existsSync(file)) {
    return { version: 1, accounts: [] };
  }

  let parsed: unknown;
  try {
    const raw = readFileSync(file, "utf8");
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("accounts.json unreadable; fix or delete it");
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed) ||
    (parsed as any).version !== 1 ||
    !Array.isArray((parsed as any).accounts)
  ) {
    throw new Error("accounts.json unreadable; fix or delete it");
  }

  return parsed as Vault;
}

export function saveVault(vault: Vault): void {
  withFileLock(accountsPath(), () => {
    atomicWrite(accountsPath(), JSON.stringify(vault, null, 2) + "\n");
  });
}

export const ALIAS_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,31}$/;

export function assertAlias(alias: string): void {
  if (typeof alias !== "string" || !ALIAS_RE.test(alias)) {
    throw new Error(`invalid alias "${alias}"`);
  }
}

export function normalizeProvider(raw: string): ProviderId {
  const p = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (p === "antigravity" || p === "agy") {
    return "antigravity";
  }
  if (p === "xai" || p === "grok") {
    return "xai";
  }
  throw new Error(`unknown provider "${raw}"`);
}

function isDamerauLevenshteinDistanceLeq1(a: string, b: string): boolean {
  if (a === b) return true;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > 1) return false;

  if (la === lb + 1) {
    let i = 0;
    let j = 0;
    while (i < la && j < lb) {
      if (a[i] === b[j]) {
        i++;
        j++;
      } else {
        i++;
      }
    }
    return i - j <= 1;
  }

  if (lb === la + 1) {
    let i = 0;
    let j = 0;
    while (i < la && j < lb) {
      if (a[i] === b[j]) {
        i++;
        j++;
      } else {
        j++;
      }
    }
    return j - i <= 1;
  }

  if (la === lb) {
    let diffCount = 0;
    let firstDiff = -1;
    for (let i = 0; i < la; i++) {
      if (a[i] !== b[i]) {
        diffCount++;
        if (diffCount === 1) {
          firstDiff = i;
        } else if (diffCount === 2) {
          if (!(firstDiff === i - 1 && a[firstDiff] === b[i] && a[i] === b[firstDiff])) {
            return false;
          }
        } else {
          return false;
        }
      }
    }
    return true;
  }

  return false;
}

export function suggestAlias(input: string, aliases: string[]): string[] {
  if (!input || !aliases || aliases.length === 0) {
    return [];
  }
  const matched: string[] = [];
  for (const alias of aliases) {
    if (alias.startsWith(input) || isDamerauLevenshteinDistanceLeq1(input, alias)) {
      matched.push(alias);
      if (matched.length >= 5) {
        break;
      }
    }
  }
  return matched;
}

export function findByAlias(vault: Vault, alias: string): Account | undefined {
  return vault.accounts.find((a) => a.alias === alias);
}

export function activeAccount(vault: Vault, provider: ProviderId): Account | undefined {
  return vault.accounts.find((a) => a.provider === provider && a.active);
}

export function addAccount(vault: Vault, account: Account): Vault {
  assertAlias(account.alias);
  if (vault.accounts.some((a) => a.alias === account.alias)) {
    throw new Error(`alias "${account.alias}" already exists`);
  }
  return {
    ...vault,
    accounts: [...vault.accounts, { ...account, credential: { ...account.credential } }],
  };
}

export function renameAccount(vault: Vault, from: string, to: string): Vault {
  assertAlias(to);
  if (!vault.accounts.some((a) => a.alias === from)) {
    throw new Error(`unknown alias "${from}"`);
  }
  if (from !== to && vault.accounts.some((a) => a.alias === to)) {
    throw new Error(`alias "${to}" already exists`);
  }
  return {
    ...vault,
    accounts: vault.accounts.map((a) => (a.alias === from ? { ...a, alias: to } : a)),
  };
}

export function removeAccount(vault: Vault, alias: string): Vault {
  if (!vault.accounts.some((a) => a.alias === alias)) {
    throw new Error(`unknown alias "${alias}"`);
  }
  return {
    ...vault,
    accounts: vault.accounts.filter((a) => a.alias !== alias),
  };
}

export function setActive(vault: Vault, alias: string): Vault {
  const target = vault.accounts.find((a) => a.alias === alias);
  if (!target) {
    throw new Error(`unknown alias "${alias}"`);
  }
  return {
    ...vault,
    accounts: vault.accounts.map((a) => {
      if (a.alias === alias) {
        return { ...a, active: true };
      }
      if (a.provider === target.provider) {
        return { ...a, active: false };
      }
      return a;
    }),
  };
}

export function upsertAccount(vault: Vault, account: Account): Vault {
  assertAlias(account.alias);
  const exists = vault.accounts.some((a) => a.alias === account.alias);
  if (exists) {
    return {
      ...vault,
      accounts: vault.accounts.map((a) =>
        a.alias === account.alias
          ? { ...account, credential: { ...account.credential } }
          : a,
      ),
    };
  }
  return {
    ...vault,
    accounts: [...vault.accounts, { ...account, credential: { ...account.credential } }],
  };
}

export function updateUsage(vault: Vault, alias: string, usage: UsageCache): Vault {
  if (!vault.accounts.some((a) => a.alias === alias)) {
    throw new Error(`unknown alias "${alias}"`);
  }
  return {
    ...vault,
    accounts: vault.accounts.map((a) =>
      a.alias === alias ? { ...a, usage: { ...usage } } : a,
    ),
  };
}

