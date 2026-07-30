# Qtile Shortcuts Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add a searchable Vietnamese HTML cheatsheet for every active Qtile keyboard and mouse binding in the current dotfiles.

**Architecture:** Create one static guide page using the existing guide shell and row components. Treat `config/qtile/config.py` as the source of truth, add a shell contract test that compares guide content with active bindings, then register the page in shared navigation, the index, and README.

**Tech Stack:** Semantic HTML, shared CSS, vanilla JavaScript, Bash contract tests.

---

### Task 1: Define the Qtile guide contract

**Files:**
- Create: `tests/guide-qtile.test.sh`
- Read: `config/qtile/config.py`

- [x] **Step 1: Write the failing contract test**

Create `tests/guide-qtile.test.sh` with the existing colored assertion style and these exact checks:

```bash
#!/usr/bin/env bash
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PAGE="$ROOT/guide/qtile.html"
CONFIG="$ROOT/config/qtile/config.py"
APP="$ROOT/guide/assets/app.js"
INDEX="$ROOT/guide/index.html"
README="$ROOT/guide/README.md"
PASS=0
FAIL=0

pass() { printf '  \033[32m✓\033[0m %s\n' "$1"; PASS=$((PASS + 1)); }
fail() { printf '  \033[31m✗\033[0m %s\n' "$1"; FAIL=$((FAIL + 1)); }
assert_contains() {
  local file="$1" needle="$2" description="$3"
  if [[ -f "$file" ]] && grep -Fq -- "$needle" "$file"; then
    pass "$description"
  else
    fail "$description (thiếu: $needle)"
  fi
}

printf '\n── Trang Qtile ──\n'
[[ -f "$PAGE" ]] && pass "có qtile.html" || fail "có qtile.html"
assert_contains "$PAGE" 'data-page="qtile"' "page id đúng"
assert_contains "$PAGE" 'Super</kbd>' "giải thích phím Super"
assert_contains "$PAGE" 'Super + W' "cảnh báo đóng cửa sổ"
assert_contains "$PAGE" 'Super + Ctrl + Q' "cảnh báo thoát Qtile"
assert_contains "$PAGE" 'Button1' "có thao tác chuột trái"
assert_contains "$PAGE" 'Button2' "có thao tác chuột giữa"
assert_contains "$PAGE" 'Button3' "có thao tác chuột phải"

printf '\n── Binding đang hoạt động ──\n'
for key in h j k l space Return Tab w n m f r q; do
  assert_contains "$CONFIG" "\"$key\"" "config có binding $key"
  assert_contains "$PAGE" "data-qtile-key=\"$key\"" "guide có binding $key"
done
assert_contains "$PAGE" 'data-qtile-groups="1-9"' "guide có workspace 1–9"
assert_contains "$PAGE" 'data-qtile-action="swap"' "guide có đổi vị trí cửa sổ"
assert_contains "$PAGE" 'data-qtile-action="resize"' "guide có resize layout"
assert_contains "$PAGE" 'data-qtile-action="floating"' "guide có floating"

printf '\n── Navigation ──\n'
assert_contains "$APP" 'page: "qtile"' "sidebar đăng ký Qtile"
assert_contains "$INDEX" 'href="qtile.html"' "index có card Qtile"
assert_contains "$README" 'qtile.html' "README ghi trang Qtile"

printf '\nKết quả: %d đạt, %d lỗi\n' "$PASS" "$FAIL"
((FAIL == 0))
```

- [x] **Step 2: Run the test and verify RED**

Run:

```bash
bash tests/guide-qtile.test.sh
```

Expected: non-zero exit with failures for missing `guide/qtile.html`, navigation, index card, and README entry.

- [x] **Step 3: Commit the failing test**

```bash
git add tests/guide-qtile.test.sh
git commit -m "test(guide): define Qtile shortcuts contract"
```

### Task 2: Build the Qtile shortcuts page

**Files:**
- Create: `guide/qtile.html`
- Test: `tests/guide-qtile.test.sh`

- [x] **Step 1: Create the page shell**

Use the same `<head>`, fonts, sidebar, topbar, `.doc`, `noresult`, and shared
assets as `guide/tmux.html`. Set:

```html
<title>Qtile · Vibe Workspace</title>
<body data-page="qtile" data-title="Qtile">
```

Open with this modifier legend and safety callout:

```html
<p class="lede"><kbd class="mod">Super</kbd> là phím Windows. Qtile dùng nó làm modifier chính để điều khiển cửa sổ mà không cần chạm chuột.</p>
<div class="callout"><b>Đừng nhầm:</b> <code>Super + W</code> đóng cửa sổ đang focus; <code>Super + Ctrl + Q</code> thoát toàn bộ Qtile.</div>
```

- [x] **Step 2: Add every active keyboard binding grouped by intent**

Create search-compatible `.group > .rows.two > .row` entries with the following
exact matrix. Add the listed `data-qtile-key` and `data-qtile-action` attributes
to the matching rows so the contract test can identify them:

```text
Focus:
Super+H left; Super+J down; Super+K up; Super+L right; Super+Space next window.

Move/resize:
Super+Shift+H swap left; Super+Shift+L swap right;
Super+Ctrl+H grow / increase master count;
Super+Ctrl+L shrink / decrease master count.

Window/layout:
Super+N reset ratios; Super+M maximize in layout; Super+F fullscreen;
Super+Shift+F floating; Super+Tab next layout; Super+W close focused window.

Apps:
Super+Enter launch terminal; Super+Shift+R launch Rofi drun.

Workspaces:
Super+1…9 switch group; Super+Shift+1…9 move focused window and follow.

Qtile:
Super+Ctrl+R reload config; Super+Ctrl+Q shutdown Qtile.
```

Use existing key markup consistently:

```html
<div class="row" data-qtile-key="h">
  <div class="keys"><kbd class="mod">Super</kbd><span class="plus">+</span><kbd>H</kbd></div>
  <div class="d"><b>Focus trái</b> — chuyển focus sang cửa sổ bên trái</div>
</div>
```

- [x] **Step 3: Add mouse controls**

Add a final `Chuột · cửa sổ floating` group containing:

```text
Super+Button1 drag = move floating window.
Super+Button3 drag = resize floating window.
Super+Button2 click = bring floating window to front.
```

Use literal `Button1`, `Button2`, and `Button3` text to stay aligned with Qtile
config terminology, and explain their physical mouse buttons in Vietnamese.

- [x] **Step 4: Run the contract test and verify GREEN**

Run:

```bash
bash tests/guide-qtile.test.sh
```

Expected: the page assertions pass while navigation assertions remain failing.

- [x] **Step 5: Commit the page**

```bash
git add guide/qtile.html
git commit -m "feat(guide): add Qtile shortcuts cheatsheet"
```

### Task 3: Register, document, and verify the page

**Files:**
- Modify: `guide/assets/app.js`
- Modify: `guide/index.html`
- Modify: `guide/README.md`
- Test: `tests/guide-qtile.test.sh`

- [x] **Step 1: Register page 09 in shared navigation**

Append this item to `PAGES` after `arch-install`:

```js
{ page: "qtile", file: "qtile.html", n: "09", label: "Qtile" },
```

- [x] **Step 2: Add the index card**

Append this card after the Arch install card:

```html
<a class="card" href="qtile.html"><div class="cn">09</div><div class="ct">Qtile</div><div class="cd">Focus, layout, workspace, launcher và chuột floating</div></a>
```

- [x] **Step 3: Document the page**

Add this line to the guide tree in `guide/README.md`:

```text
├── qtile.html            # 09 · phím tắt và chuột Qtile đang hoạt động
```

Add a `Qtile shortcuts` section stating that the page mirrors active bindings
from `config/qtile/config.py` and must be updated whenever that key list changes.

- [x] **Step 4: Run all relevant tests**

Run:

```bash
bash tests/guide-qtile.test.sh
node --test tests/guide-checklist.test.js
bash tests/guide-arch-install.test.sh
bash tests/restore.test.sh
bash tests/tmux-grid.test.sh
node --check guide/assets/app.js
git diff --check
```

Expected: every command exits `0`; Qtile contract reports `0 lỗi`.

- [x] **Step 5: Verify the rendered page**

Serve `guide/` locally and inspect `qtile.html` at desktop and `390×844` mobile:

```bash
python3 -m http.server 4173 --directory guide
```

Verify light/dark theme, `/` focus, `Escape` clear, search filtering, no
horizontal page overflow, readable wrapped key combinations, and all local links.
Run the Impeccable detector once after visual changes are final and address
material findings.

- [x] **Step 6: Commit navigation and documentation**

```bash
git add guide/assets/app.js guide/index.html guide/README.md tests/guide-qtile.test.sh docs/superpowers/plans/2026-07-30-qtile-shortcuts-guide.md
git commit -m "docs(guide): register Qtile shortcuts page"
```
