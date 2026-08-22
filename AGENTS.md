# Dotfiles maintenance rules

When changing or repairing desktop behavior in this repository:

1. Treat files under this repository as the source of truth. Update the relevant
   dotfile, not only a generated or per-user copy under `$HOME`.
2. Apply the safe live update where possible (reload the compositor or restart
   the affected user process) and verify the active process uses the repository
   configuration.
3. Make the change reproducible on a fresh Arch installation. Update
   `restore.sh` for required packages, symlinks, permissions, and any
   deterministic post-install configuration.
4. Validate shell changes with `bash -n`; validate restore behavior with its
   relevant `--dry-run` profile. Keep existing unrelated worktree changes.
5. For Hyprland/Wayland changes, use the `hyprland` restore alias (or
   `wayland`) and keep `config/hypr`, `config/waybar`, and their startup
   dependencies consistent.
6. For Vietnamese input on Hyprland, use Fcitx5-Lotus (AUR `fcitx5-lotus`).
   Keep package list, `config/fcitx5` profile (DefaultIM=lotus), Lotus conf +
   `lotus-app-rules.conf` (Kitty → Surrounding Text), Wayland IM env vars, and
   autostart in sync; enable `fcitx5-lotus-server@$USER` for uinput modes.
   Avoid hotkeys claimed by Hyprland. Keep Chrome's Wayland IME flag in
   `config/chrome-flags.conf` and restore it to `~/.config/chrome-flags.conf`.
   Kitty must keep `wayland_enable_ime yes` so Lotus can type Vietnamese.
