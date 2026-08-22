import { createHash, randomBytes } from "node:crypto";
import { createServer, type Server } from "node:http";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { normalizeOAuthCredential, type OAuthCredential, type ProviderId } from "./store.ts";

export type AddNotifier = {
  notify: (message: string) => void;
  log: (message: string) => void;
};

// Antigravity OAuth constants
const AGY_REDIRECT_URI = "http://localhost:51121/oauth-callback";
const AGY_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const AGY_TOKEN_URL = "https://oauth2.googleapis.com/token";
const AGY_CALLBACK_TIMEOUT_MS = 5 * 60 * 1000;
const AGY_SCOPES = [
  "https://www.googleapis.com/auth/aicode",
  "https://www.googleapis.com/auth/cloud-platform",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/cclog",
  "https://www.googleapis.com/auth/experimentsandconfigs",
];

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing ${name}. Set it in the environment (do not commit OAuth client secrets).`,
    );
  }
  return value;
}

function agyClientId(): string {
  return requiredEnv("ANTIGRAVITY_CLIENT_ID");
}

function agyClientSecret(): string {
  return requiredEnv("ANTIGRAVITY_CLIENT_SECRET");
}

// xAI public OAuth client id (override via env if needed)
function xaiClientId(): string {
  return process.env.XAI_CLIENT_ID?.trim() || "b1a00492-073a-47ea-816f-4c329264a828";
}
const XAI_SCOPE = "openid profile email offline_access grok-cli:access api:access";
const XAI_DEVICE_CODE_URL = "https://auth.x.ai/oauth2/device/code";
const XAI_TOKEN_URL = "https://auth.x.ai/oauth2/token";
const REFRESH_SKEW_MS = 5 * 60 * 1000;

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const json = Buffer.from(parts[1], "base64url").toString("utf8");
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function labelFromCredential(provider: ProviderId, cred: OAuthCredential): string {
  if (provider === "antigravity") {
    return cred.email || "";
  }
  if (provider === "xai") {
    const payload = parseJwtPayload(cred.access);
    if (payload) {
      if (typeof payload.sub === "string" && payload.sub.length > 0) {
        return payload.sub;
      }
      if (typeof payload.team_id === "string" && payload.team_id.length > 0) {
        return payload.team_id;
      }
    }
    return "";
  }
  return "";
}

function base64Url(buffer: Buffer): string {
  return buffer.toString("base64url");
}

function generatePKCE(): { verifier: string; challenge: string } {
  const verifier = base64Url(randomBytes(32));
  const challenge = base64Url(createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

function stableProjectId(seed: string): string {
  const bytes = createHash("sha1").update(`antigravity:${seed}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function defaultProjectId(seed = "antigravity-default"): string {
  return process.env.ANTIGRAVITY_PROJECT_ID?.trim() || stableProjectId(seed);
}

async function getUserEmail(token: string): Promise<string | undefined> {
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v1/userinfo?alt=json", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return undefined;
    const data = (await res.json()) as { email?: string };
    return typeof data.email === "string" ? data.email : undefined;
  } catch {
    return undefined;
  }
}

async function loadCodeAssist(token: string): Promise<string | undefined> {
  const endpoints = [
    "https://cloudcode-pa.googleapis.com",
    "https://daily-cloudcode-pa.sandbox.googleapis.com",
  ];
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": "antigravity/1.15.8",
    "X-Goog-Api-Client": "google-cloud-sdk vscode_cloudshelleditor/0.1",
    "Client-Metadata": JSON.stringify({
      ideType: "ANTIGRAVITY",
      platform: "linux",
      pluginType: "GEMINI",
    }),
  };
  const body = JSON.stringify({
    metadata: {
      ideType: "ANTIGRAVITY",
      platform: "PLATFORM_UNSPECIFIED",
      pluginType: "GEMINI",
    },
  });

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(`${endpoint}/v1internal:loadCodeAssist`, {
        method: "POST",
        headers,
        body,
      });
      if (!res.ok) continue;
      const data = (await res.json()) as any;
      const project =
        data?.antigravityProjectId ??
        data?.projectId ??
        data?.backendProjectId ??
        data?.userDefinedCloudaicompanionProject ??
        data?.cloudaicompanionProject ??
        data?.project;
      if (typeof project === "string") return project;
      if (project && typeof project.id === "string") return project.id;
    } catch {
      // try next
    }
  }
  return undefined;
}

function startCallbackServer(expectedState: string): Promise<{
  server: Server;
  waitForCode: () => Promise<{ code: string; state: string }>;
}> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let timeout: NodeJS.Timeout | undefined;
    let resolveCode!: (value: { code: string; state: string }) => void;
    let rejectCode!: (error: Error) => void;
    const codePromise = new Promise<{ code: string; state: string }>((res, rej) => {
      resolveCode = res;
      rejectCode = rej;
    });

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      if (timeout) clearTimeout(timeout);
      fn();
    };

    const server = createServer((req, res) => {
      if (req.method !== "GET" && req.method !== "HEAD") {
        res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Method Not Allowed");
        return;
      }

      const url = new URL(req.url || "", AGY_REDIRECT_URI);
      if (url.pathname !== "/oauth-callback") {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Not Found");
        return;
      }

      const error = url.searchParams.get("error");
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      if (error) {
        res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`Antigravity authentication failed: ${error}`);
        finish(() => rejectCode(new Error(`OAuth error: ${error}`)));
        return;
      }
      if (!code || !state) {
        res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
        res.end("Antigravity authentication failed: missing code or state.");
        finish(() => rejectCode(new Error("Missing code or state in OAuth callback")));
        return;
      }
      if (state !== expectedState) {
        res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
        res.end("Antigravity authentication failed: invalid state.");
        finish(() => rejectCode(new Error("OAuth state mismatch")));
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end("Antigravity authentication complete. You can close this window and return to Pi.");
      finish(() => resolveCode({ code, state }));
    });

    server.on("error", (err: any) => {
      if (err && err.code === "EADDRINUSE") {
        reject(new Error("OAuth callback port 51121 is busy; retry when /login antigravity is not running"));
      } else {
        reject(err);
      }
    });

    server.listen(51121, "127.0.0.1", () => {
      timeout = setTimeout(() => {
        finish(() => rejectCode(new Error("OAuth callback timed out waiting for browser login")));
        try {
          server.close();
        } catch {
          // ignore
        }
      }, AGY_CALLBACK_TIMEOUT_MS);
      resolve({ server, waitForCode: () => codePromise });
    });
  });
}

async function fallbackLoginAntigravity(notifier: AddNotifier): Promise<OAuthCredential> {
  const { verifier, challenge } = generatePKCE();
  const state = base64Url(randomBytes(32));
  const { server, waitForCode } = await startCallbackServer(state);

  try {
    const authParams = new URLSearchParams({
      client_id: agyClientId(),
      response_type: "code",
      redirect_uri: AGY_REDIRECT_URI,
      scope: AGY_SCOPES.join(" "),
      code_challenge: challenge,
      code_challenge_method: "S256",
      state,
      access_type: "offline",
      prompt: "consent",
    });

    const authUrl = `${AGY_AUTH_URL}?${authParams.toString()}`;
    notifier.notify(authUrl);
    notifier.log(authUrl);

    const { code, state: returnedState } = await waitForCode();
    if (returnedState !== state) throw new Error("OAuth state mismatch");

    const tokenResponse = await fetch(AGY_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: agyClientId(),
        client_secret: agyClientSecret(),
        code,
        grant_type: "authorization_code",
        redirect_uri: AGY_REDIRECT_URI,
        code_verifier: verifier,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: HTTP ${tokenResponse.status}`);
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    if (!tokenData.refresh_token) {
      throw new Error("No refresh token received. Re-run /login antigravity and allow offline access.");
    }

    const [email, discoveredProject] = await Promise.all([
      getUserEmail(tokenData.access_token),
      loadCodeAssist(tokenData.access_token),
    ]);

    return {
      type: "oauth",
      refresh: tokenData.refresh_token,
      access: tokenData.access_token,
      expires: Date.now() + tokenData.expires_in * 1000 - 5 * 60 * 1000,
      projectId: discoveredProject || defaultProjectId(email || "antigravity-default"),
      email,
    };
  } finally {
    try {
      server.close();
    } catch {
      // ignore
    }
  }
}

async function realLoginAntigravity(notifier: AddNotifier): Promise<OAuthCredential> {
  try {
    const indexPath = join(homedir(), ".pi/agent/npm/node_modules/pi-antigravity/src/auth/index.ts");
    const mod = await import(pathToFileURL(indexPath).href);
    if (typeof mod.loginAntigravity === "function") {
      return (await mod.loginAntigravity({
        onAuth: (info: { url: string; instructions?: string }) => {
          notifier.notify(info.url);
          notifier.log(info.url);
        },
      })) as OAuthCredential;
    }
  } catch (err: any) {
    if (
      err &&
      (err.code === "EADDRINUSE" ||
        err.message?.includes("port 51121 is busy") ||
        err.message?.includes("EADDRINUSE"))
    ) {
      throw new Error("OAuth callback port 51121 is busy; retry when /login antigravity is not running");
    }
    if (err && /cancel|abort|timed?\s*out/i.test(err.message)) {
      throw new Error("add cancelled");
    }
    // Fall back to built-in PKCE loopback
  }

  return fallbackLoginAntigravity(notifier);
}

async function fallbackLoginXai(notifier: AddNotifier): Promise<OAuthCredential> {
  const deviceRes = await fetch(XAI_DEVICE_CODE_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: xaiClientId(),
      scope: XAI_SCOPE,
      referrer: "pi",
    }),
  });

  if (!deviceRes.ok) {
    throw new Error(`xAI device code request failed (HTTP ${deviceRes.status})`);
  }

  const device = (await deviceRes.json()) as {
    device_code: string;
    user_code: string;
    verification_uri: string;
    verification_uri_complete?: string;
    interval?: number;
    expires_in: number;
  };

  const uri = device.verification_uri_complete || device.verification_uri;
  const msg = `xAI OAuth: Enter code ${device.user_code} at ${uri}`;
  notifier.notify(msg);
  notifier.log(msg);

  let intervalSec = typeof device.interval === "number" && device.interval > 0 ? device.interval : 5;
  const deadline = Date.now() + (device.expires_in || 900) * 1000;

  // Wait interval before first poll per RFC 8628
  await new Promise((r) => setTimeout(r, intervalSec * 1000));

  while (Date.now() < deadline) {
    const tokenRes = await fetch(XAI_TOKEN_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        client_id: xaiClientId(),
        device_code: device.device_code,
      }),
    });

    if (tokenRes.ok) {
      const data = (await tokenRes.json()) as {
        access_token: string;
        refresh_token: string;
        expires_in?: number;
      };
      const expiresIn = data.expires_in ?? 3600;
      return {
        type: "oauth",
        access: data.access_token,
        refresh: data.refresh_token,
        expires: Date.now() + expiresIn * 1000 - REFRESH_SKEW_MS,
      };
    }

    const errData = (await tokenRes.json().catch(() => ({}))) as {
      error?: string;
      interval?: number;
    };

    if (errData.error === "authorization_pending") {
      // keep polling
    } else if (errData.error === "slow_down") {
      intervalSec = typeof errData.interval === "number" && errData.interval > 0 ? errData.interval : intervalSec + 5;
    } else if (errData.error === "access_denied" || errData.error === "authorization_denied") {
      throw new Error("add cancelled");
    } else if (errData.error === "expired_token") {
      throw new Error("add cancelled");
    } else {
      throw new Error(`xAI OAuth polling failed: ${errData.error || "unknown"}`);
    }

    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    await new Promise((r) => setTimeout(r, Math.min(intervalSec * 1000, remaining)));
  }

  throw new Error("add cancelled");
}

async function realLoginXai(notifier: AddNotifier): Promise<OAuthCredential> {
  try {
    const mod = await import("@earendil-works/pi-ai");
    if (mod.xaiOAuth?.login) {
      return (await mod.xaiOAuth.login({
        notify: (info: any) => {
          const uri = info.verificationUriComplete || info.verificationUri;
          const msg = `xAI OAuth: Enter code ${info.userCode} at ${uri}`;
          notifier.notify(msg);
          notifier.log(msg);
        },
        signal: new AbortController().signal,
      })) as OAuthCredential;
    }
  } catch (err: any) {
    if (err && /cancel|abort|timed?\s*out/i.test(err.message)) {
      throw new Error("add cancelled");
    }
    // Fall back to direct device code flow
  }

  return fallbackLoginXai(notifier);
}

export async function loginProvider(
  provider: ProviderId,
  notifier: AddNotifier,
  deps?: {
    loginAgy?: () => Promise<OAuthCredential>;
    loginXai?: () => Promise<OAuthCredential>;
  },
): Promise<OAuthCredential> {
  try {
    let cred: OAuthCredential;
    if (provider === "antigravity") {
      cred = deps?.loginAgy ? await deps.loginAgy() : await realLoginAntigravity(notifier);
    } else if (provider === "xai") {
      cred = deps?.loginXai ? await deps.loginXai() : await realLoginXai(notifier);
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }
    // Match Pi /login: always persist type:"oauth" for AuthStorage.
    return normalizeOAuthCredential(cred);
  } catch (error: any) {
    const msg = error?.message || String(error);
    const code = error?.code;
    if (
      code === "EADDRINUSE" ||
      msg.includes("EADDRINUSE") ||
      msg.includes("OAuth callback port 51121 is busy")
    ) {
      throw new Error("OAuth callback port 51121 is busy; retry when /login antigravity is not running");
    }
    if (/cancel|abort|timed?\s*out/i.test(msg)) {
      throw new Error("add cancelled");
    }
    throw error;
  }
}
