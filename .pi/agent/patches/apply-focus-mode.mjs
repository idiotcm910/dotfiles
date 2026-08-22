import fs from "node:fs";
import path from "node:path";

const npmRoot = process.env.PI_AGENT_NPM_DIR ?? path.join(process.env.HOME, ".pi", "agent", "npm");

function replace(file, search, replacement) {
  const source = fs.readFileSync(file, "utf8").replaceAll("\r\n", "\n");
  if (source.includes(replacement)) return;
  if (!source.includes(search)) {
    throw new Error(`Unsupported package version: expected text not found in ${file}`);
  }
  fs.writeFileSync(file, source.replace(search, replacement));
}

const todo = path.join(npmRoot, "node_modules/@nguyenquangthai/pi-todo/src");
const todoOverlayPath = path.join(todo, "overlay.ts");
const previousSetVisible = '  setVisible(visible: boolean): void {\n    if (this.visible === visible) return;\n    this.visible = visible;\n    if (!visible && this.widgetRegistered && this.uiCtx) {\n      this.uiCtx.setWidget(WIDGET_KEY, undefined);\n      this.widgetRegistered = false;\n      this.tui = undefined;\n    }\n  }\n';
const setVisible = '  setVisible(visible: boolean): void {\n    if (this.visible === visible) return;\n    this.visible = visible;\n    if (!visible && this.widgetRegistered && this.uiCtx) {\n      this.uiCtx.setWidget(WIDGET_KEY, undefined);\n      this.widgetRegistered = false;\n      this.tui = undefined;\n      return;\n    }\n    if (visible) this.update();\n  }\n';
const existingTodoOverlay = fs.readFileSync(todoOverlayPath, "utf8").replaceAll("\r\n", "\n");
if (existingTodoOverlay.includes(previousSetVisible)) {
  fs.writeFileSync(todoOverlayPath, existingTodoOverlay.replace(previousSetVisible, setVisible));
}
replace(
  todoOverlayPath,
  '  private widgetRegistered = false;\n  private tui: TUI | undefined;\n',
  '  private widgetRegistered = false;\n  private tui: TUI | undefined;\n  private visible = true;\n',
);
replace(
  path.join(todo, "overlay.ts"),
  '  update(): void {\n    if (!this.uiCtx) return;\n    const todos = getTodos();\n\n    if (!shouldShowOverlay(todos)) {\n',
  `${setVisible}\n  update(): void {\n    if (!this.uiCtx) return;\n    const todos = getTodos();\n\n    if (!this.visible || !shouldShowOverlay(todos)) {\n`,
);
replace(
  path.join(todo, "index.ts"),
  '  const refreshOverlay = (): void => {\n    overlay?.update();\n  };\n\n',
  '  const refreshOverlay = (): void => {\n    overlay?.update();\n  };\n\n  pi.events.on("pi:focus-mode", (payload: unknown) => {\n    if (!payload || typeof payload !== "object" || typeof (payload as { hidden?: unknown }).hidden !== "boolean") return;\n    overlay?.setVisible(!(payload as { hidden: boolean }).hidden);\n  });\n\n',
);

const subagents = path.join(npmRoot, "node_modules/pi-subagents/src");
replace(
  path.join(subagents, "shared/types.ts"),
  '\t/** Temporarily suppress dynamic widgets while Pi compacts the session. */\n\twidgetsSuspended?: boolean;\n',
  '\t/** Temporarily suppress dynamic widgets while Pi compacts the session. */\n\twidgetsSuspended?: boolean;\n\t/** Hide dynamic widgets without affecting active subagent work. */\n\tfocusMode?: boolean;\n',
);
for (const [file, search, replacement] of [
  [
    path.join(subagents, "runs/background/async-job-tracker.ts"),
    "state.widgetsSuspended",
    "(state.widgetsSuspended || state.focusMode)",
  ],
  [
    path.join(subagents, "tui/fleet-status.ts"),
    "this.state.widgetsSuspended",
    "(this.state.widgetsSuspended || this.state.focusMode)",
  ],
]) {
  let source = fs.readFileSync(file, "utf8").replaceAll("\r\n", "\n")
    .replaceAll("this.(state.widgetsSuspended || state.focusMode)", "(this.state.widgetsSuspended || this.state.focusMode)");
  if (source.includes(replacement)) {
    fs.writeFileSync(file, source);
    continue;
  }
  if (!source.includes(search)) {
    throw new Error(`Unsupported package version: focus-mode hooks not found in ${file}`);
  }
  source = source.replaceAll(search, replacement);
  fs.writeFileSync(file, source);
}
replace(
  path.join(subagents, "extension/index.ts"),
  '\t\twidgetsSuspended: false,\n',
  '\t\twidgetsSuspended: false,\n\t\tfocusMode: false,\n',
);
replace(
  path.join(subagents, "extension/index.ts"),
  '\tconst eventUnsubscribes = [\n',
  '\tconst focusModeHandler = (payload: unknown) => {\n\t\tif (!payload || typeof payload !== "object" || typeof (payload as { hidden?: unknown }).hidden !== "boolean") return;\n\t\tstate.focusMode = (payload as { hidden: boolean }).hidden;\n\t\tconst ctx = state.lastUiContext;\n\t\tif (state.focusMode && ctx?.hasUI) ctx.ui.setWidget(WIDGET_KEY, undefined);\n\t\tif (!state.focusMode && ctx?.hasUI) refreshWidget(ctx);\n\t\tfleetStatus?.refresh();\n\t};\n\tconst eventUnsubscribes = [\n',
);
replace(
  path.join(subagents, "extension/index.ts"),
  '\t\tpi.events.on(SUBAGENT_STEERING_NOTICE_EVENT, steeringNoticeHandler),\n',
  '\t\tpi.events.on(SUBAGENT_STEERING_NOTICE_EVENT, steeringNoticeHandler),\n\t\tpi.events.on("pi:focus-mode", focusModeHandler),\n',
);

const alibaba = path.join(npmRoot, "node_modules/pi-alibaba-models/extensions/alibaba.ts");
replace(
  alibaba,
  '    return json.data\n      .filter((m) => !exclude.test(m.id))\n      .map((m) => inferPlanDef(m.id, overrides));\n',
  '    const models = json.data\n      .filter((m) => !exclude.test(m.id))\n      .map((m) => inferPlanDef(m.id, overrides));\n    // Local alias requested for the DeepSeek V4 Pro 0813 release. Alibaba\n    // currently advertises only the stable deepseek-v4-pro id, so this alias\n    // may be rejected by the remote API until Alibaba exposes it explicitly.\n    if (models.some((model) => model.id === "deepseek-v4-pro")\n      && !models.some((model) => model.id === "deepseek-v4-pro-0813")) {\n      models.push(inferPlanDef("deepseek-v4-pro-0813", overrides));\n    }\n    return models;\n',
);

console.log(`Applied Pi focus-mode patches in ${npmRoot}.`);
