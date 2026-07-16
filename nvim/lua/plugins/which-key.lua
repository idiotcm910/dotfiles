-- ============================================================
--  which-key — bấm <leader> (hoặc g, s...) rồi khựng lại,
--  nó hiện popup nhắc mọi phím tiếp theo + ý nghĩa.
--  Không cần học thuộc, cứ bấm là được nhắc.
-- ============================================================

return {
  "folke/which-key.nvim",
  event = "VeryLazy",
  opts = {
    preset = "helix", -- popup gọn, hiện bên phải
    -- Đặt tên cho các nhóm phím leader (hiện đẹp trong popup)
    spec = {
      { "<leader>f", group = "Find: tìm file / grep" },
      { "<leader>b", group = "Buffer / tab" },
      { "<leader>d", group = "Diagnostic / symbol" },
      { "<leader>r", group = "Rename" },
      { "<leader>l", group = "LSP" },
      { "<leader>c", group = "Claude" },
      { "<leader>a", group = "AI / Claude Code" },
    },
  },
  keys = {
    {
      "<leader>?",
      function() require("which-key").show({ global = false }) end,
      desc = "Hiện phím tắt của buffer này",
    },
  },
}
