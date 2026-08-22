import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { labelFromCredential } from "./oauth.ts";
import {
  activeAccount,
  assertAlias,
  atomicWrite,
  authPath,
  findByAlias,
  normalizeOAuthCredential,
  removeAccount,
  saveVault,
  setActive,
  upsertAccount,
  withFileLock,
  type Account,
  type OAuthCredential,
  type ProviderId,
  type Vault,
} from "./store.ts";

export type ReconcileMessage = { level: "info" | "warning"; text: string };

export function readAuthSlot(provider: ProviderId): OAuthCredential | undefined {
  const file = authPath();
  if (!existsSync(file)) {
    return undefined;
  }
  try {
    const raw = readFileSync(file, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return undefined;
    }
    const val = parsed[provider];
    if (!val || typeof val !== "object" || Array.isArray(val)) {
      return undefined;
    }
    try {
      return normalizeOAuthCredential(val);
    } catch {
      return undefined;
    }
  } catch {
    return undefined;
  }
}

export function writeAuthSlot(provider: ProviderId, cred: OAuthCredential): void {
  withFileLock(authPath(), () => {
    const file = authPath();
    let data: Record<string, unknown> = {};
    if (existsSync(file)) {
      try {
        const raw = readFileSync(file, "utf8");
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          data = parsed;
        }
      } catch {
        data = {};
      }
    }
    // Always stamp type:"oauth" so Pi AuthStorage accepts the slot.
    data[provider] = normalizeOAuthCredential(cred);
    atomicWrite(file, JSON.stringify(data, null, 2) + "\n");
  });
}

export function deleteAuthSlot(provider: ProviderId): void {
  withFileLock(authPath(), () => {
    const file = authPath();
    if (!existsSync(file)) {
      return;
    }
    let data: Record<string, unknown> = {};
    try {
      const raw = readFileSync(file, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        data = parsed;
      }
    } catch {
      return;
    }
    if (provider in data) {
      delete data[provider];
      atomicWrite(file, JSON.stringify(data, null, 2) + "\n");
    }
  });
}

export function credentialsEqual(a?: OAuthCredential, b?: OAuthCredential): boolean {
  if (!a || !b) return false;
  if (
    typeof a.refresh === "string" &&
    a.refresh.length > 0 &&
    typeof b.refresh === "string" &&
    b.refresh.length > 0
  ) {
    return a.refresh === b.refresh;
  }
  if (
    typeof a.access === "string" &&
    a.access.length > 0 &&
    typeof b.access === "string" &&
    b.access.length > 0
  ) {
    return a.access === b.access;
  }
  return false;
}

export function isNewer(slot: OAuthCredential, vault: OAuthCredential): boolean {
  const slotExpires = typeof slot.expires === "number" ? slot.expires : 0;
  const vaultExpires = typeof vault.expires === "number" ? vault.expires : 0;
  if (slotExpires > vaultExpires) return true;
  if (slotExpires === vaultExpires && slot.access !== vault.access) return true;
  return false;
}

export function syncActiveFromAuth(vault: Vault, provider: ProviderId): Vault {
  const active = activeAccount(vault, provider);
  if (!active) {
    return vault;
  }
  const slot = readAuthSlot(provider);
  if (!slot) {
    return vault;
  }
  return {
    ...vault,
    accounts: vault.accounts.map((a) => {
      if (a.alias === active.alias) {
        return {
          ...a,
          credential: normalizeOAuthCredential({
            ...a.credential,
            ...slot,
          }),
        };
      }
      return a;
    }),
  };
}

export function activate(vault: Vault, alias: string): { vault: Vault } {
  const chosen = findByAlias(vault, alias);
  if (!chosen) {
    throw new Error(`unknown alias "${alias}"`);
  }
  let updatedVault = syncActiveFromAuth(vault, chosen.provider);
  const latestChosen = findByAlias(updatedVault, alias) || chosen;
  const credential = normalizeOAuthCredential(latestChosen.credential);
  // Keep vault row in sync with the normalized slot we write.
  updatedVault = {
    ...updatedVault,
    accounts: updatedVault.accounts.map((a) =>
      a.alias === alias ? { ...a, credential } : a,
    ),
  };
  writeAuthSlot(latestChosen.provider, credential);
  updatedVault = setActive(updatedVault, alias);
  saveVault(updatedVault);
  return { vault: updatedVault };
}

export function adopt(
  vault: Vault,
  alias: string,
  provider?: ProviderId,
): { vault: Vault } {
  assertAlias(alias);
  const existing = findByAlias(vault, alias);
  let targetProvider: ProviderId;

  if (existing) {
    if (provider && provider !== existing.provider) {
      throw new Error(`alias "${alias}" is ${existing.provider}, not ${provider}`);
    }
    targetProvider = existing.provider;
  } else {
    if (!provider) {
      throw new Error("adopt requires <alias> <provider>");
    }
    targetProvider = provider;
  }

  const slot = readAuthSlot(targetProvider);
  if (!slot) {
    throw new Error(`no auth.json credential for ${targetProvider}`);
  }

  let updatedAccount: Account;
  if (existing) {
    const credential = normalizeOAuthCredential({ ...existing.credential, ...slot });
    updatedAccount = {
      ...existing,
      credential,
      label: existing.label || labelFromCredential(targetProvider, credential),
    };
  } else {
    const credential = normalizeOAuthCredential(slot);
    updatedAccount = {
      id: randomUUID(),
      alias,
      provider: targetProvider,
      label: labelFromCredential(targetProvider, credential),
      active: true,
      credential,
    };
  }

  let updatedVault = upsertAccount(vault, updatedAccount);
  updatedVault = setActive(updatedVault, alias);
  saveVault(updatedVault);
  return { vault: updatedVault };
}

export function forceRemoveActive(vault: Vault, alias: string): { vault: Vault } {
  const account = findByAlias(vault, alias);
  if (!account) {
    throw new Error(`unknown alias "${alias}"`);
  }
  const updatedVault = removeAccount(vault, alias);
  deleteAuthSlot(account.provider);
  saveVault(updatedVault);
  return { vault: updatedVault };
}

export function reconcileProvider(
  vault: Vault,
  provider: ProviderId,
): {
  vault: Vault;
  messages: ReconcileMessage[];
} {
  const slot = readAuthSlot(provider);
  const providerAccounts = vault.accounts.filter((a) => a.provider === provider);
  const active = activeAccount(vault, provider);

  if (!slot) {
    if (active) {
      return {
        vault,
        messages: [
          {
            level: "warning",
            text: `auth.json missing ${provider}; /acc switch ${active.alias}`,
          },
        ],
      };
    }
    return { vault, messages: [] };
  }

  const matchingAccount = providerAccounts.find((a) => credentialsEqual(slot, a.credential));

  if (matchingAccount) {
    if (active && matchingAccount.alias === active.alias) {
      let currentVault = vault;
      if (isNewer(slot, active.credential)) {
        currentVault = {
          ...vault,
          accounts: vault.accounts.map((a) =>
            a.alias === active.alias
              ? { ...a, credential: { ...a.credential, ...slot } }
              : a,
          ),
        };
        saveVault(currentVault);
      }
      return { vault: currentVault, messages: [] };
    }

    let currentVault = vault;
    if (isNewer(slot, matchingAccount.credential)) {
      currentVault = {
        ...vault,
        accounts: vault.accounts.map((a) =>
          a.alias === matchingAccount.alias
            ? { ...a, credential: { ...a.credential, ...slot } }
            : a,
        ),
      };
      saveVault(currentVault);
    }
    const activeAlias = active ? active.alias : "none";
    return {
      vault: currentVault,
      messages: [
        {
          level: "warning",
          text: `auth.json ${provider} != active alias ${activeAlias}; matches ${matchingAccount.alias}`,
        },
      ],
    };
  }

  return {
    vault,
    messages: [
      {
        level: "warning",
        text: `untracked ${provider} credential; /acc adopt <alias> ${provider}`,
      },
    ],
  };
}
