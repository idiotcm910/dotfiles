import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { addAccount, saveVault, type Vault } from "./store.ts";
import {
  activate,
  adopt,
  credentialsEqual,
  deleteAuthSlot,
  forceRemoveActive,
  isNewer,
  readAuthSlot,
  reconcileProvider,
  syncActiveFromAuth,
  writeAuthSlot,
} from "./auth-sync.ts";

function iso(): void {
  const dir = mkdtempSync(join(tmpdir(), "pi-acc-"));
  process.env.PI_ACCOUNTS_DIR = dir;
  mkdirSync(dir, { recursive: true, mode: 0o700 });
}

function seedAuth(extra: Record<string, unknown> = {}): void {
  writeFileSync(
    join(process.env.PI_ACCOUNTS_DIR!, "auth.json"),
    JSON.stringify(
      {
        "openai-codex": { type: "oauth", access: "keep", refresh: "keep", expires: 1 },
        "alibaba-plan": { type: "oauth", access: "keep2", refresh: "keep2", expires: 1 },
        ...extra,
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
}

function emptyVault(): Vault {
  return { version: 1, accounts: [] };
}

test("writeAuthSlot does not touch other providers", () => {
  iso();
  seedAuth();
  writeAuthSlot("xai", { type: "oauth", access: "new", refresh: "newr", expires: 2 });
  const parsed = JSON.parse(readFileSync(join(process.env.PI_ACCOUNTS_DIR!, "auth.json"), "utf8"));
  assert.equal(parsed["openai-codex"].access, "keep");
  assert.equal(parsed["alibaba-plan"].access, "keep2");
  assert.equal(parsed.xai.access, "new");
});

test("activate writes slot then marks active", () => {
  iso();
  seedAuth();
  let vault = addAccount(emptyVault(), {
    id: "1",
    alias: "work",
    provider: "antigravity",
    label: "a",
    active: true,
    credential: { type: "oauth", access: "old", refresh: "oldr", expires: 1 },
  });
  vault = addAccount(vault, {
    id: "2",
    alias: "home",
    provider: "antigravity",
    label: "b",
    active: false,
    credential: { type: "oauth", access: "homeA", refresh: "homeR", expires: 2 },
  });
  saveVault(vault);
  writeAuthSlot("antigravity", { type: "oauth", access: "old", refresh: "oldr", expires: 1 });
  const result = activate(vault, "home");
  const parsed = JSON.parse(readFileSync(join(process.env.PI_ACCOUNTS_DIR!, "auth.json"), "utf8"));
  assert.equal(parsed.antigravity.access, "homeA");
  assert.equal(parsed["openai-codex"].access, "keep");
  assert.equal(result.vault.accounts.find((a) => a.alias === "home")?.active, true);
  assert.equal(result.vault.accounts.find((a) => a.alias === "work")?.active, false);
});

test("adopt new alias requires provider", () => {
  iso();
  seedAuth({ xai: { type: "oauth", access: "s", refresh: "r", expires: 3 } });
  saveVault(emptyVault());
  assert.throws(() => adopt(emptyVault(), "personal"), /adopt requires/);
  const result = adopt(emptyVault(), "personal", "xai");
  assert.equal(result.vault.accounts[0]?.alias, "personal");
  assert.equal(result.vault.accounts[0]?.active, true);
});

test("forceRemoveActive deletes provider key only", () => {
  iso();
  seedAuth({ xai: { type: "oauth", access: "s", refresh: "r", expires: 3 } });
  let vault = addAccount(emptyVault(), {
    id: "1",
    alias: "personal",
    provider: "xai",
    label: "c",
    active: true,
    credential: { type: "oauth", access: "s", refresh: "r", expires: 3 },
  });
  saveVault(vault);
  const result = forceRemoveActive(vault, "personal");
  const parsed = JSON.parse(readFileSync(join(process.env.PI_ACCOUNTS_DIR!, "auth.json"), "utf8"));
  assert.equal(parsed.xai, undefined);
  assert.equal(parsed["openai-codex"].access, "keep");
  assert.equal(result.vault.accounts.length, 0);
});

test("reconcile mismatch and untracked and missing slot", () => {
  iso();
  let vault = addAccount(emptyVault(), {
    id: "1",
    alias: "work",
    provider: "antigravity",
    label: "a",
    active: true,
    credential: { type: "oauth", access: "a1", refresh: "r1", expires: 1 },
  });
  vault = addAccount(vault, {
    id: "2",
    alias: "home",
    provider: "antigravity",
    label: "b",
    active: false,
    credential: { type: "oauth", access: "a2", refresh: "r2", expires: 1 },
  });
  saveVault(vault);
  writeAuthSlot("antigravity", { type: "oauth", access: "a2", refresh: "r2", expires: 1 });
  const mismatch = reconcileProvider(vault, "antigravity");
  assert.match(mismatch.messages[0]?.text ?? "", /!= active alias work; matches home/);

  writeAuthSlot("antigravity", { type: "oauth", access: "zz", refresh: "zzr", expires: 1 });
  const untracked = reconcileProvider(vault, "antigravity");
  assert.match(untracked.messages[0]?.text ?? "", /untracked antigravity credential/);

  // missing slot
  writeFileSync(
    join(process.env.PI_ACCOUNTS_DIR!, "auth.json"),
    JSON.stringify({ "openai-codex": { type: "oauth", access: "k", refresh: "k", expires: 1 } }),
    { mode: 0o600 },
  );
  const missing = reconcileProvider(vault, "antigravity");
  assert.match(missing.messages[0]?.text ?? "", /auth.json missing antigravity; \/acc switch work/);
});

test("credentialsEqual compares refresh first then access", () => {
  assert.equal(
    credentialsEqual(
      { type: "oauth", access: "a1", refresh: "r1", expires: 1 },
      { type: "oauth", access: "a2", refresh: "r1", expires: 2 },
    ),
    true,
  );
  assert.equal(
    credentialsEqual(
      { type: "oauth", access: "a1", refresh: "r1", expires: 1 },
      { type: "oauth", access: "a1", refresh: "r2", expires: 1 },
    ),
    false,
  );
  assert.equal(
    credentialsEqual(
      { type: "oauth", access: "a1", refresh: "", expires: 1 },
      { type: "oauth", access: "a1", refresh: "", expires: 2 },
    ),
    true,
  );
  assert.equal(
    credentialsEqual(
      { type: "oauth", access: "a1", refresh: "", expires: 1 },
      { type: "oauth", access: "a2", refresh: "", expires: 1 },
    ),
    false,
  );
  assert.equal(credentialsEqual(undefined, { type: "oauth", access: "a1", refresh: "r", expires: 1 }), false);
});

test("isNewer compares expires and access", () => {
  const base = { type: "oauth" as const, access: "a1", refresh: "r1", expires: 100 };
  assert.equal(isNewer({ ...base, expires: 101 }, base), true);
  assert.equal(isNewer({ ...base, expires: 99 }, base), false);
  assert.equal(isNewer({ ...base, expires: 100, access: "a2" }, base), true);
  assert.equal(isNewer({ ...base, expires: 100, access: "a1" }, base), false);
});

test("readAuthSlot and deleteAuthSlot handles missing and invalid files", () => {
  iso();
  assert.equal(readAuthSlot("antigravity"), undefined);

  // invalid json
  writeFileSync(join(process.env.PI_ACCOUNTS_DIR!, "auth.json"), "invalid json");
  assert.equal(readAuthSlot("antigravity"), undefined);

  // delete on invalid json does not crash
  deleteAuthSlot("antigravity");
});

test("syncActiveFromAuth updates active account credentials and preserves unknown fields", () => {
  iso();
  seedAuth({
    antigravity: {
      type: "oauth",
      access: "synced-access",
      refresh: "synced-refresh",
      expires: 999,
      customSlotProp: "yes",
    },
  });

  const initialVault: Vault = {
    version: 1,
    accounts: [
      {
        id: "1",
        alias: "work",
        provider: "antigravity",
        label: "label1",
        active: true,
        credential: {
          type: "oauth",
          access: "old-access",
          refresh: "old-refresh",
          expires: 100,
          customVaultProp: "keep-me",
        },
      },
    ],
  };

  const synced = syncActiveFromAuth(initialVault, "antigravity");
  const cred = synced.accounts[0].credential;
  assert.equal(cred.access, "synced-access");
  assert.equal(cred.refresh, "synced-refresh");
  assert.equal(cred.expires, 999);
  assert.equal((cred as any).customVaultProp, "keep-me");
  assert.equal((cred as any).customSlotProp, "yes");
  assert.equal(synced.accounts[0].active, true);
});

test("activate does not flip flags if writeAuthSlot fails", () => {
  iso();
  const dir = process.env.PI_ACCOUNTS_DIR!;
  const vault: Vault = {
    version: 1,
    accounts: [
      {
        id: "1",
        alias: "work",
        provider: "antigravity",
        label: "a",
        active: true,
        credential: { type: "oauth", access: "w-acc", refresh: "w-ref", expires: 1 },
      },
      {
        id: "2",
        alias: "home",
        provider: "antigravity",
        label: "b",
        active: false,
        credential: { type: "oauth", access: "h-acc", refresh: "h-ref", expires: 1 },
      },
    ],
  };
  saveVault(vault);

  // Make directory read-only so writeAuthSlot fails
  chmodSync(dir, 0o500);
  try {
    assert.throws(() => activate(vault, "home"));
  } finally {
    chmodSync(dir, 0o700);
  }

  // Verify accounts.json was not updated to make home active
  const loaded = JSON.parse(readFileSync(join(dir, "accounts.json"), "utf8")) as Vault;
  assert.equal(loaded.accounts.find((a) => a.alias === "work")?.active, true);
  assert.equal(loaded.accounts.find((a) => a.alias === "home")?.active, false);
});

test("adopt handles existing alias, mismatch provider, and existing row provider inheritance", () => {
  iso();
  seedAuth({
    antigravity: { type: "oauth", access: "agy-acc", refresh: "agy-ref", expires: 50 },
    xai: { type: "oauth", access: "xai-acc", refresh: "xai-ref", expires: 60 },
  });

  let vault: Vault = {
    version: 1,
    accounts: [
      {
        id: "1",
        alias: "existing-agy",
        provider: "antigravity",
        label: "agy-label",
        active: false,
        credential: { type: "oauth", access: "old", refresh: "old", expires: 1 },
      },
    ],
  };
  saveVault(vault);

  // Existing alias + omitted provider -> uses existing-agy provider (antigravity)
  const adopted1 = adopt(vault, "existing-agy");
  const acc1 = adopted1.vault.accounts.find((a) => a.alias === "existing-agy");
  assert.equal(acc1?.credential.access, "agy-acc");
  assert.equal(acc1?.active, true);

  // Existing alias + mismatch provider -> throws error
  assert.throws(
    () => adopt(adopted1.vault, "existing-agy", "xai"),
    /alias "existing-agy" is antigravity, not xai/,
  );

  // Empty slot -> throws error
  deleteAuthSlot("xai");
  assert.throws(() => adopt(adopted1.vault, "new-xai", "xai"), /no auth\.json credential for xai/);
});

test("reconcileProvider handles startup cases comprehensively", () => {
  iso();
  // 1. No slot and no vault accounts -> no message
  const emptyRes = reconcileProvider(emptyVault(), "antigravity");
  assert.equal(emptyRes.messages.length, 0);

  // 2. Slot equals active and is newer -> updates vault row + save, no message
  seedAuth({
    antigravity: { type: "oauth", access: "newer-access", refresh: "r1", expires: 200 },
  });
  const vaultWithOldActive: Vault = {
    version: 1,
    accounts: [
      {
        id: "1",
        alias: "work",
        provider: "antigravity",
        label: "a",
        active: true,
        credential: { type: "oauth", access: "old-access", refresh: "r1", expires: 100 },
      },
    ],
  };
  saveVault(vaultWithOldActive);
  const newerRes = reconcileProvider(vaultWithOldActive, "antigravity");
  assert.equal(newerRes.messages.length, 0);
  assert.equal(newerRes.vault.accounts[0].credential.expires, 200);
  assert.equal(newerRes.vault.accounts[0].credential.access, "newer-access");

  // 3. Slot equals a non-active row with no active account -> warning with active alias none
  const vaultNoActive: Vault = {
    version: 1,
    accounts: [
      {
        id: "2",
        alias: "backup",
        provider: "antigravity",
        label: "b",
        active: false,
        credential: { type: "oauth", access: "newer-access", refresh: "r1", expires: 200 },
      },
    ],
  };
  saveVault(vaultNoActive);
  const noActiveRes = reconcileProvider(vaultNoActive, "antigravity");
  assert.equal(noActiveRes.messages.length, 1);
  assert.match(noActiveRes.messages[0].text, /auth\.json antigravity != active alias none; matches backup/);
});

test("writeAuthSlot always stamps type oauth even if missing", () => {
  iso();
  seedAuth();
  writeAuthSlot("antigravity", {
    access: "tok",
    refresh: "ref",
    expires: 9,
    email: "a@b.com",
    projectId: "proj",
  } as any);
  const parsed = JSON.parse(readFileSync(join(process.env.PI_ACCOUNTS_DIR!, "auth.json"), "utf8"));
  assert.equal(parsed.antigravity.type, "oauth");
  assert.equal(parsed.antigravity.access, "tok");
  assert.equal(parsed["openai-codex"].access, "keep");
});
