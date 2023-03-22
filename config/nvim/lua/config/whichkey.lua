local M = {}

function M.setup()
  local whichkey = require "which-key"

  local conf = {
    window = {
      border = "single", -- none, single, double, shadow
      position = "bottom", -- bottom, top
    },
    key_labels = {
    -- override the label used to display some keys. It doesn't effect WK in any other way.
    -- For example:
    -- ["<space>"] = "SPC",
    -- ["<cr>"] = "RET",
     ["<tab>"] = "TAB",
  },
  }

  local opts = {
    mode = "n", -- Normal mode
    prefix = ",",
    buffer = nil, -- Global mappings. Specify a buffer number for buffer local mappings
    silent = true, -- use `silent` when creating keymaps
    noremap = true, -- use `noremap` when creating keymaps
    nowait = false, -- use `nowait` when creating keymaps
  }

  local mappings = {
    ["w"] = { "<cmd>update!<CR>", "Save" },
    ["q"] = { "<cmd>q!<CR>", "Quit" },
    
    TAB = {
        name = "tab",
        q = { "<cmd>:tabnext<CR>", "Tab next" },
        w = { "<cmd>:tabprevious<CR>", "Tab previous" },
    },

    n = {
      name = "nvim-tree",
      n = { "<cmd>NvimTreeFocus<cr>", "Open nvim tree and focus"},
      N = { "<cmd>NvimTreeToggle<cr>", "Toggle nvim tree"},
    },

    z = {
      name = "Packer",
      c = { "<cmd>PackerCompile<cr>", "Compile" },
      i = { "<cmd>PackerInstall<cr>", "Install" },
      s = { "<cmd>PackerSync<cr>", "Sync" },
      S = { "<cmd>PackerStatus<cr>", "Status" },
      u = { "<cmd>PackerUpdate<cr>", "Update" },
    },

    h = {
        name = "Hop",
        l = { "<cmd>HopLineStart<CR>", "Go to any line start" },
        w = { "<cmd>HopWord<CR>", "Go to any word in current buffer" },
    },

    g = {
      name = "Git",
      s = { "<cmd>Neogit<CR>", "Status" },
    },

    f = {
      name = "Find",
      f = { "<cmd>lua require('fzf-lua').files()<cr>", "Files" },
      b = { "<cmd>FzfLua buffers<cr>", "Buffers" },
      o = { "<cmd>FzfLua oldfiles<cr>", "Old files" },
      g = { "<cmd>FzfLua live_grep<cr>", "Live grep" },
      c = { "<cmd>FzfLua commands<cr>", "Commands" },
    },
  }

  whichkey.setup(conf)
  whichkey.register(mappings, opts)
end

return M
