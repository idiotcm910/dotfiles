-- snacks.nvim — QoL library, dependency cho claude-multi & claudecode
return {
  "folke/snacks.nvim",
  priority = 900,
  lazy = false,
  opts = {
    -- Xem ảnh ngay trong nvim (Kitty graphics protocol)
    image = {
      enabled = true,
      doc = {
        -- Tự render ảnh inline khi mở markdown/html
        inline = true,
        -- Hiện thêm ở cửa sổ float khi con trỏ vào link ảnh
        float = true,
        max_width = 80,
        max_height = 40,
      },
    },
  },
}
