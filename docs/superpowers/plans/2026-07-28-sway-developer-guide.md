# Sway Developer Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Viết lại guide Sway thành cẩm nang hằng ngày đầy đủ cho workflow terminal và browser, đồng thời thêm điều khiển resize cửa sổ còn thiếu.

**Architecture:** `guide/sway.html` tiếp tục dùng layout, search và style chung hiện có; các section đi theo dòng thời gian sử dụng trước rồi mới đến phụ lục tra cứu. Keybind resize được định nghĩa trong `20-keybinds.conf`, test shell kiểm exact config và các mốc nội dung để guide không lệch behavior thật.

**Tech Stack:** HTML tĩnh, JavaScript/CSS guide có sẵn, Bash regression tests, Sway config syntax.

## Global Constraints

- Đối tượng là người dùng Ubuntu 24.04 mới dùng Sway, chủ yếu lập trình bằng terminal và browser.
- App được mở thống nhất qua `Super+D`/Wofi; không thêm shortcut browser riêng.
- Mọi shortcut và khả năng mô tả trong guide phải có trong config/package đã kiểm tra, hoặc ghi rõ là chưa sẵn sàng.
- Giữ design/navigation hiện có tại `guide/`; không thay visual world của các guide khác.
- Không gỡ GNOME, tự đăng nhập Sway hay hard-code tên/độ phân giải monitor.
- Các hướng dẫn bằng tiếng Việt, có lối khôi phục an toàn.

---

## File structure

| File | Trách nhiệm |
|---|---|
| `sway/config/sway/config.d/20-keybinds.conf` | Thêm resize mode có thể thoát rõ ràng |
| `tests/sway-install.test.sh` | Assert resize binding và guide sections/claims khớp config |
| `guide/sway.html` | Cẩm nang developer theo tình huống, troubleshooting và reference |
| `sway/README.md` | Bổ sung link/nhắc guide là tài liệu vận hành chính nếu cần |

## Task 1: Add an explicit resize workflow

**Files:**
- Modify: `tests/sway-install.test.sh`
- Modify: `sway/config/sway/config.d/20-keybinds.conf`

**Interfaces:**
- Consumes: `$mod` declared by `00-theme.conf`.
- Produces: `Super+R` enters Sway mode `resize`; `H/J/K/L` resize by 10px; `Escape` or `Enter` returns to default mode.

- [ ] **Step 1: Write failing resize assertions**

  Add assertions that search the keybind file for exactly:

  ```bash
  'bindsym $mod+r mode "resize"'
  'mode "resize" {'
  'bindsym Escape mode "default"'
  'bindsym Return mode "default"'
  ```

- [ ] **Step 2: Run test to verify it fails**

  Run: `bash tests/sway-install.test.sh`

  Expected: fail only on the four resize assertions because the mode does not exist yet.

- [ ] **Step 3: Implement minimal resize mode**

  Append this complete block to `20-keybinds.conf`:

  ```conf
  bindsym $mod+r mode "resize"
  mode "resize" {
      bindsym h resize shrink width 10 px
      bindsym j resize grow height 10 px
      bindsym k resize shrink height 10 px
      bindsym l resize grow width 10 px
      bindsym Left resize shrink width 10 px
      bindsym Down resize grow height 10 px
      bindsym Up resize shrink height 10 px
      bindsym Right resize grow width 10 px
      bindsym Escape mode "default"
      bindsym Return mode "default"
  }
  ```

- [ ] **Step 4: Run test and Sway syntax check**

  Run:

  ```bash
  bash tests/sway-install.test.sh
  sway -C -c "$HOME/.config/sway/config"
  ```

  Expected: both exit `0` after applying the source config with `SKIP_APT=1 bash sway/install.sh`.

- [ ] **Step 5: Commit**

  ```bash
  git add sway/config/sway/config.d/20-keybinds.conf tests/sway-install.test.sh
  git commit -m "feat(sway): add resize mode"
  ```

## Task 2: Rewrite the guide around a developer's day

**Files:**
- Modify: `tests/sway-install.test.sh`
- Modify: `guide/sway.html`
- Modify: `sway/README.md`

**Interfaces:**
- Consumes: every binding in `20-keybinds.conf`, package list in `sway/packages.txt`, installer backup behavior, and shared guide CSS/JS.
- Produces: one self-contained `guide/sway.html` with sections that search can filter and all commands safe to copy.

- [ ] **Step 1: Write failing content/accuracy assertions**

  Add assertions for required headings/text: `Phiên lập trình đầu tiên`, `Mở ứng dụng`, `Resize cửa sổ`, `Waybar`, `Clipboard`, `Màn hình ngoài`, `Khi có trục trặc`, `Package còn thiếu`, `Source và live config`. Also assert the guide contains `Super+R`, `Super+D`, `sway -C`, `swaymsg -t get_outputs`, `SKIP_APT=1`, and the recovery instruction `chọn GNOME`.

- [ ] **Step 2: Run test to verify it fails**

  Run: `bash tests/sway-install.test.sh`

  Expected: fail on newly required guide strings, proving the old cheat-sheet is insufficient.

- [ ] **Step 3: Rewrite `guide/sway.html` completely**

  Preserve HTML shell, `lang="vi"`, `data-page="sway"`, shared assets and `noresult` element. Replace document body content with these ordered sections:

  1. `Phiên lập trình đầu tiên`: GDM → Sway, verify Waybar, `Super+Enter`, `Super+D`, project command examples (`cd ~/code/project && nvim .`), browser via launcher, terminal/browser split.
  2. `Mở ứng dụng và tìm kiếm`: Wofi behavior, direct typing, Escape, launcher as the only browser path.
  3. `Cửa sổ, layout và Workspace`: focus/move/floating/fullscreen/close, exact right-focus key, workspace patterns such as code/browser and a distinct workspace per project.
  4. `Resize cửa sổ`: `Super+R`, direction keys, `Escape`/`Enter`; explain tiling may limit resize.
  5. `Waybar, thông báo và thiết bị`: what each side of bar means; audio click opens pavucontrol only after package is installed; Mako behavior; media, brightness, lock/idle.
  6. `Clipboard và ảnh chụp màn hình`: standard terminal/browser paste (`Ctrl+Shift+V` vs `Ctrl+V`), screenshot destinations, package dependencies and where files land.
  7. `Laptop và màn hình ngoài`: exact `swaymsg -t get_outputs`; temporary safe `swaymsg output <name> ...` advice, warn not to persist untested output names, current touchpad settings.
  8. `Khi có trục trặc`: symptom → check → recovery for black/login failure, components absent, no sound, failed screenshot/brightness, wrong key layout, awkward window; exact return-to-GNOME route.
  9. `Source và live config`: table mapping every config dir/file, edit→check→apply→reload, package sudo limitation, backup/rollback.
  10. `Tra nhanh`: complete shortcut table and package list distinguishing installed core from pending packages.

  All command examples must use generic existing paths or explicitly say “thay bằng tên project/màn hình của bạn”; no invented commands that imply an uninstalled tool exists.

- [ ] **Step 4: Update README and run validation**

  Add a short README note that `guide/sway.html` is the full daily-use guide. Run:

  ```bash
  bash tests/sway-install.test.sh
  jq empty sway/config/waybar/config.jsonc
  sway -C -c "$HOME/.config/sway/config"
  git diff --check
  ```

  Expected: every command exits `0`.

- [ ] **Step 5: Commit**

  ```bash
  git add guide/sway.html sway/README.md tests/sway-install.test.sh
  git commit -m "docs(sway): expand developer daily-use guide"
  ```

## Final verification

- [ ] Run `bash tests/tmux-grid.test.sh` and `bash tests/sway-install.test.sh`.
- [ ] Apply the source safely with `SKIP_APT=1 bash sway/install.sh`, then run `sway -C -c "$HOME/.config/sway/config"`.
- [ ] Read the guide top-to-bottom and compare each displayed shortcut against `20-keybinds.conf`; correct any mismatch.
- [ ] Confirm the guide states the seven missing packages require the user to run sudo and does not claim screenshot/Mako/brightness work until then.
- [ ] Run the Impeccable detector once on `guide/sway.html` and report only findings introduced by this page rather than altering shared visual identity.
