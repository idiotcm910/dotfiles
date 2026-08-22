import assert from "node:assert/strict";
import { test } from "node:test";
import { labelFromCredential, loginProvider } from "./oauth.ts";

function createJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.sig`;
}

test("labelFromCredential uses email and jwt sub", () => {
  assert.equal(
    labelFromCredential("antigravity", {
      type: "oauth",
      access: "a",
      refresh: "r",
      expires: 1,
      email: "a@b.com",
    }),
    "a@b.com",
  );

  assert.equal(
    labelFromCredential("antigravity", {
      type: "oauth",
      access: "a",
      refresh: "r",
      expires: 1,
    }),
    "",
  );

  const subJwt = createJwt({ sub: "usr_12345", team_id: "team_abc" });
  assert.equal(
    labelFromCredential("xai", {
      type: "oauth",
      access: subJwt,
      refresh: "r",
      expires: 1,
    }),
    "usr_12345",
  );

  const teamJwt = createJwt({ team_id: "team_xyz" });
  assert.equal(
    labelFromCredential("xai", {
      type: "oauth",
      access: teamJwt,
      refresh: "r",
      expires: 1,
    }),
    "team_xyz",
  );

  assert.equal(
    labelFromCredential("xai", {
      type: "oauth",
      access: "plain-opaque-token",
      refresh: "r",
      expires: 1,
    }),
    "",
  );
});

test("loginProvider uses injected logins and does not throw tokens", async () => {
  const notes: string[] = [];
  const cred = await loginProvider(
    "antigravity",
    { notify: (m) => notes.push(m), log: (m) => notes.push(m) },
    {
      loginAgy: async () => ({
        type: "oauth",
        access: "ya29.secret-token-value",
        refresh: "1//refresh-token-value",
        expires: 9,
        email: "a@b.com",
        projectId: "p",
      }),
    },
  );
  assert.equal(cred.email, "a@b.com");
  assert.equal(notes.join(" ").includes("ya29"), false);
});

test("loginProvider cancel becomes add cancelled", async () => {
  await assert.rejects(
    () =>
      loginProvider(
        "xai",
        { notify: () => {}, log: () => {} },
        {
          loginXai: async () => {
            throw new Error("Login cancelled");
          },
        },
      ),
    /add cancelled/,
  );

  await assert.rejects(
    () =>
      loginProvider(
        "antigravity",
        { notify: () => {}, log: () => {} },
        {
          loginAgy: async () => {
            throw new Error("OAuth callback timed out waiting for browser login");
          },
        },
      ),
    /add cancelled/,
  );
});

test("loginProvider busy port throws port busy message", async () => {
  await assert.rejects(
    () =>
      loginProvider(
        "antigravity",
        { notify: () => {}, log: () => {} },
        {
          loginAgy: async () => {
            const err: any = new Error("listen EADDRINUSE: address already in use 127.0.0.1:51121");
            err.code = "EADDRINUSE";
            throw err;
          },
        },
      ),
    /OAuth callback port 51121 is busy; retry when \/login antigravity is not running/,
  );
});

test("loginProvider rejects unsupported provider", async () => {
  await assert.rejects(
    () =>
      loginProvider(
        "unsupported" as any,
        { notify: () => {}, log: () => {} },
      ),
    /Unsupported provider/,
  );
});
