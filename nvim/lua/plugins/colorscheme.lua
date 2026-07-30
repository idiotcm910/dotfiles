-- ============================================================
--  Colorscheme — tokyonight (tương phản tốt, dễ đọc code lâu)
--  Đổi "night" thành "storm" / "moon" / "day" nếu muốn sáng hơn.
-- ============================================================

return {
  "folke/tokyonight.nvim",
  lazy = false,    -- nạp ngay khi mở (là giao diện nền)
  priority = 1000, -- nạp TRƯỚC mọi plugin khác
  config = function()
    require("tokyonight").setup({
      style = "night",
      transparent = true, -- nền editor trong suốt (nhìn xuyên xuống terminal/wallpaper)
      styles = {
        sidebars = "transparent", -- nvim-tree, panel bên cũng trong suốt
        floats = "transparent",   -- cửa sổ nổi (which-key, hover, fzf...) trong suốt
      },
    })
    vim.cmd.colorscheme("tokyonight")

    -- Đảm bảo trong suốt cả những nhóm tokyonight chưa phủ (giữ khi đổi theme)
    local grp = vim.api.nvim_create_augroup("Transparent", { clear = true })
    vim.api.nvim_create_autocmd("ColorScheme", {
      group = grp,
      callback = function()
        for _, h in ipairs({ "Normal", "NormalNC", "NormalFloat", "SignColumn", "EndOfBuffer" }) do
          vim.api.nvim_set_hl(0, h, { bg = "none" })
        end
      end,
    })
  end,
}
