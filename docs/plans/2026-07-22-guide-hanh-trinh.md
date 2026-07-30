# Trang guide "Hành trình" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm một trang guide kể theo dòng thời gian một vòng đời workspace, và vá những phím còn thiếu trong các trang tra cứu cũ.

**Architecture:** Một file HTML tĩnh mới theo đúng khuôn `guide/_template.html`, đăng ký vào mảng `PAGES` trong `guide/assets/app.js` (menu và thanh bên sinh ra từ mảng này), thêm card vào `guide/index.html`. Không thêm CSS, không đổi cơ chế dựng menu.

**Tech Stack:** HTML tĩnh, CSS sẵn có (`guide/assets/style.css`), JS sẵn có (`guide/assets/app.js`).

**Spec:** `docs/specs/2026-07-22-guide-hanh-trinh-design.md`

## Global Constraints

- **Mọi phím viết trong guide phải được xác minh bằng `tmux list-keys` chạy trên chính `tmux/tmux.conf`, không dựa vào trí nhớ về mặc định tmux.** Lệnh xác minh nằm ở Task 1 Step 5. Sai một phím là guide mất giá trị.
- **Chạy tmux để xác minh phải dùng socket vứt đi: `tmux -L <tên> ...`, và không bao giờ `kill-server`/`kill-session` thiếu cờ `-L`.** Server mặc định là nơi người dùng đang làm việc thật.
- Tiếng Việt có dấu đầy đủ, giọng văn khớp các trang guide sẵn có.
- Chỉ dùng class CSS đã có: `layout`, `sidebar`, `content`, `topbar`, `doc`, `noresult`, `lede`, `group`, `rows`, `rows two`, `row`, `keys`, `d`, `cmd`, `tag`, `then`, `plus`, `mod`, `callout`, `card`, `cn`, `ct`, `cd`. Không thêm class mới, không sửa `style.css`.
- **Spec ghi trang mới mang số `00` — sai.** Số `00` đã thuộc `index` ("Tổng quan") trong `PAGES`. Trang mới mang số `01`; các trang `tmux`…`setup` đánh số lại thành `02`…`07`. Thứ tự đọc thành: 00 Tổng quan · 01 Hành trình · 02 tmux · 03 Workspace · 04-06 Nvim · 07 Cài đặt.

## Sự thật đã xác minh về phím (dùng làm nguồn, không sửa)

Chạy trên `tmux/tmux.conf` bằng `tmux -L keychk`:

| Phím | Lệnh thật |
|---|---|
| `prefix q` | `display-panes` — hiện số pane, bấm số để nhảy |
| `prefix Space` | `next-layout` — xoay qua các layout |
| `prefix` + mũi tên | `select-pane` — **nhảy pane**, KHÔNG phải resize |
| `prefix Ctrl-mũi tên` | `resize-pane` 1 ô, `-r` nên bấm lặp được |
| `prefix Alt-mũi tên` | `resize-pane` 5 ô, `-r` nên bấm lặp được |
| `prefix c` / `d` / `z` / `s` | `new-window` / `detach-client` / `resize-pane -Z` / `choose-tree -Zs` |
| `prefix g` | `run-shell` gọi `tmux-grid` |
| `prefix o` | `run-shell` gọi `sesh connect` qua fzf |
| `prefix X` / `Q` | `kill-window` / `kill-session`, đều `confirm-before` |
| `prefix \|` / `-` | `split-window -h` / `-v`, giữ cwd |
| `prefix e` | toggle `synchronize-panes` |
| `prefix r` | `source-file ~/.tmux.conf` |
| `mouse` | `on` — click chọn pane, kéo viền chỉnh kích thước |

---

### Task 1: Trang Hành trình + đăng ký vào menu

**Files:**
- Create: `guide/hanh-trinh.html`
- Modify: `guide/assets/app.js:6-14` (mảng `PAGES`)
- Modify: `guide/index.html:45-50` (các card)

**Interfaces:**
- Consumes: không có (task đầu tiên)
- Produces: trang `hanh-trinh.html` với `data-page="hanh-trinh"`; mục `{ page: "hanh-trinh", file: "hanh-trinh.html", n: "01", label: "Hành trình" }` trong `PAGES`.

- [ ] **Step 1: Tạo khung trang từ template**

Copy `guide/_template.html` thành `guide/hanh-trinh.html`, đổi ba chỗ:

```html
<title>Hành trình · Vibe Workspace</title>
```
```html
<body data-page="hanh-trinh" data-title="Hành trình">
```

Giữ nguyên toàn bộ phần `<head>`, `div.layout`, `aside.sidebar`, `main.content`, `header.topbar`, `div.doc`, dòng `p.noresult`, và thẻ `<script src="assets/app.js"></script>` ở cuối. Xoá khối `div.group` mẫu và dòng `p.lede` mẫu — nội dung thật viết ở các step sau.

- [ ] **Step 2: Viết câu mở đầu và ba cảnh đầu**

Thay `p.lede` bằng:

```html
        <p class="lede">Đọc từ trên xuống là đi hết một vòng: mở máy → tạo workspace → làm việc → nhìn tất cả cùng lúc → tạm rời → dọn. Mỗi trang khác là từ điển tra phím; trang này trả lời <b>“giờ tôi bấm gì”</b>.</p>
```

Rồi ba khối `div.group` đầu. Mỗi dòng theo đúng khuôn có sẵn — một ví dụ để bám theo:

```html
            <div class="row"><div class="keys"><kbd class="mod">prefix</kbd><span class="then">rồi</span><kbd>c</kbd></div><div class="d">Mô tả</div></div>
```

Với lệnh gõ ở shell thì `keys` dùng `<code class="cmd">wt-new &lt;branch&gt;</code>` thay cho `<kbd>`.

**Cảnh 1 — `<h2>1 · Mở máy</h2>`**, dùng `div.rows` (một cột):

| keys | d |
|---|---|
| (không có phím, chỉ chữ) | Mở terminal là **tự vào tmux** session `main` — khối auto-tmux trong `.bashrc` lo việc đó. Không cần gõ gì |
| `tmux attach` | Lỡ thoát hẳn ra ngoài thì vào lại. Mọi thứ vẫn y nguyên |

Dòng đầu không có phím: để `<div class="keys">—</div>`.

**Cảnh 2 — `<h2>2 · Mở workspace mới</h2>`**, `div.rows`:

| keys | d |
|---|---|
| `wt-new <branch>` | Một lệnh làm bốn việc: tạo **worktree** tại `<repo>.worktrees/<branch>`, tạo **branch** nếu chưa có, tạo **tmux session** tên bằng branch, rồi **mở nvim** sẵn |
| `wt-status` | Bảng tổng quan mọi worktree: branch · số file đổi · số Claude đang chạy |

Thêm `<p>` dưới bảng: tên session là tên branch với `.` `/` `:` đổi thành `_` — nên `feat/api` thành session `feat_api`.

**Cảnh 3 — `<h2>3 · Làm việc</h2>`**, `div.rows two`:

| keys | d |
|---|---|
| `Space` `c` `n` | Mở một Claude Code mới trong nvim. Bấm nữa để mở thêm cái nữa |
| `Space` `a` `s` | (bôi đen code trước) Gửi đoạn đang chọn cho Claude |
| `Space` `a` `a` | Nhận diff Claude đề xuất |
| `Space` `z` | Zoom cửa sổ nvim đang đứng |

Các phím `Space` viết bằng `<kbd>Space</kbd><kbd>c</kbd><kbd>n</kbd>` (ba thẻ liền, không có `span.then`).

Kết cảnh bằng `<p>`: chi tiết hơn xem trang <a href="nvim-lsp-claude.html">Nvim · LSP &amp; Claude</a>.

- [ ] **Step 3: Viết cảnh 4 và cảnh 5 (phần lõi)**

**Cảnh 4 — `<h2>4 · Chạy nhiều việc song song</h2>`**, `div.rows two`:

| keys | d |
|---|---|
| `prefix` `c` | **Window mới** — như mở thêm một tab, chiếm trọn màn hình |
| `prefix` `\|` | **Chia dọc** — hai pane cạnh nhau, cùng thư mục |
| `prefix` `-` | **Chia ngang** — hai pane trên dưới, cùng thư mục |
| `prefix` `e` | Bật/tắt sync-panes — gõ một lệnh chạy trên mọi pane |

Thêm `<p>`: window là việc riêng biệt, pane là hai thứ cần nhìn cùng lúc. Nhiều Claude thì mỗi cái một window, rồi gộp lại khi cần so sánh — xem cảnh 5.

**Cảnh 5 — `<h2>5 · Nhìn tất cả cùng lúc</h2><span class="tag">lưới pane</span>`**

Mở đầu bằng `<p>`: ba window mỗi cái một Claude, muốn nhìn cả ba thì gộp thành lưới trong một window, xong tách trả về như cũ.

Bảng `div.rows` — **đây là bảng quan trọng nhất của cả trang**:

| keys | d |
|---|---|
| `prefix` `g` | **Gộp / tách**. Lần đầu hiện popup chọn layout (`tiled` là lưới đều) rồi hút mọi window thành pane. Bấm lại: mỗi pane về đúng window cũ, đúng tên, đúng thứ tự. `Esc` ở popup = huỷ, không đổi gì |
| `Ctrl` `h` `j` `k` `l` | **Nhảy pane theo hướng** — xuyên cả nvim lẫn tmux, không cần prefix |
| `prefix` `q` | **Nhảy pane theo số** — hiện số to trên mỗi pane, bấm số để tới |
| `prefix` `z` | **Phóng to** pane đang đứng chiếm cả window. Bấm lại về lưới |
| `prefix` `Space` | **Đổi kiểu chia** — xoay qua các layout dựng sẵn |
| `prefix` `Ctrl` `←→↑↓` | **Chỉnh kích thước** 1 ô. Giữ `Ctrl-a` một lần rồi bấm mũi tên liên tục được |
| `prefix` `Alt` `←→↑↓` | Chỉnh kích thước 5 ô một nhịp |
| `prefix` `←→↑↓` | Nhảy pane theo hướng — **không kèm Ctrl/Alt là nhảy, kèm là resize** |
| `prefix` `\|` | Mở thêm pane khi đang ở lưới. Pane này **ở lại** khi bạn tách lưới ra, không bị mang đi đâu |

Đóng cảnh bằng `div.callout`:

```html
          <div class="callout">Đang ở trong lưới thì <kbd class="mod">prefix</kbd><span class="then">rồi</span><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> <b>không còn tác dụng</b> — cả session gộp lại chỉ còn một window. Nhảy pane bằng <kbd class="mod">prefix</kbd><span class="then">rồi</span><kbd>q</kbd> hoặc <kbd class="mod">Ctrl</kbd><span class="plus">+</span><kbd>h</kbd><kbd>j</kbd><kbd>k</kbd><kbd>l</kbd>.</div>
```

- [ ] **Step 4: Viết cảnh 6-8 và bảng "bốn kiểu đóng"**

**Cảnh 6 — `<h2>6 · Nhảy qua workspace khác</h2>`**, `div.rows two`:

| keys | d |
|---|---|
| `prefix` `o` | **Switcher** — popup liệt kê mọi workspace, gõ để lọc, Enter để nhảy |
| `prefix` `s` | Cây session tích hợp của tmux, không cần fzf |

`<p>`: workspace cũ **vẫn chạy nền** — Claude trong đó không dừng lại.

**Cảnh 7 — `<h2>7 · Tạm rời, mai làm tiếp</h2>`**, `div.rows two`:

| keys | d |
|---|---|
| `prefix` `d` | **Detach** — rời tmux, mọi thứ chạy tiếp dưới nền. Đóng luôn cửa sổ terminal cũng không sao |
| `tmux attach` | Vào lại đúng chỗ đã rời |
| `prefix` `Ctrl` `s` | Lưu trạng thái ngay, không đợi tự lưu |

`<p>`: continuum tự lưu mỗi 15 phút và tự khôi phục — workspace sống qua cả reboot.

**Cảnh 8 — `<h2>8 · Xong hẳn</h2>`**, `div.rows`:

| keys | d |
|---|---|
| `git add -A && git commit` | Lưu việc lại trước đã |
| `git push -u origin <branch>` | Đẩy lên remote, rồi mở PR trên GitHub |
| `wt-clean` | Sau khi PR đã merge: quét dọn **mọi** worktree đã merge vào `main`, kill session, quên đường dẫn zoxide. Worktree còn thay đổi chưa lưu được giữ lại và cảnh báo |
| `wt-rm <branch>` | Xoá **đúng một** workspace bất kể merged hay chưa. Thêm `--force` nếu còn thay đổi chưa lưu |

**Bảng "bốn kiểu đóng"** — `div.group` riêng, `<h2>Bốn kiểu “đóng” — đừng nhầm</h2>`, dùng `div.rows`:

| keys | d |
|---|---|
| `prefix` `d` | **Không mất gì.** Rời màn hình, Claude chạy tiếp. Dùng khi tắt máy, mai làm tiếp |
| `prefix` `X` | Đóng **một window** trong workspace (có hỏi lại). Dùng khi xong một việc nhỏ |
| `prefix` `Q` | Đóng **cả session** (có hỏi lại). Code trên đĩa **còn nguyên**, worktree vẫn đó — chỉ mất cái màn hình |
| `wt-rm <b>` | Xoá worktree **và** `git branch -D`. Đây là cái **mất code** nếu branch chưa merge |

Đóng bằng `div.callout` chỉ cách cứu:

```html
          <div class="callout">Lỡ <code class="cmd">wt-rm</code> nhầm branch chưa merge? Commit vẫn còn: <code class="cmd">git reflog</code> tìm SHA cuối cùng, rồi <code class="cmd">git branch &lt;tên&gt; &lt;sha&gt;</code> dựng lại. Chỉ mất phần <b>chưa commit</b>.</div>
```

- [ ] **Step 5: Xác minh mọi phím trong trang là có thật**

Chạy (socket vứt đi, không đụng server thật):

```bash
cd /home/quocthai/thai/system
tmux -L guidechk kill-server 2>/dev/null
tmux -L guidechk -f tmux/tmux.conf new-session -d -s k
tmux -L guidechk list-keys -T prefix > /tmp/claude-1000/-home-quocthai-thai-system/7861316c-2996-4409-805d-eac14f1bfc7a/scratchpad/keys.txt
tmux -L guidechk kill-server 2>/dev/null
grep -E "prefix (q|Space|c|d|z|s|g|o|X|Q|e|r|C-Up|M-Up|Up) " /tmp/claude-1000/-home-quocthai-thai-system/7861316c-2996-4409-805d-eac14f1bfc7a/scratchpad/keys.txt
```

Expected: mỗi phím xuất hiện đúng một dòng, và lệnh của nó khớp bảng "Sự thật đã xác minh" ở đầu plan này. Nếu một dòng nào lệch → sửa trang cho khớp thực tế, **không** sửa thực tế cho khớp trang.

Đối chiếu thêm các lệnh shell với script thật:

```bash
grep -n "worktrees\|branch -D\|kill-session" bin/wt-new bin/wt-rm bin/wt-clean | head
```

Expected: `wt-new` tạo đường dẫn `<repo>.worktrees/<branch>`; `wt-rm` có `git branch -D`; `wt-clean` có `kill-session`. Ba điều này chính là những gì trang mới khẳng định.

- [ ] **Step 6: Đăng ký trang vào menu và đánh số lại**

Trong `guide/assets/app.js`, thay toàn bộ mảng `PAGES` bằng:

```javascript
const PAGES = [
  { page: "index",           file: "index.html",           n: "00", label: "Tổng quan" },
  { page: "hanh-trinh",      file: "hanh-trinh.html",      n: "01", label: "Hành trình" },
  { page: "tmux",            file: "tmux.html",            n: "02", label: "tmux" },
  { page: "workspace",       file: "workspace.html",       n: "03", label: "Workspace" },
  { page: "nvim-motion",     file: "nvim-motion.html",     n: "04", label: "Nvim · Di chuyển" },
  { page: "nvim-search",     file: "nvim-search.html",     n: "05", label: "Nvim · Tìm & Duyệt" },
  { page: "nvim-lsp-claude", file: "nvim-lsp-claude.html", n: "06", label: "Nvim · LSP & Claude" },
  { page: "setup",           file: "setup.html",           n: "07", label: "Cài đặt" },
];
```

Trong `guide/index.html`, thêm card Hành trình **trước** card tmux và đánh số lại các card còn lại:

```html
            <a class="card" href="hanh-trinh.html"><div class="cn">01</div><div class="ct">Hành trình</div><div class="cd">Một vòng đời workspace: mở → làm → lưới → rời → dọn</div></a>
            <a class="card" href="tmux.html"><div class="cn">02</div><div class="ct">tmux</div><div class="cd">Session, pane, window, copy-mode, persistence</div></a>
            <a class="card" href="workspace.html"><div class="cn">03</div><div class="ct">Workspace</div><div class="cd">wt-new / status / clean · sesh · zoxide</div></a>
            <a class="card" href="nvim-motion.html"><div class="cn">04</div><div class="ct">Nvim · Di chuyển</div><div class="cd">Vim motions, flash, cửa sổ, tab, undo</div></a>
            <a class="card" href="nvim-search.html"><div class="cn">05</div><div class="ct">Nvim · Tìm &amp; Duyệt</div><div class="cd">fzf-lua, nvim-tree, dropbar</div></a>
            <a class="card" href="nvim-lsp-claude.html"><div class="cn">06</div><div class="ct">Nvim · LSP &amp; Claude</div><div class="cd">LSP, claude-multi, claudecode</div></a>
            <a class="card" href="setup.html"><div class="cn">07</div><div class="ct">Cài đặt</div><div class="cd">Script cài, yêu cầu, font, auto-tmux</div></a>
```

- [ ] **Step 7: Kiểm cấu trúc HTML**

```bash
cd /home/quocthai/thai/system/guide
python3 - <<'PY'
import re,sys
bad=0
for f in ['hanh-trinh.html','index.html']:
    s=open(f,encoding='utf-8').read()
    for t in ['div','h2','p','kbd','span','a','code']:
        o=len(re.findall(r'<%s[\s>]'%t,s)); c=len(re.findall(r'</%s>'%t,s))
        if o!=c: print(f"{f} {t}: mở {o} / đóng {c}  LỆCH"); bad=1
print("LỆCH THẺ" if bad else "MỌI THẺ CÂN BẰNG")
PY
grep -c "data-page=\"hanh-trinh\"" hanh-trinh.html
grep -c "hanh-trinh" assets/app.js index.html
```

Expected: `MỌI THẺ CÂN BẰNG`; `data-page` đếm được 1; `hanh-trinh` xuất hiện trong cả `app.js` và `index.html`.

- [ ] **Step 8: Commit**

```bash
cd /home/quocthai/thai/system
git add guide/hanh-trinh.html guide/assets/app.js guide/index.html
git commit -m "docs(guide): trang Hành trình — một vòng đời workspace"
```

---

### Task 2: Vá các trang tra cứu cũ

**Files:**
- Modify: `guide/tmux.html` (mục "Pane (chia màn hình)" và mục "Persistence & config")
- Modify: `guide/workspace.html` (ngay dưới `p.lede`, dòng 20)

**Interfaces:**
- Consumes: trang `hanh-trinh.html` từ Task 1 (được link tới).
- Produces: không có.

- [ ] **Step 1: Thêm ba phím thiếu vào mục Pane của tmux.html**

Trong `guide/tmux.html`, mục `<h2>Pane (chia màn hình)</h2>`, thêm ba dòng ngay **sau** dòng `prefix g` (dòng lưới pane) và **trước** dòng `prefix e`:

```html
            <div class="row"><div class="keys"><kbd class="mod">prefix</kbd><span class="then">rồi</span><kbd>q</kbd></div><div class="d"><b>Hiện số pane</b> — bấm tiếp số đó để nhảy thẳng tới. Hữu ích khi đang ở lưới</div></div>
            <div class="row"><div class="keys"><kbd class="mod">prefix</kbd><span class="then">rồi</span><kbd>Space</kbd></div><div class="d"><b>Xoay layout</b> — đổi kiểu chia pane qua các bố cục dựng sẵn</div></div>
            <div class="row"><div class="keys"><kbd class="mod">prefix</kbd><span class="then">rồi</span><kbd class="mod">Ctrl</kbd><span class="plus">+</span><kbd>←</kbd><kbd>→</kbd><kbd>↑</kbd><kbd>↓</kbd></div><div class="d"><b>Chỉnh kích thước</b> pane 1 ô (<kbd class="mod">Alt</kbd> thay <kbd class="mod">Ctrl</kbd> = 5 ô). Giữ prefix rồi bấm liên tục được. Không kèm <kbd class="mod">Ctrl</kbd>/<kbd class="mod">Alt</kbd> thì mũi tên chỉ <b>nhảy</b> pane</div></div>
```

- [ ] **Step 2: Thêm cảnh báo reload vào mục Persistence của tmux.html**

Trong `guide/tmux.html`, mục `<h2>Persistence & config …</h2>`, thay thẻ `<p>` sẵn có (dòng bắt đầu bằng "Continuum tự lưu mỗi 15 phút…") thành hai thẻ:

```html
          <p>Continuum tự lưu mỗi 15 phút và tự khôi phục khi mở tmux — workspaces sống qua reboot.</p>
          <div class="callout"><b>Sửa <code class="cmd">tmux.conf</code> xong nhớ bấm <kbd class="mod">prefix</kbd><span class="then">rồi</span><kbd>r</kbd>.</b> tmux chỉ đọc config <b>một lần lúc khởi động server</b> — server đang chạy sẽ không biết gì về phím mới, kể cả khi bạn mở session mới. Bấm phím mới thấy im ru thì gần như luôn là quên bước này.</div>
```

- [ ] **Step 3: Trỏ workspace.html sang trang Hành trình**

Trong `guide/workspace.html`, thêm ngay **sau** thẻ `<p class="lede">…</p>` (dòng 20):

```html
        <p>Muốn xem <b>thứ tự làm việc</b> thay vì tra từng lệnh → <a href="hanh-trinh.html">Hành trình</a>: mở workspace → làm việc → gộp lưới → tạm rời → dọn.</p>
```

- [ ] **Step 4: Kiểm cấu trúc và nội dung**

```bash
cd /home/quocthai/thai/system/guide
python3 - <<'PY'
import re
bad=0
for f in ['tmux.html','workspace.html']:
    s=open(f,encoding='utf-8').read()
    for t in ['div','h2','p','kbd','span','a','code']:
        o=len(re.findall(r'<%s[\s>]'%t,s)); c=len(re.findall(r'</%s>'%t,s))
        if o!=c: print(f"{f} {t}: mở {o} / đóng {c}  LỆCH"); bad=1
print("LỆCH THẺ" if bad else "MỌI THẺ CÂN BẰNG")
PY
grep -c "prefix</kbd><span class=\"then\">rồi</span><kbd>q<\|Space<\|Ctrl</kbd>" tmux.html
grep -c "hanh-trinh.html" workspace.html
```

Expected: `MỌI THẺ CÂN BẰNG`; các phím mới có mặt trong `tmux.html`; `workspace.html` có đúng 1 link sang trang mới.

- [ ] **Step 5: Commit**

```bash
cd /home/quocthai/thai/system
git add guide/tmux.html guide/workspace.html
git commit -m "docs(guide): vá phím thiếu + cảnh báo reload config"
```

---

## Kiểm bằng mắt sau cùng (người dùng làm)

Mở `guide/index.html` trên trình duyệt và kiểm:

1. Card "Hành trình" đứng ngay sau "Tổng quan", số `01`, bấm vào ra đúng trang.
2. Thanh bên trái trên mọi trang hiện đủ tám mục theo đúng thứ tự mới.
3. Trên trang Hành trình, gõ `prefix q` vào ô tìm kiếm — chỉ dòng đó hiện, các dòng khác ẩn.
4. Đọc một lượt từ trên xuống: có chỗ nào vẫn khiến bạn hỏi "rồi sao nữa?" không.
