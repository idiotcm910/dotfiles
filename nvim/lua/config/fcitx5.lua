-- Bamboo keeps Telex combinations (for example j, s and f) for Vietnamese
-- composition. That is desirable while typing, but breaks Normal mode
-- commands. Use Fcitx5's English keyboard outside Insert/Replace mode and
-- Bamboo while text is entered.
local remote = "fcitx5-remote"

if vim.fn.executable(remote) ~= 1 then
  return
end

local function call(...)
  vim.fn.system({ remote, ... })
  return vim.v.shell_error == 0
end

local function output(...)
  return vim.trim(vim.fn.system({ remote, ... }))
end

-- Fcitx input state is shared by the desktop. Remember the state from the
-- application that had focus before Neovim, then restore it whenever Neovim
-- loses focus. This is refreshed on every focus cycle, not only at startup.
local outside_method = output("-n")
local outside_state = tonumber(output())
local managing_input = false

local function select(method)
  -- Do not cache this value: the global Fcitx hotkey can change it behind
  -- Neovim's back while another application has focus.
  if output("-n") ~= method then
    call("-s", method)
  end
end

local function sync_input_method()
  if not managing_input then
    return
  end

  local mode = vim.api.nvim_get_mode().mode
  if mode:match("^[iR]") then
    select("bamboo")
    call("-o")
  else
    select("keyboard-us")
  end
end

local function take_input_control()
  if not managing_input then
    outside_method = output("-n")
    outside_state = tonumber(output())
    managing_input = true
  end

  sync_input_method()
end

local function release_input_control()
  if not managing_input then
    return
  end

  if outside_method ~= "" then
    call("-s", outside_method)
  end

  if outside_state == 2 then
    call("-o")
  elseif outside_state ~= nil then
    call("-c")
  end

  managing_input = false
end

local group = vim.api.nvim_create_augroup("Fcitx5BambooByMode", { clear = true })
vim.api.nvim_create_autocmd({ "VimEnter", "FocusGained" }, {
  group = group,
  desc = "Take control of Fcitx5 while Neovim is focused",
  callback = take_input_control,
})
vim.api.nvim_create_autocmd({ "InsertEnter", "InsertLeave", "ModeChanged", "CmdlineEnter" }, {
  group = group,
  desc = "Use Fcitx5-Bamboo only while inserting text",
  callback = sync_input_method,
})
vim.api.nvim_create_autocmd({ "FocusLost", "VimLeavePre" }, {
  group = group,
  desc = "Restore Fcitx5 when Neovim loses focus",
  callback = release_input_control,
})
