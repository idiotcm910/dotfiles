import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createJiti } = require("jiti");
const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "pi-alibaba-model-test-"));
const agentHome = path.join(tempHome, ".pi", "agent");
fs.mkdirSync(agentHome, { recursive: true });
fs.writeFileSync(path.join(agentHome, "auth.json"), JSON.stringify({
  "alibaba-plan": { access: "test-token" },
}));
fs.writeFileSync(path.join(agentHome, "alibaba-config.json"), JSON.stringify({
  planOpenAI: "https://example.invalid/compatible-mode/v1",
  planAnthropic: "https://example.invalid/apps/anthropic",
}));

process.env.HOME = tempHome;
globalThis.fetch = async () => new Response(JSON.stringify({
  data: [{ id: "deepseek-v4-pro" }],
}), { status: 200 });

const providers = new Map();
const jiti = createJiti(import.meta.url, { interopDefault: false });
const { default: registerAlibaba } = await jiti.import(
  `${process.env.PI_ALIBABA_ROOT ?? `${process.env.HOME}/.pi/agent/npm/node_modules/pi-alibaba-models`}/extensions/alibaba.ts`,
);
await registerAlibaba({
  registerProvider: (name, provider) => providers.set(name, provider),
  registerCommand: () => {},
  on: () => {},
});

const ids = providers.get("alibaba-plan").models.map((model) => model.id);
assert.ok(ids.includes("deepseek-v4-pro-0813"), "expected local 0813 alias in the Plan model picker");
fs.rmSync(tempHome, { recursive: true, force: true });
console.log("Alibaba DeepSeek V4 Pro 0813 alias test passed.");
