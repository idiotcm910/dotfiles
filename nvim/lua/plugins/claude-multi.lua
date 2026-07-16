-- claude-multi.nvim — quản nhiều Claude Code TRONG nvim (tab + winbar)
return {
  "mb6611/claude-multi.nvim",
  dependencies = { "folke/snacks.nvim" },
  event = "VeryLazy",
  opts = {
    layout = "float", -- 'float' (nổi giữa) hoặc 'sidebar' (cột phải)
  },
  keys = {
    { "<leader>c",  nil,                       desc = "Claude (multi)" },
    { "<leader>cc", "<cmd>ClaudeToggle<cr>",   desc = "Claude: bật/tắt" },
    { "<leader>cn", "<cmd>ClaudeNew<cr>",      desc = "Claude: phiên mới" },
    { "<leader>cw", "<cmd>ClaudeNewWorktree<cr>", desc = "Claude: phiên worktree mới" },
    { "<leader>ch", "<cmd>ClaudePrev<cr>",     desc = "Claude: phiên trước" },
    { "<leader>cl", "<cmd>ClaudeNext<cr>",     desc = "Claude: phiên sau" },
    { "<leader>cr", "<cmd>ClaudeRecall<cr>",   desc = "Claude: recall hội thoại" },
    { "<leader>cx", "<cmd>ClaudeClose<cr>",    desc = "Claude: đóng phiên" },
  },
}
