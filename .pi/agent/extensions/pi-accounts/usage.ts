import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { Account, UsageCache } from "./store.ts";

export function redactSecrets(text: string): string {
  if (!text) return "";
  return text
    .replace(/ya29\.[A-Za-z0-9._-]+/g, "[redacted]")
    .replace(/1\/\/[A-Za-z0-9._-]+/g, "[redacted]")
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[redacted]");
}

export function formatAge(
  fetchedAt: number | undefined,
  ok: boolean | undefined,
  now?: number,
): string {
  if (fetchedAt === undefined || fetchedAt === null || isNaN(fetchedAt)) {
    return "(never)";
  }

  const currentTime = now !== undefined ? now : Date.now();
  const diffMs = Math.max(0, currentTime - fetchedAt);

  let ageStr: string;
  if (diffMs < 30_000) {
    ageStr = "now";
  } else if (diffMs < 3600_000) {
    const mins = Math.max(1, Math.floor(diffMs / 60_000));
    ageStr = `${mins}m ago`;
  } else if (diffMs < 86400_000) {
    const hours = Math.floor(diffMs / 3600_000);
    ageStr = `${hours}h ago`;
  } else {
    const days = Math.floor(diffMs / 86400_000);
    ageStr = `${days}d ago`;
  }

  if (ok === false) {
    return `(error ${ageStr})`;
  }
  return `(${ageStr})`;
}

/** Visual divider between account blocks in ls/usage output. */
export const ACCOUNT_SEP = "────────────────────────────────────────";

/** Default quota rows shown in the TUI panel (widgets are not scrollable). */
export const DEFAULT_MAX_QUOTA_ROWS = 4;

export type FormatAccountOptions = {
  now?: number;
  /** Show every quota/model row (can be long). Default: compact. */
  full?: boolean;
  /** Cap for compact mode (ignored when full). */
  maxQuotaRows?: number;
};

/** Split a cached summary into readable rows (newlines and middot). */
export function splitSummaryLines(summary: string): string[] {
  if (!summary) return [];
  const middot = "\u00b7"; // ·
  return summary
    .split("\n")
    .flatMap((line) => line.split(middot))
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Prefer pool/limit rows over per-model spam; collapse identical % rows.
 * Widgets above the editor cannot scroll, so compact is the default view.
 */
export function compactQuotaRows(rows: string[], maxRows: number): string[] {
  if (maxRows < 1) return [];
  if (rows.length <= maxRows) return rows;

  const importantRe =
    /\b(weekly|5h|limit|remaining|quota|subscription|pro|pool)\b/i;
  const important = rows.filter((r) => importantRe.test(r));
  const rest = rows.filter((r) => !importantRe.test(r));

  // Collapse many identical "Name 100% (7d)" model rows into one summary.
  const pctBuckets = new Map<string, number>();
  for (const r of rest) {
    const m = r.match(/(\d+(?:\.\d+)?)%\s*(?:\(([^)]+)\))?/);
    if (!m) continue;
    const key = `${m[1]}%${m[2] ? ` (${m[2]})` : ""}`;
    pctBuckets.set(key, (pctBuckets.get(key) || 0) + 1);
  }
  const collapsedRest: string[] = [];
  let usedInCollapse = 0;
  for (const [key, count] of pctBuckets) {
    if (count >= 3) {
      collapsedRest.push(`${count} models at ${key}`);
      usedInCollapse += count;
    }
  }
  const leftover = rest.filter((r) => {
    const m = r.match(/(\d+(?:\.\d+)?)%\s*(?:\(([^)]+)\))?/);
    if (!m) return true;
    const key = `${m[1]}%${m[2] ? ` (${m[2]})` : ""}`;
    return (pctBuckets.get(key) || 0) < 3;
  });

  const preferred = [...important, ...collapsedRest, ...leftover];
  if (preferred.length <= maxRows) return preferred;

  const head = preferred.slice(0, Math.max(1, maxRows - 1));
  const hidden = preferred.length - head.length;
  return [...head, `… +${hidden} more · /acc usage --full`];
}

/**
 * Multi-line account card for /acc ls and /acc usage.
 * Compact by default so the non-scrollable TUI widget stays usable.
 */
export function formatAccountBlock(
  account: Account,
  nowOrOpts?: number | FormatAccountOptions,
  maybeOpts?: FormatAccountOptions,
): string {
  // Back-compat: formatAccountBlock(acc, now)
  let opts: FormatAccountOptions = {};
  if (typeof nowOrOpts === "number") {
    opts = { ...(maybeOpts || {}), now: nowOrOpts };
  } else if (nowOrOpts && typeof nowOrOpts === "object") {
    opts = nowOrOpts;
  }
  const now = opts.now;
  const full = opts.full === true;
  const maxRows = full ? 10_000 : (opts.maxQuotaRows ?? DEFAULT_MAX_QUOTA_ROWS);

  const mark = account.active ? "*" : " ";
  const identity = [account.alias, account.provider, account.label || undefined]
    .filter((part): part is string => Boolean(part && part.length > 0))
    .join("  ·  ");
  const lines: string[] = [`${mark} ${identity}`];

  if (account.usage?.ok === false && account.usage.error) {
    lines.push(`    error  ${account.usage.error}`);
    if (account.usage.summary) {
      const rows = compactQuotaRows(splitSummaryLines(account.usage.summary), maxRows);
      for (const row of rows) lines.push(`    last   ${row}`);
    }
  } else if (account.usage?.summary) {
    const rawRows = splitSummaryLines(account.usage.summary);
    if (rawRows.length === 0) {
      lines.push("    usage  (empty)");
    } else {
      const [first, ...rest] = rawRows;
      let quotaRows: string[];
      if (first !== undefined && !first.includes("%") && rest.length > 0) {
        lines.push(`    plan   ${first}`);
        quotaRows = rest;
      } else {
        quotaRows = rawRows;
      }
      const shown = compactQuotaRows(quotaRows, maxRows);
      for (const row of shown) lines.push(`    ·      ${row}`);
    }
  } else {
    lines.push("    usage  (never fetched — run /acc usage)");
  }

  lines.push(`    age    ${formatAge(account.usage?.fetchedAt, account.usage?.ok, now)}`);
  return redactSecrets(lines.join("\n"));
}

/** Join several account cards with a separator line. */
export function formatAccountList(
  accounts: Account[],
  nowOrOpts?: number | FormatAccountOptions,
  maybeOpts?: FormatAccountOptions,
): string {
  let opts: FormatAccountOptions = {};
  if (typeof nowOrOpts === "number") {
    opts = { ...(maybeOpts || {}), now: nowOrOpts };
  } else if (nowOrOpts && typeof nowOrOpts === "object") {
    opts = nowOrOpts;
  }
  if (accounts.length === 0) return "no accounts configured";
  const blocks = accounts.map((a) => formatAccountBlock(a, opts));
  if (blocks.length === 1) return blocks[0]!;
  return blocks.join(`\n${ACCOUNT_SEP}\n`);
}

/** Alias used by older callers/tests — multi-line card (compact). */
export function formatLsLine(account: Account, now?: number): string {
  return formatAccountBlock(account, now);
}

export function collapseAgySummary(multiLine: string): string {
  if (!multiLine || typeof multiLine !== "string") return "";

  const lines = multiLine
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return "";
  if (lines.length === 1 && !lines[0].includes("%")) return lines[0];

  const segments: string[] = [];
  let currentGroup: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes("%")) {
      const clean = line.replace(/\[[#\s\-\=\.\*]+\]\s*/g, "").trim();

      const match = clean.match(
        /^(.*?)(?::\s*|\s+)?(\d+(?:\.\d+)?%)(?:\s*left)?(?:\s*[·•]\s*resets\s*(\S+))?/i,
      );

      if (match) {
        let name = (match[1] || "").trim();
        const percent = match[2];
        const resets = match[3];

        if (name.toLowerCase() === "limit") {
          name = "";
        }

        let fullName = name;
        if (currentGroup) {
          if (!name) {
            fullName = currentGroup;
          } else if (!name.toLowerCase().startsWith(currentGroup.toLowerCase())) {
            fullName = `${currentGroup} ${name}`;
          }
          currentGroup = null;
        }

        let formatted = fullName ? `${fullName} ${percent}` : percent;
        if (resets) {
          formatted += ` (${resets})`;
        }
        segments.push(formatted.trim());
      } else {
        segments.push(clean);
      }
    } else if (i === 0 && !line.startsWith("[")) {
      segments.push(line);
    } else {
      currentGroup = line.replace(/[:\-]/g, "").trim();
    }
  }

  return segments.length > 0 ? segments.join(" · ") : multiLine.trim();
}

export function formatXaiSummary(
  opts: { quotaLine?: string; labelExtra?: string } = {},
): string {
  let summary = opts.quotaLine
    ? (opts.quotaLine.startsWith("xAI")
        ? opts.quotaLine
        : `xAI subscription · ${opts.quotaLine}`)
    : "xAI subscription · quota n/a";

  if (opts.labelExtra) {
    summary = `${summary} · ${opts.labelExtra}`;
  }

  return summary;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = Buffer.from(parts[1], "base64url").toString("utf8");
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

async function realFetchAntigravityUsage(account: Account): Promise<string> {
  try {
    const agyPath = join(
      homedir(),
      ".pi/agent/npm/node_modules/pi-antigravity/src/usage/index.ts",
    );
    const mod = await import(pathToFileURL(agyPath).href);
    if (
      typeof mod.fetchAccountUsage === "function" &&
      typeof mod.formatUsageSummary === "function"
    ) {
      const apiKey = JSON.stringify({
        token: account.credential.access,
        projectId: account.credential.projectId || "antigravity-default",
      });
      const data = await mod.fetchAccountUsage(apiKey);
      return mod.formatUsageSummary(data);
    }
  } catch {
    // Dynamic import fallback
  }

  const baseUrl = "https://cloudcode-pa.googleapis.com";
  const headers = {
    Authorization: `Bearer ${account.credential.access}`,
    "Content-Type": "application/json",
    "User-Agent": "antigravity/1.15.8 linux/amd64",
    "X-Goog-Api-Client": "google-cloud-sdk vscode_cloudshelleditor/0.1",
    "Client-Metadata": JSON.stringify({
      ideType: "ANTIGRAVITY",
      platform: "linux",
      pluginType: "GEMINI",
    }),
  };

  let tierName = "Google AI Pro";
  try {
    const loadRes = await fetch(`${baseUrl}/v1internal:loadCodeAssist`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        metadata: {
          ideType: "ANTIGRAVITY",
          platform: "PLATFORM_UNSPECIFIED",
          pluginType: "GEMINI",
        },
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (loadRes.ok) {
      const loadData: any = await loadRes.json();
      if (loadData.paidTier?.name) tierName = loadData.paidTier.name;
      else if (loadData.currentTier?.name) tierName = loadData.currentTier.name;
      else if (typeof loadData.currentTier === "string")
        tierName = loadData.currentTier;
    }
  } catch {
    // Ignore tier fetch error
  }

  const quotaRes = await fetch(
    `${baseUrl}/v1internal:retrieveUserQuotaSummary`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(8000),
    },
  );

  if (!quotaRes.ok) {
    throw new Error(`HTTP ${quotaRes.status} ${quotaRes.statusText}`);
  }

  const quotaData: any = await quotaRes.json();
  const parts: string[] = [tierName];

  if (Array.isArray(quotaData.groups)) {
    for (const group of quotaData.groups) {
      const groupName = group.displayName || group.groupId || "Gemini";
      if (Array.isArray(group.buckets)) {
        for (let i = 0; i < group.buckets.length; i++) {
          const b = group.buckets[i];
          const bName = b.displayName || b.bucketId || "";
          const name =
            i === 0 && groupName ? `${groupName} ${bName}`.trim() : bName;
          const pct =
            typeof b.remainingFraction === "number"
              ? `${Math.round(b.remainingFraction * 100)}%`
              : "";
          const resets = b.resetTime ? b.resetTime : "";
          if (pct) {
            parts.push(`${name} ${pct}${resets ? ` (${resets})` : ""}`.trim());
          }
        }
      }
    }
  }

  return parts.join(" · ");
}

async function realFetchXaiUsage(account: Account): Promise<string> {
  const jwt = decodeJwtPayload(account.credential.access);
  let labelExtra: string | undefined;
  if (jwt?.tier && typeof jwt.tier === "string") {
    labelExtra = jwt.tier;
  } else if (jwt?.team_id && typeof jwt.team_id === "string") {
    labelExtra = `team: ${jwt.team_id}`;
  }

  try {
    const res = await fetch("https://api.x.ai/v1/api-key", {
      headers: {
        Authorization: `Bearer ${account.credential.access}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (res.status === 401 || res.status === 403) {
      const err = new Error(String(res.status));
      (err as any).status = res.status;
      throw err;
    }

    if (res.ok) {
      const data: any = await res.json();
      if (data && typeof data === "object") {
        if (data.remaining !== undefined) {
          return formatXaiSummary({
            quotaLine: `${data.remaining} remaining`,
            labelExtra,
          });
        }
      }
    }

    return formatXaiSummary({ labelExtra });
  } catch (err: any) {
    if (
      err?.status === 401 ||
      err?.status === 403 ||
      err?.message?.includes("401") ||
      err?.message?.includes("403")
    ) {
      throw err;
    }
    return formatXaiSummary({ labelExtra });
  }
}

export async function fetchAccountUsageCache(
  account: Account,
  deps?: {
    fetchAgy?: (account: Account) => Promise<string>;
    fetchXai?: (account: Account) => Promise<string | undefined>;
    now?: () => number;
  },
): Promise<UsageCache> {
  const getNow = deps?.now ? deps.now : () => Date.now();
  const fetchedAt = getNow();

  if (account.provider === "antigravity") {
    try {
      if (deps?.fetchAgy) {
        const raw = await deps.fetchAgy(account);
        const summary = collapseAgySummary(raw);
        return {
          fetchedAt,
          ok: true,
          summary,
          error: null,
        };
      }

      const rawSummary = await realFetchAntigravityUsage(account);
      const summary = collapseAgySummary(rawSummary);
      return {
        fetchedAt,
        ok: true,
        summary,
        error: null,
      };
    } catch (err: any) {
      const errorMsg = redactSecrets(err?.message || String(err));
      return {
        fetchedAt,
        ok: false,
        summary: account.usage?.summary || "",
        error: errorMsg,
      };
    }
  } else if (account.provider === "xai") {
    try {
      if (deps?.fetchXai) {
        const res = await deps.fetchXai(account);
        const summary = formatXaiSummary({ quotaLine: res });
        return {
          fetchedAt,
          ok: true,
          summary,
          error: null,
        };
      }

      const summary = await realFetchXaiUsage(account);
      return {
        fetchedAt,
        ok: true,
        summary,
        error: null,
      };
    } catch (err: any) {
      const errorMsg = redactSecrets(err?.message || String(err));
      return {
        fetchedAt,
        ok: false,
        summary: account.usage?.summary || "xAI subscription · quota n/a",
        error: errorMsg,
      };
    }
  }

  return {
    fetchedAt,
    ok: false,
    summary: account.usage?.summary || "",
    error: `Unknown provider: ${account.provider}`,
  };
}
