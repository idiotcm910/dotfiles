import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ACCOUNT_SEP,
  collapseAgySummary,
  fetchAccountUsageCache,
  formatAccountBlock,
  formatAccountList,
  formatAge,
  formatLsLine,
  formatXaiSummary,
  redactSecrets,
  splitSummaryLines,
} from "./usage.ts";
import type { Account } from "./store.ts";

const base: Account = {
  id: "1",
  alias: "work",
  provider: "antigravity",
  label: "a@b.com",
  active: true,
  credential: {
    type: "oauth",
    access: "ya29.secret-token-value",
    refresh: "1//refresh-token-value",
    expires: 1,
  },
};

test("redactSecrets strips google tokens and jwt", () => {
  const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abc";
  const out = redactSecrets(`tok ya29.secret-token-value ${jwt} 1//refresh-token-value`);
  assert.equal(out.includes("ya29."), false);
  assert.equal(out.includes("eyJ"), false);
  assert.equal(out.includes("1//"), false);
  assert.match(out, /\[redacted\]/);
});

test("formatAge never / error / minutes", () => {
  const now = 1_000_000;
  assert.equal(formatAge(undefined, true, now), "(never)");
  assert.equal(formatAge(now - 3 * 60_000, false, now), "(error 3m ago)");
  assert.equal(formatAge(now - 3 * 60_000, true, now), "(3m ago)");
  assert.equal(formatAge(now - 10_000, true, now), "(now)");
  assert.equal(formatAge(now - 2 * 3600_000, true, now), "(2h ago)");
  assert.equal(formatAge(now - 4 * 86400_000, true, now), "(4d ago)");
});

test("splitSummaryLines breaks on middot", () => {
  assert.deepEqual(splitSummaryLines("Plan · A 100% (1d) · B 50% (2h)"), [
    "Plan",
    "A 100% (1d)",
    "B 50% (2h)",
  ]);
});

test("formatAccountBlock is multi-line without tokens", () => {
  const block = formatAccountBlock(
    {
      ...base,
      usage: {
        fetchedAt: 1,
        ok: true,
        summary: "Google AI Pro · Gemini 5h 72% (2h) · weekly 40% (4d)",
        error: null,
      },
    },
    1 + 180_000,
  );
  assert.match(block, /^\* work {2}· {2}antigravity {2}· {2}a@b\.com$/m);
  assert.match(block, /plan {3}Google AI Pro/);
  assert.match(block, /· {6}Gemini 5h 72% \(2h\)/);
  assert.match(block, /· {6}weekly 40% \(4d\)/);
  assert.match(block, /age {4}\(3m ago\)/);
  assert.equal(block.includes("ya29"), false);
  assert.equal(block.includes("1//"), false);
  // not a single giant line
  assert.ok(block.split("\n").length >= 4);
});

test("formatAccountBlock compact collapses many 100% model rows", () => {
  const models = Array.from({ length: 12 }, (_, i) => `Model${i} 100% (7d)`).join(" · ");
  const block = formatAccountBlock({
    ...base,
    usage: {
      fetchedAt: Date.now(),
      ok: true,
      summary: `Free Tier · ${models}`,
      error: null,
    },
  });
  assert.match(block, /plan {3}Free Tier/);
  assert.match(block, /12 models at 100% \(7d\)/);
  assert.equal((block.match(/^ {4}·/gm) || []).length <= 4, true);
  assert.equal(block.includes("Model11"), false);
});

test("formatAccountBlock full keeps model rows", () => {
  const models = Array.from({ length: 6 }, (_, i) => `Model${i} 100% (7d)`).join(" · ");
  const block = formatAccountBlock(
    {
      ...base,
      usage: {
        fetchedAt: Date.now(),
        ok: true,
        summary: `Free Tier · ${models}`,
        error: null,
      },
    },
    { full: true },
  );
  assert.match(block, /Model5 100%/);
});

test("formatLsLine aliases formatAccountBlock", () => {
  const acc = {
    ...base,
    usage: { fetchedAt: 1, ok: true, summary: "x", error: null },
  };
  assert.equal(formatLsLine(acc, 2), formatAccountBlock(acc, 2));
});

test("formatAccountBlock formats error state properly", () => {
  const block = formatAccountBlock(
    {
      ...base,
      active: false,
      usage: {
        fetchedAt: 1,
        ok: false,
        summary: "Old summary · kept",
        error: "401 ya29.secret-token",
      },
    },
    1 + 180_000,
  );
  assert.match(block, /^  work {2}· {2}antigravity {2}· {2}a@b\.com$/m);
  assert.match(block, /error {2}401 \[redacted\]/);
  assert.match(block, /last {3}Old summary/);
  assert.match(block, /age {4}\(error 3m ago\)/);
  assert.equal(block.includes("ya29"), false);
});

test("formatAccountList separates multiple accounts", () => {
  const a: Account = {
    ...base,
    alias: "work",
    active: true,
    usage: { fetchedAt: 10, ok: true, summary: "PlanA · q1 1%", error: null },
  };
  const b: Account = {
    ...base,
    id: "2",
    alias: "home",
    active: false,
    label: "h@b.com",
    usage: { fetchedAt: 10, ok: true, summary: "PlanB · q2 2%", error: null },
  };
  const text = formatAccountList([a, b], 10);
  assert.ok(text.includes(ACCOUNT_SEP));
  const parts = text.split(ACCOUNT_SEP);
  assert.equal(parts.length, 2);
  assert.match(parts[0]!, /\* work/);
  assert.match(parts[1]!, /  home/);
});

test("collapseAgySummary is one line", () => {
  const raw = [
    "Google AI Pro",
    "",
    "Gemini",
    "  [####] 5h: 72% left · resets 2h",
    "  [##] weekly: 40% left · resets 4d",
  ].join("\n");
  const one = collapseAgySummary(raw);
  assert.equal(one.includes("\n"), false);
  assert.match(one, /Google AI Pro/);
  assert.match(one, /Gemini 5h 72% \(2h\)/);
  assert.match(one, /weekly 40% \(4d\)/);
});

test("formatXaiSummary never invents percent", () => {
  assert.equal(formatXaiSummary({}), "xAI subscription · quota n/a");
  assert.equal(formatXaiSummary({ labelExtra: "team_123" }), "xAI subscription · quota n/a · team_123");
  assert.equal(formatXaiSummary({ quotaLine: "custom quota" }), "xAI subscription · custom quota");
});

test("one failed fetch does not throw", async () => {
  const failed = await fetchAccountUsageCache(base, {
    fetchAgy: async () => {
      throw new Error("401 ya29.secret-token-value");
    },
  });
  assert.equal(failed.ok, false);
  assert.equal(failed.error?.includes("ya29"), false);
});

test("xai 401 keeps previous summary", async () => {
  const acc: Account = {
    ...base,
    provider: "xai",
    usage: { fetchedAt: 1, ok: true, summary: "xAI subscription · quota n/a", error: null },
  };
  const next = await fetchAccountUsageCache(acc, {
    fetchXai: async () => {
      const err = new Error("401");
      (err as Error & { status?: number }).status = 401;
      throw err;
    },
  });
  assert.equal(next.ok, false);
  assert.equal(next.summary, "xAI subscription · quota n/a");
});

test("successful agy fetch returns collapsed summary", async () => {
  const result = await fetchAccountUsageCache(base, {
    fetchAgy: async () =>
      ["Google AI Pro", "Gemini", "  [####] 5h: 72% left · resets 2h"].join("\n"),
    now: () => 12345,
  });
  assert.equal(result.ok, true);
  assert.equal(result.error, null);
  assert.equal(result.fetchedAt, 12345);
  assert.match(result.summary, /Google AI Pro · Gemini 5h 72% \(2h\)/);
});
