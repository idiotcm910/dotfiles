import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  activate,
  adopt,
  forceRemoveActive,
  writeAuthSlot,
} from "./auth-sync.ts";
import { labelFromCredential, loginProvider, type AddNotifier } from "./oauth.ts";
import {
  activeAccount,
  addAccount,
  assertAlias,
  findByAlias,
  loadVault,
  normalizeProvider,
  removeAccount,
  renameAccount,
  saveVault,
  suggestAlias,
  updateUsage,
  upsertAccount,
  type Account,
  type ProviderId,
  type Vault,
} from "./store.ts";
import {
  fetchAccountUsageCache,
  formatAccountList,
  redactSecrets,
} from "./usage.ts";

export type AccResult = { text: string; kind: "info" | "warning" | "error" };

export type ParsedAccArgs = {
  cmd: "help" | "ls" | "usage" | "add" | "switch" | "rename" | "rm" | "adopt" | "clear";
  alias?: string;
  provider?: string;
  newAlias?: string;
  force?: boolean;
  /** Expand every model/quota row (default is compact — widgets cannot scroll). */
  full?: boolean;
};

export type AccDeps = {
  waitForIdle?: () => Promise<void>;
  login?: typeof loginProvider;
  fetchUsage?: typeof fetchAccountUsageCache;
  /** Live UI feedback during long ops (OAuth). */
  notify?: (message: string, kind?: "info" | "warning") => void;
  log?: (message: string) => void;
  setStatus?: (key: string, text: string | undefined) => void;
  /** Temporary multi-line UI above the editor; pass undefined to clear. */
  setWidget?: (key: string, lines: string[] | undefined) => void;
};

export function parseAccArgs(args: string): ParsedAccArgs {
  const trimmed = typeof args === "string" ? args.trim() : "";
  if (!trimmed) {
    return { cmd: "help" };
  }

  const tokens = trimmed.split(/\s+/);
  const subcmd = tokens[0].toLowerCase();

  switch (subcmd) {
    case "help":
      return { cmd: "help" };
    case "clear":
    case "dismiss":
    case "hide":
      return { cmd: "clear" };
    case "ls": {
      const rest = tokens.slice(1);
      const full = rest.includes("--full") || rest.includes("-f");
      return { cmd: "ls", full };
    }
    case "usage": {
      const rest = tokens.slice(1);
      const full = rest.includes("--full") || rest.includes("-v");
      const nonFlag = rest.filter((t) => t !== "--full" && t !== "-v" && t !== "-f");
      return { cmd: "usage", alias: nonFlag[0] || undefined, full };
    }
    case "add":
      return {
        cmd: "add",
        provider: tokens[1] || undefined,
        alias: tokens[2] || undefined,
      };
    case "switch":
      return { cmd: "switch", alias: tokens[1] || undefined };
    case "rename":
      return {
        cmd: "rename",
        alias: tokens[1] || undefined,
        newAlias: tokens[2] || undefined,
      };
    case "rm": {
      const rest = tokens.slice(1);
      const force = rest.includes("--force") || rest.includes("-f");
      const nonFlag = rest.filter((t) => t !== "--force" && t !== "-f");
      return {
        cmd: "rm",
        alias: nonFlag[0] || undefined,
        force,
      };
    }
    case "adopt":
      return {
        cmd: "adopt",
        alias: tokens[1] || undefined,
        provider: tokens[2] || undefined,
      };
    default:
      return { cmd: "help" };
  }
}

export function unknownAliasMessage(alias: string, aliases: string[]): string {
  const suggestions = suggestAlias(alias, aliases);
  if (suggestions.length > 0) {
    return `unknown alias "${alias}". did you mean: ${suggestions.join(", ")}`;
  }
  return `unknown alias "${alias}"`;
}

/** Best-effort open of an https URL in the desktop browser (non-blocking). */
export function tryOpenBrowser(url: string): void {
  const target = url.trim();
  if (!/^https?:\/\//i.test(target)) return;
  try {
    const child = spawn("xdg-open", [target], {
      detached: true,
      stdio: "ignore",
    });
    child.unref();
  } catch {
    // User can still copy the URL from notify/log.
  }
}

function makeAddNotifier(deps?: AccDeps): AddNotifier {
  const STATUS_KEY = "pi-accounts";
  const WIDGET_KEY = "pi-accounts-oauth";
  return {
    notify: (message: string) => {
      const text = redactSecrets(message);
      const isUrl = /^https?:\/\//i.test(text.trim());
      if (isUrl) {
        const url = text.trim();
        // Prefer ephemeral widget over permanent console spam for long URLs.
        deps?.setWidget?.(WIDGET_KEY, [
          "OAuth: open this URL (browser may open automatically), then return here.",
          url,
        ]);
        deps?.setStatus?.(STATUS_KEY, "acc: waiting for browser login…");
        deps?.notify?.("OAuth URL ready — complete login in browser", "info");
        tryOpenBrowser(url);
        return;
      }
      deps?.notify?.(text, "info");
      deps?.setStatus?.(STATUS_KEY, text.slice(0, 80));
    },
    log: (message: string) => {
      const text = redactSecrets(message);
      // Never dump full OAuth URLs into the session log.
      if (/^https?:\/\//i.test(text.trim())) return;
      if (deps?.log) deps.log(text);
    },
  };
}

export async function runAcc(args: string, deps?: AccDeps): Promise<AccResult> {
  try {
    let vault: Vault;
    try {
      vault = loadVault();
    } catch (err: any) {
      return {
        text: redactSecrets(err?.message || "accounts.json unreadable; fix or delete it"),
        kind: "error",
      };
    }

    const parsed = parseAccArgs(args);

    switch (parsed.cmd) {
      case "help": {
        const agy = activeAccount(vault, "antigravity");
        const xai = activeAccount(vault, "xai");
        const helpText = [
          "pi-accounts  ·  /acc",
          "────────────────────────────────────────",
          "Commands",
          "  ls [--full]            List accounts (cached; compact)",
          "  usage [alias] [--full] Refresh usage, then list",
          "                         --full opens scrollable overlay (j/k, q)",
          "  add <provider> <alias> OAuth add (agy|antigravity, grok|xai)",
          "  switch <alias>         Make alias active for its provider",
          "  rename <old> <new>     Rename alias",
          "  rm <alias> [--force]   Remove (force if active)",
          "  adopt <alias> [prov]   Import current auth.json slot",
          "  clear                  Dismiss the /acc output panel",
          "────────────────────────────────────────",
          "Active",
          `  antigravity   ${agy?.alias || "none"}`,
          `  xai           ${xai?.alias || "none"}`,
          "",
          "Providers: antigravity|agy · xai|grok",
          "Output is a TUI panel only — not sent to the model context.",
        ].join("\n");
        return { text: helpText, kind: "info" };
      }

      case "clear": {
        // Handled in index.ts (UI). Keep a no-op result for pure runAcc callers.
        return { text: "acc panel cleared", kind: "info" };
      }

      case "ls": {
        return {
          text: formatAccountList(vault.accounts, { full: parsed.full === true }),
          kind: "info",
        };
      }

      case "add": {
        if (!parsed.provider || !parsed.alias) {
          return { text: "usage: /acc add <provider> <alias>", kind: "error" };
        }

        const provider = normalizeProvider(parsed.provider);
        assertAlias(parsed.alias);

        if (findByAlias(vault, parsed.alias)) {
          return { text: `alias "${parsed.alias}" already exists`, kind: "error" };
        }

        const STATUS_KEY = "pi-accounts";
        const WIDGET_KEY = "pi-accounts-oauth";
        const progress = (message: string) => {
          const text = redactSecrets(message);
          deps?.notify?.(text, "info");
          deps?.setStatus?.(STATUS_KEY, text.slice(0, 80));
        };

        try {
          if (deps?.waitForIdle) {
            progress("acc: waiting for idle…");
            await deps.waitForIdle();
          }

          progress(`acc: OAuth ${provider} "${parsed.alias}" — browser login (≤5m)`);
          deps?.setWidget?.(WIDGET_KEY, [
            `Adding ${provider} account "${parsed.alias}"…`,
            "Complete login in the browser when the URL appears. This panel clears when done.",
          ]);

          const loginFn = deps?.login || loginProvider;
          const notifier = makeAddNotifier(deps);
          const cred = await loginFn(provider, notifier);
          const label = labelFromCredential(provider, cred);
          const currentActive = activeAccount(vault, provider);
          const shouldActivate = !currentActive;

          const newAccount: Account = {
            id: randomUUID(),
            alias: parsed.alias,
            provider,
            label,
            active: false,
            credential: cred,
          };

          let updatedVault = addAccount(vault, newAccount);
          if (shouldActivate) {
            const res = activate(updatedVault, parsed.alias);
            updatedVault = res.vault;
          } else {
            saveVault(updatedVault);
          }

          const labelPart = label ? `, ${label}` : "";
          const activeStr = shouldActivate ? "[active]" : "[stored]";
          return {
            text: redactSecrets(`added ${parsed.alias} (${provider}${labelPart}) ${activeStr}`),
            kind: "info",
          };
        } finally {
          // Always clear ephemeral footer/widget — no hotkey needed.
          deps?.setStatus?.(STATUS_KEY, undefined);
          deps?.setWidget?.(WIDGET_KEY, undefined);
        }
      }

      case "switch": {
        if (!parsed.alias) {
          return { text: "usage: /acc switch <alias>", kind: "error" };
        }

        const target = findByAlias(vault, parsed.alias);
        if (!target) {
          const allAliases = vault.accounts.map((a) => a.alias);
          return { text: unknownAliasMessage(parsed.alias, allAliases), kind: "error" };
        }

        if (deps?.waitForIdle) {
          await deps.waitForIdle();
        }

        const res = activate(vault, parsed.alias);
        const labelPart = target.label ? ` (${target.label})` : "";
        return {
          text: redactSecrets(`switched ${target.provider} → ${target.alias}${labelPart}`),
          kind: "info",
        };
      }

      case "rename": {
        if (!parsed.alias || !parsed.newAlias) {
          return { text: "usage: /acc rename <old> <new>", kind: "error" };
        }

        const target = findByAlias(vault, parsed.alias);
        if (!target) {
          const allAliases = vault.accounts.map((a) => a.alias);
          return { text: unknownAliasMessage(parsed.alias, allAliases), kind: "error" };
        }

        assertAlias(parsed.newAlias);
        if (parsed.alias !== parsed.newAlias && findByAlias(vault, parsed.newAlias)) {
          return { text: `alias "${parsed.newAlias}" already exists`, kind: "error" };
        }

        const updatedVault = renameAccount(vault, parsed.alias, parsed.newAlias);
        saveVault(updatedVault);
        return { text: `renamed ${parsed.alias} → ${parsed.newAlias}`, kind: "info" };
      }

      case "rm": {
        if (!parsed.alias) {
          return { text: "usage: /acc rm <alias> [--force]", kind: "error" };
        }

        const target = findByAlias(vault, parsed.alias);
        if (!target) {
          const allAliases = vault.accounts.map((a) => a.alias);
          return { text: unknownAliasMessage(parsed.alias, allAliases), kind: "error" };
        }

        if (target.active && !parsed.force) {
          return {
            text: `${parsed.alias} is active; switch away or pass --force`,
            kind: "error",
          };
        }

        if (deps?.waitForIdle) {
          await deps.waitForIdle();
        }

        if (target.active && parsed.force) {
          forceRemoveActive(vault, parsed.alias);
        } else {
          const updatedVault = removeAccount(vault, parsed.alias);
          saveVault(updatedVault);
        }

        return { text: `removed ${parsed.alias}`, kind: "info" };
      }

      case "adopt": {
        if (!parsed.alias) {
          return { text: "usage: /acc adopt <alias> [provider]", kind: "error" };
        }

        const provider: ProviderId | undefined = parsed.provider
          ? normalizeProvider(parsed.provider)
          : undefined;

        if (deps?.waitForIdle) {
          await deps.waitForIdle();
        }

        const res = adopt(vault, parsed.alias, provider);
        const adopted = findByAlias(res.vault, parsed.alias);
        const labelPart = adopted?.label ? `, ${adopted.label}` : "";
        const provPart = adopted?.provider || provider || "";
        return {
          text: redactSecrets(`adopted ${parsed.alias} (${provPart}${labelPart})`),
          kind: "info",
        };
      }

      case "usage": {
        let targets: Account[];
        if (parsed.alias) {
          const target = findByAlias(vault, parsed.alias);
          if (!target) {
            const allAliases = vault.accounts.map((a) => a.alias);
            return { text: unknownAliasMessage(parsed.alias, allAliases), kind: "error" };
          }
          targets = [target];
        } else {
          targets = vault.accounts;
        }

        if (targets.length === 0) {
          return { text: "no accounts configured", kind: "info" };
        }

        const fetchFn = deps?.fetchUsage || fetchAccountUsageCache;
        let currentVault = vault;

        for (const acc of targets) {
          const prevCred = { ...acc.credential };
          try {
            const usageRes = await fetchFn(acc);
            // Check if credential rotated during fetch
            if (
              acc.credential.refresh !== prevCred.refresh ||
              acc.credential.access !== prevCred.access ||
              acc.credential.expires !== prevCred.expires
            ) {
              currentVault = upsertAccount(currentVault, acc);
              if (acc.active) {
                writeAuthSlot(acc.provider, acc.credential);
              }
            }
            currentVault = updateUsage(currentVault, acc.alias, usageRes);
          } catch (err: any) {
            const errorMsg = redactSecrets(err?.message || String(err));
            const fallbackUsage = {
              fetchedAt: Date.now(),
              ok: false,
              summary: acc.usage?.summary || "",
              error: errorMsg,
            };
            currentVault = updateUsage(currentVault, acc.alias, fallbackUsage);
          }
        }

        saveVault(currentVault);

        const fmt = { full: parsed.full === true };
        if (parsed.alias) {
          const updatedAcc = findByAlias(currentVault, parsed.alias)!;
          return { text: formatAccountList([updatedAcc], fmt), kind: "info" };
        }
        return { text: formatAccountList(currentVault.accounts, fmt), kind: "info" };
      }
    }
  } catch (err: any) {
    return {
      text: redactSecrets(err?.message || String(err)),
      kind: "error",
    };
  }
}
