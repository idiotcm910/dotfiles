import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { runAcc, parseAccArgs } from "./commands.ts";
import { AccPager } from "./pager.ts";
import { loadVault, saveVault } from "./store.ts";
import { reconcileProvider, syncActiveFromAuth } from "./auth-sync.ts";

const OUT_WIDGET = "pi-accounts-out";
const OAUTH_WIDGET = "pi-accounts-oauth";
const STATUS_KEY = "pi-accounts";

type Theme = {
  fg: (color: string, text: string) => string;
  bold?: (text: string) => string;
};

type SimpleComponent = {
  render: (width: number) => string[];
  invalidate: () => void;
};

type UiCtx = {
  hasUI?: boolean;
  mode?: string;
  ui?: {
    notify?: (m: string, k: "info" | "warning" | "error") => void;
    setStatus?: (key: string, text: string | undefined) => void;
    setWidget?: (
      key: string,
      content: string[] | ((tui: unknown, theme: Theme) => SimpleComponent) | undefined,
      opts?: { placement?: "aboveEditor" | "belowEditor" },
    ) => void;
    custom?: <T>(
      factory: (
        tui: { requestRender?: () => void },
        theme: Theme,
        keybindings: unknown,
        done: (value: T) => void,
      ) => unknown,
      opts?: { overlay?: boolean },
    ) => Promise<T | undefined>;
  };
  waitForIdle?: () => Promise<void>;
};

function clearEphemeralUi(ctx: UiCtx): void {
  if (!ctx.hasUI || !ctx.ui) return;
  try {
    ctx.ui.setWidget?.(OAUTH_WIDGET, undefined);
  } catch {
    /* ignore */
  }
  try {
    ctx.ui.setStatus?.(STATUS_KEY, undefined);
  } catch {
    /* ignore */
  }
}

function clearAllAccUi(ctx: UiCtx): void {
  clearEphemeralUi(ctx);
  if (!ctx.hasUI || !ctx.ui) return;
  try {
    ctx.ui.setWidget?.(OUT_WIDGET, undefined);
  } catch {
    /* ignore */
  }
}

function shortNotify(ctx: UiCtx, text: string, kind: "info" | "warning" | "error" = "info"): void {
  const k = kind === "info" ? "info" : "warning";
  if (ctx.hasUI && ctx.ui?.notify) {
    ctx.ui.notify(text.slice(0, 200), k);
  } else {
    console.log(text);
  }
}

/**
 * Route all /acc command results through the floating scrollable overlay pager.
 * This guarantees:
 * 1. Output never spills into chat bubbles / AI model context.
 * 2. Output is never clipped by non-scrollable widgets.
 * 3. Short commands (switch/add) show compact cards; long commands (ls/usage) scroll with j/k.
 * 4. User closes with Enter / Esc / q.
 */
async function present(
  ctx: UiCtx,
  text: string,
  kind: "info" | "warning" | "error",
  cmd: string,
): Promise<void> {
  const body = text.replace(/\s+$/g, "");
  const lines = body.length > 0 ? body.split("\n") : [""];
  const toastKind = kind === "info" ? "info" : "warning";

  if (!ctx.hasUI || !ctx.ui) {
    console.log(body);
    return;
  }

  // Clear any old static widget so it never remains stuck above editor
  ctx.ui.setWidget?.(OUT_WIDGET, undefined);

  if (typeof ctx.ui.custom === "function" && (ctx.mode === undefined || ctx.mode === "tui")) {
    const title = cmd ? `/acc ${cmd}` : "/acc";
    try {
      await ctx.ui.custom<void>(
        (tui, theme, _kb, done) => {
          const pager = new AccPager(lines, theme, () => done(undefined as void), {
            title,
          });
          pager.bindTui(tui);
          return pager;
        },
        { overlay: true },
      );
    } catch {
      // Fallback if custom UI is interrupted
      shortNotify(ctx, body, toastKind);
    }
    clearEphemeralUi(ctx);
    return;
  }

  // Fallback if custom() is unavailable (e.g. RPC mode)
  shortNotify(ctx, body, toastKind);
}

export default function (pi: ExtensionAPI): void {
  pi.registerCommand("acc", {
    description:
      "Manage Antigravity and xAI accounts (ls, usage, add, switch, rename, rm, adopt, clear)",
    handler: async (args, ctx) => {
      const raw = (args || "").trim();

      clearEphemeralUi(ctx);

      if (/^(clear|dismiss|hide)$/i.test(raw.split(/\s+/)[0] || "")) {
        clearAllAccUi(ctx);
        shortNotify(ctx, "acc panel cleared", "info");
        return;
      }

      const parsed = parseAccArgs(raw);

      try {
        const result = await runAcc(raw, {
          waitForIdle: () => ctx.waitForIdle(),
          notify: (message, kind = "info") => {
            if (ctx.hasUI && ctx.ui?.notify) {
              ctx.ui.notify(message.slice(0, 160), kind === "warning" ? "warning" : "info");
            }
          },
          log: () => {},
          setStatus: (key, text) => {
            if (ctx.hasUI && ctx.ui?.setStatus) ctx.ui.setStatus(key, text);
          },
          setWidget: (key, lines) => {
            if (!ctx.hasUI || !ctx.ui?.setWidget) return;
            if (lines === undefined) {
              ctx.ui.setWidget(key, undefined);
              return;
            }
            ctx.ui.setWidget(key, lines, { placement: "aboveEditor" });
          },
        });

        const kind =
          result.kind === "error" ? "error" : result.kind === "warning" ? "warning" : "info";
        await present(ctx, result.text, kind, parsed.cmd);
      } finally {
        clearEphemeralUi(ctx);
      }
    },
  });

  const syncHooks = async (ctx: UiCtx) => {
    try {
      let vault = loadVault();
      for (const provider of ["antigravity", "xai"] as const) {
        vault = syncActiveFromAuth(vault, provider);
      }
      saveVault(vault);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      shortNotify(ctx, msg, "warning");
    }
  };

  pi.on("session_start", async (_event, ctx) => {
    try {
      let vault = loadVault();
      for (const provider of ["antigravity", "xai"] as const) {
        const result = reconcileProvider(vault, provider);
        vault = result.vault;
        for (const message of result.messages) {
          shortNotify(ctx, message.text, "warning");
        }
      }
      saveVault(vault);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      shortNotify(ctx, msg, "warning");
    }
  });

  pi.on("turn_end", async (_event, ctx) => {
    await syncHooks(ctx);
  });

  pi.on("agent_settled", async (_event, ctx) => {
    await syncHooks(ctx);
  });
}
