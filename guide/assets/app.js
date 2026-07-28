/* ============================================================
   Vibe Workspace · Guide — script dùng chung
   MỞ RỘNG: thêm một trang mới = tạo file .html (copy _template.html)
   rồi thêm 1 dòng vào mảng PAGES bên dưới. Xong.
   ============================================================ */
const PAGES = [
  { page: "index",           file: "index.html",           n: "00", label: "Tổng quan" },
  { page: "hanh-trinh",      file: "hanh-trinh.html",      n: "01", label: "Hành trình" },
  { page: "tmux",            file: "tmux.html",            n: "02", label: "tmux" },
  { page: "workspace",       file: "workspace.html",       n: "03", label: "Workspace" },
  { page: "nvim-motion",     file: "nvim-motion.html",     n: "04", label: "Nvim · Di chuyển" },
  { page: "nvim-search",     file: "nvim-search.html",     n: "05", label: "Nvim · Tìm & Duyệt" },
  { page: "nvim-lsp-claude", file: "nvim-lsp-claude.html", n: "06", label: "Nvim · LSP & Claude" },
  { page: "setup",           file: "setup.html",           n: "07", label: "Cài đặt" },
  { page: "sway",            file: "sway.html",            n: "08", label: "Sway · Tokyo Night" },
];

(function () {
  const body = document.body;
  const current = body.dataset.page || "index";
  const meta = PAGES.find((p) => p.page === current) || PAGES[0];

  // ── Sidebar ──
  const sidebar = document.getElementById("sidebar");
  if (sidebar) {
    sidebar.innerHTML =
      '<div class="sb-brand">' +
        '<div class="sb-kicker">Multi-worktree · Claude Code</div>' +
        '<div class="sb-title">Vibe <em>Workspace</em></div>' +
      "</div>" +
      '<nav class="sb-nav" aria-label="Mục lục">' +
        PAGES.map((p) =>
          '<a href="' + p.file + '"' + (p.page === current ? ' aria-current="page"' : "") + '>' +
          '<span class="n">' + p.n + "</span><span>" + p.label + "</span></a>"
        ).join("") +
      "</nav>" +
      '<div class="sb-foot">Cẩm nang cá nhân<br><code>~/thai/system/guide</code></div>';
  }

  // ── Topbar (tiêu đề + tìm kiếm + theme) ──
  const topbar = document.getElementById("topbar");
  if (topbar) {
    topbar.innerHTML =
      '<div class="pt"><span class="n">' + meta.n + '</span><h1>' + (body.dataset.title || meta.label) + "</h1></div>" +
      '<div class="right">' +
        '<label class="search">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>' +
          '<input id="q" type="search" placeholder="Tìm phím / chức năng…  (phím /)" autocomplete="off">' +
        "</label>" +
        '<button class="theme-btn" id="themeBtn" title="Sáng/Tối">◑</button>' +
      "</div>";
  }

  // ── Theme ──
  const root = document.documentElement;
  function applyTheme(t) {
    root.setAttribute("data-theme", t);
    const b = document.getElementById("themeBtn");
    if (b) b.textContent = t === "dark" ? "◐" : "◑";
    try { localStorage.setItem("vibe-theme", t); } catch (e) {}
  }
  let saved = null;
  try { saved = localStorage.getItem("vibe-theme"); } catch (e) {}
  applyTheme(saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  const tb = document.getElementById("themeBtn");
  if (tb) tb.addEventListener("click", () => applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark"));

  // ── Search (lọc .row trong trang này) ──
  const q = document.getElementById("q");
  const noresult = document.getElementById("noresult");
  function filter() {
    if (!q) return;
    const term = q.value.trim().toLowerCase();
    let hits = 0;
    document.querySelectorAll(".doc .row").forEach((r) => {
      const hit = !term || r.textContent.toLowerCase().indexOf(term) !== -1;
      r.classList.toggle("hide", !hit);
      if (hit && term) hits++;
    });
    document.querySelectorAll(".doc .group").forEach((g) => {
      if (!g.querySelector(".row")) return;
      const vis = g.querySelectorAll(".row:not(.hide)").length;
      g.style.display = term && vis === 0 ? "none" : "";
    });
    if (noresult) noresult.classList.toggle("on", !!term && hits === 0);
  }
  if (q) q.addEventListener("input", filter);

  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && q && document.activeElement !== q) { e.preventDefault(); q.focus(); }
    if (e.key === "Escape" && q && document.activeElement === q) { q.value = ""; filter(); q.blur(); }
  });
})();
