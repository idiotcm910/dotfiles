import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createJiti } = require("jiti");

const todoRoot = process.env.PI_TODO_ROOT
  ?? `${process.env.HOME}/.pi/agent/npm/node_modules/@nguyenquangthai/pi-todo`;
const jiti = createJiti(import.meta.url, { interopDefault: false });
const { TodoOverlay } = await jiti.import(`${todoRoot}/src/overlay.ts`);
const { clearTodos, setTodos } = await jiti.import(`${todoRoot}/src/store.ts`);

const calls = [];
const overlay = new TodoOverlay();
overlay.setUICtx({ setWidget: (...args) => calls.push(args) });
setTodos([{ id: "todo-1", content: "Keep working", status: "in_progress", priority: "high" }]);

overlay.update();
overlay.setVisible(false);
assert.deepEqual(calls.at(-1), ["pi-todo", undefined]);

overlay.setVisible(true);
assert.equal(calls.at(-1)?.[0], "pi-todo");
assert.equal(typeof calls.at(-1)?.[1], "function");

clearTodos();
const { default: registerFocusMode } = await jiti.import("../extensions/focus-mode.ts");
const emitted = [];
let shortcut;
const status = [];
registerFocusMode({
  events: { emit: (...args) => emitted.push(args) },
  registerShortcut: (_key, options) => { shortcut = options; },
});
await shortcut.handler({
  ui: {
    setStatus: (...args) => status.push(args),
    notify: () => {},
  },
});
assert.deepEqual(emitted, [["pi:focus-mode", { hidden: true }]]);
assert.deepEqual(status, [["focus-mode", "Focus mode · Alt+H to show widgets"]]);

console.log("Focus-mode todo overlay test passed.");
