-- IBus Bamboo waits for Telex combinations (e.g. j, s, f). That is desirable
-- while typing, but breaks Normal mode commands in Neovim. Keep IBus English
-- outside Insert/Replace mode and switch to Bamboo only when text is entered.
local english = "xkb:us::eng"
local vietnamese = "Bamboo"
local selected

local function set_engine(engine)
  if selected == engine or vim.fn.executable("ibus") ~= 1 then
    return
  end
  selected = engine
  vim.fn.jobstart({ "ibus", "engine", engine }, { detach = true })
end

local function sync_engine()
  local mode = vim.api.nvim_get_mode().mode
  if mode:match("^[iR]") then
    set_engine(vietnamese)
  else
    set_engine(english)
  end
end

local group = vim.api.nvim_create_augroup("IbusBambooByMode", { clear = true })
vim.api.nvim_create_autocmd({ "VimEnter", "InsertEnter", "InsertLeave", "ModeChanged", "CmdlineEnter" }, {
  group = group,
  desc = "Use Bamboo only while inserting text",
  callback = sync_engine,
})
