-- ============================================================
--  Bootstrap lazy.nvim (trình quản lý plugin) rồi nạp lua/plugins/*
-- ============================================================

local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"

-- Tự tải lazy.nvim lần đầu nếu chưa có
if not (vim.uv or vim.loop).fs_stat(lazypath) then
  vim.fn.system({
    "git", "clone", "--filter=blob:none",
    "https://github.com/folke/lazy.nvim.git",
    "--branch=stable", lazypath,
  })
end
vim.opt.rtp:prepend(lazypath)

require("lazy").setup({
  spec = {
    -- Nạp mọi file trong lua/plugins/ làm plugin spec
    { import = "plugins" },
  },
  install = { colorscheme = { "habamax" } },
  checker = { enabled = false }, -- không tự động kiểm tra update (nhẹ, yên tĩnh)
  change_detection = { notify = false },
})
