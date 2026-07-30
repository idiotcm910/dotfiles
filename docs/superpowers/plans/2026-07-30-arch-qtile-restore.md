# Arch Qtile Restore Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy restore script with a safe, repeatable Arch Linux bootstrap for Qtile/Polybar, the current Neovim/tmux workflow, Google Chrome, Codex, Claude Code, and portable AI configuration.

**Architecture:** Keep `restore.sh` as the single user-facing entry point and organize its behavior into small Bash functions. Exercise the script through a shell test suite using a temporary HOME and dry-run mode, so package installation and filesystem behavior can be verified without changing the development machine.

**Tech Stack:** Bash, pacman, AUR/makepkg, Git, curl, npm, shellcheck.

## Global Constraints

- Target Arch Linux and pacman only.
- Desktop stack is Qtile + Polybar; do not install Hyprland, Sway, or Plasma.
- Re-running restore must not duplicate shell configuration or destroy existing user configuration.
- Never copy Codex or Claude credentials, sessions, histories, caches, or runtime databases from the repository.
- Do not run `makepkg` or global npm installation with sudo.

---

### Task 1: Restore command contract and Arch package set

**Files:**
- Create: `tests/restore.test.sh`
- Modify: `restore.sh`

**Interfaces:**
- Consumes: command-line arguments `--dry-run`, `--only`, `--skip-aur`, and `--help`
- Produces: validated restore mode and an Arch package transaction containing desktop and developer dependencies

- [x] Write tests that assert dry-run package output, reject unknown options, and exclude Hyprland/Sway/Plasma.
- [x] Run `bash tests/restore.test.sh` and verify the tests fail against the legacy script.
- [x] Implement argument parsing, Arch detection, logging, dry-run command execution, and grouped pacman packages.
- [x] Run `bash tests/restore.test.sh` and verify the command-contract tests pass.

### Task 2: Safe configuration restore

**Files:**
- Modify: `tests/restore.test.sh`
- Modify: `restore.sh`

**Interfaces:**
- Consumes: repository paths plus `$HOME`
- Produces: managed symlinks, timestamped backups, executable workflow scripts, and marker-delimited `.bashrc` configuration

- [x] Add tests using a temporary HOME for symlink creation, backup behavior, and idempotent `.bashrc` blocks.
- [x] Run the tests and verify they fail because safe restore helpers do not exist.
- [x] Implement backup, symlink, managed-copy, PATH, zoxide, and auto-tmux helpers.
- [x] Run the tests and verify all configuration tests pass.

### Task 3: Chrome and AI tooling

**Files:**
- Modify: `tests/restore.test.sh`
- Modify: `restore.sh`

**Interfaces:**
- Consumes: existing `paru`/`yay`, otherwise the official AUR Git repository; official Codex installer; npm user prefix for Claude Code
- Produces: Google Chrome, `codex`, `claude`, and selectively restored `.codex`/`.claude` files

- [x] Add dry-run tests for Chrome, Codex, Claude, and portable AI config destinations.
- [x] Run the tests and verify the new assertions fail.
- [x] Implement AUR fallback without root builds, official Codex installation, user-scoped Claude npm installation, and selective config copy.
- [x] Run the test suite and verify it passes.

### Task 4: Current Neovim/tmux/sesh workflow and desktop paths

**Files:**
- Modify: `tests/restore.test.sh`
- Modify: `restore.sh`
- Modify: `.xinitrc`
- Modify: `config/qtile/autostart.sh`
- Modify: `README.md`

**Interfaces:**
- Consumes: current `nvim/`, `tmux/`, `sesh/`, `bin/`, `config/qtile/`, and `config/polybar/`
- Produces: working Arch symlinks, TPM, sesh, wallpaper startup, and documented restore commands

- [x] Add assertions for all workflow symlinks and for removal of legacy absolute paths.
- [x] Run tests and verify the assertions fail.
- [x] Implement workflow setup, fix repository-relative desktop paths, and document usage.
- [x] Run restore tests, existing tmux tests, `bash -n`, and shellcheck.

### Task 5: Final verification

**Files:**
- Verify all modified files

**Interfaces:**
- Consumes: complete implementation
- Produces: evidence that the restore is safe to preview and the existing workflow remains intact

- [x] Run `bash tests/restore.test.sh`.
- [x] Run `bash tests/tmux-grid.test.sh`.
- [x] Run `bash -n restore.sh tests/restore.test.sh config/qtile/autostart.sh .xinitrc`.
- [x] Run `shellcheck restore.sh tests/restore.test.sh config/qtile/autostart.sh .xinitrc` when shellcheck is available.
- [x] Run `bash restore.sh --dry-run` and review the complete command plan.
- [x] Review `git diff --check`, `git diff --stat`, and the final diff.
