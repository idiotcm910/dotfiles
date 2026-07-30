-- ============================================================
--  Cài đặt cơ bản của editor (vim.opt) + phím leader
-- ============================================================

-- Leader phải set TRƯỚC khi lazy.nvim / plugin nạp phím
vim.g.mapleader = " "       -- phím leader = Space
vim.g.maplocalleader = " "

local opt = vim.opt

-- Số dòng
opt.number = true           -- hiện số dòng
opt.relativenumber = true   -- số dòng tương đối (dễ nhảy 5j, 12k...)
opt.cursorline = true       -- tô sáng dòng đang đứng
opt.scrolloff = 8           -- luôn chừa 8 dòng trên/dưới con trỏ
opt.signcolumn = "yes"      -- luôn hiện cột dấu (LSP/diagnostic) — khỏi giật layout

-- Tìm kiếm
opt.ignorecase = true       -- tìm không phân biệt hoa thường
opt.smartcase = true        -- ...trừ khi gõ có chữ hoa thì phân biệt lại
opt.hlsearch = true         -- tô sáng mọi kết quả tìm
opt.incsearch = true        -- nhảy dần tới kết quả khi đang gõ

-- Thụt lề / tab
opt.expandtab = true        -- tab = space
opt.tabstop = 2
opt.shiftwidth = 2
opt.smartindent = true

-- Giao diện
opt.termguicolors = true    -- màu 24-bit (highlight đẹp)
opt.wrap = false            -- không xuống dòng mềm (đọc code dài dễ hơn)
opt.splitright = true       -- cửa sổ mới mở sang phải
opt.splitbelow = true       -- ...và xuống dưới

-- Hành vi
opt.clipboard = "unnamedplus" -- yy/p dùng chung clipboard hệ thống
opt.mouse = "a"             -- bật chuột (cuộn/click khi cần)
opt.undofile = true         -- lưu undo qua nhiều phiên
opt.swapfile = false        -- tắt file swap phiền phức
opt.timeoutlen = 400        -- thời gian chờ chuỗi phím (which-key hiện popup)

-- Đọc code nhanh: bỏ delay khi bấm Esc
opt.updatetime = 250
