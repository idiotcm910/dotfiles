-- claudecode.nvim — tích hợp IDE cho Claude Code (gửi selection, diff)
return {
  "coder/claudecode.nvim",
  dependencies = { "folke/snacks.nvim" },
  config = true,
  cmd = {
    "ClaudeCode", "ClaudeCodeFocus", "ClaudeCodeSelectModel",
    "ClaudeCodeAdd", "ClaudeCodeSend", "ClaudeCodeTreeAdd",
    "ClaudeCodeDiffAccept", "ClaudeCodeDiffDeny",
  },
  keys = {
    { "<leader>a",  nil,                              desc = "AI / Claude Code" },
    { "<leader>ac", "<cmd>ClaudeCode<cr>",            desc = "Claude: toggle IDE" },
    { "<leader>af", "<cmd>ClaudeCodeFocus<cr>",       desc = "Claude: focus" },
    { "<leader>am", "<cmd>ClaudeCodeSelectModel<cr>", desc = "Claude: chọn model" },
    { "<leader>ab", "<cmd>ClaudeCodeAdd %<cr>",       desc = "Claude: thêm buffer làm ngữ cảnh" },
    { "<leader>as", "<cmd>ClaudeCodeSend<cr>", mode = "v", desc = "Claude: gửi selection" },
    { "<leader>aa", "<cmd>ClaudeCodeDiffAccept<cr>",  desc = "Claude: nhận diff" },
    { "<leader>ad", "<cmd>ClaudeCodeDiffDeny<cr>",    desc = "Claude: từ chối diff" },
  },
}
