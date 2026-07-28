# Sway Desktop Kit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cài và quản lý một Sway desktop Tokyo Night nhẹ, ổn định, có thể áp dụng lại từ `~/thai/system` trên Ubuntu 24.04.

**Architecture:** Repository giữ cấu hình nguồn trong `sway/config/`; `sway/install.sh` kiểm tra package, backup cấu hình đích rồi copy có kiểm soát vào `~/.config`. Sway chỉ include file cấu hình con; Waybar, Wofi, Foot, Mako và swaylock tự đọc các file cùng theme. Guide HTML dùng bộ khung đã có tại `guide/`.

**Tech Stack:** Bash, APT/dpkg, Sway 1.9, Waybar, Wofi, Foot, Mako, swaylock/swayidle, HTML/CSS/JavaScript tĩnh.

## Global Constraints

- Hệ điều hành đích là Ubuntu 24.04 LTS trên GPU Intel UHD 620.
- Chỉ cài package từ repository Ubuntu; không PPA, SwayFX, `-git` hay build source.
- Không gỡ GNOME, đổi session mặc định, hoặc tự đăng xuất phiên hiện tại.
- Dùng Tokyo Night: nền `#1a1b26`, panel `#24283b`, chữ `#c0caf5`, accent `#7dcfff`, alert `#f7768e`.
- `install.sh` phải backup trước khi thay đổi `~/.config` và không xoá tệp ngoài vùng nó quản lý.
- Mọi UI/config phải nhẹ; không blur, shadow compositor hoặc daemon dư thừa.
- Các hướng dẫn người dùng bằng tiếng Việt.

---

## File structure

| File | Trách nhiệm |
|---|---|
| `sway/packages.txt` | Danh sách APT, mỗi dòng một package và comment giải thích |
| `sway/install.sh` | `--dry-run`, kiểm tra/cài gói, backup và apply config |
| `sway/config/sway/config` | Entry point Sway và include cấu hình thành phần |
| `sway/config/sway/config.d/*.conf` | Theme, input/output, keybind, quy tắc cửa sổ, autostart tách biệt |
| `sway/config/waybar/config.jsonc` | Module Waybar và lệnh module tùy chỉnh |
| `sway/config/{waybar,wofi,foot,mako,swaylock}/…` | Theme và hành vi từng ứng dụng |
| `sway/README.md` | Cài, apply, reload, khôi phục, dependency phần cứng |
| `tests/sway-install.test.sh` | Test không đồ họa cho source tree và installer dry-run |
| `guide/sway.html` | Hướng dẫn Sway/shortcut/khôi phục dạng HTML |
| `guide/assets/app.js` | Thêm Sway vào sidebar chung |
| `guide/index.html` | Thêm card dẫn tới guide Sway |
| `README.md` | Đăng ký thư mục `sway/` như system config được quản lý |

## Task 1: Scaffold bộ cài an toàn và regression tests

**Files:**
- Create: `sway/packages.txt`
- Create: `sway/install.sh`
- Create: `tests/sway-install.test.sh`
- Create: `sway/README.md`

**Interfaces:**
- Consumes: `sway/packages.txt` và cây `sway/config/` trong repository.
- Produces: `bash sway/install.sh --dry-run` in danh sách package/tệp đích mà không ghi filesystem; `bash sway/install.sh` tạo backup và copy config. `CONFIG_SOURCE=/path` là interface test-only để test dùng source tree tạm.

- [ ] **Step 1: Write the failing installer test**

  Tạo `tests/sway-install.test.sh` dùng thư mục tạm. Test gọi:

  ```bash
  out="$(HOME="$tmp/home" bash "$REPO/sway/install.sh" --dry-run 2>&1)"
  test ! -e "$tmp/home/.config/sway/config"
  [[ "$out" == *"DRY RUN"* ]]
  [[ "$out" == *"sway"* ]]
  ```

  Test tiếp theo tạo `$tmp/source/foot/foot.ini` chứa `new` và
  `$tmp/home/.config/foot/foot.ini` chứa `old`, chạy installer với
  `HOME="$tmp/home" CONFIG_SOURCE="$tmp/source" SKIP_APT=1`, rồi assert:
  config mới chứa `new`, bản backup chứa `old`, và tệp ngoài `~/.config` không
  bị đổi.

- [ ] **Step 2: Run test to verify it fails**

  Run: `bash tests/sway-install.test.sh`

  Expected: fail vì `sway/install.sh` chưa tồn tại.

- [ ] **Step 3: Implement package manifest and installer**

  `packages.txt` chứa: `sway`, `swaybg`, `swayidle`, `swaylock`, `waybar`,
  `wofi`, `foot`, `mako-notifier`, `grim`, `slurp`, `wl-clipboard`,
  `pavucontrol`, `playerctl`, `brightnessctl`, `fonts-jetbrains-mono`.

  `install.sh` phải dùng `set -euo pipefail`, suy ra `REPO_DIR` từ đường dẫn của
  script, hiểu đúng hai flag `--dry-run` và `--help`, từ chối flag lạ, và có biến
  `SKIP_APT=1` cho test. Source mặc định là `$REPO_DIR/config`; chỉ khi test
  truyền `CONFIG_SOURCE=/path` thì dùng source đó. Với mỗi thư mục component có
  trong source, copy đến `$HOME/.config/<component>` bằng `cp -a`; nếu đích có
  tồn tại, dùng `mv` để tạo backup dạng `<component>.backup-YYYYmmdd-HHMMSS`.
  In mọi thao tác trước khi chạy; dry-run không gọi sudo, apt, mv hay cp. Chỉ gọi `sudo apt-get update` và
  `sudo apt-get install -y $(...)` khi thiếu package và không dry-run.

  README nêu ba lệnh chính:

  ```bash
  cd ~/thai/system
  bash sway/install.sh --dry-run
  bash sway/install.sh
  ```

  Nêu rõ chạy `swaymsg reload` chỉ sau khi đã đăng nhập Sway, và cách đổi tên
  backup trở lại nếu cần.

- [ ] **Step 4: Run test to verify it passes**

  Run: `bash tests/sway-install.test.sh`

  Expected: exit `0`, in từng assertion pass.

- [ ] **Step 5: Commit**

  ```bash
  git add sway/packages.txt sway/install.sh sway/README.md tests/sway-install.test.sh
  git commit -m "feat(sway): add safe installer scaffold"
  ```

## Task 2: Implement Sway core configuration and input/window workflow

**Files:**
- Create: `sway/config/sway/config`
- Create: `sway/config/sway/config.d/00-theme.conf`
- Create: `sway/config/sway/config.d/10-input-output.conf`
- Create: `sway/config/sway/config.d/20-keybinds.conf`
- Create: `sway/config/sway/config.d/30-rules.conf`
- Create: `sway/config/sway/config.d/40-autostart.conf`
- Modify: `tests/sway-install.test.sh`

**Interfaces:**
- Consumes: component commands installed by Task 1.
- Produces: valid `~/.config/sway/config` whose include lines load sorted
  `config.d` files; `sway -C -c <config>` validates it without a GUI session.

- [ ] **Step 1: Add failing static config assertions**

  Thêm test kiểm `sway/config/sway/config` có các dòng:

  ```bash
  include ~/.config/sway/config.d/*.conf
  set $mod Mod4
  ```

  Và `20-keybinds.conf` có `bindsym $mod+Return exec foot`,
  `bindsym $mod+d exec wofi --show drun`, `bindsym $mod+Shift+q kill`,
  `bindsym $mod+l exec swaylock`, workspace `1` đến `9`, screenshot bằng
  `grim`/`slurp`, cùng media/brightness keybindings dùng `playerctl` và
  `brightnessctl` với `|| true` nếu thiết bị không hỗ trợ.

- [ ] **Step 2: Run test to verify it fails**

  Run: `bash tests/sway-install.test.sh`

  Expected: fail vì các file core Sway chưa tồn tại.

- [ ] **Step 3: Implement focused Sway config files**

  - `00-theme.conf`: set màu Tokyo Night, `gaps inner 8`, `gaps outer 4`, viền
    focus cyan 2px và inactive panel-color; không thêm blur/shadow.
  - `10-input-output.conf`: `xkb_layout us`, touchpad `tap enabled`,
    `natural_scroll enabled`, `dwt enabled`; không hard-code monitor output hay
    resolution.
  - `20-keybinds.conf`: dùng `$mod` như phần Interface; thêm focus/move
    `h/j/k/l`, fullscreen `$mod+f`, floating `$mod+space`, đổi workspace trước
    đó `$mod+Tab`, lock `$mod+l`, reload `$mod+Shift+c`, exit có confirmation
    `swaynag`.
  - `30-rules.conf`: app_id/class phù hợp `foot`, `pavucontrol`, `wofi`; đặt
    pavucontrol floating, wofi không focus đột ngột.
  - `40-autostart.conf`: dùng `exec_always --no-startup-id` cho `waybar`,
    `mako`, `swayidle`; mỗi daemon có `pkill` có mục tiêu để reload không nhân
    tiến trình. `swayidle` khóa màn hình sau 10 phút và tắt màn hình sau 15 phút.

- [ ] **Step 4: Run syntax and static tests**

  Run:

  ```bash
  bash tests/sway-install.test.sh
  tmp_home="$(mktemp -d)"; HOME="$tmp_home" SKIP_APT=1 bash sway/install.sh
  HOME="$tmp_home" sway -C -c "$tmp_home/.config/sway/config"
  ```

  Expected: test exit `0`; Sway báo config hợp lệ (warnings không liên quan đến
  syntax phải được đọc và xử lý nếu do cấu hình mới).

- [ ] **Step 5: Commit**

  ```bash
  git add sway/config/sway tests/sway-install.test.sh
  git commit -m "feat(sway): add core Tokyo Night workflow"
  ```

## Task 3: Implement companion UI configuration

**Files:**
- Create: `sway/config/waybar/config.jsonc`
- Create: `sway/config/waybar/style.css`
- Create: `sway/config/wofi/config`
- Create: `sway/config/wofi/style.css`
- Create: `sway/config/foot/foot.ini`
- Create: `sway/config/mako/config`
- Create: `sway/config/swaylock/config`
- Modify: `tests/sway-install.test.sh`

**Interfaces:**
- Consumes: Tokyo Night color constants from Task 2.
- Produces: all launcher/status/terminal/notification/lock component files,
  referenced by their normal XDG paths after installer apply.

- [ ] **Step 1: Add failing component-config assertions**

  Test tĩnh kiểm path tồn tại, `waybar/config.jsonc` có các module
  `sway/workspaces`, `sway/window`, `cpu`, `memory`, `network`, `pulseaudio`,
  `battery`, `clock`, `tray`; kiểm CSS xuất hiện `#1a1b26` và `#7dcfff`; Foot
  đặt `font=JetBrains Mono:size=11`; Mako có background Tokyo Night; swaylock
  có màu ring focus cyan.

- [ ] **Step 2: Run test to verify it fails**

  Run: `bash tests/sway-install.test.sh`

  Expected: fail vì thiếu component files.

- [ ] **Step 3: Implement lightweight component config**

  Waybar là top bar duy nhất: workspace trái, title giữa, thông tin hệ thống và
  tray phải. Không dùng polling custom khi module native có sẵn; CPU/memory mỗi
  5 giây, network/audio/battery native. CSS tối, padding nhỏ, transition CSS
  chỉ 150ms cho hover/workspace.

  Wofi mở ở giữa, `show=drun`, `allow_markup=true`, `matching=fuzzy`; Foot dùng
  JetBrains Mono, nền `1a1b26`, foreground `c0caf5`, cursor cyan, scrollback
  10000; Mako đặt width 340, padding 12, timeout 5000; swaylock để nền tối đặc
  với indicator Tokyo Night, không cần ảnh nền hay blur.

- [ ] **Step 4: Run config tests and JSON parser**

  Run:

  ```bash
  bash tests/sway-install.test.sh
  sed '/^\/\/.*$/d' sway/config/waybar/config.jsonc | jq empty
  ```

  Expected: cả hai command exit `0`.

- [ ] **Step 5: Commit**

  ```bash
  git add sway/config tests/sway-install.test.sh
  git commit -m "feat(sway): theme companion applications"
  ```

## Task 4: Apply, verify and document the user-facing guide

**Files:**
- Create: `guide/sway.html`
- Modify: `guide/assets/app.js`
- Modify: `guide/index.html`
- Modify: `README.md`
- Modify: `tests/sway-install.test.sh`

**Interfaces:**
- Consumes: exact keybindings, config locations and recovery behavior from
  Tasks 1–3.
- Produces: guide page linked in shared navigation and top-level README entry;
  installed config passes Sway syntax validation.

- [ ] **Step 1: Add failing documentation assertions**

  Thêm test kiểm `guide/sway.html` có `lang="vi"`, `data-page="sway"`, link
  `assets/style.css`/`assets/app.js`, và các heading: “Bắt đầu”, “Phím tắt”,
  “Workspace”, “Ảnh chụp màn hình”, “Chỉnh cấu hình”, “Khôi phục”. Test kiểm
  `guide/assets/app.js` có entry `sway.html` và `guide/index.html` link đến nó.

- [ ] **Step 2: Run test to verify it fails**

  Run: `bash tests/sway-install.test.sh`

  Expected: fail vì guide chưa tồn tại/chưa được đăng ký.

- [ ] **Step 3: Implement guide and registration**

  Copy cấu trúc từ `guide/_template.html`, dùng class hiện hữu (`group`, `row`,
  `keys`, `callout`) để không tạo stylesheet mới. Nội dung tiếng Việt phải bao
  gồm: chọn Sway tại GDM, bảng phím tắt đầy đủ, launcher/terminal, window
  direction/floating/fullscreen, workspace, screenshot clipboard/file, audio/
  brightness, lock/idle/exit, `swaymsg reload`, vị trí source-vs-live config,
  command installer dry-run/apply, khôi phục backup và quay về GNOME.

  Thêm Sway sau mục Setup trong `PAGES`, card tương ứng trong index; cập nhật
  README bảng nội dung bằng link `sway/` và guide.

- [ ] **Step 4: Apply config and run end-to-end non-GUI verification**

  Run:

  ```bash
  bash tests/sway-install.test.sh
  bash sway/install.sh --dry-run
  bash sway/install.sh
  sway -C -c "$HOME/.config/sway/config"
  test -f "$HOME/.config/waybar/config.jsonc"
  test -f guide/sway.html
  ```

  Expected: every command exits `0`; installer prints backups/copies and does
  not log out or alter GNOME. Do not run `swaymsg reload` outside a Sway session.

- [ ] **Step 5: Commit**

  ```bash
  git add guide/sway.html guide/assets/app.js guide/index.html README.md tests/sway-install.test.sh
  git commit -m "docs(sway): add user guide and setup links"
  ```

## Final verification

- [ ] Run `git status --short` and verify only intentional changes remain.
- [ ] Run `bash tests/sway-install.test.sh` and `sway -C -c "$HOME/.config/sway/config"`.
- [ ] Check `sway/install.sh --dry-run` makes no file changes by comparing a
  temporary `$HOME/.config` before/after.
- [ ] Open `guide/sway.html` locally or parse it with an available HTML checker;
  confirm all declared keybindings match `20-keybinds.conf` exactly.
- [ ] Tell user to select “Sway” manually at the GDM gear menu for first graphical login.
