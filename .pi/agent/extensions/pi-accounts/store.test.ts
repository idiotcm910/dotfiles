import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  atomicWrite,
  loadVault,
  saveVault,
  accountsPath,
  authPath,
  agentDir,
  withFileLock,
  addAccount,
  renameAccount,
  removeAccount,
  setActive,
  suggestAlias,
  assertAlias,
  normalizeProvider,
  findByAlias,
  activeAccount,
  upsertAccount,
  updateUsage,
  normalizeOAuthCredential,
} from "./store.ts";

function isolatedDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "pi-acc-"));
  process.env.PI_ACCOUNTS_DIR = dir;
  mkdirSync(join(dir), { recursive: true, mode: 0o700 });
  return dir;
}

test("paths are derived from PI_ACCOUNTS_DIR", () => {
  const dir = isolatedDir();
  assert.equal(agentDir(), dir);
  assert.equal(accountsPath(), join(dir, "accounts.json"));
  assert.equal(authPath(), join(dir, "auth.json"));
});

test("atomicWrite creates 0600 file and ensures parent directories", () => {
  const dir = isolatedDir();
  const file = join(dir, "nested", "sub", "sample.json");
  atomicWrite(file, '{"ok":true}\n');
  assert.equal(readFileSync(file, "utf8"), '{"ok":true}\n');
  assert.equal(statSync(file).mode & 0o777, 0o600);
});

test("withFileLock executes callback and cleans up lock file", () => {
  const dir = isolatedDir();
  const target = join(dir, "target.json");
  const lockFile = `${target}.lock`;

  let executed = false;
  withFileLock(target, () => {
    executed = true;
    assert.equal(existsSync(lockFile), true);
  });

  assert.equal(executed, true);
  assert.equal(existsSync(lockFile), false);
});

test("withFileLock cleans up lock file even if callback throws", () => {
  const dir = isolatedDir();
  const target = join(dir, "target.json");
  const lockFile = `${target}.lock`;

  assert.throws(
    () => {
      withFileLock(target, () => {
        assert.equal(existsSync(lockFile), true);
        throw new Error("boom");
      });
    },
    /boom/,
  );

  assert.equal(existsSync(lockFile), false);
});

test("withFileLock throws when lock cannot be acquired after max attempts", () => {
  const dir = isolatedDir();
  const target = join(dir, "target.json");
  const lockFile = `${target}.lock`;

  writeFileSync(lockFile, "held-externally", { mode: 0o600 });
  assert.throws(
    () => {
      withFileLock(target, () => {
        // unreachable
      });
    },
    /Could not acquire lock/,
  );
});

test("loadVault missing file returns empty vault", () => {
  isolatedDir();
  assert.deepEqual(loadVault(), { version: 1, accounts: [] });
});

test("loadVault refuses corrupt file", () => {
  const dir = isolatedDir();
  writeFileSync(join(dir, "accounts.json"), "{not-json", { mode: 0o600 });
  assert.throws(() => loadVault(), /accounts\.json unreadable/);
});

test("loadVault refuses invalid structure", () => {
  const dir = isolatedDir();
  const file = join(dir, "accounts.json");

  // Not an object (e.g. array)
  writeFileSync(file, JSON.stringify([]), { mode: 0o600 });
  assert.throws(() => loadVault(), /accounts\.json unreadable/);

  // Wrong version
  writeFileSync(file, JSON.stringify({ version: 2, accounts: [] }), { mode: 0o600 });
  assert.throws(() => loadVault(), /accounts\.json unreadable/);

  // Accounts not array
  writeFileSync(file, JSON.stringify({ version: 1, accounts: "invalid" }), { mode: 0o600 });
  assert.throws(() => loadVault(), /accounts\.json unreadable/);
});

test("saveVault then loadVault roundtrips", () => {
  isolatedDir();
  const vault = {
    version: 1 as const,
    accounts: [
      {
        id: "id-1",
        alias: "work",
        provider: "antigravity" as const,
        label: "a@b.com",
        active: true,
        credential: {
          type: "oauth" as const,
          access: "tok",
          refresh: "ref",
          expires: 1,
        },
      },
    ],
  };
  saveVault(vault);
  assert.deepEqual(loadVault(), vault);
});

test("normalizeProvider accepts agy and grok", () => {
  assert.equal(normalizeProvider("agy"), "antigravity");
  assert.equal(normalizeProvider("GROK"), "xai");
  assert.throws(() => normalizeProvider("openai"), /unknown provider/);
});

test("assertAlias rejects leading dash and spaces", () => {
  assert.throws(() => assertAlias("-x"), /invalid alias/);
  assert.throws(() => assertAlias("my acc"), /invalid alias/);
  assertAlias("work_1");
});

test("addAccount rejects duplicate alias", () => {
  const empty = { version: 1 as const, accounts: [] };
  const once = addAccount(empty, {
    id: "1",
    alias: "work",
    provider: "antigravity",
    label: "a",
    active: true,
    credential: { type: "oauth", access: "a", refresh: "r", expires: 1 },
  });
  assert.throws(
    () =>
      addAccount(once, {
        id: "2",
        alias: "work",
        provider: "xai",
        label: "b",
        active: true,
        credential: { type: "oauth", access: "a", refresh: "r", expires: 1 },
      }),
    /already exists/,
  );
});

test("setActive is per provider", () => {
  let vault = { version: 1 as const, accounts: [] };
  vault = addAccount(vault, {
    id: "1",
    alias: "work",
    provider: "antigravity",
    label: "a",
    active: true,
    credential: { type: "oauth", access: "a", refresh: "r", expires: 1 },
  });
  vault = addAccount(vault, {
    id: "2",
    alias: "home",
    provider: "antigravity",
    label: "b",
    active: false,
    credential: { type: "oauth", access: "a", refresh: "r", expires: 1 },
  });
  vault = addAccount(vault, {
    id: "3",
    alias: "personal",
    provider: "xai",
    label: "c",
    active: true,
    credential: { type: "oauth", access: "a", refresh: "r", expires: 1 },
  });
  vault = setActive(vault, "home");
  assert.equal(vault.accounts.find((a) => a.alias === "work")?.active, false);
  assert.equal(vault.accounts.find((a) => a.alias === "home")?.active, true);
  assert.equal(vault.accounts.find((a) => a.alias === "personal")?.active, true);
});

test("suggestAlias finds prefix and distance-1", () => {
  assert.deepEqual(suggestAlias("wrok", ["work", "home"]), ["work"]);
  assert.deepEqual(suggestAlias("ho", ["work", "home"]), ["home"]);
  assert.deepEqual(suggestAlias("x", []), []);
});

test("rename and remove", () => {
  let vault = addAccount(
    { version: 1, accounts: [] },
    {
      id: "1",
      alias: "work",
      provider: "xai",
      label: "c",
      active: true,
      credential: { type: "oauth", access: "a", refresh: "r", expires: 1 },
    },
  );
  vault = renameAccount(vault, "work", "lab");
  assert.equal(vault.accounts[0]?.alias, "lab");
  vault = removeAccount(vault, "lab");
  assert.equal(vault.accounts.length, 0);
});

test("findByAlias and activeAccount", () => {
  const vault = {
    version: 1 as const,
    accounts: [
      {
        id: "1",
        alias: "work",
        provider: "antigravity" as const,
        label: "a",
        active: true,
        credential: { type: "oauth" as const, access: "a", refresh: "r", expires: 1 },
      },
      {
        id: "2",
        alias: "home",
        provider: "antigravity" as const,
        label: "b",
        active: false,
        credential: { type: "oauth" as const, access: "a", refresh: "r", expires: 1 },
      },
    ],
  };
  assert.equal(findByAlias(vault, "work")?.id, "1");
  assert.equal(findByAlias(vault, "missing"), undefined);
  assert.equal(activeAccount(vault, "antigravity")?.id, "1");
  assert.equal(activeAccount(vault, "xai"), undefined);
});

test("upsertAccount inserts new and updates existing preserving extra fields", () => {
  let vault = { version: 1 as const, accounts: [] };
  const acc1 = {
    id: "1",
    alias: "work",
    provider: "antigravity" as const,
    label: "a",
    active: true,
    credential: {
      type: "oauth" as const,
      access: "a1",
      refresh: "r1",
      expires: 100,
      customField: "extra-value",
    },
  };
  vault = upsertAccount(vault, acc1);
  assert.equal(vault.accounts.length, 1);
  assert.equal(vault.accounts[0]?.credential.customField, "extra-value");

  const acc1Updated = {
    ...acc1,
    label: "a-updated",
    credential: {
      ...acc1.credential,
      access: "a2",
    },
  };
  vault = upsertAccount(vault, acc1Updated);
  assert.equal(vault.accounts.length, 1);
  assert.equal(vault.accounts[0]?.label, "a-updated");
  assert.equal(vault.accounts[0]?.credential.access, "a2");
  assert.equal(vault.accounts[0]?.credential.customField, "extra-value");
});

test("updateUsage updates usage cache", () => {
  let vault = addAccount(
    { version: 1, accounts: [] },
    {
      id: "1",
      alias: "work",
      provider: "antigravity",
      label: "a",
      active: true,
      credential: { type: "oauth", access: "a", refresh: "r", expires: 1 },
    },
  );
  const usage = {
    fetchedAt: 123456,
    ok: true,
    summary: "50% remaining",
    error: null,
  };
  vault = updateUsage(vault, "work", usage);
  assert.deepEqual(vault.accounts[0]?.usage, usage);

  assert.throws(() => updateUsage(vault, "missing", usage), /unknown alias/);
});

test("renameAccount and removeAccount error conditions", () => {
  let vault = addAccount(
    { version: 1, accounts: [] },
    {
      id: "1",
      alias: "work",
      provider: "antigravity",
      label: "a",
      active: true,
      credential: { type: "oauth", access: "a", refresh: "r", expires: 1 },
    },
  );
  vault = addAccount(vault, {
    id: "2",
    alias: "home",
    provider: "antigravity",
    label: "b",
    active: false,
    credential: { type: "oauth", access: "a", refresh: "r", expires: 1 },
  });

  assert.throws(() => renameAccount(vault, "missing", "other"), /unknown alias/);
  assert.throws(() => renameAccount(vault, "work", "home"), /already exists/);
  assert.throws(() => renameAccount(vault, "work", "-invalid"), /invalid alias/);
  assert.throws(() => removeAccount(vault, "missing"), /unknown alias/);
});

test("suggestAlias limits to max 5 matches and handles edge cases", () => {
  const aliases = ["alpha1", "alpha2", "alpha3", "alpha4", "alpha5", "alpha6", "beta"];
  const suggestions = suggestAlias("alpha", aliases);
  assert.equal(suggestions.length, 5);
  assert.deepEqual(suggestions, ["alpha1", "alpha2", "alpha3", "alpha4", "alpha5"]);

  assert.deepEqual(suggestAlias("", aliases), []);
});

test("normalizeOAuthCredential stamps type oauth and keeps extras", () => {
  const cred = normalizeOAuthCredential({
    access: "a",
    refresh: "r",
    expires: 42,
    email: "e@x.com",
    projectId: "p",
  });
  assert.equal(cred.type, "oauth");
  assert.equal(cred.access, "a");
  assert.equal(cred.refresh, "r");
  assert.equal(cred.expires, 42);
  assert.equal(cred.email, "e@x.com");
  assert.equal(cred.projectId, "p");
  assert.throws(() => normalizeOAuthCredential({ access: "a" }), /invalid oauth credential/);
});

