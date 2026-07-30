const test = require("node:test");
const assert = require("node:assert/strict");

global.document = {
  body: { dataset: {} },
  documentElement: {
    setAttribute() {},
    getAttribute() { return "light"; },
  },
  getElementById() { return null; },
  querySelectorAll() { return []; },
  addEventListener() {},
};
global.matchMedia = () => ({ matches: false });
global.localStorage = {
  getItem() { return null; },
  setItem() {},
};

const {
  calculateProgress,
  readChecklist,
  writeChecklist,
} = require("../guide/assets/app.js");

test("calculateProgress reports completed tasks and percentage", () => {
  assert.deepEqual(
    calculateProgress({ backup: true, iso: false, boot: true }, ["backup", "iso", "boot"]),
    { completed: 2, total: 3, percent: 67 },
  );
});

test("calculateProgress handles an empty checklist", () => {
  assert.deepEqual(calculateProgress({}, []), {
    completed: 0,
    total: 0,
    percent: 0,
  });
});

test("readChecklist accepts boolean task state only", () => {
  const storage = {
    getItem() {
      return JSON.stringify({
        backup: true,
        iso: false,
        injected: "yes",
      });
    },
  };

  assert.deepEqual(readChecklist(storage, "arch"), {
    backup: true,
    iso: false,
  });
});

test("readChecklist recovers from invalid JSON", () => {
  const storage = { getItem() { return "not-json"; } };
  assert.deepEqual(readChecklist(storage, "arch"), {});
});

test("writeChecklist persists state as JSON", () => {
  let savedKey = "";
  let savedValue = "";
  const storage = {
    setItem(key, value) {
      savedKey = key;
      savedValue = value;
    },
  };

  writeChecklist(storage, "arch", { backup: true });
  assert.equal(savedKey, "arch");
  assert.equal(savedValue, '{"backup":true}');
});
