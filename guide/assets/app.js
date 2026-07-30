/* ============================================================
   Vibe Workspace · Guide — script dùng chung
   MỞ RỘNG: thêm một trang mới = tạo file .html (copy _template.html)
   rồi thêm 1 dòng vào mảng PAGES bên dưới. Xong.
   ============================================================ */
function calculateProgress(state, taskIds) {
  const total = taskIds.length;
  const completed = taskIds.reduce(
    (count, taskId) => count + (state[taskId] === true ? 1 : 0),
    0
  );
  return {
    completed,
    total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

function readChecklist(storage, key) {
  try {
    const parsed = JSON.parse(storage.getItem(key) || "{}");
    return Object.fromEntries(
      Object.entries(parsed).filter((entry) => typeof entry[1] === "boolean")
    );
  } catch (error) {
    return {};
  }
}

function writeChecklist(storage, key, state) {
  try {
    storage.setItem(key, JSON.stringify(state));
    return true;
  } catch (error) {
    return false;
  }
}

const PAGES = [
  { page: "index",           file: "index.html",           n: "00", label: "Tổng quan" },
  { page: "hanh-trinh",      file: "hanh-trinh.html",      n: "01", label: "Hành trình" },
  { page: "tmux",            file: "tmux.html",            n: "02", label: "tmux" },
  { page: "workspace",       file: "workspace.html",       n: "03", label: "Workspace" },
  { page: "nvim-motion",     file: "nvim-motion.html",     n: "04", label: "Nvim · Di chuyển" },
  { page: "nvim-search",     file: "nvim-search.html",     n: "05", label: "Nvim · Tìm & Duyệt" },
  { page: "nvim-lsp-claude", file: "nvim-lsp-claude.html", n: "06", label: "Nvim · LSP & Claude" },
  { page: "setup",           file: "setup.html",           n: "07", label: "Cài đặt" },
  { page: "arch-install",    file: "arch-install.html",    n: "08", label: "Cài Arch mới" },
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { calculateProgress, readChecklist, writeChecklist };
}

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
    const searchPlaceholder = current === "arch-install"
      ? "Tìm bước / lệnh…  (phím /)"
      : "Tìm phím / chức năng…  (phím /)";
    topbar.innerHTML =
      '<div class="pt"><span class="n">' + meta.n + '</span><h1>' + (body.dataset.title || meta.label) + "</h1></div>" +
      '<div class="right">' +
        '<label class="search">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>' +
          '<input id="q" type="search" placeholder="' + searchPlaceholder + '" autocomplete="off">' +
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
    const targetSelector = current === "arch-install"
      ? ".doc .install-step"
      : ".doc .row";
    let hits = 0;
    document.querySelectorAll(targetSelector).forEach((r) => {
      const hit = !term || r.textContent.toLowerCase().indexOf(term) !== -1;
      r.classList.toggle("hide", !hit);
      if (hit && term) hits++;
    });
    if (current !== "arch-install") {
      document.querySelectorAll(".doc .group").forEach((g) => {
        if (!g.querySelector(".row")) return;
        const vis = g.querySelectorAll(".row:not(.hide)").length;
        g.style.display = term && vis === 0 ? "none" : "";
      });
    }
    if (noresult) noresult.classList.toggle("on", !!term && hits === 0);
  }
  if (q) q.addEventListener("input", filter);

  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && q && document.activeElement !== q) { e.preventDefault(); q.focus(); }
    if (e.key === "Escape" && q && document.activeElement === q) { q.value = ""; filter(); q.blur(); }
  });

  // ── Arch install checklist ──
  const checklistRoot = typeof document.querySelector === "function"
    ? document.querySelector("[data-checklist]")
    : null;
  if (!checklistRoot) return;

  const storageKey = checklistRoot.dataset.storageKey || "vibe-guide:checklist";
  const taskInputs = Array.from(checklistRoot.querySelectorAll(".task-check[data-task]"));
  const taskIds = taskInputs.map((input) => input.dataset.task);
  const progress = document.getElementById("installProgress");
  const progressText = document.getElementById("progressText");
  const progressStatus = document.getElementById("progressStatus");
  const resetButton = document.getElementById("resetChecklist");
  const copyStatus = document.getElementById("copyStatus");
  let state = readChecklist(localStorage, storageKey);
  let announceTimer = null;

  function updateGates() {
    taskInputs.forEach((input) => {
      const requirement = input.dataset.requires;
      if (!requirement) return;
      const unlocked = state[requirement] === true;
      input.disabled = !unlocked;
      input.closest(".task").classList.toggle("is-locked", !unlocked);
      if (!unlocked && input.checked) {
        input.checked = false;
        state[input.dataset.task] = false;
      }
      const lockCopy = input.closest(".task").querySelector(".lock-copy");
      if (lockCopy) {
        lockCopy.textContent = unlocked
          ? "Backup đã xác nhận — hãy đối chiếu ổ lần cuối trước khi wipe."
          : "Bị khóa cho tới khi hoàn tất xác nhận backup ở chặng 02.";
      }
    });
  }

  function renderChecklist(message) {
    taskInputs.forEach((input) => {
      input.checked = state[input.dataset.task] === true;
      input.closest(".task").classList.toggle("is-complete", input.checked);
    });
    updateGates();

    checklistRoot.querySelectorAll(".install-step").forEach((stage) => {
      const stageTasks = Array.from(stage.querySelectorAll(".task-check"));
      const complete = stageTasks.length > 0 && stageTasks.every((input) => input.checked);
      stage.classList.toggle("is-complete", complete);
    });

    const summary = calculateProgress(state, taskIds);
    if (progress) {
      progress.value = summary.percent;
      progress.textContent = summary.percent + "%";
    }
    if (progressText) {
      progressText.textContent = summary.completed + " / " + summary.total + " nhiệm vụ";
    }
    if (progressStatus) {
      progressStatus.textContent = message || (
        summary.percent === 100
          ? "Checklist hoàn tất — giữ bản backup thêm vài ngày."
          : "Tiến độ được lưu trên trình duyệt này."
      );
    }
  }

  taskInputs.forEach((input) => {
    input.addEventListener("change", () => {
      state[input.dataset.task] = input.checked;
      updateGates();
      writeChecklist(localStorage, storageKey, state);
      renderChecklist("Đã lưu tiến độ.");
    });
  });

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      if (!window.confirm("Xóa toàn bộ tiến độ checklist cài Arch trên trình duyệt này?")) return;
      state = {};
      try { localStorage.removeItem(storageKey); } catch (error) {}
      renderChecklist("Đã đưa checklist về trạng thái ban đầu.");
    });
  }

  function fallbackCopy(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
  }

  function announceCopy(message) {
    if (!copyStatus) return;
    copyStatus.textContent = message;
    copyStatus.classList.add("on");
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => copyStatus.classList.remove("on"), 1800);
  }

  checklistRoot.querySelectorAll(".copy-btn[data-copy-target]").forEach((button) => {
    button.addEventListener("click", async () => {
      const source = document.getElementById(button.dataset.copyTarget);
      if (!source) return;
      const text = source.textContent.replace(/^\n+|\n+$/g, "");
      let copied = false;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          copied = true;
        } else {
          copied = fallbackCopy(text);
        }
      } catch (error) {
        copied = fallbackCopy(text);
      }

      button.classList.toggle("is-copied", copied);
      button.textContent = copied ? "Đã chép" : "Copy lỗi";
      announceCopy(copied ? "Đã chép lệnh vào clipboard." : "Không thể copy — hãy bôi đen lệnh thủ công.");
      setTimeout(() => {
        button.classList.remove("is-copied");
        button.textContent = "Sao chép";
      }, 1600);
    });
  });

  renderChecklist();
})();
