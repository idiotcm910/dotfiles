import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import factory from "./index.ts";
import { loadVault, saveVault, type Vault } from "./store.ts";
import { writeAuthSlot, readAuthSlot, deleteAuthSlot } from "./auth-sync.ts";

function setupTempEnv(): { dir: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), "pi-accounts-factory-test-"));
  const prevDir = process.env.PI_ACCOUNTS_DIR;
  process.env.PI_ACCOUNTS_DIR = dir;
  return {
    dir,
    cleanup: () => {
      if (prevDir !== undefined) {
        process.env.PI_ACCOUNTS_DIR = prevDir;
      } else {
        delete process.env.PI_ACCOUNTS_DIR;
      }
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

type MockExtensionAPI = {
  commands: Record<string, { description?: string; handler: (args: string, ctx: any) => Promise<void> }>;
  events: Record<string, ((event: any, ctx: any) => Promise<void>)[]>;
  registerCommand: (name: string, options: any) => void;
  on: (event: string, handler: any) => void;
};

function createMockPi(): MockExtensionAPI {
  const commands: MockExtensionAPI["commands"] = {};
  const events: MockExtensionAPI["events"] = {};

  return {
    commands,
    events,
    registerCommand(name, options) {
      commands[name] = options;
    },
    on(event, handler) {
      if (!events[event]) events[event] = [];
      events[event].push(handler);
    },
  };
}

test("extension factory registers only 'acc' command and lifecycle hooks", () => {
  const mockPi = createMockPi();
  factory(mockPi as any);

  assert.deepEqual(Object.keys(mockPi.commands), ["acc"]);
  assert.ok(mockPi.commands["acc"].description?.includes("Manage Antigravity and xAI"));
  assert.equal(typeof mockPi.commands["acc"].handler, "function");

  const eventNames = Object.keys(mockPi.events).sort();
  assert.deepEqual(eventNames, ["agent_settled", "session_start", "turn_end"]);
  assert.equal(mockPi.events["session_start"].length, 1);
  assert.equal(mockPi.events["turn_end"].length, 1);
  assert.equal(mockPi.events["agent_settled"].length, 1);
});

test("all commands present output via floating scrollable overlay", async () => {
  const env = setupTempEnv();
  try {
    const mockPi = createMockPi();
    factory(mockPi as any);

    const customCalls: Array<{ title?: string; lines?: string[] }> = [];
    const theme = {
      fg: (_c: string, t: string) => t,
      bold: (t: string) => t,
    };
    const ctx = {
      hasUI: true,
      mode: "tui",
      ui: {
        notify: () => {},
        setStatus: () => {},
        setWidget: () => {},
        custom: async (factoryFn: any) => {
          const pager = factoryFn({ requestRender: () => {} }, theme, {}, () => {});
          assert.equal(typeof pager.handleInput, "function");
          assert.equal(typeof pager.render, "function");
          const view = pager.render(80);
          customCalls.push({ lines: view });
        },
      },
      waitForIdle: async () => {},
    };

    // 1. Help command -> opens overlay
    await mockPi.commands["acc"].handler("", ctx);
    assert.equal(customCalls.length, 1);
    assert.ok(customCalls[0].lines?.some((l) => l.includes("/acc help") || l.includes("Commands")));

    // 2. Switch command (error or success) -> also opens clean overlay
    customCalls.length = 0;
    await mockPi.commands["acc"].handler("switch missing", ctx);
    assert.equal(customCalls.length, 1);
    assert.ok(customCalls[0].lines?.some((l) => l.includes("unknown alias")));

    // 3. Clear command -> dismisses without custom overlay
    customCalls.length = 0;
    await mockPi.commands["acc"].handler("clear", ctx);
    assert.equal(customCalls.length, 0);
  } finally {
    env.cleanup();
  }
});

test("session_start folds vault across providers and reports reconcile messages", async () => {
  const env = setupTempEnv();
  try {
    const mockPi = createMockPi();
    factory(mockPi as any);

    // Seed an untracked slot for antigravity and a missing active for xai
    writeAuthSlot("antigravity", {
      type: "oauth",
      access: "untracked-token",
      refresh: "untracked-refresh",
      expires: 1000,
    });

    let vault: Vault = {
      version: 1,
      accounts: [
        {
          id: "agy-1",
          alias: "work",
          provider: "antigravity",
          label: "work@company.com",
          active: true,
          credential: {
            type: "oauth",
            access: "old-access",
            refresh: "old-refresh",
            expires: 1000,
          },
        },
        {
          id: "xai-1",
          alias: "xai-main",
          provider: "xai",
          label: "xai-main",
          active: true,
          credential: {
            type: "oauth",
            access: "xai-access",
            refresh: "xai-refresh",
            expires: 1000,
          },
        },
      ],
    };
    saveVault(vault);

    // Clear auth slot for xai
    deleteAuthSlot("xai");

    const notifications: { message: string; kind: string }[] = [];
    const ctx = {
      hasUI: true,
      ui: {
        notify: (message: string, kind: string) => {
          notifications.push({ message, kind });
        },
      },
    };

    const sessionStartHandler = mockPi.events["session_start"][0];
    await sessionStartHandler({}, ctx);

    // Messages should be emitted for untracked antigravity and missing xai slot
    assert.ok(notifications.length >= 2);
    assert.ok(notifications.some((n) => n.message.includes("untracked antigravity")));
    assert.ok(notifications.some((n) => n.message.includes("auth.json missing xai")));

    // Vault should have been preserved and saved
    const reloaded = loadVault();
    assert.equal(reloaded.accounts.length, 2);
  } finally {
    env.cleanup();
  }
});

test("session_start handles corrupt vault gracefully without throwing", async () => {
  const env = setupTempEnv();
  try {
    const mockPi = createMockPi();
    factory(mockPi as any);

    writeFileSync(join(process.env.PI_ACCOUNTS_DIR!, "accounts.json"), "CORRUPT JSON");

    const notifications: { message: string; kind: string }[] = [];
    const ctx = {
      hasUI: true,
      ui: {
        notify: (message: string, kind: string) => {
          notifications.push({ message, kind });
        },
      },
    };

    const sessionStartHandler = mockPi.events["session_start"][0];
    // Must not throw
    await sessionStartHandler({}, ctx);
    assert.ok(notifications.some((n) => n.message.includes("accounts.json unreadable")));
  } finally {
    env.cleanup();
  }
});

test("turn_end and agent_settled sync updated auth slot back into vault", async () => {
  const env = setupTempEnv();
  try {
    const mockPi = createMockPi();
    factory(mockPi as any);

    let vault: Vault = {
      version: 1,
      accounts: [
        {
          id: "1",
          alias: "active-agy",
          provider: "antigravity",
          label: "active@example.com",
          active: true,
          credential: {
            type: "oauth",
            access: "old-access",
            refresh: "old-refresh",
            expires: 1000,
          },
        },
      ],
    };
    saveVault(vault);

    // Write updated token into auth.json (simulating Pi token refresh)
    writeAuthSlot("antigravity", {
      type: "oauth",
      access: "refreshed-access-token",
      refresh: "refreshed-refresh-token",
      expires: 99999,
      email: "active@example.com",
    });

    const ctx = {
      hasUI: true,
      ui: { notify: () => {} },
    };

    const turnEndHandler = mockPi.events["turn_end"][0];
    await turnEndHandler({}, ctx);

    let reloaded = loadVault();
    assert.equal(reloaded.accounts[0].credential.access, "refreshed-access-token");
    assert.equal(reloaded.accounts[0].credential.refresh, "refreshed-refresh-token");

    // Repeat for agent_settled
    writeAuthSlot("antigravity", {
      type: "oauth",
      access: "settled-access-token",
      refresh: "settled-refresh-token",
      expires: 123456,
      email: "active@example.com",
    });

    const agentSettledHandler = mockPi.events["agent_settled"][0];
    await agentSettledHandler({}, ctx);

    reloaded = loadVault();
    assert.equal(reloaded.accounts[0].credential.access, "settled-access-token");
  } finally {
    env.cleanup();
  }
});
