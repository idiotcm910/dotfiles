-- ============================================================
--  Neovim — IDE nhẹ để ĐỌC code
--  Điểm vào: chỉ nạp các module theo thứ tự.
--  Xem README.md để biết toàn bộ phím tắt.
-- ============================================================

require("config.options") -- cài đặt cơ bản + set leader (phải nạp TRƯỚC lazy)
require("config.keymaps") -- phím tắt tự định nghĩa (không thuộc plugin nào)
require("config.fcitx5")  -- English khi command, Fcitx5-Bamboo khi chèn văn bản
require("config.lazy")    -- bootstrap lazy.nvim rồi nạp toàn bộ lua/plugins/*
