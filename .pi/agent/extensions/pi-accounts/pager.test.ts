import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AccPager,
  clampOffset,
  pageSlice,
  padToWidth,
  stripAnsi,
  visibleWidth,
} from "./pager.ts";

test("clampOffset and pageSlice", () => {
  assert.equal(clampOffset(-3, 20, 5), 0);
  assert.equal(clampOffset(100, 20, 5), 15);
  assert.deepEqual(pageSlice(["a", "b", "c", "d", "e"], 2, 2), ["c", "d"]);
});

test("stripAnsi and visibleWidth", () => {
  assert.equal(stripAnsi("\x1b[31mhello\x1b[0m"), "hello");
  assert.equal(visibleWidth("hello"), 5);
  assert.equal(visibleWidth("·"), 1);
  assert.equal(padToWidth("hi", 5), "hi   ");
  assert.equal(visibleWidth(padToWidth("very long content that exceeds", 10)), 10);
});

test("AccPager adaptive viewRows and key navigation", () => {
  const lines = Array.from({ length: 30 }, (_, i) => `line-${i}`);
  let closed = false;
  const theme = { fg: (_c: string, t: string) => t, bold: (t: string) => t };
  const pager = new AccPager(lines, theme, () => {
    closed = true;
  }, { viewRows: 5 });

  let rendered = pager.render(80);
  assert.ok(rendered.some((l) => l.includes("line-0")));
  assert.ok(rendered.some((l) => /1-5\/30/.test(l)));

  pager.handleInput("j");
  pager.handleInput("j");
  rendered = pager.render(80);
  const plain = rendered.join("\n");
  assert.match(plain, /line-2/);

  pager.handleInput("G");
  rendered = pager.render(80);
  assert.ok(rendered.join("\n").includes("line-29"));

  // Enter closes
  pager.handleInput("\r");
  assert.equal(closed, true);

  // Short output (1 line) creates a 1-row viewport
  const shortPager = new AccPager(["single line result"], theme, () => {});
  const shortView = shortPager.render(80);
  assert.ok(shortView.some((l) => l.includes("single line result")));
  assert.ok(shortView.some((l) => l.includes("1 line")));
});
