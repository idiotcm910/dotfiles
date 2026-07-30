-- ============================================================
--  nvim-tree — cây thư mục bên trái (kiểu VS Code)
--  <leader>e  bật/tắt cây · <leader>o  focus vào cây
-- ============================================================

return {
  "nvim-tree/nvim-tree.lua",
  dependencies = { "nvim-tree/nvim-web-devicons" },
  cmd = { "NvimTreeToggle", "NvimTreeFocus" },
  keys = {
    { "<leader>e", "<cmd>NvimTreeToggle<CR>", desc = "Bật/tắt cây thư mục" },
    { "<leader>o", "<cmd>NvimTreeFocus<CR>",  desc = "Nhảy vào cây thư mục" },
  },
  init = function()
    -- Tắt netrw để nvim-tree quản lý
    vim.g.loaded_netrw = 1
    vim.g.loaded_netrwPlugin = 1

    -- Tự đóng cây khi nó là cửa sổ CUỐI cùng (khỏi :q! hai lần)
    vim.api.nvim_create_autocmd("QuitPre", {
      callback = function()
        local tree_wins, total = {}, 0
        for _, w in ipairs(vim.api.nvim_list_wins()) do
          -- bỏ qua cửa sổ nổi (popup)
          if vim.api.nvim_win_get_config(w).relative == "" then
            total = total + 1
            local bufname = vim.api.nvim_buf_get_name(vim.api.nvim_win_get_buf(w))
            if bufname:match("NvimTree_") then
              table.insert(tree_wins, w)
            end
          end
        end
        -- Nếu chỉ còn 1 cửa sổ code + cây → đóng luôn cây
        if total - #tree_wins == 1 then
          for _, w in ipairs(tree_wins) do
            pcall(vim.api.nvim_win_close, w, true)
          end
        end
      end,
    })
  end,
  opts = {
    view = { width = 34 },
    renderer = { group_empty = true },
    filters = {
      dotfiles = false,                    -- vẫn hiện file bắt đầu bằng . (.gitignore...)
      git_ignored = true,                  -- ẩn file trong .gitignore (node_modules, dist, .next...)
      exclude = { ".env", ".env.local" },  -- ...NHƯNG luôn hiện các file .env này
    },
    actions = { open_file = { quit_on_open = false } },
    update_focused_file = { enable = true }, -- tự highlight file đang mở trong cây
    hijack_directories = { enable = false }, -- KHÔNG chiếm thư mục — để dashboard hiện khi `nvim .`
  },
}

-- Phím trong cây (bấm g? khi đang ở cây để xem đầy đủ):
--   Enter / o : mở file        |  a : tạo mới     |  d : xoá
--   Tab       : xem trước       |  R : nạp lại cây  |  H : ẩn/hiện file ẩn
--   >         : mở thư mục con   |  < : đóng
