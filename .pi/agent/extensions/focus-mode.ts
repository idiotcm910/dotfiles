import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/** Hide live plan and subagent widgets without affecting the work they represent. */
export default function (pi: ExtensionAPI): void {
  let hidden = false;

  pi.registerShortcut("alt+h", {
    description: "Toggle focus mode (hide/show plan and subagent widgets)",
    handler: async (ctx) => {
      hidden = !hidden;
      pi.events.emit("pi:focus-mode", { hidden });
      ctx.ui.setStatus("focus-mode", hidden ? "Focus mode · Alt+H to show widgets" : undefined);
      ctx.ui.notify(hidden ? "Focus mode enabled" : "Focus mode disabled", "info");
    },
  });
}
