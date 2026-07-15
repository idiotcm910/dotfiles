-- ============================================================
--  fzf-lua — tìm file & grep toàn repo (fuzzy finder)
--  Dùng ripgrep (rg) và fd đã cài sẵn trên máy.
-- ============================================================

return {
  "ibhagwan/fzf-lua",
  dependencies = { "nvim-tree/nvim-web-devicons" },
  cmd = "FzfLua",
  keys = {
    -- Tìm FILE
    { "<leader>ff", "<cmd>FzfLua files<CR>",              desc = "Tìm file (theo tên)" },
    { "<leader>fo", "<cmd>FzfLua oldfiles<CR>",           desc = "File mở gần đây" },
    { "<leader>fb", "<cmd>FzfLua buffers<CR>",            desc = "Chuyển buffer đang mở" },
    -- Tìm KÝ TỰ / CHUỖI trong repo
    { "<leader>fg", "<cmd>FzfLua live_grep<CR>",          desc = "Grep chuỗi toàn repo" },
    { "<leader>fw", "<cmd>FzfLua grep_cword<CR>",         desc = "Grep từ đang trỏ" },
    { "<leader>fl", "<cmd>FzfLua blines<CR>",             desc = "Tìm dòng trong file này" },
    -- Khác
    { "<leader>fh", "<cmd>FzfLua help_tags<CR>",          desc = "Tra help của nvim" },
    { "<leader>fk", "<cmd>FzfLua keymaps<CR>",            desc = "Xem mọi phím tắt" },
    { "<leader>fr", "<cmd>FzfLua resume<CR>",             desc = "Mở lại tìm kiếm trước" },
  },
  opts = {
    winopts = { height = 0.85, width = 0.85, preview = { layout = "vertical" } },
  },
}
