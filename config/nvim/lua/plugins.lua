
return require('packer').startup(function(use)
	use 'wbthomason/packer.nvim'
	use {
	    'nvim-tree/nvim-tree.lua',
	    requires = {
		    'nvim-tree/nvim-web-devicons',
	    },
	    tag = 'nightly'
	}
    use "windwp/windline.nvim"
    -- motion
    use "unblevable/quick-scope"
    use {
      'phaazon/hop.nvim',
      branch = 'v2', -- optional but strongly recommended
      config = function()
        -- you can configure Hop the way you like here; see :h hop-config
        require'hop'.setup { keys = 'etovxqpdygfblzhckisuran' }
      end
    }
    --
  -- colorscheme
  use "olimorris/onedarkpro.nvim"
  use 'folke/tokyonight.nvim'
  use 'morhetz/gruvbox'
  use 'Mofiqul/dracula.nvim'
  use {
    "mcchrish/zenbones.nvim",
    requires = "rktjmp/lush.nvim"
}
  use "navarasu/onedark.nvim"
  use "cpea2506/one_monokai.nvim"
  ----
  use {'akinsho/bufferline.nvim', tag = "v3.*", requires = 'nvim-tree/nvim-web-devicons'}
  use {
    "folke/which-key.nvim",
    config = function()
      require("config.whichkey").setup()
    end,
  }
  use { "junegunn/fzf", run = "./install --all" }
  use { "junegunn/fzf.vim" }
  use {
  "ibhagwan/fzf-lua",
  requires = { "kyazdani42/nvim-web-devicons" },
  }
  use {
	  "windwp/nvim-autopairs",
	  wants = "nvim-treesitter",
	  module = { "nvim-autopairs.completion.cmp", "nvim-autopairs" },
	  config = function()
	    require("config.autopairs").setup()
	  end,
  }
  use {
  "hrsh7th/nvim-cmp",
  event = "InsertEnter",
  opt = true,
  config = function()
    require("config.cmp").setup()
  end,
  wants = { "LuaSnip" },
  requires = {
    "hrsh7th/cmp-buffer",
    "hrsh7th/cmp-path",
    "hrsh7th/cmp-nvim-lua",
    "ray-x/cmp-treesitter",
    "hrsh7th/cmp-cmdline",
    {"hrsh7th/cmp-nvim-lsp", module = { "cmp_nvim_lsp" } },
    "saadparwaiz1/cmp_luasnip",
    "hrsh7th/cmp-calc",
    "f3fora/cmp-spell",
    "hrsh7th/cmp-emoji",
    {
      "L3MON4D3/LuaSnip",
      wants = "friendly-snippets",
      config = function() require("config.luasnip").setup()
      end,
    },
    "rafamadriz/friendly-snippets",
    disable = false,
  },
  use {
        'nvim-treesitter/nvim-treesitter',
        run = function()
            local ts_update = require('nvim-treesitter.install').update({ with_sync = true })
            ts_update()
        end,
  },

  -- gitdiff-merge
  use { 'sindrets/diffview.nvim', requires = 'nvim-lua/plenary.nvim' },

  -- LSP 
  use {
    "neovim/nvim-lspconfig",
    opt = true,
    event = "BufReadPre",
    wants = { "cmp-nvim-lsp", "nvim-lsp-installer", "lsp_signature.nvim" },
    config = function()
      require("config.lsp").setup()
    end,
    requires = {
      "williamboman/nvim-lsp-installer",
      "ray-x/lsp_signature.nvim",
    },
  },

  -- Notification
    use {
      "rcarriga/nvim-notify",
      event = "VimEnter",
      config = function()
        vim.notify = require "notify"
      end,
    },
    -- tabl line
  use {
  'noib3/nvim-cokeline',
    requires = 'kyazdani42/nvim-web-devicons', -- If you want devicons
    config = function()
      require('config.cokeline').setup()
    end
  },
  -- Go
    use {
      "ray-x/go.nvim",
      ft = { "go" },
      config = function()
        require("go").setup()
      end,
    }
}
end)
