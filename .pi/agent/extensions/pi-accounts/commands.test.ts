import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import {
  parseAccArgs,
  unknownAliasMessage,
  runAcc,
  type AccDeps,
} from "./commands.ts";
import {
  loadVault,
  saveVault,
  type Account,
  type OAuthCredential,
  type Vault,
} from "./store.ts";
import { writeAuthSlot, readAuthSlot } from "./auth-sync.ts";

function setupTempEnv(): { dir: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), "pi-accounts-cmd-test-"));
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

test("parseAccArgs parses empty, help, ls, usage, add, switch, rename, rm, adopt with agy/grok aliases", () => {
  assert.deepEqual(parseAccArgs(""), { cmd: "help" });
  assert.deepEqual(parseAccArgs("   "), { cmd: "help" });
  assert.deepEqual(parseAccArgs("help"), { cmd: "help" });
  assert.deepEqual(parseAccArgs("clear"), { cmd: "clear" });
  assert.deepEqual(parseAccArgs("dismiss"), { cmd: "clear" });
  assert.deepEqual(parseAccArgs("ls"), { cmd: "ls", full: false });
  assert.deepEqual(parseAccArgs("usage"), { cmd: "usage", alias: undefined, full: false });
  assert.deepEqual(parseAccArgs("usage work"), { cmd: "usage", alias: "work", full: false });
  assert.deepEqual(parseAccArgs("usage --full"), { cmd: "usage", alias: undefined, full: true });
  assert.deepEqual(parseAccArgs("usage work --full"), { cmd: "usage", alias: "work", full: true });
  assert.deepEqual(parseAccArgs("ls --full"), { cmd: "ls", full: true });
  assert.deepEqual(parseAccArgs("add antigravity work"), {
    cmd: "add",
    provider: "antigravity",
    alias: "work",
  });
  assert.deepEqual(parseAccArgs("add agy work"), {
    cmd: "add",
    provider: "agy",
    alias: "work",
  });
  assert.deepEqual(parseAccArgs("add grok mygrok"), {
    cmd: "add",
    provider: "grok",
    alias: "mygrok",
  });
  assert.deepEqual(parseAccArgs("switch work"), {
    cmd: "switch",
    alias: "work",
  });
  assert.deepEqual(parseAccArgs("rename work home"), {
    cmd: "rename",
    alias: "work",
    newAlias: "home",
  });
  assert.deepEqual(parseAccArgs("rm work"), {
    cmd: "rm",
    alias: "work",
    force: false,
  });
  assert.deepEqual(parseAccArgs("rm work --force"), {
    cmd: "rm",
    alias: "work",
    force: true,
  });
  assert.deepEqual(parseAccArgs("rm --force work"), {
    cmd: "rm",
    alias: "work",
    force: true,
  });
  assert.deepEqual(parseAccArgs("adopt work"), {
    cmd: "adopt",
    alias: "work",
    provider: undefined,
  });
  assert.deepEqual(parseAccArgs("adopt extra antigravity"), {
    cmd: "adopt",
    alias: "extra",
    provider: "antigravity",
  });
  assert.deepEqual(parseAccArgs("adopt extra grok"), {
    cmd: "adopt",
    alias: "extra",
    provider: "grok",
  });
});

test("unknownAliasMessage formats typo message with suggestions or plain error", () => {
  const msg1 = unknownAliasMessage("wrok", ["work", "home"]);
  assert.equal(msg1, 'unknown alias "wrok". did you mean: work');

  const msg2 = unknownAliasMessage("random", ["work", "home"]);
  assert.equal(msg2, 'unknown alias "random"');

  const msg3 = unknownAliasMessage("wrok", []);
  assert.equal(msg3, 'unknown alias "wrok"');
});

test("runAcc help prints short command list and active accounts", async () => {
  const { cleanup } = setupTempEnv();
  try {
    const res1 = await runAcc("help");
    assert.equal(res1.kind, "info");
    assert.match(res1.text, /antigravity\s+none/i);
    assert.match(res1.text, /xai\s+none/i);
    assert.match(res1.text, /\bls\b/);
    assert.match(res1.text, /\badd\b/);
    assert.match(res1.text, /─{10,}/);

    const vault: Vault = {
      version: 1,
      accounts: [
        {
          id: "1",
          alias: "work",
          provider: "antigravity",
          label: "w@g.com",
          active: true,
          credential: { type: "oauth", access: "acc1", refresh: "ref1", expires: 1000 },
        },
      ],
    };
    saveVault(vault);

    const res2 = await runAcc("");
    assert.equal(res2.kind, "info");
    assert.match(res2.text, /antigravity\s+work/i);
    assert.match(res2.text, /xai\s+none/i);
  } finally {
    cleanup();
  }
});

test("runAcc ls formats accounts and handles unreadable vault without touching auth.json", async () => {
  const { dir, cleanup } = setupTempEnv();
  try {
    const authFile = join(dir, "auth.json");
    writeFileSync(authFile, JSON.stringify({ antigravity: { access: "keepme" } }));

    const accountsFile = join(dir, "accounts.json");
    writeFileSync(accountsFile, "INVALID JSON {");

    const res = await runAcc("ls");
    assert.equal(res.kind, "error");
    assert.equal(res.text, "accounts.json unreadable; fix or delete it");

    // Ensure auth.json was not modified or corrupted
    const authRaw = readFileSync(authFile, "utf8");
    assert.match(authRaw, /keepme/);

    // Now with valid vault
    const validVault: Vault = {
      version: 1,
      accounts: [
        {
          id: "1",
          alias: "work",
          provider: "antigravity",
          label: "work@company.com",
          active: true,
          credential: { type: "oauth", access: "a", refresh: "r", expires: 1000 },
          usage: {
            fetchedAt: Date.now(),
            ok: true,
            summary: "Google AI Pro · 72%",
            error: null,
          },
        },
      ],
    };
    saveVault(validVault);

    const lsRes = await runAcc("ls");
    assert.equal(lsRes.kind, "info");
    assert.match(lsRes.text, /\* work {2}· {2}antigravity {2}· {2}work@company\.com/);
    assert.match(lsRes.text, /plan {3}Google AI Pro/);
    assert.match(lsRes.text, /age {4}\(/);
  } finally {
    cleanup();
  }
});

test("runAcc add adds stored vs active, activates first, invokes waitForIdle", async () => {
  const { cleanup } = setupTempEnv();
  try {
    let idleCalled = 0;
    const deps: AccDeps = {
      waitForIdle: async () => {
        idleCalled++;
      },
      login: async (provider) => {
        return {
          type: "oauth",
          access: `access-${provider}`,
          refresh: `refresh-${provider}`,
          expires: Date.now() + 3600_000,
          email: "user1@example.com",
        };
      },
    };

    // First account should become [active] and written to auth.json
    const res1 = await runAcc("add antigravity work", deps);
    assert.equal(res1.kind, "info");
    assert.match(res1.text, /added work \(antigravity, user1@example\.com\) \[active\]/);
    assert.equal(idleCalled, 1);

    const authSlot1 = readAuthSlot("antigravity");
    assert.equal(authSlot1?.refresh, "refresh-antigravity");

    const vault1 = loadVault();
    assert.equal(vault1.accounts.length, 1);
    assert.equal(vault1.accounts[0].active, true);

    // Second account for same provider should become [stored] and auth.json unchanged
    const deps2: AccDeps = {
      waitForIdle: async () => {
        idleCalled++;
      },
      login: async () => {
        return {
          type: "oauth",
          access: "access-personal",
          refresh: "refresh-personal",
          expires: Date.now() + 3600_000,
          email: "personal@example.com",
        };
      },
    };

    const res2 = await runAcc("add agy personal", deps2);
    assert.equal(res2.kind, "info");
    assert.match(res2.text, /added personal \(antigravity, personal@example\.com\) \[stored\]/);
    assert.equal(idleCalled, 2);

    const authSlot2 = readAuthSlot("antigravity");
    assert.equal(authSlot2?.refresh, "refresh-antigravity"); // still work

    const vault2 = loadVault();
    assert.equal(vault2.accounts.length, 2);
    const personalAcc = vault2.accounts.find((a) => a.alias === "personal");
    assert.equal(personalAcc?.active, false);

    // Duplicate alias error
    const resDup = await runAcc("add antigravity work", deps);
    assert.equal(resDup.kind, "error");
    assert.match(resDup.text, /alias "work" already exists/);
  } finally {
    cleanup();
  }
});

test("runAcc add surfaces OAuth progress via notify and clears widget/status", async () => {
  const { cleanup } = setupTempEnv();
  try {
    const notes: string[] = [];
    const statuses: Array<string | undefined> = [];
    const widgets: Array<string[] | undefined> = [];
    let sawNotifierUrl = false;

    const res = await runAcc("add agy oauth-probe", {
      waitForIdle: async () => {},
      notify: (m) => notes.push(m),
      log: (m) => notes.push(`log:${m}`),
      setStatus: (_k, text) => statuses.push(text),
      setWidget: (_k, lines) => widgets.push(lines),
      login: async (_provider, notifier) => {
        notifier.notify("https://accounts.google.com/o/oauth2/v2/auth?demo=1");
        notifier.log("https://accounts.google.com/o/oauth2/v2/auth?demo=1");
        sawNotifierUrl = true;
        return {
          type: "oauth",
          access: "access-probe",
          refresh: "refresh-probe",
          expires: Date.now() + 3600_000,
          email: "probe@example.com",
        };
      },
    });

    assert.equal(res.kind, "info");
    assert.match(res.text, /added oauth-probe/);
    assert.equal(sawNotifierUrl, true);
    assert.ok(notes.some((n) => /OAuth|waiting for idle|oauth-probe/i.test(n)));
    // Full URL must not be spammed into session log via deps.log
    assert.equal(
      notes.some((n) => n.startsWith("log:") && n.includes("accounts.google.com")),
      false,
    );
    assert.ok(
      widgets.some((w) => Array.isArray(w) && w.some((line) => line.includes("accounts.google.com"))),
      "URL shown in ephemeral widget",
    );
    assert.ok(statuses.includes(undefined), "status cleared in finally");
    assert.ok(widgets.includes(undefined), "widget cleared in finally");
  } finally {
    cleanup();
  }
});

test("runAcc switch switches active account and invokes waitForIdle", async () => {
  const { cleanup } = setupTempEnv();
  try {
    let idleCalled = 0;
    const deps: AccDeps = {
      waitForIdle: async () => {
        idleCalled++;
      },
    };

    const vault: Vault = {
      version: 1,
      accounts: [
        {
          id: "1",
          alias: "work",
          provider: "antigravity",
          label: "work@example.com",
          active: true,
          credential: { type: "oauth", access: "acc-w", refresh: "ref-w", expires: 1000 },
        },
        {
          id: "2",
          alias: "personal",
          provider: "antigravity",
          label: "pers@example.com",
          active: false,
          credential: { type: "oauth", access: "acc-p", refresh: "ref-p", expires: 1000 },
        },
      ],
    };
    saveVault(vault);
    writeAuthSlot("antigravity", vault.accounts[0].credential);

    // Switch typo
    const resTypo = await runAcc("switch persnal", deps);
    assert.equal(resTypo.kind, "error");
    assert.equal(resTypo.text, 'unknown alias "persnal". did you mean: personal');

    // Switch success
    const resSwitch = await runAcc("switch personal", deps);
    assert.equal(resSwitch.kind, "info");
    assert.match(resSwitch.text, /switched antigravity → personal \(pers@example\.com\)/);
    assert.equal(idleCalled, 1);

    const currentSlot = readAuthSlot("antigravity");
    assert.equal(currentSlot?.refresh, "ref-p");

    const currentVault = loadVault();
    assert.equal(currentVault.accounts.find((a) => a.alias === "personal")?.active, true);
    assert.equal(currentVault.accounts.find((a) => a.alias === "work")?.active, false);
  } finally {
    cleanup();
  }
});

test("runAcc rename renames alias and validates duplicate", async () => {
  const { cleanup } = setupTempEnv();
  try {
    const vault: Vault = {
      version: 1,
      accounts: [
        {
          id: "1",
          alias: "work",
          provider: "antigravity",
          label: "work@example.com",
          active: true,
          credential: { type: "oauth", access: "acc-w", refresh: "ref-w", expires: 1000 },
        },
        {
          id: "2",
          alias: "home",
          provider: "antigravity",
          label: "home@example.com",
          active: false,
          credential: { type: "oauth", access: "acc-h", refresh: "ref-h", expires: 1000 },
        },
      ],
    };
    saveVault(vault);

    const resDup = await runAcc("rename work home");
    assert.equal(resDup.kind, "error");
    assert.match(resDup.text, /alias "home" already exists/);

    const resUnknown = await runAcc("rename missing newalias");
    assert.equal(resUnknown.kind, "error");
    assert.match(resUnknown.text, /unknown alias "missing"/);

    const resSuccess = await runAcc("rename work office");
    assert.equal(resSuccess.kind, "info");
    assert.equal(resSuccess.text, "renamed work → office");

    const updatedVault = loadVault();
    assert.ok(updatedVault.accounts.some((a) => a.alias === "office"));
    assert.ok(!updatedVault.accounts.some((a) => a.alias === "work"));
  } finally {
    cleanup();
  }
});

test("runAcc rm refuses active account without --force and deletes slot with --force", async () => {
  const { cleanup } = setupTempEnv();
  try {
    let idleCalled = 0;
    const deps: AccDeps = {
      waitForIdle: async () => {
        idleCalled++;
      },
    };

    const vault: Vault = {
      version: 1,
      accounts: [
        {
          id: "1",
          alias: "work",
          provider: "antigravity",
          label: "work@example.com",
          active: true,
          credential: { type: "oauth", access: "acc-w", refresh: "ref-w", expires: 1000 },
        },
        {
          id: "2",
          alias: "inactive",
          provider: "antigravity",
          label: "in@example.com",
          active: false,
          credential: { type: "oauth", access: "acc-i", refresh: "ref-i", expires: 1000 },
        },
      ],
    };
    saveVault(vault);
    writeAuthSlot("antigravity", vault.accounts[0].credential);

    // Remove inactive succeeds without --force
    const resInactive = await runAcc("rm inactive", deps);
    assert.equal(resInactive.kind, "info");
    assert.equal(resInactive.text, "removed inactive");
    assert.equal(idleCalled, 1);
    assert.ok(readAuthSlot("antigravity") !== undefined);

    // Remove active without --force is refused
    const resRefused = await runAcc("rm work", deps);
    assert.equal(resRefused.kind, "error");
    assert.equal(resRefused.text, "work is active; switch away or pass --force");

    // Remove active with --force succeeds and removes slot from auth.json
    const resForce = await runAcc("rm work --force", deps);
    assert.equal(resForce.kind, "info");
    assert.equal(resForce.text, "removed work");
    assert.equal(idleCalled, 2);

    assert.equal(readAuthSlot("antigravity"), undefined);
    const finalVault = loadVault();
    assert.equal(finalVault.accounts.length, 0);
  } finally {
    cleanup();
  }
});

test("runAcc adopt adopts slot into vault with agy/grok alias and invokes waitForIdle", async () => {
  const { cleanup } = setupTempEnv();
  try {
    let idleCalled = 0;
    const deps: AccDeps = {
      waitForIdle: async () => {
        idleCalled++;
      },
    };

    writeAuthSlot("antigravity", {
      type: "oauth",
      access: "slot-acc",
      refresh: "slot-ref",
      expires: 2000,
      email: "adopted@example.com",
    });

    const res = await runAcc("adopt imported agy", deps);
    assert.equal(res.kind, "info");
    assert.match(res.text, /adopted imported \(antigravity, adopted@example\.com\)/);
    assert.equal(idleCalled, 1);

    const vault = loadVault();
    assert.equal(vault.accounts.length, 1);
    assert.equal(vault.accounts[0].alias, "imported");
    assert.equal(vault.accounts[0].active, true);
    assert.equal(vault.accounts[0].credential.refresh, "slot-ref");
  } finally {
    cleanup();
  }
});

test("runAcc usage continues after one throw and updates all targets", async () => {
  const { cleanup } = setupTempEnv();
  try {
    const vault: Vault = {
      version: 1,
      accounts: [
        {
          id: "1",
          alias: "acc1",
          provider: "antigravity",
          label: "a1@example.com",
          active: true,
          credential: { type: "oauth", access: "acc-1", refresh: "ref-1", expires: 1000 },
        },
        {
          id: "2",
          alias: "acc2",
          provider: "xai",
          label: "team-123",
          active: true,
          credential: { type: "oauth", access: "acc-2", refresh: "ref-2", expires: 1000 },
        },
      ],
    };
    saveVault(vault);

    let fetchCount = 0;
    const deps: AccDeps = {
      fetchUsage: async (acc) => {
        fetchCount++;
        if (acc.alias === "acc1") {
          throw new Error("Network timeout 504 ya29.secretToken123");
        }
        return {
          fetchedAt: 12345,
          ok: true,
          summary: "xAI subscription · quota n/a",
          error: null,
        };
      },
    };

    const res = await runAcc("usage", deps);
    assert.equal(res.kind, "info");
    assert.equal(fetchCount, 2);

    // Secrets should be redacted
    assert.ok(!res.text.includes("secretToken123"));
    assert.ok(!res.text.includes("ya29."));
    assert.match(res.text, /acc1/);
    assert.match(res.text, /acc2/);

    const updatedVault = loadVault();
    const a1 = updatedVault.accounts.find((a) => a.alias === "acc1");
    const a2 = updatedVault.accounts.find((a) => a.alias === "acc2");

    assert.equal(a1?.usage?.ok, false);
    assert.match(a1?.usage?.error || "", /\[redacted\]/);
    assert.equal(a2?.usage?.ok, true);
    assert.equal(a2?.usage?.summary, "xAI subscription · quota n/a");

    // Single usage target
    const singleRes = await runAcc("usage acc2", deps);
    assert.equal(singleRes.kind, "info");
    assert.match(singleRes.text, /\* acc2 {2}· {2}xai/);
  } finally {
    cleanup();
  }
});

test("runAcc handles error cases and argument validation across all commands", async () => {
  const { cleanup } = setupTempEnv();
  try {
    // Missing arguments
    const addMissing = await runAcc("add");
    assert.equal(addMissing.kind, "error");
    assert.match(addMissing.text, /usage: \/acc add/);

    const switchMissing = await runAcc("switch");
    assert.equal(switchMissing.kind, "error");
    assert.match(switchMissing.text, /usage: \/acc switch/);

    const renameMissing = await runAcc("rename");
    assert.equal(renameMissing.kind, "error");
    assert.match(renameMissing.text, /usage: \/acc rename/);

    const rmMissing = await runAcc("rm");
    assert.equal(rmMissing.kind, "error");
    assert.match(rmMissing.text, /usage: \/acc rm/);

    const adoptMissing = await runAcc("adopt");
    assert.equal(adoptMissing.kind, "error");
    assert.match(adoptMissing.text, /usage: \/acc adopt/);

    // Empty usage
    const usageEmpty = await runAcc("usage");
    assert.equal(usageEmpty.kind, "info");
    assert.equal(usageEmpty.text, "no accounts configured");

    const usageUnknown = await runAcc("usage nonexistent");
    assert.equal(usageUnknown.kind, "error");
    assert.match(usageUnknown.text, /unknown alias "nonexistent"/);

    // Invalid alias format in add
    const addInvalid = await runAcc("add antigravity -badalias");
    assert.equal(addInvalid.kind, "error");
    assert.match(addInvalid.text, /invalid alias "-badalias"/);

    // Unknown provider in add
    const addUnknownProv = await runAcc("add unknownprovider goodalias");
    assert.equal(addUnknownProv.kind, "error");
    assert.match(addUnknownProv.text, /unknown provider "unknownprovider"/);

    // Secret redaction in login errors
    const depsFail: AccDeps = {
      login: async () => {
        throw new Error("Failed with secret ya29.SECRETTOKEN123 in url");
      },
    };
    const addFail = await runAcc("add antigravity myalias", depsFail);
    assert.equal(addFail.kind, "error");
    assert.ok(!addFail.text.includes("ya29.SECRETTOKEN123"));
    assert.match(addFail.text, /\[redacted\]/);
  } finally {
    cleanup();
  }
});

test("runAcc usage token refresh updates auth slot if active and vault row if inactive", async () => {
  const { cleanup } = setupTempEnv();
  try {
    const initialVault: Vault = {
      version: 1,
      accounts: [
        {
          id: "1",
          alias: "active-acc",
          provider: "antigravity",
          label: "active@example.com",
          active: true,
          credential: { type: "oauth", access: "old-active-acc", refresh: "old-active-ref", expires: 1000 },
        },
        {
          id: "2",
          alias: "inactive-acc",
          provider: "antigravity",
          label: "inactive@example.com",
          active: false,
          credential: { type: "oauth", access: "old-in-acc", refresh: "old-in-ref", expires: 1000 },
        },
      ],
    };
    saveVault(initialVault);
    writeAuthSlot("antigravity", initialVault.accounts[0].credential);

    const deps: AccDeps = {
      fetchUsage: async (account) => {
        if (account.alias === "active-acc") {
          account.credential.access = "new-active-acc";
          account.credential.refresh = "new-active-ref";
          account.credential.expires = 9999;
        } else if (account.alias === "inactive-acc") {
          account.credential.access = "new-in-acc";
          account.credential.refresh = "new-in-ref";
          account.credential.expires = 8888;
        }
        return {
          fetchedAt: 2000,
          ok: true,
          summary: "Usage summary",
          error: null,
        };
      },
    };

    const res = await runAcc("usage", deps);
    assert.equal(res.kind, "info");

    const authSlot = readAuthSlot("antigravity");
    // auth.json should have the rotated credential for the active account
    assert.equal(authSlot?.refresh, "new-active-ref");
    assert.equal(authSlot?.access, "new-active-acc");

    // Both vault rows should be updated
    const updatedVault = loadVault();
    const activeRow = updatedVault.accounts.find((a) => a.alias === "active-acc");
    const inactiveRow = updatedVault.accounts.find((a) => a.alias === "inactive-acc");

    assert.equal(activeRow?.credential.refresh, "new-active-ref");
    assert.equal(inactiveRow?.credential.refresh, "new-in-ref");
  } finally {
    cleanup();
  }
});

